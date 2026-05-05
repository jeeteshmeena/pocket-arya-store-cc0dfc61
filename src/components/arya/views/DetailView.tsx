import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function DetailView({ storyId }: { storyId: string }) {
  const { back, addToCart, startCheckout, cart, theme, stories } = useApp();
  const story = stories.find((s) => s.id === storyId);
  const [expanded, setExpanded] = useState(false);

  if (!story) {
    return (
      <div className="animate-fade-in px-6 pt-24 text-center">
        <p className="text-sm text-muted-foreground">Story not found.</p>
        <button onClick={back} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          Go back
        </button>
      </div>
    );
  }

  const inCart = cart.some((x) => x.id === story.id);

  return (
    <div className="animate-fade-in pb-28">
      <div className={cn("relative", theme === "pfm" ? "h-72" : "h-64")}>
        <img src={story.banner} alt={story.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
        <button onClick={back} className="absolute top-3 left-3 h-9 w-9 grid place-items-center rounded-full bg-background/70 backdrop-blur">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-3 items-end">
          <img src={story.poster} alt="" className="h-28 w-20 rounded-xl object-cover shadow-xl" />
          <div className="flex-1 min-w-0">
            <h1 className={cn("font-display font-bold leading-tight", theme === "pfm" ? "text-2xl" : "text-xl")}>{story.title}</h1>
            <div className="text-xs text-muted-foreground mt-1">
              {story.genre} · {story.language} · {story.episodes} episodes
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className={cn("text-sm text-muted-foreground leading-relaxed", !expanded && "line-clamp-3")}>
          {story.description}
        </p>
        <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs text-primary font-semibold flex items-center gap-1">
          {expanded ? "Show less" : "Read more"} <ChevronDown className={cn("h-3 w-3 transition", expanded && "rotate-180")} />
        </button>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Meta label="Platform" value={story.platform} />
          <Meta label="Episodes" value={String(story.episodes)} />
          <Meta label="Size" value={story.size ?? "—"} />
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[11px] text-muted-foreground">Price</div>
            <div className="font-display font-bold text-lg">₹{story.price}</div>
          </div>
          <button
            onClick={() => !inCart && addToCart(story)}
            className="h-11 px-4 rounded-full bg-transparent border border-border text-foreground text-sm font-semibold active:scale-95 transition"
          >
            {inCart ? "In Cart" : "Add to Cart"}
          </button>
          <button
            onClick={() => startCheckout([story])}
            className="h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}
