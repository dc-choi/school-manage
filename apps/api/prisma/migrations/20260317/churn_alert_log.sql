-- 이탈 감지 알림 발송 이력 테이블
-- 동일 단체에 7일 내 중복 알림 방지용

CREATE TABLE `churn_alert_log` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT NOT NULL,
    `inactive_days` INT NOT NULL,
    `sent_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`_id`),
    INDEX `churn_alert_log_organization_id_sent_at_idx`(`organization_id`, `sent_at`),
    CONSTRAINT `churn_alert_log_organization_id_fkey`
        FOREIGN KEY (`organization_id`) REFERENCES `organization`(`_id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
