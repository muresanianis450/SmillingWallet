import { test, expect } from '@playwright/test';

test('user can delete an offer', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Go to dashboard
    await page.getByText('Dashboard').click();

    // Ensure table exists
    await expect(page.getByTestId('offers-table')).toBeVisible();

    // Click delete icon (first row)
    await page.getByTestId('delete-offer-btn').first().click();

    // Modal appears
    await expect(page.getByTestId('delete-modal')).toBeVisible();

    // Confirm delete
    await page.getByTestId('confirm-delete-btn').click();

    // Toast appears
    await expect(page.getByText(/Offer deleted/i)).toBeVisible();
});
