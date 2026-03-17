# 기능 설계: 이탈 감지 자동 알림 (운영자용)

> 백엔드 전용 기능 (UI 없음). 크론잡 기반 자동 감지 + 이메일 발송.

## 연결 문서

- PRD: `docs/specs/prd/churn-detection-alert.md`
- Task: `docs/specs/target/non-functional/tasks/churn-detection-alert.md`
- Development: `docs/specs/target/non-functional/development/churn-detection-alert-backend.md`

## 시스템 플로우

### 일간 감지 플로우

1. 크론잡 실행 (매일 09:00 KST)
2. SMTP 활성화 확인 → 비활성 시 스킵 (로그만 기록)
3. 전례력 예외 확인 → 성주간(주님 수난 성지주일 ~ 성토요일) 기간이면 스킵
4. 출석 기록이 1건 이상인 단체 중 14일 이상 미활동 단체 조회
5. 최근 7일 내 이미 알림 발송된 단체 제외 (중복 방지)
6. 대상 단체가 0건이면 종료
7. 운영자(ADMIN_EMAIL)에게 요약 이메일 발송
8. 발송 이력 저장 (ChurnAlertLog)

### 상태 전이

```
[활성 단체] --14일 미활동--> [이탈 위험] --알림 발송--> [알림 완료]
                                                         |
[알림 완료] --7일 경과 + 미활동 지속--> [재알림 대상] --알림 발송--> [알림 완료]
[알림 완료] --활동 재개--> [활성 단체]
```

## 데이터/도메인 변경

### 엔티티: ChurnAlertLog (신규)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt (PK) | 자동 증분 |
| organizationId | BigInt (FK) | 대상 단체 |
| inactiveDays | Int | 미활동 일수 |
| sentAt | DateTime | 알림 발송 시각 |

- Organization 1:N ChurnAlertLog 관계
- 인덱스: `(organizationId, sentAt)` — 중복 방지 조회 최적화

### 마이그레이션

- `ChurnAlertLog` 테이블 생성
- Organization 모델에 `churnAlertLogs` 관계 추가

## 감지 로직

### 미활동 단체 판별 기준

| 조건 | 설명 |
|------|------|
| 출석 기록 1건 이상 | 온보딩 중(0건) 단체 제외 |
| 마지막 출석일 ≥ 14일 전 | YYYYMMDD 형식 MAX(date) 기준 |
| 단체 미삭제 | `organization.deletedAt IS NULL` |
| 학생 미삭제 | `student.deletedAt IS NULL` |
| 출석 미삭제 | `attendance.deletedAt IS NULL` |

### 중복 방지

- ChurnAlertLog에서 해당 organizationId + sentAt이 7일 이내면 제외
- 7일 경과 후 미활동 지속 시 재알림

### 전례력 예외

| 예외 기간 | 산출 방법 | 비고 |
|----------|---------|------|
| 성주간 (주님 수난 성지주일 ~ 성토요일) | Easter - 7일 ~ Easter - 1일 | 주일학교 수업 없는 기간 |

- `calculateEaster(year)`로 부활절 산출 → 성주간 범위 계산
- 크론잡 실행일이 성주간에 포함되면 전체 스킵

## 이메일 형식

### 제목

```
[출석부] 이탈 위험 단체 {N}곳 감지 ({날짜})
```

### 본문 (플레인 텍스트)

```
이탈 위험 단체 목록 ({날짜} 기준)

1. {본당명} - {모임명} | 미활동 {N}일 | 학생 {M}명 | 마지막 활동: {YYYY.M.D}
2. ...

총 {N}곳 감지됨.
```

### 필요 데이터 (단체별)

| 항목 | 출처 |
|------|------|
| 본당명 | Church.name (Organization → Church) |
| 모임명 | Organization.name |
| 미활동 일수 | 오늘 - MAX(Attendance.date) |
| 학생 수 | Student.count (해당 Organization, 미삭제) |
| 마지막 활동일 | MAX(Attendance.date) |

## 권한/보안

- **접근 제어**: 시스템 크론잡만 실행. 외부 API 없음
- **수신자**: ADMIN_EMAIL 환경변수로 고정 (운영자 1명)
- **감사/로그**: 크론잡 실행 시각, 감지 결과, 발송 결과를 서버 로그에 기록

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| SMTP 미설정 | `mailService.isEnabled()` false → 스킵 (로그 기록) |
| 이탈 위험 단체 0건 | 이메일 미발송 (로그만 기록) |
| 전례력 예외 기간 | 크론잡 실행되나 감지/발송 스킵 |
| DB 조회 실패 | try/catch → 에러 로그. 프로세스 중단 없음 |
| 이메일 발송 실패 | try/catch → 에러 로그. 발송 이력 미저장 |
| 단체 삭제 후 잔존 출석 데이터 | `organization.deletedAt IS NULL` 필터로 제외 |

## 성능/제약

- **실행 주기**: 매일 09:00 KST (1회)
- **예상 부하**: 단체 ~66곳, 쿼리 1~2회 (집계) + 이메일 1통
- **Gmail 한도**: 500통/일 — 1통/일이므로 문제없음
- **타임아웃**: 크론잡 내 DB 쿼리 + 이메일 발송 총 10초 이내 예상

## 측정/모니터링

- **로그**: 크론잡 실행 (`[Scheduler] churnDetection: started`), 감지 결과 (`detected N orgs`), 발송 결과 (`sent/skipped`)
- **추적**: 알림 후 7일 내 활동 재개 여부 — ChurnAlertLog.sentAt + 해당 org의 다음 출석일 비교 (수동 분석)

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 14일 미활동 단체 2곳 → 이메일 1통 발송, 2곳 정보 포함
2. **TC-2**: 모든 단체 활성 → 이메일 미발송
3. **TC-3**: 7일 내 이미 알림 발송된 단체 → 목록에서 제외
4. **TC-4**: 출석 기록 0건 단체 → 목록에서 제외 (온보딩 중)

### 예외 케이스

1. **TC-E1**: 성주간 기간 → 크론잡 실행되나 감지/발송 전체 스킵
2. **TC-E2**: SMTP 미설정 → 스킵 (에러 없음)
3. **TC-E3**: DB 조회 오류 → 에러 로그, 프로세스 정상 유지
4. **TC-E4**: 단체 삭제 후 → 이탈 목록에서 제외

---

**작성일**: 2026-03-17
**작성자**: SDD 작성자
**상태**: Draft
