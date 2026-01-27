# 기능 설계: 측정 인프라

> PM 에이전트가 작성하는 기능 설계 문서입니다.
> 로드맵 1단계 "측정 인프라: 최소 이벤트 로깅 + GA4 연동" 기능입니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- 사업 문서: `docs/business/5_metrics/metrics.md`, `docs/business/6_roadmap/roadmap.md`
- Feature: `docs/specs/target/non-functional/features/measurement-infrastructure.md`
- Task: `docs/specs/target/non-functional/tasks/measurement-infrastructure.md`
- Development: `docs/specs/target/non-functional/development/measurement-infrastructure.md`

## 배경/목표

### 현재 문제

1. **서버 로그 유실**: 도커 볼륨 미설정으로 컨테이너 재시작 시 로그 유실
2. **사용자 행동 측정 불가**: GA4 미연동으로 획득/전환 퍼널 분석 불가
3. **지표 기반 의사결정 불가**: 측정 인프라 부재로 NSM/활성화/리텐션 지표 수집 불가

### 목표

1. 서버 로그 영속화 (도커 볼륨 설정)
2. GA4 연동으로 획득/전환 퍼널 측정
3. 핵심 이벤트 로깅으로 NSM 지표 수집 기반 마련

## 범위

### 포함

1. **서버 로깅 영속화**
   - 도커 볼륨 설정으로 로그 파일 영구 저장
   - 로그 보관 정책 정의

2. **GA4 연동 (클라이언트)**
   - gtag.js 설치
   - 획득 이벤트: 페이지뷰, UTM 파라미터
   - 전환 이벤트: 회원가입 완료, 로그인
   - 핵심 퍼널 이벤트: 첫 학생 등록, 첫 출석 기록

3. **서버 → GA4 연동 (선택)**
   - Measurement Protocol로 서버 사이드 이벤트 전송
   - 클라이언트에서 측정하기 어려운 이벤트용

### 제외

- 로그 분석 대시보드 (추후 별도 구현)
- 실시간 알림/경보 시스템
- 로그 집계 서버 (ELK 등)

---

## 1. 서버 로깅 영속화

### 현재 상태

| 항목 | 현재 |
|------|------|
| 로거 | tracer (dailyfile) |
| 로그 경로 | `/app/apps/api/logs` (컨테이너 내부) |
| 로그 파일 | `app-{날짜}.log`, `err-{날짜}.log`, `sql-{날짜}.log`, `net-{날짜}.log` |
| 로테이션 | 날짜별 (yyyymmdd) |
| 볼륨 | 없음 (유실 문제) |

### 변경 사항

#### docker-compose.yml 볼륨 추가

```yaml
services:
  api:
    # ... 기존 설정 ...
    volumes:
      - ./logs:/app/apps/api/logs
```

#### 로그 보관 정책

| 로그 유형 | 보관 기간 | 사유 |
|----------|----------|------|
| app (일반) | 30일 | 운영 모니터링 |
| err (에러) | 90일 | 장애 분석 |
| sql (쿼리) | 7일 | 성능 분석 |
| net (네트워크) | 30일 | API 사용 패턴 분석 |

> **Note**: 로그 정리는 수동 또는 cron job으로 처리 (초기에는 수동)

### 디렉토리 구조

```
school_back/
├── logs/                    # 호스트에 마운트됨
│   ├── app-20260128.log
│   ├── err-20260128.log
│   ├── sql-20260128.log
│   └── net-20260128.log
└── docker-compose.yml
```

---

## 2. GA4 연동 (클라이언트)

### 측정 이벤트 정의

지표 문서(`docs/business/5_metrics/metrics.md`) 기준으로 최소 이벤트 세트 정의.

#### 자동 수집 이벤트

| 이벤트 | 설명 | GA4 자동 수집 |
|--------|------|--------------|
| `page_view` | 페이지 조회 | Yes |
| `session_start` | 세션 시작 | Yes |
| `first_visit` | 첫 방문 | Yes |

#### 커스텀 이벤트 (획득/전환)

| 이벤트 | 트리거 | 파라미터 | 지표 연결 |
|--------|--------|----------|----------|
| `sign_up` | 회원가입 완료 | `method: 'form'` | 활성화 (7일 내 가입) |
| `login` | 로그인 성공 | `method: 'form'` | 리텐션 |

#### 커스텀 이벤트 (핵심 퍼널)

