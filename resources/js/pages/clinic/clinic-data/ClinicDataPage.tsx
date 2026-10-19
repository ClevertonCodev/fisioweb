import { useClinicProfile } from '@/application/clinic/use-clinic-profile';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsEmptyState } from '@/components/ds';

import { ClinicDataForm } from './ClinicDataForm';

export function ClinicDataPage() {
    const { data, isLoading, isError } = useClinicProfile();

    return (
        <ClinicLayout fillViewport>
            {isLoading ? (
                <div
                    aria-label="Carregando dados da clínica"
                    className="h-full min-h-0 flex-1 animate-pulse bg-ds-surface-body"
                />
            ) : isError || !data ? (
                <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-ds-surface-body font-ds">
                    <DsEmptyState
                        variant="error"
                        title="Não foi possível carregar os dados"
                    />
                </div>
            ) : (
                <ClinicDataForm profile={data} />
            )}
        </ClinicLayout>
    );
}
