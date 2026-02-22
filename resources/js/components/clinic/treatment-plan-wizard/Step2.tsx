import { ChevronLeft, Copy, Pencil, Plus, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { DAYS, REPS_OPTIONS, SETS_OPTIONS } from './constants';
import { ExerciseRow } from './ExerciseRow';
import { hasConfig } from './helpers';
import type { ExerciseConfig, Group } from './types';

interface Step2Props {
    configs: ExerciseConfig[];
    groups: Group[];
    onUpdateConfigs: (configs: ExerciseConfig[]) => void;
    onUpdateGroups: (groups: Group[]) => void;
    onBack: () => void;
    onAdvance: () => void;
}

export function Step2({ configs, groups, onUpdateConfigs, onUpdateGroups, onBack, onAdvance }: Step2Props) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
    const [groupNameDraft, setGroupNameDraft] = useState('');
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);
    const [defaultGroupName, setDefaultGroupName] = useState('Novo grupo');
    const [editingDefaultGroup, setEditingDefaultGroup] = useState(false);
    const [defaultGroupNameDraft, setDefaultGroupNameDraft] = useState('');

    const editedCount = configs.filter(hasConfig).length;

    const handleDragStart = (i: number) => setDragIndex(i);
    const handleDragOver = (e: React.DragEvent, i: number) => {
        e.preventDefault();
        setDragOver(i);
    };
    const handleDrop = (toIndex: number) => {
        if (dragIndex === null || dragIndex === toIndex) {
            setDragIndex(null);
            setDragOver(null);
            return;
        }
        const next = [...configs];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(toIndex, 0, moved);
        onUpdateConfigs(next.map((c, i) => ({ ...c, sort_order: i })));
        setDragIndex(null);
        setDragOver(null);
    };

    const removeExercise = (i: number) => {
        onUpdateConfigs(configs.filter((_, idx) => idx !== i).map((c, i2) => ({ ...c, sort_order: i2 })));
        if (editingIndex === i) setEditingIndex(null);
    };

    const duplicateExercise = (i: number) => {
        const copy = { ...configs[i], sort_order: configs.length };
        onUpdateConfigs([...configs, copy]);
    };

    const startRenameDefaultGroup = () => {
        setEditingDefaultGroup(true);
        setDefaultGroupNameDraft(defaultGroupName);
    };

    const commitRenameDefaultGroup = () => {
        if (defaultGroupNameDraft.trim()) setDefaultGroupName(defaultGroupNameDraft.trim());
        setEditingDefaultGroup(false);
    };

    const duplicateDefaultGroup = () => {
        const copies = configs.map((c, i) => ({ ...c, sort_order: configs.length + i }));
        onUpdateConfigs([...configs, ...copies]);
    };

    const duplicateGroup = (gi: number) => {
        const groupConfigs = configs.filter((c) => c.group_index === gi || (gi === 0 && c.group_index === null));
        const newGroupIndex = groups.length;
        const newGroup = { name: `${groups[gi].name} (cópia)`, sort_order: newGroupIndex };
        const copies = groupConfigs.map((c, i) => ({ ...c, group_index: newGroupIndex, sort_order: configs.length + i }));
        onUpdateGroups([...groups, newGroup]);
        onUpdateConfigs([...configs, ...copies]);
    };

    const addGroup = () => {
        onUpdateGroups([...groups, { name: `Novo grupo ${groups.length + 1}`, sort_order: groups.length }]);
    };

    const startRenameGroup = (i: number) => {
        setEditingGroupIndex(i);
        setGroupNameDraft(groups[i].name);
    };

    const commitRenameGroup = () => {
        if (editingGroupIndex === null) return;
        const next = groups.map((g, i) => (i === editingGroupIndex ? { ...g, name: groupNameDraft } : g));
        onUpdateGroups(next);
        setEditingGroupIndex(null);
    };

    const updateConfig = useCallback(
        (field: keyof ExerciseConfig, value: unknown) => {
            if (editingIndex === null) return;
            onUpdateConfigs(configs.map((c, i) => (i === editingIndex ? { ...c, [field]: value } : c)));
        },
        [editingIndex, configs, onUpdateConfigs],
    );

    const toggleDay = (day: string) => {
        if (editingIndex === null) return;
        const cfg = configs[editingIndex];
        const days = cfg.days_of_week.includes(day)
            ? cfg.days_of_week.filter((d) => d !== day)
            : [...cfg.days_of_week, day];
        onUpdateConfigs(
            configs.map((c, i) => (i === editingIndex ? { ...c, days_of_week: days, all_days: days.length === 7 } : c)),
        );
    };

    const toggleAllDays = (checked: boolean) => {
        if (editingIndex === null) return;
        onUpdateConfigs(
            configs.map((c, i) =>
                i === editingIndex ? { ...c, all_days: checked, days_of_week: checked ? DAYS.map((d) => d.value) : [] } : c,
            ),
        );
    };

    const editingCfg = editingIndex !== null ? configs[editingIndex] : null;

    return (
        <div className="flex h-full">
            {/* Main config area */}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Voltar
                        </button>
                        <h1 className="text-lg font-semibold">Configurar exercícios</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {editedCount} de {configs.length} editados
                        </span>
                        <Button className="bg-teal-600 text-white hover:bg-teal-700" onClick={onAdvance}>
                            Avançar
                        </Button>
                    </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    <div className="flex justify-start">
                        <Button variant="outline" size="sm" onClick={addGroup} className="gap-2">
                            <Plus className="h-3.5 w-3.5" />
                            Novo grupo
                        </Button>
                    </div>

                    {groups.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <div className="flex items-center gap-2">
                                    {editingDefaultGroup ? (
                                        <input
                                            value={defaultGroupNameDraft}
                                            onChange={(e) => setDefaultGroupNameDraft(e.target.value)}
                                            onBlur={commitRenameDefaultGroup}
                                            onKeyDown={(e) => e.key === 'Enter' && commitRenameDefaultGroup()}
                                            className="h-7 w-40 rounded-md border border-border bg-background px-2 text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <>
                                            <span className="font-medium">{defaultGroupName}</span>
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                                                {configs.length}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={startRenameDefaultGroup}
                                                className="cursor-pointer text-muted-foreground hover:text-foreground"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={duplicateDefaultGroup}
                                    title="Duplicar grupo"
                                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="divide-y divide-border">
                                {configs.map((cfg, i) => (
                                    <ExerciseRow
                                        key={`${cfg.exercise_id}-${i}`}
                                        cfg={cfg}
                                        isEditing={editingIndex === i}
                                        isDragging={dragIndex === i}
                                        isDragOver={dragOver === i}
                                        onEdit={() => setEditingIndex(editingIndex === i ? null : i)}
                                        onRemove={() => removeExercise(i)}
                                        onDuplicate={() => duplicateExercise(i)}
                                        onDragStart={() => handleDragStart(i)}
                                        onDragOver={(e) => handleDragOver(e, i)}
                                        onDrop={() => handleDrop(i)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {groups.map((group, gi) => {
                                const groupConfigs = configs.filter((c) => c.group_index === gi);
                                const ungrouped = gi === 0 ? configs.filter((c) => c.group_index === null) : [];
                                const allInGroup = gi === 0 ? [...groupConfigs, ...ungrouped] : groupConfigs;
                                return (
                                    <div key={gi} className="rounded-xl border border-border bg-card">
                                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {editingGroupIndex === gi ? (
                                                    <Input
                                                        value={groupNameDraft}
                                                        onChange={(e) => setGroupNameDraft(e.target.value)}
                                                        onBlur={commitRenameGroup}
                                                        onKeyDown={(e) => e.key === 'Enter' && commitRenameGroup()}
                                                        className="h-7 w-40 text-sm"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <>
                                                        <span className="font-medium">{group.name}</span>
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                                                            {allInGroup.length}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => startRenameGroup(gi)}
                                                            className="cursor-pointer text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => duplicateGroup(gi)}
                                                title="Duplicar grupo"
                                                className="cursor-pointer text-muted-foreground hover:text-foreground"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="divide-y divide-border">
                                            {allInGroup.map((cfg) => {
                                                const i = configs.indexOf(cfg);
                                                return (
                                                    <ExerciseRow
                                                        key={`${cfg.exercise_id}-${i}`}
                                                        cfg={cfg}
                                                        isEditing={editingIndex === i}
                                                        isDragging={dragIndex === i}
                                                        isDragOver={dragOver === i}
                                                        onEdit={() => setEditingIndex(editingIndex === i ? null : i)}
                                                        onRemove={() => removeExercise(i)}
                                                        onDuplicate={() => duplicateExercise(i)}
                                                        onDragStart={() => handleDragStart(i)}
                                                        onDragOver={(e) => handleDragOver(e, i)}
                                                        onDrop={() => handleDrop(i)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* Right: Edit exercise panel */}
            {editingCfg && (
                <div className="flex w-80 flex-shrink-0 flex-col border-l border-border">
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <h2 className="font-semibold">Editar exercício</h2>
                        <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-5 overflow-y-auto p-4">
                        {/* Dias da semana */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Dias da semana</p>
                            <div className="flex gap-1.5">
                                {DAYS.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={cn(
                                            'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border text-xs font-semibold transition-colors',
                                            editingCfg.days_of_week.includes(day.value)
                                                ? 'border-teal-600 bg-teal-600 text-white'
                                                : 'border-border bg-background text-foreground hover:border-teal-600',
                                        )}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <Checkbox
                                    id="all-days"
                                    checked={editingCfg.all_days}
                                    onCheckedChange={(c) => toggleAllDays(!!c)}
                                    className="cursor-pointer"
                                />
                                <label htmlFor="all-days" className="cursor-pointer text-sm">
                                    Todos os dias
                                </label>
                            </div>
                        </div>

                        {/* Período */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Período</p>
                            <div className="flex gap-2">
                                {[
                                    { value: 'morning', label: 'Manhã' },
                                    { value: 'afternoon', label: 'Tarde' },
                                    { value: 'night', label: 'Noite' },
                                ].map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() =>
                                            updateConfig('period', editingCfg.period === p.value ? '' : p.value)
                                        }
                                        className={cn(
                                            'flex-1 cursor-pointer rounded-lg border py-2 text-sm font-medium transition-colors',
                                            editingCfg.period === p.value
                                                ? 'border-teal-600 bg-teal-600 text-white'
                                                : 'border-border bg-background hover:border-teal-600',
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Séries */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Séries</p>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <select
                                        value={editingCfg.sets_min}
                                        onChange={(e) => updateConfig('sets_min', e.target.value)}
                                        className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Mínima</option>
                                        {SETS_OPTIONS.slice(1).map((v) => (
                                            <option key={v} value={v}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <select
                                        value={editingCfg.sets_max}
                                        onChange={(e) => updateConfig('sets_max', e.target.value)}
                                        className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Máxima</option>
                                        {SETS_OPTIONS.slice(1).map((v) => (
                                            <option key={v} value={v}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Repetições */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Repetições</p>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <select
                                        value={editingCfg.repetitions_min}
                                        onChange={(e) => updateConfig('repetitions_min', e.target.value)}
                                        className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Mínima</option>
                                        {REPS_OPTIONS.slice(1).map((v) => (
                                            <option key={v} value={v}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <select
                                        value={editingCfg.repetitions_max}
                                        onChange={(e) => updateConfig('repetitions_max', e.target.value)}
                                        className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Máxima</option>
                                        {REPS_OPTIONS.slice(1).map((v) => (
                                            <option key={v} value={v}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Observações</p>
                            <Textarea
                                value={editingCfg.notes}
                                onChange={(e) => updateConfig('notes', e.target.value)}
                                placeholder="Instruções específicas para este exercício..."
                                rows={3}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 border-t border-border p-4">
                        <Button variant="outline" className="flex-1" onClick={() => setEditingIndex(null)}>
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-teal-600 text-white hover:bg-teal-700"
                            onClick={() => setEditingIndex(null)}
                        >
                            Aplicar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
