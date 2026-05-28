import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    const defaultClassNames = getDefaultClassNames();

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                months: cn(
                    'flex flex-col sm:flex-row sm:space-y-0 space-y-4 sm:space-x-4',
                    defaultClassNames.months,
                ),
                month: cn('space-y-4', defaultClassNames.month),
                month_caption: cn(
                    'relative flex items-center justify-center pt-1',
                    defaultClassNames.month_caption,
                ),
                caption_label: cn('text-sm font-medium', defaultClassNames.caption_label),
                nav: cn('flex items-center space-x-1', defaultClassNames.nav),
                button_previous: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    defaultClassNames.button_previous,
                ),
                button_next: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    defaultClassNames.button_next,
                ),
                month_grid: cn('w-full border-collapse space-y-1', defaultClassNames.month_grid),
                weekdays: cn('flex', defaultClassNames.weekdays),
                weekday: cn(
                    'w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground',
                    defaultClassNames.weekday,
                ),
                week: cn('mt-2 flex w-full', defaultClassNames.week),
                day: cn(
                    'relative h-9 w-9 p-0 text-center text-sm',
                    'has-[button]:z-20 has-[button]:focus-within:relative',
                    '[&:has([aria-selected].day-range-end)]:rounded-r-md',
                    "[&:has([aria-selected].day-outside)]:bg-accent/50",
                    "[&:has([aria-selected])]:bg-accent",
                    "first:[&:has([aria-selected])]:rounded-l-md",
                    "last:[&:has([aria-selected])]:rounded-r-md",
                    defaultClassNames.day,
                ),
                day_button: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                    defaultClassNames.day_button,
                ),
                range_end: cn('day-range-end', defaultClassNames.range_end),
                selected: cn(
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    defaultClassNames.selected,
                ),
                today: cn('bg-accent text-accent-foreground', defaultClassNames.today),
                outside: cn(
                    'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                    defaultClassNames.outside,
                ),
                disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
                range_middle: cn(
                    'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    defaultClassNames.range_middle,
                ),
                hidden: cn('invisible', defaultClassNames.hidden),
                ...classNames,
            }}
            components={{
                Chevron: ({ className, orientation, ...rest }) => {
                    const Lucide = orientation === 'left' ? ChevronLeft : ChevronRight;
                    return <Lucide className={cn('h-4 w-4', className)} {...rest} />;
                },
            }}
            {...props}
        />
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };
