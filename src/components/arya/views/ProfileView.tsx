import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Settings,
  LifeBuoy,
  FileText,
  LogOut,
  User,
  Gift,
  HelpCircle,
  ScrollText,
  Receipt,
  Copy,
  Check,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Skeleton } from "@/components/ui/skeleton";
import { openTelegramLink, BOT_USERNAME } from "@/lib/api";
import { InfoDialog, type InfoDialogKind } from "../InfoDialog";
import { TERMS_TEXT, REFUND_TEXT } from "../legal-content";

const SUPPORT_URL = "https://t.me/AryaPremiumSupport";

type TelegramUser = {
  id?: number;
  name: string;
  username: string;
  photoUrl: string | null;
  initials: string;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function safePhoto(url: unknown): string | null {
  const s = str(url);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function buildInitials(first: string, last: string, username: string): string {
  const a = first?.[0] || username?.[0] || "";
  const b = last?.[0] || "";
  return ((a + b).toUpperCase()) || "U";
}

function readTelegramUser(): TelegramUser | null {
  if (typeof window === "undefined") return null;
  try {
    const tg = (window as any).Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    if (!u || typeof u !== "object") return null;
    const first = str(u.first_name);
    const last = str(u.last_name);
    const username = str(u.username);
    const fullName = [first, last].filter(Boolean).join(" ");
    return {
      id: typeof u.id === "number" ? u.id : undefined,
      name: fullName || username || "Telegram User",
      username,
      photoUrl: safePhoto(u.photo_url),
      initials: buildInitials(first, last, username),
    };
  } catch {
    return null;
  }
}

export function ProfileView() {
  const { navigate, purchased, tgUser } = useApp();
  const [tgProfile, setTgProfile] = useState<TelegramUser | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<InfoDialogKind>(null);
  const [copied, setCopied] = useState(false);

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
  const initials = tgProfile?.initials || "G";
  const showPhoto = useMemo(
    () => Boolean(tgProfile?.photoUrl) && !photoFailed,
    [tgProfile?.photoUrl, photoFailed],
  );

  const telegramId = tgUser.telegram_id ?? tgProfile?.id ?? null;
  const username = tgUser.username || tgProfile?.username || "";

  const copyId = async () => {
    if (telegramId == null) return;
    try {
      await navigator.clipboard.writeText(String(telegramId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (loading) {
    return (
      <div className="animate-fade-in px-4 pt-3">
        <h1 className="font-display font-bold text-xl pfm:text-2xl">Profile</h1>
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
      <h1 className="font-display font-bold text-xl pfm:text-2xl">Profile</h1>

      {/* Identity card */}
      <div className="mt-4 p-4 rounded-2xl bg-surface">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-muted grid place-items-center text-foreground overflow-hidden font-semibold border border-border">
            {showPhoto ? (
              <img
                src={tgProfile!.photoUrl!}
                alt={displayName}
                referrerPolicy="no-referrer"
                onError={() => setPhotoFailed(true)}
                className="h-full w-full object-cover"
              />
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
          <button
            onClick={copyId}
            disabled={telegramId == null}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
            aria-label="Copy Telegram ID"
          >
            {copied ? <Check className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="mt-4 rounded-2xl bg-surface divide-y divide-border overflow-hidden">
        <Item icon={Gift} label="Refer & Earn" badge="Coming Soon" />
        <Item icon={HelpCircle} label="FAQ" onClick={() => setDialog("faq")} />
        <Item
          icon={LifeBuoy}
          label="Admin Support"
          onClick={() => openTelegramLink(SUPPORT_URL)}
        />
        <Item icon={ScrollText} label="Terms & Conditions" onClick={() => setDialog("terms")} />
        <Item icon={Receipt} label="Refund Policy" onClick={() => setDialog("refund")} />
        <Item icon={Settings} label="Settings" onClick={() => navigate({ name: "settings" })} />
        <Item icon={FileText} label="About" onClick={() => setDialog("about")} />
        <Item icon={LogOut} label="Sign out" onClick={() => {
          try { (window as any).Telegram?.WebApp?.close(); } catch {}
        }} />
      </div>

      <InfoDialog
        kind={dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        termsText={TERMS_TEXT}
        refundText={REFUND_TEXT}
      />
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  onClick,
  badge,
}: {
  icon: typeof Settings;
  label: string;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-background/50 transition text-left"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && (
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
