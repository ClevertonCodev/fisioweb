import { CalendarCheck, Plus, Star } from 'lucide-react';

import type { AlertVariant, BadgeVariant } from '@/components/ds';
import {
    DsAlert,
    DsBadge,
    DsBanner,
    DsButton,
    DsEmptyState,
} from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const BADGES: BadgeVariant[] = [
    'default',
    'primary',
    'info',
    'success',
    'warning',
    'danger',
    'new',
];
const ALERTS: AlertVariant[] = ['info', 'success', 'warning', 'danger'];

export function FeedbackSection() {
    return (
        <CatalogSection
            id="feedback"
            title="Badge, alert, banner e estado vazio"
            description="Componentes de estado. Alertas usam role=alert; banners, role=status."
        >
            <CatalogRow label="Badge">
                {BADGES.map((variant) => (
                    <DsBadge key={variant} variant={variant}>
                        {variant}
                    </DsBadge>
                ))}
                <DsBadge variant="success" dot>
                    Ativo
                </DsBadge>
                <DsBadge variant="primary" icon={<Star />}>
                    Favorito
                </DsBadge>
            </CatalogRow>
            <CatalogRow label="Alert (compact)">
                <div className="flex w-full flex-col gap-3">
                    {ALERTS.map((variant) => (
                        <DsAlert key={variant} variant={variant} dismissible>
                            Alerta {variant}: sessão de hoje confirmada.
                        </DsAlert>
                    ))}
                </div>
            </CatalogRow>
            <CatalogRow label="Alert (rich)">
                <div className="w-full">
                    <DsAlert
                        variant="warning"
                        mode="rich"
                        title="Sessão remarcada"
                        time="há 5 min"
                        icon={<CalendarCheck />}
                        dismissible
                        actions={
                            <>
                                <DsButton size="sm" label="Ver agenda" />
                                <DsButton
                                    size="sm"
                                    variant="tertiary"
                                    label="Ignorar"
                                />
                            </>
                        }
                    >
                        O paciente pediu para mudar o horário de quinta para
                        sexta às 14h.
                    </DsAlert>
                </div>
            </CatalogRow>
            <CatalogRow label="Banner">
                <div className="flex w-full flex-col gap-3">
                    <DsBanner
                        title="Novo prontuário"
                        description="Evoluções com modelos prontos e assinatura digital."
                        ctaLabel="Conhecer"
                    />
                    <DsBanner
                        variant="info"
                        title="Manutenção programada"
                        description="O sistema fica fora do ar domingo, das 2h às 4h."
                        ctaLabel="Detalhes"
                    />
                    <DsBanner
                        variant="warning"
                        title="Plano perto do limite"
                        description="Você usou 90% dos pacientes do plano."
                        dismissible={false}
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="Estado vazio">
                <div className="grid w-full gap-4 sm:grid-cols-2">
                    <DsEmptyState
                        action={
                            <DsButton
                                size="sm"
                                label="Cadastrar"
                                iconPosition="left"
                                icon={<Plus />}
                            />
                        }
                    />
                    <DsEmptyState variant="no-results" />
                    <DsEmptyState variant="no-permission" />
                    <DsEmptyState
                        variant="error"
                        action={
                            <DsButton
                                size="sm"
                                variant="secondary"
                                label="Tentar de novo"
                            />
                        }
                    />
                </div>
            </CatalogRow>
        </CatalogSection>
    );
}
