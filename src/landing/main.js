/* Лендинг /about: рассказывает про все разделы и фичи. Разметка строится здесь, анимации запускаются,
   когда блок попадает в экран (IntersectionObserver), и останавливаются вне экрана. */
import "../styles.css";
import "./landing.css";
import "../shared/flags.js";
import { LANDING } from "./i18n.js";
import { pathFor, parsePath, settingsHTML } from "../shared/site.js";
import { mountMedal } from "../shared/medal3d.js";
import { mountGlobe } from "./globe.js";
import { THEMES } from "../shared/themes.js";
import { COUNTRIES } from "../data.js";
import { NAMES_BY_ISO } from "../i18n.js";
import { POPULATION } from "../population.js";
import { SUBREGIONS } from "../subregions.js";

const { lang: LANG } = parsePath();
const T = LANDING[LANG];
const LOCALE = { ru: "ru-RU", en: "en-US", sr: "sr-Latn-RS" }[LANG];
document.documentElement.lang = LANG === "sr" ? "sr-Latn" : LANG;
if (!document.querySelector('link[rel="canonical"]')) document.title = `${T.brand} · ${T.nav.play}`;

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const aboutPath = (l) => `${pathFor(l, "countries").replace(/\/$/, "")}/about`;

/* ── Данные стран на нужном языке ── */
const isoOf = (flag) => [...flag].map((ch) => String.fromCharCode(ch.codePointAt(0) - 0x1f1e6 + 65)).join("");
const BY_ISO = new Map(COUNTRIES.map((c) => [isoOf(c.flag), c]));
const countryName = (iso) => (LANG === "ru" ? BY_ISO.get(iso)?.name : NAMES_BY_ISO.get(iso)?.[LANG]?.name) || iso;
const capitalOf = (iso) => (LANG === "ru" ? BY_ISO.get(iso)?.capitals?.[0] : NAMES_BY_ISO.get(iso)?.[LANG]?.capitals?.[0]) || "";
const flagOf = (iso) => BY_ISO.get(iso)?.flag || "";
const subregion = (id) => Object.values(SUBREGIONS).flat().find((g) => g.id === id);

const fmtPop = (n) => {
  const nf = (v, d) => new Intl.NumberFormat(LOCALE, { maximumFractionDigits: d }).format(v);
  return n >= 1e9 ? `${nf(n / 1e9, 2)} ${T.modes.units.b}` : `${nf(n / 1e6, n >= 1e8 ? 0 : 1)} ${T.modes.units.m}`;
};
const POP_R0 = Math.log10(1.1);
const POP_R1 = Math.log10(3);
const popPoints = (g, a) => {
  const r = Math.abs(Math.log10(g / a));
  return Math.round(Math.max(0, Math.min(1, 1 - (r - POP_R0) / (POP_R1 - POP_R0))) * 100);
};
const popTier = (p) => (p >= 100 ? "exact" : p >= 85 ? "close" : p >= 65 ? "near" : p >= 40 ? "ok" : p > 0 ? "far" : "miss");

