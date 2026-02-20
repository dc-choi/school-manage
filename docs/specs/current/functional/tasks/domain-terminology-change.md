# Task: 도메인 용어 변경

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.

## 상위 문서

- 기능 설계: `docs/specs/functional-design/domain-terminology-change.md`

## 목표

UI 라벨을 "그룹→학년", "멤버→학생"으로 변경하여 주일학교 교리교사의 도메인 이해도를 높인다.

## 범위

### 포함
- [x] 네비게이션 라벨 변경 (Header, Sidebar)
- [x] 그룹 관련 페이지 라벨 변경 (목록, 추가, 상세, 폼)
- [x] 학생 관련 페이지 라벨 변경 (목록, 추가, 상세, 폼, 삭제/복구/졸업 모달)
- [x] 대시보드 온보딩/통계 라벨 변경
- [x] 출석 관련 페이지 라벨 변경
- [x] 랜딩 페이지 라벨 변경
- [x] 설정 페이지 라벨 변경
- [x] 기존 기능 설계 문서 용어 동기화

### 제외
- [ ] DB 스키마 변경
- [ ] API 프로시저명 변경
- [ ] URL 경로 변경
- [ ] GA4 이벤트명 변경
- [ ] 코드 변수명 변경

---

## 역할별 업무 분할

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | 네비게이션 라벨 변경 | Header, Sidebar의 "그룹 관리"→"학년 관리", "멤버 관리"→"학생 관리" | 없음 |
| F2 | 레이아웃 라벨 변경 | AuthLayout의 "멤버 현황"→"학생 현황" | 없음 |
| F3 | 그룹→학년 페이지 라벨 변경 | GroupListPage, GroupAddPage, GroupDetailPage, GroupForm의 모든 "그룹"→"학년" | 없음 |
| F4 | 멤버→학생 페이지 라벨 변경 | StudentListPage, StudentAddPage, StudentDetailPage, StudentForm의 모든 "멤버"→"학생" | 없음 |
| F5 | 학생 모달 라벨 변경 | DeletedStudentsModal, GraduatedStudentsModal의 "멤버"→"학생" | 없음 |
| F6 | 대시보드 라벨 변경 | DashboardPage 온보딩 단계("그룹→학년", "멤버→학생"), GroupStatisticsTable("그룹별→학년별") | 없음 |
| F7 | 출석 페이지 라벨 변경 | AttendancePage, CalendarPage, AttendanceModal의 "그룹"→"학년", "멤버"→"학생" | 없음 |
| F8 | 랜딩 페이지 라벨 변경 | LandingPage FAQ/기능 소개, InteractiveDemo의 "그룹"→"학년", "멤버"→"학생" | 없음 |
| F9 | 설정 페이지 라벨 변경 | AccountDeleteSection의 "그룹"→"학년", "멤버"→"학생" | 없음 |
| F10 | 기능 설계 문서 용어 동기화 | 기존 7개 기능 설계 문서의 UI 라벨을 학년/학생으로 갱신 | F1~F9 완료 후 |

**Development**: `docs/specs/target/functional/development/domain-terminology-change-frontend.md`

---

## 업무 의존성 다이어그램

```
[F1] [F2] [F3] [F4] [F5] [F6] [F7] [F8] [F9]   ← 모두 독립 (병렬 가능)
  │    │    │    │    │    │    │    │    │
  └────┴────┴────┴────┴────┴────┴────┴────┘
                        │
                       [F10]  ← 문서 동기화 (구현 완료 후)
```

---

## 검증 체크리스트

### 기능 검증
- [ ] 모든 역할의 업무가 완료되었는가?
- [ ] 기존 기능에 영향이 없는가? (동작 변경 없이 라벨만 변경)
- [ ] URL 경로, API, DB에 변경이 없는가?

### 요구사항 추적
- [ ] 기능 설계의 용어 매핑 테이블이 모든 업무에 반영되었는가?
- [ ] 기능 설계의 변경 대상 화면 20개가 업무에 포함되었는가?
- [ ] 테스트 시나리오 (정상 7건 + 예외 3건)가 검증 가능한가?

---

**작성일**: 2026-02-20
**상태**: Approved (구현 완료)
