// Ritual — привычки на двоих: утренний кружок (чистим зубы до 9:20) и план на день.
// Отдельный сайт (~/Projects/ritual) ходит сюда через rewrite /api/ritual: сессии, пользователи и бот — общие со «Странами мира».
// Данные — в том же Redis с префиксом rt:, видео — в приватном Vercel Blob (ritual-circles), наружу только подписанные ссылки.
import { randomBytes } from "node:crypto";
import { issueSignedToken, presignUrl, head, del } from "@vercel/blob";
import { redis, getJSON, setJSON, KEYS } from "./redis.js";
import { tg, tgUpload } from "./telegram.js";

export const OWNER_ID = "328826190";
export const APP_URL = process.env.RITUAL_URL || "https://our-ritual.vercel.app";
const TZ = "Europe/Belgrade";
const OPEN_MIN = 4 * 60; // запись открывается в 4:00
const DEADLINE_MIN = 9 * 60 + 20; // 9:20 — дальше капец
const WARN_MIN = DEADLINE_MIN - 10; // «осталось 10 минут»
const VERDICT_MIN = DEADLINE_MIN + 5; // итог дня, с запасом на догружающиеся кружки
const KEEP_VIDEO_DAYS = 90; // старые видео удаляем, превью остаются
const MAX_VIDEO = 40 * 1024 * 1024;
const MAX_POSTER = 400 * 1024;
const PLAN_MAX = 40;
const DEV = !process.env.VERCEL;
const PREFIX = DEV ? "rt-dev" : "rt";

const K = {
  pair: "rt:pair",
  days: (id) => `rt:days:${id}`,
  pend: (id) => `rt:pend:${id}`,
  sent: (k) => `rt:sent:${k}`,
  prefs: (id) => `rt:prefs:${id}`,
  magic: (code) => `rt:magic:${code}`,
  magicFor: (id, date) => `rt:magicfor:${id}:${date}`,
  rtok: "rt:rtok",
};

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message);
};

/* ---------- время: всё считаем по Белграду ---------- */
// Локально часы можно сдвинуть (dev-сервер ritual), на Vercel — всегда настоящее время.
export const clock = () => Date.now() + (DEV ? Number(process.env.RITUAL_SHIFT_MS || 0) : 0);
const PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
export function local(ms = clock()) {
  const p = Object.fromEntries(PARTS.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const sec = Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second);
  return {
    ms,
    date: `${p.year}-${p.month}-${p.day}`,
    min: Math.floor(sec / 60),
    at: (min) => ms - (ms % 1000) + (min * 60 - sec) * 1000, // абсолютное время сегодняшней минуты
  };
}
export const addDays = (date, n) => new Date(Date.parse(`${date}T12:00:00Z`) + n * 86400e3).toISOString().slice(0, 10);
const hhmm = (ms) => new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
const rid = (n = 9) => randomBytes(n).toString("base64url").replace(/[^A-Za-z0-9]/g, "").slice(0, n) || "x";

/* ---------- пара ---------- */
async function getPair() {
  const pair = await getJSON(K.pair);
  if (pair) return pair;
  const fresh = { members: [OWNER_ID], joined: { [OWNER_ID]: local().date }, invite: null };
  await setJSON(K.pair, fresh);
  return fresh;
}

/* ---------- дни ---------- */
async function allDays(id) {
  const arr = (await redis("HGETALL", K.days(id))) || [];
  const out = {};
  for (let i = 0; i < arr.length; i += 2) {
    try { out[arr[i]] = JSON.parse(arr[i + 1]); } catch {}
  }
  return out;
}
const getDay = async (id, date) => {
  const v = await redis("HGET", K.days(id), date);
  return v ? JSON.parse(v) : {};
};
const putDay = (id, date, rec) => redis("HSET", K.days(id), date, JSON.stringify(rec));

function statusOf(rec, now) {
  if (rec?.v?.ok) return "done";
  if (now.min < OPEN_MIN) return "early";
  if (now.min < DEADLINE_MIN) return "pending";
  return "missed";
}

