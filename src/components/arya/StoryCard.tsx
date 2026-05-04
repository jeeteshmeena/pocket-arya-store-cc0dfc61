import type { Story } from "@/lib/data";
import { useApp } from "@/store/app-store";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StoryCard({ story, wide }: { story: Story; wide?: boolean }) {
  const { addToCart, cart, navigate, theme } = useApp();
  const inCart = cart.some((x) => x.id === story.id);

  return (
    <div
      className={cn(
        "shrink-0 group cursor-pointer transition-transform duration-200 hover:-translate-y-0.5",
        wide ? "w-44 pfm:w-48" : "w-36 pfm:w-40"
      )}
      onClick={() => navigate({ name: "detail", storyId: story.id })}
    >
      <div className={cn(
        "relative overflow-hidden bg-surface shadow-md aspect-[3/4]",
        theme === "pfm" ? "rounded-2xl" : "rounded-xl"
      )}>
        <img
          src={story.poster}
          alt={story.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <button
          onClick={(e) => { e.stopPropagation(); if (!inCart) addToCart(story); }}
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg active:scale-95 transition"
          aria-label="Add to cart"
        >
          {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-2 px-0.5">
        <div className={cn("font-semibold truncate", theme === "pfm" ? "text-sm" : "text-[13px]")}>{story.title}</div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
          <span>{story.episodes} eps</span>
          <span className="font-semibold text-foreground">₹{story.price}</span>
        </div>
      </div>
    </div>
  );
}
