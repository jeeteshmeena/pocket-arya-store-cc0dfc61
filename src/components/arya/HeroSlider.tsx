/**
 * HeroSlider — OTT-grade cinematic banner
 * Aspect ratio: 1184×556 (enforced via paddingBottom trick — zero CLS)
 * Features: preloaded images, GPU transitions, momentum swipe, blur skeleton,
 *           auto-scroll with pause/resume, per-theme overlays, live data
 */
import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { flyToCart } from "@/lib/fly-to-cart";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { getOptimizedImage } from "@/lib/api";

// Exact 1184:556 = 46.96... %
const ASPECT_PERCENT = (556 / 1184) * 100; // = 46.959...%
const BASE_URL = "/api";
const AUTO_INTERVAL = 4500;
const SWIPE_THRESHOLD = 40;

// ─── Types ────────────────────────────────────────────────────────────────────
type Banner = {
  id: string;
  type: "trending" | "new" | "manual";
  story_id?: string;
  image?: string | null;
  title: string;
  subtitle?: string;
  badge?: string;
};

// ─── Per-slide cinematic overlays ─────────────────────────────────────────────
const CINEMATIC_OVERLAYS = [
  // 0 — Deep noir
  {
    gradient: "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.12) 100%)",
    badgeBg:  "rgba(239,68,68,0.95)",
    badgeText:"#fff",
    accent:   "#ef4444",
  },
  // 1 — Warm cinematic amber
  {
    gradient: "linear-gradient(0deg, rgba(40,14,0,0.92) 0%, rgba(90,40,0,0.45) 40%, rgba(0,0,0,0.12) 100%)",
    badgeBg:  "rgba(251,191,36,0.95)",
    badgeText:"#000",
    accent:   "#fbbf24",
  },
  // 2 — Cool indigo
  {
    gradient: "linear-gradient(0deg, rgba(10,10,60,0.92) 0%, rgba(30,30,100,0.45) 40%, rgba(0,0,0,0.12) 100%)",
    badgeBg:  "rgba(129,140,248,0.95)",
    badgeText:"#000",
    accent:   "#818cf8",
  },
  // 3 — Emerald forest
  {
    gradient: "linear-gradient(0deg, rgba(0,30,15,0.92) 0%, rgba(0,60,30,0.45) 40%, rgba(0,0,0,0.12) 100%)",
    badgeBg:  "rgba(52,211,153,0.95)",
    badgeText:"#000",
    accent:   "#34d399",
  },
];

