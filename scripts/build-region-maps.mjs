import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const { geoPath, geoConicEqualArea, geoArea } = await import("/Users/egorgalij/Projects/countries-game/node_modules/d3-geo/src/index.js");
const OUT = "/Users/egorgalij/Projects/countries-game/src/mapgame/data";
const ms = (args) => execFileSync("./node_modules/.bin/mapshaper", args, { stdio: ["ignore", "ignore", "inherit"] });
const r1 = (n) => Math.round(n * 10) / 10;

ms(["ne_admin1.geojson", "-filter", "adm0_a3 == 'RUS'", "-filter-islands", "min-area=700km2", "remove-empty",
  "-simplify", "4%", "keep-shapes", "weighted", "-each", "id=iso_3166_2", "-filter-fields", "id", "-o", "format=geojson", "precision=0.0001", "rus.geojson", "force"]);
ms(["ne_admin1.geojson", "-filter", "adm0_a3 == 'ITA'", "-dissolve", "region", "-filter-islands", "min-area=60km2", "remove-empty",
  "-simplify", "14%", "keep-shapes", "weighted", "-each", "id=region", "-filter-fields", "id", "-o", "format=geojson", "precision=0.0001", "ita.geojson", "force"]);

/* d3 ждёт внешние кольца по часовой; если фигура «накрыла весь глобус» — разворачиваем */
const rewind = (f) => {
  if (geoArea(f) <= 2 * Math.PI) return f;
  const rev = (rings) => rings.map((r) => [...r].reverse());
  const g = f.geometry;
  g.coordinates = g.type === "Polygon" ? rev(g.coordinates) : g.coordinates.map(rev);
  return f;
};

function build({ file, out, projection, size, idOf, maxZoom }) {
  const fc = JSON.parse(readFileSync(file, "utf8"));
  fc.features.forEach(rewind);
  const keep = fc.features.filter((f) => idOf(f.properties.id));
  const skipped = fc.features.filter((f) => !idOf(f.properties.id));
  projection.fitExtent([[10, 10], [size[0] - 10, size[1] - 10]], { type: "FeatureCollection", features: keep });
  const path = geoPath(projection).digits(1);
  skipped.forEach((f) => console.log("SKIP", f.properties.id, "area px²", Math.round(path.area(f)), "centroid", path.centroid(f).map(r1)));
  const shapes = {};
  for (const f of keep) {
    const id = idOf(f.properties.id);
    shapes[id] = { d: path(f), b: path.bounds(f).flat().map(r1), c: path.centroid(f).map(r1) };
    if (!shapes[id].d) console.log("EMPTY", id);
  }
  const small = Object.entries(shapes).map(([id, s]) => [id, Math.round((s.b[2] - s.b[0]) * (s.b[3] - s.b[1])), s.c]).sort((a, b) => a[1] - b[1]).slice(0, 12);
  writeFileSync(`${OUT}/${out}`,
    `// Сгенерировано из Natural Earth 1:10m admin-1 (mapshaper + d3-geo). Не править руками.\n` +
    `export const SHAPES = ${JSON.stringify(shapes)};\nexport const EXTRA = [];\nexport const CALLOUTS = [];\nexport const CALLOUT_SIZE = [34, 20];\nexport const MAX_ZOOM = ${maxZoom};\n`);
  console.log(out, Object.keys(shapes).length, "shapes,", Math.round(readFileSync(`${OUT}/${out}`).length / 1024), "KB");
  console.log("smallest bbox px²:", JSON.stringify(small));
  return shapes;
}

/* В Natural Earth коды Москвы и Московской области перепутаны; Крым и Севастополь идут под UA-43/UA-40 */
const RUS_ID = { "RU-MOS": "RU-MOW", "RU-MOW": "RU-MOS", "UA-43": "crimea", "UA-40": "sevastopol" };
const rus = build({
  file: "rus.geojson", out: "russia-map.js", size: [1000, 600], maxZoom: 14,
  projection: geoConicEqualArea().rotate([-100, 0]).parallels([52, 68]),
  idOf: (id) => (id === "RU-X01~" ? null : RUS_ID[id] || id),
});
console.log("RUS key points:", JSON.stringify(Object.fromEntries(["RU-MOW", "RU-SPE", "sevastopol", "RU-KGD", "RU-LEN", "RU-MOS", "crimea", "RU-SMO", "RU-PSK"].map((k) => [k, { c: rus[k].c, b: rus[k].b }]))));

const ITA_ID = { "Valle d'Aosta": "valle-d-aosta", Piemonte: "piemonte", Lombardia: "lombardia", "Trentino-Alto Adige": "trentino", Liguria: "liguria",
  "Emilia-Romagna": "emilia-romagna", Marche: "marche", Veneto: "veneto", "Friuli-Venezia Giulia": "friuli", Abruzzo: "abruzzo", Molise: "molise",
  Apulia: "puglia", Basilicata: "basilicata", Calabria: "calabria", Campania: "campania", Lazio: "lazio", Toscana: "toscana", Sicily: "sicilia", Sardegna: "sardegna", Umbria: "umbria" };
build({ file: "ita.geojson", out: "italy-map.js", size: [620, 720], maxZoom: 5, projection: geoConicEqualArea().rotate([-12.5, 0]).parallels([38, 46]), idOf: (id) => ITA_ID[id] || null });
