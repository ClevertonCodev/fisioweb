import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton } from '@/components/ds';
import {
    ExerciseSubmitForm,
    LIBRARY_PATH,
    useSubmitDraft,
} from '@/pages/clinic/exercise-submit/ExerciseSubmitForm';

export default function ClinicSubmitExercisePage() {
    const navigate = useNavigate();
    const draft = useSubmitDraft();

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        <header className="flex flex-col gap-3">
                            <div>
                                <DsButton
                                    variant="tertiary"
                                    size="sm"
                                    iconPosition="left"
                                    icon={<ArrowLeft />}
                                    label="Biblioteca de exercícios"
                                    onClick={() => navigate(LIBRARY_PATH)}
                                />
                            </div>
                            <div>
                                <h1 className="text-ds-page-title">
                                    Enviar exercício
                                </h1>
                                <p className="mt-1 text-ds-body-sm text-ds-content-secondary">
                                    Suba o vídeo e conte como fazer. O exercício
                                    entra na biblioteca da sua clínica na hora.
                                </p>
                            </div>
                        </header>

                        <ExerciseSubmitForm draft={draft} />
                    </div>
                </div>
            </div>
        </ClinicLayout>
    );
}
