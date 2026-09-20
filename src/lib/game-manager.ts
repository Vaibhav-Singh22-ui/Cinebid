import {
  DEFAULT_ROOM_SETTINGS,
  formatCr,
  getOptimalMovieSlate,
  getRandomizedMovieSlate,
  getRecommendedMoviePoolSize,
  movies,
  type AuctionType,
  type Movie,
  type OwnedMovie,
  type Player,
  type RoomSettings,
  type SubmittedSlate,
} from "./game-data";
import { isOverseasPlayer, getOptimalPlaying11 } from "./cricket-data";
import { supabase } from "@/integrations/supabase/client";
import { generateAiMovieSlate, evaluatePortfoliosWithAi } from "./ai-evaluation";
import {
  fetchRoomServerFn,
  saveRoomServerFn,
  joinRoomServerFn,
} from "./room-server-relay";

export { fetchRoomServerFn, saveRoomServerFn, joinRoomServerFn };

export interface ChatMsg {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface BidRecord {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  time: string;
}

export interface PlayerScore {
  playerId: string;
  name: string;
  avatar: string;
  color?: string | undefined;
  isHost?: boolean | undefined;
  score: number;
  rank: number;
  wonCount: number;
  remainingBudget: number;
  critique: string;
  breakdown: {
    criticalAcclaim: number;
    boxOfficeRoi: number;
    genreSynergy: number;
    budgetEfficiency: number;
  };
  fieldedItems?: OwnedMovie[];
  captainId?: string;
  viceCaptainId?: string;
}

export interface RoomState {
  roomCode: string;
  createdAt: number;
  settings: RoomSettings;
  hostId: string;
  hostName: string;
  status: "LOBBY" | "AUCTION" | "TOP_FIVE" | "EVALUATING" | "RESULTS";
  players: Player[];
  moviePool: Movie[];
  currentMovieIndex: number;
  currentBid: number;
  currentBidderId: string | null;
  currentBidderName: string | null;
  secondsRemaining: number;
  auctionEndTime?: number | undefined;
  isSold: boolean;
  bidHistory: BidRecord[];
  chatMessages: ChatMsg[];
  portfolioRankings?: PlayerScore[] | undefined;
  outPlayerIds: string[]; // List of player IDs who clicked OUT on current item
  auctionType?: AuctionType;
  submittedSlates?: Record<string, SubmittedSlate> | undefined;
  isPaused?: boolean | undefined;
  tournamentData?: any | undefined;
  version?: number | undefined; // Monotonic sequence clock to eliminate out-of-order state jitter
}

export function bumpRoomVersion(room: RoomState): number {
  const next = (room.version || 0) + 1;
  room.version = next;
  return next;
}

/**
 * Authoritative Packet Comparator:
 * Returns TRUE if incoming state is strictly newer than current local state.
 * Returns FALSE if incoming packet is stale, replayed, or identical (preventing glitches & re-render storms).
 */
export function isPacketNewer(current: RoomState | null, incoming: RoomState): boolean {
  if (!incoming) return false;
  if (!current) return true;

  // Rule 0: Roster expansion (new player joined room)
  if ((incoming.players?.length || 0) > (current.players?.length || 0)) {
    return true;
  }

  // Rule 1: Round index progression
  if (incoming.currentMovieIndex > current.currentMovieIndex) {
    return true;
  }
  if (incoming.currentMovieIndex < current.currentMovieIndex) {
    return false; // Discard older round index
  }

  // Rule 2: Same round index - monotonic sequence clock check
  const incomingVer = incoming.version || 0;
  const currentVer = current.version || 0;
  if (incomingVer > currentVer) {
    return true;
  }
  if (incomingVer < currentVer) {
    return false; // Discard older version
  }

  // Rule 3: Tie-breaker on same version
  if (incoming.isSold && !current.isSold) return true;
  if (incoming.currentBid > current.currentBid) return true;
  if ((incoming.outPlayerIds?.length || 0) > (current.outPlayerIds?.length || 0)) return true;

  return false;
}

export interface CurrentUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

const STORAGE_PREFIX = "cinebid_room_";
const SESSION_USER_KEY = "cinebid_session_user";
const SAVED_NAME_KEY = "cinebid_saved_username";
const ROOM_LIST_KEY = "cinebid_active_rooms";

// -------------------------------------------------------------
// 1. UNIQUE GROUP / ROOM CODE CREATION ALGORITHM
// -------------------------------------------------------------
const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateUniqueRoomCode(auctionType: AuctionType = "CINEMA"): string {
  const existingRooms = getExistingRoomCodes();
  const prefix = auctionType === "CRICKET" ? "IPL-" : "CINE-";
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;
    let randomPart = "";

    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(4);
      window.crypto.getRandomValues(bytes);
      for (let i = 0; i < 4; i++) {
        const byte = bytes[i] ?? 0;
        const index = byte % CHARSET.length;
        randomPart += CHARSET[index] || "A";
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const index = Math.floor(Math.random() * CHARSET.length);
        randomPart += CHARSET[index] || "A";
      }
    }

    const code = `${prefix}${randomPart}`;
    if (!existingRooms.includes(code)) {
      registerRoomCode(code);
      return code;
    }
  }

  const timestampPart = Date.now().toString(36).toUpperCase().slice(-4);
  const fallbackCode = `${prefix}${timestampPart}`;
  registerRoomCode(fallbackCode);
  return fallbackCode;
}

function getExistingRoomCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROOM_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function registerRoomCode(code: string) {
  if (typeof window === "undefined") return;
  try {
    const codes = getExistingRoomCodes();
    if (!codes.includes(code)) {
      codes.push(code);
      localStorage.setItem(ROOM_LIST_KEY, JSON.stringify(codes.slice(-50)));
    }
  } catch (e) {
    console.error("Failed to register room code", e);
  }
}

// -------------------------------------------------------------
// 2. USER PROFILE & IDENTITY (PER-TAB SESSION ISOLATION)
// -------------------------------------------------------------
export const AVATAR_COLORS = [
  "#f5c518", // gold
  "#e11d48", // rose
  "#2563eb", // blue
  "#16a34a", // green
  "#9333ea", // purple
  "#0891b2", // cyan
  "#ea580c", // orange
  "#ec4899", // pink
  "#10b981", // emerald
];

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "CB";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    const firstPart = parts[0] || "";
    return firstPart.slice(0, 2).toUpperCase();
  }
  const first = parts[0] || "";
  const last = parts[parts.length - 1] || "";
  const fChar = first[0] || "C";
  const lChar = last[0] || "B";
  return (fChar + lChar).toUpperCase();
}

/**
 * Gets the current user for the active tab/session.
 */
export function getCurrentUser(): CurrentUser {
  if (typeof window === "undefined") {
    return { id: "p1", name: "Franchise Owner", avatar: "FO", color: AVATAR_COLORS[0] || "#f5c518" };
  }

  try {
    const sessionStored = sessionStorage.getItem(SESSION_USER_KEY);
    if (sessionStored) {
      return JSON.parse(sessionStored);
    }
  } catch {
    // Fall through
  }

  let savedName = "";
  try {
    savedName = localStorage.getItem(SAVED_NAME_KEY) || "";
  } catch {
    // ignore
  }

  const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] || "#f5c518";
  const id = `user_${Math.random().toString(36).slice(2, 9)}`;
  const name = savedName || "Franchise Owner";
  const newUser: CurrentUser = {
    id,
    name,
    avatar: getInitials(name),
    color: randomColor,
  };

  try {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(newUser));
  } catch {
    // ignore
  }

  return newUser;
}

