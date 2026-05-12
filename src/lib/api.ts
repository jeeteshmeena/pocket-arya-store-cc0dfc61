import type { Story } from "./data";

const BASE_URL = "/api";

export const BOT_USERNAME = "UseAryaBot";

export type TelegramIdentity = {
  telegram_id: number | null;
  username: string | null;
};

export type CheckoutResponse = {
  success: true;
  checkout_url: string;
  order_id?: string;
  total?: number;
};

export type RazorpayOrderResponse = {
  success: true;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key: string;
  receipt: string;
  story_names: string[];
};

export type StoriesResponse = {
  success: true;
  data: Story[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    // Try to parse JSON body for FastAPI detail messages
    try {
      const errJson = await res.json();
      const detail = errJson?.detail || errJson?.message || res.statusText;
      const err: any = new Error(`${detail}`);
      err.response = errJson;
      err.status = res.status;
      throw err;
    } catch (e: any) {
      if (e.status) throw e;
      const text = await res.text().catch(() => "");
      throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
    }
  }
  const json = (await res.json()) as { success?: boolean } & Record<string, unknown>;
  if (json && json.success === false) {
    throw new Error((json as { message?: string }).message || "API returned an error");
  }
  return json as T;
}

export async function fetchStories(): Promise<Story[]> {
  const res = await request<StoriesResponse>("/stories", { method: "GET" });
  if (!Array.isArray(res.data)) throw new Error("Malformed /stories response");
  return res.data;
}

export async function fetchAdminStats(identity: TelegramIdentity): Promise<any> {
  const res = await request<any>(`/admin/stats?telegram_id=${identity.telegram_id}`, { method: "GET" });
  return res.data;
}

export async function fetchAdminStories(identity: TelegramIdentity): Promise<any[]> {
  const res = await request<any>(`/admin/stories?telegram_id=${identity.telegram_id}`, { method: "GET" });
  return res.data;
}

export async function saveAdminStory(identity: TelegramIdentity, storyData: any): Promise<void> {
  await request<any>("/admin/story", {
    method: "POST",
    body: JSON.stringify({ ...storyData, telegram_id: String(identity.telegram_id) }),
  });
}

export async function deleteAdminStory(identity: TelegramIdentity, storyId: string): Promise<void> {
  await request<any>(`/admin/story/${storyId}?telegram_id=${identity.telegram_id}`, { method: "DELETE" });
}

export async function fetchAdminBanners(identity: TelegramIdentity): Promise<any[]> {
  const res = await request<any>(`/admin/banners?telegram_id=${identity.telegram_id}`, { method: "GET" });
  return res.data;
}

export async function saveAdminBanner(identity: TelegramIdentity, data: any): Promise<void> {
  await request<any>("/admin/banner", {
    method: "POST",
    body: JSON.stringify({ ...data, telegram_id: String(identity.telegram_id) }),
  });
}

export async function deleteAdminBanner(identity: TelegramIdentity, bannerId: string): Promise<void> {
  await request<any>(`/admin/banner?telegram_id=${identity.telegram_id}&banner_id=${bannerId}`, { method: "DELETE" });
}

export async function fetchAdminBuyers(identity: TelegramIdentity): Promise<any[]> {
  const res = await request<any>(`/admin/buyers?telegram_id=${identity.telegram_id}`, { method: "GET" });
  return res.data;
}

export async function fetchAdminSupport(identity: TelegramIdentity): Promise<any[]> {
  const res = await request<any>(`/admin/support?telegram_id=${identity.telegram_id}`, { method: "GET" });
  return res.data;
}

export async function replyAdminSupport(identity: TelegramIdentity, ticketId: string, replyText: string): Promise<void> {
  await request<any>("/admin/support/reply", {
    method: "POST",
    body: JSON.stringify({ telegram_id: String(identity.telegram_id), ticket_id: ticketId, reply_text: replyText }),
  });
}

export async function fetchAnalytics(identity: TelegramIdentity): Promise<any> {
  const res = await request<any>(`/admin/analytics?telegram_id=${identity.telegram_id}`, { method: "GET" });
  return res.data;
}

export async function fetchLocationAnalytics(identity: TelegramIdentity, days: number = 30): Promise<any> {
  const res = await request<any>(`/admin/location-analytics?telegram_id=${identity.telegram_id}&days=${days}`, { method: "GET" });
  return res.data;
}

export async function uploadAdminImage(identity: TelegramIdentity, file: File): Promise<{poster_url: string, file_id: string}> {
  const formData = new FormData();
  formData.append("telegram_id", String(identity.telegram_id));
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/admin/upload-image`, { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function translateText(text: string, targetLang: "hi" | "en"): Promise<string> {
  if (!text.trim()) return "";
  try {
    const fromLang = targetLang === "hi" ? "en" : "hi";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${targetLang}`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

export function getOptimizedImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  // Fall back to direct URL loading to prevent VPS proxy timeouts from blocking image loading entirely
  return url;
}

