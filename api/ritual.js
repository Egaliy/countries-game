import { json, body } from "../server/http.js";
import { userFromSession } from "../server/session.js";
import {
  HttpError, state, profile, uploadUrls, saveVideo, plan, invite, join, setLang, exchangeMagic, tick,
} from "../server/ritual.js";

/* Ritual (сайт ~/Projects/ritual) — всё API одной функцией: ?action=… или { action } в теле.
   Сессия «Стран мира» приходит в заголовке x-ritual-session. tick и magic работают без неё. */
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://x");
    const data = req.method === "POST" ? body(req) : {};
    const action = url.searchParams.get("action") || data.action;
    if (action === "tick") return json(res, 200, await tick());
    if (action === "magic") return json(res, 200, await exchangeMagic(data));

    const user = await userFromSession(String(req.headers["x-ritual-session"] || ""));
    if (!user) return json(res, 401, { error: "no session" });
    if (req.method === "GET") {
      if (action === "state") return json(res, 200, await state(user));
      if (action === "profile") return json(res, 200, await profile(user, url.searchParams.get("id")));
    } else if (req.method === "POST") {
      if (action === "upload") return json(res, 200, await uploadUrls(user, data));
      if (action === "save") return json(res, 200, await saveVideo(user, data));
      if (action === "plan") return json(res, 200, await plan(user, data));
      if (action === "invite") return json(res, 200, await invite(user));
      if (action === "join") return json(res, 200, await join(user, data));
      if (action === "lang") return json(res, 200, await setLang(user, data));
    }
    return json(res, 404, { error: "unknown action" });
  } catch (e) {
    if (e instanceof HttpError) return json(res, e.status, { error: e.message });
    console.error("ritual", e);
    return json(res, 500, { error: e.message || "failed" });
  }
}
