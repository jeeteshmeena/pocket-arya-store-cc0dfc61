import os

path = 'src/components/arya/views/AdminView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'manualAdminPurchase' not in content:
    content = content.replace(
        'import { fetchAdminStories, updateAdminStory, deleteAdminStory, uploadAdminImage, fetchAdminBuyers, fetchAdminSupport, updateAdminSupport, fetchAdminDashboard, fetchLocationAnalytics } from "@/lib/api";',
        'import { fetchAdminStories, updateAdminStory, deleteAdminStory, uploadAdminImage, fetchAdminBuyers, fetchAdminSupport, updateAdminSupport, fetchAdminDashboard, fetchLocationAnalytics, updateAdminBanner, deleteAdminBanner, updateAdminRequestStatus, manualAdminPurchase } from "@/lib/api";'
    )

manual_purchase_state = '''  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ user_id: "", first_name: "", username: "", story_id: "", amount: 0 });
  const [manualSaving, setManualSaving] = useState(false);

  const handleManualPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgUser) return;
    setManualSaving(true);
    try {
      await manualAdminPurchase(tgUser, manualForm);
      alert("Manual purchase added successfully!");
      setIsManualFormOpen(false);
      fetchAdminBuyers(tgUser).then(d => setBuyers(d));
      fetchAdminDashboard(tgUser).then(d => setDashData(d));
    } catch (e: any) {
      alert("Failed: " + e.message);
    } finally {
      setManualSaving(false);
    }
  };'''

if 'const [isManualFormOpen' not in content:
    content = content.replace(
        'const [dashData, setDashData] = useState<any>(null);',
        'const [dashData, setDashData] = useState<any>(null);\n' + manual_purchase_state
    )

store_tabs_code = '''
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
'''

content = content.replace(
    '''                {/* Other Store subtabs could go here, but omitted to save space */}''',
    store_tabs_code
)

forms_code = '''
      {/* Forms Modal Renderings */}
      {isManualFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] p-6 bg-white shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
              <h2 className="text-xl font-black">Manual Add Order</h2>
              <button onClick={() => setIsManualFormOpen(false)} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleManualPurchase} className="space-y-5">
              <div className="space-y-4 p-5 rounded-[24px] bg-gray-50 border border-gray-100">
                <h3 className="font-black text-sm uppercase tracking-wider">User Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">User ID / TG ID</label>
                    <input required type="text" value={manualForm.user_id} onChange={e => setManualForm({...manualForm, user_id: e.target.value})} className="w-full p-3.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-black font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Username</label>
                    <input type="text" value={manualForm.username} onChange={e => setManualForm({...manualForm, username: e.target.value})} className="w-full p-3.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-black font-medium" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">First Name</label>
                  <input required type="text" value={manualForm.first_name} onChange={e => setManualForm({...manualForm, first_name: e.target.value})} className="w-full p-3.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-black font-medium" />
                </div>
              </div>
              <div className="space-y-4 p-5 rounded-[24px] bg-gray-50 border border-gray-100">
                <h3 className="font-black text-sm uppercase tracking-wider">Order Details</h3>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Select Story</label>
                  <select required value={manualForm.story_id} onChange={e => setManualForm({...manualForm, story_id: e.target.value, amount: stories.find(s=>s.story_id===e.target.value)?.price || 0})} className="w-full p-3.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-black font-medium bg-white">
                    <option value="">-- Choose Story --</option>
                    {stories.map(s => <option key={s.story_id} value={s.story_id}>{s.story_name_en}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Amount Paid (₹)</label>
                  <input required type="number" value={manualForm.amount} onChange={e => setManualForm({...manualForm, amount: Number(e.target.value)})} className="w-full p-3.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-black font-medium" />
                </div>
              </div>
              <button disabled={manualSaving} type="submit" className="w-full py-4 font-black text-lg rounded-[20px] bg-black text-white shadow-xl hover:bg-gray-900 active:scale-[0.98] transition">
                {manualSaving ? "Adding..." : "Add to User Account"}
              </button>
            </form>
          </div>
        </div>
      )}
'''

content = content.replace('{/* Forms Modal Renderings */}', forms_code + '\n      {/* Forms Modal Renderings */}')

story_req_card = '''
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
'''
if 'function StoryRequestCard' not in content:
    content += '\n' + story_req_card

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('UI Done!')
