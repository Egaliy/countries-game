/* Регионы России: 85 субъектов (83 + Республика Крым и Севастополь, как в Natural Earth).
   id — код ISO 3166-2 (Москва RU-MOW, Московская область RU-MOS); Крым и Севастополь — crimea, sevastopol. */
export const GROUPS = [
  { id: "central", name: { ru: "Центральный", en: "Central", sr: "Centralni" } },
  { id: "northwest", name: { ru: "Северо-Западный", en: "Northwestern", sr: "Severozapadni" } },
  { id: "south", name: { ru: "Южный", en: "Southern", sr: "Južni" } },
  { id: "caucasus", name: { ru: "Северо-Кавказский", en: "North Caucasian", sr: "Severnokavkaski" } },
  { id: "volga", name: { ru: "Приволжский", en: "Volga", sr: "Privolški" } },
  { id: "urals", name: { ru: "Уральский", en: "Ural", sr: "Uralski" } },
  { id: "siberia", name: { ru: "Сибирский", en: "Siberian", sr: "Sibirski" } },
  { id: "fareast", name: { ru: "Дальневосточный", en: "Far Eastern", sr: "Dalekoistočni" } },
];

const item = (id, group, ru, en, sr, aliases = []) => ({ id, group, name: { ru, en, sr }, aliases });
const obl = (code, group, ruAdj, enCity, srAdj, extra = []) =>
  item(`RU-${code}`, group, `${ruAdj} область`, `${enCity} Oblast`, `${srAdj} oblast`, [ruAdj, enCity, `${enCity} Region`, srAdj, ...extra]);
const krai = (code, group, ruAdj, enBase, srAdj, extra = []) =>
  item(`RU-${code}`, group, `${ruAdj} край`, `${enBase} Krai`, `${srAdj} kraj`, [ruAdj, `${enBase} Territory`, srAdj, ...extra]);

