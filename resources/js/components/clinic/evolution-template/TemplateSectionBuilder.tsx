import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

import type { DraftItem, DraftSection } from './types';

interface TemplateSectionBuilderProps {
    sections: DraftSection[];
    onChange: (sections: DraftSection[]) => void;
    readOnly?: boolean;
}

function createDraftItem(): DraftItem {
    return {
        _key: crypto.randomUUID(),
        label: '',
        printText: '',
        hasFreeText: false,
        freeTextPlaceholder: '',
    };
}

function createDraftSection(): DraftSection {
    return {
        _key: crypto.randomUUID(),
        title: '',
        items: [createDraftItem()],
    };
}

export function moveUp<T>(arr: T[], i: number): T[] {
    if (i <= 0 || i >= arr.length) return arr;
    const next = [...arr];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    return next;
}

export function moveDown<T>(arr: T[], i: number): T[] {
    if (i < 0 || i >= arr.length - 1) return arr;
    const next = [...arr];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    return next;
}

export function TemplateSectionBuilder({
    sections,
    onChange,
    readOnly = false,
}: TemplateSectionBuilderProps) {
    const setSection = (sectionIndex: number, updater: (section: DraftSection) => DraftSection) => {
        onChange(
            sections.map((section, idx) => (idx === sectionIndex ? updater(section) : section)),
        );
    };

    return (
        <div className="space-y-4">
            {sections.map((section, sectionIndex) => (
                <Card key={section._key}>
                    <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base">Seção {sectionIndex + 1}</CardTitle>
                            {!readOnly && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => onChange(moveUp(sections, sectionIndex))}
                                        disabled={sectionIndex === 0}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => onChange(moveDown(sections, sectionIndex))}
                                        disabled={sectionIndex === sections.length - 1}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            onChange(
                                                sections.filter((_, idx) => idx !== sectionIndex),
                                            )
                                        }
                                    >
                                        <Trash2 className="mr-1 h-4 w-4" />
                                        Remover seção
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Input
                            value={section.title}
                            onChange={(e) =>
                                setSection(sectionIndex, (current) => ({
                                    ...current,
                                    title: e.target.value,
                                }))
                            }
                            placeholder="Título da seção"
                            disabled={readOnly}
                        />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                            <div key={item._key} className="rounded-md border p-3">
                                <div className="grid gap-3">
                                    <Input
                                        value={item.label}
                                        onChange={(e) =>
                                            setSection(sectionIndex, (current) => ({
                                                ...current,
                                                items: current.items.map((currItem, idx) =>
                                                    idx === itemIndex
                                                        ? { ...currItem, label: e.target.value }
                                                        : currItem,
                                                ),
                                            }))
                                        }
                                        placeholder="Rótulo do item"
                                        disabled={readOnly}
                                    />
                                    <Input
                                        value={item.printText}
                                        onChange={(e) =>
                                            setSection(sectionIndex, (current) => ({
                                                ...current,
                                                items: current.items.map((currItem, idx) =>
                                                    idx === itemIndex
                                                        ? {
                                                              ...currItem,
                                                              printText: e.target.value,
                                                          }
                                                        : currItem,
                                                ),
                                            }))
                                        }
                                        placeholder="Texto para impressão"
                                        disabled={readOnly}
                                    />
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={item.hasFreeText}
                                            onCheckedChange={(checked) =>
                                                setSection(sectionIndex, (current) => ({
                                                    ...current,
                                                    items: current.items.map((currItem, idx) =>
                                                        idx === itemIndex
                                                            ? { ...currItem, hasFreeText: checked }
                                                            : currItem,
                                                    ),
                                                }))
                                            }
                                            disabled={readOnly}
                                        />
                                        <span className="text-sm">Tem campo livre?</span>
                                    </div>
                                    {item.hasFreeText && (
                                        <Input
                                            value={item.freeTextPlaceholder}
                                            onChange={(e) =>
                                                setSection(sectionIndex, (current) => ({
                                                    ...current,
                                                    items: current.items.map((currItem, idx) =>
                                                        idx === itemIndex
                                                            ? {
                                                                  ...currItem,
                                                                  freeTextPlaceholder:
                                                                      e.target.value,
                                                              }
                                                            : currItem,
                                                    ),
                                                }))
                                            }
                                            placeholder="Placeholder do campo livre"
                                            disabled={readOnly}
                                        />
                                    )}
                                    {!readOnly && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    setSection(sectionIndex, (current) => ({
                                                        ...current,
                                                        items: moveUp(current.items, itemIndex),
                                                    }))
                                                }
                                                disabled={itemIndex === 0}
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    setSection(sectionIndex, (current) => ({
                                                        ...current,
                                                        items: moveDown(current.items, itemIndex),
                                                    }))
                                                }
                                                disabled={itemIndex === section.items.length - 1}
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    setSection(sectionIndex, (current) => ({
                                                        ...current,
                                                        items: current.items.filter(
                                                            (_, idx) => idx !== itemIndex,
                                                        ),
                                                    }))
                                                }
                                                disabled={section.items.length === 1}
                                            >
                                                <Trash2 className="mr-1 h-4 w-4" />
                                                Remover item
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {!readOnly && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setSection(sectionIndex, (current) => ({
                                        ...current,
                                        items: [...current.items, createDraftItem()],
                                    }))
                                }
                            >
                                <Plus className="mr-1 h-4 w-4" />
                                Adicionar item
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}

            {!readOnly && (
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onChange([...sections, createDraftSection()])}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar seção
                </Button>
            )}
        </div>
    );
}
