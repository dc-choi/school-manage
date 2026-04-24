# 기능 설계: 학생 추가 필드 (부모님 연락처)

> 상태: Draft | 작성일: 2026-04-24

## 연결 문서

- PRD: `docs/specs/prd/student-extra-fields.md`
- 도메인 메인 (병합 대상): `docs/specs/functional-design/student-management.md`
- 검증 패턴 계승: `docs/specs/prd/input-validation-hardening.md`
- Task: `docs/specs/target/functional/tasks/student-extra-fields.md` (3단계 예정)
- Development: `docs/specs/target/functional/development/student-extra-fields-{backend|frontend}.md` (4단계 예정)

## 흐름/상태

### 사용자 플로우

1. **신규 등록**: [학생 추가 폼] → 부모 연락처 입력(선택) → 저장 → [학생 목록]
2. **기존 수정**: [학생 상세] → 편집 모드 → 부모 연락처 수정/삭제 → 저장 → [학생 상세 갱신]
3. **엑셀 업로드 (신규 템플릿)**: [Import 모달] → `부모 연락처` 컬럼 포함 → 검증 → 등록
4. **엑셀 업로드 (기존 템플릿, 하위 호환)**: [Import 모달] → 컬럼 없음 → 검증 통과 → `parentContact` NULL 저장

> 출석 페이지 내 부모 연락처 노출은 본 FD 범위 외 — "출석부 UI 개편"(P1 FUNCTIONAL)에서 통합 설계 예정.

## UI/UX

### 화면/컴포넌트

| 화면 | 변경 |
|------|------|
| `StudentForm` (생성·수정 공통) | `부모 연락처` 입력 필드 추가 (선택). placeholder `010-1234-5678`. 본인 연락처 아래 배치 |
| `StudentDetailPage` | 인라인 수정 필드 추가. 삭제(빈 값 저장) 허용 |
| `StudentListPage` | 테이블 컬럼 미노출 (화면 밀도 이유). 검색 대상 제외 |
| `StudentImportModal` | 템플릿 다운로드에 `부모 연락처` 열 포함. 미리보기 테이블에 열 추가 |

### 입력 UX

- 자유 텍스트 입력 (숫자·하이픈·공백·괄호 허용)
- 값 저장은 원본 그대로. 표시도 원본 그대로 (표시 포매팅 헬퍼는 범위 외)
- 빈 문자열 저장 시도 시 서버에서 NULL로 정규화

## 데이터/도메인 변경

### Student 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| `parent_contact` | `varchar(20)` NULL | 부모님 연락처 (신규) |

### StudentSnapshot 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| `parent_contact` | `varchar(20)` NULL | 스냅샷 시점 부모 연락처 (신규) |

### 마이그레이션

- Prisma 스키마 변경 → `/prisma-migrate` 스킬로 생성
- DDL: `ALTER TABLE student ADD COLUMN parent_contact VARCHAR(20) NULL` + `student_snapshot` 동일
- 무중단 (nullable, 기본값 없음, 기존 INSERT/UPDATE 경로 비파괴)
- 롤백: `DROP COLUMN` 2건. Snapshot 이력은 롤백 시 소실 → 배포 확정 후 되돌림 권장하지 않음

## API/인터페이스

### Zod 스키마 (`packages/shared/src/schemas/student.ts`)

| 스키마 | 필드 추가 |
|--------|----------|
| `createStudentInputSchema` | `parentContact` (optional) |
| `updateStudentInputSchema` | `parentContact` (nullable + optional) |
| `bulkCreateStudentItemSchema` | `parentContact` (optional) |

### 검증 규칙

- 정규식: `/^[\d\-()\s]+$/` — 숫자·하이픈·괄호·공백만 허용
- 최대 길이: 20자
- `optional()`이 undefined/미전송 처리. 빈 문자열은 서버에서 NULL 정규화 (UseCase 레이어)
- 한글 에러 메시지 (`input-validation-hardening` 패턴 계승): "부모님 연락처는 숫자·하이픈·괄호·공백만 허용합니다", "부모님 연락처는 20자 이하여야 합니다"

