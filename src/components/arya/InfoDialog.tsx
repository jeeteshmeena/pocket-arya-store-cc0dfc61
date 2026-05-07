import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, Send, Check } from "lucide-react";
import { FAQ_ITEMS, ABOUT_TEXT, TERMS_TEXT, REFUND_TEXT, PRIVACY_TEXT, DELIVERY_TEXT } from "./legal-content";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export type InfoDialogKind = "terms" | "refund" | "faq" | "about" | "privacy" | "delivery" | "contact" | null;

const TITLES: Record<NonNullable<InfoDialogKind>, string> = {
  terms:    "Terms & Conditions",
  refund:   "Refund Policy",
  faq:      "FAQ",
  about:    "About Arya Premium",
  privacy:  "Privacy Policy",
  delivery: "Delivery Policy",
  contact:  "Contact Us",
};

/* ── Full Screen App-Style Page ── */
export function InfoDialog({
  kind,
  onOpenChange,
}: {
  kind: InfoDialogKind;
  onOpenChange: (open: boolean) => void;
}) {
  const open = kind !== null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useApp();
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    try {
      navigator.clipboard.writeText("Support.AaryaPremium@gmail.com");
      setCopied(true);
      import("@/lib/haptics").then(m => m.haptics.light());
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

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
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-fade-in">
      {/* Header with Back Button */}
      <div className={cn("flex items-center gap-3 px-2 h-14 shrink-0 shadow-sm", theme === "cream" ? "border-b-4 border-black bg-[#FFE066]" : "border-b border-border bg-surface")}>
        <button
          onClick={() => onOpenChange(false)}
          className={cn("h-10 w-10 grid place-items-center transition active:scale-95", theme === "cream" ? "neo-button bg-white text-black !h-9 !w-9" : "rounded-full hover:bg-muted")}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className={cn("font-display", theme === "cream" ? "font-extrabold text-xl text-black" : "font-bold text-lg")}>{title}</h2>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto px-4 py-5 scroll-smooth", theme === "cream" ? "bg-muted/30" : "")}
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
              </div>
            </div>
          ) : kind === "contact" ? (
            <div className="pb-6 space-y-4">
              <a
                href="https://t.me/ItsNewtonPlanet"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "flex items-center gap-4 p-4 w-full text-left transition active:scale-[0.98]",
                  theme === "cream" ? "neo-card bg-[#FFE066] hover:bg-[#FFD633]" : "bg-surface border border-border rounded-xl hover:bg-muted"
                )}
              >
                <div className={cn("h-10 w-10 shrink-0 grid place-items-center rounded-full", theme === "cream" ? "bg-white border-2 border-black" : "bg-primary/10 text-primary")}>
                  <Send className={cn("h-5 w-5", theme === "cream" ? "text-black" : "")} />
                </div>
                <div>
                  <div className={cn("font-bold", theme === "cream" ? "text-black" : "")}>Telegram Support</div>
                  <div className={cn("text-xs mt-0.5", theme === "cream" ? "text-black/70 font-semibold" : "text-muted-foreground")}>@ItsNewtonPlanet</div>
                </div>
              </a>
              <button
                onClick={copyEmail}
                className={cn(
                  "flex items-center gap-4 p-4 w-full text-left transition active:scale-[0.98]",
                  theme === "cream" ? "neo-card bg-white hover:bg-gray-50" : "bg-surface border border-border rounded-xl hover:bg-muted"
                )}
              >
                <div className={cn("h-10 w-10 shrink-0 grid place-items-center rounded-full transition-colors", 
                  copied ? "bg-emerald-100 text-emerald-600 border-emerald-600" :
                  theme === "cream" ? "bg-[#FFE066] border-2 border-black" : "bg-primary/10 text-primary")}>
                  {copied ? <Check className="h-5 w-5" /> : <Mail className={cn("h-5 w-5", theme === "cream" ? "text-black" : "")} />}
                </div>
                <div>
                  <div className={cn("font-bold", copied ? "text-emerald-600" : theme === "cream" ? "text-black" : "")}>
                    {copied ? "Copied to Clipboard!" : "Email Support"}
                  </div>
                  <div className={cn("text-xs mt-0.5", theme === "cream" ? "text-black/70 font-semibold" : "text-muted-foreground")}>Support.AaryaPremium@gmail.com</div>
                </div>
              </button>
            </div>
          ) : (
            <div className={cn("pb-6", theme === "cream" ? "p-5 neo-card bg-white" : "")}>
              <p className={cn("text-sm whitespace-pre-line leading-relaxed", theme === "cream" ? "font-medium text-black/80" : "text-muted-foreground")}>
                {kind === "terms" ? TERMS_TEXT : kind === "refund" ? REFUND_TEXT : kind === "privacy" ? PRIVACY_TEXT : kind === "delivery" ? DELIVERY_TEXT : ""}
              </p>
            </div>
          )}
        </div>
    </div>
  );
}
