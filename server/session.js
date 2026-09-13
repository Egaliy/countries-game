import { getJSON, KEYS } from "./redis.js";

export async function userFromSession(session) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(session || "")) return null;
  const s = await getJSON(KEYS.session(session));
  if (!s?.userId) return null;
  return getJSON(KEYS.user(s.userId));
}

export const publicUser = (u) =>
  u
    ? {
        id: u.id,
        name: u.name,
        username: u.username,
        avatar: u.avatar,
        best: u.best || 0,
        bestTime: u.bestTime ?? null,
        referrals: (u.referrals || []).length,
        theme: u.theme || null,
      }
    : null;
