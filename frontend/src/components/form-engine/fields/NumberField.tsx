import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition } from '@fb/shared';
import { normalizeDigits } from '@fb/shared';
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
  field: Extract<FieldDefinition, { type: 'number' }>;
}

export function NumberField({ field }: FieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ms-1">*</span>}
          </FormLabel>
          <FormControl>
            <div dir="ltr">
              <Input
                {...formField}
                type="text"
                inputMode={field.integer ? 'numeric' : 'decimal'}
                value={formField.value ?? ''}
                placeholder={field.placeholder}
                className="text-end font-mono"
                onChange={(e) => {
                  const normalized = normalizeDigits(e.target.value);
                  formField.onChange(normalized);
                }}
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

