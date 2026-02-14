# 기능 설계: 학생 관리

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- 사업 문서: `docs/business/6_roadmap/roadmap.md`

## 기능 범위

| 기능 | 설명 | 상태 |
|------|------|------|
| 기본 학생 관리 | 학생 CRUD, 목록, 검색 | 구현 완료 |
| 일괄 삭제/복구 (로드맵 1단계) | 다중 선택 삭제, 소프트 삭제, 복구 | 구현 완료 |
| 일괄 졸업 처리 (로드맵 1단계) | 다중 선택 졸업, 졸업 취소 | 구현 완료 |
| 페이지네이션 상태 유지 (로드맵 1단계) | 상세→목록 복귀 시 페이지 유지 (URL 쿼리 파라미터) | 구현 완료 |
| 엑셀 Import (로드맵 1단계) | 엑셀 파일 업로드로 학생 일괄 등록 | 미구현 |

## 흐름/상태

### 사용자 플로우

**기본 플로우:**
1. 사용자가 학생 명단 화면 진입
2. 계정 소속 그룹의 전체 학생 목록 조회 (재학생 필터 기본)
3. 검색 조건으로 필터링 또는 페이지 이동
4. 학생 추가 또는 특정 학생 선택 → 상세 페이지 이동

**상세 페이지 플로우 (로드맵 1단계):**
1. 학생 상세 페이지에서 학생 정보 확인/인라인 수정
2. 학생 목록으로 복귀 → **이전 페이지 번호 유지** (URL `?page=N`)

**일괄 삭제/복구 플로우 (로드맵 1단계):**
1. 다중 선택 → "삭제" 클릭 → 확인 모달 → 소프트 삭제
2. "삭제된 학생" 필터 → 복구할 학생 선택 → "복구" 클릭 → 재학생 복귀

**일괄 졸업 처리 플로우 (로드맵 1단계):**
1. 졸업 대상 다중 선택 → "졸업 처리" 클릭 → 확인 모달 → 졸업 처리
2. "졸업생" 필터에서 졸업생 조회, 졸업 취소 가능

### 상태 전이

```
[학생 목록 (?page=N)] → (학생 클릭) → [학생 상세]
[학생 상세] → (목록 복귀) → [학생 목록 (?page=N)] ← 페이지 유지
[학생 목록] → (학생 추가) → [학생 생성 완료] → [학생 목록 (?page=1)]
[학생 목록] → (다중 선택 + 삭제) → [소프트 삭제] → [학생 목록]
[학생 목록 (삭제 필터)] → (복구) → [학생 목록 (재학생)]
[학생 목록] → (졸업 처리) → [졸업 완료] → [학생 목록]
[학생 목록] → (검색/필터 변경) → [학생 목록 (?page=1)] ← 페이지 리셋
```

## UI/UX

### 화면/컴포넌트

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 학생 목록 | 전체 학생 리스트 (페이지네이션) | 검색/삭제 필터, 학생 테이블, 다중 선택, 삭제/복구/졸업 버튼, 페이지 네비게이션 |
| 학생 상세 | 학생 정보 조회/수정 | 학생 정보 (인라인 수정), 뒤로 가기 |
| 학생 추가 | 신규 학생 등록 | 정보 입력 폼, 그룹 선택, 저장 버튼 |

### 학생 목록 화면 (로드맵 1단계)

| 요소 | 설명 |
|------|------|
| 삭제 필터 | 재학생(기본) / 삭제된 학생 포함 / 삭제된 학생만 |
| 검색 필터 | 이름, 세례명, 축일로 검색 |
| 테이블 헤더 | 선택 체크박스, 이름, 세례명, 나이, 그룹, 연락처 |
| 테이블 행 | 클릭 시 상세 페이지 이동 (전체 행이 클릭 영역) |
| 다중 선택 | 헤더의 전체 선택, 각 행의 개별 체크박스 |
| 삭제 버튼 | 재학생 필터에서만, 선택 시 활성화 |
| 복구 버튼 | 삭제된 학생 필터에서만 표시 |
| 페이지네이션 | 페이지당 10명, URL `?page=N`으로 상태 동기화 |

### 학생 상세 화면 (로드맵 1단계)

| 요소 | 설명 |
|------|------|
| 학생 정보 | 이름, 세례명, 성별, 나이, 연락처, 축일, 메모 (인라인 수정) |
| 그룹 선택 | 소속 그룹 변경 드롭다운 |
| 성별 선택 | 남/여 드롭다운 |
| 삭제 배지 | 삭제된 학생인 경우 "삭제됨" 태그 표시 |

### 삭제 확인 모달

- "선택한 N명의 학생을 삭제합니다" + 대상 목록 표시
- 출석 기록 보존 안내, 삭제된 학생 필터에서 복구 가능 안내
- 확인/취소 버튼

### 권한별 차이

| 권한 | 접근 가능 기능 |
|------|---------------|
| 인증된 사용자 | 본인 계정 그룹의 학생 전체 CRUD |

## 페이지네이션 상태 유지 (로드맵 1단계)

> 상세 페이지에서 목록으로 복귀 시 이전 페이지 번호를 유지합니다.

