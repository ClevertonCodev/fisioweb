import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Mail, MapPin, Pencil, Phone, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { maskCnpj, maskCpf } from '@/lib/validators';
import { type BreadcrumbItem, type Clinic } from '@/types';

const STATUS_LABELS: Record<number, string> = {
    1: 'Ativo',
    0: 'Inativo',
    [-1]: 'Cancelado',
};

const STATUS_COLORS: Record<number, string> = {
    1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    0: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    [-1]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

interface ShowClinicProps {
    clinic: Clinic & { plan?: { id: number; name: string } | null };
}

export default function ShowClinic({ clinic }: ShowClinicProps) {
    const [cancelOpen, setCancelOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clínicas', href: '/admin/clinics' },
        { title: clinic.name, href: `/admin/clinics/${clinic.id}` },
    ];

    const documentFormatted =
        clinic.type_person === 'fisica'
            ? maskCpf(clinic.document)
            : clinic.type_person === 'juridica'
              ? maskCnpj(clinic.document)
              : clinic.document;

    const handleCancelConfirm = useCallback(() => {
        setCancelOpen(false);
        router.delete(`/admin/clinics/${clinic.id}`);
    }, [clinic.id]);

    const handleReactivate = useCallback(() => {
        router.put(`/admin/clinics/${clinic.id}/reactivate`);
    }, [clinic.id]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={clinic.name} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/clinics">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Building2 className="size-8 text-muted-foreground" />
                            <div>
                                <h1 className="text-2xl font-bold">{clinic.name}</h1>
                                <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[clinic.status] ?? STATUS_COLORS[0]}`}
                                >
                                    {STATUS_LABELS[clinic.status] ?? 'Desconhecido'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/clinics/${clinic.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 size-4" />
                                Editar
                            </Button>
                        </Link>
                        {clinic.status === -1 ? (
                            <Button onClick={handleReactivate}>
                                <RefreshCw className="mr-2 size-4" />
                                Reativar clínica
                            </Button>
                        ) : (
                            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <XCircle className="mr-2 size-4" />
                                        Cancelar clínica
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Cancelar clínica</DialogTitle>
                                        <DialogDescription>
                                            A clínica &quot;{clinic.name}&quot; será cancelada. Ela não será
                                            excluída; apenas o status passará a &quot;Cancelado&quot;. Deseja
                                            continuar?
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setCancelOpen(false)}
                                        >
                                            Voltar
                                        </Button>
                                        <Button variant="destructive" onClick={handleCancelConfirm}>
                                            Sim, cancelar clínica
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">Informações básicas</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Documento (CPF/CNPJ)</dt>
                                <dd className="font-medium">{documentFormatted}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Tipo</dt>
                                <dd className="font-medium">
                                    {clinic.type_person === 'fisica'
                                        ? 'Pessoa Física'
                                        : clinic.type_person === 'juridica'
                                          ? 'Pessoa Jurídica'
                                          : clinic.type_person}
                                </dd>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="size-4 text-muted-foreground" />
                                <div>
                                    <dt className="text-muted-foreground">E-mail</dt>
                                    <dd className="font-medium">{clinic.email}</dd>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="size-4 text-muted-foreground" />
                                <div>
                                    <dt className="text-muted-foreground">Telefone</dt>
                                    <dd className="font-medium">{clinic.phone ?? '-'}</dd>
                                </div>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Plano</dt>
                                <dd className="font-medium">{clinic.plan?.name ?? '-'}</dd>
                            </div>
                            {clinic.slug && (
                                <div>
                                    <dt className="text-muted-foreground">URL (slug)</dt>
                                    <dd className="font-medium">{clinic.slug}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <MapPin className="size-5 text-muted-foreground" />
                            Endereço
                        </h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-muted-foreground">CEP</dt>
                                <dd className="font-medium">{clinic.zip_code ?? '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Endereço</dt>
                                <dd className="font-medium">
                                    {[clinic.address, clinic.number].filter(Boolean).join(', ') || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Cidade / UF</dt>
                                <dd className="font-medium">
                                    {[clinic.city, clinic.state].filter(Boolean).join(' / ') || '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
