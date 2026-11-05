import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Frown,
    Loader2,
    Meh,
    Pencil,
    Send,
    Smile,
    Star,
} from 'lucide-react';
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
import { DsButton } from '@/components/ds/button/DsButton';
import { DsEmptyState } from '@/components/ds/empty-state/DsEmptyState';
import { DsPatientNavbar } from '@/components/ds/navbar/DsPatientNavbar';
import { DsSteps } from '@/components/ds/steps/DsSteps';
import { DsTextarea } from '@/components/ds/textarea/DsTextarea';
import { dsCn } from '@/components/ds/utils/ds-cn';

type SectionKey = 'pain' | 'difficulty' | 'satisfaction';
type ScaleTone = 'info' | 'success' | 'warning' | 'danger';

const STEP_LABEL: Record<SectionKey | 'review', string> = {
    pain: 'Dor',
    difficulty: 'Esforço',
    satisfaction: 'Nota',
    review: 'Revisar',
};

const TONE_SOLID: Record<ScaleTone, string> = {
    info: 'border-ds-info-120 bg-ds-info-120 text-ds-white',
    success: 'border-ds-success-100 bg-ds-success-100 text-ds-white',
    warning: 'border-ds-warning-80 bg-ds-warning-80 text-ds-white',
    danger: 'border-ds-danger-80 bg-ds-danger-80 text-ds-white',
};

const TONE_SOFT: Record<ScaleTone, string> = {
    info: 'border-ds-status-info-border bg-ds-status-info-surface text-ds-status-info-content',
    success:
        'border-ds-status-success-border bg-ds-status-success-surface text-ds-status-success-content',
    warning:
        'border-ds-status-warning-border bg-ds-status-warning-surface text-ds-status-warning-content',
    danger: 'border-ds-status-danger-border bg-ds-status-danger-surface text-ds-status-danger-content',
};

const RATING_LABELS: Record<number, string> = {
    0: 'Toque nas estrelas para avaliar',
    1: '1 · Precisa melhorar muito',
    2: '2 · Regular',
    3: '3 · Bom programa',
    4: '4 · Muito bom',
    5: '5 · Excelente acompanhamento!',
};

function painTone(value: number): ScaleTone {
    if (value <= 3) return 'success';
    if (value <= 6) return 'warning';
    return 'danger';
}

function difficultyTone(value: number): ScaleTone {
    if (value <= 2) return 'info';
    if (value <= 6) return 'success';
    if (value <= 8) return 'warning';
    return 'danger';
}

function getPainDescriptor(value: number): {
    label: string;
    hint: string;
    tone: 'success' | 'warning' | 'danger';
} {
    if (value === 0) {
        return {
            label: 'Sem dor (0/10)',
            hint: 'Nenhum desconforto articular ou muscular durante a sessão.',
            tone: 'success',
        };
    }
    if (value <= 3) {
        return {
            label: `Dor leve (${value}/10)`,
            hint: 'Desconforto leve e tolerável, esperado na adaptação.',
            tone: 'success',
        };
    }
    if (value <= 6) {
        return {
            label: `Dor moderada (${value}/10)`,
            hint: 'Incomoda durante o movimento; vale detalhar para o fisioterapeuta.',
            tone: 'warning',
        };
    }
    return {
        label: `Dor intensa (${value}/10)`,
        hint: 'Atenção: dor elevada. Descreva onde sentiu para ajuste imediato.',
        tone: 'danger',
    };
}

function getDifficultyDescriptor(value: number): {
    label: string;
    hint: string;
    tone: 'info' | 'success' | 'warning' | 'danger';
} {
    if (value <= 2) {
        return {
            label: `Muito fácil (${value}/10)`,
            hint: 'Movimentos realizados sem esforço perceptível.',
            tone: 'info',
        };
    }
    if (value <= 6) {
        return {
            label: `Esforço ideal (${value}/10)`,
            hint: 'Desafiador na medida certa, mantendo boa técnica.',
            tone: 'success',
        };
    }
    if (value <= 8) {
        return {
            label: `Difícil (${value}/10)`,
            hint: 'Exigiu bastante esforço para completar as últimas séries.',
            tone: 'warning',
        };
    }
    return {
        label: `Muito difícil / Exaustivo (${value}/10)`,
        hint: 'Carga ou volume acima do limite confortável hoje.',
        tone: 'danger',
    };
}

