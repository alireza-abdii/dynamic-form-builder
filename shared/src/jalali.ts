import jalaali from 'jalaali-js';
import { normalizeDigits, toPersianDigits } from './validators/digits.js';

export interface JalaliDateObject {
  jy: number;
  jm: number;
  jd: number;
}

export function parseJalaliString(str: string): JalaliDateObject | null {
  const normalized = normalizeDigits(str);
  const match = normalized.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return null;

  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);

  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) return null;
  return { jy, jm, jd };
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const g = jalaali.toGregorian(jy, jm, jd);
  const mm = String(g.gm).padStart(2, '0');
  const dd = String(g.gd).padStart(2, '0');
  return `${g.gy}-${mm}-${dd}`;
}

export function isoToJalali(isoString: string): JalaliDateObject | null {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { jy: j.jy, jm: j.jm, jd: j.jd };
}

export function formatJalaliString(jy: number, jm: number, jd: number, persianDigits = false): string {
  const mm = String(jm).padStart(2, '0');
  const dd = String(jd).padStart(2, '0');
  const res = `${jy}/${mm}/${dd}`;
  return persianDigits ? toPersianDigits(res) : res;
}

export function getTodayJalali(): JalaliDateObject {
  const now = new Date();
  const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { jy: j.jy, jm: j.jm, jd: j.jd };
}

