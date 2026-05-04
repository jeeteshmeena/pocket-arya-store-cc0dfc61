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
  clone.style.borderRadius = "12px";
  clone.style.objectFit = "cover";
  clone.style.zIndex = "60";
  clone.style.pointerEvents = "none";
  clone.style.transition = "transform 600ms cubic-bezier(.6,-0.05,.4,1.05), opacity 600ms ease-out";
  clone.style.willChange = "transform, opacity";
  document.body.appendChild(clone);

  const dx = t.left + t.width / 2 - (s.left + s.width / 2);
  const dy = t.top + t.height / 2 - (s.top + s.height / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.1) rotate(20deg)`;
    clone.style.opacity = "0.2";
  });

  setTimeout(() => {
    clone.remove();
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }],
      { duration: 280, easing: "ease-out" }
    );
  }, 620);
}
