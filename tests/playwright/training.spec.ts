import { test, expect } from '@playwright/test';

const API_HOST = 'https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTA4OTIsImV4cCI6MjA4MjUyNjg5Mn0.tLKyWdfwluNOVZoHBZn0l2oTA1RdSRUCgCamnDqUJwM';

test.describe('Training dashboard smoke', () => {
  test('should request training-completed and show next day without NaN', async ({ page }) => {
    // Intercept the completed endpoint and assert response content
    let apiResponse: any = null;
    await page.route(`${API_HOST}/training-completed/*`, async (route) => {
      const req = route.request();
      // forward request to real endpoint with auth header
      const url = req.url();
      const res = await page.request.get(url, { headers: { Authorization: `Bearer ${ANON}` } });
      const body = await res.json().catch(() => null);
      apiResponse = body;
      await route.fulfill({ status: 200, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
    });

    await page.goto('http://localhost:5173/');

    // Wait for possible dashboard logs / content
    await page.waitForTimeout(1200);

    // Basic assertions
    expect(apiResponse).not.toBeNull();

    // If array, check elements have dayPlanIndex numeric
    if (Array.isArray(apiResponse)) {
      for (const item of apiResponse) {
        expect(item).toHaveProperty('dayPlanIndex');
        expect(typeof item.dayPlanIndex === 'number' || item.dayPlanIndex === 0).toBeTruthy();
      }
    } else {
      expect(apiResponse).toHaveProperty('dayPlanIndex');
      expect(typeof apiResponse.dayPlanIndex === 'number' || apiResponse.dayPlanIndex === 0).toBeTruthy();
    }

    // Check page does not contain 'Día NaN' or 'NaN'
    const bodyText = await page.content();
    expect(bodyText).not.toContain('Día NaN');
    expect(bodyText).not.toContain('NaN');
  });
});