import { cricketPlayers, getRandomizedCricketSlate, type CricketPlayerItem, type CricketRole } from "./cricket-data";

export type GameStatus = "LOBBY" | "AUCTION" | "TOP_FIVE" | "EVALUATING" | "RESULTS";

export type AuctionType = "CINEMA" | "CRICKET";

export type MovieCategory =
  | "ALL"
  | "BOLLYWOOD"
  | "SOUTH_PAN_INDIA"
  | "HOLLYWOOD"
  | "MASTERPIECES"
  | "ACTION_THRILLER"
  | "BATTERS"
  | "FAST_BOWLERS"
  | "SPINNERS"
  | "ALL_ROUNDERS"
  | "WICKETKEEPERS";

export interface Movie {
  id: string;
  title: string; // Movie Title OR Cricket Player Name
  year: number; // Release Year OR Age
  genre: string; // Genre OR Cricket Role Name (e.g. "Top-Order Batter")
  genres: string[]; // List of genres or traits
  basePrice: number; // in Crores
  posterPosition?: string;
  imdbRating: number; // IMDb rating (e.g. 8.4) OR Player Impact Index (e.g. 9.8)
  boxOffice: number; // Box Office in Cr OR Career T20 Runs/Wickets
  director: string; // Director OR Country (e.g. "Christopher Nolan" or "India")
  studio?: string; // Studio Name OR Specialization Specialty
  category?: MovieCategory | string;
  tagline?: string;
  photoUrl?: string; // High-res portrait for cricket players
  role?: CricketRole;
  country?: string;
  countryFlag?: string;
  stats?: {
    matches: number;
    runs?: number;
    wickets?: number;
    strikeRate?: number;
    economy?: number;
    highestScore?: string;
    bestBowling?: string;
    fifties?: number;
  };
  signatureSkill?: string;
  auctionType?: AuctionType;
}

export type AuctionItem = Movie;

export interface OwnedMovie extends Movie {
  purchasePrice: number;
  purchasedBy?: string;
  purchasedByName?: string;
}

export interface SubmittedSlate {
  movieIds: string[];
  captainId?: string;
  viceCaptainId?: string;
  submittedAt: number;
}

export interface Player {
  id: string;
  name: string; // Franchise / Producer Name (chosen by the human/bot player)
  budget: number;
  initialBudget: number;
  movies: OwnedMovie[];
  isHost?: boolean | undefined;
  isBot?: boolean | undefined;
  avatar: string;
  color?: string | undefined;
  ready?: boolean | undefined;
  submittedTop5?: string[] | undefined;
  isSlateSubmitted?: boolean | undefined;
}

export interface RoomSettings {
  maxPlayers: number;
  startingBudget: number;
  auctionSeconds: number;
  totalMovies: number;
  category?: string | undefined;
  auctionType?: AuctionType;
  submittedSlates?: Record<string, SubmittedSlate> | undefined;
  portfolioRankings?: any[] | undefined;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 4,
  startingBudget: 100,
  auctionSeconds: 30,
  totalMovies: 15,
  category: "ALL",
  auctionType: "CINEMA",
};

export const formatCr = (amount: number) => `₹${amount} Cr`;

/**
 * Computes an optimal 5-movie studio slate by ranking IMDb rating and box office power
 */
export function getOptimalMovieSlate(movies: OwnedMovie[]): string[] {
  if (!movies || movies.length === 0) return [];
  if (movies.length <= 5) return movies.map((m) => m.id);
  const sorted = [...movies].sort((a, b) => {
    const scoreA = (a.imdbRating || 7.0) * 12 + Math.min(40, (a.boxOffice || 100) / 25);
    const scoreB = (b.imdbRating || 7.0) * 12 + Math.min(40, (b.boxOffice || 100) / 25);
    return scoreB - scoreA;
  });
  return sorted.slice(0, 5).map((m) => m.id);
}

