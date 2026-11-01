/**
 * Criar, editar e excluir lançamento (React Hook Form + Zod). Entrada ×
 * saída em destaque (muda as categorias e a palavra "recebido"/"pago"), o
 * valor, as categorias mais usadas no mês em chips (contagem do servidor)
 * com as outras numa lista com busca, forma de pagamento e a taxa da
 * maquininha em R$ ou %, com o líquido calculado. Erro 422 volta ao campo.
 *
 * Seções do corpo, na ordem: tipo, valor, categoria, paciente e atendimento
 * (`TransactionPatientField`, só na entrada), data e situação, repetir
 * (`TransactionRepeatField`: não repete, parcelado ou recorrente; só no
 * lançamento novo), forma de pagamento com a taxa, observações e
 * comprovantes (`TransactionAttachments` na edição; no novo, só o aviso de
 * que entram depois de salvar). Editar ou excluir um lançamento de série
 * (parcela ou recorrência) pergunta o alcance no `SeriesScopeDialog`.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import {
    doneStatus,
    feeInReais,
    feeOfValues,
    formFieldOfApiError,
    netOf,
    parsePercent,
    showsFee,
    switchFeeMode,
    toTransactionWriteDto,
    transactionFormDefaults,
    transactionFormSchema,
    type FeeMode,
    type TransactionFormValues,
} from '@/application/clinic/finance-transaction-form';
import { useFinanceTopCategories } from '@/application/clinic/use-finance-top-categories';
import {
    useCreateFinanceTransaction,
    useDeleteFinanceTransaction,
    useUpdateFinanceTransaction,
} from '@/application/clinic/use-finance-transactions';
import { getValidationErrors } from '@/application/clinic/validation-errors';
import {
    DsButton,
    dsCn,
    DsDatepicker,
    DsFieldSelect,
    DsInput,
    DsModal,
    DsMoneyInput,
    DsTextarea,
} from '@/components/ds';
import {
    PAYMENT_METHOD_LABELS,
    type FinanceTransactionWriteDto,
    type FinancialCategory,
    type FinancialTransaction,
    type FinancialTransactionType,
    type PaymentMethod,
    type SeriesScope,
} from '@/domain/clinic/finance';

import { money } from './finance-format';
import { SeriesScopeDialog } from './SeriesScopeDialog';
import {
    TransactionAttachments,
    TransactionAttachmentsHint,
} from './TransactionAttachments';
import { TransactionPatientField } from './TransactionPatientField';
import { TransactionRepeatField } from './TransactionRepeatField';

export interface Draft {
    type: FinancialTransactionType;
    editing?: FinancialTransaction;
}

type Form = UseFormReturn<TransactionFormValues>;

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

const chip = (selected: boolean) =>
    dsCn(
        'cursor-pointer rounded-ds-pill border px-3 py-1.5 text-ds-caption transition-colors',
        selected
            ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-60'
            : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-brand-subtle',
    );

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <span
            role="alert"
            className="text-ds-caption text-ds-status-danger-content"
        >
            {message}
        </span>
    );
}

export function TransactionModal({
    draft,
    period,
    onClose,
}: {
    draft: Draft;
    /** Mês na tela ("2026-10"), de onde vêm as categorias mais usadas. */
    period: string;
    onClose: () => void;
}) {
    const editing = draft.editing;
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: transactionFormDefaults(draft.type, editing),
        mode: 'onTouched',
    });
    const create = useCreateFinanceTransaction();
    const update = useUpdateFinanceTransaction();
    const remove = useDeleteFinanceTransaction();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    // Parcela: salvar pergunta "Só esta / Esta e as próximas" antes do PUT.
    const [askingScope, setAskingScope] = useState<{
        dto: FinanceTransactionWriteDto;
        feeMode: FeeMode;
    } | null>(null);

    const submitting = form.formState.isSubmitting;
    const formType = form.watch('type');

    const persist = async (
        dto: FinanceTransactionWriteDto,
        feeMode: FeeMode,
        scope?: SeriesScope,
    ) => {
        try {
            if (editing)
                await update.mutateAsync({ id: editing.id, dto, scope });
            else await create.mutateAsync(dto);
            onClose();
        } catch (error) {
            showServerErrors(form, error, feeMode);
        }
    };

    const save = form.handleSubmit(async (values) => {
        const dto = toTransactionWriteDto(values);
        if (editing?.series) {
            setAskingScope({ dto, feeMode: values.feeMode });
            return;
        }
        await persist(dto, values.feeMode);
    });

    const saveWithScope = async (scope: SeriesScope) => {
        if (!askingScope) return;
        await persist(askingScope.dto, askingScope.feeMode, scope);
        setAskingScope(null);
    };

    const confirmDelete = async (scope?: SeriesScope) => {
        if (!editing) return;
        try {
            await remove.mutateAsync(
                scope
                    ? { id: editing.id, scope, kind: editing.series?.kind }
                    : editing.id,
            );
            onClose();
        } catch {
            toast.error('Não foi possível excluir. Tente de novo.');
        }
    };

    return (
        <>
            <DsModal
                open
                onOpenChange={(o) => !o && !submitting && onClose()}
                size="md"
                title={editing ? 'Editar lançamento' : 'Novo lançamento'}
                footer={
                    <div className="flex w-full items-center gap-3">
                        {editing && (
                            <DsButton
                                variant="destructive-tertiary"
                                iconPosition="left"
                                icon={<Trash2 />}
                                label="Excluir"
                                disabled={submitting}
                                onClick={() => setConfirmingDelete(true)}
                            />
                        )}
                        <div className="ml-auto flex gap-3">
                            <DsButton
                                variant="secondary"
                                label="Cancelar"
                                disabled={submitting}
                                onClick={onClose}
                            />
                            <DsButton
                                label={editing ? 'Salvar' : 'Lançar'}
                                loading={submitting}
                                onClick={() => void save()}
                            />
                        </div>
                    </div>
                }
            >
                <form
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        void save();
                    }}
                    className="flex flex-col gap-5"
                >
                    <TypeSection form={form} />
                    <AmountSection form={form} />
                    <CategorySection
                        form={form}
                        period={period}
                        editingCategory={editing?.category}
                    />
                    {/* 013: paciente e atendimento, só na entrada. */}
                    {formType === 'entrada' && (
                        <TransactionPatientField
                            form={form}
                            savedAppointment={editing?.appointment}
                        />
                    )}
                    <DateStatusSection form={form} />
                    {/* Repetir só no lançamento novo: a repetição não muda na edição. */}
                    {!editing && <TransactionRepeatField form={form} />}
                    <PaymentSection form={form} />
                    <NotesSection form={form} />
                    {editing ? (
                        <TransactionAttachments transactionId={editing.id} />
                    ) : (
                        <TransactionAttachmentsHint />
                    )}
                </form>
            </DsModal>

            {editing?.series && (
                <>
                    <SeriesScopeDialog
                        series={editing.series}
                        action="update"
                        open={askingScope !== null}
                        pending={update.isPending}
                        onChoose={(scope) => void saveWithScope(scope)}
                        onCancel={() => setAskingScope(null)}
                    />
                    <SeriesScopeDialog
                        series={editing.series}
                        action="delete"
                        open={confirmingDelete}
                        pending={remove.isPending}
                        onChoose={(scope) => void confirmDelete(scope)}
                        onCancel={() => setConfirmingDelete(false)}
                    />
                </>
            )}

            {editing && !editing.series && (
                <DsModal
                    open={confirmingDelete}
                    onOpenChange={(o) => {
                        if (!o && !remove.isPending) setConfirmingDelete(false);
                    }}
                    size="sm"
                    title="Excluir este lançamento?"
                    footer={
                        <div className="flex w-full justify-end gap-3">
                            <DsButton
                                variant="secondary"
                                label="Cancelar"
                                disabled={remove.isPending}
                                onClick={() => setConfirmingDelete(false)}
                            />
                            <DsButton
                                variant="destructive"
                                label="Excluir"
                                loading={remove.isPending}
                                onClick={() => void confirmDelete()}
                            />
                        </div>
                    }
                >
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        “{editing.description}” vai para a lixeira e sai do
                        calendário, das pendências e do resumo. Dá para
                        restaurar em Configurações, na Lixeira.
                    </p>
                </DsModal>
            )}
        </>
    );
}