/* ── Разметка ── */
// ISO-коды и числовые коды world-atlas для стран, которые загораются на глобусе
const GLOBE = [["FR", 250], ["BR", 76], ["JP", 392], ["EG", 818], ["CA", 124], ["AU", 36], ["IN", 356], ["MX", 484], ["KE", 404], ["NO", 578], ["AR", 32], ["TH", 764], ["RS", 688], ["ZA", 710], ["MN", 496], ["PE", 604], ["IS", 352], ["VN", 704], ["MA", 504], ["TR", 792], ["NZ", 554], ["KZ", 398], ["US", 840], ["ET", 231], ["IT", 380], ["CN", 156]];
const FLAG_ISOS = ["JP", "BR", "CH", "KZ", "NP", "CA", "KR", "ZA", "SE", "BT"];
const CAPITAL_PAIRS = [["AU", 0], ["BF", 1], ["KZ", 0], ["MM", 1], ["CA", 0], ["NG", 1], ["TR", 0], ["BO", 1]];
const POP_DEMO = [["BR", 200e6], ["JP", 140e6], ["NG", 120e6], ["DE", 81e6]];
const SUBS = ["eu-nordic", "eu-balkans", "eu-baltic", "as-central", "sa-cone"];
const RADAR = { countries: 96, flags: 82, population: 71, states: 100, russia: 64 };
const AXIS_ICON = { countries: "🌍", flags: "🚩", population: "👥", states: "🗽", russia: "🇷🇺" };
const ACHV_DEMO = [
  { e: "🌍", ru: "Весь мир", en: "Whole world", sr: "Ceo svet" },
  { e: "⚡", ru: "Скорострел", en: "Rapid fire", sr: "Brzometni" },
  { e: "🤝", ru: "Братушки", en: "Brothers", sr: "Braća" },
  { e: "🔬", ru: "Под микроскопом", en: "Under the microscope", sr: "Pod mikroskopom" },
  { e: "☯️", ru: "38-я параллель", en: "38th parallel", sr: "38. paralela" },
  { e: "🧭", ru: "Все -станы", en: "All the -stans", sr: "Svi -stani" },
  { e: "🦞", ru: "Новая Англия", en: "New England", sr: "Nova Engleska" },
  { e: "🐯", ru: "Дальний Восток", en: "Far East", sr: "Daleki istok" },
  { e: "🏰", ru: "Вся Европа", en: "All of Europe", sr: "Cela Evropa" },
  { e: "🎯", ru: "Без промаха", en: "Flawless", sr: "Bez promašaja" },
  { e: "🦁", ru: "Вся Африка", en: "All of Africa", sr: "Cela Afrika" },
  { e: "🐉", ru: "Вся Азия", en: "All of Asia", sr: "Cela Azija" },
  { e: "🔒", secret: true },
  { e: "🔒", secret: true },
];
// демо-таблица: кириллические имена только на русской версии
const LB_PLAYERS = [[LANG === "ru" ? "Марко" : "Marko", 196, "🥇"], ["Aleksa", 191, "🥇"], [LANG === "ru" ? "Дина" : "Dina", 183, "🥇"], ["Tomás", 168, "🥈"], [LANG === "ru" ? "Лёва" : "Lyova", 152, "🥈"], ["Nina", 131, "🥉"]];


