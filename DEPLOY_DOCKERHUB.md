# Docker Hub(private)로 백엔드 Docker 이미지 배포하기

목표: 백엔드 이미지는 **Docker Hub의 private repository**에 올리고(CI에서 push), 운영 서버는 **pull 후 컨테이너 재기동**으로 배포한다. 프론트는 Vite 빌드 산출물을 Nginx에 정적 배포한다.

관련 문서: `ARCHITECTURE_MONOREPO.md`

권장 작업 순서: **아키텍처 → 타입 안정성 → 배포**  
이 문서는 그 중 “배포” 단계에 해당하며, 모노레포 전환 후에는 빌드 경로(`context`/`Dockerfile`)를 `apps/api` 기준으로 맞추는 것을 전제로 합니다.

인증이 refresh token(HttpOnly 쿠키) 방식으로 확장되면, 운영 환경에서 **HTTPS(TLS termination)** 가 사실상 전제입니다(쿠키 `Secure` 옵션).

---

## 1) 전체 흐름(요약)

1. 개발/메인 브랜치에 merge 또는 태그 생성
2. CI(GitHub Actions 등)에서 Docker 이미지 빌드
3. CI가 Docker Hub private repo로 push (immutable tag 권장)
4. 운영 서버에서 `docker compose pull` → `docker compose up -d`

---

## 2) Docker Hub에서 “외부 유출”을 최소화하는 방법

Docker Hub를 쓰는 이상 “외부 서비스에 저장된다”는 사실은 바뀌지 않는다. 대신 아래를 지키면 실질적인 유출 리스크를 크게 줄일 수 있다.

- **repo는 반드시 private**
- **시크릿을 이미지에 절대 포함하지 않기**
    - `.env`, 인증키, DB 비밀번호, 토큰 등을 Docker build context에 넣지 않음
    - 런타임에 환경변수/secret 파일로 주입(서버에만 존재)
- **계정/권한 분리**
    - CI(push용) 계정/토큰과 운영서버(pull용) 계정/토큰을 분리
    - 운영서버 토큰은 “pull만 가능한” 계정(협업자 read-only)으로 운용
- **토큰을 주기적으로 rotate**
- **2FA 활성화**

> 참고: Docker Hub 요금제/정책에 따라 private repo 수/트래픽 제한이 있을 수 있어, 실제 운영 전에 현재 플랜 제한을 먼저 확인하는 것을 권장한다.

---

## 3) 권한 설계(추천)

### 최소 권한 운영 패턴

- Docker Hub에 private repo 생성: `<namespace>/<repo>`
- 계정 2개를 쓰는 것을 권장
    - `ci-bot`: push 가능 (CI 전용)
    - `deploy-bot`: pull만 가능 (서버 전용)

`deploy-bot`은 해당 private repo의 collaborator/team 권한을 **read-only**로 부여한다.

---

## 4) CI에서 Docker Hub로 push (예: GitHub Actions)

### 4.1 GitHub Secrets

레포지토리 Secrets에 등록:

- `DOCKERHUB_USERNAME`: `ci-bot` 계정
- `DOCKERHUB_TOKEN`: `ci-bot`의 access token

### 4.2 태깅(권장)

운영 배포는 아래 중 하나를 권장한다.

- **git sha 기반 immutable tag**: `sha-<FULL_SHA>` 또는 `sha-<SHORT_SHA>`
- **릴리즈 태그 기반**: `vX.Y.Z`

`latest`는 편하지만 “어떤 코드가 배포됐는지” 추적/롤백이 어려워 운영에서는 비권장이다(써도 보조 태그로만).

### 4.3 워크플로우 예시(발췌)

```yaml
name: build-and-push-api

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: |
            <namespace>/<repo>:sha-${{ github.sha }}
```

모노레포(`apps/api`)로 바뀌면 `context`/`file` 경로만 `apps/api`로 조정하면 된다.

---

## 5) 운영 서버에서 pull + 재기동(예: docker compose)

### 5.1 운영 서버 로그인(pull 전용 계정)

운영 서버에서는 `deploy-bot` 계정으로 로그인한다.

```bash
echo "<DEPLOY_BOT_TOKEN>" | docker login -u "<DEPLOY_BOT_USERNAME>" --password-stdin
```

### 5.2 compose 예시(발췌)

```yaml
services:
  api:
    image: <namespace>/<repo>:sha-<GIT_SHA>
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "5000:5000"
```

> 핵심: `.env`는 **서버에만 존재**하고 git/이미지에 포함되지 않아야 한다.

### 5.3 배포 커맨드(수동/스크립트)

```bash
docker compose pull api
docker compose up -d api
docker image prune -f
```

### 5.4 롤백

- 직전 버전의 `sha-...`(또는 `vX.Y.Z`) 태그로 `docker-compose.yml`을 되돌린 뒤 다시 `pull/up`
- 더 강하게 고정하려면 “tag” 대신 “digest(@sha256:...)”로 배포하는 방식도 가능(완전 불변)

---

## 6) 프론트(Nginx 정적 배포)과의 연결(개요)

- 프론트: Vite `dist/`를 Nginx가 서빙
- Nginx는 `/trpc` 요청을 백엔드 컨테이너로 reverse proxy
- 이때 브라우저 기준으로는 동일 출처처럼 동작하게 만들 수 있어, CORS 문제를 최소화할 수 있다

---

## 7) 체크리스트

- [ ] Docker Hub repo가 private인가?
- [ ] 이미지에 `.env`/키/토큰이 들어가지 않는가? (`.dockerignore` 포함)
- [ ] CI(push) 계정과 서버(pull) 계정을 분리했는가?
- [ ] 운영 배포는 immutable tag(sha 또는 버전 tag)인가?
- [ ] 토큰 rotate/2FA/권한 최소화가 적용됐는가?
