import {
  DEFAULT_ROOM_SETTINGS,
  formatCr,
  getRandomizedMovieSlate,
  getRecommendedMoviePoolSize,
  movies,
  type Movie,
  type OwnedMovie,
  type Player,
  type RoomSettings,
} from "./game-data";
import { supabase } from "@/integrations/supabase/client";
import { generateAiMovieSlate, evaluatePortfoliosWithAi } from "./ai-evaluation";

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

export function generateUniqueRoomCode(): string {
  const existingRooms = getExistingRoomCodes();
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;
    let code = "";

    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(6);
      window.crypto.getRandomValues(bytes);
      for (let i = 0; i < 6; i++) {
        const byte = bytes[i] ?? 0;
        const index = byte % CHARSET.length;
        code += CHARSET[index] || "A";
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const index = Math.floor(Math.random() * CHARSET.length);
        code += CHARSET[index] || "A";
      }
    }

    if (!existingRooms.includes(code)) {
      registerRoomCode(code);
      return code;
    }
  }

  const timestampPart = Date.now().toString(36).toUpperCase().slice(-4);
  const c1 = CHARSET[Math.floor(Math.random() * CHARSET.length)] || "X";
  const c2 = CHARSET[Math.floor(Math.random() * CHARSET.length)] || "Y";
  const fallbackCode = (timestampPart + c1 + c2).slice(0, 6);
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
  "#e11d48", // rose
  "#d97706", // amber
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
 * Uses sessionStorage so multiple tabs in the same browser are distinct players.
 */
