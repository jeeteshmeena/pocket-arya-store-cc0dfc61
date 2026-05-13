export type Story = {
  id: string;
  title: string;       // story_name_en — Roman script (used for English & Hinglish)
  titleHi?: string | null; // story_name_hi — Devanagari script (used when Hindi selected)
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
  storyStatus?: string;
  size?: string;
  fileCount?: number | null;
  isCompleted?: boolean | null;
  // Real engagement fields — used for trending and new releases
  purchase_count?: number;
  view_count?: number;
  search_count?: number;
  trending_score?: number;
  created_at?: string;    // ISO date string
  uploaded_at?: string;   // fallback date
};

// Static UI taxonomy (not story data). Real values still come from the API
// and can be derived dynamically; these are safe defaults for filter chips.
export const GENRES = ["Thriller", "Horror", "Crime", "Romance", "Drama"];
export const PLATFORMS = ["Pocket FM", "Kuku FM", "Audible"];
