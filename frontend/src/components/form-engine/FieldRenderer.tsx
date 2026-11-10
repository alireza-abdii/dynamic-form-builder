import * as React from 'react';
import type { FieldDefinition } from '@fb/shared';
import { assertNever } from '@fb/shared';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import { NumberField } from './fields/NumberField';
import { TelField } from './fields/TelField';
import { SelectField } from './fields/SelectField';
import { MultiSelectField } from './fields/MultiSelectField';
import { JalaliDateField } from './fields/JalaliDateField';
import { ReferenceField } from './fields/ReferenceField';

interface FieldRendererProps {
  field: FieldDefinition;
}

export function FieldRenderer({ field }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return <TextField field={field} />;
    case 'textarea':
      return <TextareaField field={field} />;
    case 'number':
      return <NumberField field={field} />;
    case 'tel':
      return <TelField field={field} />;
    case 'select':
      return <SelectField field={field} />;
    case 'multiselect':
      return <MultiSelectField field={field} />;
    case 'jalali-date':
      return <JalaliDateField field={field} />;
    case 'reference':
      return <ReferenceField field={field} />;
    default:
      return assertNever(field);
  }
}

