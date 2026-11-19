// Генерує картинки для Instagram: пости 1080×1350, аватар, обкладинки Highlights, шаблон Stories.
// Запуск з кореня репозиторію:
//   node instagram/src/shoot.js    (один раз або після змін у демо-сайтах — оновлює скріншоти)
//   node instagram/src/render.js   (збирає всі картинки в instagram/out/)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const DIR = path.resolve(__dirname, '..');
const OUT = path.join(DIR, 'out');
const BUILD = path.join(DIR, '.build');
const shot = (site, kind) => `file://${DIR}/shots/${site}-${kind}.jpg`;

const BRAND = { ink: '#111014', paper: '#f4f2ee', accent: '#5b4bff', accent2: '#c6ff4a', muted: '#6b6a70' };
const HANDLE = 't.me/ruslan_toister';

// ---------- базові стилі ----------
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{font-family:Inter,system-ui,sans-serif;background:${BRAND.paper};color:${BRAND.ink};
  -webkit-font-smoothing:antialiased;font-feature-settings:"ss01","cv11"}
.f{position:relative;width:var(--w);height:var(--h);padding:84px;display:flex;flex-direction:column;overflow:hidden}
.dark{background:${BRAND.ink};color:#fff}
.violet{background:${BRAND.accent};color:#fff}
.tag{display:inline-flex;align-items:center;gap:12px;font-size:26px;font-weight:600;letter-spacing:.02em;
  padding:12px 24px;border-radius:999px;border:2px solid currentColor;align-self:flex-start;opacity:.9}
.tag i{width:12px;height:12px;border-radius:50%;background:${BRAND.accent2};display:block}
h1{font-size:104px;line-height:.98;font-weight:800;letter-spacing:-.045em}
h2{font-size:76px;line-height:1.02;font-weight:800;letter-spacing:-.04em}
.hl{color:${BRAND.accent}}
.dark .hl,.violet .hl{color:${BRAND.accent2}}
.lead{font-size:36px;line-height:1.35;font-weight:500;color:${BRAND.muted};letter-spacing:-.01em}
.dark .lead{color:#a9a8b0}.violet .lead{color:#dcd8ff}
.foot{position:absolute;left:84px;right:84px;bottom:64px;display:flex;justify-content:space-between;
  align-items:center;font-size:24px;font-weight:600;opacity:.6;letter-spacing:.01em}
.logo{display:inline-flex;align-items:center;gap:14px;font-weight:800;font-size:28px;letter-spacing:-.02em}
.logo b{width:44px;height:44px;border-radius:12px;background:${BRAND.accent};color:#fff;display:grid;place-items:center;font-size:24px}
.phone{position:absolute;width:var(--pw);aspect-ratio:390/844;border-radius:calc(var(--pw)*.15);padding:calc(var(--pw)*.035);
  background:#0b0b0d;box-shadow:0 40px 90px rgba(0,0,0,.35),inset 0 0 0 2px #2a2a2e}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:calc(var(--pw)*.12);display:block}
.phone::after{content:"";position:absolute;top:calc(var(--pw)*.065);left:50%;transform:translateX(-50%);
  width:28%;height:calc(var(--pw)*.07);background:#0b0b0d;border-radius:99px}
.laptop{position:absolute;width:var(--lw)}
.laptop .scr{background:#0b0b0d;border-radius:22px 22px 0 0;padding:14px;box-shadow:0 30px 80px rgba(0,0,0,.3)}
.laptop img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;display:block;border-radius:8px}
.laptop .base{height:26px;background:linear-gradient(#d9d9de,#a9a9b0);border-radius:0 0 26px 26px;margin:0 -5%;}
.num{font-size:28px;font-weight:700;opacity:.5}
.violet .logo b{background:${BRAND.accent2};color:${BRAND.ink}}
`;

const page = (w, h, body, extra = '') =>
  `<!doctype html><html lang="uk"><head><meta charset="utf-8"><style>:root{--w:${w}px;--h:${h}px}${CSS}${extra}</style></head><body>${body}</body></html>`;

const logo = (dark) => `<span class="logo"><b>R</b>Сайти&nbsp;+&nbsp;боти</span>`;
const foot = (right = HANDLE) => `<div class="foot">${logo()}<span>${right}</span></div>`;
const phone = (src, css) => `<div class="phone" style="${css}"><img src="${src}"></div>`;
const laptop = (src, css) => `<div class="laptop" style="${css}"><div class="scr"><img src="${src}"></div><div class="base"></div></div>`;

// ---------- кейси ----------
const CASES = [
  { site: 'barber', niche: 'Барбершоп · Львів', name: 'BLADE', bg: '#17130e', fg: '#f3ead9', ac: '#c9a45c',
    pts: ['Ціни та майстри на одному екрані', 'Онлайн-запис без дзвінків', 'Темний преміальний стиль'] },
  { site: 'psychologist', niche: 'Психолог · онлайн', name: 'Марія Коваль', bg: '#e9ece3', fg: '#1f2a22', ac: '#3f5b47',
    pts: ['Спокійний дизайн, що не тисне', 'Запис на безкоштовне знайомство', 'Відгуки та формати роботи'] },
  { site: 'coach', niche: 'Бізнес-коуч', name: 'savchuk.coach', bg: '#120f24', fg: '#fff', ac: '#8b7bff',
    pts: ['Bento-сітка з результатами', 'Лічильники та кейси клієнтів', 'Заявка на стратегічну сесію'] },
  { site: 'fitness', niche: 'Персональний тренер · Київ', name: 'KATE.FIT', bg: '#0c0c0c', fg: '#fff', ac: '#d4ff3a',
    pts: ['Енергійний дизайн з характером', 'Програми та історії клієнтів', 'Перше тренування — безкоштовно'] },
  { site: 'cosmetologist', niche: 'Лікар-косметолог · Одеса', name: 'Olena Hryn', bg: '#f3e6dd', fg: '#2b201b', ac: '#a8735a',
    pts: ['Ніжний «скляний» стиль', 'Процедури, до/після, відгуки', 'Запис на консультацію'] },
  { site: 'nails', niche: 'Студія манікюру · Київ', name: 'Lumi Nails', bg: '#f9e4e8', fg: '#2a1a1f', ac: '#d4607c',
    pts: ['Прайс і галерея робіт', 'Знижка −15% на перший візит', 'Заявка за 30 секунд'] },
  { site: 'tutor', niche: 'Репетитор англійської', name: 'EN з Анною', bg: '#e8ecff', fg: '#121a3d', ac: '#3b5bfd',
    pts: ['Для кого заняття та вартість', 'Відповіді на часті запитання', 'Запис на пробний урок'] },
  { site: 'hausfrei', niche: 'Клієнт з Німеччини · Аугсбург', name: 'HausFrei', bg: '#1b2440', fg: '#fff', ac: '#d4b06a',
    pts: ['Сайт німецькою, готовий до інших мов', 'Дзвінок і WhatsApp в один дотик', 'Онлайн-калькулятор вартості'] },
];

function caseSlide(c, swipe = false) {
  return page(1080, 1350, `
  <div class="f" style="background:${c.bg};color:${c.fg}">
    <span class="tag" style="color:${c.ac}"><i style="background:${c.ac}"></i>Кейс · ${c.niche}</span>
    <h2 style="margin-top:34px;font-size:84px">${c.name}</h2>
    <ul style="list-style:none;margin-top:30px;display:grid;gap:14px;max-width:470px">
      ${c.pts.map(p => `<li style="font-size:29px;line-height:1.3;font-weight:500;display:flex;gap:14px;opacity:.85"><span style="color:${c.ac};font-weight:800">→</span>${p}</li>`).join('')}
    </ul>
    ${laptop(shot(c.site, 'laptop'), '--lw:820px;left:430px;top:600px')}
    ${phone(shot(c.site, 'phone'), '--pw:330px;left:300px;top:520px')}
    <div class="foot" style="opacity:.7"><span class="logo"><b>R</b>Сайти&nbsp;+&nbsp;боти</span><span>${swipe ? 'свайп → наступна робота' : HANDLE}</span></div>
  </div>`);
}

// ---------- пост 1: знайомство ----------
const intro = page(1080, 1350, `
<div class="f dark">
  <span class="tag" style="color:#fff"><i></i>Відкрито запис на грудень</span>
  <h1 style="margin-top:40px">Сайт або<br>Telegram-бот<br>за <span class="hl">3 дні</span></h1>
  <p class="lead" style="margin-top:30px;max-width:640px">Для салонів, барберів, тренерів, психологів і всіх, хто працює з клієнтами</p>
  ${phone(shot('nails', 'phone'), '--pw:300px;left:90px;top:760px;transform:rotate(-8deg)')}
  ${phone(shot('fitness', 'phone'), '--pw:330px;left:375px;top:700px;z-index:2')}
  ${phone(shot('psychologist', 'phone'), '--pw:300px;left:690px;top:760px;transform:rotate(8deg)')}
</div>`);

// ---------- пост: ціни ----------
const prices = page(1080, 1350, `
<div class="f">
  <span class="tag" style="color:${BRAND.accent}"><i style="background:${BRAND.accent}"></i>Прозорі ціни</span>
  <h2 style="margin-top:34px">Скільки коштує<br>сайт для бізнесу?</h2>
  <div style="margin-top:56px;display:grid;gap:22px">
    ${[['🌐', 'Лендінг', 'Послуги, ціни, відгуки, форма заявки, версія для телефону', '2 500'],
       ['🤖', 'Telegram-бот', 'Запис, заявки, відповіді на часті питання, сповіщення вам', '2 500'],
       ['🚀', 'Сайт + бот', 'Заявки з сайту одразу падають вам у Telegram', '4 500']]
      .map(([e, t, d, p], i) => `
      <div style="display:flex;align-items:center;gap:28px;padding:34px 38px;border-radius:32px;
        background:${i === 2 ? BRAND.ink : '#fff'};color:${i === 2 ? '#fff' : BRAND.ink};${i === 2 ? '' : 'box-shadow:0 2px 0 rgba(0,0,0,.04)'}">
        <span style="font-size:56px">${e}</span>
        <div style="flex:1"><div style="font-size:38px;font-weight:800;letter-spacing:-.02em">${t}</div>
          <div style="font-size:24px;line-height:1.35;opacity:.6;margin-top:6px;max-width:470px">${d}</div></div>
        <div style="text-align:right"><div style="font-size:22px;opacity:.6;font-weight:600">від</div>
          <div style="font-size:48px;font-weight:800;letter-spacing:-.03em;white-space:nowrap;color:${i === 2 ? BRAND.accent2 : BRAND.accent}">${p}&nbsp;₴</div></div>
      </div>`).join('')}
  </div>
  <p class="lead" style="margin-top:40px;font-size:30px">Без щомісячних платежів за конструктор. 50% — на старті, 50% — коли все готово.</p>
  ${foot()}
</div>`);

// ---------- пост: процес ----------
const steps = [['Знайомство', 'Розповідаєте про бізнес — я пропоную структуру'],
  ['Демо за 1–2 дні', 'Показую першу версію, вносимо правки'],
  ['Запуск', 'Домен, форма заявок, перевірка на телефонах'],
  ['Оплата після результату', '50% передоплата, 50% — коли все готово']];
const process = page(1080, 1350, `
<div class="f violet">
  <span class="tag" style="color:#fff"><i></i>Як ми працюємо</span>
  <h2 style="margin-top:34px">Від заявки до<br>готового сайту — <span class="hl">4 кроки</span></h2>
  <div style="margin-top:60px;display:grid;gap:0">
    ${steps.map(([t, d], i) => `
      <div style="display:flex;gap:36px;align-items:flex-start;padding:30px 0;border-top:2px solid rgba(255,255,255,.22)">
        <span style="font-size:72px;font-weight:800;line-height:.9;color:${BRAND.accent2};width:80px">${i + 1}</span>
        <div><div style="font-size:40px;font-weight:800;letter-spacing:-.02em">${t}</div>
        <div style="font-size:28px;color:#dcd8ff;margin-top:6px">${d}</div></div>
      </div>`).join('')}
  </div>
  ${foot()}
</div>`);

// ---------- карусель: «Instagram ≠ сайт» ----------
const reasons = [
  ['Клієнт шукає в Google, а не в Instagram', 'Запит «манікюр Поділ» або «психолог онлайн» веде на сайти. Без сайту вас там просто немає.'],
  ['Сайт відповідає замість вас', 'Ціни, адреса, графік, відповіді на часті питання — клієнт бачить усе одразу, без «ціна в дірект».'],
  ['Заявка за 30 секунд', 'Форма або Telegram-бот: людина залишає контакт, а вам приходить сповіщення. Навіть о 23:00.'],
  ['Довіра = продажі', 'Охайний сайт з відгуками й прикладами робіт виглядає солідніше за профіль, якого «немає без інтернету».'],
  ['Це ваше, а не алгоритму', 'Охоплення в соцмережах падають, акаунт можуть заблокувати. Сайт і домен належать тільки вам.'],
];
const carousel = [
  page(1080, 1350, `
  <div class="f" style="background:${BRAND.accent2}">
    <span class="tag"><i style="background:${BRAND.ink}"></i>Збережи, щоб не загубити</span>
    <h1 style="margin-top:auto;font-size:118px">Instagram<br>≠ сайт</h1>
    <p class="lead" style="color:${BRAND.ink};opacity:.75;margin-top:30px;margin-bottom:120px;max-width:760px">5 причин, чому малому бізнесу потрібен власний сайт, навіть якщо є гарний профіль</p>
    <div class="foot" style="opacity:.8">${logo()}<span>гортай →</span></div>
  </div>`),
  ...reasons.map(([t, d], i) => page(1080, 1350, `
  <div class="f ${i % 2 ? 'dark' : ''}">
    <span class="num">0${i + 1} / 05</span>
    <div style="font-size:300px;font-weight:800;line-height:.8;letter-spacing:-.06em;margin-top:auto;color:${i % 2 ? BRAND.accent2 : BRAND.accent}">${i + 1}</div>
    <h2 style="margin-top:60px">${t}</h2>
    <p class="lead" style="margin-top:34px;max-width:840px;margin-bottom:150px">${d}</p>
    ${foot(i === 4 ? 'останній слайд →' : 'гортай →')}
  </div>`)),
  page(1080, 1350, `
  <div class="f violet" style="justify-content:center">
    <h2 style="font-size:88px">Хочете такий сайт<br>для свого бізнесу?</h2>
    <p class="lead" style="margin-top:34px;max-width:780px">Напишіть у Direct слово <b style="color:${BRAND.accent2}">САЙТ</b> — безкоштовно підкажу, що підійде саме вам, і назву ціну за 10 хвилин.</p>
    ${foot()}
  </div>`),
];

// ---------- пост: ще роботи (колаж) ----------
const more = page(1080, 1350, `
<div class="f dark">
  <span class="tag" style="color:#fff"><i></i>Портфоліо</span>
  <h2 style="margin-top:34px">8 сайтів —<br>8 різних <span class="hl">характерів</span></h2>
  <p class="lead" style="margin-top:24px;max-width:760px">Жодного шаблону: дизайн під нішу, клієнта і настрій бренду</p>
  ${['barber', 'nails', 'coach', 'cosmetologist', 'tutor'].map((s, i) =>
    phone(shot(s, 'phone'), `--pw:250px;left:${-20 + i * 225}px;top:${760 + (i % 2) * 70}px;transform:rotate(${(i - 2) * 3}deg)`)).join('')}
</div>`);

// ---------- аватари (без літер, тільки іконки) ----------
const av = (bg, inner) => page(1080, 1080, `<div style="width:1080px;height:1080px;background:${bg};display:grid;place-items:center;position:relative;overflow:hidden">${inner}</div>`);
const I = BRAND.ink, A = BRAND.accent, L2 = BRAND.accent2;
const browser = (w, h, body, top = I, fill = '#fff') => `<div style="width:${w}px;height:${h}px;border-radius:${w * .09}px;background:${fill};overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.25);display:flex;flex-direction:column">
  <div style="height:${h * .2}px;background:${top};display:flex;align-items:center;gap:${w * .035}px;padding-left:${w * .08}px">
  <i style="width:${w * .045}px;height:${w * .045}px;border-radius:50%;background:#ff5f57"></i><i style="width:${w * .045}px;height:${w * .045}px;border-radius:50%;background:#febc2e"></i><i style="width:${w * .045}px;height:${w * .045}px;border-radius:50%;background:${L2}"></i></div>
  <div style="flex:1;position:relative">${body}</div></div>`;
const cursor = (size, css) => `<svg style="position:absolute;${css}" width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="${L2}" stroke="${I}" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const plane = (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M21.5 3.2 2.8 10.4c-1 .4-1 1.8 0 2.1l4.6 1.5 1.8 5.6c.3.9 1.4 1.1 2 .4l2.6-2.7 4.6 3.4c.8.6 1.9.1 2.1-.9l3-15c.2-1.1-.8-2-1.9-1.6ZM9.6 14.3l8-6.6-6.3 7.8-.4 3.2-1.3-4.4Z" fill="${color}"/></svg>`;
const AVATARS = [
  // 1: вікно браузера з макетом лендінгу і курсором
  av(A, `<div style="position:relative">${browser(640, 520, `
    <div style="position:absolute;left:60px;top:60px;width:300px;height:44px;border-radius:12px;background:${I}"></div>
    <div style="position:absolute;left:60px;top:126px;width:220px;height:44px;border-radius:12px;background:${I}"></div>
    <div style="position:absolute;left:60px;top:200px;width:180px;height:60px;border-radius:30px;background:${A}"></div>
    <div style="position:absolute;right:60px;top:60px;width:170px;height:200px;border-radius:24px;background:#e9e7ff"></div>
    <div style="position:absolute;left:60px;right:60px;bottom:40px;height:60px;display:flex;gap:20px"><i style="flex:1;border-radius:14px;background:#eeedf2"></i><i style="flex:1;border-radius:14px;background:#eeedf2"></i><i style="flex:1;border-radius:14px;background:#eeedf2"></i></div>`)}
    ${cursor(220, 'right:-70px;bottom:-90px')}</div>`),
  // 2: код </> на темному
  av(I, `<div style="font-size:400px;font-weight:800;letter-spacing:-.04em;line-height:1;margin-top:-30px;color:${A}">&lt;<span style="color:${L2}">/</span>&gt;</div>`),
  // 3: блискавка — «за 3 дні»
  av(A, `<svg width="560" height="560" viewBox="0 0 24 24"><path d="M13.5 2 4.5 13.5h6.5L9.5 22l9.5-12h-6.8L13.5 2Z" fill="${L2}" stroke="${I}" stroke-width=".9" stroke-linejoin="round"/></svg>`),
  // 4: телефон з повідомленнями (бот)
  av(L2, `<div style="width:400px;height:720px;border-radius:70px;background:${I};padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.25)">
    <div style="width:100%;height:100%;border-radius:52px;background:#fff;padding:90px 34px;display:flex;flex-direction:column;gap:26px">
      <i style="align-self:flex-start;width:240px;height:70px;border-radius:30px 30px 30px 8px;background:#eeedf2"></i>
      <i style="align-self:flex-end;width:200px;height:70px;border-radius:30px 30px 8px 30px;background:${A}"></i>
      <i style="align-self:flex-start;width:270px;height:110px;border-radius:30px 30px 30px 8px;background:#eeedf2"></i>
      <i style="align-self:flex-end;width:150px;height:70px;border-radius:30px 30px 8px 30px;background:${A}"></i>
    </div></div>`),
  // 5: браузер + паперовий літачок Telegram (сайт + бот)
  av(I, `<div style="position:relative">${browser(600, 480, `
    <div style="position:absolute;inset:0;display:grid;place-items:center">${plane(260, A)}</div>`, A)}</div>`),
  // 6: курсор великий на фіолетовому
  av(A, `<svg width="560" height="560" viewBox="0 0 24 24" style="margin:60px 0 0 60px"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="${I}" stroke-width=".8" stroke-linejoin="round"/><circle cx="19" cy="19" r="3" fill="${L2}" stroke="${I}" stroke-width=".8"/></svg>`),
  // 7: стос «блоків» сторінки (як будується лендінг)
  av(BRAND.paper, `<div style="display:grid;gap:30px;width:600px">
    <i style="height:150px;border-radius:36px;background:${A}"></i>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px"><i style="height:150px;border-radius:36px;background:${I}"></i><i style="height:150px;border-radius:36px;background:${L2}"></i></div>
    <i style="height:150px;border-radius:36px;background:${I}"></i></div>`),
  // 8: паперовий літачок у колі
  av(A, `<div style="width:720px;height:720px;border-radius:50%;background:${L2};display:grid;place-items:center">${plane(420, I)}</div>`),
];

// ---------- обкладинки Highlights ----------
const ICONS = {
  'Роботи': '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  'Ціни': '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  'Боти': '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M9 13v1M15 13v1"/><circle cx="12" cy="3" r="1"/>',
  'Процес': '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  'Відгуки': '<path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6.2A8 8 0 1 1 21 12Z"/>',
  'Контакт': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
};
const highlight = (svg) => page(1080, 1920, `
<div style="width:1080px;height:1920px;background:${BRAND.ink};display:grid;place-items:center">
  <div style="width:560px;height:560px;border-radius:50%;background:${BRAND.accent};display:grid;place-items:center">
    <svg width="280" height="280" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>
  </div>
</div>`);

// ---------- шаблон Stories ----------
const story = page(1080, 1920, `
<div class="f dark" style="padding:120px 84px">
  <span class="tag" style="color:#fff"><i></i>Нова робота</span>
  <h1 style="margin-top:40px;font-size:112px">Сайт для<br><span class="hl">барбершопу</span></h1>
  ${phone(shot('barber', 'phone'), '--pw:560px;left:260px;top:620px')}
  <div style="position:absolute;left:84px;right:84px;bottom:120px;background:${BRAND.accent2};color:${BRAND.ink};
    border-radius:999px;padding:34px;text-align:center;font-size:38px;font-weight:800">Хочу такий → пишіть «САЙТ»</div>
</div>`);

// ---------- збірка ----------
const JOBS = [
  ['01-intro', intro, 1080, 1350],
  ...CASES.slice(0, 1).map(c => [`02-case-${c.site}`, caseSlide(c), 1080, 1350]),
  ...carousel.map((h, i) => [`03-carousel-instagram-vs-site-${i + 1}`, h, 1080, 1350]),
  ...CASES.slice(1, 2).map(c => [`04-case-${c.site}`, caseSlide(c), 1080, 1350]),
  ['05-prices', prices, 1080, 1350],
  ...CASES.slice(2, 3).map(c => [`06-case-${c.site}`, caseSlide(c), 1080, 1350]),
  ['07-process', process, 1080, 1350],
  ...CASES.slice(3, 4).map(c => [`08-case-${c.site}`, caseSlide(c), 1080, 1350]),
  ['09-portfolio-1-collage', more, 1080, 1350],
  ...CASES.slice(4, 7).map((c, i) => [`09-portfolio-${i + 2}-${c.site}`, caseSlide(c, i < 2), 1080, 1350]),
  ...CASES.slice(7).map(c => [`10-case-${c.site}`, caseSlide(c), 1080, 1350]),
  ...AVATARS.map((h, i) => [`profile-avatar-${i + 1}`, h, 1080, 1080]),
  ...Object.entries(ICONS).map(([n, s], i) => [`highlight-${i + 1}-${n}`, highlight(s), 1080, 1920]),
  ['story-template', story, 1080, 1920],
];

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });
  const browser = await chromium.launch();
  for (const [name, html, w, h] of JOBS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const file = path.join(BUILD, name + '.html');
    fs.writeFileSync(file, html);
    await p.goto('file://' + file, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, name + '.png') });
    await ctx.close();
    console.log('✓', name);
  }
  await browser.close();
  fs.rmSync(BUILD, { recursive: true, force: true });
})();
