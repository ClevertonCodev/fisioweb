import {
    Calendar,
    ChevronRight,
    Clock,
    Dumbbell,
    FileText,
    TrendingUp,
    UserCheck,
    Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        color: 'bg-info/10 text-info',
    },
    {
        title: 'Programas Ativos',
        value: '45',
        change: '+5 esta semana',
        changeType: 'positive' as const,
        icon: FileText,
        color: 'bg-success/10 text-success',
    },
    {
        title: 'Exercícios Disponíveis',
        value: '320',
        change: '15 categorias',
        changeType: 'neutral' as const,
        icon: Dumbbell,
        color: 'bg-warning/10 text-warning-foreground',
    },
];

const upcomingAppointments = [
    {
        id: 1,
        patient: 'Maria Silva',
        avatar: '',
        time: '09:00',
        type: 'Avaliação',
        status: 'confirmed',
    },
    {
        id: 2,
        patient: 'João Santos',
        avatar: '',
        time: '10:30',
        type: 'Retorno',
        status: 'confirmed',
    },
    {
        id: 3,
        patient: 'Ana Costa',
        avatar: '',
        time: '14:00',
        type: 'Sessão',
        status: 'pending',
    },
    {
        id: 4,
        patient: 'Carlos Oliveira',
        avatar: '',
        time: '15:30',
        type: 'Sessão',
        status: 'confirmed',
    },
];

const recentActivity = [
    {
        id: 1,
        action: 'Programa criado',
        description: 'Reabilitação de Joelho - Maria Silva',
        time: '10 min atrás',
        icon: FileText,
    },
    {
        id: 2,
        action: 'Consulta finalizada',
        description: 'João Santos - Sessão de Pilates',
        time: '1h atrás',
        icon: UserCheck,
    },
    {
        id: 3,
        action: 'Novo paciente',
        description: 'Pedro Almeida cadastrado',
        time: '2h atrás',
        icon: Users,
    },
    {
        id: 4,
        action: 'Exercício adicionado',
        description: '5 novos exercícios de alongamento',
        time: '3h atrás',
        icon: Dumbbell,
    },
];

const quickActions = [
    {
        title: 'Novo Paciente',
        description: 'Cadastrar um novo paciente',
        icon: Users,
        href: '/clinica/pacientes/novo',
    },
    {
        title: 'Agendar Consulta',
        description: 'Criar novo agendamento',
        icon: Calendar,
        href: '/clinica/agenda/nova',
    },
    {
        title: 'Criar Programa',
        description: 'Montar programa de exercícios',
        icon: FileText,
        href: '/clinica/programas/novo',
    },
    {
        title: 'Ver Exercícios',
        description: 'Explorar biblioteca de exercícios',
        icon: Dumbbell,
        href: '/clinica/exercicios',
    },
];

export default function DashboardPage() {
    return (
        <ClinicLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-foreground text-2xl font-semibold">
                            Bem-vindo de volta! 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Aqui está o resumo da sua clínica hoje.
                        </p>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        {new Date().toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-muted-foreground text-sm">
                                            {stat.title}
                                        </p>
                                        <p className="text-foreground text-3xl font-bold">
                                            {stat.value}
                                        </p>
                                        <p
                                            className={`text-sm ${
                                                stat.changeType === 'positive'
                                                    ? 'text-success'
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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Upcoming Appointments */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Próximas Consultas</CardTitle>
                                <CardDescription>Agenda de hoje</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/clinica/agenda" className="gap-1">
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
                                        className="bg-muted/50 hover:bg-muted flex items-center gap-4 rounded-lg p-3 transition-colors"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={appointment.avatar} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                {appointment.patient
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-foreground truncate font-medium">
                                                {appointment.patient}
                                            </p>
                                            <p className="text-muted-foreground text-sm">
                                                {appointment.type}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-foreground font-medium">
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
                                        <div className="bg-muted rounded-lg p-2">
                                            <activity.icon className="text-muted-foreground h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-foreground text-sm font-medium">
                                                {activity.action}
                                            </p>
                                            <p className="text-muted-foreground truncate text-sm">
                                                {activity.description}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-xs">
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
                        <CardDescription>
                            Acesso rápido às principais funcionalidades
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.title}
                                    to={action.href}
                                    className="border-border bg-card hover:bg-accent hover:border-primary/20 group flex items-center gap-4 rounded-lg border p-4 transition-all"
                                >
                                    <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground rounded-lg p-3 transition-colors">
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium">
                                            {action.title}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {action.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ClinicLayout>
    );
}
