import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { FAQ_ITEMS, ABOUT_TEXT } from "./legal-content";

type Kind = "terms" | "refund" | "faq" | "about" | null;

const TITLES: Record<NonNullable<Kind>, string> = {
  terms:  "Terms & Conditions",
  refund: "Refund Policy",
  faq:    "FAQ",
  about:  "About Arya Premium",
};

/* ── Custom bottom-sheet modal — no Radix zoom animation ── */
export function InfoDialog({
  kind,
  onOpenChange,
  termsText,
  refundText,
}: {
  kind: Kind;
  onOpenChange: (open: boolean) => void;
  termsText: string;
  refundText: string;
}) {
  const open = kind !== null;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll when kind changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [kind]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  const title = TITLES[kind!];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet — slides up from bottom */}
      <div
        className="relative w-full max-w-2xl bg-surface text-foreground rounded-t-3xl border-t border-border shadow-2xl animate-slide-up"
        style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0 border-b border-border">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {kind === "faq" ? (
            <div className="space-y-5 pb-6">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="text-sm font-semibold text-foreground">{item.q}</div>
                  <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.a}</div>
                </div>
              ))}
            </div>
          ) : kind === "about" ? (
            /* About — styled with section headers */
            <div className="pb-6">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {ABOUT_TEXT}
              </p>
              <div className="mt-5 rounded-xl bg-muted p-3 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick Contact</div>
                <div className="text-sm font-semibold">@UseAryaBot</div>
                <div className="text-xs text-muted-foreground">Telegram · Instant delivery</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pb-6">
              {kind === "terms" ? termsText : kind === "refund" ? refundText : ""}
            </p>
          )}
        </div>

        {/* Footer close button */}
        <div className="shrink-0 px-5 pt-3 pb-5 border-t border-border">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export type { Kind as InfoDialogKind };
