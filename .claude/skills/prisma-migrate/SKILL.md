---
name: prisma-migrate
description: Prisma 스키마 변경 후 수동 SQL 마이그레이션 파일 생성 및 적용
---

# /prisma-migrate

Prisma 스키마 변경 후 수동 SQL 마이그레이션 파일을 생성하고 DB에 적용합니다.

## 실행 단계

1. `git diff apps/api/prisma/schema.prisma`로 스키마 변경사항 확인
2. 변경사항 분석 후 SQL 마이그레이션 파일 작성
   - 경로: `apps/api/prisma/migrations/YYYYMMDD_설명.sql`
   - 날짜는 오늘 날짜 사용
   - 설명은 snake_case (예: `add_student_snapshot`)
3. SQL 파일 형식:
   ```sql
   -- Migration: 변경 설명
   -- Date: YYYY-MM-DD
   -- Feature: 관련 기능명
   -- Description: 상세 설명

   -- Up Migration
   ALTER TABLE ...;

   -- Down Migration (rollback)
   -- ALTER TABLE ...;

   -- Notes:
   -- - 참고사항
   ```
4. 사용자 확인 후 `pnpm --filter @school/api prisma db push`로 스키마 적용
5. `pnpm --filter @school/api prisma generate`로 클라이언트 재생성

## 주의사항

- 프로덕션 DB에 직접 적용하지 않음
- 데이터 손실 가능성 있는 변경(컬럼 삭제, 타입 변경 등)은 사용자에게 경고
- Down Migration은 주석으로 작성 (롤백 참고용)
- `prisma db push`는 개발 DB에만 사용
