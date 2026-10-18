/* SEO после сборки: для каждого раздела и языка — свой HTML с заголовком, описанием, canonical, hreflang,
   Open Graph, JSON-LD и текстом в <noscript>; плюс sitemap.xml. Домен меняется одной переменной SITE_ORIGIN. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const ORIGIN = (process.env.SITE_ORIGIN || "https://countries-game-khaki.vercel.app").replace(/\/$/, "");
const DIST = new URL("../dist/", import.meta.url).pathname;
// английский — основной, без префикса (/), русский — /ru, сербский — /rs; x-default — английский
const LANGS = { en: { seg: "", locale: "en_US", html: "en" }, ru: { seg: "ru", locale: "ru_RU", html: "ru" }, sr: { seg: "rs", locale: "sr_RS", html: "sr-Latn" } };
const SECTIONS = { countries: { slug: "", template: "index.html" }, states: { slug: "states", template: "map/index.html" }, russia: { slug: "russia", template: "map/index.html" }, about: { slug: "about", template: "about/index.html" } };

const TEXT = {
  countries: {
    ru: ["Страны мира · игра: все 196 стран, флаги, столицы и население", "Бесплатная игра-тренажёр по географии: назовите все 196 стран мира, угадайте флаги, столицы и население. Медали, таблицы лидеров и профиль с картой знаний.", "Страны мира"],
    en: ["Countries of the World quiz · all 196 countries, flags, capitals", "Free geography quiz: name all 196 countries, guess flags, capitals and population. Medals, leaderboards and a profile with your knowledge map.", "Countries of the World"],
    sr: ["Države sveta · kviz: svih 196 država, zastave, glavni gradovi", "Besplatan kviz iz geografije: upišite svih 196 država, pogodite zastave, glavne gradove i stanovništvo. Medalje, rang-liste i profil sa mapom znanja.", "Države sveta"],
  },
  states: {
    ru: ["Штаты США · впишите все 50 штатов или найдите на карте", "Игра на знание штатов США: впишите все 50 штатов по памяти или найдите каждый на карте. Медали и таблица лидеров.", "Штаты США"],
    en: ["US States quiz · name all 50 states or find them on the map", "Learn the 50 US states: type them all from memory or find each one on the map. Medals and leaderboards.", "US States"],
    sr: ["Američke države · upišite svih 50 ili ih nađite na mapi", "Kviz o američkim državama: upišite svih 50 napamet ili nađite svaku na mapi. Medalje i rang-liste.", "Američke države"],
  },
  russia: {
    ru: ["Регионы России · все 85 регионов на карте и по памяти", "Тренажёр по регионам России: назовите все 85 регионов или найдите их на карте. Медали и таблица лидеров.", "Регионы России"],
    en: ["Regions of Russia quiz · all 85 regions on the map", "Learn the 85 regions of Russia: type them from memory or find them on the map. Medals and leaderboards.", "Regions of Russia"],
    sr: ["Regioni Rusije · svih 85 regiona na mapi i napamet", "Kviz o regionima Rusije: upišite svih 85 regiona napamet ili ih nađite na mapi. Medalje i rang-liste.", "Regioni Rusije"],
  },
  about: {
    ru: ["Страны мира · всё об игре: режимы, карты, медали и достижения", "Игра по географии: 196 стран, флаги, столицы, население, штаты США и регионы России. Медали за каждый режим, профиль с картой знаний, 78 достижений, стрик и таблицы лидеров.", "Страны мира"],
    en: ["Countries of the World · modes, maps, medals and achievements", "A geography game: 196 countries, flags, capitals, population, US states and regions of Russia. Medals for every mode, a knowledge map profile, 78 achievements, streaks and leaderboards.", "Countries of the World"],
    sr: ["Države sveta · režimi, mape, medalje i dostignuća", "Igra iz geografije: 196 država, zastave, glavni gradovi, stanovništvo, američke države i regioni Rusije. Medalje za svaki režim, profil sa mapom znanja, 78 dostignuća, niz i rang-liste.", "Države sveta"],
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pathOf = (section, lang) => "/" + [LANGS[lang].seg, SECTIONS[section].slug].filter(Boolean).join("/");
const urlOf = (section, lang) => ORIGIN + pathOf(section, lang).replace(/^\/$/, "/");

function headFor(section, lang) {
  const [title, desc, name] = TEXT[section][lang];
  const url = urlOf(section, lang);
  const image = `${ORIGIN}/og/${section === "about" ? "countries" : section}-${lang}.png`;
  const alternates = Object.keys(LANGS)
    .map((l) => `    <link rel="alternate" hreflang="${LANGS[l].html === "sr-Latn" ? "sr" : l}" href="${urlOf(section, l)}" />`)
    .concat(`    <link rel="alternate" hreflang="x-default" href="${urlOf(section, "en")}" />`)
    .join("\n");
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url,
    description: desc,
    inLanguage: LANGS[lang].html,
    applicationCategory: "GameApplication",
    genre: "Geography quiz",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    image,
  };
  return `    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${url}" />
${alternates}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(TEXT.countries[lang][2])}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${LANGS[lang].locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${image}" />
    <script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

function build(section, lang, templates) {
  let html = templates[SECTIONS[section].template];
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${LANGS[lang].html}">`);
  html = html.replace(/\s*<title>[^<]*<\/title>/, "");
  html = html.replace(/\s*<meta name="description"[^>]*>/, "");
  html = html.replace("</head>", `${headFor(section, lang)}\n  </head>`);
  const [title, desc] = TEXT[section][lang];
  html = html.replace('<div id="app"></div>', `<div id="app"></div>\n    <noscript><h1>${esc(title)}</h1><p>${esc(desc)}</p></noscript>`);
  const out = DIST + (pathOf(section, lang) === "/" ? "index.html" : `${pathOf(section, lang).slice(1)}/index.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return out.replace(DIST, "");
}

// шаблоны читаем один раз: dist/index.html перезаписывается английской главной
const templates = Object.fromEntries(["index.html", "map/index.html", "about/index.html"].map((f) => [f, readFileSync(DIST + f, "utf8")]));
const written = [];
for (const section of Object.keys(SECTIONS)) {
  for (const lang of Object.keys(LANGS)) written.push(build(section, lang, templates));
}

// профиль — не индексируем
const profile = DIST + "profile/index.html";
writeFileSync(profile, readFileSync(profile, "utf8").replace("</head>", '    <meta name="robots" content="noindex, follow" />\n  </head>'));

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.keys(SECTIONS)
  .flatMap((section) =>
    Object.keys(LANGS).map(
      (lang) => `  <url>
    <loc>${urlOf(section, lang)}</loc>
    <lastmod>${today}</lastmod>
${Object.keys(LANGS).map((l) => `    <xhtml:link rel="alternate" hreflang="${l === "sr" ? "sr" : l}" href="${urlOf(section, l)}" />`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(section, "en")}" />
    <changefreq>weekly</changefreq>
    <priority>${section === "countries" ? "1.0" : section === "about" ? "0.9" : "0.8"}</priority>
  </url>`,
    ),
  )
  .join("\n")}
</urlset>
`;
writeFileSync(DIST + "sitemap.xml", sitemap);
writeFileSync(DIST + "robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log(`SEO: ${written.length} страниц (${written.join(", ")}), sitemap.xml, robots.txt, профиль noindex, origin ${ORIGIN}`);
