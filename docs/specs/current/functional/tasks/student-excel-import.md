# Task: 학생 엑셀 Import

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.
> 기능 설계의 요구사항을 **역할별 구현 가능한 단위로 분할**합니다.

## 상위 문서

- PRD: `docs/specs/prd/student-excel-import.md`
- 기능 설계: `docs/specs/functional-design/student-management.md` (엑셀 Import 섹션)

## 목표

엑셀 파일(.xlsx) 업로드를 통해 학생을 일괄 등록할 수 있는 기능을 구현한다.
- 엑셀 템플릿 다운로드 → 파일 업로드 → 미리보기/검증 → 일괄 등록 플로우 완성
- 기존 개별 등록 UX에 영향 없이 별도 진입점 제공

## 범위

### 포함
- [x] 엑셀 파일(.xlsx) 파싱 및 검증 (클라이언트)
- [x] 엑셀 템플릿 다운로드 (클라이언트 런타임 생성)
- [x] Import 모달 UI (초기 상태 + 미리보기 상태)
- [x] 학생 일괄 등록 API (`student.bulkCreate`)
- [x] 등록 결과 요약 표시

### 제외
- [ ] CSV/Google Sheets 지원
- [ ] 기존 학생 정보 업데이트 (upsert)
- [ ] 중복 학생 감지 (Should — 이번 범위 외)

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | tRPC 스키마 정의 | `student.bulkCreate` 입력/출력 Zod 스키마 추가 (`@school/trpc`) | 없음 |
| B2 | BulkCreate UseCase 구현 | 학생 배열을 받아 일괄 등록하는 UseCase. Prisma `createMany` 또는 트랜잭션 내 개별 생성. 성공/실패 건수 반환 | B1 |
| B3 | tRPC 라우터 연결 | `student.bulkCreate` mutation을 라우터에 등록. 인증 미들웨어 적용 | B2 |

**Development**: `docs/specs/target/functional/development/student-excel-import-backend.md`

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | 엑셀 파싱/검증 유틸리티 | xlsx 라이브러리로 .xlsx 파싱, 8컬럼 순서 고정 매핑, 행별 검증 (필수값, 성별 정규화, 축일 형식, 그룹 매칭) | 없음 |
| F2 | 엑셀 템플릿 생성 유틸리티 | xlsx 라이브러리로 컬럼 헤더만 포함된 .xlsx 파일 생성 및 다운로드 | 없음 |
| F3 | Import 모달 컴포넌트 | 2단계 상태 UI — 초기 상태 (템플릿 다운로드 + 파일 업로드), 미리보기 상태 (테이블 + 검증 결과 + 등록 버튼) | F1, F2 |
| F4 | 학생 목록 페이지 통합 | 학생 목록 페이지에 "엑셀 업로드" 버튼 추가, Import 모달 연결, `student.bulkCreate` API 호출, 결과 표시 후 목록 갱신 | F3, B3 |

**Development**: `docs/specs/target/functional/development/student-excel-import-frontend.md`

---

## 업무 의존성 다이어그램

```
[B1] ──▶ [B2] ──▶ [B3] ─┐
                         ├──▶ [F4]
[F1] ──┬──▶ [F3] ───────┘
[F2] ──┘
```

- B1→B2→B3: 백엔드 순차 (스키마 → UseCase → 라우터)
- F1, F2: 프론트엔드 독립 (파싱/템플릿은 클라이언트 전용, API 불필요)
- F3: F1, F2 완료 후 모달 조립
- F4: F3 + B3 모두 완료 후 통합

---

## 검증 체크리스트

### 기능 검증
- [ ] 모든 역할의 업무가 완료되었는가?
- [ ] 역할 간 의존성이 충족되었는가?
- [ ] 기존 개별 학생 등록 기능에 영향이 없는가?

### 요구사항 추적
- [ ] PRD의 Must Have 요구사항이 모두 업무에 반영되었는가?
- [ ] 기능 설계의 API(`student.bulkCreate`)가 B1~B3에 포함되었는가?
- [ ] 기능 설계의 UI/UX(Import 모달 2단계)가 F1~F4에 포함되었는가?
- [ ] 엑셀 템플릿 다운로드가 F2에 포함되었는가?
- [ ] 성별 정규화(남/여 → M/F)가 F1 검증에 포함되었는가?

---

**작성일**: 2026-03-10
**상태**: Draft
