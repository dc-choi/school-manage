# Task: 계정 모델 전환

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.
> 기능 설계의 요구사항을 **역할별 구현 가능한 단위로 분할**합니다.

## 상위 문서

- PRD: `docs/specs/prd/account-model-transition.md`
- 기능 설계:
  - `docs/specs/functional-design/account-model-transition.md` (데이터 모델)
  - `docs/specs/functional-design/account-model-transition-migration.md` (마이그레이션)
  - `docs/specs/functional-design/account-model-transition-flows.md` (플로우 + UI/UX)
  - `docs/specs/functional-design/account-model-transition-api.md` (API + 권한)
  - `docs/specs/functional-design/account-model-transition-phases.md` (구현 단계)

## 목표

공유 계정 모델(Account → Group 1:N)을 개인 계정 + 조직 모델(Parish → Church → Organization → Account/Group/Student)로 전환하여, 계정별 데이터 격리 + 조직 합류 플로우를 구현한다.

## 범위

### 포함
- [x] Prisma 스키마 변경 (신규 6 테이블 + 기존 4 테이블 변경)
- [x] Parish 시드 데이터 (16개 교구)
- [x] Context 확장 + scopedProcedure 추가
- [x] 신규 API 10개 (parish/church/organization)
- [x] 기존 UseCase 전체 스코프 전환 (accountId → organizationId)
- [x] /join, /pending 신규 화면
- [x] 학생 N:M 그룹 UI 변경
- [x] 마이그레이션 스크립트 (38개 계정)

### 제외
- [ ] admin 강등/위임 정책 (MVP 외)
- [ ] 진급 로직 N:M 전환 (추후 별도 설계)
- [ ] 멀티 조직 전환 (계정별 1조직 고정)
- [ ] 마이그레이션 사전 공지 (운영 작업, 코드 외)

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | Prisma 스키마 변경 | 신규 테이블 6개 (Parish, Church, Organization, StudentGroup, JoinRequest, AccountSnapshot) + 기존 테이블 변경 (Account, Group, Student, StudentSnapshot) + Parish 16개 교구 시드 | 없음 |
| B2 | Context + scopedProcedure | AuthContext에 OrganizationInfo, ChurchInfo 추가. context.ts에서 Account+Organization+Church+Parish 조인 조회. scopedProcedure 추가 (ctx.organization 필수) | B1 |
| B3 | 신규 도메인 API | parish.list, church.create/search, organization.list/create/requestJoin/pendingRequests/approveJoin/rejectJoin/members — tRPC 라우터 + UseCase 10개 | B2 |
| B4 | 기존 UseCase 스코프 전환 | Group/Student/Attendance/Statistics UseCase: accountId → organizationId 전환. Student: groupId → StudentGroup N:M. 신규 procedures(bulkCreate/bulkDelete/restore/graduate/cancelGraduation/bulkRegister/bulkCancelRegistration) 포함 전체 scopedProcedure 적용. ListStudentsUseCase registered/graduated 필터 스코프 전환 | B2 |
| B5 | Account 엣지 케이스 | admin 삭제 불가 처리. teacher 삭제 시 organizationId null. teacher 복원 시 /join 유도. StudentSnapshot organizationId 사용 | B4 |
| B6 | 마이그레이션 스크립트 | 38개 계정 데이터 마이그레이션 SQL 작성 (20개 자동 이관 + 18개 null 유지). Church 19개 + Organization 20개 생성. StudentGroup 일괄 생성. StudentSnapshot 백필. AccountSnapshot 초기 생성. 검증 쿼리 | B4 |

**Development**: `docs/specs/target/functional/development/account-model-transition-backend.md`

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | /join 화면 | 교구 선택 → 본당 검색/생성 → 조직 선택/생성. AuthLayout 사용. parish.list, church.search/create, organization.list/create/requestJoin 호출 | B3 |
| F2 | /pending 화면 | 승인 대기 화면 + 요청 취소 버튼. 재로그인 시 상태 확인 → 승인 완료 시 대시보드 진입 | B3 |
| F3 | 합류 요청 관리 UI | 관리자 대시보드에서 합류 요청 목록 (pendingRequests) + 승인/거절 버튼. organization.pendingRequests/approveJoin/rejectJoin 호출 | B3 |
| F4 | 라우팅 변경 | 로그인 후 organizationId 확인 → null이면 /join 또는 /pending 리다이렉트. 회원가입 후 /join 리다이렉트. scopedProcedure FORBIDDEN 시 /join 리다이렉트 | B2, F1, F2 |
| F5 | 기존 UI 변경 | MainLayout 헤더: Organization (Church) + displayName. 학생 생성/수정: groupIds 복수 선택. 학생 목록: 다중 그룹 필터 | B4 |

**Development**: `docs/specs/target/functional/development/account-model-transition-frontend.md`

---

## 업무 의존성 다이어그램

```
[B1] ──▶ [B2] ──┬──▶ [B3] ──┬──▶ [F1] ──▶ [F4]
                │           │              ▲
                │           ├──▶ [F2] ─────┘
                │           │
                │           └──▶ [F3]
                │
                └──▶ [B4] ──▶ [B5]
                      │
                      ├──▶ [B6]
                      │
                      └──▶ [F5]
```

---

## 검증 체크리스트

### 기능 검증
- [ ] 모든 역할의 업무가 완료되었는가?
- [ ] 역할 간 의존성이 충족되었는가?
- [ ] 기존 기능에 영향이 없는가?

### 요구사항 추적
- [ ] PRD의 Must Have 요구사항이 모두 업무에 반영되었는가?
- [ ] 기능 설계의 API/데이터 모델이 백엔드 업무에 포함되었는가?
- [ ] 기능 설계의 UI/UX가 프론트엔드 업무에 포함되었는가?

---

**작성일**: 2026-03-04
**상태**: Draft
