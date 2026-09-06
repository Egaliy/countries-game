import { json, body } from "../server/http.js";
import { setJSON, KEYS } from "../server/redis.js";
import { userFromSession } from "../server/session.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/* POST { session, days: ["2026-09-06", …] } → объединяет с сохранёнными днями игры, возвращает полный список */
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  const { session, days } = body(req);
  const user = await userFromSession(session);
  if (!user) return json(res, 401, { error: "no session" });
  const set = new Set(user.days || []);
  const before = set.size;
  if (Array.isArray(days)) days.filter((d) => typeof d === "string" && DAY.test(d)).forEach((d) => set.add(d));
  const merged = [...set].sort().slice(-400);
  if (merged.length !== before) {
    user.days = merged;
    user.updatedAt = Date.now();
    await setJSON(KEYS.user(user.id), user);
  }
  return json(res, 200, { days: merged });
}