export function getCurrentUser(): CurrentUser {
  if (typeof window === "undefined") {
    return { id: "p1", name: "Player 1", avatar: "P1", color: AVATAR_COLORS[0] || "#e11d48" };
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

  const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] || "#e11d48";
  const id = `user_${Math.random().toString(36).slice(2, 9)}`;
  const name = savedName || "Movie Producer";
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
  const name = user.name.trim() || current.name || "Cinephile";
  const avatar = getInitials(name);
  const color = user.color || current.color || AVATAR_COLORS[0] || "#e11d48";
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
// 3. BOT PROFILES
// -------------------------------------------------------------
export const BOT_PROFILES = [
  { name: "Karan J.", avatar: "KJ", style: "Blockbusters & Star Power" },
  { name: "Zoya A.", avatar: "ZA", style: "Indie Gems & Drama" },
  { name: "Rohit S.", avatar: "RS", style: "High-Octane Mass Action" },
  { name: "Anurag K.", avatar: "AK", style: "Gritty Crime & Thrillers" },
  { name: "S.S. Raj", avatar: "SR", style: "Epic Scale & Big Bids" },
  { name: "Deepika P.", avatar: "DP", style: "Balanced Acclaim" },
  { name: "Shah Rukh", avatar: "SRK", style: "Unstoppable Crown Bidder" },
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
  const code = generateUniqueRoomCode();
  const roomSettings: RoomSettings = {
    ...DEFAULT_ROOM_SETTINGS,
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

  // Randomized movie pool with at least 15 movies (scaled for players)
  const poolSize = getRecommendedMoviePoolSize(roomSettings.maxPlayers || 4);
  const moviePool = getRandomizedMovieSlate(Math.max(15, poolSize), roomSettings.category || "ALL");
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
  };

  saveRoom(newRoom);
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

export function saveRoom(room: RoomState, skipSupabase = false): void {
  if (typeof window === "undefined" || !room?.roomCode) return;
  try {
    const key = `${STORAGE_PREFIX}${room.roomCode.toUpperCase()}`;
    localStorage.setItem(key, JSON.stringify(room));

    window.dispatchEvent(
      new CustomEvent("cinebid_room_update", {
        detail: { roomCode: room.roomCode.toUpperCase(), room },
      }),
    );
    if (broadcastChannel) {
      broadcastChannel.postMessage({ roomCode: room.roomCode.toUpperCase(), room });
    }

    if (!skipSupabase) {
      void syncRoomToSupabase(room);
      void broadcastRoomState(room, "room_state");
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

    // 1. Upsert room record
    await supabase.from("rooms").upsert(
      {
        room_code: code,
        host_id: room.hostId,
        host_name: room.hostName,
        status: room.status,
        settings: room.settings as any,
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

    // 2. Upsert players
    if (room.players?.length) {
      const playerRows = room.players.map((p) => ({
        id: p.id,
        room_code: code,
        user_id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color || "#e11d48",
        budget: p.budget,
        initial_budget: p.initialBudget,
        is_host: p.isHost ?? false,
        is_bot: p.isBot ?? false,
        is_ready: p.ready ?? true,
        movies: (p.movies || []) as any,
      }));
      await supabase.from("room_players").upsert(playerRows, { onConflict: "id,room_code" });
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
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse room data", e);
  }
  return null;
}

export async function fetchRemoteRoom(roomCode: string): Promise<RoomState | null> {
  const code = roomCode.toUpperCase();
  try {
    const { data: remoteRoom, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", code)
      .maybeSingle();

    if (roomError || !remoteRoom) return null;

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
      .limit(20);

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
      isSystem: m.player_name === "System" || m.player_name === "Cinebid Host",
    }));

    const mappedBids: BidRecord[] = (remoteBids || []).map((b: any) => ({
      id: b.id,
      playerId: b.player_id,
      playerName: b.player_name,
      amount: Number(b.amount),
      time: new Date(b.created_at).toLocaleTimeString(),
    }));

    const local = getRoom(code);
    const existingChat = local?.chatMessages || [];
    const chatMap = new Map<string, ChatMsg>();
    mappedMessages.forEach((m) => chatMap.set(m.id, m));
    existingChat.forEach((m) => {
      if (!chatMap.has(m.id)) chatMap.set(m.id, m);
    });

    // Merge bid history uniquely
    const bidMap = new Map<string, BidRecord>();
    mappedBids.forEach((b) => bidMap.set(b.id, b));
    (local?.bidHistory || []).forEach((b) => {
      if (!bidMap.has(b.id)) bidMap.set(b.id, b);
    });
    const mergedBids = Array.from(bidMap.values()).sort((a, b) => b.amount - a.amount);

    // Monotonic bid protection: never downgrade a higher local bid on active round
    let finalBid = Number(remoteRoom.current_bid);
    let finalBidderId = remoteRoom.current_bidder_id;
    let finalBidderName = remoteRoom.current_bidder_name;

    if (
      local &&
      local.currentMovieIndex === remoteRoom.current_movie_index &&
      local.currentBid > finalBid
    ) {
      finalBid = local.currentBid;
      finalBidderId = local.currentBidderId;
      finalBidderName = local.currentBidderName;
    }

    const parsedRoom: RoomState = {
      roomCode: remoteRoom.room_code,
      createdAt: new Date(remoteRoom.created_at).getTime(),
      settings: (remoteRoom.settings as unknown as RoomSettings) || DEFAULT_ROOM_SETTINGS,
      hostId: remoteRoom.host_id,
      hostName: remoteRoom.host_name,
      status: remoteRoom.status as any,
      players: mappedPlayers.length ? mappedPlayers : local?.players || [],
      moviePool: (remoteRoom.movie_pool as unknown as Movie[]) || local?.moviePool || movies,
      currentMovieIndex: remoteRoom.current_movie_index,
      currentBid: finalBid,
      currentBidderId: finalBidderId,
      currentBidderName: finalBidderName,
      secondsRemaining: local?.secondsRemaining !== undefined ? local.secondsRemaining : remoteRoom.seconds_remaining,
      isSold: remoteRoom.is_sold,
      bidHistory: mergedBids,
      chatMessages: Array.from(chatMap.values()).sort((a, b) => a.timestamp - b.timestamp),
    };

    saveRoom(parsedRoom, true);
    return parsedRoom;
  } catch (e) {
    console.error("fetchRemoteRoom error", e);
    return null;
  }
}

export function getOrCreateRoom(roomCode: string, playerName?: string): RoomState {
  const existing = getRoom(roomCode);
  if (existing) {
    if (playerName) {
      return joinRoom(roomCode, playerName);
    }
    return existing;
  }

  void fetchRemoteRoom(roomCode);

  const user = getCurrentUser();
  const name = playerName || user.name;
  const newRoom = createRoom(name);
  newRoom.roomCode = roomCode.toUpperCase();
  saveRoom(newRoom);
  return newRoom;
}

export function subscribeToMultiplayerRoom(
  roomCode: string,
  onUpdate: (room: RoomState) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const code = roomCode.toUpperCase();

  // 1. Local event listener
  const handleLocalUpdate = (e: Event) => {
    const customEvent = e as CustomEvent<{ roomCode: string; room?: RoomState }>;
    if (customEvent.detail?.roomCode === code) {
      const fresh = customEvent.detail.room || getRoom(code);
      if (fresh) onUpdate(fresh);
    }
  };

  window.addEventListener("cinebid_room_update", handleLocalUpdate);

  // 2. Supabase Realtime channel subscription (.on handlers BEFORE .subscribe)
  const channelName = `cinebid_realtime_${code}`;
  const channel = supabase.channel(channelName);

  let fetchDebounceTimer: number | null = null;
  const debouncedFetchRemote = () => {
    if (fetchDebounceTimer) window.clearTimeout(fetchDebounceTimer);
    fetchDebounceTimer = window.setTimeout(() => {
      void fetchRemoteRoom(code).then((updated) => {
        if (updated) onUpdate(updated);
      });
    }, 350);
  };

  channel
    .on("broadcast", { event: "room_state" }, (payload: any) => {
      if (payload.payload?.room?.roomCode === code) {
        const fresh = payload.payload.room as RoomState;
        const current = getRoom(code);
        // Protect higher bid in the same round
        if (
          current &&
          current.currentMovieIndex === fresh.currentMovieIndex &&
          current.currentBid > fresh.currentBid
        ) {
          fresh.currentBid = current.currentBid;
          fresh.currentBidderId = current.currentBidderId;
          fresh.currentBidderName = current.currentBidderName;
        }
        saveRoom(fresh, true);
        onUpdate(fresh);
      }
    })
    .on("broadcast", { event: "bid_placed" }, (payload: any) => {
      if (payload.payload?.room?.roomCode === code) {
        const fresh = payload.payload.room as RoomState;
        saveRoom(fresh, true);
        onUpdate(fresh);
      }
    })
    .on("broadcast", { event: "game_started" }, (payload: any) => {
      if (payload.payload?.room?.roomCode === code) {
        const fresh = payload.payload.room as RoomState;
        saveRoom(fresh, true);
        onUpdate(fresh);
      }
    })
    .on("broadcast", { event: "round_advanced" }, (payload: any) => {
      if (payload.payload?.room?.roomCode === code) {
        const fresh = payload.payload.room as RoomState;
        saveRoom(fresh, true);
        onUpdate(fresh);
      }
    })
    .on("broadcast", { event: "timer_tick" }, (payload: any) => {
      if (payload.payload?.roomCode === code) {
        const current = getRoom(code);
        if (current && !current.isSold) {
          current.secondsRemaining = payload.payload.secondsRemaining;
          saveRoom(current, true);
          onUpdate({ ...current });
        }
      }
    })
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `room_code=eq.${code}`,
      },
      () => {
        debouncedFetchRemote();
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_players",
        filter: `room_code=eq.${code}`,
      },
      () => {
        debouncedFetchRemote();
      },
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "room_bids",
        filter: `room_code=eq.${code}`,
      },
      () => {
        debouncedFetchRemote();
      },
    )
    .subscribe();

  registerActiveChannel(code, channel);

  return () => {
    if (fetchDebounceTimer) window.clearTimeout(fetchDebounceTimer);
    window.removeEventListener("cinebid_room_update", handleLocalUpdate);
    unregisterActiveChannel(code);
    void supabase.removeChannel(channel);
  };
}

export function joinRoom(roomCode: string, playerName: string): RoomState {
  const code = roomCode.toUpperCase();
  let room = getRoom(code);
  const user = setCurrentUser({ name: playerName });

  if (!room) {
    room = createRoom(playerName);
    room.roomCode = code;
    saveRoom(room);
    return room;
  }

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

    // Dynamically scale movie pool to satisfy the 5-movie minimum per player
    const targetPoolSize = getRecommendedMoviePoolSize(room.players.length);
    if (room.moviePool.length < targetPoolSize) {
      const existingIds = new Set(room.moviePool.map((m) => m.id));
      const remainingMovies = movies.filter((m) => !existingIds.has(m.id));
      for (let i = remainingMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = remainingMovies[i]!;
        remainingMovies[i] = remainingMovies[j]!;
        remainingMovies[j] = temp;
      }
      const needed = targetPoolSize - room.moviePool.length;
      room.moviePool.push(...remainingMovies.slice(0, needed));
      room.settings.totalMovies = room.moviePool.length;
    }
  }

  saveRoom(room);
  void broadcastRoomState(room, "room_state");
  return room;
}

