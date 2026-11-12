import { normalizeDigits } from './digits.js';

/**
 * Strip spaces and dashes, normalize Persian and Arabic digits to ASCII, and uppercase.
 */
export function cleanBankInput(v: string): string {
  if (!v) return '';
  return normalizeDigits(v).replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Validates an Iranian SHEBA (IBAN format: IR + 24 digits) using ISO 13616 MOD-97-10 checksum.
 * If user omits 'IR', it is automatically prefixed for checking.
 */
export function isValidSheba(raw: string): boolean {
  const v = cleanBankInput(raw);
  const sheba = v.startsWith('IR') ? v : `IR${v}`;

  // Must be IR followed by exactly 24 digits
  if (!/^IR\d{24}$/.test(sheba)) {
    return false;
  }

  // Move first 4 characters (IR + 2 check digits) to the end
  // Replace 'I' with '18' and 'R' with '27'
  const checkDigits = sheba.slice(2, 4);
  const body = sheba.slice(4);
  const numericString = body + '1827' + checkDigits;

  // Compute modulo 97 on the large number using chunked remainder
  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + Number(numericString[i])) % 97;
  }

  return remainder === 1;
}

/**
 * Validates an Iranian 16-digit debit/credit card number using the Luhn algorithm.
 */
export function isValidBankCard(raw: string): boolean {
  const v = cleanBankInput(raw);

  if (!/^\d{16}$/.test(v)) {
    return false;
  }

  // Luhn algorithm (digits at even indexes, 0-based, are multiplied by 2)
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let digit = Number(v[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * 6-digit Bank Identification Numbers (BINs) for Iranian banks.
 */
const CARD_BINS: Record<string, string> = {
  '603799': 'بانک ملی',
  '589210': 'بانک سپه',
  '627648': 'بانک توسعه صادرات',
  '627961': 'بانک صنعت و معدن',
  '603770': 'بانک کشاورزی',
  '628023': 'بانک مسکن',
  '627760': 'پست بانک ایران',
  '621986': 'بانک سامان',
  '502229': 'بانک پاسارگاد',
  '627412': 'بانک اقتصاد نوین',
  '627488': 'بانک کارآفرین',
  '610433': 'بانک ملت',
  '627353': 'بانک تجارت',
  '603769': 'بانک صادرات',
  '639607': 'بانک سرمایه',
  '636214': 'بانک آینده',
  '502806': 'بانک شهر',
  '502908': 'بانک توسعه تعاون',
  '505785': 'بانک ایران زمین',
  '639346': 'بانک سینا',
  '639599': 'بانک قوامین',
  '628157': 'موسسه اعتباری توسعه',
  '505416': 'بانک گردشگری',
  '504172': 'بانک رسالت',
  '606373': 'بانک مهر ایران',
  '606256': 'موسسه اعتباری ملل',
  '622106': 'بانک پارسیان',
  '589463': 'بانک رفاه کارگران',
  '505801': 'موسسه اعتباری کوثر',
  '636795': 'بانک مرکزی'
};

/**
 * 3-digit bank codes embedded in Iranian SHEBA (digits 3 to 5 of the 24-digit body).
 */
const SHEBA_BANK_CODES: Record<string, string> = {
  '010': 'بانک مرکزی',
  '011': 'بانک صنعت و معدن',
  '012': 'بانک ملت',
  '013': 'بانک رفاه کارگران',
  '014': 'بانک مسکن',
  '015': 'بانک سپه',
  '016': 'بانک کشاورزی',
  '017': 'بانک ملی',
  '018': 'بانک تجارت',
  '019': 'بانک صادرات',
  '020': 'بانک توسعه صادرات',
  '021': 'پست بانک ایران',
  '022': 'بانک توسعه تعاون',
  '051': 'موسسه اعتباری توسعه',
  '053': 'بانک کارآفرین',
  '054': 'بانک پارسیان',
  '055': 'بانک اقتصاد نوین',
  '056': 'بانک سامان',
  '057': 'بانک پاسارگاد',
  '058': 'بانک سرمایه',
  '059': 'بانک سینا',
  '060': 'بانک مهر ایران',
  '061': 'بانک شهر',
  '062': 'بانک آینده',
  '064': 'بانک گردشگری',
  '066': 'بانک دی',
  '069': 'بانک ایران زمین',
  '070': 'بانک رسالت',
  '075': 'موسسه اعتباری ملل'
};

/**
 * Detect the issuing bank name based on card BIN or SHEBA code.
 */
export function detectBankName(raw: string, kind: 'card' | 'sheba'): string | undefined {
  const v = cleanBankInput(raw);
  if (!v) return undefined;

  if (kind === 'card') {
    if (v.length < 6) return undefined;
    const bin = v.slice(0, 6);
    return CARD_BINS[bin];
  }

  // SHEBA format: IR + 2 check digits + 3 digits bank code + ...
  const digits = v.startsWith('IR') ? v.slice(2) : v;
  if (digits.length < 5) return undefined;
  const bankCode = digits.slice(2, 5);
  return SHEBA_BANK_CODES[bankCode];
}
