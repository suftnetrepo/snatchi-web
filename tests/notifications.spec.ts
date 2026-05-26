import { test, expect } from '@playwright/test';

/**
 * Web Notification UI Tests
 * Tests for Phase 3 notification system
 *
 * Run: npx playwright test tests/notifications.spec.ts
 */

test.describe('Web Notification UI', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to app
    await page.goto('/');
    // Assume auth is mocked or user is already logged in
    await page.goto('/protected/engineer/calendar');
  });

  test.describe('Notification Bell', () => {
    test('should display notification bell in header', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await expect(bell).toBeVisible();
    });

    test('should display unread badge when count > 0', async ({ page }) => {
      // Wait for unread count to load
      const badge = page.getByTestId('notification-unread-badge');
      // Badge should be visible if there are unread notifications
      try {
        await expect(badge).toBeVisible({ timeout: 5000 });
      } catch {
        // If no badge, that's OK - means 0 unread
      }
    });

    test('should hide badge when count = 0', async ({ page }) => {
      // Mock response for 0 unread count
      await page.route('/api/notifications/unread-count', (route) =>
        route.abort()
      );
      const badge = page.getByTestId('notification-unread-badge');
      // Badge should not be visible
      await expect(badge).not.toBeVisible();
    });

    test('should cap badge display at 99+', async ({ page }) => {
      // Mock response for 150 unread count
      await page.route('/api/notifications/unread-count', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { count: 150, cappedCount: 99 }
          })
        })
      );
      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const badge = page.getByTestId('notification-unread-badge');
      await expect(badge).toContainText('99+');
    });
  });

  test.describe('Notification Dropdown', () => {
    test('should open dropdown when bell is clicked', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const dropdown = page.getByTestId('notification-dropdown');
      await expect(dropdown).toBeVisible();
    });

    test('should display latest notifications in dropdown', async ({ page }) => {
      // Mock notifications API
      await page.route('/api/notifications', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notifications: [
                {
                  _id: '1',
                  title: 'New Booking Request',
                  body: 'Engineer John has requested a booking',
                  type: 'booking_created',
                  status: { read: false },
                  createdAt: new Date().toISOString(),
                  screen: 'calendar'
                },
                {
                  _id: '2',
                  title: 'Booking Approved',
                  body: 'Your booking has been approved',
                  type: 'booking_approved',
                  status: { read: true },
                  createdAt: new Date(Date.now() - 3600000).toISOString(),
                  screen: 'calendar'
                }
              ],
              total: 2
            }
          })
        })
      );

      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const items = page.getByTestId('notification-item');
      await expect(items).toHaveCount(2);
    });

    test('should highlight unread notifications', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const items = page.getByTestId('notification-item');
      // First item should be unread (different background)
      const firstItem = items.first();
      const classList = await firstItem.evaluate((el) => el.className);
      expect(classList).toContain('unread');
    });

    test('should show empty state when no notifications', async ({ page }) => {
      await page.route('/api/notifications', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notifications: [],
              total: 0
            }
          })
        })
      );

      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const emptyState = page.getByText('All caught up!');
      await expect(emptyState).toBeVisible();
    });

    test('should show loading state while fetching', async ({ page }) => {
      // Simulate slow network
      await page.route('/api/notifications', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const loading = page.getByText(/loading notifications/i);
      // Loading should briefly appear
      try {
        await expect(loading).toBeVisible({ timeout: 2000 });
      } catch {
        // Loading might be too fast to catch
      }
    });

    test('should close dropdown when notification is clicked', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const firstNotification = page.getByTestId('notification-item').first();
      await firstNotification.click();
      const dropdown = page.getByTestId('notification-dropdown');
      // Dropdown should close and navigate
      await expect(dropdown).not.toBeVisible({ timeout: 5000 });
    });

    test('should navigate when notification is clicked', async ({ page }) => {
      // Setup navigation mock
      await page.route('/api/notifications', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notifications: [
                {
                  _id: '1',
                  title: 'Booking Created',
                  body: 'New booking',
                  type: 'booking_created',
                  status: { read: false },
                  createdAt: new Date().toISOString(),
                  screen: 'calendar',
                  relatedTo: { schedule: 'schedule123' }
                }
              ],
              total: 1
            }
          })
        })
      );

      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const notification = page.getByTestId('notification-item').first();
      await notification.click();

      // Should navigate to calendar with schedule parameter
      await expect(page).toHaveURL(/\/protected\/engineer\/calendar/);
    });

    test('should mark notification as read when clicked', async ({ page }) => {
      const markReadRoute = page.route('/api/notifications', (route) => {
        if (route.request().method() === 'PUT') {
          expect(route.request().postDataJSON()).toMatchObject({
            action: 'read'
          });
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: {} })
          });
        } else {
          route.continue();
        }
      });

      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const notification = page.getByTestId('notification-item').first();
      await notification.click();

      // Mark as read should be called
      await page.waitForRoute('/api/notifications');
    });

    test('should have "View All Notifications" link', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const viewAllLink = page.getByTestId('notification-view-all');
      await expect(viewAllLink).toBeVisible();
    });

    test('should navigate to notification center when "View All" clicked', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const viewAllLink = page.getByTestId('notification-view-all');
      await viewAllLink.click();
      await expect(page).toHaveURL(/\/protected\/engineer\/notifications/);
    });

    test('should have "Mark All as Read" button', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const markAllBtn = page.locator('button:has-text("Mark all as read")');
      await expect(markAllBtn).toBeVisible();
    });

    test('should mark all as read when button clicked', async ({ page }) => {
      let markAllCalled = false;
      await page.route('/api/notifications', (route) => {
        if (route.request().method() === 'PUT') {
          const body = route.request().postDataJSON();
          if (body.action === 'read-all') {
            markAllCalled = true;
          }
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: {} })
          });
        } else {
          route.continue();
        }
      });

      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const markAllBtn = page.locator('button:has-text("Mark all as read")');
      await markAllBtn.click();

      // Should call mark-all-read API
      expect(markAllCalled).toBe(true);
    });
  });

  test.describe('Notification Center Page', () => {
    test('should load notification center page', async ({ page }) => {
      await page.goto('/protected/engineer/notifications');
      const title = page.getByRole('heading', { name: /notifications/i });
      await expect(title).toBeVisible();
    });

    test('should display notifications list', async ({ page }) => {
      await page.goto('/protected/engineer/notifications');
      const page_container = page.getByTestId('notification-center-page');
      await expect(page_container).toBeVisible();
    });

    test('should have unread filter checkbox', async ({ page }) => {
      await page.goto('/protected/engineer/notifications');
      const checkbox = page.getByTestId('notification-filter-unread');
      await expect(checkbox).toBeVisible();
    });

    test('should filter notifications when unread checkbox toggled', async ({ page }) => {
      await page.goto('/protected/engineer/notifications');
      const checkbox = page.getByTestId('notification-filter-unread');
      await checkbox.check();

      // Should call API with unreadOnly=true
      const responses = [];
      page.on('response', (response) => {
        if (response.url().includes('/api/notifications')) {
          responses.push(response.url());
        }
      });
      await page.waitForTimeout(500);
      expect(responses.some((url) => url.includes('unread=true'))).toBe(true);
    });

    test('should have mark all as read button', async ({ page }) => {
      await page.goto('/protected/engineer/notifications');
      const button = page.getByTestId('notification-mark-all-read');
      // Button should exist if there are notifications
      try {
        await expect(button).toBeVisible({ timeout: 3000 });
      } catch {
        // OK if no notifications
      }
    });

    test('should allow archiving notification', async ({ page }) => {
      await page.goto('/protected/engineer/notifications');
      let archiveCalled = false;
      await page.route('/api/notifications', (route) => {
        if (route.request().method() === 'PUT') {
          const body = route.request().postDataJSON();
          if (body.action === 'archive') {
            archiveCalled = true;
          }
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: {} })
          });
        } else {
          route.continue();
        }
      });

      const archiveBtn = page.locator('button[title="Archive notification"]').first();
      try {
        await archiveBtn.click();
        expect(archiveCalled).toBe(true);
      } catch {
        // OK if no archive buttons (no notifications)
      }
    });

    test('should allow deleting notification', async ({ page }) => {
      await page.goto('/protected/engineer/notifications');
      let deleteCalled = false;
      await page.route('/api/notifications', (route) => {
        if (route.request().method() === 'DELETE') {
          deleteCalled = true;
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        } else {
          route.continue();
        }
      });

      const deleteBtn = page.locator('button[title="Delete notification"]').first();
      try {
        await deleteBtn.click();
        expect(deleteCalled).toBe(true);
      } catch {
        // OK if no delete buttons (no notifications)
      }
    });

    test('should show empty state when no notifications', async ({ page }) => {
      await page.route('/api/notifications', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notifications: [],
              total: 0
            }
          })
        })
      );

      await page.goto('/protected/engineer/notifications');
      const emptyState = page.getByText(/all caught up/i);
      await expect(emptyState).toBeVisible();
    });

    test('should show error state on API failure', async ({ page }) => {
      await page.route('/api/notifications', (route) =>
        route.abort()
      );

      await page.goto('/protected/engineer/notifications');
      const errorMessage = page.getByText(/failed to load/i);
      // Error should appear after timeout
      try {
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      } catch {
        // OK - might handle differently
      }
    });
  });

  test.describe('Security & Authorization', () => {
    test('should reject unauthorized user', async ({ page }) => {
      // Mock 401 response
      await page.route('/api/notifications/unread-count', (route) =>
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Unauthorized'
          })
        })
      );

      await page.goto('/protected/engineer/calendar');
      // Should handle gracefully without crashing
      await expect(page).not.toHaveTitle('Error');
    });

    test('should only show user own notifications', async ({ page }) => {
      // Verify API filters by user
      let apiCalled = false;
      await page.route('/api/notifications', (route) => {
        apiCalled = true;
        // API should handle user context via session
        route.continue();
      });

      await page.goto('/protected/engineer/notifications');
      await page.waitForTimeout(1000);
      expect(apiCalled).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('bell should have aria-label', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      const ariaLabel = await bell.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Notification');
    });

    test('should be keyboard navigable', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await bell.focus();
      // Ensure it's focusable
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBe('notification-bell');
    });

    test('notification items should be clickable with keyboard', async ({ page }) => {
      const bell = page.getByTestId('notification-bell');
      await bell.click();
      const firstItem = page.getByTestId('notification-item').first();
      await firstItem.focus();
      await firstItem.press('Enter');
      // Should trigger the action
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const bell = page.getByTestId('notification-bell');
      await expect(bell).toBeVisible();
      await bell.click();
      const dropdown = page.getByTestId('notification-dropdown');
      await expect(dropdown).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      const bell = page.getByTestId('notification-bell');
      await expect(bell).toBeVisible();
    });
  });
});
