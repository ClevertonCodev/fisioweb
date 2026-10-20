/**
 * PROTÓTIPO (descartável): novo questionário no DS v2, na rota real
 * /clinica/questionarios/novo (com ?returnTo= do prontuário), trocado por
 * ?variant= (O = v1). C, "Banco de perguntas", é a escolhida: perguntas
 * prontas + roteiro + ajuste da pergunta. As descartadas (A, construtor +
 * celular; B, escrever como texto) não foram commitadas.
 *
 * Salvar é stub e volta para o returnTo.
 */
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { NEW_QUESTIONNAIRE_VARIANTS, useQuestionnaireBuilder } from './shared';
import { VariantC } from './VariantC';

function Builder() {
    // Começa com uma seção vazia, para encher pelo banco de perguntas.
    const b = useQuestionnaireBuilder([
        { _key: 'c1', title: 'Perguntas', questions: [] },
    ]);
    return <VariantC b={b} />;
}

export default function QuestionnaireNewPrototype({
    variant,
}: {
    variant: string;
}) {
    return (
        <ClinicLayout>
            <Builder />
            <PrototypeSwitcher
                variants={NEW_QUESTIONNAIRE_VARIANTS}
                current={variant}
            />
        </ClinicLayout>
    );
}
