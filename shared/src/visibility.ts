import type { FieldDefinition } from './definition.schema.js';

/**
 * Checks whether a field should be visible based on its `showIf` rule
 * and current form values.
 *
 * If no `showIf` is defined, the field is always visible.
 * If the reference field's value is an array (e.g. multiselect), it checks
 * if the array includes the target value.
 * Otherwise, it checks for string equality.
 */
export function isFieldVisible(
  field: FieldDefinition,
  values: Record<string, unknown>
): boolean {
  if (!field.showIf) return true;
  const targetVal = values[field.showIf.field];
  if (targetVal === undefined || targetVal === null) return false;

  if (Array.isArray(targetVal)) {
    return targetVal.some((item) => String(item) === field.showIf?.equals);
  }

  return String(targetVal) === field.showIf.equals;
}
