/**
 * PROTÓTIPO (descartável): responder ou ver uma avaliação no DS v2, na rota
 * real /clinica/pacientes/:id/avaliacoes/:assessmentId/editar, trocada por
 * ?variant= (O = v1).
 *
 * C, "Ficha e laudo", é a escolhida. As descartadas (A, formulário com
 * índice; B, uma seção por vez) não foram commitadas.
 * Avaliação, modelo, paciente e respostas são reais; salvar e assinar são
 * stub. Assinada abre só leitura; "Ver como rascunho" (?rascunho=1) libera
 * os campos para testar o preenchimento.
 */

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsEmptyState } from '@/components/ds';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { ANSWER_VARIANTS, useAssessmentAnswers } from './shared';
import { VariantC } from './VariantC';

function Body() {
    const s = useAssessmentAnswers();
    if (s.loading) {
        return <div className="h-full animate-pulse bg-ds-surface-body" />;
    }
    if (s.error || !s.assessment) {
        return (
            <div className="flex h-full items-center justify-center bg-ds-surface-body font-ds">
                <DsEmptyState
                    title="Avaliação não encontrada"
                    description="Ela pode ser de outra clínica ou ter sido excluída."
                />
            </div>
        );
    }
    return <VariantC s={s} />;
}

export default function AssessmentAnswerPrototype({
    variant,
}: {
    variant: string;
}) {
    return (
        <ClinicLayout>
            <Body />
            <PrototypeSwitcher variants={ANSWER_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
