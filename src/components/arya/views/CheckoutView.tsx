import {
  Loader2, CheckCircle2, AlertCircle, ArrowLeft,
  Copy, Check, CreditCard, Send, Library, X, Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useApp } from "@/store/app-store";
import { openTelegramLink, BOT_USERNAME, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Thumbnail ─────────────────────────────────────────────────────
function Thumb({ poster, title, size = "md" }: { poster?: string | null; title: string; size?: "sm" | "md" | "lg" }) {
  const [err, setErr] = useState(false);
  const dim = size === "sm" ? "h-11 w-11" : size === "lg" ? "h-16 w-16" : "h-14 w-14";
  if (poster && !err) {
    return <img src={poster} alt={title} onError={() => setErr(true)} className={`${dim} rounded-xl object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-xl bg-muted flex items-center justify-center shrink-0`}>
      <span className="text-[8px] text-muted-foreground font-semibold text-center px-1 leading-tight line-clamp-3">
        {title.slice(0, 15)}
      </span>
    </div>
  );
}

// ── Detail row (label + value) ────────────────────────────────────
function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={cn("text-[12px] font-semibold text-foreground break-all text-right", mono && "font-mono")}>{value}</span>
        <button onClick={copy} className="h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground shrink-0 transition">
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}

type PaymentDetails = {
  order_id: string;
  payment_id: string;
  bot_url: string;
  total: number;
  items: { title: string; poster?: string | null; price: number; id: string }[];
};

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "success"; details: PaymentDetails }
  | { name: "error"; message: string };

