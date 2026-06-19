import { Calendar, Dumbbell, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface QuickAction {
    title: string;
    description: string;
    icon: typeof Users;
    to: string;
    /** Estado de rota — usado para abrir o modal "Nova consulta" na Agenda. */
    state?: Record<string, unknown>;
}

const actions: QuickAction[] = [
    {
        title: 'Novo Paciente',
        description: 'Cadastrar um novo paciente',
        icon: Users,
        to: '/clinica/pacientes/novo',
    },
    {
        title: 'Agendar Consulta',
        description: 'Criar novo agendamento',
        icon: Calendar,
        to: '/clinica/agenda',
        state: { openNewAppointment: true },
    },
    {
        title: 'Criar Programa',
        description: 'Montar programa de exercícios',
        icon: FileText,
        to: '/clinica/programas/novo',
    },
    {
        title: 'Ver Exercícios',
        description: 'Explorar biblioteca de exercícios',
        icon: Dumbbell,
        to: '/clinica/exercicios',
    },
];

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                <CardDescription>
                    Acesso rápido às principais funcionalidades
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {actions.map((action) => (
                        <Link
                            key={action.title}
                            to={action.to}
                            state={action.state}
                            className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20 hover:bg-accent"
                        >
                            <div className="rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <action.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">
                                    {action.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {action.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
