import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { FAQ_ITEMS, ABOUT_TEXT } from "./legal-content";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export type InfoDialogKind = "terms" | "refund" | "faq" | "about" | null;

const TITLES: Record<NonNullable<InfoDialogKind>, string> = {
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
  kind: InfoDialogKind;
  onOpenChange: (open: boolean) => void;
  termsText: string;
  refundText: string;
}) {
  const open = kind !== null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useApp();

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
        className={cn(
          "relative w-full max-w-2xl text-foreground animate-slide-up flex flex-col transition-all",
          theme === "cream" ? "bg-white border-t-4 border-black rounded-t-3xl" : "bg-surface rounded-t-3xl border-t border-border shadow-2xl"
        )}
        style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className={cn("h-1.5 w-12 rounded-full", theme === "cream" ? "bg-black/20" : "bg-border")} />
        </div>

        {/* Header */}
        <div className={cn("flex items-center justify-between px-5 pb-3 shrink-0 border-b", theme === "cream" ? "border-black border-b-2" : "border-border")}>
          <h2 className={cn("font-display", theme === "cream" ? "font-extrabold text-2xl text-black" : "font-bold text-lg")}>{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className={cn("h-8 w-8 grid place-items-center transition active:scale-95", theme === "cream" ? "neo-button bg-white text-black !h-9 !w-9" : "rounded-full hover:bg-muted")}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className={cn("flex-1 overflow-y-auto px-5 py-4", theme === "cream" ? "bg-muted/30" : "")}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {kind === "faq" ? (
            <div className="space-y-4 pb-6">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className={cn("p-4", theme === "cream" ? "neo-card bg-white" : "border-b border-border pb-4 last:border-0 last:pb-0 bg-surface rounded-xl")}>
                  <div className={cn("text-sm", theme === "cream" ? "font-extrabold text-black text-[15px]" : "font-semibold text-foreground")}>{item.q}</div>
                  <div className={cn("text-sm mt-1.5 leading-relaxed", theme === "cream" ? "font-medium text-black/70" : "text-muted-foreground")}>{item.a}</div>
                </div>
              ))}
            </div>
          ) : kind === "about" ? (
            /* About — styled with section headers */
            <div className="pb-6">
              <div className={cn("p-5", theme === "cream" ? "neo-card bg-white" : "bg-surface rounded-xl")}>
                <p className={cn("text-sm whitespace-pre-line leading-relaxed", theme === "cream" ? "font-medium text-black/80" : "text-muted-foreground")}>
                  {ABOUT_TEXT}
                </p>
                <div className={cn("mt-5 p-4 space-y-1", theme === "cream" ? "neo-card bg-[#FFE066]" : "rounded-xl bg-muted")}>
                  <div className={cn("text-[10px] uppercase tracking-wider", theme === "cream" ? "font-bold text-black/60" : "text-muted-foreground")}>Quick Contact</div>
                  <div className={cn("text-sm", theme === "cream" ? "font-extrabold text-black" : "font-semibold")}>@UseAryaBot</div>
                  <div className={cn("text-xs", theme === "cream" ? "font-semibold text-black/60" : "text-muted-foreground")}>Telegram · Instant delivery</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn("pb-6", theme === "cream" ? "p-5 neo-card bg-white" : "")}>
              <p className={cn("text-sm whitespace-pre-line leading-relaxed", theme === "cream" ? "font-medium text-black/80" : "text-muted-foreground")}>
                {kind === "terms" ? termsText : kind === "refund" ? refundText : ""}
              </p>
            </div>
          )}
        </div>

        {/* Footer close button */}
        <div className={cn("shrink-0 px-5 pt-3 pb-5 border-t", theme === "cream" ? "border-black border-t-2" : "border-border")}>
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "w-full h-11 text-sm active:scale-[0.98] transition flex items-center justify-center gap-2",
              theme === "cream" ? "neo-button bg-primary text-primary-foreground font-bold text-base" : "rounded-full bg-primary text-primary-foreground font-semibold"
            )}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
