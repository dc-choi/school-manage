# PRD: 학생 일괄 등록 서버측 재검증 강화

> 상태: Draft | 작성일: 2026-04-21

## 배경/문제 요약

- 참고: `docs/specs/README.md` BUGFIX P2 — "서버측 Excel 파일 재검증 없음"
- **문제**:
    - 학생 일괄 등록 흐름은 클라이언트(`StudentImportModal`)가 `.xlsx`를 파싱·검증한 뒤 **JSON 학생 배열**을 `student.bulkCreate` 뮤테이션으로 전송한다. 서버는 파일을 받지 않으므로 "파일 타입 재검증"은 적용 대상이 없다.
    - 서버 Zod 스키마(`createStudentInputSchema` + `bulkCreateStudentsInputSchema`)는 **필드별 최대 길이/상한/형식 검증이 대부분 누락**되어 있어, 클라이언트 검증을 우회한 직접 호출(Postman/curl/자체 스크립트)에서 악성·비정상 페이로드를 허용한다.
    - BUGFIX P2 "입력 검증 강화" 항목 중 **학생 일괄 등록 경로**에 한정된 부분이며, 제목의 "Excel 파일 재검증"은 실제 위협(서버 검증 우회) 관점으로 재정의한다.
- **현재 상태**:
    - `bulkCreateStudentsInputSchema`: 배열 `.min(1).max(500)` 만 존재. 각 학생 항목의 제약은 `createStudentInputSchema`에 위임.
    - `createStudentInputSchema` 필드 제약 현황:
        - `societyName` `min(1)` — **max 없음**
        - `catholicName` optional — **max 없음**
        - `contact` optional — **숫자 패턴/길이 없음** → UseCase의 `BigInt(student.contact)`가 런타임 에러를 던지고 500 응답
        - `description` optional — **max 없음**
        - `age` `int positive` — **상한 없음**
        - `groupIds` `array(idSchema)` — **배열 상한 없음, min 없음**
        - `gender` / `baptizedAt` — enum/regex로 제약 있음 ✅
    - UseCase는 `assertGroupIdsOwnership` 수행하지만, 비정상 문자열/거대 문자열은 통과 후 DB 계층까지 전달된다.
- **목표 상태**:
    - 클라이언트 검증과 동등 이상 수준의 서버측 재검증을 `student.bulkCreate` 경로에 적용.
    - 직접 호출 공격 시 400(`BAD_REQUEST`)으로 조기 차단.
    - `contact` 등 DB 레이어에서 런타임 예외를 유발하는 값을 스키마 단계에서 거부.

## 목표/성공 기준

- **목표**: `student.bulkCreate` 입력의 각 필드에 대해 클라이언트 검증 기준에 부합하는 서버측 Zod 제약을 적용하고, 악성/비정상 페이로드가 UseCase 이전에 거부되도록 만든다.
- **성공 지표**:
    - 서버 통합 테스트 신규: 필드별 상한 초과/형식 위반 페이로드 → 400 응답 (신규 TC ≥ 8건)
    - `BigInt(student.contact)` 관련 500 응답 재현 불가 (실패 케이스 → 400)
    - 기존 정상 업로드 시나리오(클라이언트 경유) 회귀 0건
- **측정 기간**: 머지 후 즉시 (CI 통합 테스트 + 로컬 회귀)

## 사용자/대상

- **주요 사용자**: 학생 일괄 등록을 사용하는 교리교사 (조직 관리자/교사)
- **사용 맥락**: 새 학년/학기 초 명단 대량 입력. 정상 사용자는 기존과 동일 UX, 본 변경의 체감 변화는 없다.
- **부차 사용자**: API 직접 호출자(테스트/자동화). 잘못된 형식에 대해 명확한 에러 메시지를 받는다.

## 범위

### 포함

- `bulkCreateStudentsInputSchema` 전용 **학생 항목 스키마 분리** (또는 공통 스키마 강화 결정 — 2단계 확정).
- 학생 항목 필드별 서버측 제약 추가:
    - `societyName` 최대 길이
    - `catholicName` 최대 길이
    - `contact` 숫자만(숫자 문자열) + 최대 길이 (`BigInt` 변환 가능 전제)
    - `description` 최대 길이
    - `age` 상한
    - `groupIds` 최소/최대 개수
- UseCase의 `groupIds.length > 0` 방어 코드를 전제하는 스키마 정합화(빈 배열 처리 정책 정비).
- 통합 테스트 추가: 각 제약 위반 페이로드 → 400.
- 에러 메시지 한글화/통일 (`createStudentInputSchema` 현행은 영/한 혼재).

### 제외

- **파일 업로드 엔드포인트 신설**(서버 `.xlsx` 파싱) — 현재 아키텍처 변경 범위가 과대. 원제목 재정의로 배제.
- 학생 단건 `create` / `update` 경로의 제약 변경 — 호환성 영향 범위 넓음. 본 작업은 bulkCreate 전용.
- 출석/로그인/일반 학생 단건 등 **다른 도메인의 입력 검증 강화** — 별도 BUGFIX P2 "입력 검증 강화"에서 다룸.
- 중복 학생 감지(이름+세례명) — 로드맵 2단계 "학생 등록 중복 확인" 별도.
- 트랜잭션 성능/락 최적화 — 별도 항목.

