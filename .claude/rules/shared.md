# Shared Package Rules (@school/shared)

도메인 공유 상수, 타입, Zod 스키마 패키지입니다.

## 개요

`@school/shared`는 서버(`@school/api`)와 클라이언트(`@school/web`)가 공유하는 도메인 계약을 포함합니다.
Express, tRPC 등 서버 프레임워크에 의존하지 않습니다.

## Directory Structure

```
packages/shared/src/
├── index.ts            # 메인 export (public API)
├── constants.ts        # 도메인 상수 + 타입 (ROLE, GENDER 등)
├── auth.ts             # 도메인 인증 상태 타입 (AuthState)
└── schemas/            # Zod 스키마 + Input/Output 타입
    ├── index.ts        # 스키마/타입 barrel export
    ├── common.ts       # 공통 스키마 (id, page 등)
    ├── auth.ts         # auth 도메인
    ├── account.ts      # account 도메인
    ├── group.ts        # group 도메인
    ├── student.ts      # student 도메인
    ├── attendance.ts   # attendance 도메인
    ├── statistics.ts   # statistics 도메인
    ├── liturgical.ts   # liturgical 도메인
    ├── parish.ts       # parish 도메인
    ├── church.ts       # church 도메인
    └── organization.ts # organization 도메인
```

## Commands

```bash
pnpm build              # TypeScript 빌드 (tsc -b)
pnpm dev                # 빌드 감시 (tsc --watch)
pnpm typecheck          # 타입 체크
```

## 주요 Exports

### 도메인 상수 (constants.ts)

| 상수 | 설명 |
|------|------|
| `ROLE` | 조직 내 역할 (ADMIN, TEACHER) |
| `GENDER` | 성별 (M, F) |
| `ORGANIZATION_TYPE` | 조직 타입 (ELEMENTARY, MIDDLE_HIGH, YOUNG_ADULT) |
| `JOIN_REQUEST_STATUS` | 합류 요청 상태 (pending, approved, rejected) |
| `PRESENT_MARKS` | 출석 인정 마크 (◎, ○, △) |
| `MAX_GRADUATION_AGE` | 타입별 졸업 연령 |
| `getMaxGraduationAge()` | 타입별 졸업 연령 조회 함수 |

### 도메인 타입 (constants.ts)

| 타입 | 설명 |
|------|------|
| `AccountInfo` | 인증된 계정 정보 |
| `OrganizationInfo` | 조직 정보 요약 |
| `ChurchInfo` | 본당 정보 요약 |

### 인증 상태 (auth.ts)

| 타입 | 설명 |
|------|------|
| `AuthState` | 도메인 인증 상태 (Express/tRPC 무관) |

### 스키마 구조

- **Input**: Zod 스키마 (`z.object`) + `z.infer` 타입
- **Output**: 순수 TypeScript `interface` (런타임 검증 불필요)

## 주의사항

- 이 패키지는 **순수 도메인 계약만** 포함 (Express/tRPC 의존 금지)
- 외부 의존성은 `zod`만 허용
- 변경 시 `pnpm build` 후 의존 패키지 재빌드 필요
- tRPC 인프라(router, procedures)는 `@school/trpc`에 위치