URL 형식: `/students` (page=1 기본), `/students?page=3`

| 상황 | 페이지 동작 |
|------|------------|
| 목록 최초 진입 | 1 (기본값) |
| 페이지 변경 | URL `?page=N` 업데이트 |
| 상세 → 목록 복귀 | 이전 페이지 유지 |
| 브라우저 뒤로가기 | 이전 URL 복원 |
| 검색/필터 변경 | 1로 리셋 |
| 학생 추가 완료 | 1로 리셋 |
| URL에 비정상 page | 1 (기본값) |

구현 방향: URL → State 동기화 (마운트 시), State → URL 동기화 (변경 시, replace 모드)

## 데이터/도메인 변경

### Student 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | bigint (PK) | 학생 고유 식별자 |
| society_name | varchar(50) | 이름 (필수) |
| catholic_name | varchar(50) | 세례명 |
| gender | varchar(1) | 성별 (M/F) |
| age | bigint | 나이 |
| contact | bigint | 연락처 |
| description | mediumtext | 상세 설명 |
| baptized_at | varchar(10) | 축일 |
| group_id | bigint (FK) | 소속 그룹 ID |
| create_at | datetime | 생성일시 |
| update_at | datetime | 수정일시 |
| delete_at | datetime | 삭제일시 (소프트 삭제) |
| graduated_at | datetime | 졸업일시 |

마이그레이션: 없음 (기존 스키마 유지)

## API/인터페이스

### tRPC 프로시저

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `student.list` | query | 학생 목록 조회 (페이지네이션, 검색, 삭제 필터) |
| `student.get` | query | 학생 상세 조회 |
| `student.create` | mutation | 학생 생성 |
| `student.update` | mutation | 학생 수정 (인라인 수정용) |
| `student.delete` | mutation | 학생 삭제 (소프트) |
| `student.bulkDelete` | mutation | 학생 일괄 삭제 (로드맵 1단계) |
| `student.restore` | mutation | 삭제된 학생 복구 (로드맵 1단계) |
| `student.promote` | mutation | 그룹 이동 (진급) |
| `student.graduate` | mutation | 졸업 처리 (로드맵 1단계) |
| `student.cancelGraduation` | mutation | 졸업 취소 (로드맵 1단계) |

### 주요 필드

| 프로시저 | 요청 필드 | 응답 필드 |
|----------|----------|----------|
| `student.list` | searchOption?, searchWord?, page?, includeDeleted?, onlyDeleted? | page, size, totalPage, students(array) |
| `student.get` | studentId(number) | 학생 전체 필드 |
| `student.create` | societyName(필수), catholicName?, gender?, age?, contact?, description?, baptizedAt?, groupId(필수) | student 정보 |
| `student.bulkDelete` | studentIds(number[], 필수) | deletedCount, students(id, societyName, deletedAt) |
| `student.restore` | studentIds(number[], 필수) | restoredCount |
| `student.graduate` | ids(string[], 필수) | graduatedCount |
| `student.cancelGraduation` | ids(string[], 필수) | cancelledCount |

### 삭제 필터 파라미터

- 파라미터 없음: 재학생만 (deletedAt=null, 기본값)
- `includeDeleted=true`: 전체 (삭제된 학생 포함)
- `onlyDeleted=true`: 삭제된 학생만

## 비즈니스 로직

| 기능 | 동작 요약 |
|------|----------|
| 학생 목록 | accountId 소속 그룹의 학생 조회, 삭제 필터/검색/페이지네이션 적용 |
| 학생 상세/생성/수정 | studentId 검증 후 CRUD, 미존재 시 404 |
| 학생 삭제 | deletedAt = now (소프트 삭제) |
| 일괄 삭제 | studentIds → 존재하는 재학생만 소프트 삭제, deletedCount 반환 |
| 삭제 복구 | studentIds → deletedAt IS NOT NULL인 학생만 deletedAt = null로 복구 |
| 졸업 처리 | ids → graduatedAt IS NULL이고 deletedAt IS NULL인 학생만 graduatedAt = now(KST), 트랜잭션 |
| 졸업 취소 | ids → graduatedAt IS NOT NULL인 학생만 graduatedAt = NULL, 트랜잭션 |
| 진급 (promote) | 초등부: 학년별 그룹 이동 (age>=8), 중고등부: 19세→고3, 20세→성인 |
| 연례 나이 증가 | 매년 1/1 스케줄러: 전체 학생 age + 1 |

### 스케줄러 vs graduate API

| 기능 | 역할 | 트리거 |
|------|------|--------|
| 스케줄러 (`Scheduler.studentAge`) | 모든 학생 나이 +1 | 매년 1월 1일 자동 |
| promote API | 학년별 그룹 이동 | 수동 호출 |
| graduate API | 졸업 상태 변경 | 수동 호출 |

## 권한/보안

