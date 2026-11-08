# Google Apps Script Backend Directives (`gas-backend/`)

## 1. Runtime Environment & Dependencies
- GAS runs in Google's V8 engine without Node.js standard libraries (`fs`, `path`, `crypto` module, `http`) or browser DOM APIs (`window`, `document`).
- Any external dependency (such as Zod or Jalaali) must be pure JavaScript and bundled into a standalone IIFE via `esbuild`.
- All entry points (`doGet`, `doPost`, `setupSpreadsheet`) must be exposed as top-level function declarations in the global scope.

## 2. Concurrency, Locks & Idempotency
- Every write to Google Sheets must be wrapped in `LockService.getScriptLock()`. Attempt lock acquisition for up to 20,000ms.
- Always check `CacheService.getScriptCache()` using `s:<submissionId>` to avoid duplicate row insertion when clients retry.
- In Telegram webhook processing, deduplicate updates by caching `u:<update_id>` for 24 hours.

## 3. Data Integrity & Formatting
- Phone numbers (e.g., `0912...`) and National IDs (e.g., `001...`) contain significant leading zeros. Store them with explicit string format (`@`) to prevent Google Sheets from truncating leading zeros.
- Date fields must record both Persian display format (e.g., `1405/08/17`) and ISO UTC timestamp.
- Always set sheet tabs to Right-to-Left orientation (`sheet.setRightToLeft(true)`).

## 4. Quota Safety & Error Handling
- Never block the execution thread beyond 30 seconds.
- Catch all Telegram notification dispatch errors so that failed notifications never fail a valid user form submission.
- Webhook endpoints must respond immediately. Telegram commands requiring heavy document generation (e.g., `.xlsx` export) must first issue `sendChatAction('upload_document')`.

