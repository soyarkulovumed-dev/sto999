"""Assemble the site's pages from src/.

    python tools/build.py

src/head.html, src/top.html and src/bottom.html are shared by every page;
src/pages/<name>.html holds each page's <main> content. The header menu, the
full (burger) menu and the footer navigation are generated from NAV below.
Edit those sources, then rebuild.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
BASE = "https://soyarkulovumed-dev.github.io/sto999/"
VERSION = "20261007"  # bump to make returning visitors fetch new CSS/JS

# key, link, Russian title, icon, Russian description, shown in the header bar
NAV = [
    ("index", "./", "Главная", "i-home", "Видео и главное о нас", False),
    ("about", "about.html", "О нас", "i-info", "Почему мы и кафе 999", True),
    ("services", "services.html", "Услуги", "i-nut", "7 направлений и что в них входит", True),
    ("works", "works.html", "Работы", "i-film", "Как работают мастера и этапы ремонта", True),
    ("cases", "cases.html", "Кейсы", "i-case", "Lexus RX и Hennessey VelociRaptor", True),
    ("ppf", "ppf.html", "Бронеплёнка", "i-ppf", "Защита кузова и смена цвета", True),
    ("team", "team.html", "Команда", "i-team", "Кто отвечает за каждое направление", False),
    ("faq", "faq.html", "Вопросы", "i-question", "Ответы на частые вопросы", False),
    ("contacts", "contacts.html", "Контакты", "i-pin", "Адрес, телефоны и запись", True),
]

PAGES = {
    "index": ("index.html", "АвтоСервис 999 — СТО в Душанбе: кузов, покраска, PDR, бронеплёнка, мойка",
              "АвтоСервис 999 — всё для вашего авто в одном месте",
              "АвтоСервис 999 (СТО999) в Душанбе: мойка, полировка, жестянка, PDR, покраска, механика и диагностика, бронеплёнка. Н. Карабаева, 43/3. Пн–Сб 08:00–19:00. +992 944 94 9999."),
    "services": ("services.html", "Услуги — АвтоСервис 999, Душанбе", "Услуги АвтоСервис 999",
                 "Мойка, полировка, жестянка, PDR, покраска, механика и диагностика, бронеплёнка в Душанбе. Стоимость — после осмотра."),
    "ppf": ("ppf.html", "Бронеплёнка — АвтоСервис 999, Душанбе", "Бронеплёнка в АвтоСервис 999: защита кузова и новый цвет",
            "Оклейка бронеплёнкой в Душанбе: защита кузова и смена цвета без покраски, гарантия на плёнку 10 лет. Правила ухода."),
    "cases": ("cases.html", "Кейсы — АвтоСервис 999, Душанбе", "Кейсы АвтоСервис 999: было — стало",
              "Hennessey VelociRaptor в чёрной бронеплёнке и кузовной ремонт Lexus RX: фото до и после, видео работы."),
    "works": ("works.html", "Работы — АвтоСервис 999, Душанбе", "Как работают мастера АвтоСервис 999",
              "Видео работы мастеров: жестянка, PDR, электромобили. Этапы ремонта от заявки до чистой машины."),
    "team": ("team.html", "Команда — АвтоСервис 999, Душанбе", "Команда АвтоСервис 999",
             "Мастера АвтоСервис 999: кузовщик, маляр, PDR, детейлер, механик, автоэлектрик, мойщик. Когда к кому обращаться."),
    "about": ("about.html", "О нас — АвтоСервис 999, Душанбе", "АвтоСервис 999: каждый знает своё дело",
              "Почему АвтоСервис 999: свой мастер на каждое направление, всё в одном месте, мойка в подарок после ремонта, кафе 999."),
    "faq": ("faq.html", "Вопросы — АвтоСервис 999, Душанбе", "Частые вопросы об АвтоСервис 999",
            "Сколько стоит ремонт, сколько длится, гарантия на бронеплёнку, электромобили, запчасти по VIN."),
    "contacts": ("contacts.html", "Контакты — АвтоСервис 999, Душанбе", "Контакты АвтоСервис 999",
                 "Душанбе, ул. Н. Карабаева, 43/3. Пн–Сб 08:00–19:00. +992 944 94 9999, WhatsApp, Telegram. Запись на осмотр."),
}


def read(*parts):
    with open(os.path.join(SRC, *parts), encoding="utf-8") as f:
        return f.read()


def ic(name):
    return f'<svg class="ic"><use href="#{name}"/></svg>'


def header_nav():
    links = "".join(f'      <a href="{href}" data-nav="{key}" data-i18n="nav.{key}">{title}</a>\n'
                    for key, href, title, _, _, inline in NAV if inline)
    return f'<nav class="nav" aria-label="Основное меню">\n{links}    </nav>'


def full_menu():
    items = "".join(
        f'      <a href="{href}" data-nav="{key}"><span class="mmenu__ic">{ic(icon)}</span>'
        f'<span class="mmenu__txt"><b data-i18n="nav.{"home" if key == "index" else key}">{title}</b><small data-i18n="menu.{key}.d">{desc}</small></span>'
        f'<i class="mmenu__n">{n:02d}</i></a>\n'
        for n, (key, href, title, icon, desc, _) in enumerate(NAV))
    return f'''<div class="mmenu" id="mobile-menu" hidden>
  <div class="mmenu__inner container">
    <nav class="mmenu__nav" aria-label="Все разделы">
{items}    </nav>
    <aside class="mmenu__side">
      <div class="lang lang--lg" role="group" aria-label="Язык / Забон / Language">
        <button type="button" data-lang="ru" aria-pressed="true">RU</button>
        <button type="button" data-lang="tj" aria-pressed="false">TJ</button>
        <button type="button" data-lang="en" aria-pressed="false">EN</button>
      </div>
      <a class="mmenu__phone" href="tel:+992944949999">+992 944 94 9999</a>
      <a class="mmenu__phone" href="tel:+992446109999">+992 44 610 9999</a>
      <p class="mmenu__addr" data-i18n="contact.addressShort">Душанбе, ул. Н. Карабаева, 43/3</p>
      <div class="mmenu__social">
        <a href="https://www.instagram.com/autoservice999.tj/" target="_blank" rel="noopener" aria-label="Instagram">{ic("i-ig")}</a>
        <a class="js-wa" href="https://wa.me/992944949999" target="_blank" rel="noopener" aria-label="WhatsApp">{ic("i-wa")}</a>
        <a href="https://t.me/+992944949999" target="_blank" rel="noopener" aria-label="Telegram">{ic("i-tg")}</a>
      </div>
      <a class="btn btn--red btn--lg js-wa" href="https://wa.me/992944949999" target="_blank" rel="noopener">{ic("i-wa")}<span data-i18n="cta.waBook">Записаться в WhatsApp</span></a>
    </aside>
  </div>
</div>'''


def footer_nav():
    items = "".join(f'        <li><a href="{href}" data-nav="{key}">{ic(icon)}<span data-i18n="nav.{key}">{title}</span></a></li>\n'
                    for key, href, title, icon, _, _ in NAV if key != "index")
    return f'<ul class="footer__links footer__links--icons footer__links--cols">\n{items}      </ul>'


def build():
    head, top, bottom = read("head.html"), read("top.html"), read("bottom.html")
    ld = read("ld-index.html")
    shared = {"{{NAV}}": header_nav(), "{{MENU}}": full_menu(), "{{FOOTER_NAV}}": footer_nav()}
    for key, (file, title, og, description) in PAGES.items():
        url = BASE if key == "index" else BASE + file
        values = {
            **shared,
            "{{TITLE}}": title, "{{DESCRIPTION}}": description, "{{URL}}": url, "{{OG_TITLE}}": og,
            "{{HEAD_EXTRA}}": ld.strip() if key == "index" else "",
            "{{HEADER_CLASS}}": "header" if key == "index" else "header header--solid",
            "{{LOGO_HREF}}": "#top" if key == "index" else "./",
        }
        body_cls = ' class="is-loading"' if key == "index" else ""
        page = (f'<!doctype html>\n<html lang="ru">\n<head>\n  {head.strip()}\n</head>\n'
                f'<body{body_cls} data-page="{key}">\n\n'
                f'{top.strip()}\n\n<main id="main">\n\n{read("pages", file).strip()}\n\n</main>\n\n'
                f'{bottom.strip()}\n</body>\n</html>\n')
        for k, v in values.items():
            page = page.replace(k, v)
        for asset in ("css/styles.css", "js/i18n.js", "js/main.js"):
            page = page.replace(f'"{asset}?v=20260928"', f'"{asset}"').replace(f'"{asset}"', f'"{asset}?v={VERSION}"')
        assert "{{" not in page, f"unfilled placeholder in {key}"
        with open(os.path.join(ROOT, file), "w", encoding="utf-8", newline="\n") as f:
            f.write(page)
        print(f"{file:<14} {len(page):>7} chars")

    urls = "".join(f"  <url>\n    <loc>{BASE if k == 'index' else BASE + p[0]}</loc>\n  </url>\n" for k, p in PAGES.items())
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')


if __name__ == "__main__":
    build()
