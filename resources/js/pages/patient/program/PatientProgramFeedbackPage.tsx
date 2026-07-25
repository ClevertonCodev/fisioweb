import { Loader2, ArrowLeft, Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    patientProgramsListPath,
    patientProgramSuccessPath,
} from '@/application/patient/patient-program-paths';
import {
    usePatientProgram,
    useSubmitProgramFeedback,
    useCompleteProgram,
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
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center text-muted-foreground">
                <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                <p>Carregando formulário. Aguarde...</p>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <p className="text-destructive">Programa não encontrado.</p>
                <Button
                    className="mt-4"
                    onClick={() =>
                        navigate(slug ? patientProgramsListPath(slug) : '/')
                    }
                >
                    Voltar
                </Button>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (!publicToken) return;

        try {
            await submitFeedback({
                publicToken,
                executionId: program.currentExecutionId,
                pain,
                painNotes,
                difficulty,
                difficultyNotes,
                ratingStars: rating,
                ratingNotes,
                outcomePainEnabled: program.outcomePainEnabled,
                outcomeDifficultyEnabled: program.outcomeDifficultyEnabled,
                outcomeSatisfactionEnabled: program.outcomeSatisfactionEnabled,
            });
            await completeProgram(publicToken);
            if (slug) {
                navigate(patientProgramSuccessPath(slug, publicToken));
            }
        } catch (error) {
            console.error('Failed to submit feedback', error);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-slate-50 pb-28 overflow-y-auto">
            <header className="sticky top-0 z-10 flex items-center bg-white px-4 py-3 shadow-sm">
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate(-1)} disabled={isSubmitting}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="flex-1 text-lg font-semibold">Feedback do programa</h1>
            </header>

            <main className="flex-1 p-4 space-y-6">
                {program.outcomePainEnabled && (
                    <div className="rounded-lg bg-white p-5 shadow-sm">
                        <h2 className="mb-4 font-semibold text-slate-900">Qual seu nível de dor ao realizar o programa de exercícios?</h2>
                        
                        <div className="mb-6">
                                <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                value={pain} 
                                onChange={(e) => setPain(parseInt(e.target.value))}
                                className="w-full accent-[#217b7e]"
                            />
                            <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                                <span>Nenhuma dor</span>
                                <span>Dor extrema</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="painNotes" className="text-slate-600">Fale mais sobre as dores durante os exercícios (opcional)</Label>
                            <Textarea 
                                id="painNotes" 
                                placeholder="Digite aqui..." 
                                value={painNotes}
                                onChange={(e) => setPainNotes(e.target.value)}
                                className="resize-none"
                            />
                        </div>
                    </div>
                )}

                {program.outcomeDifficultyEnabled && (
                    <div className="rounded-lg bg-white p-5 shadow-sm">
                        <h2 className="mb-4 font-semibold text-slate-900">Qual seu nível de dificuldade para realizar o programa de exercícios?</h2>
                        
                        <div className="mb-6">
                            <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                value={difficulty} 
                                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                                className="w-full accent-[#217b7e]"
                            />
                            <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                                <span>Muito fácil</span>
                                <span>Muito difícil</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="difficultyNotes" className="text-slate-600">Fale mais sobre sua dificuldade com os exercícios (opcional)</Label>
                            <Textarea 
                                id="difficultyNotes" 
                                placeholder="Digite aqui..." 
                                value={difficultyNotes}
                                onChange={(e) => setDifficultyNotes(e.target.value)}
                                className="resize-none"
                            />
                        </div>
                    </div>
                )}

                {program.outcomeSatisfactionEnabled && (
                    <div className="rounded-lg bg-white p-5 shadow-sm">
                        <h2 className="mb-4 font-semibold text-slate-900">Como você avalia esse programa de exercícios?</h2>
                        
                        <div className="mb-6 flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star 
                                        className={`h-10 w-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ratingNotes" className="text-slate-600">Se possível, nos diga o como essa nota poderia ser melhor. (opcional)</Label>
                            <Textarea 
                                id="ratingNotes" 
                                placeholder="Digite aqui..." 
                                value={ratingNotes}
                                onChange={(e) => setRatingNotes(e.target.value)}
                                className="resize-none"
                            />
                        </div>
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="mx-auto flex max-w-md flex-col gap-2">
                    <Button 
                        className="w-full bg-[#217b7e] hover:bg-[#1a6265]" 
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Salvando dados...
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
