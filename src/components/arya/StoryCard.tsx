import type { Story } from "@/lib/data";
import { useApp } from "@/store/app-store";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { flyToCart } from "@/lib/fly-to-cart";
import { haptics } from "@/lib/haptics";

function isDisplayableUrl(src?: string | null): boolean {
  return !!src && (
    src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/api/image/")
  );
}

const GENRE_COLORS: Record<string, string> = {
  "Romance":  "#FEE2E2",
  "Horror":   "#EDE9FE",
  "Thriller": "#DBEAFE",
  "Fantasy":  "#F3E8FF",
  "Drama":    "#FEF3C7",
  "Action":   "#DBEAFE",
  "Mystery":  "#CCFBF1",
  "Comedy":   "#FEF9C3",
};
const GENRE_TEXT: Record<string, string> = {
  "Romance":  "#991B1B",
  "Horror":   "#5B21B6",
  "Thriller": "#1E40AF",
  "Fantasy":  "#6B21A8",
  "Drama":    "#92400E",
  "Action":   "#1E40AF",
  "Mystery":  "#134E4A",
  "Comedy":   "#713F12",
};

function getGenre(genre?: string) {
  const key = Object.keys(GENRE_COLORS).find(k => (genre || "").toLowerCase().includes(k.toLowerCase()));
  return { bg: key ? GENRE_COLORS[key] : "#F3F4F6", text: key ? GENRE_TEXT[key] : "#374151" };
}

export function StoryCard({ story, wide }: { story: Story; wide?: boolean }) {
  console.log("Story status:", story);
  const { addToCart, cart, navigate } = useApp();
  const inCart = cart.some((x) => x.id === story.id);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgError, setImgError] = useState(false);

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

  return (
    <div
      className={cn(
        "shrink-0 cursor-pointer transition-transform duration-200 active:scale-[0.98]",
        wide ? "w-full" : "w-40"
      )}
      onClick={() => navigate({ name: "detail", storyId: story.id })}
    >
      {/* Poster */}
      <div className={cn(
        "relative overflow-hidden bg-muted",
        useApp().theme === "cream" ? "neo-card aspect-square" : "aspect-square shadow-sm"
      )}>
        {hasImage ? (
          <img
            ref={imgRef}
            src={poster!}
            alt={story.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Soft pastel genre fallback */
          <div
            className="h-full w-full flex flex-col items-center justify-center p-3 gap-2"
            style={{ backgroundColor: bg }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: text }}
            >
              {story.genre}
            </span>
            <span
              className="text-xs font-semibold text-center leading-tight line-clamp-4"
              style={{ color: text }}
            >
              {story.title}
            </span>
          </div>
        )}

        {/* Top-left status badge */}
        {typeof story.isCompleted === "boolean" && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background/90 backdrop-blur-sm shadow-sm border border-border/50">
            <span className={cn("h-1.5 w-1.5 rounded-full", story.isCompleted ? "bg-emerald-500" : "bg-orange-500")} />
            <span className={cn("text-[9px] font-bold uppercase tracking-wider", story.isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400")}>
              {story.isCompleted ? "Completed" : "Ongoing"}
            </span>
          </div>
        )}

        {/* Add to cart button — black circle, bottom-right */}
        <button
          onClick={handleAdd}
          className={cn(
            "absolute bottom-2 right-2 h-[34px] w-[34px] rounded-full grid place-items-center shadow-md transition-all active:scale-[0.85]",
            inCart
              ? "bg-foreground text-background"
              : "bg-foreground text-background hover:scale-105"
          )}
          aria-label={inCart ? "In cart" : "Add to cart"}
        >
          {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {/* Info */}
      <div className="mt-2 px-1">
        <div className="text-[14px] font-semibold truncate text-foreground leading-tight">
          {story.title}
        </div>
        <div className="text-[13px] font-bold mt-1 text-foreground">₹{story.price}</div>
      </div>
    </div>
  );
}
