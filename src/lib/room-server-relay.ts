// In-memory server-side multiplayer room store and real-time SSE relay
// Works in both Vite dev server middleware (Node HTTP) and TanStack Start / Nitro (Fetch API)

export interface ServerRoomState {
  roomCode: string;
  updatedAt: number;
  data: any;
}

// Global in-memory storage (persists across hot-reloads via globalThis in dev)
const globalStore = globalThis as unknown as {
  __CINEBID_ROOM_STORE__?: Map<string, ServerRoomState>;
  __CINEBID_ROOM_LISTENERS__?: Map<string, Set<(eventData: string) => void>>;
};

if (!globalStore.__CINEBID_ROOM_STORE__) {
  globalStore.__CINEBID_ROOM_STORE__ = new Map<string, ServerRoomState>();
}
if (!globalStore.__CINEBID_ROOM_LISTENERS__) {
  globalStore.__CINEBID_ROOM_LISTENERS__ = new Map<string, Set<(eventData: string) => void>>();
}

const rooms = globalStore.__CINEBID_ROOM_STORE__;
const listeners = globalStore.__CINEBID_ROOM_LISTENERS__;

export function broadcastRoomUpdate(roomCode: string, roomData: any): void {
  const code = roomCode.toUpperCase();
  const roomListeners = listeners.get(code);
  if (!roomListeners || roomListeners.size === 0) return;

  const payload = JSON.stringify({ type: "room_update", room: roomData, timestamp: Date.now() });
  const sseChunk = `data: ${payload}\n\n`;

  for (const listener of roomListeners) {
    try {
      listener(sseChunk);
    } catch {
      roomListeners.delete(listener);
    }
  }
}

function getRelayCandidates(rawCode: string): string[] {
  if (!rawCode) return [];
  const clean = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  const candidates = new Set<string>();
  candidates.add(clean);
  if (clean.startsWith("IPL")) {
    const after = clean.replace(/^IPL-?/, "");
    if (after) {
      candidates.add(`IPL-${after}`);
      candidates.add(after);
    }
  } else if (clean.startsWith("CINE")) {
    const after = clean.replace(/^CINE-?/, "");
    if (after) {
      candidates.add(`CINE-${after}`);
      candidates.add(after);
    }
  } else {
    candidates.add(`IPL-${clean}`);
    candidates.add(`CINE-${clean}`);
  }
  return Array.from(candidates);
}

export function getStoredRoom(roomCode: string): any | null {
  if (!roomCode) return null;
  const candidates = getRelayCandidates(roomCode);
  for (const c of candidates) {
    const entry = rooms.get(c);
    if (entry) {
      // Expire rooms after 24 hours of inactivity
      if (Date.now() - entry.updatedAt > 24 * 60 * 60 * 1000) {
        rooms.delete(c);
        return null;
      }
      return entry.data;
    }
  }
  return null;
}

export function saveStoredRoom(roomCode: string, roomData: any): any {
  const canonicalCode = (roomData?.roomCode || roomCode).toUpperCase();
  const existing = getStoredRoom(canonicalCode);

  // Merge players or protect against stale overwrites if needed
  let toSave = roomData;
  if (existing && roomData) {
    // Preserve higher bid if on the same item index
    if (
      existing.currentMovieIndex === roomData.currentMovieIndex &&
      (existing.currentBid || 0) > (roomData.currentBid || 0)
    ) {
      toSave.currentBid = existing.currentBid;
      toSave.currentBidderId = existing.currentBidderId;
      toSave.currentBidderName = existing.currentBidderName;
    }

    // Merge players list: ensure existing players are not dropped by stale client saves
    if (Array.isArray(existing.players) && Array.isArray(roomData.players)) {
      const incomingIds = new Set(roomData.players.map((p: any) => p.id));
      const missing = existing.players.filter((p: any) => !incomingIds.has(p.id));
      if (missing.length > 0) {
        toSave.players = [...roomData.players, ...missing];
      }
    } else if (Array.isArray(existing.players) && (!roomData.players || roomData.players.length === 0)) {
      toSave.players = existing.players;
    }
  }

  // Ensure all players have valid numerical budgets
  if (Array.isArray(toSave.players)) {
    const defaultBudget = typeof toSave.settings?.startingBudget === "number" ? toSave.settings.startingBudget : 100;
    toSave.players = toSave.players.map((p: any) => ({
      ...p,
      budget: typeof p.budget === "number" && !isNaN(p.budget) ? Math.round(p.budget * 100) / 100 : defaultBudget,
      initialBudget: typeof p.initialBudget === "number" && !isNaN(p.initialBudget) ? Math.round(p.initialBudget * 100) / 100 : defaultBudget,
      movies: Array.isArray(p.movies) ? p.movies : [],
    }));
  }

  rooms.set(canonicalCode, {
    roomCode: canonicalCode,
    updatedAt: Date.now(),
    data: toSave,
  });

  broadcastRoomUpdate(canonicalCode, toSave);
  return toSave;
}

