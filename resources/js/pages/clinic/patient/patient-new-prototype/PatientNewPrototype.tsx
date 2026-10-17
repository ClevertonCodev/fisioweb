import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import { PatientNewOriginal } from '../PatientNewPage';

import {
    PATIENT_NEW_PROTOTYPE_VARIANTS,
    PayloadModal,
    usePatientNewPrototype,
} from './shared';
import { VariantA } from './VariantA';
import { VariantB } from './VariantB';
import { VariantC } from './VariantC';
import { VariantD } from './VariantD';

/**
 * PROTOTYPE (throwaway) — cadastro de paciente no design system v2, trocado
 * por `?variant=` na rota real `/clinica/pacientes/novo` (só em dev).
 *
 * O Original — tela atual (shadcn v1), para comparar.
 * A Abas — a organização de hoje, no DS, com erro marcado na aba.
 * B Página única + índice — seções em cartões e índice lateral fixo.
 * C Assistente em etapas — Quem é → Contato → Complementos → Revisão.
 * D Cadastro rápido — só o essencial à vista, o resto recolhido, prévia ao lado.
 *
 * Os campos e a validação são os reais (patientFormSchema). O envio é stub:
 * mostra o payload que iria para a API e não grava nada.
 */
export default function PatientNewPrototype() {
    const variant = usePrototypeVariant(PATIENT_NEW_PROTOTYPE_VARIANTS, 'A');
    // Um formulário por variante: trocar de variante começa do zero.
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
                        <VariantHost key={variant} variant={variant} />
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

function VariantHost({ variant }: { variant: string }) {
    const state = usePatientNewPrototype();
    return (
        <>
            {variant === 'A' && <VariantA state={state} />}
            {variant === 'B' && <VariantB state={state} />}
            {variant === 'C' && <VariantC state={state} />}
            {variant === 'D' && <VariantD state={state} />}
            <PayloadModal state={state} />
        </>
    );
}
