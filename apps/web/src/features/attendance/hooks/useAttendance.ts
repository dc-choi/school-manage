import type { AttendanceData } from '@school/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

export type AttendanceSaveStatus = 'idle' | 'in-flight' | 'ok' | 'partial-error';

interface QueueItem {
    studentId: string;
    month: number;
    day: number;
    content: string;
}

const cellKey = (studentId: string, month: number, day: number): string => `${studentId}-${month}-${day}`;

const QUEUE_KEY_PREFIX = 'attendance_queue';
const QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = (groupId: string, year: number): string => `${QUEUE_KEY_PREFIX}_${groupId}_${year}`;

interface PersistedQueue {
    ts: number;
    items: QueueItem[];
}

const persistQueue = (groupId: string, year: number, queue: Map<string, QueueItem>): void => {
    if (typeof window === 'undefined') return;
    if (queue.size === 0) {
        window.localStorage.removeItem(STORAGE_KEY(groupId, year));
        return;
    }
    const payload: PersistedQueue = { ts: Date.now(), items: [...queue.values()] };
    try {
        window.localStorage.setItem(STORAGE_KEY(groupId, year), JSON.stringify(payload));
    } catch {
        // Quota 초과 등 — best-effort, 큐 자체는 메모리에 살아있음
    }
};

const restoreQueue = (groupId: string, year: number): QueueItem[] | null => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY(groupId, year));
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as PersistedQueue;
        if (Date.now() - parsed.ts > QUEUE_TTL_MS) {
            window.localStorage.removeItem(STORAGE_KEY(groupId, year));
            return null;
        }
        return Array.isArray(parsed.items) ? parsed.items : null;
    } catch {
        window.localStorage.removeItem(STORAGE_KEY(groupId, year));
        return null;
    }
};

const sendKeepAlive = (input: { year: number; groupId: string; attendance: AttendanceData[] }): void => {
    if (typeof window === 'undefined') return;
    const token = window.sessionStorage.getItem('token');
    if (!token) return;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
    const body = JSON.stringify({ '0': { json: input } });
    try {
        fetch('/api/trpc/attendance.update?batch=1', { method: 'POST', headers, body, keepalive: true }).catch(
            () => undefined
        );
    } catch {
        // 구버전 사파리 등 keepalive 미지원: 큐는 localStorage에 남아 다음 진입 시 복구
    }
};

