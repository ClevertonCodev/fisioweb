import { Head } from '@inertiajs/react';
import { useState } from 'react';

import { VideoUploadField } from '@/components/video-upload-field';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vídeo',
        href: '/admin/videos',
    },
];

export default function AdminVideosUpload() {
    const [lastVideo, setLastVideo] = useState<{
        id: number;
        cdn_url?: string;
        url?: string;
        filename: string;
    } | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload de vídeo (presigned)" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Upload de vídeo</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Envio direto para o Cloudflare R2 (presigned). Máx. 10 MB.
                    </p>
                </div>

                <div className="max-w-md space-y-4">
                    <VideoUploadField
                        onVideoUploaded={(result) => setLastVideo(result)}
                    />
                </div>

                {lastVideo && (
                    <div className="max-w-md rounded-lg border border-sidebar-border/70 bg-muted/30 p-4 text-sm">
                        <p className="font-medium text-muted-foreground">Último vídeo enviado</p>
                        <p className="mt-1 font-mono text-xs">{lastVideo.filename}</p>
                        <p className="mt-1 text-xs text-muted-foreground">ID: {lastVideo.id}</p>
                        {(lastVideo.cdn_url || lastVideo.url) && (
                            <a
                                href={lastVideo.cdn_url ?? lastVideo.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-block text-xs text-primary underline"
                            >
                                Abrir URL
                            </a>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
