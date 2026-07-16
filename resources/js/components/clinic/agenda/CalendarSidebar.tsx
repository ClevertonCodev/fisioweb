import { AgendaGoogleCalendarActions } from '@/components/clinic/agenda/AgendaGoogleCalendarActions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { STATUS_COLORS } from '@/domain/clinic';
import { cn } from '@/lib/utils';

interface CalendarSidebarProps {
    clinicUsers: { id: string; name: string }[];
    selectedUserId?: string;
    onUserChange: (id: string | undefined) => void;
}

export function CalendarSidebar({
    clinicUsers,
    selectedUserId,
    onUserChange,
}: CalendarSidebarProps) {
    return (
        <div className="hidden w-56 shrink-0 space-y-6 border-r border-border bg-card p-4 lg:block">
            {/* Fisioterapeutas */}
            <div className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Fisioterapeutas
                </h3>
                <div className="space-y-1">
                    <button
                        onClick={() => onUserChange(undefined)}
                        className={cn(
                            'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                            !selectedUserId
                                ? 'bg-accent font-medium text-accent-foreground'
                                : 'text-foreground hover:bg-muted',
                        )}
                    >
                        Todos
                    </button>
                    {clinicUsers.map((user) => (
                        <button
                            key={user.id}
                            onClick={() =>
                                onUserChange(
                                    selectedUserId === user.id
                                        ? undefined
                                        : user.id,
                                )
                            }
                            className={cn(
                                'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                selectedUserId === user.id
                                    ? 'bg-accent font-medium text-accent-foreground'
                                    : 'text-foreground hover:bg-muted',
                            )}
                        >
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                    {user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{user.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Legenda de status */}
            <div className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Status
                </h3>
                <div className="space-y-2">
                    {Object.entries(STATUS_COLORS).map(([, { bg, label }]) => (
                        <div key={label} className="flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: bg }}
                            />
                            <span className="text-sm text-muted-foreground">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            <AgendaGoogleCalendarActions />
        </div>
    );
}
