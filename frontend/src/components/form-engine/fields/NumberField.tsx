import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition } from '@fb/shared';
import {
  normalizeDigits,
  formatCurrency,
  cleanCurrencyInput,
  numberToPersianWords,
  CURRENCY_UNIT_LABELS
} from '@fb/shared';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Coins } from 'lucide-react';

interface FieldProps {
  field: Extract<FieldDefinition, { type: 'number' }>;
}

export function NumberField({ field }: FieldProps) {
  const { control } = useFormContext();
  const isCurrency = Boolean(field.currency);

  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => {
        const displayValue = React.useMemo(() => {
          if (formField.value === undefined || formField.value === null || formField.value === '') {
            return '';
          }
          if (isCurrency) {
            return formatCurrency(formField.value);
          }
          return String(formField.value);
        }, [formField.value, isCurrency]);

        const words = React.useMemo(() => {
          if (!isCurrency || formField.value === undefined || formField.value === null || formField.value === '') {
            return '';
          }
          return numberToPersianWords(formField.value, field.currency);
        }, [formField.value, isCurrency, field.currency]);

        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
            <FormControl>
              <div className="space-y-1.5">
                <div dir="ltr" className="relative flex items-center">
                  <Input
                    type="text"
                    inputMode={isCurrency || field.integer ? 'numeric' : 'decimal'}
                    value={displayValue}
                    placeholder={field.placeholder}
                    className={`text-end font-mono ${isCurrency ? 'pe-16' : ''}`}
                    onChange={(e) => {
                      if (isCurrency) {
                        const raw = cleanCurrencyInput(e.target.value);
                        formField.onChange(raw !== '' ? Number(raw) : undefined);
                      } else {
                        const normalized = normalizeDigits(e.target.value);
                        formField.onChange(normalized !== '' ? normalized : undefined);
                      }
                    }}
                  />
                  {isCurrency && field.currency && (
                    <span className="absolute end-3 text-xs font-semibold text-muted-foreground select-none pointer-events-none">
                      {CURRENCY_UNIT_LABELS[field.currency]}
                    </span>
                  )}
                </div>

                {words && (
                  <div
                    dir="rtl"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/15 text-xs text-primary font-medium transition-all"
                  >
                    <Coins className="w-3.5 h-3.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground text-[11px]">معادل به حروف:</span>
                    <span className="font-semibold text-foreground">{words}</span>
                  </div>
                )}
              </div>
            </FormControl>
            {field.hint && <FormDescription>{field.hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
