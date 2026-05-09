import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

function makeRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: {},
  });
}

async function renderAt(path: string) {
  const router = makeRouter(path);
  render(<RouterProvider router={router} />);
  // Wait for initial render
  await waitFor(() => {
    // AryaApp's BottomNav renders nav; ensure no 404 leaked through
    expect(document.body.textContent || "").not.toMatch(/404/i);
    expect(document.body.textContent || "").not.toMatch(/page not found/i);
  });
  return router;
}

describe("router deep links never render NotFound", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    // Reset any Telegram stub between tests
    // @ts-expect-error
    delete window.Telegram;
  });

  const cases = [
    "/",
    "/aryaPremium",
    "/aryaPremium/",
    "/aryaPremium?tgWebAppStartParam=story_story-1",
    "/aryaPremium?tgWebAppData=foo&tgWebAppVersion=7.0",
    "/?story=story-1",
    "/?story=does-not-exist",
    "/some/random/unmatched/path",
    "/aryaPremium/extra/segment",
  ];

  for (const path of cases) {
    it(`renders AryaApp for ${path}`, async () => {
      await renderAt(path);
      // AryaApp mounts a <main> region — confirm presence as a positive signal.
      await waitFor(() => {
        expect(document.querySelector("main")).toBeInTheDocument();
      });
    });
  }

  it("handles Telegram start_param deep links without 404", async () => {
    // @ts-expect-error stub Telegram WebApp
    window.Telegram = {
      WebApp: {
        ready: () => {},
        expand: () => {},
        initDataUnsafe: {
          user: { id: 123, username: "tester" },
          start_param: "story_story-1",
        },
      },
    };
    await renderAt("/aryaPremium");
    expect(document.querySelector("main")).toBeInTheDocument();
  });

  it("refresh on an unknown route (simulating direct hit) still mounts app", async () => {
    // Simulate a raw refresh on a path the router doesn't know about.
    await renderAt("/totally/unknown?foo=bar#hash");
    expect(document.querySelector("main")).toBeInTheDocument();
  });
});
