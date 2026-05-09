# 위클리스쿨 로고

브랜드 코어와 디자인 키워드는 [README.md](./README.md) 참조.

## 확정 방향 (2026-05-09 → 2026-05-09 v2)

> ![logo reference](./assets/logo-reference.jpg)
> 정식 레퍼런스: [`assets/logo-reference.jpg`](./assets/logo-reference.jpg)

> **v2 (2026-05-09)**: 초안의 sunburst(햇살) 모티프가 욱일기를 연상시킨다는 피드백을 받아 햇살을 제거. 잔존 요소(워드마크 + 웃는 ◎ + amber 별 + sparkle)로 재구성. 변경 이력은 본 문서 하단 "탐색 이력" 참조.

### 구성 요소

| 영역      | 내용                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| 컨테이너  | 라운드 사각형 (코너 큼), 크림색 배경 `#FAFAF9`, 외곽 베이지 `#E8DFCC` 테두리 (두꺼움)                                  |
| 중앙 상단 | **WEEKLY SCHOOL** 영문 워드마크 (2줄, ExtraBold, 인디고 `#4F46E5`) — 컨테이너 좌우에 거의 닿을 정도로 큼               |
| 중앙 하단 | 웃는 `◎` 마크 — **외곽 굵은 인디고 링 + 안쪽 인디고 링 + 두 점 눈 + 작은 곡선 입**, 뒤에 강한 amber 광채 (메인 모티프) |
| 우상단    | amber 별 1개 (장식 포인트, 따뜻함)                                                                                     |
| 우하단    | sparkle 점 2개 (안쪽 + 바깥쪽), 흰색 옅음                                                                              |

### 컬러

| 역할                       | 컬러                  |
| -------------------------- | --------------------- |
| Primary (워드마크, ◎ 라인) | Indigo `#4F46E5`      |
| Accent (별, 광채, sparkle) | Amber `#FBBF24`       |
| Background                 | Cream `#FAFAF9`       |
| 컨테이너 외곽              | 옅은 베이지 `#F5EFE0` |

### 의미

- **웃는 ◎** = 출석 인정 마크(`PRESENT_MARKS`의 ◎)에 친근한 표정. 도구가 아닌 친구로서의 정체성.
- **별** = 모임에서 빛나는 한 명, 따뜻한 빛의 포인트. (이전 햇살이 담당하던 "따뜻함"의 자리를 흡수)
- **인디고+앰버** = 신뢰(인디고) × 따뜻함(앰버)의 이중 톤.

## 베리에이션 (제작 예정)

| 폼팩터             | 용도                               | 비고                                          |
| ------------------ | ---------------------------------- | --------------------------------------------- |
| Full lockup (확정) | 인스타 프로필, 카드뉴스 표지, 명함 | 위 레퍼런스 그대로                            |
| Symbol only        | 앱 아이콘, 파비콘, 워터마크        | 웃는 ◎만 (워드마크 제거)                      |
| Wordmark only      | 본문 인용, 푸터                    | "WEEKLY SCHOOL" 영문 + 한글 "위클리스쿨" 보조 |
| Mono (단색)        | 흑백 인쇄, 어두운 배경 위          | 인디고 단색 또는 흰색 단색                    |
| 한글 워드마크 락업 | 국내 카드뉴스 표지                 | "위클리스쿨" Pretendard ExtraBold 추가 락업   |

## 이미지 생성 프롬프트 (재현용)

레퍼런스와 동일한 톤으로 재생성/변형이 필요할 때 사용:

```
A cute, warm, modern minimal app icon logo for a Korean Catholic Sunday-school attendance app. Composition: a soft cream rounded-square container (#FAFAF9) with a thicker beige border (#E8DFCC). In the upper-middle area, the wordmark "WEEKLY SCHOOL" stacked on two lines, deep indigo (#4F46E5), heavy ExtraBold geometric sans-serif, very large, almost touching the container's left/right padding. Below the wordmark sits the main motif: a smiling concentric-circle attendance mark (◎) with a thick indigo outer ring, a thinner indigo inner ring, cream fill in the very center, two small indigo dot eyes, and a tiny indigo upward-curve smiling mouth. A strong warm amber glow halo (#FBBF24) surrounds the ◎ behind it, fading outward. A small amber star (#FBBF24) sits at the top-right corner. Two small white sparkle dots near the bottom-right (one inside the container, one slightly outside). Flat 2D vector, no 3D, no harsh gradient, soft clean look. Mood: warm, trustworthy, slightly cute, comforting, modern Korean indie app aesthetic. Absolutely no cross, no church, no halo around a head, no explicit religious symbols. Absolutely no sunburst, no rising-sun rays, no fan-shaped radiating lines (avoids any visual association with imperial Japanese flag).
```

## 사용 규칙

### Do

- 워드마크, 웃는 ◎의 **상대 위치/비율을 보존**한다 (워드마크 위, ◎ 아래, 컨테이너 세로 중앙 약간 위에서 시작).
- 별(우상단), sparkle(우하단)은 작게 유지 — 메인 요소를 압도하지 않도록.
- 단색 적용이 필요하면 인디고 한 가지로 통일.
- 인스타 프로필, 카드뉴스 표지, 온보딩 화면에서 우선 사용.

### Don't

- **sunburst, 햇살, rising-sun, 부채꼴 방사 라인을 어떤 형태로든 추가하지 않는다** — 욱일기 연상 우려로 v2에서 제거. amber 색을 햇살 형태로 쓰는 것 자체를 금지.
- 웃는 ◎의 표정 변형 금지 (눈 큰 변형, 윙크 등 금지) — 표정이 필요한 자리는 캐릭터 주이가 담당.
- 워드마크 영문을 다른 폰트(필기체, 세리프)로 교체 금지.
- amber 액센트(별, 광채, sparkle) 색을 인디고로 바꾸지 않는다 (반드시 amber 유지).
- 십자가, 후광, 교회 첨탑 등 종교 직접 심볼 합성 금지.

## 적용 체크리스트

- [x] SVG 작성 → `apps/web/public/logo.svg` 신규 (벡터 마스터, v2 사양)
- [x] 파비콘 갱신 (`favicon.png`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png`, `apple-touch-icon.png`)
- [x] OG 이미지 갱신 (`og-image.png`)
- [x] **레퍼런스 이미지 갱신** (`assets/logo-reference.jpg`) — 사용자가 직접 디자인한 v2 마스터로 교체 (2026-05-09)
- [ ] 인스타 프로필 사진 교체 (`@weekly-school`)
- [ ] 인스타 카드뉴스 워터마크 적용 (028번부터)
- [ ] 한글 워드마크 락업 추가 제작 ("위클리스쿨" Pretendard ExtraBold)

## 탐색 이력 (참고)

> 컨셉/리비전 단계에서 검토한 대안. 확정안 선정 후 보존 차원에서만 기록.

| 안                          | 모티프                               | 결과                                                                                                        |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| A. 주간 그리드 + ◎          | 7칸 달력 + 주일 ◎                    | 보류 — 도메인 직결성은 강하나 정서가 약함                                                                   |
| B. 햇살 + 워드마크 + 웃는 ◎ | sunburst + WEEKLY SCHOOL + 웃는 ◎    | 1차 채택(2026-05-09 v1) → **폐기(2026-05-09 v2)** — sunburst가 욱일기 연상 피드백, 햇살 제거 후 v2로 재구성 |
| **B′ (v2 확정)**            | 워드마크 + 웃는 ◎ + amber 별/sparkle | **선택** — 햇살 제거, 별이 따뜻함 포인트 흡수, 종교/제국주의 연상 모두 회피                                 |
| C. 둘러앉은 점              | 7개 점 모임                          | 보류 — 추상도 높음, 추후 커뮤니티 라인 확장 시 재검토                                                       |
