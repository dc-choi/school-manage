# Development: 학생 엑셀 Import — Frontend

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.

## 상위 문서

- PRD: `docs/specs/prd/student-excel-import.md`
- 기능 설계: `docs/specs/functional-design/student-management.md` (엑셀 Import 섹션)
- Task: `docs/specs/target/functional/tasks/student-excel-import.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| B1~B3 | 백엔드 업무 | X (backend Development) |
| F1 | 엑셀 파싱/검증 유틸리티 | O |
| F2 | 엑셀 템플릿 생성 유틸리티 | O |
| F3 | Import 모달 컴포넌트 | O |
| F4 | 학생 목록 페이지 통합 | O |

## 구현 개요

xlsx 라이브러리로 클라이언트에서 엑셀 파싱/검증/템플릿 생성을 처리하고, 검증 통과 데이터를 Import 모달에서 미리보기 후 `student.bulkCreate` API로 일괄 등록한다.

## 의존성 추가

- `xlsx` 패키지를 `apps/web`에 설치 (`pnpm add xlsx --filter @school/web`)
- 엑셀 파싱 + 템플릿 생성 모두 이 라이브러리 사용

## F1: 엑셀 파싱/검증 유틸리티

### 파일 위치

`apps/web/src/features/student/utils/excel-import.ts`

### 파싱 로직

```
INPUT: File (.xlsx)
OUTPUT: ParsedRow[] (파싱된 행 배열)

1. XLSX.read(file, { type: 'array' })
2. 첫 번째 시트 선택
3. sheet_to_json()으로 2D 배열 변환
4. 첫 행(헤더) 건너뜀
5. 각 행을 컬럼 순서대로 매핑:
   [0]학년, [1]이름, [2]세례명, [3]성별, [4]전화번호, [5]축일, [6]나이, [7]비고
6. RETURN ParsedRow[]
```

### 검증 로직

```
INPUT: ParsedRow[], groups[] (계정 소속 그룹 목록)
OUTPUT: ValidatedRow[] (검증 결과 포함)

FOR EACH row IN parsedRows
  errors = []

  # 필수값 검증
  IF row.groupName이 비어있으면 → errors.push("학년은 필수입니다")
  IF row.societyName이 비어있으면 → errors.push("이름은 필수입니다")

  # 그룹 매칭
  matchedGroup = groups.find(g => g.name === row.groupName)
  IF 매칭 실패 → errors.push("존재하지 않는 학년입니다")
  ELSE → row.groupId = matchedGroup.id

  # 성별 정규화
  IF row.gender가 "남" 또는 "M" → row.gender = "M"
  ELSE IF row.gender가 "여" 또는 "F" → row.gender = "F"
  ELSE IF row.gender가 비어있지 않으면 → errors.push("성별은 남/여 또는 M/F만 가능합니다")

  # 축일 형식 검증
  IF row.baptizedAt이 비어있지 않고 MM/DD 정규식 불일치 → errors.push("축일은 MM/DD 형식이어야 합니다")

  # 전화번호 숫자 추출
  IF row.contact가 있으면 → 숫자만 추출, 결과가 비어있으면 에러

  # 나이 검증
  IF row.age가 있으면 → 양의 정수 확인

  row.status = errors.length > 0 ? 'error' : 'success'
  row.errors = errors
```

### 타입 정의

```
ParsedRow: {
  rowIndex: number          # 원본 행 번호 (1-based, 헤더 제외)
  groupName: string         # 학년 (원본 값)
  societyName: string       # 이름
  catholicName: string      # 세례명
  gender: string            # 성별 (원본 값)
  contact: string           # 전화번호 (원본 값)
  baptizedAt: string        # 축일 (원본 값)
  age: string               # 나이 (원본 값)
  description: string       # 비고
}

ValidatedRow extends ParsedRow: {
  groupId: string | null    # 매칭된 그룹 ID
  normalizedGender: 'M' | 'F' | null  # 정규화된 성별
  normalizedContact: number | null     # 숫자 변환된 연락처
  normalizedAge: number | null         # 숫자 변환된 나이
  status: 'success' | 'error'
  errors: string[]          # 에러 메시지 배열
}
```

### 최대 건수 검증

- 파싱 후 데이터 행이 500건 초과 시 에러 반환 (파싱 단계에서 차단)

## F2: 엑셀 템플릿 생성 유틸리티

### 파일 위치

`apps/web/src/features/student/utils/excel-template.ts`

### 템플릿 생성 로직

```
1. XLSX.utils.aoa_to_sheet([헤더 행])
   헤더: ["학년", "이름", "세례명", "성별", "전화번호", "축일", "나이", "비고"]
