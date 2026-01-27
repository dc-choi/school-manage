# GA4 설정 가이드

Google Analytics 4 (GA4)를 설정하여 사용자 행동을 추적하는 방법입니다.

## 1. GA4 속성 생성

### 1.1 Google Analytics 접속
1. [Google Analytics](https://analytics.google.com/) 접속
2. Google 계정으로 로그인

### 1.2 속성 생성
1. 좌측 하단 **관리** (톱니바퀴) 클릭
2. **속성 만들기** 클릭
3. 속성 이름 입력 (예: `주일학교 출석부`)
4. 시간대: `대한민국`
5. 통화: `대한민국 원(₩)`
6. **다음** 클릭 후 업종/규모 선택
7. **만들기** 클릭

### 1.3 데이터 스트림 생성
1. **데이터 스트림** > **스트림 추가** > **웹**
2. 웹사이트 URL 입력 (예: `https://your-domain.com`)
3. 스트림 이름 입력 (예: `주일학교 출석부 웹`)
4. **스트림 만들기** 클릭

### 1.4 측정 ID 확인
스트림 생성 후 **측정 ID**를 확인합니다.
- 형식: `G-XXXXXXXXXX`
- 이 값을 `VITE_GA4_MEASUREMENT_ID`로 사용

---

## 2. 서버 사이드 설정 (Measurement Protocol)

### 2.1 API Secret 생성
1. 데이터 스트림 상세 페이지 접속
2. **Measurement Protocol API 비밀번호** 섹션
3. **만들기** 클릭
4. 닉네임 입력 (예: `server-side`)
5. **만들기** 클릭
6. 생성된 **비밀번호 값**을 `GA4_API_SECRET`으로 사용

---

## 3. 환경변수 설정

### 3.1 클라이언트 (웹 앱 - Vite)

#### Vite 환경변수 규칙
- **`VITE_` 접두사 필수**: Vite는 `VITE_`로 시작하는 환경변수만 클라이언트에 노출
- **빌드 시점에 주입**: 환경변수는 `vite build` 실행 시 번들에 포함됨
- **런타임 변경 불가**: 빌드 후에는 환경변수 값 변경 불가

#### 파일 위치
```
apps/web/
├── .env              # 기본값 (git에 커밋 가능)
├── .env.local        # 로컬 개발용 (git 무시)
├── .env.development  # 개발 환경
└── .env.production   # 프로덕션 환경
```

#### 설정 예시
`apps/web/.env.local` 또는 `apps/web/.env.production`:
```bash
# GA4 측정 ID (클라이언트)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 코드에서 사용
```html
<!-- index.html에서 직접 사용 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=%VITE_GA4_MEASUREMENT_ID%"></script>
```

```typescript
// TypeScript에서 사용
const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
```

### 3.2 서버 (API)

`apps/api/.env.local` 또는 `apps/api/.env`:
```bash
# GA4 Measurement Protocol (서버 사이드)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your-api-secret-here
```

> **Note**: 서버 사이드 GA4는 선택사항입니다. 환경변수가 없으면 비활성화됩니다.

---

## 4. 배포 환경 설정

### 4.1 Docker 배포

`docker-compose.yml`에서 환경변수 전달:
```yaml
services:
  web:
    build:
      context: .
      args:
        # 빌드 시점에 환경변수 전달
        VITE_GA4_MEASUREMENT_ID: ${VITE_GA4_MEASUREMENT_ID}
    environment:
      - NODE_ENV=production

  api:
    environment:
      # 런타임 환경변수
      - GA4_MEASUREMENT_ID=${GA4_MEASUREMENT_ID}
      - GA4_API_SECRET=${GA4_API_SECRET}
```

`Dockerfile` (웹 앱):
```dockerfile
# 빌드 인자로 환경변수 받기
ARG VITE_GA4_MEASUREMENT_ID
ENV VITE_GA4_MEASUREMENT_ID=$VITE_GA4_MEASUREMENT_ID

# 빌드 실행 (환경변수가 번들에 포함됨)
RUN pnpm build
```

### 4.2 CI/CD (GitHub Actions 예시)

```yaml
jobs:
  build:
    steps:
      - name: Build Web App
        env:
          VITE_GA4_MEASUREMENT_ID: ${{ secrets.GA4_MEASUREMENT_ID }}
        run: pnpm --filter @school/web build
```

### 4.3 환경별 측정 ID 분리 (권장)

개발/스테이징/프로덕션 환경에서 별도 GA4 속성 사용:

| 환경 | 측정 ID | 용도 |
|------|---------|------|
| 개발 | `G-DEV123456` | 개발 중 테스트 |
| 스테이징 | `G-STG123456` | QA 테스트 |
| 프로덕션 | `G-PROD12345` | 실제 사용자 데이터 |

```bash
# .env.development
VITE_GA4_MEASUREMENT_ID=G-DEV123456

# .env.production
VITE_GA4_MEASUREMENT_ID=G-PROD12345
```

### 4.4 주의사항

1. **빌드 시점 주입**: 웹 앱의 `VITE_` 환경변수는 빌드할 때 결정됨
2. **민감 정보 노출 주의**: `VITE_` 변수는 브라우저에서 볼 수 있음 (측정 ID는 공개해도 무방)
3. **서버 환경변수는 런타임**: API 서버의 환경변수는 컨테이너 시작 시 읽음
4. **캐시 무효화**: 환경변수 변경 후 반드시 재빌드 필요

---

## 5. 추적되는 이벤트

### 클라이언트 이벤트 (gtag.js)

| 이벤트 | 트리거 | 파라미터 |
|--------|--------|----------|
| `sign_up` | 회원가입 완료 | `method: 'form'` |
| `login` | 로그인 성공 | `method: 'form'` |
| `first_group_created` | 첫 그룹 생성 | `days_since_signup` |
| `first_student_registered` | 첫 학생 등록 | `days_since_signup` |
| `first_attendance_recorded` | 첫 출석 기록 | `days_since_signup` |
| `attendance_recorded` | 출석 저장 | `student_count` |

### 서버 이벤트 (Measurement Protocol)

| 이벤트 | 트리거 | 파라미터 |
|--------|--------|----------|
| `student_graduated` | 졸업 처리 완료 | `student_count` |

---

## 6. GA4에서 데이터 확인

### 6.1 실시간 보고서
1. GA4 > **보고서** > **실시간**
2. 이벤트가 즉시 표시됨

### 6.2 이벤트 보고서
1. GA4 > **보고서** > **참여도** > **이벤트**
2. 커스텀 이벤트 목록 확인

### 6.3 탐색 분석 (퍼널)
1. GA4 > **탐색**
2. **유입경로 탐색 분석** 템플릿 선택
3. 단계 설정:
   - `sign_up` → `first_group_created` → `first_student_registered` → `first_attendance_recorded`

---

## 7. 문제 해결

### 이벤트가 안 보여요
1. **측정 ID 확인**: `VITE_GA4_MEASUREMENT_ID`가 올바른지 확인
2. **브라우저 콘솔**: `[Analytics]` 로그 확인
3. **광고 차단기**: 비활성화 후 테스트
4. **실시간 보고서**: 데이터 처리에 24-48시간 소요될 수 있음

### 서버 이벤트가 안 보여요
1. **환경변수 확인**: `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` 설정 확인
2. **서버 로그 확인**: `GA4 event sent:` 또는 `GA4 event failed:` 로그 확인
3. **API Secret 권한**: Measurement Protocol API 비밀번호가 활성화되어 있는지 확인

---

## 8. 참고 자료

- [GA4 공식 문서](https://developers.google.com/analytics/devguides/collection/ga4)
- [Measurement Protocol 가이드](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [gtag.js 레퍼런스](https://developers.google.com/tag-platform/gtagjs/reference)
