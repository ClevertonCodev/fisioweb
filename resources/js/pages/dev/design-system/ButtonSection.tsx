import { ArrowRight, Plus, RefreshCw, Trash2 } from 'lucide-react';

import type { ButtonSize, ButtonVariant } from '@/components/ds';
import { DsButton, DsTooltip } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const VARIANTS: ButtonVariant[] = [
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'destructive-secondary',
    'destructive-tertiary',
];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

export function ButtonSection() {
    return (
        <CatalogSection
            id="botao"
            title="Botão e tooltip"
            description="DsButton e DsTooltip. Botão só de ícone sempre mostra tooltip no hover e no foco."
        >
            {VARIANTS.map((variant) => (
                <CatalogRow key={variant} label={variant}>
                    {SIZES.map((size) => (
                        <DsButton
                            key={size}
                            variant={variant}
                            size={size}
                            label={`Botão ${size}`}
                        />
                    ))}
                    <DsButton
                        variant={variant}
                        label="Com ícone"
                        iconPosition="left"
                        icon={<Plus />}
                    />
                    <DsButton
                        variant={variant}
                        label="Avançar"
                        iconPosition="right"
                        icon={<ArrowRight />}
                    />
                    <DsButton
                        variant={variant}
                        label="Atualizar"
                        iconPosition="only"
                        icon={<RefreshCw />}
                    />
                    <DsButton variant={variant} label="Salvando" loading />
                    <DsButton variant={variant} label="Desabilitado" disabled />
                </CatalogRow>
            ))}
            <CatalogRow label="full">
                <div className="w-full max-w-sm">
                    <DsButton size="full" label="Confirmar agendamento" />
                </div>
            </CatalogRow>
            <CatalogRow label="Só ícone — posições do tooltip">
                {(['top', 'right', 'bottom', 'left'] as const).map((p) => (
                    <DsButton
                        key={p}
                        variant="secondary"
                        iconPosition="only"
                        label="Excluir"
                        tooltip={`Excluir (${p})`}
                        tooltipPlacement={p}
                        icon={<Trash2 />}
                    />
                ))}
            </CatalogRow>
            <CatalogRow label="DsTooltip em qualquer elemento">
                <DsTooltip content={'Texto longo que quebra em\nvárias linhas'}>
                    <span className="rounded-ds-sm border border-dashed border-ds-border-default px-2 py-1 text-ds-body-xs">
                        Passe o mouse
                    </span>
                </DsTooltip>
            </CatalogRow>
        </CatalogSection>
    );
}
