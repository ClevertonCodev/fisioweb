import type { DashboardScope } from '@/domain/clinic/dashboard';
import { cn } from '@/lib/utils';

interface ScopeToggleProps {
    value: DashboardScope;
    onChange: (scope: DashboardScope) => void;
}

const OPTIONS: { value: DashboardScope; label: string }[] = [
    { value: 'clinic', label: 'Toda a clínica' },
    { value: 'mine', label: 'Somente meus' },
];

/**
 * Alterna o escopo dos widgets entre toda a clínica e os registros do próprio
 * admin (FR-004). Renderizado apenas quando `viewer.canToggleScope` é true.
 */
export function ScopeToggle({ value, onChange }: ScopeToggleProps) {
    return (
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            {OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        value === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
