import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Send, Check, FileText, Shield, HelpCircle, Sparkles, Truck, Receipt, MessageSquare, ChevronDown, Ticket, MessageCircle, Lightbulb, Loader2, CheckCircle2 } from "lucide-react";
import { FAQ_ITEMS, ABOUT_TEXT, TERMS_ITEMS, REFUND_ITEMS, PRIVACY_ITEMS, DELIVERY_ITEMS } from "./legal-content";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { BOT_USERNAME, submitSupport } from "@/lib/api";

export type InfoDialogKind = "terms" | "refund" | "faq" | "about" | "privacy" | "delivery" | null;

const META: Record<NonNullable<InfoDialogKind>, { title: string; icon: React.ReactNode }> = {
  terms:    { title: "Terms of Service", icon: <FileText className="h-4 w-4" /> },
  refund:   { title: "Refund Policy",     icon: <Receipt className="h-4 w-4" /> },
  faq:      { title: "Help & FAQ",        icon: <HelpCircle className="h-4 w-4" /> },
  about:    { title: "About Arya Premium", icon: <Sparkles className="h-4 w-4" /> },
  privacy:  { title: "Privacy Policy",    icon: <Shield className="h-4 w-4" /> },
  delivery: { title: "Delivery Policy",   icon: <Truck className="h-4 w-4" /> },
};