- 모든 학생 API: Bearer 토큰 필수
- 학생 목록은 계정 소속 그룹으로 필터링

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 잘못된 studentId | 400 BAD_REQUEST |
| 존재하지 않는 학생 | 404 NOT_FOUND |
| 검색 옵션 유효하지 않음 | 필터 무시, 전체 조회 |
| page 누락/비정상 | 1로 기본값 처리 |
| 토큰 누락 | 401 UNAUTHORIZED |
| 일괄 삭제/복구 빈 배열 | 400 BAD_REQUEST |
| 일괄 삭제 일부 학생 없음 | 존재하는 학생만 처리 |
| 이미 졸업한 학생 재졸업 | 무시 (처리 수에서 제외) |
| 100명 초과 일괄 요청 | 400 BAD_REQUEST |

## 성능/제약

- 계정당 학생 수 수십~수백 명
- 페이지당 10명 고정
- 검색 옵션: societyName, catholicName, baptizedAt
- 일괄 처리: 최대 100명, 트랜잭션 (전체 성공/전체 실패)

## 의사결정

| 항목 | 결정 | 비고 |
|------|------|------|
| 삭제 방식 | 소프트 삭제 (deletedAt) | 재학생만 삭제 가능 |
| 출석 데이터 | 절대 삭제 안 함 | 프로젝트 핵심 |
| 졸업 처리 | 상태 변경 (데이터 보존) | 삭제 아님 |
| 졸업생 표시 | 기본 숨김 + 필터로 조회 | |
| 졸업 시점 | 수동 (주일학교마다 다름) | |
| `graduate` → `promote` 변경 | 기존 진급 API를 promote로 변경 | graduate는 졸업에 사용 |

## 테스트 시나리오

### 정상 케이스

1. 학생 목록 조회 → page, students 반환
2. 검색 조건 적용 → 필터링된 목록
3. 학생 생성/수정/삭제 → 처리된 정보 반환
4. 삭제 필터 (includeDeleted/onlyDeleted) 적용
5. 일괄 삭제 → deletedCount 반환
6. 삭제 복구 → restoredCount 반환
7. 졸업 처리/취소 → graduatedCount/cancelledCount 반환
8. 3페이지에서 상세 이동 → 복귀 시 3페이지 유지

### 예외 케이스

1. 잘못된 studentId → 400
2. 존재하지 않는 학생 → 404
3. 토큰 없이 호출 → 401
4. 일괄 삭제/복구 빈 배열 → 400

---

## 엑셀 Import (로드맵 1단계 - 미구현)

### 배경

- 학생 개별 등록 시 수동 입력 부담
- 대부분의 본당이 이미 엑셀로 학생 명단 관리 중
- 엑셀 업로드로 학생 일괄 등록 + 템플릿 제공 + 미리보기/검증

### 사용자 플로우

1. "엑셀 업로드" 클릭 → 템플릿 다운로드 또는 파일 선택
2. 파일 업로드 → 미리보기 표시 + 검증 결과 (오류 행 표시)
3. 확인 → 일괄 등록 → 결과 (성공/실패 건수)

### 상태 전이

```
[대기] → (파일 선택) → [파일 로드] → (파싱) → [미리보기]
[미리보기] → (검증 오류) → [오류 표시] → (수정) → [미리보기]
[미리보기] → (확인) → [등록 중] → [결과 표시] → [대기]
```

### 템플릿 형식

| 열 | 헤더명 | 필수 | 예시 |
|-----|--------|------|------|
| A | 이름 | O | 홍길동 |
| B | 세례명 | X | 베드로 |
| C | 성별 | X | 남 또는 여 |
| D | 나이 | X | 14 |
| E | 연락처 | X | 01012345678 |
| F | 축일 | X | 06-29 |
| G | 그룹명 | O | 중1-1반 |
| H | 메모 | X | 특이사항 |

1행: 헤더, 2행부터: 데이터. 필수값은 노란색 배경 표시.

### tRPC 프로시저

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `student.importPreview` | mutation | 엑셀 파싱 + 검증 (미리보기) |
| `student.importExecute` | mutation | 검증된 데이터 일괄 등록 |
| `student.importTemplate` | query | 템플릿 다운로드 URL |

### 주요 필드

| 프로시저 | 요청 필드 | 응답 필드 |
|----------|----------|----------|
| `importPreview` | file(FormData) | valid, totalRows, validRows, errorRows, preview(array), errors(array) |
| `importExecute` | sessionId(string) | success, created, failed, failedDetails(array) |

### 예외 케이스

| 상황 | 처리 방법 |
|------|----------|
| 잘못된 파일 형식 | 오류 + 업로드 거부 |
| 필수 필드 누락 | 해당 행 오류 표시, 부분 등록 가능 |
| 존재하지 않는 그룹명 | 오류 표시 (미리 그룹 등록 필요) |
| 이름+세례명 동일 | 경고 표시 후 등록 가능 |
| 파일 크기 초과 (5MB) | 오류 + 업로드 거부 |
| 행 수 초과 (1000행) | 오류 + 업로드 거부 |

---

**작성일**: 2026-01-13
**수정일**: 2026-02-12 (문서 축약 - 동작 명세 수준으로 정리)
**작성자**: PM 에이전트
**상태**: Approved (구현 완료)

> **Note**: 엑셀 Import는 Hold 상태입니다 (`docs/specs/README.md` 보류 항목 참조).
