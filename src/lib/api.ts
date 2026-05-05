import type { Story } from "./data";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "";

export type TelegramIdentity = {
  telegram_id: number | null;
  username: string | null;
};

export type CheckoutResponse = {
  success: true;
  checkout_url: string;
  order_id?: string;
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
  if (!res.checkout_url || typeof res.checkout_url !== "string") {
    throw new Error("Backend did not return a checkout_url");
  }
  return res;
}

export function openTelegramLink(url: string) {
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (u: string) => void; openLink?: (u: string) => void } } }).Telegram?.WebApp;
    if (tg?.openTelegramLink && /^https:\/\/t\.me\//i.test(url)) {
      tg.openTelegramLink(url);
      return;
    }
    if (tg?.openLink) {
      tg.openLink(url);
      return;
    }
  } catch {
    // fall through
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
