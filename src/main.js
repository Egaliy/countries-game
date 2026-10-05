import "./styles.css";
import { promoHTML } from "./shared/ourgames.js";
import { COUNTRIES, REGIONS } from "./data.js";
import { SUBREGIONS } from "./subregions.js";
import { POPULATION } from "./population.js";
import { UI, NAMES_BY_ISO, srCyrillicToLatin, hasSerbianCyrillic } from "./i18n.js";
import { ACHIEVEMENTS, achievementText, ACHV_UI } from "./achievements.js";
import { createAccount } from "./account.js";
import "./shared/flags.js";
import { parsePath, topbarHTML } from "./shared/site.js";
import { createStreak } from "./shared/streak.js";
import { checkMedals } from "./shared/medals.js";
import { mountMedals, resultMedalHTML } from "./shared/medal3d.js";

/* ─────────────────────────────────────────────
   Язык: /  → ru, /en → en, /rs или /sr → sr
   ───────────────────────────────────────────── */

const { lang: LANG } = parsePath();
const T = UI[LANG];
const AT = ACHV_UI[LANG];

document.documentElement.lang = LANG === "sr" ? "sr-Latn" : LANG;
// SEO-заголовок из сборки (scripts/seo.mjs) не перетираем; в dev ставим короткий
if (!document.querySelector('link[rel="canonical"]')) document.title = T.title;

/* ─────────────────────────────────────────────
   Константы
   ───────────────────────────────────────────── */

const LIMIT_SECONDS = 15 * 60;
const STATE_KEY = "countries-game-state-v3";
const RECORDS_KEY = "countries-game-records-v1";
const ACHV_KEY = "countries-game-achievements-v1";
const META_KEY = "countries-game-meta-v1";
const TOTAL = COUNTRIES.length;

/* Таблицы лидеров по режимам (викторины идут в зачёт только по всем регионам) */
const BOARD_BY_MODE = { countries: "countries", flagCountry: "flags", countryCapital: "capitals", capitalCountry: "bycapital", population: "population" };

const MODES = Object.fromEntries(
  Object.entries(T.modes).map(([k, [label, caption, placeholder, prompt]]) => [
    k,
    { label, caption, placeholder, prompt },
  ]),
);

const isQuiz = (mode) => mode !== "countries";

/* ─────────────────────────────────────────────
   Утилиты
   ───────────────────────────────────────────── */

const normalize = (s) =>
  String(s)
    .toLowerCase()
    .replaceAll("ё", "е")
    .replaceAll("đ", "dj")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zа-я0-9]/g, "");

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const fmtTime = (s) => {
  const v = Math.max(0, s | 0);
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

const plural = (n, [one, few, many]) => {
  if (LANG === "en") return n === 1 ? one : many;
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

const flagToIso = (flag) =>
  [...flag].map((ch) => String.fromCharCode(ch.codePointAt(0) - 127397)).join("");

/* Обогащаем страны ISO-кодом и переводами */
COUNTRIES.forEach((c) => {
  c.iso = flagToIso(c.flag);
  c.t = NAMES_BY_ISO.get(c.iso);
  if (!c.t) throw new Error(`Нет перевода для ${c.name} (${c.iso})`);
});

const name = (c) => (LANG === "ru" ? c.name : c.t[LANG].name);
const capitals = (c) => (LANG === "ru" ? c.capitals : c.t[LANG].capitals);
const region = (r) => T.regions[r] || r;

const collator = new Intl.Collator(LANG === "sr" ? "sr-Latn" : LANG);
const byName = new Map(COUNTRIES.map((c) => [c.name, c]));
const byIso = new Map(COUNTRIES.map((c) => [c.iso, c]));

/* Индекс всех названий (три языка) → { country, lang } */
const countryIndex = new Map();
const capitalIndex = new Map(); // country → Set нормализованных столиц
COUNTRIES.forEach((c) => {
  const add = (lang, list) =>
    list.forEach((a) => {
      const k = normalize(a);
      if (k && !countryIndex.has(k)) countryIndex.set(k, { c, lang });
    });
  add("ru", [c.name, ...c.aliases.filter((a) => /^[а-яё]/i.test(a))]);
  add("en", [c.t.en.name, ...c.t.en.aliases, ...c.aliases.filter((a) => /^[a-z]/i.test(a))]);
  add("sr", [c.t.sr.name, ...c.t.sr.aliases]);
  capitalIndex.set(
    c,
    new Set([...c.capitals, ...c.t.en.capitals, ...c.t.sr.capitals].map(normalize)),
  );
});

const lookupKeys = (value) => {
  const keys = [normalize(value)];
  if (hasSerbianCyrillic(value) || /[а-я]/i.test(value)) keys.push(normalize(srCyrillicToLatin(value)));
  return keys.filter(Boolean);
};

const findCountry = (value) => {
  for (const k of lookupKeys(value)) {
    const hit = countryIndex.get(k);
    if (hit) return hit;
  }
  return null;
};

const matchesCapital = (c, value) => lookupKeys(value).some((k) => capitalIndex.get(c).has(k));

const regionCountries = (r) =>
  COUNTRIES.filter((c) => c.region === r).sort((a, b) => collator.compare(name(a), name(b)));

/* ─────────────────────────────────────────────
   Состояние
   ───────────────────────────────────────────── */

const S = {
  mode: "countries",
  regions: new Set(REGIONS),
  guessed: new Set(),
  secondsLeft: LIMIT_SECONDS,
  limited: true,
  gaveUp: false,
  recorded: false,
  queue: [],
  qi: 0,
  qCorrect: new Set(),
  qSkipped: new Set(),
  qPoints: {},
  qGuess: {},
  revealed: "",
  elapsed: 0,
};

/* Статистика текущей партии для достижений (не сохраняется) */
const st = {
  order: [],
  times: [],
  langs: new Set(),
  antarctica: false,
  easter: false,
  quizStreak: 0,
  skipStreak: 0,
};

const resetSessionStats = () => {
  st.order = [];
  st.times = [];
  st.langs = new Set();
  st.antarctica = false;
  st.easter = false;
  st.quizStreak = 0;
  st.skipStreak = 0;
};

let records = loadJSON(RECORDS_KEY);
let unlocked = loadJSON(ACHV_KEY);
let meta = { games: 0, ...loadJSON(META_KEY) };
let timer = null;

function loadJSON(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    localStorage.removeItem(key);
    return {};
  }
}

function saveState() {
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      mode: S.mode,
      regions: [...S.regions],
      guessed: [...S.guessed],
      secondsLeft: S.secondsLeft,
      limited: S.limited,
      gaveUp: S.gaveUp,
      recorded: S.recorded,
      queue: S.queue,
      qi: S.qi,
      qCorrect: [...S.qCorrect],
      qSkipped: [...S.qSkipped],
      qPoints: S.qPoints,
      qGuess: S.qGuess,
      revealed: S.revealed,
      elapsed: S.elapsed,
    }),
  );
}

