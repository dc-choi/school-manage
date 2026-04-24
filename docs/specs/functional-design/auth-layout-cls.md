# 기능 설계: AuthLayout 히어로 이미지 CLS 방지 (성능)

> 상태: Draft | 작성일: 2026-04-24 | 분류: Non-Functional (Performance, P3)

## 연결 문서

- 코드: `apps/web/src/components/layout/AuthLayout.tsx:34-41`
- 누락 에셋: `apps/web/public/images/screenshot-dashboard.png` (참조만 존재, 파일 부재)
- TARGET 등록: `docs/specs/README.md` PERFORMANCE 표 P3
- 참조 규칙: `.claude/rules/web-patterns.md` (성능), `.claude/rules/design.md` (반응형)

## 배경

`AuthLayout`은 비로그인 페이지(로그인/회원가입/비밀번호 재설정/도네이션 등)의 **좌측 히어로 영역**(`lg` 이상)에 대시보드 스크린샷을 표시하도록 설계되어 있다. 현재 상태:

| 항목 | 현재 |
|------|------|
| 이미지 src | `/images/screenshot-dashboard.png` |
| 이미지 파일 | **존재하지 않음** (git 이력 전체 무결) |
| width/height 속성 | 미설정 |
| loading 속성 | 미설정 |
| onError 처리 | 실패 시 `display: none` |
| 사용자 체감 | 좌측 히어로에 텍스트만 표시 (이미지 영역은 빈 공간) |

이미지가 향후 추가되거나 동일 패턴이 다른 위치에 복제될 경우, **width/height 미설정으로 인한 CLS(Cumulative Layout Shift)** 가 발생한다. Web Vitals 지표 악화 + 사용자가 텍스트를 보던 중 이미지 로드 후 레이아웃이 점프하는 UX 결함을 유발한다.

이번 작업의 목표는 **(1) 부재한 자산을 추가하고 (2) 명시 dimensions로 CLS = 0을 보장**하는 것이다.

## 목표 / 비목표

| 구분 | 항목 |
|------|------|
| **목표** | (1) 대시보드 스크린샷 자산을 `/images/`에 추가. (2) `<img>`에 width/height 명시로 aspect-ratio 박스 사전 예약 (CLS 0). (3) `onError` 안전망 유지 (자산 누락 시 그레이스풀 폴백). |
| **비목표** | 이미지 압축/포맷 변환(WebP). 다른 페이지 이미지(현재 `<img>` 태그는 AuthLayout 1곳뿐). LCP 최적화(별도 항목). |

## 변경 대상 / 비대상

| 대상 | 현재 | 전환 후 |
|------|------|--------|
| `apps/web/public/images/screenshot-dashboard.png` | 부재 | 신규 추가 (16:10 비율, 1440×900 PNG) |
| `<img>` width 속성 | 없음 | `width={1440}` |
| `<img>` height 속성 | 없음 | `height={900}` |
| `<img>` loading 속성 | 없음 | **미설정 유지** (히어로는 above-the-fold — `loading="lazy"`는 LCP 지연) |
| `<img>` decoding 속성 | 없음 | `decoding="async"` (메인 스레드 차단 최소화) |
| `onError` 핸들러 | 있음 | 유지 (자산 누락/네트워크 실패 안전망) |
| className `max-w-[540px]` | 있음 | 유지 — 렌더 너비 540px, aspect-ratio 16:10으로 높이 약 338px 자동 |

> **README 비고 재평가**: 원 비고는 `loading="lazy"` 추가 권장. 그러나 본 이미지는 데스크톱 히어로(above-the-fold)이므로 `loading="lazy"`는 LCP를 지연시킨다. 본 설계에서는 채택하지 않는다.

## 동작 명세

### 이미지 자산 사양

