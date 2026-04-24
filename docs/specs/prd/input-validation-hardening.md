# PRD: 입력 검증 강화

> 상태: Draft | 작성일: 2026-04-24

## 배경/문제 요약

- 참고: `docs/specs/README.md` TARGET/BUGFIX "입력 검증 강화" (P2)
- 문제: 출석 `data` 필드, 로그인 `name`, 학생 단건 `contact`·`description` 입력에 Zod 상한/화이트리스트 부재. 클라이언트 검증 우회 직접 호출 시 대용량 문자열/비정상 값이 그대로 저장되어 DoS·데이터 무결성 위험.
- 현재 상태: 학생 **일괄** 경로(`bulkCreateStudentItemSchema`)만 엄격 검증(완료). 출석/로그인/학생 단건은 느슨.
- 목표 상태: 서버측 재검증으로 비정상 값 차단 + 단건/일괄 경로 일관성 확보.

## 목표/성공 기준

- **목표**: 클라이언트 우회 호출 시 서버 입력 스키마가 비정상 요청을 BAD_REQUEST로 차단.
- **성공 지표**:
    - 출석 `data` 비정상 값(10자 초과 또는 허용 외 문자) 서버 차단
    - 학생 `contact` 미숫자/15자 초과 저장 방지
    - 학생 `description` 500자 초과 저장 방지
    - 로그인 `name` 50자 초과 요청 거부
    - 기존 통합 테스트 유지 + 신규 검증 케이스(정상/경계/위반) 추가
- **측정 기간**: 배포 직후 1주일 (서버 에러 로그 `ZodError` 추이 관찰)

## 사용자/대상

- **주요 사용자**: 모든 인증된 계정 (교리교사/관리자) + 악의적 외부 호출자
- **사용 맥락**: 학생 등록/수정, 출석 입력, 로그인 — 모든 입력 경로

## 범위

### 포함

- **A. 출석 data 화이트리스트** (`attendanceDataSchema.data`)
    - 허용값: `◎` / `○` / `△` / `-` / `''` (update-attendance.usecase.ts:77~92에서 분기되는 5종)
    - 제약: `max(10)` + `regex(/^[◎○△\-]*$/)`
- **B. 로그인 입력 길이 상한** (`loginInputSchema`)
    - `name.max(50)` 추가
    - `password.max(128)` 추가 (bcrypt DoS 증폭 차단). password의 **최소 길이/문자 집합**은 변경 금지 (과거 계정 보호)
- **C. 학생 단건 입력 상한** (`create`/`update` 공통 — 일괄 경로와 동일 제약)
    - `contact`: `regex(/^\d+$/)` + `max(15)`
    - `description`: `max(500)`
    - `societyName`: `max(50)` (min(1) 유지)
    - `catholicName`: `max(50)` (optional/nullable 유지)

### 제외

- 기존 DB 데이터 일괄 정규화 (하이픈 포함 기존 contact 재포맷)
- 로그인 `name` 문자 집합(`^[a-z0-9]+$`) 강제 — 과거 가입자 호환성
- 로그인 `password` 길이 강제 — 과거 계정 보호
- 엑셀 일괄 경로 (이미 완료)
- 클라이언트 UI 에러 메시지 개선 (필요 시 별도 처리)

## 사용자 시나리오

1. **정상**: 교리교사가 학생 등록 시 `contact: "01012345678"` 입력 → 통과
2. **클라 우회**: 외부 호출자가 tRPC 직접 호출로 `contact: "<script>..."` 전송 → BAD_REQUEST
3. **부분 수정**: 기존 DB에 `010-1234-5678` 저장된 학생의 다른 필드만 수정 시 `contact` 미전송(undefined) → 통과 (기존 값 유지)
4. **기존값 수정 시도**: 기존 하이픈 포함 값을 그대로 재전송 → BAD_REQUEST (사용자가 숫자만으로 교정 필요)

## 요구사항

