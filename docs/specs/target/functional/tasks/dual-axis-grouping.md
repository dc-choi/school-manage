# Task: 학년/부서 두 축 그룹핑

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.
> 기능 설계의 요구사항을 **역할별 구현 가능한 단위로 분할**합니다.

## 상위 문서

- PRD: `docs/specs/prd/dual-axis-grouping.md`
- 기능 설계: `docs/specs/functional-design/dual-axis-grouping.md`
- 기능 설계 (플로우/API): `docs/specs/functional-design/dual-axis-grouping-flows.md`

## 목표

Group에 타입(GRADE/DEPARTMENT) 도입, Student.groupId 레거시 제거, StudentGroup N:M 완전 활용.
그룹 상세에서 학생 추가/제거/자동 이동 지원.

## 범위

### 포함
- [x] Group.type 추가 + 마이그레이션
- [x] Student.groupId 제거 + StudentGroup 전환
- [x] 그룹/학생/출석/통계 전 도메인 API 수정
- [x] 그룹 상세 학생 관리 (추가/제거/GRADE 자동 이동)
- [x] 프론트엔드 전 화면 수정

### 제외
- [ ] Group.accountId 제거 (조직 미매칭 계정 존재)
- [ ] 부서별 역할/직책, 활동 관리

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | DB 마이그레이션 + 스키마 | Prisma: Group.type ADD, Student.groupId DELETE. tRPC: GroupOutput/CreateGroupInput/ListGroupsInput type 추가 | 없음 |
| B2 | Group 도메인 수정 | create(type), update(type 변경), list(type 필터), get(StudentGroup), delete/bulkDelete(GRADE 학생 검증), attendance(StudentGroup) | B1 |
| B3 | Group 학생 관리 API | addStudent(GRADE 자동 이동), removeStudent(StudentGroup 삭제) | B2 |
| B4 | Student 도메인 수정 | create/update(GRADE 0~1 검증), list(organizationId+groupId 필터), get(groups with type), graduate/cancelGraduation/promote(StudentGroup), bulkCreate(GRADE 검증), feastDayList(organizationId) | B1 |
| B5 | Attendance + Statistics + Snapshot | attendance(groupId from FE, StudentGroup 조회), statistics(StudentGroup 기반, type 필터), snapshot(GRADE 그룹 조회) | B1 |

**Development**: `docs/specs/target/functional/development/dual-axis-grouping-backend.md`

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | Group UI | 목록: type 컬럼(배지)+필터. 생성: type 라디오. 수정: type 변경. 상세: 학생 추가/제거 UI | B2, B3 |
| F2 | Student UI | 폼: 학년 라디오(0~1)+부서 체크박스(0~N). 목록: 그룹 필터 드롭다운(타입별 구분선) | B4 |
| F3 | Attendance + Statistics UI | 출석: 탭→통합 드롭다운(학년+부서). 통계: 그룹별 GRADE/DEPARTMENT 구분 표시 | B5 |

**Development**: `docs/specs/target/functional/development/dual-axis-grouping-frontend.md`

---

## 업무 의존성 다이어그램

```
[B1] ──┬──▶ [B2] ──▶ [B3] ──▶ [F1]
       │
       ├──▶ [B4] ──────────────▶ [F2]
       │
       └──▶ [B5] ──────────────▶ [F3]
```

---

## 검증 체크리스트

### 기능 검증
- [x] 모든 역할의 업무가 완료되었는가?
- [x] 역할 간 의존성이 충족되었는가?
- [x] 기존 기능에 영향이 없는가?

### 요구사항 추적
- [x] PRD Must Have 11개 → B1~B5 + F1~F3 모두 반영
- [x] 기능 설계 데이터 모델/마이그레이션 → B1
- [x] 기능 설계 API 28개 프로시저 → B2~B5
- [x] 기능 설계 UI/UX 6개 화면 → F1~F3

---

**작성일**: 2026-03-13
**상태**: Draft
