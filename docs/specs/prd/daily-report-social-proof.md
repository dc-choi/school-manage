# PRD: 일일 보고 메일 정비 (이탈 감지 cron 폐지 + 사회적 증거 추가)

> 상태: Draft | 작성일: 2026-05-07

## 배경/문제 요약

- 참고: `docs/specs/functional-design/org-daily-report.md`, `docs/specs/functional-design/churn-detection-alert.md`
- 문제:
    - 운영자 메일이 09:00 (`churnDetection`)·21:00 (`orgDailyReport`) 두 시점으로 분산되어 있고, 09:00 메일은 실제로 잘 확인되지 않는다.
    - 21:00 일일 보고서는 조직 활동/계정 현황만 담고 있어, 매일 누적되는 도입 규모(본당·계정·학생 수)를 따로 확인하려면 랜딩을 별도로 열어야 한다.
- 현재 상태:
    - 09:00 KST: `Scheduler.churnDetection()` → `DetectChurnUseCase` → `mailService.sendChurnAlert()` → `ChurnAlertLog` 적재
    - 21:00 KST: `Scheduler.orgDailyReport()` → `OrgDailyReportUseCase` → `mailService.sendOrgDailyReport()`
    - 두 메일 모두 `env.smtp.adminEmail` 단일 수신자로 발송 (`mail.service.ts:95, 124`)
- 목표 상태:
    - 메일 발송은 21:00 1회로 일원화. 09:00 cron + 관련 도메인/모델/템플릿/마이그레이션 코드는 완전 제거.
    - 21:00 일일 보고서 본문 상단에 "**{churchCount}개 본당에서 {accountCount}명의 계정이 {studentCount}명의 학생과 함께하고 있어요**" 형식의 사회적 증거 한 줄을 노출.

## 목표/성공 기준

- **목표**: 운영자 메일 단일화 + 매일 자동으로 도입 규모를 일일 보고서에서 확인.
- **성공 지표**:
    - `apps/api` 빌드 후 09:00 cron이 더 이상 등록되지 않음 (서버 로그/스케줄러 상태 확인).
    - 21:00 메일 본문 첫 섹션에 본당/계정/학생 카운트가 정확히 표시됨 (`trpc.account.count`와 동일한 수치).
    - `domains/churn/`, `ChurnAlertLog` 모델, 관련 템플릿/서비스 메서드/타입이 코드베이스에서 사라짐 (`grep`으로 잔존 참조 0건).
- **측정 기간**: 배포 직후 1회 운영 확인.

## 사용자/대상

- **주요 사용자**: 시스템 운영자 (= `env.smtp.adminEmail` 수신자, 현재는 사용자 본인 1명).
- **사용 맥락**: 매일 21:00 KST에 메일을 받고 도입 본당·계정·학생 카운트와 조직별 활동/계정 현황을 한 번에 확인.

## 범위

### 포함

- `Scheduler.churnDetection()` 메서드 + `app.ts`(또는 부트스트랩)에서의 호출 제거
- `apps/api/src/domains/churn/` 디렉토리 전체 삭제 (UseCase, types, 단위 테스트 포함)
- `MailService.sendChurnAlert()` 메서드 및 `churnAlertTemplate()` 삭제
- `ChurnAlert` 타입 import 정리
- Prisma `ChurnAlertLog` 모델 + 관련 마이그레이션 (DROP TABLE) 작성·적용
- `OrgDailyReportUseCase`에 본당/계정/학생 카운트 3종 조회 추가 (`CountAccountsUseCase`/`trpc.account.count`와 동일 정의 — 누계 기준, 소프트 삭제 포함, church는 모임이 1개 이상인 본당만)
- `OrgDailyReportResult`/`sendOrgDailyReport` 시그니처에 카운트 필드 추가
- `orgDailyReportTemplate()` 본문 상단에 사회적 증거 한 줄 삽입
- 관련 테스트 추가/수정 (org daily report 테스트, churn 관련 테스트 삭제)
- 도메인 메인 FD 갱신 (`org-daily-report.md`에 통합, `churn-detection-alert.md` 삭제)

### 제외

- 출석부 사이트 (랜딩 외) 사회적 증거 페이지 신규 작성
- 다른 운영자/본당 관리자에게 메일 발송 확장 (현재 admin 단일 수신자 구조 그대로 유지)
- 사회적 증거 동적 콘텐츠 수집 (외부 인터뷰, 후기 등 — 정적 카운트만)
- 메일 HTML 화. 기존 텍스트 메일 형식 유지

## 사용자 시나리오

