# PRD: 학생 추가 필드 (부모님 연락처)

> 상태: Draft | 작성일: 2026-04-24

## 배경/문제 요약

- 참고:
  - `docs/business/0_feedback/entries/2026-03-11-heukseok.md` (흑석동 원 요청)
  - `docs/business/0_feedback/feedback-categories.md` 학생 정보 섹션
  - `docs/business/6_roadmap/roadmap.md` 2단계 (유저 확장 + 가톨릭 특화)
- 문제: 현재 `Student` 스키마에는 학생 본인 연락처(`contact`)만 있고, **부모 연락처 정규 필드가 없다.** 교사는 비고란(`description`)에 수기로 기입 중 — 검색·정렬·일괄 표시 불가.
- 현재 상태:
  - Student 필드: `societyName`, `catholicName`, `gender`, `age`, `contact`, `description`, `baptizedAt`
  - 성남동 관찰(2026-02-26): 비고란에 "등록 여부, 학교, 생일, 부모님 연락처, 집 주소" 기입 패턴
  - 흑석동 요청(2026-03-11): "부모님 연락처 별도 필드 + 자모 번호가 같이 보였으면"
- 목표 상태: 부모님 연락처를 정식 필드로 제공. 본 범위는 **학생 관리 영역**(추가/수정/상세/엑셀 Import)에 국한. 출석부 화면 노출은 "출석부 UI 개편"(P1)에서 통합.

## 목표/성공 기준

- **목표**: 2곳 반복 피드백(성남동·흑석동) 해소 + 비고란 우회 사용을 정규 필드로 이관
- **성공 지표**:
  - 배포 4주 내 신규 등록 학생 중 `parentContact` 입력율 ≥ 20%
  - 흑석동·성남동에서 정규 필드 사용 확인 (정성 피드백)
- **측정 기간**: 배포 후 4주

## 사용자/대상

- **주요 사용자**: 주일학교 교사 (입력/조회 주체)
- **사용 맥락**:
  - 신규 학생 등록 시 부모 연락처 기입
  - 기존 학생 편집으로 비고란 정보를 정규 필드로 이관
  - 학생 상세 페이지(`/students/:id`)에서 부모 연락처 확인
  - 출석 화면 내 즉시 노출은 본 범위 외 — TARGET FUNCTIONAL "출석부 UI 개편"(P1)에서 통합 처리

## 범위

### 포함

- `Student` 스키마에 `parentContact` 필드 추가 — **단일 필드, 문자열 저장**
  - Prisma: `parentContact String?` (`@db.VarChar(20)`, nullable)
  - Zod 검증: 숫자·하이픈·공백·괄호 허용 패턴 + max 20 (구체 정규식은 FD에서 확정)
  - 사용자 입력 형식을 그대로 보존 (예: `010-1234-5678`, `(010) 1234 5678` 등)
  - 표시 단계에서 포매팅 헬퍼 적용 가능 (hyphen 정규화 등)
- 학생 생성/수정 tRPC 입력 스키마 확장 + 통합 테스트
- 학생 일괄 등록(Excel) 스키마에 선택 컬럼 추가
- 학생 관리 UI: 입력 폼 + 리스트/상세 표시 확장
- `StudentSnapshot` 필드 반영 (이력 보존 일관성)
- 데이터 마이그레이션: 기존 레코드는 NULL (수동 이관)

### 제외

- 부/모 연락처 2분리 (`fatherContact`/`motherContact`) — 단일 필드로 시작, 추후 니즈 확정 시 분리 검토
- **생년월일** — 흑석동 요청에 포함됐으나 본 범위에서 제외. 세례명 축일 기능과 결합 가치 있음. 별도 과제로 재검토
- **출석 페이지 내 부모 연락처 노출** — 흑석동 요청에 포함됐으나 본 범위에서 제외. TARGET FUNCTIONAL **"출석부 UI 개편"**(P1)에서 통합 설계 예정 (출석 테이블 전면 개편과 함께 다룸이 합리적)
- 주소·학교·등록 여부 등 기타 필드 (본 PRD 범위 아님)
- `description` 자동 파싱·일괄 이관 (수동 이관)

## 사용자 시나리오

1. **신규 등록**: 교사가 학생 기본 정보와 함께 부모 연락처 입력 → 저장 시 정규 필드로 저장
2. **기존 학생 편집**: 비고란 정보를 정규 필드로 옮김 → 저장 후 사용자가 비고란 정리 (강제 삭제 없음)
3. **엑셀 일괄 등록**: 새 템플릿에 `부모 연락처` 열 포함 → 기존 템플릿도 하위 호환 (선택 컬럼 누락 허용)

## 요구사항

### 필수 (Must)

