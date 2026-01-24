/**
 * useStatistics 훅 테스트
 *
 * 대시보드 통계 훅의 동작 검증
 */
import { describe, expect, it, vi } from 'vitest';

// tRPC 모킹
vi.mock('~/lib/trpc', () => ({
    trpc: {
        statistics: {
            excellent: {
                useQuery: vi.fn(() => ({
                    data: { excellentStudents: [] },
                    isLoading: false,
                    error: null,
                })),
            },
            weekly: {
                useQuery: vi.fn(() => ({
                    data: {
                        attendanceRate: 85.5,
                        avgAttendance: 25.5,
                        startDate: '2024-01-21',
                        endDate: '2024-01-27',
                    },
                    isLoading: false,
                    error: null,
                })),
            },
            monthly: {
                useQuery: vi.fn(() => ({
                    data: {
                        attendanceRate: 80.0,
                        avgAttendance: 24.0,
                        startDate: '2024-01-01',
                        endDate: '2024-01-31',
                    },
                    isLoading: false,
                    error: null,
                })),
            },
            yearly: {
                useQuery: vi.fn(() => ({
                    data: {
                        attendanceRate: 75.0,
                        avgAttendance: 23.5,
                        year: 2024,
                        startDate: '2024-01-01',
                        endDate: '2024-12-31',
                    },
                    isLoading: false,
                    error: null,
                })),
            },
            byGender: {
                useQuery: vi.fn(() => ({
                    data: {
                        year: 2024,
                        male: { count: 15, rate: 50 },
                        female: { count: 12, rate: 40 },
                        unknown: { count: 3, rate: 10 },
                    },
                    isLoading: false,
                    error: null,
                })),
            },
            topGroups: {
                useQuery: vi.fn(() => ({
                    data: {
                        year: 2024,
                        groups: [
                            { groupId: '1', groupName: '1반', attendanceRate: 95 },
                            { groupId: '2', groupName: '2반', attendanceRate: 90 },
                        ],
                    },
                    isLoading: false,
                    error: null,
                })),
            },
            topOverall: {
                useQuery: vi.fn(() => ({
                    data: {
                        year: 2024,
                        students: [
                            { id: '1', societyName: '홍길동', groupName: '1반', score: 45 },
                            { id: '2', societyName: '김철수', groupName: '2반', score: 40 },
                        ],
                    },
                    isLoading: false,
                    error: null,
                })),
            },
            groupStatistics: {
                useQuery: vi.fn(() => ({
                    data: {
                        year: 2024,
                        groups: [
                            {
                                groupId: '1',
                                groupName: '1반',
                                weekly: { attendanceRate: 90, avgAttendance: 10 },
                                monthly: { attendanceRate: 85, avgAttendance: 9 },
                                yearly: { attendanceRate: 80, avgAttendance: 8 },
                                totalStudents: 10,
                            },
                        ],
                    },
                    isLoading: false,
                    error: null,
                })),
            },
        },
    },
}));

// 테스트 전에 훅 import (모킹 후에 import 해야 함)
import { useStatistics, useDashboardStatistics } from '~/features/statistics/hooks/useStatistics';

describe('useStatistics', () => {
    it('useStatistics 훅이 excellentStudents를 반환한다', () => {
        const result = useStatistics(2024);

        expect(result).toHaveProperty('excellentStudents');
        expect(result).toHaveProperty('isLoading');
        expect(result).toHaveProperty('error');
        expect(Array.isArray(result.excellentStudents)).toBe(true);
    });
});

describe('useDashboardStatistics', () => {
    it('대시보드 통계 데이터를 반환한다', () => {
        const result = useDashboardStatistics(2024);

        expect(result).toHaveProperty('weekly');
        expect(result).toHaveProperty('monthly');
        expect(result).toHaveProperty('yearly');
        expect(result).toHaveProperty('byGender');
        expect(result).toHaveProperty('topGroups');
        expect(result).toHaveProperty('topOverall');
        expect(result).toHaveProperty('groupStatistics');
        expect(result).toHaveProperty('isLoading');
        expect(result).toHaveProperty('error');
    });

    it('주간 출석률 데이터 구조가 올바르다', () => {
        const result = useDashboardStatistics(2024);

        expect(result.weekly).toHaveProperty('attendanceRate');
        expect(result.weekly).toHaveProperty('avgAttendance');
        expect(result.weekly).toHaveProperty('startDate');
        expect(result.weekly).toHaveProperty('endDate');
        expect(result.weekly?.attendanceRate).toBe(85.5);
        expect(result.weekly?.avgAttendance).toBe(25.5);
    });

    it('성별 분포 데이터 구조가 올바르다', () => {
        const result = useDashboardStatistics(2024);

        expect(result.byGender).toHaveProperty('male');
        expect(result.byGender).toHaveProperty('female');
        expect(result.byGender).toHaveProperty('unknown');
        expect(result.byGender?.male.count).toBe(15);
        expect(result.byGender?.female.count).toBe(12);
    });

    it('그룹별 출석률 순위 데이터 구조가 올바르다', () => {
        const result = useDashboardStatistics(2024);

        expect(result.topGroups).toHaveProperty('groups');
        expect(Array.isArray(result.topGroups?.groups)).toBe(true);
        expect(result.topGroups?.groups[0]).toHaveProperty('groupId');
        expect(result.topGroups?.groups[0]).toHaveProperty('groupName');
        expect(result.topGroups?.groups[0]).toHaveProperty('attendanceRate');
    });

    it('전체 우수 학생 데이터 구조가 올바르다', () => {
        const result = useDashboardStatistics(2024);

        expect(result.topOverall).toHaveProperty('students');
        expect(Array.isArray(result.topOverall?.students)).toBe(true);
        expect(result.topOverall?.students[0]).toHaveProperty('id');
        expect(result.topOverall?.students[0]).toHaveProperty('societyName');
        expect(result.topOverall?.students[0]).toHaveProperty('groupName');
        expect(result.topOverall?.students[0]).toHaveProperty('score');
    });

    it('그룹별 상세 통계 데이터 구조가 올바르다', () => {
        const result = useDashboardStatistics(2024);

        expect(result.groupStatistics).toHaveProperty('groups');
        expect(Array.isArray(result.groupStatistics?.groups)).toBe(true);

        const group = result.groupStatistics?.groups[0];
        expect(group).toHaveProperty('groupId');
        expect(group).toHaveProperty('groupName');
        expect(group).toHaveProperty('weekly');
        expect(group).toHaveProperty('monthly');
        expect(group).toHaveProperty('yearly');
        expect(group).toHaveProperty('totalStudents');
        expect(group?.weekly).toHaveProperty('attendanceRate');
        expect(group?.weekly).toHaveProperty('avgAttendance');
    });

    it('isLoading이 false일 때 데이터가 로드된 상태', () => {
        const result = useDashboardStatistics(2024);

        expect(result.isLoading).toBe(false);
        expect(result.error).toBeFalsy();
    });
});