# Development: 학년/부서 두 축 그룹핑 — Frontend

## 상위 문서

- PRD: `docs/specs/prd/dual-axis-grouping.md`
- 기능 설계: `docs/specs/functional-design/dual-axis-grouping-flows.md`
- Task: `docs/specs/target/functional/tasks/dual-axis-grouping.md`

## 구현 대상 업무

| Task # | 업무명 | 구현 |
|--------|-------|------|
| F1 | Group UI | O |
| F2 | Student UI | O |
| F3 | Attendance + Statistics UI | O |

## F1: Group UI

### GroupListPage.tsx

**테이블 컬럼 추가**
- 기존: `name`, `studentCount`
- 추가: `type` 컬럼 (name 옆)
  - render: `Badge variant="outline"` — GRADE → "학년", DEPARTMENT → "부서"

**타입 필터 추가**
- 테이블 상단에 `Select` 드롭다운: 전체 / 학년 / 부서
- `useGroups()` 호출 시 type 파라미터 전달
- 상태: `const [typeFilter, setTypeFilter] = useState<string | undefined>()`

### GroupForm.tsx

**타입 선택 추가**
- `RadioGroup` 컴포넌트 (shadcn/ui)
- 옵션: "학년" (GRADE), "부서" (DEPARTMENT)
- 기본값: GRADE
- 수정 모드: 기존 type 표시, 변경 가능
- `formData`에 `type: 'GRADE' | 'DEPARTMENT'` 추가

### GroupDetailPage.tsx

**학생 관리 UI 추가**
- 기존: 학생 목록 테이블 (읽기 전용)
- 추가 1: "학생 추가" 버튼 → `Dialog` 열기
  - Dialog 내: 미소속 학생 검색 (`Input` + 검색 결과 리스트)
  - 검색: `trpc.student.list` with organizationId (그룹 미소속 학생)
  - 추가 버튼 클릭 → `trpc.group.addStudent({ groupId, studentId })`
  - GRADE 그룹: 기존 GRADE 소속 시 "기존 학년(X)에서 이동합니다" 안내
- 추가 2: 학생 행마다 "제거" 버튼 (아이콘)
  - 클릭 → 확인 다이얼로그 → `trpc.group.removeStudent({ groupId, studentId })`

### useGroups() 훅 수정

- `list` 쿼리에 `type` 파라미터 추가
- `addStudent` mutation 추가: `trpc.group.addStudent.useMutation()`
- `removeStudent` mutation 추가: `trpc.group.removeStudent.useMutation()`
- `create` input에 `type` 필드 추가
- `update` input에 `type` 필드 추가

## F2: Student UI

### StudentForm.tsx

**그룹 선택 분리: 학년 + 부서**

현재: 단일 체크박스 리스트 (모든 그룹)
변경: 학년/부서 두 섹션으로 분리

```
학년 (0~1개 선택)
├── RadioGroup (선택 해제 가능)
│   ├── (선택 안 함)
│   ├── 1학년
│   └── 2학년 ...

부서 (0~N개 선택)
├── Checkbox 리스트
│   ├── 전례부
│   └── 성가대 ...
│   (부서 그룹 없으면 "등록된 부서가 없습니다" 표시)
```

**구현 상세**
- `useGroups()` 결과를 type으로 분리:
  ```
  gradeGroups = groups.filter(g => g.type === 'GRADE')
  deptGroups = groups.filter(g => g.type === 'DEPARTMENT')
  ```
- 학년 섹션: `RadioGroup` + "선택 안 함" 옵션 (value="")
  - 기존 선택 해제 시 groupIds에서 GRADE 그룹 제거
- 부서 섹션: `Checkbox` 리스트 (기존 패턴)
  - 부서 그룹 0개 → `<p className="text-muted-foreground">등록된 부서가 없습니다</p>`
- 검증: GRADE 2개 이상 선택 불가 (UI에서 RadioGroup이므로 자연스럽게 방지)
- formData.groupIds: 선택된 GRADE + DEPARTMENT 합산

### StudentListPage.tsx

**그룹 필터 드롭다운 추가**
- 테이블 상단에 `Select` 드롭다운
- 구조:
  ```
  전체
  ──────── (구분선)
  [학년] 1학년
  [학년] 2학년
  ──────── (구분선)
  [부서] 전례부
  [부서] 성가대
  ```
- `SelectSeparator` + `SelectGroup` (shadcn/ui)으로 타입별 그룹화
- 선택 시: `student.list` 쿼리에 `groupId` 파라미터 전달

### StudentDetailPage.tsx
- groups 표시에 type 배지 추가:
  - `student.groups?.map(g => <Badge variant={g.type === 'GRADE' ? 'default' : 'secondary'}>{g.name}</Badge>)`

### StudentImportModal.tsx
- 그룹 매칭: GRADE 그룹만 매칭 (기존 "학년" 컬럼)
- 매칭 실패 시: "학년 정보 없이 등록됩니다" 경고 → 사용자 확인 후 groupIds=[] 로 진행

## F3: Attendance + Statistics UI

### AttendancePage.tsx / CalendarPage.tsx

**그룹 탭 → 통합 드롭다운**
- 현재: `Select` 드롭다운 (모든 그룹, 구분 없음)
- 변경: 타입별 구분선 추가
  ```
  [학년] 1학년
  [학년] 2학년
  ──────── (구분선)
  [부서] 전례부
  [부서] 성가대
  ```
- `SelectGroup label="학년"` + `SelectGroup label="부서"` + `SelectSeparator`
- 기본 선택: 첫 번째 그룹 (타입 무관)
- groupId로 API 호출 (기존 동일)

### DashboardPage.tsx / GroupStatisticsTable.tsx

**그룹 통계 타입 구분**
- `GroupStatisticsItem`에 `type` 필드 추가
- 테이블에 "유형" 컬럼 추가 또는 그룹명 옆 배지 표시
  - Badge: GRADE → "학년", DEPARTMENT → "부서"
- 정렬: 학년 그룹 먼저, 부서 그룹 다음

## 공통 변경

### 타입 배지 컴포넌트
```
GroupTypeBadge({ type }):
  GRADE → <Badge variant="default">학년</Badge>
  DEPARTMENT → <Badge variant="secondary">부서</Badge>
```

### tRPC 타입 업데이트
- `GroupOutput`에 `type` 필드 추가 → 모든 groups 사용처 자동 반영
- `StudentGroupItem`에 `type` 필드 추가

## 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| T1 | 그룹 생성 (GRADE/DEPARTMENT 선택) | type별 정상 생성 |
| T2 | 그룹 목록 type 필터 | 필터링 정상 동작 |
| T3 | 그룹 상세 학생 추가 (GRADE 자동 이동) | 안내 메시지 + 이동 |
| T4 | 그룹 상세 학생 제거 | 확인 후 제거 |
| T5 | 학생 폼 학년 라디오 + 부서 체크박스 | 학년 0~1, 부서 0~N |
| T6 | 학생 목록 그룹 필터 (타입별 구분선) | 정상 필터링 |
| T7 | 출석 통합 드롭다운 | 학년+부서 모두 표시 |
| T8 | 통계 그룹별 type 배지 | 학년/부서 구분 표시 |
| T9 | 부서 그룹 없는 본당 | 부서 섹션 빈 상태 표시 |

---

**작성일**: 2026-03-13
**상태**: Draft
