/**
 * HTTP response helpers for Google Apps Script Web App.
 */

export function jsonOut(data: unknown): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Returns HTTP 200 HTML response for Telegram Webhook requests.
 * Crucial: ContentService generates HTTP 302 redirects which causes Telegram to retry updates!
 * HtmlService returns direct HTTP 200.
 */
export function tgAck(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutput('ok');
}

export function safeJson(raw: string | undefined | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
