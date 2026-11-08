import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formDefinitionSchema } from '../src/definition.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formsDir = path.resolve(__dirname, '../forms');

if (!fs.existsSync(formsDir)) {
  console.error(`Forms directory not found: ${formsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(formsDir).filter((file) => file.endsWith('.json'));

if (files.length === 0) {
  console.warn('⚠️ Warning: No forms found in shared/forms');
  process.exit(0);
}

let hasErrors = false;
const seenFormIds = new Set<string>();

console.log(`[validate-forms] Checking ${files.length} form definition(s)...`);

for (const file of files) {
  const filePath = path.join(formsDir, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    const parsed = formDefinitionSchema.safeParse(json);
    if (!parsed.success) {
      console.error(`❌ Validation failed in ${file}:`, JSON.stringify(parsed.error.format(), null, 2));
      hasErrors = true;
      continue;
    }

    const form = parsed.data;

    // Check filename matches ID
    const expectedName = `${form.id}.json`;
    if (file !== expectedName) {
      console.error(`❌ Filename mismatch: File is "${file}" but form ID is "${form.id}". File should be "${expectedName}".`);
      hasErrors = true;
    }

    // Check unique form IDs
    if (seenFormIds.has(form.id)) {
      console.error(`❌ Duplicate form ID "${form.id}" found in ${file}.`);
      hasErrors = true;
    }
    seenFormIds.add(form.id);

    // Check unique field keys
    const seenKeys = new Set<string>();
    for (const field of form.fields) {
      if (seenKeys.has(field.key)) {
        console.error(`❌ Duplicate field key "${field.key}" in form "${form.id}".`);
        hasErrors = true;
      }
      seenKeys.add(field.key);

      // Check unique option values in select/multiselect
      if (field.type === 'select' || field.type === 'multiselect') {
        const seenOptValues = new Set<string>();
        for (const opt of field.options) {
          if (seenOptValues.has(opt.value)) {
            console.error(`❌ Duplicate option value "${opt.value}" in field "${field.key}" of form "${form.id}".`);
            hasErrors = true;
          }
          seenOptValues.add(opt.value);
        }
      }
    }

    console.log(`  ✓ ${file} (v${form.version}, ${form.fields.length} fields) valid.`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error reading or parsing ${file}:`, msg);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ One or more forms failed validation.');
  process.exit(1);
} else {
  console.log('✅ All form definitions are valid!');
}

