/* Всплывающие карточки сверху (та же разметка и стили .achv, что у достижений «Стран»). */
export function createNotices(layer) {
  const queue = [];
  let showing = false;

  function pump() {
    if (showing || !queue.length) return;
    const a = queue.shift();
    showing = true;
    const card = document.createElement("div");
    card.className = `achv${a.cls ? ` ${a.cls}` : ""}`;
    card.style.setProperty("--h", a.hue ?? 210);
    card.innerHTML = `
      <div class="achv__burst" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
      <div class="achv__emoji">${a.emoji}</div>
      <div class="achv__text">
        <div class="achv__label">${a.label || ""}</div>
        <div class="achv__title">${a.title || ""}</div>
        <div class="achv__desc">${a.desc || ""}</div>
      </div>`;
    layer.appendChild(card);
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("is-in")));
    const close = () => {
      if (card.classList.contains("is-out")) return;
      card.classList.add("is-out");
      window.setTimeout(() => {
        card.remove();
        showing = false;
        pump();
      }, 360);
    };
    card.addEventListener("click", close);
    window.setTimeout(close, 4200);
  }

  return {
    push(item) {
      queue.push(item);
      pump();
    },
  };
}
