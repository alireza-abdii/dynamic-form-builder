/**
 * Telegram Update Dispatcher and Intelligent Command Handlers.
 */
import { formatJalaliString, getTodayJalali, toPersianDigits, type FormDefinition } from '@fb/shared';
import { getScriptConfig } from '../config';
import {
  sendTelegramMessage,
  sendTelegramDocument,
  sendTelegramChatAction,
  answerTelegramCallbackQuery,
  editTelegramMessageText,
  escapeHtml
} from './api';
import { isTelegramAdmin } from './auth';
import {
  buildMainMenuReplyKeyboard,
  buildFormsListKeyboard,
  buildFormDetailKeyboard,
  buildExportSelectionKeyboard,
  buildStatsSelectionKeyboard
} from './keyboards';
import { openSpreadsheet, getTabStats, updateSubmissionStatus, type TabStats } from '../sheets/repository';
import { exportTabToXlsxBlob } from '../export/xlsx-exporter';
import { resolveForm, listAllForms } from '../forms/form-resolver';
import { handleTrackSubmission } from '../forms/track.handler';

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

/**
 * Format an interactive Form Detail Card with live stats and metadata.
 */
function renderFormDetailText(
  form: FormDefinition,
  stats?: TabStats | undefined,
  isAdmin = false
): string {
  const statusLabel = form.status === 'open' ? '🟢 فعال و آماده پذیرش' : '🔒 بسته شده';
  const accessLabel = form.access === 'public' ? '🌐 عمومی (وب و تلگرام)' : '📱 اختصاصی تلگرام مینی‌اپ';

  let text = `📋 <b>فرم: «${escapeHtml(form.title)}»</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n`;

  if (form.description) {
    text += `💬 <b>توضیحات:</b> ${escapeHtml(form.description)}\n\n`;
  }

  text += `🆔 <b>شناسه فرم:</b> <code>${escapeHtml(form.id)}</code>\n` +
    `🔢 <b>تعداد فیلدها:</b> ${toPersianDigits(form.fields.length)} فیلد\n` +
    `🔒 <b>سطح دسترسی:</b> ${accessLabel}\n` +
    `⏳ <b>وضعیت کنونی:</b> ${statusLabel}\n`;

  if (isAdmin && stats) {
    text += `──────────────────\n` +
      `📊 <b>آمار ثبت پاسخ‌ها:</b>\n` +
      `• مجموع ثبت‌شده: <b>${toPersianDigits(stats.totalSubmissions)}</b> مورد\n` +
      `• ثبت‌شده‌های امروز: <b>${toPersianDigits(stats.todaySubmissions)}</b> مورد\n` +
      (stats.lastSubmissionDate ? `• آخرین ثبت: ${toPersianDigits(stats.lastSubmissionDate)}\n` : '');
  }

  return text;
}

/**
 * Format the welcome message with company/system header.
 */
