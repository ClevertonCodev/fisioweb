import { Clock } from 'lucide-react';
import { useState } from 'react';

import { useDashboardSummary } from '@/application/clinic/use-dashboard';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { MonthBirthdays } from '@/components/clinic/dashboard/MonthBirthdays';
import { OccupancyRateChart } from '@/components/clinic/dashboard/OccupancyRateChart';
import { PatientAcquisitionChart } from '@/components/clinic/dashboard/PatientAcquisitionChart';
import { QuickActions } from '@/components/clinic/dashboard/QuickActions';
import { RecentActivities } from '@/components/clinic/dashboard/RecentActivities';
import { ScopeToggle } from '@/components/clinic/dashboard/ScopeToggle';
import { StatCards } from '@/components/clinic/dashboard/StatCards';
import { UpcomingAppointments } from '@/components/clinic/dashboard/UpcomingAppointments';
import type { DashboardScope } from '@/domain/clinic/dashboard';

export default function DashboardPage() {
    const [scope, setScope] = useState<DashboardScope>('clinic');
    const { data, isLoading, isError } = useDashboardSummary(scope);
    const canToggleScope = data?.viewer.canToggleScope ?? false;

    return (
        <ClinicLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Bem-vindo de volta! 👋
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Aqui está o resumo da sua clínica hoje.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date().toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </div>
                </div>

                {/* Ações rápidas (topo — FR-027) */}
                <QuickActions />

                {/* Toggle de escopo — apenas admin (FR-004) */}
                {canToggleScope && (
                    <div className="flex justify-end">
                        <ScopeToggle value={scope} onChange={setScope} />
                    </div>
                )}

                {/* Cards de indicadores */}
                <StatCards cards={data?.cards} isLoading={isLoading} />

                {/* Próximas consultas + Aniversariantes 50/50 (FR-027) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <UpcomingAppointments
                        items={data?.upcomingAppointments}
                        isLoading={isLoading}
                        isError={isError}
                    />
                    <MonthBirthdays
                        data={data?.birthdays}
                        isLoading={isLoading}
                        isError={isError}
                    />
                </div>

                {/* Captação de pacientes (FR-027) */}
                <PatientAcquisitionChart />

                {/* Taxa de ocupação */}
                <OccupancyRateChart
                    canChooseProfessional={
                        data?.viewer.canChooseProfessional ?? false
                    }
                />

                {/* Atividades recentes — admin/secretário (FR-023) */}
                <RecentActivities
                    enabled={data?.viewer.canViewActivities ?? false}
                />
            </div>
        </ClinicLayout>
    );
}
