import {
    Calendar,
    CalendarCheck,
    CalendarX,
    Dumbbell,
    FileCheck,
    FileText,
    UserCog,
    Users,
} from 'lucide-react';

import { useRecentActivities } from '@/application/clinic/use-dashboard';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentActivitiesProps {
    /** Vem de viewer.canViewActivities — só admin/secretário (FR-023). */
    enabled: boolean;
}

const ICONS: Record<string, typeof Users> = {
    patient_created: Users,
    patient_updated: UserCog,
    program_created: FileText,
    program_completed: FileCheck,
    appointment_scheduled: Calendar,
    appointment_completed: CalendarCheck,
    appointment_cancelled: CalendarX,
    exercises_added: Dumbbell,
};

function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'agora mesmo';
    if (min < 60) return `${min} min atrás`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
}

export function RecentActivities({ enabled }: RecentActivitiesProps) {
    const { data, isLoading, isError } = useRecentActivities(enabled);

    if (!enabled) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Atividade Recente</CardTitle>
                <CardDescription>Últimas ações da clínica hoje</CardDescription>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Não foi possível carregar as atividades.
                    </p>
                ) : isLoading ? (
                    <div className="space-y-4">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : !data || data.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhuma atividade registrada hoje.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {data.map((activity) => {
                            const Icon = ICONS[activity.type] ?? FileText;
                            return (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-3"
                                >
                                    <div className="rounded-lg bg-muted p-2">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {activity.description}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {activity.actorName
                                                ? `${activity.actorName} · `
                                                : ''}
                                            {relativeTime(activity.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
