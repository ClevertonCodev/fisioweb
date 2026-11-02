import { zodResolver } from '@hookform/resolvers/zod';
import {
    AlertTriangle,
    Camera,
    CheckCircle2,
    Film,
    ImagePlus,
    Play,
    RefreshCw,
    Scissors,
    Trash2,
    UploadCloud,
    XCircle,
} from 'lucide-react';
import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import type { SubmitStatus } from '@/application/clinic/use-submit-exercise';
import {
    DsAlert,
    DsBadge,
    DsButton,
    dsCn,
    DsSteps,
    DsTooltip,
    type BadgeVariant,
} from '@/components/ds';

import { ExerciseImageCropModal } from './ExerciseImageCropModal';
import { useObjectUrl } from './use-object-url';
import {
    canEditVideoInBrowser,
    checkVideo,
    hasBlocking,
    MAX_IMAGE_MB,
    MAX_VIDEO_MB,
    readVideoInfo,
    validateExerciseImage,
    type CheckState,
    type VideoCheck,
} from './video-rules';
import { VideoEditor } from './VideoEditor';

export const ACCEPT_VIDEO =
    'video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/x-flv,video/x-matroska';
export const ACCEPT_IMAGE = 'image/jpeg,image/png,image/webp';

export const schema = z.object({
    name: z.string().trim().min(1, 'Informe o nome do exercício.').max(255),
    physioAreaId: z.string().min(1, 'Selecione a categoria.'),
    difficultyLevel: z.enum(['easy', 'medium', 'hard']),
    description: z.string().max(1000).optional(),
    duration: z.string().optional(),
});

export type FormValues = z.infer<typeof schema>;

export function useSubmitForm() {
    return useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: 'onTouched',
        defaultValues: {
            name: '',
            physioAreaId: '',
            difficultyLevel: 'easy',
            description: '',
            duration: '',
        },
    });
}

export const DIFFICULTIES: {
    value: FormValues['difficultyLevel'];
    label: string;
    description: string;
    badge: BadgeVariant;
}[] = [
    {
        value: 'easy',
        label: 'Fácil',
        description: 'Iniciantes e fase inicial',
        badge: 'success',
    },
    {
        value: 'medium',
        label: 'Médio',
        description: 'Exige controle e alguma carga',
        badge: 'warning',
    },
    {
        value: 'hard',
        label: 'Difícil',
        description: 'Fase avançada ou esporte',
        badge: 'danger',
    },
];

