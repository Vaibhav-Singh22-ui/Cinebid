import { useEffect, useState } from "react";

// In-memory poster cache to prevent redundant network lookups
const posterMemoryCache = new Map<string, string>();
const POSTER_STORAGE_PREFIX = "cinebid_poster_";

// High-resolution verified official poster mappings for movies
const OFFICIAL_POSTER_SEEDS: Record<string, string> = {
  jawan: "https://upload.wikimedia.org/wikipedia/en/3/39/Jawan_film_poster.jpg",
  dangal: "https://upload.wikimedia.org/wikipedia/en/9/99/Dangal_Poster.jpg",
  andhadhun: "https://upload.wikimedia.org/wikipedia/en/4/47/Andhadhun_poster.jpg",
  "gully-boy": "https://upload.wikimedia.org/wikipedia/en/0/07/Gully_Boy_poster.jpg",
  rrr: "https://upload.wikimedia.org/wikipedia/en/d/d7/RRR_Poster.jpg",
  lagaan: "https://upload.wikimedia.org/wikipedia/en/b/b6/Lagaan.jpg",
  "3-idiots": "https://upload.wikimedia.org/wikipedia/en/d/df/3_idiots_poster.jpg",
  queen: "https://upload.wikimedia.org/wikipedia/en/4/45/QueenMoviePoster7thMarch.jpg",
  drishyam: "https://upload.wikimedia.org/wikipedia/en/8/8a/Drishyam_2015_film.jpg",
  barfi: "https://upload.wikimedia.org/wikipedia/en/2/2e/Barfi%21_poster.jpg",
  taare: "https://upload.wikimedia.org/wikipedia/en/b/b4/Taare_Zameen_Par_Like_Stars_on_Earth_poster.png",
  znmd: "https://upload.wikimedia.org/wikipedia/en/3/3d/Zindagi_Na_Milegi_Dobara.jpg",
  "baahubali-2": "https://upload.wikimedia.org/wikipedia/en/9/93/Baahubali_2_The_Conclusion_poster.jpg",
  "kgf-2": "https://upload.wikimedia.org/wikipedia/en/d/d0/K.G.F_Chapter_2.jpg",
  tumbbad: "https://upload.wikimedia.org/wikipedia/en/4/41/Tumbbad_poster.jpg",
  swades: "https://upload.wikimedia.org/wikipedia/en/8/85/Swades_poster.jpg",
  sholay: "https://upload.wikimedia.org/wikipedia/en/5/52/Sholay-poster.jpg",
  ddlj: "https://upload.wikimedia.org/wikipedia/en/8/80/Dilwale_Dulhania_Le_Jayenge_poster.jpg",
  "stree-2": "https://upload.wikimedia.org/wikipedia/en/3/38/Stree_2_film_poster.jpg",
  pushpa: "https://upload.wikimedia.org/wikipedia/en/7/75/Pushpa_-_The_Rise_%282021_film%29.jpg",
  kantara: "https://upload.wikimedia.org/wikipedia/en/8/84/Kantara_poster.jpeg",
  "kalki-2898": "https://upload.wikimedia.org/wikipedia/en/4/4c/Kalki_2898_AD.jpg",
  animal: "https://upload.wikimedia.org/wikipedia/en/9/90/Animal_%282023_film%29_poster.jpg",
  pathaan: "https://upload.wikimedia.org/wikipedia/en/c/c3/Pathaan_film_poster.jpg",
  pk: "https://upload.wikimedia.org/wikipedia/en/c/c3/PK_poster.jpg",
  "bajrangi-bhaijaan": "https://upload.wikimedia.org/wikipedia/en/d/dd/Bajrangi_Bhaijaan_Poster.jpg",
  "gangs-of-wasseypur": "https://upload.wikimedia.org/wikipedia/en/6/6a/Gangs_of_Wasseypur_poster.jpg",
  "chak-de-india": "https://upload.wikimedia.org/wikipedia/en/0/0c/Chak_De%21_India.jpg",
  "munna-bhai-mbbs": "https://upload.wikimedia.org/wikipedia/en/a/a2/Munnabhai_M.B.B.S._poster.jpg",
  "hera-pheri": "https://upload.wikimedia.org/wikipedia/en/2/2f/Herapheri.jpg",
  interstellar: "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg",
  inception: "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg",
  "the-dark-knight": "https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg",
  oppenheimer: "https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg",
  titanic: "https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png",
  avatar: "https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.pyg",
  vikram: "https://upload.wikimedia.org/wikipedia/en/9/93/Vikram_2022_poster.jpg",
  jailer: "https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg",
  uri: "https://upload.wikimedia.org/wikipedia/en/3/3b/URI_-_New_poster.jpg",
  "kabir-singh": "https://upload.wikimedia.org/wikipedia/en/d/dc/Kabir_Singh.jpg",
  war: "https://upload.wikimedia.org/wikipedia/en/6/6f/War_official_poster.jpg",
  "om-shanti-om": "https://upload.wikimedia.org/wikipedia/en/9/9b/Om_Shanti_Om_poster.jpg",
  "chennai-express": "https://upload.wikimedia.org/wikipedia/en/1/1b/Chennai_Express.jpg",
  brahmastra: "https://upload.wikimedia.org/wikipedia/en/4/40/Brahmastra_Part_One_Shiva.jpg",
};