export function addPlayerToStoredRoom(roomCode: string, player: any): { success: boolean; room?: any; error?: string; notFound?: boolean } {
  const room = getStoredRoom(roomCode);
  if (!room) {
    return { success: false, notFound: true, error: `Room ${roomCode} not found in relay memory.` };
  }
  const code = (room.roomCode || roomCode).toUpperCase();

  if (!room.players) room.players = [];

  const maxPlayers = room.settings?.maxPlayers || 8;
  const startingBudget = typeof room.settings?.startingBudget === "number" ? room.settings.startingBudget : 100;
  const existingIndex = room.players.findIndex((p: any) => p.id === player.id);

  if (existingIndex >= 0) {
    // Update existing player record
    const prev = room.players[existingIndex];
    const prevBudget = typeof prev.budget === "number" && !isNaN(prev.budget) ? prev.budget : undefined;
    const incomingBudget = typeof player.budget === "number" && !isNaN(player.budget) ? player.budget : undefined;
    const finalBudget = Math.round((prevBudget ?? incomingBudget ?? startingBudget) * 100) / 100;

    const prevInitial = typeof prev.initialBudget === "number" && !isNaN(prev.initialBudget) ? prev.initialBudget : undefined;
    const incomingInitial = typeof player.initialBudget === "number" && !isNaN(player.initialBudget) ? player.initialBudget : undefined;
    const finalInitial = Math.round((prevInitial ?? incomingInitial ?? startingBudget) * 100) / 100;

    room.players[existingIndex] = {
      ...prev,
      ...player,
      budget: finalBudget,
      initialBudget: finalInitial,
      movies: prev.movies || player.movies || [],
    };
  } else {
    if (room.players.length >= maxPlayers) {
      return { success: false, error: `Room ${code} is full (${maxPlayers}/${maxPlayers} players).` };
    }
    // Prevent duplicate name conflicts
    let cleanName = player.name || "Franchise Owner";
    const existingNames = new Set(room.players.map((p: any) => (p.name || "").toLowerCase()));
    if (existingNames.has(cleanName.toLowerCase())) {
      let counter = 2;
      while (existingNames.has(`${cleanName} ${counter}`.toLowerCase())) {
        counter++;
      }
      cleanName = `${cleanName} ${counter}`;
    }

    const assignedBudget = typeof player.budget === "number" && !isNaN(player.budget) ? Math.round(player.budget * 100) / 100 : startingBudget;
    const assignedInitial = typeof player.initialBudget === "number" && !isNaN(player.initialBudget) ? Math.round(player.initialBudget * 100) / 100 : startingBudget;

    const newPlayer = {
      ...player,
      name: cleanName,
      budget: assignedBudget,
      initialBudget: assignedInitial,
      movies: player.movies || [],
    };
    room.players.push(newPlayer);
  }

  room.version = (room.version || 1) + 1;
  saveStoredRoom(code, room);
  return { success: true, room };
}

