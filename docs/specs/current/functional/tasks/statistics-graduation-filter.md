# Task: 통계 졸업생 필터링

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.
> 기능 설계의 요구사항을 **역할별 구현 가능한 단위로 분할**합니다.

## 상위 문서

- PRD: `docs/specs/prd/statistics-graduation-filter.md`
- 기능 설계: `docs/specs/functional-design/statistics.md` (통계 졸업생 필터링 섹션)

## 목표

모든 통계 UseCase에서 졸업 연도 기준 필터를 적용하여, 조회 연도 이전에 졸업한 학생이 통계에서 제외된다.

## 범위

### 포함
- [x] Prisma ORM 기반 UseCase 4개에 graduatedAt 필터 적용
- [x] Raw SQL 기반 UseCase 2개에 graduated_at 필터 적용
- [x] 통합 테스트 추가

### 제외
- [ ] 프론트엔드 변경
- [ ] 스냅샷 로직 변경
- [ ] DB 스키마 변경

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | Prisma 기반 통계 졸업 필터 | GetAttendanceRate, GetByGender, GetGroupStatistics, GetTopGroups UseCase의 Student 조회에 `OR: [{ graduatedAt: null }, { graduatedAt: { gte: 해당연도 1/1 } }]` 조건 추가 | 없음 |
| B2 | Raw SQL 기반 통계 졸업 필터 | GetExcellentStudents, GetTopOverall UseCase의 SQL WHERE 절에 `(s.graduated_at IS NULL OR YEAR(s.graduated_at) >= 조회연도)` 조건 추가 | 없음 |
| B3 | 통합 테스트 | 졸업 학생이 해당 연도 통계에 포함/제외되는지 검증하는 테스트 케이스 추가 | B1, B2 완료 후 |

**Development**: `docs/specs/target/functional/development/statistics-graduation-filter-backend.md`

---

## 업무 의존성 다이어그램

```
[B1] ──┐
       ├──▶ [B3]
[B2] ──┘
```

> B1, B2는 독립적으로 병렬 진행 가능. B3(테스트)는 B1, B2 완료 후 진행.

---

## 검증 체크리스트

### 기능 검증
- [ ] 6개 UseCase 모두 졸업 필터가 적용되었는가?
- [ ] 졸업 연도 = 조회 연도인 학생이 통계에 포함되는가?
- [ ] 조회 연도 이전에 졸업한 학생이 통계에서 제외되는가?
- [ ] 기존 기능(스냅샷, 출석률 계산)에 영향이 없는가?

### 요구사항 추적
- [ ] PRD Must 7건이 모두 B1, B2에 반영되었는가?
- [ ] 기능 설계의 필터 조건이 코드에 정확히 반영되었는가?

---

**작성일**: 2026-02-24
**상태**: Draft
