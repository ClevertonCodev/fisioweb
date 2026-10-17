import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { createContext, useContext, useId, useState } from 'react';

import { dsCn } from '../utils/ds-cn';

import { choiceAria, DsChoiceLabel } from './choice-label';
import type { RadioGroupProps, RadioProps, RadioValue } from './types';

// O Radix trabalha com valores string; o DS aceita número também. Cada DsRadio
// registra o valor original para o grupo devolver o mesmo tipo no onValueChange.
const RadioValuesContext = createContext<Map<string, RadioValue> | null>(null);

/**
 * Grupo de DsRadio. Grupo de
 * grupo guarda o valor selecionado e dá a navegação por setas.
 */
export function DsRadioGroup({
    value,
    defaultValue,
    onValueChange,
    onBlur,
    name,
    disabled,
    orientation = 'vertical',
    className,
    children,
    ...aria
}: RadioGroupProps) {
    const [values] = useState(() => new Map<string, RadioValue>());

    return (
        <RadioValuesContext.Provider value={values}>
            <RadioGroupPrimitive.Root
                {...aria}
                name={name}
                disabled={disabled}
                orientation={orientation}
                value={value === undefined ? undefined : String(value)}
                defaultValue={
                    defaultValue === undefined
                        ? undefined
                        : String(defaultValue)
                }
                onValueChange={(next) =>
                    onValueChange?.(values.get(next) ?? next)
                }
                // O blur do React borbulha de cada radio; só conta sair do grupo.
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                        onBlur?.(event);
                }}
                className={dsCn(
                    'flex gap-3',
                    orientation === 'vertical'
                        ? 'flex-col'
                        : 'flex-row flex-wrap',
                    className,
                )}
            >
                {children}
            </RadioGroupPrimitive.Root>
        </RadioValuesContext.Provider>
    );
}

export function DsRadio({
    value,
    label,
    description,
    disabled = false,
    id,
    className,
    children,
    ref,
}: RadioProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const values = useContext(RadioValuesContext);
    values?.set(String(value), value);

    return (
        <DsChoiceLabel
            htmlFor={uid}
            disabled={disabled}
            className={className}
            label={label}
            description={description}
            control={
                <RadioGroupPrimitive.Item
                    ref={ref}
                    id={uid}
                    value={String(value)}
                    disabled={disabled}
                    {...choiceAria(uid, label, description)}
                    className="mt-px grid size-5 min-w-5 cursor-pointer place-items-center rounded-full border-[1.5px] border-ds-gray-40 bg-ds-surface-default transition-[background,border-color] duration-[120ms] outline-none focus-visible:shadow-ds-focus data-[state=checked]:border-ds-primary-80 data-[state=checked]:bg-ds-primary-80 ds-dark:border-white/35 ds-dark:data-[state=checked]:border-ds-primary-70 ds-dark:data-[state=checked]:bg-ds-primary-70"
                >
                    <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-ds-white" />
                </RadioGroupPrimitive.Item>
            }
        >
            {children}
        </DsChoiceLabel>
    );
}
