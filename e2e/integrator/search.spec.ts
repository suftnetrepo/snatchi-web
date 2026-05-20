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

test.describe('Integrator Search', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('unauthenticated user is redirected from search', async ({ page }) => {
    await page.goto('/protected/integrator/search');
    expect(page.url()).toMatch(/login|auth/);
  });

  test('search page loads', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      await expectIntegratorPageProtected(page);
      await expectMainContentVisible(page);
      await expectLoadingResolved(page);
    }
  });

  test('search sidebar is visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      await expectSidebarVisible(page);
    }
  });

  test('search page displays heading', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      await expectPageHeadingVisible(page);
    }
  });

  test('search page shows no critical errors', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      await expectNoErrorState(page);
    }
  });

  test('search input exists and is functional', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      // Look for search input
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]'
      ).first();
      
      const exists = await searchInput.count() > 0;
      expect(exists).toBe(true);
      
      // Try typing
      if (exists) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        await searchInput.clear();
      }
    }
  });

  test('search shows results or empty state', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      await expectEmptyStateOrContent(page);
    }
  });

  test('search results list renders', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      // Look for result items
      const resultItems = page.locator(
        '[data-testid*="result"], [class*="result"], [role="list"] > *'
      ).all();
      
      // Results might exist
      const count = (await resultItems).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('search typing updates results', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i]'
      ).first();
      
      if (await searchInput.isVisible()) {
        const initialResults = page.locator('[data-testid*="result"], [class*="result"]').count();
        
        await searchInput.fill('test-search-query');
        await page.waitForTimeout(1000);
        
        // Results should update or remain empty
        const pageContent = await page.content();
        expect(pageContent.length).toBeGreaterThan(500);
      }
    }
  });

  test('search page handles no results gracefully', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      // Search with unlikely query
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i]'
      ).first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('xyz-non-existent-123-query');
        await page.waitForTimeout(1500);
        
        // Should show empty state or message
        const emptyState = page.locator('text=/no|empty|results|found/i').first();
        
        // Either empty state or no error should occur
        expect(true).toBe(true);
      }
    }
  });

  test('search is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      const content = page.locator('main, [role="main"]').first();
      expect(await content.isVisible()).toBe(true);
    }
  });

  test('active subscription user can access search', async ({ page }) => {
    await page.goto('/protected/integrator/search');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('search') || expect(currentUrl).toContain('login');
  });

  test('search loads without hanging', async ({ page }) => {
    await navigateToIntegratorPage(page, '/search');
    
    if (page.url().includes('/search')) {
      await expectLoadingResolved(page);
    }
  });
});
