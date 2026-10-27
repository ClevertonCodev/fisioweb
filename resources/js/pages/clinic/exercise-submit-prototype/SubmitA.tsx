/**
 * PROTÓTIPO A: uma página só, em três seções numeradas (Vídeo,
 * Informações, Imagens), com a prévia da biblioteca e um checklist fixos ao
 * lado. A seção fica verde quando está completa.
 */
import { CheckCircle2, Circle, FileText, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DsAlert, DsButton, DsCard, dsCn } from '@/components/ds';

import { InfoFields } from './fields';
import {
    ImageSlot,
    LibraryPreview,
    SectionTitle,
    SubmitProgress,
    SubmitSuccess,
    VideoDropzone,
} from './shared';
import { LIBRARY_PATH, type SubmitDraft } from './SubmitExercisePrototype';

export function SubmitA({ draft }: { draft: SubmitDraft }) {
    const navigate = useNavigate();
    const v = draft.values;
    const infoDone = Boolean(v.name?.trim() && v.physioAreaId);
    const checklist = [
        { label: 'Vídeo', done: draft.video !== null && !draft.videoBlocked },
        { label: 'Nome', done: Boolean(v.name?.trim()) },
        { label: 'Categoria', done: Boolean(v.physioAreaId) },
        {
            label: 'Como fazer',
            done: Boolean(v.description?.trim()),
            optional: true,
        },
        { label: 'Capa', done: draft.cover !== null, optional: true },
        {
            label: 'Fotos do PDF',
            done: draft.ref1 !== null || draft.ref2 !== null,
            optional: true,
        },
    ];

    if (draft.status !== 'idle') {
        return (
            <DsCard className="mx-auto w-full max-w-3xl">
                {draft.status === 'completed' ? (
                    <SubmitSuccess
                        name={v.name}
                        onAnother={draft.resetAll}
                        onLibrary={() => navigate(LIBRARY_PATH)}
                    />
                ) : (
                    <SubmitProgress
                        status={draft.status}
                        progress={draft.progress}
                    />
                )}
            </DsCard>
        );
    }

    return (
        <form
            onSubmit={draft.submit}
            noValidate
            className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
            <div className="flex min-w-0 flex-col gap-6">
                <DsCard>
                    <div className="flex flex-col gap-5">
                        <SectionTitle
                            n={1}
                            title="Vídeo"
                            description="Grave na horizontal ou vertical, com boa luz. A duração é lida sozinha."
                            done={draft.video !== null && !draft.videoBlocked}
                        />
                        <VideoDropzone
                            file={draft.video}
                            onFile={draft.setVideo}
                            error={draft.videoError}
                            onDuration={(s) =>
                                draft.form.setValue('duration', String(s))
                            }
                            onCapture={draft.setCover}
                            onValidity={draft.setVideoBlocked}
                        />
                    </div>
                </DsCard>

                <DsCard>
                    <div className="flex flex-col gap-5">
                        <SectionTitle
                            n={2}
                            title="Informações"
                            description="O que o profissional e o paciente vão ler."
                            done={infoDone}
                        />
                        <InfoFields draft={draft} />
                    </div>
                </DsCard>

                <DsCard>
                    <div className="flex flex-col gap-5">
                        <SectionTitle
                            n={3}
                            title="Imagens (opcional)"
                            description="Sem elas, a biblioteca e o PDF usam um quadro do vídeo."
                            done={draft.cover !== null}
                        />
                        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                            <div className="flex flex-col gap-3">
                                <div>
                                    <p className="text-ds-body-xs font-semibold text-ds-content-primary">
                                        Capa na biblioteca
                                    </p>
                                    <p className="text-ds-caption text-ds-content-muted">
                                        A miniatura do cartão do exercício.
                                    </p>
                                </div>
                                <ImageSlot
                                    label="Capa"
                                    hint="JPEG, PNG ou WebP"
                                    file={draft.cover}
                                    onFile={draft.setCover}
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <div>
                                    <p className="flex items-center gap-1.5 text-ds-body-xs font-semibold text-ds-content-primary [&_svg]:size-3.5">
                                        <FileText />
                                        Fotos no PDF do paciente
                                    </p>
                                    <p className="text-ds-caption text-ds-content-muted">
                                        Até 2 fotos que aparecem ao lado do
                                        exercício no PDF do programa (o paciente
                                        imprime ou guarda). Ex.: a posição
                                        inicial e a final.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <ImageSlot
                                        label="Foto 1 · posição inicial"
                                        hint="JPEG, PNG ou WebP"
                                        file={draft.ref1}
                                        onFile={draft.setRef1}
                                    />
                                    <ImageSlot
                                        label="Foto 2 · posição final"
                                        hint="JPEG, PNG ou WebP"
                                        file={draft.ref2}
                                        onFile={draft.setRef2}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </DsCard>

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        onClick={() => navigate(LIBRARY_PATH)}
                    />
                    <DsButton
                        type="submit"
                        iconPosition="left"
                        icon={<Send />}
                        label="Enviar exercício"
                    />
                </div>
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
                <DsCard>
                    <div className="flex flex-col gap-4">
                        <p className="text-ds-caption font-semibold tracking-[0.06em] text-ds-content-muted uppercase">
                            Prévia na biblioteca
                        </p>
                        <LibraryPreview
                            name={v.name}
                            category={draft.categoryName}
                            difficulty={v.difficultyLevel}
                            cover={draft.coverUrl}
                            videoUrl={draft.videoUrl}
                        />
                        <ul className="flex flex-col gap-2 border-t border-ds-border-subtle pt-4">
                            {checklist.map((c) => (
                                <li
                                    key={c.label}
                                    className={dsCn(
                                        'flex items-center gap-2 text-ds-body-xs [&_svg]:size-4',
                                        c.done
                                            ? 'text-ds-content-primary'
                                            : 'text-ds-content-muted',
                                    )}
                                >
                                    <span
                                        className={
                                            c.done
                                                ? 'text-ds-status-success-content'
                                                : 'text-ds-content-subtle'
                                        }
                                    >
                                        {c.done ? <CheckCircle2 /> : <Circle />}
                                    </span>
                                    {c.label}
                                    {c.optional && (
                                        <span className="ml-auto text-ds-caption text-ds-content-muted">
                                            opcional
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </DsCard>
                <DsAlert variant="info" mode="rich" title="Quem vai ver">
                    Só a sua clínica, enquanto estiver em revisão. Se a nossa
                    equipe aprovar, outras clínicas também poderão usar.
                </DsAlert>
            </aside>
        </form>
    );
}
