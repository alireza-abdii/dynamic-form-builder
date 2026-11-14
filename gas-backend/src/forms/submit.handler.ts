/**
 * Form submission processor with validation, deduplication, locking, and admin notification.
 */
import type { SubmitRequest, ApiResponse } from '@fb/shared';
import {
  buildZodSchema,
  fa,
  formatJalaliString,
  getTodayJalali,
  toPersianDigits,
  formatCurrency
} from '@fb/shared';
import { getScriptConfig } from '../config';
import { withScriptLock } from '../utils/lock';
import { isDuplicateSubmission, markSubmissionProcessed } from '../utils/dedupe';
import { verifyTelegramInitData, type VerifiedTelegramUser } from './telegram-auth';
import { openSpreadsheet, getOrCreateTab, appendSubmissionRow, checkDuplicateValue } from '../sheets/repository';
import { sendTelegramMessage, escapeHtml } from '../telegram/api';
import { buildNotificationKeyboard } from '../telegram/keyboards';
import { resolveForm } from './form-resolver';
import { getFieldOptions } from './options.handler';

export function handleFormSubmission(req: SubmitRequest): ApiResponse {
  const cfg = getScriptConfig();

  // 1. Check if form is registered (static or dynamic)
  const resolved = resolveForm(req.formId);
  if (!resolved) {
    return {
      ok: false,
      code: 'UNKNOWN_FORM',
      message: fa.unknownForm
    };
  }
  const form = resolved.form;

  // 2. Check form status
  if (form.status === 'closed') {
    return {
      ok: false,
      code: 'FORM_CLOSED',
      message: fa.formClosed
    };
  }

  // 3. Check closing date bound
  const today = getTodayJalali();
  const todayJalaliStr = formatJalaliString(today.jy, today.jm, today.jd);

  if (form.closesAt && todayJalaliStr > form.closesAt) {
    return {
      ok: false,
      code: 'FORM_CLOSED',
      message: fa.formClosed
    };
  }

  // 4. Access check (Telegram WebApp validation if required)
  let verifiedUser: VerifiedTelegramUser | undefined = undefined;
  if (req.meta.source === 'telegram' && req.meta.initData) {
    const authResult = verifyTelegramInitData(req.meta.initData, cfg.botToken);
    if (authResult.ok && authResult.user) {
      verifiedUser = authResult.user;
    }
  }

  if (form.access === 'telegram' && !verifiedUser) {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'دسترسی به این فرم فقط از طریق مینی‌اپ تلگرام امکان‌پذیر است.'
    };
  }

  // 5. Anti-bot checks: honeypot & fill-time speed check
  if (req.meta.hp) {
    console.warn(`[submit] Honeypot triggered for form ${form.id}`);
    return {
      ok: false,
      code: 'RATE_LIMIT',
      message: 'درخواست شما معتبر شناخته نشد.'
    };
  }

  const fillTimeMs = Date.now() - (req.meta.startedAt || 0);
  if (fillTimeMs < 1500) {
    return {
      ok: false,
      code: 'RATE_LIMIT',
      message: 'لطفاً فرم را با دقت پر کنید.'
    };
  }

  // 6. Server-side validation via dynamic Zod schema
  const schema = buildZodSchema(form);
  const parsed = schema.safeParse(req.values);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    const formatted = parsed.error.format() as Record<string, { _errors: string[] }>;

    for (const [key, val] of Object.entries(formatted)) {
      if (key !== '_errors' && val?._errors?.length) {
        fieldErrors[key] = val._errors[0] || 'ورودی نامعتبر';
      }
    }

    return {
      ok: false,
      code: 'VALIDATION',
      message: 'برخی اطلاعات وارد شده معتبر نیستند. لطفاً خطاهای مشخص‌شده را اصلاح کنید.',
      fieldErrors
    };
  }

  // 6.1. Server-side validation for reference fields against source data
  for (const field of form.fields) {
    if (field.type === 'reference') {
      const val = req.values[field.key];
      if (val !== undefined && val !== null && val !== '') {
        const availableOptions = getFieldOptions(field.source.formId, field.source.fieldKey);
        const validValues = availableOptions.map((o) => o.value);
        if (validValues.length > 0) {
          if (Array.isArray(val)) {
            const allExist = val.every((v) => validValues.includes(String(v)));
            if (!allExist) {
              return {
                ok: false,
                code: 'VALIDATION',
                message: fa.referenceNotFound(field.label)
              };
            }
          } else {
            const exists = validValues.includes(String(val));
            if (!exists) {
              return {
                ok: false,
                code: 'VALIDATION',
                message: fa.referenceNotFound(field.label)
              };
            }
          }
        }
      }
    }
  }

  // 7. Deduplication check
  if (isDuplicateSubmission(req.submissionId)) {
    return {
      ok: true,
      submissionId: req.submissionId,
      duplicate: true
    };
  }

  // 8. Thread-safe write to Google Sheets with Unique field validation
  const isoDateStr = new Date().toISOString();

  const writeResult = withScriptLock<ApiResponse | null>(() => {
    const ss = openSpreadsheet(cfg.spreadsheetId);
    const sheet = getOrCreateTab(ss, form);

    // 8.1. Unique field check against existing rows in sheet
    for (const field of form.fields) {
      if (field.unique) {
        const val = req.values[field.key];
        if (val !== undefined && val !== null && val !== '') {
          const isDup = checkDuplicateValue(sheet, field.label, val as string | number);
          if (isDup) {
            const displayVal = String(val);
            const errorMsg = fa.duplicateField(field.label, displayVal);
            return {
              ok: false,
              code: 'VALIDATION',
              message: errorMsg,
              fieldErrors: {
                [field.key]: errorMsg
              }
            };
          }
        }
      }
    }

    appendSubmissionRow(sheet, form, req, {
      submissionId: req.submissionId,
      jalaliDate: todayJalaliStr,
      isoDate: isoDateStr,
      source: req.meta.source,
      tgUserId: verifiedUser?.id,
      tgUsername: verifiedUser?.username
    });

    markSubmissionProcessed(req.submissionId);
    return null;
  }, 20000);

  if (writeResult && !writeResult.ok) {
    return writeResult;
  }

  // 9. Dispatch Admin Notifications (non-blocking, errors ignored)
  if (form.notifyAdmins && cfg.adminChatIds.length > 0 && cfg.botToken) {
    try {
      let previewText = '';
      const topFields = form.fields.slice(0, 3);
      for (const f of topFields) {
        const val = req.values[f.key];
        if (val !== undefined && val !== '') {
          const displayVal = (f.type === 'number' && f.currency && (typeof val === 'number' || typeof val === 'string'))
            ? formatCurrency(val, f.currency)
            : String(val);
          previewText += `• <b>${escapeHtml(f.label)}:</b> ${escapeHtml(displayVal)}\n`;
        }
      }

      const alertMessage = `🔔 <b>ثبت پاسخ جدید در سامانه</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📋 <b>فرم:</b> «${escapeHtml(form.title)}»\n` +
        `📅 <b>زمان ثبت:</b> ${toPersianDigits(todayJalaliStr)}\n` +
        `🌐 <b>بستر ثبت:</b> ${req.meta.source === 'telegram' ? '📱 مینی‌اپ تلگرام' : '💻 وب‌سایت'}\n` +
        (verifiedUser ? `👤 <b>کاربر تلگرام:</b> ${escapeHtml(verifiedUser.first_name)} (@${verifiedUser.username || '-'})\n` : '') +
        (previewText ? `──────────────────\n📝 <b>خلاصه اطلاعات ورودی:</b>\n${previewText}` : '');

      const keyboard = buildNotificationKeyboard(form.id, cfg.publicBaseUrl);

      for (const adminId of cfg.adminChatIds) {
        sendTelegramMessage(cfg.botToken, adminId, alertMessage, { replyMarkup: keyboard });
      }
    } catch (notifyErr) {
      console.warn('[submit] Admin notification warning:', notifyErr);
    }
  }

  return {
    ok: true,
    submissionId: req.submissionId
  };
}

