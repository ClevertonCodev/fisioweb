import { Head, Link } from '@inertiajs/react';
import {
    Users,
    Calendar,
    Dumbbell,
    TrendingUp,
    Clock,
    ChevronRight,
    UserCheck,
    FileText,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ClinicLayout from '@/layouts/clinic-layout';

const stats = [
    {
        title: 'Pacientes Ativos',
        value: '128',
        change: '+12%',
        changeType: 'positive' as const,
        icon: Users,
        color: 'bg-primary/10 text-primary',
    },
    {
        title: 'Consultas Hoje',
        value: '8',
        change: '3 confirmadas',
        changeType: 'neutral' as const,
        icon: Calendar,
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
        title: 'Programas Ativos',
        value: '45',
        change: '+5 esta semana',
        changeType: 'positive' as const,
        icon: FileText,
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
        title: 'Exercícios Disponíveis',
        value: '320',
        change: '15 categorias',
        changeType: 'neutral' as const,
        icon: Dumbbell,
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
];

const upcomingAppointments = [
    { id: 1, patient: 'Maria Silva', avatar: '', time: '09:00', type: 'Avaliação', status: 'confirmed' as const },
    { id: 2, patient: 'João Santos', avatar: '', time: '10:30', type: 'Retorno', status: 'confirmed' as const },
    { id: 3, patient: 'Ana Costa', avatar: '', time: '14:00', type: 'Sessão', status: 'pending' as const },
    { id: 4, patient: 'Carlos Oliveira', avatar: '', time: '15:30', type: 'Sessão', status: 'confirmed' as const },
];

const recentActivity = [
    { id: 1, action: 'Programa criado', description: 'Reabilitação de Joelho - Maria Silva', time: '10 min atrás', icon: FileText },
    { id: 2, action: 'Consulta finalizada', description: 'João Santos - Sessão de Pilates', time: '1h atrás', icon: UserCheck },
    { id: 3, action: 'Novo paciente', description: 'Pedro Almeida cadastrado', time: '2h atrás', icon: Users },
    { id: 4, action: 'Exercício adicionado', description: '5 novos exercícios de alongamento', time: '3h atrás', icon: Dumbbell },
];

const quickActions = [
    { title: 'Novo Paciente', description: 'Cadastrar um novo paciente', icon: Users, href: '#', comingSoon: true },
    { title: 'Agendar Consulta', description: 'Criar novo agendamento', icon: Calendar, href: '#', comingSoon: true },
    { title: 'Criar Programa', description: 'Montar programa de exercícios', icon: FileText, href: '#', comingSoon: true },
    { title: 'Ver Exercícios', description: 'Explorar biblioteca de exercícios', icon: Dumbbell, href: '/clinic/exercises', comingSoon: false },
];

export default function Dashboard() {
    return (
        <ClinicLayout>
            <Head title="Dashboard Clínica" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Bem-vindo de volta!
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Aqui está o resumo da sua clínica hoje.
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

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                                        <p
                                            className={`text-sm ${stat.changeType === 'positive'
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-muted-foreground'
                                                }`}
                                        >
                                            {stat.changeType === 'positive' && (
                                                <TrendingUp className="mr-1 inline h-3 w-3" />
                                            )}
                                            {stat.change}
                                        </p>
                                    </div>
                                    <div className={`rounded-lg p-3 ${stat.color}`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Upcoming Appointments */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Próximas Consultas</CardTitle>
                                <CardDescription>Agenda de hoje</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="#" className="gap-1">
                                    Ver agenda
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center gap-4 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={appointment.avatar} />
                                            <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                                {appointment.patient
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-foreground">
                                                {appointment.patient}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {appointment.type}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-foreground">
                                                {appointment.time}
                                            </p>
                                            <Badge
                                                variant={
                                                    appointment.status === 'confirmed'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="mt-1"
                                            >
                                                {appointment.status === 'confirmed'
                                                    ? 'Confirmado'
                                                    : 'Pendente'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Atividade Recente</CardTitle>
                            <CardDescription>Últimas ações realizadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3">
                                        <div className="rounded-lg bg-muted p-2">
                                            <activity.icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground">
                                                {activity.action}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {activity.description}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                        <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {quickActions.map((action) => {
                                const content = (
                                    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20 hover:bg-accent group">
                                        <div className="rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                            <action.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{action.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {action.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                                return action.comingSoon ? (
                                    <div key={action.title} className="cursor-not-allowed opacity-70">
                                        {content}
                                    </div>
                                ) : (
                                    <Link key={action.title} href={action.href}>
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ClinicLayout>
    );
}
