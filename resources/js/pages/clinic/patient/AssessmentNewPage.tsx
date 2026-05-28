import { AlertCircle, ChevronLeft, ClipboardList, FileText, Link as LinkIcon, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useAssessmentTemplate,
    useAssessmentTemplates,
    useCreateAssessment,
} from '@/application/clinic/use-assessments';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AssessmentField, AssessmentSection } from '@/domain/clinic';
import { cn } from '@/lib/utils';

function FieldPreview({ field }: { field: AssessmentField }) {
    if (field.fieldType === 'textarea') {
        return (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground italic">
                Escreva sua resposta aqui
            </div>
        );
    }
    if (field.fieldType === 'text') {
        return (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground italic">
                Resposta curta
            </div>
        );
    }
    if (field.fieldType === 'number') {
        const unit = field.config?.unit;
        return (
            <div className="flex items-center gap-2 max-w-56">
                <div className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground text-right">
                    —
                </div>
                {unit && <span className="text-sm text-muted-foreground shrink-0">{unit}</span>}
            </div>
        );
    }
    if (field.fieldType === 'range') {
        const min = field.config?.min ?? 0;
        const max = field.config?.max ?? 10;
        return (
            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 text-right shrink-0">
                    {field.config?.minLabel ?? min}
                </span>
                <div className="flex-1 h-2 rounded-full bg-border" />
                <div className="-ml-4 h-4 w-4 rounded-full border-2 border-primary bg-background shadow shrink-0" />
                <span className="text-xs text-muted-foreground w-24 shrink-0">
                    {field.config?.maxLabel ?? max}
                </span>
            </div>
        );
    }
    if (field.fieldType === 'checkbox' && field.options.length > 0) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return (
            <div className="grid grid-cols-2 gap-2">
                {field.options.map((opt, i) => (
                    <div
                        key={opt.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                        <span className="text-xs font-bold text-muted-foreground shrink-0">
                            {letters[i]}.
                        </span>
                        <span className="flex-1 text-xs">{opt.label}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

function SectionPreview({ section }: { section: AssessmentSection }) {
    return (
        <div className="rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-muted px-5 py-3">
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                    {section.title}
                </h3>
            </div>
            <div className="p-5 space-y-5">
                {section.fields.map((field) => (
                    <div key={field.id}>
                        <label className="text-sm font-medium text-foreground block mb-1.5">
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                        </label>
                        <FieldPreview field={field} />
                    </div>
                ))}
            </div>
        </div>
    );
}


export default function AssessmentNewPage() {
    const { id: patientId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'vedius' | 'custom'>('vedius');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const {
        data: templates,
        isLoading: loadingTemplates,
        isError: errorTemplates,
    } = useAssessmentTemplates(search);

    const { data: selectedTemplate, isLoading: loadingTemplate } =
        useAssessmentTemplate(selectedId);

    const createAssessment = useCreateAssessment(patientId!);

    function handleRespond() {
        if (!selectedId) return;
        createAssessment.mutate(
            { templateId: Number(selectedId), answers: [], answerOptions: [] },
            {
                onSuccess: (assessment) => {
                    navigate(
                        `/clinica/pacientes/${patientId}/avaliacoes/${assessment.id}/editar`,
                    );
                },
            },
        );
    }

    const selectedTemplateName = selectedTemplate?.name ?? templates?.find((t) => String(t.id) === selectedId)?.name;

    return (
        <ClinicLayout>
            <div className="flex h-[calc(100vh-64px)]">
                {/* ── Left panel ─────────────────────────── */}
                <aside className="w-80 shrink-0 border-r border-border bg-card flex flex-col">
                    {/* Back + title */}
                    <div className="px-4 pt-4 pb-2">
                        <button
                            onClick={() => navigate(`/clinica/pacientes/${patientId}`)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-3"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Voltar
                        </button>
                        <h2 className="text-xl font-semibold text-foreground">Avaliações</h2>
                    </div>

                    {/* Search */}
                    <div className="px-4 pb-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar avaliação..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-4 flex gap-4 border-b border-border">
                        {(
                            [
                                ['vedius', 'Avaliações Vedius'],
                                ['custom', 'Minhas avaliações'],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={cn(
                                    'pb-2 text-sm font-medium transition-colors cursor-pointer border-b-2',
                                    activeTab === key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Template list */}
                    <ScrollArea className="flex-1">
                        {activeTab === 'vedius' ? (
                            <>
                                {loadingTemplates && (
                                    <div className="space-y-1 py-2 px-2">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <Skeleton key={i} className="h-9 w-full rounded" />
                                        ))}
                                    </div>
                                )}
                                {errorTemplates && (
                                    <div className="flex items-center gap-2 px-4 py-6 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        Erro ao carregar avaliações
                                    </div>
                                )}
                                {!loadingTemplates && !errorTemplates && templates?.length === 0 && (
                                    <p className="px-4 py-6 text-sm text-muted-foreground">
                                        Nenhuma avaliação encontrada.
                                    </p>
                                )}
                                {!loadingTemplates && templates && (
                                    <div className="py-1">
                                        {templates.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedId(String(t.id))}
                                                className={cn(
                                                    'w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer',
                                                    selectedId === String(t.id)
                                                        ? 'bg-accent text-accent-foreground border-l-2 border-primary'
                                                        : 'hover:bg-accent/50 text-foreground',
                                                )}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                <p className="text-sm font-medium text-foreground mb-1">
                                    Nenhuma avaliação ainda
                                </p>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Crie sua primeira avaliação personalizada
                                </p>
                                <Button size="sm" className="gap-2 cursor-pointer">
                                    <Plus className="h-4 w-4" />
                                    Criar avaliação
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                </aside>

                {/* ── Right panel ────────────────────────── */}
                <div className="flex-1 flex flex-col min-w-0">
                    {!selectedId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
                            <p className="text-sm font-medium text-foreground">
                                Selecione uma avaliação
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Escolha um modelo na lista ao lado para ver a prévia
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {selectedTemplateName ?? '...'}
                                    </h2>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                                        Prévia da avaliação
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 cursor-pointer"
                                            >
                                                <LinkIcon className="h-4 w-4" />
                                                Enviar link remoto
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Enviar formulário ao paciente</TooltipContent>
                                    </Tooltip>
                                    <Button
                                        size="sm"
                                        className="gap-2 cursor-pointer"
                                        onClick={handleRespond}
                                        disabled={createAssessment.isPending || loadingTemplate}
                                    >
                                        <ClipboardList className="h-4 w-4" />
                                        {createAssessment.isPending ? 'Criando...' : 'Responder agora'}
                                    </Button>
                                </div>
                            </div>

                            {/* Preview content */}
                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-6 max-w-4xl">
                                    {loadingTemplate && (
                                        <div className="space-y-4">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <Skeleton
                                                    key={i}
                                                    className="h-40 w-full rounded-xl"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {selectedTemplate?.sections.map((section) => (
                                        <SectionPreview key={section.id} section={section} />
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Footer */}
                            <div className="px-6 py-3 border-t border-border bg-card/80 backdrop-blur flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2 cursor-pointer"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    Enviar link remoto
                                </Button>
                                <Button
                                    className="gap-2 cursor-pointer"
                                    onClick={handleRespond}
                                    disabled={createAssessment.isPending || loadingTemplate}
                                >
                                    <ClipboardList className="h-4 w-4" />
                                    {createAssessment.isPending ? 'Criando...' : 'Responder agora'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ClinicLayout>
    );
}
