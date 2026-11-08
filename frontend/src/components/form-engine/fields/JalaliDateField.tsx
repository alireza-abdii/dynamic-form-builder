import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import type { FieldDefinition } from '@fb/shared';
import { toPersianDigits } from '@fb/shared';
import { cn } from '@/lib/utils';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { JalaliCalendar } from '@/components/ui/jalali-calendar';

interface FieldProps {
  field: Extract<FieldDefinition, { type: 'jalali-date' }>;
}

export function JalaliDateField({ field }: FieldProps) {
  const { control } = useFormContext();
  const [open, setOpen] = React.useState(false);

  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => {
        const val = formField.value as string | undefined;

        return (
          <FormItem className="flex flex-col">
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>

            <Popover open={open} onOpenChange={setOpen}>
              <div className="flex items-center gap-1.5">
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-between h-11 min-h-11 px-3.5 text-start font-normal',
                        !val && 'text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center">
                        <CalendarIcon className="me-2.5 h-4 w-4 opacity-60" />
                        <span>
                          {val ? toPersianDigits(val) : field.placeholder ?? 'انتخاب تاریخ شمسی...'}
                        </span>
                      </div>
                    </Button>
                  </FormControl>
                </PopoverTrigger>

                {val && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => formField.onChange('')}
                    title="پاک کردن تاریخ"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <PopoverContent className="w-auto p-0" align="start">
                <JalaliCalendar
                  value={val}
                  onChange={(dateStr) => {
                    formField.onChange(dateStr);
                    setOpen(false);
                  }}
                  minDate={field.minDate}
                  maxDate={field.maxDate}
                />
              </PopoverContent>
            </Popover>

            {field.hint && <FormDescription>{field.hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

