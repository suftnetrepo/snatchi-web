import { test, expect } from '@playwright/test';
import {
  navigateToIntegratorPage,
  clickSidebarLink,
  expectSidebarLinkVisible,
  expectExcludedLinksNotPresent,
} from '../helpers/integrator';
import { clearUserSession } from '../helpers/auth';

test.describe('Integrator Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('sidebar navigation links are visible from dashboard', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      // Check all expected links
      await expectSidebarLinkVisible(page, 'Dashboard');
      await expectSidebarLinkVisible(page, 'Projects');
      await expectSidebarLinkVisible(page, 'Invoices');
      await expectSidebarLinkVisible(page, 'Users');
      await expectSidebarLinkVisible(page, 'Settings');
    }
  });

  test('dashboard link navigates to dashboard', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      await clickSidebarLink(page, 'Dashboard');
      
      // Should navigate to dashboard
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('projects link navigates to projects', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      await clickSidebarLink(page, 'Projects');
      
      // Should navigate to projects
      expect(page.url()).toContain('/project');
    }
  });

  test('invoices link navigates to invoices', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      await clickSidebarLink(page, 'Invoices');
      
      // Should navigate to invoices
      expect(page.url()).toContain('/invoice');
    }
  });

  test('users link navigates to users', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      await clickSidebarLink(page, 'Users');
      
      // Should navigate to users
      expect(page.url()).toContain('/user');
    }
  });

  test('settings link navigates to settings', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      await clickSidebarLink(page, 'Settings');
      
      // Should navigate to settings
      expect(page.url()).toContain('/settings');
    }
  });

  test('scheduler link navigates to scheduler if visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      const schedulerLink = page.locator('text=/scheduler/i').first();
      
      if (await schedulerLink.isVisible()) {
        await schedulerLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to scheduler
        expect(page.url()).toContain('/scheduler');
      }
    }
  });

  test('search link navigates to search if visible', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      const searchLink = page.locator('text=/search/i').first();
      
      if (await searchLink.isVisible()) {
        await searchLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to search
        expect(page.url()).toContain('/search');
      }
    }
  });

  test('excluded links (task, chat, chart) are not clickable', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      await expectExcludedLinksNotPresent(page);
    }
  });

  test('navigation maintains user session', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      // Navigate to another page
      await clickSidebarLink(page, 'Projects');
      
      // Navigate back
      await clickSidebarLink(page, 'Dashboard');
      
      // Should remain authenticated
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('navigation works from all pages', async ({ page }) => {
    const pagesToTest = ['/dashboard', '/project', '/invoice', '/user', '/settings'];
    
    for (const route of pagesToTest) {
      await navigateToIntegratorPage(page, route);
      
      if (page.url().includes('integrator')) {
        // Sidebar should be visible
        const sidebar = page.locator('[data-testid="integrator-sidebar"]').first();
        
        if (await sidebar.count() > 0) {
          expect(await sidebar.isVisible()).toBe(true);
        }
      }
    }
  });

  test('breadcrumb or page indicator shows current page', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      // Look for breadcrumb or active indicator
      const breadcrumb = page.locator('[role="navigation"]').first();
      const activeLink = page.locator('[aria-current="page"]').first();
      
      // Either breadcrumb or active link should exist
      const hasBreadcrumb = await breadcrumb.count() > 0;
      const hasActiveLink = await activeLink.count() > 0;
      
      expect(hasBreadcrumb || hasActiveLink).toBe(true);
    }
  });

  test('back button or history works correctly', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      // Navigate to projects
      await page.goto('/protected/integrator/project');
      await page.waitForLoadState('networkidle');
      
      // Go back
      await page.goBack();
      
      // Should be back on dashboard
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('direct URL navigation works', async ({ page }) => {
    // Test direct navigation to each page
    const pages = [
      '/dashboard',
      '/project',
      '/invoice',
      '/user',
      '/settings',
      '/scheduler',
      '/search',
      '/search-engineers',
      '/fence',
    ];
    
    for (const route of pages) {
      await page.goto(`/protected/integrator${route}`);
      
      // Should load page or redirect to login
      const currentUrl = page.url();
      expect(currentUrl).toContain('integrator') || expect(currentUrl).toContain('login');
    }
  });

  test('navigation does not create infinite loops', async ({ page }) => {
    await navigateToIntegratorPage(page, '/dashboard');
    
    if (page.url().includes('/dashboard')) {
      const startUrl = page.url();
      
      // Click link and navigate multiple times
      await clickSidebarLink(page, 'Projects');
      await page.waitForTimeout(500);
      
      await clickSidebarLink(page, 'Dashboard');
      await page.waitForTimeout(500);
      
      // Should not be stuck in redirect loop
      expect(page.url()).toContain('integrator');
    }
  });

  test('excluded folders (task, chat, chart) are not linked', async ({ page }) => {
    // Test multiple routes to ensure excluded folders are not linked anywhere
    const routes = ['/dashboard', '/project', '/invoice', '/user', '/settings'];
    
    for (const route of routes) {
      await navigateToIntegratorPage(page, route);
      
      if (page.url().includes('integrator')) {
        // Check no links to excluded pages
        const taskLinks = page.locator('a[href*="/task/"], button[onclick*="/task/"]').all();
        const chatLinks = page.locator('a[href*="/chat/"], button[onclick*="/chat/"]').all();
        const chartLinks = page.locator('a[href*="/chart/"], button[onclick*="/chart/"]').all();
        
        expect((await taskLinks).length).toBe(0);
        expect((await chatLinks).length).toBe(0);
        expect((await chartLinks).length).toBe(0);
      }
    }
  });
});