/**
 * Recommended item pool quantity based on player count and auction type.
 * Rule for Cricket (IPL Mega Auction): Squad size is Min 12 to Max 18 players per franchise.
 * Rule for Cinema: Studio slate is 5 films per producer.
 */
export function getRecommendedMoviePoolSize(
  numPlayers: number,
  auctionType: AuctionType = "CINEMA",
): number {
  const count = Math.max(1, numPlayers);
  if (auctionType === "CRICKET") {
    // 2 franchises -> at least 60 players
    // 3 franchises -> at least 85 players
    // 4 franchises -> at least 110 players
    // 5 franchises -> at least 135 players
    // 6 franchises -> at least 160 players
    if (count <= 2) return 60;
    if (count === 3) return 85;
    if (count === 4) return 110;
    if (count === 5) return 135;
    if (count === 6) return 160;
    return count * 28;
  }

  if (count <= 2) return 15;
  if (count === 3) return 22;
  if (count === 4) return 28;
  if (count === 5) return 35;
  if (count === 6) return 42;
  return Math.max(15, count * 7);
}

/**
 * Fisher-Yates shuffle algorithm to generate a randomized item auction slate
 * for either Cinema (Movies) or Cricket Superstars.
 */
export function getRandomizedMovieSlate(
  count = 15,
  category = "ALL",
  auctionType: AuctionType = "CINEMA",
): Movie[] {
  if (auctionType === "CRICKET") {
    const cricketSlate = getRandomizedCricketSlate(count, category);
    return cricketSlate.map((c) => ({
      ...c,
      auctionType: "CRICKET",
    }));
  }

  let pool = [...movies];

  if (category && category !== "ALL") {
    const matching = pool.filter(
      (m) =>
        m.category?.toUpperCase() === category.toUpperCase() ||
        m.studio?.toUpperCase().includes(category.toUpperCase()),
    );

    if (matching.length >= count) {
      pool = matching;
    } else if (matching.length > 0) {
      const matchIds = new Set(matching.map((m) => m.id));
      const rest = pool.filter((m) => !matchIds.has(m.id));
      pool = [...matching, ...rest];
    }
  }

  // Fisher-Yates random shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = temp;
  }

  return pool.slice(0, Math.min(count, pool.length)).map((m) => ({
    ...m,
    auctionType: "CINEMA",
  }));
}

