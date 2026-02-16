import { Head } from '@inertiajs/react';
import { useState } from 'react';

import { SelectOptions, type SelectOption } from '@/components/select-options';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';

const testOptions: SelectOption[] = [
    { value: '1', label: 'Opção A' },
    { value: '2', label: 'Opção B' },
    { value: '3', label: 'Opção C' },
    { value: '4', label: 'Opção D' },
    { value: '5', label: 'Opção E' },
    { value: '6', label: 'Opção F' },
    { value: '7', label: 'Opção G' },
    { value: '8', label: 'Opção H (search aparece com 8+)' },
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Admin',
        href: dashboard().url,
    },
];

export default function AdminDashboard() {
    const [selected, setSelected] = useState<SelectOption | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Admin" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="max-w-xs rounded-lg border border-sidebar-border/70 bg-card p-4">
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                        Teste SelectOptions
                    </p>
                    <SelectOptions
                        value={selected}
                        onChange={setSelected}
                        name="test_select"
                        options={testOptions}
                        placeHolder="Selecione uma opção"
                        searchable
                    />
                    {selected && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            Selecionado: {selected.label} (value: {selected.value})
                        </p>
                    )}
                </div>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20" />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20" />
                </div>
            </div>
        </AppLayout>
    );
}
