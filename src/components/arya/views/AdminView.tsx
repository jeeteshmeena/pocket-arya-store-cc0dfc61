import { useEffect, useState } from "react";
import { ChevronLeft, ChevronDown, Users, FileText, Activity, Edit, Trash2, Plus, X, MapPin, Smartphone, RefreshCw, Home, MessageSquare, Settings as SettingsIcon, Search, ShoppingBag, Bot, Library, ShieldAlert } from "lucide-react";
import { useApp } from "@/store/app-store";
import { fetchAdminStats, fetchAdminStories, saveAdminStory, deleteAdminStory, fetchAdminBanners, saveAdminBanner, deleteAdminBanner, fetchAdminBuyers, fetchAdminSupport, replyAdminSupport, uploadAdminImage, translateText, getOptimizedImage, fetchAdminRequests, updateAdminRequestStatus, manualAdminPurchase, fetchAdminSettings, updateAdminSetting, adminBuyerAction, BOT_USERNAME } from "@/lib/api";
import { EnterpriseAnalyticsPanel } from "@/components/arya/admin/EnterpriseAnalyticsPanel";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminView() {
  const { back, tgUser } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "store" | "buyers" | "support" | "settings">("dashboard");
  const [storeSubTab, setStoreSubTab] = useState<"stories" | "banners" | "requests">("stories");

  const [stats, setStats] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [storyRequests, setStoryRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminSettings, setAdminSettings] = useState<{ mini_app_enabled: boolean; tnc_enabled: boolean }>({ mini_app_enabled: true, tnc_enabled: true });
  const [settingsSaving, setSettingsSaving] = useState<string | null>(null);

  // Forms State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);

  // Manual Purchase & Sub-Page State
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ user_id: "", first_name: "", username: "", story_id: "", amount: 0 });
  const [manualSaving, setManualSaving] = useState(false);
  const [moreSubTab, setMoreSubTab] = useState<"buyers" | "support">("buyers");
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);

  useEffect(() => {
    if (!tgUser?.telegram_id) {
      setError("Please open in Telegram to access Admin Panel.");
      setLoading(false);
      return;
    }
    loadData();
  }, [tgUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, storiesData, bannersData, buyersData, supportData, requestsData] = await Promise.all([
        fetchAdminStats(tgUser),
        fetchAdminStories(tgUser),
        fetchAdminBanners(tgUser),
        fetchAdminBuyers(tgUser),
        fetchAdminSupport(tgUser),
        fetchAdminRequests(tgUser),
      ]);
      setStats(statsData);
      setStories(storiesData);
      setBanners(bannersData);
      setBuyers(buyersData);
      setSupportTickets(supportData);
      setStoryRequests(requestsData);
      // Load admin feature settings (non-blocking)
      fetchAdminSettings(tgUser).then(s => setAdminSettings(s)).catch(() => {});
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm("Delete this story?")) return;
    try {
      await deleteAdminStory(tgUser, storyId);
      setStories(stories.filter(s => s.story_id !== storyId));
    } catch (err: any) { alert("Failed: " + err.message); }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await deleteAdminBanner(tgUser, bannerId);
      setBanners(banners.filter(b => b.id !== bannerId));
    } catch (err: any) { alert("Failed: " + err.message); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      const { _id, ...storyToSave } = editingStory;
      await saveAdminStory(tgUser, storyToSave);
      await loadData();
      setIsFormOpen(false);
    } catch (err: any) { alert("Failed: " + err.message); } 
    finally { setFormSaving(false); }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      await saveAdminBanner(tgUser, editingBanner);
      await loadData();
      setIsBannerFormOpen(false);
    } catch (err: any) { alert("Failed: " + err.message); } 
    finally { setFormSaving(false); }
  };

  const handleReplySupport = async (ticketId: string, replyText: string) => {
    try {
      await replyAdminSupport(tgUser, ticketId, replyText);
      setSupportTickets(supportTickets.filter(t => t.id !== ticketId));
    } catch (err: any) { alert("Failed: " + err.message); }
  };

  const handleManualPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgUser) return;
    setManualSaving(true);
    try {
      await manualAdminPurchase(tgUser, { ...manualForm, user_id: parseInt(manualForm.user_id) || manualForm.user_id });
      alert("Story successfully added to user's account!");
      setIsManualFormOpen(false);
      // Refresh buyers list
      fetchAdminBuyers(tgUser).then(d => setBuyers(d));
      // Refresh stats
      fetchAdminStats(tgUser).then(d => setStats(d?.data || d));
    } catch (e: any) {
      alert("Failed: " + e.message);
    } finally {
      setManualSaving(false);
    }
  };

  const compressImageClientSide = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width; let height = img.height;
          const max_size = 800;
          if (width > height && width > max_size) { height *= max_size / width; width = max_size; } 
          else if (height > max_size) { width *= max_size / height; height = max_size; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }));
          }, "image/webp", 0.75);
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
      const file = await compressImageClientSide(originalFile);
      const result = await uploadAdminImage(tgUser, file);
      setEditingStory((s: any) => ({ ...s, poster_url: result.poster_url || s.poster_url, image: result.file_id || s.image }));
    } catch (err: any) { alert("Upload failed: " + err.message); } 
    finally { setImageUploading(false); }
  };

  // Translates DESCRIPTION only — story names are NEVER auto-translated
  // because the title is the same name in a different script (not a different language).
  // Auto-translating names causes corruption like "Tere Ishq Mein" → "In Love".
  const handleAutoTranslate = async (field: "hi" | "en") => {
    if (!editingStory) return;
    setTranslating(field);
    try {
      if (field === "hi") {
        const descHi = editingStory.description
          ? await translateText(editingStory.description, "hi")
          : (editingStory.description_hi || "");
        setEditingStory((s: any) => ({ ...s, description_hi: descHi }));
      } else {
        const descEn = editingStory.description_hi
          ? await translateText(editingStory.description_hi, "en")
          : (editingStory.description || "");
        setEditingStory((s: any) => ({ ...s, description: descEn }));
      }
    } catch { alert("Translation failed."); }
    finally { setTranslating(null); }
  };

  const openForm = (story: any = null) => {
    if (story) setEditingStory({ ...story });
    else {
      setEditingStory({
        story_id: `story_${Date.now()}`, bot_id: "", bot_username: "UseAryaBot", start_id: "", end_id: "", source: "",
        story_name_en: "", story_name_hi: "", story_name_hin: "", description: "", description_hi: "", episodes: "1", status: "available",
        genre: "Romance", language: "Hindi", price: 99, discount_price: 49, payment_methods: ["upi", "razorpay"],
        platform: "Pocket FM", delivery_mode: "pool", channel_id: "", image: "", poster_url: "", is_completed: false
      });
    }
    setIsFormOpen(true);
  };

  const getFlag = (country: string) => {
    const flags: Record<string, string> = { "India": "🇮🇳", "United Kingdom": "🇬🇧", "Canada": "🇨🇦", "South Korea": "🇰🇷", "United States": "🇺🇸", "Pakistan": "🇵🇰", "Bangladesh": "🇧🇩", "Nepal": "🇳🇵", "Sri Lanka": "🇱🇰", "United Arab Emirates": "🇦🇪", "Saudi Arabia": "🇸🇦", "Singapore": "🇸🇬", "Malaysia": "🇲🇾", "Indonesia": "🇮🇩", "Germany": "🇩🇪", "France": "🇫🇷", "Italy": "🇮🇹", "Spain": "🇪🇸", "Australia": "🇦🇺", "Russia": "🇷🇺", "China": "🇨🇳" };
    return flags[country] || "🌐";
  };

  const isAnalyticsTab = activeTab === "analytics";

  if (error) {
    return (
      <div className="flex flex-col min-h-full p-4 bg-white text-black">
        <button onClick={back} className="mb-4 self-start p-2 rounded-full border border-gray-200">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="p-6 text-center border border-gray-200 rounded-2xl">
          <div className="text-red-500 mb-2 font-bold uppercase tracking-widest text-sm">Access Denied</div>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Sub-page router: buyer detail or manual grant
  if (selectedBuyer) {
    return <BuyerDetailPage buyer={selectedBuyer} stories={stories} tgUser={tgUser} onBack={() => setSelectedBuyer(null)} />;
  }
  if (isManualFormOpen) {
    return (
      <ManualGrantPage
        stories={stories}
        manualForm={manualForm}
        setManualForm={setManualForm}
        manualSaving={manualSaving}
        onSubmit={handleManualPurchase}
        onBack={() => setIsManualFormOpen(false)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col min-h-full font-sans pb-24 transition-colors duration-200",
        isAnalyticsTab ? "bg-zinc-950 text-zinc-100" : "bg-white text-black",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b",
          isAnalyticsTab
            ? "border-zinc-800 bg-zinc-950/95 backdrop-blur-sm"
            : "bg-white border-gray-100 shadow-sm",
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={back}
            className={cn(
              "p-1.5 rounded-full transition",
              isAnalyticsTab ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-gray-50",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className={cn("text-base font-semibold tracking-tight", isAnalyticsTab && "text-white")}>Arya Admin</span>
        </div>
        <button
          onClick={loadData}
          className={cn(
            "p-2 rounded-full transition",
            isAnalyticsTab ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-50",
          )}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className={cn("flex-1 overflow-y-auto", isAnalyticsTab && "bg-black")}>
        {loading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4">
                
                {/* Revenue Card */}
                <div className="bg-[#1a1a1a] text-white p-6 rounded-[28px] shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="text-sm text-gray-400 font-medium">Total Revenue</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">All Time</span>
                  </div>
                  <div className="text-4xl font-black tracking-tight mb-5 relative z-10">₹{(stats?.total_revenue || 0).toLocaleString()}</div>
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="text-[10px] text-gray-400 mb-1">🤖 Bot Revenue</div>
                      <div className="font-bold text-sm">₹{(stats?.bot_revenue || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3">
                      <div className="text-[10px] text-gray-400 mb-1">📱 Mini App</div>
                      <div className="font-bold text-sm">₹{(stats?.miniapp_revenue || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* KPI Cards — Bot vs Mini App Users */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute -right-2 -top-2 opacity-5"><Bot className="w-20 h-20" /></div>
                    <div className="mb-2 text-blue-500"><Bot className="w-7 h-7" /></div>
                    <div className="text-2xl font-black">{(stats?.bot_users || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">Bot Users</div>
                    <div className="text-[10px] text-blue-500 font-bold mt-2">Telegram Bot</div>
                  </div>
                  <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute -right-2 -top-2 opacity-5"><Smartphone className="w-20 h-20" /></div>
                    <div className="mb-2 text-emerald-500"><Smartphone className="w-7 h-7" /></div>
                    <div className="text-2xl font-black">{(stats?.miniapp_users || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">Mini App Users</div>
                    <div className="text-[10px] text-emerald-500 font-bold mt-2">Web Store</div>
                  </div>
                  <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute -right-2 -top-2 opacity-5"><Library className="w-20 h-20" /></div>
                    <div className="mb-2 text-purple-500"><Library className="w-7 h-7" /></div>
                    <div className="text-2xl font-black">{stats?.total_stories || 0}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">Stories</div>
                    <div className="text-[10px] text-purple-500 font-bold mt-2">Available</div>
                  </div>
                  <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute -right-2 -top-2 opacity-5"><ShoppingBag className="w-20 h-20" /></div>
                    <div className="mb-2 text-rose-500"><ShoppingBag className="w-7 h-7" /></div>
                    <div className="text-2xl font-black">{buyers?.length || 0}</div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">Total Orders</div>
                    <div className="text-[10px] text-rose-500 font-bold mt-2 hover:underline cursor-pointer" onClick={() => setActiveTab("support")}>Requests: {storyRequests?.length || 0}</div>
                  </div>
                </div>

                {/* Overview — Real Data from Recent Orders */}
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="font-bold text-base">Recent Activity</h2>
                      <p className="text-[11px] text-gray-400">Last {stats?.recent_orders?.length || 0} orders</p>
                    </div>
                    <button onClick={()=>setActiveTab("analytics")} className="text-[11px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">Analytics →</button>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs text-gray-400 font-bold px-1">
                      <span>Bot Orders</span>
                      <span>{stats?.recent_orders?.filter((o:any)=>o.source==='bot'||o.source==='manual_admin').length || 0}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{width:`${Math.min(100,((stats?.recent_orders?.filter((o:any)=>o.source==='bot'||o.source==='manual_admin').length||0)/Math.max(1,stats?.recent_orders?.length||1))*100)}%`}} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 font-bold px-1">
                      <span>Mini App Orders</span>
                      <span>{stats?.recent_orders?.filter((o:any)=>o.source!=='bot'&&o.source!=='manual_admin').length || 0}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.min(100,((stats?.recent_orders?.filter((o:any)=>o.source!=='bot'&&o.source!=='manual_admin').length||0)/Math.max(1,stats?.recent_orders?.length||1))*100)}%`}} />
                    </div>
                  </div>
                </div>

                {/* Recent Projects / Orders */}
                <div>
                  <div className="flex justify-between items-end mb-4 px-1">
                    <h2 className="font-bold text-lg">Recent Orders</h2>
                    <button onClick={()=>setActiveTab("buyers")} className="text-xs font-bold text-gray-500">View All</button>
                  </div>
                  <div className="space-y-3">
                    {stats?.recent_orders?.slice(0,3).map((o: any, i: number) => (
                      <div key={i} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full border-2 border-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-50 shrink-0">
                            {(o.first_name || o.username || "U")[0]?.toUpperCase()}
                          </div>
                          <div>
                            <a
                              href={o.user_id ? `tg://user?id=${o.user_id}` : undefined}
                              className="font-bold text-sm text-gray-900 hover:underline"
                            >{o.first_name || o.username || "User"}</a>
                            <div className="text-[10px] text-gray-500">{o.story_names?.[0] || o.username || `Order #${(o.order_id || "").slice(-6)}`}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">₹{(o.amount || 0).toLocaleString()}</div>
                          <div className={cn("text-[10px] font-bold mt-0.5 uppercase", o.status === "paid" ? "text-emerald-500" : "text-gray-400")}>{o.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dashboard: Support Tickets & Requests Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Recent Support Tickets */}
                  <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Support Tickets</h3>
                      <button onClick={() => { setActiveTab("support"); setMoreSubTab("support"); }} className="text-xs font-bold text-blue-500 hover:underline">View All</button>
                    </div>
                    {supportTickets.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-xs">No open tickets</div>
                    ) : (
                      <div className="space-y-3">
                        {supportTickets.slice(0, 3).map(ticket => (
                          <div key={ticket.id} onClick={() => { setActiveTab("support"); setMoreSubTab("support"); }} className="p-3 bg-gray-50 rounded-[16px] cursor-pointer hover:bg-gray-100 transition">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-sm truncate pr-2">{ticket.username || ticket.first_name || "User"}</span>
                              <span className="text-[10px] text-gray-400 shrink-0">{new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{ticket.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Story Requests */}
                  <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Story Requests</h3>
                      <button onClick={() => { setActiveTab("store"); setStoreSubTab("requests"); }} className="text-xs font-bold text-blue-500 hover:underline">View All</button>
                    </div>
                    {storyRequests.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-xs">No pending requests</div>
                    ) : (
                      <div className="space-y-3">
                        {storyRequests.slice(0, 3).map(req => (
                          <div key={req.id} onClick={() => { setActiveTab("store"); setStoreSubTab("requests"); }} className="p-3 bg-gray-50 rounded-[16px] cursor-pointer hover:bg-gray-100 transition flex justify-between items-center">
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-sm truncate">{req.story_name}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">{req.platform} • By {req.username || req.first_name || "User"}</div>
                            </div>
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0", req.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-600")}>{req.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {activeTab === "analytics" && (
              <div className="min-h-[calc(100dvh-12rem)]">
                <EnterpriseAnalyticsPanel identity={tgUser} />
              </div>
            )}

            {activeTab === "store" && (
              <div className="p-4 space-y-6">
                <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl shadow-inner">
                  {["stories", "banners", "requests"].map((tab) => (
                    <button key={tab} onClick={() => setStoreSubTab(tab as any)} className={cn("flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all duration-300", storeSubTab === tab ? "bg-white text-black shadow-sm border border-gray-200" : "text-gray-500 hover:text-black")}>
                      {tab}
                    </button>
                  ))}
                </div>

                {storeSubTab === "stories" && (
                  <div className="space-y-4">
                    <button onClick={() => openForm()} className="w-full py-4 flex justify-center items-center gap-2 font-black rounded-2xl transition bg-black text-white shadow-md active:scale-95">
                      <Plus className="h-5 w-5" /> Add New Story
                    </button>
                    <div className="space-y-3">
                      {stories.map(story => (
                        <div key={story.story_id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden relative border border-gray-100">
                            {story.poster_url ? <img src={getOptimizedImage(story.poster_url) || ""} className="w-full h-full object-cover" /> : <FileText className="absolute inset-0 m-auto h-6 w-6 text-gray-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-900 truncate">{story.story_name_en || story.name}</div>
                            <div className="text-xs text-gray-500 mt-1">₹{story.price} • {story.status}</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => openForm(story)} className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-200 hover:text-black"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(story.story_id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {storeSubTab === "banners" && (
                  <div className="space-y-4">
                    <button onClick={() => { setEditingBanner({ id: "new", image_url: "", target_link: "", order: banners.length }); setIsBannerFormOpen(true); }} className="w-full py-4 flex justify-center items-center gap-2 font-black rounded-2xl transition bg-black text-white shadow-md active:scale-95">
                      <Plus className="h-5 w-5" /> Add Banner
                    </button>
                    <div className="space-y-3">
                      {banners.map(banner => (
                        <div key={banner.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex gap-4 items-center">
                          <img src={getOptimizedImage(banner.image_url) || ""} alt="Banner" className="w-24 h-14 object-cover rounded-xl bg-gray-50 shadow-inner" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 truncate">{banner.target_link}</div>
                            <div className="text-xs font-bold text-black mt-1">Order: {banner.order}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingBanner(banner); setIsBannerFormOpen(true); }} className="p-2 rounded-xl bg-gray-50 text-black hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {storeSubTab === "requests" && (
                  <div className="space-y-4">
                    {storyRequests.map(req => (
                      <StoryRequestCard key={req.id} req={req} onUpdate={(id:string, status:string, reply?:string) => {
                        updateAdminRequestStatus(tgUser, id, status, reply).then(() => setStoryRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))).catch(e => alert("Failed: " + e.message));
                      }} />
                    ))}
                  </div>
                )}

              </div>
            )}

            {(activeTab === "buyers" || activeTab === "support") && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* More Sub-Nav */}
                <div className="flex gap-2 p-3 bg-white border-b border-gray-100">
                  <button onClick={() => setMoreSubTab("buyers")} className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition", moreSubTab === "buyers" ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:text-black")}>Orders & Buyers</button>
                  <button onClick={() => setMoreSubTab("support")} className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition", moreSubTab === "support" ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:text-black")}>Support {supportTickets.length > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{supportTickets.length}</span>}</button>
                </div>

                 {moreSubTab === "buyers" && (
                  <div className="space-y-4 p-4">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                      <h2 className="font-bold text-xl text-black">Orders & Buyers</h2>
                      <div className="flex gap-2">
                        <button onClick={() => openTelegramLink(`https://t.me/${BOT_USERNAME}?start=bcast`)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100">
                          <MessageSquare className="h-3.5 w-3.5" /> Broadcast All
                        </button>
                        <button onClick={() => { setManualForm({ user_id: "", first_name: "", username: "", story_id: "", amount: 0 }); setIsManualFormOpen(true); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-black text-white font-bold">
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                    </div>
                    {buyers.length === 0 && <div className="text-center p-10 text-gray-400">No buyers yet</div>}

                    {/* Pending & Processing Section */}
                    {buyers.filter(b => b.status === "pending" || b.status === "processing").length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Pending / Processing</h3>
                        <div className="space-y-3">
                          {buyers.filter(b => b.status === "pending" || b.status === "processing").map((buyer, i) => (
                            <div key={`pending-${i}`} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.99] transition">
                              <div className="h-11 w-11 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-sm overflow-hidden border border-gray-100 shrink-0">
                                {buyer.photo_url
                                  ? <img src={buyer.photo_url} className="w-full h-full object-cover" alt="" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                                  : <span className="text-gray-600">{(buyer.first_name || buyer.username || "U")[0].toUpperCase()}</span>
                                }
                              </div>
                              <div className="flex-1 min-w-0" onClick={() => setSelectedBuyer(buyer)}>
                                <a href={`tg://user?id=${buyer.user_id}`} className="font-bold text-sm text-gray-900 truncate hover:underline block">{buyer.first_name || buyer.username || "Unknown"}</a>
                                <div className="text-[10px] text-gray-500">@{buyer.username || "none"} • ID: {buyer.user_id}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{buyer.payments?.length || 0} purchase{(buyer.payments?.length||0)!==1?'s':''} • {buyer.source === 'bot' ? 'Bot' : 'Mini App'}</div>
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                <span className="text-[9px] px-2 py-0.5 rounded-full uppercase inline-block font-bold bg-amber-100 text-amber-700">{buyer.status}</span>
                                <div className="flex gap-1.5 mt-1">
                                  <button onClick={(e) => { e.stopPropagation(); openTelegramLink(`tg://user?id=${buyer.user_id}`); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><MessageSquare className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => setSelectedBuyer(buyer)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Section */}
                    {buyers.filter(b => b.status === "paid" || b.status === "completed" || b.status === "approved").length > 0 && (
                      <div>
                        <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Completed / Paid</h3>
                        <div className="space-y-3">
                          {buyers.filter(b => b.status === "paid" || b.status === "completed" || b.status === "approved").map((buyer, i) => (
                            <div key={`completed-${i}`} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.99] transition">
                              <div className="h-11 w-11 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-sm overflow-hidden border border-gray-100 shrink-0">
                                {buyer.photo_url
                                  ? <img src={buyer.photo_url} className="w-full h-full object-cover" alt="" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                                  : <span className="text-gray-600">{(buyer.first_name || buyer.username || "U")[0].toUpperCase()}</span>
                                }
                              </div>
                              <div className="flex-1 min-w-0" onClick={() => setSelectedBuyer(buyer)}>
                                <div className="font-bold text-sm text-gray-900 truncate">{buyer.first_name || buyer.username || "Unknown"}</div>
                                <div className="text-[10px] text-gray-500">@{buyer.username || "none"} • ID: {buyer.user_id}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{buyer.payments?.length || 0} purchase{(buyer.payments?.length||0)!==1?'s':''} • {buyer.source === 'bot' ? 'Bot' : 'Mini App'}</div>
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                <div className="font-black text-gray-900 text-sm">₹{(buyer.amount||0).toLocaleString()}</div>
                                <div className="flex gap-1.5 mt-1">
                                  <button onClick={(e) => { e.stopPropagation(); openTelegramLink(`tg://user?id=${buyer.user_id}`); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><MessageSquare className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => setSelectedBuyer(buyer)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {moreSubTab === "support" && (
                  <div className="space-y-4 p-4">
                    <h2 className="text-xl font-bold mb-2">Support Tickets</h2>
                    {supportTickets.length === 0 
                      ? <div className="text-center p-10 text-gray-400"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No open tickets</p></div>
                      : supportTickets.map(ticket => (
                        <SupportTicketCard key={ticket.id} ticket={ticket} onReply={handleReplySupport} />
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      


      {/* Forms Modal Renderings */}
      {isFormOpen && editingStory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] p-6 bg-white shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
              <h2 className="text-xl font-black">{(editingStory?.story_id || "").startsWith("story_") ? "Add Story" : "Edit Story"}</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-4 p-5 rounded-[24px] bg-gray-50 border border-gray-100">
                <h3 className="font-black text-sm uppercase tracking-wider">Basic Details</h3>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Story ID</label>
                  <input required type="text" value={editingStory.story_id || ""} onChange={e => setEditingStory({...editingStory, story_id: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium" disabled={!(editingStory?.story_id || "").startsWith("story_")} />
                </div>
                {/* Story Name — admin manually enters both scripts. Names are NEVER auto-translated. */}
                <div className="p-3 rounded-[14px] bg-blue-50 border border-blue-200 text-[11px] text-blue-700 font-semibold">
                  📝 Story name <b>script</b> change karo, language/meaning NAHI. Roman script ke liye EN field, Devanagari ke liye HI field.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Name (Roman Script) <span className="text-gray-400 normal-case font-normal">— English/Hinglish</span></label>
                    <input required type="text" value={editingStory.story_name_en} onChange={e => setEditingStory({...editingStory, story_name_en: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium" placeholder="e.g. Tere Ishq Mein" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Name (देवनागरी) <span className="text-gray-400 normal-case font-normal">— Hindi mode</span></label>
                    <input type="text" value={editingStory.story_name_hi || ""} onChange={e => setEditingStory({...editingStory, story_name_hi: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium" placeholder="e.g. तेरे इश्क में" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Desc (EN)</label>
                  <textarea rows={2} value={editingStory.description || ""} onChange={e => setEditingStory({...editingStory, description: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Desc (HI)</label>
                  <textarea rows={2} value={editingStory.description_hi || ""} onChange={e => setEditingStory({...editingStory, description_hi: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={!!translating} onClick={() => handleAutoTranslate("hi")} className="flex-1 py-2.5 text-xs font-bold rounded-[12px] bg-blue-50 text-blue-600 disabled:opacity-50">Desc EN → HI</button>
                  <button type="button" disabled={!!translating} onClick={() => handleAutoTranslate("en")} className="flex-1 py-2.5 text-xs font-bold rounded-[12px] bg-emerald-50 text-emerald-600 disabled:opacity-50">Desc HI → EN</button>
                </div>
              </div>

              <div className="space-y-4 p-5 rounded-[24px] bg-gray-50 border border-gray-100">
                <h3 className="font-black text-sm uppercase tracking-wider">Pricing & Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Price (₹)</label>
                    <input required type="number" value={editingStory.price} onChange={e => setEditingStory({...editingStory, price: Number(e.target.value)})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Discount (₹)</label>
                    <input required type="number" value={editingStory.discount_price} onChange={e => setEditingStory({...editingStory, discount_price: Number(e.target.value)})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Status</label>
                     <select value={editingStory.status} onChange={e => setEditingStory({...editingStory, status: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium">
                       <option value="available">Available</option>
                       <option value="coming_soon">Coming Soon</option>
                       <option value="hidden">Hidden</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Platform</label>
                     <select value={editingStory.platform || "Pocket FM"} onChange={e => setEditingStory({...editingStory, platform: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium">
                       {["Pocket FM","Kuku FM","Audible","StoryTel","Other"].map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                  </div>
                </div>
                <div>
                   <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Poster Image</label>
                   {editingStory.poster_url && <img src={getOptimizedImage(editingStory.poster_url) || ""} className="w-full h-40 object-cover rounded-[16px] mb-3" />}
                   <label className={cn("flex items-center justify-center gap-2 w-full py-3.5 rounded-[16px] border-2 border-dashed border-gray-300 cursor-pointer text-sm font-bold transition hover:bg-gray-100", imageUploading && "opacity-50")}>
                     {imageUploading ? "Processing..." : "Upload File"}
                     <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
                   </label>
                   <input type="url" value={editingStory.poster_url || ""} onChange={e => setEditingStory({...editingStory, poster_url: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 mt-2 font-medium" placeholder="Or enter URL" />
                </div>
              </div>

              <div className="space-y-4 p-5 rounded-[24px] bg-gray-50 border border-gray-100">
                <h3 className="font-black text-sm uppercase tracking-wider">Bot Config</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Bot ID</label>
                    <input type="number" value={editingStory.bot_id || ""} onChange={e => setEditingStory({...editingStory, bot_id: Number(e.target.value)})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Bot Username</label>
                    <input type="text" value={editingStory.bot_username || ""} onChange={e => setEditingStory({...editingStory, bot_username: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Start ID</label>
                    <input type="number" value={editingStory.start_id || ""} onChange={e => setEditingStory({...editingStory, start_id: Number(e.target.value)})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">End ID</label>
                    <input type="number" value={editingStory.end_id || ""} onChange={e => setEditingStory({...editingStory, end_id: Number(e.target.value)})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Source Ch ID</label>
                    <input type="number" value={editingStory.source || ""} onChange={e => setEditingStory({...editingStory, source: Number(e.target.value)})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Delivery Ch ID</label>
                    <input type="number" value={editingStory.channel_id || ""} onChange={e => setEditingStory({...editingStory, channel_id: Number(e.target.value)})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 font-medium" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-3 p-3 rounded-[16px] border border-gray-200 bg-white cursor-pointer mt-2">
                    <input type="checkbox" checked={editingStory.is_completed} onChange={e => setEditingStory({...editingStory, is_completed: e.target.checked})} className="h-5 w-5 rounded border-gray-300 accent-black" />
                    <span className="text-sm font-bold">Mark as Story Completed</span>
                  </label>
                </div>
              </div>

              <button disabled={formSaving} type="submit" className="w-full py-4 font-black text-lg rounded-[20px] bg-[#111827] text-white shadow-xl hover:bg-black active:scale-[0.98] transition">
                {formSaving ? "Saving..." : "Save Story"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Admin Settings Tab ── */}
      {activeTab === "settings" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 space-y-5">
          <div>
            <h2 className="font-black text-xl mb-1">⚙️ Ecosystem Settings</h2>
            <p className="text-xs text-gray-500">Configure global bot and mini app behaviour. Changes take effect immediately.</p>
          </div>

          {/* Mini App Deep Links Toggle */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="font-bold text-base flex items-center gap-2">📱 Mini App Deep Links</div>
                <p className="text-xs text-gray-500 mt-1">
                  When <b>ON</b>, story buy links open in the Mini App (Web Store).<br />
                  When <b>OFF</b>, links open directly in the Telegram Bot (old behavior).
                </p>
              </div>
              <button
                disabled={settingsSaving === "mini_app_enabled"}
                onClick={async () => {
                  if (!tgUser) return;
                  const newVal = !adminSettings.mini_app_enabled;
                  setSettingsSaving("mini_app_enabled");
                  try {
                    await updateAdminSetting(tgUser, "mini_app_enabled", newVal);
                    setAdminSettings(s => ({ ...s, mini_app_enabled: newVal }));
                  } catch (e: any) { alert("Failed: " + e.message); }
                  finally { setSettingsSaving(null); }
                }}
                className={cn(
                  "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                  adminSettings.mini_app_enabled ? "bg-black" : "bg-gray-300",
                  settingsSaving === "mini_app_enabled" && "opacity-60 cursor-not-allowed"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-6 w-6 translate-y-[-1px] rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out mt-[1px] ml-[1px]",
                  adminSettings.mini_app_enabled ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>
            <div className={cn("mt-3 text-xs font-bold px-3 py-1.5 rounded-full inline-block", adminSettings.mini_app_enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600")}>
              {adminSettings.mini_app_enabled ? "✅ Mini App Links: ON" : "❌ Mini App Links: OFF (Bot only)"}
            </div>
          </div>

          {/* T&C Toggle */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="font-bold text-base flex items-center gap-2">📜 T&amp;C Requirement</div>
                <p className="text-xs text-gray-500 mt-1">
                  When <b>ON</b>, users must accept Terms &amp; Conditions before purchasing.<br />
                  When <b>OFF</b>, T&amp;C is auto-accepted silently (no modal shown).
                </p>
              </div>
              <button
                disabled={settingsSaving === "tnc_enabled"}
                onClick={async () => {
                  if (!tgUser) return;
                  const newVal = !adminSettings.tnc_enabled;
                  setSettingsSaving("tnc_enabled");
                  try {
                    await updateAdminSetting(tgUser, "tnc_enabled", newVal);
                    setAdminSettings(s => ({ ...s, tnc_enabled: newVal }));
                  } catch (e: any) { alert("Failed: " + e.message); }
                  finally { setSettingsSaving(null); }
                }}
                className={cn(
                  "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                  adminSettings.tnc_enabled ? "bg-black" : "bg-gray-300",
                  settingsSaving === "tnc_enabled" && "opacity-60 cursor-not-allowed"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-6 w-6 translate-y-[-1px] rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out mt-[1px] ml-[1px]",
                  adminSettings.tnc_enabled ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>
            <div className={cn("mt-3 text-xs font-bold px-3 py-1.5 rounded-full inline-block", adminSettings.tnc_enabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
              {adminSettings.tnc_enabled ? "✅ T&C Prompt: ON" : "⚠️ T&C: OFF (Auto-accepted)"}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-[16px] p-4 text-xs text-blue-700 font-medium">
            💡 Changes are saved to the database and reflected in both the Telegram Bot and Mini App immediately — no restart needed.
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between items-center z-50 pb-[max(env(safe-area-inset-bottom),12px)] border-t",
          isAnalyticsTab
            ? "border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
            : "bg-white border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]",
        )}
      >
        <NavBtn active={activeTab === "dashboard"} icon={Home} label="Home" onClick={() => setActiveTab("dashboard")} dark={isAnalyticsTab} />
        <NavBtn active={activeTab === "analytics"} icon={Activity} label="Analytics" onClick={() => setActiveTab("analytics")} dark={isAnalyticsTab} />
        <NavBtn active={activeTab === "store"} icon={ShoppingBag} label="Store" onClick={() => setActiveTab("store")} dark={isAnalyticsTab} />
        <NavBtn
          active={activeTab === "buyers" || activeTab === "support"}
          icon={Users}
          label="More"
          onClick={() => {
            setActiveTab("buyers");
            setMoreSubTab("buyers");
          }}
          dark={isAnalyticsTab}
        />
        <NavBtn active={activeTab === "settings"} icon={SettingsIcon} label="Settings" onClick={() => setActiveTab("settings")} dark={isAnalyticsTab} />
      </div>
    </div>
  );
}

function NavBtn({
  active,
  icon: Icon,
  label,
  onClick,
  dark,
}: {
  active: boolean;
  icon: typeof Home;
  label: string;
  onClick: () => void;
  dark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors w-16",
        dark
          ? active
            ? "text-white"
            : "text-zinc-500 hover:text-zinc-300"
          : active
            ? "text-black"
            : "text-gray-400 hover:text-gray-800",
      )}
    >
      <Icon
        className={cn("h-6 w-6", active && (dark ? "text-white" : "fill-black stroke-black"))}
        strokeWidth={active ? 2.5 : 2}
      />
      <span className={cn("text-[10px] font-medium tracking-wide", active && (dark ? "font-semibold text-white" : "text-black font-bold"))}>{label}</span>
    </button>
  );
}

function SupportTicketCard({ ticket, onReply }: any) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try { await onReply(ticket.id, reply); setReply(""); } 
    finally { setSending(false); }
  };
  return (
    <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm shrink-0">
          {(ticket.first_name || ticket.username || "U")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{ticket.first_name || ticket.username || "User"}</div>
          <div className="text-[10px] text-gray-400">@{ticket.username || ""} • {ticket.type || "support"}</div>
        </div>
        <span className="text-[9px] bg-gray-100 px-2 py-1 rounded-lg font-bold text-gray-500 uppercase">{ticket.status || "open"}</span>
      </div>
      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-[14px] mb-3">{ticket.text}</p>
      <textarea rows={2} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type reply..." className="w-full p-3 rounded-[14px] bg-gray-50 border border-gray-200 text-sm mb-2 outline-none resize-none focus:border-gray-300" />
      <button onClick={send} disabled={sending || !reply.trim()} className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-[14px] disabled:opacity-50 transition">{sending ? "Sending..." : "Reply to User"}</button>
    </div>
  );
}


function StoryRequestCard({ req, onUpdate }: any) {
  const [replyText, setReplyText] = useState("");
  const STATUS = ["open", "in_progress", "completed", "rejected"];
  return (
    <div className="p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold text-sm">{req.first_name || "Unknown"}</div>
          <div className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleDateString()}</div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-md uppercase font-bold bg-gray-100 text-gray-600">{(req.status || "open").replace("_", " ")}</span>
      </div>
      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-[16px] font-medium">{req.text}</p>
      <textarea rows={2} placeholder="Optional reply..." value={replyText} onChange={e => setReplyText(e.target.value)} className="w-full p-3 rounded-[16px] text-sm outline-none resize-none bg-gray-50 focus:bg-white border border-transparent focus:border-gray-200 transition" />
      <div className="grid grid-cols-2 gap-2">
        {STATUS.map(s => (
          <button key={s} onClick={() => { onUpdate(req.id, s, replyText.trim()||undefined); setReplyText(""); }} className={"py-2 text-[10px] font-bold rounded-[12px] uppercase " + (req.status === s ? "bg-[#111827] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Buyer Detail Sub-Page ───────────────────────────────────────────────────
function BuyerDetailPage({ buyer, stories, tgUser, onBack }: any) {
  const story = (name: string) => stories.find((s: any) => s.story_name_en === name || s.story_id === name);
  const joinedDate = buyer.joined_at ? new Date(buyer.joined_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "Unknown";
  const firstOrderDate = buyer.payments?.[0]?.created_at ? new Date(buyer.payments[0].created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : null;
  return (
    <div className="flex flex-col min-h-full bg-[#f9f9f9] text-black font-sans pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-50 rounded-full"><ChevronLeft className="h-5 w-5" /></button>
        <span className="font-black text-base">Buyer Details</span>
      </div>

      {/* User Profile Card */}
      <div className="bg-white m-4 rounded-[24px] p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-gray-200 shrink-0">
            {buyer.photo_url
              ? <img src={buyer.photo_url} className="w-full h-full object-cover" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span>{(buyer.first_name || buyer.username || "U")[0].toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <a
              href={`tg://user?id=${buyer.user_id}`}
              className="font-black text-lg truncate block hover:underline text-gray-900"
            >{buyer.first_name || "Unknown"}</a>
            <div className="text-sm text-gray-500">@{buyer.username || "no username"}</div>
            <div className="text-xs text-gray-400 font-mono mt-0.5">TG ID: {buyer.user_id}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-[16px] p-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Source</div>
            <div className="font-bold text-sm">{buyer.source === 'bot' ? '🤖 Telegram Bot' : buyer.source === 'manual_admin' ? '🛠️ Manual' : buyer.source === 'both' ? '🤖 + 📱 Both' : '📱 Mini App'}</div>
          </div>
          <div className="bg-gray-50 rounded-[16px] p-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Spent</div>
            <div className="font-black text-sm text-emerald-600">₹{(buyer.amount || 0).toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-[16px] p-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</div>
            <div className={`font-bold text-sm capitalize ${buyer.status === 'paid' ? 'text-emerald-600' : 'text-gray-600'}`}>{buyer.status || "unknown"}</div>
          </div>
          <div className="bg-gray-50 rounded-[16px] p-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">First Order</div>
            <div className="font-bold text-xs">{firstOrderDate || "N/A"}</div>
          </div>
        </div>
        
        {/* Admin Controls */}
        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to wipe all records for this user?")) {
                adminBuyerAction(tgUser?.telegram_id, buyer.user_id, "wipe").then(() => { alert("Wiped successfully"); window.location.reload(); }).catch(e => alert(e.message));
              }
            }}
            className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-50 transition">
            <Trash2 className="h-4 w-4" /> Wipe Data
          </button>
          <button 
            onClick={() => {
              if (window.confirm("Ban this user from using the bot?")) {
                adminBuyerAction(tgUser?.telegram_id, buyer.user_id, "ban").then(() => { alert("Banned successfully"); window.location.reload(); }).catch(e => alert(e.message));
              }
            }}
            className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-600 transition">
            <ShieldAlert className="h-4 w-4" /> Ban User
          </button>
        </div>
        {buyer.joined_at && (
          <div className="mt-3 text-[11px] text-gray-400 text-center">Member since {joinedDate}</div>
        )}
      </div>

      {/* Purchase History */}
      <div className="px-4">
        <h3 className="font-black text-base mb-3">Purchase History ({buyer.payments?.length || 0})</h3>
        {!buyer.payments?.length && (
          <div className="text-center p-10 text-gray-400 bg-white rounded-[20px] border border-gray-100">No purchases yet</div>
        )}
        <div className="space-y-3">
          {buyer.payments?.map((p: any, i: number) => {
            const s = story(p.story_name);
            return (
              <div key={i} className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
                <div className="flex gap-3 items-start">
                  {s?.poster_url && (
                    <img src={s.poster_url} className="w-14 h-14 rounded-[12px] object-cover shrink-0" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{p.story_name || "Unknown Story"}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{p.platform || s?.platform || ""}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-bold capitalize">{p.method || "unknown"}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-sm">₹{p.amount || 0}</div>
                    {p.created_at && <div className="text-[10px] text-gray-400 mt-1">{new Date(p.created_at).toLocaleDateString("en-IN")}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Manual Grant Sub-Page ───────────────────────────────────────────────────
function ManualGrantPage({ stories, manualForm, setManualForm, manualSaving, onSubmit, onBack }: any) {
  return (
    <div className="flex flex-col min-h-full bg-[#f9f9f9] text-black font-sans pb-10">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-50 rounded-full"><ChevronLeft className="h-5 w-5" /></button>
        <span className="font-black text-base">Manual Grant Access</span>
      </div>
      <form onSubmit={onSubmit} className="p-4 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 text-xs text-amber-700 font-medium">
          ⚠️ Use this to grant story access to a user whose payment was confirmed but delivery failed.
        </div>
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-wider text-gray-500">User Details</h3>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Telegram User ID *</label>
            <input required type="text" value={manualForm.user_id} onChange={e => setManualForm({...manualForm, user_id: e.target.value})} placeholder="e.g. 123456789" className="w-full p-3.5 rounded-[14px] text-sm outline-none border border-gray-200 focus:border-black font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">First Name *</label>
              <input required type="text" value={manualForm.first_name} onChange={e => setManualForm({...manualForm, first_name: e.target.value})} placeholder="User name" className="w-full p-3.5 rounded-[14px] text-sm outline-none border border-gray-200 focus:border-black font-medium" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Username</label>
              <input type="text" value={manualForm.username} onChange={e => setManualForm({...manualForm, username: e.target.value})} placeholder="@username" className="w-full p-3.5 rounded-[14px] text-sm outline-none border border-gray-200 focus:border-black font-medium" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-wider text-gray-500">Story Details</h3>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Select Story *</label>
            <select required value={manualForm.story_id} onChange={e => setManualForm({...manualForm, story_id: e.target.value, amount: stories.find((s:any) => s.story_id === e.target.value)?.price || 0})} className="w-full p-3.5 rounded-[14px] text-sm outline-none border border-gray-200 focus:border-black font-medium bg-white">
              <option value="">-- Choose Story --</option>
              {stories.map((s:any) => <option key={s.story_id} value={s.story_id}>{s.story_name_en}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Amount Paid (₹) *</label>
            <input required type="number" min="0" value={manualForm.amount} onChange={e => setManualForm({...manualForm, amount: Number(e.target.value)})} className="w-full p-3.5 rounded-[14px] text-sm outline-none border border-gray-200 focus:border-black font-medium" />
          </div>
        </div>
        <button disabled={manualSaving} type="submit" className="w-full py-4 font-black text-base rounded-[20px] bg-black text-white shadow-xl hover:bg-gray-900 active:scale-[0.98] transition disabled:opacity-60">
          {manualSaving ? "Granting Access..." : "✅ Grant Story Access"}
        </button>
      </form>
    </div>
  );
}