function restoreState() {
  const v = loadJSON(STATE_KEY);
  if (MODES[v.mode]) S.mode = v.mode;
  if (Array.isArray(v.regions)) {
    const r = v.regions.filter((x) => REGIONS.includes(x));
    S.regions = new Set(r.length ? r : REGIONS);
  }
  if (Array.isArray(v.guessed)) v.guessed.forEach((n) => byName.has(n) && S.guessed.add(n));
  if (Number.isFinite(v.secondsLeft)) S.secondsLeft = clamp(v.secondsLeft, 0, LIMIT_SECONDS);
  if (typeof v.limited === "boolean") S.limited = v.limited;
  if (typeof v.gaveUp === "boolean") S.gaveUp = v.gaveUp;
  if (typeof v.recorded === "boolean") S.recorded = v.recorded;
  if (Array.isArray(v.queue)) S.queue = v.queue.filter((n) => byName.has(n));
  if (Number.isFinite(v.qi)) S.qi = clamp(v.qi, 0, S.queue.length);
  if (Array.isArray(v.qCorrect)) v.qCorrect.forEach((n) => byName.has(n) && S.qCorrect.add(n));
  if (Array.isArray(v.qSkipped)) v.qSkipped.forEach((n) => byName.has(n) && S.qSkipped.add(n));
  const numbers = (obj) => Object.entries(obj && typeof obj === "object" ? obj : {}).filter(([n, x]) => byName.has(n) && Number.isFinite(x));
  S.qPoints = Object.fromEntries(numbers(v.qPoints));
  S.qGuess = Object.fromEntries(numbers(v.qGuess));
  if (typeof v.revealed === "string" && byName.has(v.revealed)) S.revealed = v.revealed;
  if (Number.isFinite(v.elapsed)) S.elapsed = Math.max(0, v.elapsed);
}

/* ─────────────────────────────────────────────
   Рекорды (совместимы со старым форматом)
   ───────────────────────────────────────────── */

function recordKey() {
  return S.mode === "countries"
    ? `countries:${LANG}`
    : `${S.mode}:${LANG}:${[...S.regions].sort().join("|")}`;
}

function currentRecord() {
  return records[recordKey()] || {};
}

function updateRecord() {
  const key = recordKey();
  const prev = records[key] || {};
  const pop = S.mode === "population";
  const total = pop ? S.queue.length * 100 : isQuiz(S.mode) ? S.queue.length : TOTAL;
  const correct = pop ? pointsSum() : isQuiz(S.mode) ? S.qCorrect.size : S.guessed.size;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const finished = isQuiz(S.mode) ? S.qi >= S.queue.length : countriesFinished();
  const timed = isQuiz(S.mode) || correct === TOTAL;
  const better = correct > (prev.bestCorrect || 0);
  const faster =
    correct === prev.bestCorrect &&
    finished &&
    timed &&
    (prev.bestTimeSeconds == null || S.elapsed < prev.bestTimeSeconds);
  if (!better && !faster) return;
  const hadRecord = prev.bestCorrect != null;
  records[key] = {
    bestCorrect: correct,
    bestTotal: total,
    bestPercent: percent,
    bestTimeSeconds: timed ? S.elapsed : null,
    bestScore: prev.bestScore ?? null,
  };
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  if (hadRecord && better) checkAchievements("record");
  if (finished) syncBoard();
}

/* ─────────────────────────────────────────────
   Достижения
   ───────────────────────────────────────────── */

const achvQueue = [];
let achvShowing = false;

function achvContext() {
  return {
    S,
    st,
    meta,
    total: TOTAL,
    hour: new Date().getHours(),
    streak: streakCount(),
    name,
    guessedList: () => [...S.guessed].map((n) => byName.get(n)),
    hasIso: (isos) => isos.every((iso) => S.guessed.has(byIso.get(iso)?.name)),
    regionDone: (r) => COUNTRIES.filter((c) => c.region === r).every((c) => S.guessed.has(c.name)),
  };
}

function checkAchievements(event) {
  const ctx = achvContext();
  ACHIEVEMENTS.filter((a) => a.on === event && !unlocked[a.id]).forEach((a) => {
    let ok = false;
    try {
      ok = a.test(ctx);
    } catch {
      ok = false;
    }
    if (!ok) return;
    unlocked[a.id] = Date.now();
    localStorage.setItem(ACHV_KEY, JSON.stringify(unlocked));
    achvQueue.push(a);
    renderTrophy();
    account.syncAchievements(unlocked);
  });
  pumpAchievements();
}

function pumpAchievements() {
  if (achvShowing || !achvQueue.length) return;
  const a = achvQueue.shift();
  achvShowing = true;
  const [title, desc] = a.notice ? [a.title, a.desc] : achievementText(a.id, LANG);
  const card = el("div", `achv${a.cls ? ` ${a.cls}` : ""}`);
  card.style.setProperty("--h", a.hue);
  card.innerHTML = `
    <div class="achv__burst" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
    <div class="achv__emoji">${a.emoji}</div>
    <div class="achv__text">
      <div class="achv__label">${a.notice ? a.label : a.warn ? AT.warning : AT.unlocked}</div>
      <div class="achv__title">${title}</div>
      <div class="achv__desc">${desc}</div>
    </div>
  `;
  ui.achvLayer.appendChild(card);
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("is-in")));
  const close = () => {
    if (card.classList.contains("is-out")) return;
    card.classList.add("is-out");
    window.setTimeout(() => {
      card.remove();
      achvShowing = false;
      pumpAchievements();
    }, 360);
  };
  card.addEventListener("click", close);
  window.setTimeout(close, 4200);
}

function renderTrophy() {
  const n = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  ui.trophy.innerHTML = `<span class="trophy__icon">🏆</span><span class="tnum">${n} / ${ACHIEVEMENTS.length}</span>`;
  if (ui.achvPanel.classList.contains("is-open")) renderAchvPanel();
}

/* Полный список с условиями видит только владелец; остальным — только открытое */
const ADMIN_IDS = new Set(["328826190"]);
const isAdmin = () => Boolean(account.user && ADMIN_IDS.has(String(account.user.id)));

function renderAchvPanel() {
  const admin = isAdmin();
  const lockedCount = ACHIEVEMENTS.filter((a) => !unlocked[a.id]).length;
  const items = ACHIEVEMENTS.filter((a) => admin || unlocked[a.id]).map((a) => {
    const got = Boolean(unlocked[a.id]);
    const [title, desc] = achievementText(a.id, LANG);
    const hidden = a.secret && !got;
    return `
      <div class="achv-item${got ? " is-got" : ""}" style="--h:${a.hue}">
        <div class="achv-item__emoji">${hidden ? "❔" : a.emoji}</div>
        <div class="achv-item__title">${hidden ? AT.secret : title}</div>
        <div class="achv-item__desc">${hidden ? "…" : got ? desc : AT.locked}</div>
      </div>
    `;
  }).join("");
  ui.achvPanel.innerHTML = `
    <div class="achv-panel__head">
      <h2 class="achv-panel__title">${AT.title}</h2>
      <span class="pill tnum">${ACHIEVEMENTS.filter((a) => unlocked[a.id]).length} / ${ACHIEVEMENTS.length}</span>
    </div>
    <div class="achv-grid">${items}</div>
    ${!admin && lockedCount ? `<p class="achv-panel__more">${AT.hiddenLeft(lockedCount)}</p>` : ""}
  `;
}

function toggleAchvPanel() {
  const open = !ui.achvPanel.classList.contains("is-open");
  ui.achvPanel.classList.toggle("is-open", open);
  ui.trophy.setAttribute("aria-expanded", String(open));
  if (open) renderAchvPanel();
}

/* ─────────────────────────────────────────────
   Игровая логика
   ───────────────────────────────────────────── */

function countriesFinished() {
  return S.gaveUp || (S.limited && S.secondsLeft <= 0) || S.guessed.size === TOTAL;
}

function buildQueue() {
  return shuffle(COUNTRIES.filter((c) => S.regions.has(c.region) && (S.mode !== "population" || POPULATION[c.iso])).map((c) => c.name));
}

