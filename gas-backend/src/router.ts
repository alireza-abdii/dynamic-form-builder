/**
 * Main Web App Request Router for Google Apps Script.
 */
import { AVAILABLE_FORM_IDS } from '@fb/shared';
import { getScriptConfig, setupCheck } from './config';
import { jsonOut, tgAck, safeJson } from './http';
import { isDuplicateTelegramUpdate } from './utils/dedupe';
import { handleTelegramUpdate, type TelegramUpdate } from './telegram/update.handler';
import { handleFormSubmission } from './forms/submit.handler';
import { resolveForm, listAllForms } from './forms/form-resolver';
import { getFieldOptions } from './forms/options.handler';
import { saveDynamicForm, deleteDynamicForm } from './forms/dynamic-forms';
import { verifyAdminCredentials, createSessionToken, verifySessionToken } from './auth/session';
import { openSpreadsheet } from './sheets/repository';
import type { SubmitRequest, FormDefinition } from '@fb/shared';

export function handleDoGet(
  e?: GoogleAppsScript.Events.DoGet
): GoogleAppsScript.Content.TextOutput {
  const action = e?.parameter?.action;

  if (action === 'health') {
    return jsonOut({
      ok: true,
      service: 'Form Builder Serverless GAS Backend',
      version: 2,
      availableForms: AVAILABLE_FORM_IDS,
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'check') {
    return setupCheck();
  }

  if (action === 'list_forms') {
    const forms = listAllForms();
    return jsonOut({ ok: true, forms });
  }

  if (action === 'get_form') {
    const formId = e?.parameter?.formId;
    if (!formId) {
      return jsonOut({ ok: false, code: 'VALIDATION', message: 'شناسه فرم مشخص نشده است.' });
    }
    const resolved = resolveForm(formId);
    if (!resolved) {
      return jsonOut({ ok: false, code: 'UNKNOWN_FORM', message: 'فرم مورد نظر یافت نشد.' });
    }
    return jsonOut({ ok: true, form: resolved.form, isDynamic: resolved.isDynamic });
  }

  if (action === 'get_options') {
    const formId = e?.parameter?.formId;
    const fieldKey = e?.parameter?.fieldKey;
    if (!formId || !fieldKey) {
      return jsonOut({ ok: false, code: 'VALIDATION', message: 'پارامترهای formId و fieldKey الزامی هستند.' });
    }
    const options = getFieldOptions(formId, fieldKey);
    return jsonOut({ ok: true, options });
  }

  return jsonOut({
    ok: true,
    message: 'Google Apps Script Form Builder Backend is active.'
  });
}

export function handleDoPost(
  e?: GoogleAppsScript.Events.DoPost
): GoogleAppsScript.Content.TextOutput | GoogleAppsScript.HTML.HtmlOutput {
  const cfg = getScriptConfig();
  const rawContents = e?.postData?.contents;
  const body = safeJson(rawContents);

  // 1. Telegram Bot Webhook Request (?tg=<secret>)
  if (e?.parameter?.tg !== undefined) {
    if (cfg.webhookSecret && e.parameter.tg !== cfg.webhookSecret) {
      console.warn('[router] Telegram webhook secret mismatch.');
      return tgAck(); // Silently return 200
    }

    if (body && typeof body === 'object' && 'update_id' in body) {
      const update = body as TelegramUpdate;
      if (!isDuplicateTelegramUpdate(update.update_id)) {
        try {
          handleTelegramUpdate(update);
        } catch (err) {
          console.error('[router] Error processing Telegram update:', err);
        }
      }
    }

    // Always respond with HTTP 200 (HtmlService) so Telegram never triggers 302 retries
    return tgAck();
  }

  // 2. Admin Script Properties Synchronization (?action=sync_properties)
  if (body && typeof body === 'object' && (body as Record<string, unknown>).action === 'sync_properties') {
    const payload = body as { action: string; secret: string; properties: Record<string, string> };
    const currentSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');

    // Allow sync if no secret is set yet, or provided secret matches current secret
    if (!currentSecret || currentSecret === payload.secret) {
      if (payload.properties && typeof payload.properties === 'object') {
        PropertiesService.getScriptProperties().setProperties(payload.properties);
        console.log('[router] Script properties synchronized successfully.');
        return jsonOut({ ok: true, message: 'Script properties synchronized successfully.' });
      }
      return jsonOut({ ok: false, code: 'INVALID_PAYLOAD', message: 'Missing properties object.' });
    }

    console.warn('[router] Unauthorized sync_properties attempt.');
    return jsonOut({ ok: false, code: 'UNAUTHORIZED', message: 'Unauthorized secret mismatch.' });
  }

  // 3. Admin Authentication Login (action === 'login')
  if (body && typeof body === 'object' && (body as Record<string, unknown>).action === 'login') {
    const payload = body as { username?: string; password?: string };
    if (!payload.username || !payload.password) {
      return jsonOut({ ok: false, code: 'VALIDATION', message: 'نام کاربری و رمز عبور الزامی است.' });
    }

    const isValid = verifyAdminCredentials(payload.username, payload.password);
    if (!isValid) {
      return jsonOut({ ok: false, code: 'UNAUTHORIZED', message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    const session = createSessionToken(payload.username);
    return jsonOut({ ok: true, token: session.token, expiresAt: session.expiresAt });
  }

  // 4. List Forms (action === 'list_forms')
  if (body && typeof body === 'object' && (body as Record<string, unknown>).action === 'list_forms') {
    const forms = listAllForms();
    return jsonOut({ ok: true, forms });
  }

  // 5. Get Form Definition (action === 'get_form')
  if (body && typeof body === 'object' && (body as Record<string, unknown>).action === 'get_form') {
    const payload = body as { formId?: string };
    if (!payload.formId) {
      return jsonOut({ ok: false, code: 'VALIDATION', message: 'شناسه فرم مشخص نشده است.' });
    }
    const resolved = resolveForm(payload.formId);
    if (!resolved) {
      return jsonOut({ ok: false, code: 'UNKNOWN_FORM', message: 'فرم مورد نظر یافت نشد.' });
    }
    return jsonOut({ ok: true, form: resolved.form, isDynamic: resolved.isDynamic });
  }

  // 6. Get Options for Reference Field (action === 'get_options')
  if (body && typeof body === 'object' && (body as Record<string, unknown>).action === 'get_options') {
    const payload = body as { formId?: string; fieldKey?: string };
    if (!payload.formId || !payload.fieldKey) {
      return jsonOut({ ok: false, code: 'VALIDATION', message: 'پارامترهای formId و fieldKey الزامی هستند.' });
    }
    const options = getFieldOptions(payload.formId, payload.fieldKey);
    return jsonOut({ ok: true, options });
  }

  // 7. Save Dynamic Form (action === 'save_form' - Requires Admin Session)
  if (body && typeof body === 'object' && (body as Record<string, unknown>).action === 'save_form') {
    const payload = body as { token?: string; form?: FormDefinition };
    if (!verifySessionToken(payload.token)) {
      return jsonOut({ ok: false, code: 'UNAUTHORIZED', message: 'دسترسی غیرمجاز. نشست کاربری شما منقضی شده است.' });
    }
    if (!payload.form) {
      return jsonOut({ ok: false, code: 'VALIDATION', message: 'تعریف فرم ارسال نشده است.' });
    }

    try {
      const ss = openSpreadsheet(cfg.spreadsheetId);
      const saveResult = saveDynamicForm(ss, payload.form);
      if (!saveResult.ok) {
        return jsonOut({ ok: false, code: 'VALIDATION', message: saveResult.message || 'خطا در ذخیره فرم.' });
      }
      return jsonOut({ ok: true, formId: payload.form.id, version: saveResult.version });
    } catch (err: unknown) {
      console.error('[router] Error saving dynamic form:', err);
      return jsonOut({ ok: false, code: 'SERVER', message: err instanceof Error ? err.message : 'خطای سرور' });
    }
  }

  // 8. Delete Dynamic Form (action === 'delete_form' - Requires Admin Session)
  if (body && typeof body === 'object' && (body as Record<string, unknown>).action === 'delete_form') {
    const payload = body as { token?: string; formId?: string };
    if (!verifySessionToken(payload.token)) {
      return jsonOut({ ok: false, code: 'UNAUTHORIZED', message: 'دسترسی غیرمجاز. نشست کاربری شما منقضی شده است.' });
    }
    if (!payload.formId) {
      return jsonOut({ ok: false, code: 'VALIDATION', message: 'شناسه فرم مشخص نشده است.' });
    }

    try {
      const ss = openSpreadsheet(cfg.spreadsheetId);
      const deleted = deleteDynamicForm(ss, payload.formId);
      if (!deleted) {
        return jsonOut({ ok: false, code: 'VALIDATION', message: 'فرم پویا با این شناسه یافت نشد یا فرم غیرقابل حذف است.' });
      }
      return jsonOut({ ok: true, formId: payload.formId });
    } catch (err: unknown) {
      console.error('[router] Error deleting dynamic form:', err);
      return jsonOut({ ok: false, code: 'SERVER', message: err instanceof Error ? err.message : 'خطای سرور' });
    }
  }

  // 9. Client Dynamic Form Submission
  if (body && typeof body === 'object' && (body as Record<string, unknown>).action === 'submit') {
    try {
      const result = handleFormSubmission(body as SubmitRequest);
      return jsonOut(result);
    } catch (err: unknown) {
      console.error('[router] Unhandled submission exception:', err);
      const msg = err instanceof Error ? err.message : 'خطای داخلی سرور';
      return jsonOut({
        ok: false,
        code: 'SERVER',
        message: msg
      });
    }
  }

  return jsonOut({
    ok: false,
    code: 'SERVER',
    message: 'درخواست ارسالی نامعتبر است.'
  });
}

