import { ArrowLeft, Loader2, Star } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
    patientProgramsListPath,
    patientProgramSuccessPath,
} from '@/application/patient/patient-program-paths';
import {
    useCompleteProgram,
    usePatientProgram,
    useSubmitProgramFeedback,
} from '@/application/patient/use-patient-program';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function PatientProgramFeedbackPage() {
    const { clinicSlug = '', publicToken = '' } = useParams<{
        clinicSlug: string;
        publicToken: string;
    }>();
    const navigate = useNavigate();
    const location = useLocation();

    const finishState = location.state as {
        completed?: boolean;
        executionId?: string;
    } | null;
    const completedOnFinish = finishState?.completed === true;
    const executionIdFromFinish = finishState?.executionId;

    const { data: program, isLoading } = usePatientProgram(publicToken);
    const { mutateAsync: submitFeedback, isPending: isSubmitting } =
        useSubmitProgramFeedback();
    const { mutateAsync: completeProgram } = useCompleteProgram();

    const [pain, setPain] = useState(0);
    const [painNotes, setPainNotes] = useState('');
    const [difficulty, setDifficulty] = useState(0);
    const [difficultyNotes, setDifficultyNotes] = useState('');
    const [rating, setRating] = useState(0);
    const [ratingNotes, setRatingNotes] = useState('');

    const slug = clinicSlug || program?.clinicSlug || '';

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Carregando avaliação…</p>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Programa não encontrado.
                </p>
                <Button
                    onClick={() =>
                        navigate(slug ? patientProgramsListPath(slug) : '/')
                    }
                >
                    Voltar
                </Button>
            </div>
        );
    }

    const sections: string[] = [];
    if (program.outcomePainEnabled) sections.push('pain');
    if (program.outcomeDifficultyEnabled) sections.push('difficulty');
    if (program.outcomeSatisfactionEnabled) sections.push('satisfaction');
    const stepNumber = (key: string) =>
        String(sections.indexOf(key) + 1).padStart(2, '0');

    const handleSubmit = async () => {
        if (!publicToken) return;

        try {
            if (sections.length > 0) {
                await submitFeedback({
                    publicToken,
                    executionId:
                        executionIdFromFinish ??
                        program.currentExecutionId,
                    pain,
                    painNotes,
                    difficulty,
                    difficultyNotes,
                    ratingStars: rating,
                    ratingNotes,
                    outcomePainEnabled: program.outcomePainEnabled,
                    outcomeDifficultyEnabled:
                        program.outcomeDifficultyEnabled,
                    outcomeSatisfactionEnabled:
                        program.outcomeSatisfactionEnabled,
                });
            }

            if (!completedOnFinish) {
                await completeProgram(publicToken);
            }

            if (slug) {
                navigate(patientProgramSuccessPath(slug, publicToken));
            }
        } catch (error) {
            console.error('Failed to submit feedback', error);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/80 px-4 backdrop-blur md:px-8">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-serif text-lg font-semibold text-foreground">
                    Como foi sua sessão?
                </h1>
            </header>

            <div className="scrollbar-thin flex-1 overflow-y-auto">
                <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-28 md:px-8">
                    <p className="text-sm text-muted-foreground">
                        Seu retorno ajuda o fisioterapeuta a ajustar o próximo
                        programa.
                    </p>

                    {program.outcomePainEnabled && (
                        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="mt-0.5 font-mono text-xs font-semibold text-primary">
                                    {stepNumber('pain')}
                                </span>
                                <h2 className="font-serif text-lg font-semibold text-foreground">
                                    Qual seu nível de dor ao realizar os
                                    exercícios?
                                </h2>
                            </div>

                            <div className="mb-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Nenhuma dor
                                    </span>
                                    <span className="font-mono text-lg font-bold text-primary tabular-nums">
                                        {pain}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Dor extrema
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={pain}
                                    onChange={(e) =>
                                        setPain(parseInt(e.target.value))
                                    }
                                    className="w-full accent-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="painNotes"
                                    className="text-muted-foreground"
                                >
                                    Fale mais sobre as dores (opcional)
                                </Label>
                                <Textarea
                                    id="painNotes"
                                    placeholder="Digite aqui…"
                                    value={painNotes}
                                    onChange={(e) =>
                                        setPainNotes(e.target.value)
                                    }
                                    className="resize-none"
                                />
                            </div>
                        </section>
                    )}

                    {program.outcomeDifficultyEnabled && (
                        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="mt-0.5 font-mono text-xs font-semibold text-primary">
                                    {stepNumber('difficulty')}
                                </span>
                                <h2 className="font-serif text-lg font-semibold text-foreground">
                                    Qual seu nível de dificuldade nos
                                    exercícios?
                                </h2>
                            </div>

                            <div className="mb-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Muito fácil
                                    </span>
                                    <span className="font-mono text-lg font-bold text-primary tabular-nums">
                                        {difficulty}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Muito difícil
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={difficulty}
                                    onChange={(e) =>
                                        setDifficulty(parseInt(e.target.value))
                                    }
                                    className="w-full accent-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="difficultyNotes"
                                    className="text-muted-foreground"
                                >
                                    Fale mais sobre a dificuldade (opcional)
                                </Label>
                                <Textarea
                                    id="difficultyNotes"
                                    placeholder="Digite aqui…"
                                    value={difficultyNotes}
                                    onChange={(e) =>
                                        setDifficultyNotes(e.target.value)
                                    }
                                    className="resize-none"
                                />
                            </div>
                        </section>
                    )}

                    {program.outcomeSatisfactionEnabled && (
                        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="mt-0.5 font-mono text-xs font-semibold text-primary">
                                    {stepNumber('satisfaction')}
                                </span>
                                <h2 className="font-serif text-lg font-semibold text-foreground">
                                    Como você avalia este programa?
                                </h2>
                            </div>

                            <div className="mb-6 flex justify-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="p-1 transition-transform hover:scale-110"
                                        aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                                    >
                                        <Star
                                            className={
                                                star <= rating
                                                    ? 'h-10 w-10 fill-warning text-warning'
                                                    : 'h-10 w-10 text-muted-foreground/30'
                                            }
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="ratingNotes"
                                    className="text-muted-foreground"
                                >
                                    Como poderíamos melhorar? (opcional)
                                </Label>
                                <Textarea
                                    id="ratingNotes"
                                    placeholder="Digite aqui…"
                                    value={ratingNotes}
                                    onChange={(e) =>
                                        setRatingNotes(e.target.value)
                                    }
                                    className="resize-none"
                                />
                            </div>
                        </section>
                    )}
                </main>
            </div>

            <div className="shrink-0 border-t border-border bg-card/90 backdrop-blur">
                <div className="mx-auto max-w-2xl px-4 py-3 md:px-8">
                    <Button
                        className="h-12 w-full text-base font-semibold"
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Enviando…
                            </>
                        ) : (
                            'Enviar avaliação'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
