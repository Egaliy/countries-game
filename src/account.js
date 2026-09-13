// Вход через Telegram, синхронизация рекорда и таблица лидеров.
import { profilePath, pathFor } from "./shared/site.js";
import { medalFor, medalName, MEDAL_ICON, checkMedals } from "./shared/medals.js";
import { THEMES, applyTheme, savedTheme, themeName } from "./shared/themes.js";

const REF_KEY = "countries-game-ref-v1";
const THEMES_SEEN_KEY = "countries-game-themes-seen-v1";
// Сервер: api/auth/start, api/auth/status, api/score, api/leaderboard, api/me.

const SESSION_KEY = "countries-game-session-v1";

const TG_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.4 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L5.9 13.6l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.5 3.3c.9-.3 1.7.2 1.4 1.1z"/></svg>`;

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

const initials = (name) =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

const avatarHTML = (u, cls = "avatar") =>
  u?.avatar
    ? `<img class="${cls}" src="${u.avatar}" alt="" />`
    : `<span class="${cls} ${cls}--text">${esc(initials(u?.name))}</span>`;

export function createAccount({ lang, t, root, mount, onLeaders, onAchievements, onStreak, notify, bestScore, bestScores, localAchievements, localStreak }) {
  const state = { session: null, user: null, waiting: false, cancel: null, pendingUrl: "" };

  /* ── хранение ── */
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (saved?.session && saved?.user) {
      state.session = saved.session;
      state.user = saved.user;
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
  /* Реферальная ссылка ?ref=<id>: запоминаем первого пригласившего и убираем параметр из адреса */
  try {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref !== null) {
      if (/^\d{1,15}$/.test(ref) && ref !== String(state.user?.id || "") && !localStorage.getItem(REF_KEY)) localStorage.setItem(REF_KEY, ref);
      params.delete("ref");
      const q = params.toString();
      history.replaceState(null, "", `${location.pathname}${q ? `?${q}` : ""}${location.hash}`);
    }
  } catch {
    /* ignore */
  }

  const persist = () => {
    if (state.session) localStorage.setItem(SESSION_KEY, JSON.stringify({ session: state.session, user: state.user }));
    else localStorage.removeItem(SESSION_KEY);
  };

  /* ── API ── */
  const api = async (path, opts = {}) => {
    const r = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { status: r.status });
    return j;
  };

  /* ── разметка ── */
  const widget = document.createElement("div");
  widget.className = "account";
  (mount || root).appendChild(widget);

  function renderWidget() {
    if (state.waiting) {
      widget.innerHTML = `
        <div class="account__wait">
          <span class="spinner" aria-hidden="true"></span>
          <span class="account__wait-text">${esc(t.waiting)}</span>
          <a class="btn btn--primary" href="${esc(state.pendingUrl)}" target="_blank" rel="noopener">${esc(t.openTelegram)}</a>
          <button class="btn btn--quiet" type="button" data-account="cancel">${esc(t.cancel)}</button>
        </div>`;
      return;
    }
    if (state.user) {
      widget.innerHTML = `
        <button class="account__me" type="button" data-account="menu" aria-haspopup="true" aria-expanded="false" title="${esc(state.user.name)}">
          ${avatarHTML(state.user)}
          <span class="account__name">${esc(state.user.name)}</span>
        </button>
        <div class="account__menu" id="account-menu" hidden>
          <div class="account__who">${avatarHTML(state.user)}<span>${esc(state.user.name)}${state.user.username ? `<small>@${esc(state.user.username)}</small>` : ""}</span></div>
          <a class="account__item" href="${profilePath(lang, state.user.id)}">👤 ${esc(t.profile)}</a>
          <a class="account__item" href="${profilePath(lang, state.user.id)}#invite">🎁 ${esc(t.invite)}</a>
          <button class="account__item" type="button" data-account="leaders">🏅 ${esc(t.leaderboard)}</button>
          <button class="account__item" type="button" data-account="achievements">🏆 ${esc(t.achievements)}</button>
          <button class="account__item account__item--danger" type="button" data-account="logout">${esc(t.logout)}</button>
        </div>`;
      return;
    }
    widget.innerHTML = `
      <button class="account__login" type="button" data-account="login">
        <span class="account__tg">${TG_ICON}</span>
        <span class="account__login-text">${esc(t.loginShort)}</span>
      </button>`;
  }

  /* ── вход ── */
  async function login() {
    if (state.waiting) return;
    // Окно открываем синхронно, внутри жеста пользователя, иначе браузер его заблокирует.
    // Текущую страницу игры никогда не трогаем.
    let win = null;
    try {
      win = window.open("about:blank", "_blank");
    } catch {
      win = null;
    }
    let start;
    try {
      let ref = null;
      try {
        ref = localStorage.getItem(REF_KEY);
      } catch {
        ref = null;
      }
      start = await api("/api/auth/start", { method: "POST", body: JSON.stringify({ lang, ref }) });
    } catch (e) {
      try {
        win?.close();
      } catch {
        /* ignore */
      }
      notify({ notice: true, emoji: "⚠️", hue: 20, label: "Telegram", title: t.error, desc: e.message });
      return;
    }
    state.pendingUrl = start.url;
    if (win) {
      try {
        win.location.href = start.url;
      } catch {
        /* окно уже закрыто — останется кнопка-ссылка */
      }
    }
    state.waiting = true;
    renderWidget();

    let stopped = false;
    const startedAt = Date.now();
    state.cancel = () => {
      stopped = true;
      state.waiting = false;
      renderWidget();
    };
    const poll = async () => {
      if (stopped) return;
      if (Date.now() - startedAt > 10 * 60 * 1000) return state.cancel();
      try {
        const r = await api(`/api/auth/status?token=${encodeURIComponent(start.token)}`);
        if (r.expired) return state.cancel();
        if (r.done) {
          stopped = true;
          state.waiting = false;
          state.session = r.session;
          state.user = r.user;
          persist();
          renderWidget();
          notify({
            notice: true,
            cls: "achv--tg",
            emoji: "✈️",
            hue: 200,
            label: "Telegram",
            title: t.welcome(state.user.name),
            desc: t.welcomeSub,
          });
          syncAllBest();
          syncAchievements(localAchievements?.() || {});
          syncStreak(localStreak?.() || []);
          syncUser();
          document.dispatchEvent(new CustomEvent("account:change"));
          return;
        }
      } catch {
        /* сеть моргнула — пробуем дальше */
      }
      window.setTimeout(poll, document.hidden ? 4000 : 2000);
    };
    window.setTimeout(poll, 1500);
    document.addEventListener("visibilitychange", () => !document.hidden && !stopped && poll(), { once: true });
  }

  function logout() {
    state.session = null;
    state.user = null;
    persist();
    renderWidget();
    document.dispatchEvent(new CustomEvent("account:change"));
  }

  /* ── рекорд ── */
  /* Одинаковый результат в одну таблицу за загрузку страницы отправляем один раз; решает сервер */
  const lastSynced = new Map();
  const normBest = (b) => (typeof b === "object" && b ? { score: Number(b.score) || 0, time: b.time ?? null } : { score: Number(b) || 0, time: null });
  async function syncBest(best, board = "countries") {
    const { score, time } = normBest(best);
    if (!state.session || score <= 0) return null;
    const key = `${score}:${time ?? ""}`;
    if (lastSynced.get(board) === key) return null;
    lastSynced.set(board, key);
    try {
      const r = await api("/api/score", { method: "POST", body: JSON.stringify({ session: state.session, board, score, time }) });
      state.user = { ...state.user, ...r.user };
      persist();
      renderWidget();
      return r;
    } catch (e) {
      lastSynced.delete(board);
      if (e.status === 401) logout();
      return null;
    }
  }

  function syncAllBest() {
    const all = bestScores ? bestScores() : bestScore ? { countries: bestScore() } : {};
    Object.entries(all).forEach(([board, best]) => syncBest(best, board));
  }

  /* ── друзья и темы: тема с сервера, медаль «Друзья», карточка про новую тему ── */
  function syncUser() {
    const u = state.user;
    if (!u) return;
    if (u.theme && u.theme !== savedTheme()) applyTheme(u.theme);
    const refs = Number(u.referrals) || 0;
    checkMedals({ referrals: { score: refs } }, { lang, notify });
    let seen = 0;
    try {
      seen = Number(localStorage.getItem(THEMES_SEEN_KEY)) || 0;
    } catch {
      seen = 0;
    }
    THEMES.filter((th) => th.need > seen && refs >= th.need).forEach((th) =>
      notify({ notice: true, cls: "achv--theme", emoji: th.icon, hue: 290, label: t.themeLabel, title: themeName(th, lang), desc: t.themeUnlocked(themeName(th, lang)) }),
    );
    if (refs > seen) {
      try {
        localStorage.setItem(THEMES_SEEN_KEY, String(refs));
      } catch {
        /* ignore */
      }
    }
    document.dispatchEvent(new CustomEvent("account:user"));
  }

  async function setTheme(id) {
    applyTheme(id);
    if (!state.session) return;
    try {
      const r = await api("/api/me", { method: "POST", body: JSON.stringify({ session: state.session, theme: id }) });
      state.user = { ...state.user, ...r.user };
      persist();
    } catch (e) {
      if (e.status === 401) logout();
    }
  }

  const referralLink = () => (state.user ? `${location.origin}${pathFor(lang, "countries")}?ref=${state.user.id}` : "");

  /* ── стрик привязан к аккаунту ── */
  let streakTimer = null;
  function syncStreak(days) {
    if (!state.session) return;
    window.clearTimeout(streakTimer);
    streakTimer = window.setTimeout(async () => {
      try {
        const r = await api("/api/streak", { method: "POST", body: JSON.stringify({ session: state.session, days }) });
        onStreak?.(r.days || []);
      } catch (e) {
        if (e.status === 401) logout();
      }
    }, 400);
  }

  /* ── достижения привязаны к аккаунту ── */
  let achvTimer = null;
  function syncAchievements(local) {
    if (!state.session) return;
    window.clearTimeout(achvTimer);
    achvTimer = window.setTimeout(async () => {
      try {
        const r = await api("/api/achievements", { method: "POST", body: JSON.stringify({ session: state.session, unlocked: local }) });
        onAchievements?.(r.achievements || {});
      } catch (e) {
        if (e.status === 401) logout();
      }
    }, 400);
  }

  /* ── таблица лидеров (вкладка): у каждой игры и режима своя, переключаются вкладками ── */
  let lbContainer = null;
  let lbOpts = { boards: [{ id: "countries", label: "", sub: t.leaderboardSub }], active: "countries" };

  function openLeaderboard() {
    onLeaders?.();
  }

  const activeBoard = () => lbOpts.boards.find((b) => b.id === lbOpts.active) || lbOpts.boards[0];

  const lbTabsHTML = () =>
    lbOpts.boards.length > 1
      ? `<div class="lb-tabs" role="tablist">${lbOpts.boards
          .map(
            (b) =>
              `<button class="lb-tab" type="button" role="tab" data-lb-board="${esc(b.id)}" aria-selected="${b.id === activeBoard().id}">${esc(b.label)}</button>`,
          )
          .join("")}</div>`
      : "";

  async function renderLeaderboardInto(container, opts) {
    lbContainer = container;
    if (opts) lbOpts = { ...lbOpts, ...opts };
    const board = activeBoard();
    container.innerHTML = `
      <div class="lb-card view-enter">
        <div class="sheet__head">
          <h2 class="sheet__title">🏅 ${esc(t.leaderboard)}</h2>
        </div>
        ${lbTabsHTML()}
        <p class="sheet__muted">${esc(t.loading)}</p>
      </div>`;
    try {
      const q = new URLSearchParams({ board: board.id });
      if (state.session) q.set("session", state.session);
      const data = await api(`/api/leaderboard?${q}`);
      if (lbContainer !== container || activeBoard().id !== board.id) return;
      renderLeaderboard(data, board);
    } catch (e) {
      const node = container.querySelector(".sheet__muted");
      if (node) node.textContent = `${t.error}: ${e.message}`;
    }
  }

  function tiersFor(max, board) {
    const f = board.format || ((v) => v);
    const [a, b, c] = max === 196 ? [150, 100, 50] : [0.75, 0.5, 0.25].map((k) => Math.ceil(max * k));
    return [
      { key: "all", min: max, label: board.allLabel || t.tiers.all(f(max)) },
      { key: "t150", min: a, label: t.tiers.atLeast(f(a)) },
      { key: "t100", min: b, label: t.tiers.range(f(b), f(a - 1)) },
      { key: "t50", min: c, label: t.tiers.range(f(c), f(b - 1)) },
      { key: "rest", min: 0, label: t.tiers.below(f(c)) },
    ];
  }

  const medalHTML = (boardId, best) => {
    const m = medalFor(boardId, best);
    return m ? `<span class="lb__medal" title="${esc(medalName(m, lang))}">${MEDAL_ICON[m]}</span>` : "";
  };

  function renderLeaderboard({ rows, me, total, max }, board) {
    const tiers = tiersFor(max || 196, board);
    const f = board.format || ((v) => v);
    const tierOf = (score) => tiers.find((x) => score >= x.min) || tiers[tiers.length - 1];
    let lastTier = null;
    const list = rows.length
      ? rows
          .map((r) => {
            const tier = tierOf(r.score);
            const head = tier !== lastTier ? `<li class="lb__tier lb__tier--${tier.key}">${esc(tier.label)}</li>` : "";
            lastTier = tier;
            return `${head}
        <li class="lb__row lb__row--${tier.key}${me && String(me.id) === String(r.id) ? " is-me" : ""}">
          <span class="lb__rank tnum">${r.rank}</span>
          ${avatarHTML(r, "lb__avatar")}
          <a class="lb__name lb__link" href="${profilePath(lang, r.id)}">${esc(r.name)}${medalHTML(board.id, r)}${r.username ? `<span class="lb__user">@${esc(r.username)}</span>` : ""}</a>
          <span class="lb__score tnum">${f(r.score)}${r.time != null ? `<small class="lb__time">${fmt(r.time)}</small>` : ""}</span>
        </li>`;
          })
          .join("")
      : `<li class="sheet__muted">${esc(t.empty)}</li>`;
    const mine = me
      ? `<div class="lb__me">${avatarHTML(me, "lb__avatar")}<a class="lb__name lb__link" href="${profilePath(lang, me.id)}">${esc(me.name)}${medalHTML(board.id, { score: me.best, time: me.bestTime })}</a><span class="lb__score tnum">${f(me.best)}${me.bestTime != null ? `<small class="lb__time">${fmt(me.bestTime)}</small>` : ""}</span><span class="pill tnum">${me.rank ? t.yourPlace(me.rank) : "—"}</span></div>`
      : `<button class="btn btn--primary" type="button" data-account="login">${TG_ICON} ${esc(t.login)}</button>`;
    lbContainer.innerHTML = `
      <div class="lb-card">
        <div class="sheet__head">
          <h2 class="sheet__title">🏅 ${esc(t.leaderboard)}</h2>
          <span class="pill tnum">${total}</span>
        </div>
        ${lbTabsHTML()}
        <p class="sheet__muted">${esc(board.sub || t.leaderboardSub)}</p>
        <ol class="lb">${list}</ol>
        <div class="sheet__foot">${mine}</div>
      </div>`;
  }

  /* ── блок на экране результата ── */
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  function resultHTML(score) {
    if (state.user) {
      return `
        <div class="cta cta--done" id="result-cta">
          ${avatarHTML(state.user, "cta__avatar")}
          <div class="cta__text">
            <div class="cta__title">${esc(t.sent)}</div>
            <div class="cta__sub" data-rank>${esc(t.loading)}</div>
          </div>
          <button class="btn" type="button" data-account="leaders">${esc(t.leaders)}</button>
        </div>`;
    }
    return `
      <div class="cta" id="result-cta">
        <span class="cta__icon">${TG_ICON}</span>
        <div class="cta__text">
          <div class="cta__title" data-rank>${esc(t.ctaTitle)}</div>
          <div class="cta__sub">${esc(t.ctaText)}</div>
        </div>
        <button class="btn btn--primary" type="button" data-account="login">${esc(t.login)}</button>
      </div>`;
  }

  async function hydrateResult(best, board = "countries") {
    const node = root.querySelector("#result-cta [data-rank]");
    if (!node) return;
    const { score, time } = normBest(best);
    if (!state.user) {
      try {
        const q = new URLSearchParams({ board, score: String(score) });
        if (time != null) q.set("time", String(time));
        const r = await api(`/api/rank?${q}`);
        if (r.total > 0) node.textContent = t.wouldBe(r.rank, r.total + 1);
      } catch {
        /* оставляем заголовок по умолчанию */
      }
      return;
    }
    const r =
      (await syncBest(best, board)) ||
      (await api(`/api/leaderboard?board=${encodeURIComponent(board)}&session=${encodeURIComponent(state.session)}`)
        .then((d) => d.me)
        .catch(() => null));
    const rank = r?.rank;
    node.textContent = rank ? t.yourPlace(rank) : t.sentSub;
  }

  /* ── события ── */
  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-lb-board]");
    if (tab && lbContainer) {
      lbOpts.active = tab.dataset.lbBoard;
      renderLeaderboardInto(lbContainer);
      return;
    }
    const b = e.target.closest("[data-account]");
    if (!b) return;
    const a = b.dataset.account;
    if (a === "login") login();
    else if (a === "logout") logout();
    else if (a === "cancel") state.cancel?.();
    else if (a === "leaders") openLeaderboard();
    else if (a === "menu") {
      const menu = widget.querySelector("#account-menu");
      const open = menu.hidden;
      menu.hidden = !open;
      b.setAttribute("aria-expanded", String(open));
    }
  });
  document.addEventListener("click", (e) => {
    const menu = widget.querySelector("#account-menu");
    if (menu && !menu.hidden && !widget.contains(e.target)) menu.hidden = true;
  });

  renderWidget();

  /* Освежаем профиль (аватар мог смениться) */
  if (state.session) {
    api(`/api/me?session=${encodeURIComponent(state.session)}`)
      .then((r) => {
        state.user = r.user;
        persist();
        renderWidget();
        syncUser();
        syncAllBest();
        if (r.achievements) onAchievements?.(r.achievements);
        if (r.days) onStreak?.(r.days);
        syncAchievements(localAchievements?.() || {});
        syncStreak(localStreak?.() || []);
      })
      .catch((e) => {
        if (e.status === 401) logout();
      });
  }

  return {
    get user() {
      return state.user;
    },
    login,
    logout,
    syncBest,
    syncAllBest,
    setTheme,
    referralLink,
    syncAchievements,
    syncStreak,
    openLeaderboard,
    renderLeaderboardInto,
    resultHTML,
    hydrateResult,
  };
}
