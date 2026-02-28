import { ChevronLeft, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { Patient } from '@/types';

import { ExerciseThumb } from './exercise-thumb';
import { getExerciseThumbnail } from './helpers';
import type { ExerciseConfig, Step4Data } from './types';

interface Step4Props {
    patients: Patient[];
    configs: ExerciseConfig[];
    initialData?: Partial<Step4Data>;
    /** Se fornecido, exibe um select de status (modo edição) */
    statuses?: Record<string, string>;
    submitLabel?: string;
    onBack: () => void;
    onSubmit: (data: Step4Data) => void;
    processing: boolean;
}

function formatDate(d: string) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

export function Step4({
    patients,
    configs,
    initialData,
    statuses,
    submitLabel,
    onBack,
    onSubmit,
    processing,
}: Step4Props) {
    const [data, setData] = useState<Step4Data>({
        title: initialData?.title ?? '',
        patient_id: initialData?.patient_id ?? '',
        start_date: initialData?.start_date ?? new Date().toISOString().split('T')[0],
        end_date: initialData?.end_date ?? '',
        message: initialData?.message ?? '',
        status: initialData?.status ?? 'draft',
    });

    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);

    const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()));
    const selectedPatient = patients.find((p) => String(p.id) === data.patient_id);

    const thumbnails = configs.slice(0, 4).map((c) => getExerciseThumbnail(c.exercise));
    const extra = configs.length - 4;

    const derivedSubmitLabel =
        submitLabel ??
        (data.patient_id ? 'Salvar e enviar programa' : 'Salvar como modelo');

    return (
        <div className="flex h-full">
            {/* Left: form */}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Voltar
                    </button>
                    <h1 className="text-lg font-semibold">Detalhes do programa</h1>
                </div>

                <div className="max-w-xl flex-1 space-y-4 overflow-y-auto p-6">
                    {/* Título */}
                    <div>
                        <Input
                            placeholder="Título do programa"
                            value={data.title}
                            onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
                            className="text-base"
                        />
                    </div>

                    {/* Paciente */}
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Enviar para..."
                                    value={selectedPatient ? selectedPatient.name : patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setData((d) => ({ ...d, patient_id: '' }));
                                        setShowPatientList(true);
                                    }}
                                    onFocus={() => setShowPatientList(true)}
                                    className="pl-9"
                                />
                                {showPatientList && filteredPatients.length > 0 && !selectedPatient && (
                                    <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
                                        {filteredPatients.slice(0, 8).map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                                                onClick={() => {
                                                    setData((d) => ({
                                                        ...d,
                                                        patient_id: String(p.id),
                                                        status: d.status === 'draft' ? 'active' : d.status,
                                                    }));
                                                    setPatientSearch('');
                                                    setShowPatientList(false);
                                                }}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedPatient && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData((d) => ({ ...d, patient_id: '' }));
                                        setPatientSearch('');
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block cursor-pointer text-xs text-muted-foreground">Início</label>
                            <Input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData((d) => ({ ...d, start_date: e.target.value }))}
                                className="cursor-pointer"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block cursor-pointer text-xs text-muted-foreground">Término</label>
                            <Input
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData((d) => ({ ...d, end_date: e.target.value }))}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Status (apenas no modo edição) */}
                    {statuses && (
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData((d) => ({ ...d, status: e.target.value }))}
                                className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            >
                                {Object.entries(statuses).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Mensagem */}
                    <div>
                        <button type="button" className="mb-2 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
                            <Plus className="h-3.5 w-3.5" />
                            Criar modelo de mensagem
                        </button>
                        <Textarea
                            placeholder="Mensagem"
                            value={data.message}
                            onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
                            rows={4}
                            maxLength={600}
                        />
                        <p className="mt-1 text-right text-xs text-muted-foreground">
                            {600 - data.message.length} caracteres restantes
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: summary */}
            <div className="flex w-72 flex-shrink-0 flex-col border-l border-border">
                <div className="border-b border-border p-4">
                    <h2 className="font-semibold">Resumo do programa</h2>
                </div>
                <div className="flex-1 space-y-4 p-4">
                    {/* Thumbnails */}
                    <div className="flex items-center gap-1">
                        {thumbnails.map((t, i) => (
                            <div
                                key={i}
                                className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-teal-600"
                                style={{ marginLeft: i > 0 ? '-8px' : '0' }}
                            >
                                {t ? (
                                    <img src={t} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <ExerciseThumb exercise={configs[i].exercise} size="sm" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {extra > 0 && (
                            <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium"
                                style={{ marginLeft: '-8px' }}
                            >
                                +{extra}
                            </div>
                        )}
                        <span className="ml-3 text-sm font-medium">{configs.length} exercícios</span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Duração</span>
                            <span>0 min</span>
                        </div>
                        {selectedPatient && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Paciente</span>
                                <span className="font-medium">{selectedPatient.name}</span>
                            </div>
                        )}
                        {data.start_date && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Início</span>
                                <span>{formatDate(data.start_date)}</span>
                            </div>
                        )}
                        {data.end_date && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Término</span>
                                <span>{formatDate(data.end_date)}</span>
                            </div>
                        )}
                        {statuses && data.status && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span>{statuses[data.status] ?? data.status}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-border p-4">
                    <Button
                        className="w-full cursor-pointer bg-teal-600 text-white hover:bg-teal-700"
                        disabled={!data.title || processing}
                        onClick={() => onSubmit(data)}
                    >
                        {processing && <Spinner className="mr-2" />}
                        {derivedSubmitLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
