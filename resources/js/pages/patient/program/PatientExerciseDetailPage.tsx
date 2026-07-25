import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePatientProgram } from '@/application/patient/use-patient-program';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, PlayCircle } from 'lucide-react';
import { PatientExercise } from '@/domain/patient/program';

export default function PatientExerciseDetailPage() {
    const [searchParams] = useSearchParams();
    const publicToken = searchParams.get('id');
    const exerciseId = searchParams.get('exerciseId');
    const navigate = useNavigate();

    const { data: program, isLoading } = usePatientProgram(publicToken || '');

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center text-muted-foreground">
                <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                <p>Carregando exercício. Aguarde...</p>
            </div>
        );
    }

    if (!program || !exerciseId) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <p className="text-destructive">Exercício não encontrado.</p>
                <Button className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
            </div>
        );
    }

    // Find the exercise
    let exercise: PatientExercise | undefined;
    for (const group of program.groups) {
        const found = group.exercises.find(e => e.id === exerciseId);
        if (found) {
            exercise = found;
            break;
        }
    }

    if (!exercise) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <p className="text-destructive">Exercício não encontrado no programa.</p>
                <Button className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-white pb-28 overflow-y-auto">
            <header className="sticky top-0 z-10 flex items-center bg-white px-4 py-3 shadow-sm">
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="flex-1 truncate text-lg font-semibold">Detalhes</h1>
            </header>

            <main className="flex-1">
                <div className="aspect-video w-full bg-black">
                    {exercise.videoUrl ? (
                        <iframe 
                            src={exercise.videoUrl} 
                            className="h-full w-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-500">
                            <p>Vídeo indisponível</p>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <h2 className="text-xl font-bold text-slate-900">{exercise.name}</h2>
                    
                    <div className="mt-4 space-y-4">
                        <div className="rounded-lg bg-slate-50 p-4">
                            <h3 className="mb-2 font-semibold text-slate-800">Prescrição</h3>
                            <ul className="space-y-2 text-sm text-slate-600">
                                {exercise.prescription.seriesMin && (
                                    <li><span className="font-medium">Séries:</span> De {exercise.prescription.seriesMin} a {exercise.prescription.seriesMax || exercise.prescription.seriesMin}</li>
                                )}
                                {exercise.prescription.repetitionsMin && (
                                    <li><span className="font-medium">Repetições:</span> De {exercise.prescription.repetitionsMin} a {exercise.prescription.repetitionsMax || exercise.prescription.repetitionsMin}</li>
                                )}
                                {exercise.prescription.loadMin && (
                                    <li><span className="font-medium">Carga:</span> {exercise.prescription.loadMin}kg {exercise.prescription.loadMax ? `a ${exercise.prescription.loadMax}kg` : ''}</li>
                                )}
                                {exercise.prescription.restTime && (
                                    <li><span className="font-medium">Descanso:</span> {exercise.prescription.restTime} seg</li>
                                )}
                                {exercise.prescription.maintainFor && (
                                    <li><span className="font-medium">Manter por:</span> {exercise.prescription.maintainFor} seg</li>
                                )}
                                {exercise.prescription.intensity && (
                                    <li><span className="font-medium">Esforço:</span> {exercise.prescription.intensity}</li>
                                )}
                            </ul>
                        </div>

                        {(exercise.days || exercise.period) && (
                            <div className="rounded-lg bg-slate-50 p-4">
                                <h3 className="mb-2 font-semibold text-slate-800">Frequência</h3>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.days?.map(day => (
                                        <span key={day} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">{day}</span>
                                    ))}
                                    {exercise.period?.map(p => (
                                        <span key={p} className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">{p}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {exercise.notes && (
                            <div className="rounded-lg bg-slate-50 p-4">
                                <h3 className="mb-2 font-semibold text-slate-800">Orientações</h3>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{exercise.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="mx-auto flex max-w-md gap-2">
                    <Button 
                        variant="outline" 
                        className="w-1/3" 
                        onClick={() => navigate(-1)}
                    >
                        Sair
                    </Button>
                    <Button 
                        className="w-2/3 bg-[#0175C2] hover:bg-[#0165a8]" 
                        onClick={() => navigate(`/execucao-programa?id=${publicToken}&startAt=${exercise.id}`)}
                    >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Iniciar exercícios
                    </Button>
                </div>
            </div>
        </div>
    );
}