### 필수 (Must)

- [ ] `attendanceDataSchema.data`에 `.max(10).regex(/^[◎○△\-]*$/)` 추가 (한글 메시지)
- [ ] `loginInputSchema.name`에 `.max(50)` 추가, `password`에 `.max(128)` 추가 (한글 메시지)
- [ ] `createStudentInputSchema.contact`에 `.regex(/^\d+$/).max(15)` 추가 (optional 유지)
- [ ] `updateStudentInputSchema.contact`에 동일 제약 + `.nullable().optional()` 유지
- [ ] `createStudentInputSchema.description`에 `.max(500)` 추가 (optional 유지)
- [ ] `updateStudentInputSchema.description`에 `.max(500).nullable().optional()` 유지
- [ ] `createStudentInputSchema.societyName`/`catholicName`, `updateStudentInputSchema.societyName`/`catholicName`에 `.max(50)` 추가 (일괄 경로 일관성)
- [ ] 에러 메시지 한글화 (일괄 경로와 동일 톤: "전화번호는 숫자만 입력해주세요", "비고는 500자 이하여야 합니다" 등)
- [ ] 통합 테스트: 정상 / 경계값(max 경계) / 위반(초과·형식 위반) 케이스
- [ ] **기존 데이터 영향 조사**: 운영 DB `Student.contact`에 숫자 외 문자 포함 건수 확인 (배포 전 1회 SELECT)

### 선택 (Should)

- [ ] 기존 데이터에 정규식 위반 항목 다수(임계: 전체 10% 초과)이면 `contact` 정규식 완화 재검토 (`^[0-9\-\s]+$` 등)

### 제외 (Out)

- 기존 DB 데이터 일괄 마이그레이션
- 로그인 `password`/`name` 문자 집합 엄격화
- 프론트엔드 UI/UX 개선

## 제약/가정/리스크/의존성

- **제약**:
    - 로그인 스키마 엄격화 시 기존 계정 접속 불가 → 스코프 제외
    - 학생 `update`에서 `contact`/`description`은 `.nullable().optional()` 유지 (기존 null 처리 호환)
- **가정**:
    - 출석 `data`에 `-` (결석 명시) 사용됨 (`update-attendance.usecase.ts:87` case 분기). `PRESENT_MARKS`(`◎○△`)에는 없으나 저장은 허용되는 값.
    - 기존 Student.contact의 하이픈/공백 포함 비율은 소수 (신규 가입자 대부분 엑셀 일괄 경로 사용 이후)
- **리스크**:
    - C의 `^\d+$` 강제 → 기존 하이픈 포함 contact를 가진 학생의 `contact` 재전송 시 실패. 완화: `nullable().optional()`로 **전송 안 하면 기존 값 유지**. 배포 전 DB 조회로 규모 파악.
    - 위반 규모 10% 초과 시 정규식 완화 롤백 계획 (Should 항목)
- **내부 의존성**: 없음 (스키마 + 테스트만)
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: 단일 PR. 기존 데이터 영향은 배포 전 운영 DB `SELECT COUNT(*) FROM student WHERE contact REGEXP '[^0-9]' AND deleted_at IS NULL`로 검증.
- **이벤트**: 없음 (보안/입력 검증 강화)
- **검증**: 통합 테스트 + 배포 후 1주간 `ZodError` 서버 로그 추이 관찰

## 오픈 이슈

- [ ] 운영 DB `Student.contact` 숫자 외 문자 포함 건수: 배포 전 사용자가 확인 필요
- [ ] 출석 `data` 하이픈(`-`) 정식 허용 여부: `update-attendance.usecase.ts` 분기 존재 → 허용 판단. 재확인 필요

## 연결 문서

- 사업 문서: `docs/business/STATUS.md` (기술 부채)
- 기능 설계: 2단계에서 `attendance-management.md` / `auth-account.md` / `student-management.md` 보완 섹션 추가 예정
