# Development: 학생 등록 관리 - 프론트엔드

> Task에서 분할된 **프론트엔드 업무를 수행하기 위한 세부 구현 내용**입니다.

## 상위 문서

- PRD: `docs/specs/prd/student-registration.md`
- 기능 설계: `docs/specs/functional-design/student-management.md` (학생 등록 관리 섹션)
- Task: `docs/specs/target/functional/tasks/student-registration.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| F1 | tRPC 클라이언트 훅 | O |
| F2 | 등록 필터 UI | O |
| F3 | 등록 현황 요약 UI | O |
| F4 | 일괄 등록/취소 버튼 | O |
| F5 | 등록 상태 테이블 컬럼 | O |
| F6 | 엑셀 Import 등록 컬럼 | O |
| F7 | GA4 이벤트 | O |

## 구현 개요

학생 목록 페이지에 등록 필터, 등록 현황 요약, 일괄 등록/취소 버튼, 등록 상태 컬럼을 추가한다. 엑셀 Import에 9번째 "등록 여부" 컬럼을 추가하고, GA4 이벤트를 연동한다.

---

## F1: tRPC 클라이언트 훅

### 파일 위치

- `apps/web/src/features/student/hooks/useStudents.ts` (기존 파일 수정)

### 변경 사항

#### 필터 파라미터 추가

훅 옵션에 추가:

```
initialRegistrationFilter: 'all' | 'registered' | 'unregistered' (기본값: 'all')
```

내부 상태:

```
registrationFilter: 'all' | 'registered' | 'unregistered'
registrationYear: number (현재 연도)
```

#### listQuery 입력 변경

기존 쿼리 입력에 추가:

```
registered:
  'all' → undefined (전달하지 않음)
  'registered' → true
  'unregistered' → false
registrationYear: registrationYear
```

#### 뮤테이션 추가

```
bulkRegister: trpc.student.bulkRegister.useMutation({
  onSuccess: (data) => {
    toast 성공 메시지: `${data.registeredCount}명이 등록되었습니다`
    utils.student.list.invalidate()
    clearSelection()
    trackStudentRegistration(data.registeredCount)
  }
})

bulkCancelRegistration: trpc.student.bulkCancelRegistration.useMutation({
  onSuccess: (data) => {
    toast 성공 메시지: `${data.cancelledCount}명의 등록이 취소되었습니다`
    utils.student.list.invalidate()
    clearSelection()
    trackStudentRegistrationCancel(data.cancelledCount)
  }
})
```

#### 반환값 추가

```
// 데이터
registrationSummary: listQuery.data?.registrationSummary
registrationFilter, setRegistrationFilter
registrationYear, setRegistrationYear

// 액션
bulkRegister: (ids: string[]) => bulkRegisterMutation.mutate({ ids, year: registrationYear })
bulkCancelRegistration: (ids: string[]) => bulkCancelRegistrationMutation.mutate({ ids, year: registrationYear })

// 로딩 상태
isBulkRegistering: bulkRegisterMutation.isPending
isBulkCancellingRegistration: bulkCancelRegistrationMutation.isPending
```

---

## F2: 등록 필터 UI

### 파일 위치

- `apps/web/src/pages/student/StudentListPage.tsx` (기존 파일 수정)

### UI 명세

기존 삭제 필터 옆에 등록 필터 셀렉트 추가:

```
[검색 영역] [삭제 필터 ▾] [등록 필터 ▾]
```

#### 사용 컴포넌트

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| Select | Select, SelectTrigger, SelectContent, SelectItem | 등록 필터 드롭다운 |

#### 셀렉트 옵션

| 값 | 라벨 |
|----|------|
| all | 전체 (등록) |
| registered | 등록 |
| unregistered | 미등록 |

#### 상태별 UI

| 상태 | 동작 |
|------|------|
| 필터 변경 시 | page를 1로 리셋 |
| 삭제 필터가 '삭제' 또는 '전체'일 때 | 등록 필터 동작에 영향 없음 (독립적) |

---

## F3: 등록 현황 요약 UI

### 파일 위치

- `apps/web/src/pages/student/StudentListPage.tsx` (기존 파일 수정)

### UI 명세

학생 목록 상단, 테이블 바로 위에 등록 현황 요약 표시:

```
2026년 등록 현황: 등록 32명 / 미등록 8명
```

#### 구현

```
registrationSummary가 존재할 때만 표시
텍스트: `${registrationYear}년 등록 현황: 등록 ${registeredCount}명 / 미등록 ${unregisteredCount}명`
스타일: text-sm text-muted-foreground
```

#### 상태별 UI

| 상태 | 표시 |
|------|------|
| 데이터 로딩 중 | 표시하지 않음 |
| registrationSummary 없음 | 표시하지 않음 |
| 정상 데이터 | 요약 텍스트 표시 |

---

## F4: 일괄 등록/취소 버튼

### 파일 위치

- `apps/web/src/pages/student/StudentListPage.tsx` (기존 파일 수정)

### UI 명세

기존 "선택 삭제" / "선택 졸업" 버튼 옆에 "등록" / "등록 취소" 버튼 추가:

```
체크박스 선택 시:
[선택 삭제 (N)] [선택 졸업 (N)] [등록 (N)] [등록 취소 (N)]
```

#### 사용 컴포넌트

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| Button | Button | 등록/등록 취소 버튼 |
| AlertDialog | AlertDialog* | 확인 다이얼로그 |

#### 버튼 조건

| 버튼 | 표시 조건 | variant |
|------|----------|---------|
| 등록 (N) | `isSomeSelected && deletedFilter !== 'deleted'` | default |
| 등록 취소 (N) | `isSomeSelected && deletedFilter !== 'deleted'` | outline |

#### 확인 다이얼로그

**등록 확인:**

```
제목: 학생 등록
설명: 선택한 {N}명의 학생을 {year}년도에 등록하시겠습니까?
     이미 등록된 학생은 건너뜁니다.
