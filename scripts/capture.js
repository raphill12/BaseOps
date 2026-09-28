const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    proxy: process.env.HTTPS_PROXY
      ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }
      : undefined,
    args: ['--ignore-certificate-errors'],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  try { await page.getByText(/Live ·/).waitFor({ timeout: 30000 }); }
  catch { console.log('WARN: Live badge not seen'); }

  const tabs = ['QTD Snapshot', 'Overview', 'Revenue & ARR', 'Operating & Cash'];
  const out = process.argv[2] || 'shots';
  for (const t of tabs) {
    await page.getByText(t, { exact: true }).first().click();
    await page.waitForTimeout(800);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: 1920, height: Math.min(h, 3600) });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(3000); // recharts remeasure + animation
    const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await page.screenshot({ path: `${out}/${slug}.png`, fullPage: false });
    console.log('shot:', slug, 'h=', h);
    await page.setViewportSize({ width: 1920, height: 1080 });
  }
  await browser.close();
})();
