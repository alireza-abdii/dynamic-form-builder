import { normalizeDigits } from './digits.js';

export const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export function cleanIranMobile(input: unknown): string {
  let s = normalizeDigits(input);
  if (s.startsWith('+98')) {
    s = '0' + s.slice(3);
  } else if (s.startsWith('0098')) {
    s = '0' + s.slice(4);
  } else if (s.startsWith('98') && s.length === 12) {
    s = '0' + s.slice(2);
  }
  return s;
}

export function isValidIranMobile(input: unknown): boolean {
  const cleaned = cleanIranMobile(input);
  return IRAN_MOBILE_REGEX.test(cleaned);
}

