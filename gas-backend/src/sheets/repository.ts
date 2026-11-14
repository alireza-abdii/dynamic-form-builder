/**
 * Google Sheets Data Access Layer.
 */
import type { FormDefinition, SubmitRequest } from '@fb/shared';
import { normalizeDigits, isFieldVisible } from '@fb/shared';

export interface BaseSubmissionMeta {
  submissionId: string;
  trackingCode?: string | undefined;
  jalaliDate: string;
  isoDate: string;
  source: string;
  tgUserId?: number | string | undefined;
  tgUsername?: string | undefined;
}

export const TECHNICAL_COLUMNS = [
  { key: '__trackingCode', label: 'کد رهگیری' },
  { key: '__status', label: 'وضعیت' },
  { key: '__reviewedBy', label: 'بررسی توسط' },
  { key: '__submissionId', label: 'شناسه ثبت' },
  { key: '__jalaliDate', label: 'تاریخ ثبت (شمسی)' },
  { key: '__isoDate', label: 'زمان ثبت (ISO)' },
  { key: '__source', label: 'منبع' },
  { key: '__tgUserId', label: 'شناسه تلگرام' },
  { key: '__tgUsername', label: 'نام کاربری تلگرام' }
];

export function openSpreadsheet(spreadsheetId: string): GoogleAppsScript.Spreadsheet.Spreadsheet {
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID is not configured in Script Properties.');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

export function getOrCreateTab(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  form: FormDefinition
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = ss.getSheetByName(form.id);

  if (!sheet) {
    sheet = ss.insertSheet(form.id);
    sheet.setRightToLeft(true);
    sheet.setFrozenRows(1);

    // Initial headers
    const headerLabels = [
      ...TECHNICAL_COLUMNS.map((c) => c.label),
      ...form.fields.map((f) => f.label)
    ];

    const range = sheet.getRange(1, 1, 1, headerLabels.length);
    range.setValues([headerLabels]);
    range.setFontWeight('bold');
    range.setBackground('#f1f5f9');
    range.setHorizontalAlignment('center');
  }

  ensureHeaders(sheet, form);
  return sheet;
}

export function ensureHeaders(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  form: FormDefinition
): void {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[];

  const missingLabels: string[] = [];
  for (const techCol of TECHNICAL_COLUMNS) {
    if (!existingHeaders.includes(techCol.label)) {
      missingLabels.push(techCol.label);
    }
  }

  for (const field of form.fields) {
    if (!existingHeaders.includes(field.label)) {
      missingLabels.push(field.label);
    }
  }

  if (missingLabels.length > 0) {
    const startCol = lastCol + 1;
    const range = sheet.getRange(1, startCol, 1, missingLabels.length);
    range.setValues([missingLabels]);
    range.setFontWeight('bold');
    range.setBackground('#f1f5f9');
    range.setHorizontalAlignment('center');
  }
}

export function appendSubmissionRow(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  form: FormDefinition,
  req: SubmitRequest,
  meta: BaseSubmissionMeta
): void {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;

  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[];
  const rowValues: (string | number)[] = [];

  // Build field value mapping by label
  const labelToValueMap: Record<string, string | number> = {
    'کد رهگیری': meta.trackingCode || '',
    'وضعیت': form.requiresApproval ? 'در انتظار بررسی' : '',
    'بررسی توسط': '',
    'شناسه ثبت': meta.submissionId,
    'تاریخ ثبت (شمسی)': meta.jalaliDate,
    'زمان ثبت (ISO)': meta.isoDate,
    'منبع': meta.source,
    'شناسه تلگرام': meta.tgUserId ? String(meta.tgUserId) : '',
    'نام کاربری تلگرام': meta.tgUsername ? `@${meta.tgUsername}` : ''
  };

  for (const field of form.fields) {
    if (!isFieldVisible(field, req.values as Record<string, unknown>)) {
      labelToValueMap[field.label] = '';
      continue;
    }

    const rawVal = req.values[field.key];
    if (rawVal === undefined || rawVal === null) {
      labelToValueMap[field.label] = '';
    } else if (Array.isArray(rawVal)) {
      // For multiselect: map options to labels if possible and join
      const labels = rawVal.map((v) => {
        if (field.type === 'multiselect') {
          const opt = field.options.find((o) => o.value === v);
          return opt ? opt.label : String(v);
        }
        return String(v);
      });
      labelToValueMap[field.label] = labels.join('، ');
    } else if (field.type === 'select') {
      const opt = field.options.find((o) => o.value === rawVal);
      labelToValueMap[field.label] = opt ? opt.label : String(rawVal);
    } else if (typeof rawVal === 'number') {
      labelToValueMap[field.label] = rawVal;
    } else {
      labelToValueMap[field.label] = String(rawVal);
    }
  }

  // Populate row according to header column sequence
  for (const header of headerRow) {
    rowValues.push(labelToValueMap[header] !== undefined ? labelToValueMap[header]! : '');
  }

  const nextRow = sheet.getLastRow() + 1;
  const targetRange = sheet.getRange(nextRow, 1, 1, rowValues.length);

  // Set number formats: text format '@' for ID, national code, card, SHEBA, phone numbers to preserve leading zeros
  const formats = headerRow.map((header) => {
    const matchingField = form.fields.find((f) => f.label === header);
    if (matchingField) {
      if (matchingField.type === 'number' && matchingField.currency) {
        return '#,##0';
      }
      if (
        matchingField.type === 'tel' ||
        (matchingField.type === 'text' && matchingField.preset !== undefined)
      ) {
        return '@';
      }
    }

    if (
      header.includes('کد ملی') ||
      header.includes('شماره همراه') ||
      header.includes('شناسه') ||
      header.includes('رهگیری') ||
      header.includes('تلفن') ||
      header.includes('شبا') ||
      header.includes('کارت') ||
      header.includes('پستی')
    ) {
      return '@';
    }
    return '';
  });

  targetRange.setNumberFormats([formats]);
  targetRange.setValues([rowValues]);
}

export interface TabStats {
  formId: string;
  totalSubmissions: number;
  todaySubmissions: number;
  lastSubmissionDate?: string | undefined;
}

export function getTabStats(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  formId: string,
  todayJalali: string
): TabStats {
  const sheet = ss.getSheetByName(formId);
  if (!sheet) {
    return { formId, totalSubmissions: 0, todaySubmissions: 0 };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { formId, totalSubmissions: 0, todaySubmissions: 0 };
  }

  const totalSubmissions = lastRow - 1;
  let todaySubmissions = 0;
  let lastSubmissionDate: string | undefined = undefined;

  // Jalali date is column 2
  const dateValues = sheet.getRange(2, 2, totalSubmissions, 1).getValues() as string[][];

  for (let i = 0; i < dateValues.length; i++) {
    const val = dateValues[i]?.[0];
    if (val && String(val).startsWith(todayJalali)) {
      todaySubmissions++;
    }
  }

  if (dateValues.length > 0) {
    const last = dateValues[dateValues.length - 1]?.[0];
    if (last) lastSubmissionDate = String(last);
  }

  return {
    formId,
    totalSubmissions,
    todaySubmissions,
    lastSubmissionDate
  };
}

/**
 * Checks whether a given value already exists in the column for a specific field label.
 * Performs normalization (digit normalization, trimming, case-insensitivity) to ensure
 * reliable comparisons across keyboards.
 */
export function checkDuplicateValue(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  fieldLabel: string,
  value: string | number
): boolean {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return false;

  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[];
  const colIndex = headerRow.findIndex((h) => h === fieldLabel);
  if (colIndex === -1) return false;

  const sheetColNum = colIndex + 1;
  const numRows = lastRow - 1;

  const colData = sheet.getRange(2, sheetColNum, numRows, 1).getValues() as (string | number)[][];
  const targetClean = normalizeDigits(String(value)).trim().toLowerCase();
  if (!targetClean) return false;

  return colData.some((row) => {
    const cellVal = row[0];
    if (cellVal === undefined || cellVal === null || cellVal === '') return false;
    const cleanCell = normalizeDigits(String(cellVal)).trim().toLowerCase();
    return cleanCell === targetClean;
  });
}

export interface SubmissionsResult {
  headers: string[];
  submissions: Record<string, string | number>[];
  total: number;
}

/**
 * Fetches all submissions from the form's sheet tab.
 * Returns headers and row records sorted newest first.
 */
export function getSubmissions(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  formId: string
): SubmissionsResult {
  const sheet = ss.getSheetByName(formId);
  if (!sheet) {
    return { headers: [], submissions: [], total: 0 };
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return { headers: [], submissions: [], total: 0 };
  }

  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[];
  const headers = headerRow.map((h) => String(h || ''));

  if (lastRow <= 1) {
    return { headers, submissions: [], total: 0 };
  }

  const numRows = lastRow - 1;
  const rawValues = sheet.getRange(2, 1, numRows, lastCol).getValues();

  const submissions: Record<string, string | number>[] = [];
  for (let r = 0; r < rawValues.length; r++) {
    const row = rawValues[r];
    if (!row) continue;
    const item: Record<string, string | number> = {};
    for (let c = 0; c < headers.length; c++) {
      const colName = headers[c];
      if (!colName) continue;
      const cellVal = row[c];
      if (cellVal === undefined || cellVal === null) {
        item[colName] = '';
      } else if (typeof cellVal === 'number') {
        item[colName] = cellVal;
      } else {
        item[colName] = String(cellVal);
      }
    }
    submissions.push(item);
  }

  // Newest submissions first
  submissions.reverse();

  return {
    headers,
    submissions,
    total: submissions.length
  };
}

export interface UpdateStatusResult {
  ok: boolean;
  alreadyProcessed?: boolean;
  previousStatus?: string;
  reviewer?: string;
  tgUserId?: string | null;
  message?: string;
}

/**
 * Updates submission status ('تایید شد' | 'رد شد') and reviewer details in the form's sheet tab.
 * Performs race-condition check: if already processed, rejects with previous status details.
 * Colors the entire row in Google Sheets (light green for approved, light red for rejected).
 */
export function updateSubmissionStatus(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  trackingCode: string,
  newStatus: 'تایید شد' | 'رد شد',
  reviewerName: string
): UpdateStatusResult {
  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1 || lastCol === 0) {
    return { ok: false, message: 'هیچ رکوردی در فرم یافت نشد.' };
  }

  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[];
  const trackingColIdx = headerRow.findIndex((h) => h === 'کد رهگیری');
  const statusColIdx = headerRow.findIndex((h) => h === 'وضعیت');
  const reviewerColIdx = headerRow.findIndex((h) => h === 'بررسی توسط');
  const tgUserColIdx = headerRow.findIndex((h) => h === 'شناسه تلگرام');

  if (trackingColIdx === -1) {
    return { ok: false, message: 'ستون کد رهگیری در شیت فرم یافت نشد.' };
  }

  const numRows = lastRow - 1;
  const trackingColData = sheet.getRange(2, trackingColIdx + 1, numRows, 1).getValues() as (string | number)[][];

  let targetRowIndex = -1;
  for (let i = 0; i < trackingColData.length; i++) {
    const cellVal = String(trackingColData[i]?.[0] || '').trim();
    if (cellVal === trackingCode.trim()) {
      targetRowIndex = i + 2; // 1-based index in sheet
      break;
    }
  }

  if (targetRowIndex === -1) {
    return { ok: false, message: `درخواستی با کد رهگیری «${trackingCode}» در سیستم یافت نشد.` };
  }

  const currentStatus = statusColIdx !== -1
    ? String(sheet.getRange(targetRowIndex, statusColIdx + 1).getValue() || '')
    : '';
  const currentReviewer = reviewerColIdx !== -1
    ? String(sheet.getRange(targetRowIndex, reviewerColIdx + 1).getValue() || '')
    : '';
  const tgUserIdVal = tgUserColIdx !== -1
    ? sheet.getRange(targetRowIndex, tgUserColIdx + 1).getValue()
    : null;

  if (currentStatus === 'تایید شد' || currentStatus === 'رد شد') {
    return {
      ok: false,
      alreadyProcessed: true,
      previousStatus: currentStatus,
      reviewer: currentReviewer,
      tgUserId: tgUserIdVal ? String(tgUserIdVal) : null
    };
  }

  if (statusColIdx !== -1) {
    sheet.getRange(targetRowIndex, statusColIdx + 1).setValue(newStatus);
  }
  if (reviewerColIdx !== -1) {
    sheet.getRange(targetRowIndex, reviewerColIdx + 1).setValue(reviewerName);
  }

  // Row background color: light green for approved (#dcfce7), light red for rejected (#fee2e2)
  const rowRange = sheet.getRange(targetRowIndex, 1, 1, lastCol);
  rowRange.setBackground(newStatus === 'تایید شد' ? '#dcfce7' : '#fee2e2');

  return {
    ok: true,
    previousStatus: currentStatus,
    tgUserId: tgUserIdVal ? String(tgUserIdVal) : null
  };
}


