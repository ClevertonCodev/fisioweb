import * as SwitchPrimitive from '@radix-ui/react-switch';
import { useId, useState } from 'react';

import { choiceAria, DsChoiceLabel } from '../choice/choice-label';
import { dsCn } from '../utils/ds-cn';

import type { SwitchProps } from './types';

export function DsSwitch({
    checked,
    onCheckedChange,
    onBlur,
    label,
    description,
    disabled = false,
    name,
    id,
    className,
    children,
    ref,
}: SwitchProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const [uncontrolled, setUncontrolled] = useState(false);
    const isOn = checked ?? uncontrolled;

    function toggle(next: boolean) {
        if (disabled) return;
        if (checked === undefined) setUncontrolled(next);
        onCheckedChange?.(next);
    }

    return (
        <DsChoiceLabel
            htmlFor={uid}
            disabled={disabled}
            className={dsCn('inline-flex items-center gap-3', className)}
            titleClassName="font-medium leading-[var(--ds-line-height-base)]"
            label={label}
            description={description}
            control={
                <SwitchPrimitive.Root
                    ref={ref}
                    id={uid}
                    name={name}
                    checked={isOn}
                    disabled={disabled}
                    onCheckedChange={toggle}
                    onBlur={onBlur}
                    {...choiceAria(uid, label, description)}
                    className="mt-0.5 flex h-[26px] w-[46px] min-w-[46px] cursor-pointer items-center self-start rounded-ds-pill bg-ds-border-subtle p-[3px] transition-[background] duration-[180ms] outline-none focus-visible:shadow-ds-focus data-[state=checked]:bg-ds-primary-80 ds-dark:bg-white/22 ds-dark:data-[state=checked]:bg-ds-primary-60"
                >
                    <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-ds-white shadow-ds-xs transition-transform duration-[180ms] data-[state=checked]:translate-x-5" />
                </SwitchPrimitive.Root>
            }
        >
            {children}
        </DsChoiceLabel>
    );
}
