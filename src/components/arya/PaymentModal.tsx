import { useState } from "react";
import { X, Lock, CheckCircle2, Send } from "lucide-react";
import { useApp } from "@/store/app-store";

export function PaymentModal() {
  const { paymentItems, endCheckout, purchase, clearCart, setSuccessOpen, successOpen } = useApp();
  const [processing, setProcessing] = useState(false);

  if (!paymentItems && !successOpen) return null;

  if (successOpen) {
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur grid place-items-center p-6 animate-fade-in">
        <div className="text-center max-w-sm">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/15 grid place-items-center">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h2 className="mt-4 font-display font-bold text-xl">Payment successful</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your story will be delivered via Telegram bot shortly.
          </p>
          <button
            onClick={() => setSuccessOpen(false)}
            className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold"
          >
            <Send className="h-4 w-4" /> Open Telegram Bot
          </button>
          <button
            onClick={() => setSuccessOpen(false)}
            className="block mx-auto mt-3 text-xs text-muted-foreground"
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
