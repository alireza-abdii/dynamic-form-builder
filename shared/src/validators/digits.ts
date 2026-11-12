const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function normalizeDigits(input: unknown): string {
  if (typeof input !== 'string') {
    if (typeof input === 'number') return String(input);
    return '';
  }
  let str = input.trim();
  for (let i = 0; i < 10; i++) {
    const fa = faDigits[i];
    const ar = arDigits[i];
    if (fa) str = str.replaceAll(fa, String(i));
    if (ar) str = str.replaceAll(ar, String(i));
  }
  // Replace Persian decimal separator (٫) with standard dot (.)
  str = str.replaceAll('٫', '.');
  return str;
}

export function toPersianDigits(input: string | number): string {
  const str = String(input);
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char && char >= '0' && char <= '9') {
      res += faDigits[Number(char)];
    } else {
      res += char ?? '';
    }
  }
  return res;
}

