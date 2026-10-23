/**
 * Foto do documento: duas portas (fotografar / escolher), prévia, tipo em
 * chips e envio real de um arquivo por vez.
 */
import {
    Camera,
    CheckCircle2,
    FileText,
    FileType2,
    FolderOpen,
    RefreshCw,
} from 'lucide-react';
import { useRef, useState, type RefObject } from 'react';

import {
    PATIENT_FILE_ACCEPT_LABEL,
    PATIENT_FILE_INPUT_ACCEPT,
} from '@/application/clinic/patient-file-upload-rules';
import { useUploadPatientFile } from '@/application/clinic/use-patient-files';
import { DsButton, dsCn, DsInput, DsModal } from '@/components/ds';

import {
    formatSize,
    kindOf,
    suggestName,
    useFileQueue,
    type FileQueue,
    type PickedFile,
} from './file';

const TYPES = ['Exame de imagem', 'Laudo', 'Receita', 'Atestado', 'Outro'];

function FileThumb({
    item,
    size = 48,
    className,
}: {
    item: PickedFile;
    size?: number;
    className?: string;
}) {
    const kind = kindOf(item.file);
    const ext = item.file.name.split('.').pop()?.toUpperCase() ?? '';
    return (
        <span
            className={dsCn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-ds-md',
                kind === 'image'
                    ? 'bg-ds-surface-subtle'
                    : kind === 'pdf'
                      ? 'bg-ds-status-danger-surface text-ds-status-danger-content'
                      : 'bg-ds-status-info-surface text-ds-status-info-content',
                className,
            )}
            style={{ width: size, height: size }}
        >
            {item.previewUrl ? (
                <img
                    src={item.previewUrl}
                    alt=""
                    className="size-full object-cover"
                />
            ) : (
                <span className="flex flex-col items-center gap-0.5">
                    {kind === 'pdf' ? (
                        <FileText
                            style={{ width: size * 0.4, height: size * 0.4 }}
                        />
                    ) : (
                        <FileType2
                            style={{ width: size * 0.4, height: size * 0.4 }}
                        />
                    )}
                    {size >= 48 && (
                        <span className="text-[10px] font-semibold">{ext}</span>
                    )}
                </span>
            )}
        </span>
    );
}

