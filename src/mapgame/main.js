import "../shared/flags.js";
import "../styles.css";
import "./map.css";
import { promoHTML } from "../shared/ourgames.js";
import { parsePath, topbarHTML, SITE_TEXT, SECTIONS } from "../shared/site.js";
import { createStreak, pluralFor } from "../shared/streak.js";
import { createNotices } from "../shared/notices.js";
import { checkMedals } from "../shared/medals.js";
import { mountMedals, resultMedalHTML } from "../shared/medal3d.js";
import { createAccount } from "../account.js";
import { UI } from "../i18n.js";
import { MAP_UI, GAME_TEXT } from "./i18n.js";
import { buildIndex, lookupKeys, normalizeLoose } from "./names.js";
import { checkMapAchievements, mapAchievementText } from "./achievements.js";
import { ACHV_UI } from "../achievements.js";

/* Одна страница на все игры с картой: раздел берётся из адреса (/states, /en/russia, /rs/states) */
const LOADERS = {
  states: [() => import("./data/states.js"), () => import("./data/states-map.js")],
  russia: [() => import("./data/russia.js"), () => import("./data/russia-map.js")],
};

const { lang: LANG, section } = parsePath();
const GAME = Object.hasOwn(LOADERS, section) ? section : "states";
const T = MAP_UI[LANG];
const G = GAME_TEXT[LANG][GAME];
const TA = UI[LANG];
const TITLE = SITE_TEXT[LANG].names[GAME];
const plural = pluralFor(LANG);

document.documentElement.lang = LANG === "sr" ? "sr-Latn" : LANG;
// SEO-заголовок из сборки (scripts/seo.mjs) не перетираем; в dev ставим короткий
if (!document.querySelector('link[rel="canonical"]')) document.title = TITLE;
document.body.classList.add("page-map", `page-${GAME}`);
const icon = SECTIONS.find((s) => s.id === GAME)?.icon || "🗺️";
document.querySelector('link[rel="icon"]')?.setAttribute(
  "href",
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`)}`,
);

Promise.all(LOADERS[GAME].map((load) => load())).then(([data, geo]) => start(data, geo));

