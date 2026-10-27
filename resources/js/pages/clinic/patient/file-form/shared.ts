import { useEffect, useRef, useState } from 'react';

import { getPatientFileValidationError } from '@/application/clinic/patient-file-upload-rules';
import { useUploadPatientFile } from '@/application/clinic/use-patient-files';

export interface PickedFile {
    id: string;
    file: File;
    name: string;
    previewUrl: string | null;
    error: string | null;
    progress: number | null;
}

/** "raio-x_coluna.jpg" → "Raio x coluna"; foto de celular vira "Foto de 19/10". */
export function suggestName(fileName: string): string {
    const base = fileName.replace(/\.[^.]+$/, '');
    if (/^(img|dsc|pxl|photo|image|whatsapp)[\s_-]?\d/i.test(base)) {
        return `Foto de ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    }
    const words = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatSize(n: number): string {
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function kindOf(file: File): 'image' | 'pdf' | 'doc' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        return 'pdf';
    }
    return 'doc';
}

let seq = 0;

export function useFileQueue(patientId: string) {
    const upload = useUploadPatientFile(patientId);
    const [files, setFiles] = useState<PickedFile[]>([]);
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const urls = useRef<string[]>([]);

    useEffect(() => {
        const created = urls.current;
        return () => {
            created.forEach((u) => URL.revokeObjectURL(u));
        };
    }, []);

    const add = (list: FileList | File[] | null) => {
        if (!list) return;
        const next = Array.from(list)
            .slice(0, 1)
            .map((file) => {
                const previewUrl = file.type.startsWith('image/')
                    ? URL.createObjectURL(file)
                    : null;
                if (previewUrl) urls.current.push(previewUrl);
                seq += 1;
                return {
                    id: `f${seq}`,
                    file,
                    name: suggestName(file.name),
                    previewUrl,
                    error: getPatientFileValidationError(file),
                    progress: null,
                };
            });
        setFiles(next);
        setDone(false);
    };

    const rename = (id: string, name: string) =>
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));

    const replaceAll = (list: FileList | File[] | null) => {
        setFiles([]);
        add(list);
    };

    const send = async () => {
        const target = files[0];
        if (!target || target.error || sending) return;
        setSending(true);
        try {
            await upload.mutateAsync({
                file: target.file,
                name: target.name.trim() || undefined,
                onUploadProgress: (percent) => {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === target.id
                                ? { ...f, progress: percent }
                                : f,
                        ),
                    );
                },
            });
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === target.id ? { ...f, progress: 100 } : f,
                ),
            );
            setDone(true);
        } catch {
            // toast no hook
        } finally {
            setSending(false);
        }
    };

    return {
        files,
        add,
        rename,
        replaceAll,
        send,
        sending,
        done,
    };
}

export type FileQueue = ReturnType<typeof useFileQueue>;
