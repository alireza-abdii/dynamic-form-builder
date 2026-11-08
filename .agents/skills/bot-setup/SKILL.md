---
name: bot-setup
description: >-
  Guides initial setup of the Telegram Bot and Mini App: BotFather commands,
  setting chat menu button, and registering webhook with Google Apps Script.
  Use when configuring or troubleshooting the Telegram bot integration.
---

# Telegram Bot & Mini App Setup Runbook

## 1. BotFather Setup
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` to create your organization's bot and obtain your `TELEGRAM_BOT_TOKEN`.
3. Configure the Mini App:
   - Send `/newapp`
   - Select your bot
   - Enter title and short description
   - Provide the Mini App Short Name (e.g. `forms`, matching `VITE_TMA_SHORTNAME`)
   - Provide the Web App URL: enter your `VITE_PUBLIC_BASE_URL`

## 2. Register Webhook & Menu Button
Once the GAS deployment is live and `GAS_WEB_APP_URL`, `WEBHOOK_SECRET`, and `TELEGRAM_BOT_TOKEN` are in `.env`, run:
```powershell
npm run tg:setup
```
This script automatically:
1. Calls `setWebhook` targeting `${GAS_WEB_APP_URL}?tg=${WEBHOOK_SECRET}` with `drop_pending_updates: true`.
2. Calls `setMyCommands` to register admin commands (`/forms`, `/export`, `/stats`, `/whoami`, `/help`).
3. Calls `setChatMenuButton` to attach the Mini App directly to the bot's chat interface.
4. Queries and prints `getWebhookInfo` to verify delivery status.

## 3. Verify
Send `/start` or `/whoami` to your bot to test the webhook and verify your Telegram chat ID.

