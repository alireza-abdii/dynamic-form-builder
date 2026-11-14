import { z } from 'zod';
import { formDefinitionSchema } from './definition.schema.js';

export const submitRequestMetaSchema = z.object({
  source: z.enum(['web', 'telegram']),
  initData: z.string().optional(),
  startedAt: z.number().int(),
  hp: z.string().optional() // honeypot
});
export type SubmitRequestMeta = z.infer<typeof submitRequestMetaSchema>;

export const submitRequestSchema = z.object({
  action: z.literal('submit'),
  formId: z.string().min(1),
  formVersion: z.number().int().positive(),
  submissionId: z.string().min(1), // UUID
  values: z.record(z.unknown()),
  meta: submitRequestMetaSchema
});
export type SubmitRequest = z.infer<typeof submitRequestSchema>;

export const apiSuccessResponseSchema = z.object({
  ok: z.literal(true),
  submissionId: z.string(),
  trackingCode: z.string().optional(),
  duplicate: z.boolean().optional(),
  message: z.string().optional()
});

export const apiErrorResponseSchema = z.object({
  ok: z.literal(false),
  code: z.enum([
    'VALIDATION',
    'FORM_CLOSED',
    'UNKNOWN_FORM',
    'UNAUTHORIZED',
    'RATE_LIMIT',
    'SERVER'
  ]),
  message: z.string(),
  fieldErrors: z.record(z.string()).optional()
});

export const apiResponseSchema = z.discriminatedUnion('ok', [
  apiSuccessResponseSchema,
  apiErrorResponseSchema
]);
export type ApiResponse = z.infer<typeof apiResponseSchema>;

// --- Admin & Dynamic Form Schemas ---

export const adminLoginRequestSchema = z.object({
  action: z.literal('login'),
  username: z.string().min(1),
  password: z.string().min(1)
});
export type AdminLoginRequest = z.infer<typeof adminLoginRequestSchema>;

export const adminLoginResponseSchema = z.object({
  ok: z.literal(true),
  token: z.string(),
  expiresAt: z.number()
});
export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;

export const formSummarySchema = z.object({
  id: z.string(),
  version: z.number(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['open', 'closed']),
  closesAt: z.string().nullable().optional(),
  access: z.enum(['public', 'telegram']),
  fieldCount: z.number(),
  isDynamic: z.boolean(),
  updatedAt: z.string().optional()
});
export type FormSummary = z.infer<typeof formSummarySchema>;

export const listFormsRequestSchema = z.object({
  action: z.literal('list_forms'),
  token: z.string().optional()
});
export type ListFormsRequest = z.infer<typeof listFormsRequestSchema>;

export const listFormsResponseSchema = z.object({
  ok: z.literal(true),
  forms: z.array(formSummarySchema)
});
export type ListFormsResponse = z.infer<typeof listFormsResponseSchema>;

export const getFormRequestSchema = z.object({
  action: z.literal('get_form'),
  formId: z.string().min(1)
});
export type GetFormRequest = z.infer<typeof getFormRequestSchema>;

export const getFormResponseSchema = z.object({
  ok: z.literal(true),
  form: formDefinitionSchema,
  isDynamic: z.boolean()
});
export type GetFormResponse = z.infer<typeof getFormResponseSchema>;

export const saveFormRequestSchema = z.object({
  action: z.literal('save_form'),
  token: z.string().min(1),
  form: formDefinitionSchema
});
export type SaveFormRequest = z.infer<typeof saveFormRequestSchema>;

export const saveFormResponseSchema = z.object({
  ok: z.literal(true),
  formId: z.string(),
  version: z.number()
});
export type SaveFormResponse = z.infer<typeof saveFormResponseSchema>;

export const deleteFormRequestSchema = z.object({
  action: z.literal('delete_form'),
  token: z.string().min(1),
  formId: z.string().min(1)
});
export type DeleteFormRequest = z.infer<typeof deleteFormRequestSchema>;

export const deleteFormResponseSchema = z.object({
  ok: z.literal(true),
  formId: z.string()
});
export type DeleteFormResponse = z.infer<typeof deleteFormResponseSchema>;

export const getOptionsRequestSchema = z.object({
  action: z.literal('get_options'),
  formId: z.string().min(1),
  fieldKey: z.string().min(1)
});
export type GetOptionsRequest = z.infer<typeof getOptionsRequestSchema>;

export const getOptionsResponseSchema = z.object({
  ok: z.literal(true),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  }))
});
export type GetOptionsResponse = z.infer<typeof getOptionsResponseSchema>;

export const getSubmissionsRequestSchema = z.object({
  action: z.literal('get_submissions'),
  token: z.string().min(1),
  formId: z.string().min(1)
});
export type GetSubmissionsRequest = z.infer<typeof getSubmissionsRequestSchema>;

export const getSubmissionsResponseSchema = z.object({
  ok: z.literal(true),
  formId: z.string(),
  headers: z.array(z.string()),
  submissions: z.array(z.record(z.union([z.string(), z.number()]))),
  total: z.number()
});
export type GetSubmissionsResponse = z.infer<typeof getSubmissionsResponseSchema>;

export const trackRequestSchema = z.object({
  action: z.literal('track'),
  trackingCode: z.string().min(1)
});
export type TrackRequest = z.infer<typeof trackRequestSchema>;

export const trackResponseSchema = z.object({
  ok: z.boolean(),
  found: z.boolean(),
  trackingCode: z.string().optional(),
  formTitle: z.string().optional(),
  jalaliDate: z.string().optional(),
  status: z.string().optional(),
  reviewedBy: z.string().optional(),
  message: z.string().optional()
});
export type TrackResponse = z.infer<typeof trackResponseSchema>;