const app = document.getElementById("app");
app.innerHTML = `
<header class="ld-nav" data-nav>
  <div class="ld-nav__pill">
    <a class="ld-brand" href="${pathFor(LANG, "countries")}"><span class="ld-brand__globe" aria-hidden="true">🌍</span><span class="ld-brand__name">${esc(T.brand)}</span></a>
    <nav class="ld-nav__links" aria-label="${esc(T.brand)}">
      <i class="ld-nav__ind" aria-hidden="true"></i>
      <a href="#modes" data-to="modes">${T.nav.modes}</a><a href="#maps" data-to="maps">${T.nav.maps}</a><a href="#medals" data-to="medals">${T.nav.medals}</a><a href="#profile" data-to="profile">${T.nav.profile}</a>
    </nav>
    ${settingsHTML({ lang: LANG, langHref: aboutPath, cls: "ld-settings" })}
  </div>
</header>

<main>
  <section class="ld-hero">
    <div class="ld-hero__blobs" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="ld-hero__stage" style="--len:${T.hero.a.length}">
      <h1 class="ld-hero__title ld-rise" style="--i:0">${T.hero.a}</h1>
      <div class="ld-globe ld-rise" style="--i:1" data-globe aria-hidden="true"></div>
      <p class="ld-hero__line ld-rise" style="--i:2">${T.hero.line}</p>
    </div>
  </section>

  <div class="ld-marquee" aria-hidden="true"><div class="ld-marquee__track">${[0, 1].map(() => `<span>${COUNTRIES.map((c) => c.flag).join(" ")}</span>`).join("")}</div></div>

  <section class="ld-section" id="modes">
    <div class="ld-wrap">
      <h2 class="ld-h2 ld-reveal">${T.modes.title}</h2>
      <div class="ld-bento">
        <article class="ld-cell ld-cell--countries ld-reveal" data-anim="subs">
          <h3>🌍 ${T.modes.countries[0]}</h3>
          <p>${T.modes.countries[1]}</p>
          <div class="ld-subs">${SUBS.map((id) => {
            const g = subregion(id);
            return `<div class="ld-sub"><div class="ld-sub__top"><span>${esc(g.name[LANG])}</span><b class="tnum" data-sub-count>0/${g.isos.length}</b></div>
              <div class="ld-sub__flags">${g.isos.map((iso) => `<span class="ld-flag" title="${esc(countryName(iso))}">${flagOf(iso)}</span>`).join("")}</div></div>`;
          }).join("")}</div>
        </article>
        <article class="ld-cell ld-cell--flags ld-reveal" style="--d:1" data-anim="flags">
          <h3>🚩 ${T.modes.flags[0]}</h3>
          <p>${T.modes.flags[1]}</p>
          <div class="ld-flagshow"><div class="ld-flagshow__flag" data-flag>${flagOf(FLAG_ISOS[0])}</div><div class="ld-flagshow__name" data-flag-name>${esc(countryName(FLAG_ISOS[0]))}</div></div>
        </article>
        <article class="ld-cell ld-cell--capitals ld-reveal" data-anim="capitals">
          <h3>🏛️ ${T.modes.capitals[0]}</h3>
          <p>${T.modes.capitals[1]}</p>
          <div class="ld-cap" data-cap></div>
        </article>
        <article class="ld-cell ld-cell--pop ld-reveal" style="--d:1" data-anim="pop">
          <h3>👥 ${T.modes.population[0]}</h3>
          <p>${T.modes.population[1]}</p>
          <div class="ld-pop">
            <div class="ld-pop__country"><span class="ld-pop__flag" data-pop-flag></span><span data-pop-name></span></div>
            <div class="ld-pop__scale"><i class="ld-pop__zone"></i><i class="ld-pop__real"></i><i class="ld-pop__guess" data-pop-guess></i></div>
            <div class="ld-pop__row">
              <span>${T.modes.guess} <b data-pop-g></b></span>
              <span class="ld-pop__verdict" data-pop-verdict></span>
              <span>${T.modes.real} <b data-pop-a></b></span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="ld-section ld-maps" id="maps" data-maps>
    <div class="ld-wrap">
      <div class="ld-center">
        <h2 class="ld-h2 ld-reveal">${T.maps.title}</h2>
        <p class="ld-lead ld-reveal" style="--d:1">${T.maps.sub}</p>
      </div>
      <div class="ld-maps__grid">
        <figure class="ld-map ld-map--us ld-reveal" data-map="us">
          <svg viewBox="-10 0 995 620" role="img" aria-label="${esc(T.maps.us)}"></svg>
          <figcaption><span class="ld-map__title">🗽 ${T.maps.us}</span><span class="ld-map__hover" data-map-hover>${T.maps.hint}</span><b class="tnum" data-map-count>0 / 50</b></figcaption>
        </figure>
        <figure class="ld-map ld-map--ru ld-reveal" style="--d:1" data-map="ru">
          <svg viewBox="0 0 1000 600" role="img" aria-label="${esc(T.maps.ru)}"></svg>
          <figcaption><span class="ld-map__title">🇷🇺 ${T.maps.ru}</span><span class="ld-map__hover" data-map-hover>${T.maps.hint}</span><b class="tnum" data-map-count>0 / 85</b></figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="ld-section ld-medals" id="medals" data-medals>
    <div class="ld-wrap ld-center">
      <h2 class="ld-h2 ld-reveal">${T.medals.title}</h2>
      <p class="ld-lead ld-reveal" style="--d:1">${T.medals.sub}</p>
      <div class="ld-podium">
        ${[["bronze", 120], ["gold", 180], ["silver", 150]].map(([tier, n], i) => `
          <div class="ld-podium__slot ld-podium__slot--${tier}" style="--i:${[1, 0, 2][i]}">
            <div class="ld-podium__medal" data-medal="${tier}"><img src="/medals/${tier}.webp" alt="" /></div>
            <div class="ld-podium__name">${T.medals.tiers[tier]}</div>
            <div class="ld-podium__goal">${T.medals.goal(n)}</div>
          </div>`).join("")}
      </div>
      <p class="ld-note ld-reveal">${T.medals.note}</p>
    </div>
  </section>

  <section class="ld-section" id="profile">
    <div class="ld-wrap ld-split">
      <div class="ld-radar-card ld-reveal" data-radar>${radarSVG()}</div>
      <div class="ld-split__copy">
        <h2 class="ld-h2 ld-reveal">${T.profile.title}</h2>
        <p class="ld-lead ld-reveal" style="--d:1">${T.profile.sub}</p>
      </div>
    </div>
  </section>

  <section class="ld-section ld-achv" data-achv>
    <div class="ld-wrap ld-achv__grid">
      <div class="ld-achv__big ld-reveal"><b class="tnum" data-achv-count>78</b><span>${T.achv.title}</span><p>${T.achv.sub}</p></div>
      <div class="ld-achv__cloud">${ACHV_DEMO.map((a, i) => `<span class="ld-chip${a.secret ? " ld-chip--secret" : ""}" style="--i:${i};--r:${((i * 37) % 9) - 4}deg"><span class="ld-chip__e">${a.e}</span>${esc(a.secret ? T.achv.secret : a[LANG])}</span>`).join("")}</div>
    </div>
  </section>

  <section class="ld-section">
    <div class="ld-wrap ld-compete">
      <article class="ld-card ld-lb ld-reveal" data-lb>
        <h3>🏅 ${T.compete.lbTitle}</h3>
        <p>${T.compete.lbSub}</p>
        <div class="ld-lb__tabs">${T.compete.tabs.map((t, i) => `<span${i === 0 ? ' class="is-on"' : ""}>${t}</span>`).join("")}</div>
        <ol class="ld-lb__rows" data-lb-rows></ol>
      </article>
      <div class="ld-compete__side">
        <article class="ld-card ld-streak ld-reveal" style="--d:1" data-streak>
          <div class="ld-streak__top"><span class="ld-streak__fire" aria-hidden="true">🔥</span><b class="tnum" data-streak-n>0</b><span>${T.compete.streakDays}</span></div>
          <h3>${T.compete.streakTitle}</h3>
          <div class="ld-week">${T.compete.week.map((d, i) => `<span style="--i:${i}"><i></i>${d}</span>`).join("")}</div>
        </article>
        <article class="ld-card ld-tg ld-reveal" style="--d:2">
          <h3><span class="ld-tg__icon" aria-hidden="true">✈️</span>${T.compete.tgTitle}</h3>
          <p>${T.compete.tgSub}</p>
        </article>
      </div>
    </div>
  </section>

  <section class="ld-section ld-themes" data-themes>
    <div class="ld-wrap ld-center">
      <h2 class="ld-h2 ld-reveal">${T.themes.title}</h2>
      <p class="ld-lead ld-reveal" style="--d:1">${T.themes.sub}</p>
      <div class="ld-themes__row">${THEMES.map((th, i) => `
        <button class="ld-theme" type="button" data-theme-id="${th.id}" aria-pressed="false" style="--i:${i};--r:${(i - 2) * 5}deg">
          <span class="ld-theme__sw" style="background:${th.swatch[0]}"><i style="background:${th.swatch[1]}"></i><i style="background:${th.swatch[2]}"></i><i style="background:${th.swatch[1]}"></i></span>
          <b>${th.icon} ${esc(th.name[LANG])}</b>
          <small>${th.need ? `🎁 ${T.themes.need(th.need)}` : T.themes.free}</small>
        </button>`).join("")}</div>
    </div>
  </section>

  <section class="ld-section ld-final">
    <div class="ld-wrap ld-center">
      <div class="ld-final__globe ld-reveal" aria-hidden="true">🌍</div>
      <h2 class="ld-h2 ld-h2--xl ld-reveal">${T.final.title}</h2>
      <p class="ld-lead ld-reveal" style="--d:1">${T.final.sub}</p>
      <div class="ld-final__cta ld-reveal" style="--d:2">
        <a class="ld-btn ld-btn--ghost" href="${pathFor(LANG, "states")}">🗽 ${LANDING[LANG].maps.us}</a>
        <a class="ld-btn ld-btn--ghost" href="${pathFor(LANG, "russia")}">🇷🇺 ${LANDING[LANG].maps.ru}</a>
      </div>
    </div>
  </section>
</main>

<footer class="ld-footer">
  <div class="ld-wrap ld-footer__inner">
    <span>🌍 ${esc(T.brand)}</span>
    <a href="https://t.me/countriesquisbot" target="_blank" rel="noopener">${T.footer.bot}</a>
  </div>
</footer>

<div class="ld-play"><a class="ld-btn ld-btn--primary ld-play__btn" href="${pathFor(LANG, "countries")}">${T.nav.play}</a></div>`;

