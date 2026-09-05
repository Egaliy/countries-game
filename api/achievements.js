import { json, body } from "../server/http.js";
import { setJSON, KEYS } from "../server/redis.js";
import { userFromSession } from "../server/session.js";

const ID = /^[a-z0-9_]{1,32}$/;

/* POST { session, unlocked: { id: timestamp } } → объединяет с сохранёнными и возвращает полный набор */
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  const { session, unlocked } = body(req);
  const user = await userFromSession(session);
  if (!user) return json(res, 401, { error: "no session" });
  const merged = { ...(user.achievements || {}) };
  if (unlocked && typeof unlocked === "object") {
    for (const [id, ts] of Object.entries(unlocked)) {
      if (ID.test(id) && !merged[id]) merged[id] = Number(ts) || Date.now();
    }
  }
  if (Object.keys(merged).length !== Object.keys(user.achievements || {}).length) {
    user.achievements = merged;
    user.updatedAt = Date.now();
    await setJSON(KEYS.user(user.id), user);
  }
  return json(res, 200, { achievements: merged });
}
