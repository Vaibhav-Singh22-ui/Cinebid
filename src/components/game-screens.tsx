import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Film,
  Flame,
  Gavel,
  Info,
  LoaderCircle,
  Medal,
  Play,
  RotateCcw,
  Shield,
  Shuffle,
  Sparkles,
  Star,
  Trophy,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { RoomChat } from "@/components/room-chat";
import {
  AuctionTimer,
  EmptyMovieSlot,
  GameStatus,
  getRoleBadge,
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
  type AuctionType,
  type Movie,
  type OwnedMovie,
  type Player,
} from "@/lib/game-data";
import {
  cricketPlayers,
  isOverseasPlayer,
  getOptimalPlaying11,
  getRandomizedCricketSlate,
} from "@/lib/cricket-data";
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
  playerPassOrOut,
  resolveCurrentAuction,
  saveRoom,
  setCurrentUser,
  subscribeToMultiplayerRoom,
  type PlayerScore,
  type RoomState,
} from "@/lib/game-manager";
import { playBidSound, playGavelWinSound } from "@/lib/sound-effects";
import cinemaHero from "@/assets/cinema_hero.jpg";
import cricketHero from "@/assets/cricket_hero.jpg";

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="game-app min-h-screen flex flex-col bg-cinema text-foreground">
      <SiteHeader />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function StarDot() {
  return <span className="w-2 h-2 rounded-full bg-gold inline-block animate-pulse" />;
}

