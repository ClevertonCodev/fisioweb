import { DsThemeToggle } from '@/components/ds';

import { ButtonSection } from './design-system/ButtonSection';
import { ChoicesSection } from './design-system/ChoicesSection';
import { DatepickerSection } from './design-system/DatepickerSection';
import { DocumentsSection } from './design-system/DocumentsSection';
import { FeedbackSection } from './design-system/FeedbackSection';
import { FormSection } from './design-system/FormSection';
import { NavigationSection } from './design-system/NavigationSection';
import { OverlaysSection } from './design-system/OverlaysSection';
import { SelectsSection } from './design-system/SelectsSection';
import { StructureSection } from './design-system/StructureSection';
import { TableSection } from './design-system/TableSection';
import { TextFieldsSection } from './design-system/TextFieldsSection';
import { TimepickerSection } from './design-system/TimepickerSection';
import { TokensSection } from './design-system/TokensSection';

const SECTIONS = [
    { id: 'tokens', label: 'Tokens', Component: TokensSection },
    { id: 'botao', label: 'Botão', Component: ButtonSection },
    {
        id: 'campos-texto',
        label: 'Campos de texto',
        Component: TextFieldsSection,
    },
    { id: 'escolhas', label: 'Escolhas', Component: ChoicesSection },
    { id: 'selects', label: 'Selects', Component: SelectsSection },
    { id: 'documentos', label: 'Documentos', Component: DocumentsSection },
    { id: 'formulario', label: 'Formulário', Component: FormSection },
    { id: 'feedback', label: 'Feedback', Component: FeedbackSection },
    { id: 'estrutura', label: 'Estrutura', Component: StructureSection },
    { id: 'navegacao', label: 'Navegação', Component: NavigationSection },
    { id: 'overlays', label: 'Overlays', Component: OverlaysSection },
    { id: 'data', label: 'Data', Component: DatepickerSection },
    { id: 'horario', label: 'Horário', Component: TimepickerSection },
    { id: 'tabela', label: 'Tabela', Component: TableSection },
];

/**
 * Catálogo do DS da versão 2. Só existe em desenvolvimento (ver routes/dev-routes).
 */
export default function DesignSystemPage() {
    return (
        // html/body da v1 têm overflow: hidden; a tela v2 rola no próprio contêiner.
        <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <header className="sticky top-0 z-10 border-b border-ds-border-subtle bg-ds-surface-default/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div>
                        <p className="font-ds-mono text-ds-caption tracking-wide text-ds-content-brand uppercase">
                            fisioweb DS · v2
                        </p>
                        <h1 className="text-ds-body-lg font-semibold">
                            Design system
                        </h1>
                    </div>
                    <DsThemeToggle />
                </div>
                <nav
                    aria-label="Seções do catálogo"
                    className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-3 text-ds-body-compact sm:px-6"
                >
                    {SECTIONS.map(({ id, label }) => (
                        <a
                            key={id}
                            href={`#${id}`}
                            className="shrink-0 text-ds-content-muted hover:text-ds-content-brand"
                        >
                            {label}
                        </a>
                    ))}
                </nav>
            </header>
            <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
                {SECTIONS.map(({ id, Component }) => (
                    <Component key={id} />
                ))}
            </main>
        </div>
    );
}
