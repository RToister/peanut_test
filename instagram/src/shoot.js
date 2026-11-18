// Знімає скріншоти демо-сайтів (телефон + ноутбук) для постів.
// Запуск з кореня репозиторію: node instagram/src/shoot.js
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(__dirname, '../shots');
const SITES = ['barber', 'nails', 'psychologist', 'coach', 'fitness', 'cosmetologist', 'tutor', 'hausfrei'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(d);
  });
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const views = { phone: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
                  laptop: { width: 1440, height: 900, deviceScaleFactor: 1.5 } };
  for (const site of SITES) for (const [name, vp] of Object.entries(views)) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, ...vp, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${base}/${site}/`, { waitUntil: 'networkidle' });
    // показати елементи, що з'являються при прокрутці
    await page.addStyleTag({ content: '*{animation-delay:0s!important;transition:none!important}' });
    await page.evaluate(() => document.querySelectorAll('.reveal,[data-reveal],.fade,.r').forEach(e => e.classList.add('in', 'show', 'visible', 'is-visible')));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${site}-${name}.jpg`, type: 'jpeg', quality: 88 });
    await ctx.close();
    console.log('✓', site, name);
  }
  await browser.close(); server.close();
})();
