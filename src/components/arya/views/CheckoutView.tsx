import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Copy, Check, CreditCard, Send, Library } from "lucide-react";
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
    import("@/lib/haptics").then(m => m.haptics.heavy());
    setPhase({ name: "loading" });

    try {
      // 1. Expand WebApp to fullscreen so Razorpay modal has space to render
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.expand();
        tg.disableClosingConfirmation?.();
      }

      // 2. Wait for Razorpay to be ready (pre-loaded in index.html)
      if (!(window as any).Razorpay) {
        // Fallback: try loading dynamically
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => res();
          s.onerror = () => rej(new Error("Razorpay script failed to load"));
          document.head.appendChild(s);
        });
      }

      // 3. Create order on server
      const order = await createRazorpayOrder(
        cartSnap.current.map((s) => s.id),
        tgUser,
      );

      if (!order.razorpay_order_id || !order.key) {
        throw new Error("Invalid order received from server.");
      }

      // 4. Open Razorpay modal
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
              // 5. Verify payment on server
              const verified = await verifyRazorpayPayment({
                razorpay_order_id:   resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature:  resp.razorpay_signature,
                story_ids:   cartSnap.current.map((s) => s.id),
                telegram_id: tgUser.telegram_id,
                username:    tgUser.username,
              });

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
            backdropclose: false,
            escape: false,
            ondismiss: () => {
              setPhase({ name: "idle" });
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
      const msg = raw.includes("{") ? "Something went wrong. Please try again." : raw;
      setPhase({ name: "error", message: msg });
    }
  };

  return (
    <div className="relative">
      <main className="flex-1 overflow-y-auto pb-[140px] px-4 pt-3 animate-fade-in">
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
          <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden mb-4 shadow-sm">
            {cartSnap.current.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3">
                <Thumb poster={s.poster} title={s.title} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-foreground">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.platform} · {s.genre}</div>
                </div>
                <div className="text-sm font-bold text-foreground">₹{s.price}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── LOADING ─────────────────────────────────────────── */}
        {phase.name === "loading" && (
          <div className="rounded-2xl bg-surface border border-border p-10 flex flex-col items-center text-center shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <h2 className="mt-4 font-display font-bold text-lg text-foreground">Opening payment…</h2>
            <p className="mt-1 text-sm text-muted-foreground">Please wait, do not close this screen</p>
          </div>
        )}

        {/* ── SUCCESS ─────────────────────────────────────────── */}
        {phase.name === "success" && (
          <div className="rounded-2xl bg-surface border border-border p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-50 grid place-items-center mb-4">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">Payment Successful!</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                Your purchase is confirmed and added to your Library.
              </p>
            </div>

            {/* Order ID */}
            {phase.order_id && (
              <div className="mt-6 rounded-xl bg-muted px-4 py-3 flex items-center justify-between gap-3 border border-border">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Order ID</div>
                  <div className="font-mono text-sm font-bold truncate text-foreground mt-0.5">{phase.order_id}</div>
                </div>
                <button
                  onClick={() => copyOrderId(phase.order_id)}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-background border border-transparent hover:border-border text-muted-foreground shrink-0 transition"
                >
                  {copied ? <Check className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  setPhase({ name: "idle" });
                  navigate({ name: "my_stories" });
                }}
                className="w-full h-[52px] rounded-2xl bg-foreground text-background font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md"
              >
                <Library className="h-5 w-5" />
                Go to Library
              </button>
              <button
                onClick={() => openTelegramLink(phase.bot_url)}
                className="w-full h-[52px] rounded-2xl bg-surface border border-border text-sm font-semibold text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <Send className="h-4 w-4" />
                Open in Bot
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────── */}
        {phase.name === "error" && (
          <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col items-center text-center shadow-sm">
            <div className="h-16 w-16 rounded-full bg-red-50 grid place-items-center mb-4">
              <AlertCircle className="h-9 w-9 text-red-600" />
            </div>
            <h2 className="font-display font-bold text-lg text-foreground">Payment Failed</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">{phase.message}</p>
            <div className="mt-6 w-full space-y-3">
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
        )}
      </main>

      {/* ── IDLE: STICKY FOOTER ──────────────────────────────── */}
      {phase.name === "idle" && (
        <footer className="fixed bottom-[70px] left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-[20px] border-t border-border/60 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-2xl">
            {/* Total Row */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm font-semibold text-muted-foreground">Total Amount</span>
              <span className="font-display font-extrabold text-2xl tracking-tight text-foreground">₹{total}</span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={cartSnap.current.length === 0}
              className="w-full h-[54px] rounded-[14px] bg-foreground text-background font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md disabled:opacity-40"
            >
              <CreditCard className="h-5 w-5" />
              Pay Now
            </button>

            {/* Razorpay Trust Badge */}
            <div className="mt-3.5 text-center text-[12px] font-medium text-muted-foreground/70 flex items-center justify-center gap-1.5">
              <span>Secured by Razorpay</span>
              <span>·</span>
              <span>256-bit encryption</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
