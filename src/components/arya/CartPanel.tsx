import { X, Trash2 } from "lucide-react";
import { useApp } from "@/store/app-store";

export function CartPanel() {
  const {
    cartOpen, setCartOpen, cart, removeFromCart, navigate,
    goToCheckout,
  } = useApp();

  if (!cartOpen) return null;
  const total = cart.reduce((a, b) => a + b.price, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    goToCheckout();
  };

  const openDetail = (id: string) => {
    setCartOpen(false);
    navigate({ name: "detail", storyId: id });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-surface text-foreground border-l border-border flex flex-col animate-slide-in-right shadow-2xl">
        <div className="h-14 px-4 flex items-center justify-between border-b border-border">
          <div className="font-display font-bold">Your Cart</div>
          <button onClick={() => setCartOpen(false)} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {cart.length === 0 && (
            <div className="text-center text-muted-foreground text-sm pt-20">Your cart is empty</div>
          )}
          {cart.map((s) => (
            <div key={s.id} className="flex gap-3 p-2 rounded-xl bg-surface">
              <button
                onClick={() => openDetail(s.id)}
                className="flex flex-1 min-w-0 gap-3 text-left active:scale-[0.99] transition"
                aria-label={`Open ${s.title}`}
              >
                <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {s.poster ? (
                    <img src={s.poster} alt={s.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.platform} · {s.genre}</div>
                  <div className="text-sm font-semibold mt-1">₹{s.price}</div>
                </div>
              </button>
              <button
                onClick={() => removeFromCart(s.id)}
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-background text-muted-foreground self-center"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display font-bold text-lg">₹{total}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition"
            >
              Checkout →
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
