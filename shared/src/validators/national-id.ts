import { normalizeDigits } from './digits.js';

export function isValidNationalId(input: unknown): boolean {
  const raw = normalizeDigits(input);
  if (!/^\d{8,10}$/.test(raw)) return false;

  const padded = raw.padStart(10, '0');

  // Reject sequences of identical digits
  const allIdentical = ['0000000000', '1111111111', '2222222222', '3333333333', '4444444444', '5555555555', '6666666666', '7777777777', '8888888888', '9999999999'];
  if (allIdentical.includes(padded)) return false;

  const check = Number(padded[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(padded[i]) * (10 - i);
  }

  const remainder = sum % 11;
  if (remainder < 2) {
    return check === remainder;
  }
  return check === 11 - remainder;
}

