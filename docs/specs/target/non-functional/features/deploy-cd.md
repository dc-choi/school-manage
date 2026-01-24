# Feature: CD 파이프라인 (모노레포 변경 감지 배포)

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 상위 문서

- PRD: 해당 없음 (Non-Functional)
- 기능 설계: 해당 없음 (Non-Functional)

## 개요

main 브랜치에 push 시 변경된 앱(API/Web)만 자동으로 배포하는 CD 파이프라인을 구축한다.

## 배경

- 수동 배포는 번거롭고 실수 가능성이 높음
- 모노레포 구조에서 변경되지 않은 앱까지 배포하면 비효율적
- packages 변경 시 의존하는 모든 앱이 배포되어야 함

## 사용자 스토리

### US-1: 변경된 앱만 자동 배포
- **사용자**: 개발자
- **원하는 것**: main 브랜치에 push하면 변경된 앱만 자동 배포
- **이유**: 배포 시간 단축 및 불필요한 배포 방지

### US-2: packages 변경 시 전체 배포
- **사용자**: 개발자
- **원하는 것**: packages 변경 시 API와 Web 모두 자동 배포
- **이유**: 공유 코드 변경이 모든 앱에 반영되어야 함

### US-3: 시크릿 보안 유지
- **사용자**: 개발자
- **원하는 것**: Docker 이미지에 시크릿이 포함되지 않음
- **이유**: Public Docker Hub 사용 시 보안 유지

## 기능 요구사항

### 필수 (Must Have)

- [ ] **변경 감지**: apps/api, apps/web, packages 경로별 변경 감지
- [ ] **API 배포**: Docker 이미지 빌드 → Docker Hub push → 서버 pull & restart
- [ ] **Web 배포**: pnpm build → SCP로 dist 전송
- [ ] **조건부 실행**: 변경된 앱만 배포 job 실행
- [ ] **시크릿 제외**: .dockerignore로 .env 파일 제외
- [ ] **런타임 env 주입**: docker-compose env_file로 환경변수 주입

### 선택 (Nice to Have)

- [ ] Slack/Discord 배포 알림
- [ ] 배포 실패 시 자동 롤백

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| apps/api만 변경 | API만 배포, Web 배포 스킵 |
| apps/web만 변경 | Web만 배포, API 배포 스킵 |
| packages/utils 변경 | API + Web 모두 배포 |
| packages/trpc 변경 | API + Web 모두 배포 |
| README.md만 변경 | 배포 트리거 안 됨 |
| 여러 경로 동시 변경 | 해당하는 모든 앱 배포 |

## 인수 조건 (Acceptance Criteria)

- [ ] main push 시 GitHub Actions 워크플로우가 트리거된다
- [ ] apps/api 변경 시 API만 배포된다
- [ ] apps/web 변경 시 Web만 배포된다
- [ ] packages/* 변경 시 API와 Web 모두 배포된다
- [ ] Docker 이미지에 .env 파일이 포함되지 않는다
- [ ] 운영 서버에서 env_file로 환경변수가 주입된다
- [ ] 배포 후 서비스가 정상 동작한다

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/deploy-cd.md`
- Development: `docs/specs/target/non-functional/development/deploy-cd.md`

---

**작성일**: 2026-01-24
**상태**: Approved