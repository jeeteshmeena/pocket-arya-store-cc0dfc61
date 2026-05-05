export type ServerStory = {
  id: string;
  title: string;
  description: string;
  price: number;
  episodes: number;
  genre: string;
  language: string;
  platform: string;
  poster: string;
  banner: string;
  status: "available" | "coming_soon";
  size?: string;
};

const img = (seed: string, w = 800, h = 1100) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

// Replace this list with a MongoDB query in production.
export const STORIES: ServerStory[] = [
  { id: "s1", title: "Insaaf", description: "A gripping tale of justice in a city where law bends. Follow Inspector Verma as he uncovers a conspiracy that goes deeper than he imagined.", price: 149, episodes: 84, genre: "Thriller", language: "Hindi", platform: "Pocket FM", poster: img("insaaf"), banner: img("insaaf-b", 1600, 800), status: "available", size: "1.2 GB" },
  { id: "s2", title: "Yakshini", description: "Ancient curses awaken when a young scholar discovers a forbidden temple. A supernatural saga.", price: 199, episodes: 120, genre: "Horror", language: "Hindi", platform: "Pocket FM", poster: img("yakshini"), banner: img("yakshini-b", 1600, 800), status: "available", size: "1.8 GB" },
  { id: "s3", title: "Crime Stories", description: "True-to-life crime narratives from India's most haunting cases.", price: 99, episodes: 60, genre: "Crime", language: "Hindi", platform: "Kuku FM", poster: img("crime"), banner: img("crime-b", 1600, 800), status: "available", size: "900 MB" },
  { id: "s4", title: "Tantrik", description: "A village priest battles dark forces beyond mortal understanding.", price: 179, episodes: 95, genre: "Horror", language: "Hindi", platform: "Pocket FM", poster: img("tantrik"), banner: img("tantrik-b", 1600, 800), status: "available", size: "1.4 GB" },
  { id: "s5", title: "Love in Mumbai", description: "Two strangers, one rainy night, and a love that defies the city.", price: 89, episodes: 40, genre: "Romance", language: "Hindi", platform: "Audible", poster: img("love"), banner: img("love-b", 1600, 800), status: "available", size: "600 MB" },
  { id: "s6", title: "The CEO's Secret", description: "A boardroom thriller wrapped in betrayal and ambition.", price: 159, episodes: 72, genre: "Drama", language: "English", platform: "Pocket FM", poster: img("ceo"), banner: img("ceo-b", 1600, 800), status: "available", size: "1.1 GB" },
  { id: "s7", title: "Shaitaan Returns", description: "The sequel to a legendary horror saga. Darker. Deeper. Deadlier.", price: 219, episodes: 140, genre: "Horror", language: "Hindi", platform: "Pocket FM", poster: img("shaitaan"), banner: img("shaitaan-b", 1600, 800), status: "available", size: "2.0 GB" },
  { id: "s8", title: "Dilli Diaries", description: "Stories from the streets of Delhi. Real people, real drama.", price: 79, episodes: 30, genre: "Drama", language: "Hindi", platform: "Kuku FM", poster: img("dilli"), banner: img("dilli-b", 1600, 800), status: "available", size: "500 MB" },
];
