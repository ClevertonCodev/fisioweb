/**
 * PROTÓTIPO (descartável): criar e editar lançamento. Entrada × saída em
 * destaque (muda as categorias e a palavra "recebido"/"pago"), o valor
 * grande, as categorias mais usadas em chips (com as outras numa lista com
 * busca), forma de pagamento em chips e o líquido calculado com a taxa.
 * Salvar e excluir (vai para a lixeira) são stub.
 */
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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
    type FinancialTransaction,
    type FinancialTransactionStatus,
    type FinancialTransactionType,
    type PaymentMethod,
} from '@/domain/clinic/finance';

import { money, parseDay, useCategories } from './data';

export interface Draft {
    type: FinancialTransactionType;
    editing?: FinancialTransaction;
}

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

export function TransactionModal({
    draft,
    recent,
    onClose,
}: {
    draft: Draft;
    /** Lançamentos do mês, para sugerir as categorias mais usadas. */
    recent: FinancialTransaction[];
    onClose: () => void;
}) {
    const e = draft.editing;
    const [type, setType] = useState<FinancialTransactionType>(
        e?.type ?? draft.type,
    );
    const [amount, setAmount] = useState<number | null>(e?.grossAmount ?? null);
    const [description, setDescription] = useState(e?.description ?? '');
    const [categoryId, setCategoryId] = useState(e?.category.id ?? '');
    const [date, setDate] = useState<Date | null>(
        e ? parseDay(e.date) : new Date(),
    );
    const [status, setStatus] = useState<FinancialTransactionStatus>(
        e?.status ?? 'recebido',
    );
    const [method, setMethod] = useState<PaymentMethod>(
        e?.paymentMethod ?? 'pix',
    );
    const [fee, setFee] = useState<number | null>(e?.feeAmount || null);
    const [notes, setNotes] = useState(e?.notes ?? '');
    const [tried, setTried] = useState(false);

    const { data: categories = [] } = useCategories(type);
    const active = categories.filter((c) => c.active);

    // As 5 categorias mais usadas no mês para este tipo.
    const top = useMemo(() => {
        const count = new Map<string, number>();
        for (const t of recent) {
            if (t.type === type) {
                count.set(t.category.id, (count.get(t.category.id) ?? 0) + 1);
            }
        }
        return active
            .filter((c) => count.has(c.id))
            .sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0))
            .slice(0, 5);
    }, [recent, type, active]);

    const done = type === 'entrada' ? 'recebido' : 'pago';
    const net = Math.max(0, (amount ?? 0) - (fee ?? 0));
    const errors = {
        amount: !amount ? 'Informe o valor.' : undefined,
        description: !description.trim() ? 'Descreva o lançamento.' : undefined,
        category: !categoryId ? 'Escolha a categoria.' : undefined,
    };
    const valid = !errors.amount && !errors.description && !errors.category;

    const switchType = (t: FinancialTransactionType) => {
        setType(t);
        setCategoryId('');
        setStatus(
            status === 'pendente'
                ? 'pendente'
                : t === 'entrada'
                  ? 'recebido'
                  : 'pago',
        );
    };

    const save = () => {
        setTried(true);
        if (!valid) return;
        toast.success(
            `Protótipo: ${e ? 'alteração' : 'lançamento'} não foi salvo.`,
            { description: `${description} · ${money(net, false)}` },
        );
        onClose();
    };

    return (
        <DsModal
            open
            onOpenChange={(o) => !o && onClose()}
            size="md"
            title={e ? 'Editar lançamento' : 'Novo lançamento'}
            footer={
                <div className="flex w-full items-center gap-3">
                    {e && (
                        <DsButton
                            variant="destructive-tertiary"
                            iconPosition="left"
                            icon={<Trash2 />}
                            label="Excluir"
                            onClick={() => {
                                toast.info(
                                    'Protótipo: iria para a lixeira (dá para restaurar).',
                                );
                                onClose();
                            }}
                        />
                    )}
                    <div className="ml-auto flex gap-3">
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={onClose}
                        />
                        <DsButton
                            label={e ? 'Salvar' : 'Lançar'}
                            onClick={save}
                        />
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-5">
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

                <DsMoneyInput
                    label="Valor"
                    value={amount}
                    onValueChange={setAmount}
                    state={tried && errors.amount ? 'error' : 'default'}
                    helper={tried ? errors.amount : undefined}
                />

                <DsInput
                    label="Descrição"
                    placeholder={
                        type === 'entrada'
                            ? 'Ex.: Sessão — Maria Souza'
                            : 'Ex.: Aluguel de outubro'
                    }
                    value={description}
                    onValueChange={setDescription}
                    state={tried && errors.description ? 'error' : 'default'}
                    helper={tried ? errors.description : undefined}
                />

                <div className="flex flex-col gap-2">
                    <span className="text-ds-body-xs font-medium">
                        Categoria
                    </span>
                    {top.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {top.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    aria-pressed={categoryId === c.id}
                                    onClick={() => setCategoryId(c.id)}
                                    className={dsCn(
                                        'cursor-pointer rounded-ds-pill border px-3 py-1.5 text-ds-caption transition-colors',
                                        categoryId === c.id
                                            ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-content-on-brand ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70'
                                            : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-brand-subtle',
                                    )}
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
                        options={active.map((c) => ({
                            value: c.id,
                            label: c.name,
                        }))}
                        value={categoryId}
                        onValueChange={(v) => setCategoryId(String(v))}
                        state={tried && errors.category ? 'error' : 'default'}
                        helper={tried ? errors.category : undefined}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <span className="text-ds-body-xs font-medium">
                            Data
                        </span>
                        <DsDatepicker
                            mode="single"
                            value={date}
                            onValueChange={(v) =>
                                setDate(v instanceof Date ? v : null)
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-ds-body-xs font-medium">
                            Situação
                        </span>
                        <div
                            role="radiogroup"
                            aria-label="Situação"
                            className="grid grid-cols-2 gap-1 rounded-ds-lg bg-ds-surface-subtle p-1"
                        >
                            {(
                                [
                                    [
                                        done,
                                        done === 'recebido'
                                            ? 'Recebido'
                                            : 'Pago',
                                    ],
                                    [
                                        'pendente',
                                        type === 'entrada'
                                            ? 'A receber'
                                            : 'A pagar',
                                    ],
                                ] as const
                            ).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    role="radio"
                                    aria-checked={status === key}
                                    onClick={() => setStatus(key)}
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
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-ds-body-xs font-medium">
                        Forma de pagamento
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {METHODS.map((m) => (
                            <button
                                key={m}
                                type="button"
                                aria-pressed={method === m}
                                onClick={() => setMethod(m)}
                                className={dsCn(
                                    'cursor-pointer rounded-ds-pill border px-3 py-1.5 text-ds-caption transition-colors',
                                    method === m
                                        ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-60'
                                        : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-brand-subtle',
                                )}
                            >
                                {PAYMENT_METHOD_LABELS[m]}
                            </button>
                        ))}
                    </div>
                </div>

                {(method === 'cartao_credito' ||
                    method === 'cartao_debito' ||
                    fee) && (
                    <div className="grid items-end gap-4 rounded-ds-lg bg-ds-surface-subtle p-4 sm:grid-cols-2">
                        <DsMoneyInput
                            label="Taxa da maquininha"
                            value={fee}
                            onValueChange={setFee}
                        />
                        <p className="text-ds-body-xs text-ds-content-secondary">
                            Líquido:{' '}
                            <strong className="font-ds-mono text-ds-body-sm text-ds-content-primary">
                                {money(net, false)}
                            </strong>
                        </p>
                    </div>
                )}

                <DsTextarea
                    label="Observações"
                    rows={2}
                    value={notes}
                    onValueChange={setNotes}
                    placeholder="Opcional"
                />
            </div>
        </DsModal>
    );
}
