# AI 도구 설치 가이드

AI를 처음 접하는 팀원을 위한 설치 가이드. Mac과 Windows 모두 지원한다.
설치 완료 후 `onboarding/ai-basics-guide.md`에서 기초 사용법을 익힌다.

## AI란? (이 프로젝트에서의 역할)

이 프로젝트에서 AI는 **"프로젝트를 이미 이해하고 있는 시니어 동료"** 역할을 한다.

- 코드를 읽고, 수정하고, 테스트할 수 있다
- 프로젝트의 규칙과 컨벤션을 알고 있다 (`.claude/rules/` 13개 파일)
- 명령어를 실행할 수 있다 (빌드, 테스트, 배포)
- 문서를 작성하고 편집할 수 있다
- **단, 최종 판단은 항상 사람이 한다** — AI는 도구이지 의사결정자가 아니다

---

## Step 1: 기본 도구 설치

### Mac

터미널(`Terminal.app`)을 열고 순서대로 실행한다.

**Homebrew (패키지 관리자):**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# 터미널 재시작 후
brew --version   # 4.x.x 나오면 성공
```

**Git:**
```bash
brew install git
git --version    # 2.x.x 나오면 성공
```

**Node.js (nvm):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# 터미널 재시작 후
nvm install 24
node --version   # v24.x.x 나오면 성공
```

### Windows

PowerShell을 **관리자 권한**으로 열고 순서대로 실행한다.
(시작 메뉴 → PowerShell 검색 → 우클릭 → "관리자 권한으로 실행")

**Git:**
```powershell
winget install Git.Git
# PowerShell 재시작 후
git --version    # 2.x.x 나오면 성공
```

**Node.js (nvm-windows):**
```powershell
winget install CoreyButler.NVMforWindows
# PowerShell 재시작 후
nvm install 24
nvm use 24
node --version   # v24.x.x 나오면 성공
```

### 공통 (Mac/Windows 동일)

**pnpm:**
```bash
npm install -g pnpm
pnpm --version   # 10.x.x 나오면 성공
```

> **콘텐츠 마케터**: 직접 코드를 짤 필요는 없지만,
> AI가 빌드/테스트를 실행할 때 필요하므로 설치해둔다.

---

## Step 2: 프로젝트 클론

```bash
cd ~/dev                           # 작업 폴더 (원하는 곳)
git clone <대표에게 받은 저장소 URL>
cd nashville
nvm use                            # Node.js 24 자동 설정
pnpm install                       # 의존성 설치 (1-2분)
```

> **Windows**: `cd ~/dev` 대신 `cd C:\dev` 등 원하는 경로 사용.

설치 확인:
```bash
pnpm build                         # 에러 없이 끝나면 성공
```

---

## Step 3: Claude Code 설치

Claude Code는 **터미널에서 실행하는 AI 어시스턴트**다.
프로젝트 폴더 안에서 실행하면 코드 읽기/수정, 명령 실행, 문서 작성이 가능하다.

**설치 (Mac/Windows 동일):**
```bash
npm install -g @anthropic-ai/claude-code
```

**첫 실행 + 인증:**
```bash
cd ~/dev/nashville      # 반드시 프로젝트 폴더에서 실행
claude                  # Claude Code 시작
```

처음 실행하면 **Anthropic 계정 로그인** 화면이 뜬다:
- 대표에게 받은 계정 정보로 로그인
- 또는 대표가 보낸 팀 초대 이메일 링크로 가입

**설치 확인** — 로그인 후 채팅창이 뜨면 입력:
```
이 프로젝트가 뭘 하는 거야?
```
→ AI가 프로젝트를 설명하면 **설치 성공**. 종료: `Ctrl+C` 또는 `/exit`.

---

## Step 4: Conductor 설치 (선택, Mac 전용)

Conductor는 Claude Code를 **GUI로 감싼 Mac 앱**이다.
여러 AI 에이전트를 병렬 실행하고 워크스페이스를 시각적으로 관리할 수 있다.

1. 대표에게 Conductor 초대 링크를 받는다
2. 다운로드 후 설치 (`/Applications`에 드래그)
3. 앱 실행 → 계정 로그인
4. **워크스페이스 생성**: 프로젝트 폴더 지정 (예: `~/dev/nashville`)

> **Windows 사용자**: Conductor는 현재 Mac 전용이다. Claude Code(터미널)를 사용한다.
> Claude Code와 Conductor의 기능은 동일하다.

---

## 설치 문제 해결

### 공통

**"`claude` 명령이 안 돼요"**
→ 터미널 재시작. 안 되면 `npm install -g @anthropic-ai/claude-code` 재설치.

**"`pnpm build` 에러가 나요"**
→ `node --version`이 v24인지 확인. 아니면 `nvm use 24` 실행 후 `pnpm install` 재실행.

**"Anthropic 로그인이 안 돼요"**
→ 대표에게 팀 초대 이메일을 다시 요청한다.

### Mac 전용

**"`nvm` 명령이 안 돼요"**
→ 터미널 재시작. `~/.zshrc` 파일에 nvm 설정이 있는지 확인.

### Windows 전용

**"`nvm` 명령이 안 돼요"**
→ PowerShell 재시작. 안 되면 `winget install CoreyButler.NVMforWindows` 재설치.

**"권한 에러가 나요"**
→ PowerShell을 관리자 권한으로 실행했는지 확인.

**"`pnpm` 실행 시 보안 정책 에러"**
→ PowerShell에서 `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` 실행 후 재시도.

> 어떤 에러든 Claude에게 물어봐도 된다: "이 에러가 뭔지 모르겠어" + 에러 메시지 붙여넣기.

---

## 설치 체크리스트

- [ ] Git 설치 (`git --version` → 2.x.x)
- [ ] Node.js 24 설치 (`node --version` → v24.x.x)
- [ ] pnpm 설치 (`pnpm --version` → 10.x.x)
- [ ] 프로젝트 클론 + `pnpm install` + `pnpm build` 성공
- [ ] Claude Code 설치 + Anthropic 로그인 완료
- [ ] 첫 질문에 AI가 응답 확인
- [ ] (Mac만) Conductor 앱 설치 + 워크스페이스 연결

모든 체크 완료 시 → `onboarding/ai-basics-guide.md`로 이동.
