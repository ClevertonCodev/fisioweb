/**
 * PROTÓTIPO (descartável): criar e editar modelo de evolução no DS v2, nas
 * rotas reais /clinica/templates/evolucoes/novo e /:id/editar, trocadas
 * por ?variant= (O = v1).
 *
 * A, "Montar e ver ao vivo", é a escolhida (B, escrever como roteiro, não
 * foi commitada). O modelo do
 * sistema (id 1) vem da API e, como não se edita, salvar criaria uma cópia
 * da clínica; /exemplo1 a /exemplo3 abrem os exemplos fixos. Salvar é stub.
 */
import { ArrowLeft, CircleAlert, Copy, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useEvolutionTemplate } from '@/application/clinic/use-evolutions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsAlert, DsButton, DsEmptyState } from '@/components/ds';
import type { EvolutionTemplate } from '@/domain/clinic';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { EditorA } from './EditorA';
import { DEMO_TEMPLATES, EDITOR_VARIANTS, useTemplateDraft } from './shared';

function Editor({ template }: { template: EvolutionTemplate | null }) {
    const navigate = useNavigate();
    const d = useTemplateDraft(template);
    const system = template?.isSystem ?? false;

    return (
        <div className="flex h-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 py-6 lg:px-8">
                    <header className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                navigate('/clinica/templates/evolucoes')
                            }
                            className="flex w-fit cursor-pointer items-center gap-1.5 text-ds-body-xs text-ds-content-secondary hover:text-ds-content-brand ds-dark:hover:text-ds-primary-60"
                        >
                            <ArrowLeft className="size-4" />
                            Modelos de evolução
                        </button>
                        <h1 className="text-ds-h4 font-semibold">
                            {template ? d.name || template.name : 'Novo modelo'}
                        </h1>
                    </header>
                    {system && (
                        <DsAlert variant="info" title="Modelo do sistema">
                            Ele é igual para todas as clínicas e não muda. Ao
                            salvar, vira uma cópia da sua clínica, e o original
                            continua aqui.
                        </DsAlert>
                    )}
                    <EditorA d={d} />
                </div>
            </div>
            <footer className="flex flex-wrap items-center gap-3 border-t border-ds-border-subtle bg-ds-surface-default px-4 py-3 lg:px-8">
                <p className="flex min-w-0 flex-1 items-center gap-1.5 text-ds-caption text-ds-content-secondary">
                    {d.problems.length > 0 ? (
                        <>
                            <CircleAlert className="size-4 shrink-0 text-ds-status-danger-content" />
                            <span className="truncate">
                                {d.problems[0]}
                                {d.problems.length > 1 &&
                                    ` (+${d.problems.length - 1})`}
                            </span>
                        </>
                    ) : (
                        <span className="font-ds-mono">
                            {d.sections.length} seções · {d.itemTotal} itens
                        </span>
                    )}
                </p>
                <DsButton
                    variant="secondary"
                    label="Cancelar"
                    onClick={() => navigate('/clinica/templates/evolucoes')}
                />
                <DsButton
                    iconPosition="left"
                    icon={system ? <Copy /> : <Save />}
                    label={system ? 'Salvar como cópia' : 'Salvar'}
                    onClick={d.save}
                />
            </footer>
        </div>
    );
}

function Load() {
    const { id } = useParams();
    const demo = id?.startsWith('exemplo')
        ? DEMO_TEMPLATES.find((t) => t.id === -Number(id.slice(7)))
        : undefined;
    const real = useEvolutionTemplate(
        id && !id.startsWith('exemplo') ? id : '',
    );

    if (!id) return <Editor key="novo" template={null} />;
    if (demo) return <Editor key={id} template={demo} />;
    if (real.isLoading)
        return <div className="h-full animate-pulse bg-ds-surface-body" />;
    if (!real.data) {
        return (
            <div className="flex h-full items-center justify-center bg-ds-surface-body font-ds">
                <DsEmptyState
                    title="Modelo não encontrado"
                    description="Ele pode ser de outra clínica ou ter sido excluído."
                />
            </div>
        );
    }
    return <Editor key={id} template={real.data} />;
}

export default function EditorPrototype({ variant }: { variant: string }) {
    return (
        <ClinicLayout>
            <Load />
            <PrototypeSwitcher variants={EDITOR_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