| 이벤트 | 트리거 | 파라미터 | 지표 연결 |
|--------|--------|----------|----------|
| `first_student_registered` | 첫 학생 등록 | `days_since_signup` | 활성화 (7일 내 등록) |
| `first_attendance_recorded` | 첫 출석 기록 | `days_since_signup` | 활성화 (7일 내 첫 출석) |
| `attendance_recorded` | 출석 기록 | `student_count` | 핵심 사용 (주간 출석 기록) |

### 구현 방식

#### gtag.js 설치 (apps/web)

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### 이벤트 전송 유틸리티

```typescript
// apps/web/src/lib/analytics.ts
export const analytics = {
    trackSignUp: () => {
        gtag('event', 'sign_up', { method: 'form' });
    },
    trackLogin: () => {
        gtag('event', 'login', { method: 'form' });
    },
    trackFirstStudentRegistered: (daysSinceSignup: number) => {
        gtag('event', 'first_student_registered', { days_since_signup: daysSinceSignup });
    },
    trackFirstAttendanceRecorded: (daysSinceSignup: number) => {
        gtag('event', 'first_attendance_recorded', { days_since_signup: daysSinceSignup });
    },
    trackAttendanceRecorded: (studentCount: number) => {
        gtag('event', 'attendance_recorded', { student_count: studentCount });
    },
};
```

### UTM 파라미터 처리

GA4가 자동으로 UTM 파라미터를 수집하지만, 내부 분석용으로 저장 고려:

| 파라미터 | 용도 |
|----------|------|
| `utm_source` | 유입 소스 (instagram, kakao 등) |
| `utm_medium` | 매체 (social, email 등) |
| `utm_campaign` | 캠페인명 |

---

## 3. 서버 → GA4 연동 (Measurement Protocol)

### 용도

클라이언트에서 측정하기 어려운 서버 사이드 이벤트 전송:
- 스케줄러 작업 (학년 전환 등)
- 백그라운드 작업
- 데이터 일관성 검증 결과

### 구현 방식

```typescript
// apps/api/src/infrastructure/analytics/ga4.ts
import { env } from '~/global/config/env.js';

const GA4_MEASUREMENT_ID = env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = env.GA4_API_SECRET;

export const ga4 = {
    async sendEvent(clientId: string, eventName: string, params: Record<string, unknown>) {
        const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

        await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                client_id: clientId,
                events: [{ name: eventName, params }],
            }),
        });
    },
};
```

### 서버 사이드 이벤트 (선택)

| 이벤트 | 트리거 | 파라미터 |
|--------|--------|----------|
| `grade_promotion_completed` | 학년 전환 완료 | `student_count`, `success_rate` |
| `data_validation_error` | 데이터 불일치 감지 | `error_type`, `count` |

---

## 환경 변수

### 추가 필요

```env
# GA4 설정
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=xxxxxxxxxxxxx
```

---

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 컨테이너 재시작 후에도 로그 파일이 유지된다
2. **TC-2**: 회원가입 완료 시 GA4에 `sign_up` 이벤트가 전송된다
3. **TC-3**: 로그인 성공 시 GA4에 `login` 이벤트가 전송된다
4. **TC-4**: 첫 학생 등록 시 GA4에 `first_student_registered` 이벤트가 전송된다
5. **TC-5**: 첫 출석 기록 시 GA4에 `first_attendance_recorded` 이벤트가 전송된다

### 예외 케이스

1. **TC-E1**: GA4 연결 실패 시에도 앱이 정상 동작한다 (에러 로깅만)
2. **TC-E2**: 로그 디렉토리 권한 문제 시 적절한 에러 메시지 출력

---

## 롤아웃 계획

### Phase 1: 로깅 영속화

1. docker-compose.yml 볼륨 설정 추가
2. 배포 후 로그 파일 생성 확인
3. 컨테이너 재시작 후 로그 유지 확인

### Phase 2: GA4 클라이언트 연동

1. GA4 속성 생성 (Google Analytics 콘솔)
2. gtag.js 설치 및 기본 이벤트 확인
3. 커스텀 이벤트 구현 및 GA4 DebugView로 검증

### Phase 3: 서버 → GA4 연동 (선택)

1. Measurement Protocol API 키 발급
2. 서버 사이드 이벤트 구현
3. GA4 Realtime 리포트로 검증

---

**작성일**: 2026-01-28
**작성자**: PM 에이전트
**상태**: Approved (구현 완료)
**구현 완료일**: 2026-01-28
