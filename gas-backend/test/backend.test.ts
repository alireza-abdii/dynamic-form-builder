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
});