export function useAttendance(groupId: string, year?: number) {
    const utils = trpc.useUtils();
    const { data, isLoading, error } = trpc.group.attendance.useQuery({ groupId, year }, { enabled: !!groupId });

    const effectiveYear = year ?? data?.year;

    const pendingQueue = useRef<Map<string, QueueItem>>(new Map());
    const inFlightSnapshot = useRef<Map<string, QueueItem>>(new Map());
    const inFlight = useRef<boolean>(false);
    const okTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [failedCells, setFailedCells] = useState<Set<string>>(new Set());
    const [saveStatus, setSaveStatus] = useState<AttendanceSaveStatus>('idle');

    const updateMutation = trpc.attendance.update.useMutation();

    const flushRef = useRef<() => void>(() => undefined);

    const performFlush = useCallback(async () => {
        if (!effectiveYear || !groupId) return;
        if (inFlight.current) return;
        if (pendingQueue.current.size === 0) return;

        inFlightSnapshot.current = new Map(pendingQueue.current);
        pendingQueue.current.clear();
        persistQueue(groupId, effectiveYear, pendingQueue.current);
        inFlight.current = true;
        setSaveStatus('in-flight');

        const snapshot = inFlightSnapshot.current;
        const attendance: AttendanceData[] = [...snapshot.values()].map((it) => ({
            id: it.studentId,
            month: it.month,
            day: it.day,
            data: it.content,
        }));
        const cellCount = attendance.length;
        const start = performance.now();

        try {
            const result = await updateMutation.mutateAsync({
                year: effectiveYear,
                groupId,
                attendance,
            });
            const latencyMs = Math.round(performance.now() - start);
            analytics.trackAttendanceSaveLatency({ cellCount, latencyMs, ok: true });

            if (result.isFirstAttendance && result.daysSinceSignup !== undefined) {
                analytics.trackFirstAttendanceRecorded(result.daysSinceSignup);
            }
            if (result.studentCount && result.studentCount > 0) {
                analytics.trackAttendanceRecorded({
                    studentCount: result.studentCount,
                    fullAttendanceCount: result.fullAttendanceCount,
                    massOnlyCount: result.massOnlyCount,
                    catechismOnlyCount: result.catechismOnlyCount,
                    absentCount: result.absentCount,
                    attendanceRate: result.attendanceRate,
                });
            }

            // 성공한 셀들은 failedCells에서 해제
            if (failedCells.size > 0) {
                setFailedCells((prev) => {
                    const next = new Set(prev);
                    for (const key of snapshot.keys()) next.delete(key);
                    return next;
                });
            }

            inFlightSnapshot.current = new Map();
            await utils.group.attendance.invalidate({ groupId, year: effectiveYear });
            await utils.attendance.hasAttendance.invalidate();

            setSaveStatus(failedCells.size === 0 ? 'ok' : 'partial-error');
            if (okTimeoutRef.current) clearTimeout(okTimeoutRef.current);
            okTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err: unknown) {
            const errorCode = err instanceof Error ? err.message : 'UNKNOWN';
            const latencyMs = Math.round(performance.now() - start);
            analytics.trackAttendanceSaveLatency({ cellCount, latencyMs, ok: false });
            analytics.trackAttendanceSaveFailed({ errorCode, cellCount });
            setFailedCells((prev) => {
                const next = new Set(prev);
                for (const key of snapshot.keys()) next.add(key);
                return next;
            });
            setSaveStatus('partial-error');
        } finally {
            inFlight.current = false;
            if (pendingQueue.current.size > 0) {
                flushRef.current();
            }
        }
    }, [effectiveYear, groupId, updateMutation, utils, failedCells.size]);

    flushRef.current = () => {
        void performFlush();
    };

    const enqueueChange = useCallback(
        (studentId: string, month: number, day: number, content: string) => {
            if (!effectiveYear || !groupId) return;
            const key = cellKey(studentId, month, day);
            pendingQueue.current.set(key, { studentId, month, day, content });
            persistQueue(groupId, effectiveYear, pendingQueue.current);
            // 같은 셀이 다시 변경되면 실패 마커 해제 (사용자가 재입력 = 새 시도)
            if (failedCells.has(key)) {
                setFailedCells((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
            flushRef.current();
        },
        [effectiveYear, groupId, failedCells]
    );

    const flushNow = useCallback(() => {
        flushRef.current();
    }, []);

    const retryCell = useCallback(
        (key: string) => {
            const failed = inFlightSnapshot.current.get(key);
            if (failed) {
                pendingQueue.current.set(key, failed);
                if (effectiveYear && groupId) persistQueue(groupId, effectiveYear, pendingQueue.current);
            }
            flushRef.current();
        },
        [effectiveYear, groupId]
    );

    const retryAllFailed = useCallback(() => {
        for (const [key, item] of inFlightSnapshot.current) {
            pendingQueue.current.set(key, item);
        }
        if (effectiveYear && groupId) persistQueue(groupId, effectiveYear, pendingQueue.current);
        flushRef.current();
    }, [effectiveYear, groupId]);

    // 마운트 시 localStorage 큐 복원 + flush
    useEffect(() => {
        if (!effectiveYear || !groupId) return;
        const restored = restoreQueue(groupId, effectiveYear);
        if (restored && restored.length > 0) {
            for (const item of restored) {
                pendingQueue.current.set(cellKey(item.studentId, item.month, item.day), item);
            }
            flushRef.current();
        }
    }, [effectiveYear, groupId]);

    // 이탈 트리거: 언마운트 / beforeunload / visibilitychange
    useEffect(() => {
        if (!effectiveYear || !groupId) return;

        const handleBeforeUnload = () => {
            if (pendingQueue.current.size === 0) return;
            const attendance: AttendanceData[] = [...pendingQueue.current.values()].map((it) => ({
                id: it.studentId,
                month: it.month,
                day: it.day,
                data: it.content,
            }));
            sendKeepAlive({ year: effectiveYear, groupId, attendance });
        };

        const handleVisibility = () => {
            if (document.hidden) flushRef.current();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibility);
            // 언마운트 시 마지막 flush — 응답 대기 X (fire-and-forget)
            flushRef.current();
        };
    }, [effectiveYear, groupId]);

    return {
        data,
        isLoading,
        error,
        enqueueChange,
        flushNow,
        retryCell,
        retryAllFailed,
        failedCells,
        saveStatus,
        isUpdating: updateMutation.isPending,
    };
}
