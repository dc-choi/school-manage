import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { cn } from '~/lib/utils';

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            locale={ko}
            showOutsideDays={showOutsideDays}
            className={cn('p-1', className)}
            classNames={{
                months: 'flex flex-col gap-3',
                month: 'flex flex-col gap-3',
                month_caption: 'flex justify-center pt-1 relative items-center text-sm font-medium',
                caption_label: 'text-sm font-medium',
                nav: 'flex items-center gap-1',
                button_previous: cn(
                    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'absolute left-1 top-1 size-7 bg-transparent p-0 opacity-60 hover:opacity-100'
                ),
                button_next: cn(
                    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'absolute right-1 top-1 size-7 bg-transparent p-0 opacity-60 hover:opacity-100'
                ),
                month_grid: 'w-full border-collapse space-y-1',
                weekdays: 'flex',
                weekday: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
                week: 'flex w-full mt-2',
                day: cn(
                    'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                    '[&:has([aria-selected])]:bg-accent'
                ),
                day_button: cn(
                    'inline-flex items-center justify-center rounded-md text-sm font-normal',
                    'size-8 p-0 aria-selected:opacity-100',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                ),
                selected: cn(
                    '[&>button]:bg-primary [&>button]:text-primary-foreground',
                    '[&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
                    '[&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground'
                ),
                today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
                outside: 'text-muted-foreground opacity-50',
                disabled: 'text-muted-foreground opacity-50',
                hidden: 'invisible',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    if (orientation === 'left') return <ChevronLeft className="size-4" />;
                    return <ChevronRight className="size-4" />;
                },
            }}
            {...props}
        />
    );
}

export { Calendar };
