import { createHash } from "node:crypto";
import { getJSON, setJSON } from "./redis.js";

/* Токен вырезаем из значения переменной: терпим пробелы, переводы строк, префикс bot и случайный повтор */
const RAW_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || "");
const TOKEN = RAW_TOKEN.match(/\d{6,12}:[A-Za-z0-9_-]{35}/)?.[0] || "";
const API = () => `https://api.telegram.org/bot${TOKEN}`;

export const tokenStatus = () =>
  !RAW_TOKEN.trim() ? "missing" : TOKEN ? (RAW_TOKEN.trim() === TOKEN ? "ok" : "ok (cleaned)") : `bad format (${RAW_TOKEN.trim().length} chars)`;

/* Подпись вебхука выводится из токена: отдельный секрет не нужен */
export const webhookSecret = () =>
  TOKEN ? createHash("sha256").update(`webhook:${TOKEN}`).digest("hex").slice(0, 40) : "";

/* Регистрирует вебхук на текущий домен, если ещё не зарегистрирован (кэш в Redis) */
export async function ensureWebhook(site) {
  if (!TOKEN || !site) return null;
  const want = `${site}/api/telegram`;
  const have = await getJSON("webhook:url").catch(() => null);
  if (have?.url === want) return have;
  await tg("setWebhook", { url: want, secret_token: webhookSecret(), allowed_updates: ["message"], drop_pending_updates: true });
  const rec = { url: want, site, at: Date.now() };
  await setJSON("webhook:url", rec).catch(() => {});
  return rec;
}

export async function knownSite(fallback) {
  const rec = await getJSON("webhook:url").catch(() => null);
  return rec?.site || fallback;
}

let cachedUsername = process.env.TELEGRAM_BOT_USERNAME || "";

/* Имя бота: из env, иначе спрашиваем у Telegram один раз (getMe) */
export async function botUsername() {
  if (cachedUsername) return cachedUsername;
  if (!TOKEN) return "";
  const me = await tg("getMe");
  cachedUsername = me?.username || "";
  return cachedUsername;
}

export async function tg(method, body) {
  if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  const r = await fetch(`${API()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(`Telegram ${method}: ${j.description}`);
  return j.result;
}

/* То же для методов с файлом (multipart): например, sendVideoNote с кружком */
export async function tgUpload(method, form) {
  if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  const r = await fetch(`${API()}/${method}`, { method: "POST", body: form });
  const j = await r.json();
  if (!j.ok) throw new Error(`Telegram ${method}: ${j.description}`);
  return j.result;
}

/* Аватар пользователя как data-URL (самый маленький размер, обычно 160×160, ~10 КБ) */
export async function fetchAvatar(userId) {
  try {
    const photos = await tg("getUserProfilePhotos", { user_id: userId, limit: 1 });
    const sizes = photos?.photos?.[0];
    if (!sizes?.length) return null;
    const file = await tg("getFile", { file_id: sizes[0].file_id });
    const r = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`);
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 120_000) return null;
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export const BOT_TEXT = {
  ru: {
    done: (name) => `✅ Вход выполнен, ${name}!\n\nВозвращайтесь на сайт — ваш рекорд теперь попадает в таблицу лидеров.`,
    expired: "⏳ Ссылка для входа устарела. Нажмите «Войти через Telegram» на сайте ещё раз.",
    hello: (site) => `Привет! Это бот игры «Страны мира».\n\nЧтобы войти, нажмите «Войти через Telegram» на сайте: ${site}`,
  },
  en: {
    done: (name) => `✅ Logged in, ${name}!\n\nGo back to the site — your record now goes to the leaderboard.`,
    expired: "⏳ This login link has expired. Press “Log in with Telegram” on the site again.",
    hello: (site) => `Hi! This is the bot for the Countries of the World game.\n\nTo log in, press “Log in with Telegram” on the site: ${site}`,
  },
  sr: {
    done: (name) => `✅ Prijava uspešna, ${name}!\n\nVratite se na sajt — vaš rekord sada ide na tabelu lidera.`,
    expired: "⏳ Link za prijavu je istekao. Pritisnite „Prijava preko Telegrama“ na sajtu ponovo.",
    hello: (site) => `Zdravo! Ovo je bot igre „Države sveta“.\n\nZa prijavu pritisnite „Prijava preko Telegrama“ na sajtu: ${site}`,
  },
};

export const pickLang = (code) => {
  const c = String(code || "").toLowerCase();
  if (c.startsWith("ru") || c.startsWith("uk") || c.startsWith("be")) return "ru";
  if (c.startsWith("sr") || c.startsWith("hr") || c.startsWith("bs")) return "sr";
  return "en";
};
