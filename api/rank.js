import { json } from "../server/http.js";
import { redis } from "../server/redis.js";
import { getBoard, lbKey, clampScore, validTime, isTimed, composite } from "../server/score.js";

/* Какое место занял бы результат: GET /api/rank?board=…&score=N&time=S */
export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const b = getBoard(url.searchParams.get("board"));
  if (!b) return json(res, 400, { error: "unknown board" });
  const score = clampScore(b, url.searchParams.get("score"));
  const time = isTimed(b, score) ? validTime(b, url.searchParams.get("time")) : null;
  const above = await redis("ZCOUNT", lbKey(b), `(${composite(b, score, time)}`, "+inf");
  const total = await redis("ZCARD", lbKey(b));
  return json(res, 200, { board: b.id, score, time, rank: above + 1, total });
}
