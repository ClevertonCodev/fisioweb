import { Plus } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

    const handleTabChange = (value: string) => {
        switch (value) {
            case 'exercicios':
                navigate('/clinica/programas/exercicios', { replace: true });
                break;
            case 'programas': {
                const isOnMeusModelos = location.pathname.includes('/meus-modelos');
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

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
                    <div className="px-6 pt-6 pb-0">
                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-foreground text-2xl font-semibold">
                                Programas e Exercícios
                            </h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => navigate('/clinica/programas/novo')}
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Criar programa
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Criar novo programa de exercícios</TooltipContent>
                            </Tooltip>
                        </div>

                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList className="h-auto gap-4 rounded-none bg-transparent p-0">
                                <TabsTrigger
                                    value="historico"
                                    className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Histórico
                                </TabsTrigger>
                                <TabsTrigger
                                    value="exercicios"
                                    className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Exercícios
                                </TabsTrigger>
                                <TabsTrigger
                                    value="programas"
                                    className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
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
