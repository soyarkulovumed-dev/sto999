/* ==========================================================
   АвтоСервис 999 — main.js (shared by every page)
   ========================================================== */
(() => {
  "use strict";

  const WA_NUMBER = "992944949999";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const body = document.body;
  const root = document.documentElement;
  const page = body.dataset.page || "index";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------------- i18n ---------------- */
  const HTML_LANG = { ru: "ru", tj: "tg", en: "en" };
  const dict = { ru: {}, ...window.I18N };
  let lang = "ru";

  // Russian comes straight from the markup
  $$("[data-i18n]").forEach((el) => {
    const k = el.dataset.i18n;
    if (!(k in dict.ru)) dict.ru[k] = el.innerHTML.trim();
  });
  $$("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attr, k] = pair.split(":").map((s) => s.trim());
      if (!(k in dict.ru)) dict.ru[k] = el.getAttribute(attr) || "";
    });
  });

  const t = (k) => (dict[lang] && dict[lang][k] != null ? dict[lang][k] : dict.ru[k]);
  const ui = () => window.I18N_UI[lang] || window.I18N_UI.ru;

  function applyLang(next) {
    lang = dict[next] ? next : "ru";
    root.lang = HTML_LANG[lang];
    $$("[data-i18n]").forEach((el) => {
      const v = t(el.dataset.i18n);
      if (v != null && el.innerHTML !== v) el.innerHTML = v;
    });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, k] = pair.split(":").map((s) => s.trim());
        const v = t(k);
        if (v != null) el.setAttribute(attr, v);
      });
    });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    markSto(body);
    updateWaLinks();
    updateStatus();
    syncThemeUi();
    burger.setAttribute("aria-label", menu.hidden ? ui().menuOpen : ui().menuClose);
    store.set("sto999-lang", lang);
  }
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  /* "СТО" is an abbreviation; marked so nobody reads it as the number «сто» */
  function markSto(scope) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (/СТО/.test(n.nodeValue) && !n.parentElement.closest("script, style, abbr, title, option, textarea, .sprite")
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(СТО)/).forEach((part) => {
        if (part !== "СТО") { if (part) frag.appendChild(document.createTextNode(part)); return; }
        const ab = document.createElement("abbr");
        ab.className = "sto";
        ab.title = ui().stoTitle;
        ab.textContent = "СТО";
        frag.appendChild(ab);
      });
      node.replaceWith(frag);
    });
    $$("abbr.sto", scope).forEach((ab) => { ab.title = ui().stoTitle; });
  }

  /* ---------------- WhatsApp links ---------------- */
  const waUrl = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  function updateWaLinks() {
    $$(".js-wa").forEach((a) => { a.href = waUrl(ui().waHello); });
  }

  /* ---------------- preloader (home page only) ---------------- */
  let loaded = false;
  function finishLoading() {
    if (loaded) return;
    loaded = true;
    body.classList.remove("is-loading");
    setTimeout(() => body.classList.add("is-ready"), 40);
  }
  const minShow = body.classList.contains("is-loading") && !reduceMotion ? 1100 : 0;
  const start = performance.now();
  window.addEventListener("load", () => setTimeout(finishLoading, Math.max(0, minShow - (performance.now() - start))));
  setTimeout(finishLoading, minShow ? 2600 : 300); // never block the page on slow assets

  /* ---------------- header ---------------- */
  const header = $(".header");
  const solidHeader = header.classList.contains("header--solid");
  const hero = $(".hero");
  const mbar = $(".mbar");
  const fab = $(".fab");
  const modal = $(".modal");
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", solidHeader || y > 20);
    const goingDown = y > lastY && y > 500;
    header.classList.toggle("is-hidden", goingDown && menu.hidden && !modal.classList.contains("is-open"));
    lastY = y;
    const showBars = y > (hero ? hero.offsetHeight * 0.6 : 240);
    mbar.classList.toggle("is-visible", showBars);
    fab.classList.toggle("is-visible", showBars);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // current page in the menus; on the home page, the section on screen
  $$("[data-nav]").forEach((a) => {
    if (a.dataset.nav === page) { a.classList.add("is-active"); a.setAttribute("aria-current", "page"); }
  });
  if (page === "index") {
    const spyLinks = $$(".nav a").filter((a) => a.hash && document.getElementById(a.hash.slice(1)));
    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        spyLinks.forEach((a) => a.classList.toggle("is-active", a.hash === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spyLinks.forEach((a) => sectionObs.observe(document.getElementById(a.hash.slice(1))));
  }

  /* ---------------- mobile menu ---------------- */
  const burger = $(".burger");
  const menu = $("#mobile-menu");

  function setMenu(open) {
    header.classList.toggle("is-menu", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? ui().menuClose : ui().menuOpen);
    body.classList.toggle("is-locked", open);
    header.classList.remove("is-hidden");
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
    } else {
      menu.classList.remove("is-open");
      setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 400);
    }
  }
  burger.addEventListener("click", () => setMenu(menu.hidden));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------------- reveal on scroll ---------------- */
  const groups = new Map();
  $$(".reveal").forEach((el) => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    el.style.setProperty("--d", `${Math.min(i, 8) * 0.07}s`);
    groups.set(p, i + 1);
  });
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealObs.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".reveal, .reveal-title").forEach((el) => revealObs.observe(el));

  const steps = $(".steps");
  if (steps) {
    new IntersectionObserver((entries, o) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        steps.style.setProperty("--progress", "100%");
        o.disconnect();
      });
    }, { threshold: 0.3 }).observe(steps);
  }

  /* ---------------- counters ---------------- */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countObs.unobserve(e.target);
      const el = e.target;
      const to = +el.dataset.to;
      if (reduceMotion) { el.textContent = to; return; }
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1400);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = "0";
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$(".count").forEach((el) => countObs.observe(el));

  /* ---------------- cursor glow & magnetic buttons ---------------- */
  if (finePointer) {
    $$(".glow").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--x", `${e.clientX - r.left}px`);
        el.style.setProperty("--y", `${e.clientY - r.top}px`);
      });
    });
    if (!reduceMotion) {
      $$(".magnetic").forEach((el) => {
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
        });
        el.addEventListener("pointerleave", () => { el.style.transform = ""; });
      });
    }
  }

  /* ---------------- hero video (home page) ----------------
     Laptop/desktop: three vertical reels side by side. Phone: one montage.
     Only the needed files are downloaded. The footage is blurred in CSS. */
  if (hero) {
    const pauseBtn = $(".hero__pause");
    const wide = window.matchMedia("(min-width: 901px)");
    let heroVideos = [];
    let heroPaused = reduceMotion;
    let heroVisible = true;

    const startVideo = (v) => {
      if (!v.src) {
        if (v.dataset.poster) v.poster = v.dataset.poster;
        v.src = v.dataset.src;
        v.addEventListener("loadeddata", () => v.classList.add("is-ready"), { once: true });
        v.addEventListener("error", () => v.classList.remove("is-ready"), { once: true });
      }
      if (!heroPaused && heroVisible) v.play().catch(() => {});
    };
    const pickHeroSet = () => {
      const next = wide.matches ? $$(".hero__reel video") : [$(".hero__solo")];
      heroVideos.filter((v) => !next.includes(v)).forEach((v) => v.pause());
      heroVideos = next;
      heroVideos.forEach(startVideo);
    };
    const setPauseIcon = () => {
      $("use", pauseBtn).setAttribute("href", heroPaused ? "#i-play" : "#i-pause");
      pauseBtn.setAttribute("data-i18n-attr", heroPaused ? "aria-label:a11y.play" : "aria-label:a11y.pause");
      pauseBtn.setAttribute("aria-label", t(heroPaused ? "a11y.play" : "a11y.pause"));
    };
    pauseBtn.addEventListener("click", () => {
      heroPaused = !heroPaused;
      heroVideos.forEach((v) => (heroPaused ? v.pause() : v.play().catch(() => {})));
      setPauseIcon();
    });
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      heroVideos.forEach((v) => (heroVisible && !heroPaused ? v.play().catch(() => {}) : v.pause()));
    }).observe(hero);
    wide.addEventListener("change", pickHeroSet);
    pickHeroSet();
    setPauseIcon();
  }

  /* ---------------- case & reel videos: poster first, file only when near the screen ---------------- */
  const playObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target.querySelector("video");
      if (!v) return;
      if (e.isIntersecting && !reduceMotion) v.play().catch(() => {}); else v.pause();
    });
  }, { threshold: 0.35 });
  const loadObs = new IntersectionObserver((entries, o) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      o.unobserve(e.target);
      const box = e.target;
      const v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("aria-hidden", "true");
      if (box.dataset.poster) v.poster = box.dataset.poster;
      v.src = box.dataset.video;
      box.prepend(v);
      playObs.observe(box);
    });
  }, { rootMargin: "300px 0px" });
  $$("[data-video]").forEach((box) => {
    if (box.dataset.poster) box.style.backgroundImage = `url("${box.dataset.poster}")`;
    loadObs.observe(box);
  });

  /* ---------------- team: photo of each craft follows the cursor ---------------- */
  const preview = $(".role-preview");
  if (preview && finePointer) {
    const pImg = $("img", preview);
    $$(".role[data-img]").forEach((row) => {
      row.addEventListener("pointerenter", () => { pImg.src = row.dataset.img; preview.classList.add("is-on"); });
      row.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
      row.addEventListener("pointermove", (e) => {
        preview.style.left = `${Math.min(Math.max(e.clientX + 320, window.innerWidth * 0.58), window.innerWidth - 170)}px`;
        preview.style.top = `${e.clientY}px`;
      });
    });
  }

  /* ---------------- detail window: services and team ---------------- */
  const card = $(".modal__card", modal);
  const m = {
    media: $(".modal__media", modal), icon: $(".modal__ic use", modal), n: $(".modal__n", modal),
    kicker: $(".modal__kicker", modal), title: $(".modal__title", modal), body: $(".modal__body", modal),
    price: $(".modal__price", modal), cta: $(".modal__cta", modal), ctaText: $(".modal__cta-text", modal),
    link: $(".modal__link", modal), content: $(".modal__content", modal)
  };
  let lastFocus = null;

  function fill({ img, alt, icon, n, kicker, title, detail, price, ctaText, ctaUrl, link }) {
    m.media.innerHTML = "";
    if (img) {
      const el = document.createElement("img");
      el.src = img; el.alt = alt || "";
      m.media.appendChild(el);
    }
    m.icon.setAttribute("href", icon);
    m.n.textContent = n;
    m.kicker.textContent = kicker;
    m.title.textContent = title;
    m.body.innerHTML = detail;
    m.price.hidden = !price;
    m.ctaText.textContent = ctaText;
    m.cta.href = ctaUrl;
    m.link.hidden = !link;
    m.link.onclick = null;
    if (link) { $("span", m.link).textContent = link.label; m.link.onclick = link.open; }
    m.content.scrollTop = 0;
    card.scrollTop = 0;
  }

  function serviceData(svc) {
    const img = $(".svc__media img", svc);
    const title = $(".svc__title", svc).textContent.trim();
    return {
      img: img && (img.currentSrc || img.src), alt: img && img.alt, icon: $(".svc__ic use", svc).getAttribute("href"),
      n: $(".svc__n", svc).textContent, kicker: ui().svcKicker, title, detail: $(".svc__detail", svc).innerHTML,
      price: true, ctaText: ui().svcCta, ctaUrl: waUrl(ui().waService(title))
    };
  }
  function roleData(row) {
    const name = $(".role__name", row).textContent.trim();
    const svc = $(`.svc[data-svc="${row.dataset.svcLink}"]`);
    return {
      img: row.dataset.img, alt: name, icon: "#i-team", n: $(".role__n", row).textContent, kicker: ui().roleKicker,
      title: name, detail: $(".role__detail", row).innerHTML, price: false,
      ctaText: ui().roleCta, ctaUrl: waUrl(ui().waRole(name)),
      link: svc && { label: ui().aboutService($(".svc__title", svc).textContent.trim()), open: () => fill(serviceData(svc)) }
    };
  }

  function openModal(data, from) {
    lastFocus = from;
    fill(data);
    modal.hidden = false;
    body.classList.add("is-locked");
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      $(".modal__close", modal).focus({ preventScroll: true });
    });
  }
  function closeModal() {
    modal.classList.remove("is-open");
    body.classList.remove("is-locked");
    setTimeout(() => { if (!modal.classList.contains("is-open")) modal.hidden = true; }, 450);
    lastFocus && lastFocus.focus({ preventScroll: true });
  }
  const activate = (el, build) => {
    el.addEventListener("click", () => openModal(build(el), el));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(build(el), el); }
    });
  };
  $$(".svc").forEach((el) => activate(el, serviceData));
  $$(".role[data-svc-link]").forEach((el) => activate(el, roleData));
  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modal.classList.contains("is-open")) closeModal();
      else if (!menu.hidden) setMenu(false);
    }
    if (e.key === "Tab" && modal.classList.contains("is-open")) {
      const f = $$("a[href], button:not([disabled]):not([hidden])", card);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------- FAQ: one open at a time ---------------- */
  const qas = $$(".qa");
  qas.forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) qas.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ---------------- open / closed status (Asia/Dushanbe) ---------------- */
  function dushanbeNow() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dushanbe", weekday: "short", hour: "numeric", minute: "numeric", hour12: false
    }).formatToParts(new Date());
    const get = (type) => (parts.find((p) => p.type === type) || {}).value;
    return { day: get("weekday"), minutes: (+get("hour") % 24) * 60 + +get("minute") };
  }
  function updateStatus() {
    let open = false, sunday = false;
    try {
      const { day, minutes } = dushanbeNow();
      sunday = day === "Sun";
      open = !sunday && minutes >= 8 * 60 && minutes < 19 * 60;
    } catch (e) { return; }
    $$(".js-open-dot").forEach((d) => { d.classList.toggle("is-open", open); d.classList.toggle("is-closed", !open); });
    const txt = $(".js-status-text");
    if (txt) txt.textContent = open ? ui().open : sunday ? ui().closedSun : ui().closed;
  }
  setInterval(updateStatus, 60000);

  /* ---------------- booking form -> WhatsApp (home page) ---------------- */
  const form = $(".booking");
  if (form) {
    const err = $(".booking__err", form);
    const phoneInput = form.elements.phone;
    const doneBox = $(".booking__done", form);
    const doneLink = $("a", doneBox);

    phoneInput.addEventListener("focus", () => { if (!phoneInput.value) phoneInput.value = "+992 "; });
    phoneInput.addEventListener("blur", () => { if (phoneInput.value.trim() === "+992") phoneInput.value = ""; });
    phoneInput.addEventListener("input", () => { phoneInput.value = phoneInput.value.replace(/[^\d+\s()-]/g, ""); });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = form.elements;
      $$(".field", form).forEach((x) => x.classList.remove("is-invalid"));
      const name = f.name.value.trim();
      const phone = f.phone.value.trim();
      if (!name) { f.name.closest(".field").classList.add("is-invalid"); err.textContent = ui().errName; f.name.focus(); return; }
      if (phone.replace(/\D/g, "").length < 9) { f.phone.closest(".field").classList.add("is-invalid"); err.textContent = ui().errPhone; f.phone.focus(); return; }
      err.textContent = "";
      const L = ui().form;
      const service = f.service.options[f.service.selectedIndex].textContent.trim();
      const lines = [
        L.head, `${L.name}: ${name}`, `${L.phone}: ${phone}`,
        f.car.value.trim() && `${L.car}: ${f.car.value.trim()}`,
        `${L.service}: ${service}`,
        f.msg.value.trim() && `${L.msg}: ${f.msg.value.trim()}`
      ].filter(Boolean);
      // a real link: works for every visitor, and stays visible in case the app didn't open
      doneLink.href = waUrl(lines.join("\n"));
      $("span", doneLink).textContent = ui().openWa;
      $(".booking__ready", form).textContent = ui().ready;
      doneBox.hidden = false;
      doneLink.click();
    });
  }

  /* ---------------- light / dark theme ---------------- */
  const themeBtn = $(".theme-switch");
  const themeMeta = $('meta[name="theme-color"]');
  const isLight = () => root.getAttribute("data-site-theme") === "light";

  function syncThemeUi() {
    themeBtn.setAttribute("aria-pressed", String(isLight()));
    themeBtn.setAttribute("aria-label", isLight() ? ui().toDark : ui().toLight);
    if (themeMeta) themeMeta.content = isLight() ? "#EEEAE4" : "#0A0A0B";
  }
  themeBtn.addEventListener("click", () => {
    root.classList.add("theme-anim");
    if (isLight()) root.removeAttribute("data-site-theme"); else root.setAttribute("data-site-theme", "light");
    store.set("sto999-theme", isLight() ? "light" : "dark");
    syncThemeUi();
    setTimeout(() => root.classList.remove("theme-anim"), 450);
  });

  /* ---------------- scroll road: the car drives with the page ---------------- */
  const road = $(".road");
  if (road) {
    const car = $(".road__car", road);
    const rot = $(".road__rot", road);
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    let prevY = window.scrollY;
    let moveTimer = 0;
    let queued = false;

    const place = () => {
      queued = false;
      const max = maxScroll();
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      car.style.transform = `translateY(${(p * (road.clientHeight - car.offsetHeight)).toFixed(1)}px)`;
      road.style.setProperty("--p", `${(p * 100).toFixed(2)}%`);
    };
    const drive = () => {
      const y = window.scrollY;
      if (y !== prevY) {
        rot.classList.toggle("is-up", y < prevY); // nose points where the page is going
        prevY = y;
        car.classList.add("is-moving");
        clearTimeout(moveTimer);
        moveTimer = setTimeout(() => car.classList.remove("is-moving"), 260);
      }
      if (!queued) { queued = true; requestAnimationFrame(place); }
    };
    window.addEventListener("scroll", drive, { passive: true });
    window.addEventListener("resize", place);
    place();

    car.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      car.setPointerCapture(e.pointerId);
      road.classList.add("is-drag");
      const move = (ev) => {
        const r = road.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (ev.clientY - r.top - car.offsetHeight / 2) / (r.height - car.offsetHeight)));
        window.scrollTo({ top: p * maxScroll(), behavior: "instant" });
      };
      const stop = () => {
        road.classList.remove("is-drag");
        car.removeEventListener("pointermove", move);
      };
      car.addEventListener("pointermove", move);
      car.addEventListener("pointerup", stop, { once: true });
      car.addEventListener("pointercancel", stop, { once: true });
    });
  }

  /* ---------------- misc ---------------- */
  $$(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------------- init ---------------- */
  const fromUrl = new URLSearchParams(location.search).get("lang");
  applyLang(fromUrl || store.get("sto999-lang") || "ru");
  onScroll();
})();
