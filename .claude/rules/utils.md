---
paths:
  - "packages/utils/**"
---

# Utils Package Rules (@school/utils)

프로젝트 전역에서 사용되는 공유 유틸리티 함수 패키지입니다.

## 구조

```
packages/utils/
├── src/
│   ├── index.ts      # 전체 export
│   ├── date.ts       # 날짜/시간 유틸리티
│   ├── format.ts     # 포맷팅 유틸리티
│   ├── object.ts     # 객체 유틸리티
│   └── math.ts       # 수학/계산 유틸리티
├── test/             # 테스트 (92 cases)
├── vitest.config.ts
└── package.json
```

## 제공 함수

### 날짜/시간 (date.ts)

| 함수 | 설명 |
|------|------|
| `getNowKST()` | 현재 시간을 KST(UTC+9)로 반환 |
| `addDays(date, days)` | 날짜에 일수 더하기 |
| `getThisWeekSunday(date)` | 해당 주의 일요일 반환 |
| `getThisWeekSaturday(date)` | 해당 주의 토요일 반환 |
| `countSundays(startDate, endDate)` | 기간 내 일요일 수 계산 |
| `countSundaysInYear(year)` | 연간 일요일 수 계산 |
| `getNthSundayOf(year, month, n)` | N번째 주일 계산 |
| `getNthSaturdayOf(year, month, n)` | N번째 토요일 계산 |
| `getLastSundayOf(year, month)` | 해당 월의 마지막 주일 계산 |
| `calculateEaster(year)` | 부활 대축일 계산 |

### 포맷팅 (format.ts)

| 함수 | 설명 |
|------|------|
| `formatContact(contact)` | 연락처 포맷팅 (010-XXXX-XXXX) |
| `formatDateCompact(date)` | Date → YYYYMMDD 형식 |
| `formatDateISO(date)` | Date → YYYY-MM-DD 형식 |

### 객체 (object.ts)

| 함수 | 설명 |
|------|------|
| `prune(obj)` | 객체에서 null/undefined 값을 가진 속성 제거 |

### 수학/계산 (math.ts)

| 함수 | 설명 |
|------|------|
| `roundToDecimal(value, places)` | 소수점 N자리까지 반올림 |
| `calculateRate(actual, expected, places)` | 비율 계산 (%) |

## 사용법

```typescript
import {
    getNowKST,
    countSundaysInYear,
    formatDateCompact,
    formatContact,
    roundToDecimal,
    prune,
} from '@school/utils';

// 날짜
const now = getNowKST();
const sundays = countSundaysInYear(2026); // 52

// 포맷팅
const dateStr = formatDateCompact(new Date()); // '20260124'
const phone = formatContact(1012345678); // '010-1234-5678'

// 계산
const rate = roundToDecimal(85.567, 1); // 85.6

// 객체
const cleaned = prune({ a: 1, b: null }); // { a: 1 }
```

## Commands

```bash
pnpm build              # TypeScript 빌드 (tsc -b)
pnpm dev                # 빌드 감시 (tsc --watch)
pnpm test               # 테스트 실행
pnpm test:watch         # 워치 모드
```

## 주의사항

- API/Web 특정 유틸리티는 이 패키지에 포함하지 않음
- 순수 함수만 포함 (side effect 없음)
- 외부 의존성 없음