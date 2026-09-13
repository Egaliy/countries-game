/* Медали за режим: 🥉 бронза, 🥈 серебро, 🥇 золото — за количество (стран, верных ответов, найденных с первого раза).
   Считаются по лучшему результату в таблице ({ score, time }), поэтому одинаково видны
   в профиле, в таблице лидеров и у любого игрока. */

export const MEDAL_BOARDS = ["countries", "flags", "capitals", "bycapital", "population", "states-type", "states-map", "russia-type", "russia-map", "referrals"];
export const MEDAL_ICON = { gold: "🥇", silver: "🥈", bronze: "🥉" };
const RANK = { bronze: 1, silver: 2, gold: 3 };
const HUE = { gold: 45, silver: 215, bronze: 22 };
const SEEN_KEY = "countries-game-medals-v1";

/* Медали за количество, время не учитывается */
const RULES = {
  countries: { kind: "count", noun: "named", bronze: 120, silver: 150, gold: 180, max: 196 },
  flags: { kind: "count", noun: "correct", bronze: 120, silver: 150, gold: 180, max: 196 },
  capitals: { kind: "count", noun: "correct", bronze: 120, silver: 150, gold: 180, max: 196 },
  bycapital: { kind: "count", noun: "correct", bronze: 120, silver: 150, gold: 180, max: 196 },
  population: { kind: "acc", per: 196, bronze: 60, silver: 75, gold: 90 },
  "states-type": { kind: "count", noun: "named", bronze: 30, silver: 38, gold: 46, max: 50 },
  "states-map": { kind: "count", noun: "firstTry", bronze: 30, silver: 38, gold: 46, max: 50 },
  "russia-type": { kind: "count", noun: "named", bronze: 51, silver: 65, gold: 78, max: 85 },
  "russia-map": { kind: "count", noun: "firstTry", bronze: 51, silver: 65, gold: 78, max: 85 },
  referrals: { kind: "abs", bronze: 1, silver: 5, gold: 10 }, // друзья по реферальной ссылке
};

const TEXT = {
  ru: {
    label: "Медаль",
    fresh: "Новая медаль!",
    names: { gold: "Золото", silver: "Серебро", bronze: "Бронза" },
    next: { gold: "До золота", silver: "До серебра", bronze: "До бронзы" },
    boards: {
      countries: "Страны", flags: "Флаги", capitals: "Столицы", bycapital: "По столице", population: "Население",
      "states-type": "Штаты США · вписать", "states-map": "Штаты США · карта", "russia-type": "Регионы России · вписать", "russia-map": "Регионы России · карта",
      referrals: "Друзья",
    },
    friends: (n) => `пригласить ${n} ${n === 1 ? "друга" : "друзей"}`,
    count: (k, n, noun) => (noun === "named" ? `назвать ${k} из ${n}` : `${k} из ${n} ${noun === "firstTry" ? "с первого раза" : "верно"}`),
    acc: (p) => `точность ${p}%`,
  },
  en: {
    label: "Medal",
    fresh: "New medal!",
    names: { gold: "Gold", silver: "Silver", bronze: "Bronze" },
    next: { gold: "Gold", silver: "Silver", bronze: "Bronze" },
    boards: {
      countries: "Countries", flags: "Flags", capitals: "Capitals", bycapital: "By capital", population: "Population",
      "states-type": "US States · type", "states-map": "US States · map", "russia-type": "Russian regions · type", "russia-map": "Russian regions · map",
      referrals: "Friends",
    },
    friends: (n) => `invite ${n} friend${n === 1 ? "" : "s"}`,
    count: (k, n, noun) => (noun === "named" ? `name ${k} of ${n}` : `${k} of ${n} ${noun === "firstTry" ? "first try" : "correct"}`),
    acc: (p) => `${p}% accuracy`,
  },
  sr: {
    label: "Medalja",
    fresh: "Nova medalja!",
    names: { gold: "Zlato", silver: "Srebro", bronze: "Bronza" },
    next: { gold: "Do zlata", silver: "Do srebra", bronze: "Do bronze" },
    boards: {
      countries: "Države", flags: "Zastave", capitals: "Glavni gradovi", bycapital: "Po glavnom gradu", population: "Stanovništvo",
      "states-type": "Američke države · upis", "states-map": "Američke države · mapa", "russia-type": "Regioni Rusije · upis", "russia-map": "Regioni Rusije · mapa",
      referrals: "Prijatelji",
    },
    friends: (n) => `pozovite ${n} prijatelja`,
    count: (k, n, noun) => (noun === "named" ? `upišite ${k} od ${n}` : `${k} od ${n} ${noun === "firstTry" ? "iz prvog puta" : "tačno"}`),
    acc: (p) => `tačnost ${p}%`,
  },
};

const tx = (lang) => TEXT[lang] || TEXT.ru;

export function medalFor(board, best) {
  const r = RULES[board];
  if (!r || !best) return null;
  const score = Number(best.score) || 0;
  const value = r.kind === "acc" ? score / r.per : score;
  return value >= r.gold ? "gold" : value >= r.silver ? "silver" : value >= r.bronze ? "bronze" : null;
}

export const nextTier = (tier) => (tier === "gold" ? null : tier === "silver" ? "gold" : tier === "bronze" ? "silver" : "bronze");
export const medalName = (tier, lang) => tx(lang).names[tier];
export const freshMedalText = (lang) => tx(lang).fresh;
export const boardName = (board, lang) => tx(lang).boards[board] || board;

/* Условие медали словами: «все 196 быстрее 6:00», «157 из 196 верно», «точность 75%» */
export function medalGoal(board, tier, lang) {
  const r = RULES[board];
  const t = tx(lang);
  if (r.kind === "count") return t.count(r[tier], r.max, r.noun);
  if (r.kind === "abs") return t.friends(r[tier]);
  return t.acc(r[tier]);
}

export const medalNextText = (board, tier, lang) => {
  const next = nextTier(tier);
  return next ? `${tx(lang).next[next]}: ${medalGoal(board, next, lang)}` : "";
};

export function medalCounts(bests) {
  const out = { gold: 0, silver: 0, bronze: 0 };
  MEDAL_BOARDS.forEach((b) => {
    const m = medalFor(b, bests[b]);
    if (m) out[m] += 1;
  });
  return out;
}

/* Новые или улучшенные медали → карточка. silent: только запомнить (при загрузке страницы) */
export function checkMedals(bests, { notify, lang, silent = false }) {
  let seen = {};
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") || {};
  } catch {
    seen = {};
  }
  let changed = false;
  const fresh = [];
  Object.entries(bests || {}).forEach(([board, best]) => {
    const tier = medalFor(board, best);
    if (!tier || (seen[board] && RANK[seen[board]] >= RANK[tier])) return;
    seen[board] = tier;
    changed = true;
    fresh.push({ board, tier });
    if (!silent) {
      notify?.({
        notice: true,
        cls: `achv--medal achv--medal-${tier}`,
        emoji: MEDAL_ICON[tier],
        hue: HUE[tier],
        label: tx(lang).label,
        title: `${medalName(tier, lang)} · ${boardName(board, lang)}`,
        desc: medalGoal(board, tier, lang),
      });
    }
  });
  if (changed) {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch {
      /* приватный режим */
    }
  }
  return fresh;
}
