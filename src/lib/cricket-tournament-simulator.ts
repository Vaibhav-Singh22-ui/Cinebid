import type { OwnedMovie, Player, SubmittedSlate } from "./game-data";
import { getOptimalPlaying11 } from "./cricket-data";

export interface TeamLineup {
  teamId: string;
  teamName: string;
  avatar: string;
  color?: string | undefined;
  isHost?: boolean | undefined;
  captainId?: string | undefined;
  viceCaptainId?: string | undefined;
  playing11: OwnedMovie[];
}

export interface InningsScore {
  teamId: string;
  teamName: string;
  runs: number;
  wickets: number;
  overs: number; // e.g. 20.0 or 19.4
  topBatter: {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
  };
  topBowler: {
    name: string;
    wickets: number;
    runs: number;
    overs: number;
  };
}

export interface MatchFixture {
  id: string;
  matchNumber: number;
  stage: "LEAGUE" | "QUALIFIER_1" | "ELIMINATOR" | "QUALIFIER_2" | "FINAL";
  stageName: string; // e.g. "Match 1", "Qualifier 1", "Grand Final"
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team2Name: string;
  isPlayed: boolean;
  innings1?: InningsScore | undefined;
  innings2?: InningsScore | undefined;
  winnerId?: string | undefined;
  winnerName?: string | undefined;
  winMargin?: string | undefined; // e.g. "won by 14 runs" or "won by 6 wickets (4 balls remaining)"
  playerOfTheMatch?: {
    name: string;
    teamName: string;
    performance: string;
  } | undefined;
  commentaryHighlight?: string | undefined;
}

export interface PointsTableEntry {
  teamId: string;
  teamName: string;
  avatar: string;
  color?: string | undefined;
  played: number;
  won: number;
  lost: number;
  points: number;
  nrr: number; // Net Run Rate
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
}

export interface TournamentState {
  roomCode: string;
  format: "IPL_4_PLUS" | "TRIANGULAR" | "BEST_OF_3";
  teams: TeamLineup[];
  fixtures: MatchFixture[];
  pointsTable: PointsTableEntry[];
  currentMatchIndex: number;
  isCompleted: boolean;
  championTeamId?: string | undefined;
  championTeamName?: string | undefined;
  orangeCap?: {
    playerName: string;
    teamName: string;
    runs: number;
  } | undefined;
  purpleCap?: {
    playerName: string;
    teamName: string;
    wickets: number;
  } | undefined;
  tournamentSummary?: string | undefined;
}

const GROQ_API_KEY = import.meta.env["VITE_GROQ_API_KEY"] || "";
const OPENAI_API_KEY = import.meta.env["VITE_OPENAI_API_KEY"] || "";
const BACKUP_AI_KEY = import.meta.env["VITE_GEMINI_API_KEY"] || "";

/**
 * Initializes an IPL tournament schedule from submitted team lineups
 */
