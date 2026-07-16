const { globSync } = require('node:fs');
const path = require('node:path');

const apiDir = path.join(__dirname, '..');
const compiledFiles = globSync('src/**/*.js', { cwd: apiDir }).sort();

if (compiledFiles.length > 0) {
    console.error('[source-check] apps/api/src에 컴파일된 JavaScript가 남아 있습니다:');
    for (const file of compiledFiles) {
        console.error(`- ${file}`);
    }
    console.error('[source-check] 위 파일을 삭제한 뒤 테스트를 다시 실행하세요.');
    process.exit(1);
}
