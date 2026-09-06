// Достижения. Каждое: id, эмодзи, оттенок карточки, событие-триггер, проверка и тексты на трёх языках.
// ctx: { S, st, meta, country, name(c), iso(c), regionDone(region), hasIso([...]), hour }

const T = {
  first: {
    ru: ["Первая кровь", "Первая страна названа. Дальше — только вверх."],
    en: ["First blood", "First country named. Only up from here."],
    sr: ["Prva krv", "Prva država je imenovana. Odavde samo nagore."],
  },
  ten: {
    ru: ["Десятка", "10 стран за одну партию."],
    en: ["Ten", "10 countries in one game."],
    sr: ["Desetka", "10 država u jednoj partiji."],
  },
  fifty: {
    ru: ["Полтинник", "50 стран за партию. Уже неплохо."],
    en: ["Fifty", "50 countries in one game. Not bad at all."],
    sr: ["Pedeset", "50 država u jednoj partiji. Nije loše."],
  },
  hundred: {
    ru: ["Сотня", "100 стран. Половина мира в кармане."],
    en: ["Hundred", "100 countries. Half the world in your pocket."],
    sr: ["Stotina", "100 država. Pola sveta u džepu."],
  },
  onefifty: {
    ru: ["Знаток", "150 стран за одну партию."],
    en: ["Expert", "150 countries in a single game."],
    sr: ["Znalac", "150 država u jednoj partiji."],
  },
  world: {
    ru: ["Весь мир", "Все 196 стран. Глобус можно выбрасывать."],
    en: ["Whole world", "All 196 countries. You can throw the globe away."],
    sr: ["Ceo svet", "Svih 196 država. Globus više nije potreban."],
  },
  europe: {
    ru: ["Европеец", "Вся Европа названа."],
    en: ["European", "All of Europe named."],
    sr: ["Evropljanin", "Cela Evropa imenovana."],
  },
  asia: {
    ru: ["Шёлковый путь", "Вся Азия названа."],
    en: ["Silk Road", "All of Asia named."],
    sr: ["Put svile", "Cela Azija imenovana."],
  },
  africa: {
    ru: ["Сафари", "Вся Африка названа."],
    en: ["Safari", "All of Africa named."],
    sr: ["Safari", "Cela Afrika imenovana."],
  },
  namerica: {
    ru: ["От Аляски до Панамы", "Вся Северная Америка названа."],
    en: ["Alaska to Panama", "All of North America named."],
    sr: ["Od Aljaske do Paname", "Cela Severna Amerika imenovana."],
  },
  samerica: {
    ru: ["Карнавал", "Вся Южная Америка названа."],
    en: ["Carnival", "All of South America named."],
    sr: ["Karneval", "Cela Južna Amerika imenovana."],
  },
  oceania: {
    ru: ["Островитянин", "Вся Океания названа."],
    en: ["Islander", "All of Oceania named."],
    sr: ["Ostrvljanin", "Cela Okeanija imenovana."],
  },
  speed: {
    ru: ["Скорострел", "10 стран за 30 секунд."],
    en: ["Rapid fire", "10 countries in 30 seconds."],
    sr: ["Brzometni", "10 država za 30 sekundi."],
  },
  bratushki: {
    ru: ["Братушки", "Россия и Сербия в одной партии."],
    en: ["Brothers", "Russia and Serbia in one game."],
    sr: ["Braća", "Rusija i Srbija u jednoj partiji."],
  },
  stans: {
    ru: ["Все -станы", "Семь стран на «-стан»."],
    en: ["All the -stans", "Seven countries ending in -stan."],
    sr: ["Svi -stani", "Sedam država na „-stan“."],
  },
  guineas: {
    ru: ["Гвинейский квартет", "Гвинея, Гвинея-Бисау, Экваториальная Гвинея и Папуа — Новая Гвинея."],
    en: ["Guinea quartet", "Guinea, Guinea-Bissau, Equatorial Guinea and Papua New Guinea."],
    sr: ["Gvinejski kvartet", "Gvineja, Gvineja Bisao, Ekvatorijalna Gvineja i Papua Nova Gvineja."],
  },
  congos: {
    ru: ["Два Конго", "Оба Конго названы. Вы их различаете!"],
    en: ["Two Congos", "Both Congos named. You can tell them apart!"],
    sr: ["Dva Konga", "Oba Konga imenovana. Razlikujete ih!"],
  },
  koreas: {
    ru: ["38-я параллель", "Обе Кореи в одной партии."],
    en: ["38th parallel", "Both Koreas in one game."],
    sr: ["38. paralela", "Obe Koreje u jednoj partiji."],
  },
  saints: {
    ru: ["Святая троица", "Сент-Люсия, Сент-Китс и Невис, Сент-Винсент и Гренадины."],
    en: ["Holy trinity", "Saint Lucia, Saint Kitts and Nevis, Saint Vincent and the Grenadines."],
    sr: ["Sveto trojstvo", "Sveta Lucija, Sveti Kits i Nevis, Sveti Vinsent i Grenadini."],
  },
  micro: {
    ru: ["Под микроскопом", "Все шесть европейских микрогосударств."],
    en: ["Under the microscope", "All six European microstates."],
    sr: ["Pod mikroskopom", "Svih šest evropskih mikrodržava."],
  },
  caribbean: {
    ru: ["Карибский круиз", "Все 13 островных стран Карибского моря."],
    en: ["Caribbean cruise", "All 13 island nations of the Caribbean."],
    sr: ["Karipsko krstarenje", "Svih 13 ostrvskih država Kariba."],
  },
  gastro: {
    ru: ["Гастротур", "Италия, Франция, Япония, Мексика и Таиланд. Приятного аппетита."],
    en: ["Food tour", "Italy, France, Japan, Mexico and Thailand. Bon appétit."],
    sr: ["Gastro tura", "Italija, Francuska, Japan, Meksiko i Tajland. Prijatno."],
  },
  frost: {
    ru: ["Морозко", "Семь самых холодных стран мира."],
    en: ["Jack Frost", "Seven of the coldest countries on Earth."],
    sr: ["Deda Mraz", "Sedam najhladnijih država sveta."],
  },
  sahara: {
    ru: ["Сахара", "Все десять стран, по которым тянется Сахара."],
    en: ["Sahara", "All ten countries the Sahara stretches across."],
    sr: ["Sahara", "Svih deset država kroz koje se prostire Sahara."],
  },
  austr: {
    ru: ["Кенгуру в Альпах", "Австралия и Австрия. Никакой путаницы."],
    en: ["Kangaroo in the Alps", "Australia and Austria. No confusion here."],
    sr: ["Kengur u Alpima", "Australija i Austrija. Bez zabune."],
  },
  slov: {
    ru: ["Не перепутал", "Словакия и Словения в одной партии."],
    en: ["Not confused", "Slovakia and Slovenia in one game."],
    sr: ["Nisam pomešao", "Slovačka i Slovenija u jednoj partiji."],
  },
  short: {
    ru: ["Коротко и ясно", "Пять стран с названием не длиннее четырёх букв."],
    en: ["Short and sweet", "Five countries with names of four letters or fewer."],
    sr: ["Kratko i jasno", "Pet država sa imenom od najviše četiri slova."],
  },
  letters: {
    ru: ["Алфавит", "Страны на 15 разных букв."],
    en: ["Alphabet", "Countries starting with 15 different letters."],
    sr: ["Azbuka", "Države na 15 različitih slova."],
  },
  roundtrip: {
    ru: ["Кругосветка", "Шесть стран подряд с шести разных континентов."],
    en: ["Round the world", "Six countries in a row from six different continents."],
    sr: ["Oko sveta", "Šest država zaredom sa šest različitih kontinenata."],
  },
  lastminute: {
    ru: ["Последняя минута", "Страна названа, когда оставалось меньше минуты."],
    en: ["Last minute", "Named a country with less than a minute left."],
    sr: ["Poslednji minut", "Država imenovana kada je ostalo manje od minuta."],
  },
  buzzer: {
    ru: ["На флажке", "Страна названа за 5 секунд до конца."],
    en: ["Buzzer beater", "Named a country with 5 seconds to spare."],
    sr: ["U poslednjoj sekundi", "Država imenovana 5 sekundi pre kraja."],
  },
  owl: {
    ru: ["Сова", "Играли глубокой ночью. Спать не хочется?"],
    en: ["Night owl", "Playing in the dead of night. Not sleepy?"],
    sr: ["Sova", "Igrali ste usred noći. Ne spava vam se?"],
  },
  lark: {
    ru: ["Жаворонок", "Играли на рассвете, до семи утра."],
    en: ["Early bird", "Playing at dawn, before seven in the morning."],
    sr: ["Ševa", "Igrali ste u zoru, pre sedam ujutru."],
  },
  whiteflag: {
    ru: ["Белый флаг", "Сдались, назвав меньше десяти стран. Бывает."],
    en: ["White flag", "Gave up with fewer than ten countries. It happens."],
    sr: ["Bela zastava", "Predali ste se sa manje od deset država. Dešava se."],
  },
  nolimit: {
    ru: ["Без спешки", "Убрали лимит и назвали 150 стран."],
    en: ["No rush", "Removed the limit and named 150 countries."],
    sr: ["Bez žurbe", "Uklonili ste limit i imenovali 150 država."],
  },
  veteran: {
    ru: ["Ветеран", "Десять сыгранных партий."],
    en: ["Veteran", "Ten games played."],
    sr: ["Veteran", "Deset odigranih partija."],
  },
  record: {
    ru: ["Личный рекорд", "Побили свой лучший результат в режиме «Страны»."],
    en: ["Personal best", "Beat your own record in Countries mode."],
    sr: ["Lični rekord", "Oborili ste svoj rekord u režimu „Države“."],
  },
  antarctica: {
    ru: ["Пингвинов нет", "Попытались ввести Антарктиду. Там нет стран, только пингвины."],
    en: ["No penguins", "Tried to enter Antarctica. No countries there, only penguins."],
    sr: ["Nema pingvina", "Pokušali ste da unesete Antarktik. Tamo nema država, samo pingvini."],
  },
  polyglot: {
    ru: ["Полиглот", "Страны введены на трёх языках в одной партии."],
    en: ["Polyglot", "Countries entered in three languages in one game."],
    sr: ["Poliglota", "Države unete na tri jezika u jednoj partiji."],
  },
  sniper: {
    ru: ["Снайпер", "20 верных ответов подряд в викторине."],
    en: ["Sniper", "20 correct answers in a row in a quiz."],
    sr: ["Snajper", "20 tačnih odgovora zaredom u kvizu."],
  },
  flagman: {
    ru: ["Флагман", "50 флагов угадано за партию."],
    en: ["Flagship", "50 flags guessed in one game."],
    sr: ["Zastavnik", "50 zastava pogođeno u jednoj partiji."],
  },
  capitalist: {
    ru: ["Столичный житель", "50 столиц названо за партию."],
    en: ["Capital citizen", "50 capitals named in one game."],
    sr: ["Prestonički građanin", "50 glavnih gradova imenovano u jednoj partiji."],
  },
  bycapital: {
    ru: ["Обратный адрес", "50 стран угадано по столице."],
    en: ["Return address", "50 countries guessed by capital."],
    sr: ["Povratna adresa", "50 država pogođeno po glavnom gradu."],
  },
  diamond: {
    ru: ["Бриллиант", "Викторина на 100% без единого пропуска."],
    en: ["Diamond", "A quiz at 100% without a single skip."],
    sr: ["Dijamant", "Kviz na 100% bez ijednog preskakanja."],
  },
  sprinter: {
    ru: ["Спринтер", "30+ вопросов быстрее двух минут."],
    en: ["Sprinter", "30+ questions in under two minutes."],
    sr: ["Sprinter", "30+ pitanja za manje od dva minuta."],
  },
  streak7: {
    ru: ["Неделя огня", "Семь дней подряд хотя бы одна игра."],
    en: ["Week of fire", "Seven days in a row with at least one game."],
    sr: ["Nedelja vatre", "Sedam dana zaredom bar jedna igra."],
  },
  streak30: {
    ru: ["Месяц огня", "Тридцать дней подряд. Это уже привычка."],
    en: ["Month of fire", "Thirty days in a row. That's a habit now."],
    sr: ["Mesec vatre", "Trideset dana zaredom. To je već navika."],
  },
  easter: {
    ru: ["Пасхалка", "Нашли флаг, у которого нет страны."],
    en: ["Easter egg", "Found a flag that has no country."],
    sr: ["Iznenađenje", "Našli ste zastavu koja nema državu."],
  },
  skipper: {
    ru: ["Пропускной пункт", "Десять пропусков подряд. Смелое решение."],
    en: ["Checkpoint", "Ten skips in a row. Bold strategy."],
    sr: ["Kontrolni punkt", "Deset preskakanja zaredom. Hrabra odluka."],
  },
  honduras: {
    ru: ["Гондура́с", "Ударение на «а». Страна в Центральной Америке, столица Тегусигальпа. И ничего больше."],
    en: ["Honduras", "A country in Central America, capital Tegucigalpa. That is all it is."],
    sr: ["Honduras", "Država u Centralnoj Americi, glavni grad Tegusigalpa. I ništa više."],
  },
  niger: {
    ru: ["Ниге́р", "Ударение на второй слог. Страна в Западной Африке, столица Ниамей. Не путать ни с чем."],
    en: ["Niger", "Pronounced nee-ZHAIR. A country in West Africa, capital Niamey. Not to be confused with anything."],
    sr: ["Niger", "Naglasak na drugom slogu. Država u zapadnoj Africi, glavni grad Nijamej. Ne mešati ni sa čim."],
  },
};

