import type { Story } from "@/lib/data";
import { useApp } from "@/store/app-store";
import { Check, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState, useLayoutEffect } from "react";
import { flyToCart } from "@/lib/fly-to-cart";
import { haptics } from "@/lib/haptics";
import { StatusBadge } from "./StatusBadge";

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
  const key = Object.keys(GENRE_COLORS).find((k) => (genre || "").toLowerCase().includes(k.toLowerCase()));
  return { bg: key ? GENRE_COLORS[key] : "#F3F4F6", text: key ? GENRE_TEXT[key] : "#374151" };
}

// ── Instagram-style Heart ────────────────────────────────────────────────
function HeartBtn({ liked, onToggle }: { liked: boolean; onToggle: (e: React.MouseEvent) => void }) {
  const [burst, setBurst] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    onToggle(e);
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={liked ? "Unlike" : "Like"}
      className="absolute top-2 left-2 h-8 w-8 grid place-items-center z-10 active:scale-90 transition-transform"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Burst circles (Instagram-style) */}
      {burst && (
        <span className="absolute inset-0 rounded-full animate-ping bg-rose-400/40 pointer-events-none" />
      )}
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "h-5 w-5 transition-all duration-200 drop-shadow-sm",
          liked ? "scale-110" : "scale-100"
        )}
        style={{
          filter: liked ? "drop-shadow(0 0 4px rgba(244,63,94,0.6))" : undefined,
        }}
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={liked ? "#f43f5e" : "none"}
          stroke={liked ? "#f43f5e" : "white"}
          strokeWidth={liked ? 0 : 2}
          className={cn(
            "transition-all duration-300",
            burst && "animate-heart-pop"
          )}
        />
      </svg>
    </button>
  );
}

// ── Add-to-cart button with hover tooltip ───────────────────────────────
function CartBtn({
  inCart, onAdd, theme,
}: {
  inCart: boolean;
  onAdd: (e: React.MouseEvent) => void;
  theme: string;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => { if (!inCart) setHover(true); }}
      onTouchEnd={() => setTimeout(() => setHover(false), 800)}
    >
      {/* "Add to Cart" label — fades in on hover/touch */}
      <span
        className={cn(
          "text-[10px] font-semibold text-white/70 pointer-events-none select-none transition-all duration-200 whitespace-nowrap",
          hover && !inCart ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
        )}
      >
        Add to Cart
      </span>

      <button
        onClick={onAdd}
        disabled={inCart}
        className={cn(
          "h-[30px] w-[30px] rounded-lg grid place-items-center shadow-md transition-all duration-200 active:scale-[0.85]",
          inCart
            ? "bg-emerald-500/90 text-white cursor-default"
            : theme === "teal"
              ? "bg-primary text-primary-foreground hover:scale-110"
              : "bg-foreground/90 text-background hover:scale-110 backdrop-blur-sm"
        )}
        aria-label={inCart ? "In cart" : "Add to cart"}
      >
        {inCart
          ? <Check className="h-3.5 w-3.5" />
          : <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        }
      </button>
    </div>
  );
}

