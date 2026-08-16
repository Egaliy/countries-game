import './styles.css';

const REGIONS = [
  'Северная Америка',
  'Южная Америка',
  'Европа',
  'Азия',
  'Африка',
  'Океания'
];

const REGION_LABELS = {
  ru: {
    'Северная Америка': 'Северная Америка',
    'Южная Америка': 'Южная Америка',
    'Европа': 'Европа',
    'Азия': 'Азия',
    'Африка': 'Африка',
    'Океания': 'Океания'
  },
  en: {
    'Северная Америка': 'North America',
    'Южная Америка': 'South America',
    'Европа': 'Europe',
    'Азия': 'Asia',
    'Африка': 'Africa',
    'Океания': 'Oceania'
  }
};

const COUNTRIES = [
  ['Антигуа и Барбуда', '🇦🇬', 'Северная Америка', ['антигуа', 'барбуда', 'antiguaandbarbuda', 'antigua']],
  ['Багамы', '🇧🇸', 'Северная Америка', ['багамские острова', 'bahamas', 'thebahamas']],
  ['Барбадос', '🇧🇧', 'Северная Америка', ['barbados']],
  ['Белиз', '🇧🇿', 'Северная Америка', ['belize']],
  ['Гаити', '🇭🇹', 'Северная Америка', ['haiti']],
  ['Гватемала', '🇬🇹', 'Северная Америка', ['guatemala']],
  ['Гондурас', '🇭🇳', 'Северная Америка', ['honduras']],
  ['Гренада', '🇬🇩', 'Северная Америка', ['grenada']],
  ['Доминика', '🇩🇲', 'Северная Америка', ['dominica']],
  ['Доминиканская Республика', '🇩🇴', 'Северная Америка', ['доминикана', 'доминиканская', 'dominicanrepublic', 'dominicana']],
  ['Канада', '🇨🇦', 'Северная Америка', ['canada']],
  ['Коста-Рика', '🇨🇷', 'Северная Америка', ['костарика', 'costarica']],
  ['Куба', '🇨🇺', 'Северная Америка', ['cuba']],
  ['Мексика', '🇲🇽', 'Северная Америка', ['mexico']],
  ['Никарагуа', '🇳🇮', 'Северная Америка', ['nicaragua']],
  ['Панама', '🇵🇦', 'Северная Америка', ['panama']],
  ['Сальвадор', '🇸🇻', 'Северная Америка', ['эльсальвадор', 'elsalvador', 'salvador']],
  ['Сент-Винсент и Гренадины', '🇻🇨', 'Северная Америка', ['сентвинсент', 'гренадины', 'saintvincentandthegrenadines', 'stvincent']],
  ['Сент-Китс и Невис', '🇰🇳', 'Северная Америка', ['сенткитс', 'невис', 'saintkittsandnevis', 'stkitts']],
  ['Сент-Люсия', '🇱🇨', 'Северная Америка', ['сентлюсия', 'saintlucia', 'stlucia']],
  ['США', '🇺🇸', 'Северная Америка', ['соединенные штаты', 'соединенные штаты америки', 'америка', 'сша', 'usa', 'us', 'unitedstates', 'unitedstatesofamerica', 'america']],
  ['Тринидад и Тобаго', '🇹🇹', 'Северная Америка', ['тринидад', 'тобаго', 'trinidadandtobago', 'trinidad']],
  ['Ямайка', '🇯🇲', 'Северная Америка', ['jamaica']],

  ['Аргентина', '🇦🇷', 'Южная Америка', ['argentina']],
  ['Боливия', '🇧🇴', 'Южная Америка', ['bolivia']],
  ['Бразилия', '🇧🇷', 'Южная Америка', ['brazil', 'brasil']],
  ['Венесуэла', '🇻🇪', 'Южная Америка', ['venezuela']],
  ['Гайана', '🇬🇾', 'Южная Америка', ['guyana']],
  ['Колумбия', '🇨🇴', 'Южная Америка', ['colombia']],
  ['Парагвай', '🇵🇾', 'Южная Америка', ['paraguay']],
  ['Перу', '🇵🇪', 'Южная Америка', ['peru']],
  ['Суринам', '🇸🇷', 'Южная Америка', ['suriname']],
  ['Уругвай', '🇺🇾', 'Южная Америка', ['uruguay']],
  ['Чили', '🇨🇱', 'Южная Америка', ['chile']],
  ['Эквадор', '🇪🇨', 'Южная Америка', ['ecuador']],

  ['Австрия', '🇦🇹', 'Европа', ['austria']],
  ['Албания', '🇦🇱', 'Европа', ['albania']],
  ['Андорра', '🇦🇩', 'Европа', ['andorra']],
  ['Беларусь', '🇧🇾', 'Европа', ['белоруссия', 'belarus']],
  ['Бельгия', '🇧🇪', 'Европа', ['belgium']],
  ['Болгария', '🇧🇬', 'Европа', ['bulgaria']],
  ['Босния и Герцеговина', '🇧🇦', 'Европа', ['босния', 'герцеговина', 'bosniaandherzegovina', 'bosnia']],
  ['Ватикан', '🇻🇦', 'Европа', ['святой престол', 'vatican', 'holysee']],
  ['Великобритания', '🇬🇧', 'Европа', ['британия', 'соединенное королевство', 'англия', 'uk', 'unitedkingdom', 'greatbritain', 'britain', 'england']],
  ['Венгрия', '🇭🇺', 'Европа', ['hungary']],
  ['Германия', '🇩🇪', 'Европа', ['germany']],
  ['Греция', '🇬🇷', 'Европа', ['greece']],
  ['Дания', '🇩🇰', 'Европа', ['denmark']],
  ['Ирландия', '🇮🇪', 'Европа', ['ireland']],
  ['Исландия', '🇮🇸', 'Европа', ['iceland']],
  ['Испания', '🇪🇸', 'Европа', ['spain']],
  ['Италия', '🇮🇹', 'Европа', ['italy']],
  ['Кипр', '🇨🇾', 'Европа', ['cyprus']],
  ['Косово', '🇽🇰', 'Европа', ['kosovo']],
  ['Латвия', '🇱🇻', 'Европа', ['latvia']],
  ['Литва', '🇱🇹', 'Европа', ['lithuania']],
  ['Лихтенштейн', '🇱🇮', 'Европа', ['liechtenstein']],
  ['Люксембург', '🇱🇺', 'Европа', ['luxembourg']],
  ['Мальта', '🇲🇹', 'Европа', ['malta']],
  ['Молдова', '🇲🇩', 'Европа', ['молдавия', 'moldova']],
  ['Монако', '🇲🇨', 'Европа', ['monaco']],
  ['Нидерланды', '🇳🇱', 'Европа', ['голландия', 'netherlands', 'holland']],
  ['Норвегия', '🇳🇴', 'Европа', ['norway']],
  ['Польша', '🇵🇱', 'Европа', ['poland']],
  ['Португалия', '🇵🇹', 'Европа', ['portugal']],
  ['Россия', '🇷🇺', 'Европа', ['российская федерация', 'russia', 'russianfederation']],
  ['Румыния', '🇷🇴', 'Европа', ['romania']],
  ['Сан-Марино', '🇸🇲', 'Европа', ['санмарино', 'sanmarino']],
  ['Северная Македония', '🇲🇰', 'Европа', ['македония', 'northmacedonia', 'macedonia']],
  ['Сербия', '🇷🇸', 'Европа', ['serbia']],
  ['Словакия', '🇸🇰', 'Европа', ['slovakia']],
  ['Словения', '🇸🇮', 'Европа', ['slovenia']],
  ['Украина', '🇺🇦', 'Европа', ['ukraine']],
  ['Финляндия', '🇫🇮', 'Европа', ['finland']],
  ['Франция', '🇫🇷', 'Европа', ['france']],
  ['Хорватия', '🇭🇷', 'Европа', ['croatia']],
  ['Черногория', '🇲🇪', 'Европа', ['montenegro']],
  ['Чехия', '🇨🇿', 'Европа', ['чешская республика', 'czechia', 'czechrepublic']],
  ['Швейцария', '🇨🇭', 'Европа', ['switzerland']],
  ['Швеция', '🇸🇪', 'Европа', ['sweden']],
  ['Эстония', '🇪🇪', 'Европа', ['estonia']],

  ['Азербайджан', '🇦🇿', 'Азия', ['azerbaijan']],
  ['Армения', '🇦🇲', 'Азия', ['armenia']],
  ['Афганистан', '🇦🇫', 'Азия', ['afghanistan']],
  ['Бангладеш', '🇧🇩', 'Азия', ['bangladesh']],
  ['Бахрейн', '🇧🇭', 'Азия', ['bahrain']],
  ['Бруней', '🇧🇳', 'Азия', ['brunei']],
  ['Бутан', '🇧🇹', 'Азия', ['bhutan']],
  ['Восточный Тимор', '🇹🇱', 'Азия', ['тиморлешти', 'тимор', 'easttimor', 'timorleste', 'timor']],
  ['Вьетнам', '🇻🇳', 'Азия', ['vietnam']],
  ['Грузия', '🇬🇪', 'Азия', ['georgia']],
  ['Израиль', '🇮🇱', 'Азия', ['israel']],
  ['Индия', '🇮🇳', 'Азия', ['india']],
  ['Индонезия', '🇮🇩', 'Азия', ['indonesia']],
  ['Иордания', '🇯🇴', 'Азия', ['jordan']],
  ['Ирак', '🇮🇶', 'Азия', ['iraq']],
  ['Иран', '🇮🇷', 'Азия', ['iran']],
  ['Йемен', '🇾🇪', 'Азия', ['yemen']],
  ['Казахстан', '🇰🇿', 'Азия', ['kazakhstan']],
  ['Камбоджа', '🇰🇭', 'Азия', ['cambodia']],
  ['Катар', '🇶🇦', 'Азия', ['qatar']],
  ['Китай', '🇨🇳', 'Азия', ['кнр', 'china', 'prc']],
  ['КНДР', '🇰🇵', 'Азия', ['северная корея', 'корея северная', 'northkorea', 'dprk']],
  ['Кувейт', '🇰🇼', 'Азия', ['kuwait']],
  ['Кыргызстан', '🇰🇬', 'Азия', ['киргизия', 'kyrgyzstan', 'kirgizia']],
  ['Лаос', '🇱🇦', 'Азия', ['laos']],
  ['Ливан', '🇱🇧', 'Азия', ['lebanon']],
  ['Малайзия', '🇲🇾', 'Азия', ['malaysia']],
  ['Мальдивы', '🇲🇻', 'Азия', ['мальдивские острова', 'maldives']],
  ['Монголия', '🇲🇳', 'Азия', ['mongolia']],
  ['Мьянма', '🇲🇲', 'Азия', ['бирма', 'myanmar', 'burma']],
  ['Непал', '🇳🇵', 'Азия', ['nepal']],
  ['ОАЭ', '🇦🇪', 'Азия', ['объединенные арабские эмираты', 'эмираты', 'uae', 'unitedarabemirates', 'emirates']],
  ['Оман', '🇴🇲', 'Азия', ['oman']],
  ['Пакистан', '🇵🇰', 'Азия', ['pakistan']],
  ['Палестина', '🇵🇸', 'Азия', ['palestine']],
  ['Саудовская Аравия', '🇸🇦', 'Азия', ['саудовская', 'аравия', 'saudiarabia', 'saudi']],
  ['Сингапур', '🇸🇬', 'Азия', ['singapore']],
  ['Сирия', '🇸🇾', 'Азия', ['syria']],
  ['Таджикистан', '🇹🇯', 'Азия', ['tajikistan']],
  ['Таиланд', '🇹🇭', 'Азия', ['тайланд', 'thailand']],
  ['Тайвань', '🇹🇼', 'Азия', ['taiwan']],
  ['Туркменистан', '🇹🇲', 'Азия', ['turkmenistan']],
  ['Турция', '🇹🇷', 'Азия', ['турция', 'türkiye', 'turkey', 'turkiye']],
  ['Узбекистан', '🇺🇿', 'Азия', ['uzbekistan']],
  ['Филиппины', '🇵🇭', 'Азия', ['philippines']],
  ['Шри-Ланка', '🇱🇰', 'Азия', ['шриланка', 'srilanka']],
  ['Южная Корея', '🇰🇷', 'Азия', ['республика корея', 'корея', 'southkorea', 'korea', 'republicofkorea']],
  ['Япония', '🇯🇵', 'Азия', ['japan']],

  ['Алжир', '🇩🇿', 'Африка', ['algeria']],
  ['Ангола', '🇦🇴', 'Африка', ['angola']],
  ['Бенин', '🇧🇯', 'Африка', ['benin']],
  ['Ботсвана', '🇧🇼', 'Африка', ['botswana']],
  ['Буркина-Фасо', '🇧🇫', 'Африка', ['буркинафасо', 'burkinafaso']],
  ['Бурунди', '🇧🇮', 'Африка', ['burundi']],
  ['Габон', '🇬🇦', 'Африка', ['gabon']],
  ['Гамбия', '🇬🇲', 'Африка', ['gambia', 'thegambia']],
  ['Гана', '🇬🇭', 'Африка', ['ghana']],
  ['Гвинея', '🇬🇳', 'Африка', ['guinea']],
  ['Гвинея-Бисау', '🇬🇼', 'Африка', ['гвинеябисау', 'guineabissau']],
  ['Джибути', '🇩🇯', 'Африка', ['djibouti']],
  ['ДР Конго', '🇨🇩', 'Африка', ['демократическая республика конго', 'конго киншаса', 'киншаса', 'заир', 'конго', 'drcongo', 'drc', 'congokinshasa', 'democraticrepublicofthecongo', 'zaire']],
  ['Египет', '🇪🇬', 'Африка', ['egypt']],
  ['Замбия', '🇿🇲', 'Африка', ['zambia']],
  ['Зимбабве', '🇿🇼', 'Африка', ['zimbabwe']],
  ['Кабо-Верде', '🇨🇻', 'Африка', ['кабоверде', 'cabo verde', 'capeverde', 'caboverde']],
  ['Камерун', '🇨🇲', 'Африка', ['cameroon']],
  ['Кения', '🇰🇪', 'Африка', ['kenya']],
  ['Коморы', '🇰🇲', 'Африка', ['коморские острова', 'comoros']],
  ['Кот-д’Ивуар', '🇨🇮', 'Африка', ['котдивуар', 'берег слоновой кости', 'cotedivoire', 'ivorycoast']],
  ['Лесото', '🇱🇸', 'Африка', ['lesotho']],
  ['Либерия', '🇱🇷', 'Африка', ['liberia']],
  ['Ливия', '🇱🇾', 'Африка', ['libya']],
  ['Маврикий', '🇲🇺', 'Африка', ['mauritius']],
  ['Мавритания', '🇲🇷', 'Африка', ['mauritania']],
  ['Мадагаскар', '🇲🇬', 'Африка', ['madagascar']],
  ['Малави', '🇲🇼', 'Африка', ['malawi']],
  ['Мали', '🇲🇱', 'Африка', ['mali']],
  ['Марокко', '🇲🇦', 'Африка', ['morocco']],
  ['Мозамбик', '🇲🇿', 'Африка', ['mozambique']],
  ['Намибия', '🇳🇦', 'Африка', ['namibia']],
  ['Нигер', '🇳🇪', 'Африка', ['niger']],
  ['Нигерия', '🇳🇬', 'Африка', ['nigeria']],
  ['Республика Конго', '🇨🇬', 'Африка', ['конго браззавиль', 'браззавиль', 'republicofthecongo', 'congobrazzaville']],
  ['Руанда', '🇷🇼', 'Африка', ['rwanda']],
  ['Сан-Томе и Принсипи', '🇸🇹', 'Африка', ['сантоме', 'принсипи', 'saotomeandprincipe', 'saotome']],
  ['Сейшелы', '🇸🇨', 'Африка', ['сейшельские острова', 'seychelles']],
  ['Сенегал', '🇸🇳', 'Африка', ['senegal']],
  ['Сомали', '🇸🇴', 'Африка', ['somalia']],
  ['Судан', '🇸🇩', 'Африка', ['sudan']],
  ['Сьерра-Леоне', '🇸🇱', 'Африка', ['сьерралеоне', 'sierraleone']],
  ['Танзания', '🇹🇿', 'Африка', ['tanzania']],
  ['Того', '🇹🇬', 'Африка', ['togo']],
  ['Тунис', '🇹🇳', 'Африка', ['tunisia']],
  ['Уганда', '🇺🇬', 'Африка', ['uganda']],
  ['ЦАР', '🇨🇫', 'Африка', ['центральноафриканская республика', 'centralafricanrepublic', 'car']],
  ['Чад', '🇹🇩', 'Африка', ['chad']],
  ['Экваториальная Гвинея', '🇬🇶', 'Африка', ['экваториальная', 'equatorialguinea']],
  ['Эритрея', '🇪🇷', 'Африка', ['eritrea']],
  ['Эсватини', '🇸🇿', 'Африка', ['свазиленд', 'eswatini', 'swaziland']],
  ['Эфиопия', '🇪🇹', 'Африка', ['ethiopia']],
  ['ЮАР', '🇿🇦', 'Африка', ['южная африка', 'southafrica']],
  ['Южный Судан', '🇸🇸', 'Африка', ['южныйсудан', 'southsudan']],

  ['Австралия', '🇦🇺', 'Океания', ['australia']],
  ['Вануату', '🇻🇺', 'Океания', ['vanuatu']],
  ['Кирибати', '🇰🇮', 'Океания', ['kiribati']],
  ['Маршалловы Острова', '🇲🇭', 'Океания', ['маршалловы', 'marshallislands']],
  ['Микронезия', '🇫🇲', 'Океания', ['федеративные штаты микронезии', 'фшм', 'micronesia', 'federatedstatesofmicronesia']],
  ['Науру', '🇳🇷', 'Океания', ['nauru']],
  ['Новая Зеландия', '🇳🇿', 'Океания', ['новаязеландия', 'newzealand']],
  ['Палау', '🇵🇼', 'Океания', ['palau']],
  ['Папуа — Новая Гвинея', '🇵🇬', 'Океания', ['папуа новая гвинея', 'папуа', 'пнг', 'papuanewguinea', 'png']],
  ['Самоа', '🇼🇸', 'Океания', ['samoa']],
  ['Соломоновы Острова', '🇸🇧', 'Океания', ['соломоновы', 'solomonislands']],
  ['Тонга', '🇹🇴', 'Океания', ['tonga']],
  ['Тувалу', '🇹🇻', 'Океания', ['tuvalu']],
  ['Фиджи', '🇫🇯', 'Океания', ['fiji']]
].map(([name, flag, region, aliases]) => ({
  name,
  flag,
  region,
  aliases,
  capitals: []
}));

