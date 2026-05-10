import { useEffect, useState, useRef } from "react";
import { useApp } from "@/store/app-store";
import { fetchMyPurchases, openTelegramLink, BOT_USERNAME } from "@/lib/api";
import { 
  ChevronLeft, CheckCircle2, Clock, MapPin, Loader2, PlayCircle, 
  Bot, Receipt, CreditCard, ChevronRight, MessageCircle, HelpCircle, 
  ExternalLink, FileText, ArrowLeft, ArrowUpRight 
} from "lucide-react";
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

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 gap-3">
      <span className="text-[12px] text-muted-foreground font-medium shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[13px] font-mono font-medium text-foreground truncate">{value || "—"}</span>
        {value && (
          <button onClick={copy} className="h-7 w-7 grid place-items-center rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition">
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function CopyIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

import { InfoDialog, type InfoDialogKind } from "../InfoDialog";

export function PurchasedDetailView({ storyId }: { storyId: string }) {
  const { navigate, tgUser, purchased, theme, stories } = useApp();
  const [data, setData] = useState<PurchasedStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [dialog, setDialog] = useState<InfoDialogKind>(null);

  useEffect(() => {
    async function load() {
      if (!tgUser.telegram_id) return;
      setLoading(true);
      
      // Attempt to load from API
      const apiStories = await fetchMyPurchases(tgUser.telegram_id);
      let found = apiStories.find(s => s.story_id === storyId);
      
      if (!found) {
        // Fallback to local store
        const local = purchased.find(s => s.id === storyId);
        if (local) {
          found = {
            story_id: local.id, title: local.title, poster: local.poster ?? undefined,
            price: local.price, platform: local.platform, genre: local.genre,
            source: "miniapp"
          };
        }
      }

      // Merge with global catalog for more details if available
      if (found) {
        const catalog = stories.find(s => s.id === storyId);
        if (catalog) {
          found = { ...found, isCompleted: catalog.isCompleted ?? undefined, episodes: catalog.episodes ?? undefined };
        }
      }

      setData(found || null);
      setLoading(false);
    }
    load();
  }, [storyId, tgUser.telegram_id, purchased, stories]);

  const handleGet = () => {
    if (sending) return;
    haptics.medium();
    setSending(true);
    openTelegramLink(`https://t.me/${BOT_USERNAME}?start=buy_${storyId}`);
    setTimeout(() => { setSending(false); setDelivered(true); }, 1400);
    setTimeout(() => setDelivered(false), 5000);
  };

  const handleSupport = () => {
    navigate({ name: "support" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Receipt className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="font-bold text-lg mb-2">Order Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">We couldn't find the details for this purchase.</p>
        <button onClick={() => navigate({ name: "mystories" })} className="h-10 px-6 rounded-full bg-primary text-primary-foreground font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  const od = data.order_details;
  const isBot = !od || data.source === "bot";
  
  // Try to parse paid_at nicely
  let formattedDate = "Unknown Date";
  if (od && od.paid_at) {
    try {
      const d = new Date(od.paid_at);
      if (!isNaN(d.getTime())) {
        formattedDate = new Intl.DateTimeFormat("en-IN", {
          day: "numeric", month: "short", year: "numeric",
          hour: "numeric", minute: "numeric", hour12: true
        }).format(d);
      } else {
        formattedDate = od.paid_at;
      }
    } catch {
      formattedDate = od.paid_at;
    }
  }

  return (
    <div className="animate-fade-in bg-background min-h-screen pb-10">
      {/* App Bar */}
      <div className="sticky top-0 z-10 flex items-center h-14 px-2 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <button onClick={() => navigate({ name: "mystories" })} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="ml-2 font-semibold text-[15px]">Order Details</span>
      </div>

      {/* Hero Poster & Title */}
      <div className="px-5 pt-6 pb-6 border-b border-border/40">
        <div className="flex gap-5 items-start">
          <div className="relative shrink-0 w-[100px] aspect-[2/3] rounded-xl bg-muted overflow-hidden shadow-sm">
            {data.poster ? (
              <img src={data.poster} alt={data.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center p-2 font-semibold">
                {data.title}
              </div>
            )}
            <div className="absolute top-0 right-0 p-1">
              <div className="h-6 w-6 rounded-full bg-emerald-500 shadow-md grid place-items-center">
                <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h1 className="font-display font-extrabold text-[20px] leading-tight tracking-tight mb-2">
              {data.title}
            </h1>
            <div className="text-[13px] text-muted-foreground mb-3 font-medium">
              {[data.platform, data.genre].filter(Boolean).join(" · ") || "Premium story"}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" /> Owned
              </div>
              <div className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider",
                isBot ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
              )}>
                {isBot ? <Bot className="h-3 w-3" /> : <Receipt className="h-3 w-3" />}
                {isBot ? "Bot Purchase" : "App Purchase"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action */}
      <div className="px-5 py-6 border-b border-border/40">
        <button
          onClick={handleGet}
          disabled={sending}
          className={cn(
            "w-full h-12 rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-70",
            theme === "cream" ? "bg-black text-white" : "bg-primary text-primary-foreground",
            delivered && "bg-emerald-500 text-white"
          )}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : delivered ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <ExternalLink className="h-5 w-5" />
          )}
          
          {sending ? "Opening Telegram..." : 
           delivered ? "Sent to Bot! Check Telegram" : 
           "Get Episodes on Telegram"}
        </button>
        <p className="text-center text-[12px] text-muted-foreground mt-3 font-medium">
          Episodes will be delivered securely via AryaBot.
        </p>
      </div>

      {/* Status Timeline */}
      <div className="px-5 py-6 border-b border-border/40 bg-surface/30">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Fulfillment Status</h3>
        <div className="space-y-4 pl-2 border-l-2 border-emerald-500/30 ml-2 relative">
          
          <div className="relative pl-6">
            <div className="absolute -left-[27px] top-0 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-background grid place-items-center">
              <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
            <div className="text-[14px] font-bold">Payment Completed</div>
            {od && <div className="text-[12px] text-muted-foreground mt-0.5">{formattedDate}</div>}
          </div>

          <div className="relative pl-6">
            <div className="absolute -left-[27px] top-0 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-background grid place-items-center">
              <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
            <div className="text-[14px] font-bold">Story Added to Library</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">Permanent access granted</div>
          </div>

          <div className="relative pl-6">
            <div className="absolute -left-[27px] top-0 h-5 w-5 rounded-full bg-background border-2 border-primary ring-4 ring-background grid place-items-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div className="text-[14px] font-bold text-foreground">Episodes Ready</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">Tap 'Get Episodes' above to read/listen</div>
          </div>

        </div>
      </div>

      {/* Order Info */}
      <div className="px-5 py-6 border-b border-border/40">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Transaction Details</h3>
        <div className="rounded-[16px] bg-surface border border-border/60 px-4 py-1 mt-3">
          <div className="flex items-center justify-between py-3 border-b border-border/40">
            <span className="text-[12px] text-muted-foreground font-medium">Source</span>
            <span className="text-[13px] font-bold">{isBot ? "Arya Premium Bot" : "Mini App Checkout"}</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border/40">
            <span className="text-[12px] text-muted-foreground font-medium">Amount</span>
            <span className="text-[13px] font-bold">{data.price != null ? `₹${data.price}` : "—"}</span>
          </div>

          {od && (
            <>
              <CopyField label="Order ID" value={od.order_id} />
              <CopyField label="Payment ID" value={od.payment_id} />
            </>
          )}
        </div>
      </div>

      {/* Support */}
      <div className="px-5 py-6">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Need Help?</h3>
        <button onClick={handleSupport} className="w-full flex items-center justify-between p-4 rounded-xl border border-border/60 bg-surface hover:bg-muted/50 transition active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 grid place-items-center">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-[14px]">Report an Issue</div>
              <div className="text-[12px] text-muted-foreground">Missing episodes, wrong story, refunds</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <InfoDialog
        kind={dialog}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
      />
    </div>
  );
}
