/**
 * StoryCard — Premium memoized card
 * Features: Instagram heart burst, hover cart tooltip, magnetic desktop hover,
 *           tactile press, layered shadows, intersection-observer lazy images
 */
import { memo, useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Story } from "@/lib/data";
import { useApp } from "@/store/app-store";
import { Check, ShoppingCart, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { flyToCart } from "@/lib/fly-to-cart";
import { haptics } from "@/lib/haptics";
import { StatusBadge } from "./StatusBadge";
import { trackEvent, getOptimizedImage } from "@/lib/api";
import { usePriceFormat } from "@/hooks/usePriceFormat";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isDisplayableUrl(src?: string | null): boolean {
  return !!src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/api/image"));
}

const GENRE_COLORS: Record<string, string> = {
  Romance: "#FEE2E2", Horror: "#EDE9FE", Thriller: "#DBEAFE", Fantasy: "#F3E8FF",
  Drama: "#FEF3C7", Action: "#DBEAFE", Mystery: "#CCFBF1", Comedy: "#FEF9C3",
};
const GENRE_TEXT: Record<string, string> = {
  Romance: "#991B1B", Horror: "#5B21B6", Thriller: "#1E40AF", Fantasy: "#6B21A8",
  Drama: "#92400E", Action: "#1E40AF", Mystery: "#134E4A", Comedy: "#713F12",
};
function getGenre(genre?: string) {
  const key = Object.keys(GENRE_COLORS).find(
    k => (genre || "").toLowerCase().includes(k.toLowerCase())
  );
  return {
    bg:   key ? GENRE_COLORS[key] : "#F3F4F6",
    text: key ? GENRE_TEXT[key]   : "#374151",
  };
}

// ─── Instagram-style Heart ────────────────────────────────────────────────────
const HeartBtn = memo(function HeartBtn({
  liked, onToggle,
}: {
  liked: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  const [burst, setBurst] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    onToggle(e);
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 650);
    }
  }, [liked, onToggle]);

  return (
    <button
      onClick={handleClick}
      aria-label={liked ? "Unlike" : "Like"}
      className="absolute top-2 left-2 z-10 h-8 w-8 grid place-items-center"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Burst ring */}
      {burst && (
        <span
          className="absolute inset-[-4px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(244,63,94,0.35) 0%, transparent 70%)",
            animation: "heart-burst 0.55s ease-out both",
          }}
        />
      )}
      {/* Ping ring */}
      {burst && (
        <span className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping pointer-events-none" />
      )}
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] drop-shadow-sm"
        style={{
          transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1), filter 200ms ease",
          transform: liked ? "scale(1.15)" : "scale(1)",
          filter: liked ? "drop-shadow(0 0 5px rgba(244,63,94,0.7))" : "none",
          willChange: "transform",
        }}
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={liked ? "#f43f5e" : "none"}
          stroke={liked ? "#f43f5e" : "rgba(255,255,255,0.9)"}
          strokeWidth={liked ? 0 : 2}
          style={{ transition: "all 300ms ease" }}
        />
      </svg>
    </button>
  );
});

