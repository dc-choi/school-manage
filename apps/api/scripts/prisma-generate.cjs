#!/usr/bin/env node
/* eslint-disable */
// prisma generate + types.ts 후처리를 동기적으로 실행하고 결과를 검증한다.
// CI에서 race 또는 buffering으로 후처리가 누락되는 케이스 방지.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiRoot = path.join(__dirname, '..');
const typesFile = path.join(apiRoot, 'src/infrastructure/database/generated/types.ts');

execSync('prisma generate', { stdio: 'inherit', cwd: apiRoot });

if (!fs.existsSync(typesFile)) {
    console.error(`[prisma:generate] ERROR: ${typesFile} not found after prisma generate`);
    process.exit(1);
}

let content = fs.readFileSync(typesFile, 'utf8');
const before = content.length;
content = content.replaceAll('_Id', 'id');
fs.writeFileSync(typesFile, content);

if (!content.includes('export type DB =')) {
    console.error('[prisma:generate] ERROR: DB type export missing in generated types.ts');
    console.error(`[prisma:generate] file size: ${content.length} chars (was ${before} before postprocess)`);
    console.error('[prisma:generate] head:\n' + content.slice(0, 500));
    process.exit(1);
}

console.log(`[prisma:generate] postprocess complete (${content.length} chars, DB export verified)`);
