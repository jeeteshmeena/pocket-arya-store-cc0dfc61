import { ChevronRight, Settings, LifeBuoy, FileText, LogOut, User } from "lucide-react";
import { useApp } from "@/store/app-store";

export function ProfileView() {
  const { navigate, purchased } = useApp();
  return (
    <div className="animate-fade-in px-4 pt-3">
      <h1 className="font-display font-bold text-xl pfm:text-2xl">Profile</h1>
      <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-surface">
        <div className="h-12 w-12 rounded-full bg-primary/20 grid place-items-center text-primary">
          <User className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Telegram User</div>
          <div className="text-xs text-muted-foreground">@arya_premium · {purchased.length} stories</div>
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
      <Icon className="h-4.5 w-4.5 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
