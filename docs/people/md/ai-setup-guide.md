# AI 도구 설치 가이드

AI를 처음 사용하는 팀원을 위한 설치 가이드다. 설치 후 `ai-basics-guide.md`, `ai-usage-guide.md` 순서로 읽는다.

## AI의 역할과 경계

이 저장소에서 Claude Code는 코드를 읽고 수정하며 명령과 문서 작업을 도울 수 있다. `.claude/CLAUDE.md`와 관련 규칙을 따라 작업하지만 결과의 정확성과 실행 권한은 사람이 책임진다.

- 소스 탐색, 변경안 작성, 테스트 실행을 지원한다.
- 배포나 데이터 변경은 대표의 명시적 승인 아래 수행한다.
- `.env`, 비밀번호, 토큰, 개인정보는 채팅에 붙여넣지 않는다.
- AI가 읽지 못한 외부 상태나 운영 상태를 추측하게 두지 않는다.

## Step 1: 기본 도구 설치

저장소 기준 버전은 Node.js 24 이상, pnpm 10 이상이다. 정확한 pnpm 고정 버전은 `package.json`의 `packageManager`를 확인한다.

### Mac

터미널을 열고 순서대로 실행한다.

```bash
# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew --version

# Git
brew install git
git --version

# nvm과 Node.js 24
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
nvm install 24
nvm use 24
node --version
```

설치 중 받은 셸 설정 안내를 적용한 뒤 새 터미널을 연다. nvm 버전은 2026-07-15에 [공식 releases](https://github.com/nvm-sh/nvm/releases)로 확인했으며 이후에는 최신 공식 절차를 우선한다.

### Windows

PowerShell을 관리자 권한으로 열고 실행한다.

```powershell
winget install Git.Git
winget install CoreyButler.NVMforWindows
```

PowerShell을 다시 연 뒤 실행한다.

```powershell
nvm install 24
nvm use 24
node --version
git --version
```

### 공통

현재 저장소 고정 버전에 맞춰 pnpm을 설치한다.

```bash
npm install -g pnpm@10.27.0
pnpm --version
```

`package.json`의 `packageManager`가 바뀌면 위 버전도 그 값에 맞춘다.

## Step 2: 프로젝트 클론

개인 계정에 저장소 접근 권한을 받은 뒤 실행한다.

```bash
cd ~/dev
git clone <대표에게 받은 저장소 URL> school-manage
cd school-manage
nvm use
pnpm install
```

Windows에서 `nvm use`가 버전을 찾지 못하면 `nvm use 24`를 사용한다. `~/dev` 대신 `C:\dev` 같은 작업 폴더를 사용할 수 있다.

프로덕트 엔지니어는 `product-engineer.md`의 Week 1에서 로컬 MySQL과 `.env.local`을 같은 셸에 로드한 뒤 build/dev를 검증한다. 콘텐츠 역할은 코드 build가 필요할 때만 승인된 개발 환경을 받은 후 실행한다.

## Step 3: Claude Code 설치

이 가이드는 프로젝트 폴더에서 실행하는 터미널 인터페이스를 기준으로 한다. 공식 Desktop, VS Code, Web 인터페이스도 있으므로 역할과 장비에 맞게 선택한다.

Mac에서는 공식 Homebrew cask를 사용한다.

```bash
brew install --cask claude-code
claude --version
```

Windows에서는 공식 WinGet 패키지를 사용한다.

```powershell
winget install Anthropic.ClaudeCode
claude --version
```

설치 후 프로젝트 폴더에서 시작한다.

```bash
cd ~/dev/school-manage
claude
```

> 외부 확인일 2026-07-15: 설치와 인증 방식은 [Claude Code 공식 quickstart](https://code.claude.com/docs/en/quickstart)를 기준으로 한다. 설치 명령이 바뀌면 공식 문서를 우선한다.

첫 실행에서 본인 Anthropic 계정으로 로그인하거나 본인 이메일로 받은 팀 초대를 수락한다. 공용 비밀번호나 대표 계정 자격 증명을 공유하지 않는다.

로그인 후 다음처럼 읽기 요청으로 확인한다.

```text
이 저장소의 역할과 주요 폴더를 README.md 근거로 설명해줘.
```

AI가 근거 파일을 제시하면 설치가 완료된 것이다. 종료 명령은 `/exit`이며, 터미널에서는 `Ctrl+C`도 사용할 수 있다.

## Step 4: Conductor 설치, 선택 사항

Conductor는 여러 작업 공간과 AI 작업을 GUI에서 관리할 때 사용하는 Mac 앱이다.

1. 대표가 승인한 공식 설치 경로 또는 초대 링크를 사용한다.
2. 본인 계정으로 로그인한다.
3. 워크스페이스 경로로 `~/dev/school-manage`를 지정한다.
4. 변경 전에 현재 브랜치와 diff를 확인한다.

Windows에서는 터미널, 공식 Desktop, VS Code 중 팀이 승인한 인터페이스를 사용하고 Conductor를 전제로 하지 않는다. 인터페이스마다 병렬 작업 방식이 다르므로 기능이 완전히 같다고 가정하지 않는다.

## Step 5: 저장소 안전 설정 확인

Claude Code에서 다음 파일을 읽어 권한과 훅 동작을 확인한다.

- `.claude/CLAUDE.md`: 프로젝트 규칙과 명령 카탈로그
- `.claude/settings.json`: 허용 명령, `.env` 읽기 차단, 훅 설정
- `.claude/hooks/protect-files.sh`: 비밀 파일, lock 파일, 기존 migration 보호
- `.claude/hooks/stop-check.sh`: 세션 종료 시 lint/typecheck 실행

프로덕션 SSH 키, Docker Hub 토큰, DB 자격 증명은 개인 비밀 저장소나 승인된 비밀 관리 채널로 전달한다. 문서, 이슈, 채팅, 커밋에는 남기지 않는다.

## 문제 해결

### `claude` 명령을 찾지 못함

터미널을 다시 열고 `claude --version`을 실행한다. 계속 실패하면 공식 quickstart의 운영체제별 네이티브 설치 절차를 다시 적용하고 PATH 안내를 확인한다.

### `pnpm build` 실패

먼저 역할별 개발 환경과 API 환경 변수가 로드됐는지 확인한다.

```bash
node --version
pnpm --version
nvm use 24
pnpm install
pnpm build
```

에러 전문에서 비밀값과 개인정보를 제거한 뒤 AI에게 원인 분석만 요청한다.

### `nvm` 명령을 찾지 못함

- Mac: 새 터미널을 열고 `~/.zshrc` 또는 설치 안내에 나온 셸 설정을 확인한다.
- Windows: PowerShell을 다시 열고 nvm-windows 설치 경로가 PATH에 있는지 확인한다.

### Windows pnpm 실행 정책 오류

조직 보안 정책을 먼저 확인한다. 개인 장비이고 정책 변경 권한이 있을 때만 다음을 사용한다.

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 인증 또는 저장소 접근 실패

본인 계정의 팀 초대와 Git 저장소 권한을 대표에게 재요청한다. 다른 사람의 계정으로 우회 로그인하지 않는다.

## 설치 체크리스트

- [ ] Git 설치 및 개인 저장소 권한 확인
- [ ] Node.js 24 이상 설치
- [ ] 저장소 고정 pnpm 버전 설치
- [ ] `pnpm install` 성공, 역할별 환경 설정 후 필요한 build 검증
- [ ] Claude Code 설치 및 본인 계정 인증
- [ ] 프로젝트 폴더에서 근거 파일을 포함한 첫 답변 확인

완료 후 `ai-basics-guide.md`로 이동한다.
