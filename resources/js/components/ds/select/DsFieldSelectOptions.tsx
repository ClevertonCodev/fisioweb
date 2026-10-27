import { FieldSelectCore } from './DsFieldSelect';
import type { FieldSelectOptionsProps } from './types';

/**
 * Variante enxuta do DsFieldSelect que mostra a bandeira de cada opção
 * (`flagCode`). Usada pelo DsCountrySelect.
 */
export function DsFieldSelectOptions({
    mode = 'single',
    ...props
}: FieldSelectOptionsProps) {
    return <FieldSelectCore {...props} mode={mode} showFlags />;
}