/** 422 do servidor no campo certo; o que não tem campo vira toast. */
function showServerErrors(form: Form, error: unknown, feeMode: FeeMode) {
    const invalid = getValidationErrors(error);
    if (!invalid) {
        toast.error('Não foi possível salvar. Tente de novo.');
        return;
    }
    const leftover: string[] = [];
    for (const [apiField, messages] of Object.entries(invalid.fields)) {
        const message = messages[0];
        if (!message) continue;
        const field = formFieldOfApiError(apiField, feeMode);
        if (field) form.setError(field, { type: 'server', message });
        else leftover.push(message);
    }
    if (leftover.length > 0) toast.error(leftover.join(' '));
    else if (Object.keys(invalid.fields).length === 0) {
        toast.error(invalid.message ?? 'Confira os dados.');
    }
}

function TypeSection({ form }: { form: Form }) {
    const type = form.watch('type');
    const switchType = (next: FinancialTransactionType) => {
        if (next === type) return;
        form.setValue('type', next);
        form.setValue('categoryId', '');
        if (form.getValues('status') !== 'pendente') {
            form.setValue('status', doneStatus(next));
        }
    };
    return (
        <div
            role="radiogroup"
            aria-label="Tipo"
            className="grid grid-cols-2 gap-2 rounded-ds-xl bg-ds-surface-subtle p-1"
        >
            {(
                [
                    ['entrada', 'Entrada', <ArrowDownLeft key="i" />],
                    ['saida', 'Saída', <ArrowUpRight key="o" />],
                ] as const
            ).map(([key, label, icon]) => (
                <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={type === key}
                    onClick={() => switchType(key)}
                    className={dsCn(
                        'flex cursor-pointer items-center justify-center gap-2 rounded-ds-lg py-2.5 text-ds-body-sm font-semibold transition-colors [&_svg]:size-4',
                        type === key
                            ? key === 'entrada'
                                ? 'bg-ds-surface-default text-ds-content-brand shadow-ds-xs ds-dark:text-ds-primary-60'
                                : 'bg-ds-surface-default text-ds-content-danger shadow-ds-xs'
                            : 'text-ds-content-secondary',
                    )}
                >
                    {icon}
                    {label}
                </button>
            ))}
        </div>
    );
}

