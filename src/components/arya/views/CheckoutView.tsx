import {
  Loader2, CheckCircle2, AlertCircle, ArrowLeft, Copy, Check,
  CreditCard, Library, ShieldCheck, ShoppingBag, Sparkles, Receipt,
  CalendarDays, Package, Clock, Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/store/app-store";
import {
  openTelegramLink, BOT_USERNAME, createRazorpayOrder, verifyRazorpayPayment,
} from "@/lib/api";

// ── Thumbnail with fallback ────────────────────────────────────────
function Thumb({ poster, title, size = 48 }: { poster?: string | null; title: string; size?: number }) {
  const [err, setErr] = useState(false);
  const cls = "rounded-xl object-cover shrink-0 ring-1 ring-border/60";
  const dim = { height: size, width: size };
  if (poster && !err) {
    return <img src={poster} alt={title} onError={() => setErr(true)} className={cls} style={dim} />;
  }
  return (
    <div className={`${cls} bg-muted flex items-center justify-center`} style={dim}>
      <span className="text-[8px] text-muted-foreground font-semibold text-center px-1 leading-tight line-clamp-3">
        {title.slice(0, 18)}
      </span>
    </div>
  );
}

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "success"; order_id: string; payment_id?: string; bot_url: string; amount: number }
  | { name: "error"; message: string };

