/* Достижения игр с картой. Хранятся вместе с достижениями «Стран» (countries-game-achievements-v1)
   и так же уходят на сервер. События: guess (засчитан при вводе), typeFinish, mapHit, mapFinish. */

const GAMES = {
  states: { p: "us", total: 50, fast: 300, run: 15 },
  russia: { p: "ru", total: 85, fast: 720, run: 20 },
};

const L = (ru, en, sr) => ({ ru, en, sr });

/* Общие для каждой игры: [суффикс, события, эмодзи, оттенок, проверка, тексты по игре] */
const COMMON = [
  ["first", ["guess"], "👣", 200, (x) => x.guessed.size >= 1, {
    states: L(["Hello, America", "Назовите первый штат."], ["Hello, America", "Name your first state."], ["Zdravo, Ameriko", "Upišite prvu državu."]),
    russia: L(["Привет, Россия", "Назовите первый регион России."], ["Privet, Russia", "Name your first Russian region."], ["Zdravo, Rusijo", "Upišite prvi region Rusije."]),
  }],
  ["half", ["guess"], "🧭", 170, (x) => x.guessed.size >= Math.ceil(x.total / 2), {
    states: L(["Полпути до Калифорнии", "Назовите 25 штатов за одну игру."], ["Halfway to California", "Name 25 states in one game."], ["Pola puta do Kalifornije", "Upišite 25 država u jednoj igri."]),
    russia: L(["Полпути до Владивостока", "Назовите 43 региона за одну игру."], ["Halfway to Vladivostok", "Name 43 regions in one game."], ["Pola puta do Vladivostoka", "Upišite 43 regiona u jednoj igri."]),
  }],
  ["all", ["guess", "typeFinish"], "🏆", 45, (x) => x.guessed.size === x.total, {
    states: L(["Звёздно-полосатый", "Назовите все 50 штатов."], ["Stars and Stripes", "Name all 50 states."], ["Zvezdice i pruge", "Upišite svih 50 država."]),
    russia: L(["От Калининграда до Чукотки", "Назовите все 85 регионов России."], ["From Kaliningrad to Chukotka", "Name all 85 regions of Russia."], ["Od Kalinjingrada do Čukotke", "Upišite svih 85 regiona Rusije."]),
  }],
  ["fast", ["guess", "typeFinish"], "⚡", 55, (x) => x.guessed.size === x.total && x.elapsed <= x.cfg.fast, {
    states: L(["Хайвей", "Все 50 штатов быстрее 5 минут."], ["Highway", "All 50 states in under 5 minutes."], ["Autoput", "Svih 50 država za manje od 5 minuta."]),
    russia: L(["Сапсан", "Все 85 регионов быстрее 12 минут."], ["Sapsan", "All 85 regions in under 12 minutes."], ["Sapsan", "Svih 85 regiona za manje od 12 minuta."]),
  }],
  ["group", ["guess"], "🧩", 265, (x) => x.groups.some((g) => x.groupDone(g.id)), {
    states: L(["Регион закрыт", "Назовите все штаты одного региона."], ["Region complete", "Name every state in one region."], ["Region zatvoren", "Upišite sve države jednog regiona."]),
    russia: L(["Округ закрыт", "Назовите все регионы одного федерального округа."], ["District complete", "Name every region of one federal district."], ["Okrug zatvoren", "Upišite sve regione jednog federalnog okruga."]),
  }],
  ["mapdone", ["mapFinish"], "🗺️", 150, () => true, {
    states: L(["Штурман", "Пройдите поиск штатов на карте до конца."], ["Navigator", "Finish finding the states on the map."], ["Navigator", "Završite traženje država na mapi."]),
    russia: L(["Штурман", "Пройдите поиск регионов России на карте до конца."], ["Navigator", "Finish finding Russia’s regions on the map."], ["Navigator", "Završite traženje regiona Rusije na mapi."]),
  }],
  ["perfect", ["mapFinish"], "🎯", 5, (x) => x.counts.ok === x.total, {
    states: L(["Орлиный глаз", "Найдите все 50 штатов с первого раза."], ["Eagle eye", "Find all 50 states on the first try."], ["Orlovsko oko", "Nađite svih 50 država iz prvog puta."]),
    russia: L(["Глаз-алмаз", "Найдите все 85 регионов с первого раза."], ["Sharp eye", "Find all 85 regions on the first try."], ["Oštro oko", "Nađite svih 85 regiona iz prvog puta."]),
  }],
  ["run", ["mapHit"], "🔥", 20, (x) => x.firstRun >= x.cfg.run, {
    states: L(["В ударе", "15 штатов подряд с первого раза."], ["On a roll", "15 states in a row on the first try."], ["U naletu", "15 država zaredom iz prvog puta."]),
    russia: L(["В ударе", "20 регионов подряд с первого раза."], ["On a roll", "20 regions in a row on the first try."], ["U naletu", "20 regiona zaredom iz prvog puta."]),
  }],
];

const has = (x, ids) => ids.every((id) => x.guessed.has(id));
const hitFirst = (x, id) => x.hit?.id === id && x.hit.first;