function stats(days, joined, today) {
  const ok = (d) => Boolean(days[d]?.v?.ok);
  let streak = 0;
  for (let d = ok(today) ? today : addDays(today, -1); d >= joined && ok(d); d = addDays(d, -1)) streak += 1;
  const dates = Object.keys(days).filter(ok).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { streak, best, total: dates.length };
}

/* ---------- Blob: подписанные ссылки ---------- */
async function readToken() {
  const cached = await getJSON(K.rtok);
  if (cached && cached.validUntil - Date.now() > 15 * 60e3) return cached;
  const t = await issueSignedToken({ pathname: "*", operations: ["get"], validUntil: Date.now() + 2 * 3600e3 });
  await setJSON(K.rtok, { delegationToken: t.delegationToken, clientSigningToken: t.clientSigningToken, validUntil: t.validUntil }, 2 * 3600 - 120);
  return t;
}
const signGet = async (tok, pathname) => (await presignUrl(tok, { operation: "get", pathname, access: "private" })).presignedUrl;

async function signPut(pathname, type, max) {
  const opts = { allowedContentTypes: [type], maximumSizeInBytes: max };
  const tok = await issueSignedToken({ pathname, operations: ["put"], validUntil: Date.now() + 15 * 60e3, ...opts });
  return (await presignUrl(tok, { operation: "put", pathname, access: "private", addRandomSuffix: false, ...opts })).presignedUrl;
}

async function videoView(tok, v) {
  if (!v) return null;
  return {
    url: v.p && !v.gone ? await signGet(tok, v.p) : null,
    poster: v.poster ? await signGet(tok, v.poster) : null,
    at: v.at,
    dur: v.dur || 0,
  };
}

/* ---------- люди ---------- */
const userOf = async (id, known) => (known && String(known.id) === String(id) ? known : (await getJSON(KEYS.user(id))) || { id });
const pub = (u) => ({ id: String(u.id), name: u.name || "—", avatar: u.avatar || null });
async function langOf(id) {
  const prefs = await getJSON(K.prefs(id));
  if (prefs?.lang) return prefs.lang;
  const u = await getJSON(KEYS.user(id));
  return ["ru", "en", "sr"].includes(u?.lang) ? u.lang : "ru";
}

/* ---------- состояние для главной ---------- */
export async function state(user) {
  const now = local();
  const uid = String(user.id);
  const pair = await getPair();
  const base = { now: now.ms, date: now.date, openAt: now.at(OPEN_MIN), deadlineAt: now.at(DEADLINE_MIN), me: pub(user) };
  if (!pair.members.includes(uid)) return { ...base, member: false };
  const tok = await readToken();
  const order = [uid, ...pair.members.filter((m) => m !== uid)];
  const people = await Promise.all(order.map(async (id) => {
    const u = await userOf(id, user);
    const days = await allDays(id);
    const joined = pair.joined?.[id] || now.date;
    const rec = days[now.date] || {};
    return {
      ...pub(u),
      me: id === uid,
      joined,
      status: statusOf(rec, now),
      video: await videoView(tok, rec.v),
      plan: rec.plan || [],
      tomorrow: id === uid ? days[addDays(now.date, 1)]?.plan || [] : undefined,
      ...stats(days, joined, now.date),
    };
  }));
  const owner = uid === OWNER_ID;
  return { ...base, member: true, owner, invite: owner && pair.members.length < 2 ? pair.invite?.code || null : null, people };
}

/* ---------- профиль: история дней ---------- */
export async function profile(user, id) {
  const pair = await getPair();
  const uid = String(user.id);
  id = String(id || uid);
  if (!pair.members.includes(uid) || !pair.members.includes(id)) fail(403, "not in pair");
  const now = local();
  const u = await userOf(id, user);
  const days = await allDays(id);
  const joined = pair.joined?.[id] || now.date;
  const tok = await readToken();
  const list = [];
  for (let d = now.date, n = 0; d >= joined && n < 120; d = addDays(d, -1), n += 1) {
    const rec = days[d] || {};
    const status = d === now.date ? statusOf(rec, now) : rec.v?.ok ? "done" : "missed";
    list.push({ date: d, status, video: await videoView(tok, rec.v), plan: rec.plan || [] });
  }
  return { now: now.ms, date: now.date, person: { ...pub(u), me: id === uid, joined, ...stats(days, joined, now.date) }, days: list };
}

