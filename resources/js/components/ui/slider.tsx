import * as React from 'react';

import { cn } from '@/lib/utils';

interface SliderProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'> {
    value?: number[];
    max?: number;
    step?: number;
    onValueChange?: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value = [0], max = 100, step = 1, onValueChange, ...props }, ref) => {
        const v = Array.isArray(value) ? value[0] : value;
        return (
            <input
                ref={ref}
                type="range"
                min={0}
                max={max}
                step={step}
                value={v}
                onChange={(e) => onValueChange?.([Number(e.target.value)])}
                className={cn(
                    'relative h-2 w-full grow cursor-pointer appearance-none overflow-hidden rounded-full bg-secondary accent-primary',
                    className,
                )}
                {...props}
            />
        );
    },
);
Slider.displayName = 'Slider';

export { Slider };
