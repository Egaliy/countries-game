import { json } from "../server/http.js";
import { redis, pipeline, KEYS } from "../server/redis.js";
import { userFromSession, publicUser } from "../server/session.js";
import { getBoard, lbKey, decompose, boardBest } from "../server/score.js";

/* GET /api/leaderboard?board=flags&session=… */
export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const b = getBoard(url.searchParams.get("board"));
  if (!b) return json(res, 400, { error: "unknown board" });
  const session = url.searchParams.get("session") || "";
  const raw = await redis("ZRANGE", lbKey(b), 0, 49, "REV", "WITHSCORES");
  const ids = [];
  for (let i = 0; i < raw.length; i += 2) ids.push({ id: raw[i], score: Number(raw[i + 1]) });
  const users = ids.length ? await pipeline(ids.map((x) => ["GET", KEYS.user(x.id)])) : [];
  const rows = ids.map((x, i) => {
    const u = users[i] ? JSON.parse(users[i]) : null;
    const { score, time } = decompose(b, x.score);
    return { rank: i + 1, id: x.id, score, time, name: u?.name || "—", username: u?.username || null, avatar: u?.avatar || null };
  });
  let me = null;
  if (session) {
    const user = await userFromSession(session);
    if (user) {
      const rank = await redis("ZREVRANK", lbKey(b), String(user.id));
      const best = boardBest(user, b);
      me = { ...publicUser(user), best: best.score, bestTime: best.time, rank: rank == null ? null : rank + 1 };
    }
  }
  const total = await redis("ZCARD", lbKey(b));
  res.setHeader("Cache-Control", "no-store");
  return json(res, 200, { board: b.id, max: b.max, rows, me, total });
}
