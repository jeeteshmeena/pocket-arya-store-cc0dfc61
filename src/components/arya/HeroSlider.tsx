import { useEffect, useRef, useState } from "react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { flyToCart } from "@/lib/fly-to-cart";

const BASE_URL = "/api";
const ASPECT = 1184 / 556; // enforced banner size

type Banner = {
  id: string;
  type: "trending" | "new" | "manual";
  story_id?: string;
  image?: string | null;
  title: string;
  subtitle?: string;
  badge?: string;
};

function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${BASE_URL}/banners`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setBanners(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { banners, loading };
}

// Only TRENDING badge is shown — NEW badge is removed
const BADGE_STYLE = "bg-red-500 text-white";

export function HeroSlider() {
  const { addToCart, goToCheckout, navigate, theme, stories } = useApp();
  const { banners, loading } = useBanners();
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  // Use stories as fallback if no banners yet
  const slides: Banner[] = banners.length > 0
    ? banners
    : stories.slice(0, 3).map((s) => ({
        id: s.id,
        type: "manual" as const,
        story_id: s.id,
        image: s.poster || s.banner,
        title: s.title,
        subtitle: s.genre,
        badge: "",   // Never auto-add NEW badge
      }));

  // Auto-scroll every 5s
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  // Touch/mouse swipe
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setIdx((x) => diff > 0 ? (x + 1) % slides.length : (x - 1 + slides.length) % slides.length);
    }
    isDragging.current = false;
  };
  const onMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const diff = startX.current - e.clientX;
    if (Math.abs(diff) > 40) {
      setIdx((x) => diff > 0 ? (x + 1) % slides.length : (x - 1 + slides.length) % slides.length);
    }
    isDragging.current = false;
  };

  if (loading || slides.length === 0) {
    return (
      <div
        className="mx-4 mt-4 rounded-3xl bg-muted animate-pulse"
        style={{ aspectRatio: "16/10" }}
      />
    );
  }

  const slide = slides[Math.min(idx, slides.length - 1)];
  const story = slide.story_id ? stories.find((s) => s.id === slide.story_id) : null;

  const handleBuyNow = () => {
    if (story) {
      addToCart(story);
      goToCheckout();
    } else if (slide.story_id) {
      navigate({ name: "detail", storyId: slide.story_id });
    }
  };

  const handleDetail = () => {
    if (slide.story_id) navigate({ name: "detail", storyId: slide.story_id });
  };

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative overflow-hidden mx-4 mt-4 select-none cursor-grab active:cursor-grabbing bg-muted",
        theme === "cream" ? "neo-card" : "rounded-3xl shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)] ring-1 ring-border/60"
      )}
      style={{ aspectRatio: "16/10" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {slides.map((s, i) => (
        <SlideImage key={s.id} src={s.image} title={s.title} active={i === idx} />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,transparent_55%,rgba(0,0,0,0.25)_100%)] pointer-events-none" />

      {slide.badge && (
        <div className={cn(
          "absolute top-3.5 left-3.5 text-[10px] font-bold px-2.5 py-1 tracking-wider z-10 uppercase",
          theme === "cream"
            ? "border-2 border-black bg-white text-black neo-card !rounded-md"
            : "rounded-full backdrop-blur-md " + (slide.badge === "TRENDING" ? "bg-red-500/95 text-white shadow-lg" : "bg-white/90 text-black")
        )}>
          {slide.badge}
        </div>
      )}

      <div className="absolute top-3.5 right-3.5 z-10 flex gap-1.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={cn("h-1.5 rounded-full transition-all duration-300 backdrop-blur-sm",
              i === idx ? "w-7 bg-white shadow" : "w-1.5 bg-white/45 hover:bg-white/70")}
            aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10" onClick={handleDetail}>
        {slide.subtitle && !slide.subtitle.includes("New Release") && (
          <p className="text-white/75 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] mb-1.5 line-clamp-1">{slide.subtitle}</p>
        )}
        <div className={cn(
          "font-display leading-tight text-white drop-shadow-md line-clamp-2",
          theme === "cream" ? "text-[20px] sm:text-2xl font-extrabold tracking-tight"
            : theme === "teal" ? "text-[19px] sm:text-2xl font-bold tracking-tight"
            : "text-[18px] sm:text-xl font-bold"
        )}>
          {slide.title}
        </div>
        {story && (
          <div className="flex items-center gap-2 mt-3.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleBuyNow(); }}
              className={cn(
                "h-10 px-5 text-[13px] font-bold active:scale-95 transition shadow-lg",
                theme === "cream" ? "neo-button bg-white text-black" : "rounded-full bg-white text-black"
              )}
            >
              Buy Now · ₹{story.price}
            </button>
            <button
              id="hero-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                flyToCart(e.currentTarget);
                setTimeout(() => addToCart(story), 200);
              }}
              className={cn(
                "h-10 w-10 grid place-items-center text-base font-semibold active:scale-95 transition",
                theme === "cream" ? "neo-button bg-black text-white" : "rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white hover:bg-white/25"
              )}
              aria-label="Add to cart"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SlideImage({ src, title, active }: { src?: string | null; title: string; active: boolean }) {
  const [err, setErr] = useState(false);

  if (src && !err) {
    return (
      <img
        src={src}
        alt={title}
        onError={() => setErr(true)}
        draggable={false}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    );
  }
  /* Clean neutral fallback — title centered on grey */
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-end bg-muted transition-opacity duration-500",
        active ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
}
