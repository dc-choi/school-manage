---
name: commit
description: 변경사항 분석 후 커밋 메시지 생성 및 커밋
---

# /commit

변경사항을 분석하고 커밋 메시지를 생성하여 커밋합니다.

## 실행 단계

1. `git status`로 변경된 파일 확인
2. `git diff`로 변경 내용 분석
3. `git log --oneline -5`로 최근 커밋 스타일 확인
4. 커밋 메시지 생성 (프로젝트 컨벤션 준수)
5. 사용자 확인 후 커밋 실행

## 커밋 메시지 컨벤션

```
<요약> (한글, 50자 이내)

[선택] 상세 설명

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### 타입 접두사 (선택)
- `feat:` - 새 기능
- `fix:` - 버그 수정
- `docs:` - 문서 수정
- `refactor:` - 리팩토링
- `test:` - 테스트
- `chore:` - 기타 작업

## 주의사항

- `.env*` 파일은 커밋하지 않음
- 사용자 확인 없이 자동 커밋하지 않음
- `--amend`는 사용자가 명시적으로 요청할 때만 사용