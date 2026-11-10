/**
 * Storage & Retrieval for Dynamic Forms stored in Google Sheets tab `_forms`.
 */
import type { FormDefinition } from '@fb/shared';
import { formDefinitionSchema, FORM_REGISTRY } from '@fb/shared';

const FORMS_TAB_NAME = '_forms';
const HEADERS = ['id', 'version', 'title', 'status', 'json', 'createdAt', 'updatedAt'];

export function getFormsTab(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = ss.getSheetByName(FORMS_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(FORMS_TAB_NAME);
    sheet.setRightToLeft(true);
    sheet.setFrozenRows(1);

    const range = sheet.getRange(1, 1, 1, HEADERS.length);
    range.setValues([HEADERS]);
    range.setFontWeight('bold');
    range.setBackground('#e2e8f0');

    // Hide sheet from non-technical users
    try {
      sheet.hideSheet();
    } catch {
      // Ignored if only sheet
    }
  }
  return sheet;
}

export function getAllDynamicForms(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet
): FormDefinition[] {
  const cache = CacheService.getScriptCache();
  const cachedJson = cache?.get('dynamic_forms_all');
  if (cachedJson) {
    try {
      return JSON.parse(cachedJson) as FormDefinition[];
    } catch {
      // fallback to sheet read
    }
  }

  const sheet = ss.getSheetByName(FORMS_TAB_NAME);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues() as (string | number)[][];
  const forms: FormDefinition[] = [];

  for (const row of rows) {
    const rawJson = row[4];
    if (rawJson && typeof rawJson === 'string') {
      try {
        const parsed = JSON.parse(rawJson);
        const valid = formDefinitionSchema.safeParse(parsed);
        if (valid.success) {
          forms.push(valid.data);
        }
      } catch (err) {
        console.warn('[dynamic-forms] Corrupt form JSON row:', err);
      }
    }
  }

  if (cache) {
    cache.put('dynamic_forms_all', JSON.stringify(forms), 60); // 60s cache
  }

  return forms;
}

export function getDynamicForm(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  formId: string
): FormDefinition | null {
  const all = getAllDynamicForms(ss);
  return all.find((f) => f.id === formId) || null;
}

export function saveDynamicForm(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  formDef: FormDefinition
): { ok: boolean; version: number; message?: string } {
  // Prevent collision with static forms in code
  if (FORM_REGISTRY[formDef.id]) {
    return {
      ok: false,
      version: formDef.version,
      message: `شناسه «${formDef.id}» متعلق به یک فرم سیستم است و قابل ویرایش یا بازنویسی نیست.`
    };
  }

  // Validate schema
  const parsed = formDefinitionSchema.safeParse(formDef);
  if (!parsed.success) {
    return {
      ok: false,
      version: formDef.version,
      message: 'فرمت داده‌های فرم معتبر نیست.'
    };
  }

  const sheet = getFormsTab(ss);
  const lastRow = sheet.getLastRow();
  const nowIso = new Date().toISOString();

  let foundRow = 0;
  let newVersion = formDef.version || 1;

  if (lastRow > 1) {
    const idColumn = sheet.getRange(2, 1, lastRow - 1, 2).getValues() as (string | number)[][];
    for (let i = 0; i < idColumn.length; i++) {
      if (idColumn[i]?.[0] === formDef.id) {
        foundRow = i + 2;
        const currentVersion = Number(idColumn[i]?.[1]) || 1;
        newVersion = currentVersion + 1;
        break;
      }
    }
  }

  formDef.version = newVersion;
  const jsonStr = JSON.stringify(formDef);

  if (foundRow > 0) {
    // Update existing row: id, version, title, status, json, (keep createdAt), updatedAt
    sheet.getRange(foundRow, 2).setValue(newVersion);
    sheet.getRange(foundRow, 3).setValue(formDef.title);
    sheet.getRange(foundRow, 4).setValue(formDef.status);
    sheet.getRange(foundRow, 5).setValue(jsonStr);
    sheet.getRange(foundRow, 7).setValue(nowIso);
  } else {
    // Append new row
    sheet.appendRow([
      formDef.id,
      newVersion,
      formDef.title,
      formDef.status,
      jsonStr,
      nowIso,
      nowIso
    ]);
  }

  // Invalidate cache
  const cache = CacheService.getScriptCache();
  if (cache) {
    cache.remove('dynamic_forms_all');
  }

  return { ok: true, version: newVersion };
}

export function deleteDynamicForm(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  formId: string
): boolean {
  if (FORM_REGISTRY[formId]) {
    return false; // Cannot delete static form
  }

  const sheet = ss.getSheetByName(FORMS_TAB_NAME);
  if (!sheet) return false;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues() as string[][];
  for (let i = 0; i < idColumn.length; i++) {
    if (idColumn[i]?.[0] === formId) {
      sheet.deleteRow(i + 2);
      const cache = CacheService.getScriptCache();
      if (cache) {
        cache.remove('dynamic_forms_all');
      }
      return true;
    }
  }
  return false;
}