### 출력 타입

- `StudentBase`에 `parentContact?: string` 추가 → 전파 타입(`StudentWithGroup`, `GetStudentOutput`, `UpdateStudentOutput`, `CreateStudentOutput`) 자동 확장

### 프로시저 영향

| 프로시저 | 변경 |
|----------|------|
| `student.create` / `student.update` / `student.bulkCreate` | 입력·응답 확장 |
| `student.list` / `student.get` | 응답에 `parentContact` 포함 |
| 기타 | 무변경 |

### UseCase·Helper 변경

- `CreateStudentUseCase`, `BulkCreateStudentsUseCase`, `UpdateStudentUseCase`: `parentContact` 필드 저장/전파. **BigInt 변환 없음** (String 직접 저장)
- 빈 문자열 정규화: `input.parentContact?.trim() || null`
- `createStudentSnapshot` helper 시그니처 확장: `parentContact: string | null` 인자 추가. 호출 지점 전수 갱신 (create/update/bulkCreate/promote 등)
- `StudentSnapshotData`(조회 타입)에 `parentContact` 추가

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 필드 미전송 (`undefined`) | 정상 — 기존 값 보존(update) 또는 NULL(create) |
| 빈 문자열 `""` | 서버에서 NULL로 정규화 후 저장 |
| `update`에서 `null` 명시 | 필드 비움 (명시적 clear) |
| 20자 초과 | 400 BAD_REQUEST (한글 메시지) |
| 허용 외 문자 (한글·이모지) | 400 BAD_REQUEST (한글 메시지) |
| 엑셀 템플릿에 컬럼 없음 | 정상 — 전체 NULL 저장 |
| 엑셀 행에서 값만 누락 | 정상 — 해당 행 NULL |
| 엑셀 값이 서버 검증 위반 | 행 단위 오류 표시 (기존 bulk 검증 경로 재사용) |

## 측정/모니터링

- GA4 이벤트 (선택, Should): `student_parent_contact_set` — `student.create` / `student.update` 성공 시 `parentContact` 값이 있으면 트리거. 입력율 지표 추적 (PRD 성공 지표: 4주 내 ≥ 20%)

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: `student.create` + 정상 `parentContact` → 200, 응답 포함
2. **TC-2**: `student.update` + `parentContact` 부분 수정 → 200, 기타 필드 보존
3. **TC-3**: `student.update` + `parentContact: null` → 200, NULL 저장
4. **TC-4**: `student.bulkCreate` 혼합 (일부만 값) → 전 행 정상 저장
5. **TC-5**: 기존 엑셀 템플릿 업로드 → 전체 NULL, 오류 없음
6. **TC-6**: `student.list`/`student.get` 응답에 필드 노출 확인
7. **TC-7**: StudentSnapshot에 신규 필드가 기록되는지 확인 (생성 시점 스냅샷 조회)
8. **TC-8**: `StudentForm` UI 입력→저장→상세에서 표시 흐름 (통합)

### 예외 케이스

1. **TC-E1**: 21자 입력 → 400 BAD_REQUEST, 한글 메시지
2. **TC-E2**: 한글 포함 (`"김엄마 010-..."`) → 400 BAD_REQUEST
3. **TC-E3**: 엑셀 행 값이 정규식 위반 → 행 단위 오류, 다른 행은 정상 처리
4. **TC-E4**: `create`에서 `parentContact: ""` → NULL 저장 (정상)

## 개인정보 동의

- 동의서 문구에 "학생 및 **보호자** 연락처" 명시 (PRD 롤아웃 참조)
- 법률 자문 완료 여부는 본 작업 스코프 아님 — `docs/business/STATUS.md` 오픈 이슈에 위임
