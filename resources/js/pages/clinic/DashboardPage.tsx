import { useState } from 'react';

import { useDashboardSummary } from '@/application/clinic/use-dashboard';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { ClinicDashboard } from '@/components/clinic/dashboard/ClinicDashboard';
import { dayKey } from '@/components/clinic/dashboard/dashboard-format';
import type { DashboardScope } from '@/domain/clinic/dashboard';
import { useNow } from '@/hooks/use-now';

export default function DashboardPage() {
    const [scope, setScope] = useState<DashboardScope>('clinic');
    // Um relógio só para a tela; o dia entra na chave do summary. O backend vira
    // o dia no fuso da clínica: se o navegador virar antes, "Atualizar dados" corrige.
    const now = useNow();
    const { data, isLoading, isError } = useDashboardSummary(
        scope,
        dayKey(now),
    );

    return (
        <ClinicLayout>
            <ClinicDashboard
                data={data}
                isLoading={isLoading}
                isError={isError}
                scope={scope}
                onScopeChange={setScope}
                now={now}
            />
        </ClinicLayout>
    );
}
