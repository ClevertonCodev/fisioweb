import { Plus } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/PrototypeSwitcher';

import ExerciseLibraryPrototype from './exercise-library-prototype/ExerciseLibraryPrototype';
import { LIBRARY_VARIANTS } from './exercise-library-prototype/variants';
import ProgramHistoryPrototype from './program-history-prototype/ProgramHistoryPrototype';
import { HISTORY_VARIANTS } from './program-history-prototype/variants';
import ProgramModelsPrototype from './program-models-prototype/ProgramModelsPrototype';
import { MODELS_VARIANTS } from './program-models-prototype/variants';

function deriveActiveTab(pathname: string): string {
    if (pathname.includes('/exercicios')) return 'exercicios';
    if (pathname.includes('/modelos')) return 'programas';
    if (pathname.includes('/meus-modelos')) return 'programas';
    return 'historico';
}

export default function ProgramListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const activeTab = deriveActiveTab(location.pathname);
    // PROTÓTIPO: Histórico v2 por ?variant= (O = esta tela v1).
    const historyVariant = usePrototypeVariant(HISTORY_VARIANTS, 'A');
    const historyPrototype = import.meta.env.DEV && activeTab === 'historico';
    // PROTÓTIPO: Exercícios v2 por ?variant= (O = esta tela v1).
    const libraryVariant = usePrototypeVariant(LIBRARY_VARIANTS, 'D');
    const libraryPrototype = import.meta.env.DEV && activeTab === 'exercicios';
    // PROTÓTIPO: Programas (modelos) v2 por ?variant= (O = esta tela v1).
    const modelsVariant = usePrototypeVariant(MODELS_VARIANTS, 'C');
    const modelsPrototype = import.meta.env.DEV && activeTab === 'programas';

    const handleTabChange = (value: string) => {
        switch (value) {
            case 'exercicios':
                navigate('/clinica/programas/exercicios', { replace: true });
                break;
            case 'programas': {
                const isOnMeusModelos =
                    location.pathname.includes('/meus-modelos');
                navigate(
                    isOnMeusModelos
                        ? '/clinica/programas/meus-modelos'
                        : '/clinica/programas/modelos',
                    { replace: true },
                );
                break;
            }
            default:
                navigate('/clinica/programas/historico', { replace: true });
                break;
        }
    };

    if (historyPrototype && historyVariant !== 'O') {
        return <ProgramHistoryPrototype variant={historyVariant} />;
    }
    if (libraryPrototype && libraryVariant !== 'O') {
        return <ExerciseLibraryPrototype variant={libraryVariant} />;
    }
    if (modelsPrototype && modelsVariant !== 'O') {
        return <ProgramModelsPrototype variant={modelsVariant} />;
    }

    return (
        <ClinicLayout>
            {historyPrototype && (
                <PrototypeSwitcher
                    variants={HISTORY_VARIANTS}
                    current={historyVariant}
                />
            )}
            {libraryPrototype && (
                <PrototypeSwitcher
                    variants={LIBRARY_VARIANTS}
                    current={libraryVariant}
                />
            )}
            {modelsPrototype && (
                <PrototypeSwitcher
                    variants={MODELS_VARIANTS}
                    current={modelsVariant}
                />
            )}
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-6 pt-6 pb-0">
                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-foreground">
                                Programas e Exercícios
                            </h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        to="/clinica/programas/novo"
                                        className={cn(
                                            buttonVariants(),
                                            'cursor-pointer gap-2',
                                        )}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Criar programa
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Criar novo programa de exercícios
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList className="h-auto gap-4 rounded-none bg-transparent p-0">
                                <TabsTrigger
                                    value="historico"
                                    className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Histórico
                                </TabsTrigger>
                                <TabsTrigger
                                    value="exercicios"
                                    className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Exercícios
                                </TabsTrigger>
                                <TabsTrigger
                                    value="programas"
                                    className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Programas
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </header>

                {/* Content — rendered by child route */}
                <div className="flex-1 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </ClinicLayout>
    );
}
