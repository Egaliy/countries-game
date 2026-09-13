/* Проверка словарей игр с картой: коллизии названий и «ранние» ключи. npm run maps:check */
import { buildIndex, normalize } from "../src/mapgame/names.js";
let bad = 0;
for (const game of ["states", "russia"]) {
  const { ITEMS, GROUPS, NOT_ITEMS = [] } = await import(`../src/mapgame/data/${game}.js`);
  const { index, ambiguous, collisions } = buildIndex(ITEMS, NOT_ITEMS);
  const groups = new Set(GROUPS.map((g) => g.id));
  const noGroup = ITEMS.filter((i) => !groups.has(i.group)).map((i) => i.id);
  const ids = new Set(ITEMS.map((i) => i.id));
  console.log(`\n${game}: ${ITEMS.length} items, ${index.size} keys, ${collisions.length} collisions, ${ambiguous.size} delayed keys, ids unique: ${ids.size === ITEMS.length}`);
  collisions.forEach((c) => console.log("  COLLISION", c.join(" | ")));
  if (noGroup.length) console.log("  NO GROUP", noGroup);
  console.log("  delayed:", [...ambiguous].map((k) => `${k}→${index.get(k).id}`).join(", "));
  bad += collisions.length + noGroup.length + (ids.size === ITEMS.length ? 0 : 1);
}
const probe = [["russia", "Алтайский край"], ["russia", "Сахалин"], ["russia", "Питер"], ["russia", "Северная Осетия"], ["states", "Нью Йорк"], ["states", "Njujork"]];
for (const [g, w] of probe) {
  const { ITEMS } = await import(`../src/mapgame/data/${g}.js`);
  console.log(g, w, "→", buildIndex(ITEMS).index.get(normalize(w))?.id || "НЕТ");
}
process.exit(bad ? 1 : 0);
