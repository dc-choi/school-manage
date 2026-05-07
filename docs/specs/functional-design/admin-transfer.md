# 기능 설계: 관리자 양도 / 멤버 강퇴 (로드맵 2단계)

> ADMIN이 TEACHER에게 관리자 역할을 양도하거나, 유일 멤버인 경우 조직을 떠나거나, TEACHER 멤버를 조직에서 제거할 수 있다.

## 연결 문서

- PRD: `docs/specs/prd/admin-transfer.md`
- 기존: `account-model-transition-flows.md` (접근 제어, 멤버 목록)

---

## 사용자 플로우

### 관리자 양도 (TEACHER 존재 시)

멤버 목록 → TEACHER 옆 "양도" 버튼 → 확인 다이얼로그 → 역할 교환 → UI 갱신

### 멤버 강퇴 (TEACHER 대상)

멤버 목록 → TEACHER 옆 "제거" 버튼 (Trash2 + destructive 텍스트) → 확인 다이얼로그 → `Account.organizationId/role = null` → 멤버 목록에서 사라짐. 학생/그룹/출석은 조직에 잔존. 제거된 사용자는 다른 모임에 다시 합류 요청 가능.

### 유일 멤버 탈퇴 (ADMIN만 남은 경우)

설정 → 계정 삭제 → "조직 데이터도 삭제됩니다" 확인 → 조직 소프트 삭제 + 계정 소프트 삭제

### 상태 전이

```
[ADMIN + TEACHER 존재]
    ├── 양도 → ADMIN↔TEACHER 교환 → [기존 ADMIN = TEACHER, 대상 = ADMIN]
    ├── 강퇴 → 대상 TEACHER → organizationId/role null → [강퇴된 사용자는 미소속]
    └── 삭제 시도 → "먼저 관리자를 양도하세요" 에러

[ADMIN만 (유일 멤버)]
    └── 삭제 → 조직 소프트 삭제 + 계정 소프트 삭제 → [로그인 페이지 이동]
```

---

## UI/UX

### 멤버 목록 (변경)

| 요소                                              | ADMIN 화면                                                        | TEACHER 화면            |
| ------------------------------------------------- | ----------------------------------------------------------------- | ----------------------- |
| 멤버 항목                                         | displayName + 역할 뱃지 + **"양도"·"제거" 버튼** (TEACHER 행에만) | displayName + 역할 뱃지 |
| 양도 버튼 (`outline`)                             | TEACHER 행에 표시                                                 | 미표시                  |
| 제거 버튼 (`ghost` + destructive 텍스트 + Trash2) | TEACHER 행에 표시                                                 | 미표시                  |

좌측 영역(`min-w-0 flex-1 truncate`)으로 모바일 360px에서 긴 이름도 안전.

### 확인 다이얼로그 (공통 패턴)

- `<TransferAdminDialog>` / `<RemoveMemberDialog>` 분리. 각 다이얼로그가 자체 mutation 보유 → 행 단위 disable.
- pending 중 `onOpenChange`/Cancel 버튼 잠금 → silent success 차단.
- 에러 박스 `role="alert"`로 SR 알림.

| 다이얼로그 | 제목                         | 내용                                                                                    |
| ---------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| 양도       | "관리자를 양도하시겠습니까?" | "{name}님에게 관리자 권한을 양도합니다. 양도 후 선생님 역할로 전환됩니다."              |
| 제거       | "멤버를 제거하시겠습니까?"   | "{name}님을 조직에서 제거합니다. 이 사용자는 다른 모임에 다시 합류 요청할 수 있습니다." |

### 유일 멤버 삭제 확인 다이얼로그

- 제목: "정말 탈퇴하시겠습니까?"
- 내용: "조직의 유일한 관리자입니다. 탈퇴 시 조직과 모든 데이터(학년, 학생, 출석)가 삭제됩니다."

### 계정 삭제 섹션 (변경)

| 상태                 | 현재 동작                          | 변경 후                                                  |
| -------------------- | ---------------------------------- | -------------------------------------------------------- |
| ADMIN + TEACHER 존재 | "관리자 계정은 삭제할 수 없습니다" | "먼저 관리자를 양도한 후 탈퇴할 수 있습니다" + 양도 안내 |
| ADMIN + 유일 멤버    | "관리자 계정은 삭제할 수 없습니다" | 삭제 허용 (조직 소프트 삭제 포함 확인)                   |
| TEACHER              | 삭제 가능                          | 변경 없음                                                |

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

### organization.transferAdmin

| 항목     | 내용                         |
| -------- | ---------------------------- |
| 프로시저 | scopedProcedure (ADMIN 전용) |
| Input    | `targetAccountId: string`    |
| Output   | `{ success: boolean }`       |

비즈니스 로직 (트랜잭션 내):

