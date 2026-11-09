/**
 * Entry points exposed to Google Apps Script runtime.
 */
import { handleDoGet, handleDoPost } from './router';
import { setupCheck as runSetupCheck, getScriptConfig } from './config';
import { openSpreadsheet } from './sheets/repository';
import { FORM_REGISTRY, AVAILABLE_FORM_IDS } from '@fb/shared';

export function doGet(e?: GoogleAppsScript.Events.DoGet) {
  return handleDoGet(e);
}

export function doPost(e?: GoogleAppsScript.Events.DoPost) {
  return handleDoPost(e);
}

export function setupCheck() {
  return runSetupCheck();
}

export function setupSpreadsheet() {
  const cfg = getScriptConfig();
  if (!cfg.spreadsheetId) {
    console.error('SPREADSHEET_ID is missing in Script Properties.');
    return;
  }

  const ss = openSpreadsheet(cfg.spreadsheetId);

  // Create or verify _forms metadata sheet
  let metaSheet = ss.getSheetByName('_forms');
  if (!metaSheet) {
    metaSheet = ss.insertSheet('_forms');
    metaSheet.setRightToLeft(true);
    metaSheet.setFrozenRows(1);
    const headers = ['شناسه فرم', 'عنوان', 'تعداد فیلدها', 'وضعیت', 'تاریخ ایجاد'];
    metaSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  }

  // Populate metadata for registered forms
  const existingFormIds = metaSheet.getLastRow() > 1
    ? (metaSheet.getRange(2, 1, metaSheet.getLastRow() - 1, 1).getValues().map((r) => r[0]) as string[])
    : [];

  for (const id of AVAILABLE_FORM_IDS) {
    const form = FORM_REGISTRY[id];
    if (form && !existingFormIds.includes(id)) {
      const row = [id, form.title, form.fields.length, form.status, new Date().toISOString()];
      metaSheet.appendRow(row);
    }
  }

  console.log('✅ Spreadsheet setup successfully completed for all registered forms.');
}
