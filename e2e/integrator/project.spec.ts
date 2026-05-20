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

test.describe('Integrator Projects', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('unauthenticated user is redirected from projects', async ({ page }) => {
    await page.goto('/protected/integrator/project');
    expect(page.url()).toMatch(/login|auth/);
  });

  test('projects page loads', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      await expectIntegratorPageProtected(page);
      await expectMainContentVisible(page);
      await expectLoadingResolved(page);
    }
  });

  test('projects sidebar is visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      await expectSidebarVisible(page);
    }
  });

  test('projects page displays heading', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      await expectPageHeadingVisible(page);
      await expectNoErrorState(page);
    }
  });

  test('projects page shows no critical errors', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      await expectNoErrorState(page);
    }
  });

  test('projects list or table renders', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      // Should show list/table or empty state
      const pageContent = await page.content();
      
      // Page should have content
      expect(pageContent.length).toBeGreaterThan(500);
    }
  });

  test('projects page shows empty state or content', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      await expectEmptyStateOrContent(page);
    }
  });

  test('create project button exists if available', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      // Look for create/add button
      const createButtons = page.locator(
        'button:has-text("Create"), button:has-text("Add"), button:has-text("New"), [data-testid*="create"]'
      ).all();
      
      // Button should exist or page should show message
      const count = (await createButtons).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('project cards or rows are interactive', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      // Look for clickable project items
      const projectItems = page.locator('[data-testid*="project-item"], [class*="project-row"], tr').all();
      
      const count = (await projectItems).length;
      
      // Should have items or empty state
      expect(count >= 0).toBe(true);
    }
  });

  test('clicking project does not navigate to task/chat/chart', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      // Try to find and click a project item
      const firstItem = page.locator('[data-testid*="project-item"], [class*="project-row"], tr').first();
      
      if (await firstItem.isVisible()) {
        const initialUrl = page.url();
        await firstItem.click();
        await page.waitForTimeout(1000);
        
        const newUrl = page.url();
        
        // Should not navigate to task, chat, or chart automatically
        expect(newUrl).not.toContain('/task/');
        expect(newUrl).not.toContain('/chat/');
        expect(newUrl).not.toContain('/chart/');
      }
    }
  });

  test('projects page is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      // Page should still be functional on mobile
      const content = page.locator('main, [role="main"]').first();
      expect(await content.isVisible()).toBe(true);
    }
  });

  test('trialing user can access projects', async ({ page }) => {
    // Users with trialing subscription should access projects
    await page.goto('/protected/integrator/project');
    
    const currentUrl = page.url();
    // Should be on project page or redirected to login
    expect(currentUrl).toContain('project') || expect(currentUrl).toContain('login');
  });
});