export function initializeIplTournament(
  roomCode: string,
  players: Player[],
  submittedSlates: Record<string, SubmittedSlate> = {},
): TournamentState {
  // 1. Build team lineups
  const teams: TeamLineup[] = players.map((player) => {
    const submission = submittedSlates[player.id];
    let playing11: OwnedMovie[] = [];

    if (submission?.movieIds?.length) {
      playing11 = player.movies.filter((m) => submission.movieIds.includes(m.id));
    }

    // Fallback to optimal playing 11 if incomplete
    if (playing11.length === 0) {
      const optimal = getOptimalPlaying11(player.movies);
      playing11 = player.movies.filter((m) => optimal.playing11.includes(m.id));
    }

    if (playing11.length === 0) {
      playing11 = player.movies.slice(0, 11);
    }

    return {
      teamId: player.id,
      teamName: player.name,
      avatar: player.avatar,
      color: player.color,
      isHost: player.isHost,
      captainId: submission?.captainId,
      viceCaptainId: submission?.viceCaptainId,
      playing11,
    };
  });

  // 2. Initialize Points Table
  const pointsTable: PointsTableEntry[] = teams.map((t) => ({
    teamId: t.teamId,
    teamName: t.teamName,
    avatar: t.avatar,
    color: t.color,
    played: 0,
    won: 0,
    lost: 0,
    points: 0,
    nrr: 0.0,
    runsScored: 0,
    oversFaced: 0,
    runsConceded: 0,
    oversBowled: 0,
  }));

  const fixtures: MatchFixture[] = [];
  const teamCount = teams.length;

  if (teamCount >= 4) {
    // Standard IPL Format: Round-robin league + 4 Playoff matches placeholder
    let matchCounter = 1;
    for (let i = 0; i < teamCount; i++) {
      for (let j = i + 1; j < teamCount; j++) {
        fixtures.push({
          id: `match-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "LEAGUE",
          stageName: `Match ${matchCounter}`,
          team1Id: teams[i]!.teamId,
          team2Id: teams[j]!.teamId,
          team1Name: teams[i]!.teamName,
          team2Name: teams[j]!.teamName,
          isPlayed: false,
        });
        matchCounter++;
      }
    }

    // Placeholders for IPL Playoffs (teams populated upon league completion)
    fixtures.push({
      id: "q1",
      matchNumber: matchCounter++,
      stage: "QUALIFIER_1",
      stageName: "Qualifier 1 (Rank 1 vs Rank 2)",
      team1Id: "",
      team2Id: "",
      team1Name: "1st Place",
      team2Name: "2nd Place",
      isPlayed: false,
    });

    fixtures.push({
      id: "elim",
      matchNumber: matchCounter++,
      stage: "ELIMINATOR",
      stageName: "Eliminator (Rank 3 vs Rank 4)",
      team1Id: "",
      team2Id: "",
      team1Name: "3rd Place",
      team2Name: "4th Place",
      isPlayed: false,
    });

    fixtures.push({
      id: "q2",
      matchNumber: matchCounter++,
      stage: "QUALIFIER_2",
      stageName: "Qualifier 2 (Loser Q1 vs Winner Elim)",
      team1Id: "",
      team2Id: "",
      team1Name: "Loser Q1",
      team2Name: "Winner Eliminator",
      isPlayed: false,
    });

    fixtures.push({
      id: "final",
      matchNumber: matchCounter++,
      stage: "FINAL",
      stageName: "🏆 GRAND FINAL (Winner Q1 vs Winner Q2)",
      team1Id: "",
      team2Id: "",
      team1Name: "Winner Q1",
      team2Name: "Winner Q2",
      isPlayed: false,
    });

    return {
      roomCode,
      format: "IPL_4_PLUS",
      teams,
      fixtures,
      pointsTable,
      currentMatchIndex: 0,
      isCompleted: false,
    };
  } else if (teamCount === 3) {
    // Triangular Series: Round-robin (3 matches) + Final
    let matchCounter = 1;
    for (let i = 0; i < teamCount; i++) {
      for (let j = i + 1; j < teamCount; j++) {
        fixtures.push({
          id: `match-${matchCounter}`,
          matchNumber: matchCounter,
          stage: "LEAGUE",
          stageName: `Match ${matchCounter}`,
          team1Id: teams[i]!.teamId,
          team2Id: teams[j]!.teamId,
          team1Name: teams[i]!.teamName,
          team2Name: teams[j]!.teamName,
          isPlayed: false,
        });
        matchCounter++;
      }
    }

    fixtures.push({
      id: "final",
      matchNumber: matchCounter++,
      stage: "FINAL",
      stageName: "🏆 GRAND FINAL (Rank 1 vs Rank 2)",
      team1Id: "",
      team2Id: "",
      team1Name: "1st Place",
      team2Name: "2nd Place",
      isPlayed: false,
    });

    return {
      roomCode,
      format: "TRIANGULAR",
      teams,
      fixtures,
      pointsTable,
      currentMatchIndex: 0,
      isCompleted: false,
    };
  } else {
    // 2 Teams: Best of 3 IPL Finals Showdown
    const t1 = teams[0]!;
    const t2 = teams[1] || teams[0]!;

    fixtures.push({
      id: "match-1",
      matchNumber: 1,
      stage: "FINAL",
      stageName: "Grand Final - Match 1",
      team1Id: t1.teamId,
      team2Id: t2.teamId,
      team1Name: t1.teamName,
      team2Name: t2.teamName,
      isPlayed: false,
    });

    fixtures.push({
      id: "match-2",
      matchNumber: 2,
      stage: "FINAL",
      stageName: "Grand Final - Match 2",
      team1Id: t2.teamId,
      team2Id: t1.teamId,
      team1Name: t2.teamName,
      team2Name: t1.teamName,
      isPlayed: false,
    });

    fixtures.push({
      id: "match-3",
      matchNumber: 3,
      stage: "FINAL",
      stageName: "🏆 Grand Final - Decider (If Needed)",
      team1Id: t1.teamId,
      team2Id: t2.teamId,
      team1Name: t1.teamName,
      team2Name: t2.teamName,
      isPlayed: false,
    });

    return {
      roomCode,
      format: "BEST_OF_3",
      teams,
      fixtures,
      pointsTable,
      currentMatchIndex: 0,
      isCompleted: false,
    };
  }
}

/**
 * Simulates a single cricket match between two franchises using multi-tier AI or intelligent fallback
 */
export async function simulateMatch(
  tournament: TournamentState,
  fixtureIndex: number,
): Promise<TournamentState> {
  const fixture = tournament.fixtures[fixtureIndex];
  if (!fixture || fixture.isPlayed) return tournament;

  const team1 = tournament.teams.find((t) => t.teamId === fixture.team1Id);
  const team2 = tournament.teams.find((t) => t.teamId === fixture.team2Id);

  if (!team1 || !team2) {
    return tournament;
  }

  // 1. Simulate match details via AI or fallback
  const result = await generateMatchSimulationWithAi(team1, team2, fixture.stageName);

  // 2. Update the fixture
  const updatedFixture: MatchFixture = {
    ...fixture,
    isPlayed: true,
    innings1: result.innings1,
    innings2: result.innings2,
    winnerId: result.winnerId,
    winnerName: result.winnerName,
    winMargin: result.winMargin,
    playerOfTheMatch: result.playerOfTheMatch,
    commentaryHighlight: result.commentaryHighlight,
  };

  const nextFixtures = [...tournament.fixtures];
  nextFixtures[fixtureIndex] = updatedFixture;

  // 3. Update Points Table if it was a League stage match
  let nextPointsTable = [...tournament.pointsTable];
  if (fixture.stage === "LEAGUE") {
    nextPointsTable = updatePointsTable(
      nextPointsTable,
      result.innings1,
      result.innings2,
      result.winnerId,
    );
  }

  // 4. Check if League Stage just finished -> Populate Playoff Fixtures
  const isLeagueComplete = nextFixtures
    .filter((f) => f.stage === "LEAGUE")
    .every((f) => f.isPlayed);

  if (isLeagueComplete && tournament.format === "IPL_4_PLUS") {
    // Sort standings by points desc, then NRR desc
    const sorted = [...nextPointsTable].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });

    const rank1 = sorted[0];
    const rank2 = sorted[1];
    const rank3 = sorted[2];
    const rank4 = sorted[3];

    // Populate Qualifier 1
    const q1Idx = nextFixtures.findIndex((f) => f.id === "q1");
    if (q1Idx !== -1 && rank1 && rank2) {
      nextFixtures[q1Idx] = {
        ...nextFixtures[q1Idx]!,
        team1Id: rank1.teamId,
        team1Name: rank1.teamName,
        team2Id: rank2.teamId,
        team2Name: rank2.teamName,
      };
    }

    // Populate Eliminator
    const elimIdx = nextFixtures.findIndex((f) => f.id === "elim");
    if (elimIdx !== -1 && rank3 && rank4) {
      nextFixtures[elimIdx] = {
        ...nextFixtures[elimIdx]!,
        team1Id: rank3.teamId,
        team1Name: rank3.teamName,
        team2Id: rank4.teamId,
        team2Name: rank4.teamName,
      };
    }
  }

  if (isLeagueComplete && tournament.format === "TRIANGULAR") {
    const sorted = [...nextPointsTable].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });
    const finalIdx = nextFixtures.findIndex((f) => f.id === "final");
    if (finalIdx !== -1 && sorted[0] && sorted[1]) {
      nextFixtures[finalIdx] = {
        ...nextFixtures[finalIdx]!,
        team1Id: sorted[0].teamId,
        team1Name: sorted[0].teamName,
        team2Id: sorted[1].teamId,
        team2Name: sorted[1].teamName,
      };
    }
  }

  // 5. Update Qualifier 2 and Final if Q1 or Eliminator just completed
  if (tournament.format === "IPL_4_PLUS") {
    const q1Fixture = nextFixtures.find((f) => f.id === "q1");
    const elimFixture = nextFixtures.find((f) => f.id === "elim");
    const q2Idx = nextFixtures.findIndex((f) => f.id === "q2");
    const finalIdx = nextFixtures.findIndex((f) => f.id === "final");

    if (q1Fixture?.isPlayed && elimFixture?.isPlayed && q2Idx !== -1) {
      const loserQ1Id =
        q1Fixture.winnerId === q1Fixture.team1Id
          ? q1Fixture.team2Id
          : q1Fixture.team1Id;
      const loserQ1Name =
        q1Fixture.winnerId === q1Fixture.team1Id
          ? q1Fixture.team2Name
          : q1Fixture.team1Name;

      const winnerElimId = elimFixture.winnerId || elimFixture.team1Id;
      const winnerElimName = elimFixture.winnerName || elimFixture.team1Name;

      nextFixtures[q2Idx] = {
        ...nextFixtures[q2Idx]!,
        team1Id: loserQ1Id,
        team1Name: loserQ1Name,
        team2Id: winnerElimId,
        team2Name: winnerElimName,
      };
    }

    const q2Fixture = nextFixtures.find((f) => f.id === "q2");
    if (q1Fixture?.isPlayed && q2Fixture?.isPlayed && finalIdx !== -1) {
      const winnerQ1Id = q1Fixture.winnerId || q1Fixture.team1Id;
      const winnerQ1Name = q1Fixture.winnerName || q1Fixture.team1Name;
      const winnerQ2Id = q2Fixture.winnerId || q2Fixture.team1Id;
      const winnerQ2Name = q2Fixture.winnerName || q2Fixture.team1Name;

      nextFixtures[finalIdx] = {
        ...nextFixtures[finalIdx]!,
        team1Id: winnerQ1Id,
        team1Name: winnerQ1Name,
        team2Id: winnerQ2Id,
        team2Name: winnerQ2Name,
      };
    }
  }

  // 6. Check if tournament is finished
  let isCompleted = false;
  let championTeamId: string | undefined;
  let championTeamName: string | undefined;

  if (tournament.format === "BEST_OF_3") {
    // Check if one team has won 2 matches
    const wins: Record<string, number> = {};
    for (const f of nextFixtures) {
      if (f.isPlayed && f.winnerId) {
        wins[f.winnerId] = (wins[f.winnerId] || 0) + 1;
      }
    }
    for (const [tId, count] of Object.entries(wins)) {
      if (count >= 2) {
        isCompleted = true;
        championTeamId = tId;
        championTeamName =
          tournament.teams.find((t) => t.teamId === tId)?.teamName || "Champion";
        break;
      }
    }
  } else {
    const finalFixture = nextFixtures.find((f) => f.stage === "FINAL");
    if (finalFixture?.isPlayed) {
      isCompleted = true;
      championTeamId = finalFixture.winnerId;
      championTeamName = finalFixture.winnerName;
    }
  }

  // 7. Calculate Orange Cap & Purple Cap leaders
  const { orangeCap, purpleCap } = calculateCaps(nextFixtures);

  return {
    ...tournament,
    fixtures: nextFixtures,
    pointsTable: nextPointsTable,
    currentMatchIndex: Math.min(nextFixtures.length - 1, fixtureIndex + 1),
    isCompleted,
    championTeamId,
    championTeamName,
    orangeCap,
    purpleCap,
  };
}

/**
 * Internal match generator using Groq -> OpenAI -> Gemini -> Deterministic fallbacks
 */
async function generateMatchSimulationWithAi(
  team1: TeamLineup,
  team2: TeamLineup,
  stageName: string,
): Promise<{
  innings1: InningsScore;
  innings2: InningsScore;
  winnerId: string;
  winnerName: string;
  winMargin: string;
  playerOfTheMatch: { name: string; teamName: string; performance: string };
  commentaryHighlight: string;
}> {
  const t1Players = team1.playing11.map((p) => `${p.title} (${p.role || "Player"})`).join(", ");
  const t2Players = team2.playing11.map((p) => `${p.title} (${p.role || "Player"})`).join(", ");

  const systemPrompt = `You are the official match simulation engine for the IPL Mega Auction Hub.
Simulate a realistic, exciting T20 cricket encounter between two franchise Playing 11 teams in ${stageName}.
Use ONLY the real player names provided in each franchise's Playing 11.
Realistic T20 Tally ranges: 155 to 220 runs.

Return strictly valid JSON with this exact schema:
{
  "winnerId": "${team1.teamId}" or "${team2.teamId}",
  "winnerName": "${team1.teamName}" or "${team2.teamName}",
  "winMargin": "won by 14 runs" or "won by 5 wickets (3 balls remaining)",
  "innings1": {
    "teamId": "${team1.teamId}",
    "teamName": "${team1.teamName}",
    "runs": 188,
    "wickets": 5,
    "overs": 20.0,
    "topBatter": { "name": "Player Name", "runs": 74, "balls": 44, "fours": 7, "sixes": 4 },
    "topBowler": { "name": "Opponent Bowler", "wickets": 3, "runs": 28, "overs": 4.0 }
  },
  "innings2": {
    "teamId": "${team2.teamId}",
    "teamName": "${team2.teamName}",
    "runs": 174,
    "wickets": 8,
    "overs": 20.0,
    "topBatter": { "name": "Player Name", "runs": 58, "balls": 36, "fours": 5, "sixes": 3 },
    "topBowler": { "name": "Opponent Bowler", "wickets": 2, "runs": 24, "overs": 4.0 }
  },
  "playerOfTheMatch": {
    "name": "Player Name",
    "teamName": "Team Name",
    "performance": "74 (44) & 1 catch"
  },
  "commentaryHighlight": "Dramatic 2-sentence summary of the thrilling death overs finish!"
}`;

  const userPrompt = `Matchup:
Franchise 1: ${team1.teamName} (Playing 11: ${t1Players})
Franchise 2: ${team2.teamName} (Playing 11: ${t2Players})
Stage: ${stageName}
Generate realistic scorecards and final over thriller drama. Return strictly valid JSON.`;

  // TIER 1: GROQ
  if (GROQ_API_KEY) {
    try {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.8,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      }
    } catch {
      // try next
    }
  }

  // TIER 2: OPENAI
  if (OPENAI_API_KEY) {
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.8,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      }
    } catch {
      // try next
    }
  }

  // TIER 3: GEMINI
  if (BACKUP_AI_KEY) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${BACKUP_AI_KEY}`,
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
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return JSON.parse(text);
        }
      }
    } catch {
      // fallback
    }
  }

  // TIER 4: Deterministic Fallback Engine
  return fallbackSimulateMatch(team1, team2);
}

/**
 * Intelligent deterministic fallback cricket match engine
 */
function fallbackSimulateMatch(
  team1: TeamLineup,
  team2: TeamLineup,
) {
  // Score generation (160 - 215)
  const base1 = 165 + Math.floor(Math.random() * 45);
  const diff = Math.floor(Math.random() * 20) - 10;
  let base2 = base1 + diff;
  if (base2 === base1) base2 += 2; // avoid ties

  const isTeam1Winner = base1 > base2;
  const winnerId = isTeam1Winner ? team1.teamId : team2.teamId;
  const winnerName = isTeam1Winner ? team1.teamName : team2.teamName;

  // Select top performers from actual Playing 11
  const t1Batters = team1.playing11.filter(
    (p) => p.role?.includes("Batsman") || p.role?.includes("Wicketkeeper") || p.role?.includes("All-Rounder"),
  );
  const t1Bowlers = team1.playing11.filter(
    (p) => p.role?.includes("Bowler") || p.role?.includes("All-Rounder"),
  );

  const t2Batters = team2.playing11.filter(
    (p) => p.role?.includes("Batsman") || p.role?.includes("Wicketkeeper") || p.role?.includes("All-Rounder"),
  );
  const t2Bowlers = team2.playing11.filter(
    (p) => p.role?.includes("Bowler") || p.role?.includes("All-Rounder"),
  );

  const t1StarBat = t1Batters[0] || team1.playing11[0] || { title: "Star Batsman" };
  const t1StarBowl = t1Bowlers[0] || team1.playing11[team1.playing11.length - 1] || { title: "Star Bowler" };

  const t2StarBat = t2Batters[0] || team2.playing11[0] || { title: "Star Batsman" };
  const t2StarBowl = t2Bowlers[0] || team2.playing11[team2.playing11.length - 1] || { title: "Star Bowler" };

  const inn1Runs = base1;
  const inn1Wickets = Math.min(9, 3 + Math.floor(Math.random() * 5));

  let inn2Runs = base2;
  let inn2Wickets = isTeam1Winner ? Math.min(9, 6 + Math.floor(Math.random() * 4)) : Math.min(6, 2 + Math.floor(Math.random() * 4));
  let inn2Overs = isTeam1Winner ? 20.0 : 19.3;

  const winMargin = isTeam1Winner
    ? `won by ${inn1Runs - inn2Runs} runs`
    : `won by ${10 - inn2Wickets} wickets (3 balls remaining)`;

  const potm = isTeam1Winner
    ? {
        name: t1StarBat.title,
        teamName: team1.teamName,
        performance: `${60 + Math.floor(Math.random() * 25)} (${35 + Math.floor(Math.random() * 15)})`,
      }
    : {
        name: t2StarBat.title,
        teamName: team2.teamName,
        performance: `${65 + Math.floor(Math.random() * 30)} (${38 + Math.floor(Math.random() * 12)})`,
      };

  return {
    winnerId,
    winnerName,
    winMargin,
    innings1: {
      teamId: team1.teamId,
      teamName: team1.teamName,
      runs: inn1Runs,
      wickets: inn1Wickets,
      overs: 20.0,
      topBatter: {
        name: t1StarBat.title,
        runs: 55 + Math.floor(Math.random() * 35),
        balls: 32 + Math.floor(Math.random() * 18),
        fours: 5 + Math.floor(Math.random() * 4),
        sixes: 3 + Math.floor(Math.random() * 3),
      },
      topBowler: {
        name: t2StarBowl.title,
        wickets: 2 + Math.floor(Math.random() * 2),
        runs: 25 + Math.floor(Math.random() * 15),
        overs: 4.0,
      },
    },
    innings2: {
      teamId: team2.teamId,
      teamName: team2.teamName,
      runs: inn2Runs,
      wickets: inn2Wickets,
      overs: inn2Overs,
      topBatter: {
        name: t2StarBat.title,
        runs: 48 + Math.floor(Math.random() * 38),
        balls: 30 + Math.floor(Math.random() * 15),
        fours: 4 + Math.floor(Math.random() * 4),
        sixes: 2 + Math.floor(Math.random() * 4),
      },
      topBowler: {
        name: t1StarBowl.title,
        wickets: 2 + Math.floor(Math.random() * 3),
        runs: 22 + Math.floor(Math.random() * 16),
        overs: 4.0,
      },
    },
    playerOfTheMatch: potm,
    commentaryHighlight: isTeam1Winner
      ? `${t1StarBowl.title} defended 12 off the 20th over with back-to-back yorkers to seal an emphatic victory!`
      : `${t2StarBat.title} struck a towering six over deep midwicket in the final over to complete a breathtaking chase!`,
  };
}

/**
 * Updates points table after a league match
 */
function updatePointsTable(
  table: PointsTableEntry[],
  inn1: InningsScore,
  inn2: InningsScore,
  winnerId: string,
): PointsTableEntry[] {
  return table.map((row) => {
    if (row.teamId === inn1.teamId) {
      const isWin = winnerId === inn1.teamId;
      const runsScored = row.runsScored + inn1.runs;
      const oversFaced = row.oversFaced + inn1.overs;
      const runsConceded = row.runsConceded + inn2.runs;
      const oversBowled = row.oversBowled + inn2.overs;
      const nrr = Number(
        (runsScored / Math.max(1, oversFaced) - runsConceded / Math.max(1, oversBowled)).toFixed(3),
      );

      return {
        ...row,
        played: row.played + 1,
        won: row.won + (isWin ? 1 : 0),
        lost: row.lost + (isWin ? 0 : 1),
        points: row.points + (isWin ? 2 : 0),
        runsScored,
        oversFaced,
        runsConceded,
        oversBowled,
        nrr,
      };
    }

    if (row.teamId === inn2.teamId) {
      const isWin = winnerId === inn2.teamId;
      const runsScored = row.runsScored + inn2.runs;
      const oversFaced = row.oversFaced + inn2.overs;
      const runsConceded = row.runsConceded + inn1.runs;
      const oversBowled = row.oversBowled + inn1.overs;
      const nrr = Number(
        (runsScored / Math.max(1, oversFaced) - runsConceded / Math.max(1, oversBowled)).toFixed(3),
      );

      return {
        ...row,
        played: row.played + 1,
        won: row.won + (isWin ? 1 : 0),
        lost: row.lost + (isWin ? 0 : 1),
        points: row.points + (isWin ? 2 : 0),
        runsScored,
        oversFaced,
        runsConceded,
        oversBowled,
        nrr,
      };
    }

    return row;
  });
}

/**
 * Tabulates tournament Orange Cap (Runs) & Purple Cap (Wickets)
 */
function calculateCaps(fixtures: MatchFixture[]): {
  orangeCap?: { playerName: string; teamName: string; runs: number } | undefined;
  purpleCap?: { playerName: string; teamName: string; wickets: number } | undefined;
} {
  const batTotals: Record<string, { teamName: string; runs: number }> = {};
  const bowlTotals: Record<string, { teamName: string; wickets: number }> = {};

  for (const f of fixtures) {
    if (!f.isPlayed) continue;
    if (f.innings1?.topBatter) {
      const b = f.innings1.topBatter;
      batTotals[b.name] = {
        teamName: f.innings1.teamName,
        runs: (batTotals[b.name]?.runs || 0) + b.runs,
      };
    }
    if (f.innings1?.topBowler) {
      const w = f.innings1.topBowler;
      bowlTotals[w.name] = {
        teamName: f.innings2?.teamName || "Opponent",
        wickets: (bowlTotals[w.name]?.wickets || 0) + w.wickets,
      };
    }
    if (f.innings2?.topBatter) {
      const b = f.innings2.topBatter;
      batTotals[b.name] = {
        teamName: f.innings2.teamName,
        runs: (batTotals[b.name]?.runs || 0) + b.runs,
      };
    }
    if (f.innings2?.topBowler) {
      const w = f.innings2.topBowler;
      bowlTotals[w.name] = {
        teamName: f.innings1 ? f.innings1.teamName : f.team1Name,
        wickets: (bowlTotals[w.name]?.wickets || 0) + w.wickets,
      };
    }
  }

  let topBatName = "";
  let maxRuns = 0;
  let topBatTeam = "";
  for (const [name, data] of Object.entries(batTotals)) {
    if (data.runs > maxRuns) {
      maxRuns = data.runs;
      topBatName = name;
      topBatTeam = data.teamName;
    }
  }

  let topBowlName = "";
  let maxWickets = 0;
  let topBowlTeam = "";
  for (const [name, data] of Object.entries(bowlTotals)) {
    if (data.wickets > maxWickets) {
      maxWickets = data.wickets;
      topBowlName = name;
      topBowlTeam = data.teamName;
    }
  }

  return {
    orangeCap: topBatName
      ? { playerName: topBatName, teamName: topBatTeam, runs: maxRuns }
      : undefined,
    purpleCap: topBowlName
      ? { playerName: topBowlName, teamName: topBowlTeam, wickets: maxWickets }
      : undefined,
  };
}
