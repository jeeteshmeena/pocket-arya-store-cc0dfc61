import { useEffect, useRef, useState } from "react";
import { X, Mail, Send, Check, FileText, Shield, HelpCircle, Sparkles, Truck, Receipt, MessageSquare } from "lucide-react";
import { FAQ_ITEMS, ABOUT_TEXT, TERMS_TEXT, REFUND_TEXT, PRIVACY_TEXT, DELIVERY_TEXT } from "./legal-content";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export type InfoDialogKind = "terms" | "refund" | "faq" | "about" | "privacy" | "delivery" | "contact" | null;

const META: Record<NonNullable<InfoDialogKind>, { title: string; icon: React.ReactNode }> = {
  terms:    { title: "Terms of Service", icon: <FileText className="h-4 w-4" /> },
  refund:   { title: "Refund Policy",     icon: <Receipt className="h-4 w-4" /> },
  faq:      { title: "Help & FAQ",        icon: <HelpCircle className="h-4 w-4" /> },
  about:    { title: "About Arya Premium", icon: <Sparkles className="h-4 w-4" /> },
  privacy:  { title: "Privacy Policy",    icon: <Shield className="h-4 w-4" /> },
  delivery: { title: "Delivery Policy",   icon: <Truck className="h-4 w-4" /> },
  contact:  { title: "Contact Support",   icon: <MessageSquare className="h-4 w-4" /> },
};

// Pair tabs for terms/privacy/refund (like reference image)
const TAB_GROUP: Partial<Record<NonNullable<InfoDialogKind>, NonNullable<InfoDialogKind>[]>> = {
  terms:   ["terms", "privacy"],
  privacy: ["terms", "privacy"],
};

