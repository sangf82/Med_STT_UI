import { test, expect } from '@playwright/test';
import { playwrightOrigin, resolveAccessToken, useRealBackend } from './helpers/realAuth';

async function readyFonts(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready);
}

test.beforeEach(async ({ page, request }) => {
  test.skip(!useRealBackend(), 'Set E2E_AUTH_TOKEN or E2E_EMAIL + E2E_PASSWORD (+ optional E2E_API_URL) for live BE tests');
  const origin = playwrightOrigin();
  const token = await resolveAccessToken(request);
  await page.context().addCookies([
    {
      name: 'auth_token',
      value: token,
      url: origin,
      path: '/',
      httpOnly: false,
      secure: origin.startsWith('https'),
      sameSite: 'Lax',
    },
  ]);
});

test.describe('Pilot 108 — live backend (real account)', () => {
  test('H2 capture — primary record toggle orange', async ({ page }) => {
    await page.goto('/pilot108/stt-upload');
    await readyFonts(page);
    const toggle = page.getByTestId('p108-h2-record-toggle');
    await expect(toggle).toBeVisible();
    const bg = await toggle.evaluate((el) => getComputedStyle(el).backgroundColor);
    const rgb = bg.match(/\d+/g)?.map(Number) ?? [];
    expect(rgb.length).toBeGreaterThanOrEqual(3);
    expect(rgb[0]).toBeGreaterThanOrEqual(245);
  });

  test('H4 — checklist panel + DRAFT chip (real roster / no route mocks)', async ({ page }) => {
    await page.goto('/pilot108/individual?mockChecklist=1');
    await readyFonts(page);
    await expect(page.getByTestId('p108-h4-checklist-panel')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('p108-h4-status-chip')).toHaveText('DRAFT');
  });

  test('H2 — STT page shell', async ({ page }) => {
    await page.goto('/pilot108/stt-upload');
    await readyFonts(page);
    await expect(page.getByTestId('p108-h2-stt-root')).toBeVisible();
  });
});
