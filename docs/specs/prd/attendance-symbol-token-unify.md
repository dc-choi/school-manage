# PRD: 출석 모달 직렬화 토큰 통일 (`-` 폐지)

> 상태: Draft | 작성일: 2026-05-11 | 플로우: `/sdd quick`

> `attendance-ui-revamp` 후속(FU1+FU2) BUGFIX. 단일 컴포넌트 + 백엔드 케이스 정리 + 테스트 화이트리스트 갱신.

## 배경/문제 요약

- 참고: `docs/specs/functional-design/attendance-management.md` (출석 data 입력 검증 강화 BUGFIX 섹션)
- 문제: 출석 상태 직렬화에 결석 sentinel로 `'-'`와 `''`가 **이중으로 통용**되고 있음
    - 프론트(`AttendanceModal.getStatusSymbol`)는 결석을 `'-'`로 반환
    - 백엔드(`update-attendance.usecase.ts`)는 `case '-':` + `case '':` + `default:`를 모두 결석으로 처리
    - 운영 DB 비정상 마크 정리(2026-04-28)에서도 `-`가 sentinel로 남음 — 화이트리스트와 코멘트가 혼재
- 현재 상태: `'-'`와 `''`가 같은 의미(결석)지만 직렬화 경로가 분기됨. `absentCount` 코멘트("- 또는 빈값")가 이 혼재를 그대로 노출. 화이트리스트 검증·DELETE 분기 코멘트도 두 토큰 병존
- 목표 상태: 결석 토큰을 **`''` 단일화**. `'-'`는 코드/코멘트/테스트 화이트리스트에서 제거. 동작 변화 없이 직렬화 일관성만 회복

## 목표/성공 기준

- **목표**: 결석 직렬화 토큰 단일화로 출석 도메인 코드/주석/테스트 정합성 회복
- **성공 지표**: `'-'` 리터럴이 출석 도메인(api/web/테스트/FD)에서 0건. `pnpm typecheck` + `pnpm test` 통과. 출석 입력·삭제·집계 동작 회귀 없음
- **측정 기간**: PR 머지 시점 1회

## 사용자/대상

- **주요 사용자**: 출석 입력 교리교사 (동작 변화 없음 — 코드 정리)
- **사용 맥락**: 매주 출석 입력 시 모달에서 미사/교리 체크 → 결석 상태 저장. 운영 상 가시 변화 없음

## 범위

### 포함

- `apps/web/src/pages/attendance/AttendanceModal.tsx`
    - `getStatusSymbol` 결석 반환값 `'-'` → `''`
    - `parseContent` switch에서 `case '-':` 제거 (default가 동일 처리)
    - JSDoc·인라인 코멘트의 `-` 표기 정리
- `apps/api/src/domains/attendance/application/update-attendance.usecase.ts`
    - 분기 switch에서 `case '-':` 제거 (`case '':` + `default:`만 유지)
    - `absentCount` 코멘트("- 또는 빈값") → "빈 문자열" 단일화
- 입력 검증 화이트리스트 (서버 zod·테스트 `TC-A-E3/E4`)
    - 허용 마크에 포함된 `'-'` 제거. 빈 문자열은 별도 분기(DELETE) 유지
- 테스트
    - 화이트리스트 검증 TC에 `'-'` 케이스가 있으면 갱신/삭제
    - `absentCount` 검증 TC가 있으면 `''` 기반으로 갱신
- 도메인 FD (`attendance-management.md`) 마이그레이션·BUGFIX 섹션 코멘트 갱신

### 제외

- 운영 DB 비정상 마크 추가 마이그레이션 (이미 2026-04-28 완료)
- `'○○'`/`'◎◎'` 동일 마크 반복 검증 (별도 후속 과제, FD에 명시됨)
- UI/UX 변경 (사용자 가시 동작 동일)
- GA4 이벤트 변경
- 다른 도메인 일괄 직렬화 정리

## 요구사항

### 필수 (Must)

