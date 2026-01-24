# ===== Stage 1: Builder =====
FROM node:24-alpine AS builder

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 의존성 설치 (캐시 활용)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile

# 소스 복사 및 빌드 (API만)
COPY . .
RUN pnpm turbo build --filter=@school/api

# ===== Stage 2: Runner =====
FROM node:24-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile --prod

# 빌드 산출물 복사
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/trpc/dist ./packages/trpc/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist

# Prisma 생성된 클라이언트 복사 (builder에서 이미 생성됨)
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/src/app.js"]