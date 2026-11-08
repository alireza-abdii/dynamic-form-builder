import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const outdir = 'dist';
if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir, {
        recursive: true
    });
}

console.log('[gas-backend] Bundling TypeScript with esbuild...');

await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/Code.js',
    format: 'iife',
    globalName: 'App',
    target: 'es2019',
    minify: false,
    sourcemap: false
});

// Append top-level entrypoints
const footer = fs.readFileSync('gas-entry-footer.js', 'utf-8');
fs.appendFileSync('dist/Code.js', '\n' + footer);

// Copy manifest
fs.copyFileSync('appsscript.json', 'dist/appsscript.json');

console.log('✅ [gas-backend] Successfully built dist/Code.js and copied appsscript.json');
