import { useApp } from "@/store/app-store";
import { Send, Library as LibIcon, ShoppingBag, Loader2, RefreshCw, Heart, X } from "lucide-react";
import { openTelegramLink, BOT_USERNAME, fetchMyPurchases } from "@/lib/api";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

type PurchasedStory = {
  story_id: string;
  title: string;
  poster?: string;
  price?: number;
  platform?: string;
  genre?: string;
  isCompleted?: boolean;
  episodes?: number | string;
};

function StoryThumb({ poster, title }: { poster?: string | null; title: string }) {
  const [err, setErr] = useState(false);
  const src = poster?.startsWith("/api/image/") || poster?.startsWith("http") ? poster : null;
  if (src && !err) {
    return <img src={src} alt={title} onError={() => setErr(true)} className="h-16 w-16 rounded-xl object-cover shrink-0" />;
  }
  return (
    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
      <span className="text-[9px] text-muted-foreground font-semibold text-center px-1 leading-tight line-clamp-3">
        {title.slice(0, 20)}
      </span>
    </div>
  );
}

export function MyStoriesView() {
  const { navigate, tgUser, purchased, wishlist, toggleWishlist } = useApp();
  const [tab, setTab] = useState<"mine" | "want">("mine");

  // DB purchases
  const [dbStories, setDbStories] = useState<PurchasedStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const id = tgUser.telegram_id;
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyPurchases(id);
      setDbStories(data);
    } catch {
      setError("Could not load purchases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tgUser.telegram_id]);

  const localAsPurchased: PurchasedStory[] = purchased.map((s) => ({
    story_id: s.id, title: s.title, poster: s.poster ?? undefined,
    price: s.price, platform: s.platform, genre: s.genre,
  }));
  const allIds = new Set(dbStories.map((s) => s.story_id));
  const merged = [...dbStories, ...localAsPurchased.filter((s) => !allIds.has(s.story_id))];

  const openInBot = (storyId: string) => {
    openTelegramLink(`https://t.me/${BOT_USERNAME}?start=story_${storyId}`);
  };

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">Library</h1>
        {tab === "mine" && (
          <button
            onClick={load}
            disabled={loading}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 inline-flex p-1 rounded-full bg-muted w-full">
        <TabBtn active={tab === "mine"} onClick={() => { haptics.light(); setTab("mine"); }} icon={<LibIcon className="h-4 w-4" />} label={`My Stories${merged.length ? ` · ${merged.length}` : ""}`} />
        <TabBtn active={tab === "want"} onClick={() => { haptics.light(); setTab("want"); }} icon={<Heart className="h-4 w-4" />} label={`Want to Listen${wishlist.length ? ` · ${wishlist.length}` : ""}`} />
      </div>

      {/* MY STORIES */}
      {tab === "mine" && (
        <>
          {loading && (
            <div className="mt-16 flex flex-col items-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Loading purchases…</p>
            </div>
          )}
          {!loading && error && (
            <div className="mt-8 rounded-2xl bg-surface border border-border p-5 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button onClick={load} className="mt-3 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold">Retry</button>
            </div>
          )}
          {!loading && !error && merged.length === 0 && (
            <EmptyState
              icon={<LibIcon className="h-6 w-6 text-muted-foreground" />}
              title="No purchased stories yet"
              hint="Bought stories appear here automatically"
              cta={<button onClick={() => navigate({ name: "explore" })} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Browse Stories
              </button>}
            />
          )}
          {!loading && !error && merged.length > 0 && (
            <div className="mt-4 space-y-2">
              {merged.map((s) => (
                <div key={s.story_id} className="flex gap-3 p-3 rounded-2xl bg-surface border border-border items-center animate-fade-in">
                  <StoryThumb poster={s.poster} title={s.title} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-sm text-foreground">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[s.platform, s.genre].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-foreground">✓ Purchased</span>
                      {s.price != null && <span className="text-[10px] text-muted-foreground">· ₹{s.price}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => openInBot(s.story_id)}
                    className="h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                  >
                    <Send className="h-3.5 w-3.5" /> Get
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* WANT TO LISTEN */}
      {tab === "want" && (
        <>
          {wishlist.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-6 w-6 text-rose-500" />}
              title="Your wishlist is empty"
              hint="Tap the ♥ on any story to save it for later"
              cta={<button onClick={() => navigate({ name: "explore" })} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Discover
              </button>}
            />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {wishlist.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate({ name: "detail", storyId: s.id })}
                  className="text-left animate-fade-in"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-square bg-muted shadow-sm">
                    {s.poster ? (
                      <img src={s.poster} alt={s.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs font-semibold text-muted-foreground p-3 text-center">{s.title}</div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); haptics.light(); toggleWishlist(s); }}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/55 backdrop-blur-md text-white grid place-items-center active:scale-90 transition"
                      aria-label="Remove from wishlist"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="text-[13px] font-semibold truncate text-foreground">{s.title}</div>
                    <div className="text-[12px] font-bold text-foreground">₹{s.price}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-10 rounded-full inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-all",
        active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
      )}
    >
      {icon} <span className="truncate">{label}</span>
    </button>
  );
}

function EmptyState({ icon, title, hint, cta }: { icon: React.ReactNode; title: string; hint: string; cta?: React.ReactNode }) {
  return (
    <div className="mt-16 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-muted grid place-items-center">{icon}</div>
      <p className="mt-3 text-sm text-foreground font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      {cta}
    </div>
  );
}
