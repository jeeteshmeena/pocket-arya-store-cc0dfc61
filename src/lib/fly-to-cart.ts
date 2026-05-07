export function flyToCart(sourceEl: HTMLElement) {
  const target = document.getElementById("arya-cart-target");
  if (!target) return;
  const s = sourceEl.getBoundingClientRect();
  const t = target.getBoundingClientRect();

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.left = `${s.left}px`;
  clone.style.top = `${s.top}px`;
  clone.style.width = `${s.width}px`;
  clone.style.height = `${s.height}px`;
  clone.style.borderRadius = "16px";
  clone.style.objectFit = "cover";
  clone.style.zIndex = "60";
  clone.style.pointerEvents = "none";
  clone.style.boxShadow = "0 12px 30px -8px rgba(0,0,0,0.35)";
  clone.style.transition =
    "transform 700ms cubic-bezier(0.5, -0.2, 0.2, 1.1), opacity 700ms cubic-bezier(0.4, 0, 0.6, 1), border-radius 700ms ease-out";
  clone.style.willChange = "transform, opacity";
  document.body.appendChild(clone);

  const dx = t.left + t.width / 2 - (s.left + s.width / 2);
  const dy = t.top + t.height / 2 - (s.top + s.height / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.08) rotate(15deg)`;
    clone.style.opacity = "0";
    clone.style.borderRadius = "9999px";
  });

  setTimeout(() => {
    clone.remove();
    target.classList.add("animate-cart-bounce");
    setTimeout(() => target.classList.remove("animate-cart-bounce"), 550);
  }, 720);
}