export function setCurrentUser(user: Partial<CurrentUser> & { name: string }): CurrentUser {
  const current = getCurrentUser();
  const name = user.name.trim() || current.name || "Franchise Owner";
  const avatar = getInitials(name);
  const color = user.color || current.color || AVATAR_COLORS[0] || "#f5c518";
  const id = user.id || current.id || `user_${Math.random().toString(36).slice(2, 9)}`;

  const updated: CurrentUser = {
    id,
    name,
    avatar,
    color,
  };

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updated));
      localStorage.setItem(SAVED_NAME_KEY, name);
    } catch {
      // ignore
    }
  }

  return updated;
}

// -------------------------------------------------------------
// 3. BOT PROFILES (NO TEAM NAMES!)
// -------------------------------------------------------------
export const BOT_PROFILES = [
  { name: "Apex Bidder", avatar: "AB", style: "Aggressive Marquee Hunter" },
  { name: "Tactical Titan", avatar: "TT", style: "Value & Stats Focused" },
  { name: "Crown Bidder", avatar: "CB", style: "High-Budget Anchor" },
  { name: "Thunder Strikers", avatar: "TS", style: "Pace & Power Focus" },
  { name: "Karan J.", avatar: "KJ", style: "Blockbusters & Star Power" },
  { name: "Zoya A.", avatar: "ZA", style: "Indie Gems & Strategic Depth" },
  { name: "Rohit S.", avatar: "RS", style: "High-Octane Action & Hype" },
  { name: "Anurag K.", avatar: "AK", style: "Gritty Value Seeker" },
];

// -------------------------------------------------------------
// 4. ACTIVE REALTIME CHANNELS REGISTRY
// -------------------------------------------------------------
const activeChannels = new Map<string, any>();

export function registerActiveChannel(roomCode: string, channel: any) {
  activeChannels.set(roomCode.toUpperCase(), channel);
}

export function unregisterActiveChannel(roomCode: string) {
  activeChannels.delete(roomCode.toUpperCase());
}

// -------------------------------------------------------------
// 5. ROOM CREATION & MULTIPLAYER MANAGEMENT
// -------------------------------------------------------------
export function createRoom(
  hostName: string,
  settings: Partial<RoomSettings> = {},
): RoomState {
  const auctionType: AuctionType = settings.auctionType || "CINEMA";
  const code = generateUniqueRoomCode(auctionType);
  const roomSettings: RoomSettings = {
    ...DEFAULT_ROOM_SETTINGS,
    auctionType,
    totalMovies: 15,
    ...settings,
  };

  const user = setCurrentUser({ name: hostName });

  const hostPlayer: Player = {
    id: user.id,
    name: user.name,
    budget: roomSettings.startingBudget,
    initialBudget: roomSettings.startingBudget,
    movies: [],
    isHost: true,
    isBot: false,
    avatar: user.avatar,
    color: user.color,
    ready: true,
  };

  // Randomized item pool scaled for player count and auction type (IPL squad requires 12-18 players)
  const poolSize = getRecommendedMoviePoolSize(roomSettings.maxPlayers || 4, auctionType);
  const moviePool = getRandomizedMovieSlate(
    Math.max(15, poolSize),
    roomSettings.category || "ALL",
    auctionType,
  );
  const firstMovie = moviePool[0];

  const newRoom: RoomState = {
    roomCode: code,
    createdAt: Date.now(),
    settings: {
      ...roomSettings,
      totalMovies: moviePool.length,
    },
    hostId: hostPlayer.id,
    hostName: hostPlayer.name,
    status: "LOBBY",
    players: [hostPlayer],
    moviePool,
    currentMovieIndex: 0,
    currentBid: firstMovie ? firstMovie.basePrice : 1,
    currentBidderId: null,
    currentBidderName: null,
    secondsRemaining: roomSettings.auctionSeconds,
    auctionEndTime: undefined,
    isSold: false,
    bidHistory: [],
    chatMessages: [],
    outPlayerIds: [],
    auctionType,
    version: 1,
  };

  saveRoom(newRoom, false, true);
  return newRoom;
}

export async function generateAndSetAiMoviePool(
  roomCode: string,
  theme?: string,
): Promise<{ success: boolean; modelUsed?: string; count?: number }> {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) return { success: false };

  try {
    const { movies: aiMovies, modelUsed } = await generateAiMovieSlate(
      room.settings.totalMovies || 8,
      theme,
    );

    if (aiMovies && aiMovies.length > 0 && aiMovies[0]) {
      room.moviePool = aiMovies;
      room.currentMovieIndex = 0;
      room.currentBid = aiMovies[0].basePrice;
      room.currentBidderId = null;
      room.currentBidderName = null;
      room.isSold = false;
      room.outPlayerIds = [];
      room.secondsRemaining = room.settings.auctionSeconds;

      saveRoom(room);
      void broadcastRoomState(room, "room_state");
      return { success: true, modelUsed, count: aiMovies.length };
    }
  } catch (e) {
    console.error("Failed to generate AI movie pool", e);
  }

  return { success: false };
}

export function addBotToRoom(roomCode: string): RoomState | null {
  const room = getRoom(roomCode);
  if (!room) return null;
  if (room.players.length >= room.settings.maxPlayers) return room;

  const existingBotNames = new Set(room.players.filter((p) => p.isBot).map((p) => p.name));
  const availableBots = BOT_PROFILES.filter((b) => !existingBotNames.has(b.name));
  if (availableBots.length === 0) return room;

  const chosenBot = availableBots[Math.floor(Math.random() * availableBots.length)];
  if (!chosenBot) return room;
  const botIndex = room.players.length;

  const botPlayer: Player = {
    id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: chosenBot.name,
    budget: room.settings.startingBudget,
    initialBudget: room.settings.startingBudget,
    movies: [],
    isHost: false,
    isBot: true,
    avatar: chosenBot.avatar,
    color: AVATAR_COLORS[(botIndex + 1) % AVATAR_COLORS.length] || "#2563eb",
    ready: true,
  };

  room.players.push(botPlayer);
  saveRoom(room);
  return room;
}

export function removeBotFromRoom(roomCode: string, botId: string): RoomState | null {
  const room = getRoom(roomCode);
  if (!room) return null;

  const botIndex = room.players.findIndex((p) => p.id === botId && p.isBot);
  if (botIndex >= 0) {
    room.players.splice(botIndex, 1);
    saveRoom(room);
  }
  return room;
}

// -------------------------------------------------------------
// 6. REALTIME MULTIPLAYER SYNC (SUPABASE BROADCAST + DB)
// -------------------------------------------------------------
const broadcastChannel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("cinebid_multiplayer_hub")
    : null;

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.roomCode) {
      window.dispatchEvent(
        new CustomEvent("cinebid_room_update", {
          detail: { roomCode: event.data.roomCode, room: event.data.room },
        }),
      );
    }
  };
}

// Debounced sync to prevent Supabase flood during high-frequency bidding/typing
let syncSupabaseTimer: number | null = null;
let pendingRoomToSync: RoomState | null = null;

export function queueSupabaseSync(room: RoomState, immediate = false): void {
  pendingRoomToSync = room;
  if (syncSupabaseTimer) {
    window.clearTimeout(syncSupabaseTimer);
    syncSupabaseTimer = null;
  }
  if (immediate) {
    if (pendingRoomToSync) {
      void syncRoomToSupabase(pendingRoomToSync);
      pendingRoomToSync = null;
    }
  } else {
    syncSupabaseTimer = window.setTimeout(() => {
      if (pendingRoomToSync) {
        void syncRoomToSupabase(pendingRoomToSync);
        pendingRoomToSync = null;
      }
    }, 450);
  }
}

