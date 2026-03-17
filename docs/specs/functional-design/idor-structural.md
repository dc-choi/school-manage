# 기능 설계: IDOR 구조적 해소

> 계정 소유권 검증을 구조적으로 보장하는 비기능 개선입니다.
> 현재 모든 엔드포인트가 개별 검증 중이나, 패턴 비일관 + 회귀 테스트 부재.

## 연결 문서

- 관련: `docs/specs/README.md` TARGET > SECURITY
- 핫픽스: `bulk-create-students.usecase.ts` (commit cbcd1ca)

## 현황 분석

### 검증 패턴 (47개 UseCase)

| 패턴 | 설명 | 사용 비율 | UseCase 예시 |
|------|------|---------|-------------|
| A: Where절 스코핑 | DB 쿼리 where에 organizationId 포함 | ~70% | list-groups, list-students, update-attendance |
| B: Traversal | 리소스 조회 후 관계로 organizationId 확인 | ~6% | get-student, delete-student, update-student |
| C: Set 검증 | 유효 ID 목록 사전 조회 후 대조 | ~8% | bulk-add-students-to-group, add-student-to-group |
| D: 미검증 | public/protected (적절) | ~16% | login, signup, get-holydays |

### 문제

1. **패턴 비일관**: 동일 도메인(Student)에서 A, B, C 혼재
2. **코드 중복**: 소유권 검증 로직이 UseCase마다 반복
3. **회귀 방지 수단 없음**: 새 엔드포인트 추가 시 검증 누락 감지 불가

## 설계

### 1. 공통 소유권 검증 유틸리티

도메인별 리소스 소유권 검증을 표준화하는 유틸리티 함수를 제공한다.

#### 함수 시그니처

| 함수 | 용도 | 검증 방식 |
|------|------|---------|
| `assertGroupOwnership(groupId, organizationId)` | 그룹 소유권 | Where절 (패턴 A) |
| `assertStudentOwnership(studentId, organizationId)` | 학생 소유권 | Where절 (패턴 A) |
| `assertGroupIdsOwnership(groupIds, organizationId)` | 복수 그룹 소유권 | Set 검증 (패턴 C) |
| `assertStudentIdsOwnership(studentIds, organizationId)` | 복수 학생 소유권 | Set 검증 (패턴 C) |

#### 동작

1. DB에서 리소스 조회 (organizationId 조건 포함)
2. 조회 실패 시 `TRPCError(FORBIDDEN)` throw
3. 성공 시 조회된 리소스 반환 (후속 처리에 활용 가능)

#### 위치

`apps/api/src/global/utils/ownership.ts`

### 2. IDOR 회귀 테스트

모든 scopedProcedure 엔드포인트에 대해 타 조직 리소스 접근 차단을 검증한다.

#### 테스트 구조

| 카테고리 | 검증 내용 |
|---------|---------|
| 그룹 CRUD | 타 조직 그룹 생성/조회/수정/삭제 차단 |
| 학생 CRUD | 타 조직 학생 생성/조회/수정/삭제 차단 |
| 학생-그룹 | 타 조직 그룹에 학생 추가/제거 차단 |
| 출석 | 타 조직 학생 출석 기록/조회 차단 |
| 통계 | 타 조직 통계 조회 차단 |

#### 테스트 시나리오

- **Setup**: 조직 A (그룹+학생+출석), 조직 B (별도 계정)
- **Assert**: 조직 B 계정으로 조직 A 리소스 접근 시 FORBIDDEN

### 3. 기존 UseCase 리팩토링

공통 유틸리티 적용으로 패턴 통일한다.

| 대상 UseCase | 현재 패턴 | 변경 |
|-------------|---------|------|
| get-student | B (Traversal) | `assertStudentOwnership` 호출 |
| delete-student | B (Traversal) | `assertStudentOwnership` 호출 |
| update-student | B (Traversal) | `assertStudentOwnership` 호출 |
| add-student-to-group | C (수동 Set) | `assertGroupOwnership` + `assertStudentOwnership` 호출 |
| bulk-add-students-to-group | C (수동 Set) | `assertGroupOwnership` + `assertStudentIdsOwnership` 호출 |
| remove-student-from-group | C (수동 Set) | `assertGroupOwnership` + `assertStudentOwnership` 호출 |
| bulk-remove-students-from-group | C (수동 Set) | `assertGroupOwnership` + `assertStudentIdsOwnership` 호출 |
| bulk-create-students | C (수동 Set) | `assertGroupIdsOwnership` 호출 |
| create-student | A (수동 Where) | `assertGroupIdsOwnership` 호출 |

> 패턴 A (Where절 직접 포함)를 사용하는 UseCase는 이미 최적이므로 변경하지 않는다.

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 리소스가 존재하지 않는 경우 | NOT_FOUND (소유권 검증 전에 존재 여부 확인) |
| 소프트 삭제된 리소스 | deletedAt 조건 포함하여 삭제된 리소스 접근 차단 |
| bulk 작업에서 일부만 타 조직 | 전체 FORBIDDEN (부분 성공 없음) |

## 측정/모니터링

- **이벤트**: FORBIDDEN 에러 발생 시 로깅 (기존 에러 로깅 활용)
- **회귀 테스트**: CI에서 자동 실행

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 소유 조직의 그룹/학생/출석 CRUD 정상 동작
2. **TC-2**: 공통 유틸리티로 리팩토링된 UseCase의 기존 동작 유지

### 예외 케이스

1. **TC-E1**: 타 조직 그룹 ID로 학생 생성 시 FORBIDDEN
2. **TC-E2**: 타 조직 학생 ID로 출석 기록 시 FORBIDDEN
3. **TC-E3**: 타 조직 그룹 ID로 학생 추가 시 FORBIDDEN
4. **TC-E4**: bulk 작업에서 일부 ID가 타 조직인 경우 전체 FORBIDDEN

---

**작성일**: 2026-03-17
**작성자**: SDD 작성자
**상태**: Draft