function renderWelcomeText(firstName: string, isAdmin: boolean): string {
  const roleBadge = isAdmin ? '🛡 مدیر سامانه' : '👤 کاربر گرامی';
  return `🏢 <b>سامانه هوشمند فرم‌های سازمانی</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `سلام <b>${escapeHtml(firstName)}</b> عزیز، خوش آمدید 🌱\n\n` +
    `نقش شما: <b>${roleBadge}</b>\n\n` +
    `از این بستر می‌توانید فرم‌های فعال سازمانی را تکمیل کرده و پیگیری نمایید.\n` +
    `جهت دسترسی سریع، از منوی دکمه‌ای پایین صفحه یا دکمه‌های زیر استفاده فرمایید:`;
}

/**
 * Format the user profile card.
 */
function renderWhoamiText(
  from: { id: number; first_name: string; last_name?: string; username?: string },
  isAdmin: boolean
): string {
  const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ');
  return `👤 <b>کارت شناسایی کاربری در سامانه</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🏷 <b>نام:</b> ${escapeHtml(fullName)}\n` +
    `🆔 <b>شناسه عددی (Chat ID):</b> <code>${from.id}</code>\n` +
    `📎 <b>نام کاربری:</b> ${from.username ? `@${escapeHtml(from.username)}` : '<i>تنظیم نشده</i>'}\n` +
    `🔰 <b>سطح دسترسی:</b> ${isAdmin ? '🛡 مدیر ارشد (Admin)' : '👤 کاربر استاندارد'}\n` +
    `──────────────────\n` +
    (isAdmin
      ? '✅ <b>دسترسی مدیریتی فعال است:</b> شما مجاز به مشاهده آمار زنده، دانلود فایل اکسل سابمیشن‌ها و نظارت بر فرم‌ها هستید.'
      : 'ℹ️ دسترسی شما عادی است. در صورت نیاز به اختیارات مدیریتی، شناسه عددی بالا را به مدیر سیستم اعلام فرمایید.');
}

/**
 * Format the help guide text.
 */
function renderHelpText(isAdmin: boolean): string {
  return `📚 <b>راهنمای سامانه فرم‌ساز سازمانی</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `برای تعامل با سامانه می‌توانید از دکمه‌های منوی پایین صفحه یا دستورات زیر استفاده کنید:\n\n` +
    `📋 <b>/forms</b> - مشاهده فهرست فرم‌های فعال و تکمیل آنلاین\n` +
    (isAdmin
      ? `📊 <b>/stats</b> - گزارش زنده آمار ثبت‌شده‌ها به تفکیک فرم\n` +
        `📥 <b>/export</b> - دریافت مستقیم فایل اکسل (.xlsx) پاسخ‌ها\n`
      : '') +
    `👤 <b>/whoami</b> - مشاهده مشخصات کاربری و وضعیت دسترسی\n` +
    `❓ <b>/help</b> - نمایش این پیام راهنما\n` +
    `──────────────────\n` +
    `💡 <i>نکته: با کلیک روی دکمه Menu در پایین چت تلگرام، می‌توانید در هر زمان مینی‌اپ را مستقیماً باز کنید.</i>`;
}