export function CheckoutView() {
  const { resetCheckout, navigate, back, cart, clearCart, purchase, tgUser } = useApp();
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Snapshot cart at mount so success screen still shows items
  const cartSnap = useRef(cart);
  if (phase.name === "idle") cartSnap.current = cart;

  const total = cartSnap.current.reduce((a, b) => a + b.price, 0);
  const itemCount = cartSnap.current.length;

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {}
  };

  // ── Main payment handler ───────────────────────────────────────
  const handlePay = async () => {
    if (!cartSnap.current.length) return;
    import("@/lib/haptics").then(m => m.haptics.heavy());
    setPhase({ name: "loading" });

    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) { tg.expand(); tg.disableClosingConfirmation?.(); }

      if (!(window as any).Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => res();
          s.onerror = () => rej(new Error("Razorpay script failed to load"));
          document.head.appendChild(s);
        });
      }

      const order = await createRazorpayOrder(
        cartSnap.current.map((s) => s.id),
        tgUser,
      );

      if (!order.razorpay_order_id || !order.key) {
        throw new Error("Invalid order received from server.");
      }

      await new Promise<void>((resolve, reject) => {
        const descRaw = cartSnap.current.map((s) => s.title).join(", ");
        const descStr = descRaw.length > 200 ? descRaw.substring(0, 197) + "..." : descRaw;

        const rzp = new (window as any).Razorpay({
          key:         order.key,
          amount:      order.amount,
          currency:    order.currency,
          name:        "SliceURL",
          description: descStr || "Digital Access",
          order_id:    order.razorpay_order_id,
          prefill:     { name: tgUser.username || "" },
          theme:       { color: "#111111" },

          handler: async (resp: any) => {
            try {
              const verified = await verifyRazorpayPayment({
                razorpay_order_id:   resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature:  resp.razorpay_signature,
                story_ids:   cartSnap.current.map((s) => s.id),
                telegram_id: tgUser.telegram_id,
                username:    tgUser.username,
              });

              const paidAmount = total;
              purchase(cartSnap.current);
              clearCart();
              setPhase({
                name:       "success",
                order_id:   verified.order_id ?? order.receipt,
                payment_id: resp.razorpay_payment_id,
                bot_url:    verified.checkout_url ?? `https://t.me/${BOT_USERNAME}`,
                amount:     paidAmount,
              });
              import("@/lib/haptics").then(m => m.haptics.heavy());
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

  return (
    <div className="relative">
      <main className="flex-1 overflow-y-auto pb-[160px] px-4 pt-3 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={phase.name === "idle" ? back : () => { setPhase({ name: "idle" }); resetCheckout(); }}
            className="h-10 w-10 grid place-items-center rounded-full bg-surface border border-border/60 hover:bg-muted transition active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-extrabold text-[22px] tracking-tight leading-none">
              {phase.name === "success" ? "Order Confirmed" :
               phase.name === "error"   ? "Payment Failed" :
               phase.name === "loading" ? "Processing"     : "Checkout"}
            </h1>
            {phase.name === "idle" && itemCount > 0 && (
              <p className="text-[12px] text-muted-foreground mt-1">
                {itemCount} {itemCount === 1 ? "item" : "items"} · ready to purchase
              </p>
            )}
          </div>
        </div>

        {/* ── IDLE: Order Summary ─────────────────────────────── */}
        {(phase.name === "idle" || phase.name === "loading") && cartSnap.current.length > 0 && (
          <>
            <SectionLabel>Order Summary</SectionLabel>
            <div className="rounded-[20px] bg-surface border border-border/60 overflow-hidden mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="divide-y divide-border/60">
                {cartSnap.current.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3.5">
                    <Thumb poster={s.poster} title={s.title} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold truncate text-foreground leading-tight">{s.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-1 truncate">
                        {[s.platform, s.genre].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="text-[14px] font-bold text-foreground tabular-nums">₹{s.price}</div>
                  </div>
                ))}
              </div>

              {/* Bill breakdown */}
              <div className="px-4 py-3 bg-muted/40 border-t border-border/60 space-y-1.5">
                <Row label={`Subtotal (${itemCount})`} value={`₹${total}`} />
                <Row label="Platform fee" value="₹0" muted />
                <Row label="Tax" value="Included" muted />
                <div className="h-px bg-border/70 my-2" />
                <Row label="Total" value={`₹${total}`} bold />
              </div>
            </div>

            {/* Trust strip */}
            <div className="flex items-center justify-center gap-2 mb-4 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="font-medium">100% secure payment · Encrypted by Razorpay</span>
            </div>
          </>
        )}

        {/* ── LOADING ─────────────────────────────────────────── */}
        {phase.name === "loading" && (
          <div className="rounded-[20px] bg-surface border border-border/60 p-8 flex flex-col items-center text-center shadow-sm animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/15 animate-splash-ring" />
              <div className="h-14 w-14 rounded-full bg-primary/10 grid place-items-center relative">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            </div>
            <h2 className="mt-5 font-display font-bold text-[17px] text-foreground">Opening secure payment</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground max-w-[260px]">
              Please don't close this screen. We're preparing your Razorpay session.
            </p>
          </div>
        )}

        {/* ── SUCCESS ─────────────────────────────────────────── */}
        {phase.name === "success" && (
          <div className="space-y-4 animate-fade-in">
            {/* Hero confirmation */}
            <div className="rounded-[20px] bg-gradient-to-br from-emerald-500/10 via-surface to-surface border border-emerald-500/20 p-6 text-center shadow-[0_2px_12px_rgba(16,185,129,0.08)]">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-splash-ring" />
                <div className="h-16 w-16 rounded-full bg-emerald-500 grid place-items-center relative shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="h-9 w-9 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h2 className="mt-4 font-display font-extrabold text-[20px] text-foreground tracking-tight">
                Payment Successful
              </h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-[280px] mx-auto">
                Your stories are now in your Library and on the way via Telegram.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Paid · ₹{phase.amount}
              </div>
            </div>

            {/* Order Details */}
            <div>
              <SectionLabel>Order Details</SectionLabel>
              <div className="rounded-[20px] bg-surface border border-border/60 overflow-hidden divide-y divide-border/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <DetailRow
                  label="Order ID"
                  value={phase.order_id}
                  mono
                  onCopy={() => copy("order", phase.order_id)}
                  copied={copiedKey === "order"}
                />
                {phase.payment_id && (
                  <DetailRow
                    label="Payment ID"
                    value={phase.payment_id}
                    mono
                    onCopy={() => copy("pay", phase.payment_id!)}
                    copied={copiedKey === "pay"}
                  />
                )}
                <DetailRow label="Amount" value={`₹${phase.amount}`} bold />
                <DetailRow label="Status" valueNode={
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    Paid
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                } />
              </div>
            </div>

            {/* Purchased items */}
            <div>
              <SectionLabel>Purchased ({cartSnap.current.length})</SectionLabel>
              <div className="rounded-[20px] bg-surface border border-border/60 overflow-hidden divide-y divide-border/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                {cartSnap.current.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3.5">
                    <Thumb poster={s.poster} title={s.title} size={52} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold truncate text-foreground leading-tight">{s.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-1 truncate">
                        {[s.platform, s.genre].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="text-[14px] font-bold text-foreground tabular-nums">₹{s.price}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info banner */}
            <div className="rounded-[18px] border border-amber-500/30 bg-amber-500/[0.06] p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-500/15 grid place-items-center shrink-0">
                  <Inbox className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-amber-700 dark:text-amber-300">
                    How to receive your story
                  </div>
                  <p className="text-[12px] text-amber-700/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                    Open the bot below and tap <span className="font-bold">My Stories</span> to access your episodes. Files will be delivered directly to your Telegram.
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => { resetCheckout(); navigate({ name: "mystories" }); }}
                className="w-full h-[54px] rounded-[16px] bg-foreground text-background font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
              >
                <Library className="h-5 w-5" />
                Go to My Library
              </button>
              <button
                onClick={() => openTelegramLink(phase.bot_url)}
                className="w-full h-[50px] rounded-[16px] bg-surface border border-border text-[14px] font-semibold text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <Send className="h-4 w-4" />
                Open Telegram Bot
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────── */}
        {phase.name === "error" && (
          <div className="rounded-[20px] bg-surface border border-border/60 p-7 flex flex-col items-center text-center shadow-sm animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-red-500/15 grid place-items-center mb-4">
              <AlertCircle className="h-9 w-9 text-red-500" />
            </div>
            <h2 className="font-display font-bold text-[18px] text-foreground">Payment Failed</h2>
            <p className="mt-2 text-[13px] text-muted-foreground max-w-[280px]">{phase.message}</p>
            <div className="mt-6 w-full space-y-2.5">
              <button
                onClick={() => setPhase({ name: "idle" })}
                className="w-full h-[52px] rounded-[16px] bg-foreground text-background font-bold active:scale-[0.98] transition shadow-md"
              >
                Try Again
              </button>
              <button
                onClick={() => openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
                className="w-full h-[48px] rounded-[16px] bg-surface border border-border text-[13px] font-semibold text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <Send className="h-4 w-4" /> Contact @{BOT_USERNAME}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── IDLE: STICKY FOOTER ──────────────────────────────── */}
      {phase.name === "idle" && cartSnap.current.length > 0 && (
        <footer className="fixed bottom-[70px] left-0 right-0 z-40 px-4 pt-3 pb-4 bg-background/85 backdrop-blur-2xl border-t border-border/60 shadow-[0_-12px_32px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={handlePay}
              disabled={cartSnap.current.length === 0}
              className="w-full h-[56px] rounded-[16px] bg-foreground text-background font-bold flex items-center justify-between px-5 active:scale-[0.98] transition shadow-[0_10px_28px_rgba(0,0,0,0.22)] disabled:opacity-40"
            >
              <span className="flex items-center gap-2.5">
                <CreditCard className="h-5 w-5" />
                <span className="text-[15px]">Pay Securely</span>
              </span>
              <span className="font-display font-extrabold text-[18px] tracking-tight tabular-nums">₹{total}</span>
            </button>
            <div className="mt-2.5 text-center text-[11px] font-medium text-muted-foreground/80 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              <span>Secured by Razorpay · 256-bit encryption</span>
            </div>
          </div>
        </footer>
      )}

      {/* Empty cart fallback */}
      {phase.name === "idle" && cartSnap.current.length === 0 && (
        <div className="px-4 pb-20">
          <div className="mt-4 rounded-[20px] bg-surface border border-border/60 p-10 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-muted grid place-items-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 font-semibold text-foreground">Your cart is empty</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Browse stories and add them to checkout.</p>
            <button
              onClick={() => navigate({ name: "explore" })}
              className="mt-5 h-11 px-6 rounded-full bg-foreground text-background text-sm font-semibold"
            >
              Browse Stories
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className={muted ? "text-muted-foreground" : "text-foreground/80"}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-extrabold text-[15px] text-foreground" : "font-semibold text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function DetailRow({
  label, value, valueNode, mono, bold, onCopy, copied,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        {valueNode ? valueNode : (
          <span className={`truncate text-[13px] text-foreground ${mono ? "font-mono" : ""} ${bold ? "font-extrabold" : "font-semibold"}`}>
            {value}
          </span>
        )}
        {onCopy && (
          <button
            onClick={onCopy}
            className="h-7 w-7 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition shrink-0 active:scale-90"
            aria-label={`Copy ${label}`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
