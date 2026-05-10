import { X, Trash2 } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { usePriceFormat } from "@/hooks/usePriceFormat";

export function CartPanel() {
  const {
    cartOpen, setCartOpen, cart, removeFromCart, navigate,
    goToCheckout,
  } = useApp();
  const fmt = usePriceFormat();

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
      <aside className={cn("absolute right-0 top-0 h-full w-[88%] max-w-sm flex flex-col animate-slide-in-right shadow-2xl", useApp().theme === "cream" ? "bg-white border-l-4 border-black" : "bg-surface text-foreground border-l border-border")}>
        <div className={cn("h-14 px-4 flex items-center justify-between", useApp().theme === "cream" ? "border-b-4 border-black bg-[#FFE066]" : "border-b border-border")}>
          <div className={cn("font-display", useApp().theme === "cream" ? "font-extrabold text-black text-xl" : "font-bold")}>Your Cart</div>
          <button onClick={() => setCartOpen(false)} className={cn("h-9 w-9 grid place-items-center transition active:scale-95", useApp().theme === "cream" ? "neo-button bg-white text-black" : "rounded-full hover:bg-surface")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {cart.length === 0 && (
            <div className={cn("text-center text-sm pt-20 font-semibold", useApp().theme === "cream" ? "text-black/60" : "text-muted-foreground")}>Your cart is empty</div>
          )}
          {cart.map((s) => (
            <div key={s.id} className={cn("flex gap-3 p-2 relative animate-cart-item-in", useApp().theme === "cream" ? "neo-card bg-white" : "rounded-xl bg-surface")}>
              <button
                onClick={() => openDetail(s.id)}
                className="flex flex-1 min-w-0 gap-3 text-left active:scale-[0.99] transition"
                aria-label={`Open ${s.title}`}
              >
                <div className={cn("h-16 w-16 overflow-hidden shrink-0", useApp().theme === "cream" ? "border-2 border-black rounded-lg shadow-sm" : "rounded-lg bg-muted")}>
                  {s.poster ? (
                    <img src={s.poster} alt={s.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className={cn("text-sm truncate", useApp().theme === "cream" ? "font-bold text-black" : "font-semibold")}>{s.title}</div>
                  <div className={cn("text-xs", useApp().theme === "cream" ? "text-black/60 font-semibold" : "text-muted-foreground")}>{s.platform} · {s.genre}</div>
                  <div className={cn("text-sm mt-1", useApp().theme === "cream" ? "font-extrabold text-black" : "font-semibold")}>{fmt(s.price)}</div>
                </div>
              </button>
              <button
                onClick={() => removeFromCart(s.id)}
                className={cn("h-9 w-9 grid place-items-center self-center transition active:scale-95", useApp().theme === "cream" ? "border-2 border-black bg-[#FF4D4D] text-white rounded-lg shadow-[2px_2px_0px_#000]" : "rounded-full hover:bg-background text-muted-foreground")}
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className={cn("p-4 space-y-4", useApp().theme === "cream" ? "bg-[#CCE5FF] border-t-4 border-black" : "border-t border-border")}>
            <div className="flex items-center justify-between">
              <span className={cn("text-sm uppercase tracking-wider", useApp().theme === "cream" ? "font-bold text-black/60" : "text-muted-foreground")}>Total</span>
              <span className={cn("font-display", useApp().theme === "cream" ? "font-extrabold text-2xl text-black" : "font-bold text-lg")}>{fmt(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className={cn(
                "w-full h-12 font-bold transition active:scale-[0.98] flex items-center justify-center gap-2",
                useApp().theme === "cream" ? "neo-button bg-primary text-primary-foreground text-lg" : "rounded-full bg-primary text-primary-foreground font-semibold"
              )}
            >
              Checkout →
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
