import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { useId, useState } from 'react';

import { choiceAria, DsChoiceLabel } from './choice-label';
import type { CheckboxProps } from './types';

export function DsCheckbox({
    checked,
    value,
    onCheckedChange,
    onBlur,
    label,
    description,
    disabled = false,
    indeterminate = false,
    name,
    id,
    className,
    children,
    ref,
}: CheckboxProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const [uncontrolled, setUncontrolled] = useState(false);
    const isGroup = Array.isArray(checked) && value !== undefined;
    const isChecked = Array.isArray(checked)
        ? value !== undefined && checked.includes(value)
        : (checked ?? uncontrolled);

    function toggle() {
        if (disabled) return;

        if (isGroup) {
            const list = checked as string[];
            onCheckedChange?.(
                isChecked
                    ? list.filter((item) => item !== value)
                    : [...list, value as string],
            );
            return;
        }

        if (checked === undefined) setUncontrolled(!isChecked);
        onCheckedChange?.(!isChecked);
    }

    return (
        <DsChoiceLabel
            htmlFor={uid}
            disabled={disabled}
            className={className}
            label={label}
            description={description}
            control={
                <CheckboxPrimitive.Root
                    ref={ref}
                    id={uid}
                    name={name}
                    value={value ?? 'on'}
                    checked={indeterminate ? 'indeterminate' : isChecked}
                    disabled={disabled}
                    onCheckedChange={toggle}
                    onBlur={onBlur}
                    {...choiceAria(uid, label, description)}
                    className="peer mt-px grid size-5 min-w-5 cursor-pointer place-items-center rounded-ds-xs border-[1.5px] border-ds-gray-40 bg-ds-surface-default text-ds-white transition-[background,border-color] duration-[120ms] outline-none focus-visible:shadow-ds-focus data-[state=checked]:border-ds-primary-80 data-[state=checked]:bg-ds-primary-80 data-[state=indeterminate]:border-ds-primary-80 data-[state=indeterminate]:bg-ds-primary-80 ds-dark:border-white/35 ds-dark:data-[state=checked]:border-ds-primary-60 ds-dark:data-[state=checked]:bg-ds-primary-60 ds-dark:data-[state=indeterminate]:border-ds-primary-60 ds-dark:data-[state=indeterminate]:bg-ds-primary-60"
                >
                    <CheckboxPrimitive.Indicator className="grid place-items-center">
                        {indeterminate ? (
                            <Minus className="size-3.5" strokeWidth={3} />
                        ) : (
                            <Check className="size-3.5" strokeWidth={3} />
                        )}
                    </CheckboxPrimitive.Indicator>
                </CheckboxPrimitive.Root>
            }
        >
            {children}
        </DsChoiceLabel>
    );
}
