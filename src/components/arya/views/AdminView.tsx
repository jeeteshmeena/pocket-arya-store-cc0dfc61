import { useEffect, useState } from "react";
import { ChevronLeft, Users, FileText, Banknote, HelpCircle, Activity, Edit, Trash2, Plus, X } from "lucide-react";
import { useApp } from "@/store/app-store";
import { fetchAdminStats, fetchAdminStories, saveAdminStory, deleteAdminStory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminView() {
  const { back, tgUser, theme } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "stories">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);

  useEffect(() => {
    if (!tgUser.telegram_id) {
      setError("Please open in Telegram to access Admin Panel.");
      setLoading(false);
      return;
    }
    loadData();
  }, [tgUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, storiesData] = await Promise.all([
        fetchAdminStats(tgUser),
        fetchAdminStories(tgUser)
      ]);
      setStats(statsData);
      setStories(storiesData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
    try {
      await deleteAdminStory(tgUser, storyId);
      setStories(stories.filter(s => s.story_id !== storyId));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      await saveAdminStory(tgUser, editingStory);
      await loadData();
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const openForm = (story: any = null) => {
    if (story) {
      setEditingStory({ ...story });
    } else {
      setEditingStory({
        story_id: `story_${Date.now()}`,
        name: "",
        status: "available",
        price: 99,
        discount_price: 49,
        episodes: "0",
        type: "audiobook",
        banner_url: "",
        poster_url: "",
        is_completed: false
      });
    }
    setIsFormOpen(true);
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-full p-4">
        <button onClick={back} className="mb-4 self-start p-2 rounded-full bg-surface">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="p-6 text-center rounded-2xl bg-surface">
          <div className="text-red-500 mb-2 font-bold uppercase tracking-widest text-sm">Access Denied</div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-20 relative">
      {/* Header Area */}
      <div className={cn("sticky top-0 z-10 px-4 pt-4 pb-2 backdrop-blur-md", theme === "cream" ? "bg-[#f8f5f0]/90 border-b-2 border-black" : "bg-background/90")}>
        <div className="flex items-center gap-3 mb-3">
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
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={cn("flex-1 py-2 text-sm font-semibold rounded-xl transition", 
              activeTab === "dashboard" 
                ? (theme === "cream" ? "bg-black text-white" : "bg-primary text-primary-foreground") 
                : (theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-surface text-muted-foreground")
            )}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            className={cn("flex-1 py-2 text-sm font-semibold rounded-xl transition", 
              activeTab === "stories" 
                ? (theme === "cream" ? "bg-black text-white" : "bg-primary text-primary-foreground") 
                : (theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-surface text-muted-foreground")
            )}
          >
            Manage Stories
          </button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard title="Total Revenue" value={`₹${stats?.total_revenue || 0}`} icon={Banknote} theme={theme} />
                  <StatCard title="Total Users" value={stats?.total_users || 0} icon={Users} theme={theme} />
                  <StatCard title="Total Stories" value={stats?.total_stories || 0} icon={FileText} theme={theme} />
                  <StatCard title="System Status" value="Online" icon={Activity} theme={theme} />
                </div>

                {/* Recent Orders */}
                <div className={cn("p-4 rounded-2xl", theme === "cream" ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-surface")}>
                  <h2 className={cn("font-bold text-lg mb-4 flex items-center gap-2", theme === "cream" ? "text-black" : "")}>
                    <Banknote className="h-5 w-5" /> Recent Payments
                  </h2>
                  <div className="space-y-3">
                    {stats?.recent_orders?.length > 0 ? (
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
                    {stats?.recent_feedback?.length > 0 ? (
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
              </div>
            )}

            {activeTab === "stories" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => openForm()}
                  className={cn("w-full py-3 flex justify-center items-center gap-2 font-bold rounded-xl transition active:scale-[0.98]", theme === "cream" ? "bg-[#c4a980] text-black border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-primary text-primary-foreground")}
                >
                  <Plus className="h-5 w-5" /> Add New Story
                </button>

                <div className="space-y-3">
                  {stories.map(story => (
                    <div key={story.story_id} className={cn("p-3 rounded-xl flex gap-3 items-center", theme === "cream" ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "bg-surface")}>
                      <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0 overflow-hidden relative">
                        {story.poster_url ? (
                          <img src={story.poster_url} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-bold text-sm truncate", theme === "cream" ? "text-black" : "")}>{story.name}</div>
                        <div className="text-xs text-muted-foreground">₹{story.price} • {story.status}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openForm(story)} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(story.story_id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Story Form Modal */}
      {isFormOpen && editingStory && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className={cn("w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6", theme === "cream" ? "bg-[#f8f5f0] border-2 border-black shadow-[8px_8px_0px_#000]" : "bg-surface border border-border")}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={cn("text-xl font-bold", theme === "cream" ? "text-black" : "")}>
                {editingStory.story_id.startsWith("story_") ? "Add Story" : "Edit Story"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full bg-muted/50 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Story ID</label>
                <input required type="text" value={editingStory.story_id} onChange={e => setEditingStory({...editingStory, story_id: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="e.g. jjk_hindi" disabled={!editingStory.story_id.startsWith("story_")} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Story Name</label>
                <input required type="text" value={editingStory.name} onChange={e => setEditingStory({...editingStory, name: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="Story title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Price (₹)</label>
                  <input required type="number" value={editingStory.price} onChange={e => setEditingStory({...editingStory, price: Number(e.target.value)})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Discount (₹)</label>
                  <input required type="number" value={editingStory.discount_price} onChange={e => setEditingStory({...editingStory, discount_price: Number(e.target.value)})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Status</label>
                  <select value={editingStory.status} onChange={e => setEditingStory({...editingStory, status: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")}>
                    <option value="available">Available</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Format</label>
                  <select value={editingStory.type} onChange={e => setEditingStory({...editingStory, type: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")}>
                    <option value="audiobook">Audiobook</option>
                    <option value="ebook">Ebook</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Episodes Count / Description</label>
                <input type="text" value={editingStory.episodes} onChange={e => setEditingStory({...editingStory, episodes: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="e.g. 500+ Episodes" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Poster URL</label>
                <input type="url" value={editingStory.poster_url} onChange={e => setEditingStory({...editingStory, poster_url: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="https://..." />
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer mt-2">
                <input type="checkbox" checked={editingStory.is_completed} onChange={e => setEditingStory({...editingStory, is_completed: e.target.checked})} className="h-5 w-5 rounded border-gray-300" />
                <span className="text-sm font-semibold">Mark as Completed</span>
              </label>

              <button disabled={formSaving} type="submit" className={cn("w-full mt-6 py-4 font-bold text-lg rounded-xl transition", theme === "cream" ? "bg-black text-white shadow-[4px_4px_0px_#555] active:translate-y-1 active:shadow-none" : "bg-primary text-primary-foreground")}>
                {formSaving ? "Saving..." : "Save Story"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, theme }: { title: string, value: string | number, icon: any, theme: string }) {
  return (
    <div className={cn("p-4 rounded-2xl flex flex-col", theme === "cream" ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-surface")}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", theme === "cream" ? "text-black/60" : "text-muted-foreground")} />
        <span className={cn("text-[10px] sm:text-xs font-semibold uppercase tracking-wider", theme === "cream" ? "text-black/60" : "text-muted-foreground")}>{title}</span>
      </div>
      <div className={cn("text-xl sm:text-2xl font-bold truncate", theme === "cream" ? "text-black" : "text-foreground")}>{value}</div>
    </div>
  );
}
