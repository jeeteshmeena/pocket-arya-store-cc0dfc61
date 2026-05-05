import { useState } from "react";
import { X, Lock, CheckCircle2, Send } from "lucide-react";
import { useApp } from "@/store/app-store";

export function PaymentModal() {
  const { paymentItems, endCheckout, purchase, clearCart, setSuccessOpen, successOpen } = useApp();
  const [processing, setProcessing] = useState(false);

  if (!paymentItems && !successOpen) return null;

  if (successOpen) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-fade-in">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/15 grid place-items-center animate-scale-in">
            <CheckCircle2 className="h-11 w-11 text-primary" />
          </div>
          <h2 className="mt-5 font-display font-bold text-2xl">Payment successful</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Thanks for your purchase. Your story is on its way.
          </p>

          <div className="mt-6 w-full max-w-sm rounded-2xl bg-surface border border-border p-4 text-left">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Send className="h-3.5 w-3.5" /> Telegram delivery
            </div>
            <p className="mt-2 text-sm leading-relaxed">
              Open the Arya bot on Telegram to receive your audio files and start listening. Delivery usually takes a few seconds.
            </p>
          </div>
        </div>

        <div className="p-5 pb-7 space-y-2 border-t border-border bg-background">
          <button
            onClick={() => setSuccessOpen(false)}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Send className="h-4 w-4" /> Open Telegram Bot
          </button>
          <button
            onClick={() => setSuccessOpen(false)}
            className="w-full h-11 rounded-full text-sm text-muted-foreground hover:text-foreground transition"
          >
            Back to app
          </button>
        </div>
      </div>
    );
  }

  const items = paymentItems!;
  const total = items.reduce((a, b) => a + b.price, 0);

  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      purchase(items);
      clearCart();
      endCheckout();
      setProcessing(false);
      setSuccessOpen(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="font-display font-bold">Razorpay Checkout</div>
          <button onClick={endCheckout} className="h-8 w-8 grid place-items-center rounded-full hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="truncate pr-2">{s.title}</span>
              <span className="font-semibold">₹{s.price}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total payable</span>
          <span className="font-display font-bold text-lg">₹{total}</span>
        </div>
        <button
          onClick={pay}
          disabled={processing}
          className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-70"
        >
          <Lock className="h-4 w-4" />
          {processing ? "Processing..." : `Pay ₹${total}`}
        </button>
        <p className="text-[11px] text-muted-foreground text-center mt-3">Secured by Razorpay (mock)</p>
      </div>
    </div>
  );
}
