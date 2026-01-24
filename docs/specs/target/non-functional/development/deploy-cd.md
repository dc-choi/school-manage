# Development: CD 파이프라인 (모노레포 변경 감지 배포)

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.
> 설정 파일 기반이므로 파일별 구현 명세로 작성합니다.

## 상위 문서

- PRD: 해당 없음 (Non-Functional)
- 기능 설계: 해당 없음 (Non-Functional)
- Feature: `docs/specs/target/non-functional/features/deploy-cd.md`
- Task: `docs/specs/target/non-functional/tasks/deploy-cd.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| #1 | .dockerignore 작성 | O |
| #2 | Dockerfile 작성 | O |
| #3 | docker-compose.yml 작성 | O |
| #4 | GitHub Actions 워크플로우 | O |
| #5 | Nginx 설정 예시 | O |
| #6 | 배포 스크립트 예시 | O |

## 구현 개요

모노레포 구조에서 변경된 앱만 배포하는 CD 파이프라인 구성 파일들을 작성한다.

---

## #1: .dockerignore

**파일 위치**: `/.dockerignore`

**목적**: Docker 빌드 컨텍스트에서 시크릿/불필요 파일 제외

```
# 환경변수 (시크릿)
.env*
!.env.example

# 의존성 (빌드 시 재설치)
node_modules

# 빌드 산출물 (빌드 시 재생성)
dist
apps/*/dist
packages/*/dist

# 개발/테스트
.turbo
coverage
*.log

# IDE/OS
.idea
.vscode
.DS_Store

# Git
.git
.gitignore

# 문서
docs
*.md
!README.md

# 테스트
test
tests
**/*.test.ts
**/*.spec.ts
vitest.config.ts
```

---

## #2: Dockerfile

**파일 위치**: `/Dockerfile`

**목적**: API 서버 멀티스테이지 빌드

```dockerfile
# ===== Stage 1: Builder =====
FROM node:24-alpine AS builder

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 의존성 설치 (캐시 활용)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN pnpm build

# ===== Stage 2: Runner =====
FROM node:24-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile --prod

# 빌드 산출물 복사
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/trpc/dist ./packages/trpc/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist

# Prisma 클라이언트 생성
RUN cd apps/api && pnpm prisma generate

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/src/app.js"]
```

**주요 포인트**:
- 멀티스테이지로 이미지 크기 최소화
- pnpm workspace 구조 유지
- packages 빌드 산출물 포함
- 런타임에 env 주입 (ENV 없음)

---

## #3: docker-compose.yml

**파일 위치**: `/docker-compose.yml`

**목적**: 운영 서버 컨테이너 구성

```yaml
services:
  api:
    image: ${DOCKERHUB_USERNAME:-username}/school-api:${TAG:-latest}
    container_name: school-api
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "4000:4000"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:4000/trpc/health.check"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

**환경변수 주입 방식**:
- `env_file: .env.production` → 런타임에 주입
- `.env.production`은 운영 서버에만 존재 (Git 미포함)
- `DOCKERHUB_USERNAME`, `TAG`는 쉘 환경변수 또는 기본값 사용

---

## #4: GitHub Actions 워크플로우

**파일 위치**: `/.github/workflows/deploy.yml`

**목적**: 변경 감지 + 조건부 배포

```yaml
name: CD - Deploy

on:
  push:
    branches: [main]
    paths:
      - 'apps/**'
      - 'packages/**'
      - '.github/workflows/deploy.yml'
      - 'Dockerfile'
      - 'docker-compose.yml'
      - 'turbo.json'
      - 'pnpm-workspace.yaml'
      - 'package.json'

jobs:
  # ===== 변경 감지 =====
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.filter.outputs.api }}
      web: ${{ steps.filter.outputs.web }}
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            api:
              - 'apps/api/**'
              - 'packages/**'
              - 'Dockerfile'
              - 'docker-compose.yml'
              - 'turbo.json'
              - 'pnpm-workspace.yaml'
              - 'package.json'
            web:
              - 'apps/web/**'
              - 'packages/**'
              - 'turbo.json'
              - 'pnpm-workspace.yaml'
              - 'package.json'

  # ===== API 배포 =====
  deploy-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/school-api:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/school-api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            export DOCKERHUB_USERNAME=${{ secrets.DOCKERHUB_USERNAME }}
            export TAG=${{ github.sha }}
            docker compose pull api
            docker compose up -d api
            docker image prune -f

  # ===== Web 배포 =====
  deploy-web:
    needs: detect-changes
    if: needs.detect-changes.outputs.web == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: latest

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web
        run: pnpm --filter @school/web build

      - name: Deploy to server via SCP
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "apps/web/dist/*"
          target: ${{ secrets.WEB_DEPLOY_PATH }}
          strip_components: 3
```