export function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function VideoDropzone({
    file,
    onFile,
    onDuration,
    onCapture,
    onValidity,
    error,
    compact = false,
}: {
    file: File | null;
    onFile: (file: File | null) => void;
    onDuration?: (seconds: number) => void;
    onCapture?: (frame: File) => void;
    onValidity?: (blocking: boolean) => void;
    error?: string | null;
    compact?: boolean;
}) {
    const input = useRef<HTMLInputElement>(null);
    const video = useRef<HTMLVideoElement>(null);
    const [over, setOver] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [checks, setChecks] = useState<VideoCheck[] | null>(null);
    const [editing, setEditing] = useState(false);
    const url = useObjectUrl(file);
    const canEdit = canEditVideoInBrowser();

    const pick = (f: File | null) => {
        setLocalError(null);
        setChecks(null);
        onFile(f);
        if (!f) {
            onValidity?.(false);
            return;
        }
        readVideoInfo(f)
            .then((info) => {
                const result = checkVideo(info);
                setChecks(result);
                onValidity?.(hasBlocking(result));
            })
            .catch(() => {
                setLocalError('Não foi possível ler este vídeo.');
                onValidity?.(true);
            });
    };

    const capture = () => {
        const v = video.current;
        if (!v || !onCapture) return;
        const canvas = document.createElement('canvas');
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        canvas.getContext('2d')?.drawImage(v, 0, 0);
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                onCapture(new File([blob], 'capa.jpg', { type: 'image/jpeg' }));
                toast.success('Quadro atual definido como capa.');
            },
            'image/jpeg',
            0.9,
        );
    };

    const message = localError ?? error;
    const failing = checks?.filter((c) => c.state === 'fail') ?? [];

    return (
        <div className="flex flex-col gap-3">
            <input
                ref={input}
                type="file"
                accept={ACCEPT_VIDEO}
                className="hidden"
                onChange={(e) => {
                    pick(e.target.files?.[0] ?? null);
                    e.target.value = '';
                }}
            />
            {file && url ? (
                <div className="overflow-hidden rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default">
                    <video
                        ref={video}
                        src={url}
                        controls
                        playsInline
                        onLoadedMetadata={(e) =>
                            onDuration?.(Math.round(e.currentTarget.duration))
                        }
                        className={dsCn(
                            'w-full bg-black object-contain',
                            compact ? 'aspect-video' : 'aspect-video max-h-80',
                        )}
                    />
                    <div className="flex flex-wrap items-center gap-3 border-t border-ds-border-subtle px-4 py-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-ds-md bg-ds-surface-brand-subtle text-ds-content-brand ds-dark:text-ds-primary-60 [&_svg]:size-4">
                            <Film />
                        </span>
                        <div className="mr-auto min-w-0">
                            <p className="truncate text-ds-body-xs font-medium text-ds-content-primary">
                                {file.name}
                            </p>
                            <p className="text-ds-caption text-ds-content-muted">
                                {formatSize(file.size)}
                            </p>
                        </div>
                        {canEdit && (
                            <DsButton
                                variant="secondary"
                                size="sm"
                                iconPosition="left"
                                icon={<Scissors />}
                                label="Ajustar vídeo"
                                onClick={() => setEditing(true)}
                            />
                        )}
                        {onCapture && (
                            <DsButton
                                variant="tertiary"
                                size="sm"
                                iconPosition="only"
                                icon={<Camera />}
                                label="Usar quadro atual como capa"
                                onClick={capture}
                            />
                        )}
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="only"
                            icon={<RefreshCw />}
                            label="Trocar vídeo"
                            onClick={() => input.current?.click()}
                        />
                        <DsButton
                            variant="destructive-tertiary"
                            size="sm"
                            iconPosition="only"
                            icon={<Trash2 />}
                            label="Remover vídeo"
                            onClick={() => pick(null)}
                        />
                    </div>
                    {checks && (
                        <ul
                            aria-label="Conferência do vídeo"
                            className="grid gap-x-4 gap-y-2 border-t border-ds-border-subtle px-4 py-3 sm:grid-cols-2"
                        >
                            {checks.map((c) => (
                                <li
                                    key={c.key}
                                    className="flex items-start gap-2 text-ds-caption [&_svg]:mt-px [&_svg]:size-4 [&_svg]:shrink-0"
                                >
                                    <span
                                        className={
                                            CHECK_STYLE[c.state].className
                                        }
                                    >
                                        {CHECK_STYLE[c.state].icon}
                                    </span>
                                    <span>
                                        <span className="font-medium text-ds-content-primary">
                                            {c.label}
                                        </span>
                                        <span className="block text-ds-content-muted">
                                            {c.detail}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => input.current?.click()}
                    onDragOver={(e: DragEvent) => {
                        e.preventDefault();
                        setOver(true);
                    }}
                    onDragLeave={() => setOver(false)}
                    onDrop={(e: DragEvent) => {
                        e.preventDefault();
                        setOver(false);
                        pick(e.dataTransfer.files[0] ?? null);
                    }}
                    className={dsCn(
                        'group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-ds-xl border-2 border-dashed px-6 text-center outline-0 transition-colors focus-visible:shadow-ds-focus',
                        compact ? 'py-8' : 'py-12',
                        over
                            ? 'border-ds-primary-80 bg-ds-surface-brand-subtle'
                            : message
                              ? 'border-ds-status-danger-border bg-ds-status-danger-surface'
                              : 'border-ds-border-default bg-ds-surface-subtle hover:border-ds-primary-50 hover:bg-ds-surface-brand-subtle',
                    )}
                >
                    <span className="flex size-14 items-center justify-center rounded-ds-full bg-ds-surface-default text-ds-content-brand shadow-ds-sm transition-transform group-hover:scale-105 ds-dark:text-ds-primary-60 [&_svg]:size-6">
                        <UploadCloud />
                    </span>
                    <span>
                        <span className="block text-ds-body-sm font-semibold text-ds-content-primary">
                            {over
                                ? 'Solte o vídeo aqui'
                                : 'Arraste o vídeo ou clique para escolher'}
                        </span>
                        <span className="mt-1 block text-ds-caption text-ds-content-muted">
                            Em pé (formato de celular) · MP4, MOV ou WebM · até{' '}
                            {MAX_VIDEO_MB} MB
                        </span>
                    </span>
                </button>
            )}
            {failing.length > 0 && (
                <DsAlert
                    variant="danger"
                    mode="rich"
                    title="Este vídeo ainda não pode ser enviado"
                    actions={
                        canEdit ? (
                            <DsButton
                                size="sm"
                                iconPosition="left"
                                icon={<Scissors />}
                                label="Ajustar vídeo"
                                onClick={() => setEditing(true)}
                            />
                        ) : undefined
                    }
                >
                    {failing.map((c) => c.detail).join(' · ')}.{' '}
                    {fixHint(failing, canEdit)}
                </DsAlert>
            )}
            {message && (
                <p className="text-ds-caption text-ds-status-danger-content">
                    {message}
                </p>
            )}
            {canEdit && (
                <VideoEditor
                    file={file}
                    open={editing}
                    onClose={() => setEditing(false)}
                    onApply={(out) => {
                        setEditing(false);
                        pick(out);
                        toast.success(
                            `Vídeo ajustado (${formatSize(out.size)}).`,
                        );
                    }}
                />
            )}
        </div>
    );
}

function fixHint(failing: VideoCheck[], canEdit: boolean): string {
    const keys = failing.map((c) => c.key);
    if (!canEdit) {
        return 'Grave ou exporte o vídeo em pé (9:16) e com até 20 MB.';
    }
    if (keys.includes('type')) {
        return 'Grave de novo ou exporte em MP4; “Ajustar vídeo” também gera um arquivo novo.';
    }
    const steps = [
        keys.includes('orientation') && 'corte para em pé',
        keys.includes('size') && 'escolha um trecho menor',
    ].filter(Boolean);
    return `Em “Ajustar vídeo”, ${steps.join(' e ')}.`;
}

const CHECK_STYLE: Record<CheckState, { icon: ReactNode; className: string }> =
    {
        ok: {
            icon: <CheckCircle2 />,
            className: 'text-ds-status-success-content',
        },
        warn: {
            icon: <AlertTriangle />,
            className: 'text-ds-status-warning-content',
        },
        fail: {
            icon: <XCircle />,
            className: 'text-ds-status-danger-content',
        },
    };

/** Espaço de imagem (capa ou referência) com validação, recorte no DS v2, prévia e remover. */
export function ImageSlot({
    label,
    hint,
    file,
    onFile,
    aspect = 'aspect-square',
    cropAspect,
}: {
    label: string;
    hint: string;
    file: File | null;
    onFile: (file: File | null) => void;
    aspect?: string;
    cropAspect?: number;
}) {
    const input = useRef<HTMLInputElement>(null);
    const url = useObjectUrl(file);
    const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    const handleFilePicked = (picked: File | null) => {
        if (!picked) return;
        const validationError = validateExerciseImage(picked);
        if (validationError) {
            setImageError(validationError);
            return;
        }
        setImageError(null);
        setPendingCropFile(picked);
    };

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={input}
                type="file"
                accept={ACCEPT_IMAGE}
                className="hidden"
                onChange={(e) => {
                    handleFilePicked(e.target.files?.[0] ?? null);
                    e.target.value = '';
                }}
            />
            <div
                className={dsCn(
                    'group relative overflow-hidden rounded-ds-lg',
                    aspect,
                )}
            >
                {url ? (
                    <>
                        <img
                            src={url}
                            alt={label}
                            className="size-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                            <DsTooltip content="Trocar imagem" asChild>
                                <button
                                    type="button"
                                    aria-label={`Trocar ${label}`}
                                    onClick={() => input.current?.click()}
                                    className="flex size-8 cursor-pointer items-center justify-center rounded-ds-md bg-white/90 text-ds-gray-100 outline-0 hover:bg-white focus-visible:shadow-ds-focus [&_svg]:size-4"
                                >
                                    <RefreshCw />
                                </button>
                            </DsTooltip>
                            <DsTooltip content="Remover imagem" asChild>
                                <button
                                    type="button"
                                    aria-label={`Remover ${label}`}
                                    onClick={() => {
                                        setImageError(null);
                                        onFile(null);
                                    }}
                                    className="flex size-8 cursor-pointer items-center justify-center rounded-ds-md bg-white/90 text-ds-danger-120 outline-0 hover:bg-white focus-visible:shadow-ds-focus [&_svg]:size-4"
                                >
                                    <Trash2 />
                                </button>
                            </DsTooltip>
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => input.current?.click()}
                        className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 rounded-ds-lg border-2 border-dashed border-ds-border-default bg-ds-surface-subtle px-3 text-center outline-0 transition-colors hover:border-ds-primary-50 hover:bg-ds-surface-brand-subtle focus-visible:shadow-ds-focus"
                    >
                        <span className="text-ds-content-muted [&_svg]:size-6">
                            <ImagePlus />
                        </span>
                        <span className="text-ds-caption text-ds-content-muted">
                            {hint} · até {MAX_IMAGE_MB} MB
                        </span>
                    </button>
                )}
            </div>
            <p className="text-ds-caption font-medium text-ds-content-secondary">
                {label}
            </p>
            {imageError && (
                <p className="text-ds-caption text-ds-status-danger-content">
                    {imageError}
                </p>
            )}
            <ExerciseImageCropModal
                open={pendingCropFile !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingCropFile(null);
                }}
                imageFile={pendingCropFile}
                title={`Recortar ${label}`}
                aspect={cropAspect}
                onConfirm={(cropped) => {
                    onFile(cropped);
                    setPendingCropFile(null);
                }}
            />
        </div>
    );
}

