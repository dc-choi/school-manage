# 기능 설계: 계정 모델 전환 — 구현 단계

> 구현 편의 기준으로 4단계를 정의합니다. 로컬에서 전체 테스트 후 일괄 배포합니다.

## 연결 문서

- **데이터 모델**: `docs/specs/functional-design/account-model-transition.md`
- **마이그레이션**: `docs/specs/functional-design/account-model-transition-migration.md`
- **플로우 + UI/UX**: `docs/specs/functional-design/account-model-transition-flows.md`
- **API + 권한**: `docs/specs/functional-design/account-model-transition-api.md`

---

## 단계 개요

| 단계 | 이름 | 핵심 | 범위 |
|------|------|------|------|
| **A** | Prisma 스키마 | 테이블 + 관계 + 시드 | DB 전체 변경 |
| **B** | 백엔드 | Context + API + UseCase | 서버 코드 전체 |
| **C** | 프론트엔드 | /join, /pending, UI 변경 | 클라이언트 코드 전체 |
| **D** | 마이그레이션 스크립트 | 38개+ 계정 데이터 이관 | 데이터 변환 + 검증 |

> **원칙**: 로컬에서 A→B→C→D 순서로 구현 + 테스트. 배포는 일괄.

---

## Phase A: Prisma 스키마

### 범위

**신규 테이블**
- Parish, Church, Organization, StudentGroup, JoinRequest, AccountSnapshot

**기존 테이블 변경**
- Account: `organizationId` (FK → Organization, nullable), `role` (String, nullable) 추가
- Group: `organizationId` (FK → Organization) 추가, `accountId` 제거
- Student: `organizationId` (FK → Organization) 추가, `groupId` 제거, studentGroups 관계 추가
- StudentSnapshot: `organizationId` 추가 (nullable, 기존 groupId 유지)

**시드 데이터**
- Parish 16개 교구 INSERT (마이그레이션 SQL에 포함)

**관계 정의**
- Parish 1:N Church 1:N Organization 1:N {Account, Group, Student}
- Student N:M Group (via StudentGroup)
- Account 1:N JoinRequest, Organization 1:N JoinRequest

### 완료 조건

- `prisma migrate dev` 성공
- 스키마 변경 후 기존 코드 컴파일 에러 확인 (Phase B에서 해결)

---

## Phase B: 백엔드

### 범위

**Context 확장**
- `OrganizationInfo`, `ChurchInfo` 타입 추가
- context.ts: Account 조회 시 Organization + Church + Parish 조인
- organizationId null → ctx.organization = undefined

**프로시저**
- `scopedProcedure` 추가: consentedProcedure + ctx.organization 존재 확인

**신규 API** (10개)
- parish.list (consented)
- church.create, church.search (consented)
- organization.list, organization.create, organization.requestJoin (consented)
- organization.pendingRequests, organization.approveJoin, organization.rejectJoin (scoped, admin)
- organization.members (scoped)

**기존 UseCase 변경**
- Group: `accountId` → `organizationId` 스코프 전환
- Student: `groupId` → StudentGroup N:M, `organizationId` 스코프 (bulkCreate/bulkDelete/restore/graduate/cancelGraduation/bulkRegister/bulkCancelRegistration 포함 전체 전환)
- Attendance: organizationId 스코프 검증
- Statistics: accountId → organizationId (registeredStudents 포함)
- Account 삭제: admin 삭제 불가, teacher 삭제 시 organizationId null 처리
- Account 복원: Account만 복원, organizationId 재설정 필요 (/join)
- StudentSnapshot: organizationId 사용

**기존 라우트 변경**
- Group/Student/Attendance/Statistics 라우트: scopedProcedure 적용

### 완료 조건

- 신규 API 테스트 통과
- 기존 API 테스트 통과 (scopedProcedure 기반)
- `pnpm typecheck` 통과
- `pnpm test` 통과

---

## Phase C: 프론트엔드

### 범위

**신규 화면**
- /join: 교구 선택 → 본당 검색/생성 → 조직 선택/생성 (AuthLayout)
- /pending: 승인 대기 화면 + 요청 취소

**라우팅 변경**
- 로그인 후: organizationId 확인 → null + pending 요청 있음 → /pending
- 로그인 후: organizationId 확인 → null + 요청 없음 → /join
- 회원가입 후: /join으로 리다이렉트
- scopedProcedure FORBIDDEN 응답 시 /join 리다이렉트

**UI 변경**
- MainLayout 헤더: Organization 이름 (Church 이름) + displayName
- 학생 생성/수정: groupIds 복수 선택 (체크박스/멀티셀렉트)
- 학생 목록: 다중 그룹 필터

### 완료 조건

- 신규 가입 → /join → 조직 생성 → CRUD 전체 동작
- 기존 조직 합류 요청 → /pending → 승인 후 진입
- 기존 UI 변경 동작 확인
- `pnpm build` 통과

---

## Phase D: 마이그레이션 스크립트

### 범위

**데이터 마이그레이션**
- 자동 마이그레이션 20개+: Church + Organization 생성 → Account/Group/Student 연결
  - 본당-교구 매핑 테이블 적용 (마이그레이션 문서 참조)
  - 같은 본당 복수 계정 → 같은 Church, 별도 Organization (구룡성당 사례)
  - Group.organizationId 설정
  - Student.organizationId 설정 + StudentGroup 레코드 생성
  - Account.organizationId + role = "ADMIN" 설정
- 미소속 처리 18개+: organizationId null 유지 → /join 유도
- StudentSnapshot: organizationId 백필
- AccountSnapshot: 마이그레이션 시점 초기 스냅샷 생성 (조직 계정만)

**검증**
- Group/Student/Attendance 건수 마이그레이션 전후 일치
- 자동 마이그레이션 대상: 기존 데이터 정상 조회
- 미소속 처리 대상: /join 리다이렉트
- 같은 Church에 복수 Organization: 각각 독립 데이터 유지 확인

### 배포 전략

1. DB 백업
2. Prisma 스키마 마이그레이션 (신규 테이블 + 컬럼 추가)
3. 데이터 마이그레이션 SQL 실행
4. 장위동 데이터 수동 검증 + 전체 정합성 자동 검증
5. Phase A~C 코드 배포

---

## 단계별 의존성

```
Phase A (Prisma 스키마)
    ↓
Phase B (백엔드)
    ↓
Phase C (프론트엔드)
    ↓
Phase D (마이그레이션 스크립트)
```

> 배포: D(스키마 + 데이터 마이그레이션) 먼저 실행 → A~C 코드 일괄 배포.

---

**작성일**: 2026-03-03
**작성자**: SDD 작성자
**상태**: Draft