/* ---------- кружок: ссылка на загрузку и сохранение ---------- */
const baseType = (mime) => String(mime || "").split(";")[0].trim().toLowerCase();
const VIDEO_TYPES = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

export async function uploadUrls(user, { mime }) {
  const uid = String(user.id);
  const pair = await getPair();
  if (!pair.members.includes(uid)) fail(403, "not in pair");
  const now = local();
  if (now.min < OPEN_MIN) fail(409, "early");
  if (now.min >= DEADLINE_MIN) fail(409, "closed");
  const type = baseType(mime);
  const ext = VIDEO_TYPES[type];
  if (!ext) fail(400, "unsupported video type");
  const stem = `${PREFIX}/${uid}/${now.date}-${rid(10)}`;
  const video = `${stem}.${ext}`;
  const poster = `${stem}.jpg`;
  // момент нажатия «Отправить» и решает, успел ли: загрузка может закончиться и после 9:20
  await setJSON(K.pend(uid), { date: now.date, at: now.ms, video, poster, type }, 20 * 60);
  return {
    video: { pathname: video, url: await signPut(video, type, MAX_VIDEO), type },
    poster: { pathname: poster, url: await signPut(poster, "image/jpeg", MAX_POSTER), type: "image/jpeg" },
  };
}

export async function saveVideo(user, { video, poster, dur }) {
  const uid = String(user.id);
  const pend = await getJSON(K.pend(uid));
  if (!pend || pend.video !== video) fail(400, "upload expired");
  try {
    await head(video);
  } catch {
    fail(400, "video not uploaded");
  }
  let hasPoster = false;
  if (poster === pend.poster) {
    try { await head(poster); hasPoster = true; } catch {}
  }
  const rec = await getDay(uid, pend.date);
  const first = !rec.v?.ok;
  const old = rec.v;
  rec.v = { p: video, poster: hasPoster ? poster : null, at: pend.at, ok: true, dur: Math.max(0, Math.min(120, Number(dur) || 0)), type: pend.type };
  await putDay(uid, pend.date, rec);
  await redis("DEL", K.pend(uid));
  if (old?.p && old.p !== video) del([old.p, old.poster].filter(Boolean)).catch(() => {});
  if (first) await withTimeout(notifyPartner(user, rec.v), 9000).catch((e) => console.error("ritual notify", e));
  return { ok: true, at: pend.at };
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

/* ---------- план на день (сегодня или завтра) ---------- */
export async function plan(user, { day, op, id, text }) {
  const uid = String(user.id);
  const pair = await getPair();
  if (!pair.members.includes(uid)) fail(403, "not in pair");
  const now = local();
  const date = day === "tomorrow" ? addDays(now.date, 1) : now.date;
  const rec = await getDay(uid, date);
  const items = Array.isArray(rec.plan) ? rec.plan : [];
  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 140);
  const item = items.find((x) => x.id === id);
  if (op === "add") {
    const t = clean(text);
    if (!t) fail(400, "empty");
    if (items.length >= PLAN_MAX) fail(400, "too many");
    items.push({ id: rid(8), t, d: false });
  } else if (op === "toggle" && item) {
    item.d = !item.d;
  } else if (op === "edit" && item) {
    const t = clean(text);
    if (t) item.t = t;
  } else if (op === "del" && item) {
    items.splice(items.indexOf(item), 1);
  } else if (op === "move" && item) {
    const to = Math.max(0, Math.min(items.length - 1, Number(text) || 0));
    items.splice(items.indexOf(item), 1);
    items.splice(to, 0, item);
  }
  rec.plan = items;
  await putDay(uid, date, rec);
  return { day: day === "tomorrow" ? "tomorrow" : "today", plan: items };
}

/* ---------- приглашение второго человека ---------- */
export async function invite(user) {
  if (String(user.id) !== OWNER_ID) fail(403, "owner only");
  const pair = await getPair();
  if (pair.members.length >= 2) fail(409, "pair full");
  pair.invite = { code: rid(12), at: Date.now() };
  await setJSON(K.pair, pair);
  return { code: pair.invite.code };
}