const MODES = {
  countries: 'Все страны',
  flagCountry: 'Флаг → страна',
  countryCapital: 'Страна → столица',
  capitalCountry: 'Столица → страна',
  population: 'Страны + население'
};

const MODE_LABELS = {
  ru: MODES,
  en: {
    countries: 'All countries',
    flagCountry: 'Flag → country',
    countryCapital: 'Country → capital',
    capitalCountry: 'Capital → country',
    population: 'Countries + population'
  }
};

const TEXT = {
  ru: {
    title: 'Страны мира',
    mode: 'Режим',
    removeLimit: 'Убрать лимит',
    giveUp: 'Сдаться',
    skip: 'Пропустить',
    next: 'Дальше',
    reset: 'Сбросить',
    inputCountry: 'Введите страну',
    inputCapital: 'Введите столицу',
    gameOver: 'Игра завершена.',
    allDone: 'Все страны названы.',
    timeUp: 'Время вышло.',
    correct: 'Правильно',
    wrong: 'Неправильно',
    remaining: 'Осталось',
    record: 'Рекорд',
    time: 'время',
    stopwatch: 'Секундомер',
    missed: 'пропущено',
    done: 'Готово',
    answer: 'Ответ',
    capital: 'Столица',
    population: 'Население',
    populationMode: 'Укажите население',
    submitPopulation: 'Ответить',
    selectedPopulation: 'Выбрано',
    exactPopulation: 'Точно',
    populationPhase: 'сначала страны, потом население',
    underTenThousand: 'меньше 10 000',
    submitPopulationRow: 'Готово',
    populationScore: 'счет',
    populationSubmitted: 'население',
    populationError: 'ошибка',
    points: 'Очки',
    finalScore: 'Итог',
    populationLoading: 'население загружается',
    stats: 'Статистика',
    newCountry: 'новая страна',
    newRemembered: 'новая, уже вспомнил',
    recentlyLearned: 'недавно выучил',
    newForgotten: 'новая, забыл',
    oftenForgotten: 'часто забывает',
    sometimesForgotten: 'иногда забывает',
    usuallyRemembered: 'обычно помнит',
    forgotten: 'забыта',
    noLimit: 'без лимита'
  },
  en: {
    title: 'Countries of the World',
    mode: 'Mode',
    removeLimit: 'Remove limit',
    giveUp: 'Give up',
    skip: 'Skip',
    next: 'Next',
    reset: 'Reset',
    inputCountry: 'Type country',
    inputCapital: 'Type capital',
    gameOver: 'Game over.',
    allDone: 'All countries named.',
    timeUp: 'Time is up.',
    correct: 'Correct',
    wrong: 'Wrong',
    remaining: 'Remaining',
    record: 'Record',
    time: 'time',
    stopwatch: 'Stopwatch',
    missed: 'missed',
    done: 'Done',
    answer: 'Answer',
    capital: 'Capital',
    population: 'Population',
    populationMode: 'Estimate population',
    submitPopulation: 'Submit',
    selectedPopulation: 'Selected',
    exactPopulation: 'Exact',
    populationPhase: 'countries first, population next',
    underTenThousand: 'under 10,000',
    submitPopulationRow: 'Done',
    populationScore: 'score',
    populationSubmitted: 'population',
    populationError: 'error',
    points: 'Points',
    finalScore: 'Score',
    populationLoading: 'population loading',
    stats: 'Stats',
    newCountry: 'new country',
    newRemembered: 'new, remembered',
    recentlyLearned: 'recently learned',
    newForgotten: 'new, forgotten',
    oftenForgotten: 'often forgotten',
    sometimesForgotten: 'sometimes forgotten',
    usuallyRemembered: 'usually remembered',
    forgotten: 'forgotten',
    noLimit: 'no limit'
  }
};

