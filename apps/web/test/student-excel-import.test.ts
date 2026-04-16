/**
 * 학생 엑셀 Import 유틸리티 테스트
 *
 * - validateRows: 행별 검증 로직 (순수 함수)
 * - parseExcelFile: ExcelJS round-trip (workbook 생성 → File → 파싱)
 */
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import type { ParsedRow } from '~/features/student/utils/excel-import';
import { parseExcelFile, validateRows } from '~/features/student/utils/excel-import';

const GROUPS = [
    { id: 'g1', name: '1학년' },
    { id: 'g2', name: '2학년' },
];

const baseRow = (overrides: Partial<ParsedRow> = {}): ParsedRow => ({
    rowIndex: 2,
    groupName: '1학년',
    societyName: '홍길동',
    catholicName: '베드로',
    gender: '남',
    contact: '01012345678',
    baptizedAt: '06/29',
    age: '14',
    description: '',
    registered: 'O',
    ...overrides,
});

describe('validateRows', () => {
    it('정상 입력은 success로 정규화된다', () => {
        const result = validateRows([baseRow()], GROUPS);
        expect(result[0]).toMatchObject({
            status: 'success',
            errors: [],
            groupId: 'g1',
            normalizedGender: 'M',
            normalizedContact: '01012345678',
            normalizedAge: 14,
            normalizedRegistered: true,
        });
    });

    it('학년/이름 누락 시 error로 분류된다', () => {
        const result = validateRows([baseRow({ groupName: '', societyName: '' })], GROUPS);
        expect(result[0].status).toBe('error');
        expect(result[0].errors).toEqual(
            expect.arrayContaining([expect.stringContaining('학년'), expect.stringContaining('이름')])
        );
    });

    it('등록되지 않은 학년명은 error 처리된다', () => {
        const result = validateRows([baseRow({ groupName: '3학년' })], GROUPS);
        expect(result[0].status).toBe('error');
        expect(result[0].errors[0]).toContain('등록된 학년이 아닙니다');
        expect(result[0].groupId).toBeNull();
    });

    it('성별을 인식하지 못하면 error 처리된다', () => {
        const result = validateRows([baseRow({ gender: '소년' })], GROUPS);
        expect(result[0].status).toBe('error');
        expect(result[0].errors[0]).toContain('성별');
    });

    it('축일이 MM/DD 형식이 아니면 error 처리된다', () => {
        const result = validateRows([baseRow({ baptizedAt: '6-29' })], GROUPS);
        expect(result[0].status).toBe('error');
        expect(result[0].errors[0]).toContain('축일');
    });

    it('전화번호 앞자리 0이 잘려도 11자리로 복원된다', () => {
        const result = validateRows([baseRow({ contact: '1012345678' })], GROUPS);
        expect(result[0].normalizedContact).toBe('01012345678');
    });

    it('등록 여부는 O/o/ㅇ/○ 만 true 로 정규화된다', () => {
        const cases: Array<{ value: string | null; expected: boolean }> = [
            { value: 'O', expected: true },
            { value: 'o', expected: true },
            { value: 'ㅇ', expected: true },
            { value: '○', expected: true },
            { value: 'X', expected: false },
            { value: '', expected: false },
            { value: null, expected: false },
        ];
        for (const { value, expected } of cases) {
            const result = validateRows([baseRow({ registered: value })], GROUPS);
            expect(result[0].normalizedRegistered).toBe(expected);
        }
    });
});

describe('parseExcelFile', () => {
    // jsdom 의 File 은 arrayBuffer() 미지원 → 호출되는 메서드만 구현한 stub 사용
    const buildXlsx = async (rows: Array<Array<string | number | null>>): Promise<File> => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('학생목록');
        for (const row of rows) {
            sheet.addRow(row);
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return {
            name: 'test.xlsx',
            arrayBuffer: async () => buffer,
        } as unknown as File;
    };

    it('헤더를 건너뛰고 데이터 행을 ParsedRow 로 반환한다', async () => {
        const file = await buildXlsx([
            ['학년', '이름', '세례명', '성별', '전화번호', '축일', '나이', '비고', '등록 여부'],
            ['1학년', '홍길동', '베드로', '남', '01012345678', '06/29', 14, '메모', 'O'],
            ['2학년', '김영희', '마리아', '여', '01099998888', '08/15', 13, '', ''],
        ]);

        const parsed = await parseExcelFile(file);

        expect(parsed).toHaveLength(2);
        expect(parsed[0]).toMatchObject({
            rowIndex: 2,
            groupName: '1학년',
            societyName: '홍길동',
            catholicName: '베드로',
            gender: '남',
            baptizedAt: '06/29',
            age: '14',
            description: '메모',
            registered: 'O',
        });
        expect(parsed[1].rowIndex).toBe(3);
        expect(parsed[1].registered).toBeNull();
    });

    it('빈 행은 건너뛰고 인덱스가 연속된다', async () => {
        const file = await buildXlsx([
            ['학년', '이름'],
            ['1학년', '홍길동'],
            ['', ''],
            ['2학년', '김영희'],
        ]);

        const parsed = await parseExcelFile(file);

        expect(parsed).toHaveLength(2);
        expect(parsed.map((r) => r.societyName)).toEqual(['홍길동', '김영희']);
        expect(parsed.map((r) => r.rowIndex)).toEqual([2, 3]);
    });
});