function BigFace({ tone }: { tone: ScaleTone }) {
    const Icon = tone === 'danger' ? Frown : tone === 'warning' ? Meh : Smile;
    return (
        <div
            className={dsCn(
                'mx-auto flex size-20 items-center justify-center rounded-ds-full border-2 transition-colors sm:size-24',
                TONE_SOFT[tone],
            )}
        >
            <Icon className="size-10 sm:size-12" strokeWidth={1.5} />
        </div>
    );
}

function ScaleButtons({
    value,
    onChange,
    toneFor,
    minLabel,
    maxLabel,
    ariaLabel,
}: {
    value: number;
    onChange: (value: number) => void;
    toneFor: (value: number) => ScaleTone;
    minLabel: string;
    maxLabel: string;
    ariaLabel: string;
}) {
    return (
        <div>
            <div
                role="radiogroup"
                aria-label={ariaLabel}
                className="grid grid-cols-11 gap-1 sm:gap-1.5"
            >
                {Array.from({ length: 11 }).map((_, n) => {
                    const selected = n === value;
                    const tone = toneFor(n);
                    return (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={`${n} de 10`}
                            onClick={() => onChange(n)}
                            className={dsCn(
                                'flex h-12 cursor-pointer items-center justify-center rounded-ds-md border font-ds-mono text-ds-body-sm font-bold tabular-nums transition-all sm:h-14 sm:text-ds-body-md',
                                selected
                                    ? dsCn(
                                          TONE_SOLID[tone],
                                          'scale-105 shadow-ds-sm',
                                      )
                                    : dsCn(
                                          TONE_SOFT[tone],
                                          'opacity-80 hover:opacity-100',
                                      ),
                            )}
                        >
                            {n}
                        </button>
                    );
                })}
            </div>
            <div className="mt-1.5 flex justify-between text-ds-caption text-ds-content-muted">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>
        </div>
    );
}

