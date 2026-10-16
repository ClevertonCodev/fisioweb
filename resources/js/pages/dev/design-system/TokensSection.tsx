import { CatalogRow, CatalogSection } from './CatalogSection';

const PRIMARY = ['10', '20', '30', '40', '50', '60', '80', '100', '120'];
const GRAY = [
    '10',
    '15',
    '20',
    '25',
    '30',
    '40',
    '50',
    '60',
    '70',
    '80',
    '100',
];
const STATUS = ['info', 'success', 'warning', 'danger'] as const;
const SEMANTIC = [
    'surface-body',
    'surface-default',
    'surface-subtle',
    'surface-brand-subtle',
    'surface-inverse',
    'surface-disabled',
    'content-primary',
    'content-secondary',
    'content-muted',
    'content-subtle',
    'content-brand',
    'border-subtle',
];
const TYPE_SCALE = [
    ['h1', 'var(--ds-font-size-h1)', 'var(--ds-heading-h1-ls)'],
    ['h2', 'var(--ds-font-size-h2)', 'var(--ds-heading-h2-ls)'],
    ['h3', 'var(--ds-font-size-h3)', 'var(--ds-heading-h3-ls)'],
    ['h4', 'var(--ds-font-size-h4)', 'var(--ds-heading-h4-ls)'],
    ['page-title', 'var(--ds-font-size-page-title)', 'var(--ds-page-title-ls)'],
    ['body-lg', 'var(--ds-font-size-body-lg)', 'normal'],
    ['body-md', 'var(--ds-font-size-body-md)', 'normal'],
    ['body-sm', 'var(--ds-font-size-body-sm)', 'normal'],
    ['body-emphasis', 'var(--ds-font-size-body-emphasis)', 'normal'],
    ['body-xs', 'var(--ds-font-size-body-xs)', 'normal'],
    ['body-compact', 'var(--ds-font-size-body-compact)', 'normal'],
    ['caption', 'var(--ds-font-size-caption)', 'normal'],
    ['micro', 'var(--ds-font-size-micro)', 'normal'],
] as const;
const RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'pill'];
const SHADOWS = ['xs', 'sm', 'md', 'focus', 'focus-success', 'focus-danger'];

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
    return (
        <div className="flex w-24 flex-col gap-1">
            <div
                className="h-12 rounded-ds-md border border-ds-border-subtle"
                style={{ background: `var(${cssVar})` }}
            />
            <span className="font-ds-mono text-ds-micro text-ds-content-muted">
                {name}
            </span>
        </div>
    );
}

export function TokensSection() {
    return (
        <CatalogSection
            id="tokens"
            title="Tokens"
            description="Variáveis --ds-*. As semânticas mudam no tema escuro; a paleta crua não."
        >
            <CatalogRow label="Primária">
                {PRIMARY.map((w) => (
                    <Swatch
                        key={w}
                        name={`primary-${w}`}
                        cssVar={`--ds-color-primary-${w}`}
                    />
                ))}
            </CatalogRow>
            <CatalogRow label="Neutros">
                {GRAY.map((w) => (
                    <Swatch
                        key={w}
                        name={`gray-${w}`}
                        cssVar={`--ds-color-gray-${w}`}
                    />
                ))}
            </CatalogRow>
            <CatalogRow label="Status (semânticos)">
                {STATUS.flatMap((s) =>
                    ['surface', 'border', 'content'].map((role) => (
                        <Swatch
                            key={`${s}-${role}`}
                            name={`${s}-${role}`}
                            cssVar={`--ds-status-${s}-${role}`}
                        />
                    )),
                )}
            </CatalogRow>
            <CatalogRow label="Superfície, conteúdo e borda">
                {SEMANTIC.map((name) => (
                    <Swatch key={name} name={name} cssVar={`--ds-${name}`} />
                ))}
            </CatalogRow>
            <CatalogRow label="Gradientes">
                <Swatch name="gradient-brand" cssVar="--ds-gradient-brand" />
                <Swatch
                    name="gradient-brand-subtle"
                    cssVar="--ds-gradient-brand-subtle"
                />
            </CatalogRow>
            <CatalogRow label="Tipografia — Poppins">
                <div className="flex w-full flex-col gap-2">
                    {TYPE_SCALE.map(([name, size, ls]) => (
                        <div key={name} className="flex items-baseline gap-4">
                            <span className="w-28 shrink-0 font-ds-mono text-ds-caption text-ds-content-subtle">
                                {name}
                            </span>
                            <span
                                className="leading-[var(--ds-line-height-heading)] font-semibold text-ds-content-primary"
                                style={{ fontSize: size, letterSpacing: ls }}
                            >
                                Reabilitação com cuidado
                            </span>
                        </div>
                    ))}
                </div>
            </CatalogRow>
            <CatalogRow label="Geist Mono — eyebrow">
                <span className="font-ds-mono text-ds-eyebrow tracking-wide text-ds-content-brand uppercase">
                    Programa de exercícios
                </span>
            </CatalogRow>
            <CatalogRow label="Raios">
                {RADII.map((r) => (
                    <div key={r} className="flex flex-col items-center gap-1">
                        <div
                            className="size-14 border border-ds-border-brand-subtle bg-ds-surface-brand-subtle"
                            style={{ borderRadius: `var(--ds-radius-${r})` }}
                        />
                        <span className="font-ds-mono text-ds-micro text-ds-content-muted">
                            {r}
                        </span>
                    </div>
                ))}
            </CatalogRow>
            <CatalogRow label="Sombras">
                {SHADOWS.map((s) => (
                    <div key={s} className="flex flex-col items-center gap-1">
                        <div
                            className="size-14 rounded-ds-md bg-ds-surface-default"
                            style={{ boxShadow: `var(--ds-shadow-${s})` }}
                        />
                        <span className="font-ds-mono text-ds-micro text-ds-content-muted">
                            {s}
                        </span>
                    </div>
                ))}
            </CatalogRow>
        </CatalogSection>
    );
}
