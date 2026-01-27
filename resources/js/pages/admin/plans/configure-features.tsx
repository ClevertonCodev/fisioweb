import { Head } from '@inertiajs/react';

import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planos',
        href: '/admin/plans/configure-features',
    },
    {
        title: 'Configurar Funcionalidades',
        href: '/admin/plans/configure-features',
    },
];

export default function ConfigureFeatures() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configure Features" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Configurar Funcionalidades
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure as funcionalidades disponíveis para cada
                            plano
                        </p>
                    </div>
                </div>
                <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20" />
                    <div className="relative z-10 flex h-full items-center justify-center">
                        <p className="text-muted-foreground">
                            Conteúdo da página de Configurar Funcionalidades
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