export async function joinRoomAsync(roomCode: string, playerName: string): Promise<RoomState> {
  const code = roomCode.toUpperCase();
  const user = setCurrentUser({ name: playerName });

  let room = await fetchRemoteRoom(code);
  if (!room) {
    room = getRoom(code);
  }

  if (!room) {
    room = createRoom(playerName);
    room.roomCode = code;
    saveRoom(room);
    return room;
  }

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

    // Dynamically scale movie pool to satisfy the 5-movie minimum per player
    const targetPoolSize = getRecommendedMoviePoolSize(room.players.length);
    if (room.moviePool.length < targetPoolSize) {
      const existingIds = new Set(room.moviePool.map((m) => m.id));
      const remainingMovies = movies.filter((m) => !existingIds.has(m.id));
      for (let i = remainingMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = remainingMovies[i]!;
        remainingMovies[i] = remainingMovies[j]!;
        remainingMovies[j] = temp;
      }
      const needed = targetPoolSize - room.moviePool.length;
      room.moviePool.push(...remainingMovies.slice(0, needed));
      room.settings.totalMovies = room.moviePool.length;
    }
  }

  saveRoom(room);
  void broadcastRoomState(room, "room_state");
  return room;
}

// -------------------------------------------------------------
// 7. LIVE BIDDING & BOT ENGINE
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

  const newBid = isAbsolute ? amountOrIncrement : room.currentBid + amountOrIncrement;

  if (newBid <= room.currentBid && room.currentBidderId !== null) {
    return { success: false, message: "Bid must be higher than current bid." };
  }
  if (newBid > player.budget) {
    return {
      success: false,
      message: `Insufficient budget (${formatCr(player.budget)} remaining).`,
    };
  }

  const currentMovie = room.moviePool[room.currentMovieIndex] || movies[0];

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
  saveRoom(room);

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

