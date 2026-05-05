import { AppProvider, useApp } from "@/store/app-store";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { CartPanel } from "./CartPanel";
import { SearchOverlay } from "./SearchOverlay";
import { HomeView } from "./views/HomeView";
import { ExploreView } from "./views/ExploreView";
import { MyStoriesView } from "./views/MyStoriesView";
import { ProfileView } from "./views/ProfileView";
import { SettingsView } from "./views/SettingsView";
import { DetailView } from "./views/DetailView";
import { CheckoutView } from "./views/CheckoutView";

function Shell() {
  const { view } = useApp();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main
        className="mx-auto max-w-2xl pt-14"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        {view.name === "home" && <HomeView />}
        {view.name === "explore" && <ExploreView />}
        {view.name === "mystories" && <MyStoriesView />}
        {view.name === "profile" && <ProfileView />}
        {view.name === "settings" && <SettingsView />}
        {view.name === "detail" && <DetailView storyId={view.storyId} />}
      </main>
      <BottomNav />
      <CartPanel />
      <SearchOverlay />
      <PaymentModal />
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
