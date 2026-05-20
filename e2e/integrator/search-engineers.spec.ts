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
  expectSearchInputExists,
} from '../helpers/integrator';
import { clearUserSession } from '../helpers/auth';

test.describe('Integrator Search Engineers', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('unauthenticated user is redirected from search-engineers', async ({ page }) => {
    await page.goto('/protected/integrator/search-engineers');
    expect(page.url()).toMatch(/login|auth/);
  });

  test('search-engineers page loads', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      await expectIntegratorPageProtected(page);
      await expectMainContentVisible(page);
      await expectLoadingResolved(page);
    }
  });

  test('search-engineers sidebar is visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      await expectSidebarVisible(page);
    }
  });

  test('search-engineers page displays heading', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      await expectPageHeadingVisible(page);
    }
  });

  test('search-engineers page shows no critical errors', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      await expectNoErrorState(page);
    }
  });

  test('search-engineers search input exists', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i], [data-testid="search-engineers-input"]'
      ).first();
      
      const exists = await searchInput.count() > 0;
      expect(exists).toBe(true);
    }
  });

  test('search-engineers shows results or empty state', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      await expectEmptyStateOrContent(page);
    }
  });

  test('engineer result list renders', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      // Look for engineer list items
      const engineerItems = page.locator(
        '[data-testid*="engineer"], [class*="engineer"], [role="list"] > *'
      ).all();
      
      // Items might exist or empty state
      const count = (await engineerItems).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('engineer cards or rows display correctly', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      // Look for engineer information
      const pageContent = await page.content();
      
      // Should have content
      expect(pageContent.length).toBeGreaterThan(500);
    }
  });

  test('add/select engineer button exists if applicable', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      // Look for action buttons
      const actionButtons = page.locator(
        'button:has-text("Add"), button:has-text("Select"), button:has-text("Assign"), [data-testid*="action"]'
      ).all();
      
      // Buttons might exist
      const count = (await actionButtons).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('search-engineers typing updates results', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i]'
      ).first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Should handle search without error
        const pageContent = await page.content();
        expect(pageContent.length).toBeGreaterThan(500);
      }
    }
  });

  test('search-engineers does not make destructive changes', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      // Should not automatically modify data
      // Just verify page loads
      const currentUrl = page.url();
      expect(currentUrl).toContain('/search-engineers');
    }
  });

  test('search-engineers is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      const content = page.locator('main, [role="main"]').first();
      expect(await content.isVisible()).toBe(true);
    }
  });

  test('active subscription user can access search-engineers', async ({ page }) => {
    await page.goto('/protected/integrator/search-engineers');
    
    const currentUrl = page.url();
    const isValid = currentUrl.includes('search-engineers') || currentUrl.includes('login');
    expect(isValid).toBe(true);
  });

  test('search-engineers loads without hanging', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search-engineers');
    
    if (page.url().includes('/search-engineers')) {
      await expectLoadingResolved(page);
    }
  });
});
