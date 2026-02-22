# 기능 설계: 에러 처리 표준화

> 비기능적 요구사항 — 간소화 워크플로우 (기능 설계 → 바로 구현)

## 연결 문서

- TARGET 등록: `docs/specs/README.md` ERROR HANDLING 섹션
- API 규칙: `.claude/rules/api.md`
- Web 규칙: `.claude/rules/web.md`

## 배경

프론트엔드에서 에러 메시지가 사용자에게 제대로 전달되지 않는 문제가 있다.

**현황:**
- API가 `'UNAUTHORIZED: PW is NOT_MATCHED'` 같은 내부 메시지를 반환하고, 프론트가 그대로 표시
- 12개 UseCase에서 `${e}` 패턴으로 DB 에러/스택 트레이스가 사용자에게 노출 가능
- 전역 토스트 시스템 부재 — 에러가 폼 내부 state로만 표시
- Query 에러(목록 조회 실패 등)가 무시됨

## 목표

1. 사용자에게 내부 기술 메시지가 노출되지 않도록 한다
2. 모든 에러에 대해 한국어 사용자 친화적 메시지를 표시한다
3. 토스트로 CRUD 성공/실패 피드백을 제공한다

## 흐름/상태

### 에러 전파 흐름

```
API UseCase → TRPCError(code, message) → tRPC Server → Client
    ↓
Client: mutation/query error
    ↓
에러 메시지 추출 (extractErrorMessage 유틸)
    ↓
UI 표시: 토스트 또는 인라인 에러
```

### 상태 전이

```
[정상] → [에러 발생] → [사용자 메시지 추출] → [토스트/인라인 표시] → [자동 dismiss / 사용자 확인]
```

## 변경 범위

### 1. API — 에러 메시지 표준화

**원칙**: TRPCError의 message는 **사용자에게 보여줄 한국어 메시지**만 담는다. 내부 디버깅 정보는 서버 로그에만 남긴다.

#### 1-1. `${e}` 패턴 제거 (12개 UseCase)

| 대상 파일 | 현재 | 변경 후 |
|---------|------|--------|
| group/create-group | `${e}` | `'학년 생성에 실패했습니다.'` + 서버 로그 |
| group/update-group | `${e}` | `'학년 수정에 실패했습니다.'` |
| group/delete-group | `${e}` | `'학년 삭제에 실패했습니다.'` |
| group/bulk-delete-groups | `${e}` | `'학년 일괄 삭제에 실패했습니다.'` |
| student/create-student | `${e}` | `'학생 등록에 실패했습니다.'` |
| student/update-student | `${e}` | `'학생 수정에 실패했습니다.'` |
| student/delete-student | `${e}` | `'학생 삭제에 실패했습니다.'` |
| student/bulk-delete-students | `${e}` | `'학생 일괄 삭제에 실패했습니다.'` |
| student/promote-students | `${e}` | `'학년 진급 처리에 실패했습니다.'` |
| student/graduate-students | `${e}` | `'졸업 처리에 실패했습니다.'` |
| student/restore-students | `${e}` | `'학생 복원에 실패했습니다.'` |
| student/cancel-graduation | `${e}` | `'졸업 취소에 실패했습니다.'` |
| attendance/update-attendance | `${e}` | `'출석 저장에 실패했습니다.'` |

#### 1-2. 기존 안전한 메시지 유지

이미 사용자 친화적인 메시지는 그대로 유지:
- `'이미 사용 중인 아이디입니다'`
- `'현재 비밀번호가 일치하지 않습니다'`
- `'복원 가능 기간(2년)이 경과했습니다'`

#### 1-3. 영문 코드 메시지 → 한국어 변환

| 현재 메시지 | 변경 후 |
|-----------|--------|
| `NOT_FOUND: ID NOT_FOUND` | `'존재하지 않는 아이디입니다.'` |
| `UNAUTHORIZED: PW is NOT_MATCHED` | `'비밀번호가 일치하지 않습니다.'` |
| `NOT_FOUND: ACCOUNT NOT_FOUND` | `'계정을 찾을 수 없습니다.'` |
| `NOT_FOUND: GROUP NOT_FOUND, group_id: ...` | `'학년을 찾을 수 없습니다.'` |
| `NOT_FOUND: STUDENT NOT_FOUND` | `'학생을 찾을 수 없습니다.'` |
| `BAD_REQUEST: attendance is required` | `'출석 데이터가 필요합니다.'` |
| `FORBIDDEN: GROUP NOT_FOUND OR NOT_OWNED` | `'접근 권한이 없는 학년입니다.'` |
| `UNAUTHORIZED: 비밀번호가 일치하지 않습니다` | 유지 |

