import { test, expect } from '@playwright/test';

async function readyFonts(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready);
}

async function mockIndividualPilot108Apis(page: import('@playwright/test').Page) {
  await page.route('**/pilot108/individual/roster**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ members: [] }),
    });
  });
  await page.route('**/thong-tin/entries**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });
}

async function mockRosterApis(page: import('@playwright/test').Page) {
  const roster = [
    { member_id: 'member_1', name: 'John Doe', role: 'Doctor' },
    { member_id: 'member_2', name: 'Mary Jane', role: 'Nurse' },
    { member_id: 'member_3', name: 'Dr. Smith', role: 'Resident' },
  ];
  await page.route('**/pilot108/individual/roster', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ members: roster }),
    });
  });
  await page.route('**/pilot108/individual/roster/bulk', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ members: roster }),
    });
  });
  await page.route('**/pilot108/individual/roster/members', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ member: roster[0], members: roster }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    { name: 'auth_token', value: 'playwright-e2e', url: 'http://127.0.0.1:3000' },
  ]);
  await page.route('**/auth/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'E2E', email: 'e2e@test.local', role: 'Doctor' }),
    });
  });
});

test.describe('Pilot 108 design (DESIGN.md + screen-map)', () => {
  test('H2 capture — primary record control + frame (hub removed; entry is STT)', async ({ page }) => {
    await page.goto('/pilot108/stt-upload');
    await readyFonts(page);
    const root = page.getByTestId('p108-h2-stt-root');
    await expect(root).toBeVisible();
    await expect(page.getByRole('button', { name: /Start/i })).toBeVisible();
    const toggle = page.getByTestId('p108-h2-record-toggle');
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(76);
    expect(box!.width).toBeLessThanOrEqual(84);
    expect(box!.height).toBeGreaterThanOrEqual(76);
    expect(box!.height).toBeLessThanOrEqual(84);
    const bg = await toggle.evaluate((el) => getComputedStyle(el).backgroundColor);
    const rgb = bg.match(/\d+/g)?.map(Number) ?? [];
    expect(rgb.length).toBeGreaterThanOrEqual(3);
    expect(rgb[0]).toBeGreaterThanOrEqual(245);
    expect(rgb[0]).toBeLessThanOrEqual(255);
    expect(rgb[1]).toBeGreaterThanOrEqual(130);
    expect(rgb[1]).toBeLessThanOrEqual(145);
    expect(rgb[2]).toBeGreaterThanOrEqual(5);
    expect(rgb[2]).toBeLessThanOrEqual(20);
    await expect(root).toHaveScreenshot('h2-stt-capture.png', { timeout: 30_000 });
  });

  for (const [step, screenshot] of [
    ['g1', 'g1-welcome.png'],
    ['g2', 'g2-team-method.png'],
    ['g3a', 'g3a-bulk-input.png'],
    ['g3b', 'g3b-manual-add.png'],
    ['g4', 'g4-roster-preview.png'],
  ] as const) {
    test(`G flow — ${step} snapshot`, async ({ page }) => {
      await mockRosterApis(page);
      await page.goto(`/pilot108/team-setup?step=${step}`);
      await readyFonts(page);
      await expect(page.getByTestId(`p108-${step}-screen`)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId(`p108-${step}-screen`)).toHaveScreenshot(screenshot, { timeout: 30_000 });
    });
  }

  test('H4 mock checklist — DRAFT chip + panel', async ({ page }) => {
    await mockIndividualPilot108Apis(page);
    await page.goto('/pilot108/individual?mockChecklist=1');
    await readyFonts(page);
    await expect(page.getByTestId('p108-h4-checklist-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('p108-h4-status-chip')).toHaveText('DRAFT');
    const chip = page.getByTestId('p108-h4-status-chip');
    const weight = await chip.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(['500', '600']).toContain(weight);
    const fs = await chip.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fs).toBeGreaterThanOrEqual(11);
    expect(fs).toBeLessThanOrEqual(13);
    const panel = page.getByTestId('p108-h4-checklist-panel');
    await expect(panel).toHaveScreenshot('h4-draft-panel.png', { timeout: 30_000 });
  });

  for (const [state, screenshot] of [
    ['upload', 'h3-uploading.png'],
    ['transcribing', 'h3-transcribing.png'],
    ['identifying', 'h3-identifying.png'],
    ['formatting', 'h3-formatting.png'],
    ['success', 'h3-success.png'],
    ['silence', 'e1-silence-toast.png'],
    ['error', 'e2-transcription-error.png'],
    ['notasks', 'e3-no-tasks.png'],
    ['offline', 'e4-offline-queue.png'],
  ] as const) {
    test(`H3/E state — ${state} snapshot`, async ({ page }) => {
      await page.goto(`/pilot108/processing?state=${state}`);
      await readyFonts(page);
      await expect(page.getByTestId(`p108-h3-${state}-screen`)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId(`p108-h3-${state}-screen`)).toHaveScreenshot(screenshot, { timeout: 30_000 });
    });
  }

  test('H6 finalized list — chip + panel snapshot', async ({ page }) => {
    await mockIndividualPilot108Apis(page);
    await page.goto('/pilot108/individual?designMockFinalized=1');
    await readyFonts(page);
    await expect(page.getByTestId('p108-h4-checklist-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('p108-h4-status-chip')).toHaveText('FINALIZED');
    const chip = page.getByTestId('p108-h4-status-chip');
    const weight = await chip.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(['500', '600']).toContain(weight);
    const panel = page.getByTestId('p108-h4-checklist-panel');
    await expect(panel).toHaveScreenshot('h6-finalized-panel.png', { timeout: 30_000 });
  });

  test('S1 team management — roster settings snapshot', async ({ page }) => {
    await mockRosterApis(page);
    await page.goto('/pilot108/team');
    await readyFonts(page);
    await expect(page.getByTestId('p108-s1-team-screen')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('p108-s1-team-screen')).toHaveScreenshot('s1-team-management.png', { timeout: 30_000 });
  });
});
