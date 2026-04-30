# 기능 설계: 학생 등록 중복 확인 (로드맵 2단계)

> 메인: `student-management.md`. 같은 도메인의 import/registration 분리 패턴을 따른다.

장위동초(2026-04-01) 직접 피드백 — 팀 사용 환경에서 다른 교사가 이미 등록한 학생 중복 등록 방지. **차단이 아닌 경고+`force` 강제** 패턴으로 동명이인 운영 사례 보호.

## 비교 정책

- 정규화: `@school/utils/normalizeStudentKey` — `trim()` + 다중 공백 → 단일 공백
- 비교 키: `(이름, 세례명)` 튜플. 둘 다 일치해야 충돌
- 세례명 NULL 정책: **양쪽 모두 NULL일 때만 매칭** (한쪽 NULL이면 다른 학생으로 간주)
- 비교 대상 모집단: 같은 `organizationId` + `deletedAt IS NULL` (졸업 학생 포함, 삭제 학생 제외)
- DB UNIQUE 제약 미도입 (동명이인 운영 사례 보호 — `account-name-unique`와 다른 정책)

## API

| 프로시저                              | 변경                                                             | 비고                             |
| ------------------------------------- | ---------------------------------------------------------------- | -------------------------------- |
| `student.create`                      | 입력 최상위에 `force?: boolean`                                  | force=false + 충돌 시 `CONFLICT` |
| `student.bulkCreate`                  | 행 단위 `force?: boolean`, 응답에 `skipped: BulkCreateSkipped[]` | 입력 내부 + DB 중복 양쪽 검증    |
| `student.checkDuplicate` (신규 query) | `students[]` → `{ conflicts: DuplicateConflict[] }`              | 미리보기 사전 검증               |

### 응답 타입

| 타입                   | 핵심 필드                                                                 |
| ---------------------- | ------------------------------------------------------------------------- |
| `DuplicateConflict`    | `index`, `reason: 'INTERNAL_DUP' \| 'DB_DUP'`, `existing?`, `otherIndex?` |
| `ExistingStudentBrief` | `id`, `societyName`, `catholicName?`, `groupNames[]`, `createdAt`         |
| `BulkCreateSkipped`    | `index`, `reason`, `matchWith?: { id?, index? }`                          |

## 동작 요약

| 경로         | 동작                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 단건 등록    | 사용자 폼 submit → `checkDuplicate` 사전 호출 → DB 충돌 시 `StudentDuplicateDialog` → "그래도 등록" 시 `force: true` 재호출 / "취소" 시 폼 유지                     |
| 일괄 등록    | 미리보기 진입 시 `processFile`이 엑셀 파싱 + 데이터 검증 + `checkDuplicate`를 한 번에 수행 → 미리보기에 충돌 행 색상·사유 칩 표시 + 행별 강제 토글 + 일괄 강제/제외 |
| 충돌 사유 칩 | DB_DUP: `이미 등록됨: 박민수(베드로)` / INTERNAL_DUP: `내부 중복: 5행과 동일`                                                                                       |
| 카운트 헤더  | `전체 N건 중 정상 X / 오류 Y / 중복 Z`                                                                                                                              |
| 등록 버튼    | `{willRegisterCount}명 등록` — 정상 행 + 강제 토글한 충돌 행만                                                                                                      |
| 응답 처리    | `skipped[]`로 강제 안 한 충돌 행을 분리. toast: `중복 제외 N건: 박민수, 김지훈, 이서연 외 N명`                                                                      |

## 의사결정

| 항목                     | 결정                                         | 근거                                         |
| ------------------------ | -------------------------------------------- | -------------------------------------------- |
| 세례명 NULL 매칭         | 둘 다 NULL일 때만 매칭                       | 광범위 매칭은 동명이인 오감지 증가           |
| `force` 위치             | 단건=최상위, 일괄=행 단위                    | 일괄에서 일부 행만 강제 가능해야 사용성 보장 |
| 사전 검증 procedure 분리 | `student.checkDuplicate` 별도 query          | 미리보기 단계에서 등록 전 결정 가능          |
| 졸업 학생 매칭 포함      | 포함                                         | 같은 학생 재입학 식별 가치                   |
| 한글 문구                | "이미 등록된 학생입니다. 그래도 등록할까요?" | 피드백 표현 유지                             |
| DB UNIQUE 제약           | 도입 안 함                                   | 동명이인 운영 사례 보호                      |
| 검증 단계 통합           | 엑셀 파싱+데이터 검증+중복 검증을 한 번에    | UX: 미리보기 깜빡임 제거                     |

## 측정 (GA4)

| 이벤트                            | 발화 시점                                          | 파라미터                             |
| --------------------------------- | -------------------------------------------------- | ------------------------------------ |
| `student_duplicate_warning_shown` | 단건 다이얼로그/일괄 미리보기 충돌 헤더 노출 (1회) | `mode`, `internal_count`, `db_count` |
| `student_duplicate_forced`        | 강제 등록 실행                                     | `mode`, `count`                      |
| `student_duplicate_cancelled`     | 취소·제외 선택                                     | `mode`, `count`                      |

머지 후 4주 후 강제율(`forced / warning_shown`) STATUS.md 회고.

---

**작성일**: 2026-04-30
**상태**: Approved (구현 완료)
