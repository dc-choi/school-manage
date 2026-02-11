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

| 단계 | 담당        | 설명                        |
|----|-----------|---------------------------|
| 0  | 작성자       | 작업 선택 → README.md 등록      |
| 1  | 작성자 → 검수자 | PRD 작성 → 검수               |
| 2  | 작성자 → 검수자 | 기능 설계 작성 → 검수             |
| 3  | 작성자 → 검수자 | Task (역할별) 작성 → 검수        |
| 4  | 작성자 → 검수자 | Development (역할별) 작성 → 검수 |
| 5  | 작성자       | 구현 + 테스트                  |
| 6  | 검수자       | 정적 분석/최종 리뷰               |
| 7  | 검수자       | 문서 이동 + 프로젝트 현황 동기화       |

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
3. 검수자 핸드오프 출력

### /sdd 2 - 기능 설계 작성
1. `docs/specs/templates/functional_design.md` 참조
2. 기능 설계 문서 작성
3. 검수자 핸드오프 출력

### /sdd 3 - Task 작성 (역할별)
1. `docs/specs/templates/task.md` 참조
2. Task 문서 작성 (백엔드 B1, B2... / 프론트엔드 F1, F2... / 디자이너 D1, D2...)
3. 검수자 핸드오프 출력

### /sdd 4 - Development 작성 (역할별)
1. `docs/specs/templates/development.md` 참조
2. Development 문서 작성 (`{name}-backend.md`, `{name}-frontend.md`, `{name}-design.md`)
3. 검수자 핸드오프 출력

### /sdd 5 - 구현
1. Development 문서 기준 코드 작성
2. 테스트 작성 및 실행
3. /sdd 6 - 정적 분석을 위한 검수자 핸드오프 출력

### /sdd 6 - 정적 분석
1. `pnpm lint:fix && pnpm prettier:fix`
2. `pnpm typecheck`
3. `pnpm build`
4. 리뷰 문서 작성

### /sdd 7 - 문서 이동 + 현황 동기화
1. target → current 이동
2. 경로 참조 업데이트
3. README.md 인덱스 갱신
4. PRD/기능 설계 상태 갱신

### /sdd status - 현황 확인
1. 현재 진행 중인 작업 확인
2. 완료된 단계 표시
3. 다음 단계 안내

## 참조 문서

- 상세 워크플로우: `docs/specs/WORKFLOW.md`
- 템플릿: `docs/specs/templates/`
- 규칙: `.claude/rules/specs.md`
