import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePatientProgram } from '@/application/patient/use-patient-program';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { PatientExercise } from '@/domain/patient/program';

export default function PatientProgramExecutionPage() {
    const [searchParams] = useSearchParams();
    const publicToken = searchParams.get('id');
    const startAt = searchParams.get('startAt');
    const navigate = useNavigate();

    const { data: program, isLoading } = usePatientProgram(publicToken || '');

    // Flatten exercises for wizard
    const [exercises, setExercises] = useState<PatientExercise[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSeries, setCurrentSeries] = useState(1);
    const [load, setLoad] = useState('');

    useEffect(() => {
        if (program) {
            const allExercises = program.groups.flatMap(g => g.exercises);
            setExercises(allExercises);
            
            if (startAt) {
                const idx = allExercises.findIndex(e => e.id === startAt);
                if (idx !== -1) {
                    setCurrentIndex(idx);
                }
            }
        }
    }, [program, startAt]);

    if (isLoading || exercises.length === 0) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-white p-4 text-center text-muted-foreground overflow-y-auto">
                <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                <p>Iniciando execução do programa. Aguarde...</p>
            </div>
        );
    }

    const exercise = exercises[currentIndex];
    const totalSeries = exercise.prescription.seriesMax || exercise.prescription.seriesMin || 1;
    const groupName = program?.groups.find(g => g.exercises.some(e => e.id === exercise.id))?.name || '';

    const handleNextSeries = () => {
        if (currentSeries < totalSeries) {
            setCurrentSeries(prev => prev + 1);
        } else {
            handleNextExercise();
        }
    };

    const handleNextExercise = () => {
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setCurrentSeries(1);
            setLoad('');
        } else {
            navigate(`/avaliacao-programa?id=${publicToken}`);
        }
    };

    const handlePrevious = () => {
        if (currentSeries > 1) {
            setCurrentSeries(prev => prev - 1);
        } else if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            const prevExercise = exercises[currentIndex - 1];
            setCurrentSeries(prevExercise.prescription.seriesMax || prevExercise.prescription.seriesMin || 1);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="h-screen bg-white overflow-y-auto">
            {/* Header */}
            <header className="flex h-16 items-center border-b border-slate-100 bg-white px-4 md:px-8">
                <Button variant="ghost" className="text-slate-600 hover:bg-slate-50" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
            </header>

            <main className="mx-auto max-w-6xl p-6 md:p-8">
                {/* Program Info */}
                <div className="mb-8">
                    <h1 className="text-xl font-semibold text-slate-900">{program?.name}</h1>
                    <p className="mt-1 text-sm text-slate-500">{groupName}</p>
                    <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                            {exercises.length} exercícios
                        </span>
                        <span className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            2 - 12 minutos
                        </span>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left: Video Player */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 lg:aspect-auto lg:h-[600px]">
                        <div className="absolute bottom-0 left-0 top-0 w-1/3 bg-[#217b7e]"></div>
                        {exercise.videoUrl ? (
                            <iframe 
                                src={exercise.videoUrl} 
                                className="absolute inset-0 h-full w-full border-0 z-10"
                                allow="autoplay; fullscreen; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200 text-slate-500">
                                <p>Vídeo indisponível</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Exercise Details */}
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-semibold text-slate-900">{exercise.name}</h2>
                        
                        <div className="mt-6">
                            <p className="text-sm font-medium text-slate-600">
                                {exercise.prescription.seriesMin} a {exercise.prescription.seriesMax || exercise.prescription.seriesMin} séries
                            </p>
                            
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-slate-900">{exercise.prescription.repetitionsMin}</span>
                                {exercise.prescription.repetitionsMax && (
                                    <>
                                        <span className="text-3xl font-medium text-slate-400">a</span>
                                        <span className="text-5xl font-bold text-slate-900">{exercise.prescription.repetitionsMax}</span>
                                    </>
                                )}
                                <span className="ml-2 text-2xl font-medium text-slate-700">repetições</span>
                            </div>
                        </div>

                        {/* Badges / Tags */}
                        <div className="mt-6 flex flex-wrap gap-2">
                            {exercise.days && exercise.days.length > 0 && (
                                <Badge className="rounded-md border-0 bg-[#e0f0f1] px-3 py-1 text-sm font-medium text-[#217b7e] hover:bg-[#d0e8e9]">
                                    {exercise.days.join(', ')}
                                </Badge>
                            )}
                            <Badge className="rounded-md border-0 bg-[#e0f0f1] px-3 py-1 text-sm font-medium text-[#217b7e] hover:bg-[#d0e8e9]">
                                De {exercise.prescription.seriesMin} a {exercise.prescription.seriesMax || exercise.prescription.seriesMin} séries
                            </Badge>
                            {exercise.prescription.intensity && (
                                <Badge className="rounded-md border-0 bg-[#e0f0f1] px-3 py-1 text-sm font-medium text-[#217b7e] hover:bg-[#d0e8e9]">
                                    Esforço {exercise.prescription.intensity}
                                </Badge>
                            )}
                            {exercise.period && exercise.period.length > 0 && (
                                <Badge className="rounded-md border-0 bg-[#e0f0f1] px-3 py-1 text-sm font-medium text-[#217b7e] hover:bg-[#d0e8e9]">
                                    {exercise.period.join(', ')}
                                </Badge>
                            )}
                        </div>

                        {/* Load Input (if applicable) */}
                        {exercise.prescription.loadMin !== undefined && (
                            <div className="mt-8 max-w-xs space-y-3">
                                <Label htmlFor="load" className="text-sm font-medium text-slate-700">Última carga utilizada (em kg)</Label>
                                <Input 
                                    id="load" 
                                    type="number" 
                                    value={load}
                                    onChange={(e) => setLoad(e.target.value)}
                                    className="h-12 border-slate-300"
                                    placeholder={exercise.prescription.loadMin.toString()}
                                />
                            </div>
                        )}

                        {/* Notes */}
                        {exercise.notes && (
                            <div className="mt-8 space-y-2">
                                <h4 className="font-semibold text-slate-900">Orientações:</h4>
                                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                    {exercise.notes}
                                </p>
                            </div>
                        )}

                        {/* Spacer to push controls to bottom */}
                        <div className="flex-1 min-h-[40px]"></div>

                        {/* Controls (Pagination & Buttons) */}
                        <div className="mt-8">
                            {/* Pagination dashes */}
                            <div className="mb-6 flex gap-1.5">
                                {Array.from({length: totalSeries}).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 flex-1 rounded-full transition-colors ${i < currentSeries ? 'bg-[#217b7e]' : 'bg-slate-200'}`} 
                                    />
                                ))}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <Button 
                                    variant="outline" 
                                    className="h-12 flex-1 border-slate-300 text-base font-medium text-slate-700 hover:bg-slate-50" 
                                    onClick={handlePrevious}
                                >
                                    Anterior
                                </Button>
                                <Button 
                                    className="h-12 flex-1 bg-[#217b7e] text-base font-medium hover:bg-[#1a6265]" 
                                    onClick={handleNextSeries}
                                >
                                    {currentSeries < totalSeries ? 'Próxima série' : (currentIndex < exercises.length - 1 ? 'Próximo exercício' : 'Finalizar programa')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