| 항목 | 값 | 근거 |
|------|------|------|
| 경로 | `/images/screenshot-dashboard.png` | 코드 참조 유지 |
| 콘텐츠 | 대시보드 화면 (학년별 통계, 성별 분포, TOP5, 전례시기) | 가치 제안 시각화 |
| 해상도 (소스) | 1440 × 900 | 일반 데스크톱 뷰포트 + Retina 여유 |
| 비율 | 16 : 10 | 캡처 시 학년별 통계 테이블 전체 행이 시야 내 표시되는 최소 높이 |
| 포맷 | PNG | UI 스크린샷 (글자 선명도 우선) |
| 크기 상한 | < 200KB | 첫 화면 페이로드 영향 최소 (실측 117KB) |
| 익명화 | 학생 이름 5건 일반 가명으로 치환 | 개인정보 보호 |
| 수치 보정 | dev DB의 0% 행/극단 성별비를 자연스러운 운영 수치로 치환 | 마케팅 가치 표현 (실 데이터 미공개) |

### CLS 방지 메커니즘

```html
<img
    src="/images/screenshot-dashboard.png"
    alt="출석부 대시보드 화면"
    width={1440}
    height={900}
    decoding="async"
    className="max-w-[540px] rounded-xl border shadow-2xl"
    onError={...}
/>
```

브라우저는 `width`/`height` 속성을 수신하면 즉시 `aspect-ratio: 1440 / 900`을 계산하여 박스를 사전 예약한다. CSS `max-w-[540px]`는 렌더 너비를 540px로 제한하고, 예약된 비율에 따라 높이는 약 338px로 자동 결정된다. 이미지 다운로드 완료 후 픽셀이 채워질 뿐 박스 크기는 변하지 않아 **CLS = 0**.

### 자산 확보 방식 (실행 결과)

| 단계 | 결과 |
|------|------|
| 환경 | 로컬 dev 서버 + 사용자 dev DB 계정 로그인 |
| 캡처 | Playwright (1440×900 viewport, 대시보드 페이지 `/`) |
| 익명화 | 학생 이름 5건을 가명으로 치환(JS DOM 패치 후 캡처) |
| 데이터 보정 | 학년별 통계 5행 0% → 운영 수준 출석률(72~87%) + 성별 분포 1/35/1 → 18/1/18 (도넛 SVG path 재계산) |
| UI 보정 | 좁은 연도 콤보박스(`w-20`, "2026년" 잘림) min-width 88px로 일시 확장 |
| 결과 | 1440×900 PNG, 117KB |

## 데이터/도메인 변경

없음 (정적 자산만 추가).

## API/인터페이스

없음.

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 이미지 파일 누락 | `onError` 핸들러가 `display: none` (현재 동작 유지) — 텍스트만 표시 |
| 네트워크 실패 (404/CDN 지연) | 동일 (onError) |
| 모바일(`lg` 미만) | 좌측 영역 자체가 `hidden` — 이미지 미요청 |
| `prefers-reduced-data` | 별도 처리 없음 (200KB 미만으로 경량) |

## 테스트 시나리오

### 정상 케이스

- **TC-1**: AuthLayout 렌더 시 `<img>`에 `width="1440" height="900"` 속성 존재 (DOM 검증).
- **TC-2**: 빌드 산출물에 `dist/images/screenshot-dashboard.png` 포함 (자산 등록 확인).
- **TC-3**: 자산 < 200KB (실측 117KB ✅).

### 예외 케이스

- **TC-E1**: 이미지 src를 의도적으로 잘못된 경로로 변경 → onError로 숨김 처리 + 다른 요소(텍스트/카운트) 레이아웃 안정. (브라우저는 onError 직전까지 박스 예약 상태이므로 시프트 없음, onError 후 박스 제거로 인한 단발 시프트는 수용 — 이미지 부재 사용자 체감은 동일)

## 자기 검증 체크리스트

- [x] 동작 명세 수준 (HTML 예시 1개만, 풀 코드/의사코드 금지)
- [x] 목표를 "CLS 방지 + 자산 복원"으로 한정
- [x] README 비고와의 차이(`loading="lazy"` 미채택) 사유 명시
- [x] 변경 대상/비대상 표로 명확화
- [x] 자산 확보 방식 결정을 5단계로 위임 (설계 단계에서 차단하지 않음)
- [x] 비기능 워크플로우(Task/Dev 생략) 고려해 짧게 유지 (190줄 이내)
