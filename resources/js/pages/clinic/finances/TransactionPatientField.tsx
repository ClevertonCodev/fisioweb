/**
 * Paciente e atendimento do lançamento de entrada (tarefa 013): o paciente
 * vem de uma busca no servidor (a partir de 2 letras) e, escolhido, aparece o
 * seletor dos atendimentos dele na agenda (opcional). Só na entrada: na saída
 * o campo não é montado e o servidor limpa o que a entrada tinha.
 */
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import type { TransactionFormValues } from '@/application/clinic/finance-transaction-form';
import {
    FINANCE_PATIENT_MIN_SEARCH,
    useFinancePatientAppointments,
    useFinancePatientSearch,
} from '@/application/clinic/use-finance-patients';
import { DsButton, DsFieldSelect } from '@/components/ds';
import type { TransactionAppointment } from '@/domain/clinic/finance';
import { useDebounce } from '@/lib/use-debounce';

type Form = UseFormReturn<TransactionFormValues>;

const NO_APPOINTMENT = 'none';

/** "15/10/2026 09:00" no fuso de quem está vendo. */
function appointmentLabel(startsAt: string | null, title?: string | null) {
    const when = startsAt
        ? format(new Date(startsAt), 'dd/MM/yyyy HH:mm')
        : 'Atendimento';
    return title ? `${when} · ${title}` : when;
}

export function TransactionPatientField({
    form,
    savedAppointment,
}: {
    form: Form;
    /** O atendimento salvo no lançamento em edição (para o rótulo). */
    savedAppointment?: TransactionAppointment | null;
}) {
    const patientId = form.watch('patientId') ?? null;
    const patientName = form.watch('patientName') ?? null;
    const [input, setInput] = useState('');
    const term = useDebounce(input.trim(), 250);
    const search = useFinancePatientSearch(term);

    // O escolhido continua nas opções mesmo fora do resultado da busca.
    const patientOptions = useMemo(() => {
        const found =
            term.length >= FINANCE_PATIENT_MIN_SEARCH
                ? (search.data ?? [])
                : [];
        const list = found.map((p) => ({ value: p.id, label: p.name ?? '' }));
        if (patientId && !list.some((o) => o.value === patientId)) {
            list.unshift({
                value: patientId,
                label: patientName ?? 'Paciente',
            });
        }
        return list;
    }, [search.data, term, patientId, patientName]);

    const choosePatient = (id: string) => {
        if (id === patientId) return;
        const name = patientOptions.find((o) => o.value === id)?.label ?? null;
        form.setValue('patientId', id, { shouldDirty: true });
        form.setValue('patientName', name);
        // O atendimento era do paciente anterior.
        form.setValue('appointmentId', null);
        form.clearErrors(['patientId', 'appointmentId']);
    };

    const clearPatient = () => {
        form.setValue('patientId', null, { shouldDirty: true });
        form.setValue('patientName', null);
        form.setValue('appointmentId', null);
        form.clearErrors(['patientId', 'appointmentId']);
    };

    return (
        <div className="flex flex-col gap-3">
            <Controller
                control={form.control}
                name="patientId"
                render={({ fieldState }) => (
                    <div className="flex items-end gap-2">
                        <DsFieldSelect
                            className="min-w-0 flex-1"
                            label="Paciente"
                            mode="search"
                            filterLocally={false}
                            minSearchLength={FINANCE_PATIENT_MIN_SEARCH}
                            placeholder="Quem pagou (opcional)"
                            searchPlaceholder="Procurar paciente"
                            emptyMessage={
                                search.isFetching
                                    ? 'Buscando...'
                                    : 'Nenhum paciente com esse nome.'
                            }
                            options={patientOptions}
                            value={patientId ?? ''}
                            onSearch={setInput}
                            onValueChange={(v) => choosePatient(String(v))}
                            state={fieldState.error ? 'error' : 'default'}
                            helper={fieldState.error?.message}
                        />
                        {patientId && (
                            <DsButton
                                variant="tertiary"
                                iconPosition="only"
                                icon={<X />}
                                label="Tirar paciente"
                                className={
                                    fieldState.error ? 'mb-6' : undefined
                                }
                                onClick={clearPatient}
                            />
                        )}
                    </div>
                )}
            />
            {patientId && (
                <AppointmentSelect
                    form={form}
                    patientId={patientId}
                    saved={savedAppointment}
                />
            )}
        </div>
    );
}

function AppointmentSelect({
    form,
    patientId,
    saved,
}: {
    form: Form;
    patientId: string;
    saved?: TransactionAppointment | null;
}) {
    const { data, isLoading } = useFinancePatientAppointments(patientId);
    const current = form.watch('appointmentId') ?? null;

    const options = useMemo(() => {
        const list = [
            { value: NO_APPOINTMENT, label: 'Sem atendimento' },
            ...(data ?? []).map((a) => ({
                value: a.id,
                label: appointmentLabel(a.startsAt, a.title),
            })),
        ];
        // Editando: o atendimento salvo (ex.: cancelado depois) continua na lista.
        if (current && !list.some((o) => o.value === current)) {
            list.push({
                value: current,
                label: appointmentLabel(
                    saved?.id === current ? saved.startsAt : null,
                ),
            });
        }
        return list;
    }, [data, current, saved]);

    return (
        <Controller
            control={form.control}
            name="appointmentId"
            render={({ field, fieldState }) => (
                <DsFieldSelect
                    label="Atendimento na agenda"
                    placeholder={
                        isLoading ? 'Carregando...' : 'Sem atendimento'
                    }
                    options={options}
                    value={field.value ?? NO_APPOINTMENT}
                    onValueChange={(v) => {
                        const next = String(v);
                        field.onChange(next === NO_APPOINTMENT ? null : next);
                        field.onBlur();
                    }}
                    state={fieldState.error ? 'error' : 'default'}
                    helper={fieldState.error?.message}
                />
            )}
        />
    );
}
