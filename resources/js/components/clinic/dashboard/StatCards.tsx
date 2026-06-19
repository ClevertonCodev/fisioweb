import { Calendar, Dumbbell, FileText, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardCards } from '@/domain/clinic/dashboard';

interface StatCardsProps {
    cards?: DashboardCards;
    isLoading: boolean;
}

export function StatCards({ cards, isLoading }: StatCardsProps) {
    const items = [
        {
            title: 'Pacientes Ativos',
            value: cards?.activePatients,
            hint: 'Em tratamento, treinamento ou prevenção',
            icon: Users,
            color: 'bg-primary/10 text-primary',
        },
        {
            title: 'Consultas Hoje',
            value: cards?.appointmentsToday,
            hint: 'Agendadas para hoje',
            icon: Calendar,
            color: 'bg-info/10 text-info',
        },
        {
            title: 'Programas Ativos',
            value: cards?.activePrograms,
            hint: 'Vigentes no mês',
            icon: FileText,
            color: 'bg-success/10 text-success',
        },
        {
            title: 'Exercícios Disponíveis',
            value: cards?.availableExercises.count,
            hint: cards
                ? `${cards.availableExercises.categoriesCount} categorias`
                : undefined,
            icon: Dumbbell,
            color: 'bg-warning/10 text-warning-foreground',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((stat) => (
                <Card key={stat.title}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    {stat.title}
                                </p>
                                {isLoading || stat.value === undefined ? (
                                    <Skeleton className="h-9 w-16" />
                                ) : (
                                    <p className="text-3xl font-bold text-foreground">
                                        {stat.value}
                                    </p>
                                )}
                                {stat.hint && (
                                    <p className="text-sm text-muted-foreground">
                                        {stat.hint}
                                    </p>
                                )}
                            </div>
                            <div className={`rounded-lg p-3 ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