## 사용자 시나리오

1. **정상 업로드(회귀)**: 교사가 모달에서 양식 작성 → 업로드 → 서버가 정상 등록. 체감 변화 없음.
2. **직접 호출 우회**: 공격자가 `student.bulkCreate`를 1MB `societyName` × 500건으로 호출 → 서버가 Zod 단계에서 400. UseCase/DB 도달 전 차단.
3. **잘못된 contact**: 클라이언트 버그로 `contact: "010-abc"` 전송 → 서버 Zod에서 400 (현재는 DB 쓰기 시점에 500 발생).
4. **거대 groupIds**: 한 학생에 `groupIds` 10,000개 전송 → 서버 Zod 400 (현재는 ownership 쿼리 대량 실행).

## 요구사항

### 필수 (Must)

- [ ] `bulkCreateStudentsInputSchema` 경로에 학생 항목별 최대 길이/상한 제약 적용 (2단계에서 전용 스키마 분리 vs 공유 스키마 강화 결정).
- [ ] `contact`는 숫자 문자열(`/^\d+$/`) + 최대 길이 제약. `BigInt` 변환 가능성 보장.
- [ ] `groupIds` 배열 최소/최대 크기 제약. UseCase 빈 배열 분기와 정합성 확보.
- [ ] `age` 양의 정수 + 상한 제약.
- [ ] `societyName`·`catholicName`·`description` 최대 길이 제약.
- [ ] 위반 페이로드 → Zod 400 응답(TRPC `BAD_REQUEST`). 에러 메시지는 한글 기본.
- [ ] 통합 테스트: 각 제약 위반 최소 1개씩 커버 (≥ 8건).
- [ ] 정상 업로드 회귀 테스트 유지.
- [ ] `pnpm typecheck && pnpm test && pnpm build` 통과.

### 선택 (Should)

- [ ] 클라이언트 검증 기준과 서버 제약 값 명시 비교표(기능 설계 또는 PR 본문).
- [ ] `createStudentInputSchema`의 영/한 혼재 메시지 일관화(bulkCreate 경로에 한함).
- [ ] `excel-import.ts`의 사전 검증과 서버 Zod 제약이 동일 사유로 거부되도록 **에러 사유 코드/메시지 정렬** 검토.

### 제외 (Out)

- 파일 업로드 엔드포인트, MIME/확장자 검사, 바이너리 재파싱.
- `student.create` / `student.update` 단건 경로 제약 변경.
- 출석·인증·일반 입력 검증.

## 제약/가정/리스크/의존성

- **제약**:
    - 기존 클라이언트 UX/동작 변경 금지(정상 입력은 동일하게 수용).
    - 스키마가 `packages/shared`에 있으므로 web/api 양쪽 재빌드 필요.
- **가정**:
    - 클라이언트 검증(`excel-import.ts`)이 상한의 상위 셋 — 서버는 동등 이상으로 설정.
    - 조직당 학생/그룹 규모는 본 코드베이스의 현행 상한(500) 내 유지.
- **리스크**:
    - **R1 (중)**: 상한을 너무 짧게 잡으면 기존 양식으로 작성한 정상 데이터 회귀. → 실 사용자 입력 분포(DB `societyName` 등)를 참고해 여유 있게 설정.
    - **R2 (저)**: 공유 스키마를 강화할 경우 단건 경로도 영향. → 전용 스키마 분리(`bulkCreateStudentItemSchema`)로 영향 범위 격리 (2단계 확정).
    - **R3 (저)**: 클라이언트·서버 메시지 불일치로 사용자 혼선. → 표현 정렬.
- **내부 의존성**: `@school/shared` 스키마, `@school/api` UseCase.
- **외부 의존성**: 없음(신규 라이브러리/인프라 없음).

## 롤아웃/검증

- **출시 단계**: 단일 PR 머지 후 즉시 적용. 피처 플래그 없음(거부 범위가 악성/비정상 페이로드에 한정).
- **이벤트**: 신규 GA4 이벤트 없음.
- **검증**:
    - 통합 테스트로 제약 위반/정상 케이스 커버.
    - 머지 후 로컬에서 실제 양식 파일 업로드 시나리오 1회 확인.

## 오픈 이슈

- [ ] 각 필드 상한 수치 확정 (2단계): `societyName`, `catholicName`, `contact`, `description`, `age`, `groupIds` 개수 상한.
- [ ] 공유 스키마 강화 vs 전용 스키마 분리 — 2단계에서 결정. 기본안: **전용 스키마 분리**로 단건 경로 회귀 차단.
- [ ] `excel-import.ts` 클라이언트 사전 검증의 상한과 일치 여부 결정(동일 값 권장).

## 연결 문서

- 사업 문서: `docs/specs/README.md` BUGFIX 섹션 (P2 — 서버측 Excel 재검증 없음)
- 기능 설계(예정): `docs/specs/functional-design/student-management-import.md`(기존 엑셀 Import 기능 설계에 병합 또는 보조 문서 검토)
- 관련 완료 PRD: `docs/specs/prd/xlsx-migration.md`(클라이언트 라이브러리 교체), `docs/specs/prd/student-excel-import.md`(엑셀 Import 최초 설계)
