#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

fs.mkdirSync(distDir, { recursive: true });

console.log('[build] compiling TypeScript...');
execSync('npx tsc', { stdio: 'inherit', cwd: root });

console.log('[build] inlining pdf-lib into ui.html...');
const uiTemplate = fs.readFileSync(path.join(root, 'ui.html'), 'utf8');
const pdfLib = fs.readFileSync(path.join(root, 'lib', 'pdf-lib.min.js'), 'utf8');

const injected = uiTemplate.replace(
  /<!-- @inject:lib\/pdf-lib\.min\.js -->/,
  `<script>${pdfLib}</script>`
);

if (injected === uiTemplate) {
  console.error('[build] ERROR: injection marker not found in ui.html');
  process.exit(1);
}

fs.writeFileSync(path.join(distDir, 'ui.html'), injected);

console.log('[build] copying manifest and code...');
fs.copyFileSync(path.join(root, 'manifest.json'), path.join(distDir, 'manifest.json'));
fs.copyFileSync(path.join(root, 'code.js'), path.join(distDir, 'code.js'));

console.log('[build] done -> dist/');
