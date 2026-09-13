import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

/* Windows не рисует флаги-эмодзи: подключаем шрифт только с флагами, и только если система не умеет сама.
   ?flags=twemoji — принудительно, для проверки на Mac. */
const FLAG_FONT_URL = "/fonts/TwemojiCountryFlags.woff2";
if (new URLSearchParams(location.search).get("flags") === "twemoji") {
  const style = document.createElement("style");
  style.textContent = `@font-face{font-family:"Twemoji Country Flags";unicode-range:U+1F1E6-1F1FF,U+1F3F4,U+E0062-E0063,U+E0065,U+E0067,U+E006C,U+E006E,U+E0073-E0074,U+E0077,U+E007F;src:url('${FLAG_FONT_URL}') format('woff2');font-display:swap}`;
  document.head.appendChild(style);
} else {
  polyfillCountryFlagEmojis("Twemoji Country Flags", FLAG_FONT_URL);
}
