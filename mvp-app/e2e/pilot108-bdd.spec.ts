import { test, expect } from '@playwright/test';
import { PILOT108_INDIVIDUAL_BDD } from '../lib/bdd/pilot108IndividualBdd';
import { applyPilot108IndividualMocks, applyPilot108SttCaptureMocks } from './helpers/mockPilot108Apis';

async function readyFonts(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready);
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

test.describe('Pilot 108 BDD — Personal Productivity (copy + QA paths)', () => {
  test.beforeEach(async ({ page }) => {
    await applyPilot108IndividualMocks(page);
  });

  test('processing overlay lists all BDD step labels', async ({ page }) => {
    await page.goto('/pilot108/individual?bdd=1');
    await readyFonts(page);
    await expect(page.getByTestId('p108-bdd-qa-section')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('p108-bdd-qa-processing').click();
    const overlay = page.getByTestId('p108-bdd-processing-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText(PILOT108_INDIVIDUAL_BDD.processingSteps[0]);
    await expect(overlay).toContainText(PILOT108_INDIVIDUAL_BDD.processingSteps[3], { timeout: 3_000 });
  });

  test('empty-recording toast shows BDD string', async ({ page }) => {
    await page.goto('/pilot108/individual?bdd=1');
    await readyFonts(page);
    await page.getByTestId('p108-bdd-qa-toast-no-audio').click();
    await expect(page.getByTestId('p108-bdd-toast')).toContainText(PILOT108_INDIVIDUAL_BDD.noAudioToast);
  });

  test('transcription error screen shows BDD copy and back action', async ({ page }) => {
    await page.goto('/pilot108/individual?bdd=1');
    await readyFonts(page);
    await page.getByTestId('p108-bdd-qa-transcription-error').click();
    const block = page.getByTestId('p108-bdd-transcription-error');
    await expect(block).toContainText(PILOT108_INDIVIDUAL_BDD.transcriptionError);
    await expect(block.getByRole('button', { name: /Back to Quick Capture/i })).toBeVisible();
  });

  test('no actionable tasks shows raw strip + BDD prompt', async ({ page }) => {
    await page.goto('/pilot108/individual?bdd=1');
    await readyFonts(page);
    await page.getByTestId('p108-bdd-qa-no-tasks').click();
    const block = page.getByTestId('p108-bdd-no-tasks');
    await expect(block).toContainText('The weather is nice today');
    await expect(block).toContainText(PILOT108_INDIVIDUAL_BDD.noTasksPrompt);
    await expect(block.getByRole('button', { name: 'Add Manually' })).toBeVisible();
  });

  test('offline banner shows BDD waiting copy', async ({ page }) => {
    await page.goto('/pilot108/individual?bdd=1');
    await readyFonts(page);
    await page.getByTestId('p108-bdd-qa-offline-banner').click();
    await expect(page.getByTestId('p108-bdd-offline-alert')).toContainText(PILOT108_INDIVIDUAL_BDD.waitingOffline);
  });
});

test.describe('Pilot 108 BDD — Team Configuration (roster surface)', () => {
  test.beforeEach(async ({ page }) => {
    await applyPilot108IndividualMocks(page);
  });

  test('assignee-empty BDD copy when roster empty (checklist only)', async ({ page }) => {
    await page.goto('/pilot108/individual?mockChecklist=1');
    await readyFonts(page);
    const panel = page.getByTestId('p108-h4-checklist-panel');
    await expect(panel).toBeVisible({ timeout: 30_000 });
    await expect(panel).toContainText(PILOT108_INDIVIDUAL_BDD.assigneeEmpty);
  });
});

test.describe('Pilot 108 BDD — Quick Edit (draft table)', () => {
  test.beforeEach(async ({ page }) => {
    await applyPilot108IndividualMocks(page);
  });

  test('mock checklist rows: edit task text and remove row', async ({ page }) => {
    await page.goto('/pilot108/individual?mockChecklist=1');
    await readyFonts(page);
    await expect(page.getByTestId('p108-h4-checklist-panel')).toBeVisible({ timeout: 30_000 });
    const panel = page.getByTestId('p108-h4-checklist-panel');
    const removeButtons = panel.getByRole('button', { name: 'Remove row' });
    const before = await removeButtons.count();
    expect(before).toBeGreaterThan(0);
    const firstTaskInput = panel.locator('tbody tr').first().locator('td').first().locator('input').nth(1);
    await firstTaskInput.fill('Edited by E2E');
    await expect(firstTaskInput).toHaveValue('Edited by E2E');
    await removeButtons.first().click();
    await expect(removeButtons).toHaveCount(before - 1);
  });

  test('fill table from pen checklist QA matches design mock rows', async ({ page }) => {
    await page.goto('/pilot108/individual?bdd=1');
    await readyFonts(page);
    await expect(page.getByTestId('p108-bdd-qa-fill-checklist')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('p108-bdd-qa-fill-checklist').click();
    const panel = page.getByTestId('p108-h4-checklist-panel');
    await expect(panel.getByRole('button', { name: 'Remove row' })).toHaveCount(2, { timeout: 5_000 });
  });
});

test.describe('Pilot 108 BDD — STT capture entry (hub)', () => {
  test('live/file capture uses P108 BDD AI endpoints, not legacy STT quota stream', async ({ page }) => {
    let legacyUploadCalls = 0;
    await page.route('**/ai/stt/upload/**', async (route) => {
      legacyUploadCalls += 1;
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'legacy endpoint blocked in E2E' }) });
    });
    await applyPilot108SttCaptureMocks(page);
    await page.goto('/pilot108/stt-upload');
    await readyFonts(page);
    await expect(page.getByTestId('p108-h2-stt-root')).toBeVisible();
    await page.locator('details summary').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'p108-e2e.webm',
      mimeType: 'audio/webm',
      buffer: Buffer.from('p108-e2e-audio'),
    });
    await page.getByRole('button', { name: 'Run P108 AI' }).click();
    await expect(page).toHaveURL(/\/pilot108\/processing\?state=success&draftId=e2e-p108-draft/, { timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Review Draft List' })).toHaveAttribute(
      'href',
      '/pilot108/individual?draftId=e2e-p108-draft',
    );
    expect(legacyUploadCalls).toBe(0);
  });
});
