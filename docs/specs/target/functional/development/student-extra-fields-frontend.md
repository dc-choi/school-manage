# Development: 학생 추가 필드 (부모님 연락처) — Frontend

> 상태: Draft | 작성일: 2026-04-24

## 상위 문서

- PRD: `docs/specs/prd/student-extra-fields.md`
- 기능 설계: `docs/specs/functional-design/student-extra-fields.md`
- Task: `docs/specs/target/functional/tasks/student-extra-fields.md`
- Backend 연계: `development/student-extra-fields-backend.md`

## 구현 대상 업무

| Task # | 업무명 | 포함 |
|--------|-------|------|
| F1 | StudentForm 입력 필드 | O |
| F2 | StudentDetailPage 인라인 수정 | O |
| F3 | Excel 템플릿/파서 갱신 | O |
| F4 | StudentImportModal 미리보기 | O |
| F5 | 웹 테스트 보강 | O |

## 구현 개요

`StudentForm`(생성/수정 공통) + `StudentDetailPage`(인라인) + `StudentImportModal`(엑셀)에 `parentContact` 필드를 추가한다. 본인 `contact`와 달리 **사용자 입력 원본을 그대로 서버에 전송**(하이픈·괄호·공백 포함 허용) — 서버 정규식이 이를 받아 그대로 저장한다.

## 파일별 변경 지점

### 1. `StudentForm.tsx` (F1)

**파일**: `apps/web/src/pages/student/StudentForm.tsx`

- `StudentFormData` 인터페이스에 `parentContact?: string` 추가
- `useState` 초기값: `initialData?.parentContact ?? ''`
- 본인 연락처 필드 바로 아래에 **"부모님 연락처 (선택)"** 입력 필드 배치
  - `type="text"`, `inputMode="tel"`, `maxLength={20}`
  - placeholder: `"010-1234-5678"` 
  - 본인 연락처의 `formatContact` + digits 추출 로직 **미적용** — 입력 원본 그대로 상태에 저장
- `handleSubmit` payload: `parentContact: formData.parentContact?.trim() || undefined`
- Label 스타일·간격은 기존 필드와 동일 (`rules/design.md` 공통 폼 패턴 계승)

### 2. `StudentDetailPage.tsx` (F2)

**파일**: `apps/web/src/pages/student/StudentDetailPage.tsx`

- 인라인 수정 필드 섹션에 `parentContact` 추가
- 편집 모드: `Input` + 저장 시 `trim() || null` → `student.update({ parentContact: value || null })`
- 읽기 모드: `parentContact` 값이 있으면 그대로 표시, 없으면 `-` 또는 회색 placeholder
- null/undefined 처리는 기존 `contact` 패턴 참조

### 3. Excel 템플릿/파서 (F3)

**파일 1**: `apps/web/src/features/student/utils/excel-template.ts`

- `HEADERS`에 `'부모 연락처'` 추가. `COLUMN_WIDTHS`에 width 14 추가
- `HEADER_COMMENTS` 항목 추가: `"부모 연락처 (선택) : 하이픈·괄호·공백 포함 원본 입력 가능. 숫자만 입력 시 앞자리 0이 사라지면 셀 서식을 '텍스트'로 지정하세요. 예: 010-1234-5678"`

**파일 2**: `apps/web/src/features/student/utils/excel-import.ts`

- `ParsedRow` 인터페이스에 `parentContact: string` 추가
- `ValidatedRow`에 `normalizedParentContact: string | null` 추가
- `parseExcelFile` — 컬럼 수 9→10로 확장. 셀 위치는 맨 끝(10번째) 또는 적절한 자리. **기존 템플릿 하위 호환**: `cellAt(10)` 누락 시 빈 문자열로 처리되므로 자연 호환
- `validateRows`:
  - `row.parentContact`가 있으면 `/^[\d\-()\s]+$/` + max 20 검증
  - 통과: `normalizedParentContact = row.parentContact.trim()`
  - 실패: `errors.push("부모 연락처 ... 숫자·하이픈·괄호·공백만 입력해 주세요")`
- **본인 contact의 `digits.padStart(11, '0')` 복원 로직 미적용** — parentContact는 자유 포맷이라 복원 불가

### 4. `StudentImportModal.tsx` (F4)

**파일**: `apps/web/src/features/student/components/StudentImportModal.tsx`

- 미리보기 `<Table>` 헤더에 "부모 연락처" 열 추가
- 행 렌더링에서 `row.parentContact` 표시
- `bulkCreateMutation` 호출 payload에 `parentContact: row.normalizedParentContact ?? undefined` 추가

### 5. 웹 테스트 (F5)

