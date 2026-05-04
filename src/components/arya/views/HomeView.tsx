import { HeroSlider } from "../HeroSlider";
import { Row } from "../Row";
import { STORIES } from "@/lib/data";
import { useApp } from "@/store/app-store";

export function HomeView() {
  const { purchased } = useApp();
  return (
    <div className="animate-fade-in">
      <HeroSlider />
      {purchased.length > 0 && <Row title="Continue" stories={purchased} />}
      <Row title="Trending Now" stories={STORIES.slice(0, 6)} wide />
      <Row title="New Releases" stories={[...STORIES].reverse().slice(0, 6)} />
      <Row title="Horror" stories={STORIES.filter((s) => s.genre === "Horror")} />
      <Row title="Thriller & Crime" stories={STORIES.filter((s) => ["Thriller","Crime"].includes(s.genre))} />
    </div>
  );
}
