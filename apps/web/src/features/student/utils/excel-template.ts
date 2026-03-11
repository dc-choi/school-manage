/**
 * 엑셀 템플릿 생성 유틸리티 (로드맵 2단계 — 엑셀 Import)
 *
 * 클라이언트에서 컬럼 헤더만 포함된 .xlsx 템플릿을 생성하여 다운로드한다.
 */
import * as XLSX from 'xlsx';

const HEADERS = ['학년', '이름', '세례명', '성별', '전화번호', '축일', '나이', '비고', '등록 여부'];

const COLUMN_WIDTHS = [
    { wch: 12 }, // 학년
    { wch: 10 }, // 이름
    { wch: 12 }, // 세례명
    { wch: 6 }, // 성별
    { wch: 14 }, // 전화번호
    { wch: 8 }, // 축일
    { wch: 6 }, // 나이
    { wch: 20 }, // 비고
    { wch: 10 }, // 등록 여부
];

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

/**
 * 학생 등록 양식 엑셀 파일을 생성하고 다운로드한다.
 */
export const downloadExcelTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([HEADERS]);
    worksheet['!cols'] = COLUMN_WIDTHS;

    // 헤더 셀 스타일 + 메모(comment) 추가
    HEADERS.forEach((_, idx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
        const cell = worksheet[cellRef];
        if (cell) {
            cell.s = {
                fill: { fgColor: { rgb: '4472C4' } },
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                alignment: { horizontal: 'center' },
            };
            cell.c = [{ a: '출석부', t: HEADER_COMMENTS[idx] }];
            cell.c.hidden = true;
        }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '학생목록');

    XLSX.writeFile(workbook, '학생_등록_양식.xlsx');
};
