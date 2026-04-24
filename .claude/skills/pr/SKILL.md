---
name: pr
description: 현재 브랜치를 원격에 푸시하고 PR 본문을 자동 생성하여 gh pr create 실행. /pr 로 호출.
---

# /pr

PR 생성 자동화. `/commit`으로 커밋을 마친 후 이 스킬로 PR 단계를 처리한다.

## 전제 조건

1. 현재 브랜치가 `main`/`master`가 아님
2. 로컬에 커밋되지 않은 변경 없음 (있으면 `/commit` 먼저)
3. GitHub CLI(`gh`) 인증 완료
4. 권장: `/pre-pr` 먼저 실행하여 CRITICAL 없음 확인

## 실행 단계

### 1. 브랜치/원격 상태 확인

```bash
git rev-parse --abbrev-ref HEAD
git status --porcelain
git log origin/main..HEAD --oneline
git diff origin/main...HEAD --stat
```

- 커밋 없음 → 종료 ("PR 만들 변경 없음")
- 이미 PR 존재 시 `gh pr view` 결과 출력하고 종료 (중복 생성 방지)

### 2. PR 제목 초안 작성

규칙:
- 한글 50자 이내
- 타입 접두사 우선 (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`, `chore:`)
- 단일 커밋이면 해당 커밋 제목 재사용, 다중 커밋이면 공통 주제로 요약

### 3. PR 본문 구성

```markdown
## Summary
- <변경 1>
- <변경 2>
- ...

## Test plan
- [ ] <검증 항목>
...

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- **Summary**: 각 커밋 요약을 2~5개 불렛으로 병합
- **Test plan**: 수동 확인 항목 체크리스트 (UI 변경 시 브라우저 확인, API 변경 시 통합 테스트)
- **Breaking 또는 Migration** 섹션은 해당 시에만 추가
- `/pre-pr` 결과가 있으면 "## Pre-PR Review" 섹션에 HIGH 이상 항목 포함

### 4. 원격 브랜치 푸시

```bash
# 업스트림 없으면 -u origin <branch>
git push -u origin <current-branch>
```

- 워크트리 환경에서는 `/commit` 스킬이 이미 푸시했을 수 있음 → 확인 후 skip

### 5. PR 생성

HEREDOC으로 본문 전달:

```bash
gh pr create --base main --title "<제목>" --body "$(cat <<'EOF'
## Summary
- ...

## Test plan
- [ ] ...

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- `--draft` 옵션: HIGH 경고가 있거나 사용자가 명시적으로 draft 요청한 경우
- 성공 시 PR URL 출력

### 6. 후속

- `gh pr view --web` 제공 (사용자 선택)
- Conductor 워크스페이스 내에서는 단일 PR당 1개 브랜치 원칙 유지

## 주의사항

- **`gh pr create` 직전 사용자 확인**: 제목/본문을 보여주고 승인 받은 후 실행
- **main/master 직접 push 금지**: 브랜치명 체크로 방어
- **--no-verify 금지**: 훅이 차단함. 실패 원인 해결 후 재시도
- **민감정보 유출 방지**: PR 본문에 `.env`, 토큰, 실제 사용자 데이터 표시 금지

## 관련 스킬

- `/commit`: 커밋 생성 (선행)
- `/pre-pr`: reviewer 병렬 호출 (선행 권장)

## 참조

- 커밋 컨벤션: `.claude/CLAUDE.md` Commit Message 섹션
- GitHub CLI 사용: `gh --help`
