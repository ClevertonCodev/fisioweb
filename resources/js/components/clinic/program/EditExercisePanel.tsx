import { X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ProgramExercise } from '@/domain/clinic';
import { cn } from '@/lib/utils';

interface EditExercisePanelProps {
    exercise: ProgramExercise;
    onSave: (updated: ProgramExercise) => void;
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

export function EditExercisePanel({
    exercise,
    onSave,
    onClose,
}: EditExercisePanelProps) {
    const [days, setDays] = useState<number[]>(exercise.days);
    const [allDays, setAllDays] = useState(days.length === 7);
    const [period, setPeriod] = useState<'manha' | 'tarde' | 'noite' | null>(
        exercise.period,
    );
    const [seriesMin, setSeriesMin] = useState<number | null>(
        exercise.seriesMin,
    );
    const [seriesMax, setSeriesMax] = useState<number | null>(
        exercise.seriesMax,
    );
    const [repetitionsMin, setRepetitionsMin] = useState<number | null>(
        exercise.repetitionsMin ?? null,
    );
    const [repetitionsMax, setRepetitionsMax] = useState<number | null>(
        exercise.repetitionsMax ?? null,
    );
    const [loadMin, setLoadMin] = useState<number | null>(
        exercise.loadMin ?? null,
    );
    const [loadMax, setLoadMax] = useState<number | null>(
        exercise.loadMax ?? null,
    );
    const [restTime, setRestTime] = useState<number | null>(
        exercise.restTime ?? null,
    );
    const [notes, setNotes] = useState<string>(exercise.notes ?? '');

    const toggleDay = (day: number) => {
        setDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
        );
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
            seriesMin,
            seriesMax,
            repetitionsMin,
            repetitionsMax,
            loadMin,
            loadMax,
            restTime,
            notes: notes.trim() || null,
            isConfigured: true,
        });
    };

    return (
        <div className="flex h-full w-80 flex-col border-l border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                    Editar exercício
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 space-y-6 overflow-auto p-4">
                {/* Days */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                        Dias da semana
                    </label>
                    <div className="flex gap-2">
                        {DAYS.map((day) => (
                            <button
                                key={day.value}
                                onClick={() => toggleDay(day.value)}
                                className={cn(
                                    'h-9 w-9 rounded-md border text-sm font-medium transition-colors',
                                    days.includes(day.value)
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-background text-foreground hover:border-muted-foreground',
                                )}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="all-days"
                            checked={allDays}
                            onCheckedChange={(v) => handleAllDays(v === true)}
                        />
                        <label
                            htmlFor="all-days"
                            className="cursor-pointer text-sm text-foreground"
                        >
                            Todos os dias
                        </label>
                    </div>
                </div>

                {/* Period */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                        Período
                    </label>
                    <div className="flex gap-2">
                        {(['manha', 'tarde', 'noite'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() =>
                                    setPeriod(period === p ? null : p)
                                }
                                className={cn(
                                    'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                                    period === p
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-background text-foreground hover:border-muted-foreground',
                                )}
                            >
                                {p === 'manha'
                                    ? 'Manhã'
                                    : p === 'tarde'
                                      ? 'Tarde'
                                      : 'Noite'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Series */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                        Séries
                    </label>
                    <div className="flex gap-3">
                        <Select
                            value={seriesMin?.toString() ?? ''}
                            onValueChange={(v) =>
                                setSeriesMin(v ? Number(v) : null)
                            }
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
                            value={seriesMax?.toString() ?? ''}
                            onValueChange={(v) =>
                                setSeriesMax(v ? Number(v) : null)
                            }
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

                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                        Repetições
                    </label>
                    <div className="flex gap-3">
                        <Input
                            type="number"
                            placeholder="Mínima"
                            value={repetitionsMin ?? ''}
                            onChange={(e) =>
                                setRepetitionsMin(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Máxima"
                            value={repetitionsMax ?? ''}
                            onChange={(e) =>
                                setRepetitionsMax(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                        Carga (kg)
                    </label>
                    <div className="flex gap-3">
                        <Input
                            type="number"
                            placeholder="Mínima"
                            value={loadMin ?? ''}
                            onChange={(e) =>
                                setLoadMin(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Máxima"
                            value={loadMax ?? ''}
                            onChange={(e) =>
                                setLoadMax(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                        Repouso
                    </label>
                    <Select
                        value={restTime?.toString() ?? ''}
                        onValueChange={(v) => setRestTime(v ? Number(v) : null)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecionar tempo..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15">15s</SelectItem>
                            <SelectItem value="30">30s</SelectItem>
                            <SelectItem value="45">45s</SelectItem>
                            <SelectItem value="60">60s</SelectItem>
                            <SelectItem value="90">90s</SelectItem>
                            <SelectItem value="120">120s</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
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

            <div className="flex gap-3 border-t border-border p-4">
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
