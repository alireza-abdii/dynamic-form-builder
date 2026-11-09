#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.WEBHOOK_SECRET;
const gasUrl = process.env.GAS_WEB_APP_URL;
const publicBaseUrl = process.env.VITE_PUBLIC_BASE_URL;

if (!token || token.includes('your_bot_token')) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is not configured in .env');
  process.exit(1);
}

const isDelete = process.argv.includes('--delete');
const isInfo = process.argv.includes('--info');

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }).then(res => res.json());

async function run() {
  if (isInfo) {
    const info = await api('getWebhookInfo');
    console.log('📡 Telegram Webhook Info:', JSON.stringify(info, null, 2));
    return;
  }

  if (isDelete) {
    console.log('🗑️ Deleting Telegram webhook...');
    const res = await api('deleteWebhook', { drop_pending_updates: true });
    console.log('Result:', res);
    return;
  }

  if (!gasUrl || gasUrl.includes('AKfycbxxxx')) {
    console.error('❌ Error: GAS_WEB_APP_URL is not configured in .env. Deploy GAS first.');
    process.exit(1);
  }

  const webhookUrl = `${gasUrl}?tg=${encodeURIComponent(webhookSecret || '')}`;
  console.log(`🔗 Setting Telegram Webhook to: ${gasUrl}?tg=***`);

  const setRes = await api('setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
    max_connections: 10
  });

  if (!setRes.ok) {
    console.error('❌ Failed to set webhook:', setRes);
    process.exit(1);
  }
  console.log('✅ Webhook registered successfully!');

  // Set bot commands with Persian descriptions
  console.log('📝 Registering bot commands in Persian...');
  await api('setMyCommands', {
    commands: [
      { command: 'forms', description: 'لیست فرم‌های سازمانی فعال' },
      { command: 'export', description: 'دریافت خروجی اکسل (xlsx.)' },
      { command: 'stats', description: 'مشاهده آمار ثبت پاسخ‌ها' },
      { command: 'whoami', description: 'شناسه چت و وضعیت دسترسی شما' },
      { command: 'help', description: 'راهنمای کار با ربات' }
    ]
  });

  // Set chat menu button if URL is configured
  if (publicBaseUrl && !publicBaseUrl.includes('example.com')) {
    console.log(`📱 Setting Chat Menu Button to ${publicBaseUrl}...`);
    await api('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'فرم‌ها',
        web_app: { url: publicBaseUrl }
      }
    });
  }

  // Verify
  const info = await api('getWebhookInfo');
  console.log('📡 Webhook Status:', info.result?.url ? 'Active' : 'Inactive');
  if (info.result?.last_error_message) {
    console.warn('⚠️ Warning - Last Error:', info.result.last_error_message);
  }
}

run().catch(err => {
  console.error('❌ Telegram setup failure:', err);
  process.exit(1);
});
