/**
 * Main Web App Request Router for Google Apps Script.
 */
import { AVAILABLE_FORM_IDS } from '@fb/shared';
import { getScriptConfig, setupCheck } from './config';
import { jsonOut, tgAck, safeJson } from './http';
import { isDuplicateTelegramUpdate } from './utils/dedupe';
import { handleTelegramUpdate, type TelegramUpdate } from './telegram/update.handler';
import { handleFormSubmission } from './forms/submit.handler';
import type { SubmitRequest } from '@fb/shared';

export function handleDoGet(
  e?: GoogleAppsScript.Events.DoGet
): GoogleAppsScript.Content.TextOutput {
  const action = e?.parameter?.action;

  if (action === 'health') {
    return jsonOut({
      ok: true,
      service: 'Form Builder Serverless GAS Backend',
      version: 1,
      availableForms: AVAILABLE_FORM_IDS,
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'check') {
    return setupCheck();
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

  // 3. Client Dynamic Form Submission
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

