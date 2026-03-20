# Specs Index

이 문서는 SDD(Spec-Driven Development) 문서의 인덱스입니다.

## 문서 현황 요약

| 분류                        | 완성도  | 상세                                                            |
|---------------------------|------|---------------------------------------------------------------|
| **Current Functional**    | 100% | 10개 도메인 기능 설계에 통합 + 계정 모델 전환 + 학년/부서 그룹핑 + 게스트 대시보드 + 도네이션 링크 + 도네이션 게스트 접근 완료 |
| **Target Functional**     | 50%  | 출석 인원 분리 표시 미착수, 학생 검색 개선 완료 |
| **Target Non-Functional** | -    | PERFORMANCE 2건 미착수, 2건 완료 + SEO 2건 완료 |

## 관련 문서

| 문서                           | 설명                                        |
|------------------------------|-------------------------------------------|
| `.claude/rules/specs.md`     | SDD 워크플로우 + 문서 작성 규칙                      |

---

## PRD & 기능 설계

> **작성자**: SDD 작성자

### PRD (제품 요구사항 문서)

> 21건 전체 Approved (구현 완료). 경로: `docs/specs/prd/`

### Functional Design (기능 설계)

> 16개 도메인 문서 전체 구현 완료. 경로: `docs/specs/functional-design/`
> **병합 규칙**: 도메인별 단일 문서 관리. 상세: `.claude/rules/specs.md`

---

> **SSoT**: 구현 완료된 기능의 진실 원천은 **기능 설계 문서 + 코드베이스**. Task/Development는 구현 완료 후 삭제.

---

## TARGET (구현 예정)

> 개선/이행 예정인 기능입니다.
> 경로: `docs/specs/target/`

### FUNCTIONAL (로드맵 2단계 — 유저 확장 + 가톨릭 특화)

| 우선순위 | 기능명 | SDD 상태 | 비고 |
|---------|--------|----------|------|
| P1 | 출석 인원 분리 표시 | 미착수 | 달력 뷰에서 미사/교리 인원 별도 표시 |
| P1 | 학생 검색 개선 | ✅ 완료 | 통합 검색(OR, startsWith) + 드롭다운 제거 + X 클리어 |

**의존성 체인:**
- 행사 메모 카드: 계정 모델 전환 완료 + 수요 검증 2곳 후 등록 (`docs/brainstorm/2026-02-23.md`)

### 보류 (Hold)

> 현재 보류 항목 없음

**SDD 문서 작성 시 경로:**
- Task: `docs/specs/target/functional/tasks/{name}.md`
- Development: `docs/specs/target/functional/development/{name}-{role}.md` (role: backend, frontend, design)

### PERFORMANCE (Non-Functional)

| 우선순위 | 기능명                       | SDD 상태 | 비고                                                       |
|------|---------------------------|--------|---------------------------------------------------------|
| P2   | 웹 테스트 확대                 | 미작성    | 커버리지 ~2% → 주요 페이지/훅 테스트 추가                               |
| P2   | 졸업 처리 배치 쿼리 최적화       | ✅ 완료   | GraduateStudentsUseCase N+1 쿼리 → updateMany 리팩토링           |
| P2   | 학생 목록 이중 쿼리 최적화       | 미착수    | StudentListPage 졸업 처리 시 active/graduated 두 훅이 각각 invalidate → 2회 API 호출 |
| P2   | prisma-kysely 도입          | ✅ 완료   | raw query 6건 → Kysely 타입 세이프 쿼리 전환 |

### SEO (Non-Functional)

| 우선순위 | 기능명                       | SDD 상태 | 비고                                                       |
|------|---------------------------|--------|---------------------------------------------------------|
| P1   | 공개 페이지 SEO 개선            | ✅ 완료   | JSON-LD + 동적 Meta + Canonical + sitemap 갱신 + 검색엔진 인증 |
| P1   | SEO 키워드 최적화              | ✅ 완료   | 전 페이지 title "주일학교 출석부" 통일 + description에 가톨릭/천주교 키워드 |

**공개 페이지 SEO 개선:** ✅ 완료
- JSON-LD 구조화 데이터 (FAQPage, Organization, WebApplication)
- 페이지별 동적 meta tags (`@dr.pogodin/react-helmet`)
- Canonical URL, sitemap에 /donate 추가, OG image 절대 경로
- 네이버 서치어드바이저 + 다음 웹마스터 인증
- 프리렌더링은 Puppeteer 의존성 부담으로 보류

**웹 테스트 확대:**
- 현재 API 통합 테스트 6개 + 유틸 테스트 4개만 존재
- 웹 컴포넌트/훅 테스트 거의 없음 (~2% 커버리지)

**졸업 처리 배치 쿼리 최적화:** ✅ 완료
- updateMany + createMany로 N+1 → 2쿼리 최적화 (졸업 처리/취소 모두)

**학생 목록 이중 쿼리 최적화:**
- StudentListPage에서 재학생/졸업생 두 개의 `useStudents` 훅 사용
- 졸업 처리/취소 시 `utils.student.list.invalidate()`가 양쪽 훅 모두 트리거 → 2회 API 호출
- 단일 쿼리 + 클라이언트 필터링 또는 선택적 invalidation으로 개선 가능

---

## Templates

### 작성자 (PRD/기능 설계/SDD)

| 문서 유형       | 경로                                          |
|-------------|---------------------------------------------|
| PRD         | `docs/specs/templates/prd.md`               |
| 기능 설계       | `docs/specs/templates/functional_design.md` |
| Task        | `docs/specs/templates/task.md`              |
| Development | `docs/specs/templates/development.md`       |

