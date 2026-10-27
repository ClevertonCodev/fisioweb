/** PROTÓTIPO (descartável): "experimentar" um modelo de evolução. */
import { Check } from 'lucide-react';
import { useState } from 'react';

import { dsCn, DsInput } from '@/components/ds';

import { lineOf } from './shared';

export interface TryItem {
    key: string;
    label: string;
    printText: string;
    hasFreeText: boolean;
    placeholder: string;
}
export interface TrySection {
    key: string;
    title: string;
    items: TryItem[];
}

/**
 * O modelo como o fisioterapeuta usa na evolução: tocar nos itens monta o
 * texto do prontuário embaixo, ao vivo. Serve de prévia na lista e no editor.
 */
export function TryTemplate({
    sections,
    compact,
}: {
    sections: TrySection[];
    compact?: boolean;
}) {
    const [on, setOn] = useState<Record<string, boolean>>({});
    const [free, setFree] = useState<Record<string, string>>({});
    const picked = sections
        .map((s) => ({
            s,
            items: s.items.filter((i) => on[i.key] && i.printText.trim()),
        }))
        .filter((x) => x.items.length);

    return (
        <div className="flex flex-col gap-4">
            {sections.map((s) => (
                <div key={s.key} className="flex flex-col gap-2">
                    <p className="text-ds-eyebrow text-ds-content-muted uppercase">
                        {s.title || 'Seção sem título'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {s.items.map((i) => (
                            <button
                                key={i.key}
                                type="button"
                                aria-pressed={!!on[i.key]}
                                onClick={() =>
                                    setOn({ ...on, [i.key]: !on[i.key] })
                                }
                                className={dsCn(
                                    'flex cursor-pointer items-center gap-1 rounded-ds-pill border px-3 py-1 text-ds-caption transition-colors',
                                    on[i.key]
                                        ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-40'
                                        : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-strong',
                                )}
                            >
                                {on[i.key] && <Check className="size-3.5" />}
                                {i.label || 'Item sem nome'}
                            </button>
                        ))}
                    </div>
                    {!compact &&
                        s.items
                            .filter((i) => on[i.key] && i.hasFreeText)
                            .map((i) => (
                                <DsInput
                                    key={i.key}
                                    size="sm"
                                    aria-label={i.label}
                                    placeholder={`${i.label}: ${i.placeholder || 'complemento'}`}
                                    value={free[i.key] ?? ''}
                                    onValueChange={(v) =>
                                        setFree({ ...free, [i.key]: v })
                                    }
                                />
                            ))}
                </div>
            ))}
            <div className="rounded-ds-lg border border-dashed border-ds-border-default bg-ds-surface-subtle p-3">
                <p className="mb-1.5 text-ds-eyebrow text-ds-content-muted uppercase">
                    Vai para o prontuário
                </p>
                {picked.length === 0 ? (
                    <p className="text-ds-caption text-ds-content-muted italic">
                        Toque nos itens acima para ver o texto.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3 text-ds-body-xs">
                        {picked.map(({ s, items }) => (
                            <div key={s.key}>
                                <p className="font-semibold">{s.title}:</p>
                                {items.map((i) => (
                                    <p key={i.key}>{lineOf(i, free[i.key])}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
