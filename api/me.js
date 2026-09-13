import { json, body } from "../server/http.js";
import { setJSON, KEYS } from "../server/redis.js";
import { userFromSession, publicUser } from "../server/session.js";
import { THEME_NEED } from "../server/themes.js";

/* GET — свой профиль после входа; POST { session, theme } — сохранить тему, если она открыта друзьями */
export default async function handler(req, res) {
  if (req.method === "POST") {
    const { session, theme } = body(req);
    const user = await userFromSession(session);
    if (!user) return json(res, 401, { error: "no session" });
    if (!Object.hasOwn(THEME_NEED, String(theme))) return json(res, 400, { error: "unknown theme" });
    if ((user.referrals || []).length < THEME_NEED[theme]) return json(res, 403, { error: "locked" });
    user.theme = theme;
    user.updatedAt = Date.now();
    await setJSON(KEYS.user(user.id), user);
    return json(res, 200, { user: publicUser(user) });
  }
  const url = new URL(req.url, "http://x");
  const user = await userFromSession(url.searchParams.get("session") || "");
  if (!user) return json(res, 401, { error: "no session" });
  return json(res, 200, { user: publicUser(user), achievements: user.achievements || {}, days: user.days || [] });
}
