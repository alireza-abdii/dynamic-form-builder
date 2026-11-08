import { z } from 'zod';

export const presetEnum = z.enum([
  'iran-mobile',
  'national-id',
  'email',
  'postal-code',
  'digits-only'
]);
export type Preset = z.infer<typeof presetEnum>;

export const optionItemSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1)
});
export type OptionItem = z.infer<typeof optionItemSchema>;

const baseFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/, {
    message: 'Field key must be camelCase alphanumeric starting with a lowercase letter (max 40 chars).'
  }),
  label: z.string().min(1, 'Label cannot be empty.'),
  required: z.boolean().optional(),
  hint: z.string().optional(),
  placeholder: z.string().optional()
});

export const textFieldSchema = baseFieldSchema.extend({
  type: z.literal('text'),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  preset: presetEnum.optional()
});

export const textareaFieldSchema = baseFieldSchema.extend({
  type: z.literal('textarea'),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  rows: z.number().int().positive().default(3).optional()
});

export const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  integer: z.boolean().optional()
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

export const fieldDefinitionSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  textareaFieldSchema,
  numberFieldSchema,
  telFieldSchema,
  selectFieldSchema,
  multiSelectFieldSchema,
  jalaliDateFieldSchema
]);
export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;

export const formDefinitionSchema = z.object({
  $schema: z.string().optional(),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Form id must be lowercase kebab-case (ASCII, max 40 chars).'
  }).max(40),
  version: z.number().int().positive().default(1),
  title: z.string().min(1, 'Title cannot be empty.'),
  description: z.string().optional(),
  status: z.enum(['open', 'closed']).default('open'),
  closesAt: z.string().nullable().optional(),
  access: z.enum(['public', 'telegram']).default('public'),
  notifyAdmins: z.boolean().default(true),
  submitLabel: z.string().default('ثبت اطلاعات'),
  successMessage: z.string().default('اطلاعات شما با موفقیت ثبت شد. سپاس 🌱'),
  fields: z.array(fieldDefinitionSchema).min(1, 'Form must contain at least one field.')
});
export type FormDefinition = z.infer<typeof formDefinitionSchema>;
