import type { Player, Movie } from "./game-data";
import { movies as DEFAULT_MOVIES } from "./game-data";
import type { PlayerScore } from "./game-manager";

// Multi-tier API Keys (Failover cascade: Groq -> OpenAI -> Gemini/Backup -> Algorithmic)
const GROQ_API_KEY = (import.meta.env["VITE_GROQ_API_KEY"] as string | undefined) || "";
const OPENAI_API_KEY = (import.meta.env["VITE_OPENAI_API_KEY"] as string | undefined) || "";
const BACKUP_AI_KEY = (import.meta.env["VITE_BACKUP_AI_KEY"] as string | undefined) || "";

// Supported models per provider
const GROQ_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.6-27b", "openai/gpt-oss-20b", "groq/compound"];
const OPENAI_MODELS = ["gpt-4o-mini", "gpt-3.5-turbo"];
const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

export interface EvaluationPayload {
  players: {
    id: string;
    name: string;
    avatar: string;
    color?: string | undefined;
    isHost?: boolean | undefined;
    remainingBudget: number;
    initialBudget: number;
    topMovies: {
      id: string;
      title: string;
      year: number;
      genres: string[];
      imdbRating: number;
      boxOffice: number;
      director: string;
      purchasePrice: number;
    }[];
    allWonCount: number;
  }[];
}

export interface AiEvaluationResponse {
  winnerId: string;
  rankings: {
    playerId: string;
    score: number;
    rank: number;
    critique: string;
    breakdown: {
      criticalAcclaim: number;
      boxOfficeRoi: number;
      genreSynergy: number;
      budgetEfficiency: number;
    };
  }[];
  modelUsed?: string;
}

// -------------------------------------------------------------
// 1. DYNAMIC AI MOVIE SLATE GENERATOR
// -------------------------------------------------------------
/**
 * Generates an exciting, varied movie auction pool using the 3-tier AI failover cascade:
 * Tier 1: Groq -> Tier 2: OpenAI -> Tier 3: Gemini -> Tier 4: Fallback Catalog
 */
export async function generateAiMovieSlate(
  count: number = 8,
  theme?: string,
): Promise<{ movies: Movie[]; modelUsed: string }> {
  const prompt = `You are a legendary cinema curator and film festival director for Cinebid Movie Auction.
Generate exactly ${count} iconic, exciting, highly recognizable movies for a live movie auction game.
${theme ? `Theme/Focus: ${theme}` : "Mix Indian Blockbusters (Bollywood/South), Global Hollywood Blockbusters, Sci-Fi Classics, and Masterpiece Dramas."}

For each movie, generate:
- id: a clean lowercase kebab-case id (e.g. "oppenheimer-2023", "rrr-2022")
- title: movie title
- year: release year
- genre: primary genre string (e.g. "Action / Thriller", "Sci-Fi / Drama")
- genres: array of 2-3 genres (e.g. ["Action", "Sci-Fi", "Thriller"])
- basePrice: starting auction base price in Crores (between 10 and 22)
- imdbRating: IMDb rating (e.g. 7.8, 8.5)
- boxOffice: global box office in ₹ Crores (e.g. 450, 1200, 2400)
- director: famous director name
- tagline: punchy 1-sentence movie tagline

Return ONLY valid JSON matching this schema:
{
  "movies": [
    {
      "id": "jawan-2023",
      "title": "Jawan",
      "year": 2023,
      "genre": "Action / Thriller",
      "genres": ["Action", "Thriller"],
      "basePrice": 14,
      "imdbRating": 7.0,
      "boxOffice": 1148,
      "director": "Atlee",
      "tagline": "High-octane mass action thriller"
    }
  ]
}`;

  // TIER 1: GROQ
  if (GROQ_API_KEY) {
    for (const model of GROQ_MODELS) {
      try {
        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.75,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.movies) && parsed.movies.length > 0) {
              const formattedMovies = mapToMovieInterface(parsed.movies);
              return { movies: formattedMovies, modelUsed: `Groq (${model})` };
            }
          }
        }
      } catch {
        // Try next model or tier
      }
    }
  }

  // TIER 2: OPENAI
  if (OPENAI_API_KEY) {
    for (const model of OPENAI_MODELS) {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.75,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.movies) && parsed.movies.length > 0) {
              const formattedMovies = mapToMovieInterface(parsed.movies);
              return { movies: formattedMovies, modelUsed: `OpenAI (${model})` };
            }
          }
        }
      } catch {
        // Try next tier
      }
    }
  }

  // TIER 3: GEMINI / BACKUP AI
  if (BACKUP_AI_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${BACKUP_AI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );

        if (resp.ok) {
          const data = await resp.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.movies) && parsed.movies.length > 0) {
              const formattedMovies = mapToMovieInterface(parsed.movies);
              return { movies: formattedMovies, modelUsed: `Gemini (${model})` };
            }
          }
        }
      } catch {
        // Fall through
      }
    }
  }

  // TIER 4: CURATED SHUFFLED FALLBACK
  const shuffled = [...DEFAULT_MOVIES].sort(() => 0.5 - Math.random());
  return { movies: shuffled.slice(0, count), modelUsed: "Curated Cinebid Vault" };
}

