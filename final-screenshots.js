import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureAllScreenshots() {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 900, height: 600 }
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 600 });

    try {
        console.log('Starting screenshot capture...');

        // Screenshot 1: Initial Application Launch
        console.log('Capturing Screenshot 1: Initial Application Launch');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await delay(1000);
        await page.screenshot({ path: path.join(screenshotsDir, '01-initial-application-launch.png') });

        // Screenshot 2: Race Creation Form (Empty)
        console.log('Capturing Screenshot 2: Race Creation Form (Empty)');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const createButton = buttons.find(btn => btn.textContent.includes('Create First Race'));
            if (createButton) createButton.click();
        });
        await delay(1000);
        await page.screenshot({ path: path.join(screenshotsDir, '02-race-creation-form-empty.png') });

        // Screenshot 3: Race Form with Data Entry
        console.log('Capturing Screenshot 3: Race Form with Data Entry');
        await page.type('input[placeholder*="race name"]', 'City Marathon Championship 2025');
        await page.type('input[placeholder*="100-200"]', '500-750');
        await delay(1000);
        await page.screenshot({ path: path.join(screenshotsDir, '03-race-form-with-data.png') });

        // Screenshot 4: Race Created and Mode Selection
        console.log('Capturing Screenshot 4: Race Created and Mode Selection');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const createButton = buttons.find(btn => btn.textContent.includes('Create Race'));
            if (createButton) createButton.click();
        });
        await delay(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '04-race-created-mode-selection.png') });

        // Screenshot 5: Checkpoint Mode Interface
        console.log('Capturing Screenshot 5: Checkpoint Mode Interface');
        await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const checkpointElement = elements.find(el => el.textContent && el.textContent.includes('Checkpoint Mode'));
            if (checkpointElement) checkpointElement.click();
        });
        await delay(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '05-checkpoint-mode-interface.png') });

        // Screenshot 6: Base Station Mode - Data Entry
        console.log('Capturing Screenshot 6: Base Station Mode - Data Entry');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const baseStationButton = buttons.find(btn => btn.textContent.includes('Base Station'));
            if (baseStationButton) baseStationButton.click();
        });
        await delay(1000);
        await page.screenshot({ path: path.join(screenshotsDir, '06-base-station-data-entry.png') });

        // Screenshot 7: Race Overview with Statistics
        console.log('Capturing Screenshot 7: Race Overview with Statistics');
        await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const overviewElement = elements.find(el => el.textContent && el.textContent.includes('Race Overview'));
            if (overviewElement) overviewElement.click();
        });
        await delay(1000);
        await page.screenshot({ path: path.join(screenshotsDir, '07-race-overview-statistics.png') });

        // Screenshot 8: Settings Modal (Light Mode)
        console.log('Capturing Screenshot 8: Settings Modal (Light Mode)');
        await page.click('button[aria-label*="settings"], .settings-icon, button:last-child');
        await delay(1000);
        await page.screenshot({ path: path.join(screenshotsDir, '08-settings-modal-light.png') });

        // Screenshot 9: Dark Mode Interface
        console.log('Capturing Screenshot 9: Dark Mode Interface');
        await page.evaluate(() => {
            const toggles = document.querySelectorAll('input[type="checkbox"]');
            if (toggles.length > 0) toggles[0].click();
        });
        await delay(500);
        await page.screenshot({ path: path.join(screenshotsDir, '09-dark-mode-interface.png') });

        // Screenshot 10: Final Interface State
        console.log('Capturing Screenshot 10: Final Interface State');
        await page.evaluate(() => {
            const closeButtons = Array.from(document.querySelectorAll('button'));
            const closeButton = closeButtons.find(btn => btn.textContent.includes('×'));
            if (closeButton) closeButton.click();
        });
        await delay(500);
        await page.screenshot({ path: path.join(screenshotsDir, '10-final-interface-state.png') });

        console.log('All screenshots captured successfully!');

    } catch (error) {
        console.error('Error capturing screenshots:', error);
    } finally {
        await browser.close();
    }
}

captureAllScreenshots().catch(console.error);
