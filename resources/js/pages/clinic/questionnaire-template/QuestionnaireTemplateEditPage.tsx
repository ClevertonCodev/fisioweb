import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
    useDeleteQuestionnaireTemplate,
    useQuestionnaireTemplate,
    useUpdateQuestionnaireTemplate,
} from '@/application/clinic/use-questionnaire-templates';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { QuestionnaireSectionBuilder } from '@/components/clinic/questionnaire-template/QuestionnaireSectionBuilder';
import type { DraftSection } from '@/components/clinic/questionnaire-template/types';
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
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { QuestionnaireTemplate } from '@/domain/clinic';

function validate(title: string, sections: DraftSection[]): string | null {
    if (!title.trim()) return 'Informe o título do questionário.';
    if (sections.length === 0) return 'Adicione ao menos uma seção.';
    for (const section of sections) {
        if (!section.title.trim()) return 'Todas as seções precisam de título.';
        if (section.questions.length === 0)
            return 'Cada seção precisa ter ao menos uma pergunta.';
        for (const question of section.questions) {
            if (!question.label.trim())
                return 'Todas as perguntas precisam de enunciado.';
            if (
                (question.type === 'multiple_choice' ||
                    question.type === 'checkbox') &&
                question.options.some((o) => !o.trim())
            ) {
                return 'Preencha todas as opções ou remova as vazias.';
            }
        }
    }
    return null;
}

function templateToDraftSections(
    template: QuestionnaireTemplate,
): DraftSection[] {
    return template.sections.map((s) => ({
        _key: crypto.randomUUID(),
        title: s.title,
        questions: s.questions.map((q) => ({
            _key: crypto.randomUUID(),
            label: q.label,
            type: q.type,
            options: q.options ?? [],
            scaleMin: q.scaleMin,
            scaleMax: q.scaleMax,
            required: q.required,
        })),
    }));
}

export default function QuestionnaireTemplateEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data: template, isLoading } = useQuestionnaireTemplate(id ?? '');
    const updateTemplate = useUpdateQuestionnaireTemplate();
    const deleteTemplate = useDeleteQuestionnaireTemplate();

    const goBack = () => navigate(returnTo ?? (-1 as unknown as string));

    if (!id) {
        return (
            <ClinicLayout>
                <div className="p-6">
                    <p className="text-sm text-destructive">
                        Questionário inválido.
                    </p>
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
            <QuestionnaireTemplateEditForm
                template={template}
                isPending={updateTemplate.isPending}
                onBack={goBack}
                onDelete={() => setDeleteDialogOpen(true)}
                onSubmit={async (dto) => {
                    await updateTemplate.mutateAsync({ id, dto });
                    goBack();
                }}
            />

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Excluir questionário
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir{' '}
                            <strong>"{template.title}"</strong>? Esta ação não
                            pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async () => {
                                await deleteTemplate.mutateAsync(id);
                                goBack();
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

function QuestionnaireTemplateEditForm({
    template,
    isPending,
    onBack,
    onDelete,
    onSubmit,
}: {
    template: QuestionnaireTemplate;
    isPending: boolean;
    onBack: () => void;
    onDelete: () => void;
    onSubmit: (dto: {
        title: string;
        description: string | null;
        sections: DraftSection[] extends (infer T)[] ? T[] : never[];
    }) => Promise<void>;
}) {
    const [title, setTitle] = useState(template.title);
    const [description, setDescription] = useState(template.description ?? '');
    const [sections, setSections] = useState<DraftSection[]>(() =>
        templateToDraftSections(template),
    );
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        const err = validate(title, sections);
        if (err) {
            setError(err);
            return;
        }
        setError(null);

        await onSubmit({
            title: title.trim(),
            description: description.trim() || null,
            sections: sections.map((s) => ({
                title: s.title.trim(),
                questions: s.questions.map((q) => ({
                    label: q.label.trim(),
                    type: q.type,
                    options:
                        q.type === 'multiple_choice' || q.type === 'checkbox'
                            ? q.options.map((o) => o.trim())
                            : null,
                    scaleMin: q.scaleMin,
                    scaleMax: q.scaleMax,
                    required: q.required,
                })),
            })) as Parameters<typeof onSubmit>[0]['sections'],
        });
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Editar questionário
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Atualize as seções e perguntas do questionário.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <BackButton onClick={onBack} className="w-fit shrink-0" />
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Título</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título do questionário"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Opcional"
                        className="min-h-20"
                    />
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <QuestionnaireSectionBuilder
                sections={sections}
                onChange={setSections}
            />

            <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar questionário'}
            </Button>
        </div>
    );
}
