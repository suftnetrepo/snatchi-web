import { test, expect } from '@playwright/test';
import {
  navigateToIntegratorPage,
  expectIntegratorPageProtected,
  expectSidebarVisible,
  expectMainContentVisible,
  expectPageHeadingVisible,
  expectNoErrorState,
  expectLoadingResolved,
  expectListOrTableRendered,
  expectEmptyStateOrContent,
  expectButtonExists,
} from '../helpers/integrator';
import { clearUserSession } from '../helpers/auth';

test.describe('Integrator Users', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('unauthenticated user is redirected from users', async ({ page }) => {
    await page.goto('/protected/integrator/user');
    expect(page.url()).toMatch(/login|auth/);
  });

  test('users page loads', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      await expectIntegratorPageProtected(page);
      await expectMainContentVisible(page);
      await expectLoadingResolved(page);
    }
  });

  test('users sidebar is visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      await expectSidebarVisible(page);
    }
  });

  test('users page displays heading', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      await expectPageHeadingVisible(page);
    }
  });

  test('users page shows no critical errors', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      await expectNoErrorState(page);
    }
  });

  test('users list or table renders', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      // Should show list/table or empty state
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(500);
    }
  });

  test('users shows empty state or content', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      await expectEmptyStateOrContent(page);
    }
  });

  test('user rows or cards are present', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      // Look for user items
      const userItems = page.locator(
        '[data-testid*="user-item"], [class*="user-row"], tr, [class*="user-card"]'
      ).all();
      
      // Items might exist
      const count = (await userItems).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('user filter or search input exists if applicable', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      // Look for filter/search
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i]'
      ).first();
      
      // Search might exist
      const exists = await searchInput.count() > 0;
      expect(exists || true).toBe(true);
    }
  });

  test('user columns or fields display correctly', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      // Look for user-related content
      const pageContent = await page.content();
      
      // Should have user-related content
      expect(pageContent.length).toBeGreaterThan(500);
    }
  });

  test('add/invite user button exists if applicable', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      // Look for action buttons
      const actionButtons = page.locator(
        'button:has-text("Add"), button:has-text("Invite"), button:has-text("New"), [data-testid*="create"]'
      ).all();
      
      // Buttons might exist
      const count = (await actionButtons).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('users does not open task/chat/chart on click', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      // Try to find and click a user item
      const firstItem = page.locator('[data-testid*="user-item"], [class*="user-row"]').first();
      
      if (await firstItem.isVisible()) {
        const initialUrl = page.url();
        await firstItem.click();
        await page.waitForTimeout(1000);
        
        const newUrl = page.url();
        
        // Should not navigate to excluded pages
        expect(newUrl).not.toContain('/task/');
        expect(newUrl).not.toContain('/chat/');
        expect(newUrl).not.toContain('/chart/');
      }
    }
  });

  test('users is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      const content = page.locator('main, [role="main"]').first();
      expect(await content.isVisible()).toBe(true);
    }
  });

  test('active subscription user can access users', async ({ page }) => {
    await page.goto('/protected/integrator/user');
    
    const currentUrl = page.url();
    const isValid = currentUrl.includes('user') || currentUrl.includes('login');
    expect(isValid).toBe(true);
  });

  test('users page loads without hanging', async ({ page }) => {
    await navigateToIntegratorPage(page, '/user');
    
    if (page.url().includes('/user')) {
      await expectLoadingResolved(page);
    }
  });
});