function AmountSection({ form }: { form: Form }) {
    const type = form.watch('type');
    return (
        <>
            <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                    <DsMoneyInput
                        label="Valor"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        state={fieldState.error ? 'error' : 'default'}
                        helper={fieldState.error?.message}
                    />
                )}
            />
            <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                    <DsInput
                        label="Descrição"
                        placeholder={
                            type === 'entrada'
                                ? 'Ex.: Sessão — Maria Souza'
                                : 'Ex.: Aluguel de outubro'
                        }
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        state={fieldState.error ? 'error' : 'default'}
                        helper={fieldState.error?.message}
                    />
                )}
            />
        </>
    );
}

function CategorySection({
    form,
    period,
    editingCategory,
}: {
    form: Form;
    period: string;
    editingCategory?: FinancialCategory;
}) {
    const type = form.watch('type');
    const { active, top } = useFinanceTopCategories(period, type);
    // Editando um lançamento de categoria já desligada: ela continua na lista.
    const options = useMemo(() => {
        const list = [...active];
        if (
            editingCategory &&
            editingCategory.type === type &&
            !list.some((c) => c.id === editingCategory.id)
        ) {
            list.push(editingCategory);
        }
        return list.map((c) => ({ value: c.id, label: c.name }));
    }, [active, editingCategory, type]);

    return (
        <Controller
            control={form.control}
            name="categoryId"
            render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                    <span className="text-ds-body-xs font-medium">
                        Categoria
                    </span>
                    {top.length > 0 && (
                        <div
                            role="group"
                            aria-label="Mais usadas"
                            className="flex flex-wrap gap-2"
                        >
                            {top.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    aria-pressed={field.value === c.id}
                                    onClick={() =>
                                        form.setValue('categoryId', c.id, {
                                            shouldValidate: true,
                                        })
                                    }
                                    className={chip(field.value === c.id)}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}
                    <DsFieldSelect
                        aria-label="Todas as categorias"
                        mode="search"
                        placeholder="Todas as categorias"
                        searchPlaceholder="Procurar categoria"
                        options={options}
                        value={field.value}
                        onValueChange={(v) => {
                            field.onChange(String(v));
                            field.onBlur();
                        }}
                        state={fieldState.error ? 'error' : 'default'}
                        helper={fieldState.error?.message}
                    />
                </div>
            )}
        />
    );
}