function ProgressBar({ value }: { value: number }) {
    return (
        <div
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-ds-pill bg-ds-surface-subtle"
        >
            <div
                className={dsCn(
                    'h-full rounded-ds-pill transition-[width] duration-150',
                    value === 100
                        ? 'bg-ds-status-success-content'
                        : 'bg-ds-primary-80 ds-dark:bg-ds-primary-60',
                )}
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function Body({
    q,
    type,
    setType,
    camera,
    picker,
}: {
    q: FileQueue;
    type: string | null;
    setType: (t: string | null) => void;
    camera: RefObject<HTMLInputElement | null>;
    picker: RefObject<HTMLInputElement | null>;
}) {
    const f = q.files[0] ?? null;
    const pickType = (t: string) => {
        if (!f) return;
        setType(t);
        const base = suggestName(f.file.name);
        q.rename(f.id, t === 'Outro' ? base : `${t}: ${base}`);
    };
    const door =
        'flex cursor-pointer flex-col items-center gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default px-4 py-8 text-center transition-[border-color,box-shadow] hover:border-ds-border-brand-subtle hover:shadow-ds-sm focus-visible:shadow-ds-focus focus-visible:outline-0';

    return (
        <>
            <input
                ref={camera}
                type="file"
                accept="image/*"
                capture="environment"
                aria-label="Câmera"
                className="hidden"
                onChange={(e) => {
                    setType(null);
                    q.replaceAll(e.target.files);
                    e.target.value = '';
                }}
            />
            <input
                ref={picker}
                type="file"
                accept={PATIENT_FILE_INPUT_ACCEPT}
                aria-label="Arquivo do dispositivo"
                className="hidden"
                onChange={(e) => {
                    setType(null);
                    q.replaceAll(e.target.files);
                    e.target.value = '';
                }}
            />

            {!f ? (
                <div
                    className="flex flex-col gap-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        q.replaceAll(e.dataTransfer.files);
                    }}
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            className={door}
                            onClick={() => camera.current?.click()}
                        >
                            <span className="flex size-14 items-center justify-center rounded-ds-full bg-ds-surface-brand-subtle text-ds-content-brand ds-dark:text-ds-primary-60">
                                <Camera className="size-6" />
                            </span>
                            <span className="text-ds-body-sm font-semibold">
                                Fotografar
                            </span>
                            <span className="text-ds-caption text-ds-content-muted">
                                Exame ou laudo de papel, pela câmera
                            </span>
                        </button>
                        <button
                            type="button"
                            className={door}
                            onClick={() => picker.current?.click()}
                        >
                            <span className="flex size-14 items-center justify-center rounded-ds-full bg-ds-surface-subtle text-ds-content-secondary">
                                <FolderOpen className="size-6" />
                            </span>
                            <span className="text-ds-body-sm font-semibold">
                                Escolher arquivo
                            </span>
                            <span className="text-ds-caption text-ds-content-muted">
                                Ou solte aqui um arquivo
                            </span>
                        </button>
                    </div>
                    <p className="text-center text-ds-caption text-ds-content-muted">
                        {PATIENT_FILE_ACCEPT_LABEL}, até 20 MB.
                    </p>
                </div>
            ) : q.done ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <CheckCircle2 className="size-12 text-ds-status-success-content" />
                    <p className="text-ds-body-emphasis">{f.name}</p>
                    <p className="text-ds-caption text-ds-content-muted">
                        Arquivo no prontuário.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="relative flex items-center justify-center overflow-hidden rounded-ds-xl bg-ds-surface-subtle">
                        {f.previewUrl ? (
                            <img
                                src={f.previewUrl}
                                alt={`Prévia de ${f.file.name}`}
                                className="max-h-72 w-full object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 py-10">
                                <FileThumb item={f} size={72} />
                                <span className="text-ds-caption text-ds-content-muted">
                                    {f.file.name}
                                </span>
                            </div>
                        )}
                        <span className="absolute top-2 right-2">
                            <DsButton
                                size="sm"
                                variant="secondary"
                                iconPosition="left"
                                icon={<RefreshCw />}
                                label="Trocar"
                                disabled={q.sending}
                                onClick={() => picker.current?.click()}
                            />
                        </span>
                    </div>

                    {f.error ? (
                        <p className="rounded-ds-lg bg-ds-status-danger-surface px-3 py-2 text-ds-body-xs text-ds-content-danger">
                            {f.error}
                        </p>
                    ) : (
                        <>
                            <div>
                                <p className="mb-2 text-ds-body-xs font-medium">
                                    O que é?
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {TYPES.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            aria-pressed={type === t}
                                            disabled={q.sending}
                                            onClick={() => pickType(t)}
                                            className={dsCn(
                                                'cursor-pointer rounded-ds-pill border px-3 py-1.5 text-ds-body-xs transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0',
                                                type === t
                                                    ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-content-on-brand ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70'
                                                    : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-brand-subtle',
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <DsInput
                                label="Nome no prontuário"
                                value={f.name}
                                disabled={q.sending}
                                onValueChange={(v) => q.rename(f.id, v)}
                                helper={`${f.file.name} · ${formatSize(f.file.size)}`}
                            />
                            {f.progress !== null && (
                                <ProgressBar value={f.progress} />
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );
}

export function FileUploadModal({
    open,
    onOpenChange,
    patientId,
    patientName,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientName: string;
}) {
    const camera = useRef<HTMLInputElement>(null);
    const picker = useRef<HTMLInputElement>(null);
    const [type, setType] = useState<string | null>(null);
    const q = useFileQueue();
    const upload = useUploadPatientFile(patientId);
    const f = q.files[0] ?? null;

    const onClose = () => {
        setType(null);
        q.reset();
        onOpenChange(false);
    };

    const send = async () => {
        if (!f || f.error || q.sending) return;
        q.setSending(true);
        try {
            await upload.mutateAsync({
                file: f.file,
                name: f.name.trim() || undefined,
                onUploadProgress: (p) => q.setProgress(f.id, p),
            });
            q.setDone(true);
        } catch {
            // toast no hook
        } finally {
            q.setSending(false);
        }
    };

    return (
        <DsModal
            open={open}
            onOpenChange={(o) => !o && onClose()}
            size="md"
            title="Adicionar ao prontuário"
            meta={patientName}
            footer={
                q.done ? (
                    <div className="flex w-full justify-end gap-3">
                        <DsButton
                            variant="secondary"
                            label="Adicionar outro"
                            onClick={() => {
                                setType(null);
                                q.replaceAll(null);
                                q.setDone(false);
                            }}
                        />
                        <DsButton label="Concluir" onClick={onClose} />
                    </div>
                ) : (
                    <div className="flex w-full justify-end gap-3">
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={onClose}
                            disabled={q.sending}
                        />
                        <DsButton
                            label="Enviar"
                            loading={q.sending}
                            disabled={!f || !!f.error || !f.name.trim()}
                            onClick={() => void send()}
                        />
                    </div>
                )
            }
        >
            <Body
                q={q}
                type={type}
                setType={setType}
                camera={camera}
                picker={picker}
            />
        </DsModal>
    );
}
