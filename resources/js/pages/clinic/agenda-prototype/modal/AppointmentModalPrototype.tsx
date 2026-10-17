import { AppointmentModal } from '@/components/clinic/agenda/AppointmentModal';

import { PrototypeSwitcher, usePrototypeVariant } from '../PrototypeSwitcher';

import {
    MODAL_PROTOTYPE_VARIANTS,
    type ModalPrototypeProps,
} from './modal-shared';
import { ModalF } from './ModalF';

/**
 * PROTOTYPE (throwaway) — modal de consulta da agenda no DS v2, trocado por
 * `?modal=` (a barra aparece no topo com o modal aberto; ← → também trocam).
 *
 * O Modal atual (v1, shadcn), para comparar.
 * F Escolhido: cabeçalho na cor do status + abas Resumo / Editar /
 *   Histórico do paciente; cadastro com local Clínica/Domiciliar, atalhos
 *   de tipo e de duração.
 *
 * Descartadas: A ficha lateral, B cartão ver→editar, C formulário + prévia,
 * D detalhes (referência), E cartão compacto, G fluxo de atendimento.
 */
export function AppointmentModalPrototype(props: ModalPrototypeProps) {
    const variant = usePrototypeVariant(MODAL_PROTOTYPE_VARIANTS, 'F', 'modal');
    // Remonta a cada abertura/consulta: o rascunho começa do zero.
    const key = `${variant}-${props.appointment?.id ?? 'new'}-${props.initialDate?.getTime() ?? ''}-${props.open}`;

    return (
        <>
            {variant === 'O' ? (
                <AppointmentModal {...props} />
            ) : (
                <ModalF key={key} {...props} />
            )}
            {props.open && (
                <PrototypeSwitcher
                    variants={MODAL_PROTOTYPE_VARIANTS}
                    current={variant}
                    param="modal"
                    scope="dialog"
                    prefix="Modal"
                />
            )}
        </>
    );
}