export async function syncRoomToServerRelay(room: RoomState): Promise<void> {
  if (typeof window === "undefined" || !room?.roomCode) return;
  try {
    const code = room.roomCode.toUpperCase();
    try {
      await saveRoomServerFn({ data: room });
      return;
    } catch {
      // Fallback to direct HTTP endpoint
      await fetch(`/api/rooms/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room }),
      });
    }
  } catch {
    // Non-blocking
  }
}

export function saveRoom(
  room: RoomState,
  skipSupabase = false,
  immediateSync = false,
  isRemoteUpdate = false,
  skipBroadcast = false,
): void {
  if (typeof window === "undefined" || !room?.roomCode) return;
  try {
    const key = `${STORAGE_PREFIX}${room.roomCode.toUpperCase()}`;
    const rawLocal = localStorage.getItem(key);

    if (rawLocal && isRemoteUpdate) {
      try {
        const local = JSON.parse(rawLocal) as RoomState;
        if (!isPacketNewer(local, room)) {
          return;
        }
      } catch {
        // Continue if parse error
      }
    }

    localStorage.setItem(key, JSON.stringify(room));

    window.dispatchEvent(
      new CustomEvent("cinebid_room_update", {
        detail: { roomCode: room.roomCode.toUpperCase(), room },
      }),
    );

    // Only broadcast locally across tabs if this mutation originated locally (prevents multi-tab ping-pong)
    if (broadcastChannel && !isRemoteUpdate) {
      broadcastChannel.postMessage({ roomCode: room.roomCode.toUpperCase(), room });
    }

    // Sync to in-app server room relay for seamless cross-device multiplayer
    if (!isRemoteUpdate) {
      void syncRoomToServerRelay(room);
    }

    if (!skipSupabase && !isRemoteUpdate) {
      queueSupabaseSync(room, immediateSync);
      if (!skipBroadcast) {
        void broadcastRoomState(room, "room_state");
      }
    }
  } catch (e) {
    console.error("Failed to save room state", e);
  }
}

export async function broadcastRoomState(
  room: RoomState,
  eventName = "room_state",
  extraPayload?: Record<string, any>,
): Promise<void> {
  if (typeof window === "undefined" || !room?.roomCode) return;
  const code = room.roomCode.toUpperCase();
  const ch = activeChannels.get(code);

  if (ch) {
    try {
      await ch.send({
        type: "broadcast",
        event: eventName,
        payload: { room, roomCode: code, ...extraPayload },
      });
    } catch {
      // Ignore broadcast errors
    }
  }
}

export async function broadcastTimerTick(
  roomCode: string,
  secondsRemaining: number,
): Promise<void> {
  if (typeof window === "undefined" || !roomCode) return;
  const code = roomCode.toUpperCase();
  const ch = activeChannels.get(code);

  if (ch) {
    try {
      await ch.send({
        type: "broadcast",
        event: "timer_tick",
        payload: { roomCode: code, secondsRemaining },
      });
    } catch {
      // Ignore
    }
  }
}

export async function syncRoomToSupabase(room: RoomState): Promise<void> {
  try {
    const code = room.roomCode.toUpperCase();

    if (!room.settings) {
      room.settings = { ...DEFAULT_ROOM_SETTINGS };
    }

    // Deeply attach all crucial auction state properties to settings jsonb
    const richSettings: any = {
      ...room.settings,
      auctionType: room.auctionType || room.settings.auctionType || "CINEMA",
      submittedSlates: room.submittedSlates || room.settings.submittedSlates || {},
      portfolioRankings: room.portfolioRankings || room.settings.portfolioRankings,
      tournamentData: room.tournamentData,
      isPaused: Boolean(room.isPaused),
      outPlayerIds: room.outPlayerIds || [],
      bidHistory: (room.bidHistory || []).slice(0, 50),
      version: room.version || 1,
    };
    room.settings = richSettings;

    const currentUser = getCurrentUser();
    const isHost = room.hostId === currentUser.id;

    // 1. Authoritative Room Record Sync:
    // ONLY the host may upsert the canonical room record (movie_pool, status, host_id, full settings).
    // Non-hosts may only update active live auction telemetry (current_bid, current_bidder, seconds_remaining).
    if (isHost) {
      const { error: roomErr } = await supabase.from("rooms").upsert(
        {
          room_code: code,
          host_id: room.hostId,
          host_name: room.hostName,
          status: room.status,
          settings: richSettings,
          current_movie_index: room.currentMovieIndex,
          current_bid: room.currentBid,
          current_bidder_id: room.currentBidderId,
          current_bidder_name: room.currentBidderName,
          seconds_remaining: room.secondsRemaining,
          is_sold: room.isSold,
          movie_pool: room.moviePool as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "room_code" },
      );
      if (roomErr) {
        console.error("[Supabase Sync] Host Room upsert error:", roomErr);
      }
    } else {
      const { error: roomErr } = await supabase
        .from("rooms")
        .update({
          current_bid: room.currentBid,
          current_bidder_id: room.currentBidderId,
          current_bidder_name: room.currentBidderName,
          seconds_remaining: room.secondsRemaining,
          updated_at: new Date().toISOString(),
        })
        .eq("room_code", code);
      if (roomErr) {
        console.error("[Supabase Sync] Non-host Room update error:", roomErr);
      }
    }

    // 2. Isolated Player Sync:
    // Host syncs all players; non-hosts only sync their own player record to eliminate cross-player overwrites
    if (room.players?.length) {
      const playersToUpsert = isHost
        ? room.players
        : room.players.filter((p) => p.id === currentUser.id);

      if (playersToUpsert.length > 0) {
        const playerRows = playersToUpsert.map((p) => ({
          id: p.id,
          room_code: code,
          user_id: p.id,
          name: p.name,
          avatar: p.avatar || "CB",
          color: p.color || "#f5c518",
          budget: p.budget,
          initial_budget: p.initialBudget,
          is_host: p.isHost ?? false,
          is_bot: p.isBot ?? false,
          is_ready: p.ready ?? true,
          movies: (p.movies || []) as any,
        }));
        const { error: pErr } = await supabase
          .from("room_players")
          .upsert(playerRows, { onConflict: "id,room_code" });
        if (pErr) {
          console.error("[Supabase Sync] Players upsert error:", pErr);
        }
      }
    }

    // 3. Upsert rankings if available
    if (room.portfolioRankings?.length) {
      const rankingRows = room.portfolioRankings.map((s) => ({
        room_code: code,
        player_id: s.playerId,
        name: s.name,
        avatar: s.avatar,
        color: s.color || null,
        score: s.score,
        rank: s.rank,
        won_count: s.wonCount,
        remaining_budget: s.remainingBudget,
        critique: s.critique || "",
        breakdown: (s.breakdown || {}) as any,
      }));
      await supabase.from("room_rankings").delete().eq("room_code", code);
      const { error: rankErr } = await supabase.from("room_rankings").insert(rankingRows);
      if (rankErr) {
        console.error("[Supabase Sync] Rankings insert error:", rankErr);
      }
    }
  } catch (e) {
    console.warn("Supabase background sync warning:", e);
  }
}

export function getRoom(roomCode: string): RoomState | null {
  if (typeof window === "undefined" || !roomCode) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${roomCode.toUpperCase()}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.outPlayerIds) parsed.outPlayerIds = [];
      if (!parsed.auctionType) parsed.auctionType = parsed.settings?.auctionType || "CINEMA";
      if (Array.isArray(parsed.players)) {
        parsed.players.forEach((p: any) => {
          if (!p.movies) p.movies = [];
        });
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse room data", e);
  }
  return null;
}

export async function fetchRemoteRoom(roomCode: string): Promise<RoomState | null> {
  const code = roomCode.toUpperCase();
  try {
    // 1. In-App Server Relay (instant, authoritative, works across all devices and browsers)
    try {
      let serverRoom: RoomState | null = null;
      try {
        const rpcResult = (await fetchRoomServerFn({ data: code })) as RoomState | null;
        if (rpcResult && rpcResult.roomCode) {
          serverRoom = rpcResult;
        }
      } catch {
        // Fall back to HTTP endpoint
      }

      if (!serverRoom) {
        const resp = await fetch(`/api/rooms/${encodeURIComponent(code)}`);
        if (resp.ok) {
          const json = await resp.json();
          if (json.success && json.room) {
            serverRoom = json.room as RoomState;
          }
        }
      }

      if (serverRoom) {
        const local = getRoom(code);
        if (!local || isPacketNewer(local, serverRoom)) {
          saveRoom(serverRoom, true, false, true);
          return serverRoom;
        }
        return local;
      }
    } catch {
      // Server relay network failure, continue to fallbacks
    }

    // 2. Supabase Fallback (if configured and reachable)
    try {
      const { data: remoteRoom, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", code)
        .maybeSingle();

      if (!roomError && remoteRoom) {
        const { data: remotePlayers } = await supabase
          .from("room_players")
          .select("*")
          .eq("room_code", code)
          .order("joined_at", { ascending: true });

        const { data: remoteMessages } = await supabase
          .from("room_messages")
          .select("*")
          .eq("room_code", code)
          .order("created_at", { ascending: true })
          .limit(100);

        const { data: remoteBids } = await supabase
          .from("room_bids")
          .select("*")
          .eq("room_code", code)
          .order("created_at", { ascending: false })
          .limit(30);

        const mappedPlayers: Player[] = (remotePlayers || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          budget: Number(p.budget),
          initialBudget: Number(p.initial_budget),
          movies: p.movies || [],
          isHost: Boolean(p.is_host),
          isBot: Boolean(p.is_bot),
          avatar: p.avatar || "CB",
          color: p.color,
          ready: Boolean(p.is_ready),
        }));

        const mappedMessages: ChatMsg[] = (remoteMessages || []).map((m: any) => ({
          id: m.id,
          sender: m.player_name,
          avatar: getInitials(m.player_name),
          text: m.body,
          timestamp: new Date(m.created_at).getTime(),
          isSystem: m.player_name === "System" || m.player_name === "Auction Host",
        }));

        const mappedBids: BidRecord[] = (remoteBids || []).map((b: any) => ({
          id: b.id,
          playerId: b.player_id,
          playerName: b.player_name,
          amount: Number(b.amount),
          time: new Date(b.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        }));

        const local = getRoom(code);

        // Merge bid history
        const mergedBids = [...mappedBids];
        if (local?.bidHistory) {
          for (const b of local.bidHistory) {
            if (!mergedBids.some((mb) => mb.id === b.id || (mb.playerId === b.playerId && mb.amount === b.amount))) {
              mergedBids.push(b);
            }
          }
        }

        // Merge chat messages
        const chatMap = new Map<string, ChatMsg>();
        mappedMessages.forEach((m) => chatMap.set(m.id, m));
        if (local?.chatMessages) {
          local.chatMessages.forEach((m) => chatMap.set(m.id, m));
        }

        // Merge players list
        const playerMap = new Map<string, Player>();
        mappedPlayers.forEach((p) => playerMap.set(p.id, p));
        if (local?.players) {
          local.players.forEach((lp) => {
            const existing = playerMap.get(lp.id);
            if (!existing) {
              playerMap.set(lp.id, lp);
            } else {
              if ((lp.movies?.length || 0) >= (existing.movies?.length || 0)) {
                playerMap.set(lp.id, { ...existing, ...lp });
              }
            }
          });
        }
        const mergedPlayers = Array.from(playerMap.values());

        const remoteIndex = remoteRoom.current_movie_index;
        const settings = (remoteRoom.settings as unknown as RoomSettings) || DEFAULT_ROOM_SETTINGS;
        const auctionType: AuctionType =
          (settings as any)?.auctionType ||
          settings.auctionType ||
          local?.auctionType ||
          (code.startsWith("IPL") ? "CRICKET" : "CINEMA");
        const remoteVersion = Number((settings as any)?.version || remoteIndex * 100 + 1);

        if (local) {
          if (mergedPlayers.length > local.players.length) {
            local.players = mergedPlayers;
            saveRoom(local, true, false, true);
          }
          if (local.currentMovieIndex > remoteIndex) {
            return local;
          }
          if (local.currentMovieIndex === remoteIndex && (local.version || 0) >= remoteVersion) {
            return local;
          }
        }

        let finalBid = remoteRoom.current_bid;
        let finalBidderId = remoteRoom.current_bidder_id;
        let finalBidderName = remoteRoom.current_bidder_name;

        if (local && local.currentMovieIndex === remoteIndex && local.currentBid > remoteRoom.current_bid) {
          finalBid = local.currentBid;
          finalBidderId = local.currentBidderId;
          finalBidderName = local.currentBidderName;
        }

        const parsedRoom: RoomState = {
          roomCode: remoteRoom.room_code,
          createdAt: new Date(remoteRoom.created_at).getTime(),
          settings,
          hostId: remoteRoom.host_id,
          hostName: remoteRoom.host_name,
          status: remoteRoom.status as any,
          players: mergedPlayers.length ? mergedPlayers : local?.players || [],
          moviePool: (remoteRoom.movie_pool as unknown as Movie[]) || local?.moviePool || movies,
          currentMovieIndex: remoteIndex,
          currentBid: finalBid,
          currentBidderId: finalBidderId,
          currentBidderName: finalBidderName,
          secondsRemaining: remoteRoom.seconds_remaining,
          isSold: remoteRoom.is_sold,
          bidHistory: mergedBids,
          chatMessages: Array.from(chatMap.values()).sort((a, b) => a.timestamp - b.timestamp),
          outPlayerIds: (settings as any)?.outPlayerIds || local?.outPlayerIds || [],
          auctionType,
          submittedSlates: (settings as any)?.submittedSlates || local?.submittedSlates || {},
          portfolioRankings: (settings as any)?.portfolioRankings || local?.portfolioRankings,
          isPaused: Boolean((settings as any)?.isPaused ?? local?.isPaused),
          tournamentData: (settings as any)?.tournamentData || local?.tournamentData,
          version: Math.max(remoteVersion, (local?.version || 1)),
        };

        saveRoom(parsedRoom, true, false, true);
        return parsedRoom;
      }
    } catch {
      // Supabase is offline or not configured
    }

    return getRoom(code);
  } catch (e) {
    console.error("fetchRemoteRoom error", e);
    return getRoom(code);
  }
}

export function getOrCreateRoom(roomCode: string, playerName?: string): RoomState | null {
  const code = roomCode.toUpperCase();
  const existing = getRoom(code);
  if (existing) {
    if (playerName) {
      try {
        return joinRoom(code, playerName);
      } catch {
        return existing;
      }
    }
    return existing;
  }

  // Trigger background remote fetch so authoritative state arrives from server relay
  void fetchRemoteRoom(code);
  return null;
}

export function subscribeToMultiplayerRoom(
  roomCode: string,
  onUpdate: (room: RoomState) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const code = roomCode.toUpperCase();

  const handleLocalUpdate = (e: Event) => {
    const customEvent = e as CustomEvent<{ roomCode: string; room?: RoomState }>;
    if (customEvent.detail?.roomCode === code) {
      const fresh = customEvent.detail.room;
      if (!fresh) return;
      const current = getRoom(code);
      if (isPacketNewer(current, fresh)) {
        onUpdate(fresh);
      }
    }
  };

  window.addEventListener("cinebid_room_update", handleLocalUpdate);

  // 1. In-App Server Relay SSE stream
  let eventSource: EventSource | null = null;
  try {
    if (typeof EventSource !== "undefined") {
      eventSource = new EventSource(`/api/rooms/${encodeURIComponent(code)}/events`);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const fresh = parsed.room as RoomState | undefined;
          if (fresh && fresh.roomCode?.toUpperCase() === code) {
            const current = getRoom(code);
            if (isPacketNewer(current, fresh)) {
              saveRoom(fresh, true, false, true);
              onUpdate(fresh);
            }
          }
        } catch {
          // ignore parse errors
        }
      };
    }
  } catch {
    // SSE not supported
  }

  // 2. Periodic sync fallback (every 1.2s to guarantee synchronization even across network drops)
  const pollInterval = window.setInterval(() => {
    void fetchRemoteRoom(code).then((updated) => {
      if (updated) {
        const current = getRoom(code);
        if (isPacketNewer(current, updated)) {
          saveRoom(updated, true, false, true);
          onUpdate(updated);
        }
      }
    });
  }, 1200);

  // 3. Supabase Realtime channel (if available)
  let channel: any = null;
  let fetchDebounceTimer: number | null = null;
  try {
    const channelName = `cinebid_realtime_${code}`;
    channel = supabase.channel(channelName);

    const debouncedFetchRemote = () => {
      if (fetchDebounceTimer) window.clearTimeout(fetchDebounceTimer);
      fetchDebounceTimer = window.setTimeout(() => {
        void fetchRemoteRoom(code).then((updated) => {
          if (updated) {
            const current = getRoom(code);
            if (isPacketNewer(current, updated)) {
              saveRoom(updated, true, false, true);
              onUpdate(updated);
            }
          }
        });
      }, 1500);
    };

    const handleIncomingBroadcast = (payload: any) => {
      const fresh = payload?.payload?.room as RoomState | undefined;
      if (!fresh || fresh.roomCode?.toUpperCase() !== code) return;
      const current = getRoom(code);
      if (!isPacketNewer(current, fresh)) {
        return;
      }
      saveRoom(fresh, true, false, true);
      onUpdate(fresh);
    };

    channel
      .on("broadcast", { event: "room_state" }, handleIncomingBroadcast)
      .on("broadcast", { event: "bid_placed" }, handleIncomingBroadcast)
      .on("broadcast", { event: "player_out" }, handleIncomingBroadcast)
      .on("broadcast", { event: "game_started" }, handleIncomingBroadcast)
      .on("broadcast", { event: "round_advanced" }, handleIncomingBroadcast)
      .on("broadcast", { event: "timer_update" }, handleIncomingBroadcast)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `room_code=eq.${code}` },
        debouncedFetchRemote,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_code=eq.${code}` },
        debouncedFetchRemote,
      )
      .subscribe();

    registerActiveChannel(code, channel);
  } catch {
    // Supabase subscription failed, SSE and polling keep game alive
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
    window.clearInterval(pollInterval);
    if (fetchDebounceTimer) window.clearTimeout(fetchDebounceTimer);
    window.removeEventListener("cinebid_room_update", handleLocalUpdate);
    if (channel) {
      unregisterActiveChannel(code);
      try {
        void supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    }
  };
}

export function joinRoom(roomCode: string, playerName: string): RoomState {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);

  if (!room) {
    throw new Error(`Room "${code}" not found. Please verify the code or check if the host has created the room.`);
  }

  const currentUser = getCurrentUser();
  let cleanName = playerName.trim() || currentUser.name || "Franchise Owner";
  const existingNames = new Set(room.players.filter((p) => p.id !== currentUser.id).map((p) => p.name.toLowerCase()));
  if (existingNames.has(cleanName.toLowerCase())) {
    let counter = 2;
    while (existingNames.has(`${cleanName} ${counter}`.toLowerCase())) {
      counter++;
    }
    cleanName = `${cleanName} ${counter}`;
  }

  const user = setCurrentUser({ name: cleanName });
  const playerIndex = room.players.findIndex((p) => p.id === user.id);

  if (playerIndex >= 0 && room.players[playerIndex]) {
    room.players[playerIndex]!.name = user.name;
    room.players[playerIndex]!.avatar = user.avatar;
    room.players[playerIndex]!.ready = true;
  } else if (room.players.length < room.settings.maxPlayers) {
    const newPlayer: Player = {
      id: user.id,
      name: user.name,
      budget: room.settings.startingBudget,
      initialBudget: room.settings.startingBudget,
      movies: [],
      isHost: false,
      isBot: false,
      avatar: user.avatar,
      color: user.color,
      ready: true,
    };
    room.players.push(newPlayer);

    if (room.hostId === user.id) {
      const targetPoolSize = getRecommendedMoviePoolSize(room.players.length, room.auctionType || "CINEMA");
      if (room.moviePool.length < targetPoolSize) {
        const extraItems = getRandomizedMovieSlate(
          targetPoolSize,
          room.settings.category || "ALL",
          room.auctionType || "CINEMA",
        );
        const existingIds = new Set(room.moviePool.map((m) => m.id));
        for (const item of extraItems) {
          if (!existingIds.has(item.id)) {
            room.moviePool.push(item);
            existingIds.add(item.id);
          }
        }
        room.settings.totalMovies = room.moviePool.length;
      }
    }
  }

  bumpRoomVersion(room);
  saveRoom(room);
  void broadcastRoomState(room, "room_state");
  return room;
}

