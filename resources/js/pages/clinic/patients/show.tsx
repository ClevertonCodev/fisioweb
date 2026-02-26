import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    ChevronDown,
    ClipboardList,
    FileText,
    Pencil,
    Printer,
    Search,
    SlidersHorizontal,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import ClinicLayout from '@/layouts/clinic-layout';
import type { Patient, TreatmentPlan } from '@/types';

interface ShowProps {
    patient: Patient & { treatment_plans?: TreatmentPlan[] };
}

type Tab = 'prontuario' | 'programas' | 'monitoramento' | 'registros';

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

const PLAN_STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
};

const PLAN_STATUS_COLORS: Record<string, string> = {
    draft: 'border-border text-muted-foreground',
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    completed: 'border-blue-200 bg-blue-50 text-blue-700',
    cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const TAB_OPTIONS: { value: Tab; label: string }[] = [
    { value: 'prontuario', label: 'Prontuário' },
    { value: 'programas', label: 'Programas' },
    { value: 'monitoramento', label: 'Monitoramento' },
    { value: 'registros', label: 'Registros' },
];

export default function PatientsShow({ patient }: ShowProps) {
    const [activeTab, setActiveTab] = useState<Tab>('prontuario');

    const treatmentPlans = patient.treatment_plans ?? [];
    const activeTabLabel = TAB_OPTIONS.find((t) => t.value === activeTab)?.label ?? 'Prontuário';

    return (
        <ClinicLayout>
            <Head title={patient.name} />
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center gap-4 px-6 py-4">
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                            <Link href="/clinic/patients">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>

                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                {getInitials(patient.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="truncate text-lg font-semibold text-foreground">
                                    {patient.name}
                                </h1>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="h-7 w-7"
                                >
                                    <Link href={`/clinic/patients/${patient.id}/edit`}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                            <p className="truncate text-sm text-muted-foreground">
                                {patient.cpf ? `CPF: ${patient.cpf}` : patient.profession ?? '—'}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Toolbar: (na aba Prontuário) pesquisa, Filtros, Imprimir | dropdown do menu + Adicionar */}
                <div className="border-b border-border bg-background px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {activeTab === 'prontuario' && (
                            <>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input placeholder="Pesquisar" className="pl-9" />
                                </div>
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filtros
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                    <Printer className="h-4 w-4" />
                                    Imprimir
                                </Button>
                            </>
                        )}
                        <div className={activeTab === 'prontuario' ? 'ml-auto flex items-center gap-2' : 'flex items-center gap-2'}>
                            {/* Dropdown Prontuário / Programas / Monitoramento / Registros — ao lado do Adicionar */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="gap-2">
                                        {activeTabLabel}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {TAB_OPTIONS.map((tab) => (
                                        <DropdownMenuItem
                                            key={tab.value}
                                            onClick={() => setActiveTab(tab.value)}
                                            className={activeTab === tab.value ? 'bg-accent' : ''}
                                        >
                                            {tab.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {activeTab === 'prontuario' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="gap-2">
                                            Adicionar
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem className="gap-2">
                                            <FileText className="h-4 w-4" />
                                            Evolução
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2">
                                            <ClipboardList className="h-4 w-4" />
                                            Avaliação
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2">
                                            <ClipboardList className="h-4 w-4" />
                                            Questionário
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2">
                                            <Upload className="h-4 w-4" />
                                            Adicionar arquivos
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-auto">
                    {activeTab === 'prontuario' && (
                        <div className="p-6">
                            <FlashMessage />

                            {/* Programas de tratamento */}
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-base font-semibold text-foreground">
                                        Programas de tratamento
                                    </h2>
                                    <Button size="sm" asChild className="gap-2">
                                        <Link
                                            href={`/clinic/treatment-plans/create?patient_id=${patient.id}`}
                                        >
                                            <FileText className="h-4 w-4" />
                                            Novo programa
                                        </Link>
                                    </Button>
                                </div>

                                {treatmentPlans.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                            <ClipboardList className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">
                                            Nenhum programa de tratamento
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Crie o primeiro programa para este paciente.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {treatmentPlans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                className="cursor-pointer rounded-lg border border-border p-6 transition-colors hover:bg-muted/30"
                                                onClick={() =>
                                                    router.visit(
                                                        `/clinic/treatment-plans/${plan.id}`,
                                                    )
                                                }
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <ClipboardList className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-foreground">
                                                                {plan.title}
                                                            </p>
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs ${PLAN_STATUS_COLORS[plan.status] ?? ''}`}
                                                            >
                                                                {PLAN_STATUS_LABELS[plan.status] ??
                                                                    plan.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                                            {plan.start_date && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(plan.start_date)}
                                                                    {plan.end_date &&
                                                                        ` → ${formatDate(plan.end_date)}`}
                                                                </span>
                                                            )}
                                                            {plan.physio_area && (
                                                                <span>{plan.physio_area.name}</span>
                                                            )}
                                                            {plan.clinic_user && (
                                                                <span className="flex items-center gap-1">
                                                                    <Avatar className="h-5 w-5">
                                                                        <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                                                                            {plan.clinic_user.name[0]}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    {plan.clinic_user.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'programas' && (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            <p>Programas do paciente — em breve</p>
                        </div>
                    )}

                    {activeTab === 'monitoramento' && (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            <p>Monitoramento do paciente — em breve</p>
                        </div>
                    )}

                    {activeTab === 'registros' && (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            <p>Registros do paciente — em breve</p>
                        </div>
                    )}
                </div>
            </div>
        </ClinicLayout>
    );
}
