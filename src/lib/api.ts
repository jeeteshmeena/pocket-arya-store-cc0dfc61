import type { Story } from "./data";

export const BASE_URL = "/api";

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
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
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

export async function createRazorpayOrder(
  storyIds: string[],
  identity: TelegramIdentity,
): Promise<RazorpayOrderResponse> {
  return request<RazorpayOrderResponse>("/razorpay/order", {
    method: "POST",
    body: JSON.stringify({
      story_ids: storyIds,
      telegram_id: identity.telegram_id,
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
  return request<CheckoutResponse>("/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
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
