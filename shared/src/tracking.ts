import { normalizeDigits } from './validators/digits.js';

/**
 * Unambiguous character set for user-facing tracking codes.
 * Excludes characters easily confused with each other (0, O, 1, I, L).
 */
const TRACKING_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates a clean, short, human-readable tracking code (e.g. 'FB-7B3K9A').
 */
export function generateTrackingCode(prefix = 'FB', length = 6): string {
  let result = '';
  const charsetLen = TRACKING_CHARSET.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charsetLen);
    result += TRACKING_CHARSET[randomIndex] ?? 'X';
  }
  return `${prefix}-${result}`;
}

/**
 * Normalizes user input into a canonical tracking code format (e.g. 'fb-7b3k9a' -> 'FB-7B3K9A').
 * Automatically converts Persian digits and prepends 'FB-' if omitted.
 */
export function normalizeTrackingCode(input: string): string {
  if (!input) return '';
  let clean = normalizeDigits(input).trim().toUpperCase().replace(/\s+/g, '');
  if (!clean.startsWith('FB-') && !clean.includes('-') && clean.length > 0) {
    clean = `FB-${clean}`;
  }
  return clean;
}

/**
 * Validates tracking code format (e.g. 'FB-7B3K9A' or 'FB-123456').
 */
export function isValidTrackingCode(code: string | null | undefined): boolean {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z0-9]{2,6}-[A-Z0-9]{4,10}$/i.test(code.trim());
}