export async function joinRoomAsync(roomCode: string, playerName: string): Promise<RoomState> {
  const code = roomCode.toUpperCase();

  const currentUser = getCurrentUser();
  const cleanName = playerName.trim() || currentUser.name || "Franchise Owner";
  const user = setCurrentUser({ name: cleanName });

  // 1. Try server relay join first
  try {
    const playerPayload = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      color: user.color,
      ready: true,
    };

    let joinedRoom: RoomState | null = null;
    try {
      const res = await joinRoomServerFn({ data: { roomCode: code, player: playerPayload } });
      if (res && res.success && res.room) {
        joinedRoom = res.room as RoomState;
      } else if (res && !res.success && res.error) {
        throw new Error(res.error);
      }
    } catch (rpcErr: any) {
      if (rpcErr?.message && (rpcErr.message.includes("full") || rpcErr.message.includes("not found"))) {
        throw rpcErr;
      }
      // Fall back to HTTP endpoint
      const resp = await fetch(`/api/rooms/${encodeURIComponent(code)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: playerPayload }),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.room) {
          joinedRoom = json.room as RoomState;
        } else if (json.error) {
          throw new Error(json.error);
        }
      } else if (resp.status === 400 || resp.status === 404) {
        const json = await resp.json().catch(() => ({}));
        if (json.error && json.error.includes("full")) {
          throw new Error(json.error);
        }
      }
    }

    if (joinedRoom) {
      saveRoom(joinedRoom, true, false, true);
      return joinedRoom;
    }
  } catch (err: any) {
    if (err?.message && (err.message.includes("full") || err.message.includes("not found"))) {
      throw err;
    }
  }

  // 2. Remote / local fetch
  let room = await fetchRemoteRoom(code);
  if (!room) {
    room = getRoom(code);
  }

  // CRITICAL FIX: If room does not exist, throw an explicit error! NEVER create a fake movie room!
  if (!room) {
    throw new Error(`Room "${code}" not found. Please verify the code or check if the host has created the room.`);
  }

  // Check player capacity
  const maxPlayers = room.settings?.maxPlayers || 8;
  const isAlreadyIn = room.players.some((p) => p.id === user.id || p.name.toLowerCase() === user.name.toLowerCase());
  if (!isAlreadyIn && room.players.length >= maxPlayers) {
    throw new Error(`Room "${code}" is full (${maxPlayers}/${maxPlayers} players).`);
  }

  const existingNames = new Set(room.players.filter((p) => p.id !== user.id).map((p) => p.name.toLowerCase()));
  let finalName = user.name;
  if (existingNames.has(finalName.toLowerCase())) {
    let counter = 2;
    while (existingNames.has(`${finalName} ${counter}`.toLowerCase())) {
      counter++;
    }
    finalName = `${finalName} ${counter}`;
    setCurrentUser({ name: finalName });
  }

  const playerIndex = room.players.findIndex((p) => p.id === user.id);

  if (playerIndex >= 0 && room.players[playerIndex]) {
    room.players[playerIndex]!.name = finalName;
    room.players[playerIndex]!.avatar = user.avatar;
    room.players[playerIndex]!.ready = true;
  } else if (room.players.length < maxPlayers) {
    const newPlayer: Player = {
      id: user.id,
      name: finalName,
      budget: room.settings.startingBudget,
      initialBudget: room.settings.startingBudget,
      movies: [],
      isHost: false,
      isBot: false,
      avatar: user.avatar,
      color: user.color,
      ready: true,
    };
    room.players.push(newPlayer);
  }

  bumpRoomVersion(room);
  saveRoom(room);
  void broadcastRoomState(room, "room_state");
  return room;
}

/**
 * Official BCCI IPL Auction Bidding Increment Slabs:
 * - Below ₹1.00 Cr: +₹10 Lakh (₹0.10 Cr)
 * - ₹1.00 Cr to ₹5.00 Cr: +₹20 Lakh (₹0.20 Cr)
 * - ₹5.00 Cr to ₹10.00 Cr: +₹25 Lakh (₹0.25 Cr)
 * - Above ₹10.00 Cr: +₹50 Lakh (₹0.50 Cr)
 */
export function getIplBiddingSlab(currentBid: number): {
  increment: number;
  label: string;
  slabName: string;
  minNextBid: number;
} {
  let increment = 0.20;
  let label = "+₹20L";
  let slabName = "₹1 Cr – ₹5 Cr (+₹20 Lakh)";

  if (currentBid < 1.00) {
    increment = 0.10;
    label = "+₹10L";
    slabName = "Below ₹1 Cr (+₹10 Lakh)";
  } else if (currentBid < 5.00) {
    increment = 0.20;
    label = "+₹20L";
    slabName = "₹1 Cr – ₹5 Cr (+₹20 Lakh)";
  } else if (currentBid < 10.00) {
    increment = 0.25;
    label = "+₹25L";
    slabName = "₹5 Cr – ₹10 Cr (+₹25 Lakh)";
  } else {
    increment = 0.50;
    label = "+₹50L";
    slabName = "Above ₹10 Cr Mega War (+₹50 Lakh)";
  }

  const minNextBid = Math.round((currentBid + increment) * 100) / 100;
  return { increment, label, slabName, minNextBid };
}

/**
 * Returns the exact next minimum legal bid amount for IPL auction.
 */
export function getIplNextMinBid(
  currentBid: number,
  isOpeningBid: boolean,
  basePrice: number,
): { nextBid: number; increment: number; label: string; slabName: string } {
  if (isOpeningBid || currentBid <= 0) {
    return {
      nextBid: basePrice,
      increment: 0,
      label: "Base Price",
      slabName: `Opening Base Price (₹${basePrice.toFixed(2)} Cr)`,
    };
  }
  const slab = getIplBiddingSlab(currentBid);
  return {
    nextBid: slab.minNextBid,
    increment: slab.increment,
    label: slab.label,
    slabName: slab.slabName,
  };
}

/**
 * Host updates or extends the auction countdown timer in real-time.
 * Can be called at any point during live bidding (e.g. set to 10s or add +10s).
 */
export function updateAuctionTimer(
  roomCode: string,
  seconds: number,
  isExtension = false,
): RoomState | null {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room || room.status !== "AUCTION") return null;

  const newSeconds = isExtension
    ? Math.max(3, (room.secondsRemaining || 0) + seconds)
    : Math.max(3, seconds);

  room.secondsRemaining = newSeconds;
  if (room.settings) {
    room.settings.auctionSeconds = newSeconds;
  }
  if (!room.isPaused) {
    room.auctionEndTime = Date.now() + newSeconds * 1000;
  } else {
    room.auctionEndTime = undefined;
  }

  bumpRoomVersion(room);
  saveRoom(room, false, false, false, true);
  void broadcastRoomState(room, "timer_update", {
    secondsRemaining: newSeconds,
    auctionEndTime: room.auctionEndTime,
  });
  return room;
}

// -------------------------------------------------------------
export function placeBid(
  roomCode: string,
  playerId: string,
  amountOrIncrement: number,
  isAbsolute = false,
): { success: boolean; message?: string; room?: RoomState } {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) return { success: false, message: "Room not found." };
  if (room.isSold || room.status !== "AUCTION")
    return { success: false, message: "Auction round has concluded." };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: "Player not found in room." };

  // If player clicked OUT, they cannot bid on this round
  if (room.outPlayerIds?.includes(playerId)) {
    return { success: false, message: "You called OUT and cannot bid on this item." };
  }

  const currentMovie = room.moviePool[room.currentMovieIndex] || movies[0];
  const isCricket = room.auctionType === "CRICKET" || Boolean(currentMovie?.role);

  if (!player.movies) player.movies = [];

  // IPL Rule 1: Maximum 18 players in squad
  if (isCricket && player.movies.length >= 18) {
    return {
      success: false,
      message: "Squad limit reached (18/18 players). You cannot acquire more players.",
    };
  }

  // IPL Rule 2: Maximum 7 foreign / overseas players in squad (max 4 allowed in Playing 11)
  if (isCricket && currentMovie && isOverseasPlayer(currentMovie)) {
    const currentOverseasCount = player.movies.filter((m) => isOverseasPlayer(m)).length;
    if (currentOverseasCount >= 7) {
      return {
        success: false,
        message: "Squad overseas limit reached (7/7). You can only bid on Indian players.",
      };
    }
  }

  let newBid = isAbsolute ? amountOrIncrement : room.currentBid + amountOrIncrement;
  newBid = Math.round(newBid * 100) / 100;

  if (isCricket) {
    const baseP = currentMovie?.basePrice ?? 1;
    if (room.currentBidderId === null) {
      if (newBid < baseP) {
        return {
          success: false,
          message: `Opening bid cannot be lower than player's base price of ${formatCr(baseP)}.`,
        };
      }
    } else {
      const slab = getIplBiddingSlab(room.currentBid);
      const minAllowed = Math.round((room.currentBid + slab.increment) * 100) / 100;
      if (newBid < minAllowed - 0.001) {
        return {
          success: false,
          message: `IPL Bid Increment: Must be at least ${slab.label} (Min next bid: ${formatCr(minAllowed)}).`,
        };
      }
    }
  } else {
    if (newBid <= room.currentBid && room.currentBidderId !== null) {
      return { success: false, message: "Bid must be higher than current bid." };
    }
  }

  if (newBid > player.budget) {
    return {
      success: false,
      message: `Insufficient budget (${formatCr(player.budget)} remaining).`,
    };
  }

  room.currentBid = newBid;
  room.currentBidderId = player.id;
  room.currentBidderName = player.name;

  // Anti-sniping: extend timer to at least 8 seconds if bid placed near the end
  const now = Date.now();
  const currentEnd = room.auctionEndTime || (now + room.secondsRemaining * 1000);
  const remainingMs = currentEnd - now;
  if (remainingMs < 8000) {
    room.auctionEndTime = now + 9000;
    room.secondsRemaining = 9;
  } else {
    room.secondsRemaining = Math.max(1, Math.ceil(remainingMs / 1000));
  }

  const nowDate = new Date();
  const timeStr = `${nowDate.getHours().toString().padStart(2, "0")}:${nowDate.getMinutes().toString().padStart(2, "0")}:${nowDate.getSeconds().toString().padStart(2, "0")}`;

  const bidRecord: BidRecord = {
    id: `bid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    playerId: player.id,
    playerName: player.name,
    amount: newBid,
    time: timeStr,
  };

  room.bidHistory.unshift(bidRecord);
  bumpRoomVersion(room);
  saveRoom(room, false, false, false, true);

  try {
    void supabase.from("room_bids").insert({
      room_code: code,
      player_id: player.id,
      player_name: player.name,
      movie_id: currentMovie?.id || "unknown",
      amount: newBid,
    });

    void broadcastRoomState(room, "bid_placed", { bidRecord });
  } catch {
    // Ignore offline
  }

  return { success: true, room };
}

/**
 * Player clicks "OUT" (Pass/Withdraw).
 * They cannot bid on this player/movie anymore.
 * If all competitors have clicked OUT, the item is awarded immediately to the highest bidder (or unsold if no bids).
 */
export function playerPassOrOut(
  roomCode: string,
  playerId: string,
): { success: boolean; room?: RoomState; isResolved?: boolean } {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) return { success: false };
  if (room.isSold || room.status !== "AUCTION") return { success: false };

  if (!room.outPlayerIds) room.outPlayerIds = [];
  if (!room.outPlayerIds.includes(playerId)) {
    room.outPlayerIds.push(playerId);
  }

  // Check if round should conclude immediately:
  // Active bidders = players not marked OUT
  const activePlayers = room.players.filter((p) => !room.outPlayerIds.includes(p.id));

  // Case 1: Someone placed a bid, and all OTHER players have marked OUT (active <= 1)
  if (room.currentBidderId && activePlayers.length <= 1) {
    const resolved = resolveCurrentAuction(room.roomCode);
    return { success: true, room: resolved || room, isResolved: true };
  }

  // Case 2: No bids placed and EVERYONE in the room has marked OUT (active === 0)
  if (!room.currentBidderId && activePlayers.length === 0) {
    const resolved = resolveCurrentAuction(room.roomCode);
    return { success: true, room: resolved || room, isResolved: true };
  }

  bumpRoomVersion(room);
  saveRoom(room, false, false, false, true);
  void broadcastRoomState(room, "player_out", { playerId });
  return { success: true, room, isResolved: false };
}

/**
 * Intelligent Bot Simulation with realistic "OUT" decisions and IPL squad/overseas constraints
 */
export function simulateBotBid(
  roomOrCode: RoomState | string,
): { didBid: boolean; botName?: string; newBid?: number; room?: RoomState } {
  const code = typeof roomOrCode === "string" ? roomOrCode.toUpperCase() : roomOrCode.roomCode.toUpperCase();
  const room = getRoom(code) || (typeof roomOrCode !== "string" ? roomOrCode : null);
  if (!room) return { didBid: false };
  if (room.isSold || room.status !== "AUCTION") return { didBid: false };

  if (!room.outPlayerIds) room.outPlayerIds = [];

  const currentMovie = room.moviePool[room.currentMovieIndex];
  if (!currentMovie) return { didBid: false };

  const isCricket = room.auctionType === "CRICKET" || Boolean(currentMovie?.role);
  const isOverseas = isCricket && isOverseasPlayer(currentMovie);

  const eligibleBots = room.players.filter(
    (p) => p.isBot && p.id !== room.currentBidderId && !room.outPlayerIds.includes(p.id),
  );

  if (eligibleBots.length === 0) return { didBid: false };

  const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
  if (!bot) return { didBid: false };

  if (!bot.movies) bot.movies = [];

  // Constraint 1: Squad max 18 players
  if (isCricket && bot.movies.length >= 18) {
    if (!room.outPlayerIds.includes(bot.id)) {
      room.outPlayerIds.push(bot.id);
      bumpRoomVersion(room);
      saveRoom(room);
    }
    return { didBid: false };
  }

  // Constraint 2: Max 7 overseas players in squad
  if (isOverseas) {
    const botOverseasCount = bot.movies.filter((m) => isOverseasPlayer(m)).length;
    if (botOverseasCount >= 7) {
      if (!room.outPlayerIds.includes(bot.id)) {
        room.outPlayerIds.push(bot.id);
        bumpRoomVersion(room);
        saveRoom(room);
      }
      return { didBid: false };
    }
  }

  const maxWillingness = Math.round(
    currentMovie.basePrice * (1.1 + (currentMovie.imdbRating / 10) * 0.7) +
      (currentMovie.boxOffice > 500 ? 4 : 0),
  );

  // If current price exceeds bot willingness or bot cannot afford next bid: bot marks OUT
  const slab = isCricket ? getIplBiddingSlab(room.currentBid) : { increment: 1 };
  const minRequired = room.currentBidderId === null ? currentMovie.basePrice : room.currentBid + slab.increment;

  if (room.currentBid >= maxWillingness || bot.budget < minRequired) {
    if (!room.outPlayerIds.includes(bot.id)) {
      room.outPlayerIds.push(bot.id);
      bumpRoomVersion(room);
      saveRoom(room);
    }

    // Check if only 1 active bidder remains
    const activePlayers = room.players.filter((p) => !room.outPlayerIds.includes(p.id));
    if (room.currentBidderId && activePlayers.length <= 1) {
      resolveCurrentAuction(room.roomCode);
    }
    return { didBid: false };
  }

  // Bot places a bid
  if (room.currentBid < maxWillingness && bot.budget >= minRequired) {
    let bidVal: number;
    if (isCricket) {
      if (room.currentBidderId === null) {
        bidVal = currentMovie.basePrice;
      } else {
        bidVal = Math.round((room.currentBid + slab.increment) * 100) / 100;
      }
    } else {
      const increment = Math.random() > 0.65 ? 2 : 1;
      bidVal = Math.min(room.currentBid + increment, bot.budget);
    }
    bidVal = Math.min(bidVal, bot.budget);

    const result = placeBid(room.roomCode, bot.id, bidVal, true);
    if (result.success && result.room) {
      return { didBid: true, botName: bot.name, newBid: bidVal, room: result.room };
    }
  }

  return { didBid: false };
}

export function resolveCurrentAuction(roomCode: string): RoomState | null {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) return null;
  if (room.isSold) return room;

  const currentMovie = room.moviePool[room.currentMovieIndex];
  if (!currentMovie) return room;

  if (room.currentBidderId) {
    const winner = room.players.find((p) => p.id === room.currentBidderId);
    if (winner) {
      if (!winner.movies) winner.movies = [];
      // Idempotency check: prevent duplicate acquisition or double deduction
      const alreadyWon = winner.movies.some((m) => m.id === currentMovie.id);
      if (!alreadyWon) {
        winner.budget -= room.currentBid;
        const wonMovie: OwnedMovie = {
          ...currentMovie,
          purchasePrice: room.currentBid,
          purchasedBy: winner.id,
          purchasedByName: winner.name,
        };
        winner.movies.push(wonMovie);
      }
    }
  }

  bumpRoomVersion(room);
  room.isSold = true;
  room.isPaused = false;
  room.auctionEndTime = undefined;
  saveRoom(room, false, false, false, true);
  void broadcastRoomState(room, "room_state");
  return room;
}

export function togglePauseAuction(roomCode: string): RoomState | null {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room || room.status !== "AUCTION" || room.isSold) return null;

  if (room.isPaused) {
    room.isPaused = false;
    const remainingSec = Math.max(1, room.secondsRemaining || 30);
    room.auctionEndTime = Date.now() + remainingSec * 1000;
  } else {
    room.isPaused = true;
    if (room.auctionEndTime) {
      const remainingMs = Math.max(0, room.auctionEndTime - Date.now());
      room.secondsRemaining = Math.max(1, Math.ceil(remainingMs / 1000));
    }
    room.auctionEndTime = undefined;
  }

  bumpRoomVersion(room);
  saveRoom(room, false, false, false, true);
  void broadcastRoomState(room, "room_state");
  return room;
}

export function saveTournamentState(roomCode: string, tournamentData: any): RoomState | null {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) return null;
  room.tournamentData = tournamentData;
  bumpRoomVersion(room);
  saveRoom(room, false, false, false, true);
  void broadcastRoomState(room, "room_state");
  return room;
}

export function advanceToNextMovie(roomCode: string): RoomState | null {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) return null;

  const nextIndex = room.currentMovieIndex + 1;
  const maxRounds = Math.min(room.settings.totalMovies, room.moviePool.length);

  if (nextIndex >= maxRounds) {
    room.status = "TOP_FIVE";
    room.auctionEndTime = undefined;
    bumpRoomVersion(room);
    saveRoom(room);
    void broadcastRoomState(room, "room_state");
    return room;
  }

  const nextMovie = room.moviePool[nextIndex];
  room.currentMovieIndex = nextIndex;
  room.currentBid = nextMovie ? nextMovie.basePrice : 1;
  room.currentBidderId = null;
  room.currentBidderName = null;
  room.secondsRemaining = room.settings.auctionSeconds;
  room.auctionEndTime = Date.now() + room.settings.auctionSeconds * 1000;
  room.isSold = false;
  room.bidHistory = [];
  room.outPlayerIds = []; // Reset "OUT" statuses for new item

  bumpRoomVersion(room);
  saveRoom(room, false, false, false, true);
  void broadcastRoomState(room, "round_advanced", { nextIndex });
  return room;
}

// -------------------------------------------------------------
// 8. SLATE SUBMISSION & GRAND JURY EVALUATION ALGORITHM
// -------------------------------------------------------------

/**
 * Submit a player's final 5-film slate or Playing 11 for the Grand Jury / Championship.
 * The Grand Jury will NOT start until EVERY player with acquired items has submitted their slate.
 */
export function submitPlayerSlate(
  roomCode: string,
  playerId: string,
  movieIds: string[],
  captainId?: string,
  viceCaptainId?: string,
): { room: RoomState; allSubmitted: boolean } {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) throw new Error("Room not found");

  if (!room.submittedSlates) {
    room.submittedSlates = {};
  }

  room.submittedSlates[playerId] = {
    movieIds,
    captainId,
    viceCaptainId,
    submittedAt: Date.now(),
  };

  const targetPlayer = room.players.find((p) => p.id === playerId);
  if (targetPlayer) {
    targetPlayer.submittedTop5 = movieIds;
    targetPlayer.isSlateSubmitted = true;
  }

  if (!room.settings) {
    room.settings = { ...DEFAULT_ROOM_SETTINGS };
  }
  room.settings.submittedSlates = room.submittedSlates;

  // Check if all human players with won items have submitted
  const activeHumans = room.players.filter((p) => !p.isBot && (p.movies || []).length > 0);
  const allSubmitted =
    activeHumans.length === 0 ||
    activeHumans.every((p) => Boolean(room.submittedSlates?.[p.id]?.movieIds?.length));

  if (allSubmitted) {
    room.status = "EVALUATING";
  }

  saveRoom(room);
  return { room, allSubmitted };
}

/**
 * Allows a player to recall and edit their submitted slate while waiting for others
 */
export function unsubmitPlayerSlate(roomCode: string, playerId: string): RoomState | null {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room || room.status === "EVALUATING" || room.status === "RESULTS") return room;

  if (room.submittedSlates && room.submittedSlates[playerId]) {
    delete room.submittedSlates[playerId];
    if (room.settings?.submittedSlates) {
      delete room.settings.submittedSlates[playerId];
    }
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isSlateSubmitted = false;
    }
    saveRoom(room);
  }
  return room;
}

/**
 * Host bypass to begin Grand Jury evaluation immediately if an active player is AFK
 */
export function forceStartEvaluation(roomCode: string): RoomState | null {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) return null;
  room.status = "EVALUATING";
  saveRoom(room);
  return room;
}

export async function evaluateAllRoomPlayers(
  roomCode: string,
  userSelectedTop5?: string[],
): Promise<PlayerScore[]> {
  const code = roomCode.toUpperCase();
  const room = getRoom(code);
  if (!room) return [];

  const user = getCurrentUser();
  const userMap: Record<string, string[]> = {};

  // 1. Gather all slates submitted by players in the room
  if (room.submittedSlates) {
    Object.entries(room.submittedSlates).forEach(([pid, slate]) => {
      if (slate?.movieIds?.length) {
        userMap[pid] = slate.movieIds;
      }
    });
  }

  // 2. Direct argument takes precedence for current user if passed
  if (userSelectedTop5?.length) {
    userMap[user.id] = userSelectedTop5;
  }

  const isCricket =
    room.auctionType === "CRICKET" ||
    room.players.some((p) => (p.movies || []).some((m) => m.auctionType === "CRICKET" || m.role));

  // 3. For any bots or players who did not submit in time, calculate their optimal slate
  room.players.forEach((p) => {
    if (!userMap[p.id] || userMap[p.id]!.length === 0) {
      const pMovies = p.movies || [];
      if (isCricket) {
        const optimal = getOptimalPlaying11(pMovies);
        userMap[p.id] = optimal.playing11;
      } else {
        userMap[p.id] = getOptimalMovieSlate(pMovies);
      }
    }
  });

  const scores = await evaluatePortfoliosWithAi(
    room.players,
    userMap,
    room.auctionType || "CINEMA",
  );

  room.portfolioRankings = scores;
  if (!room.settings) room.settings = { ...DEFAULT_ROOM_SETTINGS };
  room.settings.portfolioRankings = scores;
  room.status = "RESULTS";
  saveRoom(room);

  // Sync rankings to Supabase
  try {
    const rankingRows = scores.map((s) => ({
      room_code: code,
      player_id: s.playerId,
      name: s.name,
      avatar: s.avatar,
      color: s.color || null,
      score: s.score,
      rank: s.rank,
      won_count: s.wonCount,
      remaining_budget: s.remainingBudget,
      critique: s.critique,
      breakdown: s.breakdown as any,
    }));
    await (supabase.from("room_rankings") as any).upsert(rankingRows, { onConflict: "id" });
  } catch {
    // Ignore offline
  }

  return scores;
}
