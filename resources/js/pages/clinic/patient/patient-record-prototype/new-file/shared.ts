/**
 * PROTÓTIPO (descartável): arquivos escolhidos para o prontuário, comuns
 * às variantes. As regras são as reais (patient-file-upload-rules: JPEG,
 * PNG, PDF e DOCX até 20 MB); o envio é simulado. A API recebe um arquivo
 * por vez, então vários viram um envio por arquivo.
 */
import { useEffect, useRef, useState } from 'react';

import { getPatientFileValidationError } from '@/application/clinic/patient-file-upload-rules';

export const FILE_VARIANTS = [
    { key: 'O', name: 'Modal atual (v1)' },
    { key: 'B', name: 'Foto do documento' },
] as const;

export interface PickedFile {
    id: string;
    file: File;
    name: string;
    previewUrl: string | null;
    error: string | null;
    /** 0–100 durante o envio; null antes. */
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

export function useFileQueue() {
    const [files, setFiles] = useState<PickedFile[]>([]);
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const urls = useRef<string[]>([]);
    const timer = useRef<number | undefined>(undefined);

    // Ao fechar: solta as prévias e para o envio simulado.
    useEffect(() => {
        const created = urls.current;
        return () => {
            created.forEach((u) => URL.revokeObjectURL(u));
            window.clearInterval(timer.current);
        };
    }, []);

    const add = (list: FileList | File[] | null) => {
        if (!list) return;
        const next = Array.from(list).map((file) => {
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
        setFiles((prev) => [...prev, ...next]);
        setDone(false);
    };

    const remove = (id: string) =>
        setFiles((prev) => prev.filter((f) => f.id !== id));
    const rename = (id: string, name: string) =>
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    const replaceAll = (list: FileList | null) => {
        setFiles([]);
        add(list);
    };

    const valid = files.filter((f) => !f.error);

    /** Simula um envio por arquivo, um depois do outro. */
    const send = () => {
        if (valid.length === 0 || sending) return;
        setSending(true);
        let index = 0;
        let pct = 0;
        timer.current = window.setInterval(() => {
            const target = valid[index];
            if (!target) {
                window.clearInterval(timer.current);
                setSending(false);
                setDone(true);
                return;
            }
            pct += 20;
            const value = pct;
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === target.id ? { ...f, progress: value } : f,
                ),
            );
            if (pct >= 100) {
                index += 1;
                pct = 0;
            }
        }, 120);
    };

    return {
        files,
        valid,
        add,
        remove,
        rename,
        replaceAll,
        send,
        sending,
        done,
    };
}

export type FileQueue = ReturnType<typeof useFileQueue>;
