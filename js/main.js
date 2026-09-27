/* ==========================================================
   АвтоСервис 999 — main.js
   ========================================================== */
(() => {
  "use strict";

  const WA_NUMBER = "992944949999";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const body = document.body;
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
    document.documentElement.lang = HTML_LANG[lang];
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
    updateWaLinks();
    updateStatus();
    burger && burger.setAttribute("aria-label", menu.hidden ? ui().menuOpen : ui().menuClose);
    store.set("sto999-lang", lang);
  }

  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  /* ---------------- WhatsApp links ---------------- */
  const waUrl = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  function updateWaLinks() {
    $$(".js-wa").forEach((a) => { a.href = waUrl(ui().waHello); });
  }

  /* ---------------- preloader ---------------- */
  let loaded = false;
  function finishLoading() {
    if (loaded) return;
    loaded = true;
    body.classList.remove("is-loading");
    setTimeout(() => body.classList.add("is-ready"), 40);
  }
  const minShow = reduceMotion ? 0 : 1100;
  const start = performance.now();
  window.addEventListener("load", () => setTimeout(finishLoading, Math.max(0, minShow - (performance.now() - start))));
  setTimeout(finishLoading, 2600); // never block the page on slow assets

  /* ---------------- header ---------------- */
  const header = $(".header");
  const hero = $(".hero");
  const mbar = $(".mbar");
  const fab = $(".fab");
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 20);
    const goingDown = y > lastY && y > 500;
    header.classList.toggle("is-hidden", goingDown && menu.hidden && !drawer.classList.contains("is-open"));
    lastY = y;
    const pastHero = y > hero.offsetHeight * 0.6;
    mbar.classList.toggle("is-visible", pastHero);
    fab.classList.toggle("is-visible", pastHero);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // active nav link
  const navLinks = $$(".nav a");
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => { const s = $(a.getAttribute("href")); s && sectionObs.observe(s); });

  /* ---------------- mobile menu ---------------- */
  const burger = $(".burger");
  const menu = $("#mobile-menu");

  function setMenu(open) {
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
  // stagger siblings
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

  // process line
  const steps = $(".steps");
  new IntersectionObserver((entries, o) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      steps.style.setProperty("--progress", "100%");
      o.disconnect();
    });
  }, { threshold: 0.3 }).observe(steps);

  /* ---------------- counters ---------------- */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countObs.unobserve(e.target);
      const el = e.target;
      const to = +el.dataset.to;
      if (reduceMotion) { el.textContent = to; return; }
      const dur = 1400;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
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
          const x = (e.clientX - r.left - r.width / 2) * 0.22;
          const y = (e.clientY - r.top - r.height / 2) * 0.3;
          el.style.transform = `translate(${x}px, ${y}px)`;
        });
        el.addEventListener("pointerleave", () => { el.style.transform = ""; });
      });
    }
  }

  /* ---------------- hero video ----------------
     Laptop/desktop: three vertical reels side by side (one craft each).
     Phone: a single full-screen montage. Only the needed files are downloaded. */
  const pauseBtn = $(".hero__pause");
  const wide = window.matchMedia("(min-width: 901px)");
  let heroVideos = [];
  let heroPaused = reduceMotion;
  let heroVisible = true;

  function startVideo(v) {
    if (!v.src) {
      if (v.dataset.poster) v.poster = v.dataset.poster;
      v.src = v.dataset.src;
      v.addEventListener("loadeddata", () => v.classList.add("is-ready"), { once: true });
      v.addEventListener("error", () => v.classList.remove("is-ready"), { once: true });
    }
    if (!heroPaused && heroVisible) v.play().catch(() => {});
  }
  function pickHeroSet() {
    const next = wide.matches ? $$(".hero__reel video") : [$(".hero__solo")];
    heroVideos.filter((v) => !next.includes(v)).forEach((v) => v.pause());
    heroVideos = next;
    heroVideos.forEach(startVideo);
  }
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
  // pause when the hero is off-screen (saves battery and data)
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    heroVideos.forEach((v) => (heroVisible && !heroPaused ? v.play().catch(() => {}) : v.pause()));
  }).observe(hero);
  wide.addEventListener("change", pickHeroSet);
  pickHeroSet();
  setPauseIcon();

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
        // keep the photo in the empty middle of the row, clear of the craft name
        preview.style.left = `${Math.min(Math.max(e.clientX + 320, window.innerWidth * 0.58), window.innerWidth - 170)}px`;
        preview.style.top = `${e.clientY}px`;
      });
    });
  }

  /* ---------------- service drawer ---------------- */
  const drawer = $(".drawer");
  const dPanel = $(".drawer__panel", drawer);
  let lastFocus = null;

  function openDrawer(card) {
    lastFocus = card;
    const title = $(".svc__title", card).textContent.trim();
    $(".drawer__n", drawer).textContent = $(".svc__n", card).textContent;
    $(".drawer__ic use", drawer).setAttribute("href", $(".svc__ic use", card).getAttribute("href"));
    $(".drawer__title", drawer).textContent = title;
    $(".drawer__body", drawer).innerHTML = $(".svc__detail", card).innerHTML;
    const cardImg = $(".svc__media img", card);
    const dMedia = $(".drawer__media", drawer);
    dMedia.innerHTML = "";
    if (cardImg) {
      const img = document.createElement("img");
      img.src = cardImg.currentSrc || cardImg.src;
      img.alt = cardImg.alt;
      dMedia.appendChild(img);
    }
    $(".drawer__cta", drawer).href = waUrl(ui().waService(title));

    drawer.hidden = false;
    body.classList.add("is-locked");
    requestAnimationFrame(() => {
      drawer.classList.add("is-open");
      $(".drawer__close", drawer).focus({ preventScroll: true });
    });
  }
  function closeDrawer() {
    drawer.classList.remove("is-open");
    body.classList.remove("is-locked");
    setTimeout(() => { if (!drawer.classList.contains("is-open")) drawer.hidden = true; }, 550);
    lastFocus && lastFocus.focus({ preventScroll: true });
  }

  $$(".svc").forEach((card) => {
    card.addEventListener("click", () => openDrawer(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDrawer(card); }
    });
  });
  $$("[data-close]", drawer).forEach((el) => el.addEventListener("click", closeDrawer));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer.classList.contains("is-open")) closeDrawer();
      else if (!menu.hidden) setMenu(false);
    }
    // keep focus inside the open drawer
    if (e.key === "Tab" && drawer.classList.contains("is-open")) {
      const f = $$("a[href], button:not([disabled])", dPanel);
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

  /* ---------------- booking form -> WhatsApp ---------------- */
  const form = $(".booking");
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
      L.head,
      `${L.name}: ${name}`,
      `${L.phone}: ${phone}`,
      f.car.value.trim() && `${L.car}: ${f.car.value.trim()}`,
      `${L.service}: ${service}`,
      f.msg.value.trim() && `${L.msg}: ${f.msg.value.trim()}`
    ].filter(Boolean);
    // a real link: works for every visitor, and stays visible in case the app didn't open
    const url = waUrl(lines.join("\n"));
    doneLink.href = url;
    $("span", doneLink).textContent = ui().openWa;
    $(".booking__ready", form).textContent = ui().ready;
    doneBox.hidden = false;
    doneLink.click();
  });

  /* ---------------- misc ---------------- */
  $$(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------------- init ---------------- */
  const saved = store.get("sto999-lang");
  const fromUrl = new URLSearchParams(location.search).get("lang");
  applyLang(fromUrl || saved || "ru");
  onScroll();
})();
