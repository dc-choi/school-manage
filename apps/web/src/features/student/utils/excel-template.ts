/**
 * 엑셀 템플릿 생성 유틸리티 (로드맵 2단계 — 엑셀 Import)
 *
 * 클라이언트에서 컬럼 헤더만 포함된 .xlsx 템플릿을 생성하여 다운로드한다.
 * ExcelJS는 동적 import로 분리하여 메인 번들에서 제외한다.
 */

const HEADERS = ['학년', '이름', '세례명', '성별', '전화번호', '축일', '나이', '비고', '등록 여부'];

const COLUMN_WIDTHS = [12, 10, 12, 6, 14, 8, 6, 20, 10];

/** 헤더 셀별 입력 가이드 메모 */
const HEADER_COMMENTS: string[] = [
    '학년 (필수) : 등록된 학년명을 정확히 입력하세요.',
    '이름 (필수) : 학생 이름을 입력하세요.',
    '세례명 (선택) : 세례명을 입력하세요.',
    '성별 (선택) : 남/여 또는 M/F로 입력하세요.',
    '전화번호 (선택) : 숫자만 입력하세요. 예: 01012345678',
    '축일 (선택) : MM/DD 형식으로 입력하세요. 예: 03/19',
    '나이 (선택) : 숫자만 입력하세요. 예: 14',
    '비고 (선택) : 자유 입력',
    '선택 입력\nO: 등록, X 또는 빈 값: 미등록',
];

const SHEET_NAME = '학생목록';
const FILE_NAME = '학생_등록_양식.xlsx';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * 학생 등록 양식 엑셀 파일을 생성하고 다운로드한다.
 */
export const downloadExcelTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(SHEET_NAME);

    worksheet.columns = HEADERS.map((header, idx) => ({
        header,
        key: `col${idx}`,
        width: COLUMN_WIDTHS[idx],
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        cell.note = HEADER_COMMENTS[colNumber - 1];
    });
    headerRow.commit();

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: XLSX_MIME });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = FILE_NAME;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};
