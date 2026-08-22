import type { AuctionType, Movie, OwnedMovie, Player } from "./game-data";
import type { PlayerScore } from "./game-manager";
import { isOverseasPlayer } from "./cricket-data";

// Fallback curated movie slate if no AI key configured or network is offline
const DEFAULT_MOVIES = [
  { id: "jawan", title: "Jawan", year: 2023, genre: "Action Thriller", genres: ["Action", "Thriller"], basePrice: 2, imdbRating: 8.2, boxOffice: 1148, director: "Atlee", tagline: "Ready Chief?" },
  { id: "dangal", title: "Dangal", year: 2016, genre: "Biographical Sports Drama", genres: ["Biography", "Drama", "Sport"], basePrice: 2, imdbRating: 8.3, boxOffice: 2024, director: "Nitesh Tiwari", tagline: "Mhari chhoriyan chhoron se kam hain ke?" },
  { id: "andhadhun", title: "Andhadhun", year: 2018, genre: "Black Comedy Crime Thriller", genres: ["Comedy", "Crime", "Thriller"], basePrice: 1.5, imdbRating: 8.2, boxOffice: 456, director: "Sriram Raghavan", tagline: "He couldn't see it coming." },
  { id: "gully-boy", title: "Gully Boy", year: 2019, genre: "Musical Drama", genres: ["Drama", "Music"], basePrice: 1.5, imdbRating: 7.9, boxOffice: 238, director: "Zoya Akhtar", tagline: "Apna Time Aayega." },
  { id: "rrr", title: "RRR", year: 2022, genre: "Epic Period Action Drama", genres: ["Action", "Drama"], basePrice: 2, imdbRating: 8.0, boxOffice: 1387, director: "S.S. Rajamouli", tagline: "Rise, Roar, Revolt." },
  { id: "lagaan", title: "Lagaan", year: 2001, genre: "Period Sports Drama", genres: ["Drama", "Sport"], basePrice: 2, imdbRating: 8.1, boxOffice: 65, director: "Ashutosh Gowariker", tagline: "Once upon a time in India." },
  { id: "3-idiots", title: "3 Idiots", year: 2009, genre: "Coming-of-Age Comedy Drama", genres: ["Comedy", "Drama"], basePrice: 2, imdbRating: 8.4, boxOffice: 460, director: "Rajkumar Hirani", tagline: "All Izz Well." },
  { id: "queen", title: "Queen", year: 2013, genre: "Comedy Drama", genres: ["Adventure", "Comedy", "Drama"], basePrice: 1.5, imdbRating: 8.1, boxOffice: 222, director: "Vikas Bahl", tagline: "A girl goes on her honeymoon alone." },
  { id: "tumbbad", title: "Tumbbad", year: 2018, genre: "Folk Horror", genres: ["Drama", "Fantasy", "Horror"], basePrice: 1.5, imdbRating: 8.2, boxOffice: 32, director: "Rahi Anil Barve", tagline: "Greed has no limits." },
  { id: "swades", title: "Swades", year: 2004, genre: "Social Drama", genres: ["Drama"], basePrice: 2, imdbRating: 8.2, boxOffice: 34, director: "Ashutosh Gowariker", tagline: "We, the people." },
  { id: "sholay", title: "Sholay", year: 1975, genre: "Action Adventure Masala", genres: ["Action", "Adventure", "Comedy"], basePrice: 2, imdbRating: 8.1, boxOffice: 150, director: "Ramesh Sippy", tagline: "The greatest star cast ever assembled." },
  { id: "interstellar", title: "Interstellar", year: 2014, genre: "Sci-Fi Epic", genres: ["Adventure", "Drama", "Sci-Fi"], basePrice: 2, imdbRating: 8.7, boxOffice: 5800, director: "Christopher Nolan", tagline: "Mankind was born on Earth. It was never meant to die here." },
  { id: "the-dark-knight", title: "The Dark Knight", year: 2008, genre: "Superhero Action Thriller", genres: ["Action", "Crime", "Drama"], basePrice: 2, imdbRating: 9.0, boxOffice: 8200, director: "Christopher Nolan", tagline: "Why so serious?" },
  { id: "inception", title: "Inception", year: 2010, genre: "Sci-Fi Action Heist", genres: ["Action", "Adventure", "Sci-Fi"], basePrice: 2, imdbRating: 8.8, boxOffice: 6800, director: "Christopher Nolan", tagline: "Your mind is the scene of the crime." },
  { id: "oppenheimer", title: "Oppenheimer", year: 2023, genre: "Biographical Historical Drama", genres: ["Biography", "Drama", "History"], basePrice: 2, imdbRating: 8.9, boxOffice: 7900, director: "Christopher Nolan", tagline: "The world forever changes." },
];

