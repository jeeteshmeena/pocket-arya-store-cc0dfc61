import type { Story } from "@/lib/data";
import { useApp } from "@/store/app-store";
import { Plus, Check, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
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

export function StoryCard({ story, wide }: { story: Story; wide?: boolean }) {
  const { addToCart, cart, navigate, theme } = useApp();
  const inCart = cart.some((x) => x.id === story.id);
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
          "shrink-0 cursor-pointer transition-transform duration-200 active:scale-[0.98] select-none",
          wide ? "w-full" : "w-40"
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
        <div className={cn(
          "relative overflow-hidden bg-muted",
          theme === "cream" ? "neo-card aspect-square" : "aspect-square shadow-sm rounded-2xl"
        )}>
          {hasImage ? (
            <img ref={imgRef} src={poster!} alt={story.title}
              className="h-full w-full object-cover pointer-events-none"
              loading="lazy" onError={() => setImgError(true)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-3 gap-2 pointer-events-none" style={{ backgroundColor: bg }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: text }}>{story.genre}</span>
              <span className="text-xs font-semibold text-center leading-tight line-clamp-4" style={{ color: text }}>{story.title}</span>
            </div>
          )}

          {typeof story.isCompleted === "boolean" && (
            <div className="absolute top-2 left-2 z-10">
              <StatusBadge isCompleted={!!story.isCompleted} />
            </div>
          )}

          <button
            onClick={handleAdd}
            className={cn(
              "absolute bottom-2 right-2 h-[34px] w-[34px] rounded-full grid place-items-center shadow-md transition-all active:scale-[0.85]",
              "bg-foreground text-background hover:scale-105"
            )}
            aria-label={inCart ? "In cart" : "Add to cart"}
          >
            {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-[18px] w-[18px]" />}
          </button>
        </div>

        <div className="mt-2 px-1">
          <div className="text-[14px] font-semibold truncate text-foreground leading-tight">{story.title}</div>
          <div className="text-[13px] font-bold mt-1 text-foreground">₹{story.price}</div>
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
    const w = Math.min(320, vw - PAD * 2);
    const h = popRef.current.offsetHeight || 380;

    // Center horizontally on anchor, then clamp
    let left = anchor.left + anchor.width / 2 - w / 2;
    left = Math.max(PAD, Math.min(left, vw - w - PAD));

    // Prefer below the card; if no room, place above
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
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[6px] animate-fade-in" />
      <div
        ref={popRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute w-[320px] max-w-[calc(100vw-24px)] overflow-hidden animate-popup-enter",
          theme === "cream"
            ? "rounded-3xl bg-white border-4 border-black shadow-[8px_8px_0px_#000]"
            : "rounded-3xl bg-surface border border-border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]"
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
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="p-4">
          <h3 className={cn("text-[17px] font-bold leading-tight line-clamp-2 text-foreground", theme === "cream" && "font-display")}>
            {story.title}
          </h3>
          {story.description && (
            <p className="mt-1.5 text-[12.5px] text-muted-foreground line-clamp-2 leading-snug">
              {story.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">{story.genre}</span>
            {story.language && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground uppercase tracking-wider">{story.language}</span>
            )}
            {story.episodes && story.episodes !== "?" && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">{story.episodes} eps</span>
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
                "h-10 px-3 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 active:scale-95 transition",
                inCart ? "bg-muted text-muted-foreground" : "bg-surface border border-border text-foreground hover:bg-muted"
              )}
            >
              {inCart ? <><Check className="h-3.5 w-3.5" /> In Cart</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add</>}
            </button>
            <button
              onClick={onOpen}
              className={cn(
                "h-10 px-4 rounded-full text-[12px] font-bold active:scale-95 transition",
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