export const ITEMS = [
  // Центральный
  obl("BEL", "central", "Белгородская", "Belgorod", "Belgorodska"),
  obl("BRY", "central", "Брянская", "Bryansk", "Brjanska"),
  obl("VLA", "central", "Владимирская", "Vladimir", "Vladimirska"),
  obl("VOR", "central", "Воронежская", "Voronezh", "Voronješka"),
  obl("IVA", "central", "Ивановская", "Ivanovo", "Ivanovska"),
  obl("KLU", "central", "Калужская", "Kaluga", "Kaluška"),
  obl("KOS", "central", "Костромская", "Kostroma", "Kostromska"),
  obl("KRS", "central", "Курская", "Kursk", "Kurska"),
  obl("LIP", "central", "Липецкая", "Lipetsk", "Lipecka"),
  item("RU-MOS", "central", "Московская область", "Moscow Oblast", "Moskovska oblast", ["Московская", "Подмосковье", "Moscow Region", "Moskovskaya", "Moskovska"]),
  obl("ORL", "central", "Орловская", "Oryol", "Orlovska", ["Orel"]),
  obl("RYA", "central", "Рязанская", "Ryazan", "Rjazanjska", ["Rjazanska"]),
  obl("SMO", "central", "Смоленская", "Smolensk", "Smolenska"),
  obl("TAM", "central", "Тамбовская", "Tambov", "Tambovska"),
  obl("TVE", "central", "Тверская", "Tver", "Tverska"),
  obl("TUL", "central", "Тульская", "Tula", "Tulska"),
  obl("YAR", "central", "Ярославская", "Yaroslavl", "Jaroslavska"),
  item("RU-MOW", "central", "Москва", "Moscow", "Moskva", ["город Москва"]),
  // Северо-Западный
  item("RU-KR", "northwest", "Республика Карелия", "Republic of Karelia", "Republika Karelija", ["Карелия", "Karelia", "Karelija"]),
  item("RU-KO", "northwest", "Республика Коми", "Komi Republic", "Republika Komi", ["Коми", "Komi"]),
  obl("ARK", "northwest", "Архангельская", "Arkhangelsk", "Arhangelska"),
  obl("VLG", "northwest", "Вологодская", "Vologda", "Vologodska"),
  obl("KGD", "northwest", "Калининградская", "Kaliningrad", "Kalinjingradska", ["Kaliningradska"]),
  obl("LEN", "northwest", "Ленинградская", "Leningrad", "Lenjingradska", ["Lenjingrad"]),
  obl("MUR", "northwest", "Мурманская", "Murmansk", "Murmanska"),
  obl("NGR", "northwest", "Новгородская", "Novgorod", "Novgorodska"),
  obl("PSK", "northwest", "Псковская", "Pskov", "Pskovska"),
  item("RU-SPE", "northwest", "Санкт-Петербург", "Saint Petersburg", "Sankt Peterburg", ["Петербург", "Питер", "СПб", "St Petersburg", "Sankt-Peterburg", "Peterburg"]),
  item("RU-NEN", "northwest", "Ненецкий автономный округ", "Nenets Autonomous Okrug", "Nenecki autonomni okrug", ["Ненецкий", "Ненецкий АО", "НАО", "Nenets", "Nenecki"]),
  // Южный
  item("RU-AD", "south", "Республика Адыгея", "Republic of Adygea", "Republika Adigeja", ["Адыгея", "Adygea", "Adygeya", "Adigeja"]),
  item("RU-KL", "south", "Республика Калмыкия", "Republic of Kalmykia", "Republika Kalmikija", ["Калмыкия", "Kalmykia", "Kalmikija"]),
  item("crimea", "south", "Республика Крым", "Republic of Crimea", "Republika Krim", ["Крым", "Crimea", "Krim"]),
  krai("KDA", "south", "Краснодарский", "Krasnodar", "Krasnodarski", ["Кубань"]),
  obl("AST", "south", "Астраханская", "Astrakhan", "Astrahanska"),
  obl("VGG", "south", "Волгоградская", "Volgograd", "Volgogradska"),
  obl("ROS", "south", "Ростовская", "Rostov", "Rostovska"),
  item("sevastopol", "south", "Севастополь", "Sevastopol", "Sevastopolj"),
  // Северо-Кавказский
  item("RU-DA", "caucasus", "Республика Дагестан", "Republic of Dagestan", "Republika Dagestan", ["Дагестан", "Dagestan"]),
  item("RU-IN", "caucasus", "Республика Ингушетия", "Republic of Ingushetia", "Republika Ingušetija", ["Ингушетия", "Ingushetia", "Ingušetija"]),
  item("RU-KB", "caucasus", "Кабардино-Балкарская Республика", "Kabardino-Balkarian Republic", "Kabardino-Balkarija", ["Кабардино-Балкария", "КБР", "Kabardino-Balkaria"]),
  item("RU-KC", "caucasus", "Карачаево-Черкесская Республика", "Karachay-Cherkess Republic", "Karačajevo-Čerkezija", ["Карачаево-Черкесия", "КЧР", "Karachay-Cherkessia"]),
  item("RU-SE", "caucasus", "Республика Северная Осетия — Алания", "Republic of North Ossetia–Alania", "Severna Osetija – Alanija", ["Северная Осетия", "Алания", "North Ossetia", "Alania", "Severna Osetija", "Alanija"]),
  item("RU-CE", "caucasus", "Чеченская Республика", "Chechen Republic", "Čečenska Republika", ["Чечня", "Чечения", "Chechnya", "Čečenija"]),
  krai("STA", "caucasus", "Ставропольский", "Stavropol", "Stavropoljski", ["Stavropol"]),
  // Приволжский
  item("RU-BA", "volga", "Республика Башкортостан", "Republic of Bashkortostan", "Republika Baškortostan", ["Башкортостан", "Башкирия", "Bashkortostan", "Bashkiria", "Baškortostan", "Baškirija"]),
  item("RU-ME", "volga", "Республика Марий Эл", "Mari El Republic", "Republika Marij El", ["Марий Эл", "Mari El", "Marij El"]),
  item("RU-MO", "volga", "Республика Мордовия", "Republic of Mordovia", "Republika Mordovija", ["Мордовия", "Mordovia", "Mordovija"]),
  item("RU-TA", "volga", "Республика Татарстан", "Republic of Tatarstan", "Republika Tatarstan", ["Татарстан", "Татария", "Tatarstan"]),
  item("RU-UD", "volga", "Удмуртская Республика", "Udmurt Republic", "Udmurtska Republika", ["Удмуртия", "Udmurtia", "Udmurtija"]),
  item("RU-CU", "volga", "Чувашская Республика", "Chuvash Republic", "Čuvaška Republika", ["Чувашия", "Chuvashia", "Čuvašija"]),
  krai("PER", "volga", "Пермский", "Perm", "Permski", ["Perm"]),
  obl("KIR", "volga", "Кировская", "Kirov", "Kirovska"),
  obl("NIZ", "volga", "Нижегородская", "Nizhny Novgorod", "Nižnjenovgorodska", ["Nižnji Novgorod"]),
  obl("ORE", "volga", "Оренбургская", "Orenburg", "Orenburška"),
  obl("PNZ", "volga", "Пензенская", "Penza", "Penzenska"),
  obl("SAM", "volga", "Самарская", "Samara", "Samarska"),
  obl("SAR", "volga", "Саратовская", "Saratov", "Saratovska"),
  obl("ULY", "volga", "Ульяновская", "Ulyanovsk", "Uljanovska"),
  // Уральский
  obl("KGN", "urals", "Курганская", "Kurgan", "Kurganska"),
  obl("SVE", "urals", "Свердловская", "Sverdlovsk", "Sverdlovska"),
  obl("TYU", "urals", "Тюменская", "Tyumen", "Tjumenjska", ["Tjumenska"]),
  obl("CHE", "urals", "Челябинская", "Chelyabinsk", "Čeljabinska"),
  item("RU-KHM", "urals", "Ханты-Мансийский автономный округ — Югра", "Khanty-Mansi Autonomous Okrug", "Hanti-Mansijski autonomni okrug", ["Ханты-Мансийский", "ХМАО", "Югра", "Khanty-Mansi", "Yugra", "Hanti-Mansijski"]),
  item("RU-YAN", "urals", "Ямало-Ненецкий автономный округ", "Yamalo-Nenets Autonomous Okrug", "Jamalo-Nenecki autonomni okrug", ["Ямало-Ненецкий", "ЯНАО", "Ямал", "Yamalo-Nenets", "Yamal", "Jamalo-Nenecki", "Jamal"]),
  // Сибирский
  item("RU-AL", "siberia", "Республика Алтай", "Altai Republic", "Republika Altaj", ["Алтай", "Горный Алтай", "Altai", "Gorno-Altai", "Altaj"]),
  item("RU-TY", "siberia", "Республика Тыва", "Tuva Republic", "Republika Tuva", ["Тыва", "Тува", "Tuva", "Tyva"]),
  item("RU-KK", "siberia", "Республика Хакасия", "Republic of Khakassia", "Republika Hakasija", ["Хакасия", "Khakassia", "Hakasija"]),
  krai("ALT", "siberia", "Алтайский", "Altai", "Altajski"),
  krai("KYA", "siberia", "Красноярский", "Krasnoyarsk", "Krasnojarski", ["Krasnoyarsk"]),
  obl("IRK", "siberia", "Иркутская", "Irkutsk", "Irkutska"),
  obl("KEM", "siberia", "Кемеровская", "Kemerovo", "Kemerovska", ["Кузбасс", "Kuzbass"]),
  obl("NVS", "siberia", "Новосибирская", "Novosibirsk", "Novosibirska"),
  obl("OMS", "siberia", "Омская", "Omsk", "Omska"),
  obl("TOM", "siberia", "Томская", "Tomsk", "Tomska"),
  // Дальневосточный
  item("RU-BU", "fareast", "Республика Бурятия", "Republic of Buryatia", "Republika Burjatija", ["Бурятия", "Buryatia", "Burjatija"]),
  item("RU-SA", "fareast", "Республика Саха (Якутия)", "Sakha Republic", "Republika Saha (Jakutija)", ["Якутия", "Саха", "Yakutia", "Sakha", "Jakutija", "Saha"]),
  krai("ZAB", "fareast", "Забайкальский", "Zabaykalsky", "Zabajkalski", ["Забайкалье", "Transbaikal"]),
  krai("KAM", "fareast", "Камчатский", "Kamchatka", "Kamčatski", ["Камчатка", "Kamchatka", "Kamčatka"]),
  krai("PRI", "fareast", "Приморский", "Primorsky", "Primorski", ["Приморье", "Primorye"]),
  krai("KHA", "fareast", "Хабаровский", "Khabarovsk", "Habarovski", ["Khabarovsk"]),
  obl("AMU", "fareast", "Амурская", "Amur", "Amurska"),
  obl("MAG", "fareast", "Магаданская", "Magadan", "Magadanska"),
  obl("SAK", "fareast", "Сахалинская", "Sakhalin", "Sahalinska", ["Сахалин", "Sahalin"]),
  item("RU-YEV", "fareast", "Еврейская автономная область", "Jewish Autonomous Oblast", "Jevrejska autonomna oblast", ["Еврейская", "ЕАО", "Jewish", "Jevrejska"]),
  item("RU-CHU", "fareast", "Чукотский автономный округ", "Chukotka Autonomous Okrug", "Čukotski autonomni okrug", ["Чукотка", "Чукотский", "Chukotka", "Čukotka"]),
];

export const NOT_ITEMS = [];
