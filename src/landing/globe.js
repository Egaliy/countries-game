/* Глобус на первом экране: страны по очереди «вписываются» — глобус поворачивается к стране, она загорается
   зелёным, затем синим, над ней всплывает флаг с названием. Крутится мышью и пальцем, чуть наклоняется за курсором.
   Canvas 2D + d3-geo (ортографическая проекция), контуры world-atlas 110m грузятся отдельным чанком. */
import { geoOrthographic, geoPath, geoCentroid, geoArea, geoDistance, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

export async function mountGlobe(host, { items, reduced = false }) {
  const { default: world } = await import("world-atlas/countries-110m.json");
  const countries = feature(world, world.objects.countries).features;
  const byNum = new Map(countries.map((f) => [Number(f.id), f]));
  const seq = items.map((it) => ({ ...it, f: byNum.get(it.num) })).filter((it) => it.f);
  // центр страны — центр самого большого полигона (у Франции без Гвианы)
  for (const it of seq) {
    const g = it.f.geometry;
    const polys = g.type === "MultiPolygon" ? g.coordinates.map((c) => ({ type: "Polygon", coordinates: c })) : [g];
    polys.sort((a, b) => geoArea(b) - geoArea(a));
    it.center = geoCentroid(polys[0]);
  }

  const canvas = document.createElement("canvas");
  const chips = document.createElement("div");
  chips.className = "ld-globe__chips";
  host.append(canvas, chips);
  host.classList.add("is-live");
  const ctx = canvas.getContext("2d");
  const projection = geoOrthographic().clipAngle(90).precision(0.5);
  const path = geoPath(projection, ctx);
  const graticule = geoGraticule10();
  const sphere = { type: "Sphere" };
  const root = document.documentElement;
  const live = new Set(); // подписи, которые едут вместе со своей страной

  let C = {};
  const readColors = () => {
    const cs = getComputedStyle(root);
    const dark = "dark" in root.dataset;
    C = dark
      ? { oceanIn: "#223040", oceanOut: "#0b1016", land: "#3d4550", border: "#121820", grid: "rgba(255,255,255,0.05)", shade: "rgba(0,0,0,0.35)", gloss: "rgba(255,255,255,0.10)" }
      : { oceanIn: "#ffffff", oceanOut: "#d9e3ef", land: "#c3ccd8", border: "#f3f6fa", grid: "rgba(0,50,110,0.07)", shade: "rgba(20,40,80,0.16)", gloss: "rgba(255,255,255,0.55)" };
    C.accent = cs.getPropertyValue("--accent").trim() || "#0071e3";
    C.green = cs.getPropertyValue("--green").trim() || "#34c759";
  };
  readColors();

  const st = { lambda: 0, phi: -20, tx: 0, ty: 0, x: 0, y: 0, lit: new Map(), fade: 1, drag: null, hold: 0, tween: null, visible: false, raf: 0, w: 1, h: 1, dpr: 1 };
  if (seq[0]) st.lambda = -seq[0].center[0] + 40;

  const resize = () => {
    const r = host.getBoundingClientRect();
    st.dpr = Math.min(2, window.devicePixelRatio || 1);
    st.w = Math.max(1, r.width);
    st.h = Math.max(1, r.height);
    canvas.width = Math.round(st.w * st.dpr);
    canvas.height = Math.round(st.h * st.dpr);
  };
  resize();

  function draw(now) {
    const { w, h } = st;
    const r = Math.min(w, h) / 2 - 1;
    const cx = w / 2;
    const cy = h / 2;
    projection.scale(r).translate([cx, cy]).rotate([st.lambda + st.x * 12, st.phi + st.y * 10, 0]);
    ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const ocean = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
    ocean.addColorStop(0, C.oceanIn);
    ocean.addColorStop(1, C.oceanOut);
    ctx.beginPath();
    path(sphere);
    ctx.fillStyle = ocean;
    ctx.fill();

    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.beginPath();
    for (const f of countries) path(f);
    ctx.fillStyle = C.land;
    ctx.fill();

    for (const [f, t0] of st.lit) {
      const p = Math.min(1, (now - t0) / 1100);
      ctx.beginPath();
      path(f);
      ctx.globalAlpha = st.fade;
      ctx.fillStyle = C.accent;
      ctx.fill();
      if (p < 1) {
        ctx.globalAlpha = (1 - p) * st.fade;
        ctx.fillStyle = C.green;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    for (const f of countries) path(f);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = Math.max(0.5, r / 420);
    ctx.stroke();

    // объём: тень к краю и блик сверху слева
    const shade = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.55, cx, cy, r);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, C.shade);
    const gloss = ctx.createRadialGradient(cx - r * 0.42, cy - r * 0.5, 0, cx - r * 0.42, cy - r * 0.5, r * 0.75);
    gloss.addColorStop(0, C.gloss);
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    path(sphere);
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.fillStyle = gloss;
    ctx.fill();
    for (const o of live) place(o);
  }

  function frame(now) {
    st.raf = 0;
    st.x += (st.tx - st.x) * 0.06;
    st.y += (st.ty - st.y) * 0.06;
    if (st.tween) {
      const p = Math.min(1, (now - st.tween.t0) / st.tween.ms);
      const e = ease(p);
      st.lambda = st.tween.l0 + st.tween.dl * e;
      st.phi = st.tween.p0 + st.tween.dp * e;
      if (p >= 1) {
        const done = st.tween.done;
        st.tween = null;
        done();
      }
    } else if (!st.drag && now > st.hold) {
      st.lambda += 0.05;
    }
    draw(now);
    if (st.visible) st.raf = requestAnimationFrame(frame);
  }
  const kick = () => {
    if (reduced) return draw(performance.now());
    if (!st.raf && st.visible) st.raf = requestAnimationFrame(frame);
  };

  new ResizeObserver(() => {
    resize();
    if (reduced || !st.visible) draw(performance.now());
  }).observe(host);
  new MutationObserver(() => {
    readColors();
    if (reduced || !st.visible) draw(performance.now());
  }).observe(root, { attributes: true, attributeFilter: ["data-theme", "data-dark"] });

  if (reduced) {
    seq.slice(0, 12).forEach((it) => st.lit.set(it.f, -1e9));
    st.lambda = -10;
    st.phi = -30;
    draw(performance.now());
    return;
  }

  new IntersectionObserver((entries) => {
    st.visible = entries.some((e) => e.isIntersecting);
    kick();
  }).observe(host);

  // вращение пальцем и мышью
  canvas.addEventListener("pointerdown", (e) => {
    st.drag = { x: e.clientX, y: e.clientY, l: st.lambda, p: st.phi };
    if (st.tween) {
      const done = st.tween.done;
      st.tween = null;
      done();
    }
    canvas.setPointerCapture(e.pointerId);
    host.classList.add("is-drag");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!st.drag) return;
    st.lambda = st.drag.l + (e.clientX - st.drag.x) * 0.4;
    st.phi = Math.max(-70, Math.min(70, st.drag.p - (e.clientY - st.drag.y) * 0.4));
  });
  const release = () => {
    if (!st.drag) return;
    st.drag = null;
    st.hold = performance.now() + 1600;
    host.classList.remove("is-drag");
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      st.tx = e.clientX / window.innerWidth - 0.5;
      st.ty = -(e.clientY / window.innerHeight - 0.5);
    },
    { passive: true },
  );

  const turnTo = ([lon, lat]) =>
    new Promise((done) => {
      st.lambda = wrap(st.lambda);
      const dl = wrap(-lon - st.lambda);
      const dp = Math.max(-35, Math.min(35, -lat * 0.8)) - st.phi;
      const ms = Math.min(1500, 650 + Math.abs(dl) * 4 + Math.abs(dp) * 4);
      st.tween = { t0: performance.now(), ms, l0: st.lambda, dl, p0: st.phi, dp, done };
      kick();
    });
  const ready = async () => {
    while (!st.visible || st.drag || performance.now() < st.hold) await sleep(200);
  };
  function place(o) {
    const [l, p] = projection.rotate();
    const front = geoDistance(o.center, [-l, -p]) < Math.PI / 2 - 0.08;
    const pt = projection(o.center);
    o.el.style.visibility = front && pt ? "visible" : "hidden";
    if (!pt) return;
    o.el.style.left = `${(pt[0] / st.w) * 100}%`;
    o.el.style.top = `${(pt[1] / st.h) * 100}%`;
  }
  const chip = (it) => {
    const el = document.createElement("div");
    el.className = "ld-globe__chip";
    el.innerHTML = `<span class="ld-globe__flag">${it.flag}</span>${esc(it.name)}`;
    const o = { el, center: it.center };
    live.add(o);
    place(o);
    chips.append(el);
    setTimeout(() => {
      el.remove();
      live.delete(o);
    }, 2400);
  };

  await sleep(900);
  for (;;) {
    for (const it of seq) {
      await ready();
      await turnTo(it.center);
      st.lit.set(it.f, performance.now());
      chip(it);
      await sleep(1250);
    }
    await sleep(2500);
    const t0 = performance.now();
    while (st.fade > 0) {
      st.fade = Math.max(0, 1 - (performance.now() - t0) / 900);
      await sleep(30);
    }
    st.lit.clear();
    st.fade = 1;
  }
}
