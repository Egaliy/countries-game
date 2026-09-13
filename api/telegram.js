import { json, token, siteUrl, safeName } from "../server/http.js";
import { getJSON, setJSON, redis, KEYS } from "../server/redis.js";
import { tg, fetchAvatar, BOT_TEXT, pickLang, webhookSecret, knownSite } from "../server/telegram.js";
import { publicUser } from "../server/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || webhookSecret();
  if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
    return json(res, 401, { error: "bad secret" });
  }
  const update = typeof req.body === "object" && req.body ? req.body : {};
  try {
    await handleUpdate(update);
  } catch (e) {
    console.error("telegram update failed", e);
  }
  return json(res, 200, { ok: true }); // Telegram ждёт 200 всегда
}

/* Анонсы — только для владельца:
   /announce текст → предпросмотр только владельцу и число получателей,
   /announce_send → рассылка всем, кто входил на сайт, /announce_cancel → отмена.
   Текст — HTML-разметка Telegram (<b>, <i>, <blockquote>, <a href>). Если первая строка
   «video: https://…mp4», пост уходит анимацией с подписью (до 1024 символов), иначе обычным сообщением. */
const ADMIN_IDS = new Set(["328826190"]);
const ANNOUNCE_KEY = "announce:pending";

async function recipients() {
  const ids = await redis("ZRANGE", KEYS.leaderboard, 0, -1);
  return [...new Set((ids || []).map(String))];
}

function parsePost(raw) {
  const m = raw.match(/^video:\s*(https:\/\/\S+)\s*\n([\s\S]*)$/i);
  return m ? { video: m[1], text: m[2].trim() } : { video: null, text: raw.trim() };
}

async function sendPost(chatId, post) {
  if (post.video) {
    return tg("sendAnimation", { chat_id: chatId, animation: post.video, caption: post.text, parse_mode: "HTML" });
  }
  return tg("sendMessage", { chat_id: chatId, text: post.text, parse_mode: "HTML", link_preview_options: { is_disabled: true } });
}

async function handleAdmin(chatId, text) {
  const draft = text.match(/^\/announce(?:@\w+)?(?:\s+([\s\S]+))?$/);
  if (draft) {
    const body = (draft[1] || "").trim();
    if (!body) {
      await tg("sendMessage", { chat_id: chatId, text: "Напишите текст после команды:\n/announce Текст анонса\n\nДля ролика первой строкой: video: https://…mp4" });
      return true;
    }
    const post = parsePost(body);
    try {
      await sendPost(chatId, post);
    } catch (e) {
      await tg("sendMessage", { chat_id: chatId, text: `Не получилось показать пост: ${e.message}` });
      return true;
    }
    await setJSON(ANNOUNCE_KEY, { ...post, at: Date.now() }, 3600);
    const n = (await recipients()).length;
    await tg("sendMessage", { chat_id: chatId, text: `Выше — так анонс увидят игроки. Получателей: ${n}.\n\nОтправить всем: /announce_send\nОтменить: /announce_cancel` });
    return true;
  }
  if (/^\/announce_cancel(?:@\w+)?$/.test(text)) {
    await redis("DEL", ANNOUNCE_KEY);
    await tg("sendMessage", { chat_id: chatId, text: "Анонс отменён." });
    return true;
  }
  if (/^\/announce_send(?:@\w+)?$/.test(text)) {
    const pending = await getJSON(ANNOUNCE_KEY);
    if (!pending?.text) {
      await tg("sendMessage", { chat_id: chatId, text: "Нет подготовленного анонса. Сначала: /announce Текст" });
      return true;
    }
    await redis("DEL", ANNOUNCE_KEY); // защита от двойной отправки, если Telegram повторит запрос
    let ok = 0;
    let fail = 0;
    for (const id of await recipients()) {
      try {
        await sendPost(id, pending);
        ok += 1;
      } catch {
        fail += 1;
      }
      await new Promise((r) => setTimeout(r, 40));
    }
    await tg("sendMessage", { chat_id: chatId, text: `Готово. Доставлено: ${ok}, не доставлено: ${fail}.` });
    return true;
  }
  return false;
}

const FRIEND_TEXT = {
  ru: (name, n) => `🎉 ${name} присоединился по вашей ссылке. Друзей: ${n}.`,
  en: (name, n) => `🎉 ${name} joined with your link. Friends: ${n}.`,
  sr: (name, n) => `🎉 ${name} se pridružio preko vašeg linka. Prijatelja: ${n}.`,
};

/* Реферал: засчитывается только новый игрок и не сам себе */
async function creditInviter(login, user, isNew) {
  if (!isNew || !login.ref || login.ref === String(user.id)) return;
  const inviter = await getJSON(KEYS.user(login.ref));
  if (!inviter) return;
  const list = new Set((inviter.referrals || []).map(String));
  if (list.has(String(user.id))) return;
  list.add(String(user.id));
  inviter.referrals = [...list];
  inviter.updatedAt = Date.now();
  await setJSON(KEYS.user(inviter.id), inviter);
  user.referredBy = String(inviter.id);
  await tg("sendMessage", { chat_id: inviter.id, text: (FRIEND_TEXT[inviter.lang] || FRIEND_TEXT.ru)(user.name, list.size) }).catch(() => {});
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg?.from || typeof msg.text !== "string") return;
  const from = msg.from;
  const chatId = msg.chat.id;
  const m = msg.text.match(/^\/start(?:\s+([A-Za-z0-9_-]{8,64}))?/);
  const lang = pickLang(from.language_code);
  const txt = BOT_TEXT[lang];
  if (ADMIN_IDS.has(String(from.id)) && (await handleAdmin(chatId, msg.text))) return;

  if (!m) return;
  const loginToken = m[1];
  if (!loginToken) {
    await tg("sendMessage", { chat_id: chatId, text: txt.hello(await knownSite(siteUrl())) });
    return;
  }

  const login = await getJSON(KEYS.login(loginToken));
  if (!login || login.status !== "pending") {
    await tg("sendMessage", { chat_id: chatId, text: txt.expired });
    return;
  }

  const name = safeName([from.first_name, from.last_name].filter(Boolean).join(" ")) || safeName(from.username) || "Player";
  const existing = (await getJSON(KEYS.user(from.id))) || {};
  const avatar = (await fetchAvatar(from.id)) || existing.avatar || null;
  // сохраняем всё накопленное (ачивки, стрик, рекорды по таблицам), обновляем только профиль
  const user = {
    ...existing,
    id: from.id,
    name,
    username: from.username ? safeName(from.username) : null,
    avatar,
    lang: login.lang || lang,
    best: existing.best || 0,
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  await creditInviter(login, user, !existing.id);
  const session = token(24);
  await setJSON(KEYS.user(from.id), user);
  await setJSON(KEYS.session(session), { userId: from.id, createdAt: Date.now() }, 60 * 60 * 24 * 365);
  await setJSON(KEYS.login(loginToken), { status: "done", session, user: publicUser(user) }, 600);
  await tg("sendMessage", { chat_id: chatId, text: BOT_TEXT[login.lang || lang].done(name) });
  await redis("ZADD", KEYS.leaderboard, "GT", user.best || 0, String(from.id)).catch(() => {});
}
