import { useApp } from "@/store/app-store";
import { Send, Library as LibIcon, ShoppingBag, Loader2, RefreshCw, Heart, X, Copy, Check, ArrowLeft, Bot } from "lucide-react";
import { openTelegramLink, BOT_USERNAME, fetchMyPurchases } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

type OrderDetails = {
  order_id: string;
  payment_id: string;
  amount: number;
  source: string;
  paid_at: string;
} | null;

type PurchasedStory = {
  story_id:      string;
  title:         string;
  poster?:       string;
  price?:        number;
  platform?:     string;
  genre?:        string;
  isCompleted?:  boolean;
  episodes?:     number | string;
  source?:       string;
  order_details?: OrderDetails;
};

// ── Story thumbnail ────────────────────────────────────────────────
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

// ── Copyable field ─────────────────────────────────────────────────
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 gap-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-mono font-semibold text-foreground truncate">{value || "—"}</span>
        {value && (
          <button onClick={copy} className="h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground shrink-0">
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Order Detail Sheet ─────────────────────────────────────────────
function OrderDetailSheet({ story, onClose }: { story: PurchasedStory; onClose: () => void }) {
  const od = story.order_details;
  const isBot = !od || story.source === "bot";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full bg-background rounded-t-3xl border-t border-border shadow-2xl p-5 pb-10 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <StoryThumb poster={story.poster} title={story.title} />
          <div className="min-w-0">
            <div className="font-semibold text-[15px] text-foreground truncate">{story.title}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {[story.platform, story.genre].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        {/* Order details card */}
        <div className="rounded-2xl bg-surface border border-border overflow-hidden mb-4">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              {isBot ? "Bot Purchase" : "Order Details"}
            </span>
          </div>
          <div className="px-4">
            {od ? (
              <>
                <CopyField label="Order ID"   value={od.order_id} />
                <CopyField label="Payment ID" value={od.payment_id} />
                <CopyField label="Amount"     value={`₹${od.amount}`} />
                <CopyField label="Date"       value={od.paid_at ? new Date(od.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""} />
              </>
            ) : (
              <div className="py-3 text-[12px] text-muted-foreground">
                {isBot ? "Purchased via Arya Bot" : "No order details available"}
                {story.price != null && <span className="ml-1">· ₹{story.price}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Source badge */}
        <div className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold mb-4",
          isBot ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
        )}>
          {isBot ? <Bot className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          {isBot ? "Purchased via Bot" : "Purchased via Mini App"}
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={() => { onClose(); openTelegramLink(`https://t.me/${BOT_USERNAME}?start=buy_${story.story_id}`); }}
            className="w-full h-[50px] rounded-2xl bg-foreground text-background font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Send className="h-4 w-4" />
            Get Episodes via Bot
          </button>
          <button
            onClick={onClose}
            className="w-full h-[44px] rounded-2xl bg-muted text-muted-foreground text-sm font-semibold active:scale-[0.98] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function MyStoriesView() {
  const { navigate, tgUser, purchased, wishlist, toggleWishlist } = useApp();
  const [tab, setTab]           = useState<"mine" | "want">("mine");
  const [dbStories, setDbStories] = useState<PurchasedStory[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [selected, setSelected] = useState<PurchasedStory | null>(null);

  const load = async () => {
    const id = tgUser.telegram_id;
    if (!id) return;
    setLoading(true); setError(null);
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

  // Merge DB + local purchased (local-only if not in DB yet)
  const localAsPurchased: PurchasedStory[] = purchased.map((s) => ({
    story_id: s.id, title: s.title, poster: s.poster ?? undefined,
    price: s.price, platform: s.platform, genre: s.genre,
    source: "miniapp",
  }));
  const allIds = new Set(dbStories.map((s) => s.story_id));
  const merged = [...dbStories, ...localAsPurchased.filter((s) => !allIds.has(s.story_id))];

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-bold text-xl">Library</h1>
        {tab === "mine" && (
          <button
            onClick={() => { haptics.light(); load(); }}
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
        <TabBtn active={tab === "mine"}  onClick={() => { haptics.light(); setTab("mine");  }} icon={<LibIcon className="h-4 w-4" />} label={`My Stories${merged.length ? ` · ${merged.length}` : ""}`} />
        <TabBtn active={tab === "want"}  onClick={() => { haptics.light(); setTab("want");  }} icon={<Heart  className="h-4 w-4" />} label={`Wishlist${wishlist.length ? ` · ${wishlist.length}` : ""}`} />
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
              hint="Stories bought via Bot or Mini App appear here"
              cta={<button onClick={() => navigate({ name: "explore" })} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Browse Stories
              </button>}
            />
          )}
          {!loading && !error && merged.length > 0 && (
            <div className="mt-4 space-y-2">
              {merged.map((s) => (
                <StoryRow
                  key={s.story_id}
                  story={s}
                  onTap={() => { haptics.light(); setSelected(s); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* WISHLIST */}
      {tab === "want" && (
        <>
          {wishlist.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-6 w-6 text-rose-500" />}
              title="Your wishlist is empty"
              hint="Tap the ♥ on any story to save for later"
              cta={<button onClick={() => navigate({ name: "explore" })} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Discover
              </button>}
            />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {wishlist.map((s) => (
                <button key={s.id} onClick={() => navigate({ name: "detail", storyId: s.id })} className="text-left animate-fade-in">
                  <div className="relative rounded-2xl overflow-hidden aspect-square bg-muted shadow-sm">
                    {s.poster
                      ? <img src={s.poster} alt={s.title} className="h-full w-full object-cover" />
                      : <div className="h-full w-full grid place-items-center text-xs font-semibold text-muted-foreground p-3 text-center">{s.title}</div>
                    }
                    <button
                      onClick={(e) => { e.stopPropagation(); haptics.light(); toggleWishlist(s); }}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/55 backdrop-blur-md text-white grid place-items-center active:scale-90 transition"
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

      {/* Order detail bottom sheet */}
      {selected && <OrderDetailSheet story={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Story row card ─────────────────────────────────────────────────
function StoryRow({ story, onTap }: { story: PurchasedStory; onTap: () => void }) {
  const { tgUser } = useApp();
  const [status, setStatus] = useState<"idle" | "sending" | "delivered">("idle");
  const isBot = !story.order_details || story.source === "bot";

  const handleGet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status !== "idle") return;
    haptics.light();
    setStatus("sending");
    openTelegramLink(`https://t.me/${BOT_USERNAME}?start=buy_${story.story_id}`);
    setTimeout(() => { setStatus("delivered"); setTimeout(() => setStatus("idle"), 5000); }, 1500);
  };

  return (
    <button
      className="w-full flex gap-3 p-3 rounded-[14px] bg-surface border border-border items-center animate-fade-in text-left active:scale-[0.99] transition"
      onClick={onTap}
    >
      <StoryThumb poster={story.poster} title={story.title} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate text-[13px] text-foreground leading-tight">{story.title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {[story.platform, story.genre].filter(Boolean).join(" · ")}
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <polyline points="2,6 5,9 10,3" />
            </svg>
            Purchased
          </span>
          {/* Source badge */}
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
            isBot ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            {isBot ? "Bot" : "Mini App"}
          </span>
          {story.price != null && <span className="text-[10px] text-muted-foreground">₹{story.price}</span>}
        </div>
        {status === "delivered" && (
          <div className="mt-1 text-[10px] font-semibold text-emerald-500">✓ Sent to Telegram!</div>
        )}
      </div>
      {/* Get episodes button */}
      <button
        onClick={handleGet}
        disabled={status === "sending"}
        className={cn(
          "h-9 px-3 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition",
          status === "idle"      && "bg-primary text-primary-foreground",
          status === "sending"   && "bg-primary/60 text-primary-foreground cursor-wait",
          status === "delivered" && "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
        )}
      >
        {status === "idle"      && <><Send className="h-3.5 w-3.5" /><span>Get</span></>}
        {status === "sending"   && <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>…</span></>}
        {status === "delivered" && <><Check className="h-3.5 w-3.5" /><span>Done</span></>}
      </button>
    </button>
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
