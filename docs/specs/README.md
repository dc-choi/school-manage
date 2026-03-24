# Specs Index

이 문서는 SDD(Spec-Driven Development) 문서의 인덱스입니다.

## 문서 현황 요약

| 분류                        | 완성도  | 상세                                                            |
|---------------------------|------|---------------------------------------------------------------|
| **Current Functional**    | 100% | 10개 도메인 기능 설계에 통합 + 계정 모델 전환 + 학년/부서 그룹핑 + 게스트 대시보드 + 도네이션 링크 + 도네이션 게스트 접근 완료 |
| **Target Functional**     | -    | 6건 미착수 |
| **Target Bugfix**         | -    | 5건 미착수 (P1 2건, P2 2건, P3 1건) |
| **Target Non-Functional** | -    | PERFORMANCE 1건 미작성 + DX 1건 완료 |

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
| P1 | 학생 추가 필드 | 미착수 | 부모님 연락처, 생년월일 필드 추가 (성남동·흑석동 2곳 반복 피드백) |
| P1 | 출석부 UI 개편 | 미착수 | 출석부 UI 전면 개편 (다수 피드백). 범위 정의 필요 |
| P1 | 출석 페이지 전체 그룹 학생 확인 | 미착수 | 출석 페이지에서 전체 그룹 학생 조회. "빠른 조회" 핵심 가치 직결 |
| P2 | NFC 출석 유료 파일럿 | 미착수 | 소수 본당에서 NFC 출석 검증. 하드웨어 의존 |
| P2 | 축일 관리 | 미착수 | 이번달/다음달 축일자 명단. 기존 전례력에 결합 (3단계 선행) |
| P2 | 조직/권한 세분화 | 미착수 | 교리교사 역할 세분화, 선생님 명단 관리 (수색 피드백, 3단계 선행) |

**의존성 체인:**
- 행사 메모 카드: 계정 모델 전환 완료 + 수요 검증 2곳 후 등록 (`docs/brainstorm/2026-02-23.md`)

**SDD 문서 작성 시 경로:**
- Task: `docs/specs/target/functional/tasks/{name}.md`
- Development: `docs/specs/target/functional/development/{name}-{role}.md` (role: backend, frontend, design)

### PERFORMANCE (Non-Functional)

| 우선순위 | 기능명                       | SDD 상태 | 비고                                                       |
|------|---------------------------|--------|---------------------------------------------------------|
| P2   | 웹 테스트 확대                 | 미작성    | 커버리지 ~2% → 주요 페이지/훅 테스트 추가                               |

### BUGFIX

| 우선순위 | 기능명 | SDD 상태 | 비고 |
|---------|--------|----------|------|
| P1 | TRPCError 삼킴 — catch 블록 패턴 누락 | 미착수 | 7개 UseCase catch 블록에서 `if (e instanceof TRPCError) throw e` 누락. FORBIDDEN이 INTERNAL_SERVER_ERROR로 변환됨 |
| P1 | RefreshToken createdAt UTC/KST 불일치 | 미착수 | 4개 auth UseCase에서 `new Date()` 사용. `getNowKST()` 통일 필요 |
| P2 | ApproveJoinUseCase TOCTOU 레이스 컨디션 | 미착수 | PENDING 확인이 트랜잭션 밖. 동시 승인 시 중복 처리 가능 |
| P2 | Attendance 테이블 인덱스 누락 | 미착수 | studentId, date 인덱스 없음. 데이터 증가 시 성능 저하 |
| P3 | Attendance 중복 레코드 방지 | 미착수 | (studentId, date) 유니크 제약 부재. 트랜잭션 내이므로 위험도 낮음 |

### DX (Non-Functional)

| 우선순위 | 기능명                       | SDD 상태 | 비고                                                       |
|------|---------------------------|--------|---------------------------------------------------------|
| P2   | Stitch MCP 서버 연동          | ✅ 완료   | `.mcp.json` 설정 추가. Claude Code에서 Stitch MCP 프록시 연동 |

**Stitch MCP 서버 연동:**
- Google Stitch: AI 기반 UI 디자인 도구 (텍스트→UI+HTML/CSS)
- MCP 서버/SDK로 Claude Code 연동 가능
- SDD 2단계(기능 설계) 와이어프레임 자동화 목적
- 3단계 이후 새 도메인 UI 설계 시 본격 활용 예정

---

## Templates

### 작성자 (PRD/기능 설계/SDD)

| 문서 유형       | 경로                                          |
|-------------|---------------------------------------------|
| PRD         | `docs/specs/templates/prd.md`               |
| 기능 설계       | `docs/specs/templates/functional_design.md` |
| Task        | `docs/specs/templates/task.md`              |
| Development | `docs/specs/templates/development.md`       |

