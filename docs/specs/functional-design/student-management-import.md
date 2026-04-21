# 기능 설계: 학생 엑셀 Import (로드맵 2단계)

> 학생 관리 기능 설계의 분리 문서입니다.

## 연결 문서

- 메인: `student-management.md`
- PRD: `docs/specs/prd/student-excel-import.md`, `docs/specs/prd/xlsx-migration.md` (라이브러리 교체)
- 등록 관리: `student-management-registration.md`

---

## 사용자 플로우

1. 학생 목록 페이지에서 "엑셀 업로드" 버튼 클릭 → Import 모달 열림
2. 모달에서 "양식 다운로드" 클릭 → 엑셀 템플릿(.xlsx) 다운로드
3. 사용자가 템플릿에 학생 데이터 입력
4. 모달에서 파일 선택 (.xlsx) → 시스템이 파싱 → 미리보기 테이블 표시
5. 미리보기 테이블에서 행별 검증 결과 확인 (성공/에러)
6. "등록" 버튼 클릭 → 검증 통과 행만 일괄 등록
7. 등록 결과 요약 표시 (성공 N건, 실패 M건)
8. 학생 목록으로 복귀

## 엑셀 컬럼 구조

| 순서 | 컬럼명 | DB 필드 | 필수 | 검증 |
|------|--------|---------|------|------|
| 1 | 학년 | groupId | **필수** | 계정 소속 그룹명과 매칭, 미매칭 시 에러 |
| 2 | 이름 | societyName | **필수** | 빈 값 불가 |
| 3 | 세례명 | catholicName | 선택 | |
| 4 | 성별 | gender | 선택 | 남/여 또는 M/F → M/F로 정규화 |
| 5 | 전화번호 | contact | 선택 | 숫자만 추출 |
| 6 | 축일 | baptizedAt | 선택 | MM/DD 형식 검증 |
| 7 | 나이 | age | 선택 | 양의 정수 |
| 8 | 비고 | description | 선택 | |
| 9 | 등록 여부 | registered | 선택 | O → 등록, 그 외(X/빈 값) → 미등록 |

- 1~6번은 기본 컬럼 (순서 고정), 7~9번은 추가 컬럼 (없어도 됨)
- 첫 번째 행은 헤더로 간주하여 건너뜀
- 9번 컬럼이 없어도 됨 (기존 8컬럼 엑셀 하위호환)

### 학년→그룹 매칭

- 엑셀의 "학년" 값을 계정 소속 그룹 이름과 비교
- 정확히 일치하는 그룹에 배정
- 매칭 실패 시 해당 행 에러 표시

### 성별 정규화

| 입력값 | 정규화 |
|--------|--------|
| 남, M | M |
| 여, F | F |
| 그 외 | 에러 |

### 등록 여부 정규화

| 입력값 | 정규화 |
|--------|--------|
| O, o | 등록 (true) |
| X, x, 빈 값, 컬럼 없음 | 미등록 (false) |

## Import 모달

**초기 상태 (파일 업로드 전):**

| 요소 | 설명 |
|------|------|
| 양식 다운로드 버튼 | 엑셀 템플릿 다운로드 (컬럼 헤더만 포함된 .xlsx) |
| 파일 선택 영역 | .xlsx 파일 업로드 |
| 취소 버튼 | 모달 닫기 |

**미리보기 상태 (파일 업로드 후):**

| 요소 | 설명 |
|------|------|
| 파일명 | 업로드한 파일명 표시 |
| 미리보기 테이블 | 파싱된 데이터 + 행별 검증 상태 (성공/에러) |
| 에러 행 강조 | 에러 행은 시각적으로 구분, 에러 사유 표시 |
| 요약 | 전체 N건 중 성공 M건, 실패 K건 |
| 등록 버튼 | 검증 통과 행만 등록 (에러 행 제외) |
| 다시 선택 버튼 | 파일 재선택 (초기 상태로) |
| 취소 버튼 | 모달 닫기 |

## 비즈니스 로직

| 항목 | 동작 |
|------|------|
| 파싱 | 클라이언트에서 엑셀 파싱 (서버에 파일 전송 X) |
| 검증 | 클라이언트에서 행별 검증 후 미리보기 표시 |
| 등록 | 검증 통과 행을 서버 API(`student.bulkCreate`)로 전송 |
| 그룹 매칭 | 클라이언트에서 그룹 목록 조회 후 이름 매칭 |
| 최대 건수 | 500명 이하 |
| 엑셀 라이브러리 | **ExcelJS** (read/write 단일 라이브러리). 모듈은 **동적 import** 로 메인 번들에서 분리 |
| 청크 로딩 시점 | "양식 다운로드" 또는 파일 선택 시 ExcelJS 청크를 1회 로드 (이후 캐싱) |

## API: `student.bulkCreate`

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| students | array | 필수 | 학생 데이터 배열 |
| students[].societyName | string | 필수 | 이름 |
| students[].catholicName | string | 선택 | 세례명 |
| students[].gender | enum(M/F) | 선택 | 성별 |
| students[].age | number | 선택 | 나이 |
| students[].contact | number | 선택 | 연락처 |
| students[].baptizedAt | string | 선택 | 축일 (MM/DD) |
| students[].description | string | 선택 | 비고 |
| students[].groupId | string | 필수 | 그룹 ID |
| students[].registered | boolean | 선택 | true이면 현재 연도 등록 처리 |

- 응답: 성공 건수, 실패 건수

## 서버측 입력 재검증 (로드맵 2단계 — 서버측 재검증)

