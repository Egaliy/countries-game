/* Стрик общий для всех разделов: день засчитывается первым верным ответом в любой игре. */

const KEY = "countries-game-streak-v1";
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const pluralFor = (lang) => (n, [one, few, many]) => {
  if (lang === "en") return n === 1 ? one : many;
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

/* Текущий стрик по списку дней (для чужого профиля) */
export function streakFromDays(list) {
  const days = new Set((list || []).filter((d) => DAY.test(d)));
  const today = localDay();
  const yesterday = localDay(new Date(Date.now() - 864e5));
  let cursor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  let n = 0;
  while (cursor && days.has(cursor)) {
    n += 1;
    const [y, m, d] = cursor.split("-").map(Number);
    cursor = localDay(new Date(y, m - 1, d - 1));
  }
  return n;
}

export function createStreak({ node, t, lang }) {
  const plural = pluralFor(lang);

  const load = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}");
      return new Set((v.days || []).filter((d) => DAY.test(d)));
    } catch {
      return new Set();
    }
  };
  let days = load();
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ days: [...days].sort().slice(-400) }));
    } catch {
      /* приватный режим */
    }
  };

  function count() {
    const today = localDay();
    const yesterday = localDay(new Date(Date.now() - 864e5));
    let cursor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
    let n = 0;
    while (cursor && days.has(cursor)) {
      n += 1;
      const [y, m, d] = cursor.split("-").map(Number);
      cursor = localDay(new Date(y, m - 1, d - 1));
    }
    return n;
  }

  function render(justLit = false) {
    if (!node) return;
    const n = count();
    const lit = days.has(localDay());
    const w = plural(n, t.dayForms);
    node.innerHTML = `<span class="streak__icon">🔥</span><span class="tnum">${n}</span>`;
    node.classList.toggle("is-lit", lit);
    node.title = n ? (lit ? t.tipLit(n, w) : t.tipCold(n, w)) : t.tipNone;
    if (justLit) {
      node.classList.remove("is-pop");
      void node.offsetWidth;
      node.classList.add("is-pop");
    }
  }

  /* Возвращает карточку уведомления, если огонёк зажёгся только что */
  function mark() {
    const today = localDay();
    if (days.has(today)) return null;
    days.add(today);
    save();
    render(true);
    const n = count();
    return { notice: true, cls: "achv--fire", emoji: "🔥", hue: 25, label: t.label, title: t.title(n, plural(n, t.dayForms)), desc: t.desc };
  }

  function merge(list) {
    let changed = false;
    (list || []).forEach((d) => {
      if (DAY.test(d) && !days.has(d)) {
        days.add(d);
        changed = true;
      }
    });
    if (changed) {
      save();
      render(false);
    }
  }

  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    days = load();
    render(false);
  });

  return { count, render, mark, merge, list: () => [...days] };
}
