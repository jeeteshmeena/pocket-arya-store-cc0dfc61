import type { Story } from "@/lib/data";
import { useApp } from "@/store/app-store";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { flyToCart } from "@/lib/fly-to-cart";

// Genre-based gradient colors for story cards without images
const GENRE_GRADIENTS: Record<string, string> = {
  "Romance":          "from-pink-500 to-rose-600",
  "Thriller":         "from-slate-700 to-zinc-900",
  "Horror":           "from-red-900 to-zinc-950",
  "Fantasy":          "from-violet-600 to-purple-900",
  "Drama":            "from-amber-600 to-orange-700",
  "Action":           "from-blue-600 to-indigo-800",
  "Mystery":          "from-teal-600 to-cyan-800",
  "Comedy":           "from-yellow-400 to-amber-500",
  "default":          "from-emerald-600 to-green-800",
};

function getGradient(genre?: string): string {
  if (!genre) return GENRE_GRADIENTS["default"];
  // partial match — e.g. "Romance/Cheating" matches "Romance"
  const found = Object.keys(GENRE_GRADIENTS).find((k) =>
    k !== "default" && genre.toLowerCase().includes(k.toLowerCase())
  );
  return GENRE_GRADIENTS[found ?? "default"];
}

// Is the src a real HTTP/HTTPS URL? Telegram file_ids are not URLs.
function isValidUrl(src?: string): boolean {
  return !!src && (src.startsWith("http://") || src.startsWith("https://"));
}

export function StoryCard({ story, wide }: { story: Story; wide?: boolean }) {
  const { addToCart, cart, navigate, theme } = useApp();
  const inCart = cart.some((x) => x.id === story.id);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgError, setImgError] = useState(false);

  const hasImage = isValidUrl(story.poster) && !imgError;
  const gradient = getGradient(story.genre);

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
            src={story.poster}
            alt={story.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          // Fallback: genre-coloured gradient with title text
          <div
            ref={imgRef as React.RefObject<HTMLDivElement>}
            className={cn("h-full w-full bg-gradient-to-br flex flex-col items-center justify-end p-3", gradient)}
          >
            <div className="text-white text-[11px] font-semibold text-center leading-tight line-clamp-3 drop-shadow">
              {story.title}
            </div>
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
          <div className="text-[11px] text-muted-foreground mt-0.5">{story.episodes} episodes</div>
        )}
        <div className="text-sm font-bold mt-0.5">₹{story.price}</div>
      </div>
    </div>
  );
}