**필요한 GitHub Secrets**:

| Secret | 설명 | 예시 |
|--------|------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 사용자명 | `dcchoi` |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token | `dckr_pat_xxx` |
| `SSH_HOST` | 운영 서버 IP/도메인 | `123.456.789.0` |
| `SSH_USER` | SSH 사용자명 | `deploy` |
| `SSH_KEY` | SSH 개인키 (전체) | `-----BEGIN OPENSSH...` |
| `DEPLOY_PATH` | docker-compose.yml 위치 | `/home/deploy/school` |
| `WEB_DEPLOY_PATH` | 정적 파일 배포 경로 | `/var/www/school` |

---

## #5: Nginx 설정 예시

**파일 위치**: `/nginx.conf.example`

**목적**: 정적 파일 서빙 + API reverse proxy

```nginx
server {
    listen 80;
    server_name example.com;

    # 정적 파일 (프론트엔드)
    root /var/www/school;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /trpc {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 정적 파일 캐시
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## #6: 배포 스크립트 예시

**파일 위치**: `/deploy.sh.example`

**목적**: 수동 배포 시 참고용

```bash
#!/bin/bash

# 사용법: ./deploy.sh [api|web|all]

set -e

DEPLOY_PATH="/home/deploy/school"
WEB_PATH="/var/www/school"

deploy_api() {
    echo "=== Deploying API ==="
    cd "$DEPLOY_PATH"
    docker compose pull api
    docker compose up -d api
    docker image prune -f
    echo "API deployed successfully"
}

deploy_web() {
    echo "=== Deploying Web ==="
    # 로컬에서 빌드 후 실행
    # scp -r apps/web/dist/* user@server:$WEB_PATH/
    echo "Web deployed successfully"
}

case "$1" in
    api)
        deploy_api
        ;;
    web)
        deploy_web
        ;;
    all)
        deploy_api
        deploy_web
        ;;
    *)
        echo "Usage: $0 [api|web|all]"
        exit 1
        ;;
esac
```

---

## 테스트 시나리오

### 정상 케이스

| 시나리오 | 트리거 | 기대 결과 |
|---------|--------|----------|
| API만 변경 | apps/api/src/app.ts 수정 후 main push | deploy-api만 실행, Docker Hub에 이미지 push |
| Web만 변경 | apps/web/src/App.tsx 수정 후 main push | deploy-web만 실행, SCP로 dist 전송 |
| packages 변경 | packages/utils/src/date.ts 수정 후 main push | deploy-api, deploy-web 병렬 실행 |
| 설정 파일 변경 | turbo.json 수정 후 main push | deploy-api, deploy-web 병렬 실행 |

### 예외 케이스

| 시나리오 | 트리거 | 기대 결과 |
|---------|--------|----------|
| 문서만 변경 | docs/README.md 수정 후 main push | 워크플로우 트리거 안 됨 |
| Docker Hub 인증 실패 | 잘못된 DOCKERHUB_TOKEN | deploy-api 실패, deploy-web은 독립 실행 |
| SSH 연결 실패 | 잘못된 SSH_KEY | 배포 step 실패, 로그 확인 필요 |

---

## 구현 시 주의사항

- [ ] Dockerfile에서 .env 파일이 복사되지 않는지 확인 (.dockerignore)
- [ ] docker-compose.yml에서 env_file 경로가 올바른지 확인
- [ ] GitHub Secrets가 모두 설정되었는지 확인
- [ ] 운영 서버에 .env.production 파일이 존재하는지 확인
- [ ] 운영 서버에 Docker, docker-compose가 설치되어 있는지 확인
- [ ] Nginx 설정 후 `nginx -t`로 문법 검증

## AI 구현 지침

### 파일 위치
- `.dockerignore` - 루트
- `Dockerfile` - 루트
- `docker-compose.yml` - 루트
- `.github/workflows/deploy.yml` - GitHub Actions
- `nginx.conf.example` - 루트 (참고용)
- `deploy.sh.example` - 루트 (참고용)

### 구현 순서
1. .dockerignore → 시크릿 제외 확인
2. Dockerfile → 로컬에서 `docker build .` 테스트
3. docker-compose.yml → `docker compose config` 검증
4. deploy.yml → GitHub에 push 후 Actions 탭에서 확인
5. nginx.conf.example, deploy.sh.example → 참고 문서로 제공

---

**작성일**: 2026-01-24
**상태**: Approved
