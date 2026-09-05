// Тонкая обёртка над Upstash Redis REST (работает и с Vercel KV: те же переменные).
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function assertConfigured() {
  if (!URL || !TOKEN) throw new Error("Redis не настроен: нужны KV_REST_API_URL и KV_REST_API_TOKEN");
}

export async function redis(...cmd) {
  assertConfigured();
  const r = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export async function pipeline(cmds) {
  assertConfigured();
  if (!cmds.length) return [];
  const r = await fetch(`${URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error(j.error || "pipeline failed");
  return j.map((x) => x.result);
}

export const getJSON = async (key) => {
  const v = await redis("GET", key);
  return v ? JSON.parse(v) : null;
};

export const setJSON = (key, value, ttlSeconds) =>
  ttlSeconds
    ? redis("SET", key, JSON.stringify(value), "EX", ttlSeconds)
    : redis("SET", key, JSON.stringify(value));

export const KEYS = {
  login: (token) => `login:${token}`,
  session: (token) => `session:${token}`,
  user: (id) => `user:${id}`,
  leaderboard: "lb:countries",
};