// ─── Cart button with hover tooltip ───────────────────────────────────────────
const CartBtn = memo(function CartBtn({
  inCart, onAdd, theme,
}: {
  inCart: boolean;
  onAdd: (e: React.MouseEvent) => void;
  theme: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="absolute bottom-2 right-2 z-10 flex items-center gap-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => { if (!inCart) setShow(true); }}
      onTouchEnd={() => setTimeout(() => setShow(false), 900)}
    >
      {/* Tooltip label — fade+slide only when shown */}
      <span
        className="text-[9px] font-semibold text-white/65 pointer-events-none select-none whitespace-nowrap"
        style={{
          opacity: show && !inCart ? 1 : 0,
          transform: show && !inCart ? "translateX(0)" : "translateX(4px)",
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
      >
        Add to Cart
      </span>

      <button
        onClick={onAdd}
        disabled={inCart}
        className={cn(
          "h-[28px] w-[28px] rounded-lg grid place-items-center shadow-md",
          "transition-transform duration-75 active:scale-[0.85]",
          inCart
            ? "bg-emerald-500 text-white cursor-default"
            : theme === "teal"
              ? "bg-primary text-primary-foreground hover:scale-110"
              : "bg-foreground/88 text-background hover:scale-110"
        )}
        aria-label={inCart ? "In cart" : "Add to cart"}
        style={{ willChange: "transform" }}
      >
        {inCart ? (
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
        )}
      </button>
    </div>
  );
});

// ─── Lazy image with shimmer + IntersectionObserver gating ──────────────────
// Only fetches the image once it (or its container) is within ~400px of the
// viewport. Prevents dozens of poster requests firing at app startup, which
// causes the "5–10 minute" perceived load on slower connections.
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { rootMargin: "400px 200px", threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);

  return (
    <div ref={wrapRef} className={cn("relative h-full w-full", className)}>
      {!loaded && <div className="absolute inset-0 shimmer-bg" />}
      {inView && !err && (
        <img
          src={getOptimizedImage(src)}
          alt={alt}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={() => setLoaded(true)}
          onError={() => { setErr(true); setLoaded(true); }}
          className="h-full w-full object-cover pointer-events-none"
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        />
      )}
    </div>
  );
}

// ─── Main StoryCard ────────────────────────────────────────────────────────────
export const StoryCard = memo(function StoryCard({
  story, wide, square, enablePreview,
}: {
  story: Story;
  wide?: boolean;
  square?: boolean;
  enablePreview?: boolean;
}) {
  const { addToCart, cart, navigate, theme, toggleWishlist, inWishlist, tgUser, goToCheckout, appPreferences } = useApp();
  const fmt = usePriceFormat();

  const liked   = inWishlist(story.id);
  const inCart  = cart.some(x => x.id === story.id);
  const imgRef  = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const poster   = story.poster;
  const hasImage = isDisplayableUrl(poster) && !imgError;
  const { bg, text } = getGenre(story.genre);

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart) return;
    haptics.light();
    if (imgRef.current) flyToCart(imgRef.current);
    setTimeout(() => addToCart(story), 180);
  }, [inCart, addToCart, story]);

  const handleHeart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    toggleWishlist(story);
  }, [toggleWishlist, story]);

  const startPress = useCallback(() => {
    if (!enablePreview) return;
    longPressed.current = false;
    timerRef.current = setTimeout(() => {
      haptics.medium();
      longPressed.current = true;
      if (cardRef.current) setAnchor(cardRef.current.getBoundingClientRect());
      setShowPreview(true);
    }, 380);
  }, [enablePreview]);

  const cancelPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "shrink-0 cursor-pointer select-none card-magnetic",
          square ? "w-full" : wide ? "w-44" : "w-40"
        )}
        style={{ WebkitTouchCallout: "none" }}
        onContextMenu={enablePreview ? (e => e.preventDefault()) : undefined}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onClick={() => {
          if (longPressed.current) return;
          // Track engagement for live trending
          trackEvent(story.id, "open", tgUser?.telegram_id);
          navigate({ name: "detail", storyId: story.id });
        }}
      >
        {/* ── Image container ── */}
        <div
          ref={imgRef}
          className={cn(
            "relative overflow-hidden bg-muted",
            theme === "cream" ? "neo-card"
            : theme === "teal"
              ? "rounded-[14px] ring-1 ring-white/6 shadow-[0_8px_28px_-10px_rgba(0,0,0,0.65)]"
              : "rounded-[14px] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.45)]",
            square ? "aspect-square" : wide ? "aspect-[4/5]" : "aspect-square"
          )}
          style={{ willChange: "transform" }}
        >
          {hasImage ? (
            <LazyImage src={poster!} alt={story.title} />
          ) : (
            <div
              className="h-full w-full flex flex-col items-center justify-center p-3 gap-2 pointer-events-none"
              style={{ backgroundColor: bg }}
              onError={() => setImgError(true)}
            >
              <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: text }}>
                {story.genre}
              </span>
              <span className="text-[11px] font-semibold text-center leading-tight line-clamp-4" style={{ color: text }}>
                {story.title}
              </span>
            </div>
          )}

          {/* Premium highlight overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-inherit"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)",
            }}
          />

          {/* Bottom gradient for readability */}
          <div
            className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
            style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.25) 0%, transparent 100%)" }}
          />

          <HeartBtn liked={liked} onToggle={handleHeart} />
          <CartBtn inCart={inCart} onAdd={handleAdd} theme={theme} />
        </div>

        {/* ── Label ── */}
        <div className="mt-1.5 px-0.5">
          <div className="text-[12.5px] font-semibold truncate text-foreground leading-tight">
            {story.title}
          </div>
          {appPreferences?.showPrices !== false && (
            <div className="text-[11.5px] font-bold mt-0.5 text-foreground/75">
              {fmt(story.price)}
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <PreviewPopup
          story={story}
          anchor={anchor}
          inCart={inCart}
          onClose={() => setShowPreview(false)}
          onAdd={() => {
            if (inCart) return;
            haptics.light();
            addToCart(story);
            setShowPreview(false);
          }}
          onBuyNow={() => {
            haptics.medium();
            if (!inCart) addToCart(story);
            setShowPreview(false);
            setTimeout(() => goToCheckout(), 60);
          }}
          onOpen={() => {
            setShowPreview(false);
            navigate({ name: "detail", storyId: story.id });
          }}
        />
      )}
    </>
  );
});

