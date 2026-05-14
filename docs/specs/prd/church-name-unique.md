# PRD: 본당(Church) 이름 중복 방지

> 상태: Draft | 작성일: 2026-05-14

> SDD 작성자가 작성하는 제품 요구사항 문서입니다.
> 출처: `docs/specs/README.md` BUGFIX TARGET — C-1+C-2 (2026-05-13 코드 헌트) + C-3 묶음 결정.

## 배경/문제 요약

- 참고: `docs/specs/README.md` BUGFIX 섹션, `docs/business/STATUS.md`
- 문제:
    - `create-church.usecase.ts`는 본당 생성 시 `name` 문자열 **완전 일치**로만 중복을 검사한다. 공백 위치/개수만 다른 입력("반포동성당" vs "반포동 성당" vs "반포동 성당 ")이 모두 다른 본당으로 취급되어 사실상 같은 본당이 중복 생성된다.
    - 단, "반포동성당"과 "반포4동성당"처럼 **글자 자체가 다른** 본당은 실제로 별개의 본당이다. 정규화는 공백만 제거하므로 글자가 다르면 항상 별개로 남는다(유사명 병합 안 함).
    - DB에 unique 제약이 없어 트랜잭션 검사만으로는 동시 요청 시 race condition으로 중복 행이 생길 수 있다.
    - `Church.deletedAt`으로 soft-delete된 잔여 행이 누적되어 있어 이름 슬롯/검색 정합성을 흐린다.
- 현재 상태: `Church` 모델에 `(parishId, name)` unique 제약 없음. 입력 정규화 없음. soft-deleted 행 잔존.
- 목표 상태: 교구 내에서 정규화된 본당명이 유일하도록 DB 레벨로 보장. soft-deleted Church 행은 물리 삭제하여 정리.

## 목표/성공 기준

- **목표**: 같은 교구(Parish) 안에서 정규화 기준으로 동일한 본당명이 두 번 생성되지 않게 한다.
- **성공 지표**:
    - 정규화 후 동일한 이름으로 본당 생성 시도 시 100% `CONFLICT` 반환
    - 동시 생성 요청에서도 중복 행 0건 (DB unique 제약으로 보장)
    - 마이그레이션 후 `church` 테이블에 `delete_at IS NOT NULL` 행 0건
- **측정 기간**: 마이그레이션 적용 직후 1회 검증 + 이후 운영 상시

## 사용자/대상

- **주요 사용자**: 본당 등록을 수행하는 가입자/운영자 (조직 생성 플로우 진입자)
- **사용 맥락**: 신규 모임 생성 시 본당을 검색하고, 없으면 새로 등록하는 단계

## 범위

### 포함

- `Church` 모델에 정규화 이름 컬럼(`normalizedName`) 추가 + `@@unique([parishId, normalizedName])`
- 입력 정규화 유틸(trim + 공백 압축) 신규 작성 — `@school/utils`
- `create-church.usecase.ts`: 정규화 값으로 중복 검사 + `normalizedName` 저장, DB 제약 위반(P2002) → `CONFLICT` 매핑
- `search-churches.usecase.ts`: 검색어 정규화 적용 (검색 일관성)
- 마이그레이션: 기존 행 `normalizedName` 백필 + **soft-deleted Church 행 물리 삭제** (C-3 결정)

### 제외

- `Organization` / `Parish` 이름 중복 방지 (별도 TARGET 필요 시)
- 본당명 수정(update) API — 현재 존재하지 않음
- soft-deleted Church의 복원(restore) 흐름

## 사용자 시나리오

1. **공백 변형 중복**: 운영자가 "반포동성당"을 등록한 뒤 다른 운영자가 "반포동 성당", "반포동 성당 " 등 공백만 다른 이름을 등록 시도 → 공백 제거 후 동일하면 `CONFLICT` 안내.
2. **동시 등록**: 두 운영자가 같은 본당명을 거의 동시에 등록 → 한 건만 성공, 나머지는 DB unique 제약으로 차단되어 `CONFLICT`.
3. **검색 정합**: 검색창에 앞뒤 공백을 포함해 입력해도 정규화되어 동일 결과 반환.

## 요구사항

### 필수 (Must)

- [ ] `Church`에 `normalizedName` 컬럼 추가, `@@unique([parishId, normalizedName])` 제약
- [ ] 정규화 유틸: 모든 공백 문자 제거(`replace(/\s+/g, '')`). 공백 위치/개수만 다르면 동일 본당으로 간주
- [ ] 생성 시 `normalizedName` 저장 + 정규화 기준 중복 검사
- [ ] DB unique 위반(Prisma P2002)을 `TRPCError CONFLICT('이미 존재하는 본당명입니다.')`로 매핑 (race condition 방어)
- [ ] 마이그레이션에서 기존 모든 Church 행 `normalizedName` 백필
- [ ] 마이그레이션에서 `delete_at IS NOT NULL`인 Church 행 물리 삭제

### 선택 (Should)

- [ ] `search-churches.usecase.ts` 검색어에도 동일 정규화 적용

### 제외 (Out)

- 대소문자 폴딩 / 전각·반각 정규화 (한글 본당명 특성상 불필요, 필요 시 후속)
- 유사명 fuzzy 매칭 / 자동 병합 — 공백 외 글자가 하나라도 다르면 항상 별개 본당으로 취급("반포동성당" ≠ "반포4동성당")

## 제약/가정/리스크/의존성

- **제약**: DB는 MySQL. Prisma는 표현식 인덱스를 지원하지 않으므로 정규화 값은 **물리 컬럼**으로 저장해야 unique 제약 적용 가능.
- **가정**: 현재 운영 DB의 활성 Church 중 정규화 후 충돌하는 행은 없거나 소수다 (마이그레이션 전 점검 필요).
- **리스크**:
    - 백필 후 정규화 기준 중복이 이미 존재하면 unique 제약 생성이 실패 → 마이그레이션 전 수동 점검/병합 필요.
    - soft-deleted Church 물리 삭제 시 해당 Church를 참조하는 `organization` 행이 남아 있으면 FK 위반 → 종속 행 처리 정책 필요 (오픈 이슈).
- **내부 의존성**: `/prisma-migrate` 스킬로 수동 SQL 마이그레이션 작성 (스키마 변경 hook 보호 대상).
- **외부 의존성**: 없음.

## 롤아웃/검증

- **출시 단계**: 단일 마이그레이션 + 백엔드 배포. 프론트엔드 변경 없음(에러 메시지 기존 재사용).
- **이벤트**: GA4 이벤트 없음 | **검증**: 마이그레이션 후 `SELECT count(*) FROM church WHERE delete_at IS NOT NULL` = 0, 중복 생성 시도 시 `CONFLICT` 수동 확인.

## 오픈 이슈

- [x] 정규화 규칙 확정: 모든 공백 문자 제거. 공백 위치/개수만 다르면 동일 본당. 글자가 다르면 항상 별개(유사명 병합 안 함).
- [ ] soft-deleted Church를 물리 삭제할 때 종속 `organization` 행 처리: (a) 종속 행 없는 Church만 삭제 / (b) 종속 행도 함께 정리. 운영 DB 실데이터 점검 후 결정.
- [ ] 활성 Church 중 정규화 충돌 행이 존재하는 경우의 수동 병합 절차.

## 연결 문서

- 사업 문서: `docs/specs/README.md` BUGFIX TARGET (C-1+C-2+C-3), `docs/business/STATUS.md`
- 기능 설계: `docs/specs/functional-design/church-name-unique.md` (다음 단계에서 작성)