function DateStatusSection({ form }: { form: Form }) {
    const type = form.watch('type');
    const status = form.watch('status');
    const done = doneStatus(type);
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <Controller
                control={form.control}
                name="date"
                render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                        <span className="text-ds-body-xs font-medium">
                            Data
                        </span>
                        <DsDatepicker
                            mode="single"
                            ref={field.ref}
                            value={field.value}
                            onValueChange={(v) =>
                                field.onChange(v instanceof Date ? v : null)
                            }
                        />
                        <FieldError message={fieldState.error?.message} />
                    </div>
                )}
            />
            <div className="flex flex-col gap-2">
                <span className="text-ds-body-xs font-medium">Situação</span>
                <div
                    role="radiogroup"
                    aria-label="Situação"
                    className="grid grid-cols-2 gap-1 rounded-ds-lg bg-ds-surface-subtle p-1"
                >
                    {(
                        [
                            [done, done === 'recebido' ? 'Recebido' : 'Pago'],
                            [
                                'pendente',
                                type === 'entrada' ? 'A receber' : 'A pagar',
                            ],
                        ] as const
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={status === key}
                            onClick={() => form.setValue('status', key)}
                            className={dsCn(
                                'cursor-pointer rounded-ds-md py-2 text-ds-body-xs transition-colors',
                                status === key
                                    ? 'bg-ds-surface-default font-medium shadow-ds-xs'
                                    : 'text-ds-content-secondary',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <FieldError message={form.formState.errors.status?.message} />
            </div>
        </div>
    );
}

function PaymentSection({ form }: { form: Form }) {
    const values = form.watch();
    const method = values.paymentMethod;
    const typedFee = feeInReais(
        values.amount,
        values.feeMode,
        values.feeMode === 'percent'
            ? parsePercent(values.feePercent ?? '')
            : (values.feeAmount ?? null),
    );
    const fee = feeOfValues(values);
    const net = netOf(values.amount, fee);
    const visible = showsFee(method, Number.isNaN(typedFee) ? 0 : typedFee);

    return (
        <>
            <div className="flex flex-col gap-2">
                <span className="text-ds-body-xs font-medium">
                    Forma de pagamento
                </span>
                <div
                    role="group"
                    aria-label="Forma de pagamento"
                    className="flex flex-wrap gap-2"
                >
                    {METHODS.map((m) => (
                        <button
                            key={m}
                            type="button"
                            aria-pressed={method === m}
                            onClick={() => form.setValue('paymentMethod', m)}
                            className={chip(method === m)}
                        >
                            {PAYMENT_METHOD_LABELS[m]}
                        </button>
                    ))}
                </div>
                <FieldError
                    message={form.formState.errors.paymentMethod?.message}
                />
            </div>

            {visible && (
                <FeeSection
                    form={form}
                    feeMode={values.feeMode}
                    fee={fee}
                    net={net}
                />
            )}
        </>
    );
}

function FeeSection({
    form,
    feeMode,
    fee,
    net,
}: {
    form: Form;
    feeMode: FeeMode;
    fee: number;
    net: number;
}) {
    const changeMode = (next: FeeMode) => {
        if (next === feeMode) return;
        const patch = switchFeeMode(form.getValues(), next);
        form.setValue('feeMode', patch.feeMode);
        form.setValue('feeAmount', patch.feeAmount);
        form.setValue('feePercent', patch.feePercent);
        form.clearErrors(['feeAmount', 'feePercent']);
    };

    return (
        <div className="flex flex-col gap-3 rounded-ds-lg bg-ds-surface-subtle p-4">
            <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto] sm:gap-4">
                {feeMode === 'percent' ? (
                    <Controller
                        control={form.control}
                        name="feePercent"
                        render={({ field, fieldState }) => (
                            <DsInput
                                label="Taxa da maquininha (%)"
                                inputMode="decimal"
                                placeholder="Ex.: 3,5"
                                name={field.name}
                                ref={field.ref}
                                value={field.value ?? ''}
                                onValueChange={field.onChange}
                                onBlur={field.onBlur}
                                state={fieldState.error ? 'error' : 'default'}
                                helper={
                                    fieldState.error?.message ??
                                    `Em reais: ${money(fee, false)}`
                                }
                            />
                        )}
                    />
                ) : (
                    <Controller
                        control={form.control}
                        name="feeAmount"
                        render={({ field, fieldState }) => (
                            <DsMoneyInput
                                label="Taxa da maquininha"
                                name={field.name}
                                ref={field.ref}
                                value={field.value ?? null}
                                onValueChange={field.onChange}
                                onBlur={field.onBlur}
                                state={fieldState.error ? 'error' : 'default'}
                                helper={fieldState.error?.message}
                            />
                        )}
                    />
                )}
                <div
                    role="radiogroup"
                    aria-label="Taxa em"
                    className="order-first grid h-10 grid-cols-2 gap-1 justify-self-start rounded-ds-lg bg-ds-surface-default p-1 sm:order-none sm:mt-8"
                >
                    {(
                        [
                            ['money', 'R$'],
                            ['percent', '%'],
                        ] as const
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={feeMode === key}
                            onClick={() => changeMode(key)}
                            className={dsCn(
                                'min-w-11 cursor-pointer rounded-ds-md px-3 text-ds-body-xs transition-colors',
                                feeMode === key
                                    ? 'bg-ds-primary-80 font-medium text-ds-content-on-brand ds-dark:bg-ds-primary-70'
                                    : 'text-ds-content-secondary',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <p className="text-ds-body-xs text-ds-content-secondary">
                Líquido:{' '}
                <strong className="font-ds-mono text-ds-body-sm text-ds-content-primary">
                    {money(net, false)}
                </strong>
            </p>
        </div>
    );
}

function NotesSection({ form }: { form: Form }) {
    return (
        <Controller
            control={form.control}
            name="notes"
            render={({ field, fieldState }) => (
                <DsTextarea
                    label="Observações"
                    rows={2}
                    placeholder="Opcional"
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    state={fieldState.error ? 'error' : 'default'}
                    helper={fieldState.error?.message}
                />
            )}
        />
    );
}
