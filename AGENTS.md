# Codex Repository Guide

This file is a Codex compatibility bridge. The existing Claude configuration remains the repository source of truth.

## Canonical context

- Before substantial work, read .claude/CLAUDE.md completely.
- Read .claude/user.md when product, user, business, copy, or prioritization context matters.
- Do not duplicate Claude rules into Codex-only files. Update the canonical .claude source when a shared rule changes.
- Verified source code, executable configuration, and CI behavior take precedence over stale examples in prose.
- The database is MySQL. Ignore PostgreSQL-specific guidance in older reviewer prompts.

## Rule routing

Read the common rules when changing code:

- .claude/rules/coding-style.md
- .claude/rules/typescript.md for TypeScript or TSX
- .claude/rules/code-review.md when reviewing changes

Read these additional rules before editing matching paths:

| Path                                 | Rules                                                                |
| ------------------------------------ | -------------------------------------------------------------------- |
| apps/api/\*\*                        | .claude/rules/api.md                                                 |
| apps/web/\*\*                        | .claude/rules/web.md, web-patterns.md, design.md, design-patterns.md |
| packages/shared/\*\*                 | .claude/rules/shared.md                                              |
| packages/trpc/\*\*                   | .claude/rules/trpc.md                                                |
| packages/utils/\*\*                  | .claude/rules/utils.md                                               |
| docs/specs/\*\*                      | .claude/rules/specs.md, specs-lifecycle.md                           |
| docs/business/\*\*                   | .claude/rules/business.md                                            |
| docs/content/\*\*                    | .claude/rules/content.md                                             |
| docs/content/instagram/feed/\*\*     | .claude/rules/content-templates-feed.md                              |
| docs/content/instagram/reel/\*\*     | .claude/rules/content-templates-reel.md                              |
| docs/content/instagram/combined/\*\* | .claude/rules/content-templates-combined.md                          |

## Claude to Codex translation

- Repository skills are exposed through .agents/skills and keep .claude/skills as their source.
- Treat Claude slash skill names as the same Codex skill name. For example, /pre-pr maps to the pre-pr skill.
- Translate Claude Task calls to Codex subagents. Use the matching custom agent under .codex/agents when available.
- Translate Read, Grep, Glob, Edit, Write, and Bash references to the equivalent Codex tools.
- When a skill asks for brainstorm-rules, use the actual bs-rules skill.
- Do not use Claude-specific model names, status-line settings, or permission modes as Codex configuration.
- Do not add Claude Code attribution to commits or pull requests created by Codex.
- A skill mentioning automatic commit, push, or PR creation does not authorize it. Perform external Git actions only when the user explicitly requests them.

## Working policy

- Respond in Korean unless the user asks for another language.
- Use Semble for behavior or architecture candidate discovery, then verify with source reads and rg.
- Use rg directly for exact strings, symbols, routes, settings, and exhaustive reference checks.
- Delegate broad independent investigation or review to subagents. Keep simple one-file lookups local.
- Plan first for a new domain or entity, a DB schema change, an architecture or package change, or edits spanning at least three files.
- Follow the implementation order Backend, Frontend, tests when the feature crosses those layers.
- Keep documentation at or below 190 lines. Split by logical section before exceeding the limit.
- Customer-facing copy must not use the banned wording documented in .claude/CLAUDE.md.
- Use the Catholic domain wording from .claude/CLAUDE.md in visible copy, while preserving weekday names in code, calendars, and tests.
- Confirm real product behavior before writing product or marketing content.

## Safety

- Never read or edit real .env files. Work with .env.example files only.
- Do not edit lockfiles directly. Let the package manager update them.
- Do not modify existing Prisma migration SQL. Use the prisma-migrate skill for schema changes.
- Never bypass Git hooks with --no-verify.
- Preserve unrelated user changes in a dirty worktree.
- Do not use destructive Git restore, checkout, or reset commands for cleanup.

## Validation

- Root commands are defined in package.json and orchestrated by Turbo.
- Normal quality gates are lint, prettier, typecheck, build, and test.
- API integration tests require the configured MySQL test database.
- E2E tests reset the isolated school_e2e database and require ports 9000 and 9080 to be free.
- Run the smallest relevant validation first, then expand according to change risk.
- If validation cannot start because of missing services, credentials, or network access, report that separately from code failures.
