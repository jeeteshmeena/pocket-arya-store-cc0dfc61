import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock the API so AryaApp doesn't hit the network during tests.
vi.mock("@/lib/api", () => ({
  BOT_USERNAME: "UseAryaBot",
  fetchStories: vi.fn(async () => [
    {
      id: "story-1",
      title: "Test Story",
      description: "desc",
      cover: "",
      price: 0,
      status: "completed",
      tags: [],
      chapters: [],
    },
  ]),
  checkoutCart: vi.fn(async () => ({
    success: true,
    checkout_url: "https://example.com",
    order_id: "1",
  })),
  openTelegramLink: vi.fn(),
}));

// Stub matchMedia / IntersectionObserver used by some UI primitives.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
// @ts-expect-error test stub
window.IntersectionObserver = IO;
