import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition } from '@fb/shared';
import { toPersianDigits } from '@fb/shared';
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
  const isLtrPreset = field.preset === 'national-id' || field.preset === 'postal-code' || field.preset === 'email' || field.preset === 'digits-only';

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
                placeholder={field.placeholder}
                className={isLtrPreset ? 'text-end font-mono tracking-wider' : undefined}
                maxLength={field.maxLength}
              />
            </div>
          </FormControl>
          {field.hint && <FormDescription>{field.hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

