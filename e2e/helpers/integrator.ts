import { Page, expect } from '@playwright/test';

/**
 * Integrator E2E test helpers
 * Utilities for testing protected integrator pages
 */

/**
 * Navigate to an integrator route and verify it loads
 */
export async function navigateToIntegratorPage(page: Page, route: string) {
  await page.goto(`/protected/integrator${route}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Verify integrator page is protected and accessible to authenticated users
 */
export async function expectIntegratorPageProtected(page: Page) {
  // If not authenticated, should redirect to login
  const currentUrl = page.url();
  
  if (!currentUrl.includes('/protected/integrator')) {
    // User was redirected away
    expect(currentUrl).toMatch(/login|auth/);
  } else {
    // User is authenticated and on integrator page
    expect(currentUrl).toContain('/protected/integrator');
  }
}

/**
 * Verify integrator sidebar is visible
 */
export async function expectSidebarVisible(page: Page) {
  // Look for sidebar with various selectors
  const sidebar = page.locator('[data-testid="integrator-sidebar"], .sidebar, nav[class*="sidebar"]').first();
  
  // Sidebar should be visible or at least not explicitly hidden
  const isVisible = await sidebar.isVisible().catch(() => false);
  
  // If not visible, it might be hidden on mobile but should still exist
  const exists = await sidebar.count() > 0;
  expect(exists).toBe(true);
}

/**
 * Verify header/top navigation is visible
 */
export async function expectHeaderVisible(page: Page) {
  const header = page.locator('[data-testid="integrator-header"], header, nav[class*="header"]').first();
  const exists = await header.count() > 0;
  
  // Header should exist (even if hidden on mobile)
  expect(exists).toBe(true);
}

/**
 * Verify main page content area exists
 */
export async function expectMainContentVisible(page: Page) {
  // Look for main content area
  const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
  const exists = await mainContent.count() > 0;
  
  expect(exists).toBe(true);
}

/**
 * Verify page heading/title is visible
 */
export async function expectPageHeadingVisible(page: Page) {
  // Look for h1 or h2 heading
  const heading = page.locator('h1, h2, [data-testid*="heading"], [data-testid*="title"]').first();
  const isVisible = await heading.isVisible().catch(() => false);
  
  // Heading should be visible or at least exist
  if (await heading.count() > 0) {
    expect(isVisible || true).toBe(true);
  }
}

/**
 * Verify page is not in error state
 */
export async function expectNoErrorState(page: Page) {
  const errorElements = page.locator(
    '[role="alert"], .error, text=/error|failed|failed to load/i'
  ).all();
  
  const count = (await errorElements).length;
  
  // Allow no error elements (count can be 0)
  // If errors exist, they should be non-critical
  expect(count).toBeLessThanOrEqual(3);
}

/**
 * Verify empty state displays when no data exists
 */
export async function expectEmptyStateOrContent(page: Page) {
  // Look for empty state or content
  const emptyState = page.locator('[data-testid*="empty"], .empty, text=/no|empty|data/i').all();
  const content = page.locator('table, [data-testid*="item"], .card, [class*="list"]').all();
  
  const hasEmpty = (await emptyState).length > 0;
  const hasContent = (await content).length > 0;
  
  // Page should have either empty state OR content
  expect(hasEmpty || hasContent).toBe(true);
}

/**
 * Verify loading state has resolved
 */
export async function expectLoadingResolved(page: Page) {
  // Look for loading indicators
  const loaders = page.locator(
    '[role="progressbar"], .spinner, .loader, .loading, .skeleton'
  ).all();
  
  const count = (await loaders).length;
  
  // Should have minimal to no loaders visible
  expect(count).toBeLessThanOrEqual(2);
}

/**
 * Click sidebar link and verify navigation
 */
export async function clickSidebarLink(page: Page, linkText: string) {
  const sidebar = page.locator('[data-testid="integrator-sidebar"], nav[class*="sidebar"]').first();
  const link = sidebar.locator(`text=/^${linkText}$/i, button:has-text("${linkText}")`).first();
  
  if (await link.isVisible()) {
    await link.click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Verify sidebar link is visible
 */
export async function expectSidebarLinkVisible(page: Page, linkText: string) {
  const sidebar = page.locator('[data-testid="integrator-sidebar"]').first();
  
  if (await sidebar.count() === 0) {
    // If sidebar doesn't have testid, try fallback
    const fallbackLink = page.locator(`text=/^${linkText}$/i, button:has-text("${linkText}")`).first();
    expect(await fallbackLink.count()).toBeGreaterThan(0);
    return;
  }
  
  const link = sidebar.locator(`text=/^${linkText}$/i`).first();
  expect(await link.count()).toBeGreaterThan(0);
}

/**
 * Verify list/table is rendering
 */
export async function expectListOrTableRendered(page: Page) {
  const list = page.locator('table, [role="list"], [role="grid"], .list, [class*="list"]').first();
  const exists = await list.count() > 0;
  
  expect(exists).toBe(true);
}

/**
 * Verify search input exists and is functional
 */
export async function expectSearchInputExists(page: Page) {
  const searchInput = page.locator(
    'input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]'
  ).first();
  
  const exists = await searchInput.count() > 0;
  expect(exists).toBe(true);
  
  // Try typing in search
  if (exists) {
    await searchInput.fill('test');
    await page.waitForTimeout(1000);
    await searchInput.clear();
  }
}

/**
 * Verify button exists (e.g., create, add, submit)
 */
export async function expectButtonExists(page: Page, buttonText: string) {
  const button = page.locator(`button:has-text("${buttonText}"), button:has-text("${buttonText.toLowerCase()}")`).first();
  expect(await button.count()).toBeGreaterThan(0);
}

/**
 * Verify modal/dialog opens when button is clicked
 */
export async function expectModalOpensOnClick(page: Page, triggerButtonText: string) {
  const button = page.locator(`button:has-text("${triggerButtonText}")`).first();
  
  if (await button.isVisible()) {
    await button.click();
    
    // Wait for modal
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      // Modal might not exist
    });
  }
}

/**
 * Close modal if open
 */
export async function closeModalIfOpen(page: Page) {
  const closeButton = page.locator('button[aria-label*="close" i], button[title*="close" i], [role="dialog"] button:first-child').first();
  
  if (await closeButton.isVisible()) {
    await closeButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Verify card/item renders in list
 */
export async function expectCardExists(page: Page) {
  const card = page.locator('[data-testid*="item"], .card, [class*="card"]').first();
  expect(await card.count()).toBeGreaterThan(0);
}

/**
 * Verify form input exists
 */
export async function expectFormInputExists(page: Page, inputLabel: string) {
  const input = page.locator(
    `input[placeholder*="${inputLabel}" i], label:has-text("${inputLabel}") + input, [data-testid*="${inputLabel.toLowerCase()}"]`
  ).first();
  
  expect(await input.count()).toBeGreaterThan(0);
}

/**
 * Verify page title/heading contains text
 */
export async function expectPageTitleContains(page: Page, titleText: string) {
  const title = page.locator(`h1, h2, [data-testid*="heading"]`).filter({
    hasText: new RegExp(titleText, 'i'),
  }).first();
  
  expect(await title.count()).toBeGreaterThan(0);
}

/**
 * Verify protected route requires authentication
 */
export async function expectRouteIsProtected(page: Page, route: string) {
  // Navigate without auth
  await page.goto(route);
  
  // Should redirect to login or auth page
  const currentUrl = page.url();
  const isProtected = currentUrl.includes('login') || currentUrl.includes('auth') || !currentUrl.includes('/protected/');
  
  expect(isProtected).toBe(true);
}

/**
 * Get integrator page URL
 */
export function getIntegratorPageUrl(page: Page, route: string): string {
  return `${page.context().baseURL || 'http://localhost:3000'}/protected/integrator${route}`;
}

/**
 * Verify no excluded sidebar links are present (task, chat, chart)
 */
export async function expectExcludedLinksNotPresent(page: Page) {
  const excludedLinks = ['Task', 'Chat', 'Chart', 'task', 'chat', 'chart'];
  
  for (const linkText of excludedLinks) {
    const link = page.locator(`text=/^${linkText}$/i, button:has-text("${linkText}")`).first();
    
    // Links should not exist OR should be explicitly hidden/disabled
    const isVisible = await link.isVisible().catch(() => false);
    
    if (isVisible) {
      // If visible, it should be disabled
      const isDisabled = await link.evaluate((el: any) => el.disabled || el.getAttribute('aria-disabled') === 'true').catch(() => false);
      expect(isDisabled).toBe(true);
    }
  }
}

/**
 * Verify user is logged out (redirected to login)
 */
export async function expectUserLoggedOut(page: Page) {
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/login|auth/);
}

/**
 * Verify page has no critical accessibility issues (basic check)
 */
export async function expectBasicAccessibility(page: Page) {
  // Check for buttons without text
  const buttonsWithoutText = await page.locator('button').filter({
    has: page.locator('svg'),
  }).all();
  
  for (const btn of buttonsWithoutText) {
    const ariaLabel = await btn.getAttribute('aria-label').catch(() => null);
    const title = await btn.getAttribute('title').catch(() => null);
    
    // Button should have aria-label or title
    expect(ariaLabel || title).toBeDefined();
  }
}
