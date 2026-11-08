#!/usr/bin/env node
import 'dotenv/config';

const gasUrl = process.env.GAS_WEB_APP_URL || process.env.VITE_GAS_URL;

if (!gasUrl || gasUrl.includes('AKfycbxxxx')) {
  console.log('[smoke-test] ℹ️ GAS_WEB_APP_URL is not yet set in .env. Skipping live smoke test.');
  process.exit(0);
}

console.log(`[smoke-test] Testing GAS deployment health at ${gasUrl}...`);

try {
  const healthUrl = `${gasUrl}?action=health`;
  const res = await fetch(healthUrl, { redirect: 'follow' });
  const data = await res.json();
  console.log('[smoke-test] Response:', data);
  if (data.ok) {
    console.log('✅ [smoke-test] Google Apps Script deployment is healthy!');
  } else {
    console.error('❌ [smoke-test] Deployment reported an error:', data);
    process.exit(1);
  }
} catch (err) {
  console.error('❌ [smoke-test] Network or parse failure:', err.message);
  process.exit(1);
}

