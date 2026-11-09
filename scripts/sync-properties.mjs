#!/usr/bin/env node
/**
 * Automatically synchronizes configuration and secrets from local .env
 * to Google Apps Script PropertiesService via safe POST endpoint.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const gasUrl = process.env.GAS_WEB_APP_URL;
const webhookSecret = process.env.WEBHOOK_SECRET;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const spreadsheetId = process.env.SPREADSHEET_ID;
const adminChatIds = process.env.ADMIN_CHAT_IDS;
const publicBaseUrl = process.env.VITE_PUBLIC_BASE_URL;

if (!gasUrl || gasUrl.includes('AKfycbxxxx')) {
  console.error('❌ Error: GAS_WEB_APP_URL is not set or invalid in .env');
  process.exit(1);
}

if (!webhookSecret) {
  console.error('❌ Error: WEBHOOK_SECRET is not configured in .env');
  process.exit(1);
}

const properties = {
  TELEGRAM_BOT_TOKEN: botToken || '',
  WEBHOOK_SECRET: webhookSecret || '',
  SPREADSHEET_ID: spreadsheetId || '',
  ADMIN_CHAT_IDS: adminChatIds || '',
  VITE_PUBLIC_BASE_URL: publicBaseUrl || ''
};

console.log('🔄 Synchronizing Script Properties to Google Apps Script...');
console.log(`🎯 Target GAS Endpoint: ${gasUrl}`);

async function sync() {
  try {
    const postPayload = {
      action: 'sync_properties',
      secret: webhookSecret,
      properties
    };

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(postPayload),
      redirect: 'follow'
    });

    const result = await res.json();

    if (!result.ok) {
      console.error('❌ Property sync failed:', result);
      process.exit(1);
    }

    console.log('✅ Google Apps Script Properties synchronized successfully!');

    // Verify diagnostics
    console.log('🔍 Running diagnostics check (?action=check)...');
    const checkRes = await fetch(`${gasUrl}?action=check`, { redirect: 'follow' });
    const checkData = await checkRes.json();

    console.log('\n📊 Diagnostics Status:');
    console.log(JSON.stringify(checkData, null, 2));

    if (checkData.checks?.TELEGRAM_BOT_TOKEN?.includes('Set') &&
        checkData.checks?.SPREADSHEET_ID?.includes('Set')) {
      console.log('\n🎉 ALL SYSTEMS GO! Telegram bot is ready to respond to messages and commands.');
    }
  } catch (err) {
    console.error('❌ Sync failed with exception:', err);
    process.exit(1);
  }
}

sync();
