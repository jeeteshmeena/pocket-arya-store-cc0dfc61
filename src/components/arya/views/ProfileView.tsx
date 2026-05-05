import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Settings, LifeBuoy, FileText, LogOut, User } from "lucide-react";
import { useApp } from "@/store/app-store";

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
  const out = (a + b).toUpperCase();
  return out || "U";
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
    const id = typeof u.id === "number" ? u.id : undefined;

    return {
      id,
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
  const { navigate, purchased } = useApp();
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    setTgUser(readTelegramUser());
  }, []);

  const displayName = tgUser?.name || "Guest";
  const handle = tgUser?.username
    ? `@${tgUser.username}`
    : "Open inside Telegram to sign in";
  const initials = tgUser?.initials || "G";
  const showPhoto = useMemo(
    () => Boolean(tgUser?.photoUrl) && !photoFailed,
    [tgUser?.photoUrl, photoFailed],
  );

  return (
    <div className="animate-fade-in px-4 pt-3">
      <h1 className="font-display font-bold text-xl pfm:text-2xl">Profile</h1>
      <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-surface">
        <div className="h-12 w-12 rounded-full bg-primary/20 grid place-items-center text-primary overflow-hidden font-semibold text-sm">
          {showPhoto ? (
            <img
              src={tgUser!.photoUrl!}
              alt={displayName}
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : tgUser ? (
            <span aria-label={displayName}>{initials}</span>
          ) : (
            <User className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground truncate">
            {handle} · {purchased.length} stories
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-surface divide-y divide-border overflow-hidden">
        <Item icon={Settings} label="Settings" onClick={() => navigate({ name: "settings" })} />
        <Item icon={LifeBuoy} label="Support" />
        <Item icon={FileText} label="Terms & Policies" />
        <Item icon={LogOut} label="Sign out" />
      </div>
    </div>
  );
}

function Item({ icon: Icon, label, onClick }: { icon: typeof Settings; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-background/50 transition text-left">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