export function CheckoutView() {
  const { resetCheckout, navigate, back, cart, clearCart, removeFromCart, purchase, tgUser } = useApp();
  const [phase, setPhase] = useState<Phase>({ name: "idle" });

  // Snapshot cart at mount — so success screen still shows purchased items
  const cartSnap = useRef(cart);
  if (phase.name === "idle") cartSnap.current = cart;

  const total = cart.reduce((a, b) => a + b.price, 0);

  // ── Main payment handler ──────────────────────────────────────
  const handlePay = async () => {
    if (!cart.length) return;
    import("@/lib/haptics").then(m => m.haptics.heavy());
    setPhase({ name: "loading" });

    try {
      // 1. Expand WebApp so Razorpay modal has room
      const tg = (window as any).Telegram?.WebApp;
      if (tg) { tg.expand(); tg.disableClosingConfirmation?.(); }

      // 2. Load Razorpay (check window first, then dynamically inject)
      if (!(window as any).Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => res();
          s.onerror = () => rej(new Error("Razorpay script failed to load. Check internet connection."));
          document.head.appendChild(s);
        });
      }

      // 3. Create server-side order
      const order = await createRazorpayOrder(
        cart.map((s) => s.id),
        tgUser,
      );
      if (!order.razorpay_order_id || !order.key) {
        throw new Error("Could not create order. Please try again.");
      }

      // 4. Open Razorpay modal
      const snap = [...cart]; // snapshot before clearCart
      await new Promise<void>((resolve, reject) => {
        const descRaw = snap.map((s) => s.title).join(", ");
        const rzp = new (window as any).Razorpay({
          key:         order.key,
          amount:      order.amount,
          currency:    order.currency,
          name:        "Arya Premium",
          description: descRaw.length > 200 ? descRaw.substring(0, 197) + "…" : descRaw,
          order_id:    order.razorpay_order_id,
          prefill:     { name: tgUser.username || "", contact: "" },
          theme:       { color: "#C9A227" },

          handler: async (resp: any) => {
            try {
              // 5. Verify on server
              const verified = await verifyRazorpayPayment({
                razorpay_order_id:   resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature:  resp.razorpay_signature,
                story_ids:   snap.map((s) => s.id),
                telegram_id: tgUser.telegram_id,
                username:    tgUser.username,
              });

              // 6. Update local state
              purchase(snap);
              clearCart();

              setPhase({
                name: "success",
                details: {
                  order_id:   verified.order_id ?? order.receipt ?? "—",
                  payment_id: resp.razorpay_payment_id,
                  bot_url:    verified.checkout_url ?? `https://t.me/${BOT_USERNAME}`,
                  total:      verified.total ?? total,
                  items:      snap,
                },
              });
              resolve();
            } catch (e: any) {
              reject(new Error(e.message || "Payment verification failed"));
            }
          },

          modal: {
            backdropclose: false,
            escape: false,
            ondismiss: () => { setPhase({ name: "idle" }); resolve(); },
          },
        });

        rzp.on("payment.failed", (resp: any) => {
          reject(new Error(resp?.error?.description || "Payment failed"));
        });

        rzp.open();
      });

    } catch (e: any) {
      const raw = e.message || "Something went wrong. Please try again.";
      const msg = raw.includes("{") ? "Something went wrong. Please try again." : raw;
      setPhase({ name: "error", message: msg });
    }
  };

  // ── SUCCESS SCREEN ─────────────────────────────────────────────
  if (phase.name === "success") {
    const { details } = phase;
    return (
      <div className="animate-fade-in px-4 pt-4 pb-8 max-w-lg mx-auto">
        {/* ✅ Confirmation badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 grid place-items-center mb-4 animate-pulse-once">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">Payment Successful!</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your {details.items.length === 1 ? "story has" : `${details.items.length} stories have`} been unlocked.
          </p>
          <div className="mt-2 text-2xl font-black text-foreground">₹{details.total}</div>
        </div>

        {/* 🧾 Order details card */}
        <div className="rounded-2xl bg-surface border border-border overflow-hidden mb-4 shadow-sm">
          <div className="px-4 py-3 border-b border-border/60 bg-muted/40">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Order Details</span>
          </div>
          <div className="px-4">
            <DetailRow label="Order ID"  value={details.order_id}   mono />
            <DetailRow label="Payment ID" value={details.payment_id}  mono />
            <DetailRow label="Amount"    value={`₹${details.total}`} />
            <DetailRow label="Status"    value="Paid ✓" />
          </div>
        </div>

        {/* 📚 Purchased items */}
        <div className="rounded-2xl bg-surface border border-border overflow-hidden mb-4 shadow-sm">
          <div className="px-4 py-3 border-b border-border/60 bg-muted/40">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              Purchased ({details.items.length})
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {details.items.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <Thumb poster={s.poster} title={s.title} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate text-foreground">{s.title}</div>
                </div>
                <div className="text-[13px] font-bold text-foreground">₹{s.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 📋 Instructions */}
        <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 mb-5 text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
          <div className="font-semibold mb-1">📥 How to receive your story</div>
          Open the bot below and tap <strong>My Stories</strong> to access your episodes.
          Files will be delivered directly to your Telegram.
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => { setPhase({ name: "idle" }); navigate({ name: "my_stories" }); }}
            className="w-full h-[52px] rounded-2xl bg-foreground text-background font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md"
          >
            <Library className="h-5 w-5" />
            Go to My Library
          </button>
          <button
            onClick={() => openTelegramLink(details.bot_url)}
            className="w-full h-[52px] rounded-2xl bg-surface border border-border text-sm font-semibold text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Send className="h-4 w-4" />
            Open Delivery Bot
          </button>
        </div>
      </div>
    );
  }

  // ── ERROR SCREEN ───────────────────────────────────────────────
  if (phase.name === "error") {
    return (
      <div className="animate-fade-in px-4 pt-4 pb-8 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-red-500/10 border-2 border-red-500/20 grid place-items-center mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground">Payment Failed</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">{phase.message}</p>
        <div className="mt-8 w-full space-y-3 max-w-sm">
          <button
            onClick={() => setPhase({ name: "idle" })}
            className="w-full h-[52px] rounded-2xl bg-foreground text-background font-bold active:scale-[0.98] transition shadow-md"
          >
            Try Again
          </button>
          <button
            onClick={() => openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
            className="w-full h-[52px] rounded-2xl bg-surface border border-border text-sm font-semibold text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Send className="h-4 w-4" /> Contact @{BOT_USERNAME}
          </button>
        </div>
      </div>
    );
  }

  // ── IDLE / LOADING SCREEN ──────────────────────────────────────
  return (
    <div className="relative">
      <main className="flex-1 overflow-y-auto pb-[140px] px-4 pt-3 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={back}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display font-bold text-xl">Checkout</h1>
          <span className="ml-auto text-sm text-muted-foreground">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Loading overlay */}
        {phase.name === "loading" && (
          <div className="rounded-2xl bg-surface border border-border p-10 flex flex-col items-center text-center shadow-sm mb-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <h2 className="mt-4 font-display font-bold text-lg text-foreground">Opening payment…</h2>
            <p className="mt-1 text-sm text-muted-foreground">Please wait, do not close this screen</p>
          </div>
        )}

        {/* Cart items — clickable + removable */}
        {phase.name === "idle" && cart.length > 0 && (
          <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden mb-4 shadow-sm">
            {cart.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3">
                {/* Clickable poster → opens detail */}
                <button
                  onClick={() => navigate({ name: "detail", storyId: s.id })}
                  className="shrink-0 active:scale-95 transition"
                >
                  <Thumb poster={s.poster} title={s.title} />
                </button>

                {/* Story info — clickable to detail */}
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => navigate({ name: "detail", storyId: s.id })}
                >
                  <div className="text-sm font-semibold truncate text-foreground">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.platform} · {s.genre}</div>
                </button>

                {/* Price */}
                <div className="text-sm font-bold text-foreground mr-1">₹{s.price}</div>

                {/* Remove from cart */}
                <button
                  onClick={() => removeFromCart(s.id)}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition shrink-0"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty cart */}
        {phase.name === "idle" && cart.length === 0 && (
          <div className="rounded-2xl bg-surface border border-border p-10 flex flex-col items-center text-center shadow-sm">
            <X className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
          </div>
        )}
      </main>

      {/* Sticky footer — Pay button */}
      {phase.name === "idle" && (
        <footer className="fixed bottom-[70px] left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-[20px] border-t border-border/60 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm font-semibold text-muted-foreground">Total Amount</span>
              <span className="font-display font-extrabold text-2xl tracking-tight text-foreground">₹{total}</span>
            </div>
            <button
              onClick={handlePay}
              disabled={cart.length === 0}
              className="w-full h-[54px] rounded-[14px] bg-foreground text-background font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md disabled:opacity-40"
            >
              <CreditCard className="h-5 w-5" />
              Pay ₹{total} Now
            </button>
            <div className="mt-3.5 text-center text-[12px] font-medium text-muted-foreground/70 flex items-center justify-center gap-1.5">
              <span>Secured by Razorpay</span>
              <span>·</span>
              <span>256-bit SSL</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
