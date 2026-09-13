import "../shared/flags.js";
import "../styles.css";
import "./profile.css";
import { parsePath, topbarHTML, pathFor, profilePath } from "../shared/site.js";
import { createStreak, pluralFor, streakFromDays } from "../shared/streak.js";
import { createNotices } from "../shared/notices.js";
import { createAccount } from "../account.js";
import { UI } from "../i18n.js";
import { ACHIEVEMENTS, achievementText } from "../achievements.js";
import { MAP_ACHIEVEMENTS, mapAchievementText } from "../mapgame/achievements.js";
import { PROFILE_UI } from "./i18n.js";
import { MEDAL_BOARDS, MEDAL_ICON, medalFor, medalName, boardName, medalNextText, medalCounts } from "../shared/medals.js";
import { THEMES, savedTheme, canUseTheme, themeName } from "../shared/themes.js";
import { mountMedals, medalImage } from "../shared/medal3d.js";

const { lang: LANG, profileId } = parsePath();
const T = PROFILE_UI[LANG];
const TA = UI[LANG];
const plural = pluralFor(LANG);
const ACHV_KEY = "countries-game-achievements-v1";
const SESSION_KEY = "countries-game-session-v1";

document.documentElement.lang = LANG === "sr" ? "sr-Latn" : LANG;
document.title = T.title;
document.body.classList.add("page-profile");

/* Лучи диаграммы: где лучший из режимов, берём лучший */
const AXES = [
  { id: "countries", icon: "🌍", boards: ["countries"], href: "countries" },
  { id: "flags", icon: "🚩", boards: ["flags"], href: "countries" },
  { id: "population", icon: "👥", boards: ["population"], href: "countries" },
  { id: "states", icon: "🗽", boards: ["states-type", "states-map"], href: "states" },
  { id: "russia", icon: "🇷🇺", boards: ["russia-type", "russia-map"], href: "russia" },
];
const MAX = { countries: 196, flags: 196, capitals: 196, bycapital: 196, population: 19600, "states-type": 50, "states-map": 50, "russia-type": 85, "russia-map": 85 };
const FULL_REGIONS = 6;
const QUIZ_BOARD = { flagCountry: "flags", countryCapital: "capitals", capitalCountry: "bycapital", population: "population" };
const ALL_ACHV = ACHIEVEMENTS.length + MAP_ACHIEVEMENTS.length;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
const initials = (name) => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

/* Рекорды из этого браузера — для своего профиля */
function localBoards() {
  const out = {};
  // при равном счёте берём лучшее время: рекордов на разных языках может быть несколько
  const put = (b, score, time = null) => {
    const cur = out[b];
    if (!cur || score > cur.score || (score === cur.score && time != null && (cur.time == null || time < cur.time))) out[b] = { score, time };
  };
  const rec = readJSON("countries-game-records-v1") || {};
  Object.entries(rec).forEach(([k, r]) => {
    const [mode, , regions] = k.split(":");
    if (mode === "countries") put("countries", r.bestCorrect || 0, r.bestCorrect === 196 ? r.bestTimeSeconds ?? null : null);
    if (QUIZ_BOARD[mode] && regions && regions.split("|").length === FULL_REGIONS) put(QUIZ_BOARD[mode], r.bestCorrect || 0, r.bestTimeSeconds ?? null);
  });
  Object.entries(readJSON("map-game-records-v1") || {}).forEach(([b, r]) => put(b, r.best || 0, r.time ?? null));
  return out;
}

const root = document.querySelector("#app");
const ownId = readJSON(SESSION_KEY)?.user?.id;

root.innerHTML = `
  <main class="app">
    ${topbarHTML({ lang: LANG, section: "profile", leaderboardLabel: TA.account.leaderboard, langHref: (l) => profilePath(l, profileId) })}
    <section id="profile" aria-live="polite"><div class="pf-card pf-empty">${esc(T.loading)}</div></section>
    <div class="toast" id="toast" role="status"><span class="toast__name"></span></div>
    <div class="achv-layer" id="achv-layer" aria-live="assertive"></div>
  </main>`;

const view = root.querySelector("#profile");
const notices = createNotices(root.querySelector("#achv-layer"));
const streak = createStreak({ node: root.querySelector("#streak"), t: TA.streak, lang: LANG });
streak.render(false);

