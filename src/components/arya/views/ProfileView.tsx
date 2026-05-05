import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Settings, LifeBuoy, FileText,
  Trash2, User, Gift, HelpCircle, ScrollText, Receipt, Copy, Check, AlertTriangle,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Skeleton } from "@/components/ui/skeleton";
import { openTelegramLink, BASE_URL } from "@/lib/api";
import { InfoDialog, type InfoDialogKind } from "../InfoDialog";
import { TERMS_TEXT, REFUND_TEXT } from "../legal-content";

const SUPPORT_URL = "https://t.me/AryaPremiumSupport";

type TelegramUser = {
  id?: number; name: string; username: string;
  photoUrl: string | null; initials: string;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function safePhoto(url: unknown): string | null {
  const s = str(url);
  if (!s) return null;
  try { const u = new URL(s); return u.protocol === "https:" ? u.toString() : null; } catch { return null; }
}

function buildInitials(first: string, last: string, username: string): string {
  return ((first?.[0] || username?.[0] || "") + (last?.[0] || "")).toUpperCase() || "U";
}

function readTelegramUser(): TelegramUser | null {
  if (typeof window === "undefined") return null;
  try {
    const u = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (!u || typeof u !== "object") return null;
    const first = str(u.first_name), last = str(u.last_name), username = str(u.username);
    return {
      id: typeof u.id === "number" ? u.id : undefined,
      name: [first, last].filter(Boolean).join(" ") || username || "Telegram User",
      username,
      photoUrl: safePhoto(u.photo_url),
      initials: buildInitials(first, last, username),
    };
  } catch { return null; }
}

// ─── Delete Account Dialog ─────────────────────────────────
function DeleteAccountDialog({ onClose, telegramId }: { onClose: () => void; telegramId: number | null }) {
  const [step, setStep] = useState<"warn" | "confirm" | "done" | "error">("warn");
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setStep("confirm"); // processing
    try {
      const res = await fetch(`${BASE_URL}/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: telegramId }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStep("done");
    } catch (e: any) {
      setError(e.message || "Failed");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 mb-6 sm:mb-0 rounded-2xl bg-card border border-border p-6 animate-sheet-up shadow-2xl">
        {step === "warn" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/15 grid place-items-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="font-display font-bold text-lg">Delete Account</div>
                <div className="text-xs text-muted-foreground">This action has a 30-day grace period</div>
              </div>
            </div>

            <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-4 space-y-2 text-sm mb-5">
              <div className="font-semibold text-destructive">⚠️ Before you proceed:</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• Your account will be <b>scheduled for deletion</b>, not deleted instantly</li>
                <li>• You have <b>30 days</b> to cancel by contacting support</li>
                <li>• After 30 days, all your data, purchase history, and library will be permanently erased</li>
                <li>• <b>Purchased stories cannot be recovered</b> after deletion</li>
                <li>• Refunds are not provided for existing purchases (see Refund Policy)</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 h-11 rounded-full border border-border text-sm font-semibold transition hover:bg-surface">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 h-11 rounded-full bg-destructive text-white text-sm font-semibold transition active:scale-95">
                Schedule Deletion
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-full border-2 border-destructive border-t-transparent animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Processing your request…</p>
          </div>
        )}

        {step === "done" && (
          <div className="py-4 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/15 grid place-items-center mb-4">
              <Trash2 className="h-7 w-7 text-destructive" />
            </div>
            <div className="font-bold text-lg mb-2">Deletion Scheduled</div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your account is scheduled for permanent deletion in <b>30 days</b>.<br /><br />
              To cancel, contact <a href="https://t.me/AryaPremiumSupport" className="text-primary underline">@AryaPremiumSupport</a> within this period.
            </p>
            <button onClick={onClose}
              className="mt-5 h-11 px-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition">
              Close
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="py-4 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/15 grid place-items-center mb-4">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div className="font-bold text-lg mb-2">Something went wrong</div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2 mt-5 w-full">
              <button onClick={onClose} className="flex-1 h-11 rounded-full border border-border text-sm font-semibold">Cancel</button>
              <button onClick={() => setStep("warn")} className="flex-1 h-11 rounded-full bg-destructive text-white text-sm font-semibold">Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ProfileView ──────────────────────────────────────
export function ProfileView() {
  const { navigate, purchased, tgUser } = useApp();
  const [tgProfile, setTgProfile] = useState<TelegramUser | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<InfoDialogKind>(null);
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tg = (window as any).Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    const t = setTimeout(() => {
      if (cancelled) return;
      setTgProfile(readTelegramUser());
      setLoading(false);
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const displayName = tgProfile?.name || "Guest";
  const initials    = tgProfile?.initials || "G";
  const showPhoto   = useMemo(() => Boolean(tgProfile?.photoUrl) && !photoFailed, [tgProfile?.photoUrl, photoFailed]);
  const telegramId  = tgUser.telegram_id ?? tgProfile?.id ?? null;
  const username    = tgUser.username || tgProfile?.username || "";

  const copyId = async () => {
    if (telegramId == null) return;
    try { await navigator.clipboard.writeText(String(telegramId)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  if (loading) {
    return (
      <div className="animate-fade-in px-4 pt-3">
        <h1 className="font-display font-bold text-xl">Profile</h1>
        <div className="mt-4 p-4 rounded-2xl bg-surface space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 pt-3 pb-6">
      <h1 className="font-display font-bold text-xl">Profile</h1>

      {/* Identity card */}
      <div className="mt-4 p-4 rounded-2xl bg-surface">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-primary/20 grid place-items-center text-primary overflow-hidden font-semibold">
            {showPhoto ? (
              <img src={tgProfile!.photoUrl!} alt={displayName}
                referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)}
                className="h-full w-full object-cover" />
            ) : tgProfile ? (
              <span aria-label={displayName}>{initials}</span>
            ) : (
              <User className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{displayName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {username ? `@${username}` : "Open inside Telegram to sign in"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {purchased.length} {purchased.length === 1 ? "story" : "stories"} owned
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-background/60 px-3 py-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Telegram ID</span>
          <span className="ml-auto font-mono text-sm">{telegramId ?? "—"}</span>
          <button onClick={copyId} disabled={telegramId == null}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
            aria-label="Copy Telegram ID">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="mt-4 rounded-2xl bg-surface divide-y divide-border overflow-hidden">
        <Item icon={Gift}       label="Refer & Earn"       badge="Coming Soon" />
        <Item icon={HelpCircle} label="FAQ"                onClick={() => setDialog("faq")} />
        <Item icon={LifeBuoy}   label="Admin Support"      onClick={() => openTelegramLink(SUPPORT_URL)} />
        <Item icon={ScrollText} label="Terms & Conditions" onClick={() => setDialog("terms")} />
        <Item icon={Receipt}    label="Refund Policy"      onClick={() => setDialog("refund")} />
        <Item icon={Settings}   label="Settings"           onClick={() => navigate({ name: "settings" })} />
        <Item icon={FileText}   label="About" />
      </div>

      {/* Delete Account — separate red section */}
      <div className="mt-4 rounded-2xl bg-surface overflow-hidden">
        <button
          onClick={() => setShowDelete(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-destructive/5 transition"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <div className="flex-1">
            <span className="text-sm font-medium text-destructive">Delete Account</span>
            <div className="text-[11px] text-muted-foreground mt-0.5">30-day grace period · Permanent after that</div>
          </div>
          <ChevronRight className="h-4 w-4 text-destructive/50" />
        </button>
      </div>

      <InfoDialog kind={dialog} onOpenChange={(o) => !o && setDialog(null)} termsText={TERMS_TEXT} refundText={REFUND_TEXT} />
      {showDelete && <DeleteAccountDialog onClose={() => setShowDelete(false)} telegramId={telegramId} />}
    </div>
  );
}

function Item({ icon: Icon, label, onClick, badge }: {
  icon: typeof Settings; label: string; onClick?: () => void; badge?: string;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-background/50 transition text-left">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">{badge}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
