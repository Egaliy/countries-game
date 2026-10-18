/* Общее для всех разделов сайта: язык и раздел из адреса, пути, верхняя полоска. */

/* Основной язык — английский, без префикса. Русский — /ru, сербский — /rs (/sr тоже работает).
   Порядок LANGS — порядок строк в меню настроек. */
export const LANGS = ["en", "ru", "sr"];
export const DEFAULT_LANG = "en";
const LANG_SEG = { en: "", ru: "ru", sr: "rs" };
export const LANG_NAMES = { en: "English", ru: "Русский", sr: "Srpski" };
/* Выбор в настройках; при заходе на адрес без префикса inline-скрипт в HTML переводит на этот язык. */
export const LANG_KEY = "countries-game-lang-v1";

export const SECTIONS = [
  { id: "countries", icon: "🌍", slug: "" },
  { id: "states", icon: "🗽", slug: "states" },
  { id: "russia", icon: "🇷🇺", slug: "russia" },
];

export const SITE_TEXT = {
  ru: {
    sections: "Разделы",
    themes: "Темы",
    settings: "Настройки",
    language: "Язык",
    names: { countries: "Страны мира", states: "Штаты США", russia: "Регионы России" },
  },
  en: {
    sections: "Sections",
    themes: "Themes",
    settings: "Settings",
    language: "Language",
    names: { countries: "Countries of the World", states: "US States", russia: "Regions of Russia" },
  },
  sr: {
    sections: "Odeljci",
    themes: "Teme",
    settings: "Podešavanja",
    language: "Jezik",
    names: { countries: "Države sveta", states: "Američke države", russia: "Regioni Rusije" },
  },
};

/* /, /ru, /rs · /states, /ru/states, /rs/russia … (/en/… — старые ссылки, тоже английский) */
export function parsePath(pathname = location.pathname) {
  const segs = pathname.split("/").filter(Boolean);
  let lang = DEFAULT_LANG;
  if (segs[0] === "ru") {
    lang = "ru";
    segs.shift();
  } else if (segs[0] === "en") {
    segs.shift();
  } else if (segs[0] === "rs" || segs[0] === "sr") {
    lang = "sr";
    segs.shift();
  }
  if (segs[0] === "profile") return { lang, section: "profile", profileId: /^\d{1,15}$/.test(segs[1] || "") ? segs[1] : null };
  const sec = SECTIONS.find((s) => s.slug && s.slug === segs[0]);
  return { lang, section: sec ? sec.id : "countries" };
}

export function pathFor(lang, section) {
  const slug = section === "profile" ? "profile" : SECTIONS.find((s) => s.id === section)?.slug || "";
  const parts = [LANG_SEG[lang], slug].filter(Boolean);
  return `/${parts.join("/")}`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

export const profilePath = (lang, id) => `${pathFor(lang, "profile")}${id ? `/${id}` : ""}`;

/* Разделы — иконками; у открытого рядом название. Язык при переходе сохраняется. */
export function topbarHTML({ lang, section, leaderboardLabel, rightExtra = "", langHref = (l) => pathFor(l, section) }) {
  const text = SITE_TEXT[lang] || SITE_TEXT[DEFAULT_LANG];
  const items = SECTIONS.map((s) => {
    const current = s.id === section;
    const name = esc(text.names[s.id]);
    return `<a class="sections__item" href="${pathFor(lang, s.id)}"${current ? ' aria-current="page"' : ""} title="${name}" aria-label="${name}"><span class="sections__icon" aria-hidden="true">${s.icon}</span>${current ? `<span class="sections__label">${name}</span>` : ""}</a>`;
  }).join("");
  return `
    <div class="topbar">
      <div class="topbar__left">
        <nav class="sections" aria-label="${esc(text.sections)}">${items}</nav>
      </div>
      <div class="topbar__right">
        <span class="streak" id="streak"></span>
        <button class="leaders-btn" type="button" data-view="leaders" title="${esc(leaderboardLabel)}" aria-label="${esc(leaderboardLabel)}"><span class="leaders-btn__icon">🏅</span></button>
        ${rightExtra}
        ${settingsHTML({ lang, langHref })}
        <div class="topbar__account" id="account-slot"></div>
      </div>
    </div>`;
}

/* ── Настройки: шестерёнка → поповер с выбором языка ──
   Строки — обычные ссылки на тот же раздел на другом языке; выбор запоминается в LANG_KEY. */
const GEAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const CHECK = `<svg class="settings__check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function settingsHTML({ lang, langHref, cls = "" }) {
  const text = SITE_TEXT[lang] || SITE_TEXT[DEFAULT_LANG];
  const rows = LANGS.map(
    (l) =>
      `<a class="settings__row" href="${langHref(l)}" data-lang="${l}" lang="${l === "sr" ? "sr-Latn" : l}" hreflang="${l === "sr" ? "sr" : l}"${l === lang ? ' aria-current="true"' : ""}><span>${LANG_NAMES[l]}</span>${l === lang ? CHECK : ""}</a>`,
  ).join("");
  return `<div class="settings${cls ? ` ${cls}` : ""}" data-settings>
          <button class="settings__btn" type="button" aria-haspopup="dialog" aria-expanded="false" title="${esc(text.settings)}" aria-label="${esc(text.settings)}">${GEAR}</button>
          <div class="settings__menu" role="dialog" aria-label="${esc(text.settings)}" hidden>
            <p class="settings__title">${esc(text.settings)}</p>
            <p class="settings__label">${esc(text.language)}</p>
            <div class="settings__list">${rows}</div>
          </div>
        </div>`;
}

export function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {}
}

/* Один делегированный обработчик на документ: работает для любой полоски, сколько бы раз её ни перерисовали. */
if (typeof document !== "undefined" && !window.__settingsBound) {
  window.__settingsBound = true;
  const close = (box, focus) => {
    const btn = box.querySelector(".settings__btn");
    box.querySelector(".settings__menu").hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (focus) btn.focus();
  };
  const closeAll = (except) => document.querySelectorAll("[data-settings]").forEach((b) => b !== except && close(b));
  document.addEventListener("click", (e) => {
    const row = e.target.closest(".settings__row");
    if (row) {
      saveLang(row.dataset.lang);
      return; // дальше — обычный переход по ссылке
    }
    const btn = e.target.closest(".settings__btn");
    if (btn) {
      const box = btn.closest("[data-settings]");
      const menu = box.querySelector(".settings__menu");
      const open = menu.hidden;
      closeAll(box);
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) {
        // не даём поповеру вылезти за край экрана (на телефоне полоска переносится и кнопка не у правого края)
        menu.style.right = "";
        const r = menu.getBoundingClientRect();
        const gap = 12;
        const shift = r.left < gap ? r.left - gap : r.right > innerWidth - gap ? r.right - (innerWidth - gap) : 0;
        if (shift) menu.style.right = `${parseFloat(getComputedStyle(menu).right) + shift}px`;
      }
      if (open) (menu.querySelector('[aria-current="true"]') || menu.querySelector(".settings__row"))?.focus({ preventScroll: true });
      return;
    }
    if (!e.target.closest(".settings__menu")) closeAll();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = [...document.querySelectorAll("[data-settings]")].find((b) => !b.querySelector(".settings__menu").hidden);
    if (open) close(open, true);
  });
}
