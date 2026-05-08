import { useEffect, useRef, useState, useCallback } from "react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { flyToCart } from "@/lib/fly-to-cart";

const BASE_URL = "/api";
const ASPECT = 1184 / 556; // enforced 1184×556

type Banner = {
  id: string;
  type: "trending" | "new" | "manual";
  story_id?: string;
  image?: string | null;
  title: string;
  subtitle?: string;
  badge?: string;
};

// ─── Theme configs for each slide ──────────────────────────────────────────
const THEME_OVERLAYS = [
  // 0: Deep cinematic (default dark)
  { from: "from-black/90", via: "via-black/45", badge: "bg-rose-500 text-white" },
  // 1: Warm amber
  { from: "from-amber-950/90", via: "via-amber-900/30", badge: "bg-amber-400 text-black" },
  // 2: Cool indigo
  { from: "from-indigo-950/90", via: "via-indigo-900/30", badge: "bg-indigo-400 text-white" },
  // 3: Emerald
  { from: "from-emerald-950/90", via: "via-emerald-900/30", badge: "bg-emerald-400 text-black" },
];

function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_URL}/banners`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (!cancelled && j.success) setBanners(j.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { banners, loading };
}

export function HeroSlider() {
  const { addToCart, goToCheckout, navigate, theme, stories } = useApp();
  const { banners, loading } = useBanners();
  const [idx, setIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const dragDelta = useRef(0);

  // Build slides: banners from API or story fallback (2 trending + 2 new)
  const slides: Banner[] = banners.length > 0
    ? banners
    : (() => {
        const trending = stories.slice(0, 2).map((s) => ({
          id: s.id + "-t",
          type: "trending" as const,
          story_id: s.id,
          image: s.poster || s.banner,
          title: s.title,
          subtitle: s.genre,
          badge: "TRENDING",
        }));
        const newest = [...stories].reverse().slice(0, 2).map((s) => ({
          id: s.id + "-n",
          type: "new" as const,
          story_id: s.id,
          image: s.poster || s.banner,
          title: s.title,
          subtitle: s.genre,
          badge: "NEW",
        }));
        return [...trending, ...newest];
      })();

  // ─── Auto-scroll (pause on interaction, resume after 3s) ───────────────
  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setIdx((x) => (x + 1) % slides.length);
    }, 4500);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [slides.length, startAuto]);

  const goTo = (i: number) => {
    if (i === idx || isAnimating) return;
    setIsAnimating(true);
    setIdx(i);
    setTimeout(() => setIsAnimating(false), 500);
    startAuto();
  };

  // ─── Touch / Mouse swipe ───────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragDelta.current = 0;
    isDragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    dragDelta.current = startX.current - e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (Math.abs(dragDelta.current) > 45) {
      goTo(dragDelta.current > 0
        ? (idx + 1) % slides.length
        : (idx - 1 + slides.length) % slides.length);
    }
  };
  const onMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
    dragDelta.current = 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    dragDelta.current = startX.current - e.clientX;
  };
  const onMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (Math.abs(dragDelta.current) > 45) {
      goTo(dragDelta.current > 0
        ? (idx + 1) % slides.length
        : (idx - 1 + slides.length) % slides.length);
    }
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="mx-3 mt-3 rounded-2xl bg-muted animate-pulse"
        style={{ aspectRatio: `${ASPECT}` }}
      />
    );
  }
  if (slides.length === 0) return null;

  const slide = slides[Math.min(idx, slides.length - 1)];
  const story = slide.story_id ? stories.find((s) => s.id === slide.story_id) : null;
  const themeOverlay = THEME_OVERLAYS[idx % THEME_OVERLAYS.length];

  const handleBuyNow = () => {
    if (story) { addToCart(story); goToCheckout(); }
    else if (slide.story_id) navigate({ name: "detail", storyId: slide.story_id });
  };
  const handleDetail = () => {
    if (slide.story_id) navigate({ name: "detail", storyId: slide.story_id });
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden mx-3 mt-3 select-none cursor-grab active:cursor-grabbing bg-muted",
        theme === "cream"
          ? "neo-card"
          : "rounded-2xl shadow-[0_20px_48px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
      )}
      style={{ aspectRatio: `${ASPECT}` }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* ── Slide images (all pre-loaded, only active is visible) ── */}
      {slides.map((s, i) => (
        <SlideImage key={s.id} src={s.image} title={s.title} active={i === idx} />
      ))}

      {/* ── Gradient overlay (theme-aware) ── */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t to-transparent pointer-events-none",
        themeOverlay.from, themeOverlay.via
      )} />
      {/* subtle top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

      {/* ── Badge ── */}
      {slide.badge && (
        <div className={cn(
          "absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 tracking-widest z-10 uppercase rounded-full",
          slide.badge === "TRENDING"
            ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            : "bg-white/90 text-black"
        )}>
          {slide.badge}
        </div>
      )}

      {/* ── Dot indicators ── */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5 items-center">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); goTo(i); }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === idx ? "w-6 bg-white shadow" : "w-1.5 bg-white/40 hover:bg-white/65"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 z-10"
        onClick={handleDetail}
      >
        {slide.subtitle && (
          <p className="text-white/65 text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5 line-clamp-1">
            {slide.subtitle}
          </p>
        )}
        <div
          className={cn(
            "font-display leading-tight text-white drop-shadow-lg line-clamp-2",
            theme === "cream"
              ? "text-[19px] font-extrabold tracking-tight"
              : "text-[17px] font-bold"
          )}
        >
          {slide.title}
        </div>

        {story && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); handleBuyNow(); }}
              className={cn(
                "h-9 px-5 text-[12px] font-black active:scale-95 transition shadow-lg",
                theme === "cream"
                  ? "neo-button bg-white text-black"
                  : "rounded-full bg-white text-black"
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
                "h-9 w-9 grid place-items-center text-base font-bold active:scale-95 transition",
                theme === "cream"
                  ? "neo-button bg-black text-white"
                  : "rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25"
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

// Pre-load all slides — only toggle opacity, no remount
function SlideImage({ src, title, active }: { src?: string | null; title: string; active: boolean }) {
  const [err, setErr] = useState(false);

  if (src && !err) {
    return (
      <img
        src={src}
        alt={title}
        onError={() => setErr(true)}
        draggable={false}
        fetchPriority={active ? "high" : "low"}
        loading="eager"
        decoding="async"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 transition-opacity duration-500",
        active ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
}
