# Global Engineering Rules & Architectural Directives

Welcome to the **Dynamic Form Builder Ecosystem**.
All AI coding agents and human engineers must adhere strictly to these non-negotiable rules.

---

## 1. Zero-Cost & Open-Source Mandate
- **Strictly 100% Free Tools Only:** Never propose, import, or introduce any dependency, API, or hosting service that requires a paid subscription, credit card entry, or trial that expires into a paid tier.
- **Permissive Open-Source Licensing:** All runtime packages must be licensed under MIT, Apache-2.0, BSD, or ISC.
- **Zero-Cost Hosting Platforms:** Frontend must remain deployable to Cloudflare Pages (primary recommendation), GitHub Pages, or Vercel Hobby (non-commercial only). Backend is 100% hosted on free Google Sheets + Google Apps Script (GAS).

---

## 2. Architecture & Single Source of Truth
- **Forms Single Source of Truth:** All form definitions live exclusively under `shared/forms/<formId>.json`.
- **Never Hand-Edit Generated Code:** Never manually edit `shared/src/generated/*`. Always run `npm run forms:sync` to regenerate schemas, types, and registry entries.
- **Shared Code Between Frontend & GAS:** The meta-schema, field definitions, Jalali converters, Persian validation messages, and Zod schema builder live in `@fb/shared` and are bundled into both `frontend` and `gas-backend`.

---

## 3. Strict TypeScript Standards
- **Zero `any` Policy:** `any` is strictly prohibited. Use `unknown` with type narrowing, discriminated unions, or Zod schemas.
- **No `@ts-ignore` or `@ts-nocheck`:** Use typed assertions or refine types properly.
- **Strict TS Flags Enforced:** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`.
- **Exhaustive Type Checks:** All switches over discriminated unions must implement exhaustive checking via an `assertNever(value: never): never` utility.

---

## 4. RTL-First UI/UX & Persian Localization
- **Native RTL Layout:** The document and component hierarchy are RTL by default (`dir="rtl"`).
- **Logical Tailwind Properties Only:** Always use logical Tailwind CSS classes:
  - Margins: `ms-*` (margin-inline-start), `me-*` (margin-inline-end) — **FORBIDDEN:** `ml-*`, `mr-*`
  - Paddings: `ps-*`, `pe-*` — **FORBIDDEN:** `pl-*`, `pr-*`
  - Positioning: `start-*`, `end-*` — **FORBIDDEN:** `left-*`, `right-*`
  - Text alignment: `text-start`, `text-end` — **FORBIDDEN:** `text-left`, `text-right`
- **LTR Islands:** Phone numbers, national ID numbers, and email inputs must be isolated inside `dir="ltr"` wrappers with `text-end` or `text-start` for correct character progression.
- **Font & Typography:** Use `Vazirmatn Variable` self-hosted via `@fontsource-variable/vazirmatn`. Do not rely on external CDN links (e.g. Google Fonts CDN) that might be blocked or introduce latency.
- **Number Localization:** All user-facing numbers and date displays must use Persian digits (`fa-IR`).
- **Input Normalization:** Always accept Persian (`۰-۹`) and Arabic (`٠-٩`) numerals in inputs and normalize them to ASCII (`0-9`) before validation.
- **Validation Messages:** Every error message must be in natural, polite Persian and sourced from `shared/src/messages.fa.ts`.

---

## 5. Google Apps Script (GAS) Webhook & CORS Contract
- **CORS Preflight Bypass:** Google Apps Script web apps do **not** support CORS preflight (`OPTIONS` requests). Therefore, all client-side `fetch` requests to GAS **MUST** use:
  ```ts
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  }
  ```
  Sending `application/json` or custom HTTP headers is **strictly forbidden** because it triggers a preflight request that will fail.
- **Redirect Handling:** GAS web apps return HTTP 302 redirects to `googleusercontent.com`. Client requests must allow following redirects (`redirect: 'follow'`).
- **Telegram Webhook Response:** For Telegram bot webhook calls, GAS must respond with `HtmlService.createHtmlOutput('ok')` (HTTP 200) instead of `ContentService.createTextOutput`, because Telegram retries updates on 302 redirects!

---

## 6. Secrets & Deployment Safety
- **No Secrets in Code:** Never commit `TELEGRAM_BOT_TOKEN`, `WEBHOOK_SECRET`, `SPREADSHEET_ID`, or `.clasprc.json`.
- **Clasp Deployment Safety:** Never run `clasp deploy` without `--deploymentId`. Creating a new deployment generates a new URL, breaking existing links. Always use `npm run gas:deploy` which runs `clasp update-deployment <GAS_DEPLOYMENT_ID>`.
- **Script Properties:** Configuration in GAS must be read via `PropertiesService.getScriptProperties()`.

---

## 7. Definition of Done (DoD)
Before completing any task or claiming an implementation is ready, the agent must run and verify:
1. `npm run forms:validate` (passes all JSON form validations)
2. `npm run typecheck` (zero TypeScript errors across all workspaces)
3. `npm run lint` (zero lint or physical-direction Tailwind errors)
4. `npm test` (all automated tests pass)
5. `npm run build` (both frontend and GAS bundle build cleanly)

