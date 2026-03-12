# 기능 설계: 계정 모델 전환 — 플로우 + UI/UX

> 사용자 플로우, 상태 전이, UI/UX, 예외 케이스, 테스트를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/account-model-transition.md`
- **데이터 모델**: `docs/specs/functional-design/account-model-transition.md`
- **마이그레이션**: `docs/specs/functional-design/account-model-transition-migration.md`
- **API + 권한**: `docs/specs/functional-design/account-model-transition-api.md`
- **구현 단계**: `docs/specs/functional-design/account-model-transition-phases.md`
- 기존 기능 설계: `docs/specs/functional-design/auth-account.md`

---

## 컨텍스트 스코프 전환

현재 모든 데이터 조회는 `ctx.account.id`로 스코프 필터링. 전환 후:

- 로그인 → JWT에 account 정보 유지
- context.ts에서 Account 조회 시 Organization + Church + Parish를 조인하여 가져옴 → ctx.organization, ctx.church 자동 설정
- 모든 데이터 조회: `ctx.organization.id`로 스코프 필터링
- **X-Organization-Id 헤더 불필요** (Account.organizationId에서 직접 파생)

```
[요청] Authorization: Bearer <JWT>
         ↓
[context.ts] JWT 디코드 → Account + Organization + Church + Parish 조인 조회
             → ctx.account + ctx.organization + ctx.church 설정
         ↓
[UseCase] ctx.organization.id로 데이터 스코프 필터링
```

---

## 사용자 플로우

### 플로우 1: 신규 가입 (새 조직 생성)

1. 회원가입 (개인 정보: name, displayName, password)
2. 개인정보 동의
3. /join 화면 진입
4. 교구(Parish) 선택 (사전 적재된 목록에서 선택)
5. 본당(Church) 검색 → 없으면 "새로 만들기"로 Church 생성
6. 조직(Organization) 생성 (예: "중고등부")
7. Account.organizationId 설정, role = "ADMIN" → 대시보드 즉시 진입

### 플로우 2: 신규 가입 (기존 조직 합류)

1. 회원가입 (개인 정보: name, displayName, password)
2. 개인정보 동의
3. /join 화면 진입
4. 교구 선택 → 본당(Church) 검색 → 조직(Organization) 선택
5. 합류 요청 (JoinRequest 생성, status = "pending")
6. "승인 대기" 화면 표시
7. 관리자 승인 → Account.organizationId 설정, role = "TEACHER" → 대시보드 진입

### 플로우 3: 기존 사용자 (조직 계정) 마이그레이션 후 로그인

1. 기존 ID/PW 로그인
2. Account.organizationId가 이미 설정됨 (마이그레이션에서 처리)
3. 대시보드 진입 (기존 데이터 그대로)

### 플로우 4: 기존 미사용 계정 로그인

1. 기존 ID/PW 로그인
2. Account.organizationId = null → /join 화면으로 리다이렉트
3. /join에서 교구→본당→조직 선택:
   - **같은 본당의 조직이 이미 존재** (마이그레이션됨) → 기존 조직에 합류 요청 → 관리자 승인 대기
   - **같은 본당의 조직이 없음** (본인이 해당 본당 최초) → 본당 + 조직 생성 → admin으로 즉시 진입
   - 예) 월곡동 1개 계정(데이터 없음): 본인이 최초이므로 본당 + 조직 생성 → admin

### 플로우 5: 관리자 합류 요청 승인

1. 관리자 로그인 → 대시보드
2. 합류 요청 알림 확인 (pendingRequests 조회)
3. 요청자 정보 확인 → 승인 또는 거절
4. 승인 시: 요청자 Account.organizationId 설정 + JoinRequest.status = "approved"
5. 거절 시: JoinRequest.status = "rejected"

### 상태 전이

```
[비인증] → 로그인 → [인증, organizationId 확인]
                         ├── organizationId 있음 → 대시보드
                         └── organizationId 없음 → [JoinRequest 확인]
                                                     ├── pending 요청 있음 → "승인 대기" 화면
                                                     └── 요청 없음 → /join
                                                                      ├── 새 조직 생성 → admin, 즉시 대시보드
                                                                      └── 기존 조직 합류 요청 → "승인 대기" 화면
                                                                                                   ↓
                                                                                            [관리자 승인]
                                                                                                   ↓
                                                                                        Account.organizationId 설정
                                                                                                   ↓
                                                                                               대시보드