1. 대상 검증 (organizationId 일치 + TEACHER + 미삭제)
2. 호출자 ADMIN → TEACHER `updateMany(where: { id, organizationId, role: ADMIN })` + `count===0` 시 `CONFLICT`
3. 대상 TEACHER → ADMIN `updateMany(where: { id, organizationId, role: TEACHER })` + `count===0` 시 `CONFLICT`
4. 양쪽 `accountSnapshot` 기록

`updateMany + role 조건 + count check` 패턴으로 race(예: 강퇴와 동시 실행) 시 한 트랜잭션이 `CONFLICT`로 rollback되어 ADMIN 부재가 발생하지 않는다.

### organization.removeMember

| 항목     | 내용                         |
| -------- | ---------------------------- |
| 프로시저 | scopedProcedure (ADMIN 전용) |
| Input    | `targetAccountId: string`    |
| Output   | `{ success: boolean }`       |

비즈니스 로직 (트랜잭션 내):

1. 호출자 ADMIN 검증, 자기 자신 제거 차단
2. 대상 검증 (organizationId 일치 + 미삭제, 대상 ADMIN이면 BAD_REQUEST)
3. `accountSnapshot` 기록 (강퇴 직전 소속 이력)
4. `updateMany(where: { id, organizationId, role: TEACHER, deletedAt: null })` + `count===0` 시 `CONFLICT`

### 변경: account.delete

기존 ADMIN 차단 로직을 분기:

| 상태                   | 처리                                     |
| ---------------------- | ---------------------------------------- |
| ADMIN + 다른 멤버 존재 | FORBIDDEN: "먼저 관리자를 양도해주세요"  |
| ADMIN + 유일 멤버      | 조직 소프트 삭제 + 계정 소프트 삭제 허용 |
| TEACHER                | 변경 없음 (기존 로직)                    |

---

## 접근 제어

| 프로시저                   | 역할                       | 설명             |
| -------------------------- | -------------------------- | ---------------- |
| organization.transferAdmin | ADMIN                      | 양도 실행        |
| organization.removeMember  | ADMIN                      | TEACHER 강퇴     |
| organization.members       | ADMIN, TEACHER             | 멤버 목록 (기존) |
| account.delete             | ADMIN (유일 멤버), TEACHER | 조건부 허용      |

---

## 예외/엣지 케이스

| 상황                                             | 처리                                                         |
| ------------------------------------------------ | ------------------------------------------------------------ |
| TEACHER가 transferAdmin/removeMember 호출        | FORBIDDEN                                                    |
| 대상이 같은 조직 아님 / 이미 삭제                | NOT_FOUND                                                    |
| transferAdmin 자기 자신 / removeMember 자기 자신 | BAD_REQUEST                                                  |
| removeMember 대상이 ADMIN                        | BAD_REQUEST: "관리자는 양도 후 제거할 수 있습니다"           |
| 강퇴 + 양도 동시 실행                            | 한쪽이 `CONFLICT` rollback (race 가드) → 항상 ADMIN ≥ 1 보장 |
| ADMIN + 다른 멤버 존재 + 삭제 시도               | FORBIDDEN: "먼저 관리자를 양도해주세요"                      |
| 양도 직후 즉시 재양도                            | 정상 (새 ADMIN이 양도 가능)                                  |
| 강퇴된 사용자가 다른 조직 합류 요청              | 정상 (재합류 가능, 차단 리스트 없음)                         |
| pending 합류 요청 존재 + 유일 멤버 탈퇴          | pending 요청도 거절 처리                                     |

---

## 측정

| 이벤트                 | 설명                              |
| ---------------------- | --------------------------------- |
| admin_transferred      | 양도 완료 (양도자, 수신자)        |
| organization_dissolved | 유일 멤버 탈퇴로 조직 소프트 삭제 |

> 멤버 강퇴는 GA4 이벤트 미등록 (P2 운영 기능, 사용량 측정 우선순위 낮음).

---

## 테스트 시나리오 (핵심)

- 정상: 양도 → 역할 교환 / 강퇴 → 대상 미소속 + 스냅샷 1건 / 강퇴된 사용자 재합류 / 유일 멤버 ADMIN 삭제 → 조직 cascade 소프트 삭제
- 예외: TEACHER 호출 FORBIDDEN / 자기 자신·다른 ADMIN 강퇴 BAD_REQUEST / 다른 조직·삭제된 계정 NOT_FOUND / 강퇴+양도 동시 실행 시 한쪽 CONFLICT rollback (ADMIN ≥ 1 보장) / pending 요청 + 유일 멤버 탈퇴 → pending 거절 + 조직 삭제

---

**작성일**: 2026-03-13 (양도) / 2026-05-07 (강퇴 추가)
**상태**: 구현 완료
