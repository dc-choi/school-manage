# 기능 설계: 학년/부서 두 축 그룹핑

> Group에 타입(학년/부서)을 도입하고, 레거시 필드를 정리하여 StudentGroup N:M을 완전 활용합니다.

## 연결 문서

- PRD: `docs/specs/prd/dual-axis-grouping.md`
- 기존: `group-management.md`, `student-management.md`, `attendance-management.md`, `statistics.md`
- 상세 플로우/API: `dual-axis-grouping-flows.md`

## 핵심 개념

| 개념 | 설명 |
|------|------|
| GRADE (학년) | 1학년, 2학년, 3학년 등. 학생당 **0~1개** (필수 아님) |
| DEPARTMENT (부서) | 전례부, 봉사부, 성가대 등. 학생당 **0~N개** 선택 |
| StudentGroup | 기존 N:M 관계 (변경 없음). 타입 구분은 Group.type으로 |

## 데이터 모델 변경

### Group

| 변경 | 필드 | 타입 | 설명 |
|------|------|------|------|
| **ADD** | type | varchar(20) NOT NULL DEFAULT 'GRADE' | GRADE / DEPARTMENT |

### Student

| 변경 | 필드 | 설명 |
|------|------|------|
| **DELETE** | groupId | StudentGroup N:M으로 완전 대체 |

### StudentGroup / Attendance / StudentSnapshot

변경 없음.
- Attendance.groupId: nullable 유지 (기록 시점의 그룹 스냅샷)
- StudentSnapshot.groupId: 스냅샷 시점의 GRADE 그룹 기록

## 마이그레이션

| 순서 | 대상 | 변환 |
|------|------|------|
| 1 | Group.type 추가 | 기존 전체 → 'GRADE' |
| 2 | Student.groupId 검증 | 모든 학생이 StudentGroup 레코드 보유 확인 |
| 3 | Student.groupId 제거 | 컬럼 삭제 |

> 프로덕션 38개 계정 데이터 보존 필수. 마이그레이션 전 검증 쿼리 실행.

## 비즈니스 규칙

### 학생-그룹 소속

- GRADE 그룹 **0~1개** (필수 아님, 학년 없이 등록 가능. 2개 이상 → 400)
- DEPARTMENT 그룹 **0~N개** 선택
- 학생의 "학년 그룹" = StudentGroup JOIN Group WHERE type = 'GRADE' (없으면 null)

### 출석 기록

- 출석 기록 시 **프론트엔드에서 현재 조회 중인 groupId 전달**
- Attendance.groupId에 해당 그룹 ID 저장 (학년/부서 무관)
- 기존 데이터: 이전 primary groupId 그대로 유지 (마이그레이션 불필요)

### 스냅샷

- StudentSnapshot.groupId = 학생의 GRADE 그룹 (StudentGroup에서 조회, 없으면 null)
- 스냅샷 생성 로직: `StudentGroup JOIN Group WHERE type = 'GRADE'` → groupId 취득

### 그룹 삭제 제약

| 상황 | 처리 |
|------|------|
| GRADE 그룹 삭제 + 소속 학생 존재 | 삭제 차단 (400) |
| DEPARTMENT 그룹 삭제 + 소속 학생 존재 | StudentGroup 레코드만 삭제 (학생 유지) |
| 그룹 타입 변경 | 허용 (수정 시 변경 가능). GRADE→DEPARTMENT 변경 시 GRADE 2개 소속 학생 검증 |

### 그룹 상세에서 학생 관리

- 그룹 상세 페이지에서 학생 추가/제거 가능
- **학생 추가**: 그룹에 미소속인 학생 검색 → 추가
- **학생 제거**: 소속 학생 목록에서 제거 (StudentGroup 삭제)
- **GRADE 그룹 추가 시**: 기존 GRADE 소속이 있으면 자동 이동 (기존 GRADE 제거 → 새 GRADE 추가)
  - 예: "중1" 상세에서 학생 추가 → 해당 학생이 "중2" 소속이면 "중2" 제거 후 "중1" 추가

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| GRADE 0개로 학생 생성 | 허용 (학년 없이 등록 가능) |
| GRADE 2개 이상으로 학생 생성 | 400 BAD_REQUEST |
| 부서 그룹 없는 본당 | 부서 섹션 빈 상태로 표시 |
| 엑셀 Import 학년 매칭 실패 | "학년 정보 없이 등록" 알림 → 사용자 확인 후 진행 |
| 기존 출석 데이터 통계 | Attendance.groupId 기준 집계 (하위 호환) |
| 졸업 처리 | StudentGroup에서 GRADE 그룹 조회 후 처리 |
| GRADE→DEPARTMENT 변경 + GRADE 2개 학생 | 400 BAD_REQUEST (해당 학생 GRADE 초과) |
| 그룹 상세에서 GRADE 그룹에 학생 추가 (기존 GRADE 있음) | 기존 GRADE 자동 제거 후 추가 |

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: GRADE + DEPARTMENT 그룹 생성 → 각 type 확인
2. **TC-2**: 학생 생성 (GRADE 1 + DEPARTMENT 2) → StudentGroup 3건
3. **TC-3**: DEPARTMENT 탭에서 출석 기록 → Attendance.groupId = DEPARTMENT 그룹
4. **TC-4**: 학생 목록 부서별 필터 → 해당 부서 소속 학생만
5. **TC-5**: 통계 그룹별 출석률 → GRADE/DEPARTMENT 모두 표시

### 예외 케이스

1. **TC-E1**: GRADE 없이 학생 생성 → 정상 (그룹 미소속 학생)
2. **TC-E2**: GRADE 2개로 학생 생성 → 400
3. **TC-E3**: 소속 학생 있는 GRADE 그룹 삭제 → 400
4. **TC-E4**: 마이그레이션 후 기존 데이터 정상 동작
5. **TC-6**: 그룹 상세에서 학생 추가 → StudentGroup 생성
6. **TC-7**: GRADE 그룹에 기존 GRADE 학생 추가 → 자동 이동 (기존 GRADE 제거)
7. **TC-E5**: GRADE→DEPARTMENT 변경 시 GRADE 2개 학생 존재 → 400

---

**작성일**: 2026-03-13
**작성자**: SDD 작성자
**상태**: Draft
