import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const publicDir = resolve(__dirname, '../public');

describe('robots.txt', () => {
    const content = readFileSync(resolve(publicDir, 'robots.txt'), 'utf-8');

    it('공개 경로를 Allow한다', () => {
        expect(content).toContain('Allow: /landing');
        expect(content).toContain('Allow: /login');
        expect(content).toContain('Allow: /signup');
    });

    it('인증 필요 경로를 Disallow한다', () => {
        expect(content).toContain('Disallow: /groups');
        expect(content).toContain('Disallow: /students');
        expect(content).toContain('Disallow: /attendance');
        expect(content).toContain('Disallow: /settings');
    });

    it('API 경로를 Disallow한다', () => {
        expect(content).toContain('Disallow: /api/');
    });

    it('Sitemap URL을 포함한다', () => {
        expect(content).toMatch(/^Sitemap: https:\/\/.+\/sitemap\.xml$/m);
    });
});

describe('sitemap.xml', () => {
    const content = readFileSync(resolve(publicDir, 'sitemap.xml'), 'utf-8');

    it('유효한 XML 선언을 포함한다', () => {
        expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('sitemaps.org 네임스페이스를 사용한다', () => {
        expect(content).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    });

    it('공개 페이지 3개의 URL을 포함한다', () => {
        const locMatches = content.match(/<loc>/g);
        expect(locMatches).toHaveLength(3);
        expect(content).toContain('/landing</loc>');
        expect(content).toContain('/login</loc>');
        expect(content).toContain('/signup</loc>');
    });

    it('랜딩 페이지의 priority가 가장 높다', () => {
        const landingSection = content.slice(
            content.indexOf('/landing'),
            content.indexOf('</url>', content.indexOf('/landing'))
        );
        expect(landingSection).toContain('<priority>1.0</priority>');
    });
});