export async function join(user, { code }) {
  const uid = String(user.id);
  const pair = await getPair();
  if (pair.members.includes(uid)) return { ok: true };
  if (!pair.invite?.code || pair.invite.code !== code || pair.members.length >= 2) fail(403, "bad invite");
  pair.members.push(uid);
  pair.joined = { ...pair.joined, [uid]: local().date };
  pair.invite = null;
  await setJSON(K.pair, pair);
  const lang = await langOf(OWNER_ID);
  await send("sendMessage", { chat_id: OWNER_ID, text: BOT[lang].joined(user.name || "—") }).catch(() => {});
  return { ok: true };
}

export async function setLang(user, { lang }) {
  if (!["ru", "en", "sr"].includes(lang)) fail(400, "bad lang");
  await setJSON(K.prefs(user.id), { ...((await getJSON(K.prefs(user.id))) || {}), lang });
  return { ok: true };
}

/* ---------- вход по ссылке из бота ----------
   Кнопки бота открывают сайт с ?k=<код>: браузер Telegram не знает нашу сессию, а так вход — в одно касание.
   Код живёт до конца суток и выдаётся только участникам пары. */
async function magicLink(id) {
  const date = local().date;
  let code = await redis("GET", K.magicFor(id, date));
  if (!code) {
    code = rid(16);
    await redis("SET", K.magic(code), String(id), "EX", 26 * 3600);
    await redis("SET", K.magicFor(id, date), code, "EX", 26 * 3600);
  }
  return `${APP_URL}/?k=${code}`;
}

export async function exchangeMagic({ code }) {
  if (!/^[A-Za-z0-9]{8,32}$/.test(String(code || ""))) fail(400, "bad code");
  const id = await redis("GET", K.magic(code));
  if (!id) fail(401, "expired");
  const pair = await getPair();
  if (!pair.members.includes(String(id))) fail(403, "not in pair");
  const session = randomBytes(24).toString("base64url");
  await setJSON(KEYS.session(session), { userId: Number(id), createdAt: Date.now(), via: "ritual" }, 60 * 60 * 24 * 365);
  return { session };
}

/* ---------- бот ---------- */
const plural = (n, one, few, many) => {
  const a = n % 10;
  const b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
};
const BOT = {
  ru: {
    warn: "⏰ Осталось 10 минут, чтобы отправить кружок.\nЕсли нет — капец 💀",
    warnBtn: "🪥 Записать кружок",
    missedSelf: (n) => (n ? `💀 Капец. Кружка сегодня нет — серия из ${n} ${plural(n, "дня", "дней", "дней")} сгорела.` : "💀 Капец. Кружка сегодня нет."),
    missedOther: (name) => `💀 ${name} — капец: кружка сегодня нет.`,
    done: (name, t) => `🪥 ${name} — кружок в ${t} ✅`,
    open: "Открыть Ritual",
    joined: (name) => `🤝 ${name} теперь с тобой в Ritual.`,
  },
  en: {
    warn: "⏰ 10 minutes left to send your circle.\nOtherwise it’s game over 💀",
    warnBtn: "🪥 Record a circle",
    missedSelf: (n) => (n ? `💀 Game over. No circle today — your ${n}-day streak is gone.` : "💀 Game over. No circle today."),
    missedOther: (name) => `💀 ${name}: game over — no circle today.`,
    done: (name, t) => `🪥 ${name} sent a circle at ${t} ✅`,
    open: "Open Ritual",
    joined: (name) => `🤝 ${name} joined you in Ritual.`,
  },
  sr: {
    warn: "⏰ Ostalo je 10 minuta da pošalješ kružić.\nInače — kraj 💀",
    warnBtn: "🪥 Snimi kružić",
    missedSelf: (n) => (n ? `💀 Kraj. Danas nema kružića — niz od ${n} dana je izgoreo.` : "💀 Kraj. Danas nema kružića."),
    missedOther: (name) => `💀 ${name}: kraj — danas nema kružića.`,
    done: (name, t) => `🪥 ${name} — kružić u ${t} ✅`,
    open: "Otvori Ritual",
    joined: (name) => `🤝 ${name} je sada s tobom u Ritualu.`,
  },
};

