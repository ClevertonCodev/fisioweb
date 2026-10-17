import { Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';

import { DsButton, DsModal, dsCn } from '@/components/ds';

/*
 * PROTOTYPE (throwaway) — recorte circular da foto do paciente, no DS v2.
 * Moldura fixa em círculo; a imagem se move por baixo (arrastar, setas),
 * com zoom (controle, roda do mouse, + e -) e giro de 90°. A saída é um JPEG
 * quadrado de 512px. Sem dependência: react-image-crop não tem zoom.
 */

/** Ajuste do recorte. x e y em frações do diâmetro do círculo. */
export interface CropParams {
    zoom: number;
    x: number;
    y: number;
    rotation: 0 | 90 | 180 | 270;
}

export const DEFAULT_CROP: CropParams = { zoom: 1, x: 0, y: 0, rotation: 0 };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const OUTPUT = 512;
/** Folga entre o círculo e a borda do palco, em px. */
const PAD = 24;

interface Natural {
    w: number;
    h: number;
}

/** Medidas na tela para um palco de `stage` px. */
function layout(natural: Natural, params: CropParams, stage: number) {
    const circle = stage - PAD * 2;
    const turned = params.rotation % 180 !== 0;
    const W = turned ? natural.h : natural.w;
    const H = turned ? natural.w : natural.h;
    // Escala que faz a imagem cobrir o círculo com zoom 1.
    const scale = (circle / Math.min(W, H)) * params.zoom;
    const maxX = (W * scale - circle) / 2 / circle;
    const maxY = (H * scale - circle) / 2 / circle;
    return { circle, scale, maxX, maxY };
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function clampParams(
    natural: Natural,
    params: CropParams,
    stage: number,
): CropParams {
    const { maxX, maxY } = layout(natural, params, stage);
    return {
        ...params,
        x: clamp(params.x, -maxX, maxX),
        y: clamp(params.y, -maxY, maxY),
    };
}

async function renderCrop(
    img: HTMLImageElement,
    natural: Natural,
    params: CropParams,
    stage: number,
    name: string,
): Promise<File> {
    const { circle, scale } = layout(natural, params, stage);
    const k = OUTPUT / circle;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(
        OUTPUT / 2 + params.x * circle * k,
        OUTPUT / 2 + params.y * circle * k,
    );
    ctx.rotate((params.rotation * Math.PI) / 180);
    const w = natural.w * scale * k;
    const h = natural.h * scale * k;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.9),
    );
    if (!blob) throw new Error('blob');
    const base = name.replace(/\.[^.]+$/, '') || 'foto';
    return new File([blob], `${base}-recorte.jpg`, { type: 'image/jpeg' });
}