```

---

## UI/UX

### 신규 화면

#### 교구/본당/조직 선택 화면 (/join)

- Account.organizationId가 null이고 pending JoinRequest도 없을 때 리다이렉트
- 단계별 구성:
  1. 교구(Parish) 선택 (드롭다운, 사전 적재된 목록)
  2. 본당(Church) 검색 → 결과 선택 또는 "새로 만들기"
  3. 조직(Organization) 선택 → 결과 선택(합류 요청) 또는 "새로 만들기"(즉시 진입)
- 새 조직 생성: Account.organizationId 설정 + role = "ADMIN" → 대시보드 즉시 진입
- 기존 조직 합류: JoinRequest 생성 → "승인 대기" 화면으로 전환
- 인증 레이아웃(AuthLayout) 사용

#### 승인 대기 화면 (/pending)

- pending JoinRequest가 있을 때 표시
- 내용: "관리자의 승인을 기다리고 있습니다" + 요청한 조직 정보
- 주기적 폴링 또는 재로그인 시 상태 확인 → 승인 완료 시 대시보드 진입
- 요청 취소 버튼 (JoinRequest 삭제 → /join으로 복귀)

### 변경 화면

#### MainLayout 헤더

- 현재: displayName + 로그아웃
- 변경: **Organization 이름 (Church 이름)** + displayName + 로그아웃

#### 회원가입 (/signup)

- 현재: name, displayName, password → 자동 로그인 → 대시보드
- 변경: name, displayName, password → 자동 로그인 → **/join** → 대시보드

#### 학생 생성/수정

- 현재: groupId 1개 선택 (드롭다운)
- 변경: groupIds 복수 선택 (체크박스 또는 멀티셀렉트)

#### 학생 목록

- 현재: groupId 기준 1개 그룹 필터
- 변경: 다중 그룹 필터 가능 (학생이 여러 그룹에 소속)

---

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| organizationId null 상태에서 도메인 API 호출 | scopedProcedure에서 FORBIDDEN, 클라이언트는 /join 또는 /pending 리다이렉트 |
| Church 삭제 시 하위 Organization | Church 소프트 삭제 → 하위 Organization도 소프트 삭제 (cascade) |
| Organization 삭제 시 소속 Account | Account.organizationId를 null로 → /join 리다이렉트 |
| 마이그레이션 중 기존 Account가 이미 삭제 상태 | 삭제된 Account는 마이그레이션 대상에서 제외 |
| 미사용 계정 (데이터 없음) + 같은 본당 조직 존재 | /join에서 기존 조직 표시 → 합류 요청 → 관리자 승인 |
| 미사용 계정 (데이터 없음) + 같은 본당 조직 없음 | /join에서 본당 + 조직 신규 생성 → admin으로 즉시 진입 |
| 학생이 모든 Group에서 제거됨 | StudentGroup 0건 허용 (그룹 미배정 상태) |
| 같은 Church에 같은 이름의 Organization | 허용 (동명 조직 가능, ID로 구분) |
| 합류 요청 시 이미 organizationId가 있는 Account | 에러 — 이미 조직 소속. 별도 계정 생성 안내 |
| 합류 요청 시 이미 pending JoinRequest가 있는 Account | 에러 — 이미 요청 진행 중 |
| 관리자가 합류 요청 거절 | JoinRequest.status = "rejected", 요청자는 재요청 가능 |
| 관리자가 아닌 사용자가 승인/거절 시도 | FORBIDDEN (admin role 검증) |
| admin 계정 삭제 시도 | 에러 — admin은 삭제 불가 |
| teacher 계정 삭제 시 Organization | Organization 유지 — Account.organizationId만 null 처리. 다른 멤버 접근 유지 |
| teacher 계정 복원 시 Organization | Organization은 복원 대상 아님 — Account만 복원, organizationId 재설정 필요 (/join) |
| 진급 (PromoteStudents) | <!-- TODO: N:M 전환 후 진급 로직 별도 설계 필요. 현재 Student.groupId 직접 변경 → StudentGroup 레코드 삭제+생성으로 변경 예정 --> 현행 유지, 추후 설계 |

---

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 신규 가입 → 교구 선택 → Church + Organization 생성 → admin으로 즉시 진입 → CRUD 정상
2. **TC-2**: 신규 가입 → 기존 Organization 합류 요청 → 관리자 승인 → teacher로 진입 → 동일 데이터 접근
3. **TC-3**: 기존 사용자(조직 계정) 로그인 → 마이그레이션된 Organization 자동 진입 → 기존 데이터 정상 조회
4. **TC-4**: 기존 사용자(개인 계정) 로그인 → /join 화면 → 교구→본당→조직 선택
5. **TC-5**: 관리자가 합류 요청 승인 → 요청자 Account.organizationId 설정
6. **TC-6**: 관리자가 합류 요청 거절 → 요청자 재요청 가능
7. **TC-7**: 학생 생성 시 복수 Group 지정 → StudentGroup 레코드 복수 생성
8. **TC-8**: 학생 목록에서 여러 Group에 소속된 학생 정상 표시
9. **TC-9**: AccountSnapshot 생성 확인 (회원가입, 프로필 변경 시)

### 예외 케이스

1. **TC-E1**: organizationId null 상태에서 scopedProcedure 호출 → FORBIDDEN
2. **TC-E2**: 다른 Organization의 Group/Student 접근 시도 → 데이터 없음 (organizationId 필터링)
3. **TC-E3**: 이미 조직 소속인 Account로 합류 요청 시도 → 에러
4. **TC-E4**: 이미 pending JoinRequest가 있는 상태에서 재요청 → 에러
5. **TC-E5**: teacher 역할로 승인/거절 시도 → FORBIDDEN
6. **TC-E6**: 마이그레이션 데이터 정합성 — Group/Student/Attendance 건수 보존 (조직 계정만)

---

**작성일**: 2026-03-03
**작성자**: SDD 작성자
**상태**: Draft
