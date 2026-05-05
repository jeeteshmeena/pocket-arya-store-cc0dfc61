import { Loader2, CheckCircle2, AlertCircle, Send, ArrowLeft, Copy, Check, ShoppingBag, CreditCard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/store/app-store";
import { openTelegramLink, BOT_USERNAME, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";

// ── Image thumbnail with graceful fallback ─────────────────────────
function Thumb({ poster, title }: { poster?: string | null; title: string }) {
  const [err, setErr] = useState(false);
  if (poster && !err) {
    return (
      <img
        src={poster}
        alt={title}
        onError={() => setErr(true)}
        className="h-12 w-12 rounded-lg object-cover shrink-0"
      />
    );
  }
  return (
    <div className="h-12 w-12 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
      <span className="text-[8px] text-primary font-bold text-center px-1 leading-tight line-clamp-3">
        {title.slice(0, 20)}
      </span>
    </div>
  );
}

// ── Load Razorpay checkout.js dynamically ─────────────────────────
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

type PayState =
  | { phase: "choose" }
  | { phase: "rzp_loading" }
  | { phase: "bot_loading" }
  | { phase: "success"; order_id: string; url: string; via: "razorpay" | "bot" }
  | { phase: "error"; message: string };

export function CheckoutView() {
  const { checkoutState, resetCheckout, navigate, back, cart, clearCart, purchase, tgUser, startCheckout } = useApp();
  const [pay, setPay] = useState<PayState>({ phase: "choose" });
  const [copied, setCopied] = useState(false);
  const cartRef = useRef(cart); // snapshot cart at mount so success screen still shows items
  cartRef.current = pay.phase === "choose" ? cart : cartRef.current;

  const total = cartRef.current.reduce((a, b) => a + b.price, 0);

  const goHome = () => {
    resetCheckout();
    navigate({ name: "home" });
  };

  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  // ── Pay via Razorpay ─────────────────────────────────────────────
  const handleRazorpay = async () => {
    if (!cartRef.current.length) return;
    setPay({ phase: "rzp_loading" });

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed to load. Check your internet connection.");

      // 2. Create order on server
      const order = await createRazorpayOrder(cartRef.current.map((s) => s.id), tgUser);

      // 3. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "Arya Premium",
          description: order.story_names.join(", ") || "Premium Stories",
          order_id: order.razorpay_order_id,
          prefill: { name: tgUser.username || "" },
          theme: { color: "#22c55e" },
          handler: async (resp: any) => {
            try {
              // 4. Verify payment on server
              const verified = await verifyRazorpayPayment({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                story_ids: cartRef.current.map((s) => s.id),
                telegram_id: tgUser.telegram_id,
                username: tgUser.username,
              });
              // 5. Update local state
              purchase(cartRef.current);
              clearCart();
              setPay({ phase: "success", order_id: verified.order_id!, url: verified.checkout_url!, via: "razorpay" });
              resolve();
            } catch (e: any) {
              reject(new Error(e.message || "Payment verification failed"));
            }
          },
          modal: {
            ondismiss: () => {
              setPay({ phase: "choose" });
              resolve(); // user dismissed — back to choose
            },
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          reject(new Error(resp?.error?.description || "Payment failed"));
        });
        rzp.open();
      });
    } catch (e: any) {
      setPay({ phase: "error", message: e.message || "Payment failed" });
    }
  };

  // ── Pay via Bot (UPI screenshot flow) ────────────────────────────
  const handleBotPay = async () => {
    if (!cartRef.current.length) return;
    setPay({ phase: "bot_loading" });
    try {
      await startCheckout(cartRef.current);
      // startCheckout updates checkoutState — monitor it
    } catch (e: any) {
      setPay({ phase: "error", message: e.message || "Failed to create order" });
    }
  };

  // Sync bot payment result from checkoutState
  useEffect(() => {
    if (pay.phase !== "bot_loading") return;
    if (checkoutState.status === "success") {
      purchase(cartRef.current);
      clearCart();
      setPay({
        phase: "success",
        order_id: (checkoutState as any).order_id || "",
        url: (checkoutState as any).url || `https://t.me/${BOT_USERNAME}`,
        via: "bot",
      });
    } else if (checkoutState.status === "error") {
      setPay({ phase: "error", message: (checkoutState as any).message });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutState.status]);

  return (
    <div className="animate-fade-in px-4 pt-3 pb-10 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={pay.phase === "choose" ? back : () => setPay({ phase: "choose" })}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Checkout</h1>
      </div>

      {/* Cart summary (show during choose + loading phases) */}
      {(pay.phase === "choose" || pay.phase === "rzp_loading" || pay.phase === "bot_loading") && cartRef.current.length > 0 && (
        <div className="rounded-2xl bg-surface divide-y divide-border overflow-hidden mb-4">
          {cartRef.current.map((s) => (
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
            <span className="font-display font-bold text-primary text-lg">₹{total}</span>
          </div>
        </div>
      )}

      {/* ── Phase: Choose ─────────────────────────────────────────── */}
      {pay.phase === "choose" && (
        <div className="rounded-2xl bg-surface p-5 space-y-3">
          <p className="text-sm font-semibold text-center text-muted-foreground mb-1">Choose Payment Method</p>

          {/* Razorpay — UPI / Cards / Net Banking */}
          <button
            onClick={handleRazorpay}
            className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center gap-4 px-4 py-4 active:scale-[0.98] transition"
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Pay Online</div>
              <div className="text-[11px] opacity-75">UPI · Cards · Net Banking · Wallets</div>
            </div>
          </button>

          {/* Bot UPI — manual screenshot */}
          <button
            onClick={handleBotPay}
            className="w-full rounded-2xl border border-border flex items-center gap-4 px-4 py-4 active:scale-[0.98] transition hover:bg-surface"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Pay via Telegram Bot</div>
              <div className="text-[11px] text-muted-foreground">UPI screenshot verification</div>
            </div>
          </button>
        </div>
      )}

      {/* ── Phase: Loading ────────────────────────────────────────── */}
      {(pay.phase === "rzp_loading" || pay.phase === "bot_loading") && (
        <div className="rounded-2xl bg-surface p-10 flex flex-col items-center text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <h2 className="mt-4 font-display font-bold text-lg">
            {pay.phase === "rzp_loading" ? "Opening payment…" : "Creating order…"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Please wait</p>
        </div>
      )}

      {/* ── Phase: Success ────────────────────────────────────────── */}
      {pay.phase === "success" && (
        <div className="rounded-2xl bg-surface p-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/15 grid place-items-center">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <h2 className="mt-4 font-display font-bold text-lg">
              {pay.via === "razorpay" ? "Payment Successful!" : "Order Created!"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              {pay.via === "razorpay"
                ? "Your payment is verified. Open the bot to receive your stories instantly."
                : "Open the Telegram bot to complete UPI payment and receive your stories."}
            </p>
          </div>

          {/* Order ID */}
          {pay.order_id && (
            <div className="mt-5 rounded-xl bg-background p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Order ID</div>
                <div className="font-mono text-sm text-primary truncate">{pay.order_id}</div>
              </div>
              <button
                onClick={() => copy(pay.order_id)}
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface text-muted-foreground shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}

          <button
            onClick={() => openTelegramLink(pay.url)}
            className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Send className="h-4 w-4" />
            Open @{BOT_USERNAME}
          </button>
          <button
            onClick={goHome}
            className="mt-2 w-full h-11 rounded-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 transition"
          >
            <ShoppingBag className="h-4 w-4" /> Continue browsing
          </button>
        </div>
      )}

      {/* ── Phase: Error ──────────────────────────────────────────── */}
      {pay.phase === "error" && (
        <div className="rounded-2xl bg-surface p-6 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/15 grid place-items-center">
            <AlertCircle className="h-9 w-9 text-destructive" />
          </div>
          <h2 className="mt-4 font-display font-bold text-lg">Payment Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs break-words">{pay.message}</p>
          <button
            onClick={() => setPay({ phase: "choose" })}
            className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition"
          >
            Try Again
          </button>
          <button
            onClick={() => openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
            className="mt-2 w-full h-11 rounded-full border border-border text-sm inline-flex items-center justify-center gap-2 transition"
          >
            <Send className="h-4 w-4 text-primary" /> Contact @{BOT_USERNAME}
          </button>
        </div>
      )}
    </div>
  );
}
