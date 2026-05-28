import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { ProgramGroup } from '@/domain/clinic';
import { cn } from '@/lib/utils';

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
    const [title, setTitle] = useState(initialTitle);
    const [patientId, setPatientId] = useState<number | null>(initialPatientId);
    const [patientName, setPatientName] = useState(initialPatientName);
    const [patientOpen, setPatientOpen] = useState(false);
    const [startDate, setStartDate] = useState(initialStartDate ?? new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(initialEndDate);
    const [message, setMessage] = useState(initialMessage);

    const { data: patientsResult } = usePatients();
    const patients = patientsResult?.data ?? [];

    const totalExercises = groups.reduce((s, g) => s + g.exercises.length, 0);
    const totalDuration = groups.reduce(
        (s, g) => s + g.exercises.reduce((sum, e) => sum + (e.seriesMin || 0) * 2, 0),
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

    return (
        <div className="flex h-full">
            <ScrollArea className="flex-1">
                <div className="mx-auto max-w-xl space-y-6 p-6">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={onBack}>
                            Voltar
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Input
                                placeholder="Título do programa"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-base"
                            />
                        </div>

                        <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between font-normal"
                                >
                                    <span className={cn(!patientName && 'text-muted-foreground')}>
                                        {patientName || 'Enviar para...'}
                                    </span>
                                    <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Pesquisar paciente..." />
                                    <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        {patientId && (
                                            <CommandItem
                                                onSelect={() => {
                                                    setPatientId(null);
                                                    setPatientName('');
                                                    setPatientOpen(false);
                                                }}
                                                className="text-muted-foreground italic"
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
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        patientId === Number(p.id)
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

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-muted-foreground mb-1 block text-xs">
                                    Início
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-muted-foreground mb-1 block text-xs">
                                    Término
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <button className="text-primary text-sm hover:underline">
                                    + Criar modelo de mensagem
                                </button>
                            </div>
                            <Textarea
                                placeholder="Mensagem"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                maxLength={600}
                            />
                            <p className="text-muted-foreground mt-1 text-right text-xs">
                                {600 - message.length} caracteres restantes
                            </p>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="border-border bg-card flex w-72 flex-shrink-0 flex-col border-l">
                <div className="space-y-4 p-6">
                    <h3 className="text-foreground text-base font-semibold">Resumo do programa</h3>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {thumbnails.map((url, i) => (
                                <div
                                    key={i}
                                    className="border-card bg-muted h-10 w-10 overflow-hidden rounded-full border-2"
                                >
                                    <img src={url} alt="" className="h-full w-full object-cover" />
                                </div>
                            ))}
                            {remaining > 0 && (
                                <div className="border-card bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-medium">
                                    +{remaining}
                                </div>
                            )}
                        </div>
                        <span className="text-foreground ml-2 text-sm">
                            {totalExercises} exercício{totalExercises !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Duração</span>
                            <span className="text-foreground">{totalDuration} min</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Acesso disponível por</span>
                            <span className="text-foreground">--</span>
                        </div>
                    </div>
                </div>

                <div className="border-border mt-auto border-t p-4">
                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={!title.trim() || isSaving}
                    >
                        {isSaving
                            ? 'Salvando...'
                            : patientId
                              ? 'Salvar e enviar programa'
                              : 'Salvar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
