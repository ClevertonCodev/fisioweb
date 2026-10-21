import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/PrototypeSwitcher';

import { PatientNewOriginal } from '../PatientNewPage';

import {
    PATIENT_NEW_PROTOTYPE_VARIANTS,
    PayloadModal,
    usePatientNewPrototype,
} from './shared';
import { VariantA } from './VariantA';

/**
 * PROTOTYPE (throwaway) — cadastro de paciente no design system v2, trocado
 * por `?variant=` na rota real `/clinica/pacientes/novo` (só em dev).
 *
 * O Original — tela atual (shadcn v1), para comparar.
 * A Abas (escolhida) — largura toda (até 1920px); painel lateral com a foto
 *   (recorte), a situação e os obrigatórios; abas com os campos em colunas
 *   conforme o espaço; "Próxima aba" e "Concluir cadastro" só liberam com os
 *   obrigatórios válidos.
 *
 * Descartadas (ficam no commit anterior): B página única + índice,
 * C assistente em etapas, D cadastro rápido.
 *
 * Os campos e a validação são os reais (patientFormSchema). O envio é stub:
 * mostra o payload que iria para a API e não grava nada.
 */
export default function PatientNewPrototype() {
    const variant = usePrototypeVariant(PATIENT_NEW_PROTOTYPE_VARIANTS, 'A');
    return (
        <>
            {variant === 'O' ? (
                <PatientNewOriginal />
            ) : (
                <ClinicLayout>
                    <div
                        className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary"
                        data-prototype-variant={variant}
                    >
                        <VariantHost />
                    </div>
                </ClinicLayout>
            )}
            <PrototypeSwitcher
                variants={PATIENT_NEW_PROTOTYPE_VARIANTS}
                current={variant}
            />
        </>
    );
}

function VariantHost() {
    const state = usePatientNewPrototype();
    return (
        <>
            <VariantA state={state} />
            <PayloadModal state={state} />
        </>
    );
}
