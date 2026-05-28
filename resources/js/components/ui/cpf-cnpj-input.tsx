import { type ComponentProps } from 'react';

import { Input } from './input';

function formatCpf(digits: string): string {
    const d = digits.slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatCnpj(digits: string): string {
    const d = digits.slice(0, 14);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

type Props = Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> & {
    /** 'cpf' for Pessoa Física, 'cnpj' for Pessoa Jurídica */
    type: 'cpf' | 'cnpj';
    /** Raw digits only (no punctuation) */
    value: string;
    /** Called with raw digits only */
    onChange: (rawValue: string) => void;
};

export function CpfCnpjInput({ type, value, onChange, ...props }: Props) {
    const digits = (value ?? '').replace(/\D/g, '');
    const displayed = type === 'cnpj' ? formatCnpj(digits) : formatCpf(digits);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const maxLen = type === 'cnpj' ? 14 : 11;
        onChange(raw.slice(0, maxLen));
    };

    return (
        <Input
            {...props}
            value={displayed}
            onChange={handleChange}
            placeholder={type === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
            inputMode="numeric"
        />
    );
}