export function StoryCard({ story, wide, square }: { story: Story; wide?: boolean; square?: boolean }) {
  const { addToCart, cart, navigate, theme, toggleWishlist, inWishlist } = useApp();
  const liked = inWishlist(story.id);
  const inCart = cart.some((x) => x.id === story.id);
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const poster = story.poster;
  const hasImage = isDisplayableUrl(poster) && !imgError;
  const { bg, text } = getGenre(story.genre);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart) return;
    haptics.light();
    if (imgRef.current) flyToCart(imgRef.current);
    setTimeout(() => addToCart(story), 200);
  };

  const startPress = () => {
    longPressed.current = false;
    timerRef.current = setTimeout(() => {
      haptics.medium();
      longPressed.current = true;
      if (cardRef.current) setAnchor(cardRef.current.getBoundingClientRect());
      setShowPreview(true);
    }, 380);
  };
  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "shrink-0 cursor-pointer transition-transform duration-200 active:scale-[0.97] select-none",
          square ? "w-full" : wide ? "w-44" : "w-40"
        )}
        style={{ WebkitTouchCallout: "none" }}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onClick={() => {
          if (longPressed.current) return;
          navigate({ name: "detail", storyId: story.id });
        }}
      >
        {/* Image container — less rounded (rounded-xl instead of rounded-2xl) */}
        <div className={cn(
          "relative overflow-hidden bg-muted",
          theme === "cream"
            ? "neo-card"
            : theme === "teal"
              ? "rounded-xl ring-1 ring-white/8 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.6)]"
              : "rounded-xl shadow-[0_4px_16px_-8px_rgba(0,0,0,0.5)]",
          square ? "aspect-square" : wide ? "aspect-[4/5]" : "aspect-square"
        )}>
          {hasImage ? (
            <img
              ref={imgRef}
              src={poster!}
              alt={story.title}
              className="h-full w-full object-cover pointer-events-none"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="h-full w-full flex flex-col items-center justify-center p-3 gap-2 pointer-events-none"
              style={{ backgroundColor: bg }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: text }}>
                {story.genre}
              </span>
              <span className="text-xs font-semibold text-center leading-tight line-clamp-4" style={{ color: text }}>
                {story.title}
              </span>
            </div>
          )}

          {/* subtle premium shimmer on top */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

          {/* Instagram-style heart */}
          <HeartBtn
            liked={liked}
            onToggle={(e) => {
              e.stopPropagation();
              haptics.light();
              toggleWishlist(story);
            }}
          />

          {/* Add-to-cart with hover tooltip */}
          <CartBtn inCart={inCart} onAdd={handleAdd} theme={theme} />
        </div>

        <div className="mt-1.5 px-0.5">
          <div className="text-[13px] font-semibold truncate text-foreground leading-tight">{story.title}</div>
          <div className="text-[12px] font-bold mt-0.5 text-foreground/80">₹{story.price}</div>
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
}

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
    const PAD = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(310, vw - PAD * 2);
    const h = popRef.current.offsetHeight || 370;

    let left = anchor.left + anchor.width / 2 - w / 2;
    left = Math.max(PAD, Math.min(left, vw - w - PAD));

    const spaceBelow = vh - anchor.bottom - PAD;
    const spaceAbove = anchor.top - PAD;
    let top: number;
    let originY: string;
    if (spaceBelow >= h + 8 || spaceBelow >= spaceAbove) {
      top = Math.min(anchor.bottom + 8, vh - h - PAD);
      originY = "top";
    } else {
      top = Math.max(PAD, anchor.top - h - 8);
      originY = "bottom";
    }
    const anchorCenterX = anchor.left + anchor.width / 2;
    const originX = `${Math.max(0, Math.min(w, anchorCenterX - left))}px`;
    setPos({ left, top, origin: `${originX} ${originY}` });
  }, [anchor]);

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => e.preventDefault()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px] animate-fade-in" />
      <div
        ref={popRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute overflow-hidden animate-popup-enter",
          theme === "cream"
            ? "w-[310px] max-w-[calc(100vw-24px)] rounded-2xl bg-white border-4 border-black shadow-[6px_6px_0px_#000]"
            : "w-[310px] max-w-[calc(100vw-24px)] rounded-2xl bg-surface border border-border shadow-[0_28px_64px_-16px_rgba(0,0,0,0.5)]"
        )}
        style={pos ? { left: pos.left, top: pos.top, transformOrigin: pos.origin } : { visibility: "hidden" }}
      >
        <div className="aspect-[4/3] w-full bg-muted relative">
          {hasImage ? (
            <img src={story.poster!} alt={story.title} className="h-full w-full object-cover pointer-events-none" />
          ) : (
            <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: bg }}>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: text }}>{story.genre}</span>
            </div>
          )}
          {typeof story.isCompleted === "boolean" && (
            <div className="absolute top-3 left-3">
              <StatusBadge isCompleted={!!story.isCompleted} expanded size="md" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
        </div>

        <div className="p-4">
          <h3 className={cn("text-[16px] font-bold leading-tight line-clamp-2 text-foreground", theme === "cream" && "font-display")}>
            {story.title}
          </h3>
          {story.description && (
            <p className="mt-1.5 text-[12px] text-muted-foreground line-clamp-2 leading-snug">
              {story.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-foreground">{story.genre}</span>
            {story.language && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-foreground uppercase tracking-wider">{story.language}</span>
            )}
            {story.episodes && story.episodes !== "?" && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-foreground">{story.episodes} eps</span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Price</div>
              <div className="text-lg font-display font-extrabold text-foreground">₹{story.price}</div>
            </div>
            <button
              onClick={onAdd}
              disabled={inCart}
              className={cn(
                "h-9 px-3 rounded-lg text-[12px] font-bold inline-flex items-center gap-1.5 active:scale-95 transition",
                inCart ? "bg-muted text-muted-foreground" : "bg-surface border border-border text-foreground hover:bg-muted"
              )}
            >
              {inCart ? <><Check className="h-3.5 w-3.5" /> In Cart</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add</>}
            </button>
            <button
              onClick={onOpen}
              className={cn(
                "h-9 px-4 rounded-lg text-[12px] font-bold active:scale-95 transition",
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
