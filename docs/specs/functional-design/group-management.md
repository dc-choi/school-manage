# 기능 설계: 학년 관리

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`

## 흐름/상태

```
[학년 목록] → (학년 클릭) → [학년 상세] → (인라인 수정) → [학년 상세]
[학년 상세] → (출석 현황) → [출석 현황 화면]
[학년 목록] → (학년 추가) → [학년 생성 완료] → [학년 목록]
[학년 목록] → (다중 선택 + 일괄 삭제) → [소프트 삭제] → [학년 목록]
```

## UI/UX

| 화면 | 주요 요소 |
|------|----------|
| 학년 목록 | 테이블(체크박스, 학년명, 학생 수, 생성일), 추가 버튼, 일괄 삭제 |
| 학년 상세 | 학년명(인라인 수정), 학생 목록, 출석 현황 링크 |
| 학년 추가 | 학년명 입력, 저장 |

> 페이지네이션: 현재 전체 로드 (계정당 학년 10개 이내). 도입 시 `/groups?page=N` 패턴 적용.

---

## 데이터: Group 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | bigint (PK) | 고유 식별자 |
| name | varchar(50) | 학년명 |
| account_id | bigint (FK) | 소속 계정 |
| create_at / update_at / delete_at | datetime | 생성/수정/삭제일시 |

## API

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `group.list` | query | 목록 조회 |
| `group.get` | query | 상세 조회 (학생 목록 포함) |
| `group.create` | mutation | 생성 |
| `group.update` | mutation | 수정 (인라인) |
| `group.delete` | mutation | 삭제 (소프트) |
| `group.bulkDelete` | mutation | 일괄 삭제 |
| `group.attendance` | query | 출석 현황 조회 |

## 비즈니스 로직

| 기능 | 동작 요약 |
|------|----------|
| 목록 | accountId 기준 deletedAt=null 조회 |
| 상세 | groupId 조회 + 소속 학생 목록, 미존재 시 404 |
| 생성 | name + account_id |
| 일괄 삭제 | 존재하는 학년만 소프트 삭제, deletedCount 반환 |
| 출석 현황 | groupId + year → 주일/토요일 날짜 + 학생 + 출석 데이터 |

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 잘못된 groupId / 학년명 누락 | 400 BAD_REQUEST |
| 존재하지 않는 학년 | 404 NOT_FOUND |
| 토큰 누락 | 401 UNAUTHORIZED |
| 일괄 삭제 빈 배열 | 400 BAD_REQUEST |
| 일괄 삭제 일부 없음 | 존재하는 학년만 삭제 |

## 권한/보안

- 모든 API: Bearer 토큰 필수
- 계정 소유권 검증 미구현 → TARGET 등록 (`auth-ownership-validation`)

---

**작성일**: 2026-01-13
**수정일**: 2026-02-24 (문서 축약)
**작성자**: PM 에이전트
**상태**: Approved (구현 완료)
