import * as React from 'react';

import { cn } from '@/lib/utils';

import { Input } from './input';

export interface MoneyInputProps extends Omit<
    React.ComponentProps<typeof Input>,
    'value' | 'onChange' | 'type'
> {
    value: number;
    onChange: (value: number) => void;
    currency?: string;
}

/** "12345" → 123.45 */
function digitsToNumber(digits: string): number {
    return parseInt(digits || '0', 10) / 100;
}

/** 123.45 → "12345", 0 → "" */
function numberToDigits(value: number): string {
    if (!value || value <= 0) return '';
    return Math.round(value * 100).toString();
}

/** "12345" + "R$ " → "R$ 123,45" */
function formatDigits(digits: string, prefix: string): string {
    const cents = parseInt(digits || '0', 10);
    const fixed = (cents / 100).toFixed(2).replace('.', ',');
    const withThousands = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${prefix}${withThousands}`;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
    (
        {
            value,
            onChange,
            currency = 'R$ ',
            name = 'grana',
            disabled = false,
            onKeyUp,
            className,
            ...rest
        },
        ref,
    ) => {
        const [digits, setDigits] = React.useState(() => numberToDigits(value));

        // Sync when parent updates value externally (e.g. form reset)
        React.useEffect(() => {
            setDigits((prev) => {
                const current = digitsToNumber(prev);
                return Math.abs(current - (value ?? 0)) > 0.001 ? numberToDigits(value) : prev;
            });
        }, [value]);

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                const next = digits + e.key;
                setDigits(next);
                onChange(digitsToNumber(next));
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                const next = digits.slice(0, -1);
                setDigits(next);
                onChange(digitsToNumber(next));
            } else if (e.key === 'Delete') {
                e.preventDefault();
                setDigits('');
                onChange(0);
            }
        };

        const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const next = e.clipboardData.getData('text').replace(/\D/g, '').replace(/^0+/, '');
            setDigits(next);
            onChange(digitsToNumber(next));
        };

        return (
            <Input
                ref={ref}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                name={name}
                disabled={disabled}
                value={formatDigits(digits, currency)}
                onChange={() => {}}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onKeyUp={onKeyUp}
                className={cn('text-foreground', className)}
                {...rest}
            />
        );
    },
);

MoneyInput.displayName = 'MoneyInput';

export { MoneyInput };
