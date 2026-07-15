# People

필요한 인재를 미리 정의하고, 합류 시 빠르게 적응할 수 있도록 선발 기준과 온보딩 경로를
연결하는 사람 문서 인덱스.

## 현재 적용 상태

- 현재 제품과 CS는 운영자 1인이 담당한다. 이 폴더의 역할별 온보딩과 대표 위임 문서는 향후 채용이나 협업이 확정됐을 때 사용하는 템플릿이다.
- 문서의 존재는 채용 확정, 시작일 확정, 권한 이양 완료를 의미하지 않는다. 실제 적용 전에 담당자, 시작일, 수용 기준을 따로 확정한다.
- 프로덕트 엔지니어 3년에서 5년차급, 콘텐츠 마케터 2년에서 4년차급의 실무형 미들 기준은 유지한다. 이는 역량 기준이며 2026년 9월 채용 예정 인원을 뜻하지 않는다.
- 2026-09-01부터 2026-11-29까지는 운영자 1인이 사업 검증을 수행한다. 반복 매출과 실제 갱신, 운영자 노동비 차감 후 양수 공헌이익, 채용이 외주나 자동화보다 유리하다는 근거, 인건비를 감당할 현금과 지속 기간을 확인하기 전에는 채용하지 않는다.
- 로드맵의 안준성 재능기부 시안은 외부 협업 산출물이다. 콘텐츠 마케터 역할이 충원됐다는 근거로 사용하지 않는다.
- 현재 운영 수치, 오픈 이슈, 인스타그램 동결 상태는 `docs/business/STATUS.md`를 우선한다. 기능 순서와 외부 협업 산출물은 `docs/business/6_roadmap/roadmap.md`, 채널과 CS 운영은 `docs/business/3_gtm/gtm.md`를 우선한다.

## 기준 문서와 배포본

- `docs/people/md/*.md`가 최신 기준 문서다.
- `docs/people/docx/*.docx`는 외부 공유용 배포본이며 자동으로 갱신되지 않는다.
- 현재 저장소에는 DOCX 자동 생성 명령이 없다. 생성 절차를 추가하면 이 인덱스에 함께 기록한다.
- Markdown을 수정한 후에는 DOCX를 다시 내보내고 내용을 검증하기 전까지 DOCX 공유를 금지하고 Markdown만 공유한다.

| DOCX 배포본 | 기준 Markdown | 현재 상태 |
| --- | --- | --- |
| `docs/people/docx/ceo-delegation.docx` | `role-profiles.md` + `ceo-delegation.md` | 공유 금지, 재생성과 검증 필요 |
| `docs/people/docx/content-marketer-onboarding.docx` | `role-profiles.md` 해당 역할 + AI 가이드 3종 + `content-marketer.md` | 공유 금지, 재생성과 검증 필요 |
| `docs/people/docx/product-engineer-onboarding.docx` | `role-profiles.md` 해당 역할 + AI 가이드 3종 + `product-engineer.md` | 공유 금지, 재생성과 검증 필요 |

## 읽기 경로

```
채용 재검토 승인 후: 역할별 인재상 → 선발 근거와 공백 기록 → 대표 위임 준비
합류 이후: AI 설치 → AI 기초 → AI 실전 → 역할별 온보딩 → 인수 판정
```

## 문서 목록

### 인재상과 선발

| 문서 | 설명 |
| --- | --- |
| `role-profiles.md` | 미들급 기준, 공통 인재상, 역할별 선발 기준과 온보딩 핸드오프 |

### AI 가이드 (공통)

| 문서 | 설명 |
| --- | --- |
| `ai-setup-guide.md` | AI 도구 설치 (Mac/Windows), Claude Code 인증 |
| `ai-basics-guide.md` | 첫 대화, 도구 승인, 잘 물어보는 법 |
| `ai-usage-guide.md` | 슬래시 커맨드, 자동 검증, 규칙 파일, 실전 예시 |

### 역할별 온보딩 (4주)

| 문서 | 설명 |
| --- | --- |
| `product-engineer.md` | 환경 구축 → 승인된 작업 → SDD → 감독하의 배포와 롤백 |
| `content-marketer.md` | 제품 체험 → 동결 준수와 사실 검증 → 조건부 제작 → 인수 판정 |

### 대표 위임

| 문서 | 설명 |
| --- | --- |
| `ceo-delegation.md` | 시작 게이트, 최소 권한, 4주 검증, 종료와 권한 회수 |
