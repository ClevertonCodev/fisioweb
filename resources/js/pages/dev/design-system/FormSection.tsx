import { CatalogSection } from './CatalogSection';
import { ExampleForm } from './ExampleForm';

export function FormSection() {
    return (
        <CatalogSection
            id="formulario"
            title="Formulário de exemplo"
            description="React Hook Form + Zod com campos do DS: register nos campos nativos, Controller nos que emitem valor próprio."
        >
            <ExampleForm />
        </CatalogSection>
    );
}
