# Specs Index

이 문서는 SDD(Spec-Driven Development) 문서의 인덱스입니다.

## 문서 현황 요약

| 분류                        | 완성도  | 상세                                                            |
|---------------------------|------|---------------------------------------------------------------|
| **Current Functional**    | 100% | 10개 도메인 기능 설계에 통합 + 계정 모델 전환 + 학년/부서 그룹핑 + 게스트 대시보드 + 도네이션 링크 + 도네이션 게스트 접근 완료 |
| **Target Functional**     | -    | 6건 미착수 |
| **Target Bugfix**         | -    | 5건 미착수 (P2 2건, P3 3건) + 12건 완료 |
| **Target Non-Functional** | -    | PERFORMANCE 2건 미착수 + 5건 완료 + DX 2건 완료 |

## 관련 문서

| 문서                           | 설명                                        |
|------------------------------|-------------------------------------------|
| `.claude/rules/specs.md`     | SDD 워크플로우 + 문서 작성 규칙                      |

---

## PRD & 기능 설계

> **작성자**: SDD 작성자

### PRD (제품 요구사항 문서)

> 22건 전체 Approved (구현 완료). 경로: `docs/specs/prd/`

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
| P1   | 통계 쿼리 전체 메모리 로드          | ✅ 완료    | 4개 UseCase Kysely `GROUP BY` + `SUM(CASE)` 전환. `PRESENT_COUNT_SQL` 헬퍼 추가. 통합 테스트 20/20 통과 |
| P2   | 웹 테스트 확대                 | 미작성    | 커버리지 ~2% → 주요 페이지/훅 테스트 추가                               |
| P2   | Organization 목록 페이지네이션 미구현 | ✅ 완료 | skip/take 페이지네이션 + Pagination 컴포넌트 적용                       |
| P2   | DB connectionLimit 환경변수화 | ✅ 완료    | `MYSQL_CONNECTION_LIMIT` 추가(선택, default 10 — Prisma v7 표준). 검증 1~100. 단위 테스트 8/8 통과 |
| P3   | 프로덕션 쿼리 로깅 비활성화          | ✅ 완료    | `DB_QUERY_LOGGING` 환경변수(off/slow/all) + 슬로우 쿼리 PII 마스킹. 단위 테스트 13/13 통과 |
| P3   | 트랜잭션/쿼리 타임아웃 미설정         | ✅ 완료    | 4종 타임아웃 env 명시화 (`DB_CONNECT_TIMEOUT_MS`/`DB_IDLE_TIMEOUT_SEC`/`DB_TRANSACTION_TIMEOUT_MS`/`DB_TRANSACTION_MAX_WAIT_MS`). 어댑터 암묵 기본값(1s/1800s) 보정, Prisma v6 쿼리엔진 기본값과 매칭. 설계: `docs/specs/functional-design/db-timeout.md` |
| P3   | AuthLayout 이미지 dimensions 누락 | 미착수    | width/height 미설정 → CLS(레이아웃 시프트) 유발. loading="lazy" 추가 권장 |
| P3   | name 컬럼 인덱스 누락 (parish/church/organization) | 미착수 | `WHERE name = ?` 풀 스캔. 데이터 소규모이나 증가 시 성능 저하 |

### BUGFIX

