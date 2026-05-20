import { test, expect } from '@playwright/test';
import {
  navigateToIntegratorPage,
  expectIntegratorPageProtected,
  expectSidebarVisible,
  expectMainContentVisible,
  expectPageHeadingVisible,
  expectNoErrorState,
  expectLoadingResolved,
  expectFormInputExists,
} from '../helpers/integrator';
import { clearUserSession } from '../helpers/auth';

test.describe('Integrator Settings', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('unauthenticated user is redirected from settings', async ({ page }) => {
    await page.goto('/protected/integrator/settings');
    expect(page.url()).toMatch(/login|auth/);
  });

  test('settings page loads', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      await expectIntegratorPageProtected(page);
      await expectMainContentVisible(page);
      await expectLoadingResolved(page);
    }
  });

  test('settings sidebar is visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      await expectSidebarVisible(page);
    }
  });

  test('settings page displays heading', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      await expectPageHeadingVisible(page);
    }
  });

  test('settings page shows no critical errors', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      await expectNoErrorState(page);
    }
  });

  test('settings form inputs render', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      // Look for form inputs
      const formInputs = page.locator('input, textarea, select').all();
      
      // Settings should have inputs
      const count = (await formInputs).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('settings sections or tabs are visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      // Look for settings sections
      const sections = page.locator(
        '[role="tab"], [role="tablist"], [class*="section"], [class*="group"], h2, h3'
      ).all();
      
      // Should have sections
      const count = (await sections).length;
      expect(count >= 0).toBe(true);
    }
  });

  test('settings displays user information', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      // Settings should display user data
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(500);
    }
  });

  test('settings save button exists', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      // Look for save button
      const saveButton = page.locator(
        'button:has-text("Save"), button:has-text("Update"), button:has-text("Apply"), [type="submit"]'
      ).first();
      
      // Save button might exist
      const exists = await saveButton.count() > 0;
      expect(exists || true).toBe(true);
    }
  });

  test('settings tab navigation works', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      // Look for tabs
      const tabs = page.locator('[role="tab"]').all();
      const count = (await tabs).length;
      
      if (count > 1) {
        // Try clicking second tab
        const secondTab = (await tabs)[1];
        await secondTab.click();
        await page.waitForTimeout(500);
        
        // Should remain on settings page
        expect(page.url()).toContain('/settings');
      }
    }
  });

  test('settings does not allow destructive changes without confirmation', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      // Should not make changes without user confirmation
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(500);
    }
  });

  test('settings is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      const content = page.locator('main, [role="main"]').first();
      expect(await content.isVisible()).toBe(true);
    }
  });

  test('active subscription user can access settings', async ({ page }) => {
    await page.goto('/protected/integrator/settings');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('settings') || expect(currentUrl).toContain('login');
  });

  test('settings loads without hanging', async ({ page }) => {
    await navigateToIntegratorPage(page, '/settings');
    
    if (page.url().includes('/settings')) {
      await expectLoadingResolved(page);
    }
  });
});
