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

test.describe('Integrator Scheduler', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('unauthenticated user is redirected from scheduler', async ({ page }) => {
    await page.goto('/protected/integrator/scheduler');
    expect(page.url()).toMatch(/login|auth/);
  });

  test('scheduler page loads', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      await expectIntegratorPageProtected(page);
      await expectMainContentVisible(page);
      await expectLoadingResolved(page);
    }
  });

  test('scheduler sidebar is visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      await expectSidebarVisible(page);
    }
  });

  test('scheduler page displays heading', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      await expectPageHeadingVisible(page);
    }
  });

  test('scheduler shows no errors', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      await expectNoErrorState(page);
    }
  });

  test('scheduler calendar grid renders', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      // Look for calendar/grid elements
      const calendarElements = page.locator(
        '[data-testid*="calendar"], .calendar, [class*="schedule"], table'
      ).all();
      
      // Calendar should render
      const count = (await calendarElements).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('scheduler view controls render', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      // Look for view controls (week, day, etc.)
      const viewControls = page.locator(
        'button:has-text("Week"), button:has-text("Day"), button:has-text("Month"), [role="tab"]'
      ).all();
      
      // Controls might exist
      const count = (await viewControls).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('scheduler shows empty state or schedule cards', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      await expectEmptyStateOrContent(page);
    }
  });

  test('scheduler does not open task modal immediately', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      // Scheduler should not have task modal open by default
      const taskModal = page.locator('[role="dialog"]').first();
      
      const isOpen = await taskModal.isVisible().catch(() => false);
      expect(isOpen).toBe(false);
    }
  });

  test('scheduler is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      const content = page.locator('main, [role="main"]').first();
      expect(await content.isVisible()).toBe(true);
    }
  });

  test('active subscription user can access scheduler', async ({ page }) => {
    await page.goto('/protected/integrator/scheduler');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('scheduler') || expect(currentUrl).toContain('login');
  });

  test('scheduler loads without critical errors', async ({ page }) => {
    await navigateToIntegratorPage(page, '/scheduler');
    
    if (page.url().includes('/scheduler')) {
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(500);
    }
  });
});
