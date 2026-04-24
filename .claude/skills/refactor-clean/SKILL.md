---
name: refactor-clean
description: knip/depcheck/ts-prune로 데드 코드를 식별하고 안전하게 제거한다. /refactor-clean으로 호출. SDD 진행 중이거나 PR 직전에는 사용 금지.
origin: affaan-m/everything-claude-code@4e66b28 (commands/refactor-clean.md + docs/ko-KR/agents/refactor-cleaner.md 합성)
adapted: 2026-04-24 (school_back: pnpm dlx + SDD 관계 명시)
---

# Refactor Clean

모든 단계마다 테스트를 통과시키면서 데드 코드를 안전하게 제거한다.

## 사용하지 말아야 할 때

- SDD 5단계(구현) 진행 중 — 새 코드가 만들어지는 동안 정리는 혼란 유발
- PR 직전 — 리뷰어가 본 diff와 달라짐
- 테스트 커버리지가 낮을 때 — 안전망 없음
- 이해하지 못하는 코드 — 먼저 `code-explorer`나 `/codebase-onboarding` 실행

## 1단계: 데드 코드 감지

TypeScript 모노레포용 도구를 병렬 실행:

| 도구 | 찾는 대상 | 명령 |
|------|---------|------|
| knip | 미사용 export, 파일, 의존성 | `pnpm dlx knip` |
| depcheck | 미사용 npm 의존성 | `pnpm dlx depcheck` |
| ts-prune | 미사용 TypeScript export | `pnpm dlx ts-prune` |

도구가 부족하면 Grep으로 import 없는 export 직접 탐지.

## 2단계: 발견 항목 분류

안전성 기준으로 3-tier 분류:

| Tier | 예시 | 액션 |
|------|------|------|
| **SAFE** | 미사용 유틸, test helper, 내부 함수 | 자신감 있게 삭제 |
| **CAUTION** | 컴포넌트, tRPC procedure, middleware | 동적 import/외부 참조 검증 후 삭제 |
| **DANGER** | 설정 파일, 진입점, 타입 정의 | 건드리기 전 조사 |

## 3단계: SAFE 루프 (한 번에 하나씩)

각 SAFE 항목마다:

1. `pnpm test` 실행 — 기준 그린 확인
2. Edit 툴로 정확히 해당 코드만 삭제
3. `pnpm test` 재실행
4. 실패하면 즉시 `git checkout -- <file>` 복구 후 skip
5. 성공하면 다음 항목으로

## 4단계: CAUTION 처리

삭제 전 추가 확인:
- 동적 import 검색: `import()`, `require()`
- 문자열 참조 검색: 라우트 이름, 컴포넌트 이름이 설정에 박혀있지 않은지
- 공개 패키지 API에서 export 되는지 (`packages/shared/src/index.ts` 등)
- 외부 소비자 검증 (필요시)

## 5단계: 중복 통합

데드 코드 제거 후:
- >80% 유사한 유사-중복 함수 → 하나로 병합
- 중복 타입 정의 → 통합
- 가치 없는 wrapper 함수 → inline
- 의미 없는 re-export → 제거

## 6단계: 요약 리포트

```
데드 코드 정리
──────────────────────────────
삭제: 미사용 함수 12개
      미사용 파일 3개
      미사용 의존성 5개
건너뜀: 2건 (테스트 실패)
감소: ~450줄
──────────────────────────────
모든 테스트 통과 ✓
```

## 핵심 원칙

- **테스트 먼저** — 기준 없이 삭제 금지
- **한 번에 하나** — atomic change로 롤백 쉽게
- **의심스러우면 skip** — 데드 코드 유지 > 프로덕션 파손
- **정리 중 리팩터 금지** — 관심사 분리 (정리 먼저, 리팩터 나중)
- **SDD와 분리된 사이클로** — 기능 개발 사이클과 섞지 말 것

## SDD와의 관계

`/sdd`는 기능 추가 워크플로우. 본 스킬은 기능이 완료되고 머지된 **이후** 정기적으로 돌리는 유지보수 사이클.
권장 주기: 주요 기능 머지 후 1~2주 뒤, 또는 분기별 스프린트 마감.
