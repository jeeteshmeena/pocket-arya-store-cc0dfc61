import { useEffect, useState } from "react";
import { ChevronLeft, Users, FileText, Banknote, HelpCircle, Activity, Edit, Trash2, Plus, X, Image as ImageIcon, MapPin, Globe, Monitor, Smartphone, RefreshCw, TrendingUp, Home, Grid, MessageSquare, Clock, Settings as SettingsIcon } from "lucide-react";
import { useApp } from "@/store/app-store";
import { fetchAdminStats, fetchAdminStories, saveAdminStory, deleteAdminStory, fetchAdminBanners, saveAdminBanner, deleteAdminBanner, fetchAdminBuyers, fetchAdminSupport, replyAdminSupport, fetchAnalytics, fetchLocationAnalytics, uploadAdminImage, translateText, getOptimizedImage, fetchAdminRequests, updateAdminRequestStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export function AdminView() {
  const { back, tgUser, theme } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "store" | "buyers" | "support">("dashboard");
  const [storeSubTab, setStoreSubTab] = useState<"stories" | "banners" | "requests">("stories");

  const [stats, setStats] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [storyRequests, setStoryRequests] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [locationAnalytics, setLocationAnalytics] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);

  useEffect(() => {
    if (!tgUser?.telegram_id) {
      setError("Please open in Telegram to access Admin Panel.");
      setLoading(false);
      return;
    }
    loadData();
  }, [tgUser]);

  useEffect(() => {
    let interval: any;
    if (activeTab === "analytics" && tgUser?.telegram_id) {
      const load = () => {
        fetchLocationAnalytics(tgUser, 30)
          .then(d => { setLocationAnalytics(d); setLocationLoading(false); })
          .catch(() => setLocationLoading(false));
      };
      if (!locationAnalytics) setLocationLoading(true);
      load();
      interval = setInterval(load, 15000); // 15s refresh
    }
    return () => clearInterval(interval);
  }, [activeTab, tgUser?.telegram_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, storiesData, bannersData, buyersData, supportData, analyticsData, requestsData] = await Promise.all([
        fetchAdminStats(tgUser),
        fetchAdminStories(tgUser),
        fetchAdminBanners(tgUser),
        fetchAdminBuyers(tgUser),
        fetchAdminSupport(tgUser),
        fetchAnalytics(tgUser),
        fetchAdminRequests(tgUser),
      ]);
      setStats(statsData);
      setStories(storiesData);
      setBanners(bannersData);
      setBuyers(buyersData);
      setSupportTickets(supportData);
      setAnalytics(analyticsData);
      setStoryRequests(requestsData);
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
    } catch { alert("Translation failed."); } 
    finally { setTranslating(null); }
  };

  const openForm = (story: any = null) => {
    if (story) setEditingStory({ ...story });
    else {
      setEditingStory({
        story_id: `story_${Date.now()}`, bot_id: "", bot_username: "UseAryaBot", start_id: "", end_id: "", source: "",
        story_name_en: "", story_name_hi: "", description: "", description_hi: "", episodes: "1", status: "available",
        genre: "Romance", language: "Hindi", price: 99, discount_price: 49, payment_methods: ["upi", "razorpay"],
        platform: "Pocket FM", delivery_mode: "pool", channel_id: "", image: "", poster_url: "", is_completed: false
      });
    }
    setIsFormOpen(true);
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-full p-4 bg-[#f8f9fa] text-black">
        <button onClick={back} className="mb-4 self-start p-2 rounded-full bg-white border border-gray-200">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="p-6 text-center rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-red-500 mb-2 font-bold uppercase tracking-widest text-sm">Access Denied</div>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { day: "Mon", val: 2400 }, { day: "Tue", val: 1398 }, { day: "Wed", val: 9800 },
    { day: "Thu", val: 3908 }, { day: "Fri", val: 4800 }, { day: "Sat", val: 3800 }, { day: "Sun", val: 4300 }
  ];

  return (
    <div className="flex flex-col min-h-full pb-24 bg-[#f2f4f7] text-[#111827] relative font-sans">
      
      {/* Header Area */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3 items-center">
            <button onClick={back} className="p-2 rounded-full bg-white border border-gray-200 shadow-sm transition active:scale-95">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard, {tgUser?.first_name || "Admin"}</h1>
            </div>
          </div>
          <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
            {tgUser?.photo_url ? <img src={tgUser.photo_url} className="h-full w-full object-cover" /> : <div className="font-bold text-white">{tgUser?.first_name?.[0]}</div>}
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-[24px]" />
            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-28 rounded-[24px]" /><Skeleton className="h-28 rounded-[24px]" /></div>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Total Revenue Card - Dark Theme */}
                <div className="bg-[#1a1a1a] text-white p-6 rounded-[28px] shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="text-sm text-gray-400 font-medium">Total Revenue</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +12.5%
                    </span>
                  </div>
                  <div className="text-4xl font-black tracking-tight mb-6 relative z-10">₹{stats?.total_revenue?.toLocaleString() || 0}</div>
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>Sales</div>
                      <div className="font-bold">₹{buyers?.reduce((s:number,b:any)=>s+(b.amount||0),0).toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>Stories</div>
                      <div className="font-bold">{stats?.total_stories || 0} Total</div>
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="h-10 w-10 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-4 text-[#111827]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{stats?.total_users?.toLocaleString() || 0}</div>
                      <div className="text-xs text-gray-500 font-medium mt-1">Total Users</div>
                      <div className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Active Now</div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="h-10 w-10 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-4 text-[#111827]">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{stats?.recent_orders?.length || 0}</div>
                      <div className="text-xs text-gray-500 font-medium mt-1">New Orders</div>
                      <div className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1"><Activity className="w-3 h-3"/> Pending: {storyRequests?.length||0}</div>
                    </div>
                  </div>
                </div>

                {/* Overview Chart */}
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="font-bold text-lg">Overview</h2>
                      <p className="text-xs text-gray-500">Weekly Performance</p>
                    </div>
                    <button className="p-2 rounded-full bg-[#f3f4f6] text-gray-600"><Monitor className="w-4 h-4" /></button>
                  </div>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="val" radius={[6, 6, 6, 6]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.day === 'Wed' ? '#111827' : '#e5e7eb'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <button onClick={()=>setActiveTab("analytics")} className="w-full mt-4 py-3 bg-[#111827] text-white rounded-xl text-sm font-bold">View Full Report</button>
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
                          <div className="h-10 w-10 rounded-full border-[3px] border-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600 bg-emerald-50">
                            {o.username ? o.username.substring(0,2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{o.username || o.user_id}</div>
                            <div className="text-xs text-gray-500">Due in 2 days</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">₹{o.total_amount || o.amount || 0}</div>
                          <div className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">{o.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xl text-black">Insights & IP Tracker</h2>
                  <button onClick={() => { setLocationLoading(true); fetchLocationAnalytics(tgUser, 30).then(d=>{setLocationAnalytics(d); setLocationLoading(false);}).catch(()=>setLocationLoading(false)); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-gray-100 font-bold text-black hover:bg-gray-200 transition">
                    <RefreshCw className={cn("h-3.5 w-3.5", locationLoading && "animate-spin")} /> Refresh
                  </button>
                </div>

                {locationLoading ? (
                   <div className="space-y-4">
                     <Skeleton className="h-28 w-full rounded-[24px]" />
                     <Skeleton className="h-40 w-full rounded-[24px]" />
                   </div>
                ) : locationAnalytics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#ccff00] text-black p-5 rounded-[24px] shadow-sm relative overflow-hidden">
                         <div className="flex justify-between items-start mb-4">
                           <div className="p-2 bg-black/5 rounded-full"><Users className="h-4 w-4" /></div>
                           <Globe className="h-10 w-10 absolute -right-2 -bottom-2 text-black/10" />
                         </div>
                         <div className="text-2xl font-black">{(locationAnalytics.summary?.unique_visitors ?? 0).toLocaleString()}</div>
                         <div className="text-xs font-bold mt-1 opacity-70 uppercase tracking-wide">Unique Visitors</div>
                      </div>
                      <div className="bg-[#111827] text-white p-5 rounded-[24px] shadow-sm relative overflow-hidden">
                         <div className="flex justify-between items-start mb-4">
                           <div className="p-2 bg-white/10 rounded-full"><Clock className="h-4 w-4 text-emerald-400" /></div>
                         </div>
                         <div className="text-2xl font-black">
                           {locationAnalytics.summary?.avg_session_seconds ? `${Math.floor(locationAnalytics.summary.avg_session_seconds / 60)}m ${Math.floor(locationAnalytics.summary.avg_session_seconds % 60)}s` : '0m 0s'}
                         </div>
                         <div className="text-xs font-bold mt-1 text-gray-400 uppercase tracking-wide">Avg Session</div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                      <p className="font-bold text-sm mb-4">Engagement (Total Events: {locationAnalytics.summary?.total_events || 0})</p>
                      {locationAnalytics.hourly_trend?.length > 0 ? (
                        <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={locationAnalytics.hourly_trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#111827" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                              <Area type="monotone" dataKey="count" stroke="#111827" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : <div className="text-sm text-gray-400 text-center py-10">No data available</div>}
                    </div>

                    <div className="space-y-4">
                      <AnalyticsBento title="Top Countries" icon={Globe} data={locationAnalytics.countries} />
                      <AnalyticsBento title="Top Cities" icon={MapPin} data={locationAnalytics.cities} />
                      <AnalyticsBento title="Devices" icon={Smartphone} data={locationAnalytics.devices} />
                      <AnalyticsBento title="Browsers & OS" icon={Monitor} data={locationAnalytics.browsers} secondaryData={locationAnalytics.os} />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-12 text-gray-400 bg-white rounded-[24px] border border-gray-100">
                    <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No tracking data</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "store" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex gap-2 p-1.5 bg-white border border-gray-200 rounded-[16px] shadow-sm">
                  {["stories", "banners", "requests"].map((tab) => (
                    <button key={tab} onClick={() => setStoreSubTab(tab as any)} className={cn("flex-1 py-2 text-xs font-bold rounded-[12px] capitalize transition-all duration-300", storeSubTab === tab ? "bg-[#111827] text-white shadow-md" : "text-gray-500 hover:text-black")}>
                      {tab}
                    </button>
                  ))}
                </div>

                {storeSubTab === "stories" && (
                  <div className="space-y-4">
                    <button onClick={() => openForm()} className="w-full py-4 flex justify-center items-center gap-2 font-black rounded-[20px] transition bg-[#ccff00] text-black shadow-sm active:scale-95">
                      <Plus className="h-5 w-5" /> Add New Story
                    </button>
                    <div className="space-y-3">
                      {stories.map(story => (
                        <div key={story.story_id} className="p-4 rounded-[20px] bg-white border border-gray-100 shadow-sm flex gap-4 items-center">
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden relative shadow-inner">
                            {story.poster_url ? <img src={getOptimizedImage(story.poster_url) || ""} className="w-full h-full object-cover" /> : <FileText className="absolute inset-0 m-auto h-5 w-5 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">{story.story_name_en || story.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">₹{story.price} • {story.status}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openForm(story)} className="p-2 rounded-xl bg-gray-50 text-black hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(story.story_id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {storeSubTab === "banners" && (
                  <div className="space-y-4">
                    <button onClick={() => { setEditingBanner({ id: "new", image_url: "", target_link: "", order: banners.length }); setIsBannerFormOpen(true); }} className="w-full py-4 flex justify-center items-center gap-2 font-black rounded-[20px] transition bg-[#111827] text-white shadow-md active:scale-95">
                      <Plus className="h-5 w-5" /> Add Banner
                    </button>
                    <div className="space-y-3">
                      {banners.map(banner => (
                        <div key={banner.id} className="p-4 rounded-[20px] bg-white border border-gray-100 shadow-sm flex gap-4 items-center">
                          <img src={getOptimizedImage(banner.image_url) || ""} alt="Banner" className="w-24 h-14 object-cover rounded-xl bg-gray-100 shadow-inner" />
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
                      <StoryRequestCard key={req.id} req={req} theme={theme} tgUser={tgUser} onUpdate={(id, status, reply) => {
                        updateAdminRequestStatus(tgUser, id, status, reply).then(() => setStoryRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))).catch(e => alert("Failed: " + e.message));
                      }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "buyers" && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-4">
                     <h2 className="font-bold text-xl text-black">Buyer Management</h2>
                  </div>
                  <div className="space-y-4">
                    {buyers.map((buyer, i) => (
                      <div key={i} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-3 items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                              {(buyer.first_name || buyer.username || "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{buyer.first_name || buyer.username}</div>
                              <div className="text-[10px] text-gray-400">ID: {buyer.user_id}</div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="font-bold text-emerald-500">₹{buyer.amount}</div>
                             <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-bold uppercase mt-1 inline-block", buyer.status==="paid" ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500")}>{buyer.status}</span>
                          </div>
                        </div>
                        {buyer.payments && buyer.payments.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-3 mb-4">
                            {buyer.payments.map((p:any, j:number) => (
                               <div key={j} className="flex justify-between text-xs py-1 border-b border-gray-200 last:border-0">
                                  <div><span className="font-bold">{p.story_name}</span> <span className="text-gray-400 block text-[9px]">{new Date(p.date).toLocaleDateString()}</span></div>
                                  <div className="text-right font-bold">₹{p.amount}</div>
                               </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            if(!confirm("WIPE user completely?")) return;
                            try { const { adminBuyerAction } = await import("@/lib/api"); await adminBuyerAction(tgUser, buyer.user_id, "wipe"); setBuyers(buyers.filter((b: any) => b.user_id !== buyer.user_id)); } catch (e: any) { alert("Failed: " + e.message); }
                          }} className="flex-1 py-2 text-[10px] font-bold uppercase rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition">Wipe</button>
                          <button onClick={async () => {
                            if(!confirm("BAN user?")) return;
                            try { const { adminBuyerAction } = await import("@/lib/api"); await adminBuyerAction(tgUser, buyer.user_id, "ban"); setBuyers(buyers.filter((b: any) => b.user_id !== buyer.user_id)); } catch (e: any) { alert("Failed: " + e.message); }
                          }} className="flex-1 py-2 text-[10px] font-bold uppercase rounded-xl bg-[#111827] text-white hover:bg-black transition">Ban</button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}
            
            {activeTab === "support" && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="font-bold text-xl text-black mb-4">Support Tickets</h2>
                  <div className="space-y-4">
                    {supportTickets.length === 0 ? <div className="text-center p-8 text-gray-400">No tickets</div> : supportTickets.map(ticket => (
                      <SupportTicketCard key={ticket.id} ticket={ticket} theme={theme} onReply={handleReplySupport} />
                    ))}
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Name (EN)</label>
                    <input required type="text" value={editingStory.story_name_en} onChange={e => setEditingStory({...editingStory, story_name_en: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Name (HI)</label>
                    <input type="text" value={editingStory.story_name_hi || ""} onChange={e => setEditingStory({...editingStory, story_name_hi: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={!!translating} onClick={() => handleAutoTranslate("hi")} className="flex-1 py-2.5 text-xs font-bold rounded-[12px] bg-blue-50 text-blue-600 disabled:opacity-50">EN → HI</button>
                  <button type="button" disabled={!!translating} onClick={() => handleAutoTranslate("en")} className="flex-1 py-2.5 text-xs font-bold rounded-[12px] bg-emerald-50 text-emerald-600 disabled:opacity-50">HI → EN</button>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Desc (EN)</label>
                  <textarea rows={2} value={editingStory.description || ""} onChange={e => setEditingStory({...editingStory, description: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Desc (HI)</label>
                  <textarea rows={2} value={editingStory.description_hi || ""} onChange={e => setEditingStory({...editingStory, description_hi: e.target.value})} className="w-full p-3.5 rounded-[16px] text-sm outline-none bg-white border border-gray-200 focus:border-black font-medium resize-none" />
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

      {/* Custom Admin Bottom Navbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-6 py-4 flex justify-between items-center z-40 pb-[max(env(safe-area-inset-bottom),16px)]">
        <NavButton active={activeTab === "dashboard"} icon={Home} label="Home" onClick={() => setActiveTab("dashboard")} />
        <NavButton active={activeTab === "analytics"} icon={Activity} label="Analytics" onClick={() => setActiveTab("analytics")} />
        <NavButton active={activeTab === "store"} icon={Grid} label="Store" onClick={() => setActiveTab("store")} />
        <NavButton active={activeTab === "buyers" || activeTab === "support"} icon={SettingsIcon} label="More" onClick={() => setActiveTab("buyers")} />
      </div>

    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", active ? "text-black" : "text-gray-400 hover:text-gray-600")}>
      <div className={cn("p-1.5 rounded-[12px] transition-colors", active ? "bg-[#ccff00]" : "bg-transparent")}>
        <Icon className={cn("h-5 w-5", active ? "stroke-[2.5px]" : "stroke-2")} />
      </div>
      <span className={cn("text-[10px] font-bold", active ? "text-black" : "font-semibold")}>{label}</span>
    </button>
  );
}

function AnalyticsBento({ title, icon: Icon, data, secondaryData }: { title: string; icon: any; data: any[]; secondaryData?: any[] }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d: any) => d.count), 1);
  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4 text-black">
        <div className="p-1.5 bg-gray-100 rounded-lg"><Icon className="h-4 w-4" /></div>
        <span className="font-bold">{title}</span>
      </div>
      <div className="space-y-3">
        {data.slice(0,5).map((item: any, i: number) => (
          <div key={item.name || i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold truncate text-gray-700">{item.name || "Unknown"}</span>
              <span className="font-bold">{item.count}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
        {secondaryData && (
          <div className="pt-3 mt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
            {secondaryData.slice(0,4).map((os: any, i: number) => (
              <div key={i} className="flex justify-between text-[10px] bg-gray-50 px-2 py-1.5 rounded-lg">
                <span className="font-bold text-gray-600">{os.name}</span>
                <span className="font-bold">{os.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SupportTicketCard({ ticket, theme, onReply }: { ticket: any, theme: string, onReply: (id: string, reply: string) => void }) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => { if (!replyText.trim()) return; setSending(true); await onReply(ticket.id, replyText); setSending(false); };
  return (
    <div className="p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 items-center">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">{(ticket.first_name || "U")[0]}</div>
          <div>
            <div className="font-bold text-sm">{ticket.first_name || ticket.username}</div>
            <div className="text-[10px] text-gray-400">@{ticket.username}</div>
          </div>
        </div>
        <span className="text-[9px] bg-gray-100 px-2 py-1 rounded-md uppercase font-bold text-gray-500">{ticket.type}</span>
      </div>
      {ticket.text && <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-[16px] mb-3">{ticket.text}</p>}
      <textarea rows={2} placeholder="Type reply..." value={replyText} onChange={e => setReplyText(e.target.value)} className="w-full p-3 rounded-[16px] text-sm outline-none resize-none mb-2 bg-gray-50 border border-transparent focus:border-gray-200" />
      <button onClick={send} disabled={sending || !replyText.trim()} className="w-full py-3 text-xs font-bold bg-[#111827] text-white rounded-[16px] disabled:opacity-50">
        {sending ? "Sending..." : "Reply to User"}
      </button>
    </div>
  );
}

function StoryRequestCard({ req, theme, onUpdate }: { req: any; theme: string; tgUser?: any; onUpdate: (id: string, status: string, reply?: string) => void; }) {
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
          <button key={s} onClick={() => { onUpdate(req.id, s, replyText.trim()||undefined); setReplyText(""); }} className={cn("py-2 text-[10px] font-bold rounded-[12px] uppercase", req.status === s ? "bg-[#111827] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
