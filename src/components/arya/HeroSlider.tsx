import { useEffect, useState } from "react";
import { HERO_SLIDES } from "@/lib/data";
import { useApp } from "@/store/app-store";

import { cn } from "@/lib/utils";

export function HeroSlider() {
  const [i, setI] = useState(0);
  const { addToCart, startCheckout, theme } = useApp();

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const slide = HERO_SLIDES[i];

  return (
    <div className={cn(
      "relative overflow-hidden mx-4 mt-3 shadow-xl",
      theme === "pfm" ? "rounded-3xl aspect-[1264/700]" : "rounded-2xl aspect-[1264/590]"
    )}>
      {HERO_SLIDES.map((s, idx) => (
        <img
          key={s.id}
          src={s.banner}
          alt={s.title}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            idx === i ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 h-full flex flex-col justify-end p-4 text-white">
        <div className={cn("font-display font-bold leading-tight", theme === "pfm" ? "text-2xl" : "text-xl")}>
          {slide.title}
        </div>
        <p className="text-xs text-white/80 mt-1 line-clamp-2 max-w-[90%]">{slide.description}</p>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => startCheckout([slide])}
            className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition"
          >
            Buy Now
          </button>
          <button
            onClick={() => addToCart(slide)}
            className="h-9 px-5 rounded-full bg-transparent border border-white/40 text-white text-xs font-semibold active:scale-95 transition"
          >
            Add to Cart
          </button>
        </div>
      </div>
      <div className="absolute bottom-2 right-3 z-10 flex gap-1">
        {HERO_SLIDES.map((_, idx) => (
          <span key={idx} className={cn(
            "h-1 rounded-full transition-all",
            idx === i ? "w-5 bg-white" : "w-1.5 bg-white/40"
          )} />
        ))}
      </div>
    </div>
  );
}
