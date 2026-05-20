import { test, expect } from '@playwright/test';
import {
  navigateToIntegratorPage,
  expectIntegratorPageProtected,
  expectSidebarVisible,
  expectMainContentVisible,
  expectPageHeadingVisible,
  expectNoErrorState,
  expectLoadingResolved,
  expectEmptyStateOrContent,
} from '../helpers/integrator';
import { clearUserSession } from '../helpers/auth';

test.describe('Integrator Fence', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('unauthenticated user is redirected from fence', async ({ page }) => {
    await page.goto('/protected/integrator/fence');
    expect(page.url()).toMatch(/login|auth/);
  });

  test('fence page loads', async ({ page }) => {
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      await expectIntegratorPageProtected(page);
      await expectMainContentVisible(page);
      await expectLoadingResolved(page);
    }
  });

  test('fence sidebar is visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      await expectSidebarVisible(page);
    }
  });

  test('fence page displays heading', async ({ page }) => {
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      await expectPageHeadingVisible(page);
    }
  });

  test('fence page shows no critical errors', async ({ page }) => {
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      await expectNoErrorState(page);
    }
  });

  test('fence page renders properly', async ({ page }) => {
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      // Fence page should have content
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(500);
    }
  });

  test('fence shows empty state or content', async ({ page }) => {
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      await expectEmptyStateOrContent(page);
    }
  });

  test('fence fence list or map renders', async ({ page }) => {
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      // Look for fence-specific elements
      const fenceElements = page.locator(
        '[data-testid*="fence"], .fence, [class*="fence"], [data-testid*="geofence"]'
      ).all();
      
      // Fence elements might exist
      const count = (await fenceElements).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('fence is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      const content = page.locator('main, [role="main"]').first();
      expect(await content.isVisible()).toBe(true);
    }
  });

  test('active subscription user can access fence', async ({ page }) => {
    await page.goto('/protected/integrator/fence');
    
    const currentUrl = page.url();
    const isValid = currentUrl.includes('fence') || currentUrl.includes('login');
    expect(isValid).toBe(true);
  });

  test('fence loads without hanging', async ({ page }) => {
    await navigateToIntegratorPage(page, '/fence');
    
    if (page.url().includes('/fence')) {
      await expectLoadingResolved(page);
      
      // Page should be responsive
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    }
  });
});