const CAPITALS = {
  'Антигуа и Барбуда': ['Сент-Джонс', 'Сент Джонс'],
  'Багамы': ['Нассау'],
  'Барбадос': ['Бриджтаун'],
  'Белиз': ['Бельмопан'],
  'Гаити': ['Порт-о-Пренс', 'Порт о Пренс'],
  'Гватемала': ['Гватемала'],
  'Гондурас': ['Тегусигальпа'],
  'Гренада': ['Сент-Джорджес', 'Сент Джорджес'],
  'Доминика': ['Розо'],
  'Доминиканская Республика': ['Санто-Доминго', 'Санто Доминго'],
  'Канада': ['Оттава'],
  'Коста-Рика': ['Сан-Хосе', 'Сан Хосе'],
  'Куба': ['Гавана'],
  'Мексика': ['Мехико'],
  'Никарагуа': ['Манагуа'],
  'Панама': ['Панама'],
  'Сальвадор': ['Сан-Сальвадор', 'Сан Сальвадор'],
  'Сент-Винсент и Гренадины': ['Кингстаун'],
  'Сент-Китс и Невис': ['Бастер'],
  'Сент-Люсия': ['Кастри'],
  'США': ['Вашингтон'],
  'Тринидад и Тобаго': ['Порт-оф-Спейн', 'Порт оф Спейн'],
  'Ямайка': ['Кингстон'],
  'Аргентина': ['Буэнос-Айрес', 'Буэнос Айрес'],
  'Боливия': ['Сукре', 'Ла-Пас', 'Ла Пас'],
  'Бразилия': ['Бразилиа'],
  'Венесуэла': ['Каракас'],
  'Гайана': ['Джорджтаун'],
  'Колумбия': ['Богота'],
  'Парагвай': ['Асунсьон'],
  'Перу': ['Лима'],
  'Суринам': ['Парамарибо'],
  'Уругвай': ['Монтевидео'],
  'Чили': ['Сантьяго'],
  'Эквадор': ['Кито'],
  'Австрия': ['Вена'],
  'Албания': ['Тирана'],
  'Андорра': ['Андорра-ла-Велья', 'Андорра ла Велья'],
  'Беларусь': ['Минск'],
  'Бельгия': ['Брюссель'],
  'Болгария': ['София'],
  'Босния и Герцеговина': ['Сараево'],
  'Ватикан': ['Ватикан'],
  'Великобритания': ['Лондон'],
  'Венгрия': ['Будапешт'],
  'Германия': ['Берлин'],
  'Греция': ['Афины'],
  'Дания': ['Копенгаген'],
  'Ирландия': ['Дублин'],
  'Исландия': ['Рейкьявик'],
  'Испания': ['Мадрид'],
  'Италия': ['Рим'],
  'Кипр': ['Никосия'],
  'Косово': ['Приштина'],
  'Латвия': ['Рига'],
  'Литва': ['Вильнюс'],
  'Лихтенштейн': ['Вадуц'],
  'Люксембург': ['Люксембург'],
  'Мальта': ['Валлетта'],
  'Молдова': ['Кишинев', 'Кишинёв'],
  'Монако': ['Монако'],
  'Нидерланды': ['Амстердам'],
  'Норвегия': ['Осло'],
  'Польша': ['Варшава'],
  'Португалия': ['Лиссабон'],
  'Россия': ['Москва'],
  'Румыния': ['Бухарест'],
  'Сан-Марино': ['Сан-Марино', 'Сан Марино'],
  'Северная Македония': ['Скопье'],
  'Сербия': ['Белград'],
  'Словакия': ['Братислава'],
  'Словения': ['Любляна'],
  'Украина': ['Киев'],
  'Финляндия': ['Хельсинки'],
  'Франция': ['Париж'],
  'Хорватия': ['Загреб'],
  'Черногория': ['Подгорица'],
  'Чехия': ['Прага'],
  'Швейцария': ['Берн'],
  'Швеция': ['Стокгольм'],
  'Эстония': ['Таллин', 'Таллинн'],
  'Азербайджан': ['Баку'],
  'Армения': ['Ереван'],
  'Афганистан': ['Кабул'],
  'Бангладеш': ['Дакка'],
  'Бахрейн': ['Манама'],
  'Бруней': ['Бандар-Сери-Бегаван', 'Бандар Сери Бегаван'],
  'Бутан': ['Тхимпху'],
  'Восточный Тимор': ['Дили'],
  'Вьетнам': ['Ханой'],
  'Грузия': ['Тбилиси'],
  'Израиль': ['Иерусалим'],
  'Индия': ['Нью-Дели', 'Нью Дели'],
  'Индонезия': ['Джакарта'],
  'Иордания': ['Амман'],
  'Ирак': ['Багдад'],
  'Иран': ['Тегеран'],
  'Йемен': ['Сана'],
  'Казахстан': ['Астана'],
  'Камбоджа': ['Пномпень', 'Пном-Пень'],
  'Катар': ['Доха'],
  'Китай': ['Пекин'],
  'КНДР': ['Пхеньян'],
  'Кувейт': ['Эль-Кувейт', 'Эль Кувейт', 'Кувейт'],
  'Кыргызстан': ['Бишкек'],
  'Лаос': ['Вьентьян'],
  'Ливан': ['Бейрут'],
  'Малайзия': ['Куала-Лумпур', 'Куала Лумпур'],
  'Мальдивы': ['Мале'],
  'Монголия': ['Улан-Батор', 'Улан Батор'],
  'Мьянма': ['Нейпьидо'],
  'Непал': ['Катманду'],
  'ОАЭ': ['Абу-Даби', 'Абу Даби'],
  'Оман': ['Маскат'],
  'Пакистан': ['Исламабад'],
  'Палестина': ['Рамалла', 'Иерусалим'],
  'Саудовская Аравия': ['Эр-Рияд', 'Эр Рияд'],
  'Сингапур': ['Сингапур'],
  'Сирия': ['Дамаск'],
  'Таджикистан': ['Душанбе'],
  'Таиланд': ['Бангкок'],
  'Тайвань': ['Тайбэй'],
  'Туркменистан': ['Ашхабад'],
  'Турция': ['Анкара'],
  'Узбекистан': ['Ташкент'],
  'Филиппины': ['Манила'],
  'Шри-Ланка': ['Шри-Джаяварденепура-Котте', 'Шри Джаяварденепура Котте', 'Котте', 'Коломбо'],
  'Южная Корея': ['Сеул'],
  'Япония': ['Токио'],
  'Алжир': ['Алжир'],
  'Ангола': ['Луанда'],
  'Бенин': ['Порто-Ново', 'Порто Ново'],
  'Ботсвана': ['Габороне'],
  'Буркина-Фасо': ['Уагадугу'],
  'Бурунди': ['Гитега', 'Бужумбура'],
  'Габон': ['Либревиль'],
  'Гамбия': ['Банжул'],
  'Гана': ['Аккра'],
  'Гвинея': ['Конакри'],
  'Гвинея-Бисау': ['Бисау'],
  'Джибути': ['Джибути'],
  'ДР Конго': ['Киншаса'],
  'Египет': ['Каир'],
  'Замбия': ['Лусака'],
  'Зимбабве': ['Хараре'],
  'Кабо-Верде': ['Прая'],
  'Камерун': ['Яунде'],
  'Кения': ['Найроби'],
  'Коморы': ['Морони'],
  'Кот-д’Ивуар': ['Ямусукро', 'Абиджан'],
  'Лесото': ['Масеру'],
  'Либерия': ['Монровия'],
  'Ливия': ['Триполи'],
  'Маврикий': ['Порт-Луи', 'Порт Луи'],
  'Мавритания': ['Нуакшот'],
  'Мадагаскар': ['Антананариву'],
  'Малави': ['Лилонгве'],
  'Мали': ['Бамако'],
  'Марокко': ['Рабат'],
  'Мозамбик': ['Мапуту'],
  'Намибия': ['Виндхук'],
  'Нигер': ['Ниамей'],
  'Нигерия': ['Абуджа'],
  'Республика Конго': ['Браззавиль'],
  'Руанда': ['Кигали'],
  'Сан-Томе и Принсипи': ['Сан-Томе', 'Сан Томе'],
  'Сейшелы': ['Виктория'],
  'Сенегал': ['Дакар'],
  'Сомали': ['Могадишо'],
  'Судан': ['Хартум'],
  'Сьерра-Леоне': ['Фритаун'],
  'Танзания': ['Додома'],
  'Того': ['Ломе'],
  'Тунис': ['Тунис'],
  'Уганда': ['Кампала'],
  'ЦАР': ['Банги'],
  'Чад': ['Нджамена'],
  'Экваториальная Гвинея': ['Малабо'],
  'Эритрея': ['Асмэра', 'Асмера'],
  'Эсватини': ['Мбабане', 'Лобамба'],
  'Эфиопия': ['Аддис-Абеба', 'Аддис Абеба'],
  'ЮАР': ['Претория', 'Кейптаун', 'Блумфонтейн'],
  'Южный Судан': ['Джуба'],
  'Австралия': ['Канберра'],
  'Вануату': ['Порт-Вила', 'Порт Вила'],
  'Кирибати': ['Южная Тарава', 'Тарава'],
  'Маршалловы Острова': ['Маджуро'],
  'Микронезия': ['Паликир'],
  'Науру': ['Ярен'],
  'Новая Зеландия': ['Веллингтон'],
  'Палау': ['Нгерулмуд', 'Мелекеок'],
  'Папуа — Новая Гвинея': ['Порт-Морсби', 'Порт Морсби'],
  'Самоа': ['Апиа'],
  'Соломоновы Острова': ['Хониара'],
  'Тонга': ['Нукуалофа', 'Нуку-алофа'],
  'Тувалу': ['Фунафути'],
  'Фиджи': ['Сува']
};