const SPECIAL = [
  { id: "us_newengland", game: "states", on: ["guess"], emoji: "🦞", hue: 10, test: (x) => has(x, ["09", "23", "25", "33", "44", "50"]),
    text: L(["Новая Англия", "Назовите все шесть штатов Новой Англии."], ["New England", "Name all six New England states."], ["Nova Engleska", "Upišite svih šest država Nove Engleske."]) },
  { id: "us_twins", game: "states", on: ["guess"], emoji: "👯", hue: 300, test: (x) => has(x, ["37", "45", "38", "46"]),
    text: L(["Близнецы", "Обе Каролины и обе Дакоты."], ["Twins", "Both Carolinas and both Dakotas."], ["Blizanci", "Obe Karoline i obe Dakote."]) },
  { id: "us_offshore", game: "states", on: ["guess"], emoji: "🌋", hue: 190, test: (x) => x.order.length >= 2 && x.order.slice(0, 2).every((id) => ["02", "15"].includes(id)),
    text: L(["Вне материка", "Начните с Аляски и Гавайев."], ["Off the mainland", "Start with Alaska and Hawaii."], ["Van kopna", "Počnite sa Aljaskom i Havajima."]) },
  { id: "us_rhode", game: "states", on: ["mapHit"], emoji: "🔎", hue: 230, test: (x) => hitFirst(x, "44"),
    text: L(["Лупа", "Найдите Род-Айленд на карте с первого раза."], ["Magnifier", "Find Rhode Island on the map on the first try."], ["Lupa", "Nađite Rod Ajland na mapi iz prvog puta."]) },
  { id: "ru_caucasus", game: "russia", on: ["guess"], emoji: "🏔️", hue: 210, test: (x) => x.groupDone("caucasus"),
    text: L(["Кавказ", "Назовите все регионы Северо-Кавказского округа."], ["The Caucasus", "Name every region of the North Caucasian district."], ["Kavkaz", "Upišite sve regione Severnokavkaskog okruga."]) },
  { id: "ru_fareast", game: "russia", on: ["guess"], emoji: "🐯", hue: 25, test: (x) => x.groupDone("fareast"),
    text: L(["Дальний Восток", "Назовите все регионы Дальневосточного округа."], ["Far East", "Name every region of the Far Eastern district."], ["Daleki istok", "Upišite sve regione Dalekoistočnog okruga."]) },
  { id: "ru_siberia", game: "russia", on: ["guess"], emoji: "🌲", hue: 130, test: (x) => x.groupDone("siberia"),
    text: L(["Сибиряк", "Назовите все регионы Сибирского округа."], ["Siberian", "Name every region of the Siberian district."], ["Sibirac", "Upišite sve regione Sibirskog okruga."]) },
  { id: "ru_capitals", game: "russia", on: ["guess"], emoji: "🏛️", hue: 0, test: (x) => has(x, ["RU-MOW", "RU-SPE"]),
    text: L(["Две столицы", "Назовите Москву и Санкт-Петербург."], ["Two capitals", "Name Moscow and Saint Petersburg."], ["Dve prestonice", "Upišite Moskvu i Sankt Peterburg."]) },
  { id: "ru_amber", game: "russia", on: ["mapHit"], emoji: "🟠", hue: 35, test: (x) => hitFirst(x, "RU-KGD"),
    text: L(["Янтарный край", "Найдите Калининградскую область на карте с первого раза."], ["Amber land", "Find Kaliningrad Oblast on the map on the first try."], ["Ćilibarski kraj", "Nađite Kalinjingradsku oblast na mapi iz prvog puta."]) },
  { id: "ru_ingush", game: "russia", on: ["mapHit"], emoji: "🔬", hue: 250, test: (x) => hitFirst(x, "RU-IN"),
    text: L(["Микроскоп", "Найдите Ингушетию на карте с первого раза."], ["Microscope", "Find Ingushetia on the map on the first try."], ["Mikroskop", "Nađite Ingušetiju na mapi iz prvog puta."]) },
  { id: "maps_all", game: null, on: ["guess", "typeFinish"], emoji: "🌐", hue: 280,
    test: (x) => ["states", "russia"].every((g) => (x.records[`${g}-type`]?.best || 0) >= GAMES[g].total),
    text: L(["Картограф", "Назовите все штаты США и все регионы России."], ["Cartographer", "Name all US states and all Russian regions."], ["Kartograf", "Upišite sve američke države i sve regione Rusije."]) },
];

export const MAP_ACHIEVEMENTS = [
  ...Object.entries(GAMES).flatMap(([game, cfg]) =>
    COMMON.map(([suffix, on, emoji, hue, test, texts]) => ({ id: `${cfg.p}_${suffix}`, game, on, emoji, hue, test, text: texts[game] })),
  ),
  ...SPECIAL,
];

export const mapAchievementText = (a, lang) => a.text[lang] || a.text.ru;

/* Возвращает только что открытые достижения и записывает их в unlocked */
export function checkMapAchievements(event, x, unlocked) {
  const cfg = GAMES[x.game];
  const ctx = { ...x, cfg, total: cfg.total };
  const fresh = [];
  MAP_ACHIEVEMENTS.forEach((a) => {
    if (unlocked[a.id] || !a.on.includes(event) || (a.game && a.game !== x.game)) return;
    let ok = false;
    try {
      ok = a.test(ctx);
    } catch {
      ok = false;
    }
    if (!ok) return;
    unlocked[a.id] = Date.now();
    fresh.push(a);
  });
  return fresh;
}
