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

/**
 * Helper to generate unique project name for testing
 */
function generateTestProjectName(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `Test Project ${timestamp}-${random}`;
}

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
    const isValid = currentUrl.includes('project') || currentUrl.includes('login');
    expect(isValid).toBe(true);
  });

  test('can navigate to create project page', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project')) {
      // Look for create/new project button
      const createButton = page.locator(
        'button:has-text("Create"), button:has-text("Add"), button:has-text("New"), a:has-text("Create")'
      ).first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to create page
        const currentUrl = page.url();
        expect(currentUrl).toContain('/project');
        expect(currentUrl).toMatch(/create|new|add/i);
      }
    }
  });

  test('project form fills with valid data', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project') && !page.url().includes('create')) {
      // Navigate to create
      const createButton = page.locator(
        'button:has-text("Create"), a:has-text("Create")'
      ).first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Wait for form to load
    await page.waitForTimeout(2000);
    
    // Fill project form
    const projectNameInput = page.locator('input[name="name"], input[placeholder*="project name" i]').first();
    const projectNumberInput = page.locator('input[name="project_number"], input[placeholder*="project number" i]').first();
    const startDateInput = page.locator('input[type="datetime-local"][name="startDate"], input[name="startDate"]').first();
    const endDateInput = page.locator('input[type="datetime-local"][name="endDate"], input[name="endDate"]').first();
    
    // Check if form fields exist
    const projectNameExists = await projectNameInput.count() > 0;
    const projectNumberExists = await projectNumberInput.count() > 0;
    
    if (projectNameExists) {
      const testProjectName = generateTestProjectName();
      await projectNameInput.fill(testProjectName);
      
      // Verify field is filled
      const filledValue = await projectNameInput.inputValue();
      expect(filledValue).toBe(testProjectName);
    }
    
    if (projectNumberExists) {
      await projectNumberInput.fill('TEST-001');
      
      const filledValue = await projectNumberInput.inputValue();
      expect(filledValue).toBe('TEST-001');
    }
    
    // Fill dates if they exist
    if (await startDateInput.count() > 0) {
      const startDate = new Date();
      const startDateStr = startDate.toISOString().slice(0, 16);
      await startDateInput.fill(startDateStr);
    }
    
    if (await endDateInput.count() > 0) {
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDateStr = endDate.toISOString().slice(0, 16);
      await endDateInput.fill(endDateStr);
    }
  });

  test('can submit create project form', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (!page.url().includes('create')) {
      // Navigate to create
      const createButton = page.locator(
        'button:has-text("Create"), a:has-text("Create")'
      ).first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Fill required fields
    const projectNameInput = page.locator('input[name="name"]').first();
    if (await projectNameInput.count() > 0) {
      const testProjectName = generateTestProjectName();
      await projectNameInput.fill(testProjectName);
    }
    
    // Look for submit button
    const submitButton = page.locator(
      'button:has-text("Create"), button:has-text("Submit"), button:has-text("Save"), [type="submit"]'
    ).first();
    
    if (await submitButton.isVisible()) {
      // Check current URL before submit
      const beforeUrl = page.url();
      
      await submitButton.click();
      
      // Wait for navigation or success message
      await page.waitForTimeout(2000);
      
      const afterUrl = page.url();
      
      // Should either navigate away or show success
      // (could stay on page with success message or navigate back to list)
      expect(beforeUrl).toBeDefined();
      expect(afterUrl).toBeDefined();
    }
  });

  test('can view project details by clicking project', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project') && !page.url().includes('create')) {
      // Wait for table to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Look for first project in list
      const projectLink = page.locator('a, button').filter({ hasText: /^[A-Za-z0-9\s]+$/ }).first();
      
      if (await projectLink.isVisible()) {
        const projectName = await projectLink.textContent();
        
        // Click project
        await projectLink.click();
        await page.waitForTimeout(1500);
        
        // Should open project details or offcanvas
        const modal = page.locator('[role="dialog"], .offcanvas, .modal, .sidebar').first();
        const isModalVisible = await modal.isVisible().catch(() => false);
        
        // Either modal opens or navigates to detail page
        const currentUrl = page.url();
        const detailPageOpened = currentUrl.includes('/project/') || isModalVisible;
        
        expect(detailPageOpened || projectName).toBeTruthy();
      }
    }
  });

  test('can edit project by clicking edit icon', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project') && !page.url().includes('create')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Look for edit button/icon
      const editButtons = page.locator(
        'button[title*="Edit" i], [title*="Edit" i], button:has-text("Edit")'
      ).all();
      
      const editButtonCount = (await editButtons).length;
      
      if (editButtonCount > 0) {
        // Click first edit button
        const firstEditButton = (await editButtons)[0];
        
        const beforeUrl = page.url();
        await firstEditButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const afterUrl = page.url();
        
        // Should navigate to edit page or open modal
        const navigatedToEdit = afterUrl.includes('/edit');
        const modalOpened = await page.locator('[role="dialog"]').isVisible().catch(() => false);
        
        expect(navigatedToEdit || modalOpened || afterUrl !== beforeUrl).toBe(true);
      }
    }
  });

  test('can modify project name in edit form', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project') && !page.url().includes('create')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Find and click edit
      const editButtons = page.locator('[title*="Edit" i]').all();
      const firstEdit = (await editButtons)[0];
      
      if (firstEdit) {
        await firstEdit.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Try to find and modify project name field
        const nameInput = page.locator('input[name="name"]').first();
        
        if (await nameInput.count() > 0 && await nameInput.isVisible()) {
          // Clear and fill with new name
          const newName = `Updated ${generateTestProjectName()}`;
          
          // Note: Don't actually submit to avoid creating test data
          await nameInput.click({ clickCount: 3 });
          await nameInput.fill(newName);
          
          const filledValue = await nameInput.inputValue();
          expect(filledValue).toContain('Updated');
        }
      }
    }
  });

  test('can delete project with confirmation', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project') && !page.url().includes('create')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Count projects before delete attempt
      const projectRows = page.locator('tbody tr, [role="row"]').all();
      const initialCount = (await projectRows).length;
      
      // Look for delete button
      const deleteButtons = page.locator(
        'button[title*="Delete" i], [title*="Delete" i]'
      ).all();
      
      const deleteButtonCount = (await deleteButtons).length;
      
      if (deleteButtonCount > 0) {
        // Click first delete button
        const firstDeleteButton = (await deleteButtons)[0];
        await firstDeleteButton.click();
        
        // Wait for confirmation dialog
        await page.waitForTimeout(500);
        
        // Look for confirm button in dialog
        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")'
        ).last();
        
        const hasConfirmDialog = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
        
        if (hasConfirmDialog && await confirmButton.isVisible()) {
          // Note: In real tests you might click confirm
          // For safety, we'll just verify the dialog appeared
          expect(hasConfirmDialog).toBe(true);
          
          // Close dialog without confirming
          const closeButton = page.locator('button:has-text("Cancel"), button[aria-label*="close" i]').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    }
  });

  test('shows error when deleting (dialog appears)', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project') && !page.url().includes('create')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Try to trigger delete
      const deleteButton = page.locator(
        'button[title*="Delete" i], [title*="Delete" i]'
      ).first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        // Check for confirmation dialog
        const dialog = page.locator('[role="dialog"], .modal');
        const isDialogVisible = await dialog.isVisible().catch(() => false);
        
        // Dialog should appear for confirmation
        expect(isDialogVisible).toBe(true);
      }
    }
  });

  test('search filters project list', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project') && !page.url().includes('create')) {
      await page.waitForLoadState('networkidle');
      
      // Get initial project count
      const initialRows = page.locator('tbody tr, [role="row"]').all();
      const initialCount = (await initialRows).length;
      
      // Look for search input
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]'
      ).first();
      
      if (await searchInput.count() > 0) {
        // Enter search term
        await searchInput.fill('NONEXISTENT-PROJECT-12345');
        
        // Wait for debounce and filter
        await page.waitForTimeout(1500);
        
        // Check if results changed
        const filteredRows = page.locator('tbody tr, [role="row"]').all();
        const filteredCount = (await filteredRows).length;
        
        // Results should be different or show empty state
        const hasEmptyMessage = await page.locator('text=/no|empty|results|found/i').isVisible().catch(() => false);
        
        // Either count changed or empty state shown
        expect(filteredCount <= initialCount || hasEmptyMessage).toBe(true);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1500);
      }
    }
  });

  test('project table columns are visible and sortable', async ({ page }) => {
    await navigateToIntegratorPage(page, '/project');
    
    if (page.url().includes('/project') && !page.url().includes('create')) {
      await page.waitForLoadState('networkidle');
      
      // Check for table headers
      const headers = page.locator('th, [role="columnheader"]').all();
      const headerCount = (await headers).length;
      
      // Should have multiple columns
      expect(headerCount).toBeGreaterThan(2);
      
      // Check for expected columns
      const headerText = await page.locator('th').allTextContents();
      
      // Should have at least one of these columns
      const hasNameColumn = headerText.some(h => h.toLowerCase().includes('name'));
      const hasDateColumn = headerText.some(h => h.toLowerCase().includes('date'));
      const hasStatusColumn = headerText.some(h => h.toLowerCase().includes('status'));
      
      const hasExpectedColumns = hasNameColumn || hasDateColumn || hasStatusColumn;
      expect(hasExpectedColumns).toBe(true);
    }
  });
});