1. **일일 보고 수신**: 매일 21:00 KST에 운영자가 받은 메일 첫 줄에서 "{N}개 본당에서 {M}명의 계정이 {K}명의 학생과 함께하고 있어요"를 확인하고, 이어지는 조직 활동/계정 현황 표를 본다.
2. **이탈 감지 메일 미수신**: 09:00 KST에 메일이 더 이상 오지 않는다. 이탈 위험 모니터링이 필요해지면 추후 별도 기능으로 재설계.

## 요구사항

### 필수 (Must)

- [ ] 21:00 일일 보고 메일 본문 상단에 사회적 증거 한 줄 (본당/계정/학생 카운트) 표시
- [ ] 카운트 산출 기준은 `trpc.account.count` (`CountAccountsUseCase`)와 동일 (랜딩 표시 수치와 일치)
- [ ] 09:00 cron 폐지 (`Scheduler.churnDetection()` 제거 + 호출 제거)
- [ ] `domains/churn/` 디렉토리 + `ChurnAlertLog` Prisma 모델 + 관련 마이그레이션(DROP TABLE) 적용
- [ ] `MailService.sendChurnAlert`, `churnAlertTemplate`, `ChurnAlert` 타입, churn 관련 테스트 모두 삭제
- [ ] `pnpm typecheck && pnpm test && pnpm build` 통과
- [ ] 도메인 메인 FD에 변경 반영 (`org-daily-report.md` 갱신, `churn-detection-alert.md` 삭제)

### 선택 (Should)

- [ ] 사회적 증거 한 줄 옆에 `(YYYY-MM-DD 기준)` 같은 기준일 보조 텍스트
- [ ] 카운트 조회 SQL을 `OrgDailyReportUseCase` 내부 메서드로 분리해 가독성 유지

### 제외 (Out)

- 사회적 증거 그래프/차트
- HTML 메일 전환
- 다중 수신자 발송

## 제약/가정/리스크/의존성

- **제약**:
    - 메일 본문은 텍스트 형식 유지 (Nodemailer `text` 필드).
    - `env.smtp.*` 미설정 환경에서는 발송 자체가 skip되므로 카운트 조회도 발송 가능 시에만 수행.
- **가정**:
    - 수신자는 `env.smtp.adminEmail` 단일. 본인 외 운영자에게 발송하지 않는다.
    - `ChurnAlertLog` 데이터는 보존 가치 없음 (기능 폐기 시 함께 삭제).
- **리스크**:
    - 마이그레이션이 운영 DB에서 실패할 가능성 — 사전에 `pnpm prisma migrate diff`로 SQL 검증 + 롤백 SQL 준비.
    - `domains/churn/`을 참조하는 의외의 import 잔존 가능 — `grep`으로 전 영역 스캔 필수.
- **내부 의존성**:
    - `OrgDailyReportUseCase`, `MailService`, `Scheduler`, Prisma 스키마/마이그레이션
    - 기존 테스트 (`apps/api/test/**/*.test.ts`)
- **외부 의존성**: 없음.

## 롤아웃/검증

- **출시 단계**: 단일 PR로 배포. 마이그레이션 적용 후 다음 21:00 cron에서 새 본문 확인.
- **이벤트**: 별도 GA4 이벤트 없음 (운영자 메일).
- **검증**:
    1. 로컬에서 `pnpm --filter @school/api db:reset` 후 `OrgDailyReportUseCase` 단위 테스트 통과.
    2. 스케줄러 부팅 시 09:00 작업이 등록되지 않는지 로그 확인.
    3. 운영 배포 후 다음 21:00 메일 본문에 사회적 증거 한 줄이 정상 표시되는지 사용자가 직접 확인.

## 오픈 이슈

- [ ] 사회적 증거 표기에 기준일 표시(예: "2026-05-07 기준")를 포함할지 — 기본 미포함, FD 단계에서 사용자 의견 한 번 더 확인.
- [ ] `ChurnAlertLog` 마이그레이션 파일명/순서 — `/prisma-migrate` 스킬 사용 시 결정.

## 연결 문서

- 사업 문서: `docs/business/STATUS.md` (사회적 증거 노출 가치 — 인터뷰 카드뉴스/복귀 사례)
- 기능 설계: `docs/specs/functional-design/org-daily-report.md` (병합 대상), `docs/specs/functional-design/churn-detection-alert.md` (삭제 대상)
- 관련 코드: `apps/api/src/infrastructure/scheduler/scheduler.ts`, `apps/api/src/infrastructure/mail/{mail.service.ts,templates.ts}`, `apps/api/src/domains/{churn,report}/`
