-- Migration: Add display_name column to account table
-- Date: 2026-01-25
-- Description: 회원가입 기능을 위해 표시용 이름 컬럼 추가

-- 1. display_name 컬럼 추가
ALTER TABLE account ADD COLUMN display_name VARCHAR(20) NOT NULL DEFAULT '' AFTER name;

-- 2. 기존 계정의 display_name을 name으로 초기화
UPDATE account SET display_name = name WHERE display_name = '';
