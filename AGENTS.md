# Repository Guidelines

## Target Architecture (finalized)
- Monorepo: `pnpm` workspace with `apps/api`, `apps/web`(Vite), `packages/trpc`(tRPC).
- Task runner: Turborepo (`turbo`) with `turbo.json`.
- API: Express + tRPC (`/trpc`), access token + refresh token(HttpOnly cookie) auth.
- Web: Vite + React, tRPC client, access token in-memory + refresh cookie re-issue flow.
- Testing: Vitest (ESM-friendly). See `TESTING_VITEST.md`.
- Scheduler: stays in the API process (no `apps/worker`).
- Deploy: split deploy (web static on Nginx, api Docker image via Docker Hub private); see `DEPLOY_DOCKERHUB.md`.
- Migration strategy: weekend **big-bang cutover** (not incremental); see `ARCHITECTURE_MONOREPO.md`.

Until the migration is implemented, the current `src/`, `test/` layout and `yarn` scripts remain valid.

## Project Structure & Module Organization
Current (pre-migration):
- `src/`: TypeScript Express server.
  - `src/app.ts`: server entry; mounts routes from `src/app.router.ts`.
  - `src/api/<feature>/`: feature modules, typically `<feature>.router.ts` → `<feature>.controller.ts` → `<feature>.service.ts` → `<feature>.repository.ts`.
  - `src/models/`: Sequelize models and associations (MySQL).
  - `src/lib/`, `src/common/`, `src/@types/`: infrastructure and shared utilities/types.
- `public/`: static assets served by Express.
- `test/integration/`: legacy Mocha + Chai + Supertest integration tests (`*.test.ts`).

Target (post-migration):
- `apps/api/`: Express + tRPC server.
- `apps/web/`: Vite + React app.
- `packages/trpc/`: shared tRPC routers/types.

## Build, Test, and Development Commands
Current (pre-migration):
- Install: `yarn` (or `npm install`).
- Run locally (watch mode): `yarn serve` (nodemon + `ts-node`).
- Start (alias): `yarn start`.
- Lint: `yarn lint` / `yarn lint:fix`.
- Format: `yarn prettier` / `yarn prettier:fix`.
- Test: `yarn test` (runs `./test/**/*.test.ts` with `NODE_ENV=test`).
- Optional compile: `npx tsc -p tsconfig.json` (outputs to `dist/`).

Target (post-migration):
- Install: `pnpm install`
- Dev: `pnpm dev` (runs `turbo run dev --parallel`), or run `pnpm dev` in `apps/api` / `apps/web`
- Test: `pnpm test` (Vitest; see `TESTING_VITEST.md`)

## Coding Style & Naming Conventions
- Indentation: 4 spaces (see `.editorconfig`); use single quotes (see `.prettierrc`).
- Prefer `@/*` imports (configured in `tsconfig.json`) instead of deep relative paths.
- Keep the layer split: router (HTTP) → controller (validation/response) → service (business logic) → repository (DB access).

## Testing Guidelines
Current (pre-migration):
- Frameworks: Mocha + Chai + Supertest (legacy).
- Add/extend tests under `test/integration/` and name files `*.test.ts`.

Target (post-migration):
- Frameworks: Vitest + Supertest (HTTP), plus tRPC `createCaller` tests where possible.
- Keep integration tests sequential by default (shared DB/state).

## Commit & Pull Request Guidelines
- Commit subjects commonly use Jira-style keys, e.g. `SM-45 학생목록 검색 기능 추가` (occasionally `fix: ...`).
- Branch naming in history follows `feature/SM-45_<short-desc>` or `fix/SM-46_<short-desc>`.
- PRs: describe behavior changes, mention required env/DB changes, and include how you tested (e.g. `yarn test` pre-migration / `pnpm test` post-migration).

## Security & Configuration Tips
- Use `.env.example` as the template; keep real secrets in `.env.local` and test config in `.env.test`.
- Never commit credentials/tokens; update `.env.example` when adding new env vars.
