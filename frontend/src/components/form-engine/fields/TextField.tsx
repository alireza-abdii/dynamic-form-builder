import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition } from '@fb/shared';
import { toPersianDigits, detectBankName } from '@fb/shared';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface FieldProps {
  field: Extract<FieldDefinition, { type: 'text' }>;
}

export function TextField({ field }: FieldProps) {
  const { control, watch } = useFormContext();
  const value = watch(field.key) || '';

  const isBankPreset = field.preset === 'iran-sheba' || field.preset === 'bank-card';
  const isLtrPreset =
    field.preset === 'national-id' ||
    field.preset === 'postal-code' ||
    field.preset === 'email' ||
    field.preset === 'digits-only' ||
    isBankPreset;

  const detectedBank = React.useMemo(() => {
    if (field.preset === 'bank-card') {
      return detectBankName(value, 'card');
    }
    if (field.preset === 'iran-sheba') {
      return detectBankName(value, 'sheba');
    }
    return undefined;
  }, [field.preset, value]);

  // Sensible default placeholders for Iranian bank presets
  const placeholder =
    field.placeholder ||
    (field.preset === 'iran-sheba'
      ? 'IR12 3456 7890 1234 5678 9012 34'
      : field.preset === 'bank-card'
        ? '۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸'
        : undefined);

  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => (
        <FormItem>
          <div className="flex justify-between items-center">
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
            {field.maxLength && (
              <span className="text-xs text-muted-foreground">
                {toPersianDigits(value.length)} / {toPersianDigits(field.maxLength)}
              </span>
            )}
          </div>
          <FormControl>
            <div dir={isLtrPreset ? 'ltr' : undefined}>
              <Input
                {...formField}
                value={formField.value ?? ''}
                placeholder={placeholder}
                className={isLtrPreset ? 'text-end font-mono tracking-wider' : undefined}
                maxLength={field.maxLength}
                inputMode={
                  field.preset === 'bank-card' ||
                  field.preset === 'iran-sheba' ||
                  field.preset === 'national-id' ||
                  field.preset === 'postal-code' ||
                  field.preset === 'digits-only'
                    ? 'numeric'
                    : undefined
                }
              />
            </div>
          </FormControl>

          {/* Automatic bank detection indicator */}
          {detectedBank && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-sm">🏦</span>
              <span>{detectedBank}</span>
              <span className="text-[10px] text-emerald-500 font-normal">✓ شناسایی شد</span>
            </div>
          )}

          {field.hint && <FormDescription>{field.hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