function radarSVG() {
  const ids = Object.keys(RADAR);
  const cx = 200, cy = 190, R = 130;
  const pt = (i, r) => [cx + Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / ids.length) * r, cy + Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / ids.length) * r];
  const ring = (f) => ids.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(",")).join(" ");
  const shape = ids.map((id, i) => pt(i, (R * RADAR[id]) / 100).map((v) => v.toFixed(1)).join(",")).join(" ");
  return `<svg class="ld-radar" viewBox="-40 0 480 390" role="img" aria-label="${esc(T.profile.title)}">
    ${[0.25, 0.5, 0.75, 1].map((f) => `<polygon class="ld-radar__ring" points="${ring(f)}"/>`).join("")}
    ${ids.map((_, i) => { const [x, y] = pt(i, R); return `<line class="ld-radar__axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("")}
    <g class="ld-radar__shape" style="transform-origin:${cx}px ${cy}px">
      <polygon class="ld-radar__fill" points="${shape}"/>
      ${ids.map((id, i) => { const [x, y] = pt(i, (R * RADAR[id]) / 100); return `<circle class="ld-radar__dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/>`; }).join("")}
    </g>
    ${ids.map((id, i) => {
      const [x, y] = pt(i, R + 34);
      const anchor = Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end";
      const dy = y < cy - 60 ? -6 : y > cy + 40 ? 14 : 4;
      return `<text class="ld-radar__label" x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${AXIS_ICON[id]} ${esc(T.profile.axes[id])}</text>
        <text class="ld-radar__pct" x="${x.toFixed(1)}" y="${(y + dy + 18).toFixed(1)}" text-anchor="${anchor}" data-pct="${RADAR[id]}">${REDUCED ? RADAR[id] : 0}%</text>`;
    }).join("")}
  </svg>`;
}

/* ── Помощники анимаций ── */
/* Запускает loop, пока элемент на экране; loop получает функцию alive() и должен выходить, когда она false */
function whileVisible(el, loop, { once = false, threshold = 0.35 } = {}) {
  let visible = false;
  let running = false;
  const alive = () => visible;
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !running) {
        running = true;
        if (once) io.disconnect();
        Promise.resolve(loop(once ? () => true : alive)).finally(() => (running = false));
      }
    },
    { threshold },
  );
  io.observe(el);
}

function countUp(node, to, ms = 900, suffix = "") {
  if (REDUCED) return void (node.textContent = `${to}${suffix}`);
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / ms);
    node.textContent = `${Math.round(to * (1 - Math.pow(1 - p, 3)))}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* Появление блоков при прокрутке */
