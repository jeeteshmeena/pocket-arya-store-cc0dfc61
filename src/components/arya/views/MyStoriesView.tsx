import { useApp } from "@/store/app-store";
import { Send, Library } from "lucide-react";

export function MyStoriesView() {
  const { purchased } = useApp();
  return (
    <div className="animate-fade-in px-4 pt-3">
      <h1 className="font-display font-bold text-xl pfm:text-2xl">My Stories</h1>
      <p className="text-sm text-muted-foreground mt-1">Delivered via Telegram bot</p>

      {purchased.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-surface grid place-items-center">
            <Library className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">No purchased stories yet</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {purchased.map((s) => (
            <div key={s.id} className="flex gap-3 p-3 rounded-2xl bg-surface">
              <img src={s.poster} alt={s.title} className="h-16 w-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.episodes} episodes · {s.size}</div>
                <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Delivered</span>
              </div>
              <button className="self-center h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" /> Open in Bot
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
