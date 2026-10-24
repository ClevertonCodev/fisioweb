import { History, LayoutTemplate, PenLine } from 'lucide-react';
import type { ReactNode } from 'react';

import type { EvolutionSheetBlock } from '@/application/clinic/evolution-sheet-text';
import { DsButton, dsCn, DsInput, DsSelect } from '@/components/ds';

import type { EvolutionComposer, EvolutionMode } from './shared';

export function TitleField({ c }: { c: EvolutionComposer }) {
    return (
        <DsInput
            label="Título da sessão"
            value={c.title}
            onValueChange={c.setTitle}
            state={c.titleError ? 'error' : 'default'}
            helper={c.titleError ? 'Dê um título para a sessão.' : undefined}
        />
    );
}

export function ModeSwitch({ c }: { c: EvolutionComposer }) {
    const options: { key: EvolutionMode; label: string; icon: ReactNode }[] = [
        { key: 'template', label: 'Com modelo', icon: <LayoutTemplate /> },
        { key: 'free', label: 'Texto livre', icon: <PenLine /> },
    ];
    return (
        <div
            role="radiogroup"
            aria-label="Como registrar"
            className="flex w-fit gap-1 rounded-ds-lg bg-ds-surface-subtle p-1"
        >
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    role="radio"
                    aria-checked={c.mode === o.key}
                    onClick={() => c.setMode(o.key)}
                    className={dsCn(
                        'flex cursor-pointer items-center gap-2 rounded-ds-md px-3 py-1.5 text-ds-body-xs transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0 [&_svg]:size-4',
                        c.mode === o.key
                            ? 'bg-ds-surface-default font-medium text-ds-content-primary shadow-ds-xs'
                            : 'text-ds-content-secondary hover:text-ds-content-primary',
                    )}
                >
                    {o.icon}
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function TemplateSelect({ c }: { c: EvolutionComposer }) {
    if (c.mode !== 'template' || c.templates.length === 0) return null;
    return (
        <DsSelect
            label="Modelo"
            size="sm"
            value={c.template?.id ?? ''}
            options={c.templates.map((t) => ({
                value: t.id,
                label: t.name,
            }))}
            onValueChange={(value) => {
                const id = Number(Array.isArray(value) ? value[0] : value);
                if (!Number.isNaN(id)) c.pickTemplate(id);
            }}
        />
    );
}

export function RepeatLastButton({ c }: { c: EvolutionComposer }) {
    if (!c.last) return null;
    const date = new Date(
        c.last.signedAt ?? c.last.createdAt,
    ).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return (
        <DsButton
            size="sm"
            variant="secondary"
            iconPosition="left"
            icon={<History />}
            label={`Repetir a sessão de ${date}`}
            onClick={c.repeatLast}
        />
    );
}

export function TextBlocks({
    blocks,
    className,
    compact = false,
}: {
    blocks: EvolutionSheetBlock[];
    className?: string;
    compact?: boolean;
}) {
    return (
        <div
            className={dsCn(
                'flex flex-col',
                compact ? 'gap-1.5' : 'gap-3',
                className,
            )}
        >
            {blocks.map((b) => (
                <div key={b.section}>
                    <p
                        className={dsCn(
                            'font-semibold',
                            compact &&
                                'text-ds-caption text-ds-content-secondary',
                        )}
                    >
                        {b.section}:
                    </p>
                    {b.lines.map((l) => (
                        <p
                            key={l}
                            className={dsCn(
                                compact &&
                                    'text-ds-caption text-ds-content-muted',
                            )}
                        >
                            {l}
                        </p>
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SaveButtons({ c }: { c: EvolutionComposer }) {
    return (
        <div className="flex w-full items-center gap-3">
            <p className="mr-auto hidden text-ds-caption text-ds-content-muted sm:block">
                Assinada, a evolução não muda mais.
            </p>
            <DsButton
                variant="secondary"
                label="Salvar rascunho"
                loading={c.saving}
                disabled={c.saving || c.loading}
                onClick={() => void c.save(false)}
            />
            <DsButton
                label="Assinar e salvar"
                loading={c.saving}
                disabled={c.saving || c.loading}
                onClick={() => void c.save(true)}
            />
        </div>
    );
}
