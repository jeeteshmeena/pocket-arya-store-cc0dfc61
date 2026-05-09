import { useEffect, useState } from "react";
import { ChevronLeft, Users, FileText, Banknote, HelpCircle, Activity } from "lucide-react";
import { useApp } from "@/store/app-store";
import { fetchAdminStats } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminView() {
  const { back, tgUser, theme } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tgUser.telegram_id) {
      setError("Please open in Telegram to access Admin Panel.");
      setLoading(false);
      return;
    }
    fetchAdminStats(tgUser)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load admin stats. You might not have permission.");
        setLoading(false);
      });
  }, [tgUser]);

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Header Area */}
      <div className={cn("sticky top-0 z-10 px-4 pt-4 pb-2 backdrop-blur-md", theme === "cream" ? "bg-[#f8f5f0]/90 border-b-2 border-black" : "bg-background/90")}>
        <div className="flex items-center gap-3">
          <button
            onClick={back}
            className={cn("p-2 rounded-full transition active:scale-95", theme === "cream" ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "bg-surface")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className={cn("text-2xl font-bold tracking-tight", theme === "cream" ? "text-black" : "text-foreground")}>
            Admin Panel
          </h1>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <div className={cn("p-6 text-center rounded-2xl", theme === "cream" ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-surface")}>
            <div className="text-red-500 mb-2 font-bold uppercase tracking-widest text-sm">Access Denied</div>
            <p className={cn("text-sm", theme === "cream" ? "text-black/70 font-semibold" : "text-muted-foreground")}>{error}</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Total Revenue" value={`₹${stats.total_revenue || 0}`} icon={Banknote} theme={theme} />
              <StatCard title="Total Users" value={stats.total_users || 0} icon={Users} theme={theme} />
              <StatCard title="Total Stories" value={stats.total_stories || 0} icon={FileText} theme={theme} />
              <StatCard title="System Status" value="Online" icon={Activity} theme={theme} />
            </div>

            {/* Recent Orders */}
            <div className={cn("p-4 rounded-2xl", theme === "cream" ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-surface")}>
              <h2 className={cn("font-bold text-lg mb-4 flex items-center gap-2", theme === "cream" ? "text-black" : "")}>
                <Banknote className="h-5 w-5" /> Recent Payments
              </h2>
              <div className="space-y-3">
                {stats.recent_orders?.length > 0 ? (
                  stats.recent_orders.map((o: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <div className={cn("font-semibold", theme === "cream" ? "text-black" : "")}>{o.username || o.user_id}</div>
                        <div className={theme === "cream" ? "text-black/60 text-xs" : "text-muted-foreground text-xs"}>ID: {o.order_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-500">₹{o.amount}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">{o.status}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No recent payments</div>
                )}
              </div>
            </div>

            {/* Recent Feedback */}
            <div className={cn("p-4 rounded-2xl", theme === "cream" ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-surface")}>
              <h2 className={cn("font-bold text-lg mb-4 flex items-center gap-2", theme === "cream" ? "text-black" : "")}>
                <HelpCircle className="h-5 w-5" /> Recent Feedback
              </h2>
              <div className="space-y-4">
                {stats.recent_feedback?.length > 0 ? (
                  stats.recent_feedback.map((f: any, i: number) => (
                    <div key={i} className="text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn("font-bold", theme === "cream" ? "text-black" : "")}>{f.username || f.user_id}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">{f.type}</span>
                      </div>
                      <p className={theme === "cream" ? "text-black/80" : "text-muted-foreground"}>{f.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No recent feedback</div>
                )}
              </div>
            </div>
            
            <div className="pt-4 text-center pb-8">
              <p className="text-xs text-muted-foreground">For deeper management tasks like adding stories or changing prices, please use the Telegram Admin Bot.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, theme }: { title: string, value: string | number, icon: any, theme: string }) {
  return (
    <div className={cn("p-4 rounded-2xl flex flex-col", theme === "cream" ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-surface")}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", theme === "cream" ? "text-black/60" : "text-muted-foreground")} />
        <span className={cn("text-xs font-semibold uppercase tracking-wider", theme === "cream" ? "text-black/60" : "text-muted-foreground")}>{title}</span>
      </div>
      <div className={cn("text-2xl font-bold", theme === "cream" ? "text-black" : "text-foreground")}>{value}</div>
    </div>
  );
}
