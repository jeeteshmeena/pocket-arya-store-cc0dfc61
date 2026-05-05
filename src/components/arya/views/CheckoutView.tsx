import { Loader2, CheckCircle2, AlertCircle, Send, ArrowLeft, Copy, Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { openTelegramLink } from "@/lib/api";
import { cn } from "@/lib/utils";

const BOT_USERNAME = "UseAaryaBot";

// Image with gradient fallback
function StoryThumb({ poster, title, genre }: { poster?: string; title: string; genre?: string }) {
  const [err, setErr] = useState(false);
  if (poster?.startsWith("http") && !err) {
    return <img src={poster} alt={title} onError={() => setErr(true)} className="h-12 w-12 rounded-lg object-cover" />;
  }
  return (
    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shrink-0">
      <span className="text-[8px] text-primary font-bold text-center px-1 leading-tight">{title.slice(0, 15)}</span>
    </div>
  );
}

export function CheckoutView() {
  const { checkoutState, resetCheckout, navigate, back, cart, clearCart, purchase } = useApp();
  const [copied, setCopied] = useState(false);

  // Once order created → add to library, clear cart
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
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Open bot with order deep-link
  const openBot = () => {
    const url = checkoutState.status === "success" ? checkoutState.url : `https://t.me/${BOT_USERNAME}`;
    openTelegramLink(url);
  };

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <div className="flex items-center gap-2">
        <button
          onClick={back}
          disabled={checkoutState.status === "processing"}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface disabled:opacity-40"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display font-bold text-xl pfm:text-2xl">Checkout</h1>
      </div>

      <div className="mt-5 rounded-2xl bg-surface overflow-hidden">

        {/* Processing */}
        {checkoutState.status === "processing" && (
          <div className="p-8 flex flex-col items-center text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <h2 className="mt-5 font-display font-bold text-lg">Preparing your order…</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Creating a secure order in the Arya Premium system. Just a moment.
            </p>
            <ProgressDots />
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
                Open the Telegram bot to complete payment. Your stories will be delivered instantly after payment.
              </p>
            </div>

            {/* Order ID */}
            {checkoutState.order_id && (
              <div className="mt-5 rounded-xl bg-background p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Order ID</div>
                  <div className="font-mono text-sm truncate text-primary">{checkoutState.order_id}</div>
                </div>
                <button
                  onClick={() => handleCopy(checkoutState.order_id!)}
                  className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface text-muted-foreground"
                  aria-label="Copy order ID"
                >
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}

            {/* Open Bot Button — Primary CTA */}
            <button
              onClick={openBot}
              className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Send className="h-4 w-4" /> Open @{BOT_USERNAME}
            </button>
            <button
              onClick={goHome}
              className="mt-2 w-full h-11 rounded-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 transition"
            >
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
            <p className="mt-2 text-sm text-muted-foreground max-w-xs break-words">
              {checkoutState.message}
            </p>
            {/* Direct bot fallback */}
            <button
              onClick={() => openTelegramLink(`https://t.me/${BOT_USERNAME}`)}
              className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition inline-flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" /> Contact @{BOT_USERNAME} directly
            </button>
            <button
              onClick={back}
              className="mt-2 w-full h-11 rounded-full text-sm text-muted-foreground hover:text-foreground transition"
            >
              Back to cart
            </button>
          </div>
        )}

        {/* Idle */}
        {checkoutState.status === "idle" && (
          <div className="p-8 flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <button
              onClick={goHome}
              className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              Browse Stories
            </button>
          </div>
        )}
      </div>

      {/* Cart items preview */}
      {cart.length > 0 && (checkoutState.status === "processing" || checkoutState.status === "success") && (
        <div className="mt-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground px-1 mb-2">
            {checkoutState.status === "success" ? "Added to your library" : "Items"}
          </div>
          <div className="rounded-2xl bg-surface divide-y divide-border overflow-hidden">
            {cart.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3">
                <StoryThumb poster={s.poster} title={s.title} genre={s.genre} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.platform} · {s.genre}</div>
                </div>
                <div className="text-sm font-semibold">₹{s.price}</div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display font-bold text-primary">₹{total}</span>
            </div>
          </div>
        </div>
      )}
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
