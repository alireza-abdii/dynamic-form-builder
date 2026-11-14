import { describe, it, expect } from 'vitest';
import { normalizeDigits, toPersianDigits } from '../src/validators/digits.js';
import { isValidIranMobile, cleanIranMobile } from '../src/validators/iran-mobile.js';
import { isValidNationalId } from '../src/validators/national-id.js';
import { buildZodSchema } from '../src/build-zod.js';
import type { FormDefinition } from '../src/definition.schema.js';

describe('Digit Normalization & Formatting', () => {
  it('converts Persian and Arabic numerals to ASCII', () => {
    expect(normalizeDigits('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(normalizeDigits('  ۱۲۳۴۵  ')).toBe('12345');
  });

  it('formats ASCII numbers to Persian numerals', () => {
    expect(toPersianDigits('09123456789')).toBe('۰۹۱۲۳۴۵۶۷۸۹');
    expect(toPersianDigits(1405)).toBe('۱۴۰۵');
  });
});

describe('Iranian Mobile Validation', () => {
  it('validates correct mobile numbers', () => {
    expect(isValidIranMobile('09123456789')).toBe(true);
    expect(isValidIranMobile('۰۹۱۲۳۴۵۶۷۸۹')).toBe(true);
    expect(isValidIranMobile('+989123456789')).toBe(true);
    expect(isValidIranMobile('00989123456789')).toBe(true);
  });

  it('rejects invalid mobile numbers', () => {
    expect(isValidIranMobile('08123456789')).toBe(false);
    expect(isValidIranMobile('0912345678')).toBe(false); // 10 digits
    expect(isValidIranMobile('091234567890')).toBe(false); // 12 digits
    expect(isValidIranMobile('abcd')).toBe(false);
  });
});

describe('National ID Validation', () => {
  it('validates correct national IDs with valid checksum', () => {
    // Valid Iranian National Code test vectors
    expect(isValidNationalId('0010359745')).toBe(true);
    expect(isValidNationalId('۰۰۱۰۳۵۹۷۴۵')).toBe(true);
    expect(isValidNationalId('0499370899')).toBe(true);
    expect(isValidNationalId('0084545941')).toBe(true);
  });

  it('rejects invalid or repetitive sequences', () => {
    expect(isValidNationalId('1111111111')).toBe(false);
    expect(isValidNationalId('0000000000')).toBe(false);
    expect(isValidNationalId('1234567890')).toBe(false);
    expect(isValidNationalId('123')).toBe(false);
  });
});

describe('Dynamic Zod Schema Builder', () => {
  const sampleDef: FormDefinition = {
    id: 'test-form',
    version: 1,
    title: 'تست',
    status: 'open',
    access: 'public',
    notifyAdmins: false,
    submitLabel: 'ارسال',
    successMessage: 'موفق',
    fields: [
      { key: 'name', type: 'text', label: 'نام', required: true, minLength: 2 },
      { key: 'phone', type: 'tel', label: 'تلفن', required: true, preset: 'iran-mobile' },
      { key: 'score', type: 'number', label: 'امتیاز', min: 1, max: 10, integer: true }
    ]
  };

  const schema = buildZodSchema(sampleDef);

  it('validates a correct payload', () => {
    const valid = {
      name: 'رضا',
      phone: '۰۹۳۵۱۲۳۴۵۶۷',
      score: '8'
    };
    const res = schema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('fails with Persian messages on missing required fields', () => {
    const invalid = {
      name: '',
      phone: '',
      score: 5
    };
    const res = schema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      const err = res.error.format();
      expect(err.name?._errors[0]).toContain('الزامی');
      expect(err.phone?._errors[0]).toContain('الزامی');
    }
  });

  it('validates reference field (single and multiple)', () => {
    const refFormDef: FormDefinition = {
      id: 'leave-request',
      version: 1,
      title: 'درخواست مرخصی',
      status: 'open',
      access: 'public',
      notifyAdmins: false,
      submitLabel: 'ثبت',
      successMessage: 'ثبت شد',
      fields: [
        {
          key: 'employee',
          type: 'reference',
          label: 'نام کارمند',
          required: true,
          source: { formId: 'employee-contact-info', fieldKey: 'fullName' }
        },
        {
          key: 'approvers',
          type: 'reference',
          label: 'تأییدکنندگان',
          required: false,
          multiple: true,
          minItems: 1,
          maxItems: 3,
          source: { formId: 'employee-contact-info', fieldKey: 'fullName' }
        }
      ]
    };

    const refSchema = buildZodSchema(refFormDef);

    // Valid
    const resValid = refSchema.safeParse({
      employee: 'علی رضایی',
      approvers: ['مدیر فنی', 'مدیر منابع انسانی']
    });
    expect(resValid.success).toBe(true);

    // Missing required
    const resInvalid = refSchema.safeParse({
      employee: '',
      approvers: []
    });
    expect(resInvalid.success).toBe(false);
  });

  it('validates text field with custom regex pattern', () => {
    const patternFormDef: FormDefinition = {
      id: 'pattern-test',
      version: 1,
      title: 'تست الگو',
      status: 'open',
      access: 'public',
      notifyAdmins: false,
      submitLabel: 'ثبت',
      successMessage: 'ثبت شد',
      fields: [
        {
          key: 'empCode',
          type: 'text',
          label: 'کد پرسنلی',
          required: true,
          pattern: '^EMP-\\d{4}$',
          patternError: 'کد پرسنلی باید به فرمت EMP-1234 باشد.'
        }
      ]
    };

    const patSchema = buildZodSchema(patternFormDef);
    expect(patSchema.safeParse({ empCode: 'EMP-9876' }).success).toBe(true);
    const fail = patSchema.safeParse({ empCode: 'INVALID' });
    expect(fail.success).toBe(false);
  });

  it('normalizes Persian decimal separator (٫) to dot', () => {
    expect(normalizeDigits('۱۲٫۵')).toBe('12.5');
    expect(normalizeDigits('۰٫۷۵')).toBe('0.75');
  });

  it('normalizes Persian numerals for national-id, postal-code, digits-only and number fields', () => {
    const numericFormDef: FormDefinition = {
      id: 'numeric-normalization-test',
      version: 1,
      title: 'تست فیلدهای عددی',
      status: 'open',
      access: 'public',
      notifyAdmins: false,
      submitLabel: 'ثبت',
      successMessage: 'ثبت شد',
      fields: [
        {
          key: 'nid',
          type: 'text',
          label: 'کد ملی',
          preset: 'national-id',
          required: true
        },
        {
          key: 'pcode',
          type: 'text',
          label: 'کد پستی',
          preset: 'postal-code',
          required: true
        },
        {
          key: 'score',
          type: 'number',
          label: 'امتیاز',
          required: true
        }
      ]
    };

    const schema = buildZodSchema(numericFormDef);
    const parsed = schema.safeParse({
      nid: '۰۰۱۰۳۵۹۷۴۵', // Persian digits valid national ID
      pcode: '۱۲۳۴۵۶۷۸۹۰', // Persian digits postal code
      score: '۱۸٫۵' // Persian decimal score
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.nid).toBe('0010359745');
      expect(parsed.data.pcode).toBe('1234567890');
      expect(parsed.data.score).toBe(18.5);
    }
  });

  it('validates currency number fields with commas and Persian digits', () => {
    const currencyFormDef: FormDefinition = {
      id: 'donation',
      version: 1,
      title: 'کمک مالی',
      status: 'open',
      access: 'public',
      notifyAdmins: false,
      submitLabel: 'پرداخت',
      successMessage: 'با تشکر',
      fields: [
        {
          key: 'amount',
          type: 'number',
          label: 'مبلغ اهدایی',
          currency: 'toman',
          required: true,
          min: 1000
        }
      ]
    };

    const schema = buildZodSchema(currencyFormDef);

    // Formatted Persian currency with commas
    const parsedWithCommas = schema.safeParse({
      amount: '۱۵,۰۰۰,۰۰۰'
    });
    expect(parsedWithCommas.success).toBe(true);
    if (parsedWithCommas.success) {
      expect(parsedWithCommas.data.amount).toBe(15000000);
    }

    // Number below min
    const parsedBelowMin = schema.safeParse({
      amount: '۵۰۰'
    });
    expect(parsedBelowMin.success).toBe(false);
  });

  it('validates and accepts unique field declarations in form definition schema', async () => {
    const { formDefinitionSchema } = await import('../src/definition.schema');
    const { fa } = await import('../src/messages.fa');

    const formWithUnique = {
      id: 'course-signup',
      version: 1,
      title: 'ثبت‌نام دوره تخصصی',
      status: 'open',
      access: 'public',
      notifyAdmins: true,
      submitLabel: 'ثبت‌نام',
      successMessage: 'ثبت‌نام با موفقیت انجام شد',
      fields: [
        {
          key: 'nationalId',
          type: 'text',
          label: 'کد ملی',
          preset: 'national-id',
          required: true,
          unique: true
        },
        {
          key: 'mobile',
          type: 'tel',
          label: 'شماره همراه',
          required: true,
          unique: true
        }
      ]
    };

    const parsed = formDefinitionSchema.safeParse(formWithUnique);
    expect(parsed.success).toBe(true);

    // Verify duplicate error message formatting
    expect(fa.duplicateField('کد ملی', '0010359745')).toContain('0010359745');
    expect(fa.duplicateField('کد ملی', '0010359745')).toContain('امکان ثبت مجدد وجود ندارد');
  });

  it('correctly evaluates field visibility using isFieldVisible', async () => {
    const { isFieldVisible } = await import('../src/visibility.js');
    const { textFieldSchema, selectFieldSchema } = await import('../src/definition.schema.js');

    const normalField = textFieldSchema.parse({
      key: 'normal',
      type: 'text',
      label: 'نام'
    });

    const conditionalField = textFieldSchema.parse({
      key: 'illnessReason',
      type: 'text',
      label: 'علت بیماری',
      showIf: {
        field: 'leaveType',
        equals: 'sick'
      }
    });

    // 1. Normal field is always visible
    expect(isFieldVisible(normalField, {})).toBe(true);

    // 2. Conditional field with matching scalar value
    expect(isFieldVisible(conditionalField, { leaveType: 'sick' })).toBe(true);
    expect(isFieldVisible(conditionalField, { leaveType: 'daily' })).toBe(false);
    expect(isFieldVisible(conditionalField, {})).toBe(false);

    // 3. Conditional field with multiselect array
    const multiCondField = textFieldSchema.parse({
      key: 'extraSpecs',
      type: 'text',
      label: 'توضیحات تکمیلی',
      showIf: {
        field: 'services',
        equals: 'custom-dev'
      }
    });

    expect(isFieldVisible(multiCondField, { services: ['design', 'custom-dev', 'seo'] })).toBe(true);
    expect(isFieldVisible(multiCondField, { services: ['design', 'seo'] })).toBe(false);
    expect(isFieldVisible(multiCondField, { services: [] })).toBe(false);
  });

  it('validates conditional field schema rules in formDefinitionSchema', async () => {
    const { formDefinitionSchema } = await import('../src/definition.schema.js');

    // Valid leave form
    const validLeaveForm = {
      id: 'leave-request',
      version: 1,
      title: 'درخواست مرخصی',
      fields: [
        {
          key: 'leaveType',
          type: 'select',
          label: 'نوع مرخصی',
          required: true,
          options: [
            { value: 'daily', label: 'استحقاقی' },
            { value: 'sick', label: 'استعلاجی' }
          ]
        },
        {
          key: 'illnessReason',
          type: 'text',
          label: 'علت بیماری',
          required: true,
          showIf: {
            field: 'leaveType',
            equals: 'sick'
          }
        }
      ]
    };
    expect(formDefinitionSchema.safeParse(validLeaveForm).success).toBe(true);

    // Invalid: Reference field placed AFTER dependent field
    const invalidOrderForm = {
      id: 'invalid-order',
      version: 1,
      title: 'فرم نامعتبر',
      fields: [
        {
          key: 'illnessReason',
          type: 'text',
          label: 'علت بیماری',
          showIf: {
            field: 'leaveType',
            equals: 'sick'
          }
        },
        {
          key: 'leaveType',
          type: 'select',
          label: 'نوع مرخصی',
          options: [{ value: 'sick', label: 'استعلاجی' }]
        }
      ]
    };
    const orderResult = formDefinitionSchema.safeParse(invalidOrderForm);
    expect(orderResult.success).toBe(false);
    if (!orderResult.success) {
      expect(orderResult.error.errors[0]?.message).toContain('باید قبل از فیلد فعلی قرار گیرد');
    }

    // Invalid: Equals value not among options
    const invalidOptionForm = {
      id: 'invalid-option',
      version: 1,
      title: 'فرم نامعتبر',
      fields: [
        {
          key: 'leaveType',
          type: 'select',
          label: 'نوع مرخصی',
          options: [{ value: 'daily', label: 'استحقاقی' }]
        },
        {
          key: 'illnessReason',
          type: 'text',
          label: 'علت بیماری',
          showIf: {
            field: 'leaveType',
            equals: 'sick' // does not exist in options
          }
        }
      ]
    };
    const optionResult = formDefinitionSchema.safeParse(invalidOptionForm);
    expect(optionResult.success).toBe(false);
    if (!optionResult.success) {
      expect(optionResult.error.errors[0]?.message).toContain('در بین گزینه‌های فیلد مرجع');
    }
  });

  it('skips validation for hidden required conditional fields and enforces it when visible', async () => {
    const leaveFormDef = {
      id: 'leave-request',
      version: 1,
      title: 'درخواست مرخصی',
      status: 'open' as const,
      access: 'public' as const,
      notifyAdmins: true,
      submitLabel: 'ثبت',
      successMessage: 'موفق',
      fields: [
        {
          key: 'leaveType',
          type: 'select' as const,
          label: 'نوع مرخصی',
          required: true,
          options: [
            { value: 'daily', label: 'استحقاقی' },
            { value: 'sick', label: 'استعلاجی' }
          ]
        },
        {
          key: 'illnessReason',
          type: 'text' as const,
          label: 'علت بیماری',
          required: true,
          showIf: {
            field: 'leaveType',
            equals: 'sick'
          }
        }
      ]
    };

    const schema = buildZodSchema(leaveFormDef);

    // 1. When leaveType is 'daily', illnessReason is hidden -> required validation is skipped!
    const dailySubmission = {
      leaveType: 'daily'
    };
    const dailyResult = schema.safeParse(dailySubmission);
    expect(dailyResult.success).toBe(true);

    // 2. When leaveType is 'sick', illnessReason is VISIBLE -> required validation is enforced!
    const sickWithoutReason = {
      leaveType: 'sick'
    };
    const sickFailResult = schema.safeParse(sickWithoutReason);
    expect(sickFailResult.success).toBe(false);
    if (!sickFailResult.success) {
      const issue = sickFailResult.error.issues.find((i) => i.path.includes('illnessReason'));
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('علت بیماری');
    }

    // 3. When leaveType is 'sick' and illnessReason is provided -> passes!
    const sickWithReason = {
      leaveType: 'sick',
      illnessReason: 'سرماخوردگی شدید و استراحت پزشکی'
    };
    const sickPassResult = schema.safeParse(sickWithReason);
    expect(sickPassResult.success).toBe(true);
  });
});
