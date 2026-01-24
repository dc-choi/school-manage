# Feature: 운영 docker-compose 구성

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 개요

운영용 compose에 이미지 태그, env 파일, 포트 설정을 반영한다.

## 배경

- 배포 구성은 compose에 고정되어야 한다.
- 환경변수는 서버에서 주입해야 한다.

## 사용자 스토리

### US-1: 운영 구성이 일관되다
- **사용자**: 운영자
- **원하는 것**: compose에 이미지/환경을 명시하기
- **이유**: 재현성을 확보하기 위해

### US-2: 환경변수를 안전하게 주입한다
- **사용자**: 운영자
- **원하는 것**: env_file로 런타임 주입하기
- **이유**: 시크릿을 보호하기 위해

## 기능 요구사항

### 필수 (Must Have)
- [ ] compose에 immutable tag 이미지를 지정한다.
- [ ] env_file로 런타임 환경변수를 주입한다.
- [ ] 필수 포트/재시작 정책을 정의한다.

### 선택 (Nice to Have)
- [ ] 헬스체크 옵션을 추가한다.

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| env 파일 누락 | 배포 중단 |
| 잘못된 태그 | 이전 태그로 복구 |

## 인수 조건 (Acceptance Criteria)

- [ ] compose 파일에 이미지/환경이 명시된다.
- [ ] 운영 서버에서 동일 구성으로 재기동된다.

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-compose-config.md`
- Development: `docs/specs/target/non-functional/development/deploy-dockerhub-compose-config.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-05
**상태**: Draft
