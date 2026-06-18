import { FileText, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
    getPatientFileValidationError,
    PATIENT_FILE_ACCEPT_LABEL,
    PATIENT_FILE_INPUT_ACCEPT,
} from '@/application/clinic/patient-file-upload-rules';
import { useUploadPatientFile } from '@/application/clinic/use-patient-files';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export interface PatientFileUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function PatientFileUploadModal({
    open,
    onOpenChange,
    patientId,
}: PatientFileUploadModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);

    const { mutateAsync, isPending } = useUploadPatientFile(patientId);

    const previewUrl = useMemo(() => {
        if (!file || !file.type.startsWith('image/')) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const resetLocalState = useCallback(() => {
        setFile(null);
        setName('');
        setDragOver(false);
        setUploadPercent(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            onOpenChange(next);
            if (!next) resetLocalState();
        },
        [onOpenChange, resetLocalState],
    );

    const pickFile = useCallback((next: File | null) => {
        if (!next) {
            setFile(null);
            return;
        }
        const err = getPatientFileValidationError(next);
        if (err) {
            toast.error(err);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setFile(next);
    }, []);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
        },
        [pickFile],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            if (isPending) return;
            const f = e.dataTransfer.files[0];
            if (f) pickFile(f);
        },
        [isPending, pickFile],
    );

    const handleSubmit = useCallback(async () => {
        if (!file || !patientId) return;
        setUploadPercent(0);
        try {
            await mutateAsync({
                file,
                name: name.trim() || undefined,
                onUploadProgress: (p) => setUploadPercent(p),
            });
            handleOpenChange(false);
        } catch {
            // feedback via useUploadPatientFile onError
        }
    }, [file, patientId, mutateAsync, handleOpenChange]);

    const clearFile = useCallback(() => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar arquivo ao prontuário</DialogTitle>
                    <DialogDescription>
                        Até 20 MB. Formatos: {PATIENT_FILE_ACCEPT_LABEL}.
                    </DialogDescription>
                </DialogHeader>

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={PATIENT_FILE_INPUT_ACCEPT}
                    onChange={handleFileChange}
                    disabled={isPending}
                />

                <div
                    onDragEnter={(e) => {
                        e.preventDefault();
                        if (!isPending) setDragOver(true);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!isPending) setDragOver(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                    }}
                    onDrop={handleDrop}
                    className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors ${
                        dragOver ? 'border-primary bg-primary/5' : 'bg-muted/30'
                    } ${isPending ? 'pointer-events-none opacity-60' : ''}`}
                    onClick={() => !isPending && fileInputRef.current?.click()}
                >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-center text-sm text-muted-foreground">
                        Arraste um arquivo aqui ou clique para escolher
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        disabled={isPending}
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                    >
                        Escolher arquivo
                    </Button>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="file-name">Nome do arquivo</Label>
                    <Input
                        id="file-name"
                        placeholder="Ex: Raio-X coluna, Laudo médico..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isPending}
                    />
                </div>

                {file && (
                    <div className="space-y-3 rounded-lg border border-border p-3">
                        <div className="flex items-start gap-3">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt=""
                                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                                />
                            ) : (
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatBytes(file.size)}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                disabled={isPending}
                                onClick={clearFile}
                                aria-label="Remover arquivo"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {isPending && (
                            <div className="space-y-1">
                                <Progress
                                    value={uploadPercent}
                                    className="h-2"
                                />
                                <p className="text-center text-xs text-muted-foreground">
                                    Enviando… {uploadPercent}%
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        disabled={!file || isPending}
                        onClick={() => void handleSubmit()}
                    >
                        {isPending ? 'Enviando…' : 'Enviar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