/* ── Premium Bottom-Sheet (smooth) ── */
export function InfoDialog({
  kind,
  onOpenChange,
}: {
  kind: InfoDialogKind;
  onOpenChange: (open: boolean) => void;
}) {
  const open = kind !== null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef  = useRef<HTMLDivElement>(null);
  const { theme } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<NonNullable<InfoDialogKind> | null>(null);
  const [closing, setClosing] = useState(false);

  // Track active tab when opened
  useEffect(() => {
    if (kind) setActiveTab(kind);
  }, [kind]);

  const tabs = activeTab ? TAB_GROUP[activeTab] : undefined;
  const current = activeTab ?? kind;

  const copyEmail = () => {
    try {
      navigator.clipboard.writeText("Support.AaryaPremium@gmail.com");
      setCopied(true);
      import("@/lib/haptics").then(m => m.haptics.light());
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Reset scroll when content changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [current]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setActiveTab(null);
      onOpenChange(false);
    }, 240);
  };

  if (!open || !current) return null;
  const meta = META[current];

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      {/* Backdrop — smooth fade */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        style={{ animation: closing ? "info-backdrop-out 0.24s ease both" : "info-backdrop-in 0.28s ease both" }}
      />

      {/* Sheet — smooth slide+scale */}
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full sm:max-w-lg max-h-[88vh] flex flex-col bg-card text-card-foreground border border-border/60 overflow-hidden",
          "rounded-t-[28px] sm:rounded-[28px]",
          "shadow-[0_-30px_80px_rgba(0,0,0,0.40)] sm:shadow-[0_30px_80px_rgba(0,0,0,0.40)]",
        )}
        style={{
          animation: closing
            ? "info-sheet-out 0.28s cubic-bezier(0.4,0,1,1) both"
            : "info-sheet-in 0.42s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-foreground/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 pt-3 sm:pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center text-foreground shrink-0">
              {meta.icon}
            </div>
            <h2 className="font-display font-extrabold text-[18px] tracking-tight truncate">
              {meta.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="h-9 w-9 grid place-items-center rounded-full bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground active:scale-90 transition shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs (only when paired, like Terms ↔ Privacy) */}
        {tabs && (
          <div className="px-5 pb-3 shrink-0">
            <div className="inline-flex p-1 rounded-2xl bg-muted w-full">
              {tabs.map((t) => {
                const m = META[t];
                const active = activeTab === t;
                return (
                  <button
                    key={t}
                    onClick={() => { import("@/lib/haptics").then(h => h.haptics.light()); setActiveTab(t); }}
                    className={cn(
                      "flex-1 h-10 rounded-xl inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-all",
                      active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m.icon}
                    <span className="truncate">{m.title.replace(" Policy", "").replace(" of Service", "")}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-px bg-border/60 shrink-0" />

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-5 scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
          key={current /* re-trigger fade on tab switch */}
        >
          <div style={{ animation: "info-content-in 0.32s cubic-bezier(0.16,1,0.3,1) both" }}>
            {current === "faq" ? (
              <div className="space-y-3 pb-4">
                {FAQ_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-4 rounded-2xl border transition",
                      theme === "cream" ? "neo-card bg-white" : "bg-surface border-border/60 hover:border-border"
                    )}
                  >
                    <div className={cn("text-[14px]", theme === "cream" ? "font-extrabold text-black" : "font-bold text-foreground")}>
                      {item.q}
                    </div>
                    <div className={cn("text-[13px] mt-1.5 leading-relaxed", theme === "cream" ? "font-medium text-black/70" : "text-muted-foreground")}>
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            ) : current === "about" ? (
              <div className={cn("p-5 rounded-2xl border", theme === "cream" ? "neo-card bg-white" : "bg-surface border-border/60")}>
                <p className={cn("text-[13.5px] whitespace-pre-line leading-relaxed", theme === "cream" ? "font-medium text-black/80" : "text-muted-foreground")}>
                  {ABOUT_TEXT}
                </p>
              </div>
            ) : current === "contact" ? (
              <div className="space-y-3">
                <a
                  href="https://t.me/ItsNewtonPlanet"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 p-4 w-full text-left bg-surface border border-border/60 rounded-2xl hover:bg-muted transition active:scale-[0.98]"
                >
                  <div className="h-11 w-11 shrink-0 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <Send className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[14px]">Telegram Support</div>
                    <div className="text-[12px] mt-0.5 text-muted-foreground truncate">@ItsNewtonPlanet</div>
                  </div>
                </a>
                <button
                  onClick={copyEmail}
                  className="flex items-center gap-4 p-4 w-full text-left bg-surface border border-border/60 rounded-2xl hover:bg-muted transition active:scale-[0.98]"
                >
                  <div className={cn(
                    "h-11 w-11 shrink-0 grid place-items-center rounded-xl transition",
                    copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary"
                  )}>
                    {copied ? <Check className="h-5 w-5" strokeWidth={3} /> : <Mail className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className={cn("font-bold text-[14px]", copied && "text-emerald-500")}>
                      {copied ? "Copied to Clipboard" : "Email Support"}
                    </div>
                    <div className="text-[12px] mt-0.5 text-muted-foreground truncate">Support.AaryaPremium@gmail.com</div>
                  </div>
                </button>
              </div>
            ) : (
              <LegalSections
                text={
                  current === "terms"    ? TERMS_TEXT    :
                  current === "refund"   ? REFUND_TEXT   :
                  current === "privacy"  ? PRIVACY_TEXT  :
                  current === "delivery" ? DELIVERY_TEXT : ""
                }
                themeMode={theme === "cream" ? "cream" : "default"}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Splits long legal text into numbered cards ────────────────
function LegalSections({ text, themeMode }: { text: string; themeMode: "cream" | "default" }) {
  // Split on blank lines OR numbered headings ("1. Title")
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 pb-4">
      {blocks.map((block, i) => {
        // Detect "1. Heading\nbody..." pattern
        const m = block.match(/^(\d+\.\s*[^\n]+)\n([\s\S]+)$/);
        const heading = m ? m[1] : null;
        const body = m ? m[2] : block;

        return (
          <div
            key={i}
            className={cn(
              "rounded-2xl border p-4",
              themeMode === "cream" ? "neo-card bg-white" : "bg-surface border-border/60"
            )}
            style={{ animation: `info-content-in 0.4s cubic-bezier(0.16,1,0.3,1) both`, animationDelay: `${i * 35}ms` }}
          >
            {heading && (
              <div className={cn(
                "text-[14px] mb-1.5",
                themeMode === "cream" ? "font-extrabold text-black" : "font-bold text-foreground"
              )}>
                {heading}
              </div>
            )}
            <p className={cn(
              "text-[13px] leading-relaxed whitespace-pre-line",
              themeMode === "cream" ? "font-medium text-black/75" : "text-muted-foreground"
            )}>
              {body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
