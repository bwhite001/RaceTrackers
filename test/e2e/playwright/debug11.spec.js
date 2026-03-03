import { test, expect } from './fixtures.js';
import { createRace, goHome, pickFirstRaceInModal } from './helpers.js';

const RACE = { name: 'Debug Race', date: '2025-06-15', startTime: '07:00', numCheckpoints: 2, runnerRange: { min: 400, max: 410 } };

test.beforeEach(async ({ page }) => {
  await createRace(page, RACE);
});

test('debug spec 11 full flow', async ({ page }) => {
  await goHome(page);
  const baseStationBtn = page.getByRole('button', { name: /base station/i });
  const btnVisible = await baseStationBtn.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('1. Base Station btn visible:', btnVisible);
  if (!btnVisible) return;
  
  await baseStationBtn.click();
  await pickFirstRaceInModal(page);
  
  const loaded = await page.waitForURL(/base-station/, { timeout: 10000 }).catch(() => false);
  console.log('2. Loaded base-station:', !!loaded, page.url());
  if (!loaded) return;
  
  await page.waitForTimeout(1000);
  console.log('3. URL after 1s:', page.url());
  
  const overviewTab = page.getByRole('tab', { name: /overview/i }).first();
  const tabVisible = await overviewTab.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('4. Overview tab visible:', tabVisible);
  if (!tabVisible) return;
  
  await overviewTab.click();
  await page.waitForTimeout(500);
  
  const gridHeader = page.getByText(/checkpoint|cp\s*1|cp1/i).first();
  const headerVisible = await gridHeader.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('5. Grid header visible:', headerVisible);
});
