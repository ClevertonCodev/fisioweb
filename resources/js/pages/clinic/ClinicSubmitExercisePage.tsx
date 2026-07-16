import { zodResolver } from '@hookform/resolvers/zod';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ImagePlus,
    Info,
    Loader2,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import {
    useClinicExerciseOptions,
    useSubmitExercise,
} from '@/application/clinic';
import {
    AdminVideoReferenceImageFields,
    type ReferenceImageState,
} from '@/components/admin/AdminVideoReferenceImageFields';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { ImageCropModal } from '@/components/ImageCropModal';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const ACCEPT_VIDEO =
    'video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/x-flv,video/x-matroska';
const ACCEPT_THUMB = 'image/jpeg,image/png,image/webp';

const schema = z.object({
    name: z.string().min(1, 'Informe o nome do exercício.').max(255),
    physioAreaId: z.string().min(1, 'Selecione a categoria.'),
    difficultyLevel: z.enum(['easy', 'medium', 'hard']),
    description: z.string().optional(),
    duration: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const statusLabels: Record<string, string> = {
    uploading: 'Enviando vídeo...',
    confirming: 'Confirmando upload...',
    saving: 'Salvando exercício...',
};

export default function ClinicSubmitExercisePage() {
    const navigate = useNavigate();
    const { data: physioAreas = [] } = useClinicExerciseOptions();
    const { submit, status, progress, error, reset } = useSubmitExercise();

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [referenceImage1, setReferenceImage1] =
        useState<ReferenceImageState>(null);
    const [referenceImage2, setReferenceImage2] =
        useState<ReferenceImageState>(null);
    const [dragOver, setDragOver] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropModalFile, setCropModalFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            physioAreaId: '',
            difficultyLevel: 'easy',
            description: '',
            duration: '',
        },
    });

    const handleVideoSelect = useCallback((file: File | null) => {
        setVideoFile(file);
        setVideoError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleVideoSelect(file);
        },
        [handleVideoSelect],
    );

    const handleThumbnailChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setCropModalFile(file);
                setCropModalOpen(true);
            }
            if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
        },
        [],
    );

    const onSubmit = form.handleSubmit(async (values) => {
        if (!videoFile) {
            setVideoError('O vídeo é obrigatório.');
            return;
        }
        await submit({
            name: values.name,
            physioAreaId: Number(values.physioAreaId),
            difficultyLevel: values.difficultyLevel,
            description: values.description || null,
            videoFile,
            thumbnailFile,
            referenceImages: [referenceImage1, referenceImage2],
            duration: values.duration
                ? parseInt(values.duration, 10)
                : undefined,
        });
    });

    const isSubmitting =
        status === 'uploading' ||
        status === 'confirming' ||
        status === 'saving';

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center gap-4 px-6 py-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="shrink-0"
                        >
                            <Link to="/clinica/exercicios">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Enviar exercício
                        </h1>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6">
                        <h2 className="mb-2 text-lg font-semibold text-foreground">
                            Novo exercício
                        </h2>

                        {/* Aviso de compartilhamento (FR-005) */}
                        <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
                            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span>
                                O exercício ficará disponível apenas para a sua
                                clínica. Se for aprovado pela nossa equipe, ele
                                poderá ser exibido para outras clínicas.
                            </span>
                        </div>

                        {status === 'completed' ? (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <CheckCircle2 className="size-10 text-green-500" />
                                <p className="text-sm font-medium text-green-600">
                                    Exercício enviado para revisão!
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            reset();
                                            setVideoFile(null);
                                            setThumbnailFile(null);
                                            setReferenceImage1(null);
                                            setReferenceImage2(null);
                                            form.reset();
                                        }}
                                    >
                                        Enviar outro
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            navigate('/clinica/exercicios')
                                        }
                                    >
                                        Ir para a biblioteca
                                    </Button>
                                </div>
                            </div>
                        ) : isSubmitting ? (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <Loader2 className="size-10 animate-spin text-primary" />
                                <p className="text-sm font-medium">
                                    {statusLabels[status]}
                                </p>
                                {status === 'uploading' && (
                                    <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Form {...form}>
                                <form
                                    onSubmit={onSubmit}
                                    className="flex flex-col gap-4"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ACCEPT_VIDEO}
                                        onChange={(e) =>
                                            handleVideoSelect(
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                        className="hidden"
                                    />
                                    <input
                                        ref={thumbnailInputRef}
                                        type="file"
                                        accept={ACCEPT_THUMB}
                                        onChange={handleThumbnailChange}
                                        className="hidden"
                                    />

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ex: Ponte Glútea"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="physioAreaId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Categoria</FormLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione a categoria" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {physioAreas.map(
                                                            (area) => (
                                                                <SelectItem
                                                                    key={
                                                                        area.id
                                                                    }
                                                                    value={String(
                                                                        area.id,
                                                                    )}
                                                                >
                                                                    {area.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="difficultyLevel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Dificuldade
                                                </FormLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="easy">
                                                            Fácil
                                                        </SelectItem>
                                                        <SelectItem value="medium">
                                                            Médio
                                                        </SelectItem>
                                                        <SelectItem value="hard">
                                                            Difícil
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Descrição (opcional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={3}
                                                        placeholder="Instruções, objetivo terapêutico..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div>
                                        <Label className="mb-2 block text-sm font-medium">
                                            Vídeo (obrigatório)
                                        </Label>
                                        <div
                                            onDrop={handleDrop}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDragOver(true);
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault();
                                                setDragOver(false);
                                            }}
                                            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors ${
                                                dragOver
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border bg-muted/30 hover:border-primary/50'
                                            }`}
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            {videoFile ? (
                                                <div className="flex items-center gap-3">
                                                    <Upload className="size-5 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        {videoFile.name}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleVideoSelect(
                                                                null,
                                                            );
                                                        }}
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="size-10 text-muted-foreground" />
                                                    <p className="mt-2 text-sm font-medium">
                                                        Arraste o vídeo ou
                                                        clique para selecionar
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        MP4, MPEG, MOV, AVI,
                                                        WebM, FLV, MKV — Máx.
                                                        20MB
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        {videoError && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {videoError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="mb-2 block text-sm font-medium">
                                            Thumbnail (opcional)
                                        </Label>
                                        <div
                                            className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 py-4 transition-colors hover:border-primary/50"
                                            onClick={() =>
                                                thumbnailInputRef.current?.click()
                                            }
                                        >
                                            {thumbnailFile ? (
                                                <div className="flex w-full items-center justify-between gap-2 px-4">
                                                    <ImagePlus className="size-5 text-muted-foreground" />
                                                    <span className="min-w-0 flex-1 truncate text-sm">
                                                        {thumbnailFile.name}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setThumbnailFile(
                                                                null,
                                                            );
                                                        }}
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="size-8 text-muted-foreground" />
                                                    <p className="mt-2 text-sm font-medium">
                                                        Clique para escolher
                                                        nova imagem
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        JPEG, PNG ou WebP — Máx.
                                                        5MB
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <AdminVideoReferenceImageFields
                                        referenceImage1={referenceImage1}
                                        referenceImage2={referenceImage2}
                                        onReferenceImage1Change={
                                            setReferenceImage1
                                        }
                                        onReferenceImage2Change={
                                            setReferenceImage2
                                        }
                                    />

                                    <FormField
                                        control={form.control}
                                        name="duration"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Duração em segundos
                                                    (opcional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        placeholder="Ex: 120"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {error && (
                                        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
                                            <AlertCircle className="size-4 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                                        <Button variant="outline" asChild>
                                            <Link to="/clinica/exercicios">
                                                Cancelar
                                            </Link>
                                        </Button>
                                        <Button type="submit">
                                            Enviar exercício
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </div>
                </div>
            </div>

            <ImageCropModal
                open={cropModalOpen}
                onOpenChange={(open) => {
                    if (!open) setCropModalFile(null);
                    setCropModalOpen(open);
                }}
                imageFile={cropModalFile}
                onConfirm={(cropped) => {
                    setThumbnailFile(cropped);
                    setCropModalFile(null);
                    setCropModalOpen(false);
                }}
                title="Recortar thumbnail"
            />
        </ClinicLayout>
    );
}
