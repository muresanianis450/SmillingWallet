import { test, expect } from '@playwright/test';

test('doctor can send an offer from request', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.getByText('Send Request').click();

    await page
        .locator('tbody tr')
        .first()
        .getByTestId('open-send-offer-btn')
        .click();

    await expect(page.getByTestId('send-offer-modal')).toBeVisible();

    await page.getByTestId('price-input').fill('250');

    await page.getByLabel('📅 Date').fill('2026-03-30');
    await page.getByLabel('🕐 Time').fill('10:30');

    await page.getByTestId('send-offer-submit-btn').click();

    await expect(page.getByText(/Offer sent to patient/i)).toBeVisible();
});
