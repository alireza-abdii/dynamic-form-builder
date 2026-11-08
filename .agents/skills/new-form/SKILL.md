---
name: new-form
description: >-
  Generates a new dynamic form end-to-end from a natural-language field description
  (in Persian or English): creates shared/forms/<formId>.json, validates it, regenerates
  the registry (auto-registering the /f/<formId> route), redeploys the GAS backend,
  and outputs the ready-to-share web URL and Telegram Mini App deep link.
  Use when the user asks to create, add, or build a new form or survey. Also triggered by /new-form.
---

# New Form Generator Skill

Follow these steps to create and register a new form:

## 1. Parse & Plan Fields
- Review the user's field requirements.
- Match each field to a type described in [references/field-types.md](./references/field-types.md).
- Infer appropriate presets:
  - Phone / mobile: `preset: "iran-mobile"`
  - National ID (کد ملی): `preset: "national-id"`
  - Dates: `jalali-date` with bounds (e.g. `maxDate: "today"`)
- Ensure all labels, placeholders, and hints are in natural, polite Persian.
- If choices for a select or multiselect field are missing or ambiguous, ask the user to clarify before writing the file.

## 2. Derive Form ID
- Create a lowercase kebab-case ASCII slug of at most 40 characters (e.g., `employee-satisfaction`, `lunch-order`).
- Must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

## 3. Create the Form Definition
- Create `shared/forms/<formId>.json` based on [resources/form-template.json](./resources/form-template.json).
- Ensure required keys (`id`, `version`, `title`, `fields`, etc.) are populated.

## 4. Scaffold, Validate & Sync
- Run the scaffolding script from the workspace root:
  ```powershell
  node .agents/skills/new-form/scripts/scaffold-form.mjs <formId>
  ```
- If any validation or typecheck errors occur, inspect the output, fix `shared/forms/<formId>.json`, and rerun.

## 5. Deploy Backend (GAS)
- Ask the user for confirmation to update the Google Apps Script deployment.
- Upon approval, run:
  ```powershell
  npm run gas:deploy
  ```

## 6. Output Results
Present the user with a summary table of the fields and the generated access links:
- **Web Form URL:** `{VITE_PUBLIC_BASE_URL}/f/<formId>`
- **Telegram Mini App Link:** `https://t.me/{BOT_USERNAME}/{TMA_SHORTNAME}?startapp=<formId>`
- **Admin Excel Export Command:** `/export <formId>`

