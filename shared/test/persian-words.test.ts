import { describe, it, expect } from 'vitest';
import {
  numberToPersianWords,
  formatCurrency,
  cleanCurrencyInput
} from '../src/persian-words';

describe('numberToPersianWords', () => {
  it('handles zero correctly', () => {
    expect(numberToPersianWords(0)).toBe('صفر');
    expect(numberToPersianWords('0', 'toman')).toBe('صفر تومان');
    expect(numberToPersianWords('۰۰', 'rial')).toBe('صفر ریال');
  });

  it('handles small single and double digit numbers', () => {
    expect(numberToPersianWords(5)).toBe('پنج');
    expect(numberToPersianWords(11)).toBe('یازده');
    expect(numberToPersianWords(19)).toBe('نوزده');
    expect(numberToPersianWords(20)).toBe('بیست');
    expect(numberToPersianWords(85)).toBe('هشتاد و پنج');
  });

  it('handles hundreds', () => {
    expect(numberToPersianWords(100)).toBe('صد');
    expect(numberToPersianWords(105)).toBe('صد و پنج');
    expect(numberToPersianWords(313)).toBe('سیصد و سیزده');
    expect(numberToPersianWords(999)).toBe('نهصد و نود و نه');
  });

  it('handles thousands', () => {
    expect(numberToPersianWords(1000)).toBe('یک هزار');
    expect(numberToPersianWords(1005)).toBe('یک هزار و پنج');
    expect(numberToPersianWords(12500, 'rial')).toBe('دوازده هزار و پانصد ریال');
    expect(numberToPersianWords(500000, 'toman')).toBe('پانصد هزار تومان');
  });

  it('handles millions and billions', () => {
    expect(numberToPersianWords(15000000, 'toman')).toBe('پانزده میلیون تومان');
    expect(numberToPersianWords('۱۵۵۰۰۰۰۰', 'toman')).toBe('پانزده میلیون و پانصد هزار تومان');
    expect(numberToPersianWords(1000000000, 'toman')).toBe('یک میلیارد تومان');
    expect(numberToPersianWords(25000000000, 'rial')).toBe('بیست و پنج میلیارد ریال');
  });

  it('handles negative numbers', () => {
    expect(numberToPersianWords(-50000, 'toman')).toBe('منفی پنجاه هزار تومان');
    expect(numberToPersianWords('-1200')).toBe('منفی یک هزار و دویست');
  });

  it('handles empty or invalid inputs gracefully', () => {
    expect(numberToPersianWords('')).toBe('');
    expect(numberToPersianWords(null)).toBe('');
    expect(numberToPersianWords(undefined)).toBe('');
    expect(numberToPersianWords('abc')).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats numbers with thousands separators and Persian digits', () => {
    expect(formatCurrency(15000000)).toBe('۱۵,۰۰۰,۰۰۰');
    expect(formatCurrency('15000000', 'toman')).toBe('۱۵,۰۰۰,۰۰۰ تومان');
    expect(formatCurrency('50000', 'rial')).toBe('۵۰,۰۰۰ ریال');
    expect(formatCurrency(100)).toBe('۱۰۰');
    expect(formatCurrency(-25000)).toBe('-۲۵,۰۰۰');
  });

  it('normalizes Persian and Arabic numerals before formatting', () => {
    expect(formatCurrency('۱۲۵۰۰۰۰۰')).toBe('۱۲,۵۰۰,۰۰۰');
    expect(formatCurrency('١٢٣٤٥')).toBe('۱۲,۳۴۵');
  });
});

describe('cleanCurrencyInput', () => {
  it('cleans comma separators and normalizes Persian numerals', () => {
    expect(cleanCurrencyInput('۱۵,۰۰۰,۰۰۰')).toBe('15000000');
    expect(cleanCurrencyInput('12,345,678')).toBe('12345678');
    expect(cleanCurrencyInput('  -۵۰۰,۰۰۰  ')).toBe('-500000');
    expect(cleanCurrencyInput('')).toBe('');
  });
});

