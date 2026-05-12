# 기능 설계: 출석 관리

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- PRD: `docs/specs/prd/attendance-split-display.md` (출석 인원 분리 표시)
- PRD: `docs/specs/prd/input-validation-hardening.md` (입력 검증 강화 — BUGFIX)
- PRD: `docs/specs/prd/attendance-ui-revamp.md` (출석부 UI 개편 — 모달 정렬 / 서버 분기 정합화 / 멱등성)

## 기능 범위

| 기능                   | 설명                                                   | 상태      |
| ---------------------- | ------------------------------------------------------ | --------- |
| 자동 저장              | 모달 체크박스 변경 즉시 서버 저장                      | 구현 완료 |
| 달력 UI                | 달력 형태, 모달 입력, 의무축일 표시                    | 구현 완료 |
| 출석 인원 분리 표시    | 달력 셀에 미사/교리 인원 분리 표시                     | 구현 완료 |
| 출석부 UI 개편 (2단계) | 모달 정렬 토글 / 서버 분기 정합화 / 멱등성 / a11y 보강 | 구현 완료 |

---

## 흐름/상태

```
[달력 진입] → (셀 클릭) → [모달 열림] → (체크박스 변경) → [즉시 저장] → [모달 닫기]
```

## UI/UX

| 화면           | 주요 요소                                                       |
| -------------- | --------------------------------------------------------------- |
| 출석 달력      | 학년/월 선택, 날짜별 미사/교리 인원 분리 표시, 의무축일 표시    |
| 출석 입력 모달 | **정렬 select** + 미사/교리 체크박스, 자동 상태 계산, 즉시 저장 |

### 출석 체크 방식

미사+교리=◎, 미사만=○, 교리만=△, 둘 다 없음 = **row 부재** (결석은 별도 row로 저장하지 않음).

### 정렬 (출석 모달 학생 목록)

| 키      | 정의                       | 비고               |
| ------- | -------------------------- | ------------------ |
| 등록 순 | 학생 `id` 오름차순         | 기본값             |
| 가나다  | `Intl.Collator('ko')` 정렬 | 동명이인은 id 보조 |

정렬 상태는 sessionStorage(`attendance_modal_sort` 단일 키)에 보관. 모바일 메인 동선이 달력 → 모달이라 모달에 적용.

---

## 데이터: Attendance 테이블

| 필드                              | 타입        | 설명                                          |
| --------------------------------- | ----------- | --------------------------------------------- |
| \_id                              | bigint (PK) | 고유 식별자                                   |
| date                              | varchar(50) | 출석일 (YYYYMMDD)                             |
| content                           | varchar(50) | 출석 내용 (◎/○/△)                             |
| student_id                        | bigint (FK) | 학생 ID                                       |
| group_id                          | bigint (FK) | 출석 시점 그룹 ID (UPDATE 시 historical 보존) |
| create_at / update_at / delete_at | datetime    | 생성/수정/삭제일시                            |

- **삭제 정책**: Attendance는 **물리 삭제** (개별 레코드 복구 필요성 낮음)
- **유니크 제약**: `(student_id, date)` UNIQUE (`attendance_student_date_unique`, 20260428) — 동시 입력 race 차단 + 중복 행 0 보장
- **인덱스**: `(group_id, date)` (학년/달력 조회용)

## API

| 프로시저               | 타입     | 설명                                    |
| ---------------------- | -------- | --------------------------------------- |
| `attendance.update`    | mutation | 출석 입력/삭제 (content 기반 자동 분기) |
| `attendance.calendar`  | query    | 월별 달력 데이터 (출석 현황 + 의무축일) |
| `attendance.dayDetail` | query    | 날짜별 출석 상세 (모달용)               |

### 저장 방식 (서버 동작)

| `attendance[].data` | DB 동작                                                         |
| ------------------- | --------------------------------------------------------------- |
| `◎` / `○` / `△`     | UPSERT (`INSERT ... ON DUPLICATE KEY UPDATE content, updateAt`) |
| `''`                | DELETE (`DELETE WHERE (studentId, date)`)                       |

