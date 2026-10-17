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
import { DsCard, DsEmptyState, DsList } from '@/components/ds';

import { relativeTime } from './dashboard-format';

const ACTIVITY_ICONS: Record<string, typeof Users> = {
    patient_created: Users,
    patient_updated: UserCog,
    program_created: FileText,
    program_completed: FileCheck,
    appointment_scheduled: Calendar,
    appointment_completed: CalendarCheck,
    appointment_cancelled: CalendarX,
    exercises_added: Dumbbell,
};

export function RecentActivitiesCard({ enabled }: { enabled: boolean }) {
    const activities = useRecentActivities(enabled);

    if (!enabled) return null;

    return (
        <DsCard
            header={
                <>
                    <h3>Atividade recente</h3>
                    <p>Últimas ações da clínica hoje</p>
                </>
            }
        >
            {activities.isError ? (
                <DsEmptyState variant="error" title="Atividades" />
            ) : activities.isLoading ? (
                <p>Carregando…</p>
            ) : !activities.data?.length ? (
                <DsEmptyState
                    variant="empty"
                    title="Nenhuma atividade registrada hoje"
                    description="As ações da equipe de hoje aparecem aqui."
                />
            ) : (
                <DsList
                    items={activities.data.map((item) => {
                        const Icon = ACTIVITY_ICONS[item.type] ?? FileText;
                        return {
                            key: item.id,
                            icon: <Icon />,
                            text: item.description,
                            sub: item.actorName,
                            meta: relativeTime(item.createdAt),
                        };
                    })}
                />
            )}
        </DsCard>
    );
}
