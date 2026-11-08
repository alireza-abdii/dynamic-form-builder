// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run 'npm run forms:sync' to regenerate.

import type { FormDefinition } from '../definition.schema.js';
import employee_contact_infoData from '../../forms/employee-contact-info.json';

/**
 * Direct mapping of all form definitions (used by backend/GAS).
 */
export const FORM_REGISTRY: Record<string, FormDefinition> = {
  'employee-contact-info': employee_contact_infoData as unknown as FormDefinition,
};

/**
 * Lazy async loader mapping for frontend code-splitting.
 */
export const LAZY_FORM_LOADERS: Record<string, () => Promise<FormDefinition>> = {
  'employee-contact-info': () => import('../../forms/employee-contact-info.json').then(m => m.default as unknown as FormDefinition),
};

export const AVAILABLE_FORM_IDS = [
  'employee-contact-info'
] as const;

export type FormId = typeof AVAILABLE_FORM_IDS[number];
