const { chromium } = require('playwright');

const BASE = 'http://localhost:3211';
const SHOT_DIR = 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\claude\\c--Users-ASUS-Downloads-billing-software\\71eae5df-78c9-458c-bdde-07dc3a63ddf6\\scratchpad\\';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE + '/sign-up');
  await page.fill('#name', 'Zoom Tester');
  await page.fill('#email', 'zoomtest@example.com');
  await page.fill('#password', 'password123');
  await Promise.all([page.waitForURL(BASE + '/'), page.click('button[type=submit]')]);

  await page.goto(BASE + '/dashboard/businesses/new');
  await page.fill('#name', 'Zoom Biz');
  await Promise.all([
    page.waitForURL(/\/dashboard\/businesses\/(?!new)[^/]+$/),
    page.click('button:has-text("Create Business")'),
  ]);
  const businessUrl = page.url();

  await page.goto(businessUrl + '/categories/new');
  await page.fill('#name', 'General');
  await Promise.all([page.waitForURL(/\?tab=inventory/), page.click('button:has-text("Create Category")')]);

  await page.goto(businessUrl + '/inventory/new');
  await page.fill('#name', 'Rice Bag');
  await page.fill('#price', '85');
  await page.fill('#quantity', '50');
  // Set unit to Kg for a realistic case
  await page.locator('button:has-text("Pcs")').first().click();
  await page.getByRole('option', { name: 'Kg' }).click();
  await Promise.all([page.waitForURL(/\?tab=inventory/), page.click('button:has-text("Create Product")')]);

  await page.goto(businessUrl + '/invoices/new');
  await page.locator('button:has-text("Custom item")').first().click();
  await page.getByRole('option', { name: /Rice Bag/ }).click();
  await page.fill('input[placeholder="Description"]', 'Rice Bag');

  // full row screenshot
  const row = page.locator('div.bg-accent\\/50').first();
  await row.screenshot({ path: SHOT_DIR + 'zoom-row.png' });

  // Also grab bounding boxes of the Quantity and Price wrapper divs to check gap/overlap
  const boxes = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label')).filter(l =>
      ['Quantity', 'Price (₹)', 'Description', 'Amount'].includes(l.textContent.trim())
    );
    return labels.map(l => {
      const wrapper = l.parentElement;
      const rect = wrapper.getBoundingClientRect();
      return { label: l.textContent.trim(), left: rect.left, right: rect.right, width: rect.width };
    });
  });
  console.log(JSON.stringify(boxes, null, 2));

  await browser.close();
  console.log('DONE');
})().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
