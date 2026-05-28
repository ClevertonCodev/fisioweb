import { ArrowUpDown, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    useDeleteEvolutionTemplate,
    useEvolutionTemplates,
    useUpdateEvolutionTemplate,
} from '@/application/clinic/use-evolutions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { EvolutionTemplate } from '@/domain/clinic';
import { apiClinicEvolutionsRepository } from '@/infrastructure/repositories/api-clinic-evolutions';

type Filter = 'all' | 'system' | 'custom';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'system', label: 'Sistema' },
    { key: 'custom', label: 'Personalizados' },
];

function sectionCountLabel(template: EvolutionTemplate): string {
    return template.sections?.length ? String(template.sections.length) : '—';
}

function itemCountLabel(template: EvolutionTemplate): string {
    if (!template.sections?.length) return '—';
    const total = template.sections.reduce((sum, section) => sum + section.items.length, 0);
    return String(total);
}

function toTemplateWriteDto(template: EvolutionTemplate, nextIsActive: boolean) {
    return {
        name: template.name,
        description: template.description,
        isActive: nextIsActive,
        sections: template.sections.map((section, sectionIndex) => ({
            title: section.title,
            sortOrder: sectionIndex,
            items: section.items.map((item, itemIndex) => ({
                label: item.label,
                printText: item.printText,
                hasFreeText: item.hasFreeText,
                freeTextPlaceholder: item.freeTextPlaceholder,
                sortOrder: itemIndex,
            })),
        })),
    };
}

export default function EvolutionTemplateListPage() {
    const navigate = useNavigate();
    const { data: templates } = useEvolutionTemplates();
    const updateTemplate = useUpdateEvolutionTemplate();
    const deleteTemplate = useDeleteEvolutionTemplate();

    const [activeFilter, setActiveFilter] = useState<Filter>('all');
    const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<EvolutionTemplate | null>(null);

    const filteredTemplates = useMemo(() => {
        const allTemplates = templates ?? [];
        if (activeFilter === 'system') return allTemplates.filter((template) => template.isSystem);
        if (activeFilter === 'custom') return allTemplates.filter((template) => !template.isSystem);
        return allTemplates;
    }, [activeFilter, templates]);

    async function handleToggleActive(template: EvolutionTemplate) {
        const templateId = String(template.id);
        setDeactivatingId(templateId);
        try {
            const full = await apiClinicEvolutionsRepository.findTemplate(templateId);
            await updateTemplate.mutateAsync({
                id: templateId,
                dto: toTemplateWriteDto(full, !full.isActive),
            });
        } finally {
            setDeactivatingId(null);
        }
    }

    return (
        <ClinicLayout>
            <div className="space-y-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Templates de evolução</h1>
                        <p className="text-muted-foreground text-sm">
                            Gerencie templates do sistema e personalizados da clínica.
                        </p>
                    </div>
                    <Button onClick={() => navigate('/clinica/templates/evolucoes/novo')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo template
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {FILTERS.map((filter) => (
                        <Button
                            key={filter.key}
                            variant={activeFilter === filter.key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveFilter(filter.key)}
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Seções</TableHead>
                                <TableHead>Itens</TableHead>
                                <TableHead>Ativo</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTemplates.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-muted-foreground py-10 text-center"
                                    >
                                        Nenhum template encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredTemplates.map((template) => {
                                const templateId = String(template.id);
                                const isToggling =
                                    deactivatingId === templateId || updateTemplate.isPending;
                                return (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">
                                            {template.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    template.isSystem ? 'secondary' : 'outline'
                                                }
                                            >
                                                {template.isSystem ? 'Sistema' : 'Personalizado'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{sectionCountLabel(template)}</TableCell>
                                        <TableCell>{itemCountLabel(template)}</TableCell>
                                        <TableCell>{template.isActive ? 'Sim' : 'Não'}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                {template.isSystem ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            navigate(
                                                                `/clinica/templates/evolucoes/${template.id}/editar`,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="mr-1 h-4 w-4" />
                                                        Ver
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/clinica/templates/evolucoes/${template.id}/editar`,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="mr-1 h-4 w-4" />
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isToggling}
                                                            onClick={() =>
                                                                handleToggleActive(template)
                                                            }
                                                        >
                                                            <ArrowUpDown className="mr-1 h-4 w-4" />
                                                            {template.isActive
                                                                ? 'Desativar'
                                                                : 'Ativar'}
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={deleteTemplate.isPending}
                                                            onClick={() =>
                                                                setTemplateToDelete(template)
                                                            }
                                                        >
                                                            <Trash2 className="mr-1 h-4 w-4" />
                                                            Excluir
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog
                open={templateToDelete != null}
                onOpenChange={(open) => {
                    if (!open) setTemplateToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O template será removido
                            permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async (event) => {
                                event.preventDefault();
                                if (!templateToDelete) return;
                                await deleteTemplate.mutateAsync(String(templateToDelete.id));
                                setTemplateToDelete(null);
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ClinicLayout>
    );
}
