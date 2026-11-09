/**
 * Native .xlsx Excel document generator for Google Apps Script.
 */
import { formatJalaliString, getTodayJalali } from '@fb/shared';

export function exportTabToXlsxBlob(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  formId: string
): GoogleAppsScript.Base.Blob {
  const targetSheet = ss.getSheetByName(formId);
  if (!targetSheet) {
    throw new Error(`برگه مربوط به فرم «${formId}» یافت نشد.`);
  }

  const today = getTodayJalali();
  const todayStr = formatJalaliString(today.jy, today.jm, today.jd).replace(/\//g, '-');
  const fileName = `${formId}_${todayStr}.xlsx`;

  // Create isolated scratch spreadsheet to export single tab
  const scratch = SpreadsheetApp.create(`__scratch_${formId}_export__`);
  const scratchId = scratch.getId();

  try {
    // Copy target sheet to scratch
    const copied = targetSheet.copyTo(scratch);
    copied.setName(formId);

    // Remove default Sheet1
    const defaultSheet = scratch.getSheetByName('Sheet1') || scratch.getSheets()[0];
    if (defaultSheet && defaultSheet.getName() !== copied.getName()) {
      scratch.deleteSheet(defaultSheet);
    }

    SpreadsheetApp.flush();

    // Fetch export URL with OAuth token
    const url = `https://docs.google.com/spreadsheets/d/${scratchId}/export?format=xlsx`;
    const response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: `Bearer ${ScriptApp.getOAuthToken()}`
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`Google Sheets export returned status code ${response.getResponseCode()}`);
    }

    const blob = response.getBlob();
    blob.setName(fileName);
    blob.setContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return blob;
  } finally {
    // Delete scratch file to keep Google Drive clean
    try {
      DriveApp.getFileById(scratchId).setTrashed(true);
    } catch (e) {
      console.warn('[xlsx-exporter] Failed to trash scratch spreadsheet:', e);
    }
  }
}
