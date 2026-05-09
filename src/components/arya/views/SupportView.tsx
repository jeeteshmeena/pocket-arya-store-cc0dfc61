import { useState, useRef } from "react";
import { useApp } from "@/store/app-store";
import { ChevronLeft, Ticket, MessageCircle, Lightbulb, CheckCircle2, Paperclip, X, Image as ImageIcon, Video, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitSupport } from "@/lib/api";

export function SupportView() {
  const { theme, setView, tgUser } = useApp();
  const [supportMode, setSupportMode] = useState<"menu" | "support" | "chat" | "suggestion">("menu");
  const [msg, setMsg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if ((!msg.trim() && !file) || sending) return;
    setSending(true);
    try {
      await submitSupport({
        telegram_id: tgUser.telegram_id,
        username: tgUser.username,
        first_name: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "Mini App User",
        type: supportMode,
        message: msg,
        file: file
      });
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setSupportMode("menu");
        setMsg("");
        setFile(null);
      }, 3000);
    } catch (e) {
      alert("Failed to submit. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const renderIcon = (f: File) => {
    if (f.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (f.type.startsWith("video/")) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col h-full bg-background relative animate-fade-in pb-20">
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-10 flex items-center h-14 px-4 border-b backdrop-blur-md",
        theme === "cream" ? "bg-white/80 border-border/40" : "bg-background/80 border-border/40"
      )}>
        <button 
          onClick={() => {
            if (supportMode !== "menu" && !done) setSupportMode("menu");
            else setView("profile");
          }} 
          className="h-9 w-9 -ml-2 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="ml-2 font-display font-bold text-[17px] truncate">
          {supportMode === "menu" ? "Help & Support" :
           supportMode === "support" ? "Open Ticket" :
           supportMode === "chat" ? "Live Chat" : "Submit Suggestion"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {done ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className={cn("font-semibold text-lg text-center", theme === "cream" ? "text-black/80" : "text-foreground")}>
              Submitted Successfully!
            </p>
            <p className="text-[14px] text-muted-foreground text-center">
              Our team will get back to you soon.
            </p>
          </div>
        ) : supportMode === "menu" ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm mb-4">
              How can we help you today? Select an option below.
            </p>
            <button
              onClick={() => setSupportMode("support")}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border transition active:scale-[0.98] text-left",
                theme === "cream" ? "bg-white border-border/60 hover:bg-muted/30 shadow-sm" : "bg-surface border-border/60 hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[15px]">Open Support Ticket</div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">Get help with orders or access</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                import("@/lib/api").then(({ openTelegramLink }) => {
                  openTelegramLink("https://t.me/ItsNewtonPlanet");
                });
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border transition active:scale-[0.98] text-left",
                theme === "cream" ? "bg-white border-border/60 hover:bg-muted/30 shadow-sm" : "bg-surface border-border/60 hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[15px]">Live Chat</div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">Chat with an agent directly</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSupportMode("suggestion")}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border transition active:scale-[0.98] text-left",
                theme === "cream" ? "bg-white border-border/60 hover:bg-muted/30 shadow-sm" : "bg-surface border-border/60 hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[15px]">Submit Suggestion</div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">Request features or stories</div>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-fade-in">
            <p className="text-muted-foreground text-sm mb-3">
              Please describe your request. You can also attach photos or videos.
            </p>
            
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Type your message here..."
              className={cn(
                "w-full min-h-[140px] p-4 rounded-xl resize-none outline-none border focus:border-primary/50 transition-colors text-[14px] leading-relaxed",
                theme === "cream" ? "bg-white border-border/60 shadow-sm" : "bg-muted/30 border-border/60 placeholder:text-muted-foreground/60"
              )}
            />

            {file && (
              <div className="mt-3 p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {renderIcon(file)}
                  </div>
                  <div className="truncate text-sm font-medium">{file.name}</div>
                </div>
                <button onClick={removeFile} className="h-8 w-8 rounded-full hover:bg-muted/60 flex items-center justify-center shrink-0 text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*,audio/*,.pdf,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="h-12 w-12 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={sending || (!msg.trim() && !file)}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {sending ? "Sending..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
