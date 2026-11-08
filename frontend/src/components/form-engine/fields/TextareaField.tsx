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
import { Textarea } from '@/components/ui/textarea';

interface FieldProps {
  field: Extract<FieldDefinition, { type: 'textarea' }>;
}

export function TextareaField({ field }: FieldProps) {
  const { control, watch } = useFormContext();
  const value = watch(field.key) || '';

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
            <Textarea
              {...formField}
              value={formField.value ?? ''}
              placeholder={field.placeholder}
              rows={field.rows ?? 3}
              maxLength={field.maxLength}
            />
          </FormControl>
          {field.hint && <FormDescription>{field.hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

