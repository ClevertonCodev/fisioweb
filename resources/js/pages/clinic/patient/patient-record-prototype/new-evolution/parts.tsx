/** PROTÓTIPO (descartável): peças comuns às variantes da nova evolução. */
import { History, LayoutTemplate, PenLine } from 'lucide-react';

import { DsButton, dsCn, DsInput } from '@/components/ds';

import type { EvolutionComposer, Mode, TextBlock } from './shared';

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

/** Modelo × texto livre como um seletor, sem a tela de escolha da v1. */
export function ModeSwitch({ c }: { c: EvolutionComposer }) {
    const options: { key: Mode; label: string; icon: React.ReactNode }[] = [
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

/** O texto que vai para o prontuário, com o título de cada seção em negrito. */
export function TextBlocks({
    blocks,
    className,
}: {
    blocks: TextBlock[];
    className?: string;
}) {
    return (
        <div className={dsCn('flex flex-col gap-3', className)}>
            {blocks.map((b) => (
                <div key={b.section}>
                    <p className="font-semibold">{b.section}:</p>
                    {b.lines.map((l) => (
                        <p key={l}>{l}</p>
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
                onClick={() => c.save(false)}
            />
            <DsButton label="Assinar e salvar" onClick={() => c.save(true)} />
        </div>
    );
}
