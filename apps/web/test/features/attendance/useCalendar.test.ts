/**
 * useCalendar 출석 저장 계측 테스트
 *
 * attendance.update mutation onSuccess의 GA4 이벤트 발화 검증:
 * - attendance_recorded(control): 매 저장마다 발화 (first_* 0건이 모집단 부족인지 침묵 실패인지 구별)
 * - first_attendance_recorded: 조직 첫 출석일 때만 발화 (T-1)
 */
import type { UpdateAttendanceOutput } from '@school/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// 모킹 후에 훅 import (순서 중요!)
import { useCalendar } from '~/features/attendance/hooks/useCalendar';
import { analytics } from '~/lib/analytics';

// analytics 모킹
vi.mock('~/lib/analytics', () => ({
    analytics: {
        trackAttendanceRecorded: vi.fn(),
        trackFirstAttendanceRecorded: vi.fn(),
    },
}));

// trpc 모킹 — update.useMutation에 전달된 onSuccess 콜백을 캡처.
// data 타입을 실제 백엔드 계약(UpdateAttendanceOutput)으로 고정 → 응답 타입 변경 시 테스트가 감지.
type OnSuccess = (data: UpdateAttendanceOutput) => Promise<void>;
let capturedOnSuccess: OnSuccess | undefined;
const invalidate = vi.fn(() => Promise.resolve());

const getOnSuccess = (): OnSuccess => {
    if (!capturedOnSuccess) {
        throw new Error('onSuccess 콜백이 캡처되지 않았습니다');
    }
    return capturedOnSuccess;
};

vi.mock('~/lib/trpc', () => ({
    trpc: {
        useUtils: () => ({
            attendance: { calendar: { invalidate } },
        }),
        attendance: {
            calendar: {
                useQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
            },
            update: {
                useMutation: vi.fn((options: { onSuccess: OnSuccess }) => {
                    capturedOnSuccess = options.onSuccess;
                    return { mutateAsync: vi.fn(), isPending: false };
                }),
            },
        },
    },
}));

describe('useCalendar 출석 저장 계측', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedOnSuccess = undefined;
        // 훅 호출로 update.useMutation 실행 → onSuccess 캡처
        useCalendar('1', 2026, 6);
        expect(capturedOnSuccess).toBeTypeOf('function');
    });

    it('저장 성공 시 attendance_recorded control 이벤트가 페이로드와 함께 1회 발화한다', async () => {
        await getOnSuccess()({
            row: 3,
            studentCount: 5,
            fullAttendanceCount: 2,
            massOnlyCount: 1,
            catechismOnlyCount: 1,
            absentCount: 1,
            attendanceRate: 80,
        });

        expect(analytics.trackAttendanceRecorded).toHaveBeenCalledTimes(1);
        expect(analytics.trackAttendanceRecorded).toHaveBeenCalledWith({
            studentCount: 5,
            fullAttendanceCount: 2,
            massOnlyCount: 1,
            catechismOnlyCount: 1,
            absentCount: 1,
            attendanceRate: 80,
        });
    });

    it('첫 출석이면 first_attendance_recorded와 attendance_recorded가 모두 발화한다', async () => {
        await getOnSuccess()({
            row: 3,
            isFirstAttendance: true,
            daysSinceSignup: 7,
            studentCount: 5,
        });

        expect(analytics.trackFirstAttendanceRecorded).toHaveBeenCalledTimes(1);
        expect(analytics.trackFirstAttendanceRecorded).toHaveBeenCalledWith(7);
        expect(analytics.trackAttendanceRecorded).toHaveBeenCalledTimes(1);
    });

    it('첫 출석이 아니면 first_attendance_recorded는 미발화, attendance_recorded는 발화한다', async () => {
        await getOnSuccess()({
            row: 3,
            isFirstAttendance: false,
            studentCount: 5,
        });

        expect(analytics.trackFirstAttendanceRecorded).not.toHaveBeenCalled();
        expect(analytics.trackAttendanceRecorded).toHaveBeenCalledTimes(1);
    });

    it('studentCount가 없는 응답이면 attendance_recorded를 발화하지 않는다 (방어 가드)', async () => {
        await getOnSuccess()({ row: 3 });

        expect(analytics.trackAttendanceRecorded).not.toHaveBeenCalled();
    });
});
