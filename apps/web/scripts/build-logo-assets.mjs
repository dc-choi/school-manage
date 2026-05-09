#!/usr/bin/env node
// 위클리스쿨 로고 자산 빌드 스크립트
// - 입력:
//   - apps/web/public/logo.svg         (워드마크 + 웃는 ◎ + 별 + sparkle)
//   - apps/web/public/logo-symbol.svg  (Symbol-only — ◎ 메인, favicon/maskable 용)
//   - apps/web/scripts/fonts/Pretendard-ExtraBold.otf (워드마크 폰트, 결정적 렌더)
// - 출력 6개:
//   - favicon.png (48×48)                  ← logo-symbol (작은 사이즈 가독성)
//   - apple-touch-icon.png (180×180)       ← logo (iOS 홈 식별성)
//   - icons/icon-192.png                   ← logo
//   - icons/icon-512.png                   ← logo
//   - icons/icon-512-maskable.png          ← logo-symbol (Android adaptive 가장자리 안전)
//   - og-image.png (1200×630)              ← logo + 한글 텍스트
//
// 실행: pnpm --filter @school/web build:logo
// 브랜드 레퍼런스(docs/content/brand/assets/logo-reference.jpg)는 사용자가 직접 디자인한
// 마스터이므로 자동 export 대상 아님.
import { Resvg } from '@resvg/resvg-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, '..');
const PUBLIC = resolve(WEB_ROOT, 'public');
const FONT_PATH = resolve(__dirname, 'fonts', 'Pretendard-ExtraBold.otf');
const SRC_LOGO = resolve(PUBLIC, 'logo.svg');
const SRC_SYMBOL = resolve(PUBLIC, 'logo-symbol.svg');

const BRAND = {
    cream: '#FAFAF9',
    indigo: '#4F46E5',
};

/** @type {import('@resvg/resvg-js').ResvgRenderOptions} */
const baseFontOpt = {
    font: {
        loadSystemFonts: false,
        fontFiles: [FONT_PATH],
        defaultFontFamily: 'Pretendard',
    },
};

const renderSvg = (svg, extraOpt = {}) => {
    /** @type {import('@resvg/resvg-js').ResvgRenderOptions} */
    const opt = {
        background: BRAND.cream,
        ...baseFontOpt,
        ...extraOpt,
    };
    const buffer = new Resvg(svg, opt).render().asPng();
    if (buffer.byteLength === 0) {
        throw new Error('Resvg가 0바이트 PNG를 반환했습니다 (SVG 파싱/렌더 실패 가능)');
    }
    return buffer;
};

const renderSquare = (svg, size) => renderSvg(svg, { fitTo: { mode: 'width', value: size } });

// maskable: 안전 영역 80% — Symbol SVG를 0.8 스케일로 중앙 배치한 래퍼 SVG로 감싼다.
const renderMaskable = (symbolSvg, size) => {
    const inner = symbolSvg.replace(/<\?xml[^>]*\?>\s*/, '').replace(/<\/?svg[^>]*>/g, '');
    const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="${BRAND.cream}" />
  <g transform="translate(102.4, 102.4) scale(0.8)">${inner}</g>
</svg>`;
    return renderSvg(wrapped, { fitTo: { mode: 'width', value: size } });
};

// OG 이미지 1200×630 — 좌측 정사각 로고 + 우측 한글 텍스트
const renderOg = (logoSvg) => {
    const innerLogo = logoSvg
        .replace(/<\?xml[^>]*\?>\s*/, '')
        .replace(
            /<svg[^>]*>/,
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">'
        );
    const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${BRAND.cream}" />
  <g transform="translate(80, 80) scale(0.4492)">${innerLogo}</g>
  <text x="600" y="280" font-family="Pretendard" font-weight="900" font-size="68" fill="${BRAND.indigo}">주일학교 출석부</text>
  <text x="600" y="345" font-family="Pretendard" font-weight="600" font-size="32" fill="${BRAND.indigo}" fill-opacity="0.7">매주 주일, 모두의 출석부</text>
  <text x="600" y="415" font-family="Pretendard" font-weight="500" font-size="26" fill="${BRAND.indigo}" fill-opacity="0.5">weekly-school.site</text>
</svg>`;
    return renderSvg(og);
};

const writePng = async (relativePath, buffer) => {
    const out = resolve(PUBLIC, relativePath);
    try {
        await mkdir(dirname(out), { recursive: true });
    } catch (err) {
        throw new Error(`디렉토리 생성 실패 (${dirname(out)}): ${err.message}`);
    }
    await writeFile(out, buffer);
    console.log(`  wrote ${relativePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
};

const main = async () => {
    console.log(`logo:   ${SRC_LOGO}`);
    console.log(`symbol: ${SRC_SYMBOL}`);
    console.log(`font:   ${FONT_PATH}`);
    const [logoSvg, symbolSvg] = await Promise.all([readFile(SRC_LOGO, 'utf8'), readFile(SRC_SYMBOL, 'utf8')]);

    console.log('rendering favicon (Symbol-only, 48×48)...');
    await writePng('favicon.png', renderSquare(symbolSvg, 48));

    console.log('rendering apple-touch-icon (180×180, 워드마크 포함)...');
    await writePng('apple-touch-icon.png', renderSquare(logoSvg, 180));

    console.log('rendering PWA icons (192·512, 워드마크 포함)...');
    await writePng('icons/icon-192.png', renderSquare(logoSvg, 192));
    await writePng('icons/icon-512.png', renderSquare(logoSvg, 512));

    console.log('rendering maskable (Symbol-only + safe area 80%)...');
    await writePng('icons/icon-512-maskable.png', renderMaskable(symbolSvg, 512));

    console.log('rendering OG image (1200×630)...');
    await writePng('og-image.png', renderOg(logoSvg));

    console.log('done.');
};

main().catch((err) => {
    console.error('build:logo failed:', err);
    process.exit(1);
});