function resetQuiz() {
  S.queue = buildQueue();
  S.qi = 0;
  S.qCorrect.clear();
  S.qSkipped.clear();
  S.qPoints = {};
  S.qGuess = {};
  S.revealed = "";
  S.elapsed = 0;
  resetSessionStats();
}

function resetCountries() {
  S.guessed.clear();
  S.secondsLeft = LIMIT_SECONDS;
  S.limited = true;
  S.gaveUp = false;
  S.recorded = false;
  S.elapsed = 0;
  resetSessionStats();
}

function currentQuestion() {
  return byName.get(S.queue[S.qi]) || null;
}

function bumpGames() {
  meta.games = (meta.games || 0) + 1;
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/* Ввод в режиме «Страны» */
function tryGuessCountry(value) {
  if (countriesFinished()) return;
  const hit = findCountry(value);
  if (!hit || S.guessed.has(hit.c.name)) return;
  const c = hit.c;
  S.guessed.add(c.name);
  st.order.push(c);
  st.times.push(Date.now());
  st.langs.add(hit.lang);
  ui.input.value = "";
  updateClear();
  showToast(c);
  revealRow(c, false, true);
  updateRecord();
  saveState();
  renderHero();
  renderRegionMeters();
  checkAchievements("guess");
  markPlayedToday();
  if (S.guessed.size === TOTAL) finishCountries();
}

/* Ввод в викторине */
function tryAnswerQuiz(value) {
  const c = currentQuestion();
  if (!c || S.revealed) return false;
  const ok =
    S.mode === "countryCapital" ? matchesCapital(c, value) : findCountry(value)?.c === c;
  if (!ok) return false;
  S.qCorrect.add(c.name);
  st.quizStreak += 1;
  st.skipStreak = 0;
  ui.input.value = "";
  updateClear();
  showToast(c, S.mode === "countryCapital" ? capitals(c)[0] : name(c));
  checkAchievements("quizCorrect");
  markPlayedToday();
  nextQuestion();
  return true;
}

function nextQuestion() {
  S.qi += 1;
  S.revealed = "";
  updateRecord();
  saveState();
  if (S.qi >= S.queue.length) medalCheck();
  renderHero();
  renderStage(true);
  renderEntry();
  syncTimer();
  if (S.qi >= S.queue.length) {
    bumpGames();
    checkAchievements("quizFinish");
  }
  ui.input.focus();
}

function skipQuestion() {
  const c = currentQuestion();
  if (!c) return;
  if (S.revealed) {
    nextQuestion();
    return;
  }
  S.revealed = c.name;
  S.qSkipped.add(c.name);
  if (S.mode === "population") S.qPoints[c.name] = 0;
  st.quizStreak = 0;
  st.skipStreak += 1;
  ui.input.value = "";
  updateClear();
  saveState();
  renderStage(false);
  renderEntry();
  checkAchievements("quizSkip");
  ui.input.focus();
}

function finishCountries() {
  stopTimer();
  if (!S.recorded) {
    S.recorded = true;
    updateRecord();
    bumpGames();
  }
  saveState();
  medalCheck();
  COUNTRIES.forEach((c) => {
    if (!S.guessed.has(c.name)) revealRow(c, true, false);
  });
  renderHero();
  renderRegionMeters();
  renderStage(true);
  renderEntry();
  checkAchievements("finish");
  account.syncBest(bestCountries());
}

function giveUp() {
  S.gaveUp = true;
  checkAchievements("giveup");
  finishCountries();
}

function removeLimit() {
  S.limited = false;
  saveState();
  renderHero();
  renderEntry();
  syncTimer();
  ui.input.focus();
}

function resetGame() {
  stopTimer();
  freshMedals.clear();
  if (isQuiz(S.mode)) resetQuiz();
  else resetCountries();
  ui.input.value = "";
  updateClear();
  saveState();
  renderAll(true);
  syncTimer();
  ui.input.focus();
}

function setMode(mode) {
  if (mode === S.mode) return;
  stopTimer();
  S.mode = mode;
  if (isQuiz(mode)) resetQuiz();
  S.revealed = "";
  ui.input.value = "";
  updateClear();
  saveState();
  renderAll(true);
  syncTimer();
  ui.input.focus();
}

function toggleRegion(r) {
  if (S.regions.has(r)) {
    if (S.regions.size === 1) return;
    S.regions.delete(r);
  } else {
    S.regions.add(r);
  }
  resetQuiz();
  saveState();
  renderFilters();
  renderAll(false);
  syncTimer();
  ui.input.focus();
}

/* ─────────────────────────────────────────────
   Таймер
   ───────────────────────────────────────────── */

function tick() {
  if (isQuiz(S.mode)) {
    if (S.qi >= S.queue.length) return stopTimer();
    S.elapsed += 1;
  } else if (countriesFinished()) {
    return stopTimer();
  } else if (S.limited) {
    S.secondsLeft -= 1;
    S.elapsed += 1;
    if (S.secondsLeft <= 0) {
      S.secondsLeft = 0;
      renderTimer();
      finishCountries();
      return;
    }
  } else {
    S.elapsed += 1;
  }
  renderTimer();
  if (S.elapsed % 5 === 0 || S.secondsLeft % 5 === 0) saveState();
}

function syncTimer() {
  stopTimer();
  const running = isQuiz(S.mode) ? S.qi < S.queue.length : !countriesFinished();
  if (running) timer = window.setInterval(tick, 1000);
}

function stopTimer() {
  if (timer) window.clearInterval(timer);
  timer = null;
}

/* ─────────────────────────────────────────────
   Разметка
   ───────────────────────────────────────────── */

const root = document.querySelector("#app");
root.innerHTML = `
  <main class="app">
    <h1 class="sr-only">${T.title}</h1>

    ${topbarHTML({
      lang: LANG,
      section: "countries",
      leaderboardLabel: T.account.leaderboard,
      rightExtra: '<button class="trophy" id="trophy" type="button" aria-expanded="false" hidden></button>',
    })}

    <section class="hero" aria-live="polite">
      <div class="score">
        <div class="score__line">
          <span class="score__count" id="count">0</span>
          <span class="score__total" id="total">/ ${TOTAL}</span>
        </div>
        <p class="score__caption" id="caption"></p>
      </div>
      <div class="stats" id="stats"></div>
      <div class="progress"><div class="progress__bar" id="bar"></div></div>
      <div class="controls">
        <nav class="segmented" id="segmented" role="tablist" aria-label="${T.modes.countries[0]}">
        <span class="segmented__thumb" id="thumb"></span>
        ${Object.entries(MODES)
          .map(
            ([k, m]) =>
              `<button class="segmented__item" role="tab" type="button" data-mode="${k}" aria-selected="false">${m.label}</button>`,
          )
          .join("")}
        </nav>
        <div class="controls__right">
          <button class="btn btn--quiet" id="reset" type="button">${T.reset}</button>
        </div>
      </div>
    </section>

    <section class="achv-panel" id="achv-panel"></section>

    <section class="leaders" id="leaders" hidden></section>

    <div class="filters" id="filters">
      <div class="filters__inner" id="filters-inner">
        ${REGIONS.map(
          (r) => `<button class="chip" type="button" data-region="${r}" aria-pressed="true">${region(r)}</button>`,
        ).join("")}
      </div>
    </div>

    <section class="stage" id="stage"></section>

    <section class="entry" id="entry">
      <div class="field">
        <input class="field__input" id="answer" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" />
        <button class="field__clear" id="clear" type="button" aria-label="Clear">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
        </button>
      </div>
      <div class="entry__actions" id="actions"></div>
    </section>

    <section id="content" aria-live="polite"></section>

    <p class="hint" id="hint"></p>

    <div class="toast" id="toast" role="status" aria-live="polite">
      <span class="toast__flag"></span>
      <span class="toast__name"></span>
    </div>

    <div class="achv-layer" id="achv-layer" aria-live="assertive"></div>
  </main>
`;

const ui = {
  reset: root.querySelector("#reset"),
  trophy: root.querySelector("#trophy"),
  streak: root.querySelector("#streak"),
  achvPanel: root.querySelector("#achv-panel"),
  leaders: root.querySelector("#leaders"),
  achvLayer: root.querySelector("#achv-layer"),
  count: root.querySelector("#count"),
  total: root.querySelector("#total"),
  caption: root.querySelector("#caption"),
  stats: root.querySelector("#stats"),
  bar: root.querySelector("#bar"),
  segmented: root.querySelector("#segmented"),
  thumb: root.querySelector("#thumb"),
  filters: root.querySelector("#filters"),
  filtersInner: root.querySelector("#filters-inner"),
  stage: root.querySelector("#stage"),
  entry: root.querySelector("#entry"),
  input: root.querySelector("#answer"),
  clear: root.querySelector("#clear"),
  actions: root.querySelector("#actions"),
  content: root.querySelector("#content"),
  hint: root.querySelector("#hint"),
  toast: root.querySelector("#toast"),
};

const rows = new Map();

/* Лучший результат в режиме «Страны» на любом языке — для лидерборда */
const bestCountries = () => {
  let score = S.mode === "countries" ? S.guessed.size : 0;
  let time = S.mode === "countries" && S.guessed.size === TOTAL && S.elapsed >= 60 ? S.elapsed : null;
  Object.entries(records)
    .filter(([k]) => k.startsWith("countries:"))
    .forEach(([, r]) => {
      const rs = r.bestCorrect || 0;
      const rt = rs === TOTAL && r.bestTimeSeconds != null && r.bestTimeSeconds >= 60 ? r.bestTimeSeconds : null;
      if (rs > score || (rs === score && rt != null && (time == null || rt < time))) {
        score = rs;
        time = rt;
      }
    });
  return { score, time };
};
const bestCountriesScore = () => bestCountries().score;

/* ── Стрик общий для всех разделов (src/shared/streak.js) ── */
const streak = createStreak({ node: ui.streak, t: T.streak, lang: LANG });
const streakCount = () => streak.count();

function markPlayedToday() {
  const card = streak.mark();
  if (!card) return;
  achvQueue.push(card);
  pumpAchievements();
  checkAchievements("streak");
  account.syncStreak(streak.list());
}

function renderStreak(justLit = false) {
  streak.render(justLit);
}

/* ── Население: ответ числом, очки по логарифмической ошибке ── */
let popUnit = "m";
const POP_R0 = Math.log10(1.1); // до 10% ошибки — 100 очков
const POP_R1 = Math.log10(3); // в 3 раза мимо и дальше — 0

const pointsSum = () => Object.values(S.qPoints).reduce((a, b) => a + b, 0);
const popAnswered = () => Object.keys(S.qPoints).length;
const popAccuracy = () => (popAnswered() ? Math.round(pointsSum() / popAnswered()) : 0);
const locale = LANG === "sr" ? "sr-Latn" : LANG;

function parsePopulation(raw, unit) {
  const s = String(raw).toLowerCase().replace(/\s+/g, "").replace(",", ".");
  const m = s.match(/^(\d+(?:\.\d+)?)([a-zа-яё.]*)$/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (!(n > 0)) return null;
  const suffix = m[2].replace(/\./g, "");
  const UNITS = [
    [/^(b|bn|млрд|миллиард|billion|mlrd|milijard|милијард|млрд)/, 1e9],
    [/^(m|mln|mil|млн|миллион|million|milion|милион|мил)/, 1e6],
    [/^(k|к|тыс|тысяч|thousand|th|hilj|hiljad|хиљ)/, 1e3],
  ];
  if (suffix) {
    const hit = UNITS.find(([re]) => re.test(suffix));
    if (!hit) return null;
    n *= hit[1];
  } else if (n < 10000) {
    n *= { k: 1e3, m: 1e6, b: 1e9 }[unit];
  }
  return Math.round(n);
}

const populationPoints = (guess, actual) => {
  const r = Math.abs(Math.log10(guess / actual));
  return Math.round(Math.max(0, Math.min(1, 1 - (r - POP_R0) / (POP_R1 - POP_R0))) * 100);
};

const populationTier = (guess, actual) => {
  const f = Math.max(guess / actual, actual / guess);
  return f <= 1.1 ? "exact" : f <= 1.25 ? "close" : f <= 1.35 ? "near" : f <= 2 ? "ok" : f <= 3 ? "far" : "miss";
};

function fmtPop(n) {
  const nf = (v, d) => new Intl.NumberFormat(locale, { maximumFractionDigits: d }).format(v);
  const U = T.popUnits;
  if (n >= 1e9) return `${nf(n / 1e9, 2)} ${U.b}`;
  if (n >= 1e6) return `${nf(n / 1e6, n >= 1e8 ? 0 : 1)} ${U.m}`;
  if (n >= 1e3) return `${nf(n / 1e3, n >= 1e5 ? 0 : 1)} ${U.k}`;
  return nf(n, 0);
}

function submitPopulation(value) {
  const c = currentQuestion();
  if (!c || S.revealed) return false;
  const guess = parsePopulation(value, popUnit);
  const actual = POPULATION[c.iso];
  if (!guess || !actual) return false;
  const pts = populationPoints(guess, actual);
  S.qPoints[c.name] = pts;
  S.qGuess[c.name] = guess;
  S.revealed = c.name;
  if (pts >= 70) S.qCorrect.add(c.name);
  ui.input.value = "";
  updateClear();
  saveState();
  renderHero();
  renderStage(false);
  renderEntry();
  if (pts > 0) markPlayedToday();
  ui.input.focus();
  return true;
}

function renderPopPreview() {
  const node = ui.stage.querySelector("#pop-preview");
  if (!node) return;
  const raw = ui.input.value.trim();
  const v = raw ? parsePopulation(raw, popUnit) : null;
  node.textContent = !raw ? T.popHint : v ? `≈ ${fmtPop(v)} · ${new Intl.NumberFormat(locale).format(v)} ${T.popPeople}` : T.popBad;
  node.classList.toggle("is-bad", Boolean(raw && !v));
}

function setPopUnit(u) {
  if (!["k", "m", "b"].includes(u)) return;
  popUnit = u;
  ui.stage.querySelectorAll(".pop-unit").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.unit === u)));
  renderPopPreview();
  ui.input.focus();
}

