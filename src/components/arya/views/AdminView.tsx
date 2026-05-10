import { useEffect, useState } from "react";
import { ChevronLeft, Users, FileText, Banknote, HelpCircle, Activity, Edit, Trash2, Plus, X } from "lucide-react";
import { useApp } from "@/store/app-store";
import { fetchAdminStats, fetchAdminStories, saveAdminStory, deleteAdminStory, fetchAdminBanners, saveAdminBanner, deleteAdminBanner, fetchAdminBuyers, fetchAdminSupport, replyAdminSupport, fetchAnalytics, uploadAdminImage, translateText, getOptimizedImage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminView() {
  const { back, tgUser, theme } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "stories" | "banners" | "buyers" | "support">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);

  // Banner Form State
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

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
      const [statsData, storiesData, bannersData, buyersData, supportData, analyticsData] = await Promise.all([
        fetchAdminStats(tgUser),
        fetchAdminStories(tgUser),
        fetchAdminBanners(tgUser),
        fetchAdminBuyers(tgUser),
        fetchAdminSupport(tgUser),
        fetchAnalytics(tgUser)
      ]);
      setStats(statsData);
      setStories(storiesData);
      setBanners(bannersData);
      setBuyers(buyersData);
      setSupportTickets(supportData);
      setAnalytics(analyticsData);
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

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await deleteAdminBanner(tgUser, bannerId);
      setBanners(banners.filter(b => b.id !== bannerId));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      // Strip MongoDB _id and ensure story_id exists before sending
      const { _id, ...storyToSave } = editingStory;
      if (!storyToSave.story_id) {
        alert("story_id is missing. Cannot save.");
        setFormSaving(false);
        return;
      }
      await saveAdminStory(tgUser, storyToSave);
      await loadData();
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      await saveAdminBanner(tgUser, editingBanner);
      await loadData();
      setIsBannerFormOpen(false);
    } catch (err: any) {
      alert("Failed to save banner: " + err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleReplySupport = async (ticketId: string, replyText: string) => {
    try {
      await replyAdminSupport(tgUser, ticketId, replyText);
      setSupportTickets(supportTickets.filter(t => t.id !== ticketId));
    } catch (err: any) {
      alert("Failed to send reply: " + err.message);
    }
  };

  const [imageUploading, setImageUploading] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);

  const compressImageClientSide = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const max_size = 800; // Optimal max dimension for speed
          
          if (width > height && width > max_size) {
            height *= max_size / width;
            width = max_size;
          } else if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }));
          }, "image/webp", 0.75); // Extreme compression efficiency
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile || !editingStory) return;
    setImageUploading(true);
    try {
      // Compress BEFORE network upload to fix Vercel/Nginx 502/413 connection drops on large files
      const file = await compressImageClientSide(originalFile);
      const result = await uploadAdminImage(tgUser, file);
      setEditingStory((s: any) => ({
        ...s,
        poster_url: result.poster_url || s.poster_url,
        image: result.file_id || s.image
      }));
    } catch (err: any) {
      alert("Image upload failed: " + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleAutoTranslate = async (field: "hi" | "en") => {
    if (!editingStory) return;
    setTranslating(field);
    try {
      if (field === "hi") {
        const [nameHi, descHi] = await Promise.all([
          editingStory.story_name_en ? translateText(editingStory.story_name_en, "hi") : Promise.resolve(editingStory.story_name_hi || ""),
          editingStory.description ? translateText(editingStory.description, "hi") : Promise.resolve(editingStory.description_hi || "")
        ]);
        setEditingStory((s: any) => ({ ...s, story_name_hi: nameHi, description_hi: descHi }));
      } else {
        const [nameEn, descEn] = await Promise.all([
          editingStory.story_name_hi ? translateText(editingStory.story_name_hi, "en") : Promise.resolve(editingStory.story_name_en || ""),
          editingStory.description_hi ? translateText(editingStory.description_hi, "en") : Promise.resolve(editingStory.description || "")
        ]);
        setEditingStory((s: any) => ({ ...s, story_name_en: nameEn, description: descEn }));
      }
    } catch {
      alert("Translation failed. Try again.");
    } finally {
      setTranslating(null);
    }
  };

  const openForm = (story: any = null) => {
    if (story) {
      setEditingStory({ ...story });
    } else {
      setEditingStory({
        story_id: `story_${Date.now()}`,
        bot_id: "",
        bot_username: "UseAryaBot",
        start_id: "",
        end_id: "",
        source: "",
        story_name_en: "",
        story_name_hi: "",
        description: "",
        description_hi: "",
        episodes: "1",
        status: "available",
        genre: "Romance",
        language: "Hindi",
        price: 99,
        discount_price: 49,
        payment_methods: ["upi", "razorpay"],
        platform: "Pocket FM",
        delivery_mode: "pool",
        channel_id: "",
        image: "",
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
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["dashboard", "stories", "banners", "buyers", "support"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn("whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-xl transition", 
                activeTab === tab 
                  ? (theme === "cream" ? "bg-black text-white" : "bg-primary text-primary-foreground") 
                  : (theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-surface text-muted-foreground")
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
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
                            <div className="font-bold text-green-500">₹{o.total_amount || o.amount || 0}</div>
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

                {/* Live Analytics */}
                <div className={cn("p-4 rounded-2xl", theme === "cream" ? "bg-white border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-surface")}>
                  <h2 className={cn("font-bold text-lg mb-4 flex items-center gap-2", theme === "cream" ? "text-black" : "")}>
                    <Activity className="h-5 w-5" /> Live Analytics
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Recent Searches</h3>
                      <div className="space-y-2">
                        {analytics?.recent_searches?.length > 0 ? analytics.recent_searches.map((s: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-foreground/80">"{s.query}"</span>
                            <span className="text-xs text-muted-foreground">{new Date(s.time).toLocaleTimeString()}</span>
                          </div>
                        )) : <div className="text-xs text-muted-foreground">No recent searches</div>}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Recent Story Views</h3>
                      <div className="space-y-2">
                        {analytics?.recent_views?.length > 0 ? analytics.recent_views.map((v: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-foreground/80 truncate pr-2">{v.story_id}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(v.time).toLocaleTimeString()}</span>
                          </div>
                        )) : <div className="text-xs text-muted-foreground">No recent views</div>}
                      </div>
                    </div>
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
                          <img src={getOptimizedImage(story.poster_url) || ""} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-bold text-sm truncate", theme === "cream" ? "text-black" : "")}>{story.story_name_en || story.name}</div>
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

            {activeTab === "banners" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => { setEditingBanner({ id: "new", image_url: "", target_link: "", order: banners.length }); setIsBannerFormOpen(true); }}
                  className={cn("w-full py-3 flex justify-center items-center gap-2 font-bold rounded-xl transition active:scale-[0.98]", theme === "cream" ? "bg-[#c4a980] text-black border-2 border-black shadow-[4px_4px_0px_#000]" : "bg-primary text-primary-foreground")}
                >
                  <Plus className="h-5 w-5" /> Add New Banner
                </button>
                <div className="space-y-3">
                  {banners.map(banner => (
                    <div key={banner.id} className={cn("p-3 rounded-xl flex gap-3 items-center", theme === "cream" ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "bg-surface")}>
                      <img src={getOptimizedImage(banner.image_url) || ""} alt="Banner" className="w-20 h-12 object-cover rounded-md bg-muted" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground truncate">{banner.target_link}</div>
                        <div className="text-xs font-bold text-primary">Order: {banner.order}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingBanner(banner); setIsBannerFormOpen(true); }} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "buyers" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center">
                  <h2 className={cn("font-bold text-xl", theme === "cream" ? "text-black" : "")}>Buyers ({buyers.length})</h2>
                  <div className="text-sm font-bold text-green-500">Total: ₹{buyers.filter(b=>b.status==="paid").reduce((s:number,b:any)=>s+(b.amount||0),0)}</div>
                </div>
                <div className="space-y-3">
                  {buyers.length === 0 ? <div className="text-center p-8 text-muted-foreground bg-surface rounded-xl">No orders yet.</div> : buyers.map((buyer, i) => (
                    <div key={i} className={cn("p-4 rounded-xl text-sm", theme === "cream" ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "bg-surface")}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className={cn("font-bold", theme === "cream" ? "text-black" : "")}>{buyer.first_name || buyer.username} {buyer.username && <span className="text-muted-foreground font-normal">@{buyer.username}</span>}</div>
                          <div className="text-[10px] text-muted-foreground">ID: {buyer.user_id} • {new Date(buyer.date).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-500">₹{buyer.amount}</div>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", buyer.status==="paid" ? "bg-green-500/15 text-green-500" : "bg-yellow-500/15 text-yellow-500")}>{buyer.status}</span>
                        </div>
                      </div>
                      {buyer.story_names?.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-bold text-primary">Stories: </span>{buyer.story_names.join(", ")}
                        </div>
                      )}
                      {buyer.payment_id && <div className="text-[10px] text-muted-foreground mt-1">Payment ID: {buyer.payment_id}</div>}
                      {buyer.source && <div className="text-[10px] text-muted-foreground">Via: {buyer.source}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "support" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className={cn("font-bold text-xl", theme === "cream" ? "text-black" : "")}>Open Tickets ({supportTickets.length})</h2>
                <div className="space-y-3">
                  {supportTickets.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground bg-surface rounded-xl">No open tickets.</div>
                  ) : supportTickets.map(ticket => (
                    <SupportTicketCard key={ticket.id} ticket={ticket} theme={theme} onReply={handleReplySupport} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isFormOpen && editingStory && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className={cn("w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6", theme === "cream" ? "bg-[#f8f5f0] border-2 border-black shadow-[8px_8px_0px_#000]" : "bg-surface border border-border")}>
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-inherit py-2 z-10 border-b border-border/50">
              <h2 className={cn("text-xl font-bold", theme === "cream" ? "text-black" : "")}>
                {(editingStory?.story_id || "").startsWith("story_") ? "Add Story" : "Edit Story"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full bg-muted/50 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              
              <div className="space-y-4 p-4 rounded-xl border border-border bg-background/50">
                <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Basic Details</h3>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Story ID</label>
                  <input required type="text" value={editingStory.story_id || ""} onChange={e => setEditingStory({...editingStory, story_id: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} disabled={!(editingStory?.story_id || "").startsWith("story_")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Name (EN)</label>
                    <input required type="text" value={editingStory.story_name_en} onChange={e => setEditingStory({...editingStory, story_name_en: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Name (HI)</label>
                    <input type="text" value={editingStory.story_name_hi || ""} onChange={e => setEditingStory({...editingStory, story_name_hi: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                  </div>
                </div>
                {/* Auto-translate buttons */}
                <div className="flex gap-2">
                  <button type="button" disabled={!!translating} onClick={() => handleAutoTranslate("hi")} className="flex-1 py-2 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 disabled:opacity-50">
                    {translating === "hi" ? "Translating..." : "EN → HI (Auto-fill Hindi)"}
                  </button>
                  <button type="button" disabled={!!translating} onClick={() => handleAutoTranslate("en")} className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 disabled:opacity-50">
                    {translating === "en" ? "Translating..." : "HI → EN (Auto-fill English)"}
                  </button>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Desc (EN)</label>
                  <textarea rows={2} value={editingStory.description || ""} onChange={e => setEditingStory({...editingStory, description: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Desc (HI)</label>
                  <textarea rows={2} value={editingStory.description_hi || ""} onChange={e => setEditingStory({...editingStory, description_hi: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                </div>
              </div>


              <div className="space-y-4 p-4 rounded-xl border border-border bg-background/50">
                <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Bot & Delivery Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Start ID</label>
                    <input type="number" value={editingStory.start_id || ""} onChange={e => setEditingStory({...editingStory, start_id: Number(e.target.value)})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">End ID</label>
                    <input type="number" value={editingStory.end_id || ""} onChange={e => setEditingStory({...editingStory, end_id: Number(e.target.value)})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Source Channel ID</label>
                    <input type="number" value={editingStory.source || ""} onChange={e => setEditingStory({...editingStory, source: Number(e.target.value)})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Delivery Channel ID</label>
                    <input type="number" value={editingStory.channel_id || ""} onChange={e => setEditingStory({...editingStory, channel_id: Number(e.target.value)})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="Leave blank for pool" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Bot ID</label>
                    <input type="number" value={editingStory.bot_id || ""} onChange={e => setEditingStory({...editingStory, bot_id: Number(e.target.value)})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Bot Username</label>
                    <input type="text" value={editingStory.bot_username || ""} onChange={e => setEditingStory({...editingStory, bot_username: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="UseAryaBot" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 rounded-xl border border-border bg-background/50">
                <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Pricing & Metadata</h3>
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
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Episodes Count</label>
                    <input type="text" value={editingStory.episodes} onChange={e => setEditingStory({...editingStory, episodes: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Platform</label>
                    <select value={editingStory.platform || "Pocket FM"} onChange={e => setEditingStory({...editingStory, platform: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")}>
                      {["Pocket FM","Kuku FM","Audible","StoryTel","Other"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Language</label>
                    <select value={editingStory.language || "Hindi"} onChange={e => setEditingStory({...editingStory, language: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")}>
                      {["Hindi","English","Tamil","Telugu","Bengali","Marathi","Gujarati"].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                {/* Image Upload Section */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Poster Image</label>
                  {/* Preview */}
                  {editingStory.poster_url && (
                    <img src={getOptimizedImage(editingStory.poster_url) || ""} alt="Poster Preview" className="w-full h-40 object-cover rounded-xl mb-2 bg-muted" />
                  )}
                  {/* Upload from Phone */}
                  <label className={cn("flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed cursor-pointer text-sm font-semibold transition mb-2", imageUploading ? "opacity-50" : "", theme === "cream" ? "border-black text-black" : "border-border text-muted-foreground hover:border-primary")}>
                    {imageUploading ? "Uploading & compressing..." : "Upload from Phone / File"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
                  </label>
                  {/* Or enter URL */}
                  <div className="text-xs text-center text-muted-foreground mb-1">— or enter URL —</div>
                  <input type="url" value={editingStory.poster_url || ""} onChange={e => setEditingStory({...editingStory, poster_url: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="https://catbox.moe/..." />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Telegram File ID (auto-filled on upload)</label>
                  <input type="text" value={editingStory.image || ""} onChange={e => setEditingStory({...editingStory, image: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="Auto-filled after upload, or paste manually" />
                  <p className="text-[10px] text-muted-foreground mt-1">Upload image above to auto-get TG file_id. Or paste manually if you already have it.</p>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer mt-2">
                  <input type="checkbox" checked={editingStory.is_completed} onChange={e => setEditingStory({...editingStory, is_completed: e.target.checked})} className="h-5 w-5 rounded border-gray-300" />
                  <span className="text-sm font-semibold">Mark as Story Completed</span>
                </label>
              </div>

              <button disabled={formSaving} type="submit" className={cn("w-full mt-6 py-4 font-bold text-lg rounded-xl transition", theme === "cream" ? "bg-black text-white shadow-[4px_4px_0px_#555] active:translate-y-1 active:shadow-none" : "bg-primary text-primary-foreground")}>
                {formSaving ? "Saving..." : "Save Complete Story"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Banner Form Modal */}
      {isBannerFormOpen && editingBanner && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className={cn("w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6", theme === "cream" ? "bg-[#f8f5f0] border-2 border-black shadow-[8px_8px_0px_#000]" : "bg-surface border border-border")}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={cn("text-xl font-bold", theme === "cream" ? "text-black" : "")}>
                {editingBanner.id === "new" ? "Add Banner" : "Edit Banner"}
              </h2>
              <button onClick={() => setIsBannerFormOpen(false)} className="p-2 rounded-full bg-muted/50 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Image URL</label>
                <input required type="url" value={editingBanner.image_url} onChange={e => setEditingBanner({...editingBanner, image_url: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="https://catbox.moe/..." />
                {editingBanner.image_url && <img src={getOptimizedImage(editingBanner.image_url) || ""} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl" />}
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Target Link</label>
                <input required type="text" value={editingBanner.target_link} onChange={e => setEditingBanner({...editingBanner, target_link: e.target.value})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} placeholder="/story/jjk_hindi" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Sort Order</label>
                <input required type="number" value={editingBanner.order} onChange={e => setEditingBanner({...editingBanner, order: Number(e.target.value)})} className={cn("w-full p-3 rounded-xl text-sm outline-none", theme === "cream" ? "bg-white border-2 border-black text-black" : "bg-background border border-border focus:border-primary")} />
              </div>
              <button disabled={formSaving} type="submit" className={cn("w-full mt-6 py-4 font-bold text-lg rounded-xl transition", theme === "cream" ? "bg-black text-white shadow-[4px_4px_0px_#555] active:translate-y-1 active:shadow-none" : "bg-primary text-primary-foreground")}>
                {formSaving ? "Saving..." : "Save Banner"}
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

function SupportTicketCard({ ticket, theme, onReply }: { ticket: any, theme: string, onReply: (id: string, reply: string) => void }) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(ticket.id, replyText);
    setSending(false);
  };

  return (
    <div className={cn("p-4 rounded-xl", theme === "cream" ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "bg-surface")}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className={cn("font-bold", theme === "cream" ? "text-black" : "")}>{ticket.first_name || ticket.username}</div>
          <div className="text-[10px] text-muted-foreground">@{ticket.username} · {new Date(ticket.date).toLocaleString()}</div>
        </div>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold">{ticket.type}</span>
      </div>

      {/* Media Preview */}
      {ticket.type === "photo" && ticket.file_url && (
        <img src={getOptimizedImage(ticket.file_url) || ""} alt="User media" className="w-full max-h-48 object-contain rounded-lg mb-2 bg-muted" />
      )}
      {ticket.type === "video" && ticket.file_url && (
        <video src={ticket.file_url} controls className="w-full max-h-48 rounded-lg mb-2 bg-muted" />
      )}
      {ticket.type === "audio" && ticket.file_url && (
        <audio src={ticket.file_url} controls className="w-full mb-2" />
      )}
      {(ticket.type === "document") && ticket.file_url && (
        <a href={ticket.file_url} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary underline mb-2">View Document</a>
      )}
      {/* Media without URL — show file_id hint */}
      {["photo","video","audio","document"].includes(ticket.type) && !ticket.file_url && ticket.file_id && (
        <div className="text-xs text-muted-foreground mb-2 bg-muted/50 p-2 rounded-lg">Media file_id: {ticket.file_id.slice(0,30)}...</div>
      )}

      {ticket.text && (
        <p className="text-sm text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/50 mb-3">{ticket.text}</p>
      )}

      {/* Inline Reply */}
      <textarea
        rows={2}
        placeholder="Type reply..."
        value={replyText}
        onChange={e => setReplyText(e.target.value)}
        className={cn("w-full p-3 rounded-xl text-sm outline-none resize-none mb-2", theme === "cream" ? "bg-[#f0ebe4] border-2 border-black text-black" : "bg-background border border-border focus:border-primary")}
      />
      <button
        onClick={send}
        disabled={sending || !replyText.trim()}
        className="w-full py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Reply to User"}
      </button>
    </div>
  );
}