취소: 취소
확인: {isBulkRegistering ? '등록 중...' : '등록'}
```

**등록 취소 확인:**

```
제목: 등록 취소
설명: 선택한 {N}명의 학생의 {year}년도 등록을 취소하시겠습니까?
취소: 취소
확인: {isBulkCancellingRegistration ? '취소 중...' : '등록 취소'}
```

#### bulkAction 상태 확장

기존 `'delete' | 'graduate' | null`에 추가:

```
type BulkAction = 'delete' | 'graduate' | 'register' | 'cancelRegistration' | null;
```

#### 핸들러

```
handleBulkRegister:
  bulkRegister(Array.from(selectedIds))
  다이얼로그 닫기

handleBulkCancelRegistration:
  bulkCancelRegistration(Array.from(selectedIds))
  다이얼로그 닫기
```

---

## F5: 등록 상태 테이블 컬럼

### 파일 위치

- `apps/web/src/pages/student/StudentListPage.tsx` (기존 파일 수정)

### UI 명세

학생 목록 테이블에 "등록" 컬럼 추가 (마지막 컬럼 앞, 체크박스 다음 위치):

```
☑ | 이름 | 세례명 | 성별 | 나이 | 등록 | 연락처 | 축일 | 비고
```

#### 렌더링

```
isRegistered === true → "등록" (text-green-600, font-medium)
isRegistered === false → "미등록" (text-muted-foreground)
```

- Badge 대신 간단한 텍스트 표시로 구현
- 기존 컬럼 render 패턴과 동일하게 처리

---

## F6: 엑셀 Import 등록 컬럼

### 파일 위치

- `apps/web/src/features/student/utils/excel-import.ts` (기존 파일 수정)
- `apps/web/src/features/student/utils/excel-template.ts` (기존 파일 수정)

### excel-import.ts 변경

#### ParsedRow 타입 변경

```
기존 필드에 추가:
registered: string | null  // 9번째 컬럼 원본 값
```

#### parseExcelFile 변경

```
9번째 컬럼 (index 8) 파싱 추가:
registered = row[8]?.toString().trim() || null
```

- 9번째 컬럼이 없어도 정상 동작 (null)

#### ValidatedRow 타입 변경

```
기존 필드에 추가:
registered: boolean  // 정규화된 등록 여부
```

#### validateRows 변경

```
등록 여부 정규화:
IF registered === 'O' OR registered === 'o':
  validated.registered = true
ELSE:
  validated.registered = false
  (X, x, 빈 값, null 모두 false)
```

- 등록 여부는 에러를 발생시키지 않음 (O가 아니면 모두 false)

### excel-template.ts 변경

#### 헤더 추가

기존 8개 헤더 배열에 9번째 추가:

```
{ header: '등록 여부', width: 10 }
```

#### 코멘트 추가

```
열 9 (등록 여부):
"선택 입력\nO: 등록, X 또는 빈 값: 미등록"
```

### StudentImportModal 변경

#### 파일 위치

- `apps/web/src/pages/student/StudentImportModal.tsx` 또는 해당 모달 컴포넌트

#### 변경 사항

bulkCreate 호출 시 `registered` 필드 전달:

```
students 배열의 각 항목에 registered 필드 추가:
{ societyName, catholicName, ..., registered: validatedRow.registered }
```

- 미리보기 테이블에 "등록 여부" 컬럼 추가 (O/X 표시)

---

## F7: GA4 이벤트

### 파일 위치

- `apps/web/src/lib/analytics.ts` (기존 파일 수정)

### 이벤트 추가

```
trackStudentRegistration(count: number):
  event: 'student_registration'
  params: { count }