export const movies: Movie[] = [
  // --- BOLLYWOOD MEGA HITS & STUDIOS (Base Price: ₹1 Cr) ---
  {
    id: "jawan",
    title: "Jawan",
    year: 2023,
    genre: "Action / Thriller",
    genres: ["Action", "Thriller"],
    basePrice: 1,
    posterPosition: "50% 14%",
    imdbRating: 7.0,
    boxOffice: 1148,
    director: "Atlee",
    studio: "Red Chillies Entertainment",
    category: "BOLLYWOOD",
    tagline: "High-octane mass action spectacle of justice and revenge",
    auctionType: "CINEMA",
  },
  {
    id: "dangal",
    title: "Dangal",
    year: 2016,
    genre: "Drama / Sports",
    genres: ["Drama", "Sports", "Biography"],
    basePrice: 1,
    posterPosition: "25% 20%",
    imdbRating: 8.3,
    boxOffice: 2024,
    director: "Nitesh Tiwari",
    studio: "Aamir Khan Productions / Disney India",
    category: "BOLLYWOOD",
    tagline: "Inspiring wrestling biopic that conquered global cinema",
    auctionType: "CINEMA",
  },
  {
    id: "andhadhun",
    title: "Andhadhun",
    year: 2018,
    genre: "Crime / Thriller",
    genres: ["Crime", "Thriller", "Black Comedy"],
    basePrice: 1,
    posterPosition: "75% 18%",
    imdbRating: 8.2,
    boxOffice: 456,
    director: "Sriram Raghavan",
    studio: "Matchbox Pictures / Viacom18",
    category: "MASTERPIECES",
    tagline: "Twisty suspense masterpiece filled with deceptive noir",
    auctionType: "CINEMA",
  },
  {
    id: "gully-boy",
    title: "Gully Boy",
    year: 2019,
    genre: "Drama / Music",
    genres: ["Drama", "Music"],
    basePrice: 1,
    posterPosition: "25% 75%",
    imdbRating: 7.9,
    boxOffice: 238,
    director: "Zoya Akhtar",
    studio: "Excel Entertainment / Tiger Baby",
    category: "BOLLYWOOD",
    tagline: "Underdog street hip-hop revolution from the gullies of Mumbai",
    auctionType: "CINEMA",
  },
  {
    id: "lagaan",
    title: "Lagaan",
    year: 2001,
    genre: "Drama / Sports",
    genres: ["Drama", "Sports", "Period"],
    basePrice: 1,
    posterPosition: "25% 30%",
    imdbRating: 8.1,
    boxOffice: 65,
    director: "Ashutosh Gowariker",
    studio: "Aamir Khan Productions",
    category: "MASTERPIECES",
    tagline: "Academy Award nominated classic of courage, unity, and cricket",
    auctionType: "CINEMA",
  },
  {
    id: "3-idiots",
    title: "3 Idiots",
    year: 2009,
    genre: "Comedy / Drama",
    genres: ["Comedy", "Drama"],
    basePrice: 1,
    posterPosition: "25% 75%",
    imdbRating: 8.4,
    boxOffice: 460,
    director: "Rajkumar Hirani",
    studio: "Vinod Chopra Films",
    category: "BOLLYWOOD",
    tagline: "Iconic celebration of chasing excellence over success",
    auctionType: "CINEMA",
  },
  {
    id: "queen",
    title: "Queen",
    year: 2014,
    genre: "Comedy / Drama",
    genres: ["Comedy", "Drama", "Self-Discovery"],
    basePrice: 1,
    posterPosition: "25% 75%",
    imdbRating: 8.1,
    boxOffice: 108,
    director: "Vikas Bahl",
    studio: "Phantom Films / Viacom18",
    category: "BOLLYWOOD",
    tagline: "Heartwarming solo journey of liberation and self-love",
    auctionType: "CINEMA",
  },
  {
    id: "drishyam",
    title: "Drishyam",
    year: 2015,
    genre: "Mystery / Drama",
    genres: ["Mystery", "Thriller", "Drama"],
    basePrice: 1,
    posterPosition: "75% 18%",
    imdbRating: 8.2,
    boxOffice: 110,
    director: "Nishikant Kamat",
    studio: "Panorama Studios",
    category: "BOLLYWOOD",
    tagline: "Genius alibi game between a protective father and police",
    auctionType: "CINEMA",
  },
  {
    id: "barfi",
    title: "Barfi!",
    year: 2012,
    genre: "Romance / Drama",
    genres: ["Romance", "Comedy", "Drama"],
    basePrice: 1,
    posterPosition: "25% 75%",
    imdbRating: 8.1,
    boxOffice: 175,
    director: "Anurag Basu",
    studio: "UTV Motion Pictures / Ishana Movies",
    category: "MASTERPIECES",
    tagline: "Poetic Chaplin-esque celebration of unconditional love",
    auctionType: "CINEMA",
  },
  {
    id: "taare",
    title: "Taare Zameen Par",
    year: 2007,
    genre: "Drama / Family",
    genres: ["Drama", "Family"],
    basePrice: 1,
    posterPosition: "25% 30%",
    imdbRating: 8.3,
    boxOffice: 135,
    director: "Aamir Khan",
    studio: "Aamir Khan Productions",
    category: "MASTERPIECES",
    tagline: "Every child is special — timeless emotional masterpiece",
    auctionType: "CINEMA",
  },
  {
    id: "znmd",
    title: "Zindagi Na Milegi Dobara",
    year: 2011,
    genre: "Comedy / Drama",
    genres: ["Comedy", "Drama", "Adventure"],
    basePrice: 1,
    posterPosition: "25% 75%",
    imdbRating: 8.2,
    boxOffice: 153,
    director: "Zoya Akhtar",
    studio: "Excel Entertainment",
    category: "BOLLYWOOD",
    tagline: "Ultimate road-trip ode to friendship and living fearlessly",
    auctionType: "CINEMA",
  },
  {
    id: "swades",
    title: "Swades",
    year: 2004,
    genre: "Drama",
    genres: ["Drama", "Social"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.2,
    boxOffice: 35,
    director: "Ashutosh Gowariker",
    studio: "Ashutosh Gowariker Productions / UTV",
    category: "MASTERPIECES",
    tagline: "A NASA scientist rediscovers his roots and ignites change",
    auctionType: "CINEMA",
  },
  {
    id: "sholay",
    title: "Sholay",
    year: 1975,
    genre: "Action / Adventure",
    genres: ["Action", "Adventure", "Western"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.1,
    boxOffice: 3000,
    director: "Ramesh Sippy",
    studio: "Sippy Films",
    category: "MASTERPIECES",
    tagline: "The greatest cinematic saga in the history of Bollywood",
    auctionType: "CINEMA",
  },
  {
    id: "ddlj",
    title: "Dilwale Dulhania Le Jayenge",
    year: 1995,
    genre: "Romance / Drama",
    genres: ["Romance", "Drama", "Musical"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.0,
    boxOffice: 2000,
    director: "Aditya Chopra",
    studio: "Yash Raj Films (YRF)",
    category: "BOLLYWOOD",
    tagline: "Come fall in love — the defining romance of generations",
    auctionType: "CINEMA",
  },
  {
    id: "stree-2",
    title: "Stree 2",
    year: 2024,
    genre: "Comedy / Horror",
    genres: ["Comedy", "Horror"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 7.2,
    boxOffice: 874,
    director: "Amar Kaushik",
    studio: "Maddock Films / Jio Studios",
    category: "BOLLYWOOD",
    tagline: "Chanderi returns to face Sarkata in a record-shattering horror comedy",
    auctionType: "CINEMA",
  },
  {
    id: "animal",
    title: "Animal",
    year: 2023,
    genre: "Action / Drama",
    genres: ["Action", "Crime", "Drama"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 6.6,
    boxOffice: 917,
    director: "Sandeep Reddy Vanga",
    studio: "T-Series / Bhadrakali Pictures",
    category: "BOLLYWOOD",
    tagline: "An unhinged son's obsessive and violent devotion to his father",
    auctionType: "CINEMA",
  },
  {
    id: "pathaan",
    title: "Pathaan",
    year: 2023,
    genre: "Action / Thriller",
    genres: ["Action", "Thriller", "Spy"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 5.9,
    boxOffice: 1050,
    director: "Siddharth Anand",
    studio: "Yash Raj Films (YRF)",
    category: "BOLLYWOOD",
    tagline: "An exiled RAW spy returns to safeguard the nation from bioterror",
    auctionType: "CINEMA",
  },
  {
    id: "pk",
    title: "PK",
    year: 2014,
    genre: "Comedy / Drama",
    genres: ["Comedy", "Drama", "Sci-Fi"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.1,
    boxOffice: 770,
    director: "Rajkumar Hirani",
    studio: "Vinod Chopra Films",
    category: "BOLLYWOOD",
    tagline: "An innocent alien questions human dogmas with profound innocence",
    auctionType: "CINEMA",
  },
  {
    id: "bajrangi-bhaijaan",
    title: "Bajrangi Bhaijaan",
    year: 2015,
    genre: "Action / Drama",
    genres: ["Drama", "Adventure", "Family"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.1,
    boxOffice: 969,
    director: "Kabir Khan",
    studio: "Salman Khan Films / Eros International",
    category: "BOLLYWOOD",
    tagline: "A pure-hearted man embarks on an impossible border-crossing rescue",
    auctionType: "CINEMA",
  },
  {
    id: "gangs-of-wasseypur",
    title: "Gangs of Wasseypur",
    year: 2012,
    genre: "Crime / Action",
    genres: ["Crime", "Action", "Drama"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.2,
    boxOffice: 70,
    director: "Anurag Kashyap",
    studio: "AKFPL / Viacom18",
    category: "MASTERPIECES",
    tagline: "The multi-generational coal mafia blood feud of Dhanbad",
    auctionType: "CINEMA",
  },
  {
    id: "chak-de-india",
    title: "Chak De! India",
    year: 2007,
    genre: "Drama / Sports",
    genres: ["Drama", "Sports"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.1,
    boxOffice: 105,
    director: "Shimit Amin",
    studio: "Yash Raj Films (YRF)",
    category: "BOLLYWOOD",
    tagline: "Disgraced coach Kabir Khan builds a champion women's hockey team",
    auctionType: "CINEMA",
  },
  {
    id: "munna-bhai-mbbs",
    title: "Munna Bhai M.B.B.S.",
    year: 2003,
    genre: "Comedy / Drama",
    genres: ["Comedy", "Drama"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.1,
    boxOffice: 35,
    director: "Rajkumar Hirani",
    studio: "Vinod Chopra Films",
    category: "BOLLYWOOD",
    tagline: "A street gangster enrolls in medical school with the magic of Jaadu Ki Jhappi",
    auctionType: "CINEMA",
  },
  {
    id: "hera-pheri",
    title: "Hera Pheri",
    year: 2000,
    genre: "Comedy / Crime",
    genres: ["Comedy", "Crime"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.2,
    boxOffice: 25,
    director: "Priyadarshan",
    studio: "A.G. Films",
    category: "BOLLYWOOD",
    tagline: "Three impoverished roommates land the wrong ransom phone call",
    auctionType: "CINEMA",
  },
  {
    id: "om-shanti-om",
    title: "Om Shanti Om",
    year: 2007,
    genre: "Comedy / Drama",
    genres: ["Comedy", "Drama", "Musical"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 6.8,
    boxOffice: 150,
    director: "Farah Khan",
    studio: "Red Chillies Entertainment",
    category: "BOLLYWOOD",
    tagline: "Reincarnation, 70s Bollywood glam, and timeless love",
    auctionType: "CINEMA",
  },
  {
    id: "chennai-express",
    title: "Chennai Express",
    year: 2013,
    genre: "Action / Comedy",
    genres: ["Action", "Comedy", "Romance"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 6.1,
    boxOffice: 423,
    director: "Rohit Shetty",
    studio: "Red Chillies / UTV Motion Pictures",
    category: "BOLLYWOOD",
    tagline: "Don't underestimate the power of a common man on a South rail journey",
    auctionType: "CINEMA",
  },
  {
    id: "war",
    title: "War",
    year: 2019,
    genre: "Action / Thriller",
    genres: ["Action", "Thriller"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 6.5,
    boxOffice: 475,
    director: "Siddharth Anand",
    studio: "Yash Raj Films (YRF)",
    category: "BOLLYWOOD",
    tagline: "Master spy mentor vs protege in high-octane globe-trotting warfare",
    auctionType: "CINEMA",
  },
  {
    id: "brahmastra",
    title: "Brahmāstra: Part One – Shiva",
    year: 2022,
    genre: "Action / Fantasy",
    genres: ["Action", "Fantasy", "Adventure"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 5.6,
    boxOffice: 431,
    director: "Ayan Mukerji",
    studio: "Dharma Productions / Star Studios",
    category: "BOLLYWOOD",
    tagline: "Astraverse begins with ancient celestial weapons in modern India",
    auctionType: "CINEMA",
  },
  {
    id: "kabir-singh",
    title: "Kabir Singh",
    year: 2019,
    genre: "Romance / Drama",
    genres: ["Romance", "Drama"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 7.0,
    boxOffice: 379,
    director: "Sandeep Reddy Vanga",
    studio: "T-Series / Cine1 Studios",
    category: "BOLLYWOOD",
    tagline: "Intense tale of a brilliant surgeon spiraling after heartbreak",
    auctionType: "CINEMA",
  },
  {
    id: "uri",
    title: "Uri: The Surgical Strike",
    year: 2019,
    genre: "Action / War",
    genres: ["Action", "Drama", "War"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.2,
    boxOffice: 359,
    director: "Aditya Dhar",
    studio: "RSVP Movies",
    category: "BOLLYWOOD",
    tagline: "How's the josh? High sir! Covert retaliation operation",
    auctionType: "CINEMA",
  },

  // --- SOUTH INDIAN PAN-INDIA BLOCKBUSTERS (Base Price: ₹1 Cr) ---
  {
    id: "rrr",
    title: "RRR",
    year: 2022,
    genre: "Epic / Action",
    genres: ["Action", "Drama", "Epic"],
    basePrice: 1,
    posterPosition: "75% 75%",
    imdbRating: 7.8,
    boxOffice: 1387,
    director: "S.S. Rajamouli",
    studio: "DVV Entertainment",
    category: "SOUTH_PAN_INDIA",
    tagline: "Oscar-winning cinematic spectacle of brotherly rebellion",
    auctionType: "CINEMA",
  },
  {
    id: "baahubali-2",
    title: "Baahubali 2: The Conclusion",
    year: 2017,
    genre: "Action / Fantasy",
    genres: ["Action", "Fantasy", "Epic"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.2,
    boxOffice: 1810,
    director: "S.S. Rajamouli",
    studio: "Arka Media Works",
    category: "SOUTH_PAN_INDIA",
    tagline: "The monumental mythological epic that redefined Indian cinema",
    auctionType: "CINEMA",
  },
  {
    id: "kgf-2",
    title: "K.G.F: Chapter 2",
    year: 2022,
    genre: "Action / Crime",
    genres: ["Action", "Crime", "Thriller"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.3,
    boxOffice: 1250,
    director: "Prashanth Neel",
    studio: "Hombale Films",
    category: "SOUTH_PAN_INDIA",
    tagline: "Monster Rocky takes over the gold empire in sheer style",
    auctionType: "CINEMA",
  },
  {
    id: "pushpa",
    title: "Pushpa: The Rise",
    year: 2021,
    genre: "Action / Crime",
    genres: ["Action", "Crime", "Drama"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 7.6,
    boxOffice: 373,
    director: "Sukumar",
    studio: "Mythri Movie Makers / Muttamsetty",
    category: "SOUTH_PAN_INDIA",
    tagline: "Pushpa Raj rises to rule the red sandalwood syndicates",
    auctionType: "CINEMA",
  },
  {
    id: "kantara",
    title: "Kantara",
    year: 2022,
    genre: "Action / Mythological",
    genres: ["Action", "Drama", "Mythology"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.2,
    boxOffice: 450,
    director: "Rishab Shetty",
    studio: "Hombale Films",
    category: "SOUTH_PAN_INDIA",
    tagline: "Folklore and divine wrath clash with forest corruption",
    auctionType: "CINEMA",
  },
  {
    id: "kalki-2898",
    title: "Kalki 2898 AD",
    year: 2024,
    genre: "Sci-Fi / Epic",
    genres: ["Sci-Fi", "Action", "Mythology"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 7.6,
    boxOffice: 1042,
    director: "Nag Ashwin",
    studio: "Vyjayanthi Movies",
    category: "SOUTH_PAN_INDIA",
    tagline: "Mahabharata lore meets futuristic dystopia in grand scale",
    auctionType: "CINEMA",
  },
  {
    id: "vikram",
    title: "Vikram",
    year: 2022,
    genre: "Action / Thriller",
    genres: ["Action", "Thriller", "Crime"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.3,
    boxOffice: 435,
    director: "Lokesh Kanagaraj",
    studio: "Raaj Kamal Films International",
    category: "SOUTH_PAN_INDIA",
    tagline: "Ghost operative unleashes retribution against drug cartels",
    auctionType: "CINEMA",
  },
  {
    id: "jailer",
    title: "Jailer",
    year: 2023,
    genre: "Action / Comedy",
    genres: ["Action", "Crime", "Comedy"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 7.1,
    boxOffice: 605,
    director: "Nelson Dilipkumar",
    studio: "Sun Pictures",
    category: "SOUTH_PAN_INDIA",
    tagline: "Superstar Rajinikanth in sheer mass swagger as Tiger Muthuvel Pandian",
    auctionType: "CINEMA",
  },
  {
    id: "tumbbad",
    title: "Tumbbad",
    year: 2018,
    genre: "Horror / Fantasy",
    genres: ["Horror", "Fantasy", "Mystery"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.2,
    boxOffice: 50,
    director: "Rahi Anil Barve",
    studio: "Sohum Shah Films / Color Yellow",
    category: "MASTERPIECES",
    tagline: "Atmospheric mythological horror on insatiable human greed",
    auctionType: "CINEMA",
  },

  // --- HOLLYWOOD & GLOBAL CULMINATIONS (Base Price: ₹1 Cr) ---
  {
    id: "interstellar",
    title: "Interstellar",
    year: 2014,
    genre: "Sci-Fi / Adventure",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.7,
    boxOffice: 5700,
    director: "Christopher Nolan",
    studio: "Paramount Pictures / Warner Bros / Syncopy",
    category: "HOLLYWOOD",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    auctionType: "CINEMA",
  },
  {
    id: "inception",
    title: "Inception",
    year: 2010,
    genre: "Sci-Fi / Action",
    genres: ["Sci-Fi", "Action", "Thriller"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.8,
    boxOffice: 6800,
    director: "Christopher Nolan",
    studio: "Warner Bros / Legendary / Syncopy",
    category: "HOLLYWOOD",
    tagline: "Your mind is the scene of the crime in dream-sharing espionage",
    auctionType: "CINEMA",
  },
  {
    id: "the-dark-knight",
    title: "The Dark Knight",
    year: 2008,
    genre: "Action / Crime",
    genres: ["Action", "Crime", "Drama"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 9.0,
    boxOffice: 8200,
    director: "Christopher Nolan",
    studio: "Warner Bros / DC Comics / Legendary",
    category: "HOLLYWOOD",
    tagline: "Why so serious? Batman faces the anarchy of the Joker",
    auctionType: "CINEMA",
  },
  {
    id: "oppenheimer",
    title: "Oppenheimer",
    year: 2023,
    genre: "Biography / Drama",
    genres: ["Biography", "Drama", "History"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 8.9,
    boxOffice: 7900,
    director: "Christopher Nolan",
    studio: "Universal Pictures / Syncopy",
    category: "HOLLYWOOD",
    tagline: "The story of American Prometheus and the dawn of the atomic age",
    auctionType: "CINEMA",
  },
  {
    id: "titanic",
    title: "Titanic",
    year: 1997,
    genre: "Romance / Drama",
    genres: ["Romance", "Drama"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 7.9,
    boxOffice: 18000,
    director: "James Cameron",
    studio: "Paramount Pictures / 20th Century Fox",
    category: "HOLLYWOOD",
    tagline: "Nothing on Earth could come between them on the ship of dreams",
    auctionType: "CINEMA",
  },
  {
    id: "avatar",
    title: "Avatar",
    year: 2009,
    genre: "Sci-Fi / Action",
    genres: ["Sci-Fi", "Action", "Adventure"],
    basePrice: 1,
    posterPosition: "50% 50%",
    imdbRating: 7.9,
    boxOffice: 24000,
    director: "James Cameron",
    studio: "20th Century Fox / Lightstorm",
    category: "HOLLYWOOD",
    tagline: "Enter the world of Pandora in revolutionary 3D spectacle",
    auctionType: "CINEMA",
  },
];
