import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import { PatientListOriginal } from '../PatientListPage';

import { PATIENT_LIST_PROTOTYPE_VARIANTS, usePatientListState } from './shared';
import { VariantC } from './VariantC';

/**
 * PROTOTYPE (throwaway) — lista de pacientes no design system v2, trocada por
 * `?variant=` na rota real `/clinica/pacientes` (só em dev).
 *
 * O Original — tela atual (shadcn v1), para comparar.
 * C2 Escolhida: um cartão por paciente; barra em cima dos cards com a busca,
 *   um dropdown por filtro e os itens por página (15/30/50); os filtros
 *   aplicados viram chips numa linha de altura fixa; largura até 1920px.
 *
 * Variantes descartadas: A (tabela DS com filtros em dropdowns), B (lista +
 * ficha do paciente ao lado), C (os mesmos cards com filtros numa coluna
 * lateral) e C1 (itens por página fora da barra, abaixo dos filtros).
 * Os dados são os reais (usePatients); "Inativar" é stub e não grava nada.
 */
export default function PatientListPrototype() {
    const variant = usePrototypeVariant(PATIENT_LIST_PROTOTYPE_VARIANTS, 'C2');
    const state = usePatientListState(15);

    return (
        <>
            {variant === 'O' ? (
                <PatientListOriginal />
            ) : (
                <ClinicLayout>
                    <div className="h-full" data-prototype-variant={variant}>
                        <VariantC state={state} />
                    </div>
                </ClinicLayout>
            )}
            <PrototypeSwitcher
                variants={PATIENT_LIST_PROTOTYPE_VARIANTS}
                current={variant}
            />
        </>
    );
}