export async function checkoutCart(
  storyIds: string[],
  identity: TelegramIdentity,
): Promise<CheckoutResponse> {
  if (!storyIds.length) throw new Error("Cart is empty");
  const res = await request<CheckoutResponse>("/checkout", {
    method: "POST",
    body: JSON.stringify({
      telegram_id: identity.telegram_id,
      username: identity.username,
      story_ids: storyIds,
    }),
  });
  if (!res.checkout_url) throw new Error("Backend did not return a checkout_url");
  return res;
}

export async function fetchAppContext(): Promise<{ ip: string; country: string; currency: string }> {
  return request("/app-context");
}

export async function createRazorpayOrder(
  storyIds: string[],
  identity: TelegramIdentity,
  isInternational: boolean = false
): Promise<RazorpayOrderResponse> {
  return request<RazorpayOrderResponse>("/create-order", {
    method: "POST",
    body: JSON.stringify({
      story_ids: storyIds,
      telegram_id: identity.telegram_id,
      is_international: isInternational
    }),
  });
}

export async function createOxapayOrder(
  storyIds: string[],
  identity: TelegramIdentity
): Promise<{ success: boolean; payLink?: string; trackId?: string; detail?: string }> {
  return request("/create-oxapay-order", {
    method: "POST",
    body: JSON.stringify({
      story_ids: storyIds,
      telegram_id: identity.telegram_id,
      username: identity.username
    }),
  });
}

export async function verifyRazorpayPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  story_ids: string[];
  telegram_id: number | null;
  username: string | null;
}): Promise<CheckoutResponse> {
  return request<CheckoutResponse>("/verify-payment", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchMyPurchases(
  telegramId: number,
): Promise<{
  story_id: string; title: string; poster?: string; price?: number;
  platform?: string; genre?: string; isCompleted?: boolean;
  episodes?: number | string; source?: string;
  order_details?: { order_id: string; payment_id: string; amount: number; source: string; paid_at: string } | null;
}[]> {
  try {
    const res = await fetch(`${BASE_URL}/my-purchases?telegram_id=${telegramId}`);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch {
    return [];
  }
}

export async function submitSupport(data: {
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  type: string;
  message: string;
  file?: File | null;
}): Promise<{ success: boolean; message: string }> {
  const formData = new FormData();
  if (data.telegram_id != null) formData.append("telegram_id", data.telegram_id.toString());
  else formData.append("telegram_id", "0");
  
  if (data.username) formData.append("username", data.username);
  if (data.first_name) formData.append("first_name", data.first_name);
  formData.append("type", data.type);
  formData.append("message", data.message);
  if (data.file) formData.append("file", data.file);

  const res = await fetch(`${BASE_URL}/support`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  const json = await res.json();
  if (json && json.success === false) {
    throw new Error(json.message || "API returned an error");
  }
  return json as { success: boolean; message: string };
}

export async function fetchMyRequests(telegramId: number): Promise<{
  id: string; type: string; text: string; status: string; created_at: string;
}[]> {
  try {
    const res = await fetch(`${BASE_URL}/my-requests?telegram_id=${telegramId}`);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch {
    return [];
  }
}

export function openTelegramLink(url: string) {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink && /^https:\/\/t\.me\//i.test(url)) {
      tg.openTelegramLink(url);
      return;
    }
    if (tg?.openLink) {
      tg.openLink(url);
      return;
    }
  } catch {}
  window.open(url, "_blank", "noopener,noreferrer");
}

// Load Razorpay script dynamically
export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Track user engagement — fire-and-forget, never throws.
 * Powers the /api/trending live engine and location analytics.
 * event: "open" | "search" | "view" | "purchase" | "page_view"
 */
export function trackEvent(
  event_type: string,
  event_data: Record<string, any>,
  telegramId?: number | null | string,
) {
  try {
    const body = JSON.stringify({ 
      event_type, 
      event_data, 
      telegram_id: String(telegramId || "0") 
    });
    // sendBeacon won't block navigation; falls back to fetch for older browsers
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(`${BASE_URL}/track`, blob);
    } else {
      fetch(`${BASE_URL}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

export async function adminBuyerAction(telegramId: number | null, userId: number | string, action: string) {
  if (!telegramId) throw new Error("Not authorized");
  const res = await fetch(`${BASE_URL}/admin/buyers/${userId}/action?telegram_id=${telegramId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export async function fetchAdminRequests(identity: TelegramIdentity): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_URL}/admin/requests?telegram_id=${identity.telegram_id}`);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch { return []; }
}

export async function updateAdminRequestStatus(
  identity: TelegramIdentity,
  requestId: string,
  status: string,
  replyText?: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegram_id: String(identity.telegram_id),
      status,
      reply_text: replyText || null,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
}

