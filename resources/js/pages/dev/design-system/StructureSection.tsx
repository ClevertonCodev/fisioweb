import {
    Activity,
    CalendarDays,
    MoreHorizontal,
    Users,
    Wallet,
} from 'lucide-react';

import type { CardVariant } from '@/components/ds';
import { DsBadge, DsButton, DsCard, DsKpi, DsList } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const VARIANTS: CardVariant[] = [
    'default',
    'outlined',
    'elevated',
    'brand',
    'interactive',
];

// SVG simples no lugar de foto (sem asset externo).
const MEDIA = (
    <div className="grid size-full place-items-center bg-[image:var(--ds-gradient-brand-subtle)] text-ds-primary-80">
        <Activity className="size-12" aria-hidden="true" />
    </div>
);

export function StructureSection() {
    return (
        <CatalogSection
            id="estrutura"
            title="Card, KPI e lista"
            description="Blocos de painel. Slots do Vue viram props (header, corner, footer, media)."
        >
            <CatalogRow label="Card — variantes">
                <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {VARIANTS.map((variant) => (
                        <DsCard
                            key={variant}
                            variant={variant}
                            tabIndex={variant === 'interactive' ? 0 : undefined}
                            header={
                                <>
                                    <h3>Card {variant}</h3>
                                    <p>Plano de tratamento</p>
                                </>
                            }
                            corner={
                                <DsButton
                                    size="sm"
                                    variant="tertiary"
                                    iconPosition="only"
                                    label="Mais ações"
                                    icon={<MoreHorizontal />}
                                />
                            }
                            footer={
                                <DsBadge variant="success">
                                    Em andamento
                                </DsBadge>
                            }
                        >
                            Joelho direito, 10 sessões, 2x por semana.
                        </DsCard>
                    ))}
                </div>
            </CatalogRow>
            <CatalogRow label="Card — mídia, compact e horizontal">
                <div className="grid w-full gap-4 lg:grid-cols-2">
                    <DsCard media={MEDIA} header={<h3>Agachamento livre</h3>}>
                        3 séries de 12 repetições.
                    </DsCard>
                    <div className="flex flex-col gap-4">
                        <DsCard
                            horizontal
                            media={MEDIA}
                            header={<h3>Horizontal</h3>}
                        >
                            Mídia à esquerda, conteúdo à direita.
                        </DsCard>
                        <DsCard compact header={<h3>Compact</h3>}>
                            Espaçamento menor.
                        </DsCard>
                    </div>
                </div>
            </CatalogRow>
            <CatalogRow label="KPI">
                <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DsKpi
                        label="Pacientes ativos"
                        value={128}
                        delta="+12% no mês"
                        trend="up"
                        icon={<Users />}
                    />
                    <DsKpi
                        label="Faltas"
                        value="7"
                        delta="-3 sessões"
                        trend="down"
                        icon={<CalendarDays />}
                    />
                    <DsKpi
                        label="Receita"
                        value="R$ 18,4 mil"
                        delta="igual ao mês anterior"
                        trend="neutral"
                        icon={<Wallet />}
                    />
                    <DsKpi label="Carregando" value={0} loading />
                </div>
            </CatalogRow>
            <CatalogRow label="Lista">
                <div className="grid w-full gap-6 lg:grid-cols-2">
                    <DsList
                        items={[
                            {
                                key: '1',
                                icon: <CalendarDays />,
                                text: 'Sessão de fisioterapia',
                                sub: 'Joelho direito',
                                meta: '14h',
                            },
                            {
                                key: '2',
                                icon: <Activity />,
                                text: 'Reavaliação',
                                sub: 'Ombro esquerdo',
                                meta: '16h',
                            },
                            { key: '3', text: 'Sem ícone', meta: '17h' },
                        ]}
                    />
                    <DsList
                        mode="kv"
                        items={[
                            {
                                key: 'conv',
                                label: 'Convênio',
                                value: 'Particular',
                            },
                            {
                                key: 'freq',
                                label: 'Frequência',
                                value: '2x por semana',
                            },
                            { key: 'status', label: 'Status', value: 'ativo' },
                        ]}
                        renderValue={(item) =>
                            item.key === 'status' ? (
                                <DsBadge variant="success" dot>
                                    Ativo
                                </DsBadge>
                            ) : (
                                item.value
                            )
                        }
                    />
                </div>
            </CatalogRow>
        </CatalogSection>
    );
}
