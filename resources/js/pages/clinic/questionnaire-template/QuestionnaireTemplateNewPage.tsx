import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useCreateQuestionnaireTemplate } from '@/application/clinic/use-questionnaire-templates';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { QuestionnaireSectionBuilder } from '@/components/clinic/questionnaire-template/QuestionnaireSectionBuilder';
import {
    createDraftSection,
    type DraftSection,
} from '@/components/clinic/questionnaire-template/types';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

export default function QuestionnaireTemplateNewPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo');

    const createTemplate = useCreateQuestionnaireTemplate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sections, setSections] = useState<DraftSection[]>(() => [
        createDraftSection(),
    ]);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        const err = validate(title, sections);
        if (err) {
            setError(err);
            return;
        }
        setError(null);

        await createTemplate.mutateAsync({
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
            })),
        });

        navigate(returnTo ?? (-1 as unknown as string));
    }

    return (
        <ClinicLayout>
            <div className="space-y-6 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Novo questionário
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Crie um formulário com seções e perguntas para
                            enviar ao paciente.
                        </p>
                    </div>
                    <BackButton
                        onClick={() =>
                            navigate(returnTo ?? (-1 as unknown as string))
                        }
                        className="w-fit shrink-0"
                    />
                </div>

                <div className="grid gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex.: Avaliação Lombar"
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

                <Button
                    onClick={handleSubmit}
                    disabled={createTemplate.isPending}
                >
                    {createTemplate.isPending
                        ? 'Salvando...'
                        : 'Salvar questionário'}
                </Button>
            </div>
        </ClinicLayout>
    );
}