- 한 배열에 마크/삭제 항목이 섞여도 항목별 자동 분기 (단일 트랜잭션)
- `groupId`는 onDuplicateKeyUpdate 절에 미포함 → 학생 그룹 이동 후에도 historical groupId 보존
- **멱등성**: 동일 입력 재전송 시 결과 동일 (UPSERT 동일값 갱신, DELETE 0행 noop)
- **동시성**: `(student_id, date)` UNIQUE + atomic SQL → 두 세션 동시 입력 시 row 1건 수렴
- **잠금 순서**: 항목을 `studentId` 오름차순 정렬 후 처리 → 동시 트랜잭션 데드락 회피

## 비즈니스 로직

| 기능             | 동작 요약                                                   |
| ---------------- | ----------------------------------------------------------- |
| 출석 입력/삭제   | content 기반 자동 분기 (마크 UPSERT, 결석/빈 DELETE)        |
| 출석 상태 계산   | 미사+교리=◎, 미사만=○, 교리만=△                             |
| 달력 데이터      | year+month+groupId → 일별 미사참석/교리참석/전체 + 의무축일 |
| 부활 대축일 계산 | Anonymous Gregorian Algorithm                               |

### 의무축일

- **고정**: 천주의 성모 마리아(1/1), 성모 승천(8/15), 모든 성인(11/1), 한국 성직자·수도자·신자들의 축일(9월 둘째 주일), 성탄(12/25)
- **이동** (부활 기준): 부활, 예수 승천(+40일), 성령 강림(+50일), 삼위일체, 성체 성혈, 예수 성심, 그리스도 왕

## 출석 인원 분리 표시 (로드맵 2단계)

달력 셀의 출석 현황을 단일 수치에서 미사/교리 인원 분리 표시로 변경.

`CalendarDayAttendance` 필드: `present`(전체 출석), `massPresent`(◎+○), `catechismPresent`(◎+△), `total`(전체 학생). 모바일(sm 미만)은 `{미사}/{교리}` 축약.

## 출석 data 입력 검증 강화 (BUGFIX, 2026-05-11 토큰 통일)

`attendance.update`의 `attendance[].data`에 Zod union literal 기반 서버측 재검증.

| 항목      | 값                                     |
| --------- | -------------------------------------- |
| 허용 토큰 | `◎` / `○` / `△` / `''` (단일 sentinel) |
| 위반 응답 | 400 BAD_REQUEST (한글 메시지)          |

**결석 sentinel = `''` 단일화 (2026-05-11)**: 구 `'-'` 토큰 폐지. Zod 스키마를 `z.string().regex(...)` → `z.union([z.literal('◎'), z.literal('○'), z.literal('△'), z.literal('')])` 로 전환하여 타입 좁힘 + 길이/반복 위반(`'○○'`·`'◎◎'`) 자동 차단. usecase switch에 `satisfies never` exhaustive check + 안전망. 회귀 방지 TC `TC-A-N1/N2`(`''` DELETE) + `TC-A-E2~E5`(invalid 거부, `-` 포함).

운영 DB 비정상 마크 44건(2026-04-28 1회성 마이그레이션 정리). 잔존 `-` 데이터는 `parseContent` default 분기로 결석 흡수 (회귀 없음).

## 신규 GA4 이벤트 (출석부 UI 개편)

- `attendance_sort_clicked` (sort_type: 'registration' | 'name')

## 예외/엣지 케이스

| 상황                                  | 처리                                   |
| ------------------------------------- | -------------------------------------- |
| 잘못된 groupId / attendance 배열 누락 | 400 BAD_REQUEST                        |
| 토큰 누락                             | 401 UNAUTHORIZED                       |
| year 누락                             | 현재 연도 대체                         |
| 네트워크 오류 (자동 저장)             | toast 에러 메시지 + 사용자 수동 재시도 |
| 주일 아닌 날짜 클릭                   | 출석 입력 허용 (행사 등)               |

---

**작성일**: 2026-01-13
**수정일**: 2026-05-07 (출석부 UI 개편 — isFull 제거 / 모달 정렬 / 서버 분기 정합화 / 멱등성)
**작성자**: PM 에이전트 / SDD 작성자
**상태**: Approved (구현 완료)
