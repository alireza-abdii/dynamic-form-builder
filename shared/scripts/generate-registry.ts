import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formsDir = path.resolve(__dirname, '../forms');
const generatedDir = path.resolve(__dirname, '../src/generated');

if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

const files = fs.readdirSync(formsDir).filter((file) => file.endsWith('.json'));

console.log(`[generate-registry] Generating registry for ${files.length} form(s)...`);

const formsMap: Record<string, unknown> = {};
const importStatements: string[] = [];
const lazyMapEntries: string[] = [];
const directMapEntries: string[] = [];

for (const file of files) {
  const filePath = path.join(formsDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  const formId = json.id;
  const varName = formId.replace(/[^a-zA-Z0-9]/g, '_');

  importStatements.push(`import ${varName}Data from '../../forms/${file}';`);
  directMapEntries.push(`  '${formId}': ${varName}Data as unknown as FormDefinition,`);
  lazyMapEntries.push(`  '${formId}': () => import('../../forms/${file}').then(m => m.default as unknown as FormDefinition),`);
}

const registryTsContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run 'npm run forms:sync' to regenerate.

import type { FormDefinition } from '../definition.schema.js';
${importStatements.join('\n')}

/**
 * Direct mapping of all form definitions (used by backend/GAS).
 */
export const FORM_REGISTRY: Record<string, FormDefinition> = {
${directMapEntries.join('\n')}
};

/**
 * Lazy async loader mapping for frontend code-splitting.
 */
export const LAZY_FORM_LOADERS: Record<string, () => Promise<FormDefinition>> = {
${lazyMapEntries.join('\n')}
};

export const AVAILABLE_FORM_IDS = [
${files.map((f) => `  '${path.basename(f, '.json')}'`).join(',\n')}
] as const;

export type FormId = typeof AVAILABLE_FORM_IDS[number];
`;

fs.writeFileSync(path.join(generatedDir, 'registry.ts'), registryTsContent, 'utf-8');

// Generate JSON Schema for form definitions
const jsonSchemaContent = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FormDefinition",
  "type": "object",
  "required": ["id", "version", "title", "fields"],
  "properties": {
    "$schema": { "type": "string" },
    "id": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$", "maxLength": 40 },
    "version": { "type": "integer", "minimum": 1 },
    "title": { "type": "string", "minLength": 1 },
    "description": { "type": "string" },
    "status": { "type": "string", "enum": ["open", "closed"] },
    "closesAt": { "type": ["string", "null"] },
    "access": { "type": "string", "enum": ["public", "telegram"] },
    "notifyAdmins": { "type": "boolean" },
    "submitLabel": { "type": "string" },
    "successMessage": { "type": "string" },
    "fields": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["key", "type", "label"],
        "properties": {
          "key": { "type": "string", "pattern": "^[a-z][a-zA-Z0-9]{0,39}$" },
          "type": { "type": "string", "enum": ["text", "textarea", "number", "tel", "select", "multiselect", "jalali-date"] },
          "label": { "type": "string", "minLength": 1 },
          "required": { "type": "boolean" },
          "hint": { "type": "string" },
          "placeholder": { "type": "string" },
          "minLength": { "type": "integer", "minimum": 0 },
          "maxLength": { "type": "integer", "minimum": 1 },
          "preset": { "type": "string", "enum": ["iran-mobile", "national-id", "email", "postal-code", "digits-only"] },
          "min": { "type": "number" },
          "max": { "type": "number" },
          "integer": { "type": "boolean" },
          "minItems": { "type": "integer", "minimum": 0 },
          "maxItems": { "type": "integer", "minimum": 1 },
          "minDate": { "type": "string" },
          "maxDate": { "type": "string" },
          "options": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["value", "label"],
              "properties": {
                "value": { "type": "string" },
                "label": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
};

fs.writeFileSync(
  path.join(generatedDir, 'form-definition.json-schema.json'),
  JSON.stringify(jsonSchemaContent, null, 2),
  'utf-8'
);

console.log('✅ [generate-registry] Generated registry.ts and form-definition.json-schema.json');

