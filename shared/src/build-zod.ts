import { z } from 'zod';
import type { FormDefinition, FieldDefinition } from './definition.schema.js';
import { fa } from './messages.fa.js';
import { normalizeDigits } from './validators/digits.js';
import { isValidIranMobile, cleanIranMobile } from './validators/iran-mobile.js';
import { isValidNationalId } from './validators/national-id.js';
import { parseJalaliString } from './jalali.js';

export function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`);
}

export function buildFieldZodSchema(field: FieldDefinition): z.ZodTypeAny {
  switch (field.type) {
    case 'text': {
      let schema: z.ZodTypeAny = z.preprocess((val) => (typeof val === 'string' ? val.trim() : ''), z.string());

      if (field.required) {
        schema = schema.refine((v: string) => v.length > 0, { message: fa.required(field.label) });
      }

      if (field.minLength !== undefined) {
        const min = field.minLength;
        schema = schema.refine((v: string) => v.length === 0 || v.length >= min, {
          message: fa.minLength(field.label, min)
        });
      }

      if (field.maxLength !== undefined) {
        const max = field.maxLength;
        schema = schema.refine((v: string) => v.length <= max, {
          message: fa.maxLength(field.label, max)
        });
      }

      if (field.preset === 'national-id') {
        schema = schema.refine((v: string) => v.length === 0 || isValidNationalId(v), {
          message: fa.nationalId(field.label)
        });
      } else if (field.preset === 'email') {
        schema = schema.refine((v: string) => v.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
          message: fa.email(field.label)
        });
      } else if (field.preset === 'postal-code') {
        schema = schema.refine((v: string) => v.length === 0 || /^\d{10}$/.test(normalizeDigits(v)), {
          message: fa.postalCode(field.label)
        });
      } else if (field.preset === 'digits-only') {
        schema = schema.refine((v: string) => v.length === 0 || /^\d+$/.test(normalizeDigits(v)), {
          message: fa.digitsOnly(field.label)
        });
      }

      if (field.pattern) {
        try {
          const reg = new RegExp(field.pattern);
          schema = schema.refine((v: string) => v.length === 0 || reg.test(v), {
            message: field.patternError || fa.invalidPattern(field.label)
          });
        } catch {
          // Ignore invalid regex string
        }
      }

      return schema;
    }

    case 'textarea': {
      let schema: z.ZodTypeAny = z.preprocess((val) => (typeof val === 'string' ? val.trim() : ''), z.string());

      if (field.required) {
        schema = schema.refine((v: string) => v.length > 0, { message: fa.required(field.label) });
      }

      if (field.minLength !== undefined) {
        const min = field.minLength;
        schema = schema.refine((v: string) => v.length === 0 || v.length >= min, {
          message: fa.minLength(field.label, min)
        });
      }

      if (field.maxLength !== undefined) {
        const max = field.maxLength;
        schema = schema.refine((v: string) => v.length <= max, {
          message: fa.maxLength(field.label, max)
        });
      }

      return schema;
    }

    case 'number': {
      let schema: z.ZodTypeAny = z.preprocess((val) => {
        if (val === '' || val === null || val === undefined) return undefined;
        if (typeof val === 'number') return val;
        const norm = normalizeDigits(val);
        const parsed = Number(norm);
        return isNaN(parsed) ? undefined : parsed;
      }, z.number({ invalid_type_error: fa.required(field.label) }).optional());

      if (field.required) {
        schema = schema.refine((v: number | undefined) => v !== undefined, { message: fa.required(field.label) });
      }

      if (field.integer) {
        schema = schema.refine((v: number | undefined) => v === undefined || Number.isInteger(v), {
          message: fa.integer(field.label)
        });
      }

      if (field.min !== undefined) {
        const min = field.min;
        schema = schema.refine((v: number | undefined) => v === undefined || v >= min, {
          message: fa.minNumber(field.label, min)
        });
      }

      if (field.max !== undefined) {
        const max = field.max;
        schema = schema.refine((v: number | undefined) => v === undefined || v <= max, {
          message: fa.maxNumber(field.label, max)
        });
      }

      return schema;
    }

    case 'tel': {
      let schema: z.ZodTypeAny = z.preprocess(
        (val) => (val ? cleanIranMobile(val) : ''),
        z.string()
      );

      if (field.required) {
        schema = schema.refine((v: string) => v.length > 0, { message: fa.required(field.label) });
      }

      schema = schema.refine((v: string) => v.length === 0 || isValidIranMobile(v), {
        message: fa.mobile(field.label)
      });

      return schema;
    }

    case 'select': {
      const validValues = field.options.map((opt) => opt.value);
      let schema: z.ZodTypeAny = z.preprocess((val) => (typeof val === 'string' ? val : ''), z.string());

      if (field.required) {
        schema = schema.refine((v: string) => v.length > 0, { message: fa.required(field.label) });
      }

      schema = schema.refine((v: string) => v.length === 0 || validValues.includes(v), {
        message: fa.invalidOption(field.label)
      });

      return schema;
    }

    case 'multiselect': {
      const validValues = field.options.map((opt) => opt.value);
      let schema: z.ZodTypeAny = z.preprocess((val) => {
        if (!Array.isArray(val)) return [];
        return val.filter((item): item is string => typeof item === 'string');
      }, z.array(z.string()));

      if (field.required || (field.minItems !== undefined && field.minItems > 0)) {
        const min = field.minItems ?? 1;
        schema = schema.refine((arr: string[]) => arr.length >= min, {
          message: fa.minItems(field.label, min)
        });
      }

      if (field.maxItems !== undefined) {
        const max = field.maxItems;
        schema = schema.refine((arr: string[]) => arr.length <= max, {
          message: fa.maxItems(field.label, max)
        });
      }

      schema = schema.refine((arr: string[]) => arr.every((item) => validValues.includes(item)), {
        message: fa.invalidOption(field.label)
      });

      return schema;
    }

    case 'jalali-date': {
      let schema: z.ZodTypeAny = z.preprocess((val) => (typeof val === 'string' ? val.trim() : ''), z.string());

      if (field.required) {
        schema = schema.refine((v: string) => v.length > 0, { message: fa.required(field.label) });
      }

      schema = schema.refine(
        (v: string) => {
          if (v.length === 0) return true;
          return parseJalaliString(v) !== null;
        },
        { message: fa.invalidDate(field.label) }
      );

      return schema;
    }

    case 'reference': {
      if (field.multiple) {
        let schema: z.ZodTypeAny = z.preprocess((val) => {
          if (!Array.isArray(val)) return [];
          return val.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        }, z.array(z.string()));

        if (field.required || (field.minItems !== undefined && field.minItems > 0)) {
          const min = field.minItems ?? 1;
          schema = schema.refine((arr: string[]) => arr.length >= min, {
            message: fa.minItems(field.label, min)
          });
        }

        if (field.maxItems !== undefined) {
          const max = field.maxItems;
          schema = schema.refine((arr: string[]) => arr.length <= max, {
            message: fa.maxItems(field.label, max)
          });
        }

        return schema;
      } else {
        let schema: z.ZodTypeAny = z.preprocess((val) => (typeof val === 'string' ? val.trim() : ''), z.string());

        if (field.required) {
          schema = schema.refine((v: string) => v.length > 0, { message: fa.required(field.label) });
        }

        return schema;
      }
    }

    default:
      return assertNever(field);
  }
}

export function buildZodSchema(definition: FormDefinition): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of definition.fields) {
    shape[field.key] = buildFieldZodSchema(field);
  }
  return z.object(shape).strict();
}
