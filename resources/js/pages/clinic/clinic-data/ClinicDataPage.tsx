import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';
import { ClinicDataForm } from '@/pages/clinic/clinic-data/ClinicDataForm';

import ClinicDataPrototype from './clinic-data-prototype/ClinicDataPrototype';
import { DATA_VARIANTS } from './clinic-data-prototype/shared';

/**
 * PROTÓTIPO: em desenvolvimento, ?variant= troca a tela pela do DS v2
 * (clinic-data-prototype); O = esta tela. Desligado nos testes (o Vitest
 * roda com DEV ligado).
 */
const PROTOTYPE = import.meta.env.DEV && import.meta.env.MODE !== 'test';

export function ClinicDataPage() {
    const variant = usePrototypeVariant(DATA_VARIANTS, 'A');
    if (PROTOTYPE && variant !== 'O') {
        return <ClinicDataPrototype variant={variant} />;
    }
    return (
        <ClinicLayout>
            <ClinicDataForm />
            {PROTOTYPE && (
                <PrototypeSwitcher variants={DATA_VARIANTS} current="O" />
            )}
        </ClinicLayout>
    );
}
