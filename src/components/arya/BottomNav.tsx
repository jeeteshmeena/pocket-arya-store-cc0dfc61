import { Home, Compass, Library, User } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "mystories", label: "My Stories", icon: Library },
  { id: "profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { view, navigate, theme } = useApp();
  const current = view.name;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className={cn(
        "mx-auto max-w-2xl px-3 pb-3",
        theme === "pfm" ? "pt-2" : "pt-2"
      )}>
        <div className={cn(
          "bg-card/95 backdrop-blur-xl border border-border flex items-center justify-around",
          theme === "pfm"
            ? "rounded-full px-2 py-1.5 shadow-lg"
            : "rounded-2xl px-1 py-1"
        )}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = current === t.id;
            return (
              <button
                key={t.id}
                onClick={() => navigate({ name: t.id as never })}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 transition-all",
                  theme === "pfm" && active && "bg-primary text-primary-foreground rounded-full font-semibold py-2.5",
                  theme === "pfm" && !active && "text-muted-foreground",
                  theme === "default" && active && "text-primary",
                  theme === "default" && !active && "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", theme === "pfm" && active && "h-4.5 w-4.5")} strokeWidth={active ? 2.4 : 1.8} />
                <span className={cn(
                  "text-[10px] font-medium",
                  theme === "pfm" && "text-[11px]"
                )}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