const revealIO = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in");
    revealIO.unobserve(e.target);
  }),
  { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
);
document.querySelectorAll(".ld-reveal, [data-achv], [data-themes], [data-medals], [data-streak], [data-radar]").forEach((el) => revealIO.observe(el));
requestAnimationFrame(() => document.body.classList.add("is-ready"));

/* ── 1. Глобус на первом экране и шапка ── */
mountGlobe(app.querySelector("[data-globe]"), {
  items: GLOBE.map(([iso, num]) => ({ iso, num, flag: flagOf(iso), name: countryName(iso) })),
  reduced: REDUCED,
});
{
  const nav = app.querySelector("[data-nav]");
  const links = [...nav.querySelectorAll("[data-to]")];
  const ind = nav.querySelector(".ld-nav__ind");
  const targets = links.map((a) => document.getElementById(a.dataset.to));
  // подсветка текущего раздела скользит за пунктами меню
  const mark = () => {
    let active = null;
    targets.forEach((sec, k) => {
      if (sec.getBoundingClientRect().top < window.innerHeight * 0.45) active = links[k];
    });
    if (app.querySelector(".ld-final").getBoundingClientRect().top < window.innerHeight * 0.45) active = null;
    links.forEach((a) => a.classList.toggle("is-on", a === active));
    if (!active) return void (ind.style.opacity = "0");
    ind.style.opacity = "1";
    ind.style.width = `${active.offsetWidth}px`;
    ind.style.transform = `translateX(${active.offsetLeft}px)`;
  };
  const io = new IntersectionObserver(mark, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
  app.querySelectorAll("main > section").forEach((sec) => io.observe(sec));
  window.addEventListener("resize", mark, { passive: true });
}

/* ── 2. Страны: подрегионы заполняются флагами ── */
{
  const cell = app.querySelector('[data-anim="subs"]');
  const rows = [...cell.querySelectorAll(".ld-sub")];
  const light = (row, k) => {
    const flags = row.querySelectorAll(".ld-flag");
    flags[k]?.classList.add("is-on");
    row.querySelector("[data-sub-count]").textContent = `${k + 1}/${flags.length}`;
    if (k + 1 === flags.length) row.classList.add("is-done");
  };
  if (REDUCED) rows.forEach((row) => row.querySelectorAll(".ld-flag").forEach((_, k) => light(row, k)));
  else
    whileVisible(cell, async () => {
      const queue = rows.flatMap((row) => [...row.querySelectorAll(".ld-flag")].map((_, k) => [row, k]));
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(((i * 7919) % 101) / 101 * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      // флаги внутри строки загораются по порядку, строки перемешаны
      const next = new Map(rows.map((r) => [r, 0]));
      for (const [row] of queue) {
        light(row, next.get(row));
        next.set(row, next.get(row) + 1);
        await sleep(90);
      }
    }, { once: true });
}

/* ── 3. Флаги: карточка переворачивается ── */
{
  const cell = app.querySelector('[data-anim="flags"]');
  const flag = cell.querySelector("[data-flag]");
  const name = cell.querySelector("[data-flag-name]");
  let i = 0;
  if (!REDUCED)
    whileVisible(cell, async (alive) => {
      while (alive()) {
        await sleep(1900);
        flag.classList.add("is-flip");
        name.classList.add("is-out");
        await sleep(260);
        i = (i + 1) % FLAG_ISOS.length;
        flag.textContent = flagOf(FLAG_ISOS[i]);
        name.textContent = countryName(FLAG_ISOS[i]);
        flag.classList.remove("is-flip");
        name.classList.remove("is-out");
      }
    });
}

/* ── 4. Столицы в обе стороны ── */
{
  const cell = app.querySelector('[data-anim="capitals"]');
  const box = cell.querySelector("[data-cap]");
  const card = ([iso, dir]) => {
    const country = `<span class="ld-cap__country">${flagOf(iso)} ${esc(countryName(iso))}</span>`;
    const capital = `<span class="ld-cap__capital">${esc(capitalOf(iso))}</span>`;
    return `<div class="ld-cap__q">${dir ? capital : country}</div><div class="ld-cap__arrow" aria-hidden="true">↓</div><div class="ld-cap__a">${dir ? country : capital}</div>`;
  };
  let i = 0;
  box.innerHTML = card(CAPITAL_PAIRS[0]);
  box.classList.add("is-answered");
  if (!REDUCED)
    whileVisible(cell, async (alive) => {
      while (alive()) {
        await sleep(2300);
        box.classList.add("is-out");
        await sleep(280);
        i = (i + 1) % CAPITAL_PAIRS.length;
        box.innerHTML = card(CAPITAL_PAIRS[i]);
        box.classList.remove("is-out", "is-answered");
        await sleep(700);
        box.classList.add("is-answered");
      }
    });
}

/* ── 5. Население: маркер ответа едет по шкале ── */
{
  const cell = app.querySelector('[data-anim="pop"]');
  const $ = (s) => cell.querySelector(s);
  // края шкалы — ошибка в 3 раза (0 очков), как в самой игре
  const pos = (g, a) => Math.max(2, Math.min(98, 50 + (Math.log(g / a) / Math.log(3)) * 50));
  const show = (k, guessed) => {
    const [iso, g] = POP_DEMO[k];
    const a = POPULATION[iso];
    $("[data-pop-flag]").textContent = flagOf(iso);
    $("[data-pop-name]").textContent = countryName(iso);
    $("[data-pop-a]").textContent = fmtPop(a);
    $("[data-pop-g]").textContent = guessed ? fmtPop(g) : "…";
    const guess = $("[data-pop-guess]");
    guess.style.left = `${guessed ? pos(g, a) : 2}%`;
    const pts = popPoints(g, a);
    const verdict = $("[data-pop-verdict]");
    verdict.textContent = guessed ? `${T.modes.tiers[popTier(pts)]} · +${pts}` : "";
    verdict.dataset.tier = popTier(pts);
    cell.classList.toggle("is-guessed", guessed);
  };
  show(0, true);
  if (!REDUCED)
    whileVisible(cell, async (alive) => {
      let k = 0;
      while (alive()) {
        show(k, false);
        await sleep(450);
        show(k, true);
        await sleep(2600);
        k = (k + 1) % POP_DEMO.length;
      }
    });
}

/* ── 6. Карты: заливаются по мере прокрутки ── */
{
  const section = app.querySelector("[data-maps]");
  const load = Promise.all([import("../mapgame/data/states-map.js"), import("../mapgame/data/russia-map.js"), import("../mapgame/data/states.js"), import("../mapgame/data/russia.js")]);
  const setup = async () => {
    const [usMap, ruMap, usItems, ruItems] = await load;
    const maps = [
      ["us", usMap, usItems, 50],
      ["ru", ruMap, ruItems, 85],
    ].map(([key, mapMod, itemsMod, total]) => {
      const fig = section.querySelector(`[data-map="${key}"]`);
      const svg = fig.querySelector("svg");
      const names = new Map(itemsMod.ITEMS.map((it) => [it.id, it.name[LANG] || it.name.ru]));
      const ids = Object.keys(mapMod.SHAPES).filter((id) => names.has(id));
      let seed = key === "us" ? 11 : 29;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const order = ids.map((id) => [id, rnd()]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
      svg.insertAdjacentHTML("beforeend", order.map((id) => `<path class="ld-map__region" data-id="${esc(id)}" d="${mapMod.SHAPES[id].d}"/>`).join("") + (mapMod.EXTRA || []).map((x) => `<path class="ld-map__region is-extra" d="${x.d}"/>`).join(""));
      const paths = [...svg.querySelectorAll(".ld-map__region:not(.is-extra)")];
      const hover = fig.querySelector("[data-map-hover]");
      svg.addEventListener("pointerover", (e) => {
        const id = e.target.closest?.(".ld-map__region")?.dataset.id;
        if (id) {
          hover.textContent = names.get(id);
          hover.classList.add("is-name");
        }
      });
      svg.addEventListener("pointerleave", () => {
        hover.textContent = T.maps.hint;
        hover.classList.remove("is-name");
      });
      return { paths, count: fig.querySelector("[data-map-count]"), total, shown: -1 };
    });
    const paint = (p) => {
      maps.forEach((m, k) => {
        const local = Math.max(0, Math.min(1, (p - k * 0.06) / 0.94));
        const n = Math.round(local * m.paths.length);
        if (n === m.shown) return;
        m.paths.forEach((el, i) => el.classList.toggle("is-on", i < n));
        m.count.textContent = `${Math.round((n / m.paths.length) * m.total)} / ${m.total}`;
        m.shown = n;
      });
    };
    if (REDUCED) return paint(1);
    // прогресс считается от положения блока, пока он на экране
    let raf = 0;
    let visible = false;
    const tick = () => {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      paint(Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (r.height * 0.75))));
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }).observe(section);
  };
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      setup();
    }
  }, { rootMargin: "600px 0px" }).observe(section);
}

