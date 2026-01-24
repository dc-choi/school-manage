# Task: CD 파이프라인 (모노레포 변경 감지 배포)

> **"어떻게 만들지"**에 대해 업무를 나눈 문서입니다.
> Feature의 요구사항을 **구현 가능한 단위로 분할**하고, 각 업무의 순서와 의존성을 정의합니다.

## 상위 문서

- PRD: 해당 없음 (Non-Functional)
- 기능 설계: 해당 없음 (Non-Functional)
- Feature: `docs/specs/target/non-functional/features/deploy-cd.md`

## 목표

main 브랜치 push 시 변경된 앱만 자동 배포되는 CD 파이프라인 구축

## 범위

### 포함
- [x] .dockerignore 작성
- [x] Dockerfile 작성 (API용)
- [x] docker-compose.yml 작성
- [x] GitHub Actions 워크플로우 작성
- [x] Nginx 설정 예시 제공
- [x] 배포 스크립트 예시 제공

### 제외
- [ ] CI (테스트/린트 자동화) - 별도 Task
- [ ] 자동 롤백 - Nice to Have
- [ ] 배포 알림 - Nice to Have

## 업무 분할

| # | 업무 | 설명 | 의존성 | 예상 규모 |
|---|------|------|--------|----------|
| 1 | .dockerignore 작성 | 시크릿/불필요 파일 제외 | 없음 | S |
| 2 | Dockerfile 작성 | API 멀티스테이지 빌드 | 없음 | M |
| 3 | docker-compose.yml 작성 | 운영 서버 컨테이너 구성, env_file 설정 | #2 | S |
| 4 | GitHub Actions 워크플로우 | 변경 감지 + 조건부 배포 | #1, #2, #3 | L |
| 5 | Nginx 설정 예시 | 정적 파일 + reverse proxy | 없음 | S |
| 6 | 배포 스크립트 예시 | 수동 배포용 참고 스크립트 | #3 | S |

### 업무 순서 다이어그램

```
[#1 .dockerignore] ──┐
                     ├──▶ [#4 GitHub Actions] ──▶ 완료
[#2 Dockerfile] ─────┤
         │           │
         └──▶ [#3 docker-compose.yml]
                     │
[#5 Nginx 설정] ─────┘
         │
         └──▶ [#6 배포 스크립트]
```

## 유스케이스

### UC-1: API만 변경된 경우

**전제 조건**: main 브랜치에 apps/api/** 파일만 변경된 커밋이 push됨

**주요 흐름**:
1. GitHub Actions 트리거
2. dorny/paths-filter로 변경 감지 → api=true, web=false
3. deploy-api job 실행 (deploy-web은 스킵)
4. Docker 이미지 빌드 → Docker Hub push
5. SSH로 운영 서버 접속 → docker pull && docker-compose up -d

**결과**: API 컨테이너만 업데이트됨

**관련 업무**: #1, #2, #3, #4

### UC-2: Web만 변경된 경우

**전제 조건**: main 브랜치에 apps/web/** 파일만 변경된 커밋이 push됨

**주요 흐름**:
1. GitHub Actions 트리거
2. dorny/paths-filter로 변경 감지 → api=false, web=true
3. deploy-web job 실행 (deploy-api는 스킵)
4. pnpm build 실행
5. SCP로 dist/* 운영 서버에 전송

**결과**: 정적 파일만 업데이트됨

**관련 업무**: #4

### UC-3: packages 변경된 경우

**전제 조건**: main 브랜치에 packages/** 파일이 변경된 커밋이 push됨

**주요 흐름**:
1. GitHub Actions 트리거
2. dorny/paths-filter로 변경 감지 → api=true, web=true
3. deploy-api, deploy-web job **병렬 실행** (needs 없이 독립 실행)
4. API: Docker 빌드 → push → 서버 pull
5. Web: pnpm build → SCP 전송
6. 두 job이 동시에 진행되어 배포 시간 단축

**결과**: API와 Web 모두 업데이트됨 (병렬로 동시 배포)

**관련 업무**: #1, #2, #3, #4

### UC-4: 런타임 환경변수 주입

**전제 조건**: 운영 서버에 .env.production 파일이 존재

**주요 흐름**:
1. docker-compose up -d 실행
2. env_file: .env.production 로드
3. 컨테이너에 환경변수 주입

**결과**: 시크릿이 이미지 없이 런타임에 주입됨

**관련 업무**: #3

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 관련 업무 | 우선순위 |
|------|----------|----------|---------|
| Docker Hub push 실패 | 워크플로우 실패, 서버 배포 스킵 | #4 | High |
| SSH 연결 실패 | 워크플로우 실패, 로그 확인 | #4 | High |
| SCP 전송 실패 | 워크플로우 실패, 기존 파일 유지 | #4 | High |
| .env.production 누락 | 컨테이너 시작 실패, 로그로 확인 | #3 | High |
| 설정 파일 변경 (.github/workflows/**, turbo.json, pnpm-workspace.yaml, package.json) | API + Web 모두 배포 (paths 필터에 포함) | #4 | Medium |
| docs/**, README.md, *.md 변경 | 배포 트리거 안 됨 (paths 필터 제외) | #4 | Low |

## 검증 체크리스트

### 기능 검증
- [ ] apps/api 변경 시 API만 배포되는가?
- [ ] apps/web 변경 시 Web만 배포되는가?
- [ ] packages/* 변경 시 둘 다 배포되는가? (병렬 실행)
- [ ] 설정 파일 변경 시 둘 다 배포되는가? (turbo.json, package.json 등)
- [ ] docs/**, *.md 변경 시 배포가 스킵되는가?
- [ ] Docker 이미지에 .env 파일이 포함되지 않는가?
- [ ] env_file로 환경변수가 정상 주입되는가?

### 요구사항 추적
- [ ] Feature의 US-1 (변경된 앱만 배포) 충족
- [ ] Feature의 US-2 (packages 변경 시 전체 배포) 충족
- [ ] Feature의 US-3 (시크릿 보안) 충족
- [ ] Feature의 인수 조건 7개 모두 충족

## 다음 단계

- [ ] Development 문서 작성: `docs/specs/target/non-functional/development/deploy-cd.md`

---

**작성일**: 2026-01-24
**상태**: Approved
**전체 예상 작업량**: M