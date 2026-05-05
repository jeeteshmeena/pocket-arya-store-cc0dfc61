import type { Story } from "@/lib/data";
import { useApp } from "@/store/app-store";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { flyToCart } from "@/lib/fly-to-cart";

function isDisplayableUrl(src?: string | null): boolean {
  return !!src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/api/image/"));
}

const GENRE_COLORS: Record<string, string> = {
  "Romance":  "#e11d48",
  "Horror":   "#7c3aed",
  "Thriller": "#0369a1",
  "Fantasy":  "#6d28d9",
  "Drama":    "#b45309",
  "Action":   "#1d4ed8",
  "Mystery":  "#0f766e",
  "Comedy":   "#ca8a04",
};

function getGenreColor(genre?: string): string {
  if (!genre) return "#166534";
  const key = Object.keys(GENRE_COLORS).find(k => genre.toLowerCase().includes(k.toLowerCase()));
  return key ? GENRE_COLORS[key] : "#166534";
}

export function StoryCard({ story, wide }: { story: Story; wide?: boolean }) {
  const { addToCart, cart, navigate, theme } = useApp();
  const inCart = cart.some((x) => x.id === story.id);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgError, setImgError] = useState(false);

  const poster = story.poster;
  const hasImage = isDisplayableUrl(poster) && !imgError;
  const color = getGenreColor(story.genre);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart) return;
    if (imgRef.current) flyToCart(imgRef.current);
    setTimeout(() => addToCart(story), 250);
  };

  return (
    <div
      className={cn(
        "shrink-0 group cursor-pointer transition-transform duration-200 active:scale-[0.98]",
        wide ? "w-40 pfm:w-44" : "w-36 pfm:w-40"
      )}
      onClick={() => navigate({ name: "detail", storyId: story.id })}
    >
      <div className={cn(
        "relative overflow-hidden bg-surface shadow-md aspect-[5/6]",
        theme === "pfm" ? "rounded-2xl" : "rounded-xl"
      )}>
        {hasImage ? (
          <img
            ref={imgRef}
            src={poster!}
            alt={story.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Clean gradient fallback based on genre color */
          <div
            style={{ background: `linear-gradient(135deg, ${color}cc 0%, ${color}66 100%)` }}
            className="h-full w-full flex flex-col items-center justify-center p-3"
          >
            <div className="text-white text-xs font-bold text-center leading-tight line-clamp-4 drop-shadow-md">
              {story.title}
            </div>
            <div className="mt-2 text-white/70 text-[10px] text-center">{story.genre}</div>
          </div>
        )}
        <button
          onClick={handleAdd}
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg active:scale-90 transition"
          aria-label="Add to cart"
        >
          {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-2 px-0.5">
        <div className={cn("font-semibold truncate", theme === "pfm" ? "text-sm" : "text-[13px]")}>{story.title}</div>
        {story.episodes && story.episodes !== "?" && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{story.episodes} eps</div>
        )}
        <div className="text-sm font-bold mt-0.5">₹{story.price}</div>
      </div>
    </div>
  );
}
