import { useLocation } from 'react-router-dom';

import ProgramBuilder from './program-builder/ProgramBuilder';

/**
 * Novo programa ou novo modelo ("Usar em novo modelo" manda `asModel` na
 * navegação). O que chega no `state` (exercício ou modelo) abre já montado.
 */
export default function ProgramNewPage() {
    const location = useLocation();
    const asModel =
        (location.state as { asModel?: boolean } | null)?.asModel === true;
    return (
        <ProgramBuilder
            key={location.key}
            kind={asModel ? 'model' : 'program'}
        />
    );
}
