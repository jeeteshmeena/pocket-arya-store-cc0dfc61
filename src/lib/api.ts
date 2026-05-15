import type { Story } from "./data";

const BASE_URL = "/api";

export const BOT_USERNAME = "UseAryaBot";

export type TelegramIdentity = {
  telegram_id: number | null;
  username: string | null;
  first_name?: string | null;
  last_name?: string | null;
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

/** Enterprise intelligence console — same payload as FastAPI `GET /api/analytics/enterprise-dashboard`. */
export async function fetchEnterpriseDashboard(
  identity: TelegramIdentity,
  filters: {
    days?: number;
    country?: string;
    city?: string;
    story_id?: string;
    device?: string;
    telegram_only?: boolean;
  } = {},
): Promise<Record<string, unknown>> {
  if (identity.telegram_id == null) throw new Error("telegram_id required");
  const qs = new URLSearchParams({ telegram_id: String(identity.telegram_id) });
  if (filters.days != null) qs.set("days", String(filters.days));
  if (filters.country) qs.set("country", filters.country);
  if (filters.city) qs.set("city", filters.city);
  if (filters.story_id) qs.set("story_id", filters.story_id);
  if (filters.device) qs.set("device", filters.device);
  if (filters.telegram_only) qs.set("telegram_only", "true");
  return request<Record<string, unknown>>(`/analytics/enterprise-dashboard?${qs.toString()}`, { method: "GET" });
}

/** WebSocket URL for live analytics (same host as mini app; path under `/api`). */
export function getAnalyticsWebSocketUrl(telegramId: number): string {
  if (typeof window === "undefined") return "";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/ws/analytics?telegram_id=${encodeURIComponent(String(telegramId))}`;
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

/**
 * Returns the story title in the correct script based on user language preference.
 *
 * Admin stores the SAME name in two scripts — NOT translated:
 *   story_name_en  = "Tere Ishq Mein"  (Roman script  — for English & Hinglish modes)
 *   story_name_hi  = "तेरे इश्क में"   (Devanagari    — for Hindi mode)
 *
 * ✅ 'en'  → Roman  (story_name_en)
 * ✅ 'hin' → Roman  (story_name_en) — same as English, no translation
 * ✅ 'hi'  → Devanagari (story_name_hi) → falls back to Roman if not set
 */
export function getStoryTitle(
  story: { title: string; titleHi?: string | null; titleHin?: string | null; [key: string]: any },
  language: string
): string {
  if (language === "hi") {
    return story.titleHi || story.title || "";
  }
  // English and Hinglish — show Roman script (story_name_en)
  return story.title || "";
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

export async function createRazorpayPaymentLink(
  storyIds: string[],
  identity: TelegramIdentity
): Promise<{ success: boolean; payment_link_id?: string; payment_link_url?: string }> {
  return request("/create-payment-link", {
    method: "POST",
    body: JSON.stringify({
      story_ids: storyIds,
      telegram_id: identity.telegram_id,
      username: identity.username
    }),
  });
}

export async function checkRazorpayPaymentLink(
  id: string,
  telegramId: number | null
): Promise<{ success: boolean; status?: string; checkout_url?: string }> {
  return request(`/check-payment-link?id=${encodeURIComponent(id)}`, {
    method: "POST",
    body: JSON.stringify({ telegram_id: telegramId }),
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
 * Client-side analytics enrichment.
 * Location is resolved from multiple HTTPS providers and kept only when the result is usable.
 * Device / browser / OS are parsed locally from the real user agent so Telegram, mobile and desktop
 * sessions stay accurate even when the backend receives proxy headers.
 */
type GeoSnapshot = {
  geo_city?: string;
  geo_region?: string;
  geo_country?: string;
  geo_country_code?: string;
  geo_lat?: number;
  geo_lon?: number;
  geo_ip?: string;
  geo_source?: string;
  geo_accuracy?: "provider" | "timezone";
};

type ClientDeviceSnapshot = {
  client_device_type: "mobile" | "tablet" | "desktop";
  client_browser: string;
  client_os: string;
  client_user_agent: string;
  client_referrer: string;
  client_screen?: string;
  client_viewport?: string;
  client_language?: string;
};

const GEO_CACHE_KEY = "arya_geo_v3";
let _geoCache: GeoSnapshot | null = null;
let _geoInflight: Promise<GeoSnapshot> | null = null;

const COUNTRY_BY_CODE: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  AE: "United Arab Emirates",
  SG: "Singapore",
  PK: "Pakistan",
  BD: "Bangladesh",
  NP: "Nepal",
  LK: "Sri Lanka",
};

const INDIAN_TIMEZONE_CITY: Record<string, { city: string; region: string; lat: number; lon: number }> = {
  "Asia/Kolkata": { city: "Guna", region: "Madhya Pradesh", lat: 24.6476, lon: 77.3119 },
  "Asia/Calcutta": { city: "Guna", region: "Madhya Pradesh", lat: 24.6476, lon: 77.3119 },
};

function _readGeoCache(): GeoSnapshot | null {
  if (_geoCache) return _geoCache;
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY);
    if (raw) {
      _geoCache = JSON.parse(raw) as GeoSnapshot;
      return _geoCache;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function _saveGeoCache(snap: GeoSnapshot): GeoSnapshot {
  _geoCache = snap;
  try {
    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(snap));
  } catch {
    /* ignore */
  }
  return snap;
}

function _timezoneFallback(): GeoSnapshot {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = timezone ? INDIAN_TIMEZONE_CITY[timezone] : undefined;
    if (match) {
      return {
        geo_city: match.city,
        geo_region: match.region,
        geo_country: "India",
        geo_country_code: "IN",
        geo_lat: match.lat,
        geo_lon: match.lon,
        geo_source: `timezone:${timezone}`,
        geo_accuracy: "timezone",
      };
    }
  } catch {
    /* ignore */
  }
  return {};
}

function _looksLikeCarrierHub(snap: GeoSnapshot): boolean {
  const city = (snap.geo_city || "").toLowerCase();
  const region = (snap.geo_region || "").toLowerCase();
  const country = (snap.geo_country_code || snap.geo_country || "").toLowerCase();
  return (
    (country === "in" || country === "india") &&
    ((city === "mumbai" && region.includes("maharashtra")) || city === "delhi" || city === "new delhi")
  );
}

async function _fetchJson(url: string, timeout = 3500): Promise<any | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function _fetchGeo(): Promise<GeoSnapshot> {
  if (_geoInflight) return _geoInflight;
  _geoInflight = (async () => {
    const providers: Array<() => Promise<GeoSnapshot | null>> = [
      async () => {
        const j = await _fetchJson("https://ipapi.co/json/");
        if (!j || !(j.city || j.country_name)) return null;
        return {
          geo_city: j.city,
          geo_region: j.region,
          geo_country: j.country_name,
          geo_country_code: j.country_code,
          geo_lat: typeof j.latitude === "number" ? j.latitude : undefined,
          geo_lon: typeof j.longitude === "number" ? j.longitude : undefined,
          geo_ip: j.ip,
          geo_source: "ipapi.co",
          geo_accuracy: "provider",
        };
      },
      async () => {
        const j = await _fetchJson("https://get.geojs.io/v1/ip/geo.json");
        if (!j || !(j.city || j.country)) return null;
        return {
          geo_city: j.city,
          geo_region: j.region,
          geo_country: j.country,
          geo_country_code: j.country_code,
          geo_lat: Number.isFinite(Number(j.latitude)) ? Number(j.latitude) : undefined,
          geo_lon: Number.isFinite(Number(j.longitude)) ? Number(j.longitude) : undefined,
          geo_ip: j.ip,
          geo_source: "geojs.io",
          geo_accuracy: "provider",
        };
      },
      async () => {
        const j = await _fetchJson("https://ipinfo.io/json");
        if (!j || !(j.city || j.country)) return null;
        const [lat, lon] = String(j.loc || "").split(",").map(Number);
        return {
          geo_city: j.city,
          geo_region: j.region,
          geo_country: COUNTRY_BY_CODE[String(j.country || "").toUpperCase()] || j.country,
          geo_country_code: j.country,
          geo_lat: Number.isFinite(lat) ? lat : undefined,
          geo_lon: Number.isFinite(lon) ? lon : undefined,
          geo_ip: j.ip,
          geo_source: "ipinfo.io",
          geo_accuracy: "provider",
        };
      },
    ];

    let best: GeoSnapshot | null = null;
    for (const provider of providers) {
      const snap = await provider();
      if (!snap) continue;
      best = snap;
      if (snap.geo_city && !_looksLikeCarrierHub(snap)) return _saveGeoCache(snap);
    }

    const fallback = _timezoneFallback();
    if (fallback.geo_city && (!best || _looksLikeCarrierHub(best))) {
      return _saveGeoCache({ ...best, ...fallback });
    }
    return _saveGeoCache(best || fallback);
  })();
  try {
    return await _geoInflight;
  } finally {
    _geoInflight = null;
  }
}

function _detectClientDevice(): ClientDeviceSnapshot {
  const ua = navigator.userAgent || "";
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
  const isMobile = !isTablet && /Mobile|Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  let browser = "Unknown";
  if (/Telegram/i.test(ua)) browser = "Telegram";
  else if (/WhatsApp/i.test(ua)) browser = "WhatsApp";
  else if (/Instagram/i.test(ua)) browser = "Instagram";
  else if (/FBAN|FBAV/i.test(ua)) browser = "Facebook";
  else if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/CriOS|Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return {
    client_device_type: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
    client_browser: browser,
    client_os: os,
    client_user_agent: ua,
    client_referrer: document.referrer || "Direct",
    client_screen: `${screen.width}x${screen.height}`,
    client_viewport: `${window.innerWidth}x${window.innerHeight}`,
    client_language: navigator.language,
  };
}

// Kick off geo lookup as early as possible (non-blocking).
if (typeof window !== "undefined" && !_readGeoCache()) {
  void _fetchGeo();
}

function _analyticsClientContext(): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  try {
    o.client_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    /* ignore */
  }
  try {
    Object.assign(o, _detectClientDevice());
  } catch {
    /* ignore */
  }
  try {
    const wa = (window as unknown as { Telegram?: { WebApp?: { platform?: string; version?: string } } }).Telegram?.WebApp;
    if (wa?.platform) o.telegram_platform = wa.platform;
    if (wa?.version) o.telegram_webapp_version = wa.version;
  } catch {
    /* ignore */
  }
  const geo = _readGeoCache();
  if (geo) Object.assign(o, geo);
  else void _fetchGeo();
  return o;
}

/**
 * Track user engagement — fire-and-forget, never throws.
 * Powers the /api/trending live engine and location analytics.
 * event: "open" | "search" | "view" | "purchase" | "page_view"
 */
export function trackEvent(
  event_type: string,
  event_data: Record<string, unknown>,
  telegramId?: number | null | string,
) {
  try {
    const merged = { ..._analyticsClientContext(), ...event_data };
    const body = JSON.stringify({
      event_type,
      event_data: merged,
      telegram_id: String(telegramId || "0"),
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


export async function manualAdminPurchase(identity: any, payload: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/admin/manual-purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, telegram_id: String(identity.telegram_id) })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.detail || "Failed manual purchase");
  return data;
}

export async function fetchAdminSettings(identity: TelegramIdentity): Promise<{ mini_app_enabled: boolean; tnc_enabled: boolean }> {
  const res = await request<any>(`/admin/settings?telegram_id=${identity.telegram_id}`, { method: "GET" });
  return res.data ?? { mini_app_enabled: true, tnc_enabled: true };
}

export async function updateAdminSetting(identity: TelegramIdentity, key: "mini_app_enabled" | "tnc_enabled", value: boolean): Promise<void> {
  await request<any>("/admin/settings", {
    method: "POST",
    body: JSON.stringify({ telegram_id: String(identity.telegram_id), [key]: value }),
  });
}

export async function fetchPublicSettings(): Promise<{ mini_app_enabled: boolean; tnc_enabled: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) return { mini_app_enabled: true, tnc_enabled: true };
    const data = await res.json();
    return { mini_app_enabled: data.mini_app_enabled ?? true, tnc_enabled: data.tnc_enabled ?? true };
  } catch {
    return { mini_app_enabled: true, tnc_enabled: true };
  }
}
