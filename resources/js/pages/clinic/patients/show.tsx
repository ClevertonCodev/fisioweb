import { Head } from '@inertiajs/react';
import { useState } from 'react';

import FlashMessage from '@/components/flash-message';
import type { ShowProps, Tab } from '@/domains/clinic/patients';
import { PatientHeader, PatientToolbar, TreatmentPlanList } from '@/domains/clinic/patients';
import { TAB_OPTIONS } from '@/domains/clinic/patients';
import ClinicLayout from '@/layouts/clinic-layout';

export default function PatientsShow({ patient }: ShowProps) {
    const [activeTab, setActiveTab] = useState<Tab>('prontuario');

    const treatmentPlans = patient.treatment_plans ?? [];
    const activeTabLabel = TAB_OPTIONS.find((t) => t.value === activeTab)?.label ?? 'Prontuário';

    return (
        <ClinicLayout>
            <Head title={patient.name} />
            <div className="flex h-full flex-col">
                <PatientHeader patient={patient} />

                <PatientToolbar
                    activeTab={activeTab}
                    activeTabLabel={activeTabLabel}
                    onTabChange={setActiveTab}
                />

                <div className="flex-1 overflow-auto">
                    {activeTab === 'prontuario' && (
                        <div className="p-6">
                            <FlashMessage />
                            <TreatmentPlanList patient={patient} treatmentPlans={treatmentPlans} />
                        </div>
                    )}

                    {activeTab === 'programas' && (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            <p>Programas do paciente — em breve</p>
                        </div>
                    )}

                    {activeTab === 'monitoramento' && (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            <p>Monitoramento do paciente — em breve</p>
                        </div>
                    )}

                    {activeTab === 'registros' && (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            <p>Registros do paciente — em breve</p>
                        </div>
                    )}
                </div>
            </div>
        </ClinicLayout>
    );
}