function start({ ITEMS, GROUPS, NOT_ITEMS = [] }, { SHAPES, EXTRA = [], CALLOUTS = [], CALLOUT_SIZE = [34, 20], MAX_ZOOM = 6 }) {
  /* ─────────────── константы и утилиты ─────────────── */

  const TOTAL = ITEMS.length;
  const MAX_TRIES = 3;
  const STATE_KEY = `map-game-${GAME}-v1`;
  const RECORD_KEY = "map-game-records-v1";
  const ACHV_KEY = "countries-game-achievements-v1";
  const BOARD = { type: `${GAME}-type`, map: `${GAME}-map` };
  const MODES = ["type", "map"];

  const byId = new Map(ITEMS.map((it) => [it.id, it]));
  const collator = new Intl.Collator(LANG === "sr" ? "sr-Latn" : LANG);
  const nameOf = (it) => it.name[LANG] || it.name.ru;
  const secondOf = (it) => {
    const s = LANG === "en" ? it.native || it.name.ru : it.native || it.name.en;
    return s && s !== nameOf(it) ? s : "";
  };
  const { index, notIndex, ambiguous } = buildIndex(ITEMS, NOT_ITEMS);

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const fmtTime = (s) => {
    const v = Math.max(0, s | 0);
    return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
  };
  const loadJSON = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  const saveJSON = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* приватный режим — играем без сохранения */
    }
  };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─────────────── состояние ─────────────── */

  const freshType = () => ({ guessed: [], elapsed: 0, started: false, done: false, gaveUp: false });
  const freshMap = () => ({ queue: shuffle(ITEMS.map((it) => it.id)), qi: 0, tries: 0, wrong: 0, results: {}, elapsed: 0, started: false, done: false });

  function loadState() {
    let s = loadJSON(STATE_KEY);
    if (!s && GAME === "states") s = loadJSON("us-states-state-v1"); // партия со старой страницы штатов
    const ok =
      s &&
      MODES.includes(s.mode) &&
      s.type &&
      Array.isArray(s.type.guessed) &&
      s.type.guessed.every((id) => byId.has(id)) &&
      s.map &&
      Array.isArray(s.map.queue) &&
      s.map.queue.length === TOTAL &&
      s.map.queue.every((id) => byId.has(id));
    return ok ? s : { mode: "type", type: freshType(), map: freshMap() };
  }

  let S = loadState();
  const records = loadJSON(RECORD_KEY) || {};
  if (GAME === "states" && !records["states-type"] && !records["states-map"]) {
    const old = loadJSON("us-states-records-v1");
    if (old?.type) records["states-type"] = old.type;
    if (old?.map) records["states-map"] = old.map;
  }
  let busy = false;
  let lastHit = null;
  let lastRecordBroken = false;
  let view = "game";

  const save = () => saveJSON(STATE_KEY, S);
  const game = () => S[S.mode];
  const mapCounts = () => {
    const r = Object.values(S.map.results);
    return { ok: r.filter((x) => x === "ok").length, late: r.filter((x) => x === "late").length, fail: r.filter((x) => x === "fail").length };
  };

  /* ─────────────── разметка ─────────────── */

  const [CW, CH] = CALLOUT_SIZE;
  const boxes = [...Object.values(SHAPES).map((s) => s.b), ...CALLOUTS.map(({ box: [x, y] }) => [x, y, x + CW, y + CH])];
  const PAD = 8;
  const base = { x: Math.min(...boxes.map((b) => b[0])) - PAD, y: Math.min(...boxes.map((b) => b[1])) - PAD };
  base.w = Math.max(...boxes.map((b) => b[2])) + PAD - base.x;
  base.h = Math.max(...boxes.map((b) => b[3])) + PAD - base.y;

  const silhouette = (id) => {
    const [x0, y0, x1, y1] = SHAPES[id].b;
    const pad = Math.max(x1 - x0, y1 - y0) * 0.04;
    return `<svg viewBox="${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}" aria-hidden="true"><use href="#s-${id}"/></svg>`;
  };

  const ICONS = {
    in: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
    out: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 8h10"/></svg>',
    reset: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>',
  };

  const mapSVG = `
    <svg class="map" id="map" viewBox="${base.x} ${base.y} ${base.w} ${base.h}" role="img" aria-label="${esc(TITLE)}">
      <defs>${Object.entries(SHAPES).map(([id, s]) => `<path id="s-${id}" d="${s.d}"/>`).join("")}</defs>
      <g>
        ${EXTRA.map((e) => `<path class="st st--extra ${e.cls || ""}" d="${e.d}"/>`).join("")}
        ${ITEMS.map((it) => `<use href="#s-${it.id}" class="st" data-id="${it.id}"/>`).join("")}
      </g>
      <g>
        ${CALLOUTS.map(({ id, box: [x, y], anchor: [ax, ay] }) => {
          const lx = ax < x ? x : x + CW;
          return `<path class="callout-line" d="M${lx} ${y + CH / 2} L${ax} ${ay}"/><rect class="callout" data-id="${id}" x="${x}" y="${y}" width="${CW}" height="${CH}" rx="${Math.min(6, CH / 3)}"/>`;
        }).join("")}
      </g>
    </svg>`;

  const rowHTML = (it) => {
    const label = nameOf(it);
    return `
    <div class="c" data-id="${esc(it.id)}">
      <span class="c__slot">
        <span class="c__flag">${silhouette(it.id)}</span>
        <span class="c__hint">${esc(label[0])}</span>
      </span>
      <span class="c__body">
        <span class="c__mask" style="width:${Math.min(170, Math.max(28, label.length * 8))}px"></span>
        <span class="c__name${label.length > 20 ? " c__name--long" : ""}">${esc(label)}</span>
      </span>
    </div>`;
  };

  const root = document.querySelector("#app");
  root.innerHTML = `
    <main class="app">
      <h1 class="sr-only">${esc(TITLE)}</h1>
      ${topbarHTML({ lang: LANG, section: GAME, leaderboardLabel: TA.account.leaderboard })}

      <section class="hero" aria-live="polite">
        <div class="score">
          <div class="score__line">
            <span class="score__count" id="count">0</span>
            <span class="score__total">/ ${TOTAL}</span>
          </div>
          <p class="score__caption" id="caption"></p>
        </div>
        <div class="stats" id="stats"></div>
        <div class="progress"><div class="progress__bar" id="bar"></div></div>
        <div class="controls">
          <nav class="segmented" id="segmented" role="tablist" aria-label="${esc(T.modesLabel)}">
            <span class="segmented__thumb" id="thumb"></span>
            ${MODES.map((m) => `<button class="segmented__item" role="tab" type="button" data-mode="${m}" aria-selected="false">${esc(T.modes[m])}</button>`).join("")}
          </nav>
          <button class="btn btn--quiet" id="reset" type="button"><span class="lg-only">${esc(T.restart)}</span><span class="sm-only">${esc(T.restartShort)}</span></button>
        </div>
      </section>

      <section class="leaders" id="leaders" hidden></section>

      <section class="entry" id="entry">
        <div class="field">
          <input class="field__input" id="answer" type="text" placeholder="${esc(G.placeholder)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" />
          <button class="field__clear" id="clear" type="button" aria-label="${esc(T.clear)}">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
          </button>
        </div>
        <div class="entry__actions">
          <button class="btn btn--danger" id="giveup" type="button">${esc(T.giveUp)}</button>
        </div>
      </section>

      <section class="prompt" id="prompt">
        <div class="prompt__main">
          <span class="prompt__label" id="prompt-label"></span>
          <span class="prompt__name" id="target"></span>
        </div>
        <div class="prompt__side">
          <span class="tries" id="tries"></span>
          <span class="pill tnum" id="qcount"></span>
          <button class="btn" id="skip" type="button">${esc(T.skip)}</button>
        </div>
      </section>

      <section class="result-card" id="result" hidden></section>

      <section class="map-card" id="map-card">
        ${mapSVG}
        <div class="zoom" id="zoom">
          <button class="zoom__btn" type="button" data-zoom="in" aria-label="${esc(T.zoomIn)}" title="${esc(T.zoomIn)}">${ICONS.in}</button>
          <button class="zoom__btn" type="button" data-zoom="out" aria-label="${esc(T.zoomOut)}" title="${esc(T.zoomOut)}">${ICONS.out}</button>
          <button class="zoom__btn" type="button" data-zoom="reset" aria-label="${esc(T.zoomReset)}" title="${esc(T.zoomReset)}" hidden>${ICONS.reset}</button>
        </div>
        <div class="tip" id="tip"></div>
        <div class="legend" id="legend"></div>
      </section>

      <section class="regions" id="regions">
        ${GROUPS.map((g) => {
          const list = ITEMS.filter((it) => it.group === g.id).sort((a, b) => collator.compare(nameOf(a), nameOf(b)));
          return `
          <article class="region" data-group="${esc(g.id)}">
            <div class="region__head">
              <h2 class="region__title">${esc(g.name[LANG] || g.name.ru)}</h2>
              <div class="region__meter"><i></i></div>
              <span class="region__count tnum">0 / ${list.length}</span>
            </div>
            <div class="region__grid">${list.map(rowHTML).join("")}</div>
          </article>`;
        }).join("")}
      </section>

      <div class="toast" id="toast" role="status" aria-live="polite">
        <span class="toast__icon"></span>
        <span class="toast__name"></span>
      </div>
      <div class="achv-layer" id="achv-layer" aria-live="assertive"></div>
    </main>`;

  const $ = (sel) => root.querySelector(sel);
  const ui = {
    streak: $("#streak"),
    count: $("#count"),
    caption: $("#caption"),
    stats: $("#stats"),
    bar: $("#bar"),
    segmented: $("#segmented"),
    thumb: $("#thumb"),
    reset: $("#reset"),
    leaders: $("#leaders"),
    entry: $("#entry"),
    input: $("#answer"),
    clear: $("#clear"),
    giveup: $("#giveup"),
    prompt: $("#prompt"),
    promptLabel: $("#prompt-label"),
    target: $("#target"),
    tries: $("#tries"),
    qcount: $("#qcount"),
    skip: $("#skip"),
    result: $("#result"),
    mapCard: $("#map-card"),
    map: $("#map"),
    zoomReset: $('[data-zoom="reset"]'),
    tip: $("#tip"),
    legend: $("#legend"),
    regions: $("#regions"),
    toast: $("#toast"),
    achvLayer: $("#achv-layer"),
  };

  const shapeEls = new Map();
  ui.map.querySelectorAll("[data-id]").forEach((node) => {
    const id = node.dataset.id;
    node.dataset.base = node.getAttribute("class");
    if (!shapeEls.has(id)) shapeEls.set(id, []);
    shapeEls.get(id).push(node);
  });
  const rowEls = new Map([...ui.regions.querySelectorAll(".c")].map((n) => [n.dataset.id, n]));

  /* ─────────────── общее для сайта: уведомления, стрик, аккаунт ─────────────── */

  const notices = createNotices(ui.achvLayer);
  const streak = createStreak({ node: ui.streak, t: TA.streak, lang: LANG });

  const bestFor = (mode) => {
    const r = records[BOARD[mode]];
    return r?.best > 0 ? { score: r.best, time: r.time ?? null } : null;
  };

  const account = createAccount({
    lang: LANG,
    t: TA.account,
    root,
    mount: root.querySelector("#account-slot"),
    onLeaders: () => setView("leaders"),
    notify: (card) => notices.push(card),
    bestScores: () => Object.fromEntries(MODES.map((m) => [BOARD[m], bestFor(m)]).filter(([, v]) => v)),
    localStreak: () => streak.list(),
    onStreak: (days) => streak.merge(days),
    localAchievements: () => loadJSON(ACHV_KEY) || {},
    onAchievements: (remote) => {
      const cur = loadJSON(ACHV_KEY) || {};
      let changed = false;
      Object.entries(remote).forEach(([k, v]) => {
        if (!cur[k]) {
          cur[k] = v;
          changed = true;
        }
      });
      if (changed) saveJSON(ACHV_KEY, cur);
    },
  });

  /* Достижения: общий ключ с «Странами», открытые уходят на сервер */
  function achieve(event, extra = {}) {
    const guessed = new Set(S.type.guessed);
    let firstRun = 0;
    for (let i = Math.min(S.map.qi, TOTAL - 1); i >= 0 && S.map.results[S.map.queue[i]] === "ok"; i -= 1) firstRun += 1;
    const ctx = {
      game: GAME,
      guessed,
      order: S.type.guessed,
      elapsed: S.type.elapsed,
      counts: mapCounts(),
      groups: GROUPS,
      groupDone: (id) => ITEMS.filter((it) => it.group === id).every((it) => guessed.has(it.id)),
      firstRun,
      records,
      ...extra,
    };
    const cur = loadJSON(ACHV_KEY) || {};
    const fresh = checkMapAchievements(event, ctx, cur);
    if (!fresh.length) return;
    saveJSON(ACHV_KEY, cur);
    fresh.forEach((a) => {
      const [title, desc] = mapAchievementText(a, LANG);
      notices.push({ notice: true, emoji: a.emoji, hue: a.hue, label: ACHV_UI[LANG].unlocked, title, desc });
    });
    account.syncAchievements(cur);
  }

  const freshMedals = new Set();
  const medalCheck = (silent = false) => {
    const fresh = checkMedals(Object.fromEntries(MODES.map((m) => [BOARD[m], bestFor(m) || { score: 0, time: null }])), {
      lang: LANG,
      silent,
      notify: (card) => notices.push(card),
    });
    if (!silent) fresh.forEach((f) => freshMedals.add(f.board));
  };

  function markPlayed() {
    const card = streak.mark();
    if (!card) return;
    notices.push(card);
    account.syncStreak(streak.list());
  }

  /* ─────────────── таймер ─────────────── */

  let timer = null;

  function syncTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
    const g = game();
    if (!g.started || g.done) return;
    timer = window.setInterval(() => {
      const cur = game();
      if (!cur.started || cur.done) return syncTimer();
      cur.elapsed += 1;
      const node = ui.stats.querySelector("#stat-timer .stat__value");
      if (node) node.textContent = fmtTime(cur.elapsed);
      if (cur.elapsed % 5 === 0) save();
    }, 1000);
  }

  function start() {
    const g = game();
    if (g.started) return;
    g.started = true;
    syncTimer();
  }

  /* ─────────────── рекорды ─────────────── */

  function commitRecord(mode, score, time) {
    const key = BOARD[mode];
    const prev = records[key] || {};
    const timed = mode === "map" || score === TOTAL;
    const better = prev.best == null || score > prev.best || (score === prev.best && timed && (prev.time == null || time < prev.time));
    if (better) {
      records[key] = { best: score, time: timed ? time : null };
      saveJSON(RECORD_KEY, records);
    }
    return better;
  }

  const recordText = (mode) => {
    const r = records[BOARD[mode]];
    if (!r || r.best == null) return "—";
    return r.time != null ? `${r.best} · ${fmtTime(r.time)}` : String(r.best);
  };

  const resultBest = () =>
    S.mode === "type"
      ? { score: S.type.guessed.length, time: S.type.guessed.length === TOTAL ? S.type.elapsed : null }
      : { score: mapCounts().ok, time: S.map.elapsed };

  /* ─────────────── рендер ─────────────── */

  const statHTML = (label, value, cls = "", id = "") =>
    `<div class="stat ${cls}"${id ? ` id="stat-${id}"` : ""}><span class="stat__label">${esc(label)}</span><span class="stat__value tnum">${esc(value)}</span></div>`;

  let lastCount = null;

  function renderHero() {
    const n = S.mode === "type" ? S.type.guessed.length : mapCounts().ok + mapCounts().late;
    ui.count.textContent = n;
    if (lastCount != null && n !== lastCount) {
      ui.count.classList.remove("is-bump");
      void ui.count.offsetWidth;
      ui.count.classList.add("is-bump");
      window.setTimeout(() => ui.count.classList.remove("is-bump"), 220);
    }
    lastCount = n;
    ui.caption.textContent = S.mode === "type" ? G.captionType : T.captionMap;
    ui.bar.style.width = `${((S.mode === "type" ? n : S.map.qi) / TOTAL) * 100}%`;
    ui.bar.classList.toggle("is-done", game().done);
    const g = game();
    const time = statHTML(T.time, fmtTime(g.elapsed), "stat--timer", "timer");
    const rec = statHTML(T.record, recordText(S.mode));
    ui.stats.innerHTML =
      S.mode === "type"
        ? statHTML(T.remaining, TOTAL - S.type.guessed.length) + rec + time
        : statHTML(T.remaining, TOTAL - S.map.qi) + statHTML(T.mistakes, S.map.wrong, S.map.wrong ? "stat--alert" : "") + rec + time;
  }

  function moveThumb() {
    const active = ui.segmented.querySelector(`[data-mode="${S.mode}"]`);
    if (!active) return;
    ui.thumb.style.width = `${active.offsetWidth}px`;
    ui.thumb.style.height = `${active.offsetHeight}px`;
    ui.thumb.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop - 3}px)`;
  }

  function renderSegmented() {
    ui.segmented.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(view === "game" && b.dataset.mode === S.mode)));
    ui.segmented.classList.toggle("is-muted", view !== "game");
    root.querySelector('[data-view="leaders"]')?.classList.toggle("is-active", view === "leaders");
    moveThumb();
  }

  function stateClass(id) {
    if (S.mode === "type") {
      if (S.type.guessed.includes(id)) return "is-on";
      return S.type.done ? "is-miss" : "";
    }
    const r = S.map.results[id];
    if (r) return `is-${r}`;
    return S.map.done ? "" : "is-open";
  }

  function paintMap() {
    shapeEls.forEach((nodes, id) => {
      const cls = stateClass(id);
      nodes.forEach((node) => node.setAttribute("class", `${node.dataset.base}${cls ? ` ${cls}` : ""}`));
    });
    ui.mapCard.classList.toggle("is-playing", S.mode === "map" && !S.map.done);
  }

  function animateShape(id, cls, ms) {
    (shapeEls.get(id) || []).forEach((node) => {
      node.classList.remove(cls);
      void node.getBoundingClientRect();
      node.classList.add(cls);
      window.setTimeout(() => node.classList.remove(cls), ms);
    });
  }

  function renderRows() {
    const guessed = new Set(S.type.guessed);
    rowEls.forEach((row, id) => {
      const on = guessed.has(id);
      const miss = !on && S.type.done;
      row.classList.toggle("is-on", on || miss);
      row.classList.toggle("is-miss", miss);
    });
    ui.regions.querySelectorAll(".region").forEach((reg) => {
      const rows = [...reg.querySelectorAll(".c")];
      const n = rows.filter((r) => guessed.has(r.dataset.id)).length;
      reg.querySelector(".region__meter i").style.width = `${(n / rows.length) * 100}%`;
      reg.querySelector(".region__count").textContent = `${n} / ${rows.length}`;
      reg.classList.toggle("is-complete", n === rows.length);
    });
  }

  function renderLegend() {
    const dot = (color, label) => `<span><i style="background:var(${color})"></i>${esc(label)}</span>`;
    if (S.mode === "type") {
      ui.legend.innerHTML = S.type.done ? dot("--st-on", T.legend.named) + dot("--st-miss", T.legend.missed) : "";
      return;
    }
    ui.legend.innerHTML = dot("--st-ok", T.legend.ok) + dot("--st-late", T.legend.late) + dot("--st-fail", T.legend.fail);
  }

  function renderPrompt(enter = false) {
    const g = S.map;
    if (g.done) return;
    const it = byId.get(g.queue[g.qi]);
    ui.promptLabel.innerHTML = lastHit ? `<span class="prompt__ok">✓ ${esc(nameOf(byId.get(lastHit)))}</span> · ${esc(T.findLabel)}` : esc(T.findLabel);
    ui.target.textContent = nameOf(it);
    ui.target.classList.remove("is-reveal");
    if (enter) {
      ui.target.classList.remove("is-enter");
      void ui.target.offsetWidth;
      ui.target.classList.add("is-enter");
    }
    ui.tries.innerHTML = Array.from({ length: MAX_TRIES }, (_, i) => `<i class="${i < g.tries ? "is-used" : ""}"></i>`).join("");
    ui.qcount.textContent = `${g.qi + 1} / ${TOTAL}`;
    ui.skip.disabled = busy;
  }

  function renderResult() {
    const g = game();
    if (!g.done || view !== "game") {
      ui.result.hidden = true;
      return;
    }
    const badge = lastRecordBroken ? `<span class="result__badge">${esc(T.newRecord)}</span>` : "";
    let title;
    let sub;
    let stats;
    if (S.mode === "type") {
      const n = S.type.guessed.length;
      const ratio = n / TOTAL;
      title = n === TOTAL ? G.allTitle(TOTAL) : T.namedOf(n, TOTAL);
      sub = n === TOTAL ? `${G.allSub} ${fmtTime(g.elapsed)}` : T.missedHint;
      stats =
        statHTML(T.statNamed, n) +
        statHTML(T.statMissed, TOTAL - n, TOTAL - n ? "stat--alert" : "") +
        statHTML(T.time, fmtTime(g.elapsed), "stat--timer") +
        statHTML(T.record, recordText("type"), "stat--good");
    } else {
      const c = mapCounts();
      const ratio = c.ok / TOTAL;
      title = c.ok === TOTAL ? T.perfect : ratio >= 0.8 ? T.great : ratio >= 0.5 ? T.good : T.grow;
      sub = T.mapSub(c.ok, TOTAL, plural(c.ok, G.forms));
      stats =
        statHTML(T.statOk, c.ok, "stat--good") +
        statHTML(T.statLate, c.late) +
        statHTML(T.statFail, c.fail, c.fail ? "stat--alert" : "") +
        statHTML(T.time, fmtTime(g.elapsed), "stat--timer") +
        statHTML(T.record, recordText("map"));
    }
    const best = resultBest();
    ui.result.innerHTML = `
      <div class="result view-enter">
        <h2 class="result__title">${esc(title)}</h2>
        ${badge}
        <p class="result__sub">${esc(sub)}</p>
        ${resultMedalHTML(BOARD[S.mode], bestFor(S.mode), LANG, freshMedals.has(BOARD[S.mode]))}
        <div class="result__row">${stats}</div>
        <button class="btn btn--primary btn--lg" type="button" data-again>${esc(T.playAgain)}</button>
        ${best.score > 0 ? account.resultHTML(best.score) : ""}
        ${promoHTML("countries", LANG)}
      </div>`;
    ui.result.hidden = false;
    mountMedals(ui.result);
    if (best.score > 0) account.hydrateResult(best, BOARD[S.mode]);
  }

  function leaderboardOpts() {
    return {
      boards: MODES.map((m) => ({
        id: BOARD[m],
        label: T.modes[m],
        sub: `${TITLE} · ${T.modes[m]}`,
        allLabel: m === "map" ? T.allFirstTry(TOTAL) : T.allNamedTier(TOTAL, plural(TOTAL, G.forms)),
      })),
      active: BOARD[S.mode],
    };
  }

  function renderView() {
    const leaders = view === "leaders";
    ui.leaders.hidden = !leaders;
    [ui.entry, ui.prompt, ui.result, ui.mapCard, ui.regions].forEach((n) => n.classList.toggle("is-view-hidden", leaders));
    if (leaders) account.renderLeaderboardInto(ui.leaders, leaderboardOpts());
    else ui.leaders.innerHTML = "";
  }

  function setView(v) {
    if (view === v) return;
    view = v;
    renderView();
    renderSegmented();
    renderResult();
    if (v !== "game") window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function renderAll() {
    const typeMode = S.mode === "type";
    const g = game();
    ui.entry.hidden = !typeMode || g.done;
    ui.prompt.hidden = typeMode || g.done;
    ui.regions.hidden = !typeMode;
    ui.input.value = "";
    ui.clear.classList.remove("is-visible");
    resetGiveUp();
    renderView();
    renderSegmented();
    streak.render(false);
    renderHero();
    renderResult();
    paintMap();
    renderLegend();
    renderRows();
    if (!typeMode) renderPrompt(true);
    hideTip();
    syncTimer();
  }

  /* ─────────────── тост и подсказка ─────────────── */

  let toastTimer = null;

  function toast(text, { id = null, note = false } = {}) {
    ui.toast.querySelector(".toast__icon").innerHTML = id ? silhouette(id) : note ? "ℹ️" : "";
    ui.toast.querySelector(".toast__name").textContent = text;
    ui.toast.classList.toggle("is-note", note);
    ui.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-visible"), note ? 2600 : 1400);
  }

  let tipTimer = null;

  function showTip(html, clientX, clientY, wrong = false) {
    const box = ui.mapCard.getBoundingClientRect();
    ui.tip.innerHTML = html;
    ui.tip.classList.toggle("is-wrong", wrong);
    ui.tip.style.left = `${Math.min(box.width - 70, Math.max(70, clientX - box.left))}px`;
    ui.tip.style.top = `${Math.max(34, clientY - box.top)}px`;
    ui.tip.classList.add("is-visible");
  }

  function hideTip() {
    window.clearTimeout(tipTimer);
    ui.tip.classList.remove("is-visible");
  }

  const tipName = (it) => `${esc(nameOf(it))}${secondOf(it) ? `<small>${esc(secondOf(it))}</small>` : ""}`;

  const revealed = (id) => (S.mode === "type" ? S.type.done || S.type.guessed.includes(id) : S.map.done || Boolean(S.map.results[id]));

  /* ─────────────── режим «Вписать все» ─────────────── */

  function shake() {
    ui.entry.classList.remove("is-shake");
    void ui.entry.offsetWidth;
    ui.entry.classList.add("is-shake");
    window.setTimeout(() => ui.entry.classList.remove("is-shake"), 340);
  }

  const clearInput = () => {
    ui.input.value = "";
    ui.clear.classList.remove("is-visible");
  };

  const findItem = (value) => {
    for (const k of keysOf(value)) {
      const it = index.get(k);
      if (it) return { it, k };
    }
    return null;
  };

  const findNot = (value) => {
    for (const k of keysOf(value)) {
      const n = notIndex.get(k);
      if (n) return n;
    }
    return null;
  };

  /* Хвост названия: «Московская» уже засчитана, а человек допечатывает « область» — глотаем продолжение,
     пока набранное целиком совпадает с началом полного названия этого региона. Сравниваем без схлопывания
     двойных букв, иначе «…област» + «Т» из «Татарстана» выглядело бы продолжением. Если начали печатать
     другое, лишнее возвращается в поле. */
  let tail = null;
  const keysOf = (value) => lookupKeys(value, LANG === "sr");
  const looseKeysOf = (value) => lookupKeys(value, LANG === "sr", normalizeLoose);
  const itemKeys = (it) => [it.name.ru, it.name.en, it.name.sr, it.native, ...(it.aliases || [])].filter(Boolean).map(normalizeLoose);

  function swallowTail() {
    if (!tail) return false;
    const value = ui.input.value;
    if (Date.now() > tail.until) {
      tail = null;
      return false;
    }
    const keys = looseKeysOf(tail.typed + tail.raw + value);
    const complete = keys.some((k) => tail.full.includes(k));
    // пробелы, дефисы, тире между словами названия
    if (!normalizeLoose(value)) {
      tail.raw += value;
      if (complete) tail.doneAt = tail.raw.length;
      tail.until = Date.now() + 1500;
      clearInput();
      return true;
    }
    if (keys.some((k) => tail.full.some((K) => K.startsWith(k)))) {
      tail.raw += value;
      if (complete) tail.doneAt = tail.raw.length;
      tail.until = Date.now() + 1500;
      clearInput();
      return true;
    }
    ui.input.value = (tail.raw.slice(tail.doneAt) + value).replace(/^[\s\-–—'’.,()]+/, "");
    tail = null;
    return false;
  }

  function accept(it) {
    const g = S.type;
    if (g.done) return;
    start();
    const typed = ui.input.value;
    clearInput();
    tail = { it, full: itemKeys(it), typed, raw: "", doneAt: 0, until: Date.now() + 1500 };
    if (g.guessed.includes(it.id)) {
      toast(T.already(nameOf(it)), { note: true });
      return;
    }
    g.guessed.push(it.id);
    save();
    renderHero();
    renderRows();
    paintMap();
    animateShape(it.id, "is-pop", 520);
    const row = rowEls.get(it.id);
    row.classList.remove("is-new");
    void row.offsetWidth;
    row.classList.add("is-new");
    toast(nameOf(it), { id: it.id });
    markPlayed();
    achieve("guess");
    if (g.guessed.length === TOTAL) finishType(false);
  }

  function showNot(note) {
    clearInput();
    shake();
    toast(note.text[LANG] || note.text.ru, { note: true });
  }

  let pending = null;

  function onInput() {
    window.clearTimeout(pending);
    if (swallowTail()) return;
    const value = ui.input.value;
    ui.clear.classList.toggle("is-visible", value.length > 0);
    if (S.type.done || !value.trim()) return;
    const hit = findItem(value);
    if (hit) {
      if (!ambiguous.has(hit.k)) return accept(hit.it, hit.k);
      // «Алтай» может оказаться началом «Алтайского края»: ждём, пока человек допечатает
      pending = window.setTimeout(() => {
        const again = findItem(ui.input.value);
        if (again?.it === hit.it) accept(hit.it, again.k);
      }, 900);
      return;
    }
    const note = findNot(value);
    if (note) showNot(note);
  }

  function finishType(gaveUp) {
    const g = S.type;
    if (g.done) return;
    g.done = true;
    g.gaveUp = gaveUp;
    lastRecordBroken = commitRecord("type", g.guessed.length, g.elapsed);
    save();
    achieve("typeFinish");
    medalCheck();
    renderAll();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  let giveUpArmed = null;

  function resetGiveUp() {
    window.clearTimeout(giveUpArmed);
    giveUpArmed = null;
    ui.giveup.textContent = T.giveUp;
  }

  function onGiveUp() {
    if (S.type.done) return;
    if (!giveUpArmed) {
      ui.giveup.textContent = T.giveUpSure;
      giveUpArmed = window.setTimeout(resetGiveUp, 3000);
      return;
    }
    resetGiveUp();
    finishType(true);
  }

  /* ─────────────── режим «Найти на карте» ─────────────── */

  function advance() {
    const g = S.map;
    g.qi += 1;
    g.tries = 0;
    if (g.qi >= TOTAL) {
      g.done = true;
      lastRecordBroken = commitRecord("map", mapCounts().ok, g.elapsed);
      save();
      achieve("mapFinish");
      medalCheck();
      resetZoom(false);
      renderAll();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      return;
    }
    save();
    renderHero();
    renderPrompt(true);
  }

  function failCurrent() {
    const g = S.map;
    const target = g.queue[g.qi];
    g.results[target] = "fail";
    busy = true;
    lastHit = null;
    save();
    paintMap();
    renderHero();
    focusShape(target);
    animateShape(target, "is-reveal", 1100);
    ui.promptLabel.textContent = T.hereItIs;
    ui.target.classList.add("is-reveal");
    ui.skip.disabled = true;
    window.setTimeout(() => {
      busy = false;
      advance();
    }, 1200);
  }

  function onMapClick(e) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const node = e.target.closest("[data-id]");
    if (!node) return;
    const id = node.dataset.id;
    const it = byId.get(id);
    if (S.mode !== "map" || S.map.done) {
      if (revealed(id)) showTip(tipName(it), e.clientX, e.clientY);
      return;
    }
    const g = S.map;
    if (busy || g.results[id]) return;
    start();
    const target = g.queue[g.qi];
    if (id === target) {
      const first = g.tries === 0;
      g.results[id] = first ? "ok" : "late";
      achieve("mapHit", { hit: { id, first } });
      paintMap();
      animateShape(id, "is-pop", 520);
      lastHit = id;
      hideTip();
      markPlayed();
      advance();
      return;
    }
    g.tries += 1;
    g.wrong += 1;
    animateShape(id, "is-wrong", 700);
    showTip(esc(T.thisIs(nameOf(it))), e.clientX, e.clientY, true);
    window.clearTimeout(tipTimer);
    tipTimer = window.setTimeout(hideTip, 1100);
    renderHero();
    if (g.tries >= MAX_TRIES) failCurrent();
    else {
      save();
      renderPrompt(false);
    }
  }

  function onSkip() {
    if (S.map.done || busy) return;
    start();
    failCurrent();
  }

  /* Во время игры на карте вся карта должна быть в экране: подсказка прилипает сверху */
  function ensureMapVisible() {
    requestAnimationFrame(() => {
      if (ui.mapCard.getBoundingClientRect().bottom <= window.innerHeight) return;
      const top = ui.prompt.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ─────────────── приближение и перетаскивание карты ─────────────── */

  const vb = { ...base };
  let anim = null;
  let suppressClick = false;

  const isZoomed = () => vb.w < base.w - 0.5;

  function clampBox(t) {
    t.w = Math.min(base.w, Math.max(base.w / MAX_ZOOM, t.w));
    t.h = (t.w * base.h) / base.w;
    t.x = Math.min(base.x + base.w - t.w, Math.max(base.x, t.x));
    t.y = Math.min(base.y + base.h - t.h, Math.max(base.y, t.y));
    return t;
  }

  /* Границы всегда в 1 пиксель: vector-effect на <use> браузеры применяют не везде, считаем сами */
  function syncStroke() {
    const ctm = ui.map.getScreenCTM();
    if (ctm?.a) ui.map.style.setProperty("--sw", String(1 / ctm.a));
  }

  function applyVB() {
    ui.map.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    syncStroke();
    const zoomed = isZoomed();
    ui.mapCard.classList.toggle("is-zoomed", zoomed);
    ui.zoomReset.hidden = !zoomed;
  }

  function animateTo(target) {
    cancelAnimationFrame(anim);
    const from = { ...vb };
    const t0 = performance.now();
    const dur = reduceMotion ? 0 : 220;
    const step = (now) => {
      const p = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - (1 - p) ** 3;
      ["x", "y", "w", "h"].forEach((k) => {
        vb[k] = from[k] + (target[k] - from[k]) * e;
      });
      applyVB();
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  const zoomBox = (factor, cx, cy) => {
    const nw = Math.min(base.w, Math.max(base.w / MAX_ZOOM, vb.w / factor));
    const k = nw / vb.w;
    return clampBox({ x: cx - (cx - vb.x) * k, y: cy - (cy - vb.y) * k, w: nw, h: nw });
  };

  function toSvg(clientX, clientY) {
    const p = ui.map.createSVGPoint();
    p.x = clientX;
    p.y = clientY;
    const r = p.matrixTransform(ui.map.getScreenCTM().inverse());
    return [r.x, r.y];
  }

  function resetZoom(animated = true) {
    if (animated) animateTo({ ...base });
    else {
      cancelAnimationFrame(anim);
      Object.assign(vb, base);
      applyVB();
    }
  }

  /* Нужный регион за краем приближенной карты — подвинем его в центр */
  function focusShape(id) {
    if (!isZoomed()) return;
    const [x0, y0, x1, y1] = SHAPES[id].b;
    if (x0 >= vb.x && x1 <= vb.x + vb.w && y0 >= vb.y && y1 <= vb.y + vb.h) return;
    animateTo(clampBox({ x: (x0 + x1) / 2 - vb.w / 2, y: (y0 + y1) / 2 - vb.h / 2, w: vb.w, h: vb.h }));
  }

  ui.mapCard.querySelector("#zoom").addEventListener("click", (e) => {
    const b = e.target.closest("[data-zoom]");
    if (!b) return;
    const cx = vb.x + vb.w / 2;
    const cy = vb.y + vb.h / 2;
    if (b.dataset.zoom === "reset") resetZoom();
    else animateTo(zoomBox(b.dataset.zoom === "in" ? 2 : 0.5, cx, cy));
  });

  ui.map.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && !isZoomed()) return; // обычная прокрутка страницы, пока карта не приближена
      e.preventDefault();
      cancelAnimationFrame(anim);
      const [sx, sy] = toSvg(e.clientX, e.clientY);
      Object.assign(vb, zoomBox(Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0025)), sx, sy));
      applyVB();
    },
    { passive: false },
  );

  const pointers = new Map();
  let gesture = null;

  function beginGesture() {
    const ctm = ui.map.getScreenCTM();
    const pts = [...pointers.values()];
    const g = { vb: { ...vb }, a: ctm.a, offX: ctm.e + vb.x * ctm.a, offY: ctm.f + vb.y * ctm.d, moved: false };
    if (pts.length >= 2) {
      g.type = "pinch";
      g.dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      g.mid = toSvg((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
      g.moved = true;
    } else {
      g.type = "pan";
      g.sx = pts[0].x;
      g.sy = pts[0].y;
    }
    gesture = g;
  }

  ui.map.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    cancelAnimationFrame(anim);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    beginGesture();
  });

  ui.map.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId) || !gesture) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture;
    if (g.type === "pinch" && pointers.size >= 2) {
      const [p1, p2] = [...pointers.values()];
      const factor = Math.hypot(p1.x - p2.x, p1.y - p2.y) / g.dist;
      const nw = Math.min(base.w, Math.max(base.w / MAX_ZOOM, g.vb.w / factor));
      const s = (g.a * g.vb.w) / nw;
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      Object.assign(vb, clampBox({ x: g.mid[0] - (mx - g.offX) / s, y: g.mid[1] - (my - g.offY) / s, w: nw, h: nw }));
      applyVB();
      return;
    }
    if (g.type !== "pan" || !isZoomed()) return;
    const dx = e.clientX - g.sx;
    const dy = e.clientY - g.sy;
    if (!g.moved && Math.hypot(dx, dy) < 6) return;
    if (!g.moved) {
      g.moved = true;
      try {
        ui.map.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    Object.assign(vb, clampBox({ x: g.vb.x - dx / g.a, y: g.vb.y - dy / g.a, w: g.vb.w, h: g.vb.h }));
    applyVB();
  });

  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (gesture?.moved) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    }
    if (pointers.size) beginGesture();
    else gesture = null;
  };
  ui.map.addEventListener("pointerup", endPointer);
  ui.map.addEventListener("pointercancel", endPointer);

  /* ─────────────── события ─────────────── */

  ui.input.addEventListener("input", onInput);
  ui.input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      window.clearTimeout(pending);
      clearInput();
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    window.clearTimeout(pending);
    const hit = findItem(ui.input.value);
    if (hit) accept(hit.it, hit.k);
    else if (findNot(ui.input.value)) showNot(findNot(ui.input.value));
    else if (ui.input.value.trim()) shake();
  });
  ui.clear.addEventListener("click", () => {
    clearInput();
    ui.input.focus();
  });
  ui.giveup.addEventListener("click", onGiveUp);
  ui.skip.addEventListener("click", onSkip);

  function switchMode(mode) {
    if (view !== "game") {
      view = "game";
      renderView();
    }
    if (mode !== S.mode) {
      S.mode = mode;
      lastRecordBroken = false;
      lastCount = null;
      busy = false;
      lastHit = null;
      ui.toast.classList.remove("is-visible");
      resetZoom(false);
      save();
    }
    renderAll();
    if (S.mode === "type" && !S.type.done) ui.input.focus();
    if (S.mode === "map" && !S.map.done) ensureMapVisible();
  }

  ui.segmented.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (b) switchMode(b.dataset.mode);
  });

  function restart() {
    tail = null;
    freshMedals.clear();
    if (S.mode === "type") S.type = freshType();
    else S.map = freshMap();
    lastRecordBroken = false;
    lastCount = null;
    busy = false;
    lastHit = null;
    if (view !== "game") {
      view = "game";
    }
    resetZoom(false);
    save();
    renderAll();
    if (S.mode === "type") ui.input.focus();
    else ensureMapVisible();
  }

  ui.reset.addEventListener("click", restart);
  ui.result.addEventListener("click", (e) => {
    if (e.target.closest("[data-again]")) restart();
  });

  root.addEventListener("click", (e) => {
    const v = e.target.closest("[data-view]");
    if (v) setView(view === v.dataset.view ? "game" : v.dataset.view);
  });

  ui.map.addEventListener("click", onMapClick);
  ui.map.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || gesture?.moved) return;
    if (ui.tip.classList.contains("is-wrong") && ui.tip.classList.contains("is-visible")) return;
    const node = e.target.closest("[data-id]");
    if (node && revealed(node.dataset.id)) showTip(tipName(byId.get(node.dataset.id)), e.clientX, e.clientY);
    else hideTip();
  });
  ui.map.addEventListener("pointerleave", () => {
    if (!ui.tip.classList.contains("is-wrong")) hideTip();
  });

  window.addEventListener("resize", () => {
    moveThumb();
    syncStroke();
  });
  window.addEventListener("beforeunload", save);
  document.addEventListener("keydown", (e) => {
    if (view !== "game" || S.mode !== "type" || S.type.done) return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    if (document.activeElement !== ui.input && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "")) ui.input.focus();
  });
  document.addEventListener("account:change", () => {
    if (game().done) renderResult();
    if (view === "leaders") account.renderLeaderboardInto(ui.leaders);
  });

  /* ─────────────── старт ─────────────── */

  renderAll();
  medalCheck(true);
  requestAnimationFrame(() => {
    syncStroke();
    moveThumb();
    ui.thumb.classList.add("is-ready");
  });
  if (S.mode === "type" && !S.type.done && !("ontouchstart" in window)) ui.input.focus();
}
