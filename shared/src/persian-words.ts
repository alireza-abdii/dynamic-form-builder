import { normalizeDigits, toPersianDigits } from './validators/digits';

const ONES: readonly string[] = [
  'صفر',
  'یک',
  'دو',
  'سه',
  'چهار',
  'پنج',
  'شش',
  'هفت',
  'هشت',
  'نه'
];

const TEENS: readonly string[] = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده'
];

const TENS: readonly string[] = [
  '',
  'ده',
  'بیست',
  'سی',
  'چهل',
  'پنجاه',
  'شصت',
  'هفتاد',
  'هشتاد',
  'نود'
];

const HUNDREDS: readonly string[] = [
  '',
  'صد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد'
];

const SCALES: readonly string[] = [
  '',
  'هزار',
  'میلیون',
  'میلیارد',
  'تریلیون',
  'کوادریلیون'
];

/**
 * Converts a 3-digit number (0..999) into Persian words.
 */
function threeDigitsToWords(n: number): string {
  if (n === 0) return '';

  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const remainder = n % 100;

  if (h > 0) {
    parts.push(HUNDREDS[h] ?? '');
  }

  if (remainder >= 10 && remainder <= 19) {
    parts.push(TEENS[remainder - 10] ?? '');
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (t > 0) {
      parts.push(TENS[t] ?? '');
    }
    if (o > 0) {
      parts.push(ONES[o] ?? '');
    }
  }

  return parts.filter(Boolean).join(' و ');
}

export type CurrencyUnit = 'toman' | 'rial';

export const CURRENCY_UNIT_LABELS: Record<CurrencyUnit, string> = {
  toman: 'تومان',
  rial: 'ریال'
};

/**
 * Converts an integer or numeric string into fluent Persian words.
 *
 * Examples:
 *   numberToPersianWords(0) => 'صفر'
 *   numberToPersianWords(15000000, 'toman') => 'پانزده میلیون تومان'
 *   numberToPersianWords(12500, 'rial') => 'دوازده هزار و پانصد ریال'
 *   numberToPersianWords(-50000, 'toman') => 'منفی پنجاه هزار تومان'
 */
export function numberToPersianWords(
  amount: number | string | null | undefined,
  unit?: CurrencyUnit
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }

  const rawClean = typeof amount === 'number'
    ? Math.trunc(amount).toString()
    : normalizeDigits(amount.toString()).replace(/,/g, '').trim();

  if (!rawClean || !/^-?\d+$/.test(rawClean)) {
    return '';
  }

  const isNegative = rawClean.startsWith('-');
  const unsignedDigits = isNegative ? rawClean.slice(1) : rawClean;

  // Zero check
  if (/^0+$/.test(unsignedDigits)) {
    const zeroStr = 'صفر';
    return unit ? `${zeroStr} ${CURRENCY_UNIT_LABELS[unit]}` : zeroStr;
  }

  // Strip leading zeroes for processing
  const trimmed = unsignedDigits.replace(/^0+/, '');
  if (!trimmed) {
    const zeroStr = 'صفر';
    return unit ? `${zeroStr} ${CURRENCY_UNIT_LABELS[unit]}` : zeroStr;
  }

  // Split digits into 3-digit chunks from right to left
  const chunks: number[] = [];
  let remaining = trimmed;
  while (remaining.length > 0) {
    const sliceLen = remaining.length % 3 === 0 ? 3 : remaining.length % 3;
    const chunk = Number(remaining.slice(0, sliceLen));
    chunks.push(chunk);
    remaining = remaining.slice(sliceLen);
  }

  const numChunks = chunks.length;
  if (numChunks > SCALES.length) {
    return 'عدد خارج از محدوده مجاز';
  }

  const parts: string[] = [];
  chunks.forEach((chunk, idx) => {
    if (chunk === 0) return;
    const words = threeDigitsToWords(chunk);
    const scale = SCALES[numChunks - 1 - idx];
    if (scale) {
      parts.push(`${words} ${scale}`);
    } else {
      parts.push(words);
    }
  });

  const wordsResult = parts.join(' و ');
  const prefix = isNegative ? 'منفی ' : '';
  const result = `${prefix}${wordsResult}`.trim();

  return unit ? `${result} ${CURRENCY_UNIT_LABELS[unit]}` : result;
}

/**
 * Formats a number with thousands separators (commas) and Persian digits.
 *
 * Example:
 *   formatCurrency(15000000) => '۱۵,۰۰۰,۰۰۰'
 *   formatCurrency('15000000', 'toman') => '۱۵,۰۰۰,۰۰۰ تومان'
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  unit?: CurrencyUnit
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }

  const rawClean = typeof amount === 'number'
    ? Math.trunc(amount).toString()
    : normalizeDigits(amount.toString()).replace(/,/g, '').trim();

  if (!rawClean || !/^-?\d+$/.test(rawClean)) {
    return '';
  }

  const isNegative = rawClean.startsWith('-');
  const digits = isNegative ? rawClean.slice(1) : rawClean;

  // Insert commas every 3 digits from the right
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedPersian = toPersianDigits(isNegative ? `-${withCommas}` : withCommas);

  return unit ? `${formattedPersian} ${CURRENCY_UNIT_LABELS[unit]}` : formattedPersian;
}

/**
 * Strips all non-digit and non-minus characters from a currency string,
 * normalizing Persian and Arabic digits to ASCII.
 */
export function cleanCurrencyInput(input: string): string {
  const normalized = normalizeDigits(input);
  const isNegative = normalized.startsWith('-');
  const digitsOnly = normalized.replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';
  return isNegative ? `-${digitsOnly}` : digitsOnly;
}