export function PhotoCropModal({
    file,
    initial,
    onCancel,
    onConfirm,
}: {
    /** Imagem original; `null` fecha o modal. */
    file: File | null;
    initial?: CropParams;
    onCancel: () => void;
    onConfirm: (cropped: File, params: CropParams) => void;
}) {
    const [src, setSrc] = useState<string | null>(null);
    const [natural, setNatural] = useState<Natural | null>(null);
    const [params, setParams] = useState<CropParams>(initial ?? DEFAULT_CROP);
    const [stage, setStage] = useState(360);
    const [dragging, setDragging] = useState(false);
    const [busy, setBusy] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const drag = useRef<{
        px: number;
        py: number;
        x: number;
        y: number;
    } | null>(null);

    // Ajuste no render: um arquivo novo reinicia o modal.
    const [lastFile, setLastFile] = useState<File | null>(null);
    if (file !== lastFile) {
        setLastFile(file);
        setNatural(null);
        setParams(initial ?? DEFAULT_CROP);
        setSrc(file ? URL.createObjectURL(file) : null);
    }
    useEffect(() => {
        if (!src) return undefined;
        return () => URL.revokeObjectURL(src);
    }, [src]);

    // O palco acompanha a largura do modal (celular).
    useEffect(() => {
        const el = stageRef.current;
        if (!el) return undefined;
        const ro = new ResizeObserver(([entry]) => {
            if (entry) setStage(entry.contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [src]);

    const update = (next: Partial<CropParams>) => {
        if (!natural) return;
        setParams((p) => clampParams(natural, { ...p, ...next }, stage));
    };

    const zoomBy = (delta: number) =>
        update({ zoom: clamp(params.zoom + delta, MIN_ZOOM, MAX_ZOOM) });

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
            px: e.clientX,
            py: e.clientY,
            x: params.x,
            y: params.y,
        };
        setDragging(true);
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!drag.current || !natural) return;
        const { circle } = layout(natural, params, stage);
        update({
            x: drag.current.x + (e.clientX - drag.current.px) / circle,
            y: drag.current.y + (e.clientY - drag.current.py) / circle,
        });
    };
    const endDrag = () => {
        drag.current = null;
        setDragging(false);
    };

    const confirm = async () => {
        const img = imgRef.current;
        if (!img || !natural || !file) return;
        setBusy(true);
        try {
            onConfirm(
                await renderCrop(img, natural, params, stage, file.name),
                params,
            );
        } finally {
            setBusy(false);
        }
    };

    const view = natural ? layout(natural, params, stage) : null;
    const imgStyle =
        natural && view
            ? {
                  width: natural.w * view.scale,
                  height: natural.h * view.scale,
                  transform: `translate(-50%, -50%) translate(${params.x * view.circle}px, ${params.y * view.circle}px) rotate(${params.rotation}deg)`,
              }
            : undefined;

    return (
        <DsModal
            open={file !== null}
            onOpenChange={(open) => !open && onCancel()}
            title="Ajustar foto"
            meta="Arraste para posicionar e use o zoom para enquadrar o rosto."
            size="md"
            footer={
                <div className="flex w-full items-center gap-3">
                    <DsButton
                        variant="tertiary"
                        iconPosition="left"
                        icon={<RotateCcw />}
                        label="Recomeçar"
                        disabled={!natural}
                        onClick={() => setParams(DEFAULT_CROP)}
                    />
                    <div className="ml-auto flex gap-3">
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={onCancel}
                        />
                        <DsButton
                            label="Usar foto"
                            loading={busy}
                            disabled={!natural}
                            onClick={() => void confirm()}
                        />
                    </div>
                </div>
            }
        >
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <div className="flex w-full max-w-[360px] flex-col gap-4">
                    <div
                        ref={stageRef}
                        role="application"
                        tabIndex={0}
                        aria-label="Área de recorte. Arraste ou use as setas para mover, + e - para o zoom."
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onWheel={(e) => zoomBy(e.deltaY < 0 ? 0.1 : -0.1)}
                        onKeyDown={(e) => {
                            const step = e.shiftKey ? 0.05 : 0.01;
                            const moves: Record<string, Partial<CropParams>> = {
                                ArrowLeft: { x: params.x - step },
                                ArrowRight: { x: params.x + step },
                                ArrowUp: { y: params.y - step },
                                ArrowDown: { y: params.y + step },
                            };
                            const move = moves[e.key];
                            if (move) {
                                e.preventDefault();
                                update(move);
                            } else if (e.key === '+' || e.key === '=') {
                                zoomBy(0.1);
                            } else if (e.key === '-') {
                                zoomBy(-0.1);
                            }
                        }}
                        className={dsCn(
                            'relative aspect-square w-full touch-none overflow-hidden rounded-ds-lg bg-ds-gray-100 select-none focus-visible:shadow-ds-focus focus-visible:outline-0',
                            dragging ? 'cursor-grabbing' : 'cursor-grab',
                        )}
                    >
                        {src && (
                            <img
                                ref={imgRef}
                                src={src}
                                alt=""
                                draggable={false}
                                onLoad={(e) =>
                                    setNatural({
                                        w: e.currentTarget.naturalWidth,
                                        h: e.currentTarget.naturalHeight,
                                    })
                                }
                                className={dsCn(
                                    'pointer-events-none absolute top-1/2 left-1/2 max-w-none',
                                    !natural && 'invisible',
                                    !dragging &&
                                        'transition-transform duration-150',
                                )}
                                style={imgStyle}
                            />
                        )}
                        {/* Moldura: escurece fora do círculo. */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute rounded-full shadow-[0_0_0_9999px_rgb(0_0_0/0.55)] ring-2 ring-white/80"
                            style={{ inset: PAD }}
                        >
                            {/* Terços: só enquanto arrasta. */}
                            <div
                                className={dsCn(
                                    'absolute inset-0 overflow-hidden rounded-full transition-opacity duration-200',
                                    dragging ? 'opacity-100' : 'opacity-0',
                                )}
                            >
                                <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
                                <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
                                <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
                                <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="only"
                            icon={<Minus />}
                            label="Diminuir zoom"
                            disabled={!natural || params.zoom <= MIN_ZOOM}
                            onClick={() => zoomBy(-0.25)}
                        />
                        <input
                            type="range"
                            aria-label="Zoom"
                            min={MIN_ZOOM}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={params.zoom}
                            disabled={!natural}
                            onChange={(e) =>
                                update({ zoom: Number(e.target.value) })
                            }
                            className="h-1.5 min-w-0 flex-1 cursor-pointer accent-ds-primary-80 ds-dark:accent-ds-primary-60"
                        />
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="only"
                            icon={<Plus />}
                            label="Aumentar zoom"
                            disabled={!natural || params.zoom >= MAX_ZOOM}
                            onClick={() => zoomBy(0.25)}
                        />
                        <span className="w-px self-stretch bg-ds-border-subtle" />
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="only"
                            icon={<RotateCw />}
                            label="Girar 90°"
                            disabled={!natural}
                            onClick={() =>
                                update({
                                    rotation: ((params.rotation + 90) %
                                        360) as CropParams['rotation'],
                                })
                            }
                        />
                    </div>
                </div>

                {/* Prévia nos tamanhos em que a foto aparece. */}
                <div className="flex flex-row items-end gap-4 sm:flex-col sm:items-center sm:pt-2">
                    <span className="text-ds-eyebrow text-ds-content-muted uppercase sm:mb-1">
                        Prévia
                    </span>
                    {[96, 44, 28].map((size) => (
                        <div
                            key={size}
                            className="relative overflow-hidden rounded-full bg-ds-surface-subtle ring-1 ring-ds-border-subtle"
                            style={{ width: size, height: size }}
                        >
                            {src && natural && view && (
                                <img
                                    src={src}
                                    alt=""
                                    className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                                    style={{
                                        width:
                                            (natural.w * view.scale * size) /
                                            view.circle,
                                        height:
                                            (natural.h * view.scale * size) /
                                            view.circle,
                                        transform: `translate(-50%, -50%) translate(${params.x * size}px, ${params.y * size}px) rotate(${params.rotation}deg)`,
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </DsModal>
    );
}
