import { LucideIcon } from 'lucide-react';
import { memo } from 'react';

interface MetricTileProps {
    icon: LucideIcon;
    label: string;
    value: string;
    unit?: string;
}

/**
 * Bloco compacto de métrica da prescrição. Número em Space Mono (fonte de dados
 * do design system) para dar identidade tipográfica ao painel.
 */
function MetricTileComponent({
    icon: Icon,
    label,
    value,
    unit,
}: MetricTileProps) {
    return (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium tracking-wide uppercase">
                    {label}
                </span>
            </div>
            <p className="font-mono text-lg leading-none font-bold text-foreground">
                {value}
                {unit && (
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                        {unit}
                    </span>
                )}
            </p>
        </div>
    );
}

export const MetricTile = memo(MetricTileComponent);
