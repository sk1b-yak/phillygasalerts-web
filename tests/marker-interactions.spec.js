import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('PhillyGasAlerts Basic Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('1. App loads successfully', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const title = await page.title();
    expect(title).toContain('PhillyGasAlerts');
  });

  test('2. Map container exists', async ({ page }) => {
    await page.waitForSelector('.maplibregl-map', { timeout: 15000 });
    const mapContainer = page.locator('.maplibregl-map');
    await expect(mapContainer).toBeVisible();
  });

  test('3. Search bar is present', async ({ page }) => {
    await page.waitForSelector('input', { timeout: 10000 });
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible();
  });

  test('4. Sidebar controls are visible', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('5. Price legend is displayed', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const priceLegend = page.locator('text=LOW').first();
    await expect(priceLegend).toBeVisible();
  });

  test('6. Refresh button is present', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
  });

  test('7. Heatmap toggle is present', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const heatmapButton = page.locator('button:has-text("Heatmap")');
    await expect(heatmapButton).toBeVisible();
  });

  test('8. Mobile filter button on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('domcontentloaded');
    const filterButton = page.locator('button:has-text("Filters")');
    await expect(filterButton).toBeVisible();
  });

  test('9. Page loads within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });
});
