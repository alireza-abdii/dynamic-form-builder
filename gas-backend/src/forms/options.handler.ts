/**
 * Dynamic Options Handler for Reference Fields.
 * Fetches distinct submitted values from another form's sheet.
 */
import { getScriptConfig } from '../config';
import { openSpreadsheet } from '../sheets/repository';
import { resolveForm } from './form-resolver';

export interface OptionResult {
  value: string;
  label: string;
}

export function getFieldOptions(
  formId: string,
  fieldKey: string
): OptionResult[] {
  if (!formId || !fieldKey) return [];

  const cache = CacheService.getScriptCache();
  const cacheKey = `opts_${formId}_${fieldKey}`;
  const cached = cache?.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as OptionResult[];
    } catch {
      // fallback
    }
  }

  const resolved = resolveForm(formId);
  if (!resolved) {
    console.warn(`[options.handler] Source form «${formId}» not found.`);
    return [];
  }

  const sourceField = resolved.form.fields.find((f) => f.key === fieldKey);
  if (!sourceField) {
    console.warn(`[options.handler] Field «${fieldKey}» not found in form «${formId}».`);
    return [];
  }

  const cfg = getScriptConfig();
  if (!cfg.spreadsheetId) return [];

  const ss = openSpreadsheet(cfg.spreadsheetId);
  const sheet = ss.getSheetByName(formId);
  if (!sheet) {
    return [];
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) {
    return [];
  }

  // Find target column by field label
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[];
  const colIndex = headers.indexOf(sourceField.label);
  if (colIndex === -1) {
    console.warn(`[options.handler] Column «${sourceField.label}» not found in sheet «${formId}».`);
    return [];
  }

  const rawValues = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues() as (string | number)[][];
  const distinctSet = new Set<string>();

  for (const row of rawValues) {
    const val = row[0];
    if (val !== undefined && val !== null) {
      const str = String(val).trim();
      if (str.length > 0) {
        distinctSet.add(str);
      }
    }
  }

  const options: OptionResult[] = Array.from(distinctSet)
    .sort((a, b) => a.localeCompare(b, 'fa-IR'))
    .map((val) => ({
      value: val,
      label: val
    }));

  if (cache) {
    cache.put(cacheKey, JSON.stringify(options), 60); // 60s cache
  }

  return options;
}

