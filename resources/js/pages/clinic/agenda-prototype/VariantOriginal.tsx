import { Plus } from 'lucide-react';
import { lazy, Suspense } from 'react';

import { CalendarSidebar } from '@/components/clinic/agenda/CalendarSidebar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import type { AgendaPrototypeProps } from './shared';

const CalendarView = lazy(() =>
    import('@/components/clinic/agenda/CalendarView').then((m) => ({
        default: m.CalendarView,
    })),
);

/** O — a agenda de hoje (shadcn v1), sem mudanças, para comparar. */
export function VariantOriginal({
    events,
    clinicUsers,
    selectedUserId,
    onUserChange,
    filteredPatientName,
    calendarKey,
    calendarInitialDate,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
    onNewConsulta,
}: AgendaPrototypeProps) {
    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-foreground">
                        Agenda
                    </h1>
                    {filteredPatientName && (
                        <p className="truncate text-sm text-muted-foreground">
                            Agendamentos de {filteredPatientName}
                        </p>
                    )}
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={onNewConsulta}>
                            <Plus className="h-4 w-4" />
                            Nova Consulta
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Agendar nova consulta</TooltipContent>
                </Tooltip>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
                <CalendarSidebar
                    clinicUsers={clinicUsers}
                    selectedUserId={selectedUserId}
                    onUserChange={onUserChange}
                />
                <div className="flex-1 overflow-auto p-4">
                    <Suspense
                        fallback={
                            <Skeleton className="h-[600px] w-full rounded-lg" />
                        }
                    >
                        <CalendarView
                            key={calendarKey}
                            events={events}
                            initialDate={calendarInitialDate}
                            onEventClick={onEventClick}
                            onDateClick={onDateClick}
                            onEventDrop={onEventDrop}
                            onEventResize={onEventResize}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
