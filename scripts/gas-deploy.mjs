#!/usr/bin/env node
import dotenv from 'dotenv';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const rawDeploymentId = process.env.GAS_DEPLOYMENT_ID || '';
const deploymentId = rawDeploymentId.split('@')[0].trim();

console.log('=====================================================');
console.log('🚀 [gas-deploy] Starting Safe Google Apps Script Deployment');
console.log('=====================================================');

try {
  console.log('\nStep 1: Validating Form Definitions...');
  execSync('npm run forms:validate', {
    stdio: 'inherit',
    cwd: rootDir
  });

  console.log('\nStep 2: Building Backend Bundle via esbuild...');
  execSync('npm run gas:build', {
    stdio: 'inherit',
    cwd: rootDir
  });

  if (!deploymentId || deploymentId.includes('AKfycbxxxx')) {
    console.warn('\n⚠️ [gas-deploy] GAS_DEPLOYMENT_ID is not configured in .env.');
    console.warn('   Once you run clasp login and create your initial deployment,');
    console.warn('   add your deployment ID to .env to enable automated updates.');
    console.log('\nTo create your initial deployment:');
    console.log('  cd gas-backend && npx clasp login && npx clasp push && npx clasp deploy --description "Initial release"');
    process.exit(0);
  }

  console.log('\nStep 3: Pushing code to Google Apps Script...');
  execSync('npx clasp push --force', {
    stdio: 'inherit',
    cwd: path.join(rootDir, 'gas-backend')
  });

  console.log(`\nStep 4: Updating deployment (${deploymentId})...`);
  const desc = `Automated update ${new Date().toISOString()}`;
  execSync(`npx clasp deploy --deploymentId "${deploymentId}" --description "${desc}"`, {
    stdio: 'inherit',
    cwd: path.join(rootDir, 'gas-backend')
  });

  console.log('\nStep 5: Verifying deployment health...');
  execSync('node scripts/smoke-test.mjs', {
    stdio: 'inherit',
    cwd: rootDir
  });

  console.log('\n✅ [gas-deploy] Deployment completed successfully without mutating web app URL!');
} catch (err) {
  console.error('\n❌ [gas-deploy] Deployment failed:', err.message);
  process.exit(1);
}
