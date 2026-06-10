#!/usr/bin/env node
// @ts-check
/* eslint-disable */
// prisma generate + types.ts 후처리를 동기적으로 실행하고 결과를 검증한다.
// CI에서 race 또는 buffering으로 후처리가 누락되는 케이스 방지.
//
// cross-invocation race 대응:
// - 독립 turbo invocation 2개(예: 터미널 A `pnpm dev` + 터미널 B `pnpm build`)는 graph가
//   dedup되지 않아 이 스크립트가 동시 실행될 수 있다 → pid 락 파일로 전체를 직렬화한다.
// - 락 파일은 temp에 pid를 기록한 뒤 linkSync로 원자 생성한다. "생성됐지만 pid가 아직
//   없는" 중간 상태가 존재하지 않아, 생성~기록 갭으로 인한 이중 보유가 구조적으로 불가능.
// - 후처리 쓰기는 temp write 후 rename으로 원자화한다 (torn write 방지, 심층 방어).
//
// 잔여 한계 (수용): 자문(advisory) 락 특성상 "죽은 락 관측 → rename 회수" 사이에 보유자가
// 교체되고 그 복원마저 제3 프로세스와 경합하는 3-프로세스 서브밀리초 race는 OS flock 없이
// 제거할 수 없다. 이 경우에도 types.ts는 원자적 쓰기가 최종 방어한다 (깨진 파일 불가).

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOCK_POLL_INTERVAL_MS = 250;
const LOCK_TIMEOUT_MS = 120_000;
const LOCK_STALE_MS = 120_000;

/**
 * 동기 스크립트라 setTimeout을 쓸 수 없다 — Atomics.wait가 유일한 무부하 동기 대기.
 * @param {number} ms
 * @returns {void}
 */
const sleepSync = (ms) => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

/**
 * 정리 실패는 빌드를 죽일 사유가 아니다 — 경고만 남긴다.
 * (finally 경로에서 throw하면 원래 에러를 가리는 문제도 함께 방지)
 * @param {string} target
 * @returns {void}
 */
const removeQuiet = (target) => {
    try {
        fs.rmSync(target, { recursive: true, force: true });
    } catch (err) {
        console.warn(
            `[prisma:generate] WARN: cleanup failed for ${target}: ${err instanceof Error ? err.message : err}`
        );
    }
};

/**
 * 락 파일 내용(보유자 pid 원문). 미존재/읽기 실패면 null.
 * ENOENT(락 부재)는 정상 경로지만 그 외(권한 등)는 디버깅 단서를 남긴다.
 * @param {string} lockFile
 * @returns {string | null}
 */
const readLockPidRaw = (lockFile) => {
    try {
        return fs.readFileSync(lockFile, 'utf8');
    } catch (err) {
        if (err instanceof Error) {
            const e = /** @type {NodeJS.ErrnoException} */ (err);
            if (e.code !== 'ENOENT') {
                console.warn(`[prisma:generate] WARN: lock pid read failed: ${e.message}`);
            }
        }
        return null;
    }
};

/**
 * pid 원문으로 생존 여부 판정. true/false 판정 불가(쓰레기 내용 등)면 null.
 * @param {string | null} rawPid
 * @returns {boolean | null}
 */
const isPidAlive = (rawPid) => {
    if (rawPid === null) {
        return null;
    }
    const pid = Number(rawPid);
    if (!Number.isInteger(pid) || pid <= 0) {
        return null;
    }
    try {
        process.kill(pid, 0);
        return true;
    } catch (err) {
        // EPERM = 존재하지만 시그널 권한 없음 → 생존으로 간주
        return err instanceof Error && /** @type {NodeJS.ErrnoException} */ (err).code === 'EPERM';
    }
};

/**
 * @param {string} lockFile
 * @returns {boolean | null}
 */
const isLockHolderAlive = (lockFile) => isPidAlive(readLockPidRaw(lockFile));

/**
 * 락 획득 단발 시도. temp에 pid를 기록한 뒤 linkSync로 원자 생성 — 락은 "완전한 내용으로
 * 존재"하거나 "없거나" 둘 중 하나다 (EEXIST = 점유 중).
 * @param {string} lockFile
 * @returns {boolean} 획득 성공 여부
 */