직접 호출 우회 대비 `student.bulkCreate` 전용 재검증 강화. 단건 `createStudentInputSchema`는 영향 없음(전용 `bulkCreateStudentItemSchema` 분리). 단건 제약 강화는 별도 BUGFIX P2 "입력 검증 강화".

| 필드 | 제약 | 근거 |
|---|---|---|
| societyName | `min(1).max(50)` | DB VARCHAR(50) |
| catholicName | `max(50)` | DB VARCHAR(50) |
| age | `int.min(1).max(120)` | 연령 상한 |
| contact | `regex(/^\d+$/).max(15)` | BigInt 변환 + 국제번호 |
| description | `max(500)` | 비고 실사용 범위 |
| groupIds | `array(id).min(1).max(10)` | 10+ 그룹 불가 |
| gender / baptizedAt / registered / students 배열 상한 | 기존 유지 | — |

- Zod 파싱 실패 → `BAD_REQUEST` 400. UseCase/DB 도달 전 차단. 메시지 한글 기본. students 배열 `min(1).max(500)` 기존 유지.
- 클라이언트 사전 검증(`excel-import.ts`) 상한 값과 정렬. 클라 우회 시에만 400 발생.

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 지원하지 않는 파일 형식 | 업로드 차단, 안내 메시지 |
| 빈 파일 / 데이터 행 없음 | 에러 메시지 |
| 500건 초과 | 에러 메시지 (500건 이하로 안내) |
| 필수값(학년, 이름) 누락 행 | 해당 행 에러, 나머지 정상 처리 |
| 학년명 그룹 미매칭 | 해당 행 에러 |
| 성별 값 비표준 | 해당 행 에러 |
| 축일 형식 불일치 | 해당 행 에러 |
| 전체 행 에러 | 등록 버튼 비활성화 |
| 서버 등록 중 일부 실패 | 결과에 성공/실패 건수 표시 |
| ExcelJS 청크 로딩 실패 (네트워크) | 에러 토스트 안내, 모달 상태 유지하여 재시도 가능 |

## 의사결정

| 항목 | 결정 | 근거 |
|------|------|------|
| 파싱 위치 | 클라이언트 | 서버에 파일 전송 불필요, 즉시 미리보기 가능 |
| 컬럼 매핑 방식 | 순서 고정 | 사용자 엑셀이 통일된 형식, 매핑 UI 불필요 |
| 에러 행 처리 | 제외 후 정상 행만 등록 | 전체 롤백보다 부분 성공이 사용자에게 유리 |
| 기존 등록 UX | 유지 | Import는 별도 진입점 (목록 페이지 버튼) |
| 템플릿 생성 방식 | 클라이언트 런타임 생성 | 컬럼 정의와 항상 동기화, 정적 파일 관리 불필요 |
| 엑셀 라이브러리 (로드맵 2단계 — 라이브러리 교체) | **ExcelJS** | xlsx@0.18.5 의 미패치 보안 취약점(Prototype Pollution + ReDoS) 해소. 단일 라이브러리로 read/write, 셀 메모/스타일 직접 지원 |
| 모듈 로드 방식 (로드맵 2단계 — 라이브러리 교체) | **동적 import** | ExcelJS 번들 크기(~250KB gzipped)를 메인 번들에서 분리. 모달 사용자만 1회 로드 후 캐싱 |

## 셀 메모 호환 매핑 (xlsx → ExcelJS)

xlsx 시절 헤더 셀에 부착하던 입력 가이드 메모는 ExcelJS 의 동등한 API 로 매핑한다.

| 항목 | xlsx | ExcelJS |
|------|------|---------|
| 메모 본문 | `cell.c = [{ a, t }]` | `cell.note = '...'` (또는 rich text 객체) |
| 헤더 스타일 | `cell.s = { fill, font, alignment }` | `cell.fill`, `cell.font`, `cell.alignment` |
| 컬럼 너비 | `worksheet['!cols'] = [{ wch }]` | `worksheet.columns = [{ width }]` |
| 시트 추가 | `XLSX.utils.book_append_sheet` | `workbook.addWorksheet(name)` |
| 파일 쓰기 | `XLSX.writeFile` | `await workbook.xlsx.writeBuffer()` → `Blob` 다운로드 |
| 파일 읽기 | `XLSX.read(buffer, { type: 'array' })` | `await workbook.xlsx.load(arrayBuffer)` |

> 시각 차이가 발생할 수 있는 항목(메모 마진/폰트 기본값)은 동작 호환만 보장하고 PR 본문에 결과 비교를 첨부한다.

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 양식 다운로드 → 엑셀에서 모든 컬럼 입력 → 업로드 → 미리보기 전체 성공 → 등록 N건 성공
2. **TC-2**: 9컬럼 누락된 8컬럼 엑셀 업로드 → registered 가 모두 false 로 등록

### 예외 케이스

1. **TC-E1**: 필수값(학년/이름) 누락 행 포함 → 해당 행 에러 표시, 정상 행만 등록 가능
2. **TC-E2**: 학년명 그룹 미매칭 행 포함 → 해당 행 에러 + 사용 가능 학년 안내
3. **TC-E3**: 500건 초과 → 등록 차단 + 안내
4. **TC-E4**: ExcelJS 청크 로딩 실패 → 에러 토스트, 모달 유지
5. **TC-E5~E10** (서버측 재검증): `societyName` 51자/`contact` 비숫자/`groupIds` []·11개/`age` 0·121/`description` 501자 각각 400, 정상 페이로드 회귀 없음

---

**상태**: 구현 완료 (ExcelJS 라이브러리 교체 + 서버측 재검증 강화)
