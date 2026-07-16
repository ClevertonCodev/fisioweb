import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { usePatients } from '@/application/clinic';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import type { ProgramGroup } from '@/domain/clinic';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const MOBILE_MAX = 767;

interface StepProgramDetailsProps {
    groups: ProgramGroup[];
    initialTitle?: string;
    initialMessage?: string;
    initialPatientId?: number | null;
    initialPatientName?: string;
    initialStartDate?: string;
    initialEndDate?: string;
    isSaving?: boolean;
    onBack: () => void;
    onSave: (details: {
        title: string;
        patientId: number | null;
        patientName: string;
        startDate: string;
        endDate: string;
        message: string;
    }) => void;
}

export function StepProgramDetails({
    groups,
    initialTitle = '',
    initialMessage = '',
    initialPatientId = null,
    initialPatientName = '',
    initialStartDate,
    initialEndDate = '',
    isSaving = false,
    onBack,
    onSave,
}: StepProgramDetailsProps) {
    const isMobileFromHook = useIsMobile();
    const [isMobile, setIsMobile] = useState(
        () =>
            typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX,
    );

    useEffect(() => {
        setIsMobile(isMobileFromHook);
    }, [isMobileFromHook]);

    const [title, setTitle] = useState(initialTitle);
    const [patientId, setPatientId] = useState<number | null>(initialPatientId);
    const [patientName, setPatientName] = useState(initialPatientName);
    const [patientOpen, setPatientOpen] = useState(false);
    const [startDate, setStartDate] = useState(
        initialStartDate ?? new Date().toISOString().slice(0, 10),
    );
    const [endDate, setEndDate] = useState(initialEndDate);
    const [message, setMessage] = useState(initialMessage);

    const { data: patientsResult } = usePatients();
    const patients = patientsResult?.data ?? [];

    const totalExercises = groups.reduce((s, g) => s + g.exercises.length, 0);
    const totalDuration = groups.reduce(
        (s, g) =>
            s + g.exercises.reduce((sum, e) => sum + (e.seriesMin || 0) * 2, 0),
        0,
    );

    const handleSubmit = () => {
        onSave({ title, patientId, patientName, startDate, endDate, message });
    };

    const thumbnails = groups
        .flatMap((g) => g.exercises)
        .slice(0, 3)
        .map((e) => e.thumbnailUrl);
    const remaining = totalExercises - thumbnails.length;

    const saveLabel = isSaving
        ? 'Salvando...'
        : patientId
          ? 'Salvar e enviar programa'
          : 'Salvar';

    const summary = (
        <ProgramSummary
            thumbnails={thumbnails}
            remaining={remaining}
            totalExercises={totalExercises}
            totalDuration={totalDuration}
        />
    );

    return (
        <div
            className={cn(
                'flex h-full w-full min-w-0 flex-1 overflow-hidden',
                isMobile ? 'flex-col' : 'flex-row',
            )}
        >
            <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto">
                <div
                    className={cn(
                        'w-full space-y-4',
                        isMobile
                            ? 'px-3 pb-28 pt-3'
                            : 'mx-auto max-w-xl space-y-6 p-6',
                    )}
                >
                    {!isMobile && (
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={onBack}
                            >
                                Voltar
                            </Button>
                        </div>
                    )}

                    <div className="w-full min-w-0 space-y-3">
                        <Input
                            placeholder="Título do programa"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-12 w-full max-w-none text-base"
                        />

                        <Popover
                            open={patientOpen}
                            onOpenChange={setPatientOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="h-12 w-full max-w-none cursor-pointer justify-between font-normal"
                                >
                                    <span
                                        className={cn(
                                            'truncate',
                                            !patientName &&
                                                'text-muted-foreground',
                                        )}
                                    >
                                        {patientName || 'Enviar para...'}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                align="start"
                            >
                                <Command>
                                    <CommandInput placeholder="Pesquisar paciente..." />
                                    <CommandEmpty>
                                        Nenhum paciente encontrado.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {patientId && (
                                            <CommandItem
                                                onSelect={() => {
                                                    setPatientId(null);
                                                    setPatientName('');
                                                    setPatientOpen(false);
                                                }}
                                                className="cursor-pointer text-muted-foreground italic"
                                            >
                                                Remover paciente
                                            </CommandItem>
                                        )}
                                        {patients.map((p) => (
                                            <CommandItem
                                                key={p.id}
                                                value={p.name}
                                                onSelect={() => {
                                                    setPatientId(Number(p.id));
                                                    setPatientName(p.name);
                                                    setPatientOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        patientId ===
                                                            Number(p.id)
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                                {p.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="w-full min-w-0">
                                <label className="mb-1 block text-xs text-muted-foreground">
                                    Início
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="h-12 w-full max-w-none"
                                />
                            </div>
                            <div className="w-full min-w-0">
                                <label className="mb-1 block text-xs text-muted-foreground">
                                    Término
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-12 w-full max-w-none"
                                />
                            </div>
                        </div>

                        <div className="w-full min-w-0">
                            <div className="mb-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    className="cursor-pointer text-sm text-primary hover:underline"
                                >
                                    + Criar modelo de mensagem
                                </button>
                            </div>
                            <Textarea
                                placeholder="Mensagem"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                maxLength={600}
                                className="w-full max-w-none"
                            />
                            <p className="mt-1 text-right text-xs text-muted-foreground">
                                {600 - message.length} caracteres restantes
                            </p>
                        </div>
                    </div>

                    {isMobile && (
                        <div className="w-full rounded-xl border border-border bg-card p-4">
                            {summary}
                        </div>
                    )}
                </div>
            </div>

            {!isMobile && (
                <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
                    <div className="space-y-4 p-6">{summary}</div>
                    <div className="mt-auto border-t border-border p-4">
                        <Button
                            className="w-full cursor-pointer"
                            onClick={handleSubmit}
                            disabled={!title.trim() || isSaving}
                        >
                            {saveLabel}
                        </Button>
                    </div>
                </div>
            )}

            {isMobile && (
                <div className="shrink-0 border-t border-border bg-card px-3 py-3">
                    <Button
                        className="h-12 w-full cursor-pointer"
                        onClick={handleSubmit}
                        disabled={!title.trim() || isSaving}
                    >
                        {saveLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}

function ProgramSummary({
    thumbnails,
    remaining,
    totalExercises,
    totalDuration,
}: {
    thumbnails: (string | null)[];
    remaining: number;
    totalExercises: number;
    totalDuration: number;
}) {
    return (
        <>
            <h3 className="text-base font-semibold text-foreground">
                Resumo do programa
            </h3>

            <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                    {thumbnails.map((url, i) => (
                        <div
                            key={i}
                            className="h-10 w-10 overflow-hidden rounded-full border-2 border-card bg-muted"
                        >
                            <img
                                src={url ?? undefined}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ))}
                    {remaining > 0 && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                            +{remaining}
                        </div>
                    )}
                </div>
                <span className="ml-2 text-sm text-foreground">
                    {totalExercises} exercício
                    {totalExercises !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="text-foreground">{totalDuration} min</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                        Acesso disponível por
                    </span>
                    <span className="text-foreground">--</span>
                </div>
            </div>
        </>
    );
}