// ─── Preview Popup (anchored at card center, smooth scale-in) ──────────────────
function PreviewPopup({
  story, anchor, inCart, onClose, onAdd, onBuyNow, onOpen,
}: {
  story: Story;
  anchor: DOMRect | null; // Kept for prop signature compat but unused for positioning
  inCart: boolean;
  onClose: () => void;
  onAdd: () => void;
  onBuyNow: () => void;
  onOpen: () => void;
}) {
  const { theme, appPreferences } = useApp();
  const fmt = usePriceFormat();
  const { bg, text } = getGenre(story.genre);
  const hasImage = isDisplayableUrl(story.poster);

  // Prevent body scroll when mounted
  useLayoutEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      onContextMenu={e => e.preventDefault()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
        style={{ animation: "info-backdrop-in 0.22s ease both" }}
      />
      <div
        onClick={e => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-[320px] max-h-[85vh] overflow-y-auto scrollbar-hide",
          theme === "cream"
            ? "rounded-[22px] bg-white border-[3px] border-black shadow-[5px_5px_0px_#000]"
            : "rounded-[22px] bg-card text-card-foreground border border-border/60 shadow-[0_30px_80px_-12px_rgba(0,0,0,0.6)]"
        )}
        style={{
          animation: "preview-pop 0.32s cubic-bezier(0.16,1,0.3,1) both",
          transformOrigin: "center center",
        }}
      >
        {/* Poster */}
        <div className="aspect-[16/10] w-full bg-muted relative shrink-0">
          {hasImage ? (
            <LazyImage src={story.poster!} alt={story.title} />
          ) : (
            <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: bg }}>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: text }}>
                {story.genre}
              </span>
            </div>
          )}
          {typeof story.isCompleted === "boolean" && (
            <div className="absolute top-3 left-3">
              <StatusBadge isCompleted={!!story.isCompleted} expanded size="md" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
          {appPreferences?.showPrices !== false && (
            <div className="absolute bottom-2 right-3 text-white text-[11px] font-bold drop-shadow">
              {fmt(story.price)}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 shrink-0">
          <h3 className={cn(
            "text-[15px] font-bold leading-tight line-clamp-2 text-foreground",
            theme === "cream" && "font-display"
          )}>
            {story.title}
          </h3>
          {story.description && (
            <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2 leading-snug">
              {story.description}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">{story.genre}</span>
            {story.language && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground uppercase tracking-wide">{story.language}</span>
            )}
            {story.episodes && story.episodes !== "?" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">{story.episodes} eps</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <button
              onClick={onAdd}
              disabled={inCart}
              className={cn(
                "h-11 rounded-[12px] text-[12px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] transition",
                inCart
                  ? "bg-muted text-muted-foreground"
                  : "bg-surface border border-border text-foreground hover:bg-muted"
              )}
            >
              {inCart ? <><Check className="h-4 w-4" /> In Cart</> : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>}
            </button>
            <button
              onClick={onBuyNow}
              className={cn(
                "h-11 rounded-[12px] text-[12px] font-extrabold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] transition shadow-[0_8px_22px_-6px_rgba(0,0,0,0.45)]",
                theme === "cream"
                  ? "neo-button bg-primary text-primary-foreground"
                  : "bg-foreground text-background"
              )}
            >
              <Zap className="h-4 w-4" strokeWidth={2.5} /> Buy Now
            </button>
          </div>

          {/* View details link */}
          <button
            onClick={onOpen}
            className="mt-2 w-full h-9 rounded-[10px] inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
          >
            View story details <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
