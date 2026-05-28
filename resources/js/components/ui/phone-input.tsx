import { type ComponentProps } from 'react';

import { Input } from './input';

function formatPhone(digits: string): string {
    const d = digits.slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

type Props = Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> & {
    value: string;
    onChange: (rawValue: string) => void;
};

export function PhoneInput({ value, onChange, ...props }: Props) {
    const digits = (value ?? '').replace(/\D/g, '');
    const displayed = formatPhone(digits);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        onChange(raw.slice(0, 11));
    };

    return (
        <Input
            {...props}
            value={displayed}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
        />
    );
}