2. 컬럼 너비 설정 (wch)
3. XLSX.utils.book_new() → book_append_sheet()
4. XLSX.writeFile(workbook, '학생_등록_양식.xlsx')
```

- 파일명: `학생_등록_양식.xlsx`
- 시트명: `학생목록`
- 헤더만 포함 (데이터 행 없음)

## F3: Import 모달 컴포넌트

### 파일 위치

`apps/web/src/features/student/components/StudentImportModal.tsx`

### 컴포넌트 구조

```
StudentImportModal.tsx
├── Dialog (shadcn/ui)
│   └── DialogContent (max-w-4xl, max-h-[80vh], overflow-y-auto)
│       ├── DialogHeader
│       │   ├── DialogTitle: "엑셀로 학생 등록"
│       │   └── DialogDescription: 안내 문구
│       │
│       ├── [초기 상태] (file === null)
│       │   ├── 양식 다운로드 버튼 (variant="outline", Download 아이콘)
│       │   ├── 파일 선택 영역 (input type="file", accept=".xlsx")
│       │   └── 취소 버튼
│       │
│       └── [미리보기 상태] (file !== null)
│           ├── 파일명 표시 + 요약 (전체 N건, 성공 M건, 실패 K건)
│           ├── 미리보기 Table
│           │   ├── TableHeader: 상태, 학년, 이름, 세례명, 성별, 전화번호, 축일, 나이, 비고
│           │   └── TableBody: ValidatedRow[] 렌더링
│           │       ├── 성공 행: 기본 스타일
│           │       └── 에러 행: bg-red-50 + 에러 메시지 표시
│           ├── DialogFooter
│           │   ├── 다시 선택 버튼 (variant="outline") → 초기 상태로
│           │   ├── 취소 버튼
│           │   └── 등록 버튼 (성공 행 수 표시, 성공 0건이면 disabled)
│           └── [등록 중 상태] 등록 버튼 로딩
```

### Props

```
open: boolean
onOpenChange: (open: boolean) => void
groups: { id: string, name: string }[]    # 그룹 목록 (학년 매칭용)
onImportSuccess: () => void               # 등록 성공 콜백 (목록 갱신)
```

### 상태 관리

```
file: File | null                       # 업로드한 파일
validatedRows: ValidatedRow[] | null    # 검증 결과
isRegistering: boolean                  # 등록 중 여부
```

### 사용 컴포넌트

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| Dialog / DialogContent | Dialog | 모달 컨테이너 |
| DialogHeader / DialogTitle | Dialog | 모달 제목 |
| DialogDescription | Dialog | 모달 설명 |
| DialogFooter | Dialog | 하단 버튼 영역 |
| Button | Button | 양식 다운로드, 등록, 취소 |
| Table / TableHeader / TableBody / TableRow / TableCell | Table | 미리보기 테이블 |
| Input | Input | 파일 선택 (type="file") |

### 상태별 UI

| 상태 | UI 표시 |
|------|---------|
| 초기 (파일 없음) | 양식 다운로드 버튼 + 파일 선택 영역 |
| 파싱 중 | Loader2 스피너 |
| 미리보기 | 테이블 + 요약 + 등록 버튼 |
| 등록 중 | 등록 버튼 disabled + "등록 중..." 텍스트 |
| 등록 완료 | toast 알림 + 모달 닫기 |

### 사용자 인터랙션

| 액션 | 트리거 | 결과 |
|------|--------|------|
| 양식 다운로드 | 버튼 클릭 | F2 유틸리티 호출 → .xlsx 다운로드 |
| 파일 선택 | input change | F1 파싱/검증 → 미리보기 상태로 전환 |
| 다시 선택 | 버튼 클릭 | file=null, 초기 상태로 복귀 |
| 등록 | 버튼 클릭 | 성공 행만 추출 → bulkCreate API 호출 |
| 취소 | 버튼 클릭 / 모달 외부 클릭 | 모달 닫기, 상태 초기화 |

### 레이아웃

| 뷰포트 | 레이아웃 | 비고 |
|--------|----------|------|
| 모바일 (< 768px) | max-w-4xl, overflow-x-auto | 테이블 가로 스크롤 |
| 데스크톱 (≥ 768px) | max-w-4xl | 테이블 전체 표시 |

## F4: 학생 목록 페이지 통합

### 파일 위치

`apps/web/src/pages/student/StudentListPage.tsx`

### 변경 사항

1. **버튼 추가**: "학생 추가" 버튼 옆에 "엑셀 업로드" 버튼 추가 (variant="outline")
2. **모달 연결**: `StudentImportModal` 렌더링 + open 상태 관리
3. **성공 콜백**: Import 성공 시 `student.list` 쿼리 invalidate → 목록 자동 갱신
4. **toast 알림**: 등록 결과 표시 ("N명의 학생이 등록되었습니다")

### 기존 UX 유지

- "학생 추가" 버튼 (네비게이션)은 기존 그대로 유지
- "엑셀 업로드" 버튼은 별도 진입점으로 추가
- 기존 검색, 필터, 페이지네이션에 영향 없음

### tRPC 호출

```
# useStudents 훅에 bulkCreate 추가
const bulkCreate = trpc.student.bulkCreate.useMutation({
    onSuccess: () => {
        utils.student.list.invalidate();
        toast.success('학생이 등록되었습니다');
    }
});

