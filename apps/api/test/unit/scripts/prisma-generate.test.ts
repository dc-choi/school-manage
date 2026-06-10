import { spawnSync } from 'child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const requireCjs = createRequire(import.meta.url);
const { acquireLock, releaseLock, stealLock, isLockHolderAlive, writeFileAtomicSync, postprocessTypes, hasDbExport } =
    requireCjs('../../../scripts/prisma-generate.cjs');

const FAST = { timeoutMs: 300, pollMs: 30 };

const spawnDeadPid = (): number => {
    const dead = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
    if (typeof dead.pid !== 'number') {
        throw new Error('dead pid spawn 실패');
    }
    return dead.pid;
};

let workDir: string;
let lockFile: string;

beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'prisma-generate-test-'));
    lockFile = join(workDir, '.lock');
});

afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
});

describe('postprocessTypes', () => {
    it('prisma-kysely 산출물의 _Id 필드를 id로 치환한다 (TC-1)', () => {
        const raw = '    _Id: Generated<number>;\n    parishId: number;';
        expect(postprocessTypes(raw)).toBe('    id: Generated<number>;\n    parishId: number;');
    });

    it('치환 대상이 없으면 원본을 보존한다', () => {
        const content = 'export type DB = { account: Account };';
        expect(postprocessTypes(content)).toBe(content);
    });
});

describe('hasDbExport', () => {
    it('DB export가 있으면 true (TC-1)', () => {
        expect(hasDbExport('export type DB = { account: Account };')).toBe(true);
    });

    it('DB export가 없으면 false (TC-E2)', () => {
        expect(hasDbExport('truncated content')).toBe(false);
    });
});

describe('writeFileAtomicSync', () => {
    it('대상 파일을 새 내용으로 교체하고 temp 파일을 남기지 않는다 (TC-2)', () => {
        const target = join(workDir, 'types.ts');
        writeFileSync(target, 'old content');

        writeFileAtomicSync(target, 'new content');

        expect(readFileSync(target, 'utf8')).toBe('new content');
        expect(readdirSync(workDir)).toEqual(['types.ts']);
    });

    it('대상 파일이 없어도 새로 생성한다', () => {
        const target = join(workDir, 'types.ts');

        writeFileAtomicSync(target, 'fresh');

        expect(readFileSync(target, 'utf8')).toBe('fresh');
    });
});

describe('acquireLock / releaseLock', () => {
    it('획득하면 자기 pid가 기록되고 temp 파일이 남지 않는다 (TC-3)', () => {
        acquireLock(lockFile, FAST);

        expect(readFileSync(lockFile, 'utf8')).toBe(String(process.pid));
        expect(readdirSync(workDir)).toEqual(['.lock']);
        releaseLock(lockFile);
        expect(existsSync(lockFile)).toBe(false);
    });

    it('획득 후 해제하면 재획득 가능하다 (TC-3)', () => {
        acquireLock(lockFile, FAST);
        releaseLock(lockFile);
        acquireLock(lockFile, FAST);
        releaseLock(lockFile);
    });

    it('생존 프로세스가 보유 중이면 타임아웃까지 대기 후 에러를 던진다 (TC-3, TC-E1)', () => {
        acquireLock(lockFile, FAST);
        try {
            let caught: unknown;
            try {
                acquireLock(lockFile, FAST);
            } catch (err) {
                caught = err;
            }
            expect(caught).toBeInstanceOf(Error);
            if (caught instanceof Error) {
                expect(caught.message).toMatch(/lock timeout/);
                expect(caught.message).toContain(lockFile);
            }
        } finally {
            releaseLock(lockFile);
        }
    });

    it('죽은 보유자의 락은 즉시 회수하고 자기 pid를 기록한다 (TC-4)', () => {
        writeFileSync(lockFile, String(spawnDeadPid()));

        acquireLock(lockFile, FAST);

        expect(readFileSync(lockFile, 'utf8')).toBe(String(process.pid));
        releaseLock(lockFile);
    });

    it('보유자 판별 불가 + mtime이 stale 임계 초과면 회수한다 (TC-4)', () => {
        writeFileSync(lockFile, 'garbage');
        const oldDate = new Date(Date.now() - 10 * 60 * 1000);
        utimesSync(lockFile, oldDate, oldDate);

        acquireLock(lockFile, FAST);

        expect(readFileSync(lockFile, 'utf8')).toBe(String(process.pid));
        releaseLock(lockFile);
    });

    it('보유자 판별 불가 + mtime이 최신이면 회수하지 않고 대기한다 (TC-E1)', () => {
        writeFileSync(lockFile, 'garbage');

        expect(() => acquireLock(lockFile, FAST)).toThrowError(/lock timeout/);
        expect(readFileSync(lockFile, 'utf8')).toBe('garbage');
    });

    it('자기 소유가 아닌 락은 release해도 삭제되지 않는다', () => {
        writeFileSync(lockFile, 'someone-else');

        releaseLock(lockFile);

        expect(existsSync(lockFile)).toBe(true);
        expect(readFileSync(lockFile, 'utf8')).toBe('someone-else');
    });

    it('락 부모 디렉토리가 없으면 생성한다', () => {
        const nested = join(workDir, 'nested', 'deep', '.lock');
        acquireLock(nested, FAST);
        releaseLock(nested);
    });
});

describe('stealLock', () => {
    it('관측 pid와 현재 pid가 같으면 락을 제거한다 (TC-4)', () => {
        writeFileSync(lockFile, 'garbage');

        stealLock(lockFile, 'garbage');

        expect(existsSync(lockFile)).toBe(false);
        expect(readdirSync(workDir)).toEqual([]);
    });

    it('관측 후 보유자가 바뀐 락은 훔치지 않고 복원한다', () => {
        writeFileSync(lockFile, String(process.pid));

        stealLock(lockFile, String(spawnDeadPid()));

        expect(existsSync(lockFile)).toBe(true);
        expect(readFileSync(lockFile, 'utf8')).toBe(String(process.pid));
        expect(readdirSync(workDir)).toEqual(['.lock']);
    });

    it('락이 이미 사라졌으면 조용히 반환한다', () => {
        stealLock(lockFile, null);
        expect(readdirSync(workDir)).toEqual([]);
    });
});

describe('isLockHolderAlive', () => {
    it('자기 자신의 pid는 생존으로 판정한다', () => {
        writeFileSync(lockFile, String(process.pid));
        expect(isLockHolderAlive(lockFile)).toBe(true);
    });

    it('죽은 pid는 사망으로 판정한다', () => {
        writeFileSync(lockFile, String(spawnDeadPid()));
        expect(isLockHolderAlive(lockFile)).toBe(false);
    });

    it('락 파일이 없거나 내용이 숫자가 아니면 판별 불가(null)', () => {
        expect(isLockHolderAlive(lockFile)).toBe(null);
        writeFileSync(lockFile, 'garbage');
        expect(isLockHolderAlive(lockFile)).toBe(null);
    });
});
