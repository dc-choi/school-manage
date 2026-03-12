/**
 * 엑셀 파싱/검증 유틸리티 (로드맵 2단계 — 엑셀 Import)
 *
 * 클라이언트에서 .xlsx 파일을 파싱하고 행별 검증을 수행한다.
 */
import * as XLSX from 'xlsx';

export interface ParsedRow {
    rowIndex: number;
    groupName: string;
    societyName: string;
    catholicName: string;
    gender: string;
    contact: string;
    baptizedAt: string;
    age: string;
    description: string;
    registered: string | null;
}

export interface ValidatedRow extends ParsedRow {
    groupId: string | null;
    normalizedGender: 'M' | 'F' | null;
    normalizedContact: string | null;
    normalizedAge: number | null;
    normalizedRegistered: boolean;
    status: 'success' | 'error';
    errors: string[];
}

interface GroupInfo {
    id: string;
    name: string;
}

const BAPTIZED_AT_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/;

const cellToString = (cell: unknown): string => {
    if (cell == null) return '';
    return String(cell).trim();
};

/**
 * .xlsx 파일을 파싱하여 ParsedRow 배열을 반환한다.
 */
export const parseExcelFile = async (file: File): Promise<ParsedRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('시트가 없습니다.');

    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // 첫 행은 헤더 → 건너뜀
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => cellToString(cell) !== ''));

    return dataRows.map((row, index) => ({
        rowIndex: index + 2, // 엑셀 행 번호 (1-based, 헤더 제외)
        groupName: cellToString(row[0]),
        societyName: cellToString(row[1]),
        catholicName: cellToString(row[2]),
        gender: cellToString(row[3]),
        contact: cellToString(row[4]),
        baptizedAt: cellToString(row[5]),
        age: cellToString(row[6]),
        description: cellToString(row[7]),
        registered: cellToString(row[8]) || null,
    }));
};

/**
 * 파싱된 행을 검증하여 ValidatedRow 배열을 반환한다.
 */
export const validateRows = (rows: ParsedRow[], groups: GroupInfo[]): ValidatedRow[] => {
    return rows.map((row) => {
        const errors: string[] = [];
        let groupId: string | null = null;
        let normalizedGender: 'M' | 'F' | null = null;
        let normalizedContact: string | null = null;
        let normalizedAge: number | null = null;
        const REGISTERED_VALUES = new Set(['O', 'o', 'ㅇ', '○']);
        const normalizedRegistered = row.registered !== null && REGISTERED_VALUES.has(row.registered);

        // 필수값 검증
        if (!row.groupName) {
            errors.push('학년을 입력해 주세요. 예: 1학년');
        }
        if (!row.societyName) {
            errors.push('이름을 입력해 주세요. 예: 홍길동');
        }

        // 그룹 매칭
        if (row.groupName) {
            const matched = groups.find((g) => g.name === row.groupName);
            if (matched) {
                groupId = matched.id;
            } else {
                const available = groups.map((g) => g.name).join(', ');
                errors.push(`"${row.groupName}"은(는) 등록된 학년이 아닙니다. 사용 가능: ${available}`);
            }
        }

        // 성별 정규화
        if (row.gender) {
            const g = row.gender;
            if (g === '남' || g === 'M') {
                normalizedGender = 'M';
            } else if (g === '여' || g === 'F') {
                normalizedGender = 'F';
            } else {
                errors.push(`성별 "${row.gender}"을(를) 인식할 수 없습니다. 남/여 또는 M/F로 입력해 주세요.`);
            }
        }

        // 전화번호 숫자 추출 (Excel이 숫자로 처리하면서 앞자리 0이 사라지는 경우 복원)
        if (row.contact) {
            const digits = row.contact.replace(/\D/g, '');
            if (digits) {
                normalizedContact = digits.padStart(11, '0');
            } else {
                errors.push('전화번호는 숫자만 입력해 주세요. 예: 01012345678');
            }
        }

        // 축일 형식 검증
        if (row.baptizedAt && !BAPTIZED_AT_REGEX.test(row.baptizedAt)) {
            errors.push(`축일 "${row.baptizedAt}"은(는) 올바른 형식이 아닙니다. MM/DD로 입력해 주세요. 예: 03/19`);
        }

        // 나이 검증
        if (row.age) {
            const parsed = Number(row.age);
            if (Number.isInteger(parsed) && parsed > 0) {
                normalizedAge = parsed;
            } else {
                errors.push(`나이 "${row.age}"은(는) 올바르지 않습니다. 양의 정수를 입력해 주세요. 예: 14`);
            }
        }

        return {
            ...row,
            groupId,
            normalizedGender,
            normalizedContact,
            normalizedAge,
            normalizedRegistered,
            status: errors.length > 0 ? 'error' : 'success',
            errors,
        };
    });
};