function StarRating({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div
            role="radiogroup"
            aria-label="Avaliação do programa"
            className="flex items-center justify-center gap-1 sm:gap-2"
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= value;
                return (
                    <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={star === value}
                        aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                        onClick={() => onChange(star)}
                        className="cursor-pointer rounded-ds-md p-1 transition-transform hover:scale-110"
                    >
                        <Star
                            className={dsCn(
                                'size-11 sm:size-12',
                                filled
                                    ? 'fill-ds-warning-80 text-ds-warning-80'
                                    : 'text-ds-border-default',
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}

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
    const [stepIndex, setStepIndex] = useState(0);

    const slug = clinicSlug || program?.clinicSlug || '';

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-ds-surface-body p-4 text-center font-ds text-ds-content-secondary">
                <Loader2 className="size-8 animate-spin text-ds-content-brand" />
                <p className="text-ds-body-xs">Carregando avaliação…</p>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-ds-surface-body p-6 font-ds">
                <DsEmptyState
                    icon={<AlertCircle className="size-6" />}
                    title="Programa não encontrado"
                    description="Não foi possível carregar os dados para registrar sua avaliação."
                    action={
                        <DsButton
                            label="Voltar aos programas"
                            onClick={() =>
                                navigate(
                                    slug ? patientProgramsListPath(slug) : '/',
                                )
                            }
                        />
                    }
                />
            </div>
        );
    }

    const sections: SectionKey[] = [];
    if (program.outcomePainEnabled) sections.push('pain');
    if (program.outcomeDifficultyEnabled) sections.push('difficulty');
    if (program.outcomeSatisfactionEnabled) sections.push('satisfaction');

    const flow: Array<SectionKey | 'review'> = [...sections, 'review'];
    const safeStepIndex = Math.min(stepIndex, flow.length - 1);
    const current = flow[safeStepIndex];
    const isReview = current === 'review';

    const painInfo = getPainDescriptor(pain);
    const difficultyInfo = getDifficultyDescriptor(difficulty);

    const handleSubmit = async () => {
        if (!publicToken) return;

        try {
            if (sections.length > 0) {
                await submitFeedback({
                    publicToken,
                    executionId:
                        executionIdFromFinish ?? program.currentExecutionId,
                    pain,
                    painNotes,
                    difficulty,
                    difficultyNotes,
                    ratingStars: rating,
                    ratingNotes,
                    outcomePainEnabled: program.outcomePainEnabled,
                    outcomeDifficultyEnabled: program.outcomeDifficultyEnabled,
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

    const goNext = () =>
        setStepIndex((i) => Math.min(i + 1, flow.length - 1));
    const goBack = () => {
        if (safeStepIndex === 0) navigate(-1);
        else setStepIndex((i) => i - 1);
    };

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <DsPatientNavbar
                title="Como foi sua sessão?"
                showPrototypeBadge
                onBack={() => navigate(-1)}
            />

            <div className="flex flex-1 flex-col justify-between">
                <main className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
                    {flow.length > 1 && (
                        <DsSteps
                            className="mb-5"
                            steps={flow.map((key) => ({
                                label: STEP_LABEL[key],
                            }))}
                            current={safeStepIndex}
                            onStepClick={(i) =>
                                i < safeStepIndex && setStepIndex(i)
                            }
                        />
                    )}

                    <section className="rounded-ds-2xl border border-ds-border-default bg-ds-surface-default p-5 shadow-ds-md sm:p-8">
                        <p className="text-center font-ds-mono text-ds-caption font-semibold tracking-wider text-ds-content-muted uppercase">
                            {isReview
                                ? 'Último passo'
                                : `Pergunta ${safeStepIndex + 1} de ${sections.length}`}
                        </p>

                        {current === 'pain' && (
                            <div className="mt-3 space-y-5">
                                <h1 className="text-center text-ds-h4 font-bold text-ds-content-primary">
                                    Sentiu dor durante os exercícios?
                                </h1>
                                <BigFace tone={painInfo.tone} />
                                <p
                                    aria-live="polite"
                                    className="text-center text-ds-body-sm font-semibold text-ds-content-primary"
                                >
                                    {painInfo.label}
                                    <span className="block text-ds-caption font-normal text-ds-content-muted">
                                        {painInfo.hint}
                                    </span>
                                </p>
                                <ScaleButtons
                                    value={pain}
                                    onChange={setPain}
                                    toneFor={painTone}
                                    minLabel="Sem dor"
                                    maxLabel="Dor extrema"
                                    ariaLabel="Nível de dor"
                                />
                                <DsTextarea
                                    label="Quer contar onde doeu? (opcional)"
                                    placeholder="Digite aqui…"
                                    rows={2}
                                    value={painNotes}
                                    onValueChange={setPainNotes}
                                />
                            </div>
                        )}

                        {current === 'difficulty' && (
                            <div className="mt-3 space-y-5">
                                <h1 className="text-center text-ds-h4 font-bold text-ds-content-primary">
                                    Quão difícil foi a sessão?
                                </h1>
                                <BigFace
                                    tone={
                                        difficultyInfo.tone === 'info'
                                            ? 'success'
                                            : difficultyInfo.tone
                                    }
                                />
                                <p
                                    aria-live="polite"
                                    className="text-center text-ds-body-sm font-semibold text-ds-content-primary"
                                >
                                    {difficultyInfo.label}
                                    <span className="block text-ds-caption font-normal text-ds-content-muted">
                                        {difficultyInfo.hint}
                                    </span>
                                </p>
                                <ScaleButtons
                                    value={difficulty}
                                    onChange={setDifficulty}
                                    toneFor={difficultyTone}
                                    minLabel="Muito fácil"
                                    maxLabel="Exaustivo"
                                    ariaLabel="Nível de dificuldade"
                                />
                                <DsTextarea
                                    label="O que foi mais difícil? (opcional)"
                                    placeholder="Digite aqui…"
                                    rows={2}
                                    value={difficultyNotes}
                                    onValueChange={setDifficultyNotes}
                                />
                            </div>
                        )}

                        {current === 'satisfaction' && (
                            <div className="mt-3 space-y-5">
                                <h1 className="text-center text-ds-h4 font-bold text-ds-content-primary">
                                    Que nota você dá ao programa?
                                </h1>
                                <StarRating
                                    value={rating}
                                    onChange={setRating}
                                />
                                <p
                                    aria-live="polite"
                                    className="text-center text-ds-body-sm font-semibold text-ds-content-primary"
                                >
                                    {RATING_LABELS[rating]}
                                </p>
                                <DsTextarea
                                    label="Como poderíamos melhorar? (opcional)"
                                    placeholder="Digite aqui…"
                                    rows={2}
                                    value={ratingNotes}
                                    onValueChange={setRatingNotes}
                                />
                            </div>
                        )}

                        {isReview && (
                            <div className="mt-3 space-y-4">
                                <h1 className="text-center text-ds-h4 font-bold text-ds-content-primary">
                                    {sections.length > 0
                                        ? 'Confira antes de enviar'
                                        : 'Tudo pronto!'}
                                </h1>
                                {sections.length === 0 && (
                                    <p className="text-center text-ds-body-xs text-ds-content-secondary">
                                        Este programa não pede avaliação. Toque
                                        em concluir para finalizar.
                                    </p>
                                )}
                                <ul className="divide-y divide-ds-border-subtle overflow-hidden rounded-ds-xl border border-ds-border-default">
                                    {sections.map((key, i) => {
                                        const summary =
                                            key === 'pain'
                                                ? painInfo.label
                                                : key === 'difficulty'
                                                  ? difficultyInfo.label
                                                  : RATING_LABELS[rating];
                                        const notes =
                                            key === 'pain'
                                                ? painNotes
                                                : key === 'difficulty'
                                                  ? difficultyNotes
                                                  : ratingNotes;
                                        return (
                                            <li
                                                key={key}
                                                className="flex items-start justify-between gap-3 px-4 py-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-ds-caption text-ds-content-muted">
                                                        {STEP_LABEL[key]}
                                                    </p>
                                                    <p className="text-ds-body-xs font-semibold text-ds-content-primary">
                                                        {summary}
                                                    </p>
                                                    {notes && (
                                                        <p className="mt-0.5 truncate text-ds-caption text-ds-content-secondary">
                                                            “{notes}”
                                                        </p>
                                                    )}
                                                </div>
                                                <DsButton
                                                    variant="tertiary"
                                                    size="sm"
                                                    iconPosition="only"
                                                    icon={
                                                        <Pencil className="size-3.5" />
                                                    }
                                                    label={`Editar ${STEP_LABEL[key]}`}
                                                    onClick={() =>
                                                        setStepIndex(i)
                                                    }
                                                />
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </section>
                </main>

                <div className="sticky bottom-0 z-20 border-t border-ds-border-default bg-ds-surface-default/95 backdrop-blur-md">
                    <div className="mx-auto flex w-full max-w-2xl items-center gap-2.5 px-4 py-3 sm:px-6">
                        <DsButton
                            variant="secondary"
                            size="lg"
                            iconPosition="left"
                            icon={<ArrowLeft className="size-4" />}
                            label="Voltar"
                            onClick={goBack}
                            disabled={isSubmitting}
                        />
                        {isReview ? (
                            <DsButton
                                variant="primary"
                                size="lg"
                                iconPosition="right"
                                icon={
                                    isSubmitting ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Send className="size-4" />
                                    )
                                }
                                label={
                                    isSubmitting
                                        ? 'Enviando…'
                                        : sections.length > 0
                                          ? 'Enviar avaliação'
                                          : 'Concluir'
                                }
                                disabled={isSubmitting}
                                onClick={() => void handleSubmit()}
                                className="flex-1"
                            />
                        ) : (
                            <DsButton
                                variant="primary"
                                size="lg"
                                iconPosition="right"
                                icon={<ArrowRight className="size-4" />}
                                label="Próxima"
                                onClick={goNext}
                                className="flex-1"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