const account = createAccount({
  lang: LANG,
  t: TA.account,
  root,
  mount: root.querySelector("#account-slot"),
  onLeaders: () => {
    location.href = `${pathFor(LANG, "countries")}#leaders`;
  },
  notify: (card) => notices.push(card),
  bestScores: () => Object.fromEntries(Object.entries(localBoards()).filter(([, v]) => v.score > 0)),
  localStreak: () => streak.list(),
  onStreak: (days) => streak.merge(days),
  localAchievements: () => readJSON(ACHV_KEY) || {},
  onAchievements: (remote) => {
    const cur = readJSON(ACHV_KEY) || {};
    Object.entries(remote).forEach(([k, v]) => {
      if (!cur[k]) cur[k] = v;
    });
    localStorage.setItem(ACHV_KEY, JSON.stringify(cur));
  },
});

root.addEventListener("click", (e) => {
  if (e.target.closest('[data-view="leaders"]')) location.href = `${pathFor(LANG, "countries")}#leaders`;
  const themeBtn = e.target.closest("[data-theme-id]");
  if (themeBtn && lastData) {
    const refs = Number(lastData.local ? 0 : lastData.user?.referrals ?? 0) || 0;
    if (!canUseTheme(themeBtn.dataset.themeId, refs)) {
      toast(T.themeLocked);
      return;
    }
    account.setTheme(themeBtn.dataset.themeId).then(() => render(lastData));
    render(lastData);
    return;
  }
  if (e.target.closest("[data-copy-ref]")) {
    navigator.clipboard?.writeText(account.referralLink()).then(() => toast(T.copied)).catch(() => {});
    return;
  }
  if (e.target.closest("[data-share-ref]")) {
    navigator.share?.({ title: document.title, text: T.shareText, url: account.referralLink() }).catch(() => {});
    return;
  }
  const share = e.target.closest("[data-share]");
  if (share) {
    navigator.clipboard?.writeText(location.href).then(() => toast(T.copied)).catch(() => {});
  }
});

let toastTimer = null;
function toast(text) {
  const node = root.querySelector("#toast");
  node.querySelector(".toast__name").textContent = text;
  node.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => node.classList.remove("is-visible"), 1600);
}

/* ─────────────── паутинка ─────────────── */