// ─── Data hook ────────────────────────────────────────────────────────────────
function useBanners(fallbackStories: ReturnType<typeof useApp>["stories"]) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/banners`)
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        if (j.success && Array.isArray(j.data) && j.data.length) {
          setBanners(j.data);
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  // Build fallback slides from stories (available immediately)
  const fallbackSlides: Banner[] = fallbackStories.length > 0
    ? (() => {
        const hasCounts = fallbackStories.some(s => (s as any).purchase_count > 0);
        const sorted = [...fallbackStories].sort((a, b) =>
          hasCounts ? ((b as any).purchase_count ?? 0) - ((a as any).purchase_count ?? 0) : 0
        );
        const newest = [...fallbackStories].sort((a, b) => {
          const da = (a as any).created_at ?? (a as any).uploaded_at ?? "";
          const db = (b as any).created_at ?? (b as any).uploaded_at ?? "";
          return db > da ? 1 : db < da ? -1 : 0;
        });
        const trending = sorted.slice(0, 2).map(s => ({
          id: `t-${s.id}`, type: "trending" as const,
          story_id: s.id, image: s.poster || s.banner,
          title: s.title, badge: "TRENDING",
        }));
        const newItems = newest.slice(0, 2)
          .filter(s => !trending.find(t => t.story_id === s.id))
          .map(s => ({
            id: `n-${s.id}`, type: "new" as const,
            story_id: s.id, image: s.poster || s.banner,
            title: s.title, badge: "NEW",
          }));
        return [...trending, ...newItems];
      })()
    : [];

  // Priority: manual banners → fallback from stories → empty
  const slides: Banner[] = banners.length > 0 ? banners : fallbackSlides;

  // ready=true as soon as we have ANY slides — don't wait for API if stories exist
  const ready = slides.length > 0 || loaded;

  return { slides, ready };
}

// ─── Preloader: load all images before showing ───────────────────────────────
function usePreloadImages(slides: Banner[]) {
  const [loadedSet, setLoadedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only eagerly preload the first slide; the rest are picked up lazily
    // by the <img> tags themselves once the carousel rotates to them.
    // This prevents a burst of N parallel image requests at app startup
    // which is a major cause of slow first-load on mobile networks.
    slides.slice(0, 1).forEach((s) => {
      if (!s.image) return;
      const img = new Image();
      img.fetchPriority = "high";
      img.src = getOptimizedImage(s.image) || "";
      img.onload = () =>
        setLoadedSet(prev => new Set([...prev, s.id]));
    });
  }, [slides.map(s => s.id).join(",")]);

  return loadedSet;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HeroSlider() {
  const { addToCart, goToCheckout, navigate, theme, stories, appPreferences } = useApp();
  const fmt = usePriceFormat();
  const { slides, ready } = useBanners(stories);
  const loadedImages = usePreloadImages(slides);

  const [idx, setIdx] = useState(0);
  const autoRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchX    = useRef(0);
  const touchY    = useRef(0);
  const dragDelta = useRef(0);
  const isDrag    = useRef(false);
  const isScrolling = useRef<boolean | null>(null);

  const n = slides.length;
  const safeIdx = n > 0 ? Math.min(idx, n - 1) : 0;

  // ── Auto scroll ────────────────────────────────────────────────────────────
  const resetAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    if (n <= 1 || appPreferences?.autoplayHero === false) return;
    autoRef.current = setInterval(() => setIdx(x => (x + 1) % n), AUTO_INTERVAL);
  }, [n, appPreferences?.autoplayHero]);

  useEffect(() => {
    resetAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [resetAuto]);

  const goTo = useCallback((i: number) => {
    setIdx(i);
    resetAuto();
  }, [resetAuto]);

  // ── Touch handlers ─────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
    dragDelta.current = 0;
    isDrag.current = true;
    isScrolling.current = null;
    if (autoRef.current) clearInterval(autoRef.current);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDrag.current) return;
    const dx = touchX.current - e.touches[0].clientX;
    const dy = touchY.current - e.touches[0].clientY;
    if (isScrolling.current === null) {
      isScrolling.current = Math.abs(dy) > Math.abs(dx);
    }
    if (!isScrolling.current) {
      e.preventDefault();
      dragDelta.current = dx;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDrag.current || isScrolling.current) {
      isDrag.current = false;
      resetAuto();
      return;
    }
    isDrag.current = false;
    if (Math.abs(dragDelta.current) > SWIPE_THRESHOLD) {
      goTo(dragDelta.current > 0 ? (safeIdx + 1) % n : (safeIdx - 1 + n) % n);
    } else {
      resetAuto();
    }
  }, [safeIdx, n, goTo, resetAuto]);

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    touchX.current = e.clientX;
    dragDelta.current = 0;
    isDrag.current = true;
    if (autoRef.current) clearInterval(autoRef.current);
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrag.current) return;
    dragDelta.current = touchX.current - e.clientX;
  }, []);
  const onMouseUp = useCallback(() => {
    if (!isDrag.current) { resetAuto(); return; }
    isDrag.current = false;
    if (Math.abs(dragDelta.current) > SWIPE_THRESHOLD) {
      goTo(dragDelta.current > 0 ? (safeIdx + 1) % n : (safeIdx - 1 + n) % n);
    } else {
      resetAuto();
    }
  }, [safeIdx, n, goTo, resetAuto]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (!ready || n === 0) {
    return (
      <div className="mx-3 mt-3">
        <div
          className="relative w-full rounded-2xl shimmer-bg overflow-hidden"
          style={{ aspectRatio: "1184/556" }}
        />
      </div>
    );
  }

  const slide   = slides[safeIdx];
  const overlay = CINEMATIC_OVERLAYS[safeIdx % CINEMATIC_OVERLAYS.length];
  const story   = slide.story_id ? stories.find(s => s.id === slide.story_id) : null;
  const isCreamed = theme === "cream";

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (story) { addToCart(story); goToCheckout(); }
    else if (slide.story_id) navigate({ name: "detail", storyId: slide.story_id });
  };
  const handleDetail = () => {
    if (!isDrag.current && Math.abs(dragDelta.current) < 8 && slide.story_id) {
      navigate({ name: "detail", storyId: slide.story_id });
    }
  };

  return (
    <div className="mx-3 mt-3">
      {/*
        Zero-CLS aspect ratio container.
        paddingBottom trick: height = 0, padding creates the box.
        Never causes layout shift regardless of image load state.
      */}
      <div
        className={cn(
          "relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing",
          isCreamed ? "neo-card" : "rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)]"
        )}
        style={{ aspectRatio: "1184/556" }}

        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={handleDetail}
      >
        {/* ── Slides — all in DOM, CSS opacity toggle (GPU) ── */}
        {slides.map((s, i) => (
          <SlideImage
            key={s.id}
            src={s.image}
            title={s.title}
            active={i === safeIdx}
            preloaded={loadedImages.has(s.id) || !s.image}
            priority={i === 0}
          />
        ))}

        {/* ── Cinematic gradient overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: overlay.gradient }}
        />
        {/* Top vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 35%)" }}
        />

        {/* ── Badge ── */}
        {slide.badge && (
          <div
            className="absolute top-3 left-3 z-10 text-[9px] font-black px-2.5 py-1 tracking-[0.18em] uppercase rounded-full"
            style={{
              background: overlay.badgeBg,
              color: overlay.badgeText,
              boxShadow: `0 2px 12px ${overlay.accent}66`,
            }}
          >
            {slide.badge}
          </div>
        )}

        {/* ── Dot indicators ── */}
        <div className="absolute top-3 right-3 z-10 flex gap-1.5 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); goTo(i); }}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === safeIdx ? "22px" : "6px",
                background: i === safeIdx ? "#fff" : "rgba(255,255,255,0.38)",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* ── Content overlay ── */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="hero-content-reveal">

            <p
              className={cn(
                "font-display text-white drop-shadow-lg line-clamp-2 leading-tight",
                isCreamed ? "text-[18px] font-extrabold tracking-tight"
                : theme === "teal" ? "text-[17px] font-bold tracking-tight"
                : "text-[16px] font-bold"
              )}
            >
              {slide.title}
            </p>

            {story && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleBuyNow}
                  className={cn(
                    "h-9 px-5 text-[12px] font-black active:scale-95 transition-transform duration-75 shadow-lg",
                    isCreamed ? "neo-button bg-white text-black" : "rounded-full bg-white text-black"
                  )}
                >
                  Buy Now · {fmt(story.price)}
                </button>
                <button
                  id="hero-add-btn"
                  onClick={e => {
                    e.stopPropagation();
                    flyToCart(e.currentTarget);
                    setTimeout(() => addToCart(story), 200);
                  }}
                  className={cn(
                    "h-9 w-9 grid place-items-center text-base font-black active:scale-95 transition-transform duration-75",
                    isCreamed
                      ? "neo-button bg-black text-white"
                      : "rounded-full bg-white/12 backdrop-blur-md border border-white/20 text-white hover:bg-white/22"
                  )}
                  aria-label="Add to cart"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slide image — memoized ────────────────────────────────────────────────────
const SlideImage = memo(function SlideImage({
  src, title, active, preloaded, priority,
}: {
  src?: string | null;
  title: string;
  active: boolean;
  preloaded: boolean;
  priority: boolean;
}) {
  const [err, setErr] = useState(false);

  if (src && !err) {
    return (
      <>
        {/* Blur placeholder while loading */}
        {!preloaded && (
          <div className="absolute inset-0 shimmer-bg" />
        )}
        <img
          src={getOptimizedImage(src) || ""}
          alt={title}
          onError={() => setErr(true)}
          onLoad={() => { /* image painted */ }}
          draggable={false}
          fetchPriority={priority ? "high" : "low"}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: active ? 1 : 0,
            transition: "opacity 500ms cubic-bezier(0.16,1,0.3,1)",
            willChange: "opacity",
          }}
        />
      </>
    );
  }

  // Branded fallback — never shows a broken image
  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"
      style={{
        opacity: active ? 1 : 0,
        transition: "opacity 500ms cubic-bezier(0.16,1,0.3,1)",
      }}
    />
  );
});
