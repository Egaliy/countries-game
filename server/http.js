import { randomBytes } from "node:crypto";

export const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

export const token = (bytes = 18) => randomBytes(bytes).toString("base64url");

export const body = (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
};

export const siteUrl = (req) => {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
  return host && !/^(localhost|127\.)/.test(host) ? `https://${host}` : "https://countries-game-khaki.vercel.app";
};

export const safeName = (s) =>
  String(s || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 48);
