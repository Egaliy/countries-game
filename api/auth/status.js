import { json } from "../../server/http.js";
import { getJSON, redis, KEYS } from "../../server/redis.js";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const t = url.searchParams.get("token") || "";
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(t)) return json(res, 400, { error: "bad token" });
  const login = await getJSON(KEYS.login(t));
  if (!login) return json(res, 200, { done: false, expired: true });
  if (login.status !== "done") return json(res, 200, { done: false });
  await redis("DEL", KEYS.login(t)); // одноразово
  return json(res, 200, { done: true, session: login.session, user: login.user });
}
