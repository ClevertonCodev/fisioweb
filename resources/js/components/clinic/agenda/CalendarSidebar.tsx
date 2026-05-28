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
        <div className="border-border bg-card hidden w-56 shrink-0 space-y-6 border-r p-4 lg:block">
            {/* Fisioterapeutas */}
            <div className="space-y-3">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Fisioterapeutas
                </h3>
                <div className="space-y-1">
                    <button
                        onClick={() => onUserChange(undefined)}
                        className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                            !selectedUserId
                                ? 'bg-accent text-accent-foreground font-medium'
                                : 'text-foreground hover:bg-muted',
                        )}
                    >
                        Todos
                    </button>
                    {clinicUsers.map((user) => (
                        <button
                            key={user.id}
                            onClick={() =>
                                onUserChange(selectedUserId === user.id ? undefined : user.id)
                            }
                            className={cn(
                                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                selectedUserId === user.id
                                    ? 'bg-accent text-accent-foreground font-medium'
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
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Status
                </h3>
                <div className="space-y-2">
                    {Object.entries(STATUS_COLORS).map(([, { bg, label }]) => (
                        <div key={label} className="flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: bg }}
                            />
                            <span className="text-muted-foreground text-sm">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
