export type Story = {
  id: string;
  title: string;
  description: string;
  price: number;
  episodes: number | string;
  totalEpisodes?: number | string;
  genre: string;
  language: string;
  platform: string;
  poster: string;
  banner: string;
  status: "available" | "coming_soon";
  size?: string;
  isCompleted?: boolean;   // true = Completed series, false/undefined = Ongoing
};

// Static UI taxonomy (not story data). Real values still come from the API
// and can be derived dynamically; these are safe defaults for filter chips.
export const GENRES = ["Thriller", "Horror", "Crime", "Romance", "Drama"];
export const PLATFORMS = ["Pocket FM", "Kuku FM", "Audible"];
