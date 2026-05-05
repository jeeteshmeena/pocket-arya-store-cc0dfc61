import { useEffect, useState } from "react";
import { ChevronRight, Settings, LifeBuoy, FileText, LogOut, User } from "lucide-react";
import { useApp } from "@/store/app-store";

type TelegramUser = { name: string; username: string; photoUrl: string | null; id?: number };

// Reads Telegram WebApp user from window.Telegram.WebApp.initDataUnsafe.user
function readTelegramUser(): TelegramUser | null {
  if (typeof window === "undefined") return null;
  const tg = (window as any).Telegram?.WebApp;
  const u = tg?.initDataUnsafe?.user;
  if (!u) return null;
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return {
    id: u.id,
    name: name || u.username || "Telegram User",
    username: u.username || "",
    photoUrl: u.photo_url || null,
  };
}

export function ProfileView() {
  const { navigate, purchased } = useApp();
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    setTgUser(readTelegramUser());
  }, []);

  const displayName = tgUser?.name || "Guest";
  const handle = tgUser?.username ? `@${tgUser.username}` : "Open inside Telegram to sign in";

  return (
    <div className="animate-fade-in px-4 pt-3">
      <h1 className="font-display font-bold text-xl pfm:text-2xl">Profile</h1>
      <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-surface">
        <div className="h-12 w-12 rounded-full bg-primary/20 grid place-items-center text-primary overflow-hidden">
          {tgUser.photoUrl ? (
            <img src={tgUser.photoUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground truncate">{handle} · {purchased.length} stories</div>
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