function radarSVG(values) {
  const size = 360;
  const cx = size / 2;
  const cy = 168;
  const R = 112;
  const n = AXES.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const ring = (f) => AXES.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(",")).join(" ");
  const shape = AXES.map((ax, i) => pt(i, R * Math.max(0.03, values[ax.id] / 100)).map((v) => v.toFixed(1)).join(",")).join(" ");
  const labels = AXES.map((ax, i) => {
    const [x, y] = pt(i, R + 30);
    const anchor = Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end";
    const dy = y < cy - R ? -4 : y > cy + 20 ? 12 : 4;
    return `<g class="radar__label"><text x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}"><tspan class="radar__icon">${ax.icon}</tspan> ${esc(T.axes[ax.id])}</text>
      <text class="radar__pct" x="${x.toFixed(1)}" y="${(y + dy + 17).toFixed(1)}" text-anchor="${anchor}">${values[ax.id]}%</text></g>`;
  }).join("");
  return `
    <svg class="radar" viewBox="-70 0 ${size + 140} 330" role="img" aria-label="${esc(T.knowledge)}">
      ${[0.25, 0.5, 0.75, 1].map((f) => `<polygon class="radar__ring" points="${ring(f)}"/>`).join("")}
      ${AXES.map((_, i) => { const [x, y] = pt(i, R); return `<line class="radar__axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("")}
      <g class="radar__shape" style="transform-origin:${cx}px ${cy}px">
        <polygon class="radar__fill" points="${shape}"/>
        ${AXES.map((ax, i) => { const [x, y] = pt(i, R * Math.max(0.03, values[ax.id] / 100)); return `<circle class="radar__dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/>`; }).join("")}
      </g>
      ${labels}
    </svg>`;
}

/* ─────────────── рендер ─────────────── */

const pct = (b, boards) => Math.round(Math.min(1, (boards[b]?.score || 0) / MAX[b]) * 100);

let lastData = null;

function inviteHTML(isOwn, local, refs) {
  if (!isOwn) return "";
  if (local) {
    return `
    <div class="pf-card pf-invite" id="invite">
      <div class="pf-section-head"><h2>🎁 ${esc(T.inviteTitle)}</h2></div>
      <p class="pf-muted">${esc(T.inviteLogin)}</p>
      <button class="btn btn--primary" type="button" data-account="login">${esc(TA.account.login)}</button>
    </div>`;
  }
  const next = THEMES.find((th) => th.need > refs);
  return `
    <div class="pf-card pf-invite" id="invite">
      <div class="pf-section-head"><h2>🎁 ${esc(T.inviteTitle)}</h2><span class="pill tnum">${esc(T.friends(refs))}</span></div>
      <p class="pf-invite__text">${esc(T.inviteText)}</p>
      <div class="pf-invite__link">
        <input class="pf-invite__input" type="text" readonly value="${esc(account.referralLink())}" aria-label="${esc(T.inviteTitle)}" />
        <button class="btn btn--primary" type="button" data-copy-ref>${esc(T.copy)}</button>
        ${navigator.share ? `<button class="btn" type="button" data-share-ref>${esc(T.shareBtn)}</button>` : ""}
      </div>
      <p class="pf-muted">${esc(next ? T.nextTheme(themeName(next, LANG), next.need - refs) : T.allThemes)}</p>
    </div>`;
}

function themesHTML(isOwn, refs) {
  if (!isOwn) return "";
  const current = savedTheme();
  const tiles = THEMES.map((th) => {
    const open = canUseTheme(th.id, refs);
    const on = th.id === current;
    const state = on ? T.themeOn : open ? T.themeUse : `🔒 ${T.needFriends(th.need)}`;
    return `
      <button class="pf-theme${on ? " is-on" : ""}${open ? "" : " is-locked"}" type="button" data-theme-id="${th.id}" ${open ? "" : 'aria-disabled="true"'}>
        <span class="pf-theme__swatch" style="--a:${th.swatch[0]};--b:${th.swatch[1]};--c:${th.swatch[2]}"><i></i><i></i><i></i></span>
        <span class="pf-theme__name">${th.icon} ${esc(themeName(th, LANG))}</span>
        <span class="pf-theme__state">${esc(state)}</span>
      </button>`;
  }).join("");
  return `
    <div class="pf-card" id="themes">
      <div class="pf-section-head"><h2>🎨 ${esc(T.themesTitle)}</h2><span class="pf-muted">${esc(T.themesSub)}</span></div>
      <div class="pf-themes">${tiles}</div>
    </div>`;
}

function render(data) {
  lastData = data;
  const { user, achievements, days, since, local } = data;
  const isOwn = local || (ownId && String(user?.id) === String(ownId));
  const refs = Number(local ? 0 : user?.referrals ?? 0) || 0;
  const boards = { ...data.boards, referrals: { score: refs, time: null } };
  const values = Object.fromEntries(AXES.map((ax) => [ax.id, Math.max(...ax.boards.map((b) => pct(b, boards)))]));
  const streakN = streakFromDays(days);
  const unlocked = new Set(achievements);
  const achvItems = [
    ...ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).map((a) => ({ emoji: a.emoji, hue: a.hue, title: achievementText(a.id, LANG)[0], desc: achievementText(a.id, LANG)[1] })),
    ...MAP_ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).map((a) => ({ emoji: a.emoji, hue: a.hue, title: mapAchievementText(a, LANG)[0], desc: mapAchievementText(a, LANG)[1] })),
  ];
  const medals = medalCounts(boards);
  const medalBadge = MEDAL_BOARDS.some((b) => medalFor(b, boards[b]))
    ? `<span class="pf-badge">${["gold", "silver", "bronze"].filter((t) => medals[t]).map((t) => `${MEDAL_ICON[t]} ${medals[t]}`).join(" · ")}</span>`
    : "";
  const earnedBoards = MEDAL_BOARDS.filter((b) => medalFor(b, boards[b]));
  const lockedBoards = MEDAL_BOARDS.filter((b) => !medalFor(b, boards[b]));
  const earnedTiles = earnedBoards.map((b) => {
    const tier = medalFor(b, boards[b]);
    const next = medalNextText(b, tier, LANG);
    return `
      <div class="pf-medal pf-medal--${tier}">
        <span class="pf-medal__art" data-medal3d="${tier}"></span>
        <span class="pf-medal__text">
          <b>${esc(boardName(b, LANG))}</b>
          <small>${esc(medalName(tier, LANG))}${next ? ` · ${esc(next)}` : ""}</small>
        </span>
      </div>`;
  }).join("");
  const lockedTiles = lockedBoards.map((b) => `
      <div class="pf-medal pf-medal--small">
        <span class="pf-medal__art pf-medal__art--none"><img src="${medalImage("bronze")}" alt="" /></span>
        <span class="pf-medal__text">
          <b>${esc(boardName(b, LANG))}</b>
          <small>${esc(medalNextText(b, null, LANG))}</small>
        </span>
      </div>`).join("");
  const avatar = user?.avatar ? `<img class="pf-avatar" src="${user.avatar}" alt="" />` : `<span class="pf-avatar pf-avatar--text">${esc(initials(user?.name))}</span>`;
  const sinceText = since ? T.since(new Intl.DateTimeFormat(LANG === "sr" ? "sr-Latn" : LANG, { day: "numeric", month: "long", year: "numeric" }).format(new Date(since))) : "";


  view.innerHTML = `
    <div class="pf-card pf-head view-enter">
      ${local ? `<span class="pf-avatar pf-avatar--text">👤</span>` : avatar}
      <div class="pf-head__text">
        <h1 class="pf-name">${esc(local ? T.localTitle : user.name)}</h1>
        ${!local && user.username ? `<div class="pf-user">@${esc(user.username)}</div>` : ""}
        <div class="pf-badges">
          ${streakN ? `<span class="pf-badge pf-badge--fire">🔥 ${esc(T.streak(streakN, plural(streakN, T.dayForms)))}</span>` : ""}
          ${medalBadge}
          ${refs ? `<span class="pf-badge">🤝 ${esc(T.friends(refs))}</span>` : ""}
          <span class="pf-badge">🏆 ${esc(T.achvCount(achvItems.length, ALL_ACHV))}</span>
          ${sinceText ? `<span class="pf-badge">${esc(sinceText)}</span>` : ""}
        </div>
      </div>
      ${local ? "" : `<button class="btn" type="button" data-share>${esc(T.share)}</button>`}
    </div>
    ${local ? `<div class="pf-card pf-note"><p>${esc(T.localNote)}</p><button class="btn btn--primary" type="button" data-account="login">${esc(TA.account.login)}</button></div>` : ""}
    <div class="pf-card pf-medals-card view-enter">
      <div class="pf-section-head"><h2>🏅 ${esc(T.medals)}</h2><span class="pill tnum">${earnedBoards.length} / ${MEDAL_BOARDS.length}</span></div>
      ${earnedTiles ? `<div class="pf-medals">${earnedTiles}</div>` : `<p class="pf-muted pf-medals-empty">${esc(T.noMedals)}</p>`}
      ${lockedTiles ? `<div class="pf-medals-locked">${lockedTiles}</div>` : ""}
    </div>
    <div class="pf-card pf-radar">
      <div class="pf-section-head"><h2>${esc(T.knowledge)}</h2><span class="pf-muted">${esc(T.knowledgeSub)}</span></div>
      ${radarSVG(values)}
    </div>
    ${themesHTML(isOwn, refs)}
    ${inviteHTML(isOwn, local, refs)}
    <div class="pf-card">
      <div class="pf-section-head"><h2>🏆 ${esc(T.achievements)}</h2><span class="pill tnum">${achvItems.length} / ${ALL_ACHV}</span></div>
      ${achvItems.length
        ? `<div class="pf-achv">${achvItems.map((a) => `<div class="pf-achv__item" style="--h:${a.hue}" title="${esc(a.desc)}"><span class="pf-achv__emoji">${a.emoji}</span><span class="pf-achv__title">${esc(a.title)}</span></div>`).join("")}</div>`
        : `<p class="pf-muted">${esc(T.achvNone)}</p>`}
    </div>`;
  document.title = local ? T.title : `${user.name} · ${T.title}`;
  mountMedals(view);
  if (location.hash && !render.scrolled) {
    render.scrolled = true;
    requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ block: "start" }));
  }
}

function renderMessage(title, sub) {
  view.innerHTML = `<div class="pf-card pf-empty"><h1 class="pf-name">${esc(title)}</h1>${sub ? `<p class="pf-muted">${esc(sub)}</p>` : ""}<a class="btn btn--primary" href="${pathFor(LANG, "countries")}">${esc(T.play)}</a></div>`;
}

async function load() {
  const id = profileId || ownId;
  if (!id) {
    const achv = Object.keys(readJSON(ACHV_KEY) || {});
    render({ user: null, boards: localBoards(), achievements: achv, days: streak.list(), since: null, local: true });
    return;
  }
  if (!profileId) history.replaceState(null, "", profilePath(LANG, id));
  try {
    const r = await fetch(`/api/profile?id=${encodeURIComponent(id)}`);
    if (r.status === 404) return renderMessage(T.notFound, T.notFoundSub);
    if (!r.ok) throw new Error(r.statusText);
    const data = await r.json();
    // свой профиль: подмешиваем то, что ещё не успело уйти на сервер
    if (String(id) === String(ownId)) {
      Object.entries(localBoards()).forEach(([b, v]) => {
        const sv = data.boards[b] || { score: 0, time: null };
        if (v.score > sv.score || (v.score === sv.score && v.time != null && (sv.time == null || v.time < sv.time))) data.boards[b] = { ...sv, score: v.score, time: v.time };
      });
      data.achievements = [...new Set([...data.achievements, ...Object.keys(readJSON(ACHV_KEY) || {})])];
      data.days = [...new Set([...data.days, ...streak.list()])];
    }
    render(data);
  } catch (e) {
    renderMessage(T.error, e.message);
  }
}

document.addEventListener("account:change", () => {
  if (!profileId) location.reload();
});

load();