export interface AiEvaluationResponse {
  winnerId: string;
  rankings: Array<{
    playerId: string;
    score: number;
    rank: number;
    critique: string;
    breakdown: {
      criticalAcclaim: number; // For Cricket: Batting Firepower (Max 35)
      boxOfficeRoi: number; // For Cricket: Bowling Lethality (Max 35)
      genreSynergy: number; // For Cricket: Tactical XI Balance (Max 20)
      budgetEfficiency: number; // For Cricket: Purse Mgmt (Max 10)
    };
  }>;
}

export interface EvaluationPayload {
  auctionType: "CINEMA" | "CRICKET";
  players: Array<{
    id: string;
    name: string;
    avatar: string;
    color?: string | undefined;
    isHost?: boolean | undefined;
    remainingBudget: number;
    initialBudget: number;
    allWonCount: number;
    topMovies: Array<{
      id: string;
      title: string;
      year: number;
      genres: string[];
      imdbRating: number;
      boxOffice: number;
      director: string;
      purchasePrice: number;
      role?: string;
      country?: string;
      signatureSkill?: string;
    }>;
  }>;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const BACKUP_AI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o"];
const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro"];

/**
 * Evaluates all franchise Playing 11s / portfolios using multi-tiered AI with smart fallback.
 */
export async function evaluatePortfoliosWithAi(
  players: Player[],
  userSelectedTop5Map: Record<string, string[]> = {},
  auctionType: AuctionType = "CINEMA",
): Promise<PlayerScore[]> {
  const isCricket =
    auctionType === "CRICKET" ||
    players.some((p) => p.movies.some((m) => m.auctionType === "CRICKET" || m.role));

  const payload: EvaluationPayload = {
    auctionType: isCricket ? "CRICKET" : "CINEMA",
    players: players.map((p) => {
      const selectedIds = userSelectedTop5Map[p.id];
      const targetMovies = selectedIds?.length
        ? p.movies.filter((m) => selectedIds.includes(m.id))
        : isCricket
          ? p.movies.slice(0, 11)
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
          director: m.director || (isCricket ? m.country || "International" : "Director"),
          purchasePrice: m.purchasePrice || m.basePrice,
          role: m.role || m.genre,
          country: m.country || m.director,
          signatureSkill: m.signatureSkill,
        })),
      };
    }),
  };

  const systemPrompt = isCricket
    ? `You are the Chairman of the IPL Mega Auction & Championship Committee.
Your task is to evaluate the submitted Playing 11 for each franchise and decide the championship winner and exact leaderboard rankings (1 to ${players.length}).
DO NOT mention real IPL franchise team names (CSK, MI, RCB, KKR). The users/bots themselves are the franchises.

IPL Rules Enforced in Playing 11:
- Squad size: 12-18 players
- Foreign/Overseas players allowed in Playing 11: Maximum 4 (0 to 4).
- Categories: Batsmen (Openers, Anchors, Finishers, Wicketkeeper-Batsmen), Bowlers (Fast Bowlers, Swing, Spin Wizards), All-Rounders.

Evaluate each franchise's submitted Playing 11 across 4 pillars (Total 100 points):
1. Batting Firepower & Depth (Max 35 pts): Top-order intent, middle-order stability, death-overs finishing, 140+ strike rates.
2. Bowling Lethality & Variety (Max 35 pts): 145+ km/h express pace, swing upfront, mystery spin, death-overs yorkers, economy.
3. Playing 11 Balance & Overseas Synergy (Max 20 pts): Wicketkeeper presence, minimum 4 solid bowling options, max 4 overseas balance.
4. Purse Management & Capital Efficiency (Max 10 pts): Preserved purse vs team firepower without overpaying.

Return strictly valid JSON:
{
  "winnerId": "player_id_of_1st_place",
  "rankings": [
    {
      "playerId": "p1",
      "score": 96.2,
      "rank": 1,
      "critique": "Unstoppable championship XI anchored by devastating power hitting and an airtight death bowling attack.",
      "breakdown": {
        "criticalAcclaim": 34.5,
        "boxOfficeRoi": 34.0,
        "genreSynergy": 18.7,
        "budgetEfficiency": 9.0
      }
    }
  ]
}`
    : `You are the Grand Jury President of Cinebid International Film Festival and a veteran studio chief.
Your job is to evaluate movie auction portfolios built by competing producers.

For each player, evaluate their Top 5 movie slate across 4 quantifiable pillars:
1. Critical Acclaim (Max 40 pts): Based on IMDb rating and directorial craft.
2. Box Office ROI (Max 30 pts): Combined box office earnings vs total crore spent in auction.
3. Genre Synergy & Diversity (Max 20 pts): Thematic balance (Action, Drama, Thriller, Comedy, Sci-Fi, Romance).
4. Capital Efficiency (Max 10 pts): Bonus for smart unspent capital retained without overbidding.

Return strictly valid JSON:
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

  const userPrompt = `Here is the slate of ${isCricket ? "cricket franchise Playing 11 lineups" : "movie portfolios"} in the auction room:\n${JSON.stringify(payload, null, 2)}\n\nAnalyze every franchise, calculate scores (0-100), assign ranks 1 to ${players.length}, and write personalized critiques. Return strictly valid JSON.`;

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
            return formatAiResultsToPlayerScores(players, parsed, isCricket, userSelectedTop5Map);
          }
        }
      } catch {
        // Try next
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
            return formatAiResultsToPlayerScores(players, parsed, isCricket, userSelectedTop5Map);
          }
        }
      } catch {
        // Try next
      }
    }
  }

  // TIER 3: GEMINI
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
            return formatAiResultsToPlayerScores(players, parsed, isCricket, userSelectedTop5Map);
          }
        }
      } catch {
        // Try next
      }
    }
  }

  // TIER 4: ALGORITHMIC CRICKET / CINEMA ENGINE
  return fallbackAlgorithmicEvaluation(players, userSelectedTop5Map, isCricket);
}

function formatAiResultsToPlayerScores(
  players: Player[],
  aiResponse: AiEvaluationResponse,
  isCricket = false,
  userSelectedTop5Map: Record<string, string[]> = {},
): PlayerScore[] {
  const scoreMap = new Map<string, AiEvaluationResponse["rankings"][0]>();
  if (Array.isArray(aiResponse.rankings)) {
    for (const r of aiResponse.rankings) {
      if (r?.playerId) scoreMap.set(r.playerId, r);
    }
  }

  const results: PlayerScore[] = players.map((player) => {
    const selectedIds = userSelectedTop5Map[player.id];
    const targetItems = selectedIds?.length
      ? player.movies.filter((m) => selectedIds.includes(m.id))
      : isCricket
        ? player.movies.slice(0, 11)
        : player.movies.slice(0, 5);

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
        critique:
          aiItem.critique ||
          (isCricket
            ? "Formidable franchise Playing 11 built with elite tactical discipline."
            : "A masterfully curated studio portfolio evaluated by the Grand Jury."),
        breakdown: aiItem.breakdown,
        fieldedItems: targetItems,
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
      critique: isCricket
        ? "Balanced cricket Playing 11 evaluated by Auction Committee."
        : "Competent studio slate evaluated by Grand Jury.",
      breakdown: isCricket
        ? { criticalAcclaim: 28, boxOfficeRoi: 26, genreSynergy: 14, budgetEfficiency: 7 }
        : { criticalAcclaim: 30, boxOfficeRoi: 20, genreSynergy: 15, budgetEfficiency: 10 },
      fieldedItems: targetItems,
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
  isCricket = false,
): PlayerScore[] {
  const scores: PlayerScore[] = players.map((player) => {
    const selectedIds = userSelectedTop5Map[player.id];
    const targetItems = selectedIds?.length
      ? player.movies.filter((m) => selectedIds.includes(m.id))
      : isCricket
        ? player.movies.slice(0, 11)
        : player.movies.slice(0, 5);

    const count = targetItems.length;
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
        critique: isCricket
          ? "No players acquired in the auction. Franchise held entire budget in reserve."
          : "No movies secured in the auction. Held reserve capital.",
        breakdown: { criticalAcclaim: 0, boxOfficeRoi: 0, genreSynergy: 0, budgetEfficiency: 10 },
        fieldedItems: [],
      };
    }

    if (isCricket) {
      // 1. Batting Firepower (Max 35)
      const avgImpact = targetItems.reduce((acc, m) => acc + (m.imdbRating || 9.0), 0) / count;
      const countMultiplier = count >= 11 ? 1.0 : count / 11;
      const battingScore = Math.min(35, (avgImpact / 10) * 35 * countMultiplier);

      // 2. Bowling Lethality (Max 35)
      const bowlers = targetItems.filter(
        (m) =>
          m.role === "FAST_BOWLER" ||
          m.role === "SPIN_BOWLER" ||
          m.category === "FAST_BOWLERS" ||
          m.category === "SPINNERS" ||
          m.genre?.includes("Bowler"),
      );
      const allRounders = targetItems.filter(
        (m) => m.role === "ALL_ROUNDER" || m.category === "ALL_ROUNDERS" || m.genre?.includes("All-Rounder"),
      );
      const totalBowlingOptions = bowlers.length + allRounders.length;
      const bowlingScore = Math.min(
        35,
        (bowlers.length >= 3 ? 24 : bowlers.length * 7) +
          Math.min(6, allRounders.length * 3) +
          (count >= 11 ? 5 : 2),
      );

      // 3. Tactical Balance & Overseas Quota (Max 20)
      const keepers = targetItems.filter(
        (m) => m.role === "WICKETKEEPER" || m.category === "WICKETKEEPERS" || m.genre?.includes("Keeper"),
      );
      const overseasCount = targetItems.filter((m) => isOverseasPlayer(m)).length;
      const isOverseasValid = overseasCount <= 4;

      let balanceScore = 0;
      if (keepers.length >= 1) balanceScore += 8;
      if (totalBowlingOptions >= 4) balanceScore += 6;
      if (isOverseasValid && overseasCount > 0) balanceScore += 4;
      if (count >= 11) balanceScore += 2;
      balanceScore = Math.min(20, balanceScore);

      // 4. Purse Management (Max 10)
      const budgetScore = Math.min(10, (player.budget / player.initialBudget) * 10);

      const totalScore =
        Math.round((battingScore + bowlingScore + balanceScore + budgetScore) * 10) / 10;
      const starPlayer = targetItems[0]?.title || "Fielded Championship XI";

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
        critique: `A championship-caliber Playing 11 spearheaded by ${starPlayer}. Formidable ${totalBowlingOptions}-bowler arsenal, ${keepers.length ? "specialist gloveman" : "wicketkeeper"}, and ₹${player.budget} Cr purse preserved.`,
        breakdown: {
          criticalAcclaim: Math.round(battingScore * 10) / 10,
          boxOfficeRoi: Math.round(bowlingScore * 10) / 10,
          genreSynergy: Math.round(balanceScore * 10) / 10,
          budgetEfficiency: Math.round(budgetScore * 10) / 10,
        },
        fieldedItems: targetItems,
      };
    }

    // Cinema Evaluation
    const avgImdb = targetItems.reduce((acc, m) => acc + (m.imdbRating || 8.0), 0) / count;
    const criticalAcclaim = Math.min(40, (avgImdb / 10) * 40 * (count >= 5 ? 1.0 : count / 5));

    const totalBoxOffice = targetItems.reduce((acc, m) => acc + (m.boxOffice || 400), 0);
    const totalSpent = targetItems.reduce((acc, m) => acc + m.purchasePrice, 0) || 1;
    const roi = totalBoxOffice / totalSpent;
    const boxOfficeScore = Math.min(18, (totalBoxOffice / 4000) * 18);
    const roiScore = Math.min(12, (roi / 40) * 12);
    const boxOfficeRoi = boxOfficeScore + roiScore;

    const allGenres = new Set<string>();
    targetItems.forEach((m) => (m.genres || [m.genre]).forEach((g) => allGenres.add(g)));
    const genreSynergy = Math.min(20, (allGenres.size / 5) * 20);

    const budgetEfficiency = Math.min(10, (player.budget / player.initialBudget) * 10);
    const totalScore =
      Math.round((criticalAcclaim + boxOfficeRoi + genreSynergy + budgetEfficiency) * 10) / 10;

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
      critique: `Masterful curation featuring ${targetItems[0]?.title || "blockbuster hits"}. Strong theatrical presence with ₹${player.budget} Cr capital retained.`,
      breakdown: {
        criticalAcclaim: Math.round(criticalAcclaim * 10) / 10,
        boxOfficeRoi: Math.round(boxOfficeRoi * 10) / 10,
        genreSynergy: Math.round(genreSynergy * 10) / 10,
        budgetEfficiency: Math.round(budgetEfficiency * 10) / 10,
      },
      fieldedItems: targetItems,
    };
  });

  scores.sort((a, b) => b.score - a.score || b.remainingBudget - a.remainingBudget);
  scores.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return scores;
}

export async function generateAiMovieSlate(
  count: number,
  theme?: string,
): Promise<{ movies: Movie[]; modelUsed: string }> {
  const shuffled = [...DEFAULT_MOVIES].sort(() => 0.5 - Math.random());
  return {
    movies: shuffled.slice(0, count).map((m) => ({ ...m, auctionType: "CINEMA" })),
    modelUsed: "Curated Cinebid Vault",
  };
}
