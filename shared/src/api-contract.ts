import { z } from 'zod';

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
  duplicate: z.boolean().optional()
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

