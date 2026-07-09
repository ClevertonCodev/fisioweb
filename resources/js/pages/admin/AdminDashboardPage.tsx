import {
    AlertCircle,
    Building2,
    ChevronRight,
    Clock,
    CreditCard,
    Dumbbell,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { usePendingExerciseCount } from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

const stats = [
    {
        title: 'Clínicas Ativas',
        value: '42',
        change: '+3 este mês',
        changeType: 'positive' as const,
        icon: Building2,
        color: 'bg-primary/10 text-primary',
    },
    {
        title: 'Faturamento Mensal',
        value: 'R$ 18.500',
        change: '+8% vs mês anterior',
        changeType: 'positive' as const,
        icon: CreditCard,
        color: 'bg-success/10 text-success',
    },
    {
        title: 'Total de Usuários',
        value: '1.284',
        change: '+156 este mês',
        changeType: 'positive' as const,
        icon: Users,
        color: 'bg-info/10 text-info',
    },
    {
        title: 'Clínicas Inativas',
        value: '5',
        change: '2 cancelamentos',
        changeType: 'negative' as const,
        icon: AlertCircle,
        color: 'bg-destructive/10 text-destructive',
    },
];

const recentClinics = [
    {
        id: 4,
        name: 'Aurora Fisioterapia',
        plan: 'Start',
        date: '16/02/2026',
        status: 1,
    },
    {
        id: 3,
        name: 'Marileide Cavalcante',
        plan: 'Start',
        date: '16/02/2026',
        status: 1,
    },
    {
        id: 1,
        name: 'Cleverton Santos',
        plan: 'Start',
        date: '11/02/2026',
        status: 1,
    },
    {
        id: 5,
        name: 'FisioVida Clínica',
        plan: 'Enterprise',
        date: '10/01/2026',
        status: 1,
    },
];

const planDistribution = [
    { name: 'Start', count: 25, color: 'bg-primary' },
    { name: 'Profissional', count: 12, color: 'bg-info' },
    { name: 'Enterprise', count: 5, color: 'bg-success' },
];

const recentActivity = [
    {
        id: 1,
        action: 'Nova clínica cadastrada',
        description: 'Aurora Fisioterapia — Plano Start',
        time: '2h atrás',
        icon: Building2,
    },
    {
        id: 2,
        action: 'Upgrade de plano',
        description: 'FisioVida → Enterprise',
        time: '5h atrás',
        icon: TrendingUp,
    },
    {
        id: 3,
        action: 'Clínica inativada',
        description: 'Centro Reabilitação Esperança',
        time: '1 dia atrás',
        icon: AlertCircle,
    },
    {
        id: 4,
        action: 'Novo pagamento',
        description: 'R$ 299,00 — Marileide Cavalcante',
        time: '2 dias atrás',
        icon: CreditCard,
    },
];

export default function AdminDashboardPage() {
    const { data: pendingExercises = 0 } = usePendingExerciseCount();

    return (
        <AdminLayout>
            <div className="space-y-6 p-6">
                {/* Aviso de exercícios enviados por clínicas a revisar */}
                {pendingExercises > 0 && (
                    <Link
                        to="/admin/exercicios/revisar"
                        className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm transition-colors hover:bg-warning/20"
                    >
                        <div className="rounded-lg bg-warning/20 p-2 text-warning-foreground">
                            <Dumbbell className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">
                            {pendingExercises} exercício
                            {pendingExercises !== 1 ? 's' : ''} enviado
                            {pendingExercises !== 1 ? 's' : ''} por clínicas
                            aguardando revisão
                        </span>
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Link>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Painel Administrativo
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Visão geral da plataforma FisioElite.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date().toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {stat.title}
                                        </p>
                                        <p className="text-3xl font-bold text-foreground">
                                            {stat.value}
                                        </p>
                                        <p
                                            className={`text-sm ${stat.changeType === 'positive' ? 'text-success' : stat.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`}
                                        >
                                            {stat.changeType === 'positive' && (
                                                <TrendingUp className="mr-1 inline h-3 w-3" />
                                            )}
                                            {stat.change}
                                        </p>
                                    </div>
                                    <div
                                        className={`rounded-lg p-3 ${stat.color}`}
                                    >
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Recent Clinics */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">
                                    Clínicas Recentes
                                </CardTitle>
                                <CardDescription>
                                    Últimas clínicas cadastradas
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/admin/clinicas" className="gap-1">
                                    Ver todas{' '}
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentClinics.map((clinic) => (
                                    <div
                                        key={clinic.id}
                                        className="flex items-center gap-4 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                                {clinic.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-foreground">
                                                {clinic.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Plano {clinic.plan}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">
                                                {clinic.date}
                                            </p>
                                            <StatusBadge
                                                variant="active"
                                                className="mt-1"
                                            >
                                                Ativo
                                            </StatusBadge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan Distribution + Activity */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Distribuição de Planos
                                </CardTitle>
                                <CardDescription>
                                    Clínicas por plano
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {planDistribution.map((plan) => (
                                        <div
                                            key={plan.name}
                                            className="space-y-2"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-foreground">
                                                    {plan.name}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {plan.count} clínicas
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={`h-full rounded-full ${plan.color}`}
                                                    style={{
                                                        width: `${(plan.count / 42) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Atividade Recente
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivity.map((a) => (
                                        <div
                                            key={a.id}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="rounded-lg bg-muted p-2">
                                                <a.icon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-foreground">
                                                    {a.action}
                                                </p>
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {a.description}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {a.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
