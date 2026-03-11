# Task: 학생 등록 관리

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.
> 기능 설계의 요구사항을 **역할별 구현 가능한 단위로 분할**합니다.

## 상위 문서

- PRD: `docs/specs/prd/student-registration.md`
- 기능 설계: `docs/specs/functional-design/student-management.md` (학생 등록 관리 섹션)

## 목표

학생의 연도별 등록 이력을 관리할 수 있다. 학생 목록에서 일괄 등록/취소가 가능하고, 엑셀 Import 시 등록 여부 컬럼으로 생성과 등록을 동시에 처리할 수 있다.

## 범위

### 포함
- [x] Registration 테이블 (Prisma 스키마 + 마이그레이션)
- [x] 일괄 등록/취소 API (`bulkRegister`, `bulkCancelRegistration`)
- [x] `student.list` 등록 필터 + 등록 현황 요약
- [x] `student.bulkCreate` 등록 여부 필드 추가
- [x] 학생 목록 UI: 등록 필터, 등록/취소 버튼, 현황 요약
- [x] 엑셀 Import: 9번째 컬럼 "등록 여부" + 템플릿 갱신
- [x] GA4 이벤트 (`student_registration`, `student_registration_cancel`)

### 제외
- [ ] 전자서명/결제 연동
- [ ] 학생 상세 페이지 등록 이력 표시 (Should — 이번 스프린트 제외)

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | Registration 모델 정의 | Prisma 스키마에 Registration 모델 추가 (studentId + year 유니크), 수동 마이그레이션 SQL 작성 | 없음 |
| B2 | tRPC 스키마 정의 | `bulkRegister`, `bulkCancelRegistration` 입출력 스키마 + `student.list` 등록 필터 파라미터 + `bulkCreate` registered 필드 추가 | 없음 |
| B3 | 일괄 등록 UseCase | `BulkRegisterStudentsUseCase`: studentId + year로 upsert, 이미 등록된 학생 건너뜀, registeredCount 반환 | B1 |
| B4 | 일괄 등록 취소 UseCase | `BulkCancelRegistrationUseCase`: studentId + year 매칭 레코드 소프트 삭제 (delete_at 설정), cancelledCount 반환 | B1 |
| B5 | student.list 등록 필터 + 현황 요약 | ListStudentsUseCase에 registered/registrationYear 필터 추가, Registration LEFT JOIN, registrationSummary 응답 추가 | B1 |
| B6 | bulkCreate 등록 연동 | BulkCreateStudentsUseCase에서 registered=true인 학생의 Registration 레코드 동시 생성 (트랜잭션) | B1 |
| B7 | 라우터 등록 | student.router에 `bulkRegister`, `bulkCancelRegistration` 프로시저 추가 | B2, B3, B4 |

**Development**: `docs/specs/target/functional/development/student-registration-backend.md`

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | tRPC 클라이언트 훅 | `useStudents`에 `bulkRegister`, `bulkCancelRegistration` 뮤테이션 추가, list 쿼리에 등록 필터 파라미터 추가 | B7 완료 후 |
| F2 | 등록 필터 UI | 학생 목록에 등록 필터 셀렉트 추가 (전체/등록/미등록), 기존 삭제 필터 옆에 배치 | F1 |
| F3 | 등록 현황 요약 UI | 목록 상단에 "2026년 등록 현황: 등록 N명 / 미등록 M명" 표시 | F1 |
| F4 | 일괄 등록/취소 버튼 | 체크박스 선택 시 "등록" / "등록 취소" 버튼 표시 + 확인 다이얼로그, 기존 bulkDelete/graduate 패턴 재활용 | F1 |
| F5 | 등록 상태 테이블 컬럼 | 학생 목록 테이블에 "등록" 컬럼 추가 (배지 또는 아이콘으로 표시) | F1 |
| F6 | 엑셀 Import 등록 컬럼 | excel-import 파서에 9번째 "등록 여부" 컬럼 파싱 + O/X 정규화, excel-template에 컬럼 추가 | 없음 |
| F7 | GA4 이벤트 | `student_registration`, `student_registration_cancel` 이벤트 추가 | F4 |

**Development**: `docs/specs/target/functional/development/student-registration-frontend.md`

---

## 업무 의존성 다이어그램

```
[B1 스키마] ──┬──▶ [B3 등록 UC] ──┐
              ├──▶ [B4 취소 UC] ──┼──▶ [B7 라우터] ──▶ [F1 훅] ──┬──▶ [F2 필터]
              ├──▶ [B5 목록 필터]  │                              ├──▶ [F3 현황]
              └──▶ [B6 생성 연동]  │                              ├──▶ [F4 버튼] ──▶ [F7 GA4]
                                  │                              └──▶ [F5 컬럼]
[B2 스키마] ──────────────────────┘

[F6 엑셀] (독립)
```

---

## 검증 체크리스트

### 기능 검증
- [ ] 모든 역할의 업무가 완료되었는가?
- [ ] 역할 간 의존성이 충족되었는가?
- [ ] 기존 기능(학생 목록, 엑셀 Import)에 영향이 없는가?

### 요구사항 추적

| PRD Must 요구사항 | 업무 매핑 |
|-----------------|---------|
| Registration 테이블 | B1 |
| 학생 목록 등록 상태 표시 | F5 |
| 체크박스 → 일괄 등록 | B3, B7, F4 |
| 등록 취소 (일괄) | B4, B7, F4 |
| 등록/미등록 필터링 | B5, F2 |
| 등록 현황 요약 | B5, F3 |
| 엑셀 "등록 여부" 컬럼 | B6, F6 |
| 엑셀 입력값 정규화 (O/X) | F6 |
| 엑셀 템플릿 갱신 | F6 |
| GA4 이벤트 | F7 |

---

**작성일**: 2026-03-10
**상태**: Draft
