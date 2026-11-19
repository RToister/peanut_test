// Рілз 1080×1920: гачок → прокрутка 5 демо-сайтів на телефоні → заклик написати.
// Запуск з кореня репозиторію: node instagram/src/reel.js
// Результат: instagram/out/reel-01-sites.mp4 (без звуку, музику додають в Instagram).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const DIR = path.resolve(__dirname, '..');
const BUILD = path.join(DIR, '.build', 'reel');
const OUT = path.join(DIR, 'out', 'reel-01-sites.mp4');
const FPS = 30;

const BRAND = { ink: '#111014', accent: '#5b4bff', accent2: '#c6ff4a' };
const HANDLE = '@r.toister.sites';
const SITES = [
  ['barber', '💈 Барбершоп'],
  ['nails', '💅 Студія манікюру'],
  ['coach', '📈 Бізнес-коуч'],
  ['fitness', '🏋️ Фітнес-тренер'],
  ['psychologist', '🌿 Психолог'],
];

// таймлайн, секунди
const HOOK = 2.2, PER = 2.2, CTA = 3.6;
const SITES_END = HOOK + PER * SITES.length;
const TOTAL = SITES_END + CTA;

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

async function shootLong(browser, base) {
  // довгі скріншоти сайтів у мобільному вигляді (4 екрани)
  for (const [site] of SITES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto(`${base}/${site}/`, { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: '*{animation-delay:0s!important;transition:none!important}' });
    for (let y = 0; y < 844 * 5; y += 300) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(60); }
    await p.evaluate(() => document.querySelectorAll('.reveal,[data-reveal],.fade,.r').forEach(e => e.classList.add('in', 'show', 'visible', 'is-visible')));
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(BUILD, `${site}-long.jpg`), type: 'jpeg', quality: 90, fullPage: true,
      clip: { x: 0, y: 0, width: 390, height: 844 * 4 } });
    await ctx.close();
  }
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:${BRAND.ink};font-family:Inter,system-ui,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
.glow{position:absolute;width:1200px;height:1200px;border-radius:50%;left:-60px;top:500px;background:radial-gradient(circle,rgba(91,75,255,.55),transparent 62%)}
.hook{position:absolute;left:90px;right:90px;top:330px;font-size:120px;line-height:1;font-weight:800;letter-spacing:-.045em}
.hook span{color:${BRAND.accent2}}
.label{position:absolute;left:0;right:0;top:250px;text-align:center;font-size:64px;font-weight:800;letter-spacing:-.03em}
.sub{position:absolute;left:0;right:0;top:340px;text-align:center;font-size:34px;font-weight:600;color:#a9a8b0}
.phone{position:absolute;left:50%;top:470px;width:560px;height:1212px;margin-left:-280px;border-radius:84px;padding:20px;background:#0b0b0d;
  box-shadow:0 50px 120px rgba(0,0,0,.6),inset 0 0 0 3px #2a2a2e;transform-origin:50% 0}
.scr{width:100%;height:100%;border-radius:66px;overflow:hidden;position:relative;background:#fff}
.scr img{position:absolute;left:0;top:0;width:100%;display:block}
.notch{position:absolute;top:38px;left:50%;width:150px;height:40px;margin-left:-75px;background:#0b0b0d;border-radius:99px;z-index:3}
.dots{position:absolute;left:0;right:0;top:1720px;display:flex;justify-content:center;gap:14px}
.dots i{width:14px;height:14px;border-radius:50%;background:#fff;opacity:.25}
.cta{position:absolute;left:90px;right:90px;top:520px;text-align:left}
.cta h2{font-size:118px;line-height:1;font-weight:800;letter-spacing:-.045em}
.cta p{font-size:44px;line-height:1.3;color:#cfcdd6;margin-top:40px;font-weight:500}
.btn{display:inline-block;margin-top:60px;background:${BRAND.accent2};color:${BRAND.ink};font-size:52px;font-weight:800;padding:34px 56px;border-radius:999px}
.handle{margin-top:46px;font-size:40px;font-weight:700;color:#8f84ff}
</style></head><body>
<div class="glow"></div>
<div class="hook" id="hook">Сайт для бізнесу<br>за <span>3 дні</span> 👀</div>
<div class="label" id="label"></div><div class="sub" id="sub">дизайн під вашу нішу</div>
<div class="phone" id="phone"><div class="notch"></div><div class="scr">
  ${SITES.map(([s]) => `<img id="img-${s}" src="${s}-long.jpg">`).join('')}
</div></div>
<div class="dots" id="dots">${SITES.map(() => '<i></i>').join('')}</div>
<div class="cta" id="cta"><h2>Хочете<br>такий <span style="color:${BRAND.accent2}">сайт?</span></h2>
  <p>Лендінг від 2 500 ₴ · запуск за 3 дні<br>без щомісячних платежів</p>
  <div class="btn">Пишіть «САЙТ» у Direct</div><div class="handle">${HANDLE}</div></div>
<script>
const SITES=${JSON.stringify(SITES)}, HOOK=${HOOK}, PER=${PER}, END=${SITES_END};
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const out=x=>1-Math.pow(1-x,3);
const $=id=>document.getElementById(id);
window.setT=function(t){
  // гачок
  const hookIn=out(clamp(t/0.5)), hookOut=clamp((t-(HOOK-0.45))/0.35);
  $('hook').style.opacity=hookIn*(1-hookOut);
  $('hook').style.transform='translateY('+((1-hookIn)*60-hookOut*80)+'px)';
  // телефон
  const enter=out(clamp((t-0.6)/1.0));
  const exit=ease(clamp((t-END)/0.6));
  const phoneY=(1-enter)*1400 + 260*(1-ease(clamp((t-(HOOK-0.15))/0.5))) + exit*1500;
  $('phone').style.transform='translateY('+phoneY+'px)';
  // сайти
  const k=clamp(Math.floor((t-HOOK)/PER),0,SITES.length-1);
  const local=clamp((t-HOOK-k*PER)/PER);
  SITES.forEach(([s],i)=>{
    const img=$('img-'+s);
    img.style.opacity = i===k ? 1 : 0;
    if(i===k){
      const h=img.naturalHeight*(520/img.naturalWidth); // ширина екрану 520px
      const maxScroll=Math.max(0,h-1172);
      const scroll = t<HOOK ? 0 : ease(clamp((local-0.12)/0.8))*Math.min(maxScroll,1172*2.2);
      img.style.transform='translateY('+(-scroll)+'px)';
    }
  });
  const inSites=t>=HOOK && t<END;
  const lblIn=inSites? out(clamp((t-HOOK-k*PER)/0.25)) : 0;
  $('label').textContent=SITES[k][1];
  $('label').style.opacity=lblIn; $('label').style.transform='translateY('+(1-lblIn)*30+'px)';
  $('sub').style.opacity=inSites? clamp((t-HOOK)/0.4) : 0;
  [...$('dots').children].forEach((d,i)=>{d.style.opacity= inSites ? (i===k?1:.25) : 0; d.style.background=i===k?'${BRAND.accent2}':'#fff'});
  // заклик
  const c=out(clamp((t-END-0.35)/0.6));
  $('cta').style.opacity=c; $('cta').style.transform='translateY('+(1-c)*80+'px)';
};
</script></body></html>`;

(async () => {
  fs.rmSync(BUILD, { recursive: true, force: true });
  fs.mkdirSync(path.join(BUILD, 'frames'), { recursive: true });
  const server = http.createServer((req, res) => {
    let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
  });
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch();
  await shootLong(browser, `http://127.0.0.1:${server.address().port}`);
  server.close();

  fs.writeFileSync(path.join(BUILD, 'reel.html'), html);
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('file://' + path.join(BUILD, 'reel.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const n = Math.round(TOTAL * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.setT(t), i / FPS);
    await page.screenshot({ path: path.join(BUILD, 'frames', String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await browser.close();

  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(BUILD, 'frames', '%04d.jpg'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '18', '-movflags', '+faststart', OUT]);
  fs.rmSync(path.join(DIR, '.build'), { recursive: true, force: true });
  console.log('✓', OUT, `${TOTAL.toFixed(1)} с, ${n} кадрів`);
})();