COUNTRIES.forEach((country) => {
  country.capitals = CAPITALS[country.name] || [];
});

window.__COUNTRIES_GAME_DATA = {
  REGIONS,
  REGION_LABELS,
  COUNTRIES,
  CAPITALS
};

if (window.location.pathname.endsWith('/duo.html')) {
  import('./duo.js');
} else {
const countryByKey = new Map();
const guessed = new Set();
const quizCorrect = new Set();
const quizSkipped = new Set();
const collator = new Intl.Collator('ru');
const total = COUNTRIES.length;
const durationSeconds = 15 * 60;
const populationSliderMax = 1000;
const defaultPopulationGuess = 650;
const storageKey = 'countries-game-state-v2';
const recordsKey = 'countries-game-records-v1';
const populationStorageKey = 'countries-game-populations-v1';
const englishCapitalStorageKey = 'countries-game-english-capitals-v1';
const countryMemoryKey = 'countries-game-country-memory-v1';

let activeMode = 'countries';
let activeLanguage = 'ru';
let selectedRegions = new Set(REGIONS);
let quizQueue = [];
let quizIndex = 0;
let revealedCountryName = '';
let populationGuess = 50;
let populationPoints = 0;
let populationAnswers = {};
let secondsLeft = durationSeconds;
let elapsedSeconds = 0;
let timerId = null;
let limited = true;
let gaveUp = false;
let countrySessionRecorded = false;
let records = loadRecords();
let populationByCode = loadPopulationCache();
let englishCapitalByCode = loadEnglishCapitalCache();
let countryMemory = loadCountryMemory();

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="game">
    <header class="top">
      <div>
        <div class="classic-brand">
          <span class="classic-brand__mark">G</span>
          <h1 id="title">Страны мира</h1>
        </div>
        <p id="summary" class="summary"></p>
        <p id="stats" class="stats"></p>
      </div>
      <div class="timer">
        <span id="time">15:00</span>
        <a class="daily-link" href="./duo.html">Ежедневка</a>
        <button id="language-toggle" type="button">EN</button>
        <button id="limit-toggle" type="button">Убрать лимит</button>
        <button id="give-up" type="button" hidden>Сдаться</button>
        <button id="skip" type="button" hidden>Пропустить</button>
        <button id="reset" type="button">Сбросить</button>
      </div>
    </header>

    <section class="settings">
      <label><span id="mode-label">Режим</span>
        <select id="mode">
          ${Object.keys(MODES).map((value) => `<option value="${value}">${MODES[value]}</option>`).join('')}
        </select>
      </label>
      <div id="region-filters" class="region-filters">
        ${REGIONS.map((region) => `
          <label>
            <input type="checkbox" value="${region}" checked />
            ${region}
          </label>
        `).join('')}
      </div>
    </section>

    <div class="input-row">
      <input id="answer" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" autofocus placeholder="Введите страну" />
    </div>

    <section id="content" aria-live="polite"></section>
    <div id="country-flash" class="country-flash" aria-live="polite" aria-hidden="true">
      <div class="country-flash__flag"></div>
      <div class="country-flash__name"></div>
    </div>
  </main>
`;

const answer = document.querySelector('#answer');
const titleNode = document.querySelector('#title');
const contentNode = document.querySelector('#content');
const summaryNode = document.querySelector('#summary');
const statsNode = document.querySelector('#stats');
const timeNode = document.querySelector('#time');
const languageToggle = document.querySelector('#language-toggle');
const limitToggle = document.querySelector('#limit-toggle');
const giveUpButton = document.querySelector('#give-up');
const skipButton = document.querySelector('#skip');
const resetButton = document.querySelector('#reset');
const modeSelect = document.querySelector('#mode');
const modeLabel = document.querySelector('#mode-label');
const regionFilters = document.querySelector('#region-filters');
const inputRow = document.querySelector('.input-row');
const countryFlash = document.querySelector('#country-flash');
const countryFlashFlag = countryFlash.querySelector('.country-flash__flag');
const countryFlashName = countryFlash.querySelector('.country-flash__name');
let countryFlashTimer = null;

COUNTRIES.forEach((country) => {
  const keys = [country.name, ...country.aliases].map(normalize);
  keys.forEach((key) => countryByKey.set(key, country));
});

restoreState();
ensureQuizQueue();
syncLanguage();
syncControls();
startTimer();
hydratePopulationData();

answer.addEventListener('input', () => {
  if (isCountryEntryMode()) {
    if (!gaveUp && (!limited || secondsLeft > 0)) {
      acceptCountry(answer.value);
    }
    return;
  }

  acceptQuiz(answer.value);
});

languageToggle.addEventListener('click', () => {
  activeLanguage = activeLanguage === 'ru' ? 'en' : 'ru';
  answer.value = '';
  saveState();
  syncLanguage();
  render();
  syncControls();
  answer.focus();
});

modeSelect.addEventListener('change', () => {
  activeMode = modeSelect.value;
  answer.value = '';
  revealedCountryName = '';
  resetQuiz();
  saveState();
  render();
  syncControls();
  startTimer();
  answer.focus();
});

regionFilters.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  if (input.checked) {
    selectedRegions.add(input.value);
  } else if (selectedRegions.size > 1) {
    selectedRegions.delete(input.value);
  } else {
    input.checked = true;
  }

  resetQuiz();
  saveState();
  render();
  syncControls();
  answer.focus();
});

limitToggle.addEventListener('click', () => {
  limited = false;
  secondsLeft = durationSeconds;
  saveState();
  syncControls();
  startTimer();
  answer.disabled = false;
  answer.focus();
});

giveUpButton.addEventListener('click', () => {
  gaveUp = true;
  recordCountryModeAttempt();
  answer.value = '';
  answer.disabled = true;
  answer.placeholder = tr('gameOver');
  saveState();
  render();
  syncControls();
});

skipButton.addEventListener('click', () => {
  if (revealedCountryName) {
    advanceQuiz();
    return;
  }

  const country = currentQuizCountry();
  if (!country) {
    return;
  }

  revealedCountryName = country.name;
  quizSkipped.add(country.name);
  recordCountryMemory(country, false);
  if (activeMode === 'population') {
    populationPoints = Math.max(0, populationPoints);
  }
  answer.value = '';
  saveState();
  render();
  syncControls();
  answer.focus();
});

resetButton.addEventListener('click', resetGame);

contentNode.addEventListener('input', (event) => {
  if (activeMode !== 'population' || !event.target.classList.contains('population-row-slider')) {
    return;
  }

  const countryName = event.target.dataset.country;
  populationAnswers[countryName] = {
    ...(populationAnswers[countryName] || {}),
    slider: Number(event.target.value)
  };

  const output = event.target.closest('.population-cell')?.querySelector('.population-output');
  if (output) {
    output.textContent = formatPopulationGuess(populationFromSlider(event.target.value));
  }
  saveState();
});

contentNode.addEventListener('click', (event) => {
  if (activeMode !== 'population' || !event.target.classList.contains('population-row-submit')) {
    return;
  }

  submitPopulationAnswer(event.target.dataset.country);
});

render();
answer.focus();

function acceptCountry(value) {
  const country = findCountryByAnswer(value);

  if (!country || guessed.has(country.name)) {
    return;
  }

  guessed.add(country.name);
  answer.value = '';
  showCountryFlash(country);
  updateRecord();
  saveState();
  render();

  if (guessed.size === total) {
    recordCountryModeAttempt();
    if (activeMode === 'population') {
      window.clearInterval(timerId);
      timerId = null;
      answer.disabled = true;
      answer.placeholder = tr('allDone');
      updateRecord();
      saveState();
      syncControls();
    } else {
      finish(tr('allDone'));
    }
  }
}

function showCountryFlash(country) {
  window.clearTimeout(countryFlashTimer);
  countryFlashFlag.textContent = country.flag;
  countryFlashName.textContent = countryName(country);
  countryFlash.hidden = false;
  countryFlash.setAttribute('aria-hidden', 'false');
  countryFlash.classList.remove('is-visible');
  void countryFlash.offsetWidth;
  countryFlash.classList.add('is-visible');

  countryFlashTimer = window.setTimeout(() => {
    countryFlash.classList.remove('is-visible');
    countryFlash.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      if (!countryFlash.classList.contains('is-visible')) {
        countryFlash.hidden = true;
      }
    }, 180);
  }, 1000);
}

function acceptQuiz(value) {
  const country = currentQuizCountry();
  if (activeMode === 'population') {
    return;
  }

  if (!country || revealedCountryName || !isQuizAnswerCorrect(country, value)) {
    return;
  }

  quizCorrect.add(country.name);
  recordCountryMemory(country, true);
  answer.value = '';
  updateRecord();
  advanceQuiz();
}

function submitPopulationGuess() {
  const country = currentQuizCountry();
  const exact = country ? populationValue(country) : 0;
  if (!country || !exact || revealedCountryName) {
    return;
  }

  const guess = populationFromSlider(populationGuess);
  const errorPercent = Math.abs(guess - exact) / exact;
  const points = populationPointsFor(errorPercent);

  if (points > 0) {
    quizCorrect.add(country.name);
  } else {
    quizSkipped.add(country.name);
  }

  populationPoints += points;
  revealedCountryName = country.name;
  recordCountryMemory(country, points > 0);
  updateRecord();
  saveState();
  render();
  syncControls();
}

function submitPopulationAnswer(countryName) {
  const country = countryByName(countryName);
  const exact = country ? populationValue(country) : 0;
  if (!country || !exact || !guessed.has(country.name)) {
    return;
  }

  const slider = populationSliderValue(populationAnswers[country.name]?.slider);
  const guess = populationFromSlider(slider);
  const result = populationScoreFor(guess, exact);

  populationAnswers[country.name] = {
    slider,
    guess,
    points: result.points,
    errorPercent: result.errorPercent
  };
  updateRecord();
  saveState();
  render();
  syncControls();
}

function populationPointsFor(errorPercent) {
  if (errorPercent <= 0.1) {
    return 100;
  }

  if (errorPercent <= 0.2) {
    return 50;
  }

  return 0;
}

function populationScoreFor(guess, exact) {
  const numericGuess = Number(guess) || 0;
  if (numericGuess === 0) {
    return {
      points: exact < 10_000 ? 100 : 0,
      errorPercent: exact < 10_000 ? 0 : 1
    };
  }

  if (exact < 100_000 && numericGuess < 100_000) {
    return {
      points: 100,
      errorPercent: 0
    };
  }

  const absoluteError = Math.abs(numericGuess - exact);
  const fullTolerance = Math.max(exact * 0.1, 25_000);
  const partialTolerance = Math.max(exact * 0.2, 100_000);
  const errorPercent = populationErrorPercent(numericGuess, exact);

  if (absoluteError <= fullTolerance) {
    return { points: 100, errorPercent };
  }

  if (absoluteError <= partialTolerance) {
    return { points: 50, errorPercent };
  }

  return { points: 0, errorPercent };
}

function render() {
  modeSelect.value = activeMode;
  regionFilters.querySelectorAll('input').forEach((input) => {
    input.checked = selectedRegions.has(input.value);
  });

  if (isCountryEntryMode()) {
    summaryNode.textContent = activeLanguage === 'en' ? `${guessed.size} of ${total}` : `${guessed.size} из ${total}`;
    statsNode.textContent = countryStatsText();
    contentNode.className = 'regions';
    contentNode.innerHTML = renderCountryTables();
    return;
  }

  const done = Math.min(quizIndex, quizQueue.length);
  summaryNode.textContent = `${done}/${quizQueue.length}`;
  statsNode.textContent = quizStatsText();
  contentNode.className = 'quiz-wrap';
  contentNode.innerHTML = renderQuiz();
}

function renderCountryTables() {
  return REGIONS.map((region) => {
    const countries = countriesForRegion(region);
    const found = countries.filter((country) => guessed.has(country.name));
    const percent = Math.round((found.length / countries.length) * 100);
    const rows = countries.map((country) => {
      const isFound = guessed.has(country.name);
      const isMissed = gaveUp && !isFound;
      const flag = isFound || isMissed ? country.flag : '';
      const displayName = countryName(country);
      const name = isFound || isMissed ? displayName : placeholderFor(displayName);
      const className = isMissed ? ' class="missed"' : '';
      const capital = isFound || isMissed ? `${tr('capital')}: ${firstCapital(country)}` : '';
      const population = populationCell(country, isFound, isMissed);
      const memory = countryGameEnded() ? memoryText(country) : '';

      return `<tr${className}><td class="flag">${flag}</td><td>${name}</td><td class="detail">${capital}</td><td class="detail">${population}</td><td class="detail memory">${memory}</td></tr>`;
    }).join('');

    return `
      <article class="region">
        <h2>${regionName(region)} <span>${percent}% · ${found.length}/${countries.length} · ${tr('missed')} ${countries.length - found.length}</span></h2>
        <table>
          <tbody>${rows}</tbody>
        </table>
      </article>
    `;
  }).join('');
}

function populationCell(country, isFound, isMissed) {
  if (activeMode !== 'population') {
    return isFound || isMissed ? `${tr('population')}: ${populationText(country)}` : '';
  }

  if (!isFound && !isMissed) {
    return '';
  }

  if (isMissed) {
    return `${tr('population')}: ${populationText(country)}`;
  }

  const exact = populationValue(country);
  if (!exact) {
    return `${tr('population')}: ${tr('populationLoading')}`;
  }

  const answer = populationAnswers[country.name];
  if (answer?.guess) {
    const result = populationScoreFor(answer.guess, exact);
    return `
      <div class="population-cell">
        <div>${tr('selectedPopulation')}: ${formatPopulationGuess(answer.guess)}</div>
        <div>${tr('exactPopulation')}: ${formatPopulation(exact)}</div>
        <div>${tr('points')}: ${result.points} · ${tr('populationError')} ${Math.round(result.errorPercent * 100)}%</div>
      </div>
    `;
  }

  const slider = populationSliderValue(answer?.slider);
  const selected = populationFromSlider(slider);
  return `
    <div class="population-cell">
      <input class="population-row-slider" data-country="${country.name}" type="range" min="0" max="${populationSliderMax}" step="1" value="${slider}" />
      <div>${tr('selectedPopulation')}: <strong class="population-output">${formatPopulationGuess(selected)}</strong></div>
      <button class="population-row-submit" data-country="${country.name}" type="button">${tr('submitPopulationRow')}</button>
    </div>
  `;
}

function renderQuiz() {
  const country = currentQuizCountry();
  if (!country) {
    return `
      <article class="quiz done">
        <div class="question">${tr('done')}</div>
        <p>${quizStatsText()}</p>
      </article>
    `;
  }

  if (activeMode === 'population') {
    return renderPopulationQuiz(country);
  }

  const answerText = answerFor(country);
  const reveal = revealedCountryName === country.name
    ? `<p class="answer-line">${tr('answer')}: <strong>${answerText}</strong></p>`
    : '';

  return `
    <article class="quiz">
      <div class="quiz-count">${quizIndex + 1}/${quizQueue.length}</div>
      ${questionFor(country)}
      ${reveal}
    </article>
  `;
}

function renderPopulationQuiz(country) {
  const exact = populationValue(country);
  const selected = populationFromSlider(populationGuess);
  const reveal = revealedCountryName === country.name && exact
    ? `<p class="answer-line">${tr('exactPopulation')}: <strong>${formatPopulation(exact)}</strong></p>`
    : '';

  return `
    <article class="quiz population-quiz">
      <div class="quiz-count">${quizIndex + 1}/${quizQueue.length}</div>
      <div class="question">${country.flag} ${countryName(country)}</div>
      <div class="population-control">
        <label for="population-slider">${tr('populationMode')}</label>
        <input id="population-slider" type="range" min="0" max="100" value="${populationGuess}" ${exact ? '' : 'disabled'} />
        <div class="population-value">${tr('selectedPopulation')}: <strong id="population-output">${formatPopulation(selected)}</strong></div>
        <button id="population-submit" type="button" ${exact && revealedCountryName !== country.name ? '' : 'disabled'}>${tr('submitPopulation')}</button>
      </div>
      ${exact ? reveal : `<p class="answer-line">${tr('populationLoading')}</p>`}
    </article>
  `;
}

function questionFor(country) {
  if (activeMode === 'flagCountry') {
    return `<div class="big-flag">${country.flag}</div>`;
  }

  if (activeMode === 'countryCapital') {
    return `<div class="question">${country.flag} ${countryName(country)}</div>`;
  }

  return `<div class="question">${firstCapital(country)}</div>`;
}

function answerFor(country) {
  if (activeMode === 'countryCapital') {
    return capitalAnswers(country).join(' / ');
  }

  return `${country.flag} ${countryName(country)}`;
}

function isQuizAnswerCorrect(country, value) {
  const key = normalize(value);
  if (!key) {
    return false;
  }

  if (activeMode === 'countryCapital') {
    return capitalAnswers(country).map(normalize).includes(key);
  }

  return countryAnswerNames(country).map(normalize).includes(key);
}

function advanceQuiz() {
  quizIndex += 1;
  revealedCountryName = '';
  populationGuess = 50;
  updateRecord();
  saveState();
  render();
  syncControls();
  answer.focus();
}

function resetQuiz() {
  quizCorrect.clear();
  quizSkipped.clear();
  quizIndex = 0;
  elapsedSeconds = 0;
  populationGuess = 50;
  populationPoints = 0;
  populationAnswers = {};
  revealedCountryName = '';
  quizQueue = makeQuizQueue();
}

function ensureQuizQueue() {
  if (!quizQueue.length || quizQueue.some((name) => !countryByName(name))) {
    quizQueue = makeQuizQueue();
    quizIndex = 0;
    revealedCountryName = '';
  }
}

function makeQuizQueue() {
  return shuffle(COUNTRIES
    .filter((country) => selectedRegions.has(country.region))
    .filter((country) => activeMode !== 'countryCapital' || country.capitals.length)
    .filter((country) => activeMode !== 'capitalCountry' || country.capitals.length)
    .filter((country) => activeMode !== 'population' || populationValue(country))
    .map((country) => country.name));
}

function currentQuizCountry() {
  return countryByName(quizQueue[quizIndex]);
}

function countryByName(name) {
  return COUNTRIES.find((country) => country.name === name);
}

function countriesForRegion(region) {
  return COUNTRIES
    .filter((country) => country.region === region)
    .sort((a, b) => collator.compare(a.name, b.name));
}

function tick() {
  if (!isCountryEntryMode()) {
    if (quizIndex < quizQueue.length) {
      elapsedSeconds += 1;
      updateRecord();
      saveState();
      render();
    }
    return;
  }

  if (!limited || gaveUp) {
    if (activeMode === 'population' && !countryGameEnded()) {
      elapsedSeconds += 1;
      updateRecord();
      saveState();
      render();
    }
    return;
  }

  if (activeMode === 'population') {
    elapsedSeconds += 1;
  }
  secondsLeft -= 1;
  timeNode.textContent = formatTime(secondsLeft);
  saveState();

  if (secondsLeft <= 0) {
    updateRecord();
    recordCountryModeAttempt();
    finish(tr('timeUp'));
  }
}

function finish(message) {
  window.clearInterval(timerId);
  timerId = null;
  answer.disabled = true;
  answer.placeholder = message;
  timeNode.textContent = message;
  saveState();
  syncControls();
}

function startTimer() {
  window.clearInterval(timerId);
  timerId = null;

  if (!isCountryEntryMode() || (limited && !gaveUp && secondsLeft > 0 && guessed.size < total) || (activeMode === 'population' && !countryGameEnded())) {
    timerId = window.setInterval(tick, 1000);
  }

  syncControls();
}

function syncControls() {
  const isCountryMode = isCountryEntryMode();
  const quizDone = !isCountryMode && quizIndex >= quizQueue.length;

  timeNode.hidden = !isCountryMode;
  regionFilters.hidden = isCountryMode;
  inputRow.hidden = !isCountryMode && activeMode === 'population';
  limitToggle.hidden = !isCountryMode || !limited || gaveUp || guessed.size === total;
  giveUpButton.hidden = !isCountryMode || limited || gaveUp || guessed.size === total;
  skipButton.hidden = isCountryMode || quizDone;
  skipButton.textContent = revealedCountryName ? tr('next') : tr('skip');
  answer.disabled = isCountryMode
    ? gaveUp || (limited && secondsLeft <= 0) || guessed.size === total
    : quizDone;
  answer.placeholder = isCountryMode ? tr('inputCountry') : placeholderForMode();

  if (isCountryMode) {
    timeNode.textContent = activeMode === 'population'
      ? `${limited ? formatTime(secondsLeft) : tr('noLimit')} · ${formatTime(elapsedSeconds)}`
      : limited ? formatTime(secondsLeft) : tr('noLimit');
  } else {
    timeNode.hidden = false;
    timeNode.textContent = formatTime(elapsedSeconds);
  }
}

function syncLanguage() {
  document.documentElement.lang = activeLanguage;
  titleNode.textContent = tr('title');
  modeLabel.textContent = tr('mode');
  languageToggle.textContent = activeLanguage === 'ru' ? 'EN' : 'RU';
  limitToggle.textContent = tr('removeLimit');
  giveUpButton.textContent = tr('giveUp');
  resetButton.textContent = tr('reset');
  modeSelect.querySelectorAll('option').forEach((option) => {
    option.textContent = MODE_LABELS[activeLanguage][option.value];
  });
  regionFilters.querySelectorAll('label').forEach((label) => {
    const input = label.querySelector('input');
    label.lastChild.textContent = ` ${regionName(input.value)}`;
  });
}

function countryStatsText() {
  const percent = Math.round((guessed.size / total) * 100);
  const remaining = total - guessed.size;
  const record = currentRecord();
  if (activeMode === 'population') {
    const populationStats = populationCompetitionStats();
    return [
      `${tr('correct')} ${guessed.size}`,
      `${tr('remaining')} ${remaining}`,
      `${percent}%`,
      `${tr('populationSubmitted')} ${populationStats.submitted}/${guessed.size}`,
      `${tr('wrong')} ${populationStats.wrong}`,
      `${tr('points')} ${populationStats.score}`,
      `${tr('record')} ${tr('points').toLowerCase()} ${record.bestScore || 0}`
    ].join(' · ');
  }

  return [
    `${tr('correct')} ${guessed.size}`,
    `${tr('remaining')} ${remaining}`,
    `${percent}%`,
    `${tr('record')} ${record.bestCorrect || 0}/${total} (${record.bestPercent || 0}%)`
  ].join(' · ');
}

function countryGameEnded() {
  return gaveUp || (limited && secondsLeft <= 0) || guessed.size === total;
}

function recordCountryModeAttempt() {
  if (countrySessionRecorded) {
    return;
  }

  COUNTRIES.forEach((country) => {
    recordCountryMemory(country, guessed.has(country.name));
  });
  countrySessionRecorded = true;
  saveState();
}

function quizStatsText() {
  const correct = quizCorrect.size;
  const wrong = quizSkipped.size;
  const remaining = Math.max(0, quizQueue.length - quizIndex);
  const percent = quizQueue.length ? Math.round((correct / quizQueue.length) * 100) : 0;
  const record = currentRecord();
  const recordTime = record.bestTimeSeconds == null ? '' : ` · ${tr('time')} ${formatTime(record.bestTimeSeconds)}`;
  const points = activeMode === 'population'
    ? ` · ${tr('points')} ${populationFinalScore()} · ${tr('record')} ${tr('points').toLowerCase()} ${record.bestScore || 0}`
    : '';

  return [
    `${tr('correct')} ${correct}`,
    `${tr('wrong')} ${wrong}`,
    `${tr('remaining')} ${remaining}`,
    `${percent}%`,
    `${tr('stopwatch')} ${formatTime(elapsedSeconds)}`,
    `${tr('record')} ${record.bestCorrect || 0}/${quizQueue.length} (${record.bestPercent || 0}%)${recordTime}${points}`
  ].join(' · ');
}

function updateRecord() {
  const key = recordKey();
  const current = currentRecord();
  const totalCount = isCountryEntryMode() ? total : quizQueue.length;
  const correct = isCountryEntryMode() ? guessed.size : quizCorrect.size;
  const percent = totalCount ? Math.round((correct / totalCount) * 100) : 0;
  const score = activeMode === 'population' ? populationCompetitionStats().score : null;
  const completed = isCountryEntryMode() ? countryGameEnded() : quizIndex >= quizQueue.length;
  const betterScore = percent > (current.bestPercent || 0);
  const betterPointScore = score != null && score > (current.bestScore || 0);
  const sameScoreFaster = percent === current.bestPercent
    && completed
    && (current.bestTimeSeconds == null || elapsedSeconds < current.bestTimeSeconds);

  if (!betterScore && !betterPointScore && !sameScoreFaster) {
    return;
  }

  records[key] = {
    bestCorrect: correct,
    bestTotal: totalCount,
    bestPercent: percent,
    bestTimeSeconds: activeMode === 'countries' ? null : elapsedSeconds,
    bestScore: score ?? current.bestScore ?? null
  };
  localStorage.setItem(recordsKey, JSON.stringify(records));
}

function currentRecord() {
  return records[recordKey()] || {};
}

function recordKey() {
  if (activeMode === 'countries') {
    return `countries:${activeLanguage}`;
  }

  if (activeMode === 'population') {
    return `populationCompetition:${activeLanguage}`;
  }

  return `${activeMode}:${activeLanguage}:${[...selectedRegions].sort().join('|')}`;
}

function placeholderForMode() {
  if (activeMode === 'countryCapital') {
    return tr('inputCapital');
  }

  return tr('inputCountry');
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({
    activeMode,
    activeLanguage,
    selectedRegions: [...selectedRegions],
    quizQueue,
    quizIndex,
    quizCorrect: [...quizCorrect],
    quizSkipped: [...quizSkipped],
    revealedCountryName,
    populationGuess,
    populationPoints,
    populationAnswers,
    elapsedSeconds,
    guessed: [...guessed],
    secondsLeft,
    limited,
    gaveUp,
    countrySessionRecorded
  }));
}

function restoreState() {
  try {
    const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const knownCountries = new Set(COUNTRIES.map((country) => country.name));

    if (state.activeMode && MODES[state.activeMode]) {
      activeMode = state.activeMode;
    }

    if (state.activeLanguage === 'en' || state.activeLanguage === 'ru') {
      activeLanguage = state.activeLanguage;
    }

    if (Array.isArray(state.selectedRegions)) {
      const restored = state.selectedRegions.filter((region) => REGIONS.includes(region));
      selectedRegions = new Set(restored.length ? restored : REGIONS);
    }

    if (Array.isArray(state.guessed)) {
      state.guessed.forEach((name) => {
        if (knownCountries.has(name)) {
          guessed.add(name);
        }
      });
    }

    if (Array.isArray(state.quizQueue)) {
      quizQueue = state.quizQueue.filter((name) => knownCountries.has(name));
    }

    if (Array.isArray(state.quizCorrect)) {
      state.quizCorrect.forEach((name) => {
        if (knownCountries.has(name)) {
          quizCorrect.add(name);
        }
      });
    }

    if (Array.isArray(state.quizSkipped)) {
      state.quizSkipped.forEach((name) => {
        if (knownCountries.has(name)) {
          quizSkipped.add(name);
        }
      });
    }

    if (Number.isFinite(state.quizIndex)) {
      quizIndex = clampNumber(state.quizIndex, 0, quizQueue.length);
    }

    if (Number.isFinite(state.elapsedSeconds)) {
      elapsedSeconds = Math.max(0, state.elapsedSeconds);
    }

    if (Number.isFinite(state.populationGuess)) {
      populationGuess = clampNumber(state.populationGuess, 0, 100);
    }

    if (Number.isFinite(state.populationPoints)) {
      populationPoints = Math.max(0, state.populationPoints);
    }

    if (state.populationAnswers && typeof state.populationAnswers === 'object') {
      populationAnswers = Object.fromEntries(Object.entries(state.populationAnswers)
        .filter(([name, answer]) => knownCountries.has(name) && answer && typeof answer === 'object'));
    }

    if (typeof state.revealedCountryName === 'string' && knownCountries.has(state.revealedCountryName)) {
      revealedCountryName = state.revealedCountryName;
    }

    if (Number.isFinite(state.secondsLeft)) {
      secondsLeft = clampNumber(state.secondsLeft, 0, durationSeconds);
    }

    if (typeof state.limited === 'boolean') {
      limited = state.limited;
    }

    if (typeof state.gaveUp === 'boolean') {
      gaveUp = state.gaveUp;
    }

    if (typeof state.countrySessionRecorded === 'boolean') {
      countrySessionRecorded = state.countrySessionRecorded;
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function resetGame() {
  guessed.clear();
  quizCorrect.clear();
  quizSkipped.clear();
  secondsLeft = durationSeconds;
  elapsedSeconds = 0;
  populationGuess = 50;
  populationPoints = 0;
  populationAnswers = {};
  limited = true;
  gaveUp = false;
  countrySessionRecorded = false;
  quizIndex = 0;
  revealedCountryName = '';
  quizQueue = makeQuizQueue();
  answer.value = '';
  answer.disabled = false;
  answer.placeholder = placeholderForMode();
  localStorage.removeItem(storageKey);
  render();
  startTimer();
  answer.focus();
}

function loadRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(recordsKey) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    localStorage.removeItem(recordsKey);
    return {};
  }
}

function loadCountryMemory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(countryMemoryKey) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    localStorage.removeItem(countryMemoryKey);
    return {};
  }
}

function tr(key) {
  return TEXT[activeLanguage][key];
}

function regionName(region) {
  return REGION_LABELS[activeLanguage][region] || region;
}

function countryName(country) {
  if (activeLanguage === 'ru') {
    return country.name;
  }

  const code = flagToCountryCode(country.flag);
  const name = englishCountryName(code);
  return name === code ? country.aliases.find((alias) => /^[a-z]/i.test(alias)) || country.name : name;
}

function englishCountryName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function countryAnswerNames(country) {
  if (activeLanguage === 'ru') {
    return [country.name, ...country.aliases];
  }

  const englishAliases = country.aliases.filter((alias) => /^[a-z]/i.test(alias));
  return [countryName(country), ...englishAliases];
}

function findCountryByAnswer(value) {
  const key = normalize(value);
  if (!key) {
    return null;
  }

  return COUNTRIES.find((country) => countryAnswerNames(country).map(normalize).includes(key)) || null;
}

function capitalAnswers(country) {
  if (activeLanguage === 'ru') {
    return country.capitals;
  }

  const englishCapital = englishCapitalByCode[flagToCountryCode(country.flag)];
  return englishCapital ? [englishCapital] : [];
}

function recordCountryMemory(country, remembered) {
  const previous = countryMemory[country.name] || {
    seen: 0,
    remembered: 0,
    forgotten: 0,
    lastResult: '',
    learnedCount: 0
  };
  const wasForgotten = previous.lastResult === 'forgotten';
  const next = {
    ...previous,
    seen: previous.seen + 1,
    remembered: previous.remembered + (remembered ? 1 : 0),
    forgotten: previous.forgotten + (remembered ? 0 : 1),
    lastResult: remembered ? 'remembered' : 'forgotten',
    lastPlayedAt: new Date().toISOString(),
    learnedCount: previous.learnedCount + (remembered && wasForgotten ? 1 : 0)
  };

  countryMemory[country.name] = next;
  localStorage.setItem(countryMemoryKey, JSON.stringify(countryMemory));
}

function memoryText(country) {
  const memory = countryMemory[country.name];
  if (!memory || !memory.seen) {
    return `${tr('stats')}: ${tr('newCountry')}`;
  }

  const forgottenPercent = Math.round((memory.forgotten / memory.seen) * 100);
  const status = memoryStatus(memory, forgottenPercent);
  return `${tr('stats')}: ${status} · ${tr('forgotten')} ${memory.forgotten}/${memory.seen} (${forgottenPercent}%)`;
}

function memoryStatus(memory, forgottenPercent) {
  if (memory.seen === 1 && memory.lastResult === 'remembered') {
    return tr('newRemembered');
  }

  if (memory.lastResult === 'remembered' && memory.learnedCount > 0) {
    return tr('recentlyLearned');
  }

  if (memory.lastResult === 'forgotten' && memory.forgotten === 1 && memory.seen <= 2) {
    return tr('newForgotten');
  }

  if (memory.forgotten >= 2 && forgottenPercent >= 60) {
    return tr('oftenForgotten');
  }

  if (memory.forgotten > 0) {
    return tr('sometimesForgotten');
  }

  return tr('usuallyRemembered');
}

function firstCapital(country) {
  return capitalAnswers(country)[0] || (activeLanguage === 'en' ? 'loading' : '—');
}

function populationText(country) {
  const code = flagToCountryCode(country.flag);
  const population = populationByCode[code];

  if (!population) {
    return tr('populationLoading');
  }

  return formatPopulation(population);
}

function populationValue(country) {
  return populationByCode[flagToCountryCode(country.flag)] || 0;
}

function populationFromSlider(value) {
  const position = clampNumber(Math.round(Number(value) || 0), 0, populationSliderMax);
  if (position === 0) {
    return 0;
  }

  if (position <= 100) {
    return Math.round((10_000 + (position / 100) * 90_000) / 10_000) * 10_000;
  }

  if (position <= 650) {
    const progress = (position - 100) / 550;
    return Math.round((100_000 + progress * 9_900_000) / 100_000) * 100_000;
  }

  if (position <= 850) {
    const progress = (position - 650) / 200;
    return Math.round((10_000_000 + progress * 90_000_000) / 1_000_000) * 1_000_000;
  }

  const progress = (position - 850) / 150;
  return Math.round((100_000_000 + progress * 1_400_000_000) / 10_000_000) * 10_000_000;
}

function populationSliderValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return defaultPopulationGuess;
  }

  if (numeric > populationSliderMax) {
    return populationToSlider(numeric);
  }

  return clampNumber(Math.round(numeric), 0, populationSliderMax);
}

function populationToSlider(population) {
  const value = Number(population) || 0;
  if (value < 10_000) {
    return 0;
  }

  if (value <= 100_000) {
    return clampNumber(Math.round(((value - 10_000) / 90_000) * 100), 1, 100);
  }

  if (value <= 10_000_000) {
    return Math.round(100 + ((value - 100_000) / 9_900_000) * 550);
  }

  if (value <= 100_000_000) {
    return Math.round(650 + ((value - 10_000_000) / 90_000_000) * 200);
  }

  return clampNumber(Math.round(850 + ((value - 100_000_000) / 1_400_000_000) * 150), 850, populationSliderMax);
}

function populationErrorPercent(guess, exact) {
  if (guess === 0) {
    return exact < 10_000 ? 0 : 1;
  }

  return Math.abs(guess - exact) / exact;
}

function populationFinalScore() {
  return Math.max(0, populationPoints - quizSkipped.size * 25 - Math.floor(elapsedSeconds / 5));
}

function populationCompetitionStats() {
  const foundCountries = COUNTRIES.filter((country) => guessed.has(country.name));
  const answers = foundCountries
    .map((country) => {
      const answer = populationAnswers[country.name];
      const exact = populationValue(country);
      return answer?.guess && exact ? populationScoreFor(answer.guess, exact) : null;
    })
    .filter(Boolean);
  const populationScore = answers.reduce((sum, answer) => sum + answer.points, 0);
  const wrong = answers.filter((answer) => !answer.points).length;
  const missedCountries = total - guessed.size;
  const countryScore = guessed.size * 50;
  const missedPenalty = missedCountries * 50;
  const wrongPenalty = wrong * 25;
  const timePenalty = Math.floor(elapsedSeconds / 10);

  return {
    submitted: answers.length,
    wrong,
    score: Math.max(0, countryScore + populationScore - missedPenalty - wrongPenalty - timePenalty)
  };
}

function isCountryEntryMode() {
  return activeMode === 'countries' || activeMode === 'population';
}

function formatPopulation(value) {
  return new Intl.NumberFormat(activeLanguage === 'en' ? 'en-US' : 'ru-RU').format(value);
}

function formatPopulationGuess(value) {
  return value === 0 ? tr('underTenThousand') : formatPopulation(value);
}

function flagToCountryCode(flag) {
  return [...flag]
    .map((char) => String.fromCharCode(char.codePointAt(0) - 127397))
    .join('');
}

function loadPopulationCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(populationStorageKey) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    localStorage.removeItem(populationStorageKey);
    return {};
  }
}

function loadEnglishCapitalCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(englishCapitalStorageKey) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    localStorage.removeItem(englishCapitalStorageKey);
    return {};
  }
}

async function hydratePopulationData() {
  const neededCodes = new Set(COUNTRIES.map((country) => flagToCountryCode(country.flag)));
  const hasAll = [...neededCodes].every((code) => populationByCode[code] && englishCapitalByCode[code]);

  if (hasAll) {
    return;
  }

  try {
    const response = await fetch('https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json');
    const data = await response.json();
    data.forEach((country) => {
      if (country.iso2 && Number.isFinite(country.population)) {
        populationByCode[country.iso2] = country.population;
      }
      if (country.iso2 && country.capital) {
        englishCapitalByCode[country.iso2] = country.capital;
      }
    });
    localStorage.setItem(populationStorageKey, JSON.stringify(populationByCode));
    localStorage.setItem(englishCapitalStorageKey, JSON.stringify(englishCapitalByCode));
    if (activeMode === 'population' && !quizQueue.length) {
      resetQuiz();
    }
    render();
  } catch {
    // Population is a bonus detail; the game should still work offline.
  }
}

function placeholderFor(name) {
  return `${name[0]}${'·'.repeat(Math.max(2, name.length - 1))}`;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatTime(seconds) {
  const minutes = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
  const rest = (Math.max(0, seconds) % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function normalize(value) {
  return value
    .toLowerCase()
    .replaceAll('ё', 'е')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-zа-я0-9]/g, '');
}
}
