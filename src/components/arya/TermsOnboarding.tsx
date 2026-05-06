import { useEffect, useState } from "react";
import { TERMS_TEXT } from "./legal-content";

const STORAGE_KEY = "arya_tc_accepted";

export function TermsOnboarding() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const accepted = localStorage.getItem(STORAGE_KEY) === "1";
      if (!accepted) {
        setOpen(true);
        // Small delay so slide-up animation runs after mount
        setTimeout(() => setVisible(true), 10);
      }
    } catch {
      setOpen(true);
      setTimeout(() => setVisible(true), 10);
    }
  }, []);

  const accept = () => {
    setVisible(false);
    setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setOpen(false);
    }, 280);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      {/* Backdrop — simple fade */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Sheet — slides up from bottom */}
      <div
        className="relative w-full max-w-2xl bg-surface text-foreground rounded-t-3xl border-t border-border shadow-2xl"
        style={{
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 shrink-0">
          <h2 className="font-display font-bold text-lg">Terms & Conditions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Please review and accept to continue using Arya Premium.
          </p>
        </div>

        <div className="border-t border-border shrink-0" />

        {/* Scrollable T&C */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pb-4">
            {TERMS_TEXT}
          </p>
        </div>

        {/* Accept button */}
        <div className="shrink-0 px-5 pt-3 pb-6 border-t border-border">
          <button
            onClick={accept}
            className="w-full h-12 rounded-full bg-foreground text-background font-bold text-sm active:scale-[0.98] transition"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
