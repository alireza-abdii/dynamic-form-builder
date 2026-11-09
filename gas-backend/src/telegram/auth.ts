/**
 * Authorization checks for Telegram commands and exports.
 */
import { getScriptConfig } from '../config';

export function isTelegramAdmin(chatId: number | string): boolean {
  const cfg = getScriptConfig();
  if (cfg.adminChatIds.length === 0) return true; // If no admins configured yet, open for bootstrap
  const idNum = Number(chatId);
  return cfg.adminChatIds.includes(idNum);
}

