import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Copy, Check, ShoppingBag, CreditCard, Send } from "lucide-react";
import { useRef, useState } from "react";
import { useApp } from "@/store/app-store";
import { openTelegramLink, BOT_USERNAME, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";

// ── Razorpay script loader ─────────────────────────────────────────
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

// ── Thumbnail with fallback ────────────────────────────────────────
function Thumb({ poster, title }: { poster?: string | null; title: string }) {
  const [err, setErr] = useState(false);
  if (poster && !err) {
    return <img src={poster} alt={title} onError={() => setErr(true)} className="h-12 w-12 rounded-xl object-cover shrink-0" />;
  }
  return (
    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
      <span className="text-[8px] text-muted-foreground font-semibold text-center px-1 leading-tight line-clamp-3">
        {title.slice(0, 18)}
      </span>
    </div>
  );
}

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "success"; order_id: string; bot_url: string }
  | { name: "error"; message: string };

export function CheckoutView() {
  const { resetCheckout, navigate, back, cart, clearCart, purchase, tgUser } = useApp();
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [copied, setCopied] = useState(false);

  // Snapshot cart at mount so success screen still shows items
  const cartSnap = useRef(cart);
  if (phase.name === "idle") cartSnap.current = cart;

  const total = cartSnap.current.reduce((a, b) => a + b.price, 0);

  const goHome = () => {
    resetCheckout();
    navigate({ name: "home" });
  };

  const copyOrderId = async (id: string) => {
    try { await navigator.clipboard.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  // ── Main payment handler ───────────────────────────────────────
  const handlePay = async () => {
    if (!cartSnap.current.length) return;
    setPhase({ name: "loading" });

    try {
      // 1. Load Razorpay JS
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay could not load. Check your internet connection.");

      // 2. Create order on our server
      const order = await createRazorpayOrder(
        cartSnap.current.map((s) => s.id),
        tgUser,
      );

      // 3. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key:         order.key,
          amount:      order.amount,
          currency:    order.currency,
          name:        "Arya Premium",
          description: cartSnap.current.map((s) => s.title).join(", ") || "Premium Stories",
          order_id:    order.razorpay_order_id,
          prefill:     { name: tgUser.username || "" },
          theme:       { color: "#111111" },   // black — no blue/green

          handler: async (resp: any) => {
            try {
              // 4. Verify payment on server
              const verified = await verifyRazorpayPayment({
                razorpay_order_id:  resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                story_ids:  cartSnap.current.map((s) => s.id),
                telegram_id: tgUser.telegram_id,
                username:   tgUser.username,
              });

              // 5. Update local + clear cart
              purchase(cartSnap.current);
              clearCart();
              setPhase({
                name:     "success",
                order_id: verified.order_id ?? order.receipt,
                bot_url:  verified.checkout_url ?? `https://t.me/${BOT_USERNAME}`,
              });
              resolve();
            } catch (e: any) {
              reject(new Error(e.message || "Payment verification failed"));
            }
          },

          modal: {
            ondismiss: () => {
              setPhase({ name: "idle" }); // user closed modal
              resolve();
            },
          },
        });

        rzp.on("payment.failed", (resp: any) => {
          reject(new Error(resp?.error?.description || "Payment failed"));
        });

        rzp.open();
      });

    } catch (e: any) {
      const raw = e.message || "Something went wrong. Please try again.";
      // Sanitize: don't show raw JSON to user
      const msg = raw.includes("{") ? "Something went wrong. Please try again." : raw;
      setPhase({ name: "error", message: msg });
    }
  };

  return (
    <div className="animate-fade-in px-4 pt-3 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={phase.name === "idle" ? back : () => setPhase({ name: "idle" })}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Checkout</h1>
      </div>

      {/* ── Cart summary ────────────────────────────────────── */}
      {(phase.name === "idle" || phase.name === "loading") && cartSnap.current.length > 0 && (
        <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden mb-4">
          {cartSnap.current.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3">
              <Thumb poster={s.poster} title={s.title} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.platform} · {s.genre}</div>
              </div>
              <div className="text-sm font-bold">₹{s.price}</div>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground font-medium">Total</span>
            <span className="font-display font-bold text-lg">₹{total}</span>
          </div>
        </div>
      )}

      {/* ── IDLE: Pay button ────────────────────────────────── */}
      {phase.name === "idle" && (
        <div className="space-y-3">
          <button
            onClick={handlePay}
            disabled={cartSnap.current.length === 0}
            className="w-full h-14 rounded-2xl bg-foreground text-background font-bold flex items-center gap-4 px-5 active:scale-[0.98] transition disabled:opacity-40"
          >
            <div className="h-9 w-9 rounded-xl bg-background/20 grid place-items-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold">Pay ₹{total}</div>
              <div className="text-[11px] opacity-70">UPI · Cards · Net Banking · Wallets</div>
            </div>
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            Secured by Razorpay · 256-bit encrypted
          </p>
        </div>
      )}

      {/* ── LOADING ─────────────────────────────────────────── */}
      {phase.name === "loading" && (
        <div className="rounded-2xl bg-surface border border-border p-10 flex flex-col items-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <h2 className="mt-4 font-display font-bold text-lg">Opening payment…</h2>
          <p className="mt-1 text-sm text-muted-foreground">Please wait, do not close this screen</p>
        </div>
      )}

      {/* ── SUCCESS ─────────────────────────────────────────── */}
      {phase.name === "success" && (
        <div className="rounded-2xl bg-surface border border-border p-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-muted grid place-items-center">
              <CheckCircle2 className="h-9 w-9 text-foreground" />
            </div>
            <h2 className="mt-4 font-display font-bold text-xl">Payment Successful!</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Your purchase is confirmed. Open the bot to receive your stories.
            </p>
          </div>

          {/* Order ID */}
          {phase.order_id && (
            <div className="mt-5 rounded-xl bg-muted px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Order ID</div>
                <div className="font-mono text-sm font-semibold truncate">{phase.order_id}</div>
              </div>
              <button
                onClick={() => copyOrderId(phase.order_id)}
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-background text-muted-foreground shrink-0 transition"
              >
                {copied ? <Check className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <button
              onClick={() => openTelegramLink(phase.bot_url)}
              className="w-full h-12 rounded-full bg-foreground text-background font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Send className="h-4 w-4" />
              Open @{BOT_USERNAME}
            </button>
            <button
              onClick={goHome}
              className="w-full h-11 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground inline-flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue browsing
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR ───────────────────────────────────────────── */}
      {phase.name === "error" && (
        <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-muted grid place-items-center">
            <AlertCircle className="h-9 w-9 text-destructive" />
          </div>
          <h2 className="mt-4 font-display font-bold text-lg">Payment Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">{phase.message}</p>
          <div className="mt-5 w-full space-y-2">
            <button
              onClick={() => setPhase({ name: "idle" })}
              className="w-full h-12 rounded-full bg-foreground text-background font-semibold active:scale-[0.98] transition"
            >
              Try Again
            </button>
            <button
              onClick={() => openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
              className="w-full h-11 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 transition"
            >
              <Send className="h-4 w-4" /> Contact @{BOT_USERNAME}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
