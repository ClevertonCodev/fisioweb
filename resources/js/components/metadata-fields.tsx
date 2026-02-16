import { Plus, X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function keyToDisplay(k: string): string {
    return k.replace(/_/g, ' ');
}

function displayToKey(s: string): string {
    return s
        .trim()
        .replace(/\s+/g, '_');
}

const TECHNICAL_KEYS = [
    'original_name',
    'upload_method',
    'pending_thumbnail_path',
];

const DIFFICULTY_OPTIONS = [
    { value: '', label: 'Selecione' },
    { value: 'facil', label: 'Fácil' },
    { value: 'medio', label: 'Médio' },
    { value: 'dificil', label: 'Difícil' },
];

export interface MetadataFieldsProps {
    value: Record<string, unknown> | null;
    onChange: (value: Record<string, string>) => void;
    onValidationChange?: (hasError: boolean) => void;
}

function metadataToFields(metadata: Record<string, unknown> | null): Record<string, string> {
    if (!metadata || typeof metadata !== 'object') return {};
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(metadata)) {
        if (TECHNICAL_KEYS.includes(k)) continue;
        if (typeof v === 'string') result[k] = v;
        else if (v != null) result[k] = String(v);
    }
    return result;
}

function buildMetadata(fields: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
        const key = displayToKey(k);
        const val = String(v).trim();
        if (key) result[key] = val;
    }
    return result;
}


function getDuplicatedKeysFromDisplayNames(
    entries: Array<[string, string]>,
    displayNames: Record<string, string>,
): Set<string> {
    const normalizedToKeys = new Map<string, string[]>();
    for (const [key] of entries) {
        const display = displayNames[key] ?? (key.startsWith('new_') ? '' : keyToDisplay(key));
        const n = displayToKey(display);
        if (!n) continue;
        if (!normalizedToKeys.has(n)) normalizedToKeys.set(n, []);
        normalizedToKeys.get(n)!.push(key);
    }
    const duplicated = new Set<string>();
    for (const keys of normalizedToKeys.values()) {
        if (keys.length > 1) keys.forEach((k) => duplicated.add(k));
    }
    return duplicated;
}

