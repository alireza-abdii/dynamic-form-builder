---
name: deploy-gas
description: >-
  Builds and safely deploys the Google Apps Script backend using @google/clasp.
  Ensures code is bundled with esbuild, pushed, and updates the existing deployment ID
  without mutating the public web app URL. Use when updating GAS or backend handlers.
---

# Deploy Google Apps Script Backend

Follow these steps to deploy or update the serverless backend:

## Prerequisites
1. Ensure the user has logged in once via clasp:
   ```powershell
   npx clasp login
   ```
2. Verify that `GAS_DEPLOYMENT_ID` and `GAS_WEB_APP_URL` are set in `.env`.

## Deployment Procedure
1. Run the safe deployment orchestrator:
   ```powershell
   npm run gas:deploy
   ```
   This script executes:
   - Form JSON validation (`npm run forms:validate`)
   - Backend bundle compilation via esbuild (`npm run gas:build`)
   - Clasp push (`clasp push --force`)
   - Clasp deployment update (`clasp update-deployment <GAS_DEPLOYMENT_ID>`)
   - Automated health check (`smoke-test.mjs`)

## Troubleshooting
- **CORS / Preflight issues:** Verify that frontend requests use `Content-Type: text/plain;charset=utf-8`.
- **401 Unauthorized / Scope errors:** Open the Apps Script editor and run `setupCheck` to authorize any updated OAuth scopes.
- **Telegram Webhook Retries:** Verify GAS responds with HTTP 200 via `HtmlService.createHtmlOutput('ok')`.

