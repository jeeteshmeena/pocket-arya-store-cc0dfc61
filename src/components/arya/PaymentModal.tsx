import { Loader2, CheckCircle2, AlertCircle, Send, X } from "lucide-react";
import { useApp } from "@/store/app-store";
import { openTelegramLink } from "@/lib/api";

export function PaymentModal() {
  const { checkoutState, resetCheckout } = useApp();
  if (checkoutState.status === "idle") return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">
        {checkoutState.status !== "processing" && (
          <button
            onClick={resetCheckout}
            className="absolute right-5 top-5 h-8 w-8 grid place-items-center rounded-full hover:bg-surface"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {checkoutState.status === "processing" && (
          <div className="flex flex-col items-center text-center py-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <h2 className="mt-4 font-display font-bold text-lg">Preparing your order</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Securing your checkout link. This usually takes a moment.
            </p>
          </div>
        )}

        {checkoutState.status === "success" && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-16 w-16 rounded-full bg-primary/15 grid place-items-center">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <h2 className="mt-4 font-display font-bold text-lg">Order created</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Continue in the Telegram bot to complete payment and receive your stories.
            </p>
            <button
              onClick={() => openTelegramLink(checkoutState.url)}
              className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Send className="h-4 w-4" /> Open Telegram Bot
            </button>
            <button
              onClick={resetCheckout}
              className="mt-2 w-full h-11 rounded-full text-sm text-muted-foreground hover:text-foreground transition"
            >
              Back to app
            </button>
          </div>
        )}

        {checkoutState.status === "error" && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-16 w-16 rounded-full bg-destructive/15 grid place-items-center">
              <AlertCircle className="h-9 w-9 text-destructive" />
            </div>
            <h2 className="mt-4 font-display font-bold text-lg">Checkout failed</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs break-words">
              {checkoutState.message}
            </p>
            <button
              onClick={resetCheckout}
              className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
