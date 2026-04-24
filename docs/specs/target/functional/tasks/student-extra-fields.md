# Task: 학생 추가 필드 (부모님 연락처)

> 상태: Draft | 작성일: 2026-04-24

## 상위 문서

- PRD: `docs/specs/prd/student-extra-fields.md`
- 기능 설계: `docs/specs/functional-design/student-extra-fields.md`

## 목표

`Student.parentContact`(단일 문자열 필드) 추가로 교사들이 비고란에 기입하던 부모님 연락처를 정규 필드로 저장·조회할 수 있다. 학생 관리 영역(생성·수정·상세·엑셀 Import) 전반에 반영한다.

## 범위

### 포함

- [x] Prisma 스키마 + 마이그레이션 (Student / StudentSnapshot)
- [x] Shared Zod 스키마 확장 (create / update / bulkCreate)
- [x] API UseCase 반영 (create / update / bulk-create-students)
- [x] Snapshot helper 시그니처 확장 (생성/조회)
- [x] 통합 테스트 보강 (정상 5건 + 예외 4건)
- [x] StudentForm·StudentDetailPage 입력 필드 추가
- [x] StudentImportModal + Excel 템플릿/파서 확장
- [x] 웹 테스트 보강

### 제외

- [ ] 출석 페이지 노출 — "출석부 UI 개편"(P1 FUNCTIONAL)으로 이월
- [ ] 부/모 연락처 2분리 — 단일 필드
- [ ] 생년월일 필드 — 별도 과제
- [ ] 기존 `description` 자동 파싱·마이그레이션 — 수동 이관

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`, `.claude/rules/typescript.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | Prisma 스키마 업데이트 | `Student.parentContact String? @db.VarChar(20)` + `StudentSnapshot` 동일 필드 추가 | 없음 |
| B2 | 마이그레이션 생성 | `/prisma-migrate` 스킬로 `ALTER TABLE … ADD COLUMN` 2건 생성. 무중단 추가 (nullable, 기본값 없음). 스냅샷 필드 포함 | B1 |
| B3 | Shared Zod 스키마 확장 | `createStudentInputSchema` / `updateStudentInputSchema` / `bulkCreateStudentItemSchema`에 `parentContact` 추가 — `/^[\d\-()\s]+$/` + max 20. `StudentBase` 출력 타입에 `parentContact?: string` 추가. 한글 에러 메시지 (`input-validation-hardening` 패턴 계승) | 없음 |
| B4 | CreateStudentUseCase 반영 | `data.parentContact = input.parentContact?.trim() \|\| null` 저장 로직 + 응답 변환 (`student.parentContact ?? undefined`) | B1, B3 |
| B5 | UpdateStudentUseCase 반영 | partial update 패턴 유지 (`if (input.parentContact !== undefined)`). `null`/빈 문자열 → NULL 저장 | B1, B3 |
| B6 | BulkCreateStudentsUseCase 반영 | 각 학생 항목에 `parentContact` 전파. 엑셀 행 누락 시 NULL 통과 | B1, B3 |
| B7 | Snapshot helper 확장 | `CreateStudentSnapshotInput`에 `parentContact: string \| null` 추가 → `createStudentSnapshot` / `createBulkStudentSnapshots` / `getBulkStudentSnapshots` 인터페이스와 반환 타입 `StudentSnapshotData`에도 반영. 호출 지점 전수 갱신 (create/update/bulkCreate/promote/graduate 등) | B1 |
| B8 | 통합 테스트 보강 | TC-1~5, TC-7, TC-E1~E4 (FD 기준). 단건/일괄/스냅샷/엑셀 하위호환 경로 포함. 실제 DB 기반 (`test/helpers/db-lifecycle.ts`) | B4, B5, B6, B7 |

**Development**: `docs/specs/target/functional/development/student-extra-fields-backend.md`

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`, `.claude/rules/design-patterns.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | StudentForm 입력 필드 추가 | 본인 연락처 입력 필드 아래에 "부모님 연락처 (선택)" 추가. `parentContactInput` 상태 + `inputMode="tel"` + placeholder `010-1234-5678` + `maxLength={20}`. 본인 연락처는 서버 검증이 숫자만 받으므로 `formatContact` + digits 추출 유지, parentContact는 **사용자 입력 원본 그대로 서버 전송** (FD 결정 반영) | B3 (타입) |
| F2 | StudentDetailPage 인라인 수정 필드 | 기존 편집 모드에 `parentContact` 필드 추가. `null`로 비우기 허용 | B3 (타입), F1 |
| F3 | Excel 템플릿 갱신 | `features/student/utils/excel-template.ts`: 다운로드 컬럼에 "부모 연락처" 추가. `excel-import.ts`: 헤더 매핑 보강. **기존 템플릿(컬럼 없음) 하위 호환** — 누락 시 undefined → 서버 NULL | B3 |
| F4 | StudentImportModal 미리보기 | 미리보기 테이블에 열 추가. 서버 오류 응답(행 단위) 기존 구조 그대로 재사용 | F3 |
| F5 | 웹 테스트 보강 | StudentForm 입력→onSubmit payload 검증 1건 + excel-import 하위 호환 검증 1건 (`apps/web/test/student-excel-import.test.ts` 연장) | F1, F3 |

**Development**: `docs/specs/target/functional/development/student-extra-fields-frontend.md`

> 별도 디자인 역할 없음 — 기존 `StudentForm` 스타일·간격 규칙 그대로 계승 (`rules/design.md` 기준)

---

## 업무 의존성 다이어그램

```
 B1 ─┬─▶ B2 (migration)
     ├─▶ B4 ─┐
     ├─▶ B5 ─┼─▶ B8 (tests)
     ├─▶ B6 ─┤
     └─▶ B7 ─┘
 B3 ─┴──▶ F1 ──▶ F2
          │
          └──▶ F3 ──▶ F4 ──▶ F5
```

- **Shared 패키지(B3) 선 빌드**가 Frontend 시작 전제 (`pnpm --filter @school/shared build` 또는 전역 `pnpm build`)
- **Backend B1~B7 완료 후** Frontend F1~F4 병행 가능

---

## 검증 체크리스트

- [ ] Prisma schema + 마이그레이션 SQL이 무중단 (nullable, 기본값 없음)
- [ ] Zod 정규식·길이 제약이 FD 명세와 일치 (`/^[\d\-()\s]+$/`, max 20)
- [ ] 빈 문자열 입력 시 서버가 NULL로 정규화 (3개 경로 공통)
- [ ] `StudentSnapshot` 신규 필드가 모든 스냅샷 생성 경로에서 채워짐
- [ ] 기존 엑셀 템플릿 업로드가 정상 동작 (컬럼 없어도 오류 없음)
- [ ] `StudentForm`/`StudentDetailPage` 입력→저장→응답 필드 노출 흐름 정상
- [ ] 통합 테스트 api 전체 통과 (회귀 없음), 웹 테스트 신규 케이스 포함 전체 통과
- [ ] `pnpm typecheck` / `pnpm build` / `pnpm test` 통과
- [ ] 본인 `contact` 필드 변경 없음 (BigInt 이관은 별도 TARGET BUGFIX)
