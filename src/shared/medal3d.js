/* Объёмные медали: цветная картинка + карта глубины (параллакс) + карта нормалей (блик), WebGL.
   Медаль наклоняется за курсором, на телефоне мягко покачивается сама. Без WebGL — картинка с CSS-наклоном.
   Ассеты: public/medals/{gold,silver,bronze}.webp, depth.png, normal.png (одна геометрия на все три). */

import { medalFor, medalName, boardName, medalNextText, freshMedalText } from "./medals.js";

const BASE = "/medals";
const cache = new Map();
const loadImage = (src) => {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }),
    );
  }
  return cache.get(src);
};

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform sampler2D uNormal;
uniform vec2 uTilt;
uniform vec3 uLight;
uniform float uShine;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  for (int i = 0; i < 3; i++) {
    float d = texture2D(uDepth, uv).r;
    uv = vUv - uTilt * (d - 0.45) * 0.05;
  }
  vec4 col = texture2D(uColor, uv);
  if (col.a < 0.002) discard;
  vec3 n = normalize(texture2D(uNormal, uv).xyz * 2.0 - 1.0);
  vec3 L = normalize(uLight);
  float diff = max(dot(n, L), 0.0);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 48.0);
  float rim = pow(1.0 - max(n.z, 0.0), 2.0);
  vec3 rgb = col.rgb * (0.78 + 0.34 * diff) + (spec * uShine + rim * 0.08) * col.a;
  gl_FragColor = vec4(min(rgb, vec3(col.a)), col.a);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}

function texture(gl, unit, img) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, unit === 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/* Один общий слушатель мыши на все медали страницы */
const followers = new Set();
let listening = false;
function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      followers.forEach((m) => m.follow(e.clientX, e.clientY));
    },
    { passive: true },
  );
  document.documentElement.addEventListener("mouseleave", () => followers.forEach((m) => m.release()));
  window.addEventListener("blur", () => followers.forEach((m) => m.release()));
}

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SHINE = { gold: 0.55, silver: 0.7, bronze: 0.45 };

/* Превращает элемент в объёмную медаль. tier: gold | silver | bronze */
export async function mountMedal(host, tier) {
  if (host.dataset.mounted) return;
  host.dataset.mounted = "1";
  host.classList.add("medal3d");
  const colorSrc = `${BASE}/${tier}.webp`;
  listen();
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
  const fallback = () => {
    const img = new Image();
    img.src = colorSrc;
    img.alt = "";
    img.className = "medal3d__img";
    host.replaceChildren(img);
    host.classList.add("medal3d--flat");
  };
  if (!gl) return fallback();
  let imgs;
  try {
    imgs = await Promise.all([loadImage(colorSrc), loadImage(`${BASE}/depth.png`), loadImage(`${BASE}/normal.png`)]);
  } catch {
    return fallback();
  }
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
  } catch {
    return fallback();
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  texture(gl, 0, imgs[0]);
  texture(gl, 1, imgs[1]);
  texture(gl, 2, imgs[2]);
  gl.uniform1i(gl.getUniformLocation(prog, "uColor"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "uDepth"), 1);
  gl.uniform1i(gl.getUniformLocation(prog, "uNormal"), 2);
  gl.uniform1f(gl.getUniformLocation(prog, "uShine"), SHINE[tier] ?? 0.5);
  const uTilt = gl.getUniformLocation(prog, "uTilt");
  const uLight = gl.getUniformLocation(prog, "uLight");
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  host.replaceChildren(canvas);

  const state = { x: 0, y: 0, tx: 0, ty: 0, hover: false, visible: true, raf: 0, t0: performance.now() };

  const resize = () => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = () => {
    state.raf = 0;
    if (!state.visible) return;
    const idle = !state.hover && !reduceMotion();
    if (idle) {
      const t = (performance.now() - state.t0) / 1000;
      state.tx = Math.sin(t * 0.9) * 0.35;
      state.ty = Math.cos(t * 0.7) * 0.2;
    }
    state.x += (state.tx - state.x) * 0.14;
    state.y += (state.ty - state.y) * 0.14;
    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uTilt, state.x, state.y);
    gl.uniform3f(uLight, -0.35 + state.x * 0.9, 0.45 + state.y * 0.9, 0.85);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    host.style.transform = `perspective(600px) rotateY(${state.x * 14}deg) rotateX(${-state.y * 14}deg)`;
    const moving = Math.abs(state.tx - state.x) + Math.abs(state.ty - state.y) > 0.002;
    if (idle || moving) state.raf = requestAnimationFrame(draw);
  };
  const kick = () => {
    if (!state.raf) state.raf = requestAnimationFrame(draw);
  };

  const medal = {
    follow(x, y) {
      // наклон к курсору: чем дальше мышь от медали по экрану, тем сильнее
      const r = host.getBoundingClientRect();
      state.hover = true;
      state.tx = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / (window.innerWidth * 0.45)));
      state.ty = Math.max(-1, Math.min(1, (r.top + r.height / 2 - y) / (window.innerHeight * 0.45)));
      kick();
    },
    release() {
      state.hover = false;
      state.tx = 0;
      state.ty = 0;
      kick();
    },
  };
  followers.add(medal);
  new IntersectionObserver((entries) => {
    state.visible = entries.some((en) => en.isIntersecting);
    if (state.visible) kick();
  }).observe(host);
  kick();
}

export function mountMedals(root) {
  root.querySelectorAll("[data-medal3d]").forEach((el) => mountMedal(el, el.dataset.medal3d));
}

export const medalImage = (tier) => `${BASE}/${tier}.webp`;

/* Крупная медаль режима на экране результата: объёмная, если есть; серая с условием, если ещё нет */
export function resultMedalHTML(board, best, lang, isFresh = false) {
  const tier = medalFor(board, best || { score: 0, time: null });
  const next = medalNextText(board, tier, lang);
  const art = tier
    ? `<div class="result-medal__art" data-medal3d="${tier}"></div>`
    : `<div class="result-medal__art result-medal__art--none"><img src="${BASE}/bronze.webp" alt="" /></div>`;
  const label = tier ? `${medalName(tier, lang)} · ${boardName(board, lang)}` : boardName(board, lang);
  const sub = [isFresh && tier ? freshMedalText(lang) : "", next].filter(Boolean).join(" · ");
  return `
    <div class="result-medal result-medal--${tier || "none"}${isFresh && tier ? " is-fresh" : ""}" data-medal-hover>
      ${art}
      <div class="result-medal__label">${label}</div>
      ${sub ? `<div class="result-medal__sub">${sub}</div>` : ""}
    </div>`;
}