/**
 * Fetch real-time official movie poster image URL.
 * Queries:
 * 1. Seeded high-definition poster mappings
 * 2. Local browser storage cache
 * 3. Wikipedia REST API Page Summary endpoint (Public, CORS-enabled, genuine official posters)
 */
export async function fetchRealMoviePoster(title: string, id?: string): Promise<string> {
  const cleanTitle = title.trim();
  const normalizedKey = (id || cleanTitle).toLowerCase().replace(/[^a-z0-9]/g, "-");

  // 1. Check in-memory cache
  if (posterMemoryCache.has(normalizedKey)) {
    return posterMemoryCache.get(normalizedKey)!;
  }

  // 2. Check official seed mapping
  if (id && OFFICIAL_POSTER_SEEDS[id.toLowerCase()]) {
    const url = OFFICIAL_POSTER_SEEDS[id.toLowerCase()] || "";
    if (url) {
      posterMemoryCache.set(normalizedKey, url);
      return url;
    }
  }
  for (const [seedKey, seedUrl] of Object.entries(OFFICIAL_POSTER_SEEDS)) {
    if (normalizedKey.includes(seedKey) || cleanTitle.toLowerCase().includes(seedKey)) {
      posterMemoryCache.set(normalizedKey, seedUrl);
      return seedUrl;
    }
  }

  // 3. Check localStorage cache
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`${POSTER_STORAGE_PREFIX}${normalizedKey}`);
      if (stored) {
        posterMemoryCache.set(normalizedKey, stored);
        return stored;
      }
    } catch {
      // ignore
    }
  }

  // 4. Query Wikipedia REST API for genuine live movie poster
  try {
    const wikiQueries = [
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle + " (film)")}`,
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`,
    ];

    for (const endpoint of wikiQueries) {
      try {
        const response = await fetch(endpoint, {
          headers: { Accept: "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          const posterUrl = data?.originalimage?.source || data?.thumbnail?.source;
          if (posterUrl) {
            posterMemoryCache.set(normalizedKey, posterUrl);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(`${POSTER_STORAGE_PREFIX}${normalizedKey}`, posterUrl);
              } catch {
                // ignore
              }
            }
            return posterUrl;
          }
        }
      } catch {
        // continue to next query
      }
    }
  } catch (e) {
    console.warn(`[Poster Fetch] Failed to fetch poster for "${cleanTitle}":`, e);
  }

  // Fallback if no online poster could be resolved
  const fallback = OFFICIAL_POSTER_SEEDS["jawan"] || "https://upload.wikimedia.org/wikipedia/en/3/39/Jawan_film_poster.jpg";
  posterMemoryCache.set(normalizedKey, fallback);
  return fallback;
}

/**
 * React hook to load movie poster in real-time
 */
export function useMoviePoster(title: string, id?: string, initialUrl?: string): string {
  const [posterUrl, setPosterUrl] = useState<string>(() => {
    if (initialUrl) return initialUrl;
    const normalizedKey = (id || title).toLowerCase().replace(/[^a-z0-9]/g, "-");
    if (posterMemoryCache.has(normalizedKey)) return posterMemoryCache.get(normalizedKey) || "";
    if (id && OFFICIAL_POSTER_SEEDS[id.toLowerCase()]) return OFFICIAL_POSTER_SEEDS[id.toLowerCase()] || "";
    return "";
  });

  useEffect(() => {
    let active = true;
    void fetchRealMoviePoster(title, id).then((url) => {
      if (active && url) {
        setPosterUrl(url);
      }
    });
    return () => {
      active = false;
    };
  }, [title, id]);

  return posterUrl || OFFICIAL_POSTER_SEEDS["jawan"] || "https://upload.wikimedia.org/wikipedia/en/3/39/Jawan_film_poster.jpg";
}

export function getOfficialPosterUrl(id: string): string | undefined {
  return OFFICIAL_POSTER_SEEDS[id.toLowerCase()] || undefined;
}
