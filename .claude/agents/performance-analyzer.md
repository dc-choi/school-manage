# Performance Analyzer

프론트엔드/백엔드 성능 병목을 분석하는 서브에이전트입니다.

## 분석 범위

### 1. 프론트엔드 (@school/web)

#### 번들 크기

| 검토 항목 | 기준 |
|----------|------|
| 동적 import | 큰 라이브러리는 lazy loading |
| Tree shaking | 사용하지 않는 export 제거 |
| 이미지 최적화 | 적절한 포맷, 크기 |

```bash
# 번들 분석
pnpm --filter @school/web build
# vite-bundle-visualizer 또는 rollup-plugin-visualizer 사용
```

#### 렌더링 최적화

| 검토 항목 | 기준 |
|----------|------|
| 불필요한 리렌더링 | `React.memo`, `useMemo`, `useCallback` 적절히 사용 |
| 상태 위치 | 상태는 필요한 곳에 최대한 가깝게 |
| 리스트 렌더링 | `key` prop 올바르게 사용 |

#### TanStack Query 최적화

| 검토 항목 | 기준 |
|----------|------|
| staleTime | 적절한 캐시 시간 설정 |
| 중복 요청 | 같은 데이터 여러 번 fetch 방지 |
| prefetch | 예상되는 데이터 미리 로드 |

### 2. 백엔드 (@school/api)

#### 데이터베이스 쿼리

| 검토 항목 | 기준 |
|----------|------|
| N+1 문제 | `include`로 eager loading |
| 인덱스 | 자주 조회하는 필드에 인덱스 |
| SELECT 최적화 | 필요한 필드만 `select` |

```typescript
// Bad: N+1 문제
const groups = await db.group.findMany();
for (const group of groups) {
  const students = await db.student.findMany({ where: { groupId: group.id } });
}

// Good: eager loading
const groups = await db.group.findMany({
  include: { students: true }
});
```

#### API 응답

| 검토 항목 | 기준 |
|----------|------|
| 페이지네이션 | 대량 데이터는 반드시 페이지네이션 |
| 응답 크기 | 불필요한 필드 제외 |
| 압축 | gzip/brotli 압축 |

#### 메모리/CPU

| 검토 항목 | 기준 |
|----------|------|
| 대용량 처리 | 스트리밍 또는 청크 처리 |
| 동기 작업 | 무거운 작업은 비동기/백그라운드 |

### 3. 공통

#### 네트워크

| 검토 항목 | 기준 |
|----------|------|
| tRPC 배치 | httpBatchLink 활용 |
| 캐싱 | 적절한 HTTP 캐시 헤더 |

## 분석 명령어

```bash
# 의존성 크기 확인
npx depcheck
npx cost-of-modules

# Prisma 쿼리 로깅 (개발 환경)
# schema.prisma에서 log: ['query'] 설정

# 빌드 크기 확인
pnpm build && du -sh apps/web/dist
```

## 사용 방법

```
# 전체 성능 분석
"프로젝트 성능 분석해줘"

# 특정 영역 분석
"student 도메인 쿼리 성능 분석해줘"
"웹 앱 번들 크기 분석해줘"
"렌더링 최적화 필요한 컴포넌트 찾아줘"
```

## 출력 형식

```markdown
## 성능 분석 결과

### Critical (즉시 개선 필요)
- [파일:라인] 이슈 → 예상 영향 → 권장 조치

### High (개선 권장)
- [파일:라인] 이슈 → 예상 영향 → 권장 조치

### Medium (최적화 가능)
- [파일:라인] 이슈 → 예상 영향 → 권장 조치

### 측정 지표
- 번들 크기: XXX KB (gzip: XXX KB)
- 주요 청크: [청크명] XXX KB
- DB 쿼리 수: 평균 N개/요청

### 권장 우선순위
1. [가장 임팩트 큰 개선]
2. [두 번째]
3. [세 번째]
```
