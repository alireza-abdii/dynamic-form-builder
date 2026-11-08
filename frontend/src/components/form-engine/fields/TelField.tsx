import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition } from '@fb/shared';
import { cleanIranMobile } from '@fb/shared';
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
  field: Extract<FieldDefinition, { type: 'tel' }>;
}

export function TelField({ field }: FieldProps) {
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
                type="tel"
                inputMode="tel"
                value={formField.value ?? ''}
                placeholder={field.placeholder ?? '09xxxxxxxxx'}
                className="text-end font-mono tracking-wider"
                onChange={(e) => {
                  const cleaned = cleanIranMobile(e.target.value);
                  formField.onChange(cleaned);
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

