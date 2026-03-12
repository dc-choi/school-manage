# Development: 계정 모델 전환 — 프론트엔드

> Task에서 분할된 프론트엔드 업무(F1~F5)의 세부 구현 내용입니다.

## 상위 문서

- PRD: `docs/specs/prd/account-model-transition.md`
- 기능 설계: `docs/specs/functional-design/account-model-transition*.md`
- Task: `docs/specs/target/functional/tasks/account-model-transition.md`

## 구현 대상 업무

| Task # | 업무명 | 이 문서에서 구현 |
|--------|--------|----------------|
| F1 | /join 화면 | O |
| F2 | /pending 화면 | O |
| F3 | 합류 요청 관리 UI | O |
| F4 | 라우팅 변경 | O |
| F5 | 기존 UI 변경 | O |

---

## F1: /join 화면

### 페이지 구조

```
JoinPage.tsx (AuthLayout)
├── Card
│   ├── CardHeader (단계 표시: 1/3, 2/3, 3/3)
│   ├── CardContent
│   │   ├── Step 1: ParishSelect (교구 선택)
│   │   ├── Step 2: ChurchSelect (본당 검색/생성)
│   │   └── Step 3: OrganizationSelect (조직 선택/생성)
│   └── CardFooter (이전/다음 버튼)
└── 로그아웃 링크
```

### 파일 위치

```
apps/web/src/
  pages/join/
    JoinPage.tsx
    components/
      ParishSelect.tsx
      ChurchSelect.tsx
      OrganizationSelect.tsx
  features/join/
    hooks/useJoin.ts
```

### 단계별 로직

**Step 1: 교구 선택**
- `trpc.parish.list.useQuery()` → 드롭다운 목록
- 선택 시 parishId 저장 → Step 2 진행

**Step 2: 본당 검색/생성**
- `trpc.church.search.useQuery({ parishId, query })` → 검색 결과 목록
- 검색 입력: Input + 실시간 검색 (debounce 300ms)
- 결과 선택 → churchId 저장 → Step 3
- "새로 만들기" 버튼 → Dialog로 Church 이름 입력 → `trpc.church.create.useMutation()` → Step 3

**Step 3: 조직 선택/생성**
- `trpc.organization.list.useQuery({ churchId })` → 목록 표시
- 기존 조직 선택 → `trpc.organization.requestJoin.useMutation()` → /pending 리다이렉트
- "새로 만들기" → Dialog로 Organization 이름 입력 → `trpc.organization.create.useMutation()` → 대시보드 진입

### 상태별 UI

| 상태 | UI |
|------|-----|
| 로딩 | Loader2 스피너 |
| 에러 | 인라인 에러 메시지 (text-destructive) |
| 본당 검색 결과 없음 | "검색 결과가 없습니다. 새로 만들어보세요." |
| 조직 목록 비어있음 | "아직 등록된 조직이 없습니다. 새로 만들어보세요." |
| 합류 요청 완료 | Toast "합류 요청이 전송되었습니다" → /pending 이동 |
| 조직 생성 완료 | Toast "조직이 생성되었습니다" → / 이동 |

### 사용 컴포넌트

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| Card | Card, CardHeader, CardContent, CardFooter | 단계별 폼 컨테이너 |
| Select | Select, SelectTrigger, SelectContent, SelectItem | 교구 드롭다운 |
| Input | Input | 본당 검색, 이름 입력 |
| Button | Button | 이전/다음/생성 |
| Dialog | Dialog, DialogContent, DialogHeader, DialogFooter | 새로 만들기 모달 |

---

## F2: /pending 화면

### 페이지 구조

```
PendingPage.tsx (AuthLayout)
├── Card
│   ├── 아이콘 (Clock / Loader2)
│   ├── "관리자의 승인을 기다리고 있습니다"
│   ├── 요청 조직 정보 (Organization + Church 이름)
│   └── 요청 취소 버튼
└── 로그아웃 링크
```

### 파일 위치

```
apps/web/src/pages/pending/PendingPage.tsx
```

