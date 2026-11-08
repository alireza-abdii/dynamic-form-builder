import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition } from '@fb/shared';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface FieldProps {
  field: Extract<FieldDefinition, { type: 'select' }>;
}

export function SelectField({ field }: FieldProps) {
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
          <Select
            onValueChange={formField.onChange}
            defaultValue={formField.value}
            value={formField.value ?? ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder ?? 'انتخاب کنید...'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.hint && <FormDescription>{field.hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

