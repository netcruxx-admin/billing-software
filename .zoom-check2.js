const { chromium } = require('playwright');

const BASE = 'http://localhost:3211';
const SHOT_DIR = 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\claude\\c--Users-ASUS-Downloads-billing-software\\71eae5df-78c9-458c-bdde-07dc3a63ddf6\\scratchpad\\';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('response', async (res) => {
    if (res.status() >= 400) console.log('HTTP ERROR:', res.status(), res.url());
  });

  await page.goto(BASE + '/sign-up');
  await page.fill('#name', 'NoProduct Tester2');
  await page.fill('#email', 'noproducttest2@example.com');
  await page.fill('#password', 'password123');
  await Promise.all([page.waitForURL(BASE + '/'), page.click('button[type=submit]')]);

  await page.goto(BASE + '/dashboard/businesses/new');
  await page.fill('#name', 'No Product Biz 2');
  await Promise.all([
    page.waitForURL(/\/dashboard\/businesses\/(?!new)[^/]+$/),
    page.click('button:has-text("Create Business")'),
  ]);
  const businessUrl = page.url();
  console.log('Business URL:', businessUrl);

  // No category/product created - matches the user's screenshot scenario (no products yet)
  await page.goto(businessUrl + '/invoices/new');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: SHOT_DIR + 'full-page-debug.png', fullPage: true });

  const row = page.locator('div.bg-accent\\/50').first();
  await row.screenshot({ path: SHOT_DIR + 'zoom-row-noproduct.png' });

  await browser.close();
  console.log('DONE');
})().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