/** Como o exercício vai aparecer na biblioteca (cartão da D). */
export function LibraryPreview({
    name,
    category,
    difficulty,
    cover,
    videoUrl,
}: {
    name: string;
    category: string;
    difficulty: FormValues['difficultyLevel'];
    cover: string | null;
    videoUrl: string | null;
}) {
    const d = DIFFICULTIES.find((x) => x.value === difficulty)!;
    return (
        <div>
            <div className="relative aspect-square overflow-hidden rounded-ds-lg bg-ds-surface-subtle shadow-ds-xs">
                {cover ? (
                    <img
                        src={cover}
                        alt=""
                        className="size-full object-cover"
                    />
                ) : videoUrl ? (
                    <video
                        src={videoUrl}
                        muted
                        playsInline
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-ds-content-muted [&_svg]:size-8">
                        <Film />
                    </div>
                )}
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md">
                    <Play className="ml-0.5 size-8 fill-current" />
                </span>
                <span className="absolute top-2 left-2">
                    <DsBadge variant="warning">
                        Em revisão · só sua clínica
                    </DsBadge>
                </span>
            </div>
            <div className="mt-3 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <p
                        className={dsCn(
                            'line-clamp-2 text-ds-body-xs leading-snug font-medium',
                            name
                                ? 'text-ds-content-primary'
                                : 'text-ds-content-muted',
                        )}
                    >
                        {name || 'Nome do exercício'}
                    </p>
                    <p className="mt-1 truncate text-ds-caption text-ds-content-muted">
                        {category || 'Categoria'}
                    </p>
                </div>
                <DsBadge variant={d.badge} dot>
                    {d.label}
                </DsBadge>
            </div>
        </div>
    );
}

