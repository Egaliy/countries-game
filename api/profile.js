import { json } from "../server/http.js";
import { pipeline, getJSON, KEYS } from "../server/redis.js";
import { publicUser } from "../server/session.js";
import { BOARDS, getBoard, lbKey, boardBest } from "../server/score.js";

/* Публичный профиль игрока: GET /api/profile?id=<telegram id>
   Рекорды во всех таблицах с местом, открытые достижения и дни игры (для стрика). */
export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const id = url.searchParams.get("id") || "";
  if (!/^\d{1,15}$/.test(id)) return json(res, 400, { error: "bad id" });
  const user = await getJSON(KEYS.user(id));
  if (!user) return json(res, 404, { error: "not found" });
  const boards = Object.keys(BOARDS).map(getBoard);
  const replies = await pipeline(boards.flatMap((b) => [["ZREVRANK", lbKey(b), String(user.id)], ["ZCARD", lbKey(b)]]));
  const out = {};
  boards.forEach((b, i) => {
    const rank = replies[i * 2];
    out[b.id] = { ...boardBest(user, b), max: b.max, rank: rank == null ? null : Number(rank) + 1, total: Number(replies[i * 2 + 1]) || 0 };
  });
  res.setHeader("Cache-Control", "no-store");
  return json(res, 200, {
    user: publicUser(user),
    boards: out,
    achievements: Object.keys(user.achievements || {}),
    days: user.days || [],
    since: user.createdAt || null,
  });
}
