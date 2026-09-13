/* Нормализация и индекс названий для игр с картой (штаты, регионы России, Италии). */
import { srCyrillicToLatin, hasSerbianCyrillic } from "../i18n.js";

/* Без схлопывания двойных букв — для сравнения остатка названия после засчитанного региона */
export const normalizeLoose = (s) =>
  String(s)
    .toLowerCase()
    .replaceAll("ё", "е")
    .replaceAll("э", "е")
    .replaceAll("đ", "dj")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ьъ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zа-я0-9]/g, "");

/* Для поиска: двойные буквы схлопываются, «Масачусетс» = «Массачусетс» */
export const normalize = (s) => normalizeLoose(s).replace(/(.)\1+/g, "$1");

/* Кириллицу переводим в сербскую латиницу только на сербской странице (или если есть ђ ј љ њ ћ џ):
   иначе русское «Московска…» раньше времени совпадает с сербским «Moskovska» */
export const lookupKeys = (value, translitAll = true, norm = normalize) => {
  const keys = [norm(value)];
  if (hasSerbianCyrillic(value) || (translitAll && /[а-я]/i.test(value))) keys.push(norm(srCyrillicToLatin(value)));
  return [...new Set(keys.filter(Boolean))];
};

/* ambiguous — ключи, которые являются началом названия другого региона («Алтай» → «Алтайский край»):
   их засчитываем по Enter или после паузы, а не сразу при наборе */
export function buildIndex(items, notItems = []) {
  const index = new Map();
  const collisions = [];
  items.forEach((it) =>
    [it.name.ru, it.name.en, it.name.sr, it.native, ...(it.aliases || [])].filter(Boolean).forEach((w) => {
      const k = normalize(w);
      if (!k) return;
      const prev = index.get(k);
      if (prev && prev !== it) collisions.push([k, prev.id, it.id]);
      else index.set(k, it);
    }),
  );
  const notIndex = new Map();
  notItems.forEach((n) => n.words.forEach((w) => notIndex.set(normalize(w), n)));
  const keys = [...index.keys()];
  const ambiguous = new Set(keys.filter((a) => keys.some((b) => b !== a && b.startsWith(a) && index.get(b) !== index.get(a))));
  return { index, notIndex, ambiguous, collisions };
}
