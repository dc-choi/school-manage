/**
 * useAttendance 큐/직렬화 코어 테스트
 *
 * - 요청 직렬화 (in-flight 1, 응답 후 자동 재flush)
 * - localStorage 큐 백업/복원
 * - 실패 셀 마커 + 수동 재시도
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAttendance } from '~/features/attendance/hooks/useAttendance';

const mutateAsyncMock = vi.fn();
const invalidateGroupAttendance = vi.fn();
const invalidateHasAttendance = vi.fn();

vi.mock('~/lib/trpc', () => ({
    trpc: {
        useUtils: () => ({
            group: { attendance: { invalidate: invalidateGroupAttendance } },
            attendance: { hasAttendance: { invalidate: invalidateHasAttendance } },
        }),
        group: {
            attendance: {
                useQuery: vi.fn(() => ({
                    data: { year: 2024, students: [], attendances: [], sunday: [], saturday: [] },
                    isLoading: false,
                    error: null,
                })),
            },
        },
        attendance: {
            update: {
                useMutation: vi.fn(() => ({
                    mutateAsync: mutateAsyncMock,
                    isPending: false,
                })),
            },
        },
    },
}));

vi.mock('~/lib/analytics', () => ({
    analytics: {
        trackAttendanceSaveLatency: vi.fn(),
        trackAttendanceSaveFailed: vi.fn(),
        trackFirstAttendanceRecorded: vi.fn(),
        trackAttendanceRecorded: vi.fn(),
    },
}));

const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
    mutateAsyncMock.mockReset();
    invalidateGroupAttendance.mockReset();
    invalidateHasAttendance.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useAttendance 큐/직렬화', () => {
    it('TC-2 직렬화 첫 호출: enqueueChange 즉시 mutateAsync 1회', async () => {
        mutateAsyncMock.mockResolvedValue({ row: 1, studentCount: 1 });

        const { result } = renderHook(() => useAttendance('1', 2024));

        await act(async () => {
            result.current.enqueueChange('s1', 1, 7, '◎');
            await flushMicrotasks();
        });

        expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
        expect(mutateAsyncMock).toHaveBeenCalledWith({
            year: 2024,
            groupId: '1',
            attendance: [{ id: 's1', month: 1, day: 7, data: '◎' }],
        });
    });

    it('TC-3 응답 후 큐 자동 flush: in-flight 중 추가 변경 → 응답 후 묶어서 1회', async () => {
        let resolveFirst: (value: { row: number; studentCount: number }) => void = () => undefined;
        mutateAsyncMock
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirst = resolve;
                    })
            )
            .mockResolvedValueOnce({ row: 5, studentCount: 5 });

        const { result } = renderHook(() => useAttendance('1', 2024));

        // 1차 변경 → in-flight
        await act(async () => {
            result.current.enqueueChange('s1', 1, 7, '◎');
            await flushMicrotasks();
        });

        // in-flight 중 5셀 추가 변경 → 큐에 누적
        await act(async () => {
            for (let i = 2; i <= 6; i++) {
                result.current.enqueueChange(`s${i}`, 1, 7, '○');
            }
            await flushMicrotasks();
        });

        expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

        // 1차 응답 → 큐 자동 flush
        await act(async () => {
            resolveFirst({ row: 1, studentCount: 1 });
            await flushMicrotasks();
            await flushMicrotasks();
        });

        expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
        const secondCall = mutateAsyncMock.mock.calls[1]?.[0] as { attendance: unknown[] };
        expect(secondCall.attendance).toHaveLength(5);
    });

    it('TC-E1 동일 셀 burst: 큐가 마지막 값만 유지 (중간값 미전송)', async () => {
        let resolveFirst: (value: { row: number; studentCount: number }) => void = () => undefined;
        mutateAsyncMock
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirst = resolve;
                    })
            )
            .mockResolvedValueOnce({ row: 1, studentCount: 1 });

        const { result } = renderHook(() => useAttendance('1', 2024));

        // 1차 ◎ in-flight
        await act(async () => {
            result.current.enqueueChange('s1', 1, 7, '◎');
            await flushMicrotasks();
        });

        // 같은 셀 빠르게 ○ → △로 변경
        await act(async () => {
            result.current.enqueueChange('s1', 1, 7, '○');
            result.current.enqueueChange('s1', 1, 7, '△');
            await flushMicrotasks();
        });

        // 1차 응답
        await act(async () => {
            resolveFirst({ row: 1, studentCount: 1 });
            await flushMicrotasks();
            await flushMicrotasks();
        });

        expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
        const secondCall = mutateAsyncMock.mock.calls[1]?.[0] as {
            attendance: { data: string }[];
        };
        expect(secondCall.attendance).toHaveLength(1);
        expect(secondCall.attendance[0]?.data).toBe('△'); // 마지막 값만
    });

    it('TC-E5 localStorage 복원: 사전 시드된 큐가 마운트 시 자동 flush', async () => {
        window.localStorage.setItem(
            'attendance_queue_1_2024',
            JSON.stringify({
                ts: Date.now(),
                items: [{ studentId: 's1', month: 1, day: 7, content: '◎' }],
            })
        );
        mutateAsyncMock.mockResolvedValue({ row: 1, studentCount: 1 });

        renderHook(() => useAttendance('1', 2024));
        await act(async () => {
            await flushMicrotasks();
        });

        expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
        const call = mutateAsyncMock.mock.calls[0]?.[0] as { attendance: unknown[] };
        expect(call.attendance).toHaveLength(1);
    });

    it('TC-E3 응답 실패: 셀이 failedCells에 추가, retryCell로 재전송', async () => {
        mutateAsyncMock.mockRejectedValueOnce(new Error('NETWORK_ERROR'));
        mutateAsyncMock.mockResolvedValueOnce({ row: 1, studentCount: 1 });

        const { result } = renderHook(() => useAttendance('1', 2024));

        await act(async () => {
            result.current.enqueueChange('s1', 1, 7, '◎');
            await flushMicrotasks();
            await flushMicrotasks();
        });

        expect(result.current.failedCells.has('s1-1-7')).toBe(true);

        await act(async () => {
            result.current.retryCell('s1-1-7');
            await flushMicrotasks();
            await flushMicrotasks();
        });

        expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
    });
});
