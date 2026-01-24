# Task: Nginx 정적 배포 + Reverse Proxy

> 업무 단위 설계 문서입니다.
> Feature 문서를 기반으로 **유스케이스와 엣지 케이스**를 정리합니다.

## 관련 Feature

- `docs/specs/target/non-functional/features/deploy-nginx-static.md`

## 목표

Nginx에서 정적 파일 서빙과 `/trpc` proxy를 구성한다.

## 범위

### 포함
- [x] 정적 배포 경로 정의
- [x] `/trpc` reverse proxy 설정
- [x] HTTPS 적용 시 쿠키 동작 조건 명시

### 제외
- [ ] CDN 적용
- [ ] 자동 캐시 무효화

## 유스케이스

### UC-1: 정적 파일 제공

**전제 조건**: `dist/`가 배포됨

**주요 흐름**:
1. Nginx가 `/` 경로에서 정적 파일을 서빙한다.

**결과**: 프론트가 정상적으로 로드된다.

### UC-2: API 호출

**전제 조건**: API 컨테이너가 실행 중

**주요 흐름**:
1. 클라이언트가 `/trpc`로 요청한다.
2. Nginx가 API로 proxy한다.

**결과**: 동일 출처로 API가 호출된다.

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| 캐시된 정적 파일 | 배포 시 캐시 무효화 | Medium |
| HTTPS 미적용 | 쿠키 정책 점검 | Medium |

## 검증 체크리스트

- [ ] `/` 정적 서빙이 동작하는가?
- [ ] `/trpc`가 API로 전달되는가?
- [ ] 동일 출처 쿠키가 정상 전달되는가?

## 다음 단계

- [x] Development 문서 작성: `docs/specs/target/non-functional/development/deploy-nginx-static.md`

---

**작성일**: 2026-01-05
**담당자**: Codex
**예상 작업량**: M
