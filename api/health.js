import { json } from "../server/http.js";
import { redis } from "../server/redis.js";
import { tg, botUsername, tokenStatus } from "../server/telegram.js";

/* Публичная диагностика без секретов: GET /api/health */
export default async function handler(req, res) {
  const out = { redis: "not configured", token: tokenStatus(), bot: null, webhook: null };
  try {
    out.redis = (await redis("PING")) === "PONG" ? "ok" : "unexpected reply";
  } catch (e) {
    out.redis = `error: ${e.message}`;
  }
  try {
    out.bot = (await botUsername()) || "no token";
    const info = await tg("getWebhookInfo");
    out.webhook = { url: info.url || null, pending: info.pending_update_count, lastError: info.last_error_message || null };
  } catch (e) {
    out.bot = out.bot || `error: ${e.message}`;
  }
  return json(res, 200, out);
}
