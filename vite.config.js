import { defineConfig } from "vite";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

/* Английский — без префикса, русский — /ru, сербский — /rs (и /sr). Старые /en/… — 301 на адрес без префикса.
   Игры с картой: /states, /russia и то же с /ru или /rs → одна страница map/index.html.
   На Vercel это делает vercel.json, здесь — для dev и preview (в dev главная на любом языке — index.html). */
const EN_ROUTE = /^\/en(?=\/|\?|$)\/?/;
const LANG_HOME = /^\/(?:ru|rs|sr)\/?(?:\?.*)?$/;
const MAP_ROUTE = /^\/(?:(?:ru|rs|sr)\/)?(?:states|russia)\/?(?:\?.*)?$/;
const ABOUT_ROUTE = /^\/(?:(?:ru|rs|sr)\/)?about\/?(?:\?.*)?$/;
const PROFILE_ROUTE = /^\/(?:(?:ru|rs|sr)\/)?profile(?:\/\d{1,15})?\/?(?:\?.*)?$/;
const DIST = resolve(import.meta.dirname, "dist");
const mapRoutes = () => {
  const rewrite = (preview) => (req, res, next) => {
    if (EN_ROUTE.test(req.url)) {
      const to = req.url.replace(EN_ROUTE, "/").replace(/^\/\?/, "/?");
      res.statusCode = 301;
      res.setHeader("Location", to);
      return res.end();
    }
    const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    // в preview отдаём страницы, которые сгенерировал scripts/seo.mjs (как на Vercel): /ru/states → ru/states/index.html
    if (preview) {
      const path = req.url.split("?")[0].replace(/\/$/, "").replace(/^\/sr(?=\/|$)/, "/rs");
      const file = `${path}/index.html`;
      if (!/^\/(?:(?:ru|rs)\/)?profile/.test(path) && existsSync(DIST + file)) {
        req.url = `${file}${q}`;
        return next();
      }
    }
    if (LANG_HOME.test(req.url)) req.url = `/index.html${q}`;
    else if (MAP_ROUTE.test(req.url)) req.url = `/map/index.html${q}`;
    else if (ABOUT_ROUTE.test(req.url)) req.url = `/about/index.html${q}`;
    else if (PROFILE_ROUTE.test(req.url)) req.url = `/profile/index.html${q}`;
    next();
  };
  return {
    name: "map-routes",
    configureServer(server) {
      server.middlewares.use(rewrite(false));
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite(true));
    },
  };
};

// Локально /api проксируется на продакшен, чтобы вход и лидерборд работали и в dev.
export default defineConfig({
  plugins: [mapRoutes()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        map: resolve(import.meta.dirname, "map/index.html"),
        profile: resolve(import.meta.dirname, "profile/index.html"),
        about: resolve(import.meta.dirname, "about/index.html"),
      },
    },
  },
  server: {
    proxy: {
      "/api": { target: process.env.API_PROXY || "https://countries-game-khaki.vercel.app", changeOrigin: true },
    },
  },
});
