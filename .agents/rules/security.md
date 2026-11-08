# Security & Secrets Protection Rules

## 1. Sensitive Patterns & Zero-Leakage Policy
The following tokens and secrets must NEVER be committed to Git or outputted in client-side bundles:
1. **Telegram Bot Tokens:** Pattern `\d{8,10}:[A-Za-z0-9_-]{35}`
2. **Google OAuth Tokens / Refresh Tokens:** Pattern `1//[A-Za-z0-9_-]+` or `.clasprc.json` files
3. **Webhook Secrets:** Any high-entropy query parameters or private keys

## 2. Environment Variables Segregation
- **Client-Side (Vite):** Only variables prefixed with `VITE_` are bundled into the frontend. Never expose admin chat IDs, webhook secrets, or bot tokens to `VITE_` variables.
- **GAS Backend:** Secrets live in Google Apps Script `Script Properties` (stored securely in Google Cloud infrastructure per script project).

## 3. Clasp Deployment Immutability
- Every Apps Script web app deployment has a unique ID (`AKfycb...`).
- When redeploying with clasp, NEVER execute `clasp create-deployment` after initial setup.
- Always execute `clasp update-deployment <GAS_DEPLOYMENT_ID>` so that the public web app endpoint remains unchanged.