- [ ] 결석 직렬화 토큰을 `''`로 단일화 (`'-'` 반환·case·화이트리스트 제거)
- [ ] 출석 입력·갱신·DELETE 분기·집계(`absentCount`/`massOnlyCount`/`catechismOnlyCount`/`presentCount`) 동작 회귀 없음
- [ ] `pnpm typecheck` + `pnpm test` 통과
- [ ] 입력 검증 화이트리스트 TC가 `'-'`를 invalid로 거부하도록 갱신 (또는 화이트리스트에서 정상 제거)
- [ ] 코멘트·JSDoc의 `'-'` 표기 모두 정리

### 선택 (Should)

- [ ] `attendance-management.md`의 마이그레이션 섹션 코멘트에 "결석 sentinel은 `''`" 명시 한 줄 추가

### 제외 (Out)

- DB 저장 데이터 마이그레이션 (별도 마이그레이션 없음 — `-` 잔존 데이터는 04-28 정리에서 처리 완료)
- 새로운 입력 검증 분기 추가
- 모달 UI 텍스트 변경

## 제약/가정/리스크/의존성

- **제약**: 동작 변화 없이 코드 정리만. DB 스키마 변경 없음
- **가정**: 운영 DB에 `-` 마크는 04-28 마이그레이션 이후 더 이상 신규 생성되지 않음 (정리 후 신규는 `''`로 저장)
- **리스크**: 운영 DB에 과거 `-` 데이터가 잔존한다면 `parseContent`/`getStatusSymbol` 변경 후에도 default 경로로 결석 처리되므로 동작 회귀 없음. 그러나 화이트리스트에서 `-`를 invalid로 만드는 경우 **기존 데이터 읽기는 영향 없음**(검증은 입력 시점에만 적용)
- **내부 의존성**: `attendance-ui-revamp` 후속. `attendance-management.md` FD에 병합 예정
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: PR 단일. 별도 플래그/단계 출시 없음. 머지 즉시 배포
- **이벤트**: GA4 이벤트 변경 없음 | **검증**: 출석 모달 체크/언체크/결석 처리 + 모달 큐 멱등성 + 집계 카운트 동작 회귀를 통합 테스트로 확인

### 배포 전 필수 체크 (2026-05-11 reviewer 권고 반영)

- [ ] **운영 DB 잔존 `'-'` row 확인**: 2026-04-28 1회성 마이그레이션 이후 신규 `'-'` 저장이 없음을 가정. 머지 전 `SELECT COUNT(*) FROM attendance WHERE content = '-'` 으로 잔존 0건 확인. 잔존 시 별도 정리 SQL 선행
- read path는 `parseContent` default 분기로 자연 흡수되어 동작 회귀는 없지만, 통계 카운트 정합성을 위해 잔존 0 검증 권장

## 후속 과제 (reviewer 권고, 본 PR 범위 외)

- [ ] **DB CHECK 제약**: Prisma `@db.Check` 미지원이라 별도 마이그레이션으로 `CHECK (content IN ('◎','○','△',''))` 추가 검토 (database-reviewer L1)
- [ ] **`AttendanceModal.tsx` 파일 분리**: 530줄. `AttendanceCellButton`/`getStatusSymbol` 별도 파일 분리 검토 (typescript-reviewer L3)
- [ ] **default 브랜치 reachability 테스트**: Zod 우회 시 unreachable 동작 검증. 통합 테스트 우회 호출 필요. 우선순위 낮음 (silent-failure-hunter M8)

## 오픈 이슈

- [x] 화이트리스트에서 `'-'`를 invalid로 거부 — **결정 완료**. invalid 거부. Zod union literal로 타입 좁힘까지 동반 (2026-05-11 reviewer M3/M4 권고 반영)

## 연결 문서

- 사업 문서: 없음 (BUGFIX, 코드 정리)
- 기능 설계: `docs/specs/functional-design/attendance-symbol-token-unify.md` (작성 예정 → 6단계에서 `attendance-management.md`에 병합)
- 후속 종결: `docs/specs/prd/attendance-ui-revamp.md` FU1+FU2 항목
