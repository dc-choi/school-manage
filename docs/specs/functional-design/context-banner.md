# 기능 설계: 컨텍스트 배너

> 퍼널 병목 구간(학생→출석 전환 73%)에 주일 맥락 배너를 노출하여 첫 출석을 유도한다.
> 프론트엔드 전용 변경. 백엔드 API 변경 없음.

## 연결 문서

- PRD: `docs/specs/prd/context-banner.md`
- 온보딩 체크리스트: `DashboardPage.tsx` (기존)
- 브레인스토밍: `docs/brainstorm/2026-03-16/acquisition-retention.md` (아이디어 2)

## 흐름/상태

### 사용자 플로우

1. 사용자가 대시보드(`/`)에 진입한다
2. `useOnboardingStatus`에서 `hasGroups`, `hasStudents`, `hasAttendance` 판단
3. 조건별 분기:
   - `!hasGroups` 또는 `!hasStudents` → 기존 OnboardingChecklist (1~2단계)
   - `hasGroups && hasStudents && !hasAttendance` → **DashboardContent + 컨텍스트 배너**
   - 모두 true → DashboardContent (배너 없음)
4. 배너 CTA 클릭 → `/attendance` 이동
5. 출석 기록 완료 → 대시보드 재진입 시 배너 미표시

### 상태 전이

```
[온보딩 1~2단계] --그룹+학생 완료--> [컨텍스트 배너 표시]
[컨텍스트 배너 표시] --첫 출석 완료--> [일반 대시보드]
```

### 기존 온보딩 체크리스트 변경

| 변경 전 | 변경 후 |
|---------|---------|
| step 3(출석 체크)에서 체크리스트 전체 화면 | step 3 → DashboardContent + 컨텍스트 배너 |
| 체크리스트가 대시보드 전체를 대체 | 배너는 대시보드 내부에 배치 (통계 등 함께 표시) |

**변경 이유**: 학생까지 등록한 사용자에게 빈 대시보드 대신 실제 통계(빈 상태라도)를 보여주면서 출석 유도가 더 자연스럽다.

## UI/UX

### 배너 배치 (대시보드 내)

```
┌──────────────────────────────────────────┐
│ 합류 요청 (admin만)                        │
├──────────────────────────────────────────┤
│ ★ 컨텍스트 배너 (hasStudents && !hasAttendance) │
├──────────────────────────────────────────┤
│ [연도] [월] [주차] [전례카드] [축일카드]         │
├──────────────────────────────────────────┤
│ GroupStatisticsTable                      │
├──────────────────────────────────────────┤
│ [GenderChart] [TopRankingCard]            │
└──────────────────────────────────────────┘
```

### 배너 UI 사양

| 요소 | 사양 |
|------|------|
| 컨테이너 | Card, `border-primary` 강조 |
| 레이아웃 | flex, 아이콘 + 텍스트 + CTA 버튼 |
| 아이콘 | `CalendarCheck` (lucide-react), `h-5 w-5 text-primary` |
| 메시지 | "이번 주 일요일(**{M}월 {D}일**)에 첫 출석을 기록해보세요" |
| CTA 버튼 | "출석부 열기", primary variant, `/attendance` 이동 |
| 반응형 | 모바일: 세로 스택 (텍스트 → 버튼), md+: 가로 배치 |

### 다가오는 주일 날짜 산출

- `getNowKST()`로 현재 KST 시각 취득
- 오늘이 일요일이면 오늘 날짜, 아니면 다음 일요일 날짜
- `addDays(now, (7 - now.getDay()) % 7 || 7)` — 단, 일요일이면 `% 7`이 0이므로 오늘 반환
- 표시: `{month}월 {date}일` (예: "3월 22일")

### 권한별 차이

- 없음. ADMIN/TEACHER 모두 동일하게 배너 노출

## 데이터/도메인 변경

- **변경 없음**. 기존 `useOnboardingStatus` 훅의 `hasStudents`, `hasAttendance` 값 사용

## API/인터페이스

- **변경 없음**. 기존 API(`group.list`, `student.list`, `attendance.hasAttendance`)만 사용

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 출석 기록 후 전부 삭제 | `hasAttendance === false` → 배너 재표시 (유용한 동작) |
| 학생 전부 삭제 | `hasStudents === false` → 체크리스트 2단계로 복귀 |
| API 에러 | `useOnboardingStatus.isError` → DashboardContent (배너 미표시) |
| 오늘이 일요일 | "이번 주 일요일(오늘, {M}월 {D}일)" 형태로 표시 |

## 측정/모니터링

### GA4 이벤트

| 이벤트명 | 트리거 | 파라미터 |
|---------|--------|---------|
| `context_banner_shown` | 배너 컴포넌트 마운트 시 (useEffect, 1회) | `next_sunday: "YYYY-MM-DD"` |
| `context_banner_clicked` | CTA 클릭 시 | 없음 |

**기존 이벤트 재활용**: 첫 출석 완료 시 `first_attendance_recorded`가 이미 발송됨 → 배너 전환 측정에 활용

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 학생 1명+, 출석 0건 → 대시보드에 배너 표시 + 통계 영역 함께 표시
2. **TC-2**: 배너 CTA 클릭 → `/attendance`로 이동 + GA4 `context_banner_clicked` 발송
3. **TC-3**: 출석 기록 후 대시보드 재진입 → 배너 미표시
4. **TC-4**: 그룹 0개 → 체크리스트 표시 (배너 아님)
5. **TC-5**: 학생 0명 → 체크리스트 표시 (배너 아님)
6. **TC-6**: 오늘이 일요일 → 배너 문구에 "오늘" 포함

### 예외 케이스

1. **TC-E1**: API 에러 → DashboardContent 표시 (배너 미표시)
2. **TC-E2**: 모바일(360px) → 배너 세로 스택, 텍스트 잘림 없음
3. **TC-E3**: 출석 기록 전부 삭제 → 배너 재표시

---

**작성일**: 2026-03-17
**작성자**: SDD 작성자
**상태**: Approved (구현 완료)
