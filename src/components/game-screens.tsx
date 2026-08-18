import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Award,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Film,
  Flame,
  Gavel,
  LoaderCircle,
  Medal,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { RoomChat } from "@/components/room-chat";
import {
  AuctionTimer,
  EmptyMovieSlot,
  GameStatus,
  getStarRating,
  MovieCard,
  PlayerCard,
  Poster,
  RankingList,
  SiteHeader,
} from "@/components/game-ui";
import {
  formatCr,
  getRandomizedMovieSlate,
  getRecommendedMoviePoolSize,
  movies,
  type Movie,
  type OwnedMovie,
  type Player,
} from "@/lib/game-data";
import {
  advanceToNextMovie,
  broadcastRoomState,
  createRoom,
  evaluateAllRoomPlayers,
  fetchRemoteRoom,
  getCurrentUser,
  getOrCreateRoom,
  getRoom,
  joinRoom,
  joinRoomAsync,
  placeBid,
  resolveCurrentAuction,
  saveRoom,
  setCurrentUser,
  subscribeToMultiplayerRoom,
  type PlayerScore,
  type RoomState,
} from "@/lib/game-manager";
import { playBidSound, playGavelWinSound } from "@/lib/sound-effects";
import cinebidLogo from "@/assets/cinebid-logo.jpg";

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="game-app min-h-screen flex flex-col bg-cinema text-foreground">
      <SiteHeader />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export function LandingScreen() {
  return (
    <Page>
      <main className="landing">
        <section className="landing-copy">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-gold/40 shadow-md shadow-gold/20 flex-shrink-0">
              <img src={cinebidLogo} alt="Cinebid Emblem" className="w-full h-full object-cover" />
            </div>
            <GameStatus icon={<StarDot />}>Live cinematic high-stakes bidding</GameStatus>
          </div>
          <h1>
            MOVIE
            <br />
            <em>AUCTION</em>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mb-2">
            Build your ultimate studio slate. Outbid rival producers in real-time auctions, acquire at least 5 iconic blockbusters, and compete for the Grand Jury Championship Leaderboard.
          </p>
          <div className="landing-actions">
            <Link className="btn btn-primary" to="/create">
              Create game
            </Link>
            <Link className="btn btn-secondary" to="/join">
              Join game
            </Link>
          </div>
        </section>
        <section className="landing-posters" aria-label="Featured movie auctions">
          {movies.slice(0, 4).map((movie, index) => (
            <div className={`feature-poster poster-${index}`} key={movie.id}>
              <Poster movie={movie} />
              <div>
                <strong>{movie.title}</strong>
                <span>Base: {formatCr(movie.basePrice)}</span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </Page>
  );
}

export function GameForm({ mode }: { mode: "create" | "join" }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [max, setMax] = useState("4");
  const [budget, setBudget] = useState("100");
  const [seconds, setSeconds] = useState("30");
  const [category, setCategory] = useState("ALL");
  const [selectedColor, setSelectedColor] = useState("#f5c518");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = [
    { label: "Gold", hex: "#f5c518" },
    { label: "Crimson", hex: "#e50914" },
    { label: "Purple", hex: "#a855f7" },
    { label: "Cyan", hex: "#06b6d4" },
    { label: "Emerald", hex: "#10b981" },
    { label: "Amber", hex: "#f59e0b" },
  ];

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser.name && savedUser.name !== "Movie Producer" && savedUser.name !== "Player 1") {
      setName(savedUser.name);
    }
    if (savedUser.color) {
      setSelectedColor(savedUser.color);
    }
  }, []);

  const numMax = Math.max(2, Math.min(8, Number(max) || 4));
  const numBudget = Math.max(50, Math.min(500, Number(budget) || 100));
  const numSeconds = Math.max(15, Math.min(90, Number(seconds) || 30));
  const totalMoviesForCount = getRecommendedMoviePoolSize(numMax);

  const categoryOptions = [
    {
      id: "ALL",
      title: "🎬 All Studios & Global Cinema",
      subtitle: "Full mix of Bollywood, South Indian Pan-India, Hollywood & Masterpieces",
      badge: "Universal Slate",
    },
    {
      id: "BOLLYWOOD",
      title: "🔥 Bollywood & Hindi Cinema Mega Hits",
      subtitle: "YRF, Dharma, Red Chillies, T-Series (Jawan, Dangal, Pathaan, Sholay, DDLJ, Stree 2)",
      badge: "Hindi Blockbusters",
    },
    {
      id: "SOUTH_PAN_INDIA",
      title: "💥 South Pan-India Epics",
      subtitle: "Tollywood, Kollywood, Sandalwood (RRR, Baahubali 2, KGF 2, Pushpa, Kantara, Kalki 2898 AD)",
      badge: "Pan-India Epics",
    },
    {
      id: "HOLLYWOOD",
      title: "🚀 Hollywood & Global Blockbusters",
      subtitle: "Warner Bros, Universal, Paramount (Interstellar, Inception, Dark Knight, Oppenheimer, Titanic)",
      badge: "Global Giants",
    },
    {
      id: "MASTERPIECES",
      title: "🏆 Critically Acclaimed & Cult Classics",
      subtitle: "Oscar & National Award Winners (Tumbbad, Gangs of Wasseypur, Andhadhun, Swades, Lagaan)",
      badge: "Critique Picks",
    },
  ];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter your producer name to continue.");
      return;
    }

    // Save user profile with preferred color
    setCurrentUser({ name: cleanName, color: selectedColor });

    if (mode === "join") {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        setError("Please enter a valid room code.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const room = await joinRoomAsync(cleanCode, cleanName);

        if (room && room.players.length > room.settings.maxPlayers) {
          const isAlreadyIn = room.players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase());
          if (!isAlreadyIn) {
            setError(`Room ${cleanCode} is full (${room.settings.maxPlayers}/${room.settings.maxPlayers} players).`);
            setLoading(false);
            return;
          }
        }

        navigate({
          to: "/room/$roomCode",
          params: { roomCode: cleanCode },
        });
      } catch (e: any) {
        setError(e?.message || "Failed to connect to room.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const room = createRoom(cleanName, {
      maxPlayers: numMax,
      startingBudget: numBudget,
      auctionSeconds: numSeconds,
      category: category,
      totalMovies: totalMoviesForCount,
    });

    navigate({
      to: "/room/$roomCode",
      params: { roomCode: room.roomCode },
    });
  };

  return (
    <Page>
      <main className="form-layout flex-1 flex items-center justify-center py-10 px-4 sm:px-6 w-full">
        <section className="form-card w-full max-w-2xl mx-auto bg-panel/95 border border-border/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-black">
              {mode === "create" ? "👑" : "🎟️"}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-cream">
                {mode === "create" ? "CREATE STUDIO AUCTION" : "JOIN AUCTION ROOM"}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {mode === "create"
                  ? "Configure your live multiplayer movie auction room with custom budgets, players & studio slates."
                  : "Enter your room code to enter the live bidding war."}
              </p>
            </div>
          </div>

          {error && (
            <div className="my-4 p-3 bg-red-500/15 border border-red-500/30 text-red-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-6 mt-5">
            {/* Producer Profile & Studio Color */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Producer / Studio Head Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yash Chopra / Christopher Nolan"
                  required
                  maxLength={24}
                  className="flex-1 bg-cinema border border-border rounded-xl px-4 py-3 text-sm text-cream placeholder:text-muted-foreground focus:border-gold outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Studio Color:</span>
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      selectedColor === c.hex
                        ? "scale-125 border-white shadow-md shadow-black"
                        : "border-transparent opacity-65 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            {mode === "join" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Room Code (6 Digits)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 7K9M2X"
                  required
                  maxLength={10}
                  className="bg-cinema border border-border rounded-xl px-4 py-3 text-lg font-mono font-bold tracking-widest text-gold text-center focus:border-gold outline-none"
                />
              </div>
            )}

            {mode === "create" && (
              <>
                {/* Player Capacity & Scaled Movie Slate */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Producers & Movie Slate Size
                    </label>
                    <span className="text-xs text-gold font-bold">
                      {totalMoviesForCount} Movies in Pool (Min 5/player)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { count: "2", movies: "15", label: "2 Producers" },
                      { count: "3", movies: "22", label: "3 Producers" },
                      { count: "4", movies: "28", label: "4 Producers" },
                      { count: "5", movies: "35", label: "5 Producers" },
                      { count: "6", movies: "42", label: "6 Producers" },
                      { count: "8", movies: "56", label: "8 Producers" },
                    ].map((item) => (
                      <button
                        key={item.count}
                        type="button"
                        onClick={() => setMax(item.count)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          max === item.count
                            ? "bg-gold/15 border-gold shadow-md shadow-gold/10"
                            : "bg-cinema/70 border-border/70 hover:border-gold/40 text-muted-foreground"
                        }`}
                      >
                        <strong className={`block text-xs font-bold ${max === item.count ? "text-gold" : "text-cream"}`}>
                          {item.label}
                        </strong>
                        <span className="text-[11px] text-muted-foreground">
                          {item.movies} Movies Slate
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Studio Starting Budget */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Starting Studio Capital (Budget)
                    </label>
                    <span className="text-xs text-gold font-bold">₹{budget} Crores</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["100", "150", "200", "300"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBudget(b)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          budget === b
                            ? "bg-gold/15 border-gold text-gold"
                            : "bg-cinema border-border/70 text-cream/80 hover:border-gold/40"
                        }`}
                      >
                        ₹{b} Cr
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">Custom Budget:</span>
                    <input
                      type="number"
                      min={50}
                      max={500}
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-24 bg-cinema border border-border rounded-lg px-2 py-1 text-xs text-cream text-center focus:border-gold outline-none"
                    />
                    <span className="text-xs text-muted-foreground">Cr (Min 50, Max 500)</span>
                  </div>
                </div>

                {/* Auction Clock Speed */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Auction Round Clock
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { sec: "20", label: "20s (Blitz)" },
                      { sec: "30", label: "30s (Standard)" },
                      { sec: "45", label: "45s (Strategic)" },
                      { sec: "60", label: "60s (Extended)" },
                    ].map((s) => (
                      <button
                        key={s.sec}
                        type="button"
                        onClick={() => setSeconds(s.sec)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all ${
                          seconds === s.sec
                            ? "bg-gold/15 border-gold text-gold"
                            : "bg-cinema border-border/70 text-cream/80 hover:border-gold/40"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Studio Collection & Film Category */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Studio Catalog & Film Genre
                  </label>
                  <div className="flex flex-col gap-2">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition-all ${
                          category === cat.id
                            ? "bg-gold/15 border-gold shadow-md shadow-gold/10"
                            : "bg-cinema/70 border-border/70 hover:border-gold/40"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <strong className={`block text-xs sm:text-sm font-bold ${category === cat.id ? "text-gold" : "text-cream"}`}>
                            {cat.title}
                          </strong>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {cat.subtitle}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          category === cat.id
                            ? "bg-gold text-black border-gold"
                            : "bg-panel text-muted-foreground border-border"
                        }`}>
                          {cat.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configuration Summary Callout */}
                <div className="bg-gold/10 border border-gold/30 rounded-xl p-3.5 flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1.5 text-gold font-bold">
                    <Sparkles size={14} /> Room Configuration Summary
                  </div>
                  <div className="text-cream/90">
                    <strong>{max} Producers</strong> • <strong>₹{budget} Cr</strong> Starting Capital •{" "}
                    <strong>{totalMoviesForCount} Randomized Movies</strong> • <strong>{seconds}s</strong> Round Clock
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    ⚠️ Mandatory Rule: Every producer must acquire <strong>at least 5 movies</strong> to qualify for the Grand Jury Championship Leaderboard.
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full py-3.5 text-sm sm:text-base font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-gold/10"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" /> Connecting to Live Hall...
                </>
              ) : (
                <>
                  {mode === "create" ? "Create Studio Room & Enter" : "Enter Live Auction Room"}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </section>
      </main>
    </Page>
  );
}

export function LobbyScreen({ roomCode }: { roomCode: string }) {
  const code = roomCode.toUpperCase();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(() => getRoom(code));
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(!getRoom(code));
  const currentUser = getCurrentUser();

  useEffect(() => {
    let isMounted = true;

    void fetchRemoteRoom(code).then((remote) => {
      if (!isMounted) return;
      if (remote) {
        const isUserIn = remote.players.some((p) => p.id === currentUser.id);
        if (!isUserIn && remote.players.length < remote.settings.maxPlayers) {
          const joined = joinRoom(code, currentUser.name);
          setRoom(joined);
        } else {
          setRoom(remote);
        }
      } else {
        const local = getOrCreateRoom(code, currentUser.name);
        setRoom(local);
      }
      setLoading(false);
    });

    const unsubscribe = subscribeToMultiplayerRoom(code, (fresh) => {
      setRoom(fresh);
      if (fresh.status === "AUCTION") {
        navigate({ to: "/game/$roomCode", params: { roomCode: code } });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [code, navigate, currentUser.id, currentUser.name]);

  if (loading) {
    return (
      <Page>
        <main className="lobby-layout flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-gold">
            <LoaderCircle size={36} className="animate-spin" />
            <span className="text-sm font-semibold tracking-wider">CONNECTING TO LOBBY {code}...</span>
          </div>
        </main>
      </Page>
    );
  }

  if (!room) return null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isHost = room.hostId === currentUser.id || room.players[0]?.id === currentUser.id;
  const emptySlotsCount = Math.max(0, room.settings.maxPlayers - room.players.length);

  const handleShuffleSlate = () => {
    if (!isHost) return;
    const poolSize = Math.max(15, room.moviePool.length);
    const newSlate = getRandomizedMovieSlate(poolSize, room.settings.category || "ALL");
    room.moviePool = newSlate;
    saveRoom(room);
  };

  const startGame = async () => {
    room.status = "AUCTION";
    room.currentMovieIndex = 0;
    const firstMovie = room.moviePool[0];
    room.currentBid = firstMovie ? firstMovie.basePrice : 1;
    room.currentBidderId = null;
    room.currentBidderName = null;
    room.secondsRemaining = room.settings.auctionSeconds;
    room.auctionEndTime = Date.now() + room.settings.auctionSeconds * 1000;
    room.isSold = false;
    room.bidHistory = [];

    saveRoom(room);
    void broadcastRoomState(room, "game_started");

    navigate({ to: "/game/$roomCode", params: { roomCode: code } });
  };

  return (
    <Page>
      <main className="lobby-layout">
        <section className="lobby-main">
          <div className="room-panel">
            <GameStatus>Live Room Lobby</GameStatus>
            <h1 className="tracking-widest">{room.roomCode}</h1>
            <button type="button" className="copy-button" onClick={copyCode}>
              {copied ? (
                <>
                  <Check size={18} className="text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={18} /> Copy code
                </>
              )}
            </button>
          </div>

          {/* Golden 5-Movie Requirement Notice */}
          <div className="bg-gradient-to-r from-gold/15 via-gold/10 to-amber-950/20 border border-gold/40 rounded-xl p-4 shadow-md flex items-start gap-3">
            <Crown size={22} className="text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-cream flex items-center gap-2">
                Mandatory Requirement: 5 Movies Minimum per Studio
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every producer must acquire <strong>at least 5 films</strong> in this auction. Incomplete studio slates will receive a heavy Grand Jury penalty during final Leaderboard scoring!
              </p>
            </div>
          </div>

          <div className="section-heading flex items-center justify-between">
            <div>
              <h2>Producers in Room</h2>
              <span className="text-xs text-muted-foreground">
                {room.players.length} / {room.settings.maxPlayers} Joined
              </span>
            </div>
          </div>

          <div className="lobby-players">
            {room.players.map((player) => {
              const isMe = player.id === currentUser.id;
              return (
                <div className="lobby-player relative group" key={player.id}>
                  {player.isHost && (
                    <span className="host-badge">
                      <Crown size={13} /> Host
                    </span>
                  )}
                  <span
                    className="lobby-avatar"
                    style={
                      player.color ? { borderColor: player.color, color: player.color } : undefined
                    }
                  >
                    {player.avatar}
                  </span>
                  <strong className="flex items-center gap-1">
                    {player.name} {isMe && <small className="text-gold text-xs font-normal">(You)</small>}
                  </strong>
                  <small className="text-xs text-muted-foreground">
                    Budget: {formatCr(player.budget)}
                  </small>
                </div>
              );
            })}
            {Array.from({ length: emptySlotsCount }).map((_, index) => (
              <EmptyMovieSlot key={index} />
            ))}
          </div>

          {/* Randomized Movie Slate Preview */}
          <div className="mt-6 bg-panel/60 border border-border/80 rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Film size={17} className="text-gold" />
                  <h3 className="font-bold text-sm sm:text-base text-cream">
                    Auction Movie Slate
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                    {room.moviePool.length} Blockbusters & Classics
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Curated catalog randomized for this session ({room.players.length} players • minimum 5 per studio)
                </p>
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={handleShuffleSlate}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border-gold/40 text-gold hover:bg-gold/10"
                  title="Randomize the movie list"
                >
                  <Shuffle size={14} /> Shuffle Slate
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
              {room.moviePool.map((movie, idx) => (
                <div
                  key={movie.id || idx}
                  className="p-2.5 rounded-lg bg-panel/80 border border-border/60 flex gap-2.5 items-start hover:border-gold/40 transition-colors"
                >
                  <div className="w-11 h-16 rounded overflow-hidden flex-shrink-0 bg-black/40 relative">
                    <Poster movie={movie} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-xs font-bold text-cream truncate" title={movie.title}>
                      {idx + 1}. {movie.title}
                    </strong>
                    <span className="block text-[11px] text-gold font-semibold">
                      Base: {formatCr(movie.basePrice)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground truncate">
                      {movie.year} • {movie.director || movie.genre}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] font-bold text-cream/90">
                        {movie.imdbRating || 8.0}★
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto truncate">
                        ₹{movie.boxOffice || 400}Cr
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="lobby-sidebar">
          <RoomChat roomCode={room.roomCode} playerName={currentUser.name} />
          {isHost ? (
            <button type="button" onClick={startGame} className="btn btn-primary btn-full">
              <Play size={17} fill="currentColor" /> Start auction ({room.moviePool.length} Movies)
            </button>
          ) : (
            <div className="p-3 text-center text-xs text-muted-foreground bg-panel rounded border border-border">
              Waiting for room host <strong>{room.hostName}</strong> to start the auction...
            </div>
          )}
        </aside>
      </main>
    </Page>
  );
}

export function AuctionScreen({ roomCode }: { roomCode: string }) {
  const code = roomCode.toUpperCase();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(() => getOrCreateRoom(code));
  const [bidToast, setBidToast] = useState<{ id: string; text: string } | null>(null);
  const currentUser = getCurrentUser();
  const prevBidRef = useRef<number | null>(room?.currentBid ?? null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showBidToast = (text: string) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setBidToast({ id: String(Date.now()), text });
    toastTimeoutRef.current = window.setTimeout(() => {
      setBidToast(null);
    }, 2200);
  };

  useEffect(() => {
    const activeRoom = getOrCreateRoom(code);
    if (activeRoom.status !== "AUCTION") {
      activeRoom.status = "AUCTION";
    }
    if (!activeRoom.auctionEndTime && !activeRoom.isSold) {
      activeRoom.auctionEndTime = Date.now() + (activeRoom.secondsRemaining || 30) * 1000;
    }
    saveRoom(activeRoom);
    setRoom(activeRoom);
    prevBidRef.current = activeRoom.currentBid;

    const unsubscribe = subscribeToMultiplayerRoom(code, (fresh) => {
      if (prevBidRef.current !== null && fresh.currentBid > prevBidRef.current && !fresh.isSold) {
        playBidSound();
        if (fresh.currentBidderName) {
          const isMe = fresh.currentBidderId === currentUser.id;
          showBidToast(isMe ? `Your bid of ${formatCr(fresh.currentBid)} is leading!` : `${fresh.currentBidderName} placed a bid of ${formatCr(fresh.currentBid)}!`);
        }
      }
      if (!prevBidRef.current || fresh.currentBid !== prevBidRef.current) {
        prevBidRef.current = fresh.currentBid;
      }

      setRoom(fresh);
      if (fresh.status === "TOP_FIVE" || fresh.status === "RESULTS") {
        navigate({ to: "/results/$roomCode", params: { roomCode: code } });
      }
    });

    return () => {
      unsubscribe();
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, [code, navigate, currentUser.id]);

  // Host auto-resolves when auctionEndTime expires
  const handleTimerExpired = () => {
    const latest = getRoom(code);
    if (!latest || latest.isSold || latest.status !== "AUCTION") return;

    const resolved = resolveCurrentAuction(latest.roomCode);
    if (resolved) {
      playGavelWinSound();
      setRoom({ ...resolved });
    }
  };

  if (!room) return null;

  const currentMovie = room.moviePool[room.currentMovieIndex] || movies[0]!;
  if (!currentMovie) return null;
  const me = room.players.find((p) => p.id === currentUser.id) || room.players[0];
  if (!me) return null;

  const isHost = room.hostId === currentUser.id || room.players[0]?.id === currentUser.id;
  const isWinning = room.currentBidderId === me.id;
  const currentLeaderName = room.currentBidderName || "None yet";
  const totalRounds = Math.min(room.settings.totalMovies, room.moviePool.length);

  const handleUserBid = (increment: number) => {
    if (room.isSold) return;
    playBidSound();
    const result = placeBid(room.roomCode, me.id, increment);
    if (result.success && result.room) {
      prevBidRef.current = result.room.currentBid;
      showBidToast(`You placed a bid of ${formatCr(result.room.currentBid)}!`);
      setRoom({ ...result.room });
    }
  };

  const handlePass = () => {
    if (room.isSold) return;
    const resolved = resolveCurrentAuction(room.roomCode);
    if (resolved) {
      playGavelWinSound();
      setRoom({ ...resolved });
    }
  };

  const handleNextMovie = () => {
    const maxRounds = Math.min(room.settings.totalMovies, room.moviePool.length);
    if (room.currentMovieIndex + 1 >= maxRounds) {
      room.status = "TOP_FIVE";
      saveRoom(room);
      navigate({ to: "/results/$roomCode", params: { roomCode: code } });
      return;
    }

    const updated = advanceToNextMovie(room.roomCode);
    if (updated) {
      prevBidRef.current = updated.currentBid;
      setRoom({ ...updated });
    }
  };

  return (
    <Page>
      <main className="auction-layout">
        <section className="auction-movie">
          <Poster movie={currentMovie} className="auction-poster" />
          <div className="movie-meta">
            <div className="flex items-center gap-2 text-xs text-gold">
              <span>{currentMovie.year}</span>
              <span>•</span>
              <span>{currentMovie.genre}</span>
            </div>
            <h2>{currentMovie.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Director: <strong>{currentMovie.director}</strong> | IMDb:{" "}
              <strong>★ {currentMovie.imdbRating}</strong> | BO: <strong>₹{currentMovie.boxOffice} Cr</strong>
            </p>
            {currentMovie.tagline && (
              <p className="text-xs text-cream/70 italic mt-1 bg-black/20 p-1.5 rounded">
                "{currentMovie.tagline}"
              </p>
            )}
            <div className="mt-2">
              <small>Base price</small>
              <strong>{formatCr(currentMovie.basePrice)}</strong>
            </div>
          </div>
        </section>

        <section className="auction-center">
          <div className="flex items-center justify-between w-full max-w-sm mb-1">
            <GameStatus icon={<span className="live-dot" />}>Live auction</GameStatus>
            <span className="text-xs text-muted-foreground">
              Round {room.currentMovieIndex + 1} of {totalRounds}
            </span>
          </div>

          <AuctionTimer
            seconds={room.secondsRemaining}
            endTime={room.auctionEndTime}
            onTimerEnd={handleTimerExpired}
          />

          <div className="bid-readout">
            <small>Current bid</small>
            <strong key={room.currentBid} className="bid-price-animated">
              {formatCr(room.currentBid)}
            </strong>
            {bidToast && (
              <div
                key={bidToast.id}
                className="bid-toast text-xs font-bold text-gold bg-gold/15 px-3 py-1 rounded-full border border-gold/30 mt-1 shadow-md shadow-gold/10"
              >
                {bidToast.text}
              </div>
            )}
            <GameStatus icon={<Gavel size={16} />}>
              {room.currentBidderId ? (
                <span>
                  Leading: <b>{currentLeaderName}</b> {isWinning && "(You)"}
                </span>
              ) : (
                <span>Awaiting opening bid</span>
              )}
            </GameStatus>
          </div>

          {room.isSold ? (
            <div className="sold-panel bg-gradient-to-b from-panel to-panel-strong border border-gold/40 rounded-2xl p-6 shadow-2xl text-center">
              <span className="text-xs uppercase font-bold text-gold tracking-widest block mb-1">
                🔨 Gavel Down • Round Concluded
              </span>
              <h2 className="text-2xl font-black text-cream">{currentMovie.title}</h2>
              <p className="text-sm mt-2 text-cream/90">
                {room.currentBidderId ? (
                  <>
                    Acquired by <strong className="text-gold">{currentLeaderName}</strong> for{" "}
                    <strong className="text-gold">{formatCr(room.currentBid)}</strong>
                  </>
                ) : (
                  <span className="text-muted-foreground">Passed with no bids placed.</span>
                )}
              </p>
              {isHost ? (
                <button onClick={handleNextMovie} className="btn btn-primary mt-4 mx-auto flex items-center gap-2">
                  {room.currentMovieIndex + 1 >= totalRounds ? "Finalize Slate & Evaluate" : "Next Movie"}
                  <ChevronRight size={18} />
                </button>
              ) : (
                <div className="text-xs text-muted-foreground mt-3">
                  Waiting for host to proceed to round {room.currentMovieIndex + 2}...
                </div>
              )}
            </div>
          ) : (
            <div className="bidding-controls">
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm mb-2">
                <button
                  type="button"
                  className="btn btn-secondary text-xs py-2 font-bold"
                  disabled={isWinning || me.budget < room.currentBid + 1}
                  onClick={() => handleUserBid(1)}
                >
                  +₹1 Cr
                </button>
                <button
                  type="button"
                  className="btn btn-secondary text-xs py-2 font-bold"
                  disabled={isWinning || me.budget < room.currentBid + 2}
                  onClick={() => handleUserBid(2)}
                >
                  +₹2 Cr
                </button>
                <button
                  type="button"
                  className="btn btn-secondary text-xs py-2 font-bold"
                  disabled={isWinning || me.budget < room.currentBid + 5}
                  onClick={() => handleUserBid(5)}
                >
                  +₹5 Cr
                </button>
              </div>

              <BidForm
                bid={room.currentBid}
                budget={me.budget}
                disabled={isWinning}
                onBid={handleUserBid}
              />

              {isHost && (
                <button
                  type="button"
                  onClick={handlePass}
                  className="btn btn-secondary mt-3 text-xs opacity-75 hover:opacity-100"
                >
                  Conclude round now (Pass)
                </button>
              )}
            </div>
          )}

          {/* Producer 5-movie status badge */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-panel/40 px-3 py-1.5 rounded-full border border-border/50">
            <Film size={13} className="text-gold" />
            <span>Your Studio Slate:</span>
            <strong className={me.movies.length >= 5 ? "text-emerald-400" : "text-amber-300"}>
              {me.movies.length} / 5 Acquired
            </strong>
            {me.movies.length < 5 && <span className="text-[10px] text-muted-foreground">({5 - me.movies.length} more needed)</span>}
          </div>
        </section>

        <aside className="auction-sidebar">
          <div className="flex flex-col gap-2 mb-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Studio Producers</h3>
            <div className="flex flex-col gap-2">
              {room.players.map((p) => (
                <PlayerCard key={p.id} player={p} current={p.id === currentUser.id} />
              ))}
            </div>
          </div>
          <RoomChat roomCode={room.roomCode} playerName={currentUser.name} />
        </aside>
      </main>
    </Page>
  );
}

function BidForm({
  bid,
  budget,
  disabled,
  onBid,
}: {
  bid: number;
  budget: number;
  disabled: boolean;
  onBid: (amount: number) => void;
}) {
  return (
    <div className="bid-form">
      <button
        type="button"
        className="btn btn-primary font-bold shadow-md shadow-gold/10"
        disabled={disabled || bid + 1 > budget}
        onClick={() => onBid(1)}
      >
        {disabled ? "Leading Highest Bid" : `Place Bid: ${formatCr(bid + 1)}`}
      </button>
    </div>
  );
}

export function ResultsScreen({ roomCode }: { roomCode: string }) {
  const code = roomCode.toUpperCase();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(() => getOrCreateRoom(code));
  const [step, setStep] = useState<"select" | "evaluating" | "final">("select");
  const currentUser = getCurrentUser();
  const me = room?.players.find((p) => p.id === currentUser.id) || room?.players[0];

  const userWonMovies = useMemo(() => me?.movies || [], [me?.movies]);
  const [selected, setSelected] = useState<string[]>(() =>
    userWonMovies.slice(0, 5).map((m) => m.id),
  );
  const [rankings, setRankings] = useState<PlayerScore[]>([]);

  useEffect(() => {
    const activeRoom = getOrCreateRoom(code);
    setRoom(activeRoom);
    if (activeRoom.portfolioRankings && activeRoom.portfolioRankings.length > 0) {
      setRankings(activeRoom.portfolioRankings);
    }

    const unsubscribe = subscribeToMultiplayerRoom(code, (fresh) => {
      setRoom(fresh);
      if (fresh.portfolioRankings && fresh.portfolioRankings.length > 0) {
        setRankings(fresh.portfolioRankings);
      }
    });

    return () => unsubscribe();
  }, [code]);

  useEffect(() => {
    if (step !== "evaluating") return;

    let isMounted = true;
    void evaluateAllRoomPlayers(code, selected).then((evaluatedRankings) => {
      if (isMounted && evaluatedRankings?.length) {
        setRankings(evaluatedRankings);
      }
    });

    const id = window.setTimeout(() => setStep("final"), 3200);
    return () => {
      isMounted = false;
      window.clearTimeout(id);
    };
  }, [step, code, selected]);

  if (!room || !me) return null;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((val) => val !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev,
    );
  };

  const handlePlayAgain = () => {
    const refreshed = createRoom(me.name, {
      maxPlayers: room.settings.maxPlayers,
      startingBudget: room.settings.startingBudget,
      category: room.settings.category,
      auctionSeconds: room.settings.auctionSeconds,
    });
    navigate({ to: "/room/$roomCode", params: { roomCode: refreshed.roomCode } });
  };

  if (step === "evaluating") {
    return (
      <Page>
        <main className="evaluation-screen min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gold/20 border-2 border-gold flex items-center justify-center animate-pulse shadow-2xl shadow-gold/30">
              <Trophy size={48} className="text-gold" />
            </div>
            <Sparkles size={24} className="text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
          </div>

          <GameStatus icon={<Flame size={14} className="text-gold" />}>
            Grand Jury & Box Office Verdict
          </GameStatus>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-cream mt-3">
            EVALUATING YOUR<br /><span className="text-gold">STUDIO SLATE</span>
          </h1>

          <div className="evaluation-lines mt-8 flex flex-col gap-2.5 text-sm sm:text-base text-muted-foreground max-w-md">
            <span className="text-gold font-bold">✨ Aggregating IMDb critical acclaim scores...</span>
            <span>💰 Calculating Box Office ROI & commercial muscle...</span>
            <span>🎭 Auditing genre synergy & thematic slate balance...</span>
            <span>📋 Checking 5-movie minimum portfolio fulfillment...</span>
            <span>🏆 Tabulating Grand Jury Championship Leaderboard...</span>
          </div>
        </main>
      </Page>
    );
  }

  if (step === "final") {
    const winner = rankings[0] || {
      name: me.name,
      score: 88.5,
      critique: "A formidable studio portfolio showcasing high cinema craft.",
      remainingBudget: me.budget,
      playerId: me.id,
      wonCount: me.movies.length,
      rank: 1,
      avatar: me.avatar,
      breakdown: { criticalAcclaim: 36, boxOfficeRoi: 26, genreSynergy: 17, budgetEfficiency: 9 },
    };
    const isMeWinner = winner.playerId === me.id;
    const winnerRating = getStarRating(winner.score);

    return (
      <Page>
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center">
          <div className="flex flex-col items-center text-center mb-8">
            <GameStatus icon={<Trophy size={16} className="text-gold" />}>
              Official Grand Jury Championship Results
            </GameStatus>
            <h1 className="text-3xl sm:text-5xl font-black text-cream mt-2 tracking-tight">
              CHAMPIONSHIP LEADERBOARD
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-lg text-center">
              Studio portfolios evaluated across IMDb critical acclaim, commercial box office yield, genre synergy, and capital discipline.
            </p>
          </div>

          {/* AAA Winner Grand Victory Podium Card */}
          <section className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-gold/25 via-panel-strong to-black/90 border-2 border-gold p-6 sm:p-10 text-center shadow-2xl shadow-gold/15 backdrop-blur-xl">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-gold/30 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-gold to-amber-300 flex items-center justify-center shadow-xl shadow-gold/30 border-2 border-white/40">
                <Trophy size={48} className="text-black" />
              </div>
              <span className="absolute -top-2 -right-2 text-2xl">👑</span>
            </div>

            <span className="block text-xs font-black uppercase text-gold tracking-widest mb-1">
              🥇 Grand Champion Studio Head
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-cream tracking-tight">
              {winner.name} {isMeWinner && <span className="text-gold text-2xl font-bold">(You!)</span>}
            </h2>

            {/* 5-Star Emoji Rating & Score */}
            <div className="flex items-center justify-center gap-3 my-3">
              <span className="text-xl sm:text-2xl">{winnerRating.stars}</span>
              <strong className="text-4xl sm:text-6xl font-black text-gold font-mono">
                {winner.score.toFixed(1)} <span className="text-sm font-normal text-cream/70">PTS</span>
              </strong>
            </div>

            <div className="inline-block px-4 py-1 rounded-full bg-gold/20 border border-gold/40 text-xs font-bold text-gold uppercase tracking-wider mb-4">
              {winnerRating.label}
            </div>

            {winner.critique && (
              <p className="max-w-xl mx-auto text-xs sm:text-sm text-cream/90 italic bg-black/40 p-4 rounded-2xl border border-gold/30 shadow-inner leading-relaxed">
                "{winner.critique}"
              </p>
            )}
          </section>

          {/* Full Championship Standings */}
          <div className="w-full mt-10">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-2">
              <h3 className="text-lg font-black text-cream flex items-center gap-2">
                <Medal size={20} className="text-gold" /> Studio Head Rankings
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
                {rankings.length} Studios Evaluated
              </span>
            </div>

            <RankingList rankings={rankings} />
          </div>

          <div className="results-actions mt-10 flex flex-wrap justify-center gap-4">
            <button className="btn btn-primary px-8 py-3.5 text-sm sm:text-base font-bold flex items-center gap-2 shadow-xl shadow-gold/20" onClick={handlePlayAgain}>
              <RotateCcw size={18} /> Start New Season (Play Again)
            </button>
            <Link className="btn btn-secondary px-8 py-3.5 text-sm sm:text-base font-bold" to="/">
              Back to Home
            </Link>
          </div>
        </main>
      </Page>
    );
  }

  const hasWonMovies = userWonMovies.length > 0;
  const maxCanPick = Math.min(5, userWonMovies.length);

  return (
    <Page>
      <main className="top-five max-w-4xl mx-auto px-4 py-10 text-center">
        <GameStatus icon={<Film size={14} className="text-gold" />}>
          Curate your Studio Portfolio for Grand Jury Review
        </GameStatus>
        
        <h1 className="text-3xl sm:text-5xl font-black text-cream mt-2">
          CURATE YOUR FINAL SLATE
        </h1>
        
        <p className="text-muted-foreground text-sm max-w-lg mx-auto mt-2">
          {hasWonMovies
            ? `Select your top 5 films from your ${userWonMovies.length} won titles to submit for critical evaluation.`
            : "You did not acquire any films in this session. Standings will be based strictly on capital retention."}
        </p>

        {userWonMovies.length < 5 && hasWonMovies && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-xl max-w-lg mx-auto my-3">
            ⚠️ <strong>Incomplete Studio Slate ({userWonMovies.length}/5 movies):</strong> You acquired fewer than the required 5 movies. A penalty will be applied by the Grand Jury.
          </div>
        )}

        {hasWonMovies && (
          <div className="selected-count my-4 text-xs font-bold uppercase tracking-wider text-gold">
            Selected <strong className="text-lg text-cream">{selected.length} / {maxCanPick}</strong>
          </div>
        )}

        <div className="top-five-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 my-6">
          {hasWonMovies ? (
            userWonMovies.map((movie) => (
              <MovieCard
                movie={movie}
                price={movie.purchasePrice}
                selected={selected.includes(movie.id)}
                onClick={() => toggle(movie.id)}
                key={movie.id}
              />
            ))
          ) : (
            <div className="col-span-full p-8 text-center bg-panel border border-border rounded-xl">
              <p className="text-muted-foreground text-sm">
                Zero movies in your collection. You hold ₹{me.budget} Cr in unspent capital.
              </p>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary px-8 py-3.5 text-sm sm:text-base font-bold flex items-center justify-center gap-2 mx-auto shadow-xl shadow-gold/20"
          disabled={hasWonMovies && selected.length === 0}
          onClick={() => setStep("evaluating")}
        >
          Submit to Grand Jury <Check size={18} />
        </button>
      </main>
    </Page>
  );
}

function StarDot() {
  return <span className="gold-star text-gold">★</span>;
}
