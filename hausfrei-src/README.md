# HausFrei — сайт (джерело)

Сайт збирається з шаблонів командою:

```bash
pip install jinja2        # один раз
python3 build.py          # збирає готовий сайт у ../hausfrei/
python3 build.py --zip    # + архів для завантаження на хостинг у dist/
```

## Де що міняти

| Що | Файл |
|---|---|
| Телефони, WhatsApp, e-mail, адреса, години роботи, дані для Impressum, домен | `config.json` |
| Усі тексти сайту (німецька) | `i18n/de.json` |
| Тексти Impressum / Datenschutz | `templates/impressum.html`, `templates/datenschutz.html` |
| Дизайн | `assets/style.css` |
| Фото | `assets/img/` (назва-600.webp і назва-1200.webp) |

Усі значення в `[квадратних дужках]` у `config.json` треба замінити до запуску.

## Додати мову

1. Скопіювати `i18n/de.json` → `i18n/en.json` (або `tr.json`, `uk.json`) і перекласти тексти.
   Якщо якийсь рядок не перекладений, автоматично лишиться німецький.
2. У `config.json` → `"languages": ["de", "en"]`.
3. `python3 build.py`. Перемикач мов з'явиться сам, кожна мова в своїй папці (`/en/`, `/tr/`, `/uk/`).

## Запуск на хостингу (німецький хостер з PHP: IONOS, Strato, All-Inkl, Hetzner)

1. У `config.json`: реальні дані, `"domain"`, `"indexable": true`.
2. `python3 build.py --zip`.
3. Вміст архіву з `dist/` завантажити в корінь сайту (FTP / файловий менеджер хостера).
4. Перевірити: https працює, форма надсилає лист (`kontakt.php` використовує PHP `mail()` хостера), Impressum і Datenschutz заповнені.
5. Оформити AVV (Auftragsverarbeitungsvertrag) в акаунті хостера.

## Що вже зроблено для німецьких вимог

- Шрифти й фото лежать на сайті: жодних запитів до Google чи Unsplash, тож cookie-банер не потрібен.
- Немає cookies, аналітики й reCAPTCHA. Спам відсікають приховане поле-пастка і перевірка часу заповнення форми.
- Є Impressum (§ 5 DDG) і Datenschutzerklärung (шаблон: перед запуском перевірити, наприклад, через eRecht24 або юриста).
- `.htaccess`: примусовий https, кешування, заголовки безпеки.
