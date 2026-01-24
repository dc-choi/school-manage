import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 1. NODE_ENV 강제 설정
process.env.NODE_ENV = 'test';

// 2. window.matchMedia 모킹 (jsdom에서 미지원)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
