/**
 * Configuration manager for Google Apps Script.
 * Reads environment variables and secrets securely from Script Properties.
 */

export interface AppConfig {
  botToken: string;
  webhookSecret: string;
  adminChatIds: number[];
  spreadsheetId: string;
  publicBaseUrl: string;
}

export function getScriptConfig(): AppConfig {
  const props = PropertiesService.getScriptProperties();

  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN') || '';
  const webhookSecret = props.getProperty('WEBHOOK_SECRET') || '';
  const spreadsheetId = props.getProperty('SPREADSHEET_ID') || '';
  const publicBaseUrl = props.getProperty('VITE_PUBLIC_BASE_URL') || '';

  const rawAdmins = props.getProperty('ADMIN_CHAT_IDS') || '';
  const adminChatIds = rawAdmins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => !isNaN(n));

  return {
    botToken,
    webhookSecret,
    adminChatIds,
    spreadsheetId,
    publicBaseUrl
  };
}

export function setupCheck(): GoogleAppsScript.Content.TextOutput {
  const cfg = getScriptConfig();
  const checks: Record<string, string> = {
    TELEGRAM_BOT_TOKEN: cfg.botToken ? `Set (Length: ${cfg.botToken.length})` : 'MISSING',
    WEBHOOK_SECRET: cfg.webhookSecret ? 'Set' : 'MISSING',
    SPREADSHEET_ID: cfg.spreadsheetId ? `Set (${cfg.spreadsheetId})` : 'MISSING',
    ADMIN_CHAT_IDS: cfg.adminChatIds.length > 0 ? `${cfg.adminChatIds.length} admins configured` : 'NONE',
    VITE_PUBLIC_BASE_URL: cfg.publicBaseUrl ? cfg.publicBaseUrl : 'NOT_SET'
  };

  let sheetAccess = 'NOT_CHECKED';
  if (cfg.spreadsheetId) {
    try {
      const ss = SpreadsheetApp.openById(cfg.spreadsheetId);
      sheetAccess = `OK: Connected to "${ss.getName()}"`;
    } catch (err: unknown) {
      sheetAccess = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  const result = {
    ok: true,
    timestamp: new Date().toISOString(),
    checks,
    sheetAccess
  };

  console.log('Setup Diagnostics Check:', JSON.stringify(result, null, 2));
  return ContentService.createTextOutput(JSON.stringify(result, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

