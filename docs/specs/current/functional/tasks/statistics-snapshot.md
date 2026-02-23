# Task: 통계 스냅샷

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.
> 기능 설계의 요구사항을 **역할별 구현 가능한 단위로 분할**합니다.

## 상위 문서

- PRD: `docs/specs/prd/statistics-snapshot.md`
- 기능 설계: `docs/specs/functional-design/statistics.md` (통계 스냅샷 섹션)

## 목표

엔티티 변경 이력(스냅샷) 기반으로 과거 연도 통계를 해당 시점 기준으로 정확하게 조회할 수 있는 시스템 구축.

## 범위

### 포함
- [x] StudentSnapshot / GroupSnapshot 테이블 생성
- [x] Student/Group 변경 시 자동 스냅샷 생성
- [x] Attendance.groupId 추가 + 출석 기록 시 자동 저장
- [x] 모든 통계 UseCase 스냅샷 기반 전환
- [x] 기존 데이터 마이그레이션
- [x] 테스트

### 제외
- [ ] 프론트엔드 UI 변경 (기존 연도 선택 UI 유지, API 응답 구조 동일)
- [ ] 다중 연도 비교 통계

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | DB 스키마 변경 + 마이그레이션 | StudentSnapshot, GroupSnapshot 테이블 생성 + Attendance에 groupId 컬럼 추가 + 기존 데이터 초기 스냅샷/역보정 (DDL+DML 단일 SQL) | 없음 |
| B2 | 스냅샷 헬퍼 함수 구현 | 스냅샷 생성/조회 헬퍼 함수 (createStudentSnapshot, createGroupSnapshot, getBulkStudentSnapshots 등). 각 UseCase 내부에서 호출 | B1 완료 후 |
| B3 | Student UseCase에 스냅샷 연동 | create, update, graduate, cancelGraduation 시 StudentSnapshot 생성 호출 (promote는 제외) | B2 완료 후 |
| B4 | Group UseCase에 스냅샷 연동 | create, update 시 GroupSnapshot 생성 호출 | B2 완료 후 |
| B5 | Attendance UseCase에 groupId 저장 | 출석 생성 시 해당 학생의 현재 groupId를 attendance.groupId에 저장 | B1 완료 후 |
| B6 | 통계 UseCase 스냅샷 기반 전환 | 모든 통계 UseCase(6개)를 스냅샷 데이터 기반으로 변경: graduatedAt 필터 제거, attendance.groupId 기준 그룹핑, StudentSnapshot/GroupSnapshot 조회 | B2 완료 후 |
| B7 | 테스트 | 스냅샷 생성, 스냅샷 조회, 통계 정확도 통합 테스트 | B3~B6 완료 후 |

**Development**: `docs/specs/target/functional/development/statistics-snapshot-backend.md`

---

## 업무 의존성 다이어그램

```
[B1] ──┬──▶ [B2] ──┬──▶ [B3] ──┐
       │           │           │
       │           ├──▶ [B4] ──┤
       │           │           │
       │           └──▶ [B6] ──┤
       │                       │
       └──▶ [B5] ──────────────┴──▶ [B7]
```

> **Note**: 프론트엔드 업무 없음. API 응답 구조가 동일하므로 기존 UI가 그대로 동작합니다.

---

## 검증 체크리스트

### 기능 검증
- [ ] 모든 역할의 업무가 완료되었는가?
- [ ] 역할 간 의존성이 충족되었는가?
- [ ] 기존 기능에 영향이 없는가? (현재 연도 통계가 기존과 동일하게 동작)

### 요구사항 추적
- [ ] PRD의 Must Have 요구사항이 모두 업무에 반영되었는가?
- [ ] 기능 설계의 데이터 모델(StudentSnapshot, GroupSnapshot, Attendance.groupId)이 B1에 포함되었는가?
- [ ] 기능 설계의 스냅샷 생성 규칙이 B3, B4에 포함되었는가?
- [ ] 기능 설계의 통계 쿼리 변경이 B6에 포함되었는가?
- [ ] 기능 설계의 마이그레이션이 B1에 포함되었는가?

---

**작성일**: 2026-02-24
**상태**: Draft