function mapToMovieInterface(rawList: any[]): Movie[] {
  return rawList.map((m, idx) => ({
    id: m.id || `movie_${Date.now()}_${idx}`,
    title: m.title || "Untitled Masterpiece",
    year: Number(m.year) || 2023,
    genre: m.genre || (Array.isArray(m.genres) ? m.genres.join(" / ") : "Drama"),
    genres: Array.isArray(m.genres) && m.genres.length ? m.genres : [m.genre || "Drama"],
    basePrice: Number(m.basePrice) || 12,
    posterPosition: "50% 50%",
    imdbRating: Number(m.imdbRating) || 8.0,
    boxOffice: Number(m.boxOffice) || 500,
    director: m.director || "Acclaimed Director",
    tagline: m.tagline || "A cinematic spectacle",
  }));
}

// -------------------------------------------------------------
// 2. MULTI-TIER AI PORTFOLIO EVALUATOR
// -------------------------------------------------------------
export async function evaluatePortfoliosWithAi(
  players: Player[],
  userSelectedTop5Map: Record<string, string[]> = {},
): Promise<PlayerScore[]> {
  const payload: EvaluationPayload = {
    players: players.map((p) => {
      const selectedIds = userSelectedTop5Map[p.id];
      const targetMovies = selectedIds?.length
        ? p.movies.filter((m) => selectedIds.includes(m.id))
        : p.movies.slice(0, 5);

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        isHost: p.isHost,
        remainingBudget: p.budget,
        initialBudget: p.initialBudget,
        allWonCount: p.movies.length,
        topMovies: targetMovies.map((m) => ({
          id: m.id,
          title: m.title,
          year: m.year,
          genres: m.genres || [m.genre],
          imdbRating: m.imdbRating || 8.0,
          boxOffice: m.boxOffice || 500,
          director: m.director || "Acclaimed Director",
          purchasePrice: m.purchasePrice || m.basePrice,
        })),
      };
    }),
  };

  const systemPrompt = `You are the Grand Jury President of Cinebid International Film Festival and a veteran studio chief.
Your job is to evaluate movie auction portfolios built by competing producers.

For each player, evaluate their Top 5 movie slate across 4 quantifiable pillars:
1. Critical Acclaim (Max 40 pts): Based on IMDb rating and directorial craft.
2. Box Office ROI (Max 30 pts): Combined box office earnings vs total crore spent in auction.
3. Genre Synergy & Diversity (Max 20 pts): Thematic balance (Action, Drama, Thriller, Comedy, Sci-Fi, Romance).
4. Capital Efficiency (Max 10 pts): Bonus for smart unspent capital retained without overbidding.

Return ONLY a valid JSON object matching this exact schema:
{
  "winnerId": "player_id_of_1st_place",
  "rankings": [
    {
      "playerId": "p1",
      "score": 94.2,
      "rank": 1,
      "critique": "Witty and insightful 2-sentence cinematic critique praising their specific movie titles, box office muscle, and bidding strategy.",
      "breakdown": {
        "criticalAcclaim": 38.5,
        "boxOfficeRoi": 28.2,
        "genreSynergy": 18.5,
        "budgetEfficiency": 9.0
      }
    }
  ]
}`;

  const userPrompt = `Here is the slate of movie portfolios in the auction room:\n${JSON.stringify(payload, null, 2)}\n\nAnalyze every player, calculate scores (0-100), assign ranks 1 to ${players.length}, and write personalized critiques. Return strictly valid JSON.`;

  // TIER 1: GROQ
  if (GROQ_API_KEY) {
    for (const model of GROQ_MODELS) {
      try {
        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content) as AiEvaluationResponse;
            return formatAiResultsToPlayerScores(players, parsed, `Groq ${model}`);
          }
        }
      } catch {
        // Try next model or tier
      }
    }
  }

  // TIER 2: OPENAI
  if (OPENAI_API_KEY) {
    for (const model of OPENAI_MODELS) {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content) as AiEvaluationResponse;
            return formatAiResultsToPlayerScores(players, parsed, `OpenAI ${model}`);
          }
        }
      } catch {
        // Try next tier
      }
    }
  }

  // TIER 3: GEMINI / BACKUP AI
  if (BACKUP_AI_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${BACKUP_AI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );

        if (resp.ok) {
          const data = await resp.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            const parsed = JSON.parse(content) as AiEvaluationResponse;
            return formatAiResultsToPlayerScores(players, parsed, `Gemini ${model}`);
          }
        }
      } catch {
        // Fall through
      }
    }
  }

  // TIER 4: GUARANTEED ALGORITHMIC FALLBACK
  return fallbackAlgorithmicEvaluation(players, userSelectedTop5Map);
}

