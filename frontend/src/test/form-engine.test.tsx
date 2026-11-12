import { describe, it, expect } from 'vitest';
import { FORM_REGISTRY, buildZodSchema } from '@fb/shared';

describe('Frontend Form Engine Integration', () => {
  it('loads sample form definition from shared registry', () => {
    const form = FORM_REGISTRY['employee-contact-info'];
    expect(form).toBeDefined();
    expect(form?.title).toContain('اطلاعات تماس');
    expect(form?.fields.length).toBe(7);
  });

  it('builds valid schema capable of validating full form input', () => {
    const form = FORM_REGISTRY['employee-contact-info'];
    expect(form).toBeDefined();
    if (!form) return;

    const schema = buildZodSchema(form);

    const validPayload = {
      fullName: 'محمد رضایی',
      nationalId: '0010359745',
      mobile: '09121234567',
      department: 'it',
      skills: ['excel', 'python'],
      childrenCount: '2',
      birthDate: '1370/05/15'
    };

    const res = schema.safeParse(validPayload);
    expect(res.success).toBe(true);
  });

  it('identifies invalid Iranian phone numbers and national IDs', () => {
    const form = FORM_REGISTRY['employee-contact-info'];
    if (!form) return;

    const schema = buildZodSchema(form);

    const invalidPayload = {
      fullName: 'علی',
      nationalId: '123456', // invalid length & checksum
      mobile: '08123456789', // invalid prefix
      department: 'invalid-dept',
      birthDate: 'invalid-date'
    };

    const res = schema.safeParse(invalidPayload);
    expect(res.success).toBe(false);
    if (!res.success) {
      const formatted = res.error.format();
      expect(formatted.nationalId?._errors.length).toBeGreaterThan(0);
      expect(formatted.mobile?._errors.length).toBeGreaterThan(0);
      expect(formatted.department?._errors.length).toBeGreaterThan(0);
    }
  });

  it('validates currency number inputs formatted with commas and Persian digits', () => {
    const form = {
      id: 'currency-test',
      version: 1,
      title: 'تست مبلغ',
      status: 'open' as const,
      access: 'public' as const,
      notifyAdmins: false,
      submitLabel: 'ثبت',
      successMessage: 'با موفقیت ثبت شد',
      fields: [
        {
          key: 'fee',
          type: 'number' as const,
          label: 'هزینه دوره',
          currency: 'toman' as const,
          required: true,
          min: 50000
        }
      ]
    };

    const schema = buildZodSchema(form);

    const valid = schema.safeParse({ fee: '۲۵۰,۰۰۰' });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.fee).toBe(250000);
    }

    const invalid = schema.safeParse({ fee: '۱۰,۰۰۰' });
    expect(invalid.success).toBe(false);
  });
});

