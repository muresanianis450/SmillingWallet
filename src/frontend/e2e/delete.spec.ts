import { test, expect } from '@playwright/test';

test('user can delete an offer', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Go to dashboard
    await page.getByText('Dashboard').click();

    // Ensure table exists
    await expect(page.locator('table')).toBeVisible();

    // Click delete button
    await page.getByTestId('delete-offer-btn').first().click();

    // Wait for modal to appear (IMPORTANT)
    await expect(page.getByTestId('delete-modal')).toBeVisible();

    // Click confirm delete
    await page.getByTestId('confirm-delete-btn').click();

    // Toast appears
    await expect(page.getByText(/Offer deleted/i)).toBeVisible();
});