### 비즈니스 로직

- 진입 시: AuthProvider의 account 정보에서 organizationId 확인
- organizationId 있음 → 대시보드 리다이렉트 (승인 완료)
- 요청 취소: JoinRequest 삭제 API → /join 리다이렉트
- 재로그인 시 상태 확인 로직은 F4(라우팅 변경)에서 처리

### 상태별 UI

| 상태 | UI |
|------|-----|
| 대기 중 | Clock 아이콘 + 안내 문구 |
| 취소 처리 중 | Button disabled + "취소 중..." |
| 취소 완료 | Toast "요청이 취소되었습니다" → /join |

---

## F3: 합류 요청 관리 UI

### 위치 결정

대시보드 페이지에 합류 요청 섹션 추가 (admin role일 때만 표시).

### 페이지 구조

```
DashboardPage.tsx
├── 기존 대시보드 콘텐츠
└── (admin일 때) JoinRequestsSection
    ├── 제목 "합류 요청" + Badge (pending 건수)
    └── 요청 목록
        ├── 요청자 displayName
        ├── 요청일
        ├── 승인 버튼 (Button variant="default")
        └── 거절 버튼 (Button variant="outline")
```

### 파일 위치

```
apps/web/src/
  pages/dashboard/components/
    JoinRequestsSection.tsx
  features/organization/
    hooks/useOrganization.ts
```

### 비즈니스 로직

```
useOrganization 훅:
  pendingRequests: trpc.organization.pendingRequests.useQuery()
  approveJoin: trpc.organization.approveJoin.useMutation()
  rejectJoin: trpc.organization.rejectJoin.useMutation()
  members: trpc.organization.members.useQuery()
```

- 요청 없으면 섹션 미표시
- 승인: Toast "승인되었습니다" + 목록 갱신
- 거절: 확인 Dialog → Toast "거절되었습니다" + 목록 갱신

### 사용 컴포넌트

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| Card | Card | 요청 목록 컨테이너 |
| Badge | Badge | pending 건수 |
| Button | Button | 승인/거절 |
| AlertDialog | AlertDialog | 거절 확인 |

---

## F4: 라우팅 변경

### AuthProvider 변경

`apps/web/src/features/auth/AuthProvider.tsx`:

```
account 조회 응답에서 추가 정보 관리:
  organizationId, role, organizationName, churchName

login() 성공 후:
  IF organizationId 존재: 기존 대시보드 진입
  ELSE: /join 또는 /pending 판단 (아래 로직)
```

### ProtectedRoute 변경

`apps/web/src/features/auth/ProtectedRoute.tsx`:

현재 체크:
1. isAuthenticated → /login
2. privacyAgreedAt → /consent

추가 체크:
3. organizationId 확인:
   - null + pending JoinRequest 있음 → /pending
   - null + 요청 없음 → /join
   - 존재 → 통과 (대시보드)

### 라우트 등록

`apps/web/src/routes/index.tsx`:

```
신규 라우트 추가:
  /join → JoinPage (AuthLayout, 인증 필요 + 동의 필요)
  /pending → PendingPage (AuthLayout, 인증 필요 + 동의 필요)

회원가입 후: /join으로 리다이렉트 (기존 / → /join)
```

### FORBIDDEN 핸들링

tRPC 에러 핸들링 (전역):

```
IF error.code === 'FORBIDDEN' AND message에 '조직' 포함:
  navigate('/join')
```

---

## F5: 기존 UI 변경

### MainLayout 헤더 변경

`apps/web/src/components/layout/MainLayout.tsx`:

```
현재: displayName + 로그아웃
변경: Organization 이름 (Church 이름) + displayName + 로그아웃

AuthProvider에서 organizationName, churchName 제공
헤더 표시: "{organizationName} ({churchName})" | displayName
```

### 학생 폼 변경

`apps/web/src/pages/student/StudentForm.tsx`:

```
현재:
  groupId: Select 단일 선택 (드롭다운)

변경:
  groupIds: 복수 선택
  UI: Checkbox 목록 (그룹 수가 적으므로 전체 표시)
  - groups.map(group => Checkbox + Label)
  - 최소 1개 선택 필수 (검증)
```

### 학생 목록 변경

`apps/web/src/pages/student/StudentListPage.tsx`:

```
현재: 단일 그룹 필터 (Select)
변경: 다중 그룹 필터
  - 학생 카드에 소속 그룹 Badge 복수 표시
  - 필터: 그룹 선택 시 해당 그룹 소속 학생 표시
  - 등록 상태 컬럼 (isRegistered): "등록" / "미등록" Badge 유지
  - Excel import (StudentImportModal): groupIds 복수 입력으로 변경
  - 등록 관리 (RegistrationModal): organizationId 스코프 내 학생만 표시

StudentOutput 변경 반영:
  현재: groupId, groupName
  변경: groups: { id, name }[]
  유지: isRegistered (Registration 경유)
```

### 학생 상세 변경

`apps/web/src/pages/student/StudentDetailPage.tsx`:

```
표시 모드: 소속 그룹을 Badge로 복수 표시
편집 모드: Checkbox 목록으로 그룹 복수 선택
```

### useStudents 훅 변경

```
create/update input:
  현재: groupId: string
  변경: groupIds: string[]

bulkRegister/bulkCancelRegistration:
  변경 없음 (Student.organizationId 경유 스코프, API 측에서 처리)

registrationFilter/registrationYear:
  변경 없음 (ListStudentsUseCase가 organizationId로 스코프)
```

---

## 접근성 체크리스트

- [ ] /join: 단계별 진행 상태를 aria-label로 전달
- [ ] /join: 검색 Input에 aria-label="본당 검색"
- [ ] /pending: 대기 상태를 aria-live="polite"로 안내
- [ ] F3: 승인/거절 버튼에 요청자 이름 포함 aria-label
- [ ] F5: Checkbox 그룹에 fieldset + legend
- [ ] 모든 폼: Label 연결, 키보드 네비게이션

---

## 테스트 시나리오

프론트엔드는 수동 E2E 테스트 중심:

### F1 테스트

| 시나리오 | 기대 결과 |
|---------|----------|
| 교구 선택 → 본당 검색 → 조직 생성 | admin으로 대시보드 진입 |
| 교구 선택 → 본당 생성 → 조직 생성 | Church + Organization 생성, 대시보드 진입 |
| 기존 조직 합류 요청 | /pending 리다이렉트 |

### F4 테스트

| 시나리오 | 기대 결과 |
|---------|----------|
| organizationId null + 요청 없음 | /join 리다이렉트 |
| organizationId null + pending 요청 | /pending 리다이렉트 |
| organizationId 존재 | 대시보드 진입 |
| scopedProcedure FORBIDDEN | /join 리다이렉트 |

### F5 테스트

| 시나리오 | 기대 결과 |
|---------|----------|
| 학생 생성 시 그룹 2개 선택 | StudentGroup 2건 생성 |
| 학생 목록에서 다중 그룹 학생 | 복수 Badge 표시 |
| 헤더에 조직 정보 | "중고등부 (장위동 성당)" 표시 |
| 등록 관리 모달에서 등록/취소 | organizationId 스코프 내 학생만 표시 |
| Excel import로 학생 대량 생성 | groupIds 복수 지정 동작 |
| 등록 상태 필터 (등록/미등록) | organizationId 스코프 내 필터링 |

---

## 구현 시 주의사항

- AuthLayout 사용: /join, /pending은 MainLayout이 아닌 AuthLayout (사이드바 없음)
- tRPC 에러 핸들링: FORBIDDEN 전역 처리 시 기존 FORBIDDEN (개인정보 동의)과 구분 필요
- debounce: 본당 검색 시 입력 디바운스 적용 (불필요한 API 호출 방지)
- 캐시 무효화: 합류 승인/거절 후 pendingRequests 캐시 invalidate

---

**작성일**: 2026-03-07
**리뷰 상태**: Draft