trackStudentRegistrationCancel(count: number):
  event: 'student_registration_cancel'
  params: { count }
```

- 기존 `safeGtag()` 래퍼 사용
- `useStudents` 훅의 onSuccess 콜백에서 호출

---

## 사용 컴포넌트 정리

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| Select | Select* | 등록 필터 드롭다운 |
| Button | Button | 등록/등록 취소 버튼 |
| AlertDialog | AlertDialog* | 확인 다이얼로그 |

## 상태별 UI 정리

| 상태 | UI 표시 |
|------|---------|
| 로딩 | 버튼 disabled, 텍스트 변경 ("등록 중...") |
| 에러 | 기존 에러 처리 패턴 유지 (toast) |
| 빈 선택 | 등록/등록 취소 버튼 숨김 |
| 성공 | toast 성공 메시지 + 목록 갱신 + 선택 해제 |

## 접근성 체크리스트

- [ ] 등록 필터 Select에 Label 또는 aria-label 연결
- [ ] 등록/등록 취소 버튼에 명확한 텍스트
- [ ] AlertDialog에 키보드 네비게이션 지원 (shadcn/ui 기본 제공)
- [ ] 등록 상태 텍스트에 충분한 색상 대비

## 테스트 시나리오

> 테스트 파일: `apps/web/test/student-registration.test.tsx`
> 프레임워크: Vitest + Testing Library

### 정상 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 등록 필터 "미등록" 선택 | 필터 변경 | registered=false 파라미터로 쿼리 |
| 등록 현황 요약 표시 | 목록 조회 | "2026년 등록 현황: 등록 N명 / 미등록 M명" 텍스트 |
| 학생 선택 후 등록 버튼 | 체크박스 선택 → 등록 클릭 | bulkRegister 뮤테이션 호출 |
| 등록 상태 컬럼 표시 | 목록 렌더링 | isRegistered에 따라 "등록"/"미등록" 표시 |
| 엑셀 9컬럼 파싱 | 9컬럼 엑셀 업로드 | registered=true/false 정규화 |
| 엑셀 8컬럼 하위호환 | 8컬럼 엑셀 업로드 | registered=false (기본값) |
| 엑셀 "O" → true 정규화 | "O" 입력 | registered=true |
| 엑셀 "X" → false 정규화 | "X" 입력 | registered=false |

### 예외 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 선택 없이 등록 버튼 | 미선택 | 버튼 숨김 (렌더링 안 됨) |
| 등록 중 로딩 | 뮤테이션 진행 중 | 버튼 disabled + "등록 중..." 텍스트 |

## AI 구현 지침

### 파일 위치

- 훅: `apps/web/src/features/student/hooks/useStudents.ts`
- 페이지: `apps/web/src/pages/student/StudentListPage.tsx`
- 엑셀 파서: `apps/web/src/features/student/utils/excel-import.ts`
- 엑셀 템플릿: `apps/web/src/features/student/utils/excel-template.ts`
- 모달: 엑셀 Import 모달 컴포넌트
- GA4: `apps/web/src/lib/analytics.ts`
- 테스트: `apps/web/test/`

### 참고할 기존 패턴

- 일괄 삭제 버튼: `StudentListPage.tsx` bulkDelete AlertDialog 패턴
- 삭제 필터: `useStudents.ts` deleteFilter → registered 필터 동일 패턴
- 엑셀 파싱: `excel-import.ts` parseExcelFile + validateRows 2단계 파이프라인
- 엑셀 템플릿: `excel-template.ts` downloadExcelTemplate 헤더 + 코멘트 패턴
- GA4: `analytics.ts` safeGtag 래퍼 + 이벤트 네이밍 규칙

### 코드 스타일

- 화살표 함수 사용
- 파생 상태는 렌더링 중 계산 (useState + useEffect로 동기화하지 않음)
- `&&` 대신 삼항(`? … : null`) 사용
- Set 사용 (Array.includes 대신)

---

**작성일**: 2026-03-10
**리뷰 상태**: Draft
