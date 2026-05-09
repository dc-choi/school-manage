# 조직 현황 일일 보고서 (운영자용)

> 비기능 요구사항 (ANALYTICS)

## 배경

운영자가 매일 DB에 직접 SQL을 질의하여 조직 활성화 현황과 계정 현황을 확인하고 있음. 이를 자동화하여 매일 이메일로 보고서를 수신.

## 요구사항

### Must

- 매일 21:00 KST 크론잡으로 운영자(`env.smtp.adminEmail`)에게 이메일 발송
- 본문 최상단에 **사회적 증거** 한 줄: `{churchCount}개 본당에서 {accountCount}명의 선생님들이 {studentCount.toLocaleString('ko-KR')}명의 학생과 함께하고 있어요.` (랜딩/AuthLayout 카피와 동일)
- 보고서 1: 조직 활성화 현황 (본당명, 모임명, 타입, 그룹수, 학생수, 출석수, 최근 활동일)
- 보고서 2: 조직별 계정 현황 (본당명, 모임명, 타입, 계정수, 계정명 목록)
- SMTP 환경변수 미설정 시 비활성화 (기존 패턴 동일)

### Out

- GA4 연동 (적합하지 않음)
- 웹 UI 대시보드
- 09:00 KST 이탈 감지 알림 (2026-05-07 폐지 — 운영자 미확인)

## 기술 설계

### 도메인 구조

```
domains/report/
├── report.types.ts          # OrgActivityRow, OrgAccountRow, OrgSocialProof, OrgDailyReportResult
└── application/
    └── org-daily-report.usecase.ts  # execute(): activity + account + socialProof 병렬 조회
```

### 사회적 증거 카운트

`CountAccountsUseCase`(랜딩 `trpc.account.count`)와 **동일 정의** — 한쪽 변경 시 양쪽 동기화 필요. 누계 기준, 소프트 삭제 포함, church는 모임이 1개 이상인 본당만.

| 필드           | 산출                                                                |
| -------------- | ------------------------------------------------------------------- |
| `accountCount` | `database.account.count()`                                          |
| `churchCount`  | `database.church.count({ where: { organizations: { some: {} } } })` |
| `studentCount` | `database.student.count()`                                          |

### 데이터 모델

기존 테이블만 조회 (새 테이블 불필요).

### API

없음 (크론잡 전용).

### 이메일 보고서 형식

- 제목: `[출석부] 조직 현황 일일 보고서 (YYYY-MM-DD)`
- 본문 (텍스트):
    1. 사회적 증거 한 줄 (최상단)
    2. `[조직 활성화 현황]` 섹션
    3. `[조직별 계정 현황]` 섹션
- 본인 발송 기준 "선생님" 대신 **"계정"** 표기

### 크론잡

- 시간: 매일 21:00 KST (`0 21 * * *`)
- 기존 Scheduler 클래스에 `orgDailyReport()` 정적 메서드
- 09:00 KST `churnDetection`은 폐지됨 (관련 도메인/모델/마이그레이션 모두 제거 — 2026-05-07)

### 예외 처리

| 상황                            | 처리                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `mailService.isEnabled()` false | UseCase 미호출, 발송 스킵 로그만                                                                    |
| 카운트 쿼리 1건 reject          | UseCase `Promise.all` fail-fast → cron try/catch에서 에러 로그, 메일 미발송 (다음 회차 자동 재시도) |
| 0건 카운트                      | `0개 본당에서 0명의 선생님들이 0명의 학생과 함께하고 있어요.` 그대로 표기 (분기 없음)               |

### 테스트

- 통합: `apps/api/test/integration/org-daily-report.test.ts` — 정상/빈 DB/다중 조직 케이스에 `socialProof` 검증
- 단위: `apps/api/test/unit/mail/org-daily-report-template.test.ts` — 본문 첫 줄 + 0 카운트 + 제목 형식
