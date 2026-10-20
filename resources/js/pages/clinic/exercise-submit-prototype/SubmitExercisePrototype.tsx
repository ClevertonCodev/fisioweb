/**
 * PROTÓTIPO (descartável): tela "Enviar exercício" no DS v2, na rota real
 * /clinica/exercicios/enviar. ?variant=O mostra a tela atual (v1);
 * A (escolhida) = uma página em seções com a prévia da biblioteca ao lado.
 * A variante B (passo a passo) foi descartada sem commit.
 * O envio é simulado: nada vai para a API.
 */
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useClinicExerciseOptions } from '@/application/clinic';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton } from '@/components/ds';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { useFakeSubmit, useSubmitForm, type FormValues } from './shared';
import { SubmitA } from './SubmitA';
import { useObjectUrl } from './use-object-url';
import { SUBMIT_VARIANTS } from './variants';

export const LIBRARY_PATH = '/clinica/programas/exercicios';

/** Tudo o que as variantes compartilham: formulário, arquivos e envio. */
export function useSubmitDraft() {
    const form = useSubmitForm();
    const { data: areas = [] } = useClinicExerciseOptions();
    const [video, setVideoState] = useState<File | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoBlocked, setVideoBlocked] = useState(false);
    const [cover, setCover] = useState<File | null>(null);
    const [ref1, setRef1] = useState<File | null>(null);
    const [ref2, setRef2] = useState<File | null>(null);
    const fake = useFakeSubmit();
    const videoUrl = useObjectUrl(video);
    const coverUrl = useObjectUrl(cover);

    const setVideo = (f: File | null) => {
        setVideoState(f);
        setVideoError(null);
        if (!f) form.setValue('duration', '');
    };

    const values = form.watch();
    const categoryName =
        areas.find((a) => String(a.id) === values.physioAreaId)?.name ?? '';

    const submit = form.handleSubmit(() => {
        if (!video) {
            setVideoError('Escolha o vídeo do exercício.');
            return;
        }
        if (videoBlocked) {
            setVideoError('Ajuste o vídeo antes de enviar.');
            return;
        }
        fake.submit();
    });

    const resetAll = () => {
        fake.reset();
        form.reset();
        setVideoState(null);
        setCover(null);
        setRef1(null);
        setRef2(null);
    };

    return {
        form,
        values: values as FormValues,
        areas,
        categoryName,
        video,
        setVideo,
        videoError,
        setVideoError,
        videoBlocked,
        setVideoBlocked,
        videoUrl,
        cover,
        setCover,
        coverUrl,
        ref1,
        setRef1,
        ref2,
        setRef2,
        status: fake.status,
        progress: fake.progress,
        submit,
        resetAll,
    };
}

export type SubmitDraft = ReturnType<typeof useSubmitDraft>;

export default function SubmitExercisePrototype({
    variant,
}: {
    variant: string;
}) {
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

                        <SubmitA draft={draft} />
                    </div>
                </div>
            </div>
            <PrototypeSwitcher variants={SUBMIT_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
