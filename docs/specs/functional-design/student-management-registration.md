# 기능 설계: 학생 등록 관리 (로드맵 2단계)

> 4단계 "등록 관리"의 핵심 선행 구현. 전자서명·보상 기준 연동은 제외.

## 연결 문서

- 메인: `student-management.md`
- PRD: `docs/specs/prd/student-registration.md`
- 엑셀 Import: `student-management-import.md`

---

## 사용자 플로우

1. 교사가 학생 목록에서 등록 필터로 "미등록" 선택 → 미등록 학생만 표시
2. 등록할 학생을 체크박스로 선택 → "등록" 버튼 클릭 → 확인 다이얼로그 → 현재 연도 등록 완료
3. 등록 현황 요약 (등록 N명 / 미등록 M명) 확인
4. 실수 시 "등록 취소" 버튼으로 해당 연도 등록 해제

**엑셀 Import 연계:** 엑셀 양식에 "등록 여부" 컬럼(O/X) 작성 → 학생 생성과 동시에 등록 처리

## 등록 필터

| 파라미터 | 동작 |
|---------|------|
| 파라미터 없음 (기본) | 전체 학생 (등록 상태 무관) |
| `registered=true` | 등록된 학생만 |
| `registered=false` | 미등록 학생만 |

## 등록 현황 요약

학생 목록 상단에 현재 연도 기준 등록 현황 표시:
- "2026년 등록 현황: 등록 32명 / 미등록 8명"
- `student.list` 응답에 `registrationSummary` 포함

## 데이터: Registration 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | bigint (PK) | 고유 식별자 |
| student_id | bigint (FK) | 학생 ID |
| year | int | 등록 연도 |
| registered_at | datetime | 등록 처리 일시 |
| create_at / update_at / delete_at | datetime | 생성/수정/삭제일시 |

- **유니크 제약**: `student_id` + `year` 조합 유니크 (연도당 1건)
- **관계**: Student 1 : N Registration (연도별 이력)

## API

### `student.list` 변경

기존 입력에 등록 필터 파라미터 추가:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| registered | boolean | 선택 | true: 등록만, false: 미등록만, 미전달: 전체 |
| registrationYear | number | 선택 | 조회 연도 (기본값: 현재 연도) |

기존 응답에 등록 상태 추가:

| 필드 | 타입 | 설명 |
|------|------|------|
| students[].isRegistered | boolean | 해당 연도 등록 여부 |
| registrationSummary.registeredCount | number | 등록 학생 수 |
| registrationSummary.unregisteredCount | number | 미등록 학생 수 |

### `student.bulkRegister`

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ids | string[] | 필수 | 등록할 학생 ID 배열 |
| year | number | 선택 | 등록 연도 (기본값: 현재 연도) |

- 응답: `{ registeredCount: number }`
- 이미 등록된 학생은 무시 (중복 등록 방지, upsert)

### `student.bulkCancelRegistration`

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ids | string[] | 필수 | 등록 취소할 학생 ID 배열 |
| year | number | 선택 | 취소 연도 (기본값: 현재 연도) |

- 응답: `{ cancelledCount: number }`
- 등록 이력이 없는 학생은 무시

## 비즈니스 로직

| 기능 | 동작 요약 |
|------|----------|
| 일괄 등록 | studentId + year로 Registration 레코드 생성 (upsert), 소프트 삭제된 레코드는 delete_at null로 복구, 이미 등록된 학생은 건너뜀 |
| 일괄 등록 취소 | studentId + year 매칭 Registration 레코드 소프트 삭제 (delete_at 설정) |
| 목록 조회 (등록 필터) | Registration 테이블 LEFT JOIN (delete_at IS NULL)으로 등록 여부 판단 |
| 등록 현황 요약 | 해당 연도 Registration 레코드 count vs 전체 재학생 count |
| 엑셀 Import 등록 | bulkCreate 트랜잭션 내에서 학생 생성 + Registration 생성 동시 처리 |

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 이미 등록된 학생 재등록 | 무시 (registeredCount에서 제외) |
| 등록 이력 없는 학생 취소 | 무시 (cancelledCount에서 제외) |
| 졸업/삭제된 학생 등록 시도 | 허용 (등록과 졸업/삭제는 독립적 상태) |
| 빈 배열로 등록/취소 요청 | 400 BAD_REQUEST |
| 100명 초과 일괄 요청 | 400 BAD_REQUEST |

## 의사결정

| 항목 | 결정 | 근거 |
|------|------|------|
| 테이블 구조 | 별도 Registration 테이블 | 연도별 이력 추적 필요. Student 필드 추가 시 이력 관리 불가 |
| 등록 단위 | 연도 단위 | 대부분의 주일학교가 연도 단위 등록제 운영 |
| 기본 필터 | 전체 (등록 상태 무관) | 기존 UX 변경 최소화. 교사가 필요할 때만 필터 적용 |
| 취소 방식 | 소프트 삭제 (delete_at) | 기존 Student 삭제 패턴과 일관성 유지. 재등록 시 복구 가능 |
| 엑셀 하위호환 | 9번째 컬럼 없어도 동작 | 기존 사용자 엑셀 파일 호환성 유지 |

---

**상태**: 구현 완료
