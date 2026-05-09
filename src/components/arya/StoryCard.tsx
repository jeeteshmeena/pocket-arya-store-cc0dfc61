/**
 * StoryCard — Premium memoized card
 * Features: Instagram heart burst, hover cart tooltip, magnetic desktop hover,
 *           tactile press, layered shadows, intersection-observer lazy images
 */
import { memo, useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
import type { Story } from "@/lib/data";
import { useApp } from "@/store/app-store";
import { Check, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { flyToCart } from "@/lib/fly-to-cart";
import { haptics } from "@/lib/haptics";
import { StatusBadge } from "./StatusBadge";
import { trackEvent } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isDisplayableUrl(src?: string | null): boolean {
  return !!src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/api/image/"));
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

// ─── Lazy image with shimmer ───────────────────────────────────────────────────
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {!loaded && <div className="absolute inset-0 shimmer-bg" />}
      {!err && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
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
  story, wide, square,
}: {
  story: Story;
  wide?: boolean;
  square?: boolean;
}) {
  const { addToCart, cart, navigate, theme, toggleWishlist, inWishlist, tgUser } = useApp();

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
    longPressed.current = false;
    timerRef.current = setTimeout(() => {
      haptics.medium();
      longPressed.current = true;
      if (cardRef.current) setAnchor(cardRef.current.getBoundingClientRect());
      setShowPreview(true);
    }, 380);
  }, []);

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
        onContextMenu={e => e.preventDefault()}
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
          <div className="text-[11.5px] font-bold mt-0.5 text-foreground/75">
            ₹{story.price}
          </div>
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
          onOpen={() => {
            setShowPreview(false);
            navigate({ name: "detail", storyId: story.id });
          }}
        />
      )}
    </>
  );
});

// ─── Preview Popup ─────────────────────────────────────────────────────────────
function PreviewPopup({
  story, anchor, inCart, onClose, onAdd, onOpen,
}: {
  story: Story;
  anchor: DOMRect | null;
  inCart: boolean;
  onClose: () => void;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; origin: string } | null>(null);
  const { theme } = useApp();
  const { bg, text } = getGenre(story.genre);
  const hasImage = isDisplayableUrl(story.poster);

  useLayoutEffect(() => {
    if (!anchor || !popRef.current) return;
    const PAD = 12, vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(305, vw - PAD * 2);
    const h = popRef.current.offsetHeight || 360;

    let left = anchor.left + anchor.width / 2 - w / 2;
    left = Math.max(PAD, Math.min(left, vw - w - PAD));

    const spaceBelow = vh - anchor.bottom - PAD;
    const spaceAbove = anchor.top - PAD;
    let top: number, originY: string;
    if (spaceBelow >= h + 8 || spaceBelow >= spaceAbove) {
      top = Math.min(anchor.bottom + 8, vh - h - PAD);
      originY = "top";
    } else {
      top = Math.max(PAD, anchor.top - h - 8);
      originY = "bottom";
    }
    const cx = anchor.left + anchor.width / 2;
    setPos({ left, top, origin: `${Math.max(0, Math.min(w, cx - left))}px ${originY}` });
  }, [anchor]);

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={e => e.preventDefault()}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[7px] animate-fade-in-fast" />
      <div
        ref={popRef}
        onClick={e => e.stopPropagation()}
        className={cn(
          "absolute w-[305px] max-w-[calc(100vw-24px)] overflow-hidden animate-popup-enter",
          theme === "cream"
            ? "rounded-[20px] bg-white border-[3px] border-black shadow-[5px_5px_0px_#000]"
            : "rounded-[20px] bg-surface border border-border shadow-[0_28px_72px_-16px_rgba(0,0,0,0.55)]"
        )}
        style={pos ? { left: pos.left, top: pos.top, transformOrigin: pos.origin } : { visibility: "hidden" }}
      >
        <div className="aspect-[4/3] w-full bg-muted relative">
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
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="p-4">
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
          <div className="mt-3.5 flex items-center gap-2">
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Price</div>
              <div className="text-[17px] font-display font-extrabold text-foreground">₹{story.price}</div>
            </div>
            <button
              onClick={onAdd}
              disabled={inCart}
              className={cn(
                "h-9 px-3 rounded-[10px] text-[11px] font-bold inline-flex items-center gap-1.5 active:scale-95 transition-transform duration-75",
                inCart ? "bg-muted text-muted-foreground" : "bg-surface border border-border text-foreground hover:bg-muted"
              )}
            >
              {inCart ? <><Check className="h-3.5 w-3.5" /> In Cart</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add</>}
            </button>
            <button
              onClick={onOpen}
              className={cn(
                "h-9 px-4 rounded-[10px] text-[11px] font-bold active:scale-95 transition-transform duration-75",
                theme === "cream" ? "neo-button bg-primary text-primary-foreground" : "bg-primary text-primary-foreground shadow-md"
              )}
            >
              Open →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
