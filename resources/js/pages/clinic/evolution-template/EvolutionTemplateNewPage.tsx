import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateEvolutionTemplate } from '@/application/clinic/use-evolutions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { TemplatePreview } from '@/components/clinic/evolution-template/TemplatePreview';
import { TemplateSectionBuilder } from '@/components/clinic/evolution-template/TemplateSectionBuilder';
import type { DraftSection } from '@/components/clinic/evolution-template/types';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/PrototypeSwitcher';

import EditorPrototype from './evolution-template-prototype/EditorPrototype';
import { EDITOR_VARIANTS } from './evolution-template-prototype/shared';

function createInitialSections(): DraftSection[] {
    return [
        {
            _key: crypto.randomUUID(),
            title: '',
            items: [
                {
                    _key: crypto.randomUUID(),
                    label: '',
                    printText: '',
                    hasFreeText: false,
                    freeTextPlaceholder: '',
                },
            ],
        },
    ];
}

function validate(name: string, sections: DraftSection[]): string | null {
    if (!name.trim()) return 'Informe o nome do template.';
    if (sections.length === 0) return 'Adicione ao menos uma seção.';

    for (const section of sections) {
        if (!section.title.trim()) return 'Todas as seções precisam de título.';
        if (section.items.length === 0)
            return 'Cada seção precisa ter ao menos um item.';
        for (const item of section.items) {
            if (!item.label.trim()) return 'Todos os itens precisam de rótulo.';
            if (!item.printText.trim())
                return 'Todos os itens precisam de texto para impressão.';
        }
    }

    return null;
}

/**
 * PROTÓTIPO: em desenvolvimento, ?variant= troca a tela pela do DS v2
 * (evolution-template-prototype); O = esta tela. Desligado nos testes (o
 * Vitest roda com DEV ligado).
 */
const PROTOTYPE = import.meta.env.DEV && import.meta.env.MODE !== 'test';

export default function EvolutionTemplateNewPage() {
    const variant = usePrototypeVariant(EDITOR_VARIANTS, 'A');
    if (PROTOTYPE && variant !== 'O') {
        return <EditorPrototype variant={variant} />;
    }
    return <EvolutionTemplateNewPageV1 />;
}

function EvolutionTemplateNewPageV1() {
    const navigate = useNavigate();
    const createTemplate = useCreateEvolutionTemplate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [sections, setSections] = useState<DraftSection[]>(
        createInitialSections,
    );
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        const validationError = validate(name, sections);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);

        await createTemplate.mutateAsync({
            name: name.trim(),
            description: description.trim() ? description.trim() : null,
            sections: sections.map((section, sectionIndex) => ({
                title: section.title.trim(),
                sortOrder: sectionIndex,
                items: section.items.map((item, itemIndex) => ({
                    label: item.label.trim(),
                    printText: item.printText.trim(),
                    hasFreeText: item.hasFreeText,
                    freeTextPlaceholder: item.hasFreeText
                        ? item.freeTextPlaceholder.trim() || null
                        : null,
                    sortOrder: itemIndex,
                })),
            })),
        });

        navigate('/clinica/templates/evolucoes');
    }

    return (
        <ClinicLayout>
            <div className="space-y-6 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Novo template de evolução
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Crie um template com seções e itens para reutilizar
                            nas evoluções.
                        </p>
                    </div>
                    <BackButton
                        onClick={() => navigate(-1)}
                        className="w-fit shrink-0"
                    />
                </div>

                <div className="grid gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nome</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex.: Evolução ortopédica"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descrição</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Opcional"
                            className="min-h-24"
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <TemplateSectionBuilder
                    sections={sections}
                    onChange={setSections}
                />
                <TemplatePreview sections={sections} />

                <Button
                    onClick={handleSubmit}
                    disabled={createTemplate.isPending}
                >
                    {createTemplate.isPending
                        ? 'Salvando...'
                        : 'Salvar template'}
                </Button>
            </div>
            {PROTOTYPE && (
                <PrototypeSwitcher variants={EDITOR_VARIANTS} current="O" />
            )}
        </ClinicLayout>
    );
}
