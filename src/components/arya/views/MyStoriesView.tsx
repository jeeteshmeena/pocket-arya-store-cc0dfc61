import { useApp } from "@/store/app-store";
import {
  Send, Library as LibIcon, ShoppingBag, Loader2, RefreshCw, Heart, X,
  CheckCircle2, Sparkles, Inbox, ChevronRight, Bot, Copy,
} from "lucide-react";
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
  story_id: string;
  title: string;
  poster?: string;
  price?: number;
  platform?: string;
  genre?: string;
  isCompleted?: boolean;
  episodes?: number | string;
  source?: string;
  order_details?: OrderDetails;
};

// ── Copyable field ─────────────────────────────────────────────────
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0 gap-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-mono font-semibold text-foreground truncate">{value || "—"}</span>
        {value && (
          <button onClick={copy} className="h-6 w-6 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition">
            {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

function StoryThumb({ poster, title }: { poster?: string | null; title: string }) {
  const [err, setErr] = useState(false);
  const src = poster?.startsWith("/api/") || poster?.startsWith("http") ? poster : null;
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
  const { navigate, tgUser, purchased, wishlist, toggleWishlist, t } = useApp();
  const [tab, setTab] = useState<"mine" | "want">("mine");
  // const [selected, setSelected] = useState<PurchasedStory | null>(null);

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
    source: "miniapp",
  }));
  const allIds = new Set(dbStories.map((s) => s.story_id));
  const merged = [...dbStories, ...localAsPurchased.filter((s) => !allIds.has(s.story_id))];

  const openInBot = (storyId: string) => {
    openTelegramLink(`https://t.me/${BOT_USERNAME}?start=buy_${storyId}`);
  };

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">{t("library.title")}</h1>
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
        <TabBtn active={tab === "mine"} onClick={() => { haptics.light(); setTab("mine"); }} icon={<LibIcon className="h-4 w-4" />} label={`${t("library.purchased")}${merged.length ? ` · ${merged.length}` : ""}`} />
        <TabBtn active={tab === "want"} onClick={() => { haptics.light(); setTab("want"); }} icon={<Heart className="h-4 w-4" />} label={`${t("story.listen")}${wishlist.length ? ` · ${wishlist.length}` : ""}`} />
      </div>

      {/* MY STORIES */}
      {tab === "mine" && (
        <>
          {loading && (
            <div className="mt-16 flex flex-col items-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>
            </div>
          )}
          {!loading && error && (
            <div className="mt-8 rounded-2xl bg-surface border border-border p-5 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button onClick={load} className="mt-3 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold">{t("common.retry")}</button>
            </div>
          )}
          {!loading && !error && merged.length === 0 && (
            <EmptyState
              icon={<LibIcon className="h-6 w-6 text-muted-foreground" />}
              title={t("library.empty")}
              hint={t("library.browse")}
              cta={<button onClick={() => navigate({ name: "explore" })} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> {t("library.browse")}
              </button>}
            />
          )}
          {!loading && !error && merged.length > 0 && (
            <div className="mt-4 space-y-2">
              {merged.map((s) => (
                <StoryRow key={s.story_id} story={s} onRefresh={load} onOpen={() => { haptics.light(); navigate({ name: "purchased-detail", storyId: s.story_id }); }} />
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
              title={t("cart.empty")}
              hint={t("cart.browse")}
              cta={<button onClick={() => navigate({ name: "explore" })} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> {t("explore.tab")}
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

type DeliveryStatus = "idle" | "sending" | "delivered" | "already";

function StoryRow({ story, onRefresh, onOpen }: { story: PurchasedStory; onRefresh?: () => void; onOpen?: () => void }) {
  const [status, setStatus] = useState<DeliveryStatus>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { tgUser } = useApp();
  const isBot = !story.order_details || story.source === "bot";

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleGet = () => {
    if (status !== "idle") return;
    haptics.light();
    setStatus("sending");

    // Open Telegram bot — preserves existing delivery logic untouched
    openTelegramLink(`https://t.me/${BOT_USERNAME}?start=buy_${story.story_id}`);

    // After 1.5s show "delivered"
    setTimeout(() => {
      setStatus("delivered");
      // Auto-reset to idle after 5s
      setTimeout(() => setStatus("idle"), 5000);
      // Refresh parent list to sync UI
      if (onRefresh) setTimeout(onRefresh, 2000);
    }, 1500);
  };

  const { t } = useApp();
  const stateConfig = {
    idle: {
      label: t("myStories.getFiles"),
      icon: <Send className="h-3.5 w-3.5" />,
      cls: "bg-primary text-primary-foreground",
    },
    sending: {
      label: t("myStories.downloading"),
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      cls: "bg-primary/60 text-primary-foreground cursor-wait",
    },
    delivered: {
      label: t("common.success"),
      icon: (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <polyline points="2,8 6,12 14,4" />
        </svg>
      ),
      cls: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
    },
    already: {
      label: t("common.retry"),
      icon: <Send className="h-3.5 w-3.5" />,
      cls: "bg-muted text-muted-foreground border border-border",
    },
  }[status];

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(); } }}
      className="group flex gap-3 p-3 rounded-[16px] bg-surface border border-border/60 items-center animate-fade-in cursor-pointer transition hover:border-border hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-[0.99]"
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
            {t("library.purchased")}
          </span>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
            isBot ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            {isBot ? "Bot" : "Mini App"}
          </span>
          {story.price != null && (
            <span className="text-[10px] text-muted-foreground">₹{story.price}</span>
          )}
        </div>

        {status === "delivered" && (
          <div
            className="mt-1.5 flex items-center gap-1.5"
            style={{ animation: "delivery-success 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <div className="h-4 w-4 rounded-full bg-emerald-500 grid place-items-center shrink-0">
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                <polyline points="2,6 5,9 10,3" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-emerald-500">
              Sent to Telegram — check your bot!
            </span>
          </div>
        )}
        {status === "sending" && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
            <span className="text-[11px] text-muted-foreground">Opening Telegram bot…</span>
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleGet(); }}
        disabled={status === "sending"}
        className={cn(
          "h-9 px-3 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shrink-0",
          "transition-transform duration-75 active:scale-95",
          stateConfig.cls,
        )}
        aria-label={stateConfig.label}
      >
        {stateConfig.icon}
        <span>{stateConfig.label}</span>
      </button>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0 -ml-1 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </div>
  );
}

// ── Premium bottom-sheet detail for purchased stories ────────
function PurchasedDetailSheet({ story, onClose }: { story: PurchasedStory; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const od = story.order_details;
  const isBot = !od || story.source === "bot";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleGet = () => {
    if (sending) return;
    haptics.medium();
    setSending(true);
    openTelegramLink(`https://t.me/${BOT_USERNAME}?start=buy_${story.story_id}`);
    setTimeout(() => { setSending(false); setDelivered(true); }, 1400);
    setTimeout(() => setDelivered(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-md bg-card text-card-foreground rounded-t-[28px] sm:rounded-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.35)] border border-border/60 overflow-hidden"
        style={{ animation: "sheet-up 0.32s cubic-bezier(0.2,1.4,0.3,1) both" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-foreground/15" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 h-9 w-9 grid place-items-center rounded-full bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground active:scale-90 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="px-5 pb-6 pt-2">
          {/* Hero */}
          <div className="flex items-center gap-4 pt-2 pb-5">
            <div className="relative">
              <StoryThumb poster={story.poster} title={story.title} />
              <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 grid place-items-center ring-2 ring-card shadow">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-extrabold text-[19px] tracking-tight leading-tight truncate">
                {story.title}
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground truncate">
                {[story.platform, story.genre].filter(Boolean).join(" · ") || "Premium story"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Owned
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  isBot ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                )}>
                  {isBot ? <Bot className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {isBot ? "Bot" : "Mini App"}
                </div>
              </div>
            </div>
          </div>

          {/* Purchase summary */}
          <div className="rounded-[18px] bg-surface border border-border/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isBot ? "Bot Purchase" : "Order Details"}
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-foreground/80">{isBot ? "Purchased via Arya Bot" : "Purchased via Mini App"}</span>
                {story.price != null && (
                  <span className="text-[13px] font-bold tabular-nums">₹{story.price}</span>
                )}
              </div>
              {!isBot && od && (
                <div className="pt-2 border-t border-border/40">
                  <CopyField label="Order ID" value={od.order_id} />
                  <CopyField label="Payment ID" value={od.payment_id} />
                  <CopyField label="Date" value={od.paid_at ? new Date(od.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""} />
                </div>
              )}
            </div>
          </div>

          {/* Info banner */}
          <div className="mt-3 rounded-[16px] border border-amber-500/25 bg-amber-500/[0.06] p-3.5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 grid place-items-center shrink-0">
              <Inbox className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-amber-700 dark:text-amber-300">
                Episodes delivered on Telegram
              </div>
              <p className="text-[11.5px] text-amber-700/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                Tap below to receive your story files instantly inside the bot chat.
              </p>
            </div>
          </div>

          {/* Delivered state */}
          {delivered && (
            <div
              className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/12 border border-emerald-500/25"
              style={{ animation: "delivery-success 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                Sent to Telegram — check your bot chat
              </span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleGet}
            disabled={sending}
            className="mt-5 w-full h-[54px] rounded-[16px] bg-foreground text-background font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-[0_8px_24px_rgba(0,0,0,0.22)] disabled:opacity-70"
          >
            {sending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Opening Telegram…</span>
              </>
            ) : (
              <>
                <Send className="h-[18px] w-[18px]" />
                <span>Get Episodes via Bot</span>
              </>
            )}
          </button>
          <button
            onClick={() => openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
            className="mt-2 w-full h-[46px] rounded-[14px] bg-surface border border-border/60 text-[13px] font-semibold text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 transition"
          >
            <Bot className="h-4 w-4" />
            Open Bot
          </button>
        </div>
      </div>
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
