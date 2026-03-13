# 기능 설계: 학년/부서 두 축 그룹핑 — 플로우/API

> 사용자 플로우, UI/UX 변경, API 인터페이스를 정의합니다.

## 연결 문서

- 데이터 모델: `dual-axis-grouping.md`

## 흐름/상태

```
[그룹 목록] → (그룹 추가, 타입 선택) → [생성 완료] → [그룹 목록]
[학생 추가/수정] → (학년 0~1개 선택 + 부서 다중 선택) → [저장] → [학생 목록]
[출석 현황] → (통합 드롭다운: 학년/부서) → [해당 그룹 학생 출석 기록]
[통계] → (그룹별 통계: 학년/부서 필터) → [그룹별 출석률]
[그룹 상세] → (학생 추가) → [학생 검색] → [추가 완료] → [그룹 상세]
[그룹 상세] → (학생 제거) → [제거 확인] → [그룹 상세]
```

## UI/UX

### 그룹 목록

| 요소 | 변경 |
|------|------|
| 테이블 | "유형" 컬럼 추가 (학년/부서 배지) |
| 필터 | 전체 / 학년만 / 부서만 |
| 추가 버튼 | 타입 선택 추가 (라디오: 학년/부서) |

### 학생 폼 (생성/수정)

| 요소 | 변경 |
|------|------|
| 학년 섹션 | 라디오 버튼 → 0~1개 선택 (선택 해제 가능) |
| 부서 섹션 | 체크박스 → 0~N개 선택. 부서 그룹 없으면 빈 상태 표시 |
| 검증 | 학년 미선택 허용 (GRADE 2개 이상만 차단) |

### 출석 현황

| 요소 | 변경 |
|------|------|
| 그룹 선택 | 탭 → **통합 드롭다운** (학년 + 부서 모두 표시, 타입별 구분선) |
| 출석 기록 | 현재 선택된 그룹의 groupId를 API에 전달 |

### 학생 목록

| 요소 | 변경 |
|------|------|
| 그룹 필터 | 드롭다운: 전체 / (학년 그룹들) / (부서 그룹들) — 타입별 구분선 |

### 그룹 상세

| 요소 | 변경 |
|------|------|
| 학생 목록 | 기존 유지 (소속 학생 표시) |
| 학생 추가 | 미소속 학생 검색 → 추가 버튼. GRADE 그룹: 기존 GRADE 있으면 자동 이동 |
| 학생 제거 | 학생별 제거 버튼 (StudentGroup 삭제) |

### 통계

| 요소 | 변경 |
|------|------|
| 그룹 통계 | 학년/부서 구분 표시 |

## API 변경

### Group

| 프로시저 | 변경 | 입출력 변경 |
|---------|------|----------|
| group.list | 수정 | 입력: type 필터 추가. 출력: type 필드 추가 |
| group.create | 수정 | 입력: type 필드 추가 (기본 GRADE) |
| group.get | 수정 | 출력: type 필드 추가. 학생 조회 StudentGroup 기반 |
| group.update | 수정 | type 변경 허용. GRADE→DEPARTMENT 시 소속 학생 GRADE 검증 |
| group.addStudent | 신규 | 학생을 그룹에 추가. GRADE 그룹이면 기존 GRADE 자동 제거 |
| group.removeStudent | 신규 | 학생을 그룹에서 제거 (StudentGroup 삭제) |
| group.delete | 수정 | GRADE 삭제 시 소속 학생 검증 |
| group.bulkDelete | 수정 | GRADE 삭제 시 소속 학생 검증 |
| group.attendance | 수정 | StudentGroup 기반 학생 조회 |

### Student

| 프로시저 | 변경 | 입출력 변경 |
|---------|------|----------|
| student.create | 수정 | GRADE 0~1개 검증 (2개↑ → 400). groupId 미사용 |
| student.update | 수정 | 동일 검증 |
| student.list | 수정 | organizationId 직접 필터. groupId/groupType 필터 추가 |
| student.get | 수정 | StudentGroup 기반 그룹 목록 반환 (type 포함) |
| student.graduate | 수정 | StudentGroup → GRADE 그룹 조회 |
| student.cancelGraduation | 수정 | 동일 |
| student.bulkCreate | 수정 | GRADE 0~1개 검증. 매칭 실패 시 알림 후 진행 |
| student.feastDayList | 수정 | organizationId 기반 조회 |
| student.bulkRegister | 유지 | 영향 없음 |
| student.promote | 수정 | StudentGroup 기반 그룹 조회 |

### Attendance

| 프로시저 | 변경 | 입출력 변경 |
|---------|------|----------|
| attendance.update | 수정 | 프론트엔드에서 groupId 전달, Student.groupId 미사용 |
| attendance.calendar | 수정 | StudentGroup 기반 학생 조회 |
| attendance.dayDetail | 수정 | StudentGroup 기반 학생 조회 |

### Statistics

| 프로시저 | 변경 | 입출력 변경 |
|---------|------|----------|
| statistics.groupStatistics | 수정 | StudentGroup 기반 학생 그룹핑, type 필터 |
| statistics.topGroups | 수정 | StudentGroup 기반 |
| statistics.excellent | 수정 | organizationId 기반 조회 |
| statistics.weekly/monthly/yearly | 수정 | organizationId 기반 조회 |
| statistics.byGender | 수정 | organizationId 기반 조회 |

### tRPC 스키마 변경

| 스키마 | 변경 |
|--------|------|
| GroupOutput | type 필드 추가 |
| CreateGroupInput | type 필드 추가 |
| ListGroupsInput | type 필터 추가 |
| StudentGroupItem | type 필드 추가 |
| StudentBase | groups에 type 포함 |

## 권한/보안

- 모든 API: scopedProcedure (organization 스코프) — 변경 없음
- 그룹 타입 변경 시 소속 학생 GRADE 제약 검증

## 성능/제약

- StudentGroup JOIN 추가: 학생 수 최대 ~130명 수준 — 성능 영향 미미
- 인덱스: StudentGroup (studentId, groupId) 이미 존재

## 측정/모니터링

- GA4 group_create 이벤트에 group_type 파라미터 추가
- GA4 attendance_update 이벤트에 group_type 파라미터 추가

---

**작성일**: 2026-03-13
**작성자**: SDD 작성자
**상태**: Draft
