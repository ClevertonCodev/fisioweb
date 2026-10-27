/**
 * PROTÓTIPO (descartável): criar conta da clínica no DS v2, na rota real
 * /clinica/criar-conta, trocada por ?variant= (O = v1).
 *
 * A, "Três passos", é a escolhida (B, tela dividida com prévia, não foi
 * commitada). Validação real
 * (clinicRegisterSchema); criar a conta é stub (sem endpoint no backend).
 */
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { REGISTER_VARIANTS } from './shared';
import { VariantA } from './VariantA';

export default function RegisterPrototype({ variant }: { variant: string }) {
    return (
        <div className="h-screen">
            <VariantA />
            <PrototypeSwitcher variants={REGISTER_VARIANTS} current={variant} />
        </div>
    );
}
