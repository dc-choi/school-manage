/**
 * GroupStatisticsTable 테스트 — 일간 컬럼 노출 + TotalRow 합산 + 헤더 명명
 */
import type { GroupStatisticsItem, GroupStatisticsOutput } from '@school/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GroupStatisticsTable } from '~/pages/dashboard/GroupStatisticsTable';

const makeGroup = (overrides: Partial<GroupStatisticsItem>): GroupStatisticsItem => ({
    groupId: '1',
    groupName: '1학년',
    groupType: 'GRADE',
    daily: { attendanceRate: 80, attendanceCount: 8, startDate: '20240107', endDate: '20240107' },
    weekly: { attendanceRate: 75, avgAttendance: 7.5, startDate: '20240101', endDate: '20240107' },
    monthly: { attendanceRate: 70, avgAttendance: 7, startDate: '20240101', endDate: '20240131' },
    yearly: { attendanceRate: 65, avgAttendance: 6.5, startDate: '20240101', endDate: '20241231' },
    totalStudents: 10,
    registeredStudents: 8,
    ...overrides,
});

const makeData = (groups: GroupStatisticsItem[]): GroupStatisticsOutput => ({
    year: 2024,
    effectiveDay: '2024-01-07',
    groups,
});

describe('GroupStatisticsTable', () => {
    it('일간/주간/월간/연간 평균 출석 헤더가 모두 노출된다', () => {
        render(<GroupStatisticsTable data={makeData([makeGroup({})])} isLoading={false} />);

        // jsdom 환경(데스크톱 가정): 모바일 hidden 텍스트도 DOM에 존재
        const headers = screen.getAllByRole('columnheader');
        const headerTexts = headers.map((h) => h.textContent);
        expect(headerTexts).toContain('일간 출석');
        expect(headerTexts).toContain('주간 평균 출석');
        expect(headerTexts).toContain('월간 평균 출석');
    });

    it('학년 행에 일간 출석 수가 표시된다', () => {
        render(
            <GroupStatisticsTable
                data={makeData([
                    makeGroup({
                        groupId: '1',
                        groupName: '1학년',
                        daily: { attendanceRate: 80, attendanceCount: 8, startDate: '20240107', endDate: '20240107' },
                    }),
                ])}
                isLoading={false}
            />
        );

        const rows = screen.getAllByRole('row');
        const dataRow = rows[1];
        expect(dataRow).toHaveTextContent('8명');
    });

    it('TotalRow 일간 출석은 학년별 daily.attendanceCount 합과 일치한다', () => {
        const groups = [
            makeGroup({
                groupId: '1',
                groupName: '1학년',
                daily: { attendanceRate: 80, attendanceCount: 8, startDate: '20240107', endDate: '20240107' },
                totalStudents: 10,
            }),
            makeGroup({
                groupId: '2',
                groupName: '2학년',
                daily: { attendanceRate: 60, attendanceCount: 6, startDate: '20240107', endDate: '20240107' },
                totalStudents: 10,
            }),
        ];
        render(<GroupStatisticsTable data={makeData(groups)} isLoading={false} />);

        const rows = screen.getAllByRole('row');
        const totalRow = rows[rows.length - 1];
        expect(totalRow).toHaveTextContent('총계');
        // 일간 합 = 8 + 6 = 14
        expect(totalRow).toHaveTextContent('14명');
    });

    it('데이터 없음 시 안내 메시지를 표시한다', () => {
        render(<GroupStatisticsTable data={makeData([])} isLoading={false} />);
        expect(screen.getByText('데이터 없음')).toBeInTheDocument();
    });
});
