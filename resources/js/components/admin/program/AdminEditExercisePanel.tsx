import { X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import type { AdminWizardExercise } from './types';

interface AdminEditExercisePanelProps {
    exercise: AdminWizardExercise;
    onSave: (updated: AdminWizardExercise) => void;
    onClose: () => void;
}

const DAYS = [
    { value: 1, label: 'S' },
    { value: 2, label: 'T' },
    { value: 3, label: 'Q' },
    { value: 4, label: 'Q' },
    { value: 5, label: 'S' },
    { value: 6, label: 'S' },
    { value: 0, label: 'D' },
];

const SERIES_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);
const REPS_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);
const LOAD_OPTIONS = Array.from({ length: 41 }, (_, i) => i * 2.5); // 0 a 100, passo 2.5
const REST_OPTIONS = [
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 45, label: '45s' },
    { value: 60, label: '1min' },
    { value: 90, label: '1min 30s' },
    { value: 120, label: '2min' },
    { value: 180, label: '3min' },
];

export function AdminEditExercisePanel({ exercise, onSave, onClose }: AdminEditExercisePanelProps) {
    const [days, setDays] = useState<number[]>(exercise.days);
    const [allDays, setAllDays] = useState(days.length === 7);
    const [period, setPeriod] = useState<'morning' | 'afternoon' | 'night' | null>(exercise.period);
    const [setsMin, setSetsMin] = useState<number | null>(exercise.setsMin);
    const [setsMax, setSetsMax] = useState<number | null>(exercise.setsMax);
    const [repetitionsMin, setRepetitionsMin] = useState<number | null>(exercise.repetitionsMin);
    const [repetitionsMax, setRepetitionsMax] = useState<number | null>(exercise.repetitionsMax);
    const [loadMin, setLoadMin] = useState<number | null>(exercise.loadMin);
    const [loadMax, setLoadMax] = useState<number | null>(exercise.loadMax);
    const [restTime, setRestTime] = useState<number | null>(exercise.restTime);
    const [notes, setNotes] = useState(exercise.notes);

    const toggleDay = (day: number) => {
        setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
        setAllDays(false);
    };

    const handleAllDays = (checked: boolean) => {
        setAllDays(checked);
        if (checked) setDays(DAYS.map((d) => d.value));
        else setDays([]);
    };

    const handleApply = () => {
        onSave({
            ...exercise,
            days,
            period,
            setsMin,
            setsMax,
            repetitionsMin,
            repetitionsMax,
            loadMin,
            loadMax,
            restTime,
            notes,
            isConfigured: true,
        });
    };

    return (
        <div className="border-border bg-card flex h-full w-80 flex-col border-l">
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-foreground text-sm font-semibold">Editar exercício</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 space-y-6 overflow-auto p-4">
                {/* Days */}
                <div className="space-y-3">
                    <label className="text-foreground text-sm font-medium">Dias da semana</label>
                    <div className="flex gap-1.5">
                        {DAYS.map((day) => (
                            <button
                                key={day.value}
                                onClick={() => toggleDay(day.value)}
                                className={cn(
                                    'h-9 w-9 rounded-md border text-sm font-medium transition-colors',
                                    days.includes(day.value)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:border-muted-foreground',
                                )}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="all-days-admin"
                            checked={allDays}
                            onCheckedChange={(v) => handleAllDays(v === true)}
                        />
                        <label
                            htmlFor="all-days-admin"
                            className="text-foreground cursor-pointer text-sm"
                        >
                            Todos os dias
                        </label>
                    </div>
                </div>

                {/* Period */}
                <div className="space-y-3">
                    <label className="text-foreground text-sm font-medium">Período</label>
                    <div className="flex gap-2">
                        {(
                            [
                                { value: 'morning', label: 'Manhã' },
                                { value: 'afternoon', label: 'Tarde' },
                                { value: 'night', label: 'Noite' },
                            ] as const
                        ).map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(period === p.value ? null : p.value)}
                                className={cn(
                                    'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                                    period === p.value
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:border-muted-foreground',
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Séries */}
                <div className="space-y-3">
                    <label className="text-foreground text-sm font-medium">Séries</label>
                    <div className="flex gap-3">
                        <Select
                            value={setsMin?.toString() ?? ''}
                            onValueChange={(v) => setSetsMin(v ? Number(v) : null)}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Mínima" />
                            </SelectTrigger>
                            <SelectContent>
                                {SERIES_OPTIONS.map((n) => (
                                    <SelectItem key={n} value={n.toString()}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={setsMax?.toString() ?? ''}
                            onValueChange={(v) => setSetsMax(v ? Number(v) : null)}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Máxima" />
                            </SelectTrigger>
                            <SelectContent>
                                {SERIES_OPTIONS.map((n) => (
                                    <SelectItem key={n} value={n.toString()}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Repetições */}
                <div className="space-y-3">
                    <label className="text-foreground text-sm font-medium">Repetições</label>
                    <div className="flex gap-3">
                        <Select
                            value={repetitionsMin?.toString() ?? ''}
                            onValueChange={(v) => setRepetitionsMin(v ? Number(v) : null)}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Mínima" />
                            </SelectTrigger>
                            <SelectContent>
                                {REPS_OPTIONS.map((n) => (
                                    <SelectItem key={n} value={n.toString()}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={repetitionsMax?.toString() ?? ''}
                            onValueChange={(v) => setRepetitionsMax(v ? Number(v) : null)}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Máxima" />
                            </SelectTrigger>
                            <SelectContent>
                                {REPS_OPTIONS.map((n) => (
                                    <SelectItem key={n} value={n.toString()}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Carga */}
                <div className="space-y-3">
                    <label className="text-foreground text-sm font-medium">Carga (kg)</label>
                    <div className="flex gap-3">
                        <Select
                            value={loadMin?.toString() ?? ''}
                            onValueChange={(v) => setLoadMin(v ? Number(v) : null)}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Mínima" />
                            </SelectTrigger>
                            <SelectContent>
                                {LOAD_OPTIONS.map((n) => (
                                    <SelectItem key={n} value={n.toString()}>
                                        {n}kg
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={loadMax?.toString() ?? ''}
                            onValueChange={(v) => setLoadMax(v ? Number(v) : null)}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Máxima" />
                            </SelectTrigger>
                            <SelectContent>
                                {LOAD_OPTIONS.map((n) => (
                                    <SelectItem key={n} value={n.toString()}>
                                        {n}kg
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Repouso */}
                <div className="space-y-3">
                    <label className="text-foreground text-sm font-medium">Repouso</label>
                    <Select
                        value={restTime?.toString() ?? ''}
                        onValueChange={(v) => setRestTime(v ? Number(v) : null)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                            {REST_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value.toString()}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Orientações */}
                <div className="space-y-3">
                    <label className="text-foreground text-sm font-medium">
                        Orientações adicionais
                    </label>
                    <Textarea
                        placeholder="Descreva orientações específicas para este exercício..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>
            </div>

            <div className="border-border flex gap-3 border-t p-4">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                    Cancelar
                </Button>
                <Button className="flex-1" onClick={handleApply}>
                    Aplicar
                </Button>
            </div>
        </div>
    );
}
