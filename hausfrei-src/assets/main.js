/* HausFrei – kleine Helfer. Seite funktioniert auch ohne JavaScript. */
(function () {
  document.documentElement.classList.add('js');

  // Einblend-Animation beim Scrollen
  var els = document.querySelectorAll('.r');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // Sprachmenü schließen bei Klick außerhalb
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.lang[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });

  // Nummern-Menü: Escape schließt
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSheet();
  });
  var sheet = document.getElementById('anrufen');
  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('open');
    if (location.hash === '#anrufen') location.hash = ''; // nur falls per Link geöffnet
  }
  document.querySelectorAll('a[href="#anrufen"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); sheet.classList.add('open'); var f = sheet.querySelector('.sheet-num'); if (f) f.focus(); });
  });
  document.querySelectorAll('.sheet-bg, .sheet-close').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); closeSheet(); });
  });

  // Kontaktformular per fetch senden (Fallback: normales POST an kontakt.php)
  var form = document.querySelector('form.form');
  if (!form) return;
  var t0 = Date.now(), el = form.querySelector('[name=el]');
  form.addEventListener('submit', function (e) {
    var ok = form.querySelector('.msg.ok'), err = form.querySelector('.msg.err'), btn = form.querySelector('button[type=submit]');
    ok.hidden = true; err.hidden = true;
    var bad = false;
    ['name', 'phone'].forEach(function (n) {
      var f = form.querySelector('[name=' + n + ']');
      var invalid = !f.value.trim();
      f.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      if (invalid && !bad) { f.focus(); bad = true; }
    });
    var em = form.querySelector('[name=email]');
    if (em.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) { em.setAttribute('aria-invalid', 'true'); if (!bad) em.focus(); bad = true; } else em.removeAttribute('aria-invalid');
    if (bad) { e.preventDefault(); return; }
    if (el) el.value = String(Date.now() - t0);
    if (!window.fetch || !window.FormData) return; // normales Absenden
    e.preventDefault();
    var label = btn.textContent; btn.disabled = true; btn.textContent = btn.getAttribute('data-sending');
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (j) { if (j && j.ok) { ok.hidden = false; form.reset(); t0 = Date.now(); } else { err.hidden = false; } })
      .catch(function () { err.hidden = false; })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();
