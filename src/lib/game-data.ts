export type GameStatus = "LOBBY" | "AUCTION" | "TOP_FIVE" | "EVALUATING" | "RESULTS";

export type MovieCategory =
  | "ALL"
  | "BOLLYWOOD"
  | "SOUTH_PAN_INDIA"
  | "HOLLYWOOD"
  | "MASTERPIECES"
  | "ACTION_THRILLER";

export interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string;
  genres: string[];
  basePrice: number;
  posterPosition: string;
  imdbRating: number;
  boxOffice: number; // in Crores
  director: string;
  studio?: string;
  category?: MovieCategory | string;
  tagline?: string;
}

export interface OwnedMovie extends Movie {
  purchasePrice: number;
  purchasedBy?: string;
  purchasedByName?: string;
}

export interface Player {
  id: string;
  name: string;
  budget: number;
  initialBudget: number;
  movies: OwnedMovie[];
  isHost?: boolean | undefined;
  isBot?: boolean | undefined;
  avatar: string;
  color?: string | undefined;
  ready?: boolean | undefined;
}

export interface RoomSettings {
  maxPlayers: number;
  startingBudget: number;
  auctionSeconds: number;
  totalMovies: number;
  category?: string | undefined;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 4,
  startingBudget: 100,
  auctionSeconds: 30,
  totalMovies: 15,
  category: "ALL",
};

export const formatCr = (amount: number) => `₹${amount} Cr`;

/**
 * Recommended movie pool quantity based on player count.
 * Rule: Every player must buy at least 5 movies for their final portfolio.
 * For 2 players -> 15 movies
 * For 3 players -> 22 movies
 * For 4 players -> 28 movies
 * For 5 players -> 35 movies
 * For 6 players -> 42 movies
 * For 8 players -> 56 movies
 * For N players -> Math.max(15, N * 7)
 */
export function getRecommendedMoviePoolSize(numPlayers: number): number {
  const count = Math.max(1, numPlayers);
  if (count <= 2) return 15;
  if (count === 3) return 22;
  if (count === 4) return 28;
  if (count === 5) return 35;
  if (count === 6) return 42;
  if (count >= 7) return Math.max(15, count * 7);
  return Math.max(15, count * 7);
}

/**
 * Fisher-Yates shuffle algorithm to generate a randomized, exciting movie auction slate
 * with optional studio / category prioritization.
 */
export function getRandomizedMovieSlate(count: number = 15, category: string = "ALL"): Movie[] {
  let pool = [...movies];

  if (category && category !== "ALL") {
    const matching = pool.filter(
      (m) =>
        m.category?.toUpperCase() === category.toUpperCase() ||
        m.studio?.toUpperCase().includes(category.toUpperCase())
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

  return pool.slice(0, Math.min(count, pool.length));
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
  },
];