function popResultNode(c) {
  const actual = POPULATION[c.iso];
  const guess = S.qGuess[c.name];
  const pts = S.qPoints[c.name] || 0;
  const tier = guess ? populationTier(guess, actual) : "skip";
  const pos = (v) => Math.max(0, Math.min(100, 50 + Math.log10(v / actual) * 50)); // шкала от ×0,1 до ×10
  const node = el("div", `pop-result pop-result--${tier}`);
  node.innerHTML = `
    <div class="pop-result__verdict">${T.popTiers[tier]}${guess ? ` <span class="pop-result__pts tnum">+${pts}</span>` : ""}</div>
    <div class="pop-scale" aria-hidden="true">
      <span class="pop-scale__zone"></span>
      <span class="pop-scale__mark pop-scale__mark--actual" style="left:50%"></span>
      ${guess ? `<span class="pop-scale__mark pop-scale__mark--guess" style="left:${pos(guess)}%"></span>` : ""}
    </div>
    <div class="pop-result__nums">
      ${guess ? `<span>${T.popYour} <b>${fmtPop(guess)}</b></span>` : ""}
      <span>${T.popActual} <b>${fmtPop(actual)}</b></span>
    </div>`;
  return node;
}

function resultPopulationHTML() {
  const medal = resultMedalBlock();
  const total = S.queue.length;
  const sum = pointsSum();
  const acc = total ? Math.round(sum / total) : 0;
  const rec = currentRecord();
  const [t0, t1, t2, t3] = T.popTitles;
  const title = total === 0 ? T.noCountries : acc >= 85 ? t0 : acc >= 65 ? t1 : acc >= 45 ? t2 : t3;
  const emoji = total === 0 ? "🗺️" : acc >= 85 ? "🏆" : acc >= 65 ? "🎯" : acc >= 45 ? "👍" : "📚";
  const sub = total === 0 ? T.pickRegion : `${T.accuracy} ${acc}% · ${fmtTime(S.elapsed)}`;
  return `
    <div class="result view-enter">
      ${medal ? "" : `<div class="result__emoji">${emoji}</div>`}
      <h2 class="result__title">${title}</h2>
      <p class="result__sub">${sub}</p>
      ${medal}
      <div class="result__row">
        ${statHTML(T.points, sum)}
        ${statHTML(T.accuracy, `${acc}%`)}
        ${statHTML(T.record, rec.bestPercent != null ? `${rec.bestPercent}%` : "—", "stat--good")}
      </div>
      <button class="btn btn--primary btn--lg" type="button" data-action="reset">${T.playAgain}</button>
      ${fullRegions() && total > 0 ? account.resultHTML(sum) : ""}
      ${promoHTML("countries", LANG)}
    </div>
  `;
}