### 2. 프론트엔드 — 토스트 시스템 도입

#### 2-1. Sonner 도입

shadcn/ui 공식 토스트 라이브러리인 Sonner를 사용한다.

- 위치: `apps/web/src/components/ui/sonner.tsx` (shadcn/ui 패턴)
- Provider: `<Toaster />` 를 App 루트에 배치

#### 2-2. 에러 메시지 추출 유틸

```
함수: extractErrorMessage(error: unknown): string
위치: apps/web/src/lib/error.ts
```

- tRPC 에러에서 message 추출
- unknown 타입 에러에서 안전하게 message 추출
- 추출 실패 시 기본 메시지 반환: `'오류가 발생했습니다.'`

#### 2-3. Mutation 에러 → 토스트

현재 try-catch에서 인라인 state로 에러를 표시하는 패턴을 토스트로 전환:

| 페이지 | 현재 | 변경 후 |
|-------|------|--------|
| LoginPage | 인라인 에러 | 인라인 유지 (폼 맥락) |
| SignupPage | 인라인 에러 | 인라인 유지 (폼 맥락) |
| StudentForm | 인라인 에러 | 인라인 유지 (폼 맥락) |
| GroupForm | 인라인 에러 | 인라인 유지 (폼 맥락) |
| NameChangeForm | 인라인 에러 | 인라인 유지 (폼 맥락) |
| PasswordChangeForm | 인라인 에러 | 인라인 유지 (폼 맥락) |
| AccountDeleteSection | 인라인 에러 | 인라인 유지 (폼 맥락) |
| ResetPasswordPage | 인라인 에러 | 인라인 유지 (폼 맥락) |
| AttendanceModal | saveStatus='error' | 토스트 에러 표시 |

> **원칙**: 폼 제출 에러는 인라인 유지 (사용자가 입력을 수정해야 하므로). CRUD 작업 결과는 토스트.

#### 2-4. 기존 인라인 에러에서 extractErrorMessage 적용

현재 `err instanceof Error ? err.message : '기본 메시지'` 패턴을 `extractErrorMessage(err)` 로 통일.

#### 2-5. CRUD 성공 토스트 추가

| 작업 | 성공 메시지 |
|------|----------|
| 학년 생성 | `'학년이 생성되었습니다.'` |
| 학년 수정 | `'학년이 수정되었습니다.'` |
| 학년 삭제 | `'학년이 삭제되었습니다.'` |
| 학년 일괄 삭제 | `'선택한 학년이 삭제되었습니다.'` |
| 학생 등록 | `'학생이 등록되었습니다.'` |
| 학생 수정 | `'학생이 수정되었습니다.'` |
| 학생 삭제 | `'학생이 삭제되었습니다.'` |
| 학생 일괄 삭제 | `'선택한 학생이 삭제되었습니다.'` |
| 학생 졸업 처리 | `'졸업 처리되었습니다.'` |
| 학생 복원 | `'학생이 복원되었습니다.'` |
| 출석 저장 | `'출석이 저장되었습니다.'` |
| 이름 변경 | `'이름이 변경되었습니다.'` |
| 비밀번호 변경 | 변경 후 로그아웃 (기존 유지) |

#### 2-6. Query 에러 처리

Query 에러는 기존 ErrorBoundary가 처리하므로 추가 작업 불필요. 이미 GlobalErrorBoundary + RouteErrorFallback이 존재한다.

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 네트워크 단절 | tRPC가 자동으로 에러 전파 → extractErrorMessage에서 기본 메시지 |
| 401 인증 만료 | 기존 AuthProvider 로직 유지 (자동 로그아웃) |
| Rate Limit 초과 | `'요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'` |
| 동시 요청 에러 | 각 요청별 개별 토스트 |

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 학생 등록 성공 시 `'학생이 등록되었습니다.'` 토스트 표시
2. **TC-2**: 출석 저장 성공 시 `'출석이 저장되었습니다.'` 토스트 표시

### 예외 케이스

1. **TC-E1**: 잘못된 비밀번호 로그인 시 `'비밀번호가 일치하지 않습니다.'` 인라인 표시 (영문 코드 미노출)
2. **TC-E2**: 학년 생성 중 DB 에러 시 `'학년 생성에 실패했습니다.'` 토스트 표시 (스택 트레이스 미노출)
3. **TC-E3**: 네트워크 단절 시 `'오류가 발생했습니다.'` 기본 메시지 표시

---

**작성일**: 2026-02-22
**작성자**: SDD 작성자
**상태**: Draft
