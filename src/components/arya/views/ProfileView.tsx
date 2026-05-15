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
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoDialog, type InfoDialogKind } from "../InfoDialog";
import { cn } from "@/lib/utils";

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
  const { navigate, purchased, tgUser, t, theme } = useApp();
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
        <h1 className="font-display font-bold text-xl">{t("profile.title")}</h1>
        <div className="mt-4 p-4 rounded-2xl bg-surface space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-none" />
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
      <h1 className={cn("font-display font-bold", theme === "cream" ? "text-2xl font-extrabold" : "text-xl")}>{t("profile.title")}</h1>

      {/* Identity card */}
      <div className={cn("mt-4 p-4", theme === "cream" ? "neo-card bg-[#FFE066]" : "rounded-2xl bg-surface")}>
        <div className="flex items-center gap-3">
          <div className={cn("h-14 w-14 grid place-items-center text-foreground overflow-hidden font-semibold", theme === "cream" ? "border-2 border-black bg-white" : "bg-muted border border-border")}>
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
            <div className={cn("font-semibold truncate", theme === "cream" ? "text-black text-lg font-bold" : "")}>{displayName}</div>
            <div className={cn("text-xs truncate", theme === "cream" ? "text-black/70 font-semibold" : "text-muted-foreground")}>
              {username ? `@${username}` : t("profile.signIn")}
            </div>
            <div className={cn("text-[11px] mt-0.5", theme === "cream" ? "text-black/70 font-bold uppercase tracking-widest" : "text-muted-foreground")}>
              {purchased.length} {purchased.length === 1 ? t("story.storyOwned") : t("story.storiesOwned")}
            </div>
          </div>
        </div>

        <div className={cn("mt-3 flex items-center gap-2 px-3 py-2", theme === "cream" ? "bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000]" : "rounded-xl bg-background/60")}>
          <span className={cn("text-[11px] uppercase tracking-wider", theme === "cream" ? "font-bold text-black/60" : "text-muted-foreground")}>{t("profile.telegramId")}</span>
          <span className={cn("ml-auto font-mono text-sm", theme === "cream" ? "font-bold text-black" : "")}>{telegramId ?? "—"}</span>
          <button
            onClick={copyId}
            disabled={telegramId == null}
            className={cn("rounded-md p-1 disabled:opacity-40 transition active:scale-95", theme === "cream" ? "text-black/60 hover:text-black" : "text-muted-foreground hover:text-foreground")}
            aria-label="Copy Telegram ID"
          >
            {copied ? <Check className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className={cn("mt-4 overflow-hidden", theme === "cream" ? "space-y-2" : "rounded-2xl bg-surface divide-y divide-border")}>
        <Item icon={ShieldCheck} label={t("profile.adminPanel")} onClick={() => navigate({ name: "admin" })} isCream={theme === "cream"} />
        <Item icon={Gift} label={t("profile.referEarn")} badge={t("common.comingSoon")} isCream={theme === "cream"} />
        <Item icon={HelpCircle} label={t("profile.faq")} onClick={() => setDialog("faq")} isCream={theme === "cream"} />
        <Item
          icon={LifeBuoy}
          label={t("profile.contactUs")}
          onClick={() => navigate({ name: "support" })}
          isCream={theme === "cream"}
        />
        <Item icon={ScrollText} label={t("profile.terms")} onClick={() => setDialog("terms")} isCream={theme === "cream"} />
        <Item icon={FileText} label={t("profile.privacy")} onClick={() => setDialog("privacy")} isCream={theme === "cream"} />
        <Item icon={FileText} label="Delivery & Refund Policy" onClick={() => setDialog("delivery")} isCream={theme === "cream"} />
        <Item icon={Settings} label={t("profile.settings")} onClick={() => navigate({ name: "settings" })} isCream={theme === "cream"} />
        <Item icon={FileText} label={t("profile.about")} onClick={() => setDialog("about")} isCream={theme === "cream"} />
        <Item icon={LogOut} label={t("profile.signOut")} onClick={() => {
          try { (window as any).Telegram?.WebApp?.close(); } catch {}
        }} isCream={theme === "cream"} />
      </div>

      <InfoDialog
        kind={dialog}
        onOpenChange={(o) => !o && setDialog(null)}
      />
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  onClick,
  badge,
  isCream
}: {
  icon: typeof Settings;
  label: string;
  onClick?: () => void;
  badge?: string;
  isCream?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 transition text-left active:scale-[0.98]",
        isCream ? "neo-card bg-white border-2 border-black shadow-[2px_2px_0px_#000] !rounded-xl" : "hover:bg-background/50"
      )}
    >
      <Icon className={cn("h-4 w-4", isCream ? "text-black" : "text-muted-foreground")} />
      <span className={cn("flex-1 text-sm font-medium", isCream ? "text-black font-bold" : "")}>{label}</span>
      {badge && (
        <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 font-semibold", isCream ? "border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000] rounded-md" : "rounded-full bg-muted text-muted-foreground")}>
          {badge}
        </span>
      )}
      <ChevronRight className={cn("h-4 w-4", isCream ? "text-black" : "text-muted-foreground")} />
    </button>
  );
}
