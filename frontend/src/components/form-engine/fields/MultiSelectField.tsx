import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Check, ChevronsUpDown, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';

interface FieldProps {
  field: Extract<FieldDefinition, { type: 'multiselect' }>;
}

export function MultiSelectField({ field }: FieldProps) {
  const { control } = useFormContext();
  const [open, setOpen] = React.useState(false);

  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => {
        const selectedValues: string[] = Array.isArray(formField.value)
          ? formField.value
          : [];

        const toggleOption = (val: string) => {
          let updated: string[];
          if (selectedValues.includes(val)) {
            updated = selectedValues.filter((v) => v !== val);
          } else {
            if (field.maxItems && selectedValues.length >= field.maxItems) {
              return; // Max items reached
            }
            updated = [...selectedValues, val];
          }
          formField.onChange(updated);
        };

        const removeOption = (val: string, e: React.MouseEvent) => {
          e.stopPropagation();
          const updated = selectedValues.filter((v) => v !== val);
          formField.onChange(updated);
        };

        return (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>
                {field.label}
                {field.required && <span className="text-destructive ms-1">*</span>}
              </FormLabel>
              {field.maxItems && (
                <span className="text-xs text-muted-foreground">
                  حداکثر {toPersianDigits(field.maxItems)} مورد
                </span>
              )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-11 px-3 py-2 text-start font-normal"
                  >
                    <div className="flex flex-wrap gap-1.5 items-center flex-1">
                      {selectedValues.length === 0 ? (
                        <span className="text-muted-foreground">
                          {field.placeholder ?? 'انتخاب گزینه‌ها...'}
                        </span>
                      ) : (
                        selectedValues.map((val) => {
                          const option = field.options.find((o) => o.value === val);
                          const label = option ? option.label : val;
                          return (
                            <Badge
                              key={val}
                              variant="secondary"
                              className="pe-1 text-xs font-normal"
                            >
                              <span>{label}</span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="ms-1 rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
                                onClick={(e) => removeOption(val, e)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    removeOption(val, e as unknown as React.MouseEvent);
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </span>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ms-2" />
                  </Button>
                </FormControl>
              </PopoverTrigger>

              <PopoverContent className="w-full p-0 min-w-[280px]" align="start">
                <Command>
                  <CommandInput placeholder="جستجو در گزینه‌ها..." />
                  <CommandList>
                    <CommandEmpty>گزینه‌ای یافت نشد.</CommandEmpty>
                    <CommandGroup>
                      {field.options.map((option) => {
                        const isSelected = selectedValues.includes(option.value);
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => toggleOption(option.value)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span>{option.label}</span>
                            <div
                              className={cn(
                                'h-4 w-4 rounded border flex items-center justify-center ms-2',
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-muted-foreground/40'
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
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

