import { useApp } from "@/store/app-store";
import { Send, Library, ShoppingBag } from "lucide-react";
import { openTelegramLink } from "@/lib/api";

const BOT_USERNAME = "UseAaryaBot";

export function MyStoriesView() {
  const { purchased, navigate } = useApp();

  const openInBot = (storyId: string) => {
    // Deep-link to bot with story id — bot handles delivery
    openTelegramLink(`https://t.me/${BOT_USERNAME}?start=story_${storyId}`);
  };

  return (
    <div className="animate-fade-in px-4 pt-3 pb-8">
      <h1 className="font-display font-bold text-xl pfm:text-2xl">My Stories</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Stories are delivered via Telegram bot <span className="text-primary font-medium">@{BOT_USERNAME}</span>
      </p>

      {purchased.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-surface grid place-items-center">
            <Library className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">No purchased stories yet</p>
          <button
            onClick={() => navigate({ name: "explore" })}
            className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" /> Browse Stories
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {purchased.map((s) => (
            <div key={s.id} className="flex gap-3 p-3 rounded-2xl bg-surface">
              {/* Image with gradient fallback */}
              <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                {s.poster?.startsWith("http") ? (
                  <img src={s.poster} alt={s.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-primary font-bold text-center px-1 leading-tight">{s.title.slice(0, 20)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {s.episodes && s.episodes !== "?" ? `${s.episodes} episodes` : s.platform}
                </div>
                <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  ✓ Purchased
                </span>
              </div>
              <button
                onClick={() => openInBot(s.id)}
                className="self-center h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Send className="h-3.5 w-3.5" /> Get in Bot
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
