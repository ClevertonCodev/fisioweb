import { CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { patientProgramsListPath } from '@/application/patient/patient-program-paths';
import { DsButton } from '@/components/ds/button/DsButton';

export default function PatientProgramSuccessPage() {
    const { clinicSlug = '' } = useParams<{ clinicSlug: string }>();
    const navigate = useNavigate();

    const onBackToPrograms = () => {
        if (!clinicSlug) {
            navigate('/');
            return;
        }

        navigate(patientProgramsListPath(clinicSlug));
    };

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-[image:var(--ds-gradient-brand)] font-ds text-ds-content-on-brand">
            <main className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <div
                    className="mb-8 grid size-28 place-items-center rounded-ds-full bg-ds-white/15 ring-1 ring-ds-white/25 backdrop-blur-sm"
                    aria-hidden
                >
                    <CheckCircle2 className="size-16 stroke-[1.5]" />
                </div>

                <h1 className="text-ds-h3 font-semibold tracking-tight sm:text-ds-h2">
                    Programa concluído
                </h1>
                <p className="mt-3 max-w-sm text-ds-body-md text-ds-white/90">
                    Você finalizou todas as sessões. Continue cuidando da sua
                    saúde no dia a dia.
                </p>

                <DsButton
                    variant="secondary"
                    size="lg"
                    label="Voltar aos programas"
                    className="mt-12 w-full max-w-sm border-ds-white/50 bg-transparent text-ds-white enabled:hover:border-ds-white enabled:hover:bg-ds-white/10 enabled:hover:text-ds-white enabled:active:bg-ds-white/15 ds-dark:border-ds-white/40 ds-dark:text-ds-white"
                    onClick={onBackToPrograms}
                />
            </main>
        </div>
    );
}