// -------------------------------------------------------------
// 1. HOME / LANDING SCREEN (CLEAN DUAL-GAME HUB)
// -------------------------------------------------------------
export function HomeScreen() {
  const navigate = useNavigate();
  const [quickCode, setQuickCode] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickError, setQuickError] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user.name && user.name !== "Player 1" && user.name !== "Franchise Owner" && user.name !== "Movie Producer") {
      setQuickName(user.name);
    }
  }, []);

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cName = quickName.trim() || "Player";
    const cCode = quickCode.trim().toUpperCase();
    if (!cCode) {
      setQuickError("Please enter a valid room code.");
      return;
    }
    setQuickLoading(true);
    setQuickError("");
    try {
      setCurrentUser({ name: cName });
      await joinRoomAsync(cCode, cName);
      navigate({ to: "/room/$roomCode", params: { roomCode: cCode } });
    } catch (err: any) {
      setQuickError(err?.message || "Failed to join room.");
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <Page>
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-10 w-full">
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-3">
          <GameStatus icon={<StarDot />}>Multiplayer Live Bidding Arenas</GameStatus>
          <h1 className="text-4xl sm:text-6xl font-black text-cream font-display tracking-tight leading-[1.08]">
            CHOOSE YOUR <span className="text-gold">AUCTION ARENA</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Two distinct high-stakes bidding experiences. Bid on legendary cinematic blockbusters or build an IPL cricket franchise squad.
          </p>
        </section>

        {/* Two Dedicated Game Portals */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* Game 1: Cinebid Movie Auction */}
          <div className="group relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-panel via-panel-strong to-black/90 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl hover:border-gold transition-all">
            <div className="flex flex-col gap-4">
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden relative shadow-lg bg-black">
                <img
                  src={cinemaHero}
                  alt="Cinebid Cinema Auction"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-4">
                  <span className="px-3 py-1 rounded-full bg-gold/20 backdrop-blur-md border border-gold/40 text-gold text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Film size={13} /> 44+ Iconic Theatrical Blockbusters
                  </span>
                </div>
              </div>

              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-cream font-display">
                  CINEBID <span className="text-gold">MOVIE AUCTION</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                  Bid in real-time on iconic Bollywood, South Pan-India, and Hollywood blockbusters. Build a 5-film studio slate, optimize IMDb critical acclaim and box office yield to win the Grand Jury Championship.
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-border/70">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Slate Size</span>
                    <strong className="text-xs font-black text-cream">5 Movies</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-border/70">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Categories</span>
                    <strong className="text-xs font-black text-gold">4 Cinema Sets</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-border/70">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Evaluation</span>
                    <strong className="text-xs font-black text-cyan-400">Grand Jury</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/create", search: { game: "cinema" } })}
                className="btn btn-primary w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-gold/20 hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Gavel size={16} /> Create Movie Auction
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/join" })}
                className="btn btn-secondary w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-border/80 bg-panel hover:bg-panel-strong font-display font-bold text-xs uppercase tracking-wider text-cream flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" /> Join Room
              </button>
            </div>
          </div>

          {/* Game 2: IPL Mega Auction */}
          <div className="group relative overflow-hidden rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-panel via-panel-strong to-black/90 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl hover:border-cyan-400 transition-all">
            <div className="flex flex-col gap-4">
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden relative shadow-lg bg-black">
                <img
                  src={cricketHero}
                  alt="IPL Mega Auction"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-4">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={13} /> 70+ Verified Cricketer Portraits & Stats
                  </span>
                </div>
              </div>

              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-cream font-display">
                  IPL MEGA <span className="text-cyan-400">AUCTION HUB</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                  High-stakes T20 franchise war-room with real cricketer portraits and stats. Build a 12-18 player squad with up to 7 overseas players. Field your best Playing 11 (max 4 overseas) and battle for the AI Championship Cup.
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-border/70">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Squad Quota</span>
                    <strong className="text-xs font-black text-cream">12–18 Players</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-border/70">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Overseas</span>
                    <strong className="text-xs font-black text-cyan-300">Max 7 (4 in 11)</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-border/70">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Tournament</span>
                    <strong className="text-xs font-black text-gold">AI Simulation</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/create", search: { game: "cricket" } })}
                className="btn btn-primary w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Gavel size={16} /> Create IPL Auction
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/join" })}
                className="btn btn-secondary w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-border/80 bg-panel hover:bg-panel-strong font-display font-bold text-xs uppercase tracking-wider text-cream flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" /> Join Room
              </button>
            </div>
          </div>
        </section>

        {/* Quick Join Bar */}
        <section className="w-full max-w-xl mx-auto p-5 rounded-3xl bg-panel/90 border border-border/80 shadow-xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Have a room invitation code?
          </span>
          <form onSubmit={handleQuickJoin} className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Your Name"
              className="w-full sm:w-1/3 px-4 py-2.5 rounded-xl bg-black/50 border border-border text-xs text-cream placeholder:text-muted-foreground"
            />
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              placeholder="Room Code (e.g. CINE-78)"
              className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-border font-mono font-bold text-xs uppercase text-gold placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={quickLoading}
              className="btn btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase flex items-center justify-center gap-1.5"
            >
              {quickLoading ? <LoaderCircle size={14} className="animate-spin" /> : <Play size={14} fill="black" />} Join
            </button>
          </form>
          {quickError && <p className="text-xs text-red-400 mt-2">{quickError}</p>}
        </section>

        {/* Showcase Previews */}
        <section className="flex flex-col gap-8">
          {/* Cinema Showcase */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-cream font-display flex items-center gap-2">
                <span>🎬</span> Featured Theatrical Masterpieces
              </h2>
              <Link to="/create" search={{ game: "cinema" }} className="text-xs text-gold hover:underline font-bold">
                Play Movie Auction →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {movies.slice(0, 6).map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          </div>

          {/* Cricket Showcase */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-cream font-display flex items-center gap-2">
                <span>🏏</span> Star IPL Cricketers & Real Stats
              </h2>
              <Link to="/create" search={{ game: "cricket" }} className="text-xs text-cyan-400 hover:underline font-bold">
                Play IPL Auction →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {cricketPlayers.slice(0, 6).map((p) => (
                <MovieCard key={p.id} movie={{ ...p, auctionType: "CRICKET" }} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Page>
  );
}

export { HomeScreen as LandingScreen };

// -------------------------------------------------------------
// 2. CREATE & JOIN FORM SCREEN (SEPARATE TABS & CLEAN WORKFLOW)
// -------------------------------------------------------------
export function GameForm({
  mode,
  initialGame,
}: {
  mode: "create" | "join";
  initialGame?: string;
}) {
  const navigate = useNavigate();
  const [auctionType, setAuctionType] = useState<AuctionType>(() => {
    if (initialGame) {
      return initialGame.toUpperCase() === "CRICKET" ? "CRICKET" : "CINEMA";
    }
    if (typeof window !== "undefined") {
      const g = new URLSearchParams(window.location.search).get("game");
      if (g?.toUpperCase() === "CRICKET") return "CRICKET";
    }
    return "CINEMA";
  });

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
    const saved = getCurrentUser();
    if (saved.name && saved.name !== "Franchise Owner" && saved.name !== "Movie Producer" && saved.name !== "Player 1") {
      setName(saved.name);
    }
    if (saved.color) setSelectedColor(saved.color);
  }, []);

  const numMax = Math.max(2, Math.min(8, Number(max) || 4));
  const numBudget = Math.max(50, Math.min(500, Number(budget) || 100));
  const numSeconds = Math.max(15, Math.min(90, Number(seconds) || 30));
  const totalItems = getRecommendedMoviePoolSize(numMax, auctionType);

  const cinemaCategories = [
    { id: "ALL", title: "🎬 All Studios & Global Cinema", desc: "Bollywood, South Pan-India, Hollywood & Masterpieces" },
    { id: "BOLLYWOOD", title: "🔥 Bollywood & Hindi Mega Hits", desc: "YRF, Dharma, Red Chillies (Jawan, Dangal, Sholay, Pathaan)" },
    { id: "SOUTH_PAN_INDIA", title: "💥 South Pan-India Epics", desc: "RRR, Baahubali 2, KGF 2, Pushpa, Kantara, Kalki 2898 AD" },
    { id: "HOLLYWOOD", title: "🚀 Hollywood & Global Blockbusters", desc: "Interstellar, Inception, Dark Knight, Oppenheimer, Titanic" },
    { id: "MASTERPIECES", title: "🏆 Critically Acclaimed Masterpieces", desc: "Tumbbad, Gangs of Wasseypur, Andhadhun, Swades, Lagaan" },
  ];

  const cricketCategories = [
    { id: "ALL", title: "🏏 Full IPL Mega Auction Pool", desc: "All Batsmen, Bowlers, All-Rounders & Wicketkeepers" },
    { id: "BATTERS", title: "🏏 Explosive Batsmen & Wicketkeepers", desc: "Top-order run machines and clutch finishers" },
    { id: "FAST_BOWLERS", title: "⚡ Express Fast Bowlers & Pacework", desc: "145+ km/h pacers and death-overs yorker specialists" },
    { id: "SPINNERS", title: "🌀 Mystery Spinners & Magicians", desc: "Wrist spinners and middle-overs control bowlers" },
    { id: "ALL_ROUNDERS", title: "⚡ Match-Winning All-Rounders", desc: "Dual-threat 3D players" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError(auctionType === "CRICKET" ? "Please enter your franchise name." : "Please enter your studio producer name.");
      return;
    }

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
            setError(`Room is full (${room.settings.maxPlayers}/${room.settings.maxPlayers} players).`);
            setLoading(false);
            return;
          }
        }
        navigate({ to: "/room/$roomCode", params: { roomCode: cleanCode } });
      } catch (err: any) {
        setError(err?.message || "Failed to join room.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Create Room
    const room = createRoom(cleanName, {
      auctionType,
      maxPlayers: numMax,
      startingBudget: numBudget,
      auctionSeconds: numSeconds,
      category,
      totalMovies: totalItems,
    });

    navigate({ to: "/room/$roomCode", params: { roomCode: room.roomCode } });
  };

  return (
    <Page>
      <main className="form-layout flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] py-8 sm:py-14 px-4 sm:px-8 w-full my-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto">
          <section className="w-full bg-panel/95 border border-border/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl text-center flex flex-col items-center">
            {/* Game Tab Switcher on Create Mode */}
            {mode === "create" ? (
              <div className="inline-flex p-1 rounded-2xl bg-black/60 border border-border mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuctionType("CINEMA");
                    setCategory("ALL");
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    auctionType === "CINEMA"
                      ? "bg-gold text-black shadow-lg shadow-gold/20"
                      : "text-muted-foreground hover:text-cream"
                  }`}
                >
                  <Film size={15} /> Movie Auction
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuctionType("CRICKET");
                    setCategory("ALL");
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    auctionType === "CRICKET"
                      ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/20"
                      : "text-muted-foreground hover:text-cream"
                  }`}
                >
                  <Zap size={15} /> IPL Mega Auction
                </button>
              </div>
            ) : (
              <div className="mb-2">
                <GameStatus icon={<StarDot />}>Join Existing Arena</GameStatus>
              </div>
            )}

            <h1 className="font-display font-black text-2xl sm:text-4xl text-cream tracking-tight">
              {mode === "join"
                ? "JOIN AUCTION ROOM"
                : auctionType === "CRICKET"
                  ? "CREATE IPL MEGA AUCTION"
                  : "CREATE MOVIE AUCTION"}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-6 max-w-md">
              {mode === "join"
                ? "Enter your bidder name and the 6-letter room code to join."
                : auctionType === "CRICKET"
                  ? "Configure your IPL franchise purse, round timer, and player pool."
                  : "Configure your movie studio budget, round timer, and film catalog."}
            </p>

            {/* Concise Rules Overview Pill */}
            {mode === "create" && (
              <div
                className={`w-full mb-6 p-3.5 rounded-2xl border text-left text-xs ${
                  auctionType === "CRICKET"
                    ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-200"
                    : "bg-gold/10 border-gold/30 text-amber-200"
                }`}
              >
                {auctionType === "CRICKET" ? (
                  <div className="flex items-center gap-2 font-bold">
                    <Info size={16} className="text-cyan-400 flex-shrink-0" />
                    <span>Squad: 12–18 players • Up to 7 overseas in squad (Max 4 in Playing 11)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-bold">
                    <Info size={16} className="text-gold flex-shrink-0" />
                    <span>Studio Slate: 5 movies per producer • Evaluated by Grand Jury on IMDb & Box Office</span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 text-left">
              {/* Name Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  {auctionType === "CRICKET" ? "Franchise Owner / Team Name" : "Studio Producer Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={auctionType === "CRICKET" ? "e.g. Mumbai Titans, Bangalore Kings" : "e.g. Dharma Studios, YRF Head"}
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-border text-sm text-cream placeholder:text-muted-foreground/60 focus:border-gold outline-none transition-all"
                  required
                />
              </div>

              {/* Join Code Input */}
              {mode === "join" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Room Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CINE-78"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-border font-mono font-black text-base text-gold uppercase tracking-widest placeholder:text-muted-foreground/60 focus:border-gold outline-none transition-all"
                    required
                  />
                </div>
              )}

              {/* Create Options */}
              {mode === "create" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Capacity */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        {auctionType === "CRICKET" ? "Franchises" : "Producers"}
                      </label>
                      <select
                        value={max}
                        onChange={(e) => setMax(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-border text-xs text-cream focus:border-gold outline-none"
                      >
                        <option value="2">2 Players</option>
                        <option value="3">3 Players</option>
                        <option value="4">4 Players (Recommended)</option>
                        <option value="5">5 Players</option>
                        <option value="6">6 Players</option>
                        <option value="8">8 Players</option>
                      </select>
                    </div>

                    {/* Purse */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Starting Purse</label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-border text-xs text-cream focus:border-gold outline-none"
                      >
                        <option value="75">₹75 Cr</option>
                        <option value="100">₹100 Cr (Official Standard)</option>
                        <option value="125">₹125 Cr</option>
                        <option value="150">₹150 Cr</option>
                        <option value="200">₹200 Cr</option>
                      </select>
                    </div>

                    {/* Timer */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Round Timer</label>
                      <select
                        value={seconds}
                        onChange={(e) => setSeconds(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-border text-xs text-cream focus:border-gold outline-none"
                      >
                        <option value="20">20s (Fast Blitz)</option>
                        <option value="30">30s (Balanced)</option>
                        <option value="45">45s (Tactical)</option>
                        <option value="60">60s (Strategic)</option>
                      </select>
                    </div>
                  </div>

                  {/* Catalog Pool Category */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      {auctionType === "CRICKET" ? "Cricketer Pool Category" : "Movie Catalog Selection"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(auctionType === "CRICKET" ? cricketCategories : cinemaCategories).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col ${
                            category === cat.id
                              ? auctionType === "CRICKET"
                                ? "bg-cyan-950/60 border-cyan-400 text-cream"
                                : "bg-gold/20 border-gold text-cream"
                              : "bg-black/30 border-border/70 hover:border-border text-muted-foreground"
                          }`}
                        >
                          <strong className="text-xs font-bold text-cream">{cat.title}</strong>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{cat.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Color Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Badge Accent Color</label>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        selectedColor === c.hex ? "scale-125 ring-2 ring-white border-white" : "border-black/50 opacity-75 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-400 font-bold">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary w-full py-3.5 mt-3 rounded-2xl font-display font-black text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 ${
                  auctionType === "CRICKET"
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-cyan-500/20"
                    : "bg-gradient-to-r from-gold to-amber-500 text-black shadow-gold/20"
                }`}
              >
                {loading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : mode === "join" ? (
                  <>
                    <Play size={16} fill="black" /> Enter Bidding Arena
                  </>
                ) : (
                  <>
                    <Gavel size={16} /> Launch {auctionType === "CRICKET" ? "IPL Auction Room" : "Movie Auction Room"}
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </main>
    </Page>
  );
}

// -------------------------------------------------------------
// 3. LOBBY SCREEN (CLEAN SEPARATION FOR MOVIE VS CRICKET)
// -------------------------------------------------------------
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

    return () => unsubscribe();
  }, [code, navigate, currentUser.id, currentUser.name]);

  const isHost = room?.hostId === currentUser.id || room?.players[0]?.id === currentUser.id;

  const copyCode = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShufflePool = () => {
    if (!room || !isHost) return;
    const poolSize = Math.max(15, room.moviePool.length);
    if (room.auctionType === "CRICKET") {
      room.moviePool = getRandomizedCricketSlate(poolSize, room.settings.category || "ALL");
    } else {
      room.moviePool = getRandomizedMovieSlate(poolSize, room.settings.category || "ALL");
    }
    saveRoom(room);
    setRoom({ ...room });
  };

  const handleStartGame = () => {
    if (!room) return;
    room.status = "AUCTION";
    room.currentMovieIndex = 0;
    const first = room.moviePool[0];
    room.currentBid = first ? first.basePrice : 1;
    room.currentBidderId = null;
    room.currentBidderName = null;
    room.secondsRemaining = room.settings.auctionSeconds;
    room.auctionEndTime = Date.now() + room.settings.auctionSeconds * 1000;
    room.isSold = false;
    room.outPlayerIds = [];
    saveRoom(room);
    navigate({ to: "/game/$roomCode", params: { roomCode: code } });
  };

  if (loading || !room) {
    return (
      <Page>
        <div className="flex-1 flex items-center justify-center py-20">
          <LoaderCircle size={40} className="animate-spin text-gold" />
        </div>
      </Page>
    );
  }

  const isCricket = room.auctionType === "CRICKET";
  const emptySlots = Math.max(0, room.settings.maxPlayers - room.players.length);

  return (
    <Page>
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-6 w-full">
        {/* Lobby Header */}
        <section className="bg-panel/90 border border-border/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="text-left">
            <GameStatus icon={<StarDot />}>
              {isCricket ? "IPL War-Room Lobby" : "Studio Cinema Lobby"}
            </GameStatus>
            <h1 className="text-3xl sm:text-4xl font-black text-cream font-display mt-2">
              {isCricket ? "🏏 IPL MEGA AUCTION LOBBY" : "🎬 FILM STUDIO LOBBY"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isCricket
                ? "Share room code with rival franchise owners to join."
                : "Share room code with rival movie producers to join."}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              Room Invitation Code
            </span>
            <div className="flex items-center gap-2">
              <span className="px-5 py-2.5 rounded-2xl bg-black/60 border border-gold/50 font-mono font-black text-2xl sm:text-3xl text-gold tracking-widest shadow-inner">
                {code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="btn btn-secondary p-3 rounded-2xl border border-border/80 hover:border-gold/50 text-cream"
                title="Copy Room Code"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </section>

        {/* Players & Chat Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Participants */}
          <div className="lg:col-span-8 bg-panel/90 border border-border/80 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-cream flex items-center gap-2">
                <Users size={16} className="text-gold" />
                {isCricket ? "Franchise Owners" : "Studio Producers"} ({room.players.length} / {room.settings.maxPlayers})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {room.players.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-black/40 border border-border/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border-2 flex-shrink-0"
                      style={p.color ? { borderColor: p.color, color: p.color } : undefined}
                    >
                      {p.avatar}
                    </span>
                    <div className="flex flex-col min-w-0 text-left">
                      <strong className="text-xs sm:text-sm font-bold text-cream truncate">
                        {p.name} {p.id === currentUser.id && "(You)"}
                      </strong>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {p.isHost ? "👑 Host" : isCricket ? "Franchise Owner" : "Studio Producer"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {Array.from({ length: emptySlots }).map((_, i) => (
                <EmptyMovieSlot key={i} />
              ))}
            </div>

            {/* Room Settings Summary */}
            <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-border/60 text-center">
              <div className="p-2 rounded-xl bg-black/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Purse</span>
                <strong className="block text-xs font-black text-gold mt-0.5">{formatCr(room.settings.startingBudget)}</strong>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Timer</span>
                <strong className="block text-xs font-black text-cream mt-0.5">{room.settings.auctionSeconds}s / Item</strong>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Auction Pool</span>
                <strong className="block text-xs font-black text-cyan-400 mt-0.5">
                  {room.moviePool.length} {isCricket ? "Cricketers" : "Movies"}
                </strong>
              </div>
            </div>

            {/* Launch Controls */}
            {isHost ? (
              <button
                type="button"
                onClick={handleStartGame}
                className="btn btn-primary w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-red to-rose-600 font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-red/30 hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Gavel size={18} /> Launch Live Auction
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-border/70 text-center text-xs text-muted-foreground mt-2">
                Waiting for host (<strong>{room.hostName}</strong>) to launch the auction...
              </div>
            )}
          </div>

          {/* Right Chat Sidebar */}
          <aside className="lg:col-span-4 flex flex-col h-full min-h-[480px]">
            <RoomChat roomCode={code} playerName={currentUser.name} className="h-full min-h-[480px] max-h-[560px]" />
          </aside>
        </section>

        {/* Catalog Preview */}
        <section className="bg-panel/90 border border-border/80 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-cream flex items-center gap-2">
              {isCricket ? "🏏 Auction Cricketer Pool Preview" : "🎬 Auction Movie Slate Preview"}
              <span className="text-xs text-gold">({room.moviePool.length} Items)</span>
            </h2>
            {isHost && (
              <button
                type="button"
                onClick={handleShufflePool}
                className="btn btn-secondary text-xs px-3 py-1.5 rounded-xl border border-gold/40 text-gold flex items-center gap-1.5"
                title="Randomize the auction pool"
              >
                <Shuffle size={14} /> Shuffle Pool
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {room.moviePool.slice(0, 12).map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        </section>
      </main>
    </Page>
  );
}

// -------------------------------------------------------------
// 4. LIVE AUCTION SCREEN (CLEAN SEPARATION: CINEMA VS CRICKET)
// -------------------------------------------------------------
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
    if (activeRoom.status !== "AUCTION") activeRoom.status = "AUCTION";
    if (!activeRoom.outPlayerIds) activeRoom.outPlayerIds = [];
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
          showBidToast(isMe ? `Your bid of ${formatCr(fresh.currentBid)} is leading!` : `${fresh.currentBidderName} bid ${formatCr(fresh.currentBid)}!`);
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
  const currentItem = room.moviePool[room.currentMovieIndex] || movies[0]!;
  if (!currentItem) return null;
  const me = room.players.find((p) => p.id === currentUser.id) || room.players[0];
  if (!me) return null;

  const isHost = room.hostId === currentUser.id || room.players[0]?.id === currentUser.id;
  const isWinning = room.currentBidderId === me.id;
  const isMeOut = room.outPlayerIds?.includes(me.id);
  const currentLeaderName = room.currentBidderName || "None yet";
  const totalRounds = Math.min(room.settings.totalMovies, room.moviePool.length);
  const isCricket = room.auctionType === "CRICKET" || Boolean(currentItem.role);

  // IPL Rule checks
  const isOverseasItem = isCricket && isOverseasPlayer(currentItem);
  const myOverseasCount = isCricket ? me.movies.filter((m) => isOverseasPlayer(m)).length : 0;
  const isSquadFull = isCricket && me.movies.length >= 18;
  const isOverseasFull = isOverseasItem && myOverseasCount >= 7;

  const handleUserBid = (increment: number) => {
    if (room.isSold || isMeOut || isSquadFull || isOverseasFull) return;
    playBidSound();
    const result = placeBid(room.roomCode, me.id, increment);
    if (result.success && result.room) {
      prevBidRef.current = result.room.currentBid;
      showBidToast(`You placed a bid of ${formatCr(result.room.currentBid)}!`);
      setRoom({ ...result.room });
    } else if (result.message) {
      showBidToast(result.message);
    }
  };

  const handleUserOutOrPass = () => {
    if (room.isSold || isMeOut || isWinning) return;
    const res = playerPassOrOut(room.roomCode, me.id);
    if (res.success && res.room) {
      setRoom({ ...res.room });
      if (res.isResolved) playGavelWinSound();
    }
  };

  const handleNextItem = () => {
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

  // State for bottom acquired bar
  const [activeRosterId, setActiveRosterId] = useState<string | null>(null);
  const activeFranchiseOrProducer = room.players.find((p) => p.id === (activeRosterId || currentUser.id)) || me;
  const displayedItems = activeFranchiseOrProducer?.movies || [];

  return (
    <Page>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-stretch w-full">
        {/* LEFT COLUMN: Item Card */}
        <section className="lg:col-span-4 xl:col-span-3 bg-panel/90 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between gap-3 h-full">
          <div className="flex flex-col gap-2.5">
            {/* Poster: 2:3 aspect ratio for Movie, 3:4 for Cricket */}
            <div className={`${isCricket ? "aspect-[3/4]" : "aspect-[2/3]"} w-full rounded-xl overflow-hidden relative shadow-inner bg-black flex-shrink-0`}>
              <Poster movie={currentItem} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col gap-1 text-left">
              {isCricket ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-gold font-bold">
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] ${getRoleBadge(currentItem.role, currentItem.genre).colorClass}`}>
                      {getRoleBadge(currentItem.role, currentItem.genre).label}
                    </span>
                    <span>•</span>
                    <span className="text-cyan-300">
                      {isOverseasItem ? `✈️ ${currentItem.country || "Overseas"}` : `🇮🇳 India`}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-cream font-display leading-tight mt-0.5">
                    {currentItem.title}
                  </h2>
                  {currentItem.stats && (
                    <div className="grid grid-cols-3 gap-1.5 mt-1 pt-2 border-t border-border/70 text-center">
                      <div className="p-1.5 rounded-lg bg-black/40 border border-border/60">
                        <span className="block text-[9px] text-muted-foreground uppercase font-bold">Matches</span>
                        <strong className="text-xs font-black text-cream">{currentItem.stats.matches}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/40 border border-border/60">
                        <span className="block text-[9px] text-muted-foreground uppercase font-bold">
                          {currentItem.stats.wickets ? "Wickets" : "T20 Runs"}
                        </span>
                        <strong className="text-xs font-black text-gold">
                          {currentItem.stats.wickets || currentItem.stats.runs || "—"}
                        </strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/40 border border-border/60">
                        <span className="block text-[9px] text-muted-foreground uppercase font-bold">
                          {currentItem.stats.economy ? "Economy" : "Strike Rate"}
                        </span>
                        <strong className="text-xs font-black text-cyan-400">
                          {currentItem.stats.economy || currentItem.stats.strikeRate || "—"}
                        </strong>
                      </div>
                    </div>
                  )}
                  {currentItem.signatureSkill && (
                    <div className="p-1.5 rounded-lg bg-gold/10 border border-gold/30 text-[10px] font-semibold text-gold flex items-center gap-1.5 mt-1">
                      <Zap size={12} className="text-gold flex-shrink-0" />
                      <span>Specialty: {currentItem.signatureSkill}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-gold font-bold">
                    <span>{currentItem.year}</span>
                    <span>•</span>
                    <span className="truncate">{currentItem.genre}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-cream font-display leading-tight mt-0.5">
                    {currentItem.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Director: <strong className="text-cream">{currentItem.director}</strong>
                  </p>
                  <div className="flex items-center gap-3 text-xs mt-0.5">
                    <span className="text-yellow-400 font-bold">★ IMDb {currentItem.imdbRating}</span>
                    <span>•</span>
                    <span className="text-gold font-bold">BO: ₹{currentItem.boxOffice} Cr</span>
                  </div>
                  {currentItem.tagline && (
                    <p className="text-[11px] text-cream/70 italic bg-black/20 p-1.5 rounded-lg mt-1">
                      "{currentItem.tagline}"
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/70 mt-auto">
            <span className="text-xs uppercase font-bold text-muted-foreground">Opening Base Price</span>
            <strong className="text-base font-black text-gold font-mono">{formatCr(currentItem.basePrice)}</strong>
          </div>
        </section>

        {/* CENTER COLUMN: Stage, Timer, Bid, Controls */}
        <section className="lg:col-span-8 xl:col-span-5 bg-panel/90 border border-border/80 rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center justify-between gap-3 shadow-xl h-full">
          <div className="w-full flex items-center justify-between">
            <GameStatus icon={<StarDot />}>
              {isCricket ? "🏏 IPL Bidding Round" : "🎬 Cinema Bidding Round"}
            </GameStatus>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              Round {room.currentMovieIndex + 1} of {totalRounds}
            </span>
          </div>

          {/* Timer */}
          <AuctionTimer
            seconds={room.secondsRemaining}
            endTime={room.auctionEndTime}
            onTimerEnd={handleTimerExpired}
          />

          {/* Current Bid Display */}
          <div className="bid-readout my-0.5 flex flex-col items-center">
            <small className="text-[11px] uppercase tracking-widest text-muted-foreground font-black">
              Current Leading Bid
            </small>
            <strong key={room.currentBid} className="bid-price-animated text-4xl sm:text-6xl font-black text-gold font-display mt-0.5">
              {formatCr(room.currentBid)}
            </strong>

            {bidToast && (
              <div
                key={bidToast.id}
                className="bid-toast text-xs font-bold text-gold bg-gold/20 px-3.5 py-1 rounded-full border border-gold/40 mt-1 shadow-md shadow-gold/10"
              >
                {bidToast.text}
              </div>
            )}

            <div className="mt-1.5">
              <GameStatus icon={<Gavel size={14} />}>
                {room.currentBidderId ? (
                  <span>
                    Leading: <b>{currentLeaderName}</b> {isWinning && "(You)"}
                  </span>
                ) : (
                  <span>Awaiting opening bid</span>
                )}
              </GameStatus>
            </div>
          </div>

          {/* Round Sold Plaque OR Active Controls */}
          {room.isSold ? (
            <div className="sold-panel w-full max-w-md bg-gradient-to-b from-panel to-panel-strong border border-gold/50 rounded-2xl p-4 sm:p-5 shadow-2xl text-center my-auto flex flex-col items-center">
              <span className="text-xs uppercase font-black text-gold tracking-widest block mb-1.5">
                🔨 Gavel Down • Round Concluded
              </span>
              <div className="w-16 h-20 rounded-xl overflow-hidden border border-gold/40 mb-2 shadow-lg">
                <Poster movie={currentItem} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-black text-cream font-display">{currentItem.title}</h2>
              <p className="text-xs mt-1 text-cream/90">
                {room.currentBidderId ? (
                  <>
                    Acquired by <strong className="text-gold">{currentLeaderName}</strong> for{" "}
                    <strong className="text-gold font-mono">{formatCr(room.currentBid)}</strong>
                  </>
                ) : (
                  <span className="text-muted-foreground">Passed with no bids placed.</span>
                )}
              </p>

              {isHost ? (
                <button
                  onClick={handleNextItem}
                  className="btn btn-primary mt-3 mx-auto px-6 py-2.5 bg-gradient-to-r from-red to-rose-600 font-bold rounded-xl flex items-center gap-2 text-xs"
                >
                  {room.currentMovieIndex + 1 >= totalRounds
                    ? isCricket ? "Finalize Playing 11 & Evaluate" : "Finalize Studio Slate & Evaluate"
                    : isCricket ? "Next Cricketer" : "Next Movie"}
                  <ChevronRight size={16} />
                </button>
              ) : (
                <div className="text-xs text-muted-foreground mt-2">
                  Waiting for room host to proceed to round {room.currentMovieIndex + 2}...
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center gap-2.5">
              {/* Warnings */}
              {isCricket && isSquadFull ? (
                <div className="w-full p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs font-bold text-center">
                  ⛔ Squad Limit Reached (18/18 players). Full squad complete!
                </div>
              ) : isCricket && isOverseasFull ? (
                <div className="w-full p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs font-bold text-center">
                  ✈️ Overseas Limit Reached (7/7 players). Cannot bid on overseas players.
                </div>
              ) : isMeOut ? (
                <div className="w-full p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold text-center">
                  🔴 You passed on this {isCricket ? "cricketer" : "movie"}.
                </div>
              ) : (
                <>
                  {/* Quick Increment Buttons */}
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <button
                      type="button"
                      className="btn btn-secondary text-xs py-2 font-bold rounded-xl hover:border-gold/50"
                      disabled={isWinning || me.budget < room.currentBid + 1}
                      onClick={() => handleUserBid(1)}
                    >
                      +₹1 Cr
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary text-xs py-2 font-bold rounded-xl hover:border-gold/50"
                      disabled={isWinning || me.budget < room.currentBid + 2}
                      onClick={() => handleUserBid(2)}
                    >
                      +₹2 Cr
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary text-xs py-2 font-bold rounded-xl hover:border-gold/50"
                      disabled={isWinning || me.budget < room.currentBid + 5}
                      onClick={() => handleUserBid(5)}
                    >
                      +₹5 Cr
                    </button>
                  </div>

                  {/* Primary Bid Button */}
                  <button
                    type="button"
                    className="btn btn-primary w-full py-3 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-gold/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isWinning || me.budget < room.currentBid + 1}
                    onClick={() => handleUserBid(1)}
                  >
                    {isWinning ? "Leading Highest Bid (You)" : `Raise Bid to ${formatCr(room.currentBid + 1)}`}
                  </button>

                  {/* Pass / Out Button */}
                  <button
                    type="button"
                    onClick={handleUserOutOrPass}
                    disabled={isWinning}
                    className="w-full py-2 px-3 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/50 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <XCircle size={14} /> Pass On This {isCricket ? "Cricketer" : "Movie"}
                  </button>
                </>
              )}

              {/* Host Quick Pass button */}
              {isHost && (
                <button
                  type="button"
                  onClick={() => {
                    const resolved = resolveCurrentAuction(room.roomCode);
                    if (resolved) setRoom({ ...resolved });
                  }}
                  className="text-[10px] text-muted-foreground hover:text-cream underline"
                >
                  Host: Conclude round immediately
                </button>
              )}
            </div>
          )}

          {/* Quota Progress Bar */}
          <div className="mt-1 flex items-center gap-2.5 text-xs text-muted-foreground bg-black/40 px-4 py-1.5 rounded-full border border-border/60 flex-wrap justify-center">
            {isCricket ? (
              <>
                <Award size={13} className="text-gold" />
                <span>Squad:</span>
                <strong className={me.movies.length >= 12 ? "text-emerald-400" : "text-amber-300"}>
                  {me.movies.length} / 18 Players (Min 12)
                </strong>
                <span>•</span>
                <span className={myOverseasCount >= 7 ? "text-amber-400 font-bold" : "text-cyan-300 font-semibold"}>
                  ✈️ {myOverseasCount} / 7 OS (Max 4 in 11)
                </span>
              </>
            ) : (
              <>
                <Film size={13} className="text-gold" />
                <span>Your Studio Slate:</span>
                <strong className={me.movies.length >= 5 ? "text-emerald-400" : "text-amber-300"}>
                  {me.movies.length} / 5 Films Acquired
                </strong>
                {me.movies.length < 5 && (
                  <span className="text-[10px] text-muted-foreground">({5 - me.movies.length} more needed)</span>
                )}
              </>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Standings & Live War-Room Chat */}
        <aside className="lg:col-span-12 xl:col-span-4 flex flex-col gap-3 min-h-0">
          <div className="bg-panel/90 border border-border/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-black">
                {isCricket ? "Franchise Bidders Status" : "Studio Producers Status"}
              </h3>
              <span className="text-[10px] text-muted-foreground">Live Room</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
              {room.players.map((p) => {
                const isLeading = p.id === room.currentBidderId;
                const isOut = room.outPlayerIds?.includes(p.id);
                return (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    current={p.id === currentUser.id}
                    isLeading={isLeading}
                    isOut={isOut}
                    isCricket={isCricket}
                  />
                );
              })}
            </div>
          </div>

          <RoomChat
            roomCode={room.roomCode}
            playerName={currentUser.name}
            className="h-[430px] lg:h-[450px] max-h-[450px]"
          />
        </aside>

        {/* BOTTOM SECTION: AUCTION BAR & REAL-TIME ACQUIRED TRAY */}
        <section className="lg:col-span-12 bg-panel/90 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3 mt-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
                {isCricket ? <Award size={18} /> : <Film size={18} />}
              </span>
              <div className="flex flex-col text-left">
                <h3 className="text-sm font-black text-cream uppercase tracking-wider font-display flex items-center gap-2">
                  {activeFranchiseOrProducer?.id === currentUser.id
                    ? isCricket ? "My Acquired Squad" : "My Studio Slate"
                    : isCricket ? `${activeFranchiseOrProducer?.name}'s Squad` : `${activeFranchiseOrProducer?.name}'s Slate`}
                  <span className="text-xs font-mono font-bold text-gold">
                    ({displayedItems.length} {isCricket ? "/ 18 Players" : "/ 5 Films"})
                  </span>
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Purse Available: <strong className="text-gold font-mono">{formatCr(activeFranchiseOrProducer?.budget || 0)}</strong>
                  {isCricket && ` • ✈️ ${displayedItems.filter((m) => isOverseasPlayer(m)).length}/7 Overseas`}
                </span>
              </div>
            </div>

            {/* Switcher Tabs */}
            {room.players.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {room.players.map((p) => {
                  const isSelected = p.id === (activeRosterId || currentUser.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveRosterId(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                        isSelected
                          ? "bg-gold text-black shadow-md shadow-gold/20 font-black"
                          : "bg-black/40 text-cream/80 hover:bg-black/70 border border-border/60"
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span className="truncate max-w-[110px]">{p.id === currentUser.id ? "Me" : p.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-mono">
                        {p.movies.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acquired Items Grid */}
          {displayedItems.length === 0 ? (
            <div className="p-8 rounded-xl bg-black/20 border border-dashed border-border/60 text-center flex flex-col items-center justify-center gap-2">
              {isCricket ? <Award size={28} className="text-muted-foreground/40" /> : <Film size={28} className="text-muted-foreground/40" />}
              <p className="text-xs text-muted-foreground">
                {isCricket
                  ? "No cricketers acquired yet. Win live bidding rounds to build your franchise squad!"
                  : "No movies acquired yet. Win live bidding rounds to build your studio slate!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
              {displayedItems.map((item, idx) => {
                const role = getRoleBadge(item.role, item.genre);
                const isOverseas = isCricket && isOverseasPlayer(item);
                return (
                  <div
                    key={`${item.id}_${idx}`}
                    className="group bg-black/50 border border-border/70 hover:border-gold/50 rounded-xl p-2.5 flex flex-col gap-2 transition-all shadow-md"
                  >
                    <div className={`${isCricket ? "aspect-[3/4]" : "aspect-[2/3]"} w-full rounded-lg overflow-hidden relative shadow-inner bg-black`}>
                      <Poster movie={item} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-mono font-bold text-gold border border-gold/30">
                        {formatCr(item.purchasePrice || item.basePrice)}
                      </span>
                    </div>

                    <div className="flex flex-col text-left">
                      <strong className="text-xs font-bold text-cream truncate" title={item.title}>
                        {item.title}
                      </strong>

                      {isCricket ? (
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border truncate ${role.colorClass}`}>
                            {role.label}
                          </span>
                          <span className="text-[10px] flex-shrink-0" title={isOverseas ? "Overseas Player" : "Indian Player"}>
                            {isOverseas ? "✈️" : "🇮🇳"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                          <span className="text-yellow-400 font-bold">★ {item.imdbRating}</span>
                          <span className="truncate max-w-[80px]">{item.genre}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </Page>
  );
}

// -------------------------------------------------------------
// 5. RESULTS SCREEN (DEDICATED SLATE / PLAYING 11 & LEADERBOARD)
// -------------------------------------------------------------
export function ResultsScreen({ roomCode }: { roomCode: string }) {
  const code = roomCode.toUpperCase();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(() => getOrCreateRoom(code));
  const [step, setStep] = useState<"select" | "evaluating" | "final">("select");
  const currentUser = getCurrentUser();
  const me = room?.players.find((p) => p.id === currentUser.id) || room?.players[0];

  const userWonItems = useMemo(() => me?.movies || [], [me?.movies]);
  const isCricket = room?.auctionType === "CRICKET" || userWonItems.some((m) => m.auctionType === "CRICKET" || m.role);

  // Default optimal selection
  const initialOptimal = useMemo(() => {
    if (isCricket) return getOptimalPlaying11(userWonItems);
    return { playing11: userWonItems.slice(0, 5).map((m) => m.id) };
  }, [isCricket, userWonItems]);

  const [selected, setSelected] = useState<string[]>(() => initialOptimal.playing11);
  const [captainId, setCaptainId] = useState<string | undefined>(() => initialOptimal.captainId);
  const [viceCaptainId, setViceCaptainId] = useState<string | undefined>(() => initialOptimal.viceCaptainId);
  const [notice, setNotice] = useState<string>("");
  const [rankings, setRankings] = useState<PlayerScore[]>([]);

  useEffect(() => {
    const activeRoom = getOrCreateRoom(code);
    setRoom(activeRoom);
    if (activeRoom.portfolioRankings && activeRoom.portfolioRankings.length > 0) {
      setRankings(activeRoom.portfolioRankings);
      setStep("final");
    }

    const unsubscribe = subscribeToMultiplayerRoom(code, (fresh) => {
      setRoom(fresh);
      if (fresh.portfolioRankings && fresh.portfolioRankings.length > 0) {
        setRankings(fresh.portfolioRankings);
        setStep("final");
      }
    });

    return () => unsubscribe();
  }, [code]);

  useEffect(() => {
    if (step !== "evaluating") return;
    let isMounted = true;
    const runEvaluation = async () => {
      try {
        const scores = await evaluateAllRoomPlayers(code, selected);
        if (isMounted) {
          setRankings(scores);
          setStep("final");
        }
      } catch {
        if (isMounted) setStep("final");
      }
    };
    void runEvaluation();
    return () => {
      isMounted = false;
    };
  }, [step, code, selected]);

  const maxSelectable = isCricket ? Math.min(11, Math.max(1, userWonItems.length)) : Math.min(5, Math.max(1, userWonItems.length));

  const selectedItems = useMemo(
    () => userWonItems.filter((item) => selected.includes(item.id)),
    [userWonItems, selected],
  );

  const selectedOverseasCount = useMemo(
    () => selectedItems.filter((m) => isOverseasPlayer(m)).length,
    [selectedItems],
  );

  const toggleSelect = (item: OwnedMovie) => {
    setNotice("");
    if (selected.includes(item.id)) {
      if (selected.length <= 1) return;
      setSelected(selected.filter((id) => id !== item.id));
      if (captainId === item.id) setCaptainId(undefined);
      if (viceCaptainId === item.id) setViceCaptainId(undefined);
    } else {
      if (selected.length >= maxSelectable) {
        setNotice(isCricket ? "Playing 11 is full (11/11). Click an existing player to swap." : "Maximum 5 films selected for studio slate.");
        return;
      }
      if (isCricket && isOverseasPlayer(item) && selectedOverseasCount >= 4) {
        setNotice("Overseas Quota (Max 4): You already have 4 foreign players in your Playing 11.");
        return;
      }
      setSelected([...selected, item.id]);
    }
  };

  const handleAutoPick = () => {
    const optimal = getOptimalPlaying11(userWonItems);
    setSelected(optimal.playing11);
    setCaptainId(optimal.captainId);
    setViceCaptainId(optimal.viceCaptainId);
    setNotice("⚡ Optimal Playing 11 selected (Balanced roles, Max 4 Overseas).");
  };

  return (
    <Page>
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 w-full flex flex-col items-center">
        {step === "select" && (
          <section className="w-full flex flex-col items-center text-center">
            <GameStatus icon={<StarDot />}>
              {isCricket ? "Championship XI Selection" : "Curate Your Studio Slate"}
            </GameStatus>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-cream tracking-tight mt-2">
              {isCricket ? "SUBMIT YOUR PLAYING 11" : "CURATE YOUR FINAL SLATE"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl">
              {isCricket
                ? "Select your 11 match-winners from your squad. Max 4 overseas players. AI will simulate the tournament!"
                : "Select your top 5 films from your acquired titles to submit for Grand Jury evaluation."}
            </p>

            {/* Incomplete Movie Slate Warning */}
            {!isCricket && userWonItems.length < 5 && userWonItems.length > 0 && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-xl max-w-lg mx-auto my-3">
                ⚠️ <strong>Incomplete Studio Slate ({userWonItems.length}/5 movies):</strong> You acquired fewer than the required 5 movies. A penalty will be applied during scoring.
              </div>
            )}

            {/* Cricket Playing 11 Bar */}
            {isCricket && userWonItems.length > 0 && (
              <div className="w-full my-4 p-4 rounded-2xl bg-panel/90 border border-gold/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-muted-foreground">Playing 11:</span>
                    <span className={`text-sm font-black ${selected.length === 11 ? "text-emerald-400" : "text-gold"}`}>
                      {selected.length} / {maxSelectable} Selected
                    </span>
                  </div>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${selectedOverseasCount > 4 ? "bg-red-950/80 border-red-500 text-red-300" : "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"}`}>
                    ✈️ {selectedOverseasCount} / 4 Overseas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoPick}
                  className="btn btn-secondary text-xs px-3 py-2 rounded-xl border border-gold/40 text-gold hover:bg-gold/10 font-bold flex items-center gap-1.5 flex-shrink-0"
                >
                  <Sparkles size={14} /> Smart Auto-Pick XI
                </button>
              </div>
            )}

            {!isCricket && userWonItems.length > 0 && (
              <div className="my-3 text-xs font-bold uppercase tracking-wider text-gold">
                Selected <strong className="text-lg text-cream">{selected.length} / {maxSelectable}</strong>
              </div>
            )}

            {notice && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-semibold mb-3 flex items-center gap-2">
                <AlertCircle size={15} /> {notice}
              </div>
            )}

            {userWonItems.length === 0 ? (
              <div className="p-8 rounded-2xl bg-panel/80 border border-border mt-6 text-muted-foreground text-sm">
                No items acquired during this session. Evaluation will be based on preserved budget.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 mt-4 w-full">
                {userWonItems.map((item) => (
                  <MovieCard
                    key={item.id}
                    movie={item}
                    price={item.purchasePrice}
                    selected={selected.includes(item.id)}
                    isCaptain={isCricket && captainId === item.id}
                    isViceCaptain={isCricket && viceCaptainId === item.id}
                    onClick={() => toggleSelect(item)}
                    onMakeCaptain={(e) => {
                      e.stopPropagation();
                      setCaptainId(captainId === item.id ? undefined : item.id);
                      if (viceCaptainId === item.id) setViceCaptainId(undefined);
                    }}
                    onMakeViceCaptain={(e) => {
                      e.stopPropagation();
                      setViceCaptainId(viceCaptainId === item.id ? undefined : item.id);
                      if (captainId === item.id) setCaptainId(undefined);
                    }}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={userWonItems.length > 0 && selected.length === 0}
              onClick={() => setStep("evaluating")}
              className="btn btn-primary mt-8 px-10 py-4 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-gold/20 hover:brightness-110 flex items-center gap-2"
            >
              <Trophy size={18} /> {isCricket ? "Submit Playing 11 for Championship Scoring" : "Submit Studio Slate to Grand Jury"}
            </button>
          </section>
        )}

        {step === "evaluating" && (
          <section className="py-16 flex flex-col items-center gap-4 text-center">
            <LoaderCircle size={56} className="animate-spin text-gold" />
            <h2 className="font-display font-black text-2xl sm:text-3xl text-cream">
              {isCricket ? "SIMULATING IPL CHAMPIONSHIP TOURNAMENT..." : "GRAND JURY IS EVALUATING STUDIO SLATES..."}
            </h2>
            <div className="flex flex-col gap-2 text-xs sm:text-sm text-muted-foreground max-w-md">
              {isCricket ? (
                <>
                  <span className="text-cyan-400 font-bold">🏏 Simulating top-order batting intent & strike rates...</span>
                  <span>🎯 Auditing express bowling variety & death overs economy...</span>
                  <span>⚡ Checking overseas quota balance & tactical depth...</span>
                  <span>🏆 Tabulating IPL Franchise Championship Leaderboard...</span>
                </>
              ) : (
                <>
                  <span className="text-gold font-bold">✨ Aggregating IMDb critical acclaim scores...</span>
                  <span>💰 Calculating Box Office ROI & commercial yield...</span>
                  <span>🎭 Auditing genre synergy & thematic balance...</span>
                  <span>🏆 Tabulating Grand Jury Championship Leaderboard...</span>
                </>
              )}
            </div>
          </section>
        )}

        {step === "final" && (
          <section className="w-full flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={20} className="text-gold" />
              <GameStatus>Grand Championship Podium</GameStatus>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-cream tracking-tight">
              {isCricket ? "IPL CHAMPIONSHIP LEADERBOARD" : "GRAND JURY LEADERBOARD"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-lg">
              {isCricket
                ? "Official standings simulated across batting firepower, bowling lethality, team balance, and purse discipline."
                : "Official standings evaluated across critical acclaim, commercial box office yield, genre synergy, and purse discipline."}
            </p>

            <RankingList players={room?.players ?? []} rankings={rankings} isCricket={isCricket} />

            <div className="flex items-center gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate({ to: "/create", search: { game: isCricket ? "cricket" : "cinema" } })}
                className="btn btn-primary px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red to-rose-600 font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-red/25 flex items-center gap-2"
              >
                <RotateCcw size={16} /> Start New Auction
              </button>
            </div>
          </section>
        )}
      </main>
    </Page>
  );
}