/* ── Таблицы лидеров ── */
const fullRegions = () => S.regions.size === REGIONS.length;

function boardResult() {
  if (S.mode === "countries") return bestCountries();
  if (!fullRegions() || !S.queue.length || S.qi < S.queue.length) return null;
  return { score: S.mode === "population" ? pointsSum() : S.qCorrect.size, time: S.elapsed };
}

function syncBoard() {
  const r = boardResult();
  if (r) account.syncBest(r, BOARD_BY_MODE[S.mode]);
}

/* Лучшее по всем таблицам из локальных рекордов — уходит на сервер при входе */
function bestScores() {
  const out = { countries: bestCountries() };
  const all = [...REGIONS].sort().join("|");
  Object.entries(BOARD_BY_MODE).forEach(([mode, board]) => {
    if (mode === "countries") return;
    let score = 0;
    Object.entries(records).forEach(([k, r]) => {
      const [m, , reg] = k.split(":");
      if (m === mode && reg === all) score = Math.max(score, r.bestCorrect || 0);
    });
    if (score > 0) out[board] = { score, time: null };
  });
  return out;
}

/* Медали по лучшим результатам (src/shared/medals.js); при загрузке — молча, после партии — с карточкой */
const freshMedals = new Set();

function medalCheck(silent = false) {
  const fresh = checkMedals(bestScores(), {
    lang: LANG,
    silent,
    notify: (card) => {
      achvQueue.push(card);
      pumpAchievements();
    },
  });
  if (!silent) fresh.forEach((f) => freshMedals.add(f.board));
}

/* Большая медаль режима на экране результата (викторины — только по всем регионам) */
function resultMedalBlock() {
  const board = BOARD_BY_MODE[S.mode];
  if (S.mode !== "countries" && !fullRegions()) return "";
  return resultMedalHTML(board, bestScores()[board], LANG, freshMedals.has(board));
}

function leaderboardOpts() {
  return {
    boards: Object.entries(BOARD_BY_MODE).map(([mode, id]) => ({
      id,
      label: MODES[mode].label,
      sub: T.account.modeSub(MODES[mode].label),
      allLabel: T.account.boardAll[id],
      format: id === "population" ? (v) => `${Math.round(v / 196)}%` : undefined,
    })),
    active: BOARD_BY_MODE[S.mode],
  };
}

let view = "game";

