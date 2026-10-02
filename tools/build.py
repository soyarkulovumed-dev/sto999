"""Assemble the site's pages from src/.

    python tools/build.py

src/head.html, src/top.html and src/bottom.html are shared by every page;
src/pages/<name>.html holds each page's <main> content. Edit those, then rebuild.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
BASE = "https://soyarkulovumed-dev.github.io/sto999/"
VERSION = "20261002"  # bump to make returning visitors fetch new CSS/JS

PAGES = {
    "index": {
        "file": "index.html", "url": BASE, "solid": False, "preloader": True,
        "title": "АвтоСервис 999 — СТО в Душанбе: кузов, покраска, PDR, бронеплёнка, мойка",
        "og": "АвтоСервис 999 — всё для вашего авто в одном месте",
        "description": "АвтоСервис 999 (СТО999) в Душанбе: мойка, полировка, жестянка, PDR, покраска, механика и диагностика, бронеплёнка. Н. Карабаева, 43/3. Пн–Сб 08:00–19:00. +992 944 94 9999.",
    },
    "ppf": {
        "file": "ppf.html", "url": BASE + "ppf.html", "solid": True, "preloader": False,
        "title": "Бронеплёнка — АвтоСервис 999, Душанбе",
        "og": "Бронеплёнка в АвтоСервис 999: защита кузова и новый цвет",
        "description": "Оклейка бронеплёнкой в Душанбе: защита кузова и смена цвета без покраски, гарантия на плёнку 10 лет. Кейс Hennessey VelociRaptor и правила ухода.",
    },
    "works": {
        "file": "works.html", "url": BASE + "works.html", "solid": True, "preloader": False,
        "title": "Работы и кейсы — АвтоСервис 999, Душанбе",
        "og": "Работы АвтоСервис 999: кузовной ремонт и покраска",
        "description": "Кузовной ремонт и покраска Lexus RX: от повреждений до выдачи. Как работают мастера АвтоСервис 999 в Душанбе.",
    },
    "about": {
        "file": "about.html", "url": BASE + "about.html", "solid": True, "preloader": False,
        "title": "О нас — АвтоСервис 999, Душанбе",
        "og": "АвтоСервис 999: каждый знает своё дело",
        "description": "Почему АвтоСервис 999: свой мастер на каждое направление, всё в одном месте, мойка в подарок после ремонта, запчасти по VIN-коду.",
    },
}


def read(*parts):
    with open(os.path.join(SRC, *parts), encoding="utf-8") as f:
        return f.read()


def build():
    head, top, bottom = read("head.html"), read("top.html"), read("bottom.html")
    ld = read("ld-index.html")
    for key, p in PAGES.items():
        values = {
            "{{TITLE}}": p["title"], "{{DESCRIPTION}}": p["description"], "{{URL}}": p["url"], "{{OG_TITLE}}": p["og"],
            "{{HEAD_EXTRA}}": ld.strip() if key == "index" else "",
            "{{HEADER_CLASS}}": "header header--solid" if p["solid"] else "header",
            "{{LOGO_HREF}}": "#top" if key == "index" else "./",
        }
        page = (f'<!doctype html>\n<html lang="ru">\n<head>\n  {head.strip()}\n</head>\n'
                f'<body class="{"is-loading" if p["preloader"] else ""}" data-page="{key}">\n\n'
                f'{top.strip()}\n\n<main id="main">\n\n{read("pages", key + ".html").strip()}\n\n</main>\n\n'
                f'{bottom.strip()}\n</body>\n</html>\n')
        for k, v in values.items():
            page = page.replace(k, v)
        page = page.replace('class=""', "").replace("?v=20260928", f"?v={VERSION}")
        for asset in ('css/styles.css', 'js/i18n.js', 'js/main.js'):
            page = page.replace(f'"{asset}"', f'"{asset}?v={VERSION}"')
        assert "{{" not in page, f"unfilled placeholder in {key}"
        with open(os.path.join(ROOT, p["file"]), "w", encoding="utf-8", newline="\n") as f:
            f.write(page)
        print(f"{p['file']:<12} {len(page):>7} chars")

    urls = "".join(f"  <url>\n    <loc>{p['url']}</loc>\n  </url>\n" for p in PAGES.values())
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')


if __name__ == "__main__":
    build()
