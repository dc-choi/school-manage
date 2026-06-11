import { expect, loginViaUi, test } from './fixtures';
import { type Locator, type Page } from '@playwright/test';

/**
 * 출석 화면 e2e 회귀 테스트
 *
 * 검증 대상 동작 7종: 진입 가드 / 자동 저장 / 상태 전이(◎○△, 삭제) /
 * 직렬화 수렴 / 모달 닫기 갱신 / 정렬 보존 / 실패 처리.
 *
 * 날짜 전략: 2개월 전 달만 사용 — seed 출석(최근 4주)과 절대 겹치지 않는다.
 * 같은 파일은 worker 1개에서 순차 실행되고, 모바일 프로젝트(@mobile-smoke)는
 * 다른 날짜 슬롯을 쓰므로 (학생 x 날짜) 충돌이 없다.
 *
 * seed 기준 1학년(mh1) 학생: 김민준, 이서연, 박지호 (+페이지네이션 필러)
 */

/** 2개월 전 달의 YYYY-MM-DD 문자열 (CalendarCell data-testid와 동일 포맷) */
const targetDate = (day: number): string => {
    const d = new Date();
    d.setDate(1); // 월말(29~31일)에서 setMonth 시 월 넘침 방지
    d.setMonth(d.getMonth() - 2);
    const month = String(d.getMonth() + 1).padStart(2, '0');

    return `${d.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
};

const dialog = (page: Page): Locator => page.getByRole('dialog');

const massCheckbox = (page: Page, student: string): Locator =>
    dialog(page).getByRole('checkbox', { name: `${student} 미사 출석` });

const catechismCheckbox = (page: Page, student: string): Locator =>
    dialog(page).getByRole('checkbox', { name: `${student} 교리 출석` });

/** /attendance 진입 → 그룹 자동 선택(1학년) 확인 → 2개월 전 달로 이동 */
const gotoCleanMonth = async (page: Page): Promise<void> => {
    await page.goto('/attendance');
    await expect(page.getByRole('combobox').first()).toContainText('1학년', { timeout: 15_000 });
    await page.getByRole('button', { name: '이전 월' }).click();
    await page.getByRole('button', { name: '이전 월' }).click();
};

const openModal = async (page: Page, day: number): Promise<void> => {
    await page.getByTestId(`calendar-cell-${targetDate(day)}`).click();
    await expect(dialog(page)).toBeVisible();
    // 학생 목록(dayDetail) 로딩 완료까지 대기
    await expect(dialog(page).getByRole('checkbox').first()).toBeVisible({ timeout: 15_000 });
};

const closeModal = async (page: Page): Promise<void> => {
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
};

/** 진행 중 저장이 모두 끝났는지 확인 (인디케이터 '저장 중...' 소멸 + '저장 완료' 노출) */
const waitForSaved = async (page: Page): Promise<void> => {
    await expect(dialog(page).getByText('저장 중...')).toBeHidden({ timeout: 10_000 });
    await expect(dialog(page).getByText('저장 완료')).toBeVisible();
};

test.describe('출석 화면 e2e 회귀', () => {
    test('TC-1: 로그인 → 출석부 달력 진입 (가드 체인)', async ({ page }) => {
        await loginViaUi(page);
        await page.goto('/attendance');

        await expect(page.getByText('출석부 달력').first()).toBeVisible();
        await expect(page.getByRole('combobox').first()).toContainText('1학년', { timeout: 15_000 });
        await expect(page.getByRole('button', { name: '다음 월' })).toBeVisible();
    });

    test('TC-2: 자동 저장 왕복 — 체크 → 저장 완료 → 재진입 유지 @mobile-smoke', async ({
        authedPage: page,
        isMobile,
    }) => {
        // 데스크톱/모바일 프로젝트가 같은 DB를 공유하므로 날짜 슬롯을 분리한다
        const day = isMobile ? 8 : 7;

        await gotoCleanMonth(page);
        await openModal(page, day);

        await massCheckbox(page, '김민준').click();
        await waitForSaved(page);
        await closeModal(page);

        // 모달 닫기 → 달력 갱신 (셀 출석 현황 반영, 모바일 뷰포트에서는 비율 바만 노출)
        if (!isMobile) {
            await expect(page.getByTestId(`calendar-cell-${targetDate(day)}`)).toContainText('미사 1 교리 0');
        }

        // 재진입 시 서버 상태와 일치 (멱등성 종단 확인)
        await openModal(page, day);
        await expect(massCheckbox(page, '김민준')).toBeChecked();
        await expect(catechismCheckbox(page, '김민준')).not.toBeChecked();
    });

    test('TC-3: 상태 전이 — ◎(미사+교리) 저장 후 전체 해제 시 삭제 경로 왕복', async ({ authedPage: page }) => {
        await gotoCleanMonth(page);
        await openModal(page, 14);

        // 미사+교리 체크 → ◎
        await massCheckbox(page, '박지호').click();
        await catechismCheckbox(page, '박지호').click();
        await waitForSaved(page);
        await closeModal(page);

        await openModal(page, 14);
        await expect(massCheckbox(page, '박지호')).toBeChecked();
        await expect(catechismCheckbox(page, '박지호')).toBeChecked();

        // 전체 해제 → '' 토큰 → 서버 레코드 삭제
        await massCheckbox(page, '박지호').click();
        await catechismCheckbox(page, '박지호').click();
        await waitForSaved(page);
        await closeModal(page);

        await openModal(page, 14);
        await expect(massCheckbox(page, '박지호')).not.toBeChecked();
        await expect(catechismCheckbox(page, '박지호')).not.toBeChecked();
    });

    test('TC-4: 빠른 연속 토글 — 최종 상태로 수렴 (직렬화)', async ({ authedPage: page }) => {
        await gotoCleanMonth(page);
        await openModal(page, 21);

        // 동일 학생 같은 체크박스 3연속 토글 (체크 → 해제 → 체크 = 최종 체크)
        await massCheckbox(page, '김민준').click();
        await massCheckbox(page, '김민준').click();
        await massCheckbox(page, '김민준').click();

        // 다수 학생 연속 변경
        await massCheckbox(page, '이서연').click();
        await catechismCheckbox(page, '이서연').click();

        await waitForSaved(page);
        await closeModal(page);

        // 재진입 시 마지막 조작 상태와 정확히 일치 (중간 상태 잔존 없음)
        await openModal(page, 21);
        await expect(massCheckbox(page, '김민준')).toBeChecked();
        await expect(catechismCheckbox(page, '김민준')).not.toBeChecked();
        await expect(massCheckbox(page, '이서연')).toBeChecked();
        await expect(catechismCheckbox(page, '이서연')).toBeChecked();
    });

    test('TC-5: 정렬 변경 — 모달 재진입 시 sessionStorage로 유지', async ({ authedPage: page }) => {
        await gotoCleanMonth(page);
        await openModal(page, 16);

        await dialog(page).getByLabel('정렬').click();
        await page.getByRole('option', { name: '가나다 순' }).click();
        await expect(dialog(page).getByLabel('정렬')).toContainText('가나다 순');
        await closeModal(page);

        await openModal(page, 16);
        await expect(dialog(page).getByLabel('정렬')).toContainText('가나다 순');
    });

    test('TC-E1: 네트워크 오류 — 저장 실패 표시 후 재시도로 복구', async ({ authedPage: page }) => {
        await gotoCleanMonth(page);
        await openModal(page, 28);

        await page.route('**/trpc/attendance.update**', (route) => route.abort());
        await catechismCheckbox(page, '김민준').click();

        await expect(dialog(page).getByText('저장 실패')).toBeVisible();
        const retryButton = dialog(page).getByRole('button', { name: '재시도' });
        await expect(retryButton).toBeVisible();

        // 차단 해제 후 '재시도' → 실패분(김민준 교리)이 현재 체크 상태 기준으로 재전송되어 저장
        await page.unroute('**/trpc/attendance.update**');
        await retryButton.click();
        await waitForSaved(page);
        await closeModal(page);

        await openModal(page, 28);
        await expect(catechismCheckbox(page, '김민준')).toBeChecked();
    });

    test('TC-E2: 저장 직후 즉시 모달 닫기 — 요청 유실 없음 (cleanup)', async ({ authedPage: page }) => {
        await gotoCleanMonth(page);
        await openModal(page, 2);

        // 클릭 전에 응답 감시를 먼저 등록한다 (등록 시점 이후 응답만 잡힘)
        const saved = page.waitForResponse((response) => response.url().includes('attendance.update'));

        // 응답을 기다리지 않고 즉시 닫는다 — 닫기가 진행 중 요청을 중단시키면 안 됨
        await massCheckbox(page, '이서연').click();
        await closeModal(page);
        expect((await saved).ok()).toBe(true);

        await openModal(page, 2);
        await expect(massCheckbox(page, '이서연')).toBeChecked();
    });

    test('TC-E3: 비로그인 /attendance 직접 진입 — /login 리다이렉트', async ({ page }) => {
        await page.goto('/attendance');
        await page.waitForURL((url) => url.pathname === '/login');
        await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
    });
});
