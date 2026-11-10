import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import type { FieldDefinition } from '@fb/shared';
import { toPersianDigits } from '@fb/shared';
import { cn } from '@/lib/utils';
import { getFieldOptions } from '@/lib/api/gas-client';
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
  field: Extract<FieldDefinition, { type: 'reference' }>;
}

export function ReferenceField({ field }: FieldProps) {
  const { control } = useFormContext();
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setIsLoading(true);

    getFieldOptions(field.source.formId, field.source.fieldKey)
      .then((opts) => {
        if (active) {
          setOptions(opts);
        }
      })
      .catch((err) => {
        console.warn(`[ReferenceField] Failed to load options for ${field.key}:`, err);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [field.source.formId, field.source.fieldKey, field.key]);

  if (field.multiple) {
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
              if (field.maxItems !== undefined && selectedValues.length >= field.maxItems) {
                return;
              }
              updated = [...selectedValues, val];
            }
            formField.onChange(updated);
          };

          const removeOption = (val: string, e: React.MouseEvent) => {
            e.stopPropagation();
            formField.onChange(selectedValues.filter((v) => v !== val));
          };

          return (
            <FormItem className="space-y-2">
              <FormLabel>
                {field.label}
                {field.required && <span className="text-destructive ms-1">*</span>}
              </FormLabel>

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        'w-full min-h-[2.75rem] h-auto justify-between text-start font-normal py-2 px-3',
                        selectedValues.length === 0 && 'text-muted-foreground'
                      )}
                    >
                      <div className="flex flex-wrap gap-1.5 items-center flex-1">
                        {isLoading ? (
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 me-2 animate-spin" />
                            در حال بارگذاری اطلاعات مرجع...
                          </span>
                        ) : selectedValues.length > 0 ? (
                          selectedValues.map((val) => {
                            const opt = options.find((o) => o.value === val);
                            const label = opt ? opt.label : val;
                            return (
                              <Badge
                                key={val}
                                variant="secondary"
                                className="px-2 py-0.5 text-xs font-normal flex items-center gap-1"
                              >
                                <span>{label}</span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted p-0.5"
                                  onClick={(e) => removeOption(val, e)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      removeOption(val, e as unknown as React.MouseEvent);
                                    }
                                  }}
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </span>
                              </Badge>
                            );
                          })
                        ) : (
                          <span>{field.placeholder ?? 'انتخاب موارد از لیست...'}</span>
                        )}
                      </div>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ms-2" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="جستجو در بین گزینه‌ها..." />
                    <CommandList>
                      <CommandEmpty>
                        {isLoading ? 'در حال بارگذاری...' : 'هیچ رکوردی یافت نشد.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {options.map((option) => {
                          const isSelected = selectedValues.includes(option.value);
                          const isMaxReached =
                            field.maxItems !== undefined &&
                            selectedValues.length >= field.maxItems &&
                            !isSelected;

                          return (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              disabled={isMaxReached}
                              onSelect={() => toggleOption(option.value)}
                              className={cn(
                                'cursor-pointer justify-between',
                                isMaxReached && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <span>{option.label}</span>
                              <Check
                                className={cn(
                                  'h-4 w-4 ms-2',
                                  isSelected ? 'opacity-100 text-primary' : 'opacity-0'
                                )}
                              />
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {(field.hint || field.maxItems) && (
                <FormDescription>
                  {field.hint}
                  {field.maxItems && (
                    <span className="ms-1">
                      (حداکثر {toPersianDigits(field.maxItems)} مورد)
                    </span>
                  )}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  }

  // Single select reference field
  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => {
        const selectedValue = typeof formField.value === 'string' ? formField.value : '';
        const selectedOpt = options.find((o) => o.value === selectedValue);

        return (
          <FormItem className="space-y-2">
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      'w-full h-11 justify-between text-start font-normal px-3',
                      !selectedValue && 'text-muted-foreground'
                    )}
                  >
                    {isLoading ? (
                      <span className="flex items-center text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 me-2 animate-spin" />
                        در حال دریافت داده‌های مرجع...
                      </span>
                    ) : selectedOpt ? (
                      <span className="truncate">{selectedOpt.label}</span>
                    ) : selectedValue ? (
                      <span className="truncate">{selectedValue}</span>
                    ) : (
                      <span>{field.placeholder ?? 'یک مورد را انتخاب کنید...'}</span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ms-2" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="جستجو در گزینه‌ها..." />
                  <CommandList>
                    <CommandEmpty>
                      {isLoading ? 'در حال دریافت اطلاعات...' : 'هیچ پاسخی در فرم مبدأ ثبت نشده است.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => {
                        const isSelected = selectedValue === option.value;
                        return (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              formField.onChange(option.value);
                              setOpen(false);
                            }}
                            className="cursor-pointer justify-between"
                          >
                            <span>{option.label}</span>
                            <Check
                              className={cn(
                                'h-4 w-4 ms-2',
                                isSelected ? 'opacity-100 text-primary' : 'opacity-0'
                              )}
                            />
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
