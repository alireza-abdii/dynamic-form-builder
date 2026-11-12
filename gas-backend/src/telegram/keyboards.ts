/**
 * Keyboard generators for Telegram Bot (Reply & Inline Keyboards).
 */
export interface FormListItem {
  id: string;
  title: string;
  status: 'open' | 'closed';
}

/**
 * Persistent bottom reply keyboard for easy 1-tap navigation on mobile.
 */
export function buildMainMenuReplyKeyboard(isAdmin: boolean) {
  const keyboard: Array<Array<{ text: string }>> = [
    [{ text: '📋 فرم‌های سازمانی' }]
  ];

  if (isAdmin) {
    keyboard.push([
      { text: '📊 آمار و گزارش‌ها' },
      { text: '📥 دریافت اکسل' }
    ]);
  }

  keyboard.push([
    { text: '👤 حساب کاربری من' },
    { text: '❓ راهنمای سامانه' }
  ]);

  return {
    keyboard,
    resize_keyboard: true,
    is_persistent: true
  };
}

/**
 * Interactive list of forms with card navigation and quick web-app launcher.
 */
export function buildFormsListKeyboard(
  forms: FormListItem[],
  isAdmin = false,
  publicBaseUrl?: string
) {
  const inline_keyboard: Array<Array<{ text: string; callback_data?: string; web_app?: { url: string }; url?: string }>> = [];

  for (const form of forms) {
    const statusIcon = form.status === 'open' ? '🟢' : '🔒';
    const formUrl = publicBaseUrl ? `${publicBaseUrl}/f/${form.id}` : undefined;

    // Row: Form title button (opens detailed Form Card)
    const row: Array<{ text: string; callback_data?: string; web_app?: { url: string }; url?: string }> = [
      {
        text: `${statusIcon} ${form.title}`,
        callback_data: `f:${form.id}`
      }
    ];

    // Quick Mini App launcher button if available
    if (formUrl && form.status === 'open') {
      row.push({
        text: '🚀 ورود',
        web_app: { url: formUrl }
      });
    }

    inline_keyboard.push(row);
  }

  // Bottom action bar
  const bottomBar: Array<{ text: string; callback_data?: string }> = [
    { text: '🔄 به‌روزرسانی لیست', callback_data: 'f:refresh' }
  ];

  if (isAdmin && forms.length > 0) {
    bottomBar.push({ text: '📥 اکسل سریع', callback_data: 'f:export_menu' });
  }

  inline_keyboard.push(bottomBar);

  return { inline_keyboard };
}

/**
 * Detail card keyboard for an individual form.
 */
export function buildFormDetailKeyboard(
  formId: string,
  formStatus: 'open' | 'closed',
  isAdmin = false,
  publicBaseUrl?: string
) {
  const inline_keyboard: Array<Array<{ text: string; callback_data?: string; web_app?: { url: string }; url?: string }>> = [];
  const formUrl = publicBaseUrl ? `${publicBaseUrl}/f/${formId}` : undefined;

  // Row 1: Direct Mini App Completion (Primary Action)
  if (formUrl && formStatus === 'open') {
    inline_keyboard.push([
      {
        text: '🚀 تکمیل آنلاین فرم (Mini App)',
        web_app: { url: formUrl }
      }
    ]);
  }

  // Row 2: Management tools (Admin only)
  if (isAdmin) {
    inline_keyboard.push([
      {
        text: '📥 دریافت اکسل (.xlsx)',
        callback_data: `x:${formId}`
      },
      {
        text: '📊 آمار لحظه‌ای',
        callback_data: `s:${formId}`
      }
    ]);
  }

  // Row 3: Back to full list
  inline_keyboard.push([
    {
      text: '🔙 بازگشت به لیست فرم‌ها',
      callback_data: 'f:list'
    }
  ]);

  return { inline_keyboard };
}

/**
 * Quick export selection keyboard.
 */
export function buildExportSelectionKeyboard(forms: FormListItem[]) {
  const inline_keyboard: Array<Array<{ text: string; callback_data?: string }>> = [];

  for (const form of forms) {
    inline_keyboard.push([
      {
        text: `📥 اکسل: ${form.title}`,
        callback_data: `x:${form.id}`
      }
    ]);
  }

  inline_keyboard.push([
    { text: '🔙 بازگشت به لیست فرم‌ها', callback_data: 'f:list' }
  ]);

  return { inline_keyboard };
}

/**
 * Quick stats selection keyboard.
 */
export function buildStatsSelectionKeyboard(forms: FormListItem[]) {
  const inline_keyboard: Array<Array<{ text: string; callback_data?: string }>> = [];

  for (const form of forms) {
    inline_keyboard.push([
      {
        text: `📊 آمار: ${form.title}`,
        callback_data: `s:${form.id}`
      }
    ]);
  }

  inline_keyboard.push([
    { text: '🔙 بازگشت به لیست فرم‌ها', callback_data: 'f:list' }
  ]);

  return { inline_keyboard };
}

/**
 * Notification message keyboard sent to admins on form submission.
 */
export function buildNotificationKeyboard(formId: string, publicBaseUrl?: string) {
  const buttons: Array<{ text: string; callback_data?: string; web_app?: { url: string } }> = [
    {
      text: '📥 دانلود فایل اکسل',
      callback_data: `x:${formId}`
    }
  ];

  if (publicBaseUrl) {
    buttons.push({
      text: '🔗 مشاهده فرم',
      web_app: { url: `${publicBaseUrl}/f/${formId}` }
    });
  }

  return {
    inline_keyboard: [buttons]
  };
}
