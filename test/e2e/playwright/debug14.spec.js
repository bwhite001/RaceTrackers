import { test, expect } from './fixtures.js';
import { createRace } from './helpers.js';

test.describe('Debug spec 14', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  
  test('debug race management from beforeEach', async ({ page }) => {
    await page.goto('/race-management');
    await page.waitForTimeout(3000);
    
    const text = await page.locator('body').innerText();
    const hasNoRaces = text.includes('No races yet');
    const buttons = await page.getByRole('button').allInnerTexts();
    console.log('No races?', hasNoRaces);
    console.log('Buttons:', JSON.stringify(buttons.slice(0, 15)));
    const moreBtn = page.getByRole('button', { name: /more options/i });
    const moreBtnCount = await moreBtn.count();
    console.log('More options buttons count:', moreBtnCount);
  });
});
