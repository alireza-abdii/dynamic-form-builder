/**
 * Entry points exposed to Google Apps Script runtime.
 */
import { handleDoGet, handleDoPost } from './router';
import { setupCheck as runSetupCheck, getScriptConfig } from './config';
import { openSpreadsheet } from './sheets/repository';
import { getFormsTab } from './forms/dynamic-forms';

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
  getFormsTab(ss);
  console.log('✅ Spreadsheet setup successfully completed.');
}
