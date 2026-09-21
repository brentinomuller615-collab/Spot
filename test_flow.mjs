import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to http://localhost:3000");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    console.log("Waiting for map to load");
    // Wait for the map container (assuming MapTiler canvas or similar exists)
    await page.waitForSelector('.maplibregl-canvas', { timeout: 10000 }).catch(() => console.log("Maplibregl canvas not found, continuing anyway"));

    console.log("Clicking map");
    await page.mouse.click(500, 500);
    
    console.log("Waiting for 'Report Parking Area' button");
    await page.waitForSelector('text="Report Parking Area"', { timeout: 5000 });
    
    console.log("Clicking 'Report Parking Area'");
    await page.click('text="Report Parking Area"');
    
    // Wait for a second for the permanent marker to appear
    await page.waitForTimeout(2000);
    
    console.log("Clicking map again at same location");
    await page.mouse.click(500, 500);
    
    console.log("Clicking 'Report Parking Area' again");
    await page.click('text="Report Parking Area"');
    
    console.log("Waiting for '3' button in modal");
    await page.waitForSelector('button:has-text("3")', { timeout: 5000 });
    
    console.log("Clicking '3'");
    await page.click('button:has-text("3")');
    
    console.log("Clicking 'Submit'");
    await page.click('button:has-text("Submit")'); // Adjust selector based on actual button text

    await page.waitForTimeout(2000);
    console.log("Checking if +3 appears");
    
    const textContent = await page.textContent('body');
    if (textContent.includes('+3')) {
      console.log("SUCCESS: +3 appeared on the map");
    } else {
      console.log("WARNING: +3 might not have appeared on the map");
    }
  } catch (e) {
    console.error("ERROR: ", e);
  } finally {
    await browser.close();
  }
})();
