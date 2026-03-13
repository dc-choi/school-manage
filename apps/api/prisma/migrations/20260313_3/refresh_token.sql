-- Refresh Token 테이블 생성
-- RTR (Refresh Token Rotation) + Token Family 패턴 지원

CREATE TABLE `refresh_token` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `account_id` BIGINT NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `family_id` VARCHAR(36) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `create_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`_id`),
    INDEX `refresh_token_token_hash_idx`(`token_hash`),
    INDEX `refresh_token_account_id_idx`(`account_id`),
    INDEX `refresh_token_family_id_idx`(`family_id`),
    CONSTRAINT `refresh_token_account_id_fkey`
        FOREIGN KEY (`account_id`) REFERENCES `account`(`_id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
