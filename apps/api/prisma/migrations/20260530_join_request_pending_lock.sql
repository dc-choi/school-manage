-- Migration: join_request 단일 PENDING 강제 (pending_lock 컬럼 + unique)
-- Date: 2026-05-30
-- Feature: 미소속 계정 단일 PENDING 강제 (A-3)
-- Description:
--   미소속 계정이 여러 조직에 동시 PENDING 합류 요청을 쌓는 것을 DB 레벨에서 차단한다.
--   MySQL은 partial unique index를 지원하지 않으므로, PENDING일 때만 값을 갖는
--   marker 컬럼 pending_lock(TINYINT(1), NULL 허용)을 두고 (account_id, pending_lock)에
--   unique 제약을 건다. MySQL unique 인덱스는 NULL을 distinct로 취급하므로 비-PENDING 행
--   (pending_lock=NULL)은 계정당 다건 공존 가능하고, PENDING 행(pending_lock=1)은 계정당 1건만 허용된다.

-- Up Migration
ALTER TABLE join_request ADD COLUMN pending_lock TINYINT(1) NULL;

-- 백필: 계정별 최신 PENDING 1건만 lock=1 부여.
-- 기존에 중복 PENDING이 있어도 1건만 lock을 가지므로 아래 UNIQUE 추가가 실패하지 않는다.
-- 나머지 중복 PENDING은 lock NULL로 보존(status는 그대로) → 신규 요청은 앱의 findFirst가 차단,
-- 승인은 approve-join의 조건부 update(O-1)가 차단하므로 무해하다.
-- 마이그레이션 세션에서 safe-update 모드를 끈다: 집합 기반 백필은 key=상수 WHERE를 쓸 수 없어
-- sql_safe_updates=1 환경(일부 클라이언트/서버 기본값)에서 Error 1175로 차단되기 때문이다.
-- WHERE _id IN (...)로 업데이트 대상을 명시(전체 행 업데이트 아님)하고, 내부 파생 테이블로 감싸
-- 대상 테이블 self-update 오류(MySQL 1093)도 회피한다.
SET SESSION sql_safe_updates = 0;
UPDATE join_request
SET pending_lock = 1
WHERE _id IN (
    SELECT keep_id FROM (
        SELECT MAX(_id) AS keep_id
        FROM join_request
        WHERE status = 'pending'
        GROUP BY account_id
    ) latest
);

ALTER TABLE join_request ADD UNIQUE INDEX uq_join_request_account_pending (account_id, pending_lock);

-- Down Migration (rollback)
-- ALTER TABLE join_request DROP INDEX uq_join_request_account_pending;
-- ALTER TABLE join_request DROP COLUMN pending_lock;

-- Notes:
-- - 앱은 PENDING 생성 시 pending_lock=1, PENDING→APPROVED/REJECTED 전이 시 pending_lock=NULL로 관리한다.
--   전이 지점: request-join(생성), approve-join, reject-join, delete-account(조직 삭제 시 자동 reject + 본인 PENDING 정리).
-- - prod 적용 후 동시 요청 경합은 이 unique 제약이 차단하고, 앱은 P2002 위반을 CONFLICT로 변환한다.
-- - [prod 적용 전 점검] 기존 중복 PENDING 확인:
--     SELECT account_id, COUNT(*) FROM join_request WHERE status='pending' GROUP BY account_id HAVING COUNT(*) > 1;
--   결과가 있으면 위 백필이 계정당 최신 1건만 lock=1, 나머지는 lock=NULL로 두어 unique는 통과한다. 단 lock=NULL인
--   잔여 PENDING은 앱 findFirst가 신규 요청을 차단하므로, 필요 시 해당 계정의 잉여 PENDING을 수동 REJECT 처리한다.