// Локально в Telegram ничего не уходит: сообщения складываются в журнал dev-сервера.
export const outbox = [];
async function send(method, body) {
  if (DEV) {
    outbox.push({ method, ...(body instanceof FormData ? Object.fromEntries([...body].filter(([, v]) => typeof v === "string")) : body) });
    return { dev: true };
  }
  return body instanceof FormData ? tgUpload(method, body) : tg(method, body);
}
const button = (text, url) => ({ inline_keyboard: [[{ text, url }]] });
const firstName = (u) => String(u?.name || "—").split(" ")[0];

async function notifyPartner(user, v) {
  const pair = await getPair();
  const other = pair.members.find((m) => m !== String(user.id));
  if (!other) return;
  const lang = await langOf(other);
  const T = BOT[lang];
  const name = firstName(user);
  const t = hhmm(v.at);
  const markup = button(`🪥 ${name} · ${t}`, await magicLink(other));
  // Кружок прилетает настоящим кружком Telegram (нужен mp4); иначе — сообщением со ссылкой.
  if (v.type === "video/mp4" && !DEV) {
    try {
      const tok = await readToken();
      const r = await fetch(await signGet(tok, v.p));
      if (!r.ok) throw new Error(`blob ${r.status}`);
      const form = new FormData();
      form.set("chat_id", other);
      form.set("length", "384");
      if (v.dur) form.set("duration", String(Math.round(v.dur)));
      form.set("reply_markup", JSON.stringify(markup));
      form.set("video_note", new Blob([await r.arrayBuffer()], { type: "video/mp4" }), "circle.mp4");
      await send("sendVideoNote", form);
      return;
    } catch (e) {
      console.error("sendVideoNote failed", e);
    }
  }
  await send("sendMessage", { chat_id: other, text: T.done(name, t), reply_markup: markup });
}

/* ---------- крон: напоминание в 9:10, итог в 9:25, уборка старых видео ----------
   Дёргается воркером Cloudflare каждые 5 минут утром. Каждое сообщение — один раз в день (SET NX). */
const once = async (key) => (await redis("SET", K.sent(key), "1", "NX", "EX", 3 * 86400)) === "OK";

export async function tick() {
  const now = local();
  const pair = await getPair();
  const done = [];
  if (now.min >= WARN_MIN && now.min < DEADLINE_MIN) {
    for (const id of pair.members) {
      if ((await getDay(id, now.date)).v?.ok) continue;
      if (!(await once(`${now.date}:warn:${id}`))) continue;
      const T = BOT[await langOf(id)];
      await send("sendMessage", { chat_id: id, text: T.warn, reply_markup: button(T.warnBtn, await magicLink(id)) }).catch((e) => console.error(e));
      done.push(`warn:${id}`);
    }
  }
  if (now.min >= VERDICT_MIN && now.min < 14 * 60 && (await once(`${now.date}:verdict`))) {
    for (const id of pair.members) {
      if ((await getDay(id, now.date)).v?.ok) continue;
      const u = await userOf(id);
      const days = await allDays(id);
      const lost = stats(days, pair.joined?.[id] || now.date, addDays(now.date, -1)).streak;
      for (const to of pair.members) {
        const T = BOT[await langOf(to)];
        const text = to === id ? T.missedSelf(lost) : T.missedOther(firstName(u));
        await send("sendMessage", { chat_id: to, text, reply_markup: button(T.open, await magicLink(to)) }).catch((e) => console.error(e));
      }
      done.push(`missed:${id}`);
    }
  }
  if (now.min >= VERDICT_MIN && (await once(`${now.date}:gc`))) done.push(`gc:${await cleanup(pair, now)}`);
  return { at: now.ms, local: `${now.date} ${String(Math.floor(now.min / 60)).padStart(2, "0")}:${String(now.min % 60).padStart(2, "0")}`, done };
}

async function cleanup(pair, now) {
  const edge = addDays(now.date, -KEEP_VIDEO_DAYS);
  let n = 0;
  for (const id of pair.members) {
    const days = await allDays(id);
    for (const [date, rec] of Object.entries(days)) {
      if (date >= edge || !rec.v?.p || rec.v.gone) continue;
      await del(rec.v.p).catch(() => {});
      rec.v.gone = true;
      await putDay(id, date, rec);
      n += 1;
    }
  }
  return n;
}
