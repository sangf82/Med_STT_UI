import type { Page } from '@playwright/test';

/** Mocks roster used by `/pilot108/individual` initial load. */
export async function applyPilot108IndividualMocks(page: Page) {
  await page.route('**/pilot108/individual/roster**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ members: [] }),
    });
  });
}

export async function applyPilot108SttCaptureMocks(page: Page) {
  await page.route('**/internal/ai/p108/step1-hear', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        thread_id: 'e2e-thread',
        heard: [{ patient_code: 'P001', spoken_name: 'Tuấn', confidence: 0.91 }],
        raw_transcript: 'mock transcript',
      }),
    });
  });
  await page.route('**/internal/ai/p108/step2-resolve', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        thread_id: 'e2e-thread',
        checklist: [{ id: 'task_1', text: 'Tuấn: kiểm tra sinh hiệu', patient_code: 'P001', patient_name: 'Tuấn' }],
      }),
    });
  });
  await page.route('**/pilot108/individual/drafts', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-p108-draft',
        user_id: 'e2e',
        list_status: 'DRAFT_LIST',
        items: [
          {
            id: 'task_1',
            text: 'Tuấn: kiểm tra sinh hiệu',
            status: 'DRAFT',
            patient_code: 'P001',
            patient_name: 'Tuấn',
          },
        ],
      }),
    });
  });
}

