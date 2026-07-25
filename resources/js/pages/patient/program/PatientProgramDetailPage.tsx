import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePatientProgram, useRegisterProgramView } from '@/application/patient/use-patient-program';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Play, Calendar, Clock, Activity } from 'lucide-react';
import { PatientExercise } from '@/domain/patient/program';

export default function PatientProgramDetailPage() {
    const [searchParams] = useSearchParams();
    const publicToken = searchParams.get('id');
    const navigate = useNavigate();

    const { data: program, isLoading, isError } = usePatientProgram(publicToken || '');
    const { mutate: registerView } = useRegisterProgramView();

    useEffect(() => {
        if (publicToken && program) {
            registerView(publicToken);
        }
    }, [publicToken, program, registerView]);

    if (!publicToken) {
        return (
            <div className="flex h-screen flex-col items-center justify-center p-4 text-center overflow-y-auto">
                <p>ID do programa não fornecido.</p>
                <Button className="mt-4" onClick={() => navigate('/lista-programas')}>Voltar</Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-white p-4 text-center text-muted-foreground overflow-y-auto">
                <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                <p>Carregando programa. Aguarde...</p>
            </div>
        );
    }

    if (isError || !program) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-white p-4 text-center overflow-y-auto">
                <p className="text-destructive">Programa de exercícios não encontrado.</p>
                <Button className="mt-4" onClick={() => navigate('/lista-programas')}>Voltar aos programas</Button>
            </div>
        );
    }

    const totalExercises = program.groups.reduce((acc, g) => acc + g.exercises.length, 0);

    const formatPrescription = (exercise: PatientExercise) => {
        const p = exercise.prescription;
        const parts = [];

        if (exercise.days && exercise.days.length > 0) parts.push(exercise.days.join(', '));
        
        if (p.seriesMin && p.seriesMax) parts.push(`De ${p.seriesMin} a ${p.seriesMax} séries`);
        else if (p.seriesMin) parts.push(`${p.seriesMin} ${p.seriesMin === 1 ? 'série' : 'séries'}`);

        if (p.repetitionsMin && p.repetitionsMax) parts.push(`De ${p.repetitionsMin} a ${p.repetitionsMax} repetições`);
        else if (p.repetitionsMin) parts.push(`${p.repetitionsMin} ${p.repetitionsMin === 1 ? 'repetição' : 'repetições'}`);

        if (p.loadMin && p.loadMax) parts.push(`Carga de ${p.loadMin}kg a ${p.loadMax}kg`);
        else if (p.loadMin) parts.push(`Carga de ${p.loadMin}kg`);

        if (p.restTime) parts.push(`Descanso de ${p.restTime} seg`);
        if (p.maintainFor) parts.push(`Manter por ${p.maintainFor} seg`);
        if (p.intensity) parts.push(`Esforço ${p.intensity}`);
        
        if (exercise.period && exercise.period.length > 0) parts.push(`Período d${exercise.period[0].toLowerCase() === 'manhã' ? 'a' : 'o'} ${exercise.period.join(', ')}`);

        return parts.join(', ');
    };

    return (
        <div className="h-screen bg-white overflow-y-auto">
            <main className="mx-auto max-w-3xl p-6 md:p-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-900">{program.name}</h1>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>{totalExercises} exercícios</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>2 - 12 minutos</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>Validade: {new Date(program.startDate).toLocaleDateString('pt-BR')} - {new Date(program.endDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                {/* Professional Card */}
                <div className="mb-8 flex items-center gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#217b7e] text-lg font-medium text-white">
                        {program.professionalName.charAt(0)}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{program.professionalName}</p>
                        {program.clinicName && <p className="text-sm text-slate-500">{program.clinicName}</p>}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-10 flex flex-col gap-3">
                    <Button 
                        className="h-12 w-full bg-[#217b7e] text-base font-medium hover:bg-[#1a6265]" 
                        onClick={() => navigate(`/execucao-programa?id=${publicToken}`)}
                        disabled={program.status === 'completed'}
                    >
                        <Play className="mr-2 h-5 w-5 fill-current" />
                        Iniciar exercícios
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-12 w-full border-slate-200 text-base font-medium text-slate-600 hover:bg-slate-50" 
                        onClick={() => navigate(`/avaliacao-programa?id=${publicToken}`)}
                        disabled={program.status === 'completed'}
                    >
                        Marcar exercícios como feitos
                    </Button>
                </div>

                {/* Exercise Groups Accordion */}
                <Accordion type="multiple" defaultValue={program.groups.map(g => g.id)} className="w-full space-y-4">
                    {program.groups.map((group) => (
                        <AccordionItem key={group.id} value={group.id} className="rounded-xl border border-slate-200 bg-white px-2 shadow-sm">
                            <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                <div className="flex w-full items-center justify-between pr-4">
                                    <span className="text-base font-medium text-slate-900">{group.name}</span>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                                        {group.exercises.length}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-0">
                                <div className="flex flex-col gap-6 pt-2">
                                    {group.exercises.map((exercise) => (
                                        <div 
                                            key={exercise.id} 
                                            className="flex cursor-pointer flex-col gap-4 sm:flex-row"
                                            onClick={() => navigate(`/detalhe-exercicio?id=${publicToken}&exerciseId=${exercise.id}`)}
                                        >
                                            {/* Thumbnail (Split teal/image) */}
                                            <div className="relative flex h-32 w-full shrink-0 overflow-hidden rounded-md sm:w-40">
                                                <div className="w-1/3 bg-[#217b7e]"></div>
                                                <div className="w-2/3 bg-slate-200">
                                                    {exercise.thumbnailUrl && (
                                                        <img src={exercise.thumbnailUrl} alt={exercise.name} className="h-full w-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Play className="h-10 w-10 text-white fill-white opacity-90 drop-shadow-md" />
                                                </div>
                                            </div>
                                            
                                            {/* Info */}
                                            <div className="flex flex-1 flex-col justify-center">
                                                <h3 className="text-base font-semibold text-slate-900">{exercise.name}</h3>
                                                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                                                    {formatPrescription(exercise)}
                                                </p>
                                                {exercise.notes && (
                                                    <p className="mt-2 text-sm text-slate-700">
                                                        <span className="font-semibold">Orientações:</span> {exercise.notes.replace('Descrição: ', '')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </main>
        </div>
    );
}
