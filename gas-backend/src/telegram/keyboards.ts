/**
 * Inline keyboard generators for Telegram Bot.
 */
import type { FormDefinition } from '@fb/shared';

export function buildFormsListKeyboard(
  forms: FormDefinition[],
  publicBaseUrl?: string
) {
  const inline_keyboard: Array<Array<{ text: string; callback_data?: string; web_app?: { url: string }; url?: string }>> = [];

  for (const form of forms) {
    // Row 1: Form Title Header Button
    inline_keyboard.push([
      {
        text: `📋 ${form.title} (${form.status === 'open' ? 'فعال' : 'بسته'})`,
        callback_data: `s:${form.id}`
      }
    ]);

    // Row 2: Action buttons (Export, Stats, Open)
    const actionRow: Array<{ text: string; callback_data?: string; web_app?: { url: string }; url?: string }> = [
      {
        text: '📥 خروجی اکسل',
        callback_data: `x:${form.id}`
      },
      {
        text: '📊 آمار',
        callback_data: `s:${form.id}`
      }
    ];

    if (publicBaseUrl) {
      const formUrl = `${publicBaseUrl}/f/${form.id}`;
      actionRow.push({
        text: '🔗 باز کردن',
        web_app: { url: formUrl }
      });
    }

    inline_keyboard.push(actionRow);
  }

  return { inline_keyboard };
}

export function buildNotificationKeyboard(formId: string, publicBaseUrl?: string) {
  const buttons: Array<{ text: string; callback_data?: string; web_app?: { url: string } }> = [
    {
      text: '📥 خروجی اکسل',
      callback_data: `x:${formId}`
    }
  ];

  if (publicBaseUrl) {
    buttons.push({
      text: '🔗 باز کردن فرم',
      web_app: { url: `${publicBaseUrl}/f/${formId}` }
    });
  }

  return {
    inline_keyboard: [buttons]
  };
}

