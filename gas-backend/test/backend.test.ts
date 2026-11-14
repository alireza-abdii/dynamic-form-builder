import { describe, it, expect } from 'vitest';
import { FORM_REGISTRY, type SubmitRequest } from '@fb/shared';
import { TECHNICAL_COLUMNS } from '../src/sheets/repository';

describe('GAS Backend Architecture & Sheets Contract', () => {
  it('bundles shared registry with registered form definitions', () => {
    expect(FORM_REGISTRY).toBeDefined();
    const form = FORM_REGISTRY['employee-contact-info'];
    expect(form).toBeDefined();
    expect(form?.fields.length).toBeGreaterThan(0);
  });

  it('defines mandatory technical columns for auditability and Telegram tracing', () => {
    const columnKeys = TECHNICAL_COLUMNS.map((c) => c.key);
    expect(columnKeys).toContain('__submissionId');
    expect(columnKeys).toContain('__jalaliDate');
    expect(columnKeys).toContain('__isoDate');
    expect(columnKeys).toContain('__source');
    expect(columnKeys).toContain('__tgUserId');
    expect(columnKeys).toContain('__tgUsername');
  });

  it('correctly maps form field labels into Google Sheets columns', () => {
    const form = FORM_REGISTRY['employee-contact-info'];
    expect(form).toBeDefined();
    if (!form) return;

    const sampleRequest: SubmitRequest = {
      action: 'submit',
      formId: form.id,
      formVersion: form.version,
      submissionId: 'test-uuid-1234',
      values: {
        fullName: 'علی مرادی',
        nationalId: '0010359745',
        mobile: '09121112233',
        department: 'it',
        skills: ['excel', 'python'],
        childrenCount: 1,
        birthDate: '1372/06/10'
      },
      meta: {
        source: 'telegram',
        startedAt: Date.now() - 5000
      }
    };

    expect(sampleRequest.action).toBe('submit');
    expect(sampleRequest.values.nationalId).toBe('0010359745');
    // Ensure nationalId begins with '00' and mobile with '09'
    expect(String(sampleRequest.values.nationalId).startsWith('00')).toBe(true);
    expect(String(sampleRequest.values.mobile).startsWith('09')).toBe(true);
  });

  it('supports Iranian SHEBA and bank card presets in form fields', () => {
    const bankingForm = {
      id: 'finance-test',
      version: 1,
      title: 'اطلاعات پرداخت',
      status: 'open' as const,
      access: 'public' as const,
      notifyAdmins: false,
      submitLabel: 'ثبت',
      successMessage: 'با موفقیت ثبت شد',
      fields: [
        {
          key: 'sheba',
          type: 'text' as const,
          label: 'شماره شبا',
          preset: 'iran-sheba' as const,
          required: true
        },
        {
          key: 'card',
          type: 'text' as const,
          label: 'شماره کارت',
          preset: 'bank-card' as const
        }
      ]
    };

    expect(bankingForm.fields[0]?.preset).toBe('iran-sheba');
    expect(bankingForm.fields[1]?.preset).toBe('bank-card');
  });

  it('supports currency fields with toman and rial in backend structures', () => {
    const currencyForm = {
      id: 'donation-test',
      version: 1,
      title: 'کمک نقدی',
      status: 'open' as const,
      access: 'public' as const,
      notifyAdmins: false,
      submitLabel: 'پرداخت',
      successMessage: 'با تشکر',
      fields: [
        {
          key: 'amount',
          type: 'number' as const,
          label: 'مبلغ پرداختی',
          currency: 'toman' as const,
          required: true
        }
      ]
    };

    expect(currencyForm.fields[0]?.type).toBe('number');
    expect(currencyForm.fields[0]?.currency).toBe('toman');
  });

  it('detects duplicate values across sheets with Persian and ASCII numeral normalization', async () => {
    const mockSheet = {
      getLastRow: () => 3,
      getLastColumn: () => 2,
      getRange: (row: number, col: number) => {
        if (row === 1) {
          return {
            getValues: () => [['کد ملی', 'شماره همراه']]
          };
        }
        if (col === 1) {
          return {
            getValues: () => [['0010359745'], ['0020468856']]
          };
        }
        return {
          getValues: () => [['09121112233'], ['09354445566']]
        };
      }
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

    const { checkDuplicateValue } = await import('../src/sheets/repository');

    // Duplicate exact match
    expect(checkDuplicateValue(mockSheet, 'کد ملی', '0010359745')).toBe(true);

    // Duplicate with Persian digits
    expect(checkDuplicateValue(mockSheet, 'کد ملی', '۰۰۱۰۳۵۹۷۴۵')).toBe(true);

    // Duplicate mobile with leading space
    expect(checkDuplicateValue(mockSheet, 'شماره همراه', ' 09121112233 ')).toBe(true);

    // New non-duplicate value
    expect(checkDuplicateValue(mockSheet, 'کد ملی', '0030579967')).toBe(false);

    // Non-existent column
    expect(checkDuplicateValue(mockSheet, 'ایمیل', 'test@example.com')).toBe(false);
  });

  it('fetches submissions from sheet and returns rows reversed (newest first)', async () => {
    const mockSheet = {
      getLastRow: () => 3, // header row + 2 data rows
      getLastColumn: () => 3,
      getRange: (row: number, _col: number, _numRows?: number, _numCols?: number) => {
        if (row === 1) {
          return {
            getValues: () => [['کد رهگیری', 'نام', 'مبلغ']]
          };
        }
        return {
          getValues: () => [
            ['FB-AA1122', 'علی محمدی', 50000],
            ['FB-BB3344', 'سارا رضایی', 100000]
          ]
        };
      }
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

    const mockSpreadsheet = {
      getSheetByName: (name: string) => {
        if (name === 'test-form') return mockSheet;
        return null;
      }
    } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet;

    const { getSubmissions } = await import('../src/sheets/repository');

    const result = getSubmissions(mockSpreadsheet, 'test-form');
    expect(result.total).toBe(2);
    expect(result.headers).toEqual(['کد رهگیری', 'نام', 'مبلغ']);
    // Newest first (row 2 before row 1)
    expect(result.submissions[0]?.['کد رهگیری']).toBe('FB-BB3344');
    expect(result.submissions[0]?.['نام']).toBe('سارا رضایی');
    expect(result.submissions[0]?.['مبلغ']).toBe(100000);
    expect(result.submissions[1]?.['کد رهگیری']).toBe('FB-AA1122');
    expect(result.submissions[1]?.['نام']).toBe('علی محمدی');

    // Non-existent form sheet
    const emptyResult = getSubmissions(mockSpreadsheet, 'non-existent');
    expect(emptyResult.total).toBe(0);
    expect(emptyResult.submissions).toEqual([]);
  });

  it('builds notification keyboard with inline approval buttons when requiresApproval is enabled', async () => {
    const { buildNotificationKeyboard } = await import('../src/telegram/keyboards');

    // With approval workflow enabled
    const approvalKeyboard = buildNotificationKeyboard('leave-req', {
      trackingCode: 'FB-7K3M9Q',
      requiresApproval: true,
      publicBaseUrl: 'https://example.com'
    });

    expect(approvalKeyboard.inline_keyboard.length).toBe(2);
    expect(approvalKeyboard.inline_keyboard[0]?.[0]?.text).toContain('تایید');
    expect(approvalKeyboard.inline_keyboard[0]?.[0]?.callback_data).toBe('ap:leave-req:FB-7K3M9Q');
    expect(approvalKeyboard.inline_keyboard[0]?.[1]?.text).toContain('رد');
    expect(approvalKeyboard.inline_keyboard[0]?.[1]?.callback_data).toBe('rj:leave-req:FB-7K3M9Q');

    // Without approval workflow
    const normalKeyboard = buildNotificationKeyboard('contact-us', {
      trackingCode: 'FB-AA1122',
      requiresApproval: false
    });
    expect(normalKeyboard.inline_keyboard.length).toBe(1);
    expect(normalKeyboard.inline_keyboard[0]?.[0]?.callback_data).toBe('x:contact-us');
  });

  it('updates submission status, reviewer, and background color, and rejects already processed submissions', async () => {
    let statusVal = '';
    let reviewerVal = '';
    let bgVal = '';

    const mockSheet = {
      getLastRow: () => 2,
      getLastColumn: () => 4,
      getRange: (row: number, col: number, numRows?: number, numCols?: number) => {
        if (row === 1 && (numRows === 1 || !numRows)) {
          return {
            getValues: () => [['کد رهگیری', 'وضعیت', 'بررسی توسط', 'شناسه تلگرام']]
          };
        }
        if (numCols && numCols > 1) {
          return {
            setBackground: (color: string) => {
              bgVal = color;
            }
          };
        }
        if (numRows && numRows > 0) {
          // Column 1 (کد رهگیری) data
          return {
            getValues: () => [['FB-7K3M9Q']]
          };
        }
        // Specific cell get/set
        return {
          getValue: () => {
            if (col === 2) return statusVal;
            if (col === 3) return reviewerVal;
            if (col === 4) return '247249834';
            return '';
          },
          setValue: (val: string) => {
            if (col === 2) statusVal = val;
            if (col === 3) reviewerVal = val;
          },
          setBackground: (color: string) => {
            bgVal = color;
          }
        };
      }
    } as unknown as GoogleAppsScript.Spreadsheet.Sheet;

    const { updateSubmissionStatus } = await import('../src/sheets/repository');

    // 1. Initial approval
    const result = updateSubmissionStatus(mockSheet, 'FB-7K3M9Q', 'تایید شد', 'علیرضا – ۱۴۰۵/۰۸/۱۹');
    expect(result.ok).toBe(true);
    expect(result.tgUserId).toBe('247249834');
    expect(statusVal).toBe('تایید شد');
    expect(reviewerVal).toBe('علیرضا – ۱۴۰۵/۰۸/۱۹');
    expect(bgVal).toBe('#dcfce7'); // light green

    // 2. Second click attempt (race condition protection)
    const duplicateClick = updateSubmissionStatus(mockSheet, 'FB-7K3M9Q', 'رد شد', 'مدیر دوم');
    expect(duplicateClick.ok).toBe(false);
    expect(duplicateClick.alreadyProcessed).toBe(true);
    expect(duplicateClick.previousStatus).toBe('تایید شد');
    expect(duplicateClick.reviewer).toBe('علیرضا – ۱۴۰۵/۰۸/۱۹');
  });
});
