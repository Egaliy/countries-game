/* Темы оформления. Светлая — у всех; остальные открываются за друзей, пришедших по реферальной ссылке.
   Видны все, включить можно только открытые. Ранний выбор темы до загрузки стилей — inline-скрипт в HTML. */

export const THEME_KEY = "countries-game-theme-v1";

export const THEMES = [
  { id: "light", need: 0, icon: "☀️", dark: false, swatch: ["#f5f5f7", "#ffffff", "#0071e3"], name: { ru: "Светлая", en: "Light", sr: "Svetla" } },
  { id: "dark", need: 1, icon: "🌙", dark: true, swatch: ["#000000", "#1c1c1e", "#0a84ff"], name: { ru: "Тёмная", en: "Dark", sr: "Tamna" } },
  { id: "ocean", need: 3, icon: "🌊", dark: true, swatch: ["#06121f", "#0d2135", "#2ec4d6"], name: { ru: "Океан", en: "Ocean", sr: "Okean" } },
  { id: "sunset", need: 5, icon: "🌅", dark: false, swatch: ["#fff3ea", "#ffffff", "#f0544f"], name: { ru: "Закат", en: "Sunset", sr: "Zalazak" } },
  { id: "gold", need: 10, icon: "✨", dark: true, swatch: ["#0b0a08", "#17140f", "#e0b04a"], name: { ru: "Золото", en: "Gold", sr: "Zlato" } },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
export const themeName = (t, lang) => t.name[lang] || t.name.ru;
export const canUseTheme = (id, referrals) => (Number(referrals) || 0) >= themeById(id).need;

export function savedTheme() {
  try {
    return themeById(localStorage.getItem(THEME_KEY)).id;
  } catch {
    return "light";
  }
}

export function applyTheme(id) {
  const t = themeById(id);
  const root = document.documentElement;
  root.dataset.theme = t.id;
  if (t.dark) root.dataset.dark = "";
  else delete root.dataset.dark;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.swatch[0]);
  try {
    localStorage.setItem(THEME_KEY, t.id);
  } catch {
    /* приватный режим */
  }
  document.dispatchEvent(new CustomEvent("theme:change", { detail: t.id }));
}
