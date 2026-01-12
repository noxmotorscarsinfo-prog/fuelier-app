import { test, expect } from '@playwright/test';

const API_HOST = 'https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTA4OTIsImV4cCI6MjA4MjUyNjg5Mn0.tLKyWdfwluNOVZoHBZn0l2oTA1RdSRUCgCamnDqUJwM';

test('training completed is returned and UI does not show NaN', async ({ page }) => {
  let apiResponse: any = null;

  await page.route(`${API_HOST}/training-completed/*`, async (route) => {
    const req = route.request();
    const url = req.url();
    const res = await page.request.get(url, { headers: { Authorization: `Bearer ${ANON}` } });
    const body = await res.json().catch(() => null);
    apiResponse = body;
    await route.fulfill({ status: 200, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
  });

  await page.goto('/');

  // Wait shortly for the dashboard to fetch and render
  await page.waitForTimeout(1000);

  expect(apiResponse).not.toBeNull();

  if (Array.isArray(apiResponse)) {
    for (const item of apiResponse) {
      expect(item).toHaveProperty('dayPlanIndex');
      expect(typeof item.dayPlanIndex === 'number' || item.dayPlanIndex === 0).toBeTruthy();
    }
  } else {
    expect(apiResponse).toHaveProperty('dayPlanIndex');
    expect(typeof apiResponse.dayPlanIndex === 'number' || apiResponse.dayPlanIndex === 0).toBeTruthy();
  }

  const content = await page.content();
  expect(content).not.toContain('Día NaN');
  expect(content).not.toContain('NaN');
});