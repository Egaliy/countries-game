import { json, body } from "../server/http.js";
import { redis, setJSON, KEYS } from "../server/redis.js";
import { userFromSession, publicUser } from "../server/session.js";
import { getBoard, lbKey, clampScore, validTime, isTimed, composite, boardBest } from "../server/score.js";

/* POST { session, board, score, time } — board по умолчанию "countries" */
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  const { session, board: boardId, score, time } = body(req);
  const b = getBoard(boardId);
  if (!b) return json(res, 400, { error: "unknown board" });
  const user = await userFromSession(session);
  if (!user) return json(res, 401, { error: "no session" });
  const n = clampScore(b, score);
  const t = isTimed(b, n) ? validTime(b, time) : null;
  const prev = boardBest(user, b);
  const next = composite(b, n, t);
  if (next > composite(b, prev.score, prev.time)) {
    user.boards = { ...(user.boards || {}), [b.id]: { score: n, time: t } };
    if (b.id === "countries") {
      user.best = n;
      user.bestTime = t;
    }
    user.updatedAt = Date.now();
    await setJSON(KEYS.user(user.id), user);
    // без GT: источник правды — запись игрока, а в наборе могло остаться старое мусорное время
    await redis("ZADD", lbKey(b), next, String(user.id));
  }
  const rank = await redis("ZREVRANK", lbKey(b), String(user.id));
  const best = boardBest(user, b);
  return json(res, 200, {
    board: b.id,
    best: best.score,
    bestTime: best.time,
    rank: rank == null ? null : rank + 1,
    user: publicUser(user),
  });
}
