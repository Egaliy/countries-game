import { json, token, body, siteUrl } from "../../server/http.js";
import { setJSON, KEYS } from "../../server/redis.js";
import { botUsername, ensureWebhook } from "../../server/telegram.js";

const LANGS = new Set(["ru", "en", "sr"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  let bot = "";
  try {
    bot = await botUsername();
  } catch (e) {
    return json(res, 503, { error: `Telegram недоступен: ${e.message}` });
  }
  if (!bot) return json(res, 503, { error: "TELEGRAM_BOT_TOKEN не задан" });
  await ensureWebhook(siteUrl(req)).catch((e) => console.error("setWebhook failed", e));
  const { lang, ref } = body(req);
  const t = token(18).replace(/[^A-Za-z0-9_-]/g, "");
  // ref — id пригласившего игрока из реферальной ссылки; засчитается, если войдёт новый игрок
  const inviter = /^\d{1,15}$/.test(String(ref ?? "")) ? String(ref) : null;
  await setJSON(KEYS.login(t), { status: "pending", lang: LANGS.has(lang) ? lang : "ru", ref: inviter, createdAt: Date.now() }, 600);
  return json(res, 200, { token: t, url: `https://t.me/${bot}?start=${t}` });
}
