/**
 * Telegram Bot API client for Google Apps Script.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function sendTelegramMessage(
  token: string,
  chatId: number | string,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown' | undefined;
    replyMarkup?: object | undefined;
    disableWebPagePreview?: boolean | undefined;
  }
): boolean {
  if (!token || !chatId) return false;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload: Record<string, unknown> = {
    chat_id: String(chatId),
    text,
    parse_mode: options?.parseMode || 'HTML',
    disable_web_page_preview: options?.disableWebPagePreview ?? true
  };

  if (options?.replyMarkup) {
    payload.reply_markup = options.replyMarkup;
  }

  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    if (code !== 200) {
      console.error('[telegram] Failed to send message:', code, res.getContentText());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[telegram] Exception in sendTelegramMessage:', err);
    return false;
  }
}

export function sendTelegramDocument(
  token: string,
  chatId: number | string,
  blob: GoogleAppsScript.Base.Blob,
  caption?: string
): boolean {
  if (!token || !chatId || !blob) return false;

  const url = `https://api.telegram.org/bot${token}/sendDocument`;
  const payload: Record<string, unknown> = {
    chat_id: String(chatId),
    document: blob
  };

  if (caption) {
    payload.caption = caption;
    payload.parse_mode = 'HTML';
  }

  try {
    // UrlFetchApp automatically builds multipart/form-data when payload contains Blob
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      payload,
      muteHttpExceptions: true
    });
    return res.getResponseCode() === 200;
  } catch (err) {
    console.error('[telegram] Failed to send document:', err);
    return false;
  }
}

export function sendTelegramChatAction(
  token: string,
  chatId: number | string,
  action: 'upload_document' | 'typing'
): boolean {
  if (!token || !chatId) return false;
  const url = `https://api.telegram.org/bot${token}/sendChatAction`;
  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: String(chatId), action }),
      muteHttpExceptions: true
    });
    return res.getResponseCode() === 200;
  } catch {
    return false;
  }
}

export function answerTelegramCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string,
  showAlert = false
): boolean {
  if (!token || !callbackQueryId) return false;
  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert
      }),
      muteHttpExceptions: true
    });
    return res.getResponseCode() === 200;
  } catch {
    return false;
  }
}
