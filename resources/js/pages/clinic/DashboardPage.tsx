import { useState } from 'react';

import { useDashboardSummary } from '@/application/clinic/use-dashboard';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { ClinicDashboard } from '@/components/clinic/dashboard/ClinicDashboard';
import type { DashboardScope } from '@/domain/clinic/dashboard';

export default function DashboardPage() {
    const [scope, setScope] = useState<DashboardScope>('clinic');
    const { data, isLoading, isError } = useDashboardSummary(scope);

    return (
        <ClinicLayout>
            <ClinicDashboard
                data={data}
                isLoading={isLoading}
                isError={isError}
                scope={scope}
                onScopeChange={setScope}
            />
        </ClinicLayout>
    );
}