/* ── 7. Медали: объёмные, падают на пьедестал и следят за курсором ── */
{
  const section = app.querySelector("[data-medals]");
  new IntersectionObserver((entries, io) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    section.querySelectorAll("[data-medal]").forEach((el) => mountMedal(el, el.dataset.medal));
  }, { rootMargin: "400px 0px" }).observe(section);
}

/* ── 8. Карта знаний: проценты считаются ── */
{
  const card = app.querySelector("[data-radar]");
  if (!REDUCED)
    whileVisible(card, async () => {
      await sleep(350);
      card.querySelectorAll("[data-pct]").forEach((n) => countUp(n, Number(n.dataset.pct), 1100, "%"));
    }, { once: true });
}

/* ── 9. Достижения ── */
{
  const block = app.querySelector("[data-achv]");
  whileVisible(block, async () => countUp(block.querySelector("[data-achv-count]"), 78, 1400), { once: true });
}

/* ── 10. Лидерборд: «Вы» поднимаетесь вверх ── */
{
  const card = app.querySelector("[data-lb]");
  const list = card.querySelector("[data-lb-rows]");
  const players = LB_PLAYERS.map(([name, score, medal]) => ({ name, score, medal, you: false }));
  const you = { name: T.compete.you, score: 104, medal: "", you: true };
  const all = [...players, you];
  list.innerHTML = all.map((p) => `<li class="ld-lb__row${p.you ? " is-you" : ""}"><span class="ld-lb__place tnum"></span><span class="ld-lb__name">${esc(p.name)}</span><span class="ld-lb__medal"></span><b class="ld-lb__score tnum"></b></li>`).join("");
  const rows = [...list.children];
  const layout = () => {
    const sorted = [...all].sort((a, b) => b.score - a.score);
    all.forEach((p, i) => {
      const row = rows[i];
      const place = sorted.indexOf(p);
      row.style.transform = `translateY(${place * 100}%)`;
      row.querySelector(".ld-lb__place").textContent = place + 1;
      row.querySelector(".ld-lb__score").textContent = p.score;
      row.querySelector(".ld-lb__medal").textContent = p.medal;
    });
  };
  const steps = [[104, ""], [139, "🥉"], [157, "🥈"], [176, "🥈"], [187, "🥇"]];
  const set = ([score, medal]) => {
    you.score = score;
    you.medal = medal;
    layout();
  };
  set(REDUCED ? steps.at(-1) : steps[0]);
  if (!REDUCED)
    whileVisible(card, async (alive) => {
      while (alive()) {
        for (const s of steps) {
          if (!alive()) break;
          set(s);
          await sleep(1100);
        }
        await sleep(1800);
        set(steps[0]);
        await sleep(900);
      }
    }, { threshold: 0.5 });
}

/* ── 11. Стрик ── */
{
  const card = app.querySelector("[data-streak]");
  whileVisible(card, async () => countUp(card.querySelector("[data-streak-n]"), 12, 1200), { once: true });
}

/* ── 12. Темы: нажмите, чтобы примерить (без сохранения) ── */
{
  const root = document.documentElement;
  const initial = { theme: root.dataset.theme, dark: "dark" in root.dataset };
  const buttons = [...app.querySelectorAll("[data-theme-id]")];
  const mark = (id) => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeId === id)));
  mark(initial.theme || "light");
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      const th = THEMES.find((x) => x.id === b.dataset.themeId);
      root.dataset.theme = th.id;
      if (th.dark) root.dataset.dark = "";
      else delete root.dataset.dark;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", th.swatch[0]);
      mark(th.id);
    }),
  );
}
