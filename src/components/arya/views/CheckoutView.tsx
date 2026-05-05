import { Loader2, CheckCircle2, AlertCircle, Send, ArrowLeft, Copy, Check, ShoppingBag, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { openTelegramLink, BOT_USERNAME, loadRazorpay, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";

function StoryThumb({ poster, title }: { poster?: string | null; title: string }) {
  const [err, setErr] = useState(false);
  const src = poster?.startsWith("/api/image/") ? poster : (poster?.startsWith("http") ? poster : null);
  if (src && !err) {
    return <img src={src} alt={title} onError={() => setErr(true)} className="h-12 w-12 rounded-lg object-cover shrink-0" />;
  }
  return (
    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
      <span className="text-[8px] text-primary font-bold text-center px-1 leading-tight line-clamp-3">{title.slice(0, 20)}</span>
    </div>
  );
}

export function CheckoutView() {
  const { checkoutState, resetCheckout, navigate, back, cart, clearCart, purchase, tgUser } = useApp();
  const [copied, setCopied] = useState(false);
  const [rzpLoading, setRzpLoading] = useState(false);
  const [payMode, setPayMode] = useState<"bot" | "razorpay" | null>(null);

  useEffect(() => {
    if (checkoutState.status === "success") {
      purchase(cart);
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutState.status]);

  const total = cart.reduce((a, b) => a + b.price, 0);

  const goHome = () => {
    resetCheckout();
    navigate({ name: "home" });
  };

  const handleCopy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const openBot = () => openTelegramLink(checkoutState.status === "success" ? (checkoutState as any).url : `https://t.me/${BOT_USERNAME}`);

  // Pay via Razorpay (in-app)
  const handleRazorpay = async () => {
    if (rzpLoading || !cart.length) return;
    setRzpLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed to load. Please check your connection.");

      const order = await createRazorpayOrder(cart.map(s => s.id), tgUser);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "Arya Premium",
        description: order.story_names.join(", ") || "Premium Stories",
        order_id: order.razorpay_order_id,
        prefill: {
          name: tgUser.username || "User",
        },
        theme: { color: "#22c55e" },
        handler: async (response: any) => {
          try {
            const verified = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              story_ids: cart.map(s => s.id),
              telegram_id: tgUser.telegram_id,
              username: tgUser.username,
            });
            // Payment verified — redirect to bot for delivery
            purchase(cart);
            clearCart();
            openTelegramLink(verified.checkout_url!);
          } catch (e: any) {
            alert("Payment verification failed: " + (e.message || "Please contact support"));
          }
        },
        modal: { ondismiss: () => setRzpLoading(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      alert(e.message || "Payment failed. Please try again.");
      setRzpLoading(false);
    }
  };

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <div className="flex items-center gap-2">
        <button onClick={back} disabled={checkoutState.status === "processing"} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface disabled:opacity-40" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Checkout</h1>
      </div>

      {/* Cart preview */}
      {cart.length > 0 && checkoutState.status !== "success" && (
        <div className="mt-4 rounded-2xl bg-surface divide-y divide-border overflow-hidden">
          {cart.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3">
              <StoryThumb poster={s.poster} title={s.title} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.platform} · {s.genre}</div>
              </div>
              <div className="text-sm font-bold">₹{s.price}</div>
            </div>
          ))}
          <div className="flex items-center justify-between p-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display font-bold text-primary text-lg">₹{total}</span>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-surface overflow-hidden">

        {/* Processing */}
        {checkoutState.status === "processing" && (
          <div className="p-8 flex flex-col items-center text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <h2 className="mt-5 font-display font-bold text-lg">Creating your order…</h2>
            <ProgressDots />
          </div>
        )}

        {/* Idle — choose payment method */}
        {checkoutState.status === "idle" && cart.length > 0 && (
          <div className="p-5 space-y-3">
            <p className="text-sm font-semibold text-center mb-4">Choose Payment Method</p>

            {/* Razorpay — in-app */}
            <button
              onClick={handleRazorpay}
              disabled={rzpLoading}
              className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition disabled:opacity-60 py-3.5"
            >
              {rzpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              <div className="text-left">
                <div className="text-sm font-bold">Pay Online</div>
                <div className="text-[11px] opacity-80">UPI · Cards · Net Banking</div>
              </div>
            </button>

            {/* Via Bot (UPI screenshot / manual) */}
            <button
              onClick={() => {
                const cartItems = cart;
                // startCheckout triggers bot payment flow
                (useApp as any)._startCheckout?.(cartItems);
              }}
              className="w-full h-13 rounded-2xl border border-border text-foreground font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition py-3.5"
              onClick2={() => openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
            >
              <Send className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-sm font-bold">Pay via Bot</div>
                <div className="text-[11px] text-muted-foreground">UPI screenshot verification</div>
              </div>
            </button>
          </div>
        )}

        {/* Idle — empty cart */}
        {checkoutState.status === "idle" && cart.length === 0 && (
          <div className="p-8 flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <button onClick={goHome} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">Browse Stories</button>
          </div>
        )}

        {/* Success */}
        {checkoutState.status === "success" && (
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/15 grid place-items-center">
                <CheckCircle2 className="h-9 w-9 text-primary" />
              </div>
              <h2 className="mt-4 font-display font-bold text-lg">Order Created!</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                Open the Telegram bot to complete payment & receive your stories instantly.
              </p>
            </div>
            {(checkoutState as any).order_id && (
              <div className="mt-5 rounded-xl bg-background p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Order ID</div>
                  <div className="font-mono text-sm truncate text-primary">{(checkoutState as any).order_id}</div>
                </div>
                <button onClick={() => handleCopy((checkoutState as any).order_id!)} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface text-muted-foreground">
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
            <button onClick={openBot} className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition">
              <Send className="h-4 w-4" /> Open @{BOT_USERNAME}
            </button>
            <button onClick={goHome} className="mt-2 w-full h-11 rounded-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 transition">
              <ShoppingBag className="h-4 w-4" /> Continue browsing
            </button>
          </div>
        )}

        {/* Error */}
        {checkoutState.status === "error" && (
          <div className="p-6 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/15 grid place-items-center">
              <AlertCircle className="h-9 w-9 text-destructive" />
            </div>
            <h2 className="mt-4 font-display font-bold text-lg">Checkout failed</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs break-words">{(checkoutState as any).message}</p>
            <button onClick={() => openTelegramLink(`https://t.me/${BOT_USERNAME}`)} className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition inline-flex items-center justify-center gap-2">
              <Send className="h-4 w-4" /> Contact @{BOT_USERNAME}
            </button>
            <button onClick={back} className="mt-2 w-full h-11 rounded-full text-sm text-muted-foreground hover:text-foreground transition">Back to cart</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressDots() {
  return (
    <div className="mt-6 flex items-center gap-1.5" aria-hidden>
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary/30 animate-pulse [animation-delay:300ms]" />
    </div>
  );
}