const tryAcquire = (lockFile) => {
    const tmp = `${lockFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, String(process.pid));
    try {
        fs.linkSync(tmp, lockFile);
        return true;
    } catch (err) {
        if (err instanceof Error && /** @type {NodeJS.ErrnoException} */ (err).code === 'EEXIST') {
            return false;
        }
        throw err;
    } finally {
        removeQuiet(tmp);
    }
};

/**
 * stale 락 회수. rename이 원자적이라 동시 steal 경쟁에서도 한 프로세스만 성공한다.
 * rename 후 보유자 pid를 재검증해 "관측과 rename 사이에 락이 새 보유자로 바뀐" TOCTOU를
 * 차단: 바뀌었으면 살아있는 락을 훔친 것이므로 linkSync로 복원하고 물러난다 (link는
 * EEXIST 시 실패할 뿐 기존 락을 덮어쓰지 않는다).
 * @param {string} lockFile
 * @param {string | null} observedPidRaw steal 결정 시점에 관측한 pid 원문
 * @returns {void}
 */
const stealLock = (lockFile, observedPidRaw) => {
    const trash = `${lockFile}.stale.${process.pid}`;
    try {
        fs.renameSync(lockFile, trash);
    } catch (err) {
        if (err instanceof Error && /** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
            return; // 다른 프로세스가 먼저 회수
        }
        throw err;
    }
    if (readLockPidRaw(trash) !== observedPidRaw) {
        try {
            fs.linkSync(trash, lockFile);
        } catch (err) {
            removeQuiet(trash);
            // EEXIST = 복원 자리에 제3의 락이 생긴 경우만 정상 경로 — 그 외는 인프라 문제라 전파
            if (!(err instanceof Error) || /** @type {NodeJS.ErrnoException} */ (err).code !== 'EEXIST') {
                throw err;
            }
            return;
        }
        removeQuiet(trash);
        return;
    }
    removeQuiet(trash);
};

/**
 * @param {string} lockFile
 * @returns {number | null} 락 mtime 경과 ms. 락 부재/판정 불가면 null.
 */
const lockAgeMs = (lockFile) => {
    try {
        return Date.now() - fs.statSync(lockFile).mtimeMs;
    } catch {
        return null;
    }
};

/**
 * @param {string} lockFile
 * @param {{ timeoutMs?: number, staleMs?: number, pollMs?: number }} [options]
 * @returns {void}
 */
const acquireLock = (lockFile, options = {}) => {
    const { timeoutMs = LOCK_TIMEOUT_MS, staleMs = LOCK_STALE_MS, pollMs = LOCK_POLL_INTERVAL_MS } = options;
    fs.mkdirSync(path.dirname(lockFile), { recursive: true });
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        if (tryAcquire(lockFile)) {
            return;
        }
        if (Date.now() >= deadline) {
            throw new Error(
                `[prisma:generate] lock timeout (${timeoutMs}ms): ${lockFile}\n` +
                    '다른 prisma:generate가 락을 보유 중입니다. 해당 프로세스 종료 후에도 ' +
                    '반복되면 락 파일을 수동 삭제하세요.'
            );
        }
        const observedPidRaw = readLockPidRaw(lockFile);
        const alive = isPidAlive(observedPidRaw);
        const age = lockAgeMs(lockFile);
        if (age === null) {
            continue; // 락이 그 사이 해제됨 — 즉시 재시도 (deadline은 루프 상단에서 검사)
        }
        if (alive === false || (alive === null && age > staleMs)) {
            stealLock(lockFile, observedPidRaw); // 비정상 종료 잔존물 회수
            continue;
        }
        sleepSync(pollMs);
    }
};

/**
 * 자기 소유(pid 일치)일 때만 삭제 — steal당한 뒤 새 보유자의 락을 오삭제하는 것을 방지.
 * @param {string} lockFile
 * @returns {void}
 */
const releaseLock = (lockFile) => {
    if (readLockPidRaw(lockFile) !== String(process.pid)) {
        return;
    }
    removeQuiet(lockFile);
};

/**
 * 같은 디렉토리(같은 파일시스템) rename = 원자적 교체. 읽는 쪽은 이전/이후 전체 내용만 본다.
 * @param {string} targetFile
 * @param {string} content
 * @returns {void}
 */
const writeFileAtomicSync = (targetFile, content) => {
    const tmpFile = `${targetFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, content);
    try {
        fs.renameSync(tmpFile, targetFile);
    } catch (err) {
        removeQuiet(tmpFile);
        throw err;
    }
};

/**
 * @param {string} content
 * @returns {string}
 */
const postprocessTypes = (content) => content.replaceAll('_Id', 'id');

/**
 * @param {string} content
 * @returns {boolean}
 */
const hasDbExport = (content) => content.includes('export type DB =');

/**
 * @returns {void}
 */
const main = () => {
    const apiRoot = path.join(__dirname, '..');
    const typesFile = path.join(apiRoot, 'src/infrastructure/database/generated/types.ts');
    const lockFile = path.join(apiRoot, 'node_modules', '.prisma-generate.lock');

    acquireLock(lockFile);
    try {
        execSync('prisma generate', { stdio: 'inherit', cwd: apiRoot });

        if (!fs.existsSync(typesFile)) {
            throw new Error(`[prisma:generate] ERROR: ${typesFile} not found after prisma generate`);
        }

        const raw = fs.readFileSync(typesFile, 'utf8');
        const content = postprocessTypes(raw);
        writeFileAtomicSync(typesFile, content);

        if (!hasDbExport(content)) {
            console.error(
                `[prisma:generate] file size: ${content.length} chars (was ${raw.length} before postprocess)`
            );
            console.error('[prisma:generate] head:\n' + content.slice(0, 500));
            throw new Error('[prisma:generate] ERROR: DB type export missing in generated types.ts');
        }

        console.log(`[prisma:generate] postprocess complete (${content.length} chars, DB export verified)`);
    } finally {
        releaseLock(lockFile);
    }
};

if (require.main === module) {
    try {
        main();
    } catch (err) {
        console.error(err); // 스택 트레이스 보존 (execSync 실패 원인 추적용)
        process.exit(1);
    }
}

module.exports = {
    acquireLock,
    releaseLock,
    stealLock,
    isLockHolderAlive,
    writeFileAtomicSync,
    postprocessTypes,
    hasDbExport,
};
