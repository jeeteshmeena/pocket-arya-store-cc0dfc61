import { useApp } from "@/store/app-store";
import { Send, Library, ShoppingBag, Loader2, RefreshCw } from "lucide-react";
import { openTelegramLink, BOT_USERNAME, fetchMyPurchases } from "@/lib/api";
import { useEffect, useState } from "react";

type PurchasedStory = {
  story_id: string;
  title: string;
  poster?: string;
  price?: number;
  platform?: string;
  genre?: string;
  purchased_at?: string;
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
  const { navigate, tgUser, purchased } = useApp();

  // Stories from DB (bot purchases + mini app purchases)
  const [dbStories, setDbStories] = useState<PurchasedStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const id = tgUser.telegram_id;
    if (!id) {
      // Fallback to local state if no telegram_id yet
      return;
    }
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

  // Merge DB purchases with local purchases (dedup by story_id)
  const localAsPurchased: PurchasedStory[] = purchased.map((s) => ({
    story_id:  s.id,
    title:     s.title,
    poster:    s.poster ?? undefined,
    price:     s.price,
    platform:  s.platform,
    genre:     s.genre,
  }));

  const allIds = new Set(dbStories.map((s) => s.story_id));
  const merged = [
    ...dbStories,
    ...localAsPurchased.filter((s) => !allIds.has(s.story_id)),
  ];

  const openInBot = (storyId: string) => {
    openTelegramLink(`https://t.me/${BOT_USERNAME}?start=story_${storyId}`);
  };

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl">My Stories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Delivered via @{BOT_USERNAME}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-16 flex flex-col items-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading purchases…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-8 rounded-2xl bg-surface border border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={load} className="mt-3 h-9 px-4 rounded-full bg-foreground text-background text-sm font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && merged.length === 0 && (
        <div className="mt-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted grid place-items-center">
            <Library className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">No purchased stories yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Stories bought from bot and mini app both appear here
          </p>
          <button
            onClick={() => navigate({ name: "explore" })}
            className="mt-4 h-10 px-5 rounded-full bg-foreground text-background text-sm font-semibold inline-flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" /> Browse Stories
          </button>
        </div>
      )}

      {/* Story list */}
      {!loading && !error && merged.length > 0 && (
        <div className="mt-4 space-y-2">
          {merged.map((s) => (
            <div key={s.story_id} className="flex gap-3 p-3 rounded-2xl bg-surface border border-border items-center">
              <StoryThumb poster={s.poster} title={s.title} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {[s.platform, s.genre].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-foreground">
                    ✓ Purchased
                  </span>
                  {s.price != null && (
                    <span className="text-[10px] text-muted-foreground">· ₹{s.price}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => openInBot(s.story_id)}
                className="h-9 px-3 rounded-full bg-foreground text-background text-xs font-semibold flex items-center gap-1.5 shrink-0 active:scale-95 transition"
              >
                <Send className="h-3.5 w-3.5" /> Get
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
