/** PROTÓTIPO (descartável): peças comuns ao envio de arquivos. */
import { FileText, FileType2 } from 'lucide-react';

import { dsCn } from '@/components/ds';

import { kindOf, type PickedFile } from './shared';

/** Miniatura: a imagem, ou um ícone com a extensão. */
export function FileThumb({
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

export function ProgressBar({ value }: { value: number }) {
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
