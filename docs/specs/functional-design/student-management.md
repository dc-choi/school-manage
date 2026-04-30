# 기능 설계: 학생 관리

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/` — school-attendance · patron-saint-feast · student-excel-import · student-registration · graduation-normalization · student-search-improvement · input-validation-hardening · student-extra-fields

## 기능 범위

| 기능                                                              | 상태      |
| ----------------------------------------------------------------- | --------- |
| 기본 CRUD·목록·검색·일괄 삭제/복구/졸업·페이지네이션 유지 (1단계) | 구현 완료 |
| 엑셀 Import / 학생 등록 관리 / 통합 검색 (2단계)                  | 구현 완료 |
| 부모님 연락처 필드 (2단계)                                        | 구현 완료 |
| 이달의 축일자 목록 (2단계)                                        | 미구현    |

---

## 흐름/상태

- 기본 진입: [학생 목록 (?page=N)] ↔ [학생 상세] (페이지 유지)
- 단건 동작: [학생 목록] → 추가/수정/삭제 → [학생 목록 (?page=1)]
- 일괄 동작: [학생 목록] → 다중 선택 → 삭제/복구/졸업/등록/등록 취소 확인 다이얼로그 → [학생 목록]
- 엑셀 Import: [학생 목록] → [Import 모달: 양식 다운로드 → 파일 업로드 → 미리보기 → 등록 확인] → [학생 목록]
- 검색·필터: searchWord/필터 변경 시 [학생 목록 (?page=1)] 리셋

## UI/UX

| 화면             | 주요 요소                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 학생 목록        | 통합 검색 입력(X 클리어 버튼), 삭제/졸업/등록 필터, 테이블(다중 선택), 삭제/복구/졸업/등록/등록취소 버튼, 등록 현황 요약, 페이지네이션 |
| 학생 상세        | 학생 정보(인라인 수정), 학년 선택, 성별 선택, 삭제 배지                                                                                |
| 학생 추가        | 정보 입력 폼, 학년 선택, 저장                                                                                                          |
| 엑셀 Import 모달 | 파일 업로드, 미리보기 테이블, 검증 결과, 등록 버튼                                                                                     |

### 통합 검색 (2단계)

- 기존 searchOption 드롭다운 제거 → **단일 입력 필드 + 검색 버튼**으로 교체
- searchWord로 societyName, catholicName, baptizedAt을 OR 조건 동시 검색 (startsWith)
- X 버튼으로 검색어 초기화 → 전체 목록 복귀
- Enter 키 또는 검색 버튼 클릭으로 검색 실행
- 기존 필터(삭제/졸업/등록)와 조합 유지

### 삭제 필터

- 파라미터 없음: 재학생만 (기본)
- `includeDeleted=true`: 전체
- `onlyDeleted=true`: 삭제된 학생만

### 페이지네이션 동작

| 상황                                        | 페이지           |
| ------------------------------------------- | ---------------- |
| 최초 진입 / 검색·필터 변경 / 학생 추가 완료 | 1 (리셋)         |
| 상세 → 목록 복귀 / 브라우저 뒤로가기        | 이전 페이지 유지 |

---

## 데이터: Student 테이블

| 필드                              | 타입        | 설명                                        |
| --------------------------------- | ----------- | ------------------------------------------- |
| \_id                              | bigint (PK) | 고유 식별자                                 |
| society_name                      | varchar(50) | 이름 (필수)                                 |
| catholic_name                     | varchar(50) | 세례명                                      |
| gender                            | varchar(1)  | 성별 (M/F)                                  |
| age                               | bigint      | 나이 (한국 나이)                            |
| contact                           | bigint      | 학생 본인 연락처                            |
| parent_contact                    | varchar(20) | 부모님 연락처 — 원본 문자열 보존 (2단계)    |
| description                       | mediumtext  | 상세 설명                                   |
| baptized_at                       | varchar(10) | 축일                                        |
| group_id                          | bigint (FK) | 소속 그룹                                   |
| graduated_at                      | datetime    | 졸업일시 (정규화: YYYY-12-31, 로드맵 2단계) |
| create_at / update_at / delete_at | datetime    | 생성/수정/삭제일시                          |

## API

| 프로시저                         | 타입     | 설명                                                     |
| -------------------------------- | -------- | -------------------------------------------------------- |
| `student.list`                   | query    | 목록 조회 (페이지네이션, 통합 검색, 삭제/졸업/등록 필터) |
| `student.get`                    | query    | 상세 조회 (삭제된 그룹 제외)                             |
| `student.create`                 | mutation | 생성                                                     |
| `student.update`                 | mutation | 수정 (인라인)                                            |
| `student.delete`                 | mutation | 삭제 (소프트)                                            |
| `student.bulkDelete`             | mutation | 일괄 삭제                                                |
| `student.restore`                | mutation | 삭제 복구                                                |
| `student.promote`                | mutation | 학년 이동 (진급)                                         |
| `student.graduate`               | mutation | 졸업 처리                                                |
| `student.cancelGraduation`       | mutation | 졸업 취소                                                |
| `student.bulkCreate`             | mutation | 엑셀 Import 일괄 등록 (등록 여부 포함 가능)              |
| `student.feastDayList`           | query    | 이달의 축일자 목록                                       |
| `student.bulkRegister`           | mutation | 일괄 등록 처리 (현재 연도)                               |
| `student.bulkCancelRegistration` | mutation | 일괄 등록 취소 (현재 연도)                               |

## 비즈니스 로직

| 기능           | 동작 요약                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 목록           | accountId 소속 학생 조회 + 통합 검색(OR) + 삭제/졸업/등록 필터 + 페이지네이션                                                                                                                            |
| 일괄 삭제      | 존재하는 재학생만 소프트 삭제, deletedCount 반환                                                                                                                                                         |
| 삭제 복구      | deletedAt IS NOT NULL인 학생만 복구                                                                                                                                                                      |
| 졸업 처리      | graduatedAt IS NULL + deletedAt IS NULL인 학생만 처리, 트랜잭션. graduatedAt = 해당 연도 12/31 00:00:00 KST로 정규화. Organization.type의 maxAge 이상인 학생(`age >= maxAge`)만 졸업 대상 (로드맵 2단계) |
| 졸업 취소      | graduatedAt IS NOT NULL인 학생만 null로, 트랜잭션                                                                                                                                                        |
| 진급 (promote) | 초등부: 학년별 이동(age>=8), 중고등부: 19세→고3, 20세→성인                                                                                                                                               |
| 연례 나이 증가 | 매년 1/1 스케줄러: 전체 학생 age + 1                                                                                                                                                                     |
| 축일자 필터링  | `baptizedAt`의 월(MM)이 요청 월과 일치하는 재학생 조회, DD 오름차순                                                                                                                                      |

## 단건 입력 검증 (BUGFIX 완료)

`student.create` / `student.update` / `bulkCreate` 공통 제약 — `societyName` min(1)·max(50), `catholicName` max(50), `contact` `^\d+$`/max(15), `description` max(500). `update`는 `.nullable().optional()` 유지로 미전송 시 기존 값 보존 · `null` 명시 시 clear. 한글 에러 메시지 일관. 기존 DB의 하이픈 포함 `contact`는 재전송 시에만 검증 실패.

## 부모님 연락처 (로드맵 2단계)

흑석동(2026-03-11) + 성남동(2026-02-26) 반복 피드백 대응. 비고란 우회 기입을 정규 필드로 이관.

### 필드 제약

| 필드                            | 제약                                                                     |
| ------------------------------- | ------------------------------------------------------------------------ |
| `Student.parentContact`         | `String?` (`varchar(20)`). 사용자 입력 원본 보존 (하이픈·괄호·공백 포함) |
| `StudentSnapshot.parentContact` | 동일 — 스냅샷 시점 값                                                    |
| Zod 규칙                        | `/^[\d\-()\s]*$/` + max 20, 한글/영문 문자 거부                          |
| 빈 문자열 입력                  | 서버에서 NULL 정규화 (`trim() \|\| null`)                                |
| `update`의 `null`               | 명시적 clear 허용                                                        |

### API·UI 반영

- `student.create` / `student.update` / `student.bulkCreate` 확장 + list/get 응답 포함
- 학생 추가/수정 폼: 본인 연락처 아래 "부모님 연락처 (선택)"
- 학생 상세: 인라인 수정 + 읽기 표시
- 엑셀 템플릿: 10번째 컬럼 "부모 연락처" + 기존 9컬럼 템플릿 하위 호환
- 출석 페이지 노출은 본 범위 외 — "출석부 UI 개편"(P1)에서 통합

### 의사결정

| 항목       | 결정                                                              |
| ---------- | ----------------------------------------------------------------- |
| 타입       | `String` — 기존 `contact BigInt` 설계 미스 교훈, 포매팅 분리 전략 |
| 부·모 분리 | 단일 필드 — 추후 니즈 확정 시 별도                                |
| 생년월일   | 본 범위 제외 — 세례명 축일 기능과 결합 가능, 별도 과제            |

## 예외/엣지 케이스

| 상황                            | 처리                                                        |
| ------------------------------- | ----------------------------------------------------------- |
| 잘못된 studentId                | 400 BAD_REQUEST                                             |
| 존재하지 않는 학생              | 404 NOT_FOUND                                               |
| 토큰 누락                       | 401 UNAUTHORIZED                                            |
| 일괄 삭제/복구 빈 배열          | 400 BAD_REQUEST                                             |
| 100명 초과 일괄 요청            | 400 BAD_REQUEST                                             |
| 이미 졸업한 학생 재졸업         | 무시 (처리 수에서 제외)                                     |
| baptizedAt 비어있음/형식 불일치 | 축일자 목록에서 제외                                        |
| 검색어 공백만 입력              | trim 후 빈 문자열이면 전체 목록 반환                        |
| 검색어 + 필터 조합 시 결과 없음 | 빈 목록 반환 (에러 아님)                                    |
| 학생의 소속 그룹이 삭제된 경우  | student.get 응답에서 제외. 수정 시 삭제된 그룹 ID 전송 방지 |

## 마이그레이션 (로드맵 2단계)

| 대상                                   | 변환 규칙                                                                |
| -------------------------------------- | ------------------------------------------------------------------------ |
| Student.graduatedAt                    | `YEAR(graduatedAt)-12-31 00:00:00 KST` (기존 졸업 데이터 정규화)         |
| Student/StudentSnapshot.parent_contact | `ALTER TABLE … ADD COLUMN parent_contact VARCHAR(20) NULL` (무중단 추가) |

## 의사결정

| 항목                | 결정                                                            |
| ------------------- | --------------------------------------------------------------- |
| 삭제 방식           | 소프트 삭제 (deletedAt)                                         |
| 출석 데이터         | 절대 삭제 안 함                                                 |
| 졸업 처리           | 상태 변경 (데이터 보존)                                         |
| 졸업 시점           | 수동 (주일학교마다 다름)                                        |
| graduatedAt 정규화  | 클릭 시점 → 해당 연도 12/31로 변경 (학사 연도 정합)             |
| 나이 기반 졸업 대상 | age(한국 나이) >= Organization.type별 maxAge인 학생만 졸업 대상 |
| 통합 검색           | searchOption 제거, searchWord만으로 3필드 OR 검색 (2단계)       |

> 엑셀 Import 상세 → `student-management-import.md` 참조
> 학생 등록 관리 상세 → `student-management-registration.md` 참조
> 등록 중복 확인(로드맵 2단계) → `student-management-duplicate.md` 참조

---

**작성일**: 2026-01-13
**수정일**: 2026-04-30 (학생 등록 중복 확인 병합)
**작성자**: PM 에이전트 / SDD 작성자
**상태**: Approved (구현 완료)