**파일 1**: 신규 또는 기존 `StudentForm` 관련 테스트 — 없으면 생성
- 케이스: 부모 연락처 입력 → onSubmit payload에 원본 문자열 그대로 포함

**파일 2**: `apps/web/test/student-excel-import.test.ts` (기존)
- 케이스 추가: 10번째 컬럼 누락 (기존 템플릿) 파싱 → `parentContact` 빈 문자열 → `normalizedParentContact === null`
- 케이스 추가: 값 포함 → `normalizedParentContact` 원본 보존

## UI 명세

### 페이지/컴포넌트 구조 (변경 지점만)

```
StudentForm.tsx
└── 연락처 필드 (기존)
    └── 부모 연락처 필드 (신규, 선택)     ← F1

StudentDetailPage.tsx
└── 인라인 수정 필드 그룹
    └── 부모 연락처 인라인 (신규)         ← F2

features/student/
├── utils/
│   ├── excel-template.ts                 ← F3 (헤더/가이드)
│   └── excel-import.ts                   ← F3 (파서/검증)
└── components/
    └── StudentImportModal.tsx            ← F4 (미리보기 열 + payload)
```

### 사용자 인터랙션

| 액션 | 트리거 | 결과 |
|------|--------|------|
| 부모 연락처 입력(신규) | StudentForm 제출 | `student.create({ …, parentContact })` |
| 부모 연락처 수정 | StudentDetailPage 인라인 저장 | `student.update({ id, parentContact })` |
| 부모 연락처 삭제 | 인라인 값 비우고 저장 | `student.update({ id, parentContact: null })` |
| 엑셀 업로드 (신규 템플릿) | Import 모달 | 파싱 → 검증 → 미리보기 → 등록 |
| 엑셀 업로드 (기존 템플릿) | Import 모달 | parentContact 빈 → 미리보기에서 `-` → 서버 NULL 저장 |

## 입력 처리 규칙 (중요)

| 필드 | 클라이언트 처리 | 서버 전송 값 |
|------|---------------|-------------|
| 본인 `contact` (기존) | `formatContact` 표시 + submit 시 `contactInput.replace(/\D/g, '')` → digits만 추출 | `"01012345678"` (숫자 문자열) |
| 부모 `parentContact` (신규) | **원본 상태 그대로** 유지, 서브밋 시 `trim()`만 | `"010-1234-5678"` (원본 그대로) |

이 차이는 FD 결정 사항 — 기존 `contact`의 선행 0 잘림 문제를 피하는 포매팅 분리 전략이다.

## 테스트 시나리오

### 정상 케이스

| 시나리오 | 입력 | 기대 |
|---------|------|------|
| Form payload 원본 보존 | `"010-1234-5678"` 입력 → 제출 | `onSubmit` mock에 하이픈 포함 원본 전달 |
| 엑셀 파서 값 보존 | `"(02) 123-4567"` 셀 | `normalizedParentContact === "(02) 123-4567"` |
| 엑셀 하위 호환 | 기존 9컬럼 템플릿 | 파싱 정상, `parentContact: ""` → `normalizedParentContact: null` |

### 예외 케이스

| 시나리오 | 입력 | 기대 |
|---------|------|------|
| 엑셀 한글 포함 값 | `"엄마 010-..."` | `errors`에 포함, `status: 'error'` |
| 엑셀 21자 값 | 초과 길이 | 서버 500 이전에 클라이언트 검증 실패 |

## 주의사항

- **본인 contact와 parentContact 처리 차이 엄수**: 위 입력 처리 규칙 표 준수. 실수로 `formatContact`/`replace(/\D/g, '')`를 parentContact에 적용하지 않기
- **엑셀 컬럼 위치**: HEADERS 배열 끝에 추가하면 하위 호환성 유지. 기존 템플릿은 10번째 컬럼 없음 → `cellAt(10)`이 빈 문자열 반환 → 자연 통과
- **엑셀 셀 서식 가이드**: 사용자에게 "숫자만 입력 시 앞자리 0 사라지는 것 방지 위해 셀 서식을 '텍스트'로 지정" 안내 메시지 HEADER_COMMENTS 반영 필수
- **null vs undefined**: `StudentDetailPage` 인라인 저장에서 `null`(clear) vs `undefined`(skip) 구분 — `update` Zod 스키마의 `nullable+optional` 패턴 준수
- **미리보기 열 폭**: 모바일 렌더링 고려. 기존 `excel-template.ts` COLUMN_WIDTHS 패턴 따라 14 정도 적절
- **분석 이벤트 (선택, FD Should)**: `analytics.trackStudentCreated` 같은 기존 훅에 `parentContact` 값 유무 플래그 추가 여부는 GA4 팀 결정. Task F 범위 외로 두고 Should 미루기 권장
