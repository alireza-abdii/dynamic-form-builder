/**
 * Public status tracking handler.
 * Provides privacy-safe lookup of submission progress using unambiguous tracking codes.
 */
import type { TrackResponse } from '@fb/shared';
import { normalizeTrackingCode, isValidTrackingCode } from '@fb/shared';
import { resolveForm } from './form-resolver';

/**
 * Searches across all sheets in the spreadsheet for a submission matching the tracking code.
 * Strict Privacy: Returns ONLY formTitle, jalaliDate, status, and reviewedBy.
 * No names, phone numbers, national IDs, or other personal data are returned.
 */
export function handleTrackSubmission(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  rawCode: string
): TrackResponse {
  const cleanCode = normalizeTrackingCode(rawCode);

  if (!isValidTrackingCode(cleanCode)) {
    return {
      ok: false,
      found: false,
      message: 'قالب کد رهگیری نامعتبر است. فرمت صحیح: FB-XXXXXX'
    };
  }

  const textFinder = ss.createTextFinder(cleanCode).matchEntireCell(true);
  const matches = textFinder.findAll();

  // Filter out matches from system tabs like '_forms'
  const validMatch = matches.find((m) => !m.getSheet().getName().startsWith('_'));

  if (!validMatch) {
    return {
      ok: true,
      found: false,
      trackingCode: cleanCode,
      message: 'درخواستی با این کد رهگیری در سامانه یافت نشد.'
    };
  }

  const sheet = validMatch.getSheet();
  const formId = sheet.getName();
  const rowIndex = validMatch.getRow();
  const lastCol = sheet.getLastColumn();

  if (lastCol === 0 || rowIndex <= 1) {
    return {
      ok: true,
      found: false,
      trackingCode: cleanCode,
      message: 'درخواستی با این کد رهگیری در سامانه یافت نشد.'
    };
  }

  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[];
  const rowData = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0] as (string | number)[];

  const getVal = (colName: string): string => {
    const idx = headerRow.findIndex((h) => h === colName);
    return idx !== -1 ? String(rowData[idx] || '').trim() : '';
  };

  const rawStatus = getVal('وضعیت');
  const reviewedBy = getVal('بررسی توسط');
  const jalaliDate = getVal('تاریخ ثبت (شمسی)');

  const resolved = resolveForm(formId);
  const formTitle = resolved?.form.title || formId;

  // If no status was set (e.g. form did not require approval), default status is 'ثبت موفق'
  const status = rawStatus || 'ثبت موفق';

  return {
    ok: true,
    found: true,
    trackingCode: cleanCode,
    formTitle,
    jalaliDate: jalaliDate || undefined,
    status,
    reviewedBy: reviewedBy || undefined
  };
}
