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
      <div className={cn("relative", useApp().theme === "cream" ? "px-4 pt-4" : "h-64")}>
        {useApp().theme === "cream" ? (
          /* Cream Theme Neo-brutalist Hero */
          <div className="relative">
             {/* Back */}
            <div className="flex justify-between items-center mb-4">
              <button onClick={back} className="h-8 w-8 grid place-items-center">
                <ArrowLeft className="h-6 w-6 text-foreground" />
              </button>
              <div className="h-1 w-5 rounded bg-foreground"></div>
            </div>
            
            <div className="neo-card bg-[#8CC6E6] aspect-[4/5] p-6 flex flex-col relative overflow-hidden">
              <div className="text-center mt-4">
                <h2 className="text-sm tracking-widest text-white/90 font-bold uppercase mb-2">
                  {story.genre || "Book"}
                </h2>
                <h1 className="text-4xl font-display font-extrabold text-[#11314B] leading-none mb-3">
                  {story.title}
                </h1>
                <p className="text-[10px] text-white/90 tracking-widest uppercase font-bold">
                  {story.language || "English"}
                </p>
              </div>

              {/* Fake Audio Waveform for Neo-brutalism visual */}
              <div className="absolute bottom-6 inset-x-6">
                <p className="text-center text-xs font-semibold text-white/90 mb-3">{story.title}</p>
                <div className="flex items-end justify-center gap-1 h-8 opacity-80 mb-2">
                  {[4, 8, 5, 12, 6, 9, 3, 7, 10, 4, 8, 12, 6, 8, 4, 10, 5, 8, 3].map((h, i) => (
                    <div key={i} className="w-1 bg-white rounded-t-sm" style={{ height: `${h * 2.5}px` }}></div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-white font-semibold">
                  <span>03:23</span>
                  <span>{story.episodes || 0} eps</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Default Hero */
          <>
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

                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  {/* Episodes count — only in detail */}
                  {story.episodes && story.episodes !== "?" && (
                    <span className="text-[11px] font-semibold text-muted-foreground">{story.episodes} eps</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
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
        <div className={cn("mt-5 grid gap-2", (filesLabel || story.size) ? "grid-cols-3" : "grid-cols-2")}>
          <Meta label="Platform"  value={story.platform} />
          <Meta label="Episodes"  value={String(story.episodes ?? "—")} />
          {(filesLabel || story.size) && (
            <Meta label={filesLabel ? "Files" : "Size"} value={(filesLabel ?? story.size) as string} />
          )}
        </div>
      </div>

        {/* Available In section (Theme Cream specific from image) */}
        {useApp().theme === "cream" && (
          <div className="mt-8 mb-4 px-4">
            <h3 className="font-display font-bold text-foreground mb-3">Available In :</h3>
            <div className="flex flex-wrap gap-2">
              <span className="neo-tag-active px-4 py-1.5 text-sm">English</span>
              {["Hindi", "Marathi", "Tamil"].map((lang) => (
                <span key={lang} className="neo-tag-inactive px-4 py-1.5 text-sm">{lang}</span>
              ))}
            </div>
          </div>
        )}
      {/* Sticky bottom bar */}
      <div className={cn(
        "fixed bottom-0 inset-x-0 z-30 pb-[env(safe-area-inset-bottom)]",
        useApp().theme === "cream" ? "bg-background pb-4 pt-2" : "bg-background border-t border-border"
      )}>
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          {useApp().theme === "cream" ? (
            <>
              {/* Neo-brutalist buttons */}
              <button
                onClick={handleBuyNow}
                className="neo-button flex-1 h-12 bg-primary text-primary-foreground text-base flex items-center justify-center gap-2"
              >
                <div className="bg-white text-primary rounded-full p-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                Play Book
              </button>
              <button
                onClick={() => {
                  if (!inCart) {
                    import("@/lib/haptics").then(m => m.haptics.light());
                    addToCart(story);
                  }
                }}
                className={cn(
                  "h-12 w-12 shrink-0 grid place-items-center bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all",
                  inCart && "bg-secondary"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={inCart ? "black" : "none"} stroke="currentColor" strokeWidth="2.5" className={inCart ? "text-black" : "text-[#FF4D4D]"}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Price</div>
                <div className="font-display font-bold text-lg text-foreground">₹{story.price}</div>
              </div>
              <button
                onClick={() => {
                  if (!inCart) {
                    import("@/lib/haptics").then(m => m.haptics.light());
                    addToCart(story);
                  }
                }}
                className={cn(
                  "h-11 px-4 rounded-full border text-sm font-semibold transition active:scale-[0.97]",
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="rounded-lg bg-muted/50 p-2.5 border border-border/50">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
      <div className="font-bold text-[13px] text-foreground mt-0.5 truncate">{value}</div>
    </div>
  );
}
