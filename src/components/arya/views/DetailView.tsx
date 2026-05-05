import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function DetailView({ storyId }: { storyId: string }) {
  const { back, addToCart, goToCheckout, cart, stories } = useApp();
  const story = stories.find((s) => s.id === storyId);
  const [expanded, setExpanded] = useState(false);
  const [bannerErr, setBannerErr] = useState(false);
  const [posterErr, setPosterErr] = useState(false);

  if (!story) {
    return (
      <div className="animate-fade-in px-6 pt-24 text-center">
        <p className="text-sm text-muted-foreground">Story not found.</p>
        <button onClick={back} className="mt-4 h-10 px-5 rounded-full bg-foreground text-background text-sm font-semibold">
          Go back
        </button>
      </div>
    );
  }

  const inCart = cart.some((x) => x.id === story.id);

  const handleBuyNow = () => {
    if (!inCart) addToCart(story);
    goToCheckout();
  };

  // Completed/Ongoing from DB status field
  const isCompleted = story.isCompleted;
  const statusLabel = isCompleted ? "Completed" : "Ongoing";

  // Files count (bot-computed from start_id..end_id range)
  const fileCount = story.fileCount;
  const filesLabel = fileCount != null ? `${fileCount} files` : null;

  return (
    <div className="animate-fade-in pb-28">
      {/* Hero */}
      <div className="relative h-64">
        {story.banner && !bannerErr ? (
          <img
            src={story.banner} alt={story.title}
            onError={() => setBannerErr(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-background" />

        {/* Back */}
        <button
          onClick={back}
          className="absolute top-3 left-3 h-9 w-9 grid place-items-center rounded-full bg-background/80 border border-border backdrop-blur-sm shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>

        {/* Poster + title */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-3 items-end">
          <div className="h-28 w-20 overflow-hidden shrink-0 shadow-md bg-muted border border-border">
            {story.poster && !posterErr ? (
              <img
                src={story.poster} alt=""
                onError={() => setPosterErr(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center p-2">
                <span className="text-[9px] text-muted-foreground font-semibold text-center leading-tight line-clamp-4">
                  {story.title}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-xl leading-tight text-foreground">{story.title}</h1>
            <div className="text-xs text-muted-foreground mt-1">
              {[story.genre, story.language].filter(Boolean).join(" · ")}
            </div>

            {/* Completed / Ongoing — only here in detail */}
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                isCompleted
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-amber-300 bg-amber-50 text-amber-700"
              )}>
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isCompleted ? "bg-emerald-500" : "bg-amber-400"
                )} />
                {statusLabel}
              </span>
              {/* Episodes count — only in detail */}
              {story.episodes && story.episodes !== "?" && (
                <span className="text-[11px] text-muted-foreground">{story.episodes} eps</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 mt-4">
        {story.description && (
          <>
            <p className={cn("text-sm text-muted-foreground leading-relaxed", !expanded && "line-clamp-3")}>
              {story.description}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-semibold text-foreground flex items-center gap-1"
            >
              {expanded ? "Show less" : "Read more"}
              <ChevronDown className={cn("h-3 w-3 transition", expanded && "rotate-180")} />
            </button>
          </>
        )}

        {/* Meta chips — Episodes, Files (replaces Size), Platform */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Meta label="Platform"  value={story.platform} />
          <Meta label="Episodes"  value={String(story.episodes ?? "—")} />
          <Meta label="Files"     value={filesLabel ?? (story.size ?? "—")} />
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Price</div>
            <div className="font-display font-bold text-lg text-foreground">₹{story.price}</div>
          </div>
          <button
            onClick={() => !inCart && addToCart(story)}
            className={cn(
              "h-11 px-4 rounded-full border text-sm font-semibold transition active:scale-95",
              inCart
                ? "border-foreground bg-foreground/5 text-foreground"
                : "border-border text-foreground hover:border-foreground"
            )}
          >
            {inCart ? "In Cart ✓" : "Add to Cart"}
          </button>
          <button
            onClick={handleBuyNow}
            className="h-11 px-5 rounded-full bg-foreground text-background text-sm font-bold active:scale-95 transition"
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
    <div className="rounded-xl bg-muted px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5 truncate text-foreground">{value}</div>
    </div>
  );
}
