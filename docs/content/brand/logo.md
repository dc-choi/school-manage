# 위클리스쿨 로고

브랜드 코어와 디자인 키워드는 [README.md](./README.md) 참조.

## 확정 방향 (2026-05-09)

> ![logo reference](./assets/logo-reference.jpg)
> 정식 레퍼런스: [`assets/logo-reference.jpg`](./assets/logo-reference.jpg)

### 구성 요소

| 영역     | 내용                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| 컨테이너 | 라운드 사각형 (코너 큼), 크림색 배경 `#FAFAF9`, 외곽 약간 더 진한 크림 테두리   |
| 상단     | 일출(sunburst) 모티프 — 가운데가 두꺼운 13~15개의 amber 햇살 라인 부채꼴로 발산 |
| 중앙     | **WEEKLY SCHOOL** 영문 워드마크 (2줄, ExtraBold, 인디고 `#4F46E5`)              |
| 하단     | 웃는 `◎` 마크 — 동심원 + 두 점 눈 + 반달 입, 인디고 라인, 뒤에 옅은 amber 광채  |
| 우상단   | 작은 amber 별 1개 (장식 포인트, 따뜻함)                                         |
| 우하단   | 미세한 sparkle 점 (옵션)                                                        |

### 컬러

| 역할                      | 컬러                  |
| ------------------------- | --------------------- |
| Primary (워드마크·◎ 라인) | Indigo `#4F46E5`      |
| Accent (햇살·별·광채)     | Amber `#FBBF24`       |
| Background                | Cream `#FAFAF9`       |
| 컨테이너 외곽             | 옅은 베이지 `#F5EFE0` |

### 의미

- **햇살 (sunburst)** = "Sun-day의 빛", 매주 일요일 아침의 따뜻한 시작.
- **웃는 ◎** = 출석 인정 마크(`PRESENT_MARKS`의 ◎)에 친근한 표정. 도구가 아닌 친구로서의 정체성.
- **별** = 모임에서 빛나는 한 명, 그리고 즐거움 포인트.
- **인디고+앰버** = 신뢰(인디고) × 따뜻함(앰버)의 이중 톤.

## 베리에이션 (제작 예정)

| 폼팩터             | 용도                               | 비고                                          |
| ------------------ | ---------------------------------- | --------------------------------------------- |
| Full lockup (확정) | 인스타 프로필, 카드뉴스 표지, 명함 | 위 레퍼런스 그대로                            |
| Symbol only        | 앱 아이콘, 파비콘, 워터마크        | 햇살 + 웃는 ◎만 (워드마크 제거)               |
| Wordmark only      | 본문 인용, 푸터                    | "WEEKLY SCHOOL" 영문 + 한글 "위클리스쿨" 보조 |
| Mono (단색)        | 흑백 인쇄, 어두운 배경 위          | 인디고 단색 또는 흰색 단색                    |
| 한글 워드마크 락업 | 국내 카드뉴스 표지                 | "위클리스쿨" Pretendard ExtraBold 추가 락업   |

## 이미지 생성 프롬프트 (재현용)

레퍼런스와 동일한 톤으로 재생성/변형이 필요할 때 사용:

```
A cute, warm, modern minimal app icon logo for a Korean Catholic Sunday-school attendance app. Composition: a soft cream rounded-square container (#FAFAF9) with a slightly darker cream border. At the top, a fan-shaped sunburst with 13-15 thin amber yellow rays (#FBBF24) radiating upward like a rising sun, the rays evenly spaced and slightly thicker in the center. In the middle, the wordmark "WEEKLY SCHOOL" stacked on two lines, deep indigo (#4F46E5), bold geometric sans-serif. Below the wordmark, a smiling concentric circle attendance mark (◎): an outer indigo circle, two small black dot eyes inside, a tiny indigo upward-curve smiling mouth, surrounded by a soft warm amber glow halo. A small amber star (#FBBF24) sits at the top-right corner. A tiny sparkle dot at the bottom-right. Flat 2D vector, no 3D, no harsh gradient, soft clean look. Mood: warm, trustworthy, slightly cute, comforting, modern Korean indie app aesthetic. Absolutely no cross, no church, no halo around a head, no explicit religious symbols.
```

## 사용 규칙

### Do

- 햇살(sunburst)·웃는 ◎·워드마크의 **상대 위치/비율을 보존**한다.
- 별(우상단)·sparkle(우하단)은 작게 유지 — 메인 요소를 압도하지 않도록.
- 단색 적용이 필요하면 인디고 한 가지로 통일.
- 인스타 프로필·카드뉴스 표지·온보딩 화면에서 우선 사용.

### Don't

- 햇살 컬러를 인디고로 바꾸지 않는다 (반드시 amber).
- 웃는 ◎의 표정 변형 금지 (눈 큰 변형, 윙크 등 금지) — 표정이 필요한 자리는 캐릭터 주이가 담당.
- 워드마크 영문을 다른 폰트(필기체·세리프)로 교체 금지.
- 햇살에 십자가·후광·교회 첨탑 등을 합성 금지.
- 햇살 라인을 13~15개 범위 밖으로 변경 금지 (밀도 변화 시 정체성 약화).

## 적용 체크리스트

- [ ] 레퍼런스 → 벡터화 (Figma/Illustrator) → `apps/web/public/logo.svg` 교체
- [ ] 파비콘 갱신 (`favicon.png`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png`, `apple-touch-icon.png`)
- [ ] OG 이미지 갱신 (`og-image.png`)
- [ ] 인스타 프로필 사진 교체 (`@weekly-school`)
- [ ] 인스타 카드뉴스 워터마크 적용 (028번부터)
- [ ] 한글 워드마크 락업 추가 제작 ("위클리스쿨" Pretendard ExtraBold)

## 탐색 이력 (참고)

> 컨셉 단계에서 검토한 대안. 확정안 선정 후 보존 차원에서만 기록.

| 안                     | 모티프                   | 결과                                                       |
| ---------------------- | ------------------------ | ---------------------------------------------------------- |
| A. 주간 그리드 + ◎     | 7칸 달력 + 일요일 ◎      | 보류 — 도메인 직결성은 강하나 정서가 약함                  |
| **B+친근 변형 (확정)** | 햇살 + 워드마크 + 웃는 ◎ | **선택** — 따뜻함과 친근함을 동시에 만족, 캐릭터와 톤 일치 |
| C. 둘러앉은 점         | 7개 점 모임              | 보류 — 추상도 높음, 추후 커뮤니티 라인 확장 시 재검토      |
