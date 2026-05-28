import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useEvolutionTemplate,
    useUpdateEvolutionTemplate,
} from '@/application/clinic/use-evolutions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { TemplatePreview } from '@/components/clinic/evolution-template/TemplatePreview';
import { TemplateSectionBuilder } from '@/components/clinic/evolution-template/TemplateSectionBuilder';
import type { DraftSection } from '@/components/clinic/evolution-template/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { EvolutionTemplate } from '@/domain/clinic';

function validate(name: string, sections: DraftSection[]): string | null {
    if (!name.trim()) return 'Informe o nome do template.';
    if (sections.length === 0) return 'Adicione ao menos uma seção.';

    for (const section of sections) {
        if (!section.title.trim()) return 'Todas as seções precisam de título.';
        if (section.items.length === 0) return 'Cada seção precisa ter ao menos um item.';
        for (const item of section.items) {
            if (!item.label.trim()) return 'Todos os itens precisam de rótulo.';
            if (!item.printText.trim()) return 'Todos os itens precisam de texto para impressão.';
        }
    }

    return null;
}

export default function EvolutionTemplateEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const updateTemplate = useUpdateEvolutionTemplate();
    const { data: template, isLoading } = useEvolutionTemplate(id ?? '');

    if (!id) {
        return (
            <ClinicLayout>
                <div className="p-6">
                    <p className="text-destructive text-sm">Template inválido.</p>
                </div>
            </ClinicLayout>
        );
    }

    if (isLoading || !template) {
        return (
            <ClinicLayout>
                <div className="space-y-4 p-6">
                    <Skeleton className="h-8 w-80" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </ClinicLayout>
        );
    }

    return (
        <ClinicLayout>
            <EvolutionTemplateEditForm
                template={template}
                isPending={updateTemplate.isPending}
                onBack={() => navigate(-1)}
                onSubmit={async (dto) => {
                    await updateTemplate.mutateAsync({ id, dto });
                    navigate('/clinica/templates/evolucoes');
                }}
            />
        </ClinicLayout>
    );
}

interface EvolutionTemplateEditFormProps {
    template: EvolutionTemplate;
    isPending: boolean;
    onBack: () => void;
    onSubmit: (dto: {
        name: string;
        description: string | null;
        isActive: boolean;
        sections: {
            title: string;
            sortOrder: number;
            items: {
                label: string;
                printText: string;
                hasFreeText: boolean;
                freeTextPlaceholder: string | null;
                sortOrder: number;
            }[];
        }[];
    }) => Promise<void>;
}

function EvolutionTemplateEditForm({
    template,
    isPending,
    onBack,
    onSubmit,
}: EvolutionTemplateEditFormProps) {
    const [name, setName] = useState(template.name);
    const [description, setDescription] = useState(template.description ?? '');
    const [sections, setSections] = useState<DraftSection[]>(
        template.sections.map((section) => ({
            _key: crypto.randomUUID(),
            title: section.title,
            items: section.items.map((item) => ({
                _key: crypto.randomUUID(),
                label: item.label,
                printText: item.printText,
                hasFreeText: item.hasFreeText,
                freeTextPlaceholder: item.freeTextPlaceholder ?? '',
            })),
        })),
    );
    const [error, setError] = useState<string | null>(null);

    const isReadOnly = template.isSystem;

    const handleSubmit = async () => {
        if (isReadOnly) return;

        const validationError = validate(name, sections);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);

        await onSubmit({
            name: name.trim(),
            description: description.trim() ? description.trim() : null,
            isActive: template.isActive,
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
    };

    return (
        <div className="space-y-6 p-6">
            <div className="space-y-3">
                <Button type="button" variant="ghost" className="w-fit" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">
                        {isReadOnly ? 'Visualizar template' : 'Editar template'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {isReadOnly
                            ? 'Templates do sistema são somente leitura.'
                            : 'Atualize as seções e itens do template.'}
                    </p>
                </div>
            </div>

            {isReadOnly && (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Este template pertence ao sistema e não pode ser alterado.
                </div>
            )}

            <div className="grid gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome do template"
                        disabled={isReadOnly}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Opcional"
                        className="min-h-24"
                        disabled={isReadOnly}
                    />
                </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <TemplateSectionBuilder
                sections={sections}
                onChange={setSections}
                readOnly={isReadOnly}
            />
            <TemplatePreview sections={sections} />

            {!isReadOnly && (
                <Button onClick={handleSubmit} disabled={isPending}>
                    {isPending ? 'Salvando...' : 'Salvar template'}
                </Button>
            )}
        </div>
    );
}