- [ ] `Student.parentContact` 필드 추가 — `String?` (`@db.VarChar(20)`), 단일 필드, 사용자 입력 그대로 저장
- [ ] `StudentSnapshot` 테이블에 동일 필드 추가 (스냅샷 생성 지점 모두 반영)
- [ ] `student.create` / `student.update` / `student.bulkCreate` tRPC 입력 확장
- [ ] 학생 목록/상세 응답에 필드 포함
- [ ] 학생 관리 UI 입력 폼·표시 확장 (생성·수정 모달)
- [ ] 입력 검증(Zod) + 통합 테스트 커버
- [ ] Prisma 마이그레이션(선택 컬럼 추가 — 무중단)

### 선택 (Should)

- [ ] Excel 템플릿 다운로드에 컬럼 추가

### 제외 (Out)

- 부/모 필드 분리
- 생년월일 필드
- 주소·학교 필드
- `description` 자동 파싱/이관

## 제약/가정/리스크/의존성

- **제약**: 기존 `Student` 스키마는 breaking change 금지. 신규 필드는 선택(Optional) + Prisma 마이그레이션은 무중단 추가.
- **가정**:
  - 부모 연락처는 단일 필드로 충분 (교사 판단으로 대표 번호 1개 기입). 부·모 분리는 추후 니즈 확정 시 별도 과제
  - **문자열 저장** — 학생 기존 `contact`(BigInt) 설계는 과거 미스로 인지된 상태. 신규 필드는 사용자 입력 원본을 문자열 그대로 보존 + 표시 포매팅 분리 전략으로 설계 일관화
  - 기존 `contact` 필드의 String 이관은 본 범위 외 — **TARGET BUGFIX에 별도 과제로 등록됨**
  - 엑셀 일괄 등록은 기존 템플릿과 **하위 호환 유지** (새 컬럼 누락 시 NULL)
- **리스크**:
  - **개인정보 수집 범위 확대** → 개인정보 제공 동의서 문구 검토 필요 (기존 2단계 수동 체크 동의 범위와 정합성)
  - 일괄 등록 Excel 스키마 변경 → 기존 템플릿 사용자 혼란 가능 (하위 호환으로 완화)
- **내부 의존성**:
  - `StudentSnapshot` 테이블 구조
  - 학생 관리 UI 컴포넌트
  - `bulkCreateStudentItemSchema` (엑셀 등록) — `input-validation-hardening` 설계 계승
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: 직접 배포 (비파괴 추가, 피처 플래그 불필요)
- **동의서 업데이트**: 개인정보 제공 동의서 문구에 "학생 및 **보호자** 연락처" 명시. 법률 자문(`docs/business/STATUS.md` 오픈 이슈)은 별도 처리 경로로 위임
- **이벤트**: `student.create`/`student.update` 시 `parentContact` 기입 여부 GA4 보강 여부는 FD 단계에서 결정
- **검증**:
  - 흑석동·성남동 대상 피드백 확인 (배포 후 2주)
  - 신규 등록 학생 중 `parentContact` 입력율 추적 (DB 쿼리 or GA4)
  - 기존 엑셀 템플릿 업로드 무결성 확인 (회귀 테스트)

## 오픈 이슈

없음 — FD 진입 전 모든 이슈 결정 완료.

### 결정 사항 (2026-04-24)

| 항목 | 결정 |
|------|------|
| 부모 연락처 개수 | 단일 필드 (부·모 분리는 추후 니즈 확정 시 별도) |
| 타입 | `String?` (`@db.VarChar(20)`), 사용자 입력 원본 보존 + 표시 포매팅 분리 |
| 생년월일 | 범위 제외 (세례명 축일 결합 가치 — 별도 과제) |
| 출석 화면 노출 | 범위 제외 — "출석부 UI 개편"(P1 FUNCTIONAL)으로 이월 |
| 개인정보 동의 | 문구에 "학생 및 보호자 연락처" 명시 + 법률 자문은 `STATUS.md`에 위임 |
| 엑셀 하위 호환 | 허용 (누락 컬럼 NULL) |
| 후속 과제 | `Student.contact` BigInt → String 이관 — TARGET BUGFIX 등록 |

## 연결 문서

- 사업 문서:
  - `docs/business/0_feedback/entries/2026-03-11-heukseok.md`
  - `docs/business/0_feedback/feedback-categories.md` (학생 정보 섹션)
  - `docs/business/6_roadmap/roadmap.md` (2단계)
- 기능 설계: `docs/specs/functional-design/student-extra-fields.md` (작성 예정, 2단계에서)
- 관련 기존 설계: `docs/specs/functional-design/student-management.md` (도메인 메인 — 병합 대상)
- 관련 이전 작업: `docs/specs/prd/input-validation-hardening.md` (contact 검증 규칙 계승)