// -------------------------------------------------------------
// 1. Node.js HTTP Middleware Handler (for Vite dev server)
// -------------------------------------------------------------
export function handleNodeRoomRequest(req: any, res: any, next: () => void): void {
  const url = req.url || "";
  if (!url.startsWith("/api/rooms")) {
    return next();
  }

  // Parse path: /api/rooms or /api/rooms/:code or /api/rooms/:code/events or /api/rooms/:code/join
  const parsed = new URL(url, `http://${req.headers.host || "localhost"}`);
  const segments = parsed.pathname.replace(/^\/api\/rooms\/?/, "").split("/").filter(Boolean);
  const roomCode = segments[0] ? decodeURIComponent(segments[0]).toUpperCase() : null;
  const subAction = segments[1] ? segments[1].toLowerCase() : null;

  // Set CORS headers for local LAN testing
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // SSE Stream: GET /api/rooms/:code/events
  if (req.method === "GET" && roomCode && subAction === "events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.flushHeaders?.();

    if (!listeners.has(roomCode)) {
      listeners.set(roomCode, new Set());
    }
    const roomListeners = listeners.get(roomCode)!;

    const listener = (chunk: string) => {
      try {
        res.write(chunk);
      } catch {
        roomListeners.delete(listener);
      }
    };
    roomListeners.add(listener);

    // Send initial room state if exists
    const current = getStoredRoom(roomCode);
    if (current) {
      res.write(`data: ${JSON.stringify({ type: "initial_state", room: current })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
    }

    // Keepalive ping every 15s
    const keepalive = setInterval(() => {
      try {
        res.write(": keepalive\n\n");
      } catch {
        clearInterval(keepalive);
        roomListeners.delete(listener);
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(keepalive);
      roomListeners.delete(listener);
    });
    return;
  }

  // GET /api/rooms/:code
  if (req.method === "GET" && roomCode) {
    const room = getStoredRoom(roomCode);
    if (!room) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: `Room ${roomCode} not found` }));
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, room }));
    return;
  }

  // Helper to read JSON request body
  const readBody = (callback: (body: any) => void) => {
    let data = "";
    req.on("data", (chunk: any) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        const parsedBody = data ? JSON.parse(data) : {};
        callback(parsedBody);
      } catch {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: false, error: "Invalid JSON body" }));
      }
    });
  };

  // POST /api/rooms/:code/join
  if (req.method === "POST" && roomCode && subAction === "join") {
    readBody((body) => {
      const result = addPlayerToStoredRoom(roomCode, body.player || body);
      res.statusCode = result.success ? 200 : 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    });
    return;
  }

  // POST or PUT /api/rooms or /api/rooms/:code (upsert room state)
  if ((req.method === "POST" || req.method === "PUT") && (roomCode || url === "/api/rooms" || url === "/api/rooms/")) {
    readBody((body) => {
      const targetCode = roomCode || body.roomCode || body.room?.roomCode;
      if (!targetCode) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: false, error: "Missing roomCode" }));
        return;
      }
      const roomPayload = body.room || body;
      const saved = saveStoredRoom(targetCode, roomPayload);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: true, room: saved }));
    });
    return;
  }

  next();
}

// -------------------------------------------------------------
// 2. Fetch API Handler (for TanStack Start / Nitro SSR entry)
// -------------------------------------------------------------
export async function handleFetchRoomRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/rooms")) {
    return null;
  }

  const segments = url.pathname.replace(/^\/api\/rooms\/?/, "").split("/").filter(Boolean);
  const roomCode = segments[0] ? decodeURIComponent(segments[0]).toUpperCase() : null;
  const subAction = segments[1] ? segments[1].toLowerCase() : null;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // SSE Stream
  if (request.method === "GET" && roomCode && subAction === "events") {
    let intervalId: any;
    let listenerFn: (chunk: string) => void;

    const stream = new ReadableStream({
      start(controller) {
        if (!listeners.has(roomCode)) {
          listeners.set(roomCode, new Set());
        }
        const roomListeners = listeners.get(roomCode)!;

        listenerFn = (chunk: string) => {
          try {
            controller.enqueue(new TextEncoder().encode(chunk));
          } catch {
            roomListeners.delete(listenerFn);
          }
        };
        roomListeners.add(listenerFn);

        const current = getStoredRoom(roomCode);
        if (current) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: "initial_state", room: current })}\n\n`),
          );
        } else {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));
        }

        intervalId = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
          } catch {
            clearInterval(intervalId);
            roomListeners.delete(listenerFn);
          }
        }, 15000);
      },
      cancel() {
        if (intervalId) clearInterval(intervalId);
        listeners.get(roomCode)?.delete(listenerFn);
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // GET /api/rooms/:code
  if (request.method === "GET" && roomCode) {
    const room = getStoredRoom(roomCode);
    if (!room) {
      return new Response(JSON.stringify({ success: false, error: `Room ${roomCode} not found` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true, room }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST /api/rooms/:code/join
  if (request.method === "POST" && roomCode && subAction === "join") {
    try {
      const body = await request.json();
      const result = addPlayerToStoredRoom(roomCode, body.player || body);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // POST /api/rooms or /api/rooms/:code (upsert)
  if (request.method === "POST" || request.method === "PUT") {
    try {
      const body = await request.json();
      const targetCode = roomCode || body.roomCode || body.room?.roomCode;
      if (!targetCode) {
        return new Response(JSON.stringify({ success: false, error: "Missing roomCode" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const roomPayload = body.room || body;
      const saved = saveStoredRoom(targetCode, roomPayload);
      return new Response(JSON.stringify({ success: true, room: saved }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return null;
}

// -------------------------------------------------------------
// 3. TanStack Start Server Functions (built-in native RPC)
// -------------------------------------------------------------
import { createServerFn } from "@tanstack/react-start";

export const fetchRoomServerFn = createServerFn({ method: "GET" })
  .validator((roomCode: string) => roomCode)
  .handler(async ({ data: roomCode }) => {
    if (!roomCode) return null;
    return getStoredRoom(roomCode);
  });

export const saveRoomServerFn = createServerFn({ method: "POST" })
  .validator((room: any) => room)
  .handler(async ({ data: room }) => {
    if (!room?.roomCode) return null;
    return saveStoredRoom(room.roomCode, room);
  });

export const joinRoomServerFn = createServerFn({ method: "POST" })
  .validator((payload: { roomCode: string; player: any }) => payload)
  .handler(async ({ data: { roomCode, player } }) => {
    if (!roomCode || !player) {
      return { success: false, error: "Invalid join payload" };
    }
    return addPlayerToStoredRoom(roomCode, player);
  });

