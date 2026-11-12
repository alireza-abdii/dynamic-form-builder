import { describe, it, expect } from 'vitest';
import {
  cleanBankInput,
  isValidSheba,
  isValidBankCard,
  detectBankName
} from '../src/validators/iran-bank.js';
import { buildZodSchema } from '../src/build-zod.js';
import type { FormDefinition } from '../src/definition.schema.js';

describe('Iranian Bank Validators (SHEBA & Card)', () => {
  describe('cleanBankInput', () => {
    it('normalizes Persian/Arabic digits, removes spaces and dashes, and uppercases', () => {
      expect(cleanBankInput('ir ۱۳-۰۱۷۰-۰۰۰۰-۰۰۱۰-۹۳۱۲-۱۵۴۰-۰۲')).toBe('IR130170000000109312154002');
      expect(cleanBankInput('۶۰۳۷-۹۹۷۵-۹۹۹۹-۹۹۹۳')).toBe('6037997599999993');
    });
  });

  describe('isValidSheba (ISO 13616 / MOD-97-10)', () => {
    // Valid Melli SHEBA
    const validSheba1 = 'IR130170000000109312154002';
    // Valid Mellat SHEBA (Bank code 012)
    const validSheba2 = 'IR860120000000001234567891';

    it('accepts valid SHEBA with or without IR prefix', () => {
      expect(isValidSheba(validSheba1)).toBe(true);
      expect(isValidSheba(validSheba2)).toBe(true);
      // Without 'IR' prefix
      expect(isValidSheba('130170000000109312154002')).toBe(true);
      // Persian digits and spaces
      expect(isValidSheba('ir ۱۳ ۰۱۷۰ ۰۰۰۰ ۰۰۱۰ ۹۳۱۲ ۱۵۴۰ ۰۲')).toBe(true);
    });

    it('rejects invalid SHEBA', () => {
      // Wrong check digits
      expect(isValidSheba('IR000170000000109312154002')).toBe(false);
      // Too short
      expect(isValidSheba('IR13017000000010931215400')).toBe(false);
      // Too long
      expect(isValidSheba('IR1301700000001093121540029')).toBe(false);
      // Non-numeric body
      expect(isValidSheba('IR13017000000010931215400A')).toBe(false);
    });
  });

  describe('isValidBankCard (Luhn Algorithm)', () => {
    it('validates 16-digit card numbers with correct Luhn checksum', () => {
      expect(isValidBankCard('6037997599999993')).toBe(true);
      // With dashes and Persian digits
      expect(isValidBankCard('۶۰۳۷-۹۹۷۵-۹۹۹۹-۹۹۹۳')).toBe(true);
    });

    it('rejects cards with wrong Luhn checksum or wrong length', () => {
      expect(isValidBankCard('6037997599999990')).toBe(false);
      expect(isValidBankCard('603799759999999')).toBe(false); // 15 digits
      expect(isValidBankCard('60379975999999999')).toBe(false); // 17 digits
      expect(isValidBankCard('abcdef1234567890')).toBe(false);
    });
  });

  describe('detectBankName', () => {
    it('identifies bank name from 16-digit card BIN', () => {
      expect(detectBankName('6037991234567890', 'card')).toBe('بانک ملی');
      expect(detectBankName('6104331234567890', 'card')).toBe('بانک ملت');
      expect(detectBankName('6219861234567890', 'card')).toBe('بانک سامان');
      expect(detectBankName('5022291234567890', 'card')).toBe('بانک پاسارگاد');
      expect(detectBankName('9999991234567890', 'card')).toBeUndefined();
    });

    it('identifies bank name from SHEBA code', () => {
      expect(detectBankName('IR130170000000109312154002', 'sheba')).toBe('بانک ملی');
      expect(detectBankName('IR860120000000001234567891', 'sheba')).toBe('بانک ملت');
      expect(detectBankName('IR000560000000001234567891', 'sheba')).toBe('بانک سامان');
    });
  });

  describe('Zod Schema Integration with Bank Presets', () => {
    const bankForm: FormDefinition = {
      id: 'banking-test',
      version: 1,
      title: 'اطلاعات بانکی',
      status: 'open',
      access: 'public',
      notifyAdmins: false,
      submitLabel: 'ثبت',
      successMessage: 'موفق',
      fields: [
        {
          key: 'shebaNumber',
          type: 'text',
          label: 'شماره شبا',
          preset: 'iran-sheba',
          required: true
        },
        {
          key: 'cardNumber',
          type: 'text',
          label: 'شماره کارت',
          preset: 'bank-card',
          required: false
        }
      ]
    };

    const schema = buildZodSchema(bankForm);

    it('passes validation and normalizes SHEBA to uppercase with IR prefix', () => {
      const res = schema.safeParse({
        shebaNumber: '۱۳۰۱۷۰۰۰۰۰۰۰۱۰۹۳۱۲۱۵۴۰۰۲', // without IR, Persian digits
        cardNumber: '۶۰۳۷-۹۹۷۵-۹۹۹۹-۹۹۹۳'
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.shebaNumber).toBe('IR130170000000109312154002');
        expect(res.data.cardNumber).toBe('6037997599999993');
      }
    });

    it('fails when SHEBA checksum is invalid', () => {
      const res = schema.safeParse({
        shebaNumber: 'IR990170000000109312154002',
        cardNumber: ''
      });
      expect(res.success).toBe(false);
    });

    it('fails when card Luhn checksum is invalid', () => {
      const res = schema.safeParse({
        shebaNumber: 'IR130170000000109312154002',
        cardNumber: '6037997599999990'
      });
      expect(res.success).toBe(false);
    });
  });
});
