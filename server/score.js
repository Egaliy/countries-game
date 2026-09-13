/* Таблицы лидеров: у каждой игры и каждого режима своя (sorted set `lb:<id>`).
   timed: "full"   — время идёт в зачёт только при полном прохождении (как «Страны»);
          "always" — при равенстве очков выше тот, кто быстрее (викторины, поиск на карте).
   minTime — быстрее пройти невозможно, такое время считаем мусором. */
export const BOARDS = {
  countries: { max: 196, timed: "full", minTime: 60 },
  flags: { max: 196, timed: "always", minTime: 60 },
  capitals: { max: 196, timed: "always", minTime: 60 },
  bycapital: { max: 196, timed: "always", minTime: 60 },
  population: { max: 19600, timed: "always", minTime: 60 }, // сумма очков за 196 стран, до 100 за каждую // сколько стран Европы названо за одну партию «Стран»
  "states-type": { max: 50, timed: "full", minTime: 20 },
  "states-map": { max: 50, timed: "always", minTime: 20 },
  "russia-type": { max: 85, timed: "full", minTime: 30 },
  "russia-map": { max: 85, timed: "always", minTime: 30 },
};

export const MAX = BOARDS.countries.max;

export const getBoard = (id) => {
  const key = id == null || id === "" ? "countries" : String(id);
  return Object.hasOwn(BOARDS, key) ? { id: key, ...BOARDS[key] } : null;
};

export const lbKey = (b) => `lb:${b.id}`;

export const clampScore = (b, s) => Math.max(0, Math.min(b.max, Math.round(Number(s) || 0)));

export const validTime = (b, t) =>
  t != null && t !== "" && Number.isFinite(Number(t)) && Number(t) >= b.minTime ? Math.round(Number(t)) : null;

export const isTimed = (b, score) => b.timed === "always" || score >= b.max;

/* Составной балл: очки × 10000 + бонус за скорость */
export const composite = (b, score, time) => {
  const t = validTime(b, time);
  return score * 10000 + (isTimed(b, score) && t != null ? Math.max(1, 9999 - Math.min(9998, t)) : 0);
};

export const decompose = (b, comp) => {
  const score = Math.floor(comp / 10000);
  const rest = comp % 10000;
  return { score, time: isTimed(b, score) && rest > 0 ? validTime(b, 9999 - rest) : null };
};

/* Лучший результат игрока в таблице; у «Стран» есть старые поля best/bestTime */
export const boardBest = (user, b) => {
  const v = user?.boards?.[b.id];
  if (v) return { score: v.score || 0, time: v.time ?? null };
  if (b.id === "countries") return { score: user?.best || 0, time: user?.bestTime ?? null };
  return { score: 0, time: null };
};
