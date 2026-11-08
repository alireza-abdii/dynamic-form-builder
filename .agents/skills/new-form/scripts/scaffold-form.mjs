#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
    execSync
} from 'node:child_process';

const formId = process.argv[2];
if (!formId) {
    console.error('Usage: node scaffold-form.mjs <formId>');
    process.exit(1);
}

const rootDir = process.cwd();
const formPath = path.join(rootDir, 'shared', 'forms', `${formId}.json`);

if (!fs.existsSync(formPath)) {
    console.error(`Error: Form file does not exist at ${formPath}`);
    process.exit(1);
}

console.log(`[scaffold-form] Validating form: ${formId}...`);
try {
    execSync('npm run forms:validate', {
        stdio: 'inherit',
        cwd: rootDir
    });
    console.log(`[scaffold-form] Syncing registry...`);
    execSync('npm run forms:sync', {
        stdio: 'inherit',
        cwd: rootDir
    });
    console.log(`[scaffold-form] Typechecking...`);
    execSync('npm run typecheck', {
        stdio: 'inherit',
        cwd: rootDir
    });
    console.log(`\n✅ Form ${formId} successfully scaffolded, registered, and type-checked!`);
} catch (error) {
    console.error(`\n❌ Error during form scaffolding:`, error.message);
    process.exit(1);
}
