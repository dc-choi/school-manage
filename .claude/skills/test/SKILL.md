---
name: test
description: 테스트 실행 및 결과 요약
---

# /test

테스트를 실행하고 결과를 요약합니다.

## 사용법

```
/test           # 전체 테스트
/test api       # API 서버 테스트만
/test web       # 웹 앱 테스트만
/test utils     # 유틸리티 패키지 테스트만
```

## 실행 단계

1. 대상 패키지 확인
2. `pnpm test` 실행
3. 결과 파싱 및 요약
4. 실패 시 원인 분석

## 패키지별 테스트 명령어

| 패키지 | 명령어 | 위치 |
|--------|--------|------|
| 전체 | `pnpm test` | 루트 |
| API | `pnpm --filter @school/api test` | apps/api |
| Web | `pnpm --filter @school/web test` | apps/web |
| Utils | `pnpm --filter @school/utils test` | packages/utils |

## 출력 형식

```
## 테스트 결과

### 요약
- 총 테스트: N개
- 성공: N개
- 실패: N개
- 스킵: N개

### 패키지별 결과
| 패키지 | 성공 | 실패 | 시간 |
|--------|------|------|------|
| @school/api | N | N | Ns |
| @school/web | N | N | Ns |
| @school/utils | N | N | Ns |

### 실패한 테스트 (있는 경우)
- `파일명`: 테스트명
  - 예상: ...
  - 실제: ...

### 권장 조치 (실패 시)
- ...
```

## 워치 모드

개발 중 지속적인 테스트가 필요한 경우:

```bash
pnpm test:watch                    # 전체
pnpm --filter @school/api test:watch  # API만
```