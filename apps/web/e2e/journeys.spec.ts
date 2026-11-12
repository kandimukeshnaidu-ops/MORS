import { test, expect } from '@playwright/test';

test.describe('MORS End-to-End User Journeys', () => {
  test('Journey 1: Public legal and community guidelines pages are accessible', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText('Terms of Service');

    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');

    await page.goto('/community-guidelines');
    await expect(page.locator('h1')).toContainText('Community Guidelines');
  });

  test('Journey 2: Auth routes provide secure inputs and accessibility', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await page.goto('/auth/register');
    await expect(page.getByRole('button', { name: /create food journal|create account/i })).toBeVisible();
    await expect(page.getByLabel(/invite code/i)).toBeVisible();
  });

  test('Journey 3: Unified find and search typeahead and mode selector function with URL sync', async ({ page }) => {
    await page.goto('/find');
    await expect(page.locator('h1')).toContainText('Find');

    const searchInput = page.getByPlaceholder(/search restaurants|search dishes/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('biryani');

    // Verify URL parameter sync
    await expect(page).toHaveURL(/q=biryani/);

    // Click Mode Selector Tab
    const dishesTab = page.getByRole('tab', { name: /dishes/i });
    await dishesTab.click();
    await expect(page).toHaveURL(/mode=food/);
  });

  test('Journey 4: Collections page renders tabs and exploration interface', async ({ page }) => {
    await page.goto('/collections');
    await expect(page.locator('h1')).toContainText('Collections');

    const exploreTab = page.getByRole('button', { name: /explore community/i });
    await expect(exploreTab).toBeVisible();
    await exploreTab.click();
  });

  test('Journey 5: Mobile viewport (360px) responsive layout check', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    // Ensure mobile header is rendered without horizontal scrolling
    const mobileHeader = page.locator('header').first();
    await expect(mobileHeader).toBeVisible();

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(360);
  });

  test('Journey 6: Beta status and operations feedback page is accessible', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('h1')).toContainText('System Status & Beta Ops');
    await expect(page.getByText('All Systems Nominal')).toBeVisible();
    await expect(page.getByRole('link', { name: /send beta feedback/i })).toBeVisible();
  });

  test('Journey 7: Home feed renders feed stream, navigation, and quick log modal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Chronological Feed');
    const quickLogBtn = page.getByRole('button', { name: /\+ Quick Log/i });
    await expect(quickLogBtn).toBeVisible();
    await quickLogBtn.click();
    await expect(page.getByText('Log Food Experience')).toBeVisible();
  });

  test('Journey 8: Responsive layouts verified across 360px, 768px, and 1280px viewports', async ({ page }) => {
    // 360px (Mobile)
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    const width360 = await page.evaluate(() => document.body.scrollWidth);
    expect(width360).toBeLessThanOrEqual(360);

    // 768px (Tablet)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    const width768 = await page.evaluate(() => document.body.scrollWidth);
    expect(width768).toBeLessThanOrEqual(768);

    // 1280px (Desktop)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const width1280 = await page.evaluate(() => document.body.scrollWidth);
    expect(width1280).toBeLessThanOrEqual(1280);
  });
});