export function MetadataFields({
    value,
    onChange,
    onValidationChange,
}: MetadataFieldsProps) {
    const [nameInputs, setNameInputs] = React.useState<Record<string, string>>({});
    const nextCustomIdRef = React.useRef(0);
    const fields = metadataToFields(value);
    const description = fields.descricao ?? '';
    const category = fields.categoria ?? '';
    const difficulty = fields.dificuldade ?? '';

    const customEntries = Object.entries(fields).filter(
        ([k]) =>
            !['descricao', 'categoria', 'dificuldade'].includes(k) &&
            !TECHNICAL_KEYS.includes(k),
    );

    const displayNames: Record<string, string> = {};
    for (const [key] of customEntries) {
        displayNames[key] = nameInputs[key] ?? (key.startsWith('new_') ? '' : keyToDisplay(key));
    }

    const duplicatedKeys = getDuplicatedKeysFromDisplayNames(customEntries, displayNames);
    const hasDuplicateNames = duplicatedKeys.size > 0;

    React.useEffect(() => {
        onValidationChange?.(hasDuplicateNames);
        return () => onValidationChange?.(false);
    }, [hasDuplicateNames, onValidationChange]);

    const syncNameInputs = React.useCallback((entries: Array<[string, string]>) => {
        setNameInputs((prev) => {
            const next = { ...prev };
            for (const [key] of entries) {
                if (!(key in next) && !key.startsWith('new_')) {
                    next[key] = keyToDisplay(key);
                }
            }
            return next;
        });
    }, []);

    React.useEffect(() => {
        syncNameInputs(customEntries);
    }, [customEntries, syncNameInputs]);

    const updateField = (key: string, val: string) => {
        const next = { ...fields };
        if (val) next[key] = val;
        else delete next[key];
        onChange(buildMetadata(next));
    };

    const addCustom = () => {
        if (hasDuplicateNames) return;
        const newKey = `new_${nextCustomIdRef.current++}`;
        const next = { ...fields, [newKey]: '' };
        setNameInputs((prev) => ({ ...prev, [newKey]: '' }));
        onChange(buildMetadata(next));
    };

    const updateCustom = (oldKey: string, newKeyDisplay: string, newValue: string) => {
        const storageKey = displayToKey(newKeyDisplay);
        if (!storageKey) {
            const next = { ...fields };
            delete next[oldKey];
            setNameInputs((prev) => {
                const updated = { ...prev };
                delete updated[oldKey];
                return updated;
            });
            onChange(buildMetadata(next));
            return;
        }
        const isOnlyUpdatingValue = displayToKey(oldKey) === storageKey;
        const otherNormalized = Object.keys(fields)
            .filter((k) => k !== oldKey)
            .map((k) => displayToKey(nameInputs[k] ?? (k.startsWith('new_') ? '' : keyToDisplay(k))));
        const isDuplicate = otherNormalized.includes(storageKey);
        if (isOnlyUpdatingValue && duplicatedKeys.has(oldKey)) {
            return;
        }
        if (!isOnlyUpdatingValue && isDuplicate) {
            return;
        }
        const next = { ...fields };
        delete next[oldKey];
        next[storageKey] = newValue.trim();
        setNameInputs((prev) => {
            const updated = { ...prev };
            delete updated[oldKey];
            updated[storageKey] = newKeyDisplay.trim();
            return updated;
        });
        onChange(buildMetadata(next));
    };

    const removeCustom = (key: string) => {
        const next = { ...fields };
        delete next[key];
        setNameInputs((prev) => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
        onChange(buildMetadata(next));
    };

    return (
        <div className="space-y-4">
            <Label>Dados extras</Label>
            <p className="text-xs text-muted-foreground">
                Informações adicionais sobre o vídeo (opcional)
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor="metadata_descricao" className="text-sm font-normal">
                        Descrição
                    </Label>
                    <Input
                        id="metadata_descricao"
                        value={description}
                        onChange={(e) => updateField('descricao', e.target.value)}
                        placeholder="Ex: Alongamento de ombros"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="metadata_categoria" className="text-sm font-normal">
                        Categoria
                    </Label>
                    <Input
                        id="metadata_categoria"
                        value={category}
                        onChange={(e) => updateField('categoria', e.target.value)}
                        placeholder="Ex: alongamento"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="metadata_dificuldade" className="text-sm font-normal">
                        Dificuldade
                    </Label>
                    <select
                        id="metadata_dificuldade"
                        value={difficulty}
                        onChange={(e) => updateField('dificuldade', e.target.value)}
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {DIFFICULTY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {customEntries.map(([key, fieldValue]) => {
                const isDuplicate = duplicatedKeys.has(key);
                return (
                    <div
                        key={key}
                        className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2"
                    >
                        <div className="flex flex-1 flex-col gap-1">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nome (ex: tags)"
                                    value={displayNames[key] ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setNameInputs((prev) => ({
                                            ...prev,
                                            [key]: v,
                                        }));
                                    }}
                                    onBlur={(e) => {
                                        const newKeyDisplay = e.target.value;
                                        const storageKey =
                                            displayToKey(newKeyDisplay);
                                        if (storageKey) {
                                            updateCustom(
                                                key,
                                                newKeyDisplay,
                                                fieldValue,
                                            );
                                        } else if (key.startsWith('new_')) {
                                            removeCustom(key);
                                        }
                                    }}
                                    className={
                                        isDuplicate
                                            ? 'flex-1 border-destructive'
                                            : 'flex-1'
                                    }
                                />
                                <Input
                                    placeholder="Valor"
                                    value={fieldValue}
                                    onChange={(e) =>
                                        updateCustom(key, key, e.target.value)
                                    }
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeCustom(key)}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                            {isDuplicate && (
                                <p className="text-xs text-destructive">
                                    Este nome já existe. Escolha outro.
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={addCustom}
                disabled={hasDuplicateNames}
            >
                <Plus className="size-4" />
                Adicionar outro dado
            </Button>
            {customEntries.some(([k]) => k.startsWith('new_')) &&
                !hasDuplicateNames && (
                <p className="text-xs text-muted-foreground">
                        Preencha o nome e o valor para salvar dados extras.
                </p>
                )}
        </div>
    );
}