const account = createAccount({
  lang: LANG,
  t: T.account,
  root,
  mount: root.querySelector("#account-slot"),
  onLeaders: () => setView("leaders"),
  localAchievements: () => unlocked,
  onAchievements: (remote) => {
    let changed = false;
    for (const [id, ts] of Object.entries(remote)) {
      if (!unlocked[id] && ACHIEVEMENTS.some((a) => a.id === id)) {
        unlocked[id] = ts;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(ACHV_KEY, JSON.stringify(unlocked));
      renderTrophy();
    }
  },
  notify: (card) => {
    achvQueue.push(card);
    pumpAchievements();
  },
  bestScore: bestCountries,
  bestScores,
  localStreak: () => streak.list(),
  onStreak: (days) => streak.merge(days),
});

/* ─────────────────────────────────────────────
   Рендер
   ───────────────────────────────────────────── */

function setView(v) {
  if (view === v) return;
  view = v;
  renderView();
  renderSegmented();
  if (v === "game") ui.input.focus();
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderView() {
  const leaders = view === "leaders";
  ui.leaders.hidden = !leaders;
  [ui.filters, ui.stage, ui.entry, ui.content, ui.hint].forEach((n) => n.classList.toggle("is-view-hidden", leaders));
  if (leaders) account.renderLeaderboardInto(ui.leaders, leaderboardOpts());
  else ui.leaders.innerHTML = "";
  updateDock();
}

/* Мобильный док: поле ввода закреплено внизу экрана в режиме «Страны» */
const mobileMQ = window.matchMedia("(max-width: 720px)");

function updateDock() {
  const docked = mobileMQ.matches && view === "game" && !isQuiz(S.mode) && !countriesFinished();
  document.body.classList.toggle("has-dock", docked);
  ui.entry.classList.toggle("entry--dock", docked);
}

function bindKeyboardOffset() {
  const vv = window.visualViewport;
  if (!vv) return;
  const apply = () => {
    if (!document.body.classList.contains("has-dock")) {
      ui.entry.style.transform = "";
      return;
    }
    const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    ui.entry.style.transform = gap > 0 ? `translateY(-${gap}px)` : "";
  };
  vv.addEventListener("resize", apply);
  vv.addEventListener("scroll", apply);
  mobileMQ.addEventListener("change", () => {
    updateDock();
    apply();
  });
}

function renderAll(animate) {
  renderView();
  renderStreak(false);
  renderSegmented();
  renderFilters();
  renderHero();
  renderStage(animate);
  renderEntry();
  renderContent(animate);
  renderHint();
  renderTrophy();
}

function renderSegmented() {
  ui.segmented.querySelectorAll(".segmented__item").forEach((b) => {
    b.setAttribute("aria-selected", String(view === "game" && b.dataset.mode === S.mode));
  });
  ui.segmented.classList.toggle("is-muted", view !== "game");
  root.querySelector('[data-view="leaders"]')?.classList.toggle("is-active", view === "leaders");
  moveThumb();
}

function moveThumb() {
  const active = ui.segmented.querySelector(`[data-mode="${S.mode}"]`);
  if (!active) return;
  ui.thumb.style.width = `${active.offsetWidth}px`;
  ui.thumb.style.height = `${active.offsetHeight}px`;
  ui.thumb.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop - 3}px)`;
}

function renderFilters() {
  ui.filters.classList.toggle("is-open", isQuiz(S.mode));
  ui.filtersInner.querySelectorAll(".chip").forEach((c) => {
    c.setAttribute("aria-pressed", String(S.regions.has(c.dataset.region)));
  });
}

let lastCount = null;

function renderHero() {
  const quiz = isQuiz(S.mode);
  const pop = S.mode === "population";
  const total = quiz ? S.queue.length : TOTAL;
  const correct = pop ? Math.min(total, popAnswered()) : quiz ? S.qCorrect.size : S.guessed.size;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const rec = currentRecord();
  const done = quiz ? S.qi >= S.queue.length : countriesFinished();

  if (lastCount !== null && lastCount !== correct) {
    ui.count.classList.add("is-bump");
    window.setTimeout(() => ui.count.classList.remove("is-bump"), 220);
  }
  lastCount = correct;

  ui.count.textContent = String(correct);
  ui.total.textContent = `/ ${total}`;
  ui.caption.textContent = pop ? `${MODES[S.mode].caption} ${popAccuracy()}%` : MODES[S.mode].caption;
  ui.bar.style.width = `${percent}%`;
  ui.bar.classList.toggle("is-done", done && percent === 100);

  const recTime = !quiz && rec.bestCorrect === TOTAL && rec.bestTimeSeconds != null ? ` · ${fmtTime(rec.bestTimeSeconds)}` : "";
  const recValue = rec.bestCorrect != null ? (pop ? `${rec.bestPercent}%` : `${rec.bestCorrect} · ${rec.bestPercent}%${recTime}`) : "—";
  const stats = [];
  if (quiz) {
    stats.push([T.remaining, Math.max(0, total - S.qi)]);
    stats.push(pop ? [T.points, pointsSum()] : [T.mistakes, S.qSkipped.size, S.qSkipped.size ? "stat--alert" : ""]);
    stats.push([T.record, recValue]);
    stats.push([T.stopwatch, fmtTime(S.elapsed), "stat--timer", "timer"]);
  } else {
    stats.push([T.remaining, TOTAL - S.guessed.size]);
    stats.push([T.record, recValue]);
    stats.push([
      S.limited ? T.time : T.stopwatch,
      S.limited ? fmtTime(S.secondsLeft) : fmtTime(S.elapsed),
      `stat--timer${S.limited && S.secondsLeft <= 60 && !done ? " stat--alert" : ""}`,
      "timer",
    ]);
  }
  ui.stats.innerHTML = stats
    .map(
      ([label, value, cls = "", id = ""]) =>
        `<div class="stat ${cls}"${id ? ` id="stat-${id}"` : ""}><span class="stat__label">${label}</span><span class="stat__value">${value}</span></div>`,
    )
    .join("");
}

function renderTimer() {
  const node = ui.stats.querySelector("#stat-timer");
  if (!node) return;
  const value = node.querySelector(".stat__value");
  if (isQuiz(S.mode) || !S.limited) {
    value.textContent = fmtTime(S.elapsed);
  } else {
    value.textContent = fmtTime(S.secondsLeft);
    node.classList.toggle("stat--alert", S.secondsLeft <= 60);
  }
}

function renderStage(animate) {
  const quiz = isQuiz(S.mode);

  ui.stage.after(ui.entry);
  ui.entry.classList.remove("entry--inline");

  if (!quiz) {
    if (countriesFinished()) {
      ui.stage.classList.add("is-visible");
      ui.stage.innerHTML = resultCountriesHTML();
      mountMedals(ui.stage);
      account.hydrateResult(bestCountries());
      return;
    }
    ui.stage.classList.remove("is-visible");
    ui.stage.innerHTML = "";
    return;
  }

  ui.stage.classList.add("is-visible");
  const c = currentQuestion();
  if (!c) {
    ui.stage.innerHTML = S.mode === "population" ? resultPopulationHTML() : resultQuizHTML();
    mountMedals(ui.stage);
    const r = boardResult();
    if (r) account.hydrateResult(r, BOARD_BY_MODE[S.mode]);
    return;
  }

  const body = el("div", `stage__body${animate ? " is-enter" : ""}`);
  body.appendChild(el("p", "stage__prompt", MODES[S.mode].prompt));

  if (S.mode === "population") {
    body.appendChild(el("div", "stage__flag stage__flag--pop", c.flag));
    body.appendChild(el("div", "stage__text stage__text--pop", name(c)));
  } else if (S.mode === "flagCountry") {
    body.appendChild(el("div", "stage__flag", c.flag));
  } else if (S.mode === "countryCapital") {
    const t = el("div", "stage__text stage__text--withflag");
    t.appendChild(el("span", "emoji", c.flag));
    t.appendChild(el("span", "", name(c)));
    body.appendChild(t);
  } else {
    body.appendChild(el("div", "stage__text", capitals(c)[0]));
  }

  if (S.mode === "population" && S.revealed === c.name) {
    body.appendChild(popResultNode(c));
  } else if (S.revealed === c.name) {
    const a = el("div", "stage__answer");
    a.appendChild(el("span", "emoji", c.flag));
    a.appendChild(el("span", "", S.mode === "countryCapital" ? capitals(c).join(" / ") : name(c)));
    body.appendChild(a);
  }

  ui.stage.innerHTML = `
    <div class="stage__top">
      <span class="pill tnum">${S.qi + 1} ${T.of} ${S.queue.length}</span>
      <span class="pill tnum">${S.mode === "population" ? `${pointsSum()} · ${popAccuracy()}%` : `${S.qCorrect.size} ✓ · ${S.qSkipped.size} ✕`}</span>
    </div>
  `;
  ui.stage.appendChild(body);
  ui.stage.appendChild(ui.entry);
  ui.entry.classList.add("entry--inline");
  if (S.mode === "population" && !S.revealed) {
    const tools = el("div", "pop-tools");
    tools.innerHTML = `
      <div class="pop-units">${["k", "m", "b"].map((u) => `<button class="chip pop-unit" type="button" data-action="unit" data-unit="${u}" aria-pressed="${u === popUnit}">${T.popUnits[u]}</button>`).join("")}</div>
      <p class="pop-preview" id="pop-preview"></p>`;
    ui.stage.appendChild(tools);
    renderPopPreview();
  }
}

function statHTML(label, value, cls = "") {
  return `<div class="stat ${cls}"><span class="stat__label">${label}</span><span class="stat__value">${value}</span></div>`;
}

function resultCountriesHTML() {
  const medal = resultMedalBlock();
  const n = S.guessed.size;
  const rec = currentRecord();
  const all = n === TOTAL;
  const title = all ? T.allNamed : S.gaveUp ? T.gameOver : T.timeUp;
  const emoji = all ? "🏆" : S.gaveUp ? "🏳️" : "⏱️";
  const sub = all ? `${T.allNamedSub} ${fmtTime(S.elapsed)}` : T.namedSub(n, TOTAL, plural(n, T.countryForms));
  const recTime = rec.bestCorrect === TOTAL && rec.bestTimeSeconds != null ? ` · ${fmtTime(rec.bestTimeSeconds)}` : "";
  return `
    <div class="result view-enter">
      ${medal ? "" : `<div class="result__emoji">${emoji}</div>`}
      <h2 class="result__title">${title}</h2>
      <p class="result__sub">${sub}</p>
      ${medal}
      <div class="result__row">
        ${statHTML(T.named, n)}
        ${statHTML(T.missed, TOTAL - n)}
        ${statHTML(T.record, `${rec.bestCorrect ?? n} · ${rec.bestPercent ?? 0}%${recTime}`, "stat--good")}
      </div>
      <button class="btn btn--primary btn--lg" type="button" data-action="reset">${T.playAgain}</button>
      ${account.resultHTML(n)}
      ${promoHTML("countries", LANG)}
    </div>
  `;
}

function resultQuizHTML() {
  const medal = resultMedalBlock();
  const total = S.queue.length;
  const n = S.qCorrect.size;
  const rec = currentRecord();
  const percent = total ? Math.round((n / total) * 100) : 0;
  const perfect = total > 0 && n === total;
  const title = total === 0 ? T.noCountries : perfect ? T.perfect : T.done;
  const emoji = total === 0 ? "🗺️" : perfect ? "🏆" : percent >= 70 ? "👏" : "📚";
  const sub = total === 0 ? T.pickRegion : `${n} ${T.of} ${total} · ${percent}% · ${fmtTime(S.elapsed)}`;
  const recValue =
    rec.bestCorrect != null
      ? `${rec.bestCorrect} · ${rec.bestPercent}%${rec.bestTimeSeconds != null ? ` · ${fmtTime(rec.bestTimeSeconds)}` : ""}`
      : "—";
  return `
    <div class="result view-enter">
      ${medal ? "" : `<div class="result__emoji">${emoji}</div>`}
      <h2 class="result__title">${title}</h2>
      <p class="result__sub">${sub}</p>
      ${medal}
      <div class="result__row">
        ${statHTML(T.correct, n)}
        ${statHTML(T.mistakes, S.qSkipped.size, S.qSkipped.size ? "stat--alert" : "")}
        ${statHTML(T.record, recValue, "stat--good")}
      </div>
      <button class="btn btn--primary btn--lg" type="button" data-action="reset">${T.playAgain}</button>
      ${fullRegions() && total > 0 ? account.resultHTML(n) : ""}
      ${promoHTML("countries", LANG)}
    </div>
  `;
}

function renderEntry() {
  const quiz = isQuiz(S.mode);
  const done = quiz ? S.qi >= S.queue.length : countriesFinished();
  updateDock();

  ui.entry.classList.toggle("is-hidden", done);
  ui.input.disabled = done;
  ui.input.placeholder = MODES[S.mode].placeholder;
  ui.input.inputMode = S.mode === "population" ? "decimal" : "text";

  const buttons = [];
  if (quiz) {
    buttons.push(
      S.revealed
        ? `<button class="btn btn--primary" type="button" data-action="skip">${T.next}</button>`
        : `<button class="btn" type="button" data-action="skip">${T.skip}</button>`,
    );
    if (S.mode === "population" && !S.revealed) {
      buttons.unshift(`<button class="btn btn--primary" type="button" data-action="answer">${T.answer}</button>`);
    }
  } else {
    if (S.limited) {
      buttons.push(`<button class="btn" type="button" data-action="limit">${T.removeLimit}</button>`);
    }
    buttons.push(`<button class="btn btn--danger" type="button" data-action="giveup">${T.giveUp}</button>`);
  }
  ui.actions.innerHTML = buttons.join("");
}

function renderContent(animate) {
  if (isQuiz(S.mode)) {
    ui.content.innerHTML = "";
    rows.clear();
    return;
  }
  buildRegions(animate);
}

function buildRegions(animate) {
  rows.clear();
  const wrap = el("div", `regions${animate ? " view-enter" : ""}`);
  REGIONS.forEach((r) => {
    const list = regionCountries(r);
    const card = el("section", "region");
    card.dataset.region = r;
    card.innerHTML = `
      <div class="region__head">
        <h2 class="region__title">${region(r)}</h2>
        <div class="region__meter"><i></i></div>
        <span class="region__count tnum">0 / ${list.length}</span>
      </div>
    `;
    const makeRow = (c) => {
      const label = name(c);
      const row = el("div", "c");
      row.dataset.name = c.name;
      const slot = el("span", "c__slot");
      slot.append(el("span", "c__flag", c.flag), el("span", "c__hint", label[0]));
      const body = el("span", "c__body");
      const mask = el("span", "c__mask");
      mask.style.width = `${Math.min(150, Math.max(28, (label.length - 1) * 8))}px`;
      body.append(mask, el("span", `c__name${label.length > 20 ? " c__name--long" : ""}`, label));
      row.append(slot, body);
      const guessed = S.guessed.has(c.name);
      if (guessed) row.classList.add("is-on");
      else if (countriesFinished()) row.classList.add("is-on", "is-miss");
      rows.set(c.name, row);
      return row;
    };
    // подкатегории внутри континента: Балканы, Скандинавия, Карибы…
    (SUBREGIONS[r] || []).forEach((sub) => {
      const members = list.filter((c) => sub.isos.includes(c.iso));
      if (!members.length) return;
      const block = el("div", "subregion");
      block.dataset.isos = sub.isos.join(",");
      const head = el("div", "subregion__head");
      head.append(el("h3", "subregion__title", sub.name[LANG] || sub.name.ru), el("span", "subregion__count tnum", `0 / ${members.length}`));
      const grid = el("div", "region__grid");
      members.forEach((c) => grid.appendChild(makeRow(c)));
      block.append(head, grid);
      card.appendChild(block);
    });
    wrap.appendChild(card);
  });
  ui.content.innerHTML = "";
  ui.content.appendChild(wrap);
  renderRegionMeters();
}

function revealRow(c, missed, fresh) {
  const row = rows.get(c.name);
  if (!row) return;
  row.classList.add("is-on");
  if (missed) row.classList.add("is-miss");
  if (fresh) {
    row.classList.remove("is-new");
    void row.offsetWidth;
    row.classList.add("is-new");
    // показываем место, куда «легла» страна, не отбирая фокус у поля ввода
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center", inline: "nearest" });
  }
}

function renderRegionMeters() {
  ui.content.querySelectorAll(".region").forEach((card) => {
    const list = COUNTRIES.filter((c) => c.region === card.dataset.region);
    const n = list.filter((c) => S.guessed.has(c.name)).length;
    card.querySelector(".region__meter i").style.width = `${(n / list.length) * 100}%`;
    card.querySelector(".region__count").textContent = `${n} / ${list.length}`;
    card.classList.toggle("is-complete", n === list.length);
    card.querySelectorAll(".subregion").forEach((block) => {
      const members = block.dataset.isos.split(",").map((i) => byIso.get(i)).filter(Boolean);
      const k = members.filter((c) => S.guessed.has(c.name)).length;
      block.querySelector(".subregion__count").textContent = `${k} / ${members.length}`;
      block.classList.toggle("is-complete", k === members.length);
    });
  });
}

function renderHint() {
  ui.hint.innerHTML = S.mode === "population" ? T.hintPopulation : isQuiz(S.mode) ? T.hintQuiz : T.hintCountries;
}

function updateClear() {
  ui.clear.classList.toggle("is-visible", ui.input.value.length > 0);
}

/* ─────────────────────────────────────────────
   Тост и тряска
   ───────────────────────────────────────────── */

let toastTimer = null;

function showToast(c, text = name(c)) {
  ui.toast.querySelector(".toast__flag").textContent = c.flag;
  ui.toast.querySelector(".toast__name").textContent = text;
  ui.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-visible"), 1400);
}

function shake() {
  ui.entry.classList.remove("is-shake");
  void ui.entry.offsetWidth;
  ui.entry.classList.add("is-shake");
  window.setTimeout(() => ui.entry.classList.remove("is-shake"), 340);
}

/* ─────────────────────────────────────────────
   События
   ───────────────────────────────────────────── */

const ANTARCTICA = new Set(["антарктида", "antarctica", "antarktik", "antarktika", "antarktida"]);
const KOSOVO = new Set(["косово", "kosovo", "kosova", "косова", "kosovoimetohija", "kosmet", "косметохија"]);

/* Пасхалки: флаги, у которых нет страны */
const EASTER = [
  {
    id: "pride",
    words: new Set(["гей", "геи", "gay", "gays", "гей", "gej", "лгбт", "lgbt", "lgbtq", "lgbtqia", "прайд", "pride", "прајд", "prajd"]),
    cls: "achv--pride",
    emoji: "🏳️‍🌈",
    hue: 300,
    text: {
      ru: ["Пасхалка", "Флаг есть, страны нет", "Любовь без границ, но в список 196 стран не входит."],
      en: ["Easter egg", "A flag, but no country", "Love knows no borders, but it isn't on the list of 196 countries."],
      sr: ["Iznenađenje", "Zastava ima, države nema", "Ljubav ne zna za granice, ali nije na spisku od 196 država."],
    },
  },
  {
    id: "dubai",
    words: new Set(["дубай", "дубаи", "dubai", "dubaj", "дубаj"]),
    cls: "achv--dubai",
    emoji: "🏙️",
    hue: 40,
    text: {
      ru: ["Пасхалка", "Дубай — не страна", "Это город. Страна называется ОАЭ, а столица у неё Абу-Даби. Да, не Дубай."],
      en: ["Easter egg", "Dubai is not a country", "It's a city. The country is the UAE, and its capital is Abu Dhabi. Yes, not Dubai."],
      sr: ["Iznenađenje", "Dubai nije država", "To je grad. Država su UAE, a glavni grad je Abu Dabi. Da, ne Dubai."],
    },
  },
  {
    id: "trans",
    words: new Set(["транс", "трансы", "trans", "трансгендер", "transgender", "transrodni", "трансродни"]),
    cls: "achv--trans",
    emoji: "🏳️‍⚧️",
    hue: 200,
    text: {
      ru: ["Пасхалка", "Тоже флаг без страны", "Столицы нет, зато цвета красивые."],
      en: ["Easter egg", "Also a flag without a country", "No capital, but the colours are lovely."],
      sr: ["Iznenađenje", "Takođe zastava bez države", "Nema glavni grad, ali boje su lepe."],
    },
  },
];

function easterNotice(e) {
  ui.input.value = "";
  updateClear();
  const [label, title, desc] = e.text[LANG] || e.text.ru;
  achvQueue.push({ notice: true, cls: e.cls, emoji: e.emoji, hue: e.hue, label, title, desc });
  pumpAchievements();
  if (!st.easter) {
    st.easter = true;
    checkAchievements("input");
  }
}

function kosovoNotice() {
  ui.input.value = "";
  updateClear();
  shake();
  achvQueue.push({
    notice: true,
    cls: "achv--srb",
    emoji: "🇷🇸",
    hue: 220,
    label: "Обавештење",
    title: "Косово је Србија",
    desc: "Косово и Метохија су саставни део Републике Србије.",
  });
  pumpAchievements();
}

ui.input.addEventListener("input", () => {
  updateClear();
  const keys = lookupKeys(ui.input.value);
  if (keys.some((k) => KOSOVO.has(k))) {
    kosovoNotice();
    return;
  }
  const egg = EASTER.find((e) => keys.some((k) => e.words.has(k)));
  if (egg) {
    easterNotice(egg);
    return;
  }
  if (!st.antarctica && lookupKeys(ui.input.value).some((k) => ANTARCTICA.has(k))) {
    st.antarctica = true;
    checkAchievements("input");
  }
  if (S.mode === "population") renderPopPreview();
  else if (isQuiz(S.mode)) tryAnswerQuiz(ui.input.value);
  else tryGuessCountry(ui.input.value);
});

ui.input.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    ui.input.value = "";
    updateClear();
    return;
  }
  if (e.key !== "Enter") return;
  e.preventDefault();
  if (S.mode === "population") {
    if (S.revealed) nextQuestion();
    else if (!submitPopulation(ui.input.value)) shake();
    return;
  }
  if (isQuiz(S.mode)) {
    if (S.revealed) {
      nextQuestion();
    } else if (ui.input.value.trim() && !tryAnswerQuiz(ui.input.value)) {
      shake();
    }
  } else if (ui.input.value.trim()) {
    shake();
  }
});

ui.clear.addEventListener("click", () => {
  ui.input.value = "";
  updateClear();
  ui.input.focus();
});

ui.reset.addEventListener("click", resetGame);
ui.trophy.addEventListener("click", toggleAchvPanel);

root.addEventListener("click", (e) => {
  const v = e.target.closest("[data-view]");
  if (v) setView(view === v.dataset.view ? "game" : v.dataset.view);
  if (e.target.closest('[data-account="achievements"]')) {
    if (view !== "game") setView("game");
    if (!ui.achvPanel.classList.contains("is-open")) toggleAchvPanel();
    ui.achvPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

ui.segmented.addEventListener("click", (e) => {
  const b = e.target.closest("[data-mode]");
  if (!b) return;
  if (view !== "game") {
    view = "game";
    renderView();
  }
  if (b.dataset.mode === S.mode) renderSegmented();
  else setMode(b.dataset.mode);
  ui.input.focus();
});

ui.filtersInner.addEventListener("click", (e) => {
  const b = e.target.closest("[data-region]");
  if (b) toggleRegion(b.dataset.region);
});

root.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "skip") skipQuestion();
  else if (a === "answer") {
    if (!submitPopulation(ui.input.value)) shake();
  } else if (a === "unit") setPopUnit(b.dataset.unit);
  else if (a === "limit") removeLimit();
  else if (a === "giveup") giveUp();
  else if (a === "reset") resetGame();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== ui.input) {
    e.preventDefault();
    ui.input.focus();
  }
});

window.addEventListener("resize", moveThumb);
window.addEventListener(
  "scroll",
  () => {
    const stuck =
      !ui.entry.classList.contains("entry--inline") && ui.entry.getBoundingClientRect().top <= 13;
    ui.entry.classList.toggle("is-stuck", stuck);
  },
  { passive: true },
);
window.addEventListener("beforeunload", saveState);
document.addEventListener("account:change", () => {
  if (ui.achvPanel.classList.contains("is-open")) renderAchvPanel();
  if (isQuiz(S.mode) ? S.queue.length && S.qi >= S.queue.length : countriesFinished()) renderStage(false);
  if (view === "leaders") account.renderLeaderboardInto(ui.leaders);
});

/* ─────────────────────────────────────────────
   Старт
   ───────────────────────────────────────────── */

restoreState();
if (isQuiz(S.mode) && (!S.queue.length || S.queue.some((n) => !byName.has(n)))) resetQuiz();
renderAll(false);
medalCheck(true);
if (location.hash === "#leaders") setView("leaders");
bindKeyboardOffset();
syncTimer();
requestAnimationFrame(() => {
  moveThumb();
  ui.thumb.classList.add("is-ready");
});
if (!("ontouchstart" in window)) ui.input.focus();
