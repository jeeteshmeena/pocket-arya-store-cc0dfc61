import { useEffect } from "react";
import { AppProvider, useApp } from "@/store/app-store";
import { trackEvent } from "@/lib/api";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { CartPanel } from "./CartPanel";
import { HomeView } from "./views/HomeView";
import { ExploreView } from "./views/ExploreView";
import { MyStoriesView } from "./views/MyStoriesView";
import { ProfileView } from "./views/ProfileView";
import { SettingsView } from "./views/SettingsView";
import { DetailView } from "./views/DetailView";
import { CheckoutView } from "./views/CheckoutView";
import { PurchasedDetailView } from "./views/PurchasedDetailView";
import { SupportView } from "./views/SupportView";
import { AdminView } from "./views/AdminView";
import { TermsOnboarding } from "./TermsOnboarding";
import { DeepLinkErrorDialog } from "./DeepLinkErrorDialog";
import { Splash } from "./Splash";
import { RomanticDecor } from "./RomanticDecor";

function Shell() {
  const { view, storiesLoading, stories, tgUser } = useApp();
  const showSplash = storiesLoading && stories.length === 0;

  // Track page views automatically on view change
  useEffect(() => {
    trackEvent("page_view", { 
      page: view.name, 
      story_id: (view as any).storyId || null,
      referrer: document.referrer || "direct"
    }, tgUser?.telegram_id);
  }, [view.name, (view as any).storyId, tgUser?.telegram_id]);


  return (
    // Fixed-height container — prevents page scroll, enables app-like behavior
    <div className="fixed inset-0 bg-background text-foreground flex flex-col overflow-hidden">
      <RomanticDecor />
      <Header />

      {/*
        The ONLY scrollable region.
        pt-14 = header height, pb-16 = bottom nav height.
        -webkit-overflow-scrolling for smooth momentum scroll on iOS.
      */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: "56px",   /* header */
          paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)", /* bottom nav */
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="mx-auto max-w-2xl">
          {view.name === "home"      && <HomeView />}
          {view.name === "explore"   && <ExploreView />}
          {view.name === "mystories" && <MyStoriesView />}
          {view.name === "profile"   && <ProfileView />}
          {view.name === "settings"  && <SettingsView />}
          {view.name === "support"   && <SupportView />}
          {view.name === "admin"     && <AdminView />}
          {view.name === "detail"    && <DetailView storyId={view.storyId} />}
          {view.name === "purchased-detail" && <PurchasedDetailView storyId={view.storyId} />}
          {view.name === "checkout"  && <CheckoutView />}
        </div>
      </main>

      <BottomNav />
      <CartPanel />
      <TermsOnboarding />
      <DeepLinkErrorDialog />
      {showSplash && <Splash />}

    </div>
  );
}

export function AryaApp() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