| 우선순위 | 기능명 | SDD 상태 | 비고 |
|---------|--------|----------|------|
| P1 | 학생 수정 시 삭제된 그룹 ID로 FORBIDDEN 에러 | ✅ 완료 | student.get에 deletedAt 필터 추가. 군종교구 피드백 |
| P1 | TRPCError 삼킴 — catch 블록 패턴 누락 | ✅ 완료 | 7개 UseCase catch 블록에 `if (e instanceof TRPCError) throw e` 패턴 추가 완료 |
| P1 | RefreshToken createdAt UTC/KST 불일치 | ✅ 완료 | 5개 파일 8개 지점 `new Date()` → `getNowKST()` 통일 완료 |
| P2 | 마이그레이션 SQL 비멱등성 | 미착수 | `cleanup_orphan_account_groups.sql` hardcoded ID 기반. 재실행 시 주의 필요. 1회성 정리이므로 수용 가능 |
| P2 | ApproveJoinUseCase TOCTOU 레이스 컨디션 | ✅ 완료 | `updateMany(status=PENDING)` 조건부 업데이트로 트랜잭션 내 원자성 확보. 동시 승인 시 1건만 성공, 후속 요청 CONFLICT. 통합 테스트 7/7 통과 (TC-E1 5-way race 포함) |
| P2 | Attendance 테이블 인덱스 누락 | 미착수 | studentId, date 인덱스 없음. 데이터 증가 시 성능 저하 |
| P3 | Attendance 중복 레코드 방지 | 미착수 | (studentId, date) 유니크 제약 부재. 트랜잭션 내이므로 위험도 낮음 |
| P1 | Account.name DB 유니크 제약 미비 | ✅ 완료 | `@unique` + 마이그레이션 SQL + signup P2002 캐치 추가. 활성·탈퇴 전체 적용(탈퇴 name은 restoreAccount 예약). 통합 테스트 237/237 통과 (auth.signup 신규 4건: 정상·앱감지·탈퇴중복·race) |
| P1 | xlsx 라이브러리 보안 취약점 | ✅ 완료 | Prototype Pollution + ReDoS 2건 → ExcelJS 교체 + 동적 import 분리 |
| P1 | 출석 배열 상한 미설정 (DoS) | ✅ 완료 | `.max(500)` 추가. 중복 빈 배열 체크 제거, 테스트 추가 |
| P2 | 로그인 사용자 열거 공격 | ✅ 완료 | `login.usecase.ts` NOT_FOUND/UNAUTHORIZED 분기를 `UNAUTHORIZED` + 통일 메시지로 단일화. 탈퇴 계정+비번 불일치도 통일. 통합 테스트 10/10 통과 (응답 동일성 검증 TC-E3 추가) |
| P2 | 입력 검증 강화 | ✅ 완료 | 출석 `data` 화이트리스트(◎/○/△/-/빈/max 10) + 로그인 `name`(max 50)·`password`(max 128) + 학생 단건 `societyName`·`catholicName`(max 50)·`contact`(`^\d+$`/max 15)·`description`(max 500). 단건/일괄 경로 일관성 확보. 통합 테스트 18건 추가 (api 270/270 통과) |
| P2 | 서버측 Excel 파일 재검증 없음 | ✅ 완료 | `bulkCreateStudentItemSchema` 신규(독립). societyName/catholicName max 50, age 1-120, contact `^\d+$` max 15, description max 500, groupIds 1-10. 한글 에러 메시지. 통합 테스트 TC-E5~E10 8건 추가. 단건 경로 무영향 |
| P3 | Rate Limit 문서/코드 불일치 | ✅ 완료 | 코드 주석 200회/분 정합 + `rules/api.md` Rate Limiting 정책 섹션 신설 (전체 200/분, 인증 10/분) |
| P3 | StudentGroup deletedAt 미비 | 미착수 | soft-delete 컬럼 없음. 학생 삭제 시 관계 레코드 잔존 |
| P3 | HTTP 응답 상태코드 일률 200 | ✅ 완료 | tRPC `responseMeta`로 첫 에러 `data.httpStatus` 매핑(단일/배치 공통). 에러 미들웨어 단순화 + `ApiError`/`ApiCode`/`ApiMessage` dead code 제거. 통합 테스트 8건 추가(TC-1~5, TC-E1~E2). 클라이언트 silent refresh 정상 동작 |
| P3 | Express 4.x qs DoS 취약점 | 미착수 | express > qs 저심각도 취약점. Express 5.x 업그레이드로 해결 |

### DX (Non-Functional)

| 우선순위 | 기능명                       | SDD 상태 | 비고                                                       |
|------|---------------------------|--------|---------------------------------------------------------|
| P2   | Stitch MCP 서버 연동          | ✅ 완료   | `.mcp.json` 설정 추가. Claude Code에서 Stitch MCP 프록시 연동 |
| P1   | 통합테스트 실제 DB 전환       | ✅ 완료   | mock 전면 제거 → Docker MySQL + 실제 DB 기반 통합테스트. Prisma 공식 가이드 준수 |

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