const REGION = {
  namerica: "Северная Америка",
  samerica: "Южная Америка",
  europe: "Европа",
  asia: "Азия",
  africa: "Африка",
  oceania: "Океания",
};

const set = (isos) => (x) => x.hasIso(isos);

export const ACHIEVEMENTS = [
  { id: "first", emoji: "🎯", hue: 210, on: "guess", test: (x) => x.S.guessed.size === 1 },
  { id: "ten", emoji: "🔟", hue: 260, on: "guess", test: (x) => x.S.guessed.size >= 10 },
  { id: "fifty", emoji: "🏃", hue: 150, on: "guess", test: (x) => x.S.guessed.size >= 50 },
  { id: "hundred", emoji: "💯", hue: 30, on: "guess", test: (x) => x.S.guessed.size >= 100 },
  { id: "onefifty", emoji: "🧠", hue: 290, on: "guess", test: (x) => x.S.guessed.size >= 150 },
  { id: "world", emoji: "🌍", hue: 200, on: "guess", test: (x) => x.S.guessed.size === x.total },
  { id: "europe", emoji: "🏰", hue: 225, on: "guess", test: (x) => x.regionDone(REGION.europe) },
  { id: "asia", emoji: "🐉", hue: 0, on: "guess", test: (x) => x.regionDone(REGION.asia) },
  { id: "africa", emoji: "🦁", hue: 40, on: "guess", test: (x) => x.regionDone(REGION.africa) },
  { id: "namerica", emoji: "🗽", hue: 190, on: "guess", test: (x) => x.regionDone(REGION.namerica) },
  { id: "samerica", emoji: "💃", hue: 330, on: "guess", test: (x) => x.regionDone(REGION.samerica) },
  { id: "oceania", emoji: "🏝️", hue: 170, on: "guess", test: (x) => x.regionDone(REGION.oceania) },
  {
    id: "speed",
    emoji: "⚡",
    hue: 50,
    on: "guess",
    test: (x) => x.st.times.length >= 10 && x.st.times.at(-1) - x.st.times.at(-10) <= 30000,
  },
  { id: "bratushki", emoji: "🤝", hue: 5, on: "guess", test: set(["RU", "RS"]) },
  { id: "stans", emoji: "🧭", hue: 120, on: "guess", test: set(["KZ", "KG", "TJ", "TM", "UZ", "AF", "PK"]) },
  { id: "guineas", emoji: "🐔", hue: 45, on: "guess", test: set(["GN", "GW", "GQ", "PG"]) },
  { id: "congos", emoji: "🥁", hue: 20, on: "guess", test: set(["CD", "CG"]) },
  { id: "koreas", emoji: "☯️", hue: 0, on: "guess", test: set(["KP", "KR"]) },
  { id: "saints", emoji: "⛪", hue: 280, on: "guess", test: set(["LC", "KN", "VC"]) },
  { id: "micro", emoji: "🔬", hue: 180, on: "guess", test: set(["VA", "MC", "SM", "LI", "AD", "MT"]) },
  {
    id: "caribbean",
    emoji: "🚢",
    hue: 195,
    on: "guess",
    test: set(["AG", "BS", "BB", "DM", "DO", "GD", "HT", "JM", "KN", "LC", "VC", "TT", "CU"]),
  },
  { id: "gastro", emoji: "🍕", hue: 15, on: "guess", test: set(["IT", "FR", "JP", "MX", "TH"]) },
  { id: "frost", emoji: "🧊", hue: 200, on: "guess", test: set(["IS", "NO", "FI", "SE", "CA", "RU", "MN"]) },
  {
    id: "sahara",
    emoji: "🌵",
    hue: 35,
    on: "guess",
    test: set(["MA", "DZ", "TN", "LY", "EG", "MR", "ML", "NE", "TD", "SD"]),
  },
  { id: "austr", emoji: "🦘", hue: 25, on: "guess", test: set(["AU", "AT"]) },
  { id: "slov", emoji: "👯", hue: 140, on: "guess", test: set(["SK", "SI"]) },
  {
    id: "short",
    emoji: "🤏",
    hue: 300,
    on: "guess",
    test: (x) => x.guessedList().filter((c) => x.name(c).length <= 4).length >= 5,
  },
  {
    id: "letters",
    emoji: "🔤",
    hue: 250,
    on: "guess",
    test: (x) => new Set(x.guessedList().map((c) => x.name(c)[0].toLowerCase())).size >= 15,
  },
  {
    id: "roundtrip",
    emoji: "🧳",
    hue: 160,
    on: "guess",
    test: (x) => x.st.order.length >= 6 && new Set(x.st.order.slice(-6).map((c) => c.region)).size === 6,
  },
  { id: "lastminute", emoji: "🐌", hue: 80, on: "guess", test: (x) => x.S.limited && x.S.secondsLeft <= 60 },
  { id: "buzzer", emoji: "⏰", hue: 0, on: "guess", test: (x) => x.S.limited && x.S.secondsLeft <= 5 },
  { id: "owl", emoji: "🦉", hue: 240, on: "guess", test: (x) => x.hour >= 0 && x.hour < 5 },
  { id: "lark", emoji: "🐓", hue: 40, on: "guess", test: (x) => x.hour >= 5 && x.hour < 7 },
  { id: "whiteflag", emoji: "🏳️", hue: 0, on: "giveup", secret: true, test: (x) => x.S.guessed.size < 10 },
  { id: "nolimit", emoji: "♾️", hue: 270, on: "finish", test: (x) => !x.S.limited && x.S.guessed.size >= 150 },
  { id: "veteran", emoji: "🎖️", hue: 100, on: "finish", test: (x) => x.meta.games >= 10 },
  { id: "record", emoji: "🥇", hue: 50, on: "record", test: (x) => x.S.mode === "countries" && x.S.guessed.size >= 20 },
  { id: "antarctica", emoji: "🐧", hue: 205, on: "input", secret: true, test: (x) => x.st.antarctica },
  { id: "polyglot", emoji: "🗣️", hue: 320, on: "guess", test: (x) => x.st.langs.size >= 3 },
  { id: "sniper", emoji: "🎯", hue: 355, on: "quizCorrect", test: (x) => x.st.quizStreak >= 20 },
  {
    id: "flagman",
    emoji: "⛳",
    hue: 120,
    on: "quizCorrect",
    test: (x) => x.S.mode === "flagCountry" && x.S.qCorrect.size >= 50,
  },
  {
    id: "capitalist",
    emoji: "🏙️",
    hue: 230,
    on: "quizCorrect",
    test: (x) => x.S.mode === "countryCapital" && x.S.qCorrect.size >= 50,
  },
  {
    id: "bycapital",
    emoji: "🗺️",
    hue: 175,
    on: "quizCorrect",
    test: (x) => x.S.mode === "capitalCountry" && x.S.qCorrect.size >= 50,
  },
  {
    id: "diamond",
    emoji: "💎",
    hue: 195,
    on: "quizFinish",
    test: (x) => x.S.queue.length >= 20 && x.S.qCorrect.size === x.S.queue.length,
  },
  {
    id: "sprinter",
    emoji: "🏎️",
    hue: 10,
    on: "quizFinish",
    test: (x) => x.S.queue.length >= 30 && x.S.elapsed < 120,
  },
  { id: "skipper", emoji: "🚧", hue: 45, on: "quizSkip", secret: true, test: (x) => x.st.skipStreak >= 10 },
  { id: "easter", emoji: "🥚", hue: 320, on: "input", secret: true, test: (x) => x.st.easter },
  { id: "streak7", emoji: "🔥", hue: 25, on: "streak", test: (x) => x.streak >= 7 },
  { id: "streak30", emoji: "🌋", hue: 10, on: "streak", test: (x) => x.streak >= 30 },
  // Созвучные названия: не ачивка, а «предупреждение» — выдаётся в момент ввода именно этой страны.
  { id: "honduras", emoji: "⚠️", hue: 45, on: "guess", secret: true, warn: true, test: (x) => x.st.order.at(-1)?.name === "Гондурас" },
  { id: "niger", emoji: "⚠️", hue: 45, on: "guess", secret: true, warn: true, test: (x) => x.st.order.at(-1)?.name === "Нигер" },
];

export const achievementText = (id, lang) => T[id][lang] || T[id].ru;

export const ACHV_UI = {
  ru: {
    unlocked: "Достижение получено",
    warning: "Предупреждение",
    title: "Достижения",
    secret: "Секретное достижение",
    locked: "Ещё не открыто",
    hiddenLeft: (n) => `Ещё ${n} скрыто. Играйте, и они откроются сами.`,
  },
  en: {
    unlocked: "Achievement unlocked",
    warning: "Warning",
    title: "Achievements",
    secret: "Secret achievement",
    locked: "Not unlocked yet",
    hiddenLeft: (n) => `${n} more are hidden. Keep playing and they will reveal themselves.`,
  },
  sr: {
    unlocked: "Dostignuće otključano",
    warning: "Upozorenje",
    title: "Dostignuća",
    secret: "Tajno dostignuće",
    locked: "Još nije otključano",
    hiddenLeft: (n) => `Još ${n} je skriveno. Igrajte i otključaće se sama.`,
  },
};