export function handleTelegramUpdate(update: TelegramUpdate): void {
  const cfg = getScriptConfig();
  if (!cfg.botToken) {
    console.error('[telegram] Bot token is missing in Script Properties.');
    return;
  }

  // =========================================================================
  // 1. Handle Callback Queries (Inline Button Clicks)
  // =========================================================================
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat.id || cq.from.id;
    const messageId = cq.message?.message_id;
    const data = cq.data || '';
    const isAdmin = isTelegramAdmin(cq.from.id);

    // 1.0. Approve or Reject Submission Callback (ap:formId:trackingCode or rj:formId:trackingCode)
    if (data.startsWith('ap:') || data.startsWith('rj:')) {
      if (!isAdmin) {
        answerTelegramCallbackQuery(cfg.botToken, cq.id, '⛔ شما دسترسی مجاز برای تعیین وضعیت این درخواست را ندارید.', true);
        return;
      }

      const parts = data.split(':');
      const actionType = parts[0];
      const formId = parts[1];
      const trackingCode = parts[2];

      if (!formId || !trackingCode) {
        answerTelegramCallbackQuery(cfg.botToken, cq.id, 'پارامترهای درخواست نامعتبر است.', true);
        return;
      }

      const actionLabel = actionType === 'ap' ? 'تایید شد' : 'رد شد';

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const sheet = ss.getSheetByName(formId);
        if (!sheet) {
          answerTelegramCallbackQuery(cfg.botToken, cq.id, 'شیت فرم در جدول سازمانی یافت نشد.', true);
          return;
        }

        const today = getTodayJalali();
        const dateStr = formatJalaliString(today.jy, today.jm, today.jd);
        const reviewerDisplay = `${cq.from.first_name}${cq.from.username ? ` (@${cq.from.username})` : ''} – ${toPersianDigits(dateStr)}`;

        const result = updateSubmissionStatus(sheet, trackingCode, actionLabel, reviewerDisplay);

        if (result.alreadyProcessed) {
          answerTelegramCallbackQuery(
            cfg.botToken,
            cq.id,
            `⚠️ این درخواست قبلاً توسط «${result.reviewer || 'مدیریت'}» تعیین تکلیف شده است (${result.previousStatus}).`,
            true
          );
          return;
        }

        if (!result.ok) {
          answerTelegramCallbackQuery(cfg.botToken, cq.id, result.message || 'خطا در ثبت وضعیت درخواست.', true);
          return;
        }

        // 1. Acknowledge callback popup
        answerTelegramCallbackQuery(
          cfg.botToken,
          cq.id,
          `درخواست ${trackingCode} با موفقیت «${actionLabel}».`,
          false
        );

        // 2. Edit original admin alert message to show status badge and remove action buttons
        if (messageId) {
          const statusIcon = actionLabel === 'تایید شد' ? '✅' : '❌';
          const updateNote = `\n\n━━━━━━━━━━━━━━━━━━\n` +
            `📌 <b>وضعیت نهایی:</b> ${statusIcon} <b>${actionLabel}</b>\n` +
            `👤 <b>بررسی توسط:</b> ${escapeHtml(reviewerDisplay)}`;

          const origText = cq.message && 'text' in cq.message ? String((cq.message as { text: string }).text) : '';
          const newText = (origText || `درخواست فرم با کد رهگیری ${trackingCode}`) + updateNote;

          const updatedKeyboard = {
            inline_keyboard: [
              [{ text: '📥 دانلود فایل اکسل فرم', callback_data: `x:${formId}` }]
            ]
          };

          editTelegramMessageText(cfg.botToken, chatId, messageId, newText, { replyMarkup: updatedKeyboard });
        }

        // 3. Notify submitter if submitted via Telegram
        if (result.tgUserId) {
          const resolved = resolveForm(formId);
          const formTitle = resolved?.form.title || formId;
          const statusIcon = actionLabel === 'تایید شد' ? '✅' : '❌';
          const userMsg = `🔔 <b>نتیجه بررسی درخواست شما</b>\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `📋 <b>فرم:</b> «${escapeHtml(formTitle)}»\n` +
            `🏷 <b>کد رهگیری:</b> <code>${escapeHtml(trackingCode)}</code>\n` +
            `📌 <b>وضعیت:</b> ${statusIcon} <b>${actionLabel}</b>\n` +
            `📅 <b>تاریخ بررسی:</b> ${toPersianDigits(dateStr)}\n\n` +
            (actionLabel === 'تایید شد'
              ? `<i>درخواست شما مورد تایید مدیریت قرار گرفت و مراحل لازم پیگیری خواهد شد.</i>`
              : `<i>درخواست شما پس از بررسی توسط مدیریت، مورد تایید قرار نگرفت.</i>`);

          sendTelegramMessage(cfg.botToken, result.tgUserId, userMsg);
        }
      } catch (err: unknown) {
        console.error('[telegram] Approve/Reject error:', err);
        answerTelegramCallbackQuery(cfg.botToken, cq.id, 'خطا در ثبت وضعیت در سرور.', true);
      }
      return;
    }

    // 1.1. Export tab to Excel (.xlsx)
    if (data.startsWith('x:')) {
      if (!isAdmin) {
        answerTelegramCallbackQuery(cfg.botToken, cq.id, '⛔ شما دسترسی مجاز برای دریافت گزارش اکسل ندارید.', true);
        return;
      }

      const formId = data.slice(2);
      answerTelegramCallbackQuery(cfg.botToken, cq.id, '⏳ در حال ساخت فایل اکسل...');
      sendTelegramChatAction(cfg.botToken, chatId, 'upload_document');

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const blob = exportTabToXlsxBlob(ss, formId);
        const resolved = resolveForm(formId);
        const title = resolved ? resolved.form.title : formId;
        const today = getTodayJalali();
        const dateStr = formatJalaliString(today.jy, today.jm, today.jd);

        const caption = `📊 <b>خروجی اکسل فرم:</b> ${escapeHtml(title)}\n` +
          `📅 <b>تاریخ صدور:</b> ${toPersianDigits(dateStr)}\n` +
          `📁 <b>فرمت:</b> Microsoft Excel (.xlsx)`;

        sendTelegramDocument(cfg.botToken, chatId, blob, caption);
      } catch (err: unknown) {
        console.error('[telegram] Export callback failed:', err);
        const msg = err instanceof Error ? err.message : String(err);
        sendTelegramMessage(cfg.botToken, chatId, `❌ خطا در تهیه خروجی اکسل:\n${escapeHtml(msg)}`);
      }
      return;
    }

    // 1.2. View Stats for a form
    if (data.startsWith('s:')) {
      if (!isAdmin) {
        answerTelegramCallbackQuery(cfg.botToken, cq.id, '⛔ دسترسی به آمار مخصوص مدیران است.', true);
        return;
      }

      const formId = data.slice(2);
      answerTelegramCallbackQuery(cfg.botToken, cq.id);

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const today = getTodayJalali();
        const todayStr = formatJalaliString(today.jy, today.jm, today.jd);
        const stats = getTabStats(ss, formId, todayStr);
        const resolved = resolveForm(formId);
        const title = resolved?.form.title || formId;

        const text = `📊 <b>گزارش آماری فرم «${escapeHtml(title)}»</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `• <b>کل پاسخ‌های ثبت‌شده:</b> ${toPersianDigits(stats.totalSubmissions)} مورد\n` +
          `• <b>ثبت‌شده‌های امروز:</b> ${toPersianDigits(stats.todaySubmissions)} مورد\n` +
          (stats.lastSubmissionDate ? `• <b>آخرین ثبت:</b> ${toPersianDigits(stats.lastSubmissionDate)}\n` : '') +
          `──────────────────\n` +
          `<i>جهت دانلود اطلاعات کامل، از گزینه «دریافت اکسل» استفاده نمایید.</i>`;

        const keyboard = {
          inline_keyboard: [
            [
              { text: '📥 دانلود اکسل', callback_data: `x:${formId}` },
              { text: '🔄 تازه‌سازی', callback_data: `s:${formId}` }
            ],
            [{ text: '🔙 بازگشت به کارت فرم', callback_data: `f:${formId}` }]
          ]
        };

        if (messageId) {
          editTelegramMessageText(cfg.botToken, chatId, messageId, text, { replyMarkup: keyboard });
        } else {
          sendTelegramMessage(cfg.botToken, chatId, text, { replyMarkup: keyboard });
        }
      } catch (err: unknown) {
        console.error('[telegram] Stats callback failed:', err);
      }
      return;
    }

    // 1.3. Show Form Detail Card (in-place message update!)
    if (data.startsWith('f:') && data !== 'f:list' && data !== 'f:refresh' && data !== 'f:export_menu' && data !== 'f:stats_menu') {
      const formId = data.slice(2);
      const resolved = resolveForm(formId);

      if (!resolved) {
        answerTelegramCallbackQuery(cfg.botToken, cq.id, 'فرمی با این شناسه یافت نشد.', true);
        return;
      }

      answerTelegramCallbackQuery(cfg.botToken, cq.id);

      let stats: TabStats | undefined;
      if (isAdmin) {
        try {
          const ss = openSpreadsheet(cfg.spreadsheetId);
          const today = getTodayJalali();
          const todayStr = formatJalaliString(today.jy, today.jm, today.jd);
          stats = getTabStats(ss, formId, todayStr);
        } catch {
          // stats optional
        }
      }

      const cardText = renderFormDetailText(resolved.form, stats, isAdmin);
      const keyboard = buildFormDetailKeyboard(formId, resolved.form.status, isAdmin, cfg.publicBaseUrl);

      if (messageId) {
        editTelegramMessageText(cfg.botToken, chatId, messageId, cardText, { replyMarkup: keyboard });
      } else {
        sendTelegramMessage(cfg.botToken, chatId, cardText, { replyMarkup: keyboard });
      }
      return;
    }

    // 1.4. Return to full forms list or refresh list
    if (data === 'f:list' || data === 'f:refresh') {
      answerTelegramCallbackQuery(cfg.botToken, cq.id, data === 'f:refresh' ? 'لیست به‌روز شد' : undefined);
      const forms = listAllForms();
      const text = `📋 <b>فهرست فرم‌های سازمانی</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `برای مشاهده جزئیات، مشخصات فیلدها و تکمیل هر فرم، روی آن کلیک کنید:`;
      const keyboard = buildFormsListKeyboard(forms, isAdmin, cfg.publicBaseUrl);

      if (messageId) {
        editTelegramMessageText(cfg.botToken, chatId, messageId, text, { replyMarkup: keyboard });
      } else {
        sendTelegramMessage(cfg.botToken, chatId, text, { replyMarkup: keyboard });
      }
      return;
    }

    // 1.5. Quick Export menu
    if (data === 'f:export_menu') {
      if (!isAdmin) {
        answerTelegramCallbackQuery(cfg.botToken, cq.id, 'دسترسی محدود به مدیران است.', true);
        return;
      }
      answerTelegramCallbackQuery(cfg.botToken, cq.id);
      const forms = listAllForms();
      const text = `📥 <b>انتخاب فرم جهت دریافت خروجی اکسل:</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `روی فرم مورد نظر کلیک کنید تا فایل .xlsx برای شما ارسال شود:`;
      const keyboard = buildExportSelectionKeyboard(forms);

      if (messageId) {
        editTelegramMessageText(cfg.botToken, chatId, messageId, text, { replyMarkup: keyboard });
      } else {
        sendTelegramMessage(cfg.botToken, chatId, text, { replyMarkup: keyboard });
      }
      return;
    }

    // Default acknowledge
    answerTelegramCallbackQuery(cfg.botToken, cq.id);
    return;
  }

  // =========================================================================
  // 2. Handle Text Messages & Intelligent Commands
  // =========================================================================
  if (update.message?.text) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const rawText = (msg.text || '').trim();
    const [rawCmd, ...restArgs] = rawText.split(/\s+/);
    const command = (rawCmd || '').split('@')[0]?.toLowerCase();
    const argStr = restArgs.join(' ').trim();
    const fromUser = msg.from || { id: chatId, first_name: 'کاربر' };
    const isAdmin = isTelegramAdmin(fromUser.id);
    const mainMenuMarkup = buildMainMenuReplyKeyboard(isAdmin);

    // 2.1. Command: /whoami or "👤 حساب کاربری من" / "کیستم" / "پروفایل"
    if (
      command === '/whoami' ||
      rawText === '👤 حساب کاربری من' ||
      rawText.includes('کیستم') ||
      rawText.includes('پروفایل من')
    ) {
      const reply = renderWhoamiText(fromUser, isAdmin);
      sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: mainMenuMarkup });
      return;
    }

    // 2.2. Command: /help or "❓ راهنمای سامانه" / "راهنما" / "کمک"
    if (
      command === '/help' ||
      rawText === '❓ راهنمای سامانه' ||
      rawText === 'راهنما' ||
      rawText === 'کمک'
    ) {
      const reply = renderHelpText(isAdmin);
      sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: mainMenuMarkup });
      return;
    }

    // 2.2.1. Command: /track [code] or "پیگیری"
    if (
      command === '/track' ||
      rawText === 'پیگیری' ||
      rawText === 'پیگیری درخواست' ||
      rawText.startsWith('پیگیری ')
    ) {
      let codeToTrack = argStr;
      if (!codeToTrack && rawText.startsWith('پیگیری ')) {
        codeToTrack = rawText.replace('پیگیری ', '').trim();
      }

      if (!codeToTrack) {
        sendTelegramMessage(
          cfg.botToken,
          chatId,
          '🔍 <b>پیگیری وضعیت درخواست</b>\n\nلطفاً کد رهگیری خود را ارسال کنید:\n<code>/track FB-XXXXXX</code>',
          { replyMarkup: mainMenuMarkup }
        );
        return;
      }

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const res = handleTrackSubmission(ss, codeToTrack);

        if (!res.ok) {
          sendTelegramMessage(cfg.botToken, chatId, `⚠️ ${res.message}`, { replyMarkup: mainMenuMarkup });
          return;
        }

        if (!res.found) {
          sendTelegramMessage(
            cfg.botToken,
            chatId,
            `⚠️ درخواستی با کد رهگیری <code>${escapeHtml(codeToTrack)}</code> در سامانه یافت نشد.\nلطفاً از صحت کد واردشده اطمینان حاصل فرمایید.`,
            { replyMarkup: mainMenuMarkup }
          );
          return;
        }

        const isApproved = res.status === 'تایید شد';
        const isRejected = res.status === 'رد شد';
        const isPending = res.status === 'در انتظار بررسی';
        const statusIcon = isApproved ? '✅' : isRejected ? '❌' : isPending ? '⏳' : '🟢';

        let reply = `🔍 <b>نتیجه استعلام وضعیت درخواست</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📋 <b>فرم:</b> «${escapeHtml(res.formTitle || '')}»\n` +
          `🔖 <b>کد رهگیری:</b> <code>${res.trackingCode}</code>\n` +
          (res.jalaliDate ? `📅 <b>تاریخ ثبت:</b> ${toPersianDigits(res.jalaliDate)}\n` : '') +
          `📌 <b>وضعیت کنونی:</b> ${statusIcon} <b>${res.status}</b>\n` +
          (res.reviewedBy ? `👤 <b>بررسی توسط:</b> ${escapeHtml(res.reviewedBy)}\n` : '') +
          `──────────────────\n`;

        if (isApproved) {
          reply += `<i>درخواست شما با موفقیت تایید شده است.</i>`;
        } else if (isRejected) {
          reply += `<i>درخواست شما پس از بررسی، مورد موافقت قرار نگرفت.</i>`;
        } else if (isPending) {
          reply += `<i>درخواست شما در نوبت بررسی توسط مدیریت قرار دارد.</i>`;
        } else {
          reply += `<i>اطلاعات شما با موفقیت در سامانه ثبت و بایگانی شده است.</i>`;
        }

        sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: mainMenuMarkup });
      } catch (err: unknown) {
        console.error('[telegram] Track error:', err);
        sendTelegramMessage(cfg.botToken, chatId, 'خطا در استعلام وضعیت از سرور.', { replyMarkup: mainMenuMarkup });
      }
      return;
    }

    // 2.3. Command: /start [param] or "سلام" / "درود"
    if (
      command === '/start' ||
      rawText === 'سلام' ||
      rawText === 'درود' ||
      rawText === 'صبح بخیر' ||
      rawText === 'عصر بخیر' ||
      rawText.toLowerCase() === 'hi' ||
      rawText.toLowerCase() === 'hello'
    ) {
      // Deep-link direct form jump: /start <formId>
      if (argStr) {
        const resolved = resolveForm(argStr);
        if (resolved) {
          let stats;
          if (isAdmin) {
            try {
              const ss = openSpreadsheet(cfg.spreadsheetId);
              const today = getTodayJalali();
              const todayStr = formatJalaliString(today.jy, today.jm, today.jd);
              stats = getTabStats(ss, argStr, todayStr);
            } catch {
              // ignore
            }
          }
          const cardText = renderFormDetailText(resolved.form, stats, isAdmin);
          const inlineKb = buildFormDetailKeyboard(resolved.form.id, resolved.form.status, isAdmin, cfg.publicBaseUrl);
          sendTelegramMessage(cfg.botToken, chatId, cardText, { replyMarkup: inlineKb });
          return;
        }
      }

      // Default welcome
      const forms = listAllForms();
      const welcomeText = renderWelcomeText(fromUser.first_name, isAdmin);
      const inlineKb = buildFormsListKeyboard(forms, isAdmin, cfg.publicBaseUrl);

      // Send greeting with bottom reply keyboard + inline cards
      sendTelegramMessage(cfg.botToken, chatId, welcomeText, { replyMarkup: mainMenuMarkup });
      sendTelegramMessage(cfg.botToken, chatId, '📋 <b>فرم‌های فعال در سامانه:</b>', { replyMarkup: inlineKb });
      return;
    }

    // 2.4. Command: /forms or "📋 فرم‌های سازمانی" / "فرم‌ها" / "لیست فرم‌ها"
    if (
      command === '/forms' ||
      rawText === '📋 فرم‌های سازمانی' ||
      rawText === 'فرم‌ها' ||
      rawText === 'فرم ها' ||
      rawText === 'لیست فرم‌ها' ||
      rawText === 'لیست فرم ها'
    ) {
      const forms = listAllForms();
      if (forms.length === 0) {
        sendTelegramMessage(
          cfg.botToken,
          chatId,
          'در حال حاضر هیچ فرم فعالی در سامانه تعریف نشده است.',
          { replyMarkup: mainMenuMarkup }
        );
        return;
      }

      const text = `📋 <b>فهرست فرم‌های سازمانی</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `برای مشاهده مشخصات، تکمیل آنلاین یا گزارش هر فرم، روی نام آن کلیک کنید:`;
      const inlineKb = buildFormsListKeyboard(forms, isAdmin, cfg.publicBaseUrl);
      sendTelegramMessage(cfg.botToken, chatId, text, { replyMarkup: inlineKb });
      return;
    }

    // 2.5. Command: /export [formId] or "📥 دریافت اکسل"
    if (command === '/export' || rawText === '📥 دریافت اکسل' || rawText === 'اکسل') {
      if (!isAdmin) {
        sendTelegramMessage(
          cfg.botToken,
          chatId,
          '⛔ <b>دسترسی غیرمجاز:</b> دریافت خروجی اکسل صرفاً برای مدیران سیستم مجاز است.',
          { replyMarkup: mainMenuMarkup }
        );
        return;
      }

      const formId = argStr;

      // If no formId provided, present interactive selection keyboard
      if (!formId) {
        const forms = listAllForms();
        const text = `📥 <b>دریافت خروجی اکسل (.xlsx)</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `لطفاً فرم مورد نظر خود را جهت دریافت فایل انتخاب فرمایید:`;
        const inlineKb = buildExportSelectionKeyboard(forms);
        sendTelegramMessage(cfg.botToken, chatId, text, { replyMarkup: inlineKb });
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
        const today = getTodayJalali();
        const dateStr = formatJalaliString(today.jy, today.jm, today.jd);

        const caption = `📊 <b>خروجی اکسل فرم:</b> ${escapeHtml(resolved.form.title)}\n` +
          `📅 <b>تاریخ صدور:</b> ${toPersianDigits(dateStr)}\n` +
          `📁 <b>فرمت:</b> Microsoft Excel (.xlsx)`;

        sendTelegramDocument(cfg.botToken, chatId, blob, caption);
      } catch (err: unknown) {
        console.error('[telegram] Export command failed:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        sendTelegramMessage(cfg.botToken, chatId, `❌ خطا در تهیه خروجی اکسل:\n${escapeHtml(errorMsg)}`);
      }
      return;
    }

    // 2.6. Command: /stats [formId] or "📊 آمار و گزارش‌ها"
    if (command === '/stats' || rawText === '📊 آمار و گزارش‌ها' || rawText === 'آمار' || rawText === 'گزارش') {
      if (!isAdmin) {
        sendTelegramMessage(
          cfg.botToken,
          chatId,
          '⛔ <b>دسترسی غیرمجاز:</b> مشاهده آمار اختصاصی مدیران سیستم است.',
          { replyMarkup: mainMenuMarkup }
        );
        return;
      }

      const formId = argStr;

      if (!formId) {
        const forms = listAllForms();
        const text = `📊 <b>مشاهده آمار ثبت پاسخ‌ها</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `لطفاً فرم مورد نظر را برای مشاهده آمار انتخاب کنید:`;
        const inlineKb = buildStatsSelectionKeyboard(forms);
        sendTelegramMessage(cfg.botToken, chatId, text, { replyMarkup: inlineKb });
        return;
      }

      const resolved = resolveForm(formId);
      if (!resolved) {
        sendTelegramMessage(cfg.botToken, chatId, `❌ فرمی با شناسه «${escapeHtml(formId)}» یافت نشد.`);
        return;
      }

      try {
        const ss = openSpreadsheet(cfg.spreadsheetId);
        const today = getTodayJalali();
        const todayStr = formatJalaliString(today.jy, today.jm, today.jd);
        const stats = getTabStats(ss, formId, todayStr);

        const reply = `📊 <b>گزارش آماری فرم «${escapeHtml(resolved.form.title)}»</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `• <b>کل پاسخ‌های ثبت‌شده:</b> ${toPersianDigits(stats.totalSubmissions)} مورد\n` +
          `• <b>ثبت‌شده‌های امروز:</b> ${toPersianDigits(stats.todaySubmissions)} مورد\n` +
          (stats.lastSubmissionDate ? `• <b>آخرین ثبت:</b> ${toPersianDigits(stats.lastSubmissionDate)}\n` : '');

        const keyboard = {
          inline_keyboard: [
            [{ text: '📥 دریافت اکسل این فرم', callback_data: `x:${formId}` }],
            [{ text: '🔙 بازگشت به لیست', callback_data: 'f:list' }]
          ]
        };

        sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: keyboard });
      } catch (err: unknown) {
        console.error('[telegram] Stats command failed:', err);
        sendTelegramMessage(cfg.botToken, chatId, 'خطایی در دریافت آمار از برگه رخ داد.');
      }
      return;
    }

    // 2.7. Intelligent Conversational Fallback for Private Chats
    if (msg.chat.type === 'private') {
      const forms = listAllForms();
      const reply = `سلام <b>${escapeHtml(fromUser.first_name)}</b> عزیز 🌱\n\n` +
        `دستور یا پیام ارسالی مشخص نیست. برای استفاده از امکانات سامانه می‌توانید از دکمه‌های زیر یا منوی پایین صفحه استفاده فرمایید:`;

      const inlineKb = buildFormsListKeyboard(forms, isAdmin, cfg.publicBaseUrl);
      sendTelegramMessage(cfg.botToken, chatId, reply, { replyMarkup: mainMenuMarkup });
      sendTelegramMessage(cfg.botToken, chatId, '📋 <b>دسترسی سریع به فرم‌ها:</b>', { replyMarkup: inlineKb });
      return;
    }
  }
}
