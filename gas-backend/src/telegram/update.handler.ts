/**
 * Telegram Update Dispatcher and Command Handlers.
 */
import { formatJalaliString, getTodayJalali, toPersianDigits } from '@fb/shared';
import { getScriptConfig } from '../config';
import {
  sendTelegramMessage,
  sendTelegramDocument,
  sendTelegramChatAction,
  answerTelegramCallbackQuery,
  escapeHtml
} from './api';
import { isTelegramAdmin } from './auth';
import { buildFormsListKeyboard } from './keyboards';
import { openSpreadsheet, getTabStats } from '../sheets/repository';
import { exportTabToXlsxBlob } from '../export/xlsx-exporter';
import { resolveForm, listAllForms } from '../forms/form-resolver';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      username?: string;
      first_name: string;
      last_name?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      username?: string;
      first_name: string;
    };
    message?: {
      chat: {
        id: number;
      };
      message_id: number;
    };
    data?: string;
  };
}

export function handleTelegramUpdate(update: TelegramUpdate): void {
  const cfg = getScriptConfig();
  if (!cfg.botToken) {
    console.error('[telegram] Bot token is missing in Script Properties.');
    return;
  }

  // 1. Handle Callback Queries (Inline Button Clicks)
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat.id || cq.from.id;
    const data = cq.data || '';

    // Check authorization
    if (!isTelegramAdmin(cq.from.id)) {
      answerTelegramCallbackQuery(cfg.botToken, cq.id, 'شما دسترسی مجاز برای دریافت گزارش ندارید.', true);
      return;
    }

    if (data.startsWith('x:')) {
      const formId = data.slice(2);
      answerTelegramCallbackQuery(cfg.botToken, cq.id, 'در حال آماده‌سازی و ساخت فایل اکسل...');
      sendTelegramChatAction(cfg.botToken, chatId, 'upload_document');

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const blob = exportTabToXlsxBlob(ss, formId);
        const resolved = resolveForm(formId);
        const title = resolved ? resolved.form.title : formId;
        const caption = `📊 <b>خروجی اکسل فرم:</b> ${escapeHtml(title)}\n📅 <b>تاریخ صدور:</b> ${toPersianDigits(formatJalaliString(getTodayJalali().jy, getTodayJalali().jm, getTodayJalali().jd))}`;

        sendTelegramDocument(cfg.botToken, chatId, blob, caption);
      } catch (err: unknown) {
        console.error('[telegram] Export callback failed:', err);
        const msg = err instanceof Error ? err.message : String(err);
        sendTelegramMessage(cfg.botToken, chatId, `❌ خطا در تهیه خروجی اکسل:\n${escapeHtml(msg)}`);
      }
      return;
    }

    if (data.startsWith('s:')) {
      const formId = data.slice(2);
      answerTelegramCallbackQuery(cfg.botToken, cq.id);

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const today = getTodayJalali();
        const todayStr = formatJalaliString(today.jy, today.jm, today.jd);
        const stats = getTabStats(ss, formId, todayStr);
        const resolved = resolveForm(formId);

        const text = `📊 <b>آمار ثبت پاسخ‌های فرم «${escapeHtml(resolved?.form.title || formId)}»</b>\n\n` +
          `• <b>کل پاسخ‌های ثبت‌شده:</b> ${toPersianDigits(stats.totalSubmissions)} مورد\n` +
          `• <b>ثبت‌شده‌های امروز:</b> ${toPersianDigits(stats.todaySubmissions)} مورد\n` +
          (stats.lastSubmissionDate ? `• <b>آخرین ثبت:</b> ${toPersianDigits(stats.lastSubmissionDate)}\n` : '');

        sendTelegramMessage(cfg.botToken, chatId, text);
      } catch (err: unknown) {
        console.error('[telegram] Stats callback failed:', err);
      }
      return;
    }

    answerTelegramCallbackQuery(cfg.botToken, cq.id);
    return;
  }

  // 2. Handle Text Messages
  if (update.message?.text) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const cleanText = (msg.text || '').trim();
    const [rawCmd, ...restArgs] = cleanText.split(/\s+/);
    const command = (rawCmd || '').split('@')[0]?.toLowerCase();
    const argStr = restArgs.join(' ').trim();

    // Command: /whoami
    if (command === '/whoami') {
      const isAdmin = isTelegramAdmin(msg.from?.id || chatId);
      const reply = `👤 <b>اطلاعات کاربر شما:</b>\n\n` +
        `• <b>شناسه چت (Chat ID):</b> <code>${chatId}</code>\n` +
        `• <b>نام کاربری:</b> ${msg.from?.username ? `@${msg.from.username}` : 'ندارد'}\n` +
        `• <b>دسترسی مدیریت:</b> ${isAdmin ? '✅ مجاز (ادمین)' : '❌ کاربر عادی'}\n\n` +
        `<i>(برای اعطای دسترسی ادمین، شناسه چت بالا را به ADMIN_CHAT_IDS اضافه کنید.)</i>`;
      sendTelegramMessage(cfg.botToken, chatId, reply);
      return;
    }

    // Command: /help
    if (command === '/help') {
      const reply = `📚 <b>راهنمای دستورات ربات فرم‌ساز سازمانی:</b>\n\n` +
        `• /forms - مشاهده لیست فرم‌های فعال و گزینه‌های مدیریت\n` +
        `• /export [شناسه_فرم] - دریافت مستقیم فایل اکسل (.xlsx)\n` +
        `• /stats [شناسه_فرم] - مشاهده آمار و تعداد ثبت‌های فرم\n` +
        `• /whoami - مشاهده شناسه کاربری و وضعیت دسترسی شما\n` +
        `• /help - نمایش این پیام راهنما`;
      sendTelegramMessage(cfg.botToken, chatId, reply);
      return;
    }

    // Command: /start [param]
    if (command === '/start') {
      const startParam = argStr;

      if (startParam) {
        const resolved = resolveForm(startParam);
        if (resolved) {
          const form = resolved.form;
          const formUrl = cfg.publicBaseUrl ? `${cfg.publicBaseUrl}/f/${form.id}` : undefined;
          const reply = `سلام ${escapeHtml(msg.from?.first_name || '')} عزیز 🌱\n\n` +
            `برای تکمیل فرم <b>«${escapeHtml(form.title)}»</b> روی دکمه زیر کلیک کنید:`;

          const keyboard = formUrl
            ? {
                inline_keyboard: [
                  [
                    {
                      text: `📝 تکمیل ${form.title}`,
                      web_app: { url: formUrl }
                    }
                  ]
                ]
              }
            : undefined;

          sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: keyboard });
          return;
        }
      }

      // Default welcome
      const forms = listAllForms();
      const reply = `سلام ${escapeHtml(msg.from?.first_name || '')} عزیز، به سامانه فرم‌های سازمانی خوش آمدید 🌱\n\n` +
        `جهت مشاهده لیست فرم‌ها یا دریافت خروجی اکسل، از دستورات زیر یا دکمه‌های منو استفاده کنید:`;

      const keyboard = buildFormsListKeyboard(forms, cfg.publicBaseUrl);
      sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: keyboard });
      return;
    }

    // Command: /forms
    if (command === '/forms') {
      const forms = listAllForms();
      if (forms.length === 0) {
        sendTelegramMessage(cfg.botToken, chatId, 'در حال حاضر هیچ فرمی در سامانه فعال نیست.');
        return;
      }
      const reply = `📋 <b>لیست فرم‌های سازمانی فعال:</b>\nبرای هر فرم می‌توانید گزارش اکسل دریافت کرده یا آن را باز کنید:`;
      const keyboard = buildFormsListKeyboard(forms, cfg.publicBaseUrl);
      sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: keyboard });
      return;
    }

    // Command: /export [formId]
    if (command === '/export') {
      if (!isTelegramAdmin(msg.from?.id || chatId)) {
        sendTelegramMessage(cfg.botToken, chatId, '⛔ شما دسترسی مجاز برای دریافت گزارش اکسل ندارید.');
        return;
      }

      const formId = argStr;

      if (!formId) {
        // Show forms list to choose
        const forms = listAllForms();
        const reply = `لطفاً شناسه فرم را مشخص کنید، یا از لیست زیر دکمه خروجی اکسل را انتخاب کنید:`;
        const keyboard = buildFormsListKeyboard(forms, cfg.publicBaseUrl);
        sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: keyboard });
        return;
      }

      const resolved = resolveForm(formId);
      if (!resolved) {
        sendTelegramMessage(cfg.botToken, chatId, `❌ فرمی با شناسه «${escapeHtml(formId)}» یافت نشد.`);
        return;
      }

      sendTelegramChatAction(cfg.botToken, chatId, 'upload_document');

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const blob = exportTabToXlsxBlob(ss, formId);
        const title = resolved.form.title;
        const caption = `📊 <b>خروجی اکسل فرم:</b> ${escapeHtml(title)}\n📅 <b>تاریخ صدور:</b> ${toPersianDigits(formatJalaliString(getTodayJalali().jy, getTodayJalali().jm, getTodayJalali().jd))}`;

        sendTelegramDocument(cfg.botToken, chatId, blob, caption);
      } catch (err: unknown) {
        console.error('[telegram] Export command failed:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        sendTelegramMessage(cfg.botToken, chatId, `❌ خطا در تهیه خروجی اکسل:\n${escapeHtml(errorMsg)}`);
      }
      return;
    }

    // Command: /stats [formId]
    if (command === '/stats') {
      if (!isTelegramAdmin(msg.from?.id || chatId)) {
        sendTelegramMessage(cfg.botToken, chatId, '⛔ شما دسترسی مجاز برای مشاهده آمار را ندارید.');
        return;
      }

      const formId = argStr;
      const resolved = formId ? resolveForm(formId) : null;

      if (!formId || !resolved) {
        sendTelegramMessage(cfg.botToken, chatId, 'لطفاً شناسه معتبر فرم را وارد کنید. مثال:\n<code>/stats employee-contact-info</code>');
        return;
      }

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const today = getTodayJalali();
        const todayStr = formatJalaliString(today.jy, today.jm, today.jd);
        const stats = getTabStats(ss, formId, todayStr);
        const title = resolved.form.title;

        const reply = `📊 <b>آمار ثبت پاسخ‌های فرم «${escapeHtml(title)}»</b>\n\n` +
          `• <b>کل پاسخ‌های ثبت‌شده:</b> ${toPersianDigits(stats.totalSubmissions)} مورد\n` +
          `• <b>ثبت‌شده‌های امروز:</b> ${toPersianDigits(stats.todaySubmissions)} مورد\n` +
          (stats.lastSubmissionDate ? `• <b>آخرین ثبت:</b> ${toPersianDigits(stats.lastSubmissionDate)}\n` : '');

        sendTelegramMessage(cfg.botToken, chatId, reply);
      } catch (err: unknown) {
        console.error('[telegram] Stats command failed:', err);
        sendTelegramMessage(cfg.botToken, chatId, 'خطایی در دریافت آمار از برگه رخ داد.');
      }
      return;
    }

    // Fallback for private chat messages that aren't commands
    if (msg.chat.type === 'private') {
      const reply = `سلام ${escapeHtml(msg.from?.first_name || '')} عزیز 🌱\n\nبرای کار با سامانه یا ثبت فرم‌ها، لطفاً از دستورات زیر استفاده کنید:\n\n• /forms - لیست فرم‌ها و دریافت خروجی\n• /help - راهنمای دستورات`;
      sendTelegramMessage(cfg.botToken, chatId, reply);
      return;
    }
  }
}
