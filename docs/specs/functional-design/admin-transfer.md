# 기능 설계: 관리자 양도 (로드맵 2단계)

> ADMIN이 TEACHER에게 관리자 역할을 양도하거나, 유일 멤버인 경우 조직을 떠날 수 있다.

## 연결 문서

- PRD: `docs/specs/prd/admin-transfer.md`
- 기존: `account-model-transition-flows.md` (접근 제어, 멤버 목록)

---

## 사용자 플로우

### 관리자 양도 (TEACHER 존재 시)

멤버 목록 → TEACHER 옆 "양도" 버튼 → 확인 다이얼로그 → 역할 교환 → UI 갱신

### 유일 멤버 탈퇴 (ADMIN만 남은 경우)

설정 → 계정 삭제 → "조직 데이터도 삭제됩니다" 확인 → 조직 소프트 삭제 + 계정 소프트 삭제

### 상태 전이

```
[ADMIN + TEACHER 존재]
    ├── 양도 → ADMIN↔TEACHER 교환 → [기존 ADMIN = TEACHER, 대상 = ADMIN]
    └── 삭제 시도 → "먼저 관리자를 양도하세요" 에러

[ADMIN만 (유일 멤버)]
    └── 삭제 → 조직 소프트 삭제 + 계정 소프트 삭제 → [로그인 페이지 이동]
```

---

## UI/UX

### 멤버 목록 (변경)

| 요소 | ADMIN 화면 | TEACHER 화면 |
|------|-----------|-------------|
| 멤버 항목 | displayName + 역할 뱃지 + **"양도" 버튼** (TEACHER에만) | displayName + 역할 뱃지 |
| 양도 버튼 | TEACHER 행에 표시 | 미표시 |

### 양도 확인 다이얼로그

- 제목: "관리자를 양도하시겠습니까?"
- 내용: "{displayName}님에게 관리자 권한을 양도합니다. 양도 후 선생님 역할로 전환됩니다."
- 버튼: [취소] [양도]

### 유일 멤버 삭제 확인 다이얼로그

- 제목: "정말 탈퇴하시겠습니까?"
- 내용: "조직의 유일한 관리자입니다. 탈퇴 시 조직과 모든 데이터(학년, 학생, 출석)가 삭제됩니다."
- 버튼: [취소] [탈퇴]

### 계정 삭제 섹션 (변경)

| 상태 | 현재 동작 | 변경 후 |
|------|---------|--------|
| ADMIN + TEACHER 존재 | "관리자 계정은 삭제할 수 없습니다" | "먼저 관리자를 양도한 후 탈퇴할 수 있습니다" + 양도 안내 |
| ADMIN + 유일 멤버 | "관리자 계정은 삭제할 수 없습니다" | 삭제 허용 (조직 소프트 삭제 포함 확인) |
| TEACHER | 삭제 가능 | 변경 없음 |

---

## 데이터/도메인 변경

### 스키마 변경

없음. 기존 Account.role 필드로 처리.

### 조직 소프트 삭제 시 처리

유일 멤버 탈퇴 시 트랜잭션 내 처리:
1. Organization.deletedAt 설정
2. Organization 하위 Group.deletedAt 설정
3. Organization 하위 Student.deletedAt 설정
4. Account 소프트 삭제 (기존 로직)

---

## API

### 신규: organization.transferAdmin

| 항목 | 내용 |
|------|------|
| 프로시저 | scopedProcedure (ADMIN 전용) |
| 타입 | mutation |
| Input | `targetAccountId: string` (양도 대상 TEACHER의 ID) |
| Output | `{ success: boolean }` |

비즈니스 로직:
1. 요청자 role === ADMIN 검증
2. 대상 계정이 같은 organizationId + role === TEACHER 검증
3. 트랜잭션: 요청자 role → TEACHER, 대상 role → ADMIN

### 변경: account.delete

기존 ADMIN 차단 로직을 분기:

| 상태 | 처리 |
|------|------|
| ADMIN + 다른 멤버 존재 | FORBIDDEN: "먼저 관리자를 양도해주세요" |
| ADMIN + 유일 멤버 | 조직 소프트 삭제 + 계정 소프트 삭제 허용 |
| TEACHER | 변경 없음 (기존 로직) |

---

## 접근 제어

| 프로시저 | 역할 | 설명 |
|---------|------|------|
| organization.transferAdmin | ADMIN | 양도 실행 |
| organization.members | ADMIN, TEACHER | 멤버 목록 (기존) |
| account.delete | ADMIN (유일 멤버), TEACHER | 조건부 허용 |

---

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| TEACHER가 transferAdmin 호출 | FORBIDDEN |
| 대상이 같은 조직 아님 | NOT_FOUND |
| 대상이 ADMIN (자기 자신) | BAD_REQUEST |
| 대상이 이미 삭제된 계정 | NOT_FOUND |
| ADMIN + 다른 멤버 존재 + 삭제 시도 | FORBIDDEN: "먼저 관리자를 양도해주세요" |
| 양도 직후 즉시 재양도 | 정상 (새 ADMIN이 양도 가능) |
| pending 합류 요청 존재 + 유일 멤버 탈퇴 | pending 요청도 거절 처리 |

---

## 측정

| 이벤트 | 설명 |
|--------|------|
| admin_transferred | 양도 완료 (양도자, 수신자) |
| organization_dissolved | 유일 멤버 탈퇴로 조직 소프트 삭제 |

---

## 테스트 시나리오

### 정상

1. ADMIN이 TEACHER에게 양도 → 역할 교환 확인
2. 양도 후 기존 ADMIN이 TEACHER 전용 UI만 보임
3. 양도 후 새 ADMIN이 합류 승인/거절 가능
4. 유일 멤버 ADMIN 삭제 → 조직 + 하위 데이터 소프트 삭제
5. 유일 멤버 탈퇴 후 로그인 페이지 이동

### 예외

1. TEACHER가 양도 API 호출 → FORBIDDEN
2. ADMIN + 다른 멤버 존재 + 삭제 시도 → FORBIDDEN
3. 존재하지 않는 대상에게 양도 → NOT_FOUND
4. 자기 자신에게 양도 → BAD_REQUEST
5. pending 요청 있는 조직 유일 멤버 탈퇴 → pending 거절 + 조직 삭제

---

**작성일**: 2026-03-13
**작성자**: SDD 작성자
**상태**: Draft