export function simulateBotBid(
  roomOrCode: RoomState | string,
): { didBid: boolean; botName?: string; newBid?: number; room?: RoomState } {
  const code = typeof roomOrCode === "string" ? roomOrCode.toUpperCase() : roomOrCode.roomCode.toUpperCase();
  const room = getRoom(code) || (typeof roomOrCode !== "string" ? roomOrCode : null);
  if (!room) return { didBid: false };
  if (room.isSold || room.status !== "AUCTION") return { didBid: false };

  const currentMovie = room.moviePool[room.currentMovieIndex];
  if (!currentMovie) return { didBid: false };

  const eligibleBots = room.players.filter(
    (p) => p.isBot && p.id !== room.currentBidderId && p.budget > room.currentBid + 1,
  );

  if (eligibleBots.length === 0) return { didBid: false };

  const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
  if (!bot) return { didBid: false };

  const maxWillingness = Math.round(
    currentMovie.basePrice * (1.1 + (currentMovie.imdbRating / 10) * 0.7) +
      (currentMovie.boxOffice > 500 ? 4 : 0),
  );

  if (room.currentBid < maxWillingness && bot.budget >= room.currentBid + 1) {
    const increment = Math.random() > 0.65 ? 2 : 1;
    const bidVal = Math.min(room.currentBid + increment, bot.budget);

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

  const currentMovie = room.moviePool[room.currentMovieIndex];
  if (!currentMovie) return room;

  if (room.currentBidderId) {
    const winner = room.players.find((p) => p.id === room.currentBidderId);
    if (winner) {
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

  room.isSold = true;
  room.auctionEndTime = undefined;
  saveRoom(room);
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
  room.auctionEndTime = Date.now() + (room.settings.auctionSeconds * 1000);
  room.isSold = false;
  room.bidHistory = [];

  saveRoom(room);
  return room;
}

// -------------------------------------------------------------
// 8. PORTFOLIO EVALUATION ALGORITHM
// -------------------------------------------------------------
export function evaluatePortfolio(player: Player, selectedMovieIds?: string[]): PlayerScore {
  const targetMovies = selectedMovieIds?.length
    ? player.movies.filter((m) => selectedMovieIds.includes(m.id))
    : player.movies.slice(0, 5);

  const count = targetMovies.length;

  if (count === 0) {
    return {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      color: player.color || "#e11d48",
      isHost: player.isHost,
      score: Math.round((player.budget / player.initialBudget) * 35 * 10) / 10,
      rank: 0,
      wonCount: 0,
      remainingBudget: player.budget,
      critique: "No movies secured in the auction. Portfolio lacks theatrical presence.",
      breakdown: { criticalAcclaim: 0, boxOfficeRoi: 0, genreSynergy: 0, budgetEfficiency: 10 },
    };
  }

  // 1. Critical Acclaim (Max 40)
  const avgImdb = targetMovies.reduce((acc, m) => acc + m.imdbRating, 0) / count;
  const criticalAcclaim = Math.min(40, (avgImdb / 10) * 40 * (count >= 5 ? 1.0 : count / 5));

  // 2. Box Office Power & ROI (Max 30)
  const totalBoxOffice = targetMovies.reduce((acc, m) => acc + m.boxOffice, 0);
  const totalSpent = targetMovies.reduce((acc, m) => acc + m.purchasePrice, 0) || 1;
  const roi = totalBoxOffice / totalSpent;
  const boxOfficeScore = Math.min(18, (totalBoxOffice / 4000) * 18);
  const roiScore = Math.min(12, (roi / 40) * 12);
  const boxOfficeRoi = boxOfficeScore + roiScore;

  // 3. Genre Diversity & Synergy (Max 20)
  const allGenres = new Set<string>();
  targetMovies.forEach((m) => m.genres.forEach((g) => allGenres.add(g)));
  const uniqueGenreCount = allGenres.size;
  const genreSynergy = Math.min(20, (uniqueGenreCount / 5) * 20);

  // 4. Capital Efficiency (Max 10)
  const budgetEfficiency = Math.min(10, (player.budget / player.initialBudget) * 10);

  const totalScore =
    Math.round((criticalAcclaim + boxOfficeRoi + genreSynergy + budgetEfficiency) * 10) / 10;

  let critique = "";
  const topMovie = [...targetMovies].sort((a, b) => b.boxOffice - a.boxOffice)[0];
  const highestRated = [...targetMovies].sort((a, b) => b.imdbRating - a.imdbRating)[0];

  if (totalScore >= 88) {
    critique = `A masterclass in cinematic curation! Anchored by ${highestRated?.title} (${highestRated?.imdbRating}★) and blockbuster powerhouse ${topMovie?.title} (${formatCr(topMovie?.boxOffice || 0)} worldwide). Exceptional genre harmony with ₹${player.budget} Cr capital retained.`;
  } else if (totalScore >= 75) {
    critique = `Formidable studio portfolio featuring iconic titles like ${topMovie?.title}. Strong box-office muscle coupled with sharp bidding discipline.`;
  } else {
    critique = `A bold boutique slate led by ${highestRated?.title}. With broader genre representation, this lineup will dominate award seasons.`;
  }

  return {
    playerId: player.id,
    name: player.name,
    avatar: player.avatar,
    color: player.color || "#e11d48",
    isHost: player.isHost,
    score: totalScore,
    rank: 1,
    wonCount: player.movies.length,
    remainingBudget: player.budget,
    critique,
    breakdown: {
      criticalAcclaim: Math.round(criticalAcclaim * 10) / 10,
      boxOfficeRoi: Math.round(boxOfficeRoi * 10) / 10,
      genreSynergy: Math.round(genreSynergy * 10) / 10,
      budgetEfficiency: Math.round(budgetEfficiency * 10) / 10,
    },
  };
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
  if (userSelectedTop5?.length) {
    userMap[user.id] = userSelectedTop5;
  }

  const scores = await evaluatePortfoliosWithAi(room.players, userMap);

  room.portfolioRankings = scores;
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
    // Ignore schema sync error if offline
  }

  return scores;
}
