---
name: sdd
description: SDD 워크플로우 단계별 실행
---

# /sdd

Spec-Driven Development 워크플로우를 단계별로 실행합니다.

## 사용법

```
/sdd [단계번호]
/sdd status
```

## 워크플로우 단계

| 단계 | 설명                           |
|----|------------------------------|
| 0  | 작업 선택 → README.md 등록        |
| 1  | PRD 작성                       |
| 2  | 기능 설계 작성                     |
| 3  | Task (역할별) 작성                |
| 4  | Development (역할별) 작성         |
| 5  | 구현 + 테스트                     |
| 6  | 자동 검증 + 문서 정리 + PR 생성       |

## 단계별 실행

### /sdd 0 - 작업 선택
1. `docs/specs/README.md` 확인
2. `docs/business/6_roadmap/roadmap.md` 로드맵 확인
3. `docs/business/STATUS.md` 현 상태 확인
4. 사업 에이전트 핸드오프의 참고 사업 문서 확인 (문서 경로 + 확인 포인트)
5. TARGET 태스크 목록 출력
6. 작업 선택 및 README.md 등록

### /sdd 1 - PRD 작성
1. `docs/specs/templates/prd.md` 참조
2. PRD 문서 작성
3. 자기 검증 체크리스트 확인

### /sdd 2 - 기능 설계 작성
1. `docs/specs/templates/functional_design.md` 참조
2. 기능 설계 문서 작성
3. 자기 검증 체크리스트 확인

### /sdd 3 - Task 작성 (역할별)
1. `docs/specs/templates/task.md` 참조
2. Task 문서 작성 (백엔드 B1, B2... / 프론트엔드 F1, F2... / 디자이너 D1, D2...)
3. 자기 검증 체크리스트 확인

### /sdd 4 - Development 작성 (역할별)
1. `docs/specs/templates/development.md` 참조
2. Development 문서 작성 (`{name}-backend.md`, `{name}-frontend.md`, `{name}-design.md`)
3. 자기 검증 체크리스트 확인

### /sdd 5 - 구현
1. Development 문서 기준 코드 작성
2. 테스트 작성 및 실행

### /sdd 6 - 자동 검증 + 문서 정리 + PR 생성
1. `pnpm lint:fix && pnpm prettier:fix`
2. `pnpm typecheck`
3. `pnpm build`
4. `pnpm test`
5. 서브에이전트 실행 (해당 시): security-reviewer, design-reviewer, performance-analyzer
6. `target/` → `current/` 문서 이동 (기능적 요구사항만)
7. 프로젝트 현황 동기화 (README.md, docs/specs/README.md 등)
8. PR 생성

### /sdd status - 현황 확인
1. 현재 진행 중인 작업 확인
2. 완료된 단계 표시
3. 다음 단계 안내

## 참조 문서

- 상세 워크플로우: `docs/specs/WORKFLOW.md`
- 템플릿: `docs/specs/templates/`
- 규칙: `.claude/rules/specs.md`
