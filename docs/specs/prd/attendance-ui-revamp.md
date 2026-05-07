# PRD: 출석부 UI 개편

> 상태: Approved (구현 완료) | 작성일: 2026-05-07 | 수정: 2026-05-07 (구현 결과 기록 — 자동 저장 직렬화/latency 계측은 도입하지 않고, 모달 정렬 + 서버 분기 정합화 + 멱등성 + a11y 보강으로 좁힘)

## 배경/문제 요약

- 참고: `docs/business/0_feedback/feedback-categories.md` 출석 섹션, `docs/specs/functional-design/attendance-management.md`
- 문제:
    - 다수 파일럿(장위동·흑석동·길음동·성북동)에서 출석 입력 동선/정보 위계에 누적 피드백 발생
    - 정렬 옵션 부재로 학생 30+ 단체에서 특정 학생 탐색에 시간 소요
    - 서버 `attendance.update`의 `isFull` 분기와 클라이언트 호출이 모순(잠복 버그) — AttendancePage 자동 저장이 사실상 동작 안 함
- 현재 상태: 모바일 메인 동선이 달력→모달. 테이블 뷰는 사이드바/탭바 진입 경로 없는 데드 화면.
- 목표 상태: (1) 모달 정렬로 학생 탐색 시간 단축, (2) 서버 분기 정합화로 잠복 버그 구조적 해소, (3) a11y 보강.

## 목표/성공 기준

- **목표**: 모달 학생 목록 정렬 + 서버 동작 정합화 + a11y
- **성공 지표**:
    - 정렬 사용율: 모달 진입 세션 중 정렬 클릭 발생 비율
    - 정성 피드백: MAO 상위 5곳 응답 (긍정/부정/혼합)
- **측정 기간**: 출시 후 4주

## 사용자/대상

- **주요 사용자**: 교리교사 (출석 입력 담당)
- **사용 맥락**: 매주 토/일 미사·교리 직후 모바일에서 입력. 학생 30+ 단체에서 특정 학생 탐색 빈도 높음.

## 범위

### 포함

- **정렬 옵션 2종** (출석 모달 학생 목록 헤더): 등록 순(기본) / 가나다. sessionStorage 보존
- **서버 분기 정합화**: `attendance.update` 입력 스키마에서 `isFull` 제거 + content 기반 자동 분기 (◎/○/△ UPSERT, `-`/`''` DELETE)
- **AttendancePage(테이블 뷰) 제거**: 모바일 메인 동선이 달력→모달이라 데드 화면. `/attendance/table` 라우트와 함께 삭제
- **a11y 보강**: 모달 Checkbox/Label 연결, aria-label, aria-live, 색 대비
- **결석 정의 통합**: `-`도 row 부재 — UPSERT 대상 아님 (DELETE 분기)
- **잠금 순서 정합**: studentId 정렬로 동시 트랜잭션 데드락 회피

### 제외 (Out)

- 학생 셀프 체크 (하드웨어 의존 — 별도 SDD)
- 행사 출석 구분 (피드백 누적 시 별도 SDD)
- 자동 저장 직렬화 / localStorage 큐 / 이탈 트리거 — 최초 PRD에 포함됐으나 모달 입력은 단일 셀 burst가 적어 가치 약하고 AttendancePage 제거로 사용처 0이 되어 도입 보류
- 자동 저장 latency 계측 GA4 — 위와 동일 사유
- 모바일 톤/폰트 (#295 처리 완료)
- 데일리 통계 대시보드 (#298 별도 완료)

## 사용자 시나리오

1. **시나리오 1**: 토요일 미사 후 달력 → 셀 클릭 → 모달 → 가나다 정렬 → "김민준" 즉시 탐색 → 미사 체크 → 자동 저장 표시 → 다음 학생
2. **시나리오 2**: 미사+교리 둘 다 해제 → `-` 직렬화 → 서버 자동 DELETE → row 부재
3. **시나리오 3**: 동일 셀 빠른 재변경 → 마지막 값으로 수렴 (서버 atomic upsert)

## 요구사항

### 필수 (Must)

- [x] 모달 정렬 토글 2종 + sessionStorage 보존
- [x] `isFull` 제거 + content 기반 자동 분기
- [x] AttendancePage / `/attendance/table` 라우트 제거
- [x] 모달 a11y 보강 (Label/aria/aria-live)
- [x] 통합 테스트 isFull 인자 제거 + TC-A-N1 의미 전환 + TC-A-N2 멱등 케이스 추가
- [x] 도메인 FD `attendance-management.md` 정합화

### 선택 (Should)

- [x] 정렬 상태 세션 유지
- [x] 저장 직후 2초 강조 인디케이터 (모달)

## 제약/가정/리스크/의존성

- **제약**: `(student_id, date)` UNIQUE + atomic upsert 동작 유지
- **가정**: 모바일 사용자 메인 동선이 달력 → 모달
- **리스크**:
    - 테이블 뷰 직접 URL 사용자(소수)는 화면이 사라짐 — 영향 미미로 판단
    - 정렬 변경 시 학생 순서 바뀌어 사용자 혼란 — 정렬 기본값 등록 순 유지
- **내부 의존성**: `attendance.update`, `attendance.dayDetail`, `useCalendar`
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: 메인 머지 → 전체 노출
- **이벤트**: `attendance_sort_clicked` (sort_type: 'registration' | 'name')
- **검증**: GA4 + MAO 상위 5곳 정성 피드백

## 후속 과제 (별도 SDD)

- BUGFIX: 출석 모달 직렬화 토큰 통일 (`-` 폐지) — README TARGET 등록됨
- DX: 출석 화면 e2e 회귀 테스트 — Playwright 도입 트리거 대기

## 연결 문서

- 사업 문서: `docs/business/0_feedback/feedback-categories.md`, `docs/business/STATUS.md`
- 출석 도메인 FD (SSoT): `docs/specs/functional-design/attendance-management.md`
