import { z } from 'zod';

export const presetEnum = z.enum([
  'iran-mobile',
  'national-id',
  'email',
  'postal-code',
  'digits-only',
  'iran-sheba',
  'bank-card'
]);
export type Preset = z.infer<typeof presetEnum>;

export const optionItemSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1)
});
export type OptionItem = z.infer<typeof optionItemSchema>;

export const showIfSchema = z.object({
  field: z.string().min(1, 'شناسه فیلد مرجع الزامی است.'),
  equals: z.string().min(1, 'مقدار تطابق شرط الزامی است.')
});
export type ShowIf = z.infer<typeof showIfSchema>;

const baseFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/, {
    message: 'Field key must be camelCase alphanumeric starting with a lowercase letter (max 40 chars).'
  }),
  label: z.string().min(1, 'Label cannot be empty.'),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  hint: z.string().optional(),
  placeholder: z.string().optional(),
  showIf: showIfSchema.optional()
});

export const textFieldSchema = baseFieldSchema.extend({
  type: z.literal('text'),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  preset: presetEnum.optional(),
  pattern: z.string().optional(),
  patternError: z.string().optional()
});

export const textareaFieldSchema = baseFieldSchema.extend({
  type: z.literal('textarea'),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  rows: z.number().int().positive().default(3).optional()
});

export const currencyEnum = z.enum(['toman', 'rial']);
export type Currency = z.infer<typeof currencyEnum>;

export const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  integer: z.boolean().optional(),
  currency: currencyEnum.optional()
});

export const telFieldSchema = baseFieldSchema.extend({
  type: z.literal('tel'),
  preset: z.literal('iran-mobile').default('iran-mobile').optional()
});

export const selectFieldSchema = baseFieldSchema.extend({
  type: z.literal('select'),
  options: z.array(optionItemSchema).min(1, 'Select field must have at least one option.')
});

export const multiSelectFieldSchema = baseFieldSchema.extend({
  type: z.literal('multiselect'),
  options: z.array(optionItemSchema).min(1, 'Multiselect field must have at least one option.'),
  minItems: z.number().int().nonnegative().optional(),
  maxItems: z.number().int().positive().optional()
});

export const jalaliDateFieldSchema = baseFieldSchema.extend({
  type: z.literal('jalali-date'),
  minDate: z.string().optional(), // 'today' or 'YYYY/MM/DD'
  maxDate: z.string().optional()  // 'today' or 'YYYY/MM/DD'
});

export const referenceFieldSchema = baseFieldSchema.extend({
  type: z.literal('reference'),
  source: z.object({
    formId: z.string().min(1, 'شناسه فرم مبدأ الزامی است.'),
    fieldKey: z.string().min(1, 'فیلد مرجع در فرم مبدأ الزامی است.')
  }),
  multiple: z.boolean().optional(),
  minItems: z.number().int().nonnegative().optional(),
  maxItems: z.number().int().positive().optional()
});

export const fieldDefinitionSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  textareaFieldSchema,
  numberFieldSchema,
  telFieldSchema,
  selectFieldSchema,
  multiSelectFieldSchema,
  jalaliDateFieldSchema,
  referenceFieldSchema
]);
export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;

export const formDefinitionSchema = z.object({
  $schema: z.string().optional(),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'شناسه فرم باید به صورت kebab-case با حروف کوچک انگلیسی باشد (حداکثر ۴۰ کاراکتر).'
  }).max(40),
  version: z.number().int().positive().default(1),
  title: z.string().min(1, 'عنوان فرم نمی‌تواند خالی باشد.'),
  description: z.string().optional(),
  status: z.enum(['open', 'closed']).default('open'),
  closesAt: z.string().nullable().optional(),
  access: z.enum(['public', 'telegram']).default('public'),
  notifyAdmins: z.boolean().default(true),
  requiresApproval: z.boolean().default(false).optional(),
  submitLabel: z.string().default('ثبت اطلاعات'),
  successMessage: z.string().default('اطلاعات شما با موفقیت ثبت شد. سپاس 🌱'),
  fields: z.array(fieldDefinitionSchema).min(1, 'فرم باید حداقل دارای یک فیلد باشد.')
}).superRefine((data, ctx) => {
  const keys = new Set<string>();
  data.fields.forEach((field, index) => {
    if (keys.has(field.key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `شناسه فیلد (key) «${field.key}» تکراری است.`,
        path: ['fields', index, 'key']
      });
    }
    keys.add(field.key);

    if (field.type === 'text' || field.type === 'textarea') {
      if (field.minLength !== undefined && field.maxLength !== undefined && field.minLength > field.maxLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'حداقل طول کاراکتر نمی‌تواند از حداکثر طول بیشتر باشد.',
          path: ['fields', index, 'minLength']
        });
      }
    }
    if (field.type === 'number') {
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'حداقل مقدار عددی نمی‌تواند از حداکثر مقدار بیشتر باشد.',
          path: ['fields', index, 'min']
        });
      }
    }
    if (field.type === 'multiselect' || field.type === 'reference') {
      if (field.minItems !== undefined && field.maxItems !== undefined && field.minItems > field.maxItems) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'حداقل تعداد انتخاب نمی‌تواند از حداکثر بیشتر باشد.',
          path: ['fields', index, 'minItems']
        });
      }
    }

    if (field.showIf) {
      const earlierFields = data.fields.slice(0, index);
      const targetField = earlierFields.find((f) => f.key === field.showIf?.field);

      if (!targetField) {
        const existsLater = data.fields.some((f) => f.key === field.showIf?.field);
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: existsLater
            ? `فیلد شرطی «${field.showIf.field}» باید قبل از فیلد فعلی قرار گیرد.`
            : `فیلد مرجع شرط «${field.showIf.field}» در فرم یافت نشد.`,
          path: ['fields', index, 'showIf', 'field']
        });
      } else if (targetField.type !== 'select' && targetField.type !== 'multiselect') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `فیلد مرجع شرط «${targetField.label}» باید از نوع انتخابی (select یا multiselect) باشد.`,
          path: ['fields', index, 'showIf', 'field']
        });
      } else {
        const optionExists = targetField.options.some((o) => o.value === field.showIf?.equals);
        if (!optionExists) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `مقدار شرط «${field.showIf.equals}» در بین گزینه‌های فیلد مرجع «${targetField.label}» یافت نشد.`,
            path: ['fields', index, 'showIf', 'equals']
          });
        }
      }
    }
  });
});
export type FormDefinition = z.infer<typeof formDefinitionSchema>;
