import { useState, useMemo, useEffect, useRef } from "react";
import { StoryCard } from "../StoryCard";
import { useApp } from "@/store/app-store";
import { Search, X, Plus, Paperclip, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitSupport, fetchMyRequests } from "@/lib/api";

type RequestDoc = {
  id: string; type: string; text: string; status: string; created_at: string;
};

export function ExploreView() {
  const { stories, theme, tgUser, t } = useApp();
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"explore" | "requests">("explore");

  const [reqName, setReqName] = useState("");
  const [reqPlatform, setReqPlatform] = useState("Pocket FM");
  const [reqCustomPlatform, setReqCustomPlatform] = useState("");
  const [reqStatus, setReqStatus] = useState("Completed");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [myReqs, setMyReqs] = useState<RequestDoc[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => {
    if (viewMode === "requests" && tgUser.telegram_id) {
      setLoadingReqs(true);
      fetchMyRequests(tgUser.telegram_id).then(r => {
        setMyReqs(r);
        setLoadingReqs(false);
      });
    }
  }, [viewMode, tgUser.telegram_id]);

  const list = useMemo(() => {
    if (!q) return stories;
    const lowerQ = q.toLowerCase();
    return stories.filter(s => s.title.toLowerCase().includes(lowerQ));
  }, [stories, q]);

  const handleSubmitRequest = async () => {
    if (!reqName.trim() || sending) return;
    setSending(true);
    try {
      const p = reqPlatform === "Custom" ? reqCustomPlatform : reqPlatform;
      const textMsg = `Story Name: ${reqName}\nPlatform: ${p}\nStatus: ${reqStatus}`;
      await submitSupport({
        telegram_id: tgUser.telegram_id,
        username: tgUser.username,
        first_name: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "Mini App User",
        type: "request",
        message: textMsg,
        file: file
      });
      setDone(true);
      if (tgUser.telegram_id) {
        fetchMyRequests(tgUser.telegram_id).then(setMyReqs);
      }
      setTimeout(() => {
        setDone(false);
        setReqName("");
        setReqCustomPlatform("");
        setFile(null);
      }, 3000);
    } catch {
      alert(t("explore.failedSubmit"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col min-h-full">
      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-border/50">
        <div className="flex bg-muted/50 rounded-xl p-1 w-full">
          <button
            onClick={() => setViewMode("explore")}
            className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200", viewMode === "explore" ? "bg-background shadow text-foreground" : "text-muted-foreground")}
          >
            {t("explore.tab")}
          </button>
          <button
            onClick={() => setViewMode("requests")}
            className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200", viewMode === "requests" ? "bg-background shadow text-foreground" : "text-muted-foreground")}
          >
            {t("explore.requests")}
          </button>
        </div>
      </div>

      {viewMode === "explore" ? (
        <>
          {/* Search */}
          <div className="px-4 py-3">
            <div className="h-10 w-full rounded-full bg-surface border border-border flex items-center px-3 focus-within:border-foreground transition-colors shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("explore.searchPlaceholder")}
                className="flex-1 bg-transparent outline-none text-[15px] ml-2 text-foreground placeholder:text-muted-foreground"
              />
              {q && (
                <button onClick={() => setQ("")} className="shrink-0 p-1 active:scale-90 transition">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 px-4 pt-2">
            <div className={cn("grid gap-4", theme === "dark" ? "grid-cols-3 gap-2" : "grid-cols-2")}>
              {list.map(s => (
                <StoryCard key={s.id} story={s} square />
              ))}
            </div>
            {list.length === 0 && (
              <div className="py-16 text-center text-muted-foreground text-[15px]">
                {t("story.noFound")}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 px-4 pt-4 pb-10 space-y-6 animate-fade-in">
          {/* Request form */}
          <div className="p-4 rounded-2xl border border-border/60 bg-surface shadow-sm space-y-4">
            <h2 className="font-bold text-lg mb-2">{t("explore.requestTitle")}</h2>

            {done ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="font-bold">{t("explore.submitted")}</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("explore.storyName")}</label>
                  <input
                    value={reqName}
                    onChange={e => setReqName(e.target.value)}
                    placeholder={t("explore.storyNamePlaceholder")}
                    className="w-full h-11 px-3 rounded-lg border border-border/60 bg-background outline-none focus:border-primary/50 text-[14px]"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("explore.platform")}</label>
                    <select
                      value={reqPlatform}
                      onChange={e => setReqPlatform(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-border/60 bg-background outline-none focus:border-primary/50 text-[14px]"
                    >
                      <option>Pocket FM</option>
                      <option>Kuku FM</option>
                      <option>Spotify</option>
                      <option>Headfone</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("explore.status")}</label>
                    <select
                      value={reqStatus}
                      onChange={e => setReqStatus(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-border/60 bg-background outline-none focus:border-primary/50 text-[14px]"
                    >
                      <option>{t("story.completed")}</option>
                      <option>{t("story.ongoing")}</option>
                    </select>
                  </div>
                </div>

                {reqPlatform === "Custom" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("explore.customPlatform")}</label>
                    <input
                      value={reqCustomPlatform}
                      onChange={e => setReqCustomPlatform(e.target.value)}
                      placeholder={t("explore.customPlatformPlaceholder")}
                      className="w-full h-11 px-3 rounded-lg border border-border/60 bg-background outline-none focus:border-primary/50 text-[14px]"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("explore.image")}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 px-4 rounded-lg border border-border/60 bg-muted/30 flex items-center gap-2 text-[13px] font-medium hover:bg-muted/50"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      {file ? t("explore.changeImage") : t("explore.attachImage")}
                    </button>
                    {file && <span className="text-xs truncate flex-1 font-medium">{file.name}</span>}
                  </div>
                </div>

                <button
                  onClick={handleSubmitRequest}
                  disabled={sending || !reqName.trim()}
                  className="w-full h-11 mt-2 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  {t("explore.submitRequest")}
                </button>
              </>
            )}
          </div>

          {/* My Requests list */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">{t("explore.myRequests")}</h3>
            {loadingReqs ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : myReqs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("explore.noRequests")}</p>
            ) : (
              <div className="space-y-3">
                {myReqs.map(r => (
                  <div key={r.id} className="p-3 rounded-xl border border-border/60 bg-background flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-[13px] whitespace-pre-line text-foreground/90 font-medium">
                        {r.text.replace(/\[REQUEST\]\s*/i, '')}
                      </div>
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold",
                        r.status === "open" ? "bg-amber-500/10 text-amber-500" :
                        r.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      )}>
                        {r.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