const PHASES = ['Enviando vídeo', 'Confirmando upload', 'Salvando exercício'];
const PHASE_INDEX: Record<SubmitStatus, number> = {
    idle: 0,
    uploading: 0,
    confirming: 1,
    saving: 2,
    completed: 3,
    error: 0,
};

export function SubmitProgress({
    status,
    progress,
}: {
    status: SubmitStatus;
    progress: number;
}) {
    return (
        <div className="flex flex-col items-center gap-8 py-10">
            <DsSteps
                className="w-full max-w-lg"
                current={PHASE_INDEX[status]}
                steps={PHASES.map((label) => ({ label }))}
            />
            <div className="w-full max-w-sm">
                <div className="mb-2 flex items-baseline justify-between text-ds-caption">
                    <span className="font-medium text-ds-content-primary">
                        {PHASES[PHASE_INDEX[status]] ?? 'Pronto'}…
                    </span>
                    <span className="font-ds-mono text-ds-content-muted">
                        {status === 'uploading' ? `${progress}%` : ''}
                    </span>
                </div>
                <div className="h-2 overflow-hidden rounded-ds-pill bg-ds-surface-subtle">
                    <div
                        className="h-full rounded-ds-pill bg-ds-primary-80 transition-[width] duration-200"
                        style={{
                            width: `${status === 'uploading' ? progress : 100}%`,
                        }}
                    />
                </div>
                <p className="mt-3 text-center text-ds-caption text-ds-content-muted">
                    Não feche esta página até terminar.
                </p>
            </div>
        </div>
    );
}

