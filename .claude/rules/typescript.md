---
origin: affaan-m/everything-claude-code@4e66b28 (rules/typescript/coding-style.md)
adapted: 2026-04-24 (school_back: 한국어, JSDoc 제거, React.FC 축약)
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript 코딩 스타일

본 문서는 `coding-style.md`(공통)에 TypeScript 특화 내용을 더한다. school_back은 100% TS이므로 JSDoc은 다루지 않는다.

## 타입과 인터페이스

### 공개 API
- export 함수, 공유 유틸, 공개 클래스 메서드에는 **파라미터·반환 타입 명시**
- 명백한 지역 변수는 추론 허용
- 반복되는 인라인 객체 형태는 명명된 타입/인터페이스로 추출

```typescript
// 잘못됨
export function formatUser(user) {
    return `${user.firstName} ${user.lastName}`;
}

// 올바름
interface User {
    firstName: string;
    lastName: string;
}

export const formatUser = (user: User): string => {
    return `${user.firstName} ${user.lastName}`;
};
```

### interface vs type
- 확장/구현 가능한 객체 형태 → `interface`
- 유니온/교차/튜플/매핑/유틸리티 타입 → `type`
- enum 대신 **string literal union** 우선 (interop 필요한 경우만 enum)

```typescript
interface User {
    id: string;
    email: string;
}

type UserRole = 'ADMIN' | 'TEACHER';
type UserWithRole = User & { role: UserRole };
```

`@school/shared/constants.ts`의 `ROLE`이 이미 이 패턴을 따른다.

### `any` 금지

- 애플리케이션 코드에서 `any` 사용 금지
- 외부/신뢰 불가 입력은 `unknown`으로 받아 narrowing
- 타입이 호출자에 따라 달라지면 generic 사용

```typescript
// 잘못됨
function getErrorMessage(error: any) {
    return error.message;
}

// 올바름
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return '알 수 없는 오류';
};
```

### React Props
- 컴포넌트 props는 명명된 `interface` 또는 `type`으로
- 콜백 prop은 명시 타입
- `React.FC` 사용 금지 — 함수 시그니처에 직접 props 타입 지정

```typescript
interface UserCardProps {
    user: User;
    onSelect: (id: string) => void;
}

function UserCard({ user, onSelect }: UserCardProps) {
    return <button onClick={() => onSelect(user.id)}>{user.email}</button>;
}
```

## 불변성

객체 업데이트는 spread 사용:

```typescript
// 잘못됨 — mutation
function updateUser(user: User, name: string): User {
    user.name = name;
    return user;
}

// 올바름
const updateUser = (user: Readonly<User>, name: string): User => {
    return { ...user, name };
};
```

## 에러 처리

async/await + try-catch + unknown narrowing:

```typescript
const loadUser = async (userId: string): Promise<User> => {
    try {
        return await riskyOperation(userId);
    } catch (error: unknown) {
        logger.error('작업 실패', error);
        throw new Error(getErrorMessage(error));
    }
};
```

## 입력 검증 (Zod)

`@school/shared/schemas/`의 패턴을 따라 Zod 스키마 정의 후 `z.infer`로 타입 추출:

```typescript
import { z } from 'zod';

const userSchema = z.object({
    email: z.string().email(),
    age: z.number().int().min(0).max(150),
});

type UserInput = z.infer<typeof userSchema>;
const validated: UserInput = userSchema.parse(input);
```

서버 진입점(tRPC procedure, Express 핸들러)에서는 항상 Zod로 재검증한다 (클라이언트 검증은 UX, 서버 검증은 보안).

## console.log

- 프로덕션 코드에 `console.log` 금지
- `apps/api`는 구조화 로거 사용 (예: pino)
- 디버그용 console은 PR 전 제거 (Stop 훅이 lint로 일부 잡지만 수동 점검 필수)

## async 정합

- 독립 작업의 순차 await → `Promise.all`
- `array.forEach(async fn)` 금지 — `for...of` 또는 `Promise.all` 사용
- floating promise(이벤트 핸들러/생성자) 금지 — 명시적 `.catch()`
