/* Подкатегории внутри континентов для списка в режиме «Страны». Коды ISO 3166-1. */
const g = (id, ru, en, sr, isos) => ({ id, name: { ru, en, sr }, isos });

export const SUBREGIONS = {
  "Северная Америка": [
    g("na-north", "США, Канада и Мексика", "USA, Canada and Mexico", "SAD, Kanada i Meksiko", ["US", "CA", "MX"]),
    g("na-central", "Центральная Америка", "Central America", "Centralna Amerika", ["BZ", "GT", "HN", "SV", "NI", "CR", "PA"]),
    g("na-caribbean", "Карибы", "Caribbean", "Karibi", ["AG", "BS", "BB", "HT", "GD", "DM", "DO", "CU", "VC", "KN", "LC", "TT", "JM"]),
  ],
  "Южная Америка": [
    g("sa-andes", "Андские страны", "Andean countries", "Andske zemlje", ["CO", "EC", "PE", "BO", "VE"]),
    g("sa-cone", "Южный конус", "Southern Cone", "Južni konus", ["AR", "CL", "UY", "PY"]),
    g("sa-brazil", "Бразилия и Гвианы", "Brazil and the Guianas", "Brazil i Gvajane", ["BR", "GY", "SR"]),
  ],
  Европа: [
    g("eu-nordic", "Скандинавия", "Nordic countries", "Skandinavija", ["NO", "SE", "DK", "FI", "IS"]),
    g("eu-baltic", "Прибалтика", "Baltic states", "Baltičke zemlje", ["EE", "LV", "LT"]),
    g("eu-west", "Западная Европа", "Western Europe", "Zapadna Evropa", ["GB", "IE", "FR", "BE", "NL", "LU", "MC"]),
    g("eu-central", "Центральная Европа", "Central Europe", "Srednja Evropa", ["DE", "AT", "CH", "LI", "PL", "CZ", "SK", "HU"]),
    g("eu-south", "Южная Европа", "Southern Europe", "Južna Evropa", ["ES", "PT", "IT", "MT", "AD", "SM", "VA", "CY"]),
    g("eu-balkans", "Балканы", "Balkans", "Balkan", ["RS", "HR", "BA", "ME", "MK", "AL", "SI", "BG", "RO", "GR"]),
    g("eu-east", "Восточная Европа", "Eastern Europe", "Istočna Evropa", ["RU", "BY", "UA", "MD"]),
  ],
  Азия: [
    g("as-caucasus", "Закавказье", "South Caucasus", "Zakavkazje", ["GE", "AM", "AZ"]),
    g("as-mideast", "Ближний Восток", "Middle East", "Bliski istok", ["TR", "SY", "LB", "IL", "PS", "JO", "IQ", "IR", "SA", "KW", "BH", "QA", "AE", "OM", "YE"]),
    g("as-central", "Центральная Азия", "Central Asia", "Centralna Azija", ["KZ", "UZ", "TM", "KG", "TJ"]),
    g("as-south", "Южная Азия", "South Asia", "Južna Azija", ["AF", "PK", "IN", "NP", "BT", "BD", "LK", "MV"]),
    g("as-east", "Восточная Азия", "East Asia", "Istočna Azija", ["CN", "JP", "KR", "KP", "MN", "TW"]),
    g("as-southeast", "Юго-Восточная Азия", "Southeast Asia", "Jugoistočna Azija", ["VN", "LA", "KH", "TH", "MM", "MY", "SG", "ID", "PH", "BN", "TL"]),
  ],
  Африка: [
    g("af-north", "Северная Африка", "North Africa", "Severna Afrika", ["EG", "LY", "TN", "DZ", "MA", "SD"]),
    g("af-west", "Западная Африка", "West Africa", "Zapadna Afrika", ["MR", "ML", "NE", "NG", "SN", "GM", "GW", "GN", "SL", "LR", "CI", "GH", "TG", "BJ", "BF", "CV"]),
    g("af-central", "Центральная Африка", "Central Africa", "Centralna Afrika", ["TD", "CF", "CM", "GQ", "GA", "CG", "CD", "ST", "AO"]),
    g("af-east", "Восточная Африка", "East Africa", "Istočna Afrika", ["ET", "ER", "DJ", "SO", "KE", "UG", "RW", "BI", "TZ", "SS", "MZ", "MW", "ZM", "ZW", "MG", "MU", "SC", "KM"]),
    g("af-south", "Юг Африки", "Southern Africa", "Jug Afrike", ["ZA", "NA", "BW", "LS", "SZ"]),
  ],
  Океания: [
    g("oc-aunz", "Австралия и Новая Зеландия", "Australia and New Zealand", "Australija i Novi Zeland", ["AU", "NZ"]),
    g("oc-melanesia", "Меланезия", "Melanesia", "Melanezija", ["PG", "SB", "VU", "FJ"]),
    g("oc-micronesia", "Микронезия", "Micronesia", "Mikronezija", ["FM", "PW", "MH", "NR", "KI"]),
    g("oc-polynesia", "Полинезия", "Polynesia", "Polinezija", ["WS", "TO", "TV"]),
  ],
};