export function SubmitSuccess({
    name,
    onAnother,
    onLibrary,
}: {
    name: string;
    onAnother: () => void;
    onLibrary: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="flex size-16 items-center justify-center rounded-ds-full bg-ds-status-success-surface text-ds-status-success-content [&_svg]:size-8">
                <CheckCircle2 />
            </span>
            <div>
                <h2 className="text-ds-h4 font-semibold text-ds-content-primary">
                    Exercício enviado para revisão
                </h2>
                <p className="mx-auto mt-1 max-w-md text-ds-body-sm text-ds-content-secondary">
                    “{name}” já aparece na biblioteca da sua clínica. Se a nossa
                    equipe aprovar, ele fica disponível para outras clínicas.
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
                <DsButton
                    variant="secondary"
                    label="Enviar outro"
                    onClick={onAnother}
                />
                <DsButton label="Ir para a biblioteca" onClick={onLibrary} />
            </div>
        </div>
    );
}

export function SectionTitle({
    n,
    title,
    description,
    done = false,
    right,
}: {
    n: number;
    title: string;
    description: string;
    done?: boolean;
    right?: ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <span
                className={dsCn(
                    'flex size-8 shrink-0 items-center justify-center rounded-ds-full font-ds-mono text-ds-caption font-semibold transition-colors [&_svg]:size-4',
                    done
                        ? 'bg-ds-status-success-surface text-ds-status-success-content'
                        : 'bg-ds-surface-brand-subtle text-ds-content-brand ds-dark:text-ds-primary-60',
                )}
            >
                {done ? <CheckCircle2 /> : n}
            </span>
            <div className="mr-auto min-w-0">
                <h2 className="text-ds-body-emphasis font-semibold text-ds-content-primary">
                    {title}
                </h2>
                <p className="text-ds-caption text-ds-content-muted">
                    {description}
                </p>
            </div>
            {right}
        </div>
    );
}