# 호출
await bulkCreate.mutateAsync({
    students: successRows.map(row => ({
        societyName: row.societyName,
        catholicName: row.catholicName || undefined,
        gender: row.normalizedGender || undefined,
        age: row.normalizedAge || undefined,
        contact: row.normalizedContact || undefined,
        baptizedAt: row.baptizedAt || undefined,
        description: row.description || undefined,
        groupId: row.groupId,
    }))
});
```

## 테스트 시나리오

### 정상 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 양식 다운로드 | 버튼 클릭 | .xlsx 파일 다운로드, 헤더 8컬럼 |
| 8컬럼 파일 업로드 | 올바른 .xlsx | 미리보기 테이블에 모든 행 '성공' |
| 6컬럼 파일 업로드 | 기본 컬럼만 | 나이/비고 빈 값으로 미리보기 |
| 성별 "남"/"여" 입력 | 한글 성별 | M/F로 정규화 표시 |
| 성공 행만 등록 | 에러/성공 혼합 파일 | 성공 행만 API 전송, 결과 toast |

### 예외 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| .csv 파일 업로드 | 비-xlsx 파일 | 파일 input에서 차단 (accept=".xlsx") |
| 빈 파일 | 데이터 없는 .xlsx | "데이터가 없습니다" 에러 |
| 500건 초과 | 501행 파일 | "500건 이하로 업로드해주세요" 에러 |
| 필수값 누락 | 이름 없는 행 | 해당 행 에러, 에러 사유 표시 |
| 학년 미매칭 | 존재하지 않는 학년 | 해당 행 에러 |
| 전체 행 에러 | 모든 행 검증 실패 | 등록 버튼 disabled |
| 파일 재선택 | "다시 선택" 클릭 | 초기 상태로 복귀 |

### 접근성 체크리스트

- [ ] 파일 input에 Label 연결
- [ ] 버튼에 명확한 텍스트
- [ ] 키보드 네비게이션 (모달 내 Tab 이동)
- [ ] 에러 행 시각적 구분 + 텍스트 에러 메시지 (색상만 의존 X)

## AI 구현 지침

### 파일 위치
- 파싱 유틸: `apps/web/src/features/student/utils/excel-import.ts`
- 템플릿 유틸: `apps/web/src/features/student/utils/excel-template.ts`
- Import 모달: `apps/web/src/features/student/components/StudentImportModal.tsx`
- 학생 목록: `apps/web/src/pages/student/StudentListPage.tsx` (수정)
- 훅: `apps/web/src/features/student/hooks/useStudents.ts` (bulkCreate 추가)

### 참고할 기존 패턴
- 모달 패턴: `apps/web/src/features/student/components/DeletedStudentsModal.tsx`
- 테이블 패턴: `StudentListPage.tsx`의 Table 컴포넌트 사용법
- tRPC 훅: `useStudents.ts`의 mutation 패턴 (onSuccess → invalidate + toast)
- 폼 필드: `StudentForm.tsx`의 검증 패턴

### 코드 스타일
- 화살표 함수 사용
- shadcn/ui 컴포넌트 import from `@/components/ui/`
- lucide-react 아이콘: `Download`, `Upload`, `FileSpreadsheet` 등
- toast: `sonner`의 `toast.success()`, `toast.error()`

---

**작성일**: 2026-03-10
**리뷰 상태**: Draft