function formatAiResultsToPlayerScores(
  players: Player[],
  aiData: AiEvaluationResponse,
  modelName: string,
): PlayerScore[] {
  const scoreMap = new Map(aiData.rankings.map((r) => [r.playerId, r]));

  const results: PlayerScore[] = players.map((player) => {
    const aiItem = scoreMap.get(player.id);
    if (aiItem) {
      return {
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        color: player.color,
        isHost: player.isHost,
        score: Number(aiItem.score) || 80,
        rank: aiItem.rank || 1,
        wonCount: player.movies.length,
        remainingBudget: player.budget,
        critique: aiItem.critique || "A masterfully curated studio portfolio evaluated by the Grand Jury.",
        breakdown: aiItem.breakdown,
      };
    }

    return {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      color: player.color,
      isHost: player.isHost,
      score: 75.0,
      rank: 99,
      wonCount: player.movies.length,
      remainingBudget: player.budget,
      critique: "Competent studio slate evaluated by Grand Jury.",
      breakdown: { criticalAcclaim: 30, boxOfficeRoi: 20, genreSynergy: 15, budgetEfficiency: 10 },
    };
  });

  results.sort((a, b) => b.score - a.score || b.remainingBudget - a.remainingBudget);
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}

function fallbackAlgorithmicEvaluation(
  players: Player[],
  userSelectedTop5Map: Record<string, string[]> = {},
): PlayerScore[] {
  const scores: PlayerScore[] = players.map((player) => {
    const selectedIds = userSelectedTop5Map[player.id];
    const targetMovies = selectedIds?.length
      ? player.movies.filter((m) => selectedIds.includes(m.id))
      : player.movies.slice(0, 5);

    const count = targetMovies.length;
    if (count === 0) {
      return {
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        color: player.color,
        isHost: player.isHost,
        score: Math.round((player.budget / player.initialBudget) * 35 * 10) / 10,
        rank: 0,
        wonCount: 0,
        remainingBudget: player.budget,
        critique: "No movies secured in the auction. Held reserve capital.",
        breakdown: { criticalAcclaim: 0, boxOfficeRoi: 0, genreSynergy: 0, budgetEfficiency: 10 },
      };
    }

    const avgImdb = targetMovies.reduce((acc, m) => acc + (m.imdbRating || 8.0), 0) / count;
    const criticalAcclaim = Math.min(40, (avgImdb / 10) * 40 * (count >= 5 ? 1.0 : count / 5));

    const totalBoxOffice = targetMovies.reduce((acc, m) => acc + (m.boxOffice || 400), 0);
    const totalSpent = targetMovies.reduce((acc, m) => acc + m.purchasePrice, 0) || 1;
    const roi = totalBoxOffice / totalSpent;
    const boxOfficeScore = Math.min(18, (totalBoxOffice / 4000) * 18);
    const roiScore = Math.min(12, (roi / 40) * 12);
    const boxOfficeRoi = boxOfficeScore + roiScore;

    const allGenres = new Set<string>();
    targetMovies.forEach((m) => (m.genres || [m.genre]).forEach((g) => allGenres.add(g)));
    const genreSynergy = Math.min(20, (allGenres.size / 5) * 20);

    const budgetEfficiency = Math.min(10, (player.budget / player.initialBudget) * 10);
    const totalScore = Math.round((criticalAcclaim + boxOfficeRoi + genreSynergy + budgetEfficiency) * 10) / 10;

    return {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      color: player.color,
      isHost: player.isHost,
      score: totalScore,
      rank: 1,
      wonCount: player.movies.length,
      remainingBudget: player.budget,
      critique: `Masterful curation featuring ${targetMovies[0]?.title || "blockbuster hits"}. Strong theatrical presence with ₹${player.budget} Cr capital retained.`,
      breakdown: {
        criticalAcclaim: Math.round(criticalAcclaim * 10) / 10,
        boxOfficeRoi: Math.round(boxOfficeRoi * 10) / 10,
        genreSynergy: Math.round(genreSynergy * 10) / 10,
        budgetEfficiency: Math.round(budgetEfficiency * 10) / 10,
      },
    };
  });

  scores.sort((a, b) => b.score - a.score || b.remainingBudget - a.remainingBudget);
  scores.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return scores;
}