// Pair tabs for terms/privacy/refund (like reference image)
const TAB_GROUP: Partial<Record<NonNullable<InfoDialogKind>, NonNullable<InfoDialogKind>[]>> = {
  terms:   ["terms", "privacy"],
  privacy: ["terms", "privacy"],
  delivery: ["delivery", "refund"],
  refund:   ["delivery", "refund"],
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
  const [supportMode, setSupportMode] = useState<"menu" | "support" | "chat" | "suggestion">("menu");

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
  
  const getHeaderTitle = () => {
    if (kind === "terms" || kind === "privacy") return "Terms & Privacy";
    if (kind === "delivery" || kind === "refund") return "Delivery & Refund Policy";
    return meta.title;
  };

  return typeof document !== "undefined" ? createPortal(
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
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
            "relative w-full sm:max-w-lg max-h-[88vh] flex flex-col bg-card text-card-foreground overflow-hidden",
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
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-4 shrink-0">
            <h2 className="font-display font-extrabold text-[22px] tracking-tight truncate">
              {getHeaderTitle()}
            </h2>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground rounded-full transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs (only when paired, like Terms ↔ Privacy) */}
          {tabs && (
            <div className="px-5 pb-5 shrink-0 border-b border-border/40">
              <div className="inline-flex p-1 rounded-xl bg-muted w-full h-[46px]">
                {tabs.map((t) => {
                  const m = META[t];
                  const active = activeTab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => { import("@/lib/haptics").then(h => h.haptics.light()); setActiveTab(t); }}
                      className={cn(
                        "flex-1 h-full rounded-lg inline-flex items-center justify-center gap-2 text-[14px] font-semibold transition-all",
                        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m.icon}
                      <span className="truncate">{m.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+24px)] scroll-smooth"
            style={{ WebkitOverflowScrolling: "touch" }}
            key={current /* re-trigger fade on tab switch */}
          >
            <div style={{ animation: "info-content-in 0.32s cubic-bezier(0.16,1,0.3,1) both" }}>
              {current === "faq" ? (
                <AccordionFAQ theme={theme} />
              ) : current === "about" ? (
                <div className={cn("p-5 rounded-2xl border", theme === "cream" ? "neo-card bg-white" : "bg-surface border-border/60")}>
                  <p className={cn("text-[13.5px] whitespace-pre-line leading-relaxed", theme === "cream" ? "font-medium text-black/80" : "text-muted-foreground")}>
                    {ABOUT_TEXT}
                  </p>
                </div>
              ) : (
                <LegalSections
                  items={
                    current === "terms"    ? TERMS_ITEMS    :
                    current === "refund"   ? REFUND_ITEMS   :
                    current === "privacy"  ? PRIVACY_ITEMS  :
                    current === "delivery" ? DELIVERY_ITEMS : []
                  }
                  themeMode={theme === "cream" ? "cream" : "default"}
                />
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    ) : null
}

// ── Displays legal items in a card list matching the screenshot ──
function LegalSections({ items, themeMode }: { items: { title: string; body: string }[]; themeMode: "cream" | "default" }) {
  return (
    <div className="space-y-3 pb-4">
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "rounded-xl border p-4",
            themeMode === "cream" ? "bg-white border-border/60" : "bg-surface border-border/60"
          )}
          style={{ animation: `info-content-in 0.4s cubic-bezier(0.16,1,0.3,1) both`, animationDelay: `${i * 35}ms` }}
        >
          <div className={cn(
            "text-[14px] mb-2",
            themeMode === "cream" ? "font-bold text-black" : "font-bold text-foreground"
          )}>
            {item.title}
          </div>
          <p className={cn(
            "text-[13px] leading-relaxed whitespace-pre-line",
            themeMode === "cream" ? "font-medium text-black/60" : "text-muted-foreground"
          )}>
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Accordion FAQ ──────────────────────────────────────────────────
function AccordionFAQ({ theme }: { theme: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3 pb-4">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border transition-all overflow-hidden",
              theme === "cream" ? "bg-white border-border/60" : "bg-surface border-border/60"
            )}
            style={{ animation: `info-content-in 0.4s cubic-bezier(0.16,1,0.3,1) both`, animationDelay: `${i * 35}ms` }}
          >
            <button
              onClick={() => { import("@/lib/haptics").then(h => h.haptics.light()); setOpenIdx(isOpen ? null : i); }}
              className="flex w-full items-center justify-between p-4 text-left focus:outline-none"
            >
              <span className={cn(
                "text-[14px]",
                theme === "cream" ? "font-bold text-black" : "font-bold text-foreground"
              )}>{item.q}</span>
              <ChevronDown className={cn("h-5 w-5 transition-transform duration-300 shrink-0 ml-4", theme === "cream" ? "text-black/40" : "text-muted-foreground", isOpen && "rotate-180")} />
            </button>
            <div
              className={cn("px-4 overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[500px] pb-4 opacity-100" : "max-h-0 opacity-0")}
            >
              <p className={cn(
                "text-[13px] leading-relaxed",
                theme === "cream" ? "font-medium text-black/60" : "text-muted-foreground"
              )}>
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SupportForm({ type, onBack, theme }: { type: "support" | "chat" | "suggestion"; onBack: () => void; theme: string }) {
  const { tgUser } = useApp();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!msg.trim() || sending) return;
    setSending(true);
    try {
      await submitSupport({
        telegram_id: tgUser.telegram_id,
        username: tgUser.username,
        first_name: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "Mini App User",
        type,
        message: msg
      });
      setDone(true);
      setTimeout(() => onBack(), 3000);
    } catch (e) {
      alert("Failed to submit. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const titles = {
    support: "Open Support Ticket",
    chat: "Live Chat",
    suggestion: "Submit Suggestion"
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in">
        <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className={cn("font-semibold text-center", theme === "cream" ? "text-black/80" : "text-foreground")}>Submitted Successfully!</p>
        <p className="text-[13px] text-muted-foreground text-center">Our team will get back to you soon.</p>
        <button onClick={onBack} className="mt-2 text-primary font-medium text-[14px]">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3 p-1.5 -ml-1.5 rounded-full hover:bg-muted text-muted-foreground"><ChevronDown className="h-5 w-5 rotate-90" /></button>
        <h3 className={cn("font-bold text-[16px]", theme === "cream" ? "text-black/80" : "text-foreground")}>{titles[type as keyof typeof titles]}</h3>
      </div>
      <textarea
        autoFocus
        value={msg}
        onChange={e => setMsg(e.target.value)}
        placeholder="Type your message here..."
        className={cn(
          "w-full flex-1 min-h-[160px] p-4 text-[14px] border rounded-xl outline-none transition-colors resize-none mb-4",
          theme === "cream" ? "bg-white border-border/60 focus:border-black/20 text-black/80 placeholder:text-black/40" : "bg-muted/30 border-border/60 focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
        )}
      />
      <button 
        onClick={handleSubmit} 
        disabled={!msg.trim() || sending}
        className={cn(
          "h-12 w-full rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50",
          theme === "cream" ? "bg-black text-white hover:bg-black/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending..." : "Submit"}
      </button>
    </div>
  );
}
