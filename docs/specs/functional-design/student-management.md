# 기능 설계: 학생 관리

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- PRD: `docs/specs/prd/patron-saint-feast.md` (이달의 축일자 목록)

## 기능 범위

| 기능 | 설명 | 상태 |
|------|------|------|
| 기본 학생 관리 | 학생 CRUD, 목록, 검색 | 구현 완료 |
| 일괄 삭제/복구 (1단계) | 다중 선택 삭제, 소프트 삭제, 복구 | 구현 완료 |
| 일괄 졸업 처리 (1단계) | 다중 선택 졸업, 졸업 취소 | 구현 완료 |
| 페이지네이션 상태 유지 (1단계) | 상세→목록 복귀 시 URL `?page=N` 유지 | 구현 완료 |
| 이달의 축일자 목록 (2단계) | 대시보드에 이달 축일 학생 카드 표시 | 미구현 |

---

## 흐름/상태

```
[학생 목록 (?page=N)] → (학생 클릭) → [학생 상세] → (목록 복귀) → [학생 목록 (?page=N)]
[학생 목록] → (학생 추가) → [학생 생성 완료] → [학생 목록 (?page=1)]
[학생 목록] → (다중 선택 + 삭제) → [소프트 삭제] → [학생 목록]
[학생 목록 (삭제 필터)] → (복구) → [학생 목록 (재학생)]
[학생 목록] → (졸업 처리) → [졸업 완료] → [학생 목록]
[학생 목록] → (검색/필터 변경) → [학생 목록 (?page=1)]
```

## UI/UX

| 화면 | 주요 요소 |
|------|----------|
| 학생 목록 | 검색/삭제 필터, 테이블(다중 선택), 삭제/복구/졸업 버튼, 페이지네이션 |
| 학생 상세 | 학생 정보(인라인 수정), 학년 선택, 성별 선택, 삭제 배지 |
| 학생 추가 | 정보 입력 폼, 학년 선택, 저장 |

### 삭제 필터

- 파라미터 없음: 재학생만 (기본)
- `includeDeleted=true`: 전체
- `onlyDeleted=true`: 삭제된 학생만

### 페이지네이션 동작

| 상황 | 페이지 |
|------|--------|
| 최초 진입 / 검색·필터 변경 / 학생 추가 완료 | 1 (리셋) |
| 상세 → 목록 복귀 / 브라우저 뒤로가기 | 이전 페이지 유지 |

---

## 데이터: Student 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | bigint (PK) | 고유 식별자 |
| society_name | varchar(50) | 이름 (필수) |
| catholic_name | varchar(50) | 세례명 |
| gender | varchar(1) | 성별 (M/F) |
| age | bigint | 나이 |
| contact | bigint | 연락처 |
| description | mediumtext | 상세 설명 |
| baptized_at | varchar(10) | 축일 |
| group_id | bigint (FK) | 소속 그룹 |
| graduated_at | datetime | 졸업일시 |
| create_at / update_at / delete_at | datetime | 생성/수정/삭제일시 |

## API

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `student.list` | query | 목록 조회 (페이지네이션, 검색, 삭제 필터) |
| `student.get` | query | 상세 조회 |
| `student.create` | mutation | 생성 |
| `student.update` | mutation | 수정 (인라인) |
| `student.delete` | mutation | 삭제 (소프트) |
| `student.bulkDelete` | mutation | 일괄 삭제 |
| `student.restore` | mutation | 삭제 복구 |
| `student.promote` | mutation | 학년 이동 (진급) |
| `student.graduate` | mutation | 졸업 처리 |
| `student.cancelGraduation` | mutation | 졸업 취소 |
| `student.feastDayList` | query | 이달의 축일자 목록 |

## 비즈니스 로직

| 기능 | 동작 요약 |
|------|----------|
| 목록 | accountId 소속 학년의 학생 조회 + 삭제 필터/검색/페이지네이션 |
| 일괄 삭제 | 존재하는 재학생만 소프트 삭제, deletedCount 반환 |
| 삭제 복구 | deletedAt IS NOT NULL인 학생만 복구 |
| 졸업 처리 | graduatedAt IS NULL + deletedAt IS NULL인 학생만 처리, 트랜잭션 |
| 졸업 취소 | graduatedAt IS NOT NULL인 학생만 null로, 트랜잭션 |
| 진급 (promote) | 초등부: 학년별 이동(age>=8), 중고등부: 19세→고3, 20세→성인 |
| 연례 나이 증가 | 매년 1/1 스케줄러: 전체 학생 age + 1 |
| 축일자 필터링 | `baptizedAt`의 월(MM)이 요청 월과 일치하는 재학생 조회, DD 오름차순 |

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 잘못된 studentId | 400 BAD_REQUEST |
| 존재하지 않는 학생 | 404 NOT_FOUND |
| 토큰 누락 | 401 UNAUTHORIZED |
| 일괄 삭제/복구 빈 배열 | 400 BAD_REQUEST |
| 100명 초과 일괄 요청 | 400 BAD_REQUEST |
| 이미 졸업한 학생 재졸업 | 무시 (처리 수에서 제외) |
| baptizedAt 비어있음/형식 불일치 | 축일자 목록에서 제외 |

## 의사결정

| 항목 | 결정 |
|------|------|
| 삭제 방식 | 소프트 삭제 (deletedAt) |
| 출석 데이터 | 절대 삭제 안 함 |
| 졸업 처리 | 상태 변경 (데이터 보존) |
| 졸업 시점 | 수동 (주일학교마다 다름) |

---

**작성일**: 2026-01-13
**수정일**: 2026-02-24 (문서 축약)
**작성자**: PM 에이전트
**상태**: Approved (구현 완료)

> **Note**: 엑셀 Import는 Hold 상태입니다 (`docs/specs/README.md` 보류 항목 참조).
