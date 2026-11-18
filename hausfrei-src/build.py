#!/usr/bin/env python3
"""
HausFrei – Website-Generator.

    python3 build.py            # baut die Website nach ../hausfrei/
    python3 build.py --zip      # zusätzlich ZIP zum Hochladen beim Hoster (dist/)

Inhalte:   i18n/<sprache>.json  (Texte je Sprache, de = Hauptsprache)
Kontakte:  config.json          (Telefonnummern, Adresse, Impressum-Daten …)
Neue Sprache: i18n/de.json kopieren -> i18n/en.json übersetzen -> "en" in config.json "languages" eintragen.
"""
import datetime as dt
import json
import shutil
import sys
import zipfile
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

SRC = Path(__file__).resolve().parent
OUT = SRC.parent / "hausfrei"
DIST = SRC / "dist"
KEEP_IN_OUT = {"kalkulation.html"}          # Demo-Dateien, die nicht zum Kunden-Upload gehören
LANG_NAMES = {"de": "Deutsch", "en": "English", "tr": "Türkçe", "uk": "Українська"}


def deep_merge(base, over):
    """Fehlende Übersetzungen fallen auf Deutsch zurück."""
    if isinstance(base, dict) and isinstance(over, dict):
        out = dict(base)
        for k, v in over.items():
            out[k] = deep_merge(base.get(k), v) if k in base else v
        return out
    return over if over is not None else base


def main():
    c = json.loads((SRC / "config.json").read_text(encoding="utf-8"))
    default = c["default_language"]
    base_t = json.loads((SRC / "i18n" / f"{default}.json").read_text(encoding="utf-8"))
    langs = c["languages"]
    now = dt.datetime.now()
    version = now.strftime("%Y%m%d%H%M")
    domain = c["domain"].rstrip("/")

    env = Environment(loader=FileSystemLoader(SRC / "templates"), autoescape=True,
                      undefined=StrictUndefined, trim_blocks=True, lstrip_blocks=True)
    env_raw = Environment(loader=FileSystemLoader(SRC / "templates"), autoescape=False, undefined=StrictUndefined)
    env_raw.filters["phpstr"] = lambda v: "'" + str(v).replace("\\", "\\\\").replace("'", "\\'") + "'"

    # Ausgabeordner leeren (außer Demo-Dateien)
    OUT.mkdir(exist_ok=True)
    for p in OUT.iterdir():
        if p.name in KEEP_IN_OUT:
            continue
        shutil.rmtree(p) if p.is_dir() else p.unlink()
    shutil.copytree(SRC / "assets", OUT / "assets")

    def lang_dir(code):
        return "" if code == default else f"{code}/"

    def lang_links(root):
        return [{"code": l, "name": LANG_NAMES.get(l, l),
                 "rel": (root + lang_dir(l)) or "./",
                 "abs": f"{domain}/{lang_dir(l)}"} for l in langs]

    texts = {}
    for l in langs:
        f = SRC / "i18n" / f"{l}.json"
        texts[l] = deep_merge(base_t, json.loads(f.read_text(encoding="utf-8"))) if l != default else base_t

    common = dict(c=c, version=version, year=now.year)

    # Startseite je Sprache
    for l in langs:
        root = "" if l == default else "../"
        schema = {
            "@context": "https://schema.org", "@type": "LocalBusiness",
            "name": c["company"], "url": f"{domain}/{lang_dir(l)}",
            "image": f"{domain}/assets/img/haus-1200.webp",
            "telephone": c["phones"][0]["tel"], "email": c["email"],
            "contactPoint": [{"@type": "ContactPoint", "telephone": p["tel"], "name": p["label"], "contactType": "customer service"} for p in c["phones"]],
            "address": {"@type": "PostalAddress", "streetAddress": c["address"]["street"], "postalCode": c["address"]["zip"],
                        "addressLocality": c["address"]["city"], "addressCountry": c["address"]["country"]},
            "areaServed": texts[l]["area"]["cities"], "openingHours": c["opening_hours_schema"],
            "description": texts[l]["meta"]["description"],
        }
        html = env.get_template("index.html").render(
            **common, t=texts[l], lang=l, root=root, home="./", langs=lang_links(root), indexable_page=True,
            canonical=f"{domain}/{lang_dir(l)}", schema=json.dumps(schema, ensure_ascii=False))
        d = OUT / lang_dir(l)
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(html, encoding="utf-8")

    # Rechtstexte + Danke-Seite (deutsch, im Hauptverzeichnis)
    for page, indexable in (("impressum.html", True), ("datenschutz.html", True), ("danke.html", False)):
        html = env.get_template(page).render(
            **common, t=base_t, lang=default, root="", home="./", langs=lang_links(""), indexable_page=indexable,
            canonical=f"{domain}/{page}", schema="")
        (OUT / page).write_text(html, encoding="utf-8")

    # Formular-Versand (PHP)
    (OUT / "kontakt.php").write_text(env_raw.get_template("kontakt.php").render(c=c), encoding="utf-8")

    # robots.txt / sitemap.xml
    if c["indexable"]:
        (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /kontakt.php\nDisallow: /danke.html\n\nSitemap: {domain}/sitemap.xml\n", encoding="utf-8")
        urls = [f"{domain}/{lang_dir(l)}" for l in langs] + [f"{domain}/impressum.html", f"{domain}/datenschutz.html"]
        sm = "".join(f"  <url><loc>{u}</loc><lastmod>{now:%Y-%m-%d}</lastmod></url>\n" for u in urls)
        (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{sm}</urlset>\n', encoding="utf-8")
    else:
        (OUT / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")

    # Apache-Einstellungen (IONOS/Strato/All-Inkl): HTTPS erzwingen, Caching, Sicherheits-Header
    (OUT / ".htaccess").write_text((SRC / "templates" / "htaccess.txt").read_text(encoding="utf-8"), encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")

    print(f"✓ Website gebaut: {OUT}  (Sprachen: {', '.join(langs)}, Version {version})")

    if "--zip" in sys.argv:
        DIST.mkdir(exist_ok=True)
        z = DIST / f"hausfrei-website-{now:%Y-%m-%d}.zip"
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in sorted(OUT.rglob("*")):
                rel = p.relative_to(OUT)
                if p.is_file() and rel.name not in KEEP_IN_OUT and rel.name != ".nojekyll":
                    zf.write(p, rel.as_posix())
        print(f"✓ ZIP für den Hoster: {z}")


if __name__ == "__main__":
    main()
