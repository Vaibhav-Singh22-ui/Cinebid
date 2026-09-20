import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Edit3,
  Film,
  Flame,
  Gavel,
  Info,
  ListFilter,
  LoaderCircle,
  Lock,
  Medal,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Shield,
  Shuffle,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Users,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomChat } from "@/components/room-chat";
import {
  AuctionTimer,
  AuctionTopTabs,
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
  getOptimalMovieSlate,
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
  bumpRoomVersion,
  createRoom,
  evaluateAllRoomPlayers,
  fetchRemoteRoom,
  forceStartEvaluation,
  getCurrentUser,
  getIplBiddingSlab,
  getIplNextMinBid,
  getOrCreateRoom,
  getRoom,
  joinRoom,
  joinRoomAsync,
  placeBid,
  playerPassOrOut,
  resolveCurrentAuction,
  saveRoom,
  setCurrentUser,
  submitPlayerSlate,
  subscribeToMultiplayerRoom,
  unsubmitPlayerSlate,
  togglePauseAuction,
  updateAuctionTimer,
  saveTournamentState,
  type PlayerScore,
  type RoomState,
} from "@/lib/game-manager";
import {
  playBidSound,
  playChaChingSound,
  playSoldCelebrationSound,
  playUnsoldSadHornSound,
  playDramaticTickSound,
  playOutbidWarningSound,
  playMemeAirhornSound,
  playGavelWinSound,
} from "@/lib/sound-effects";
import {
  initializeIplTournament,
  simulateMatch,
  type TournamentState,
  type MatchFixture,
  type PointsTableEntry,
} from "@/lib/cricket-tournament-simulator";
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
                onClick={() => navigate({ to: "/join", search: { game: "cinema" } })}
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
                onClick={() => navigate({ to: "/join", search: { game: "cricket" } })}
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
              placeholder="Room Code (e.g. IPL-88 or CINE-78)"
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
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCode(val);
                      if (val.startsWith("IPL")) {
                        setAuctionType("CRICKET");
                      } else if (val.startsWith("CINE")) {
                        setAuctionType("CINEMA");
                      }
                    }}
                    placeholder="e.g. IPL-88 or CINE-78"
                    maxLength={12}
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
        if (!isUserIn && remote.players.length < (remote.settings?.maxPlayers || 8)) {
          void joinRoomAsync(code, currentUser.name).then((joined) => {
            if (isMounted) setRoom(joined);
          }).catch(() => {
            if (isMounted) setRoom(remote);
          });
        } else {
          setRoom(remote);
        }
      } else {
        const local = getRoom(code);
        setRoom(local);
      }
      setLoading(false);
    });

    const unsubscribe = subscribeToMultiplayerRoom(code, (fresh) => {
      setRoom(fresh);
      setLoading(false);
      if (fresh.status === "AUCTION") {
        navigate({ to: "/game/$roomCode", params: { roomCode: code } });
      }
    });

    return () => unsubscribe();
  }, [code, navigate, currentUser.id, currentUser.name]);

  const isHost = room?.hostId === currentUser.id;

  const copyCode = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShufflePool = () => {
    if (!room || !isHost) return;
    const poolSize = Math.max(15, room.moviePool.length);
    if (room.auctionType === "CRICKET" || code.startsWith("IPL")) {
      room.moviePool = getRandomizedCricketSlate(poolSize, room.settings.category || "ALL");
    } else {
      room.moviePool = getRandomizedMovieSlate(poolSize, room.settings.category || "ALL");
    }
    bumpRoomVersion(room);
    saveRoom(room);
    setRoom({ ...room });
  };

  const handleStartGame = () => {
    if (!room || !isHost) return;
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
    bumpRoomVersion(room);
    saveRoom(room);
    navigate({ to: "/game/$roomCode", params: { roomCode: code } });
  };

  if (loading && !room) {
    return (
      <Page>
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center gap-4">
          <LoaderCircle size={44} className="animate-spin text-gold" />
          <h2 className="text-xl font-black tracking-wider uppercase text-foreground">
            Connecting to Arena {code}...
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Contacting the host and synchronizing the real-time auction room. Stand by.
          </p>
        </div>
      </Page>
    );
  }

  if (!room) {
    return (
      <Page>
        <div className="flex-1 flex flex-col items-center justify-center py-28 text-center gap-5 max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-3xl font-black">
            !
          </div>
          <h2 className="text-2xl font-black text-cream font-display">Auction Room Not Found</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Room <span className="font-mono font-bold text-gold">{code}</span> does not exist or has expired. Make sure the host has created the auction room and verify your code.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="btn btn-secondary px-5 py-3 rounded-2xl border border-border text-xs font-bold uppercase cursor-pointer"
            >
              Back to Arenas
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/join" })}
              className="btn btn-primary px-5 py-3 rounded-2xl bg-gold text-black text-xs font-black uppercase cursor-pointer"
            >
              Try Another Code
            </button>
          </div>
        </div>
      </Page>
    );
  }

  const isCricket = room.auctionType === "CRICKET" || code.startsWith("IPL");
  const emptySlots = Math.max(0, room.settings.maxPlayers - room.players.length);
  const [lobbyTab, setLobbyTab] = useState<"ROOM" | "ROSTER" | "RULES">("ROOM");

  return (
    <Page>
      {/* Top Header Tabs with Popups */}
      <AuctionTopTabs
        moviePool={room.moviePool}
        players={room.players}
        currentMovieIndex={0}
        auctionType={isCricket ? "CRICKET" : "CINEMA"}
        roomCode={room.roomCode}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 w-full">
        {/* Lobby Header */}
        <section className="bg-panel/90 border border-border/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-gold/10 via-transparent to-transparent pointer-events-none" />

          <div className="text-left relative z-10">
            <GameStatus icon={<StarDot />}>
              {isCricket ? "IPL War-Room Lobby" : "Studio Cinema Lobby"}
            </GameStatus>
            <h1 className="text-3xl sm:text-4xl font-black text-cream font-display mt-2">
              {isCricket ? "🏏 IPL MEGA AUCTION LOBBY" : "🎬 FILM STUDIO LOBBY"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
              {isCricket
                ? "Franchises assemble! Inspect the full player pool, check foreign quotas, and prepare for live bidding."
                : "Studio chiefs assemble! Inspect the cinema catalogue and formulate your bidding strategy."}
            </p>

            {/* Quick Action: Open Full Catalogue */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => setLobbyTab((prev) => (prev === "ROSTER" ? "ROOM" : "ROSTER"))}
                className="btn btn-secondary px-4 py-2.5 rounded-2xl border border-gold/40 text-gold hover:bg-gold/15 font-black text-xs flex items-center gap-2 shadow-md shadow-gold/5 cursor-pointer"
              >
                <ListFilter size={15} />
                <span>{lobbyTab === "ROSTER" ? "Hide Player List" : `📋 Browse All ${room.moviePool.length} ${isCricket ? "Cricketers" : "Movies"}`}</span>
              </button>

              <button
                type="button"
                onClick={() => setLobbyTab((prev) => (prev === "RULES" ? "ROOM" : "RULES"))}
                className="px-4 py-2.5 rounded-2xl border border-border/80 text-cream/90 hover:bg-black/40 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <BookOpen size={14} className="text-cyan-400" />
                <span>{lobbyTab === "RULES" ? "Back to Room" : "Official Rules"}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5 relative z-10">
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
                className="btn btn-secondary p-3 rounded-2xl border border-border/80 hover:border-gold/50 text-cream cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </section>

        {/* EXPANDABLE FULL CATALOGUE / ROSTER TAB */}
        {lobbyTab === "ROSTER" && (
          <section className="bg-panel/95 border border-gold/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-cream font-display uppercase tracking-wider flex items-center gap-2">
                  <ListFilter className="text-gold" size={20} />
                  <span>Full {isCricket ? "Cricketer Auction Pool" : "Movie Slate Catalogue"} ({room.moviePool.length} Items)</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Browse opening base prices, specialty roles, and stats before the live bidding war starts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLobbyTab("ROOM")}
                className="px-3.5 py-1.5 rounded-xl border border-border/80 hover:border-gold/50 text-xs font-bold text-cream"
              >
                Close Catalogue ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[580px] overflow-y-auto pr-1.5">
              {room.moviePool.map((item) => (
                <MovieCard key={item.id} movie={item} />
              ))}
            </div>
          </section>
        )}

        {/* EXPANDABLE RULES TAB */}
        {lobbyTab === "RULES" && (
          <section className="bg-panel/95 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h2 className="text-lg font-black text-cream font-display uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="text-cyan-400" size={20} />
                <span>Official Auction Rules & IPL Tournament Guidelines</span>
              </h2>
              <button
                type="button"
                onClick={() => setLobbyTab("ROOM")}
                className="px-3 py-1 rounded-xl border border-border/80 text-xs text-cream"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-black/40 border border-gold/30 flex flex-col gap-2">
                <strong className="text-gold font-bold uppercase text-xs">Purse & Squad Composition</strong>
                <ul className="list-disc list-inside text-cream/90 flex flex-col gap-1.5">
                  <li>Purse: <strong>₹{room.settings.startingBudget}.00 Cr</strong> per franchise.</li>
                  <li>Squad Size: <strong>12 to 18 players</strong>.</li>
                  <li>Overseas Quota: Max <strong>7 foreign players</strong> in squad.</li>
                  <li>Playing 11 Overseas Limit: Max <strong>4 overseas players</strong> in match XI.</li>
                  <li>Mandatory Wicketkeeper: At least 1 wicketkeeper required in match XI.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/30 flex flex-col gap-2">
                <strong className="text-cyan-400 font-bold uppercase text-xs">IPL Tournament End Result</strong>
                <p className="text-cream/90">
                  Matches are simulated using AI with realistic T20 scorecards, followed by the IPL Playoffs:
                </p>
                <ul className="list-disc list-inside text-cream/90 flex flex-col gap-1.5 mt-1">
                  <li>League Stage: Round-robin with Points Table (PTS & NRR).</li>
                  <li>Playoffs: Qualifier 1 (#1 vs #2), Eliminator (#3 vs #4), Qualifier 2, and Grand Final!</li>
                  <li>Orange Cap (Runs) & Purple Cap (Wickets) awards.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

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
  const prevBidderIdRef = useRef<string | null>(room?.currentBidderId ?? null);
  const lastSoldSoundRoundRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showBidToast = (text: string) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setBidToast({ id: String(Date.now()), text });
    toastTimeoutRef.current = window.setTimeout(() => {
      setBidToast(null);
    }, 2200);
  };

  useEffect(() => {
    let isMounted = true;

    // Immediately fetch authoritative room state from remote database
    void fetchRemoteRoom(code).then((remote) => {
      if (!isMounted) return;
      if (remote) {
        const isUserIn = remote.players.some((p) => p.id === currentUser.id);
        if (!isUserIn && remote.players.length < (remote.settings?.maxPlayers || 8)) {
          void joinRoomAsync(code, currentUser.name).then((joined) => {
            if (isMounted) {
              setRoom(joined);
              prevBidRef.current = joined.currentBid;
              prevBidderIdRef.current = joined.currentBidderId;
            }
          }).catch(() => {
            if (isMounted) {
              setRoom(remote);
              prevBidRef.current = remote.currentBid;
              prevBidderIdRef.current = remote.currentBidderId;
            }
          });
        } else {
          setRoom(remote);
          prevBidRef.current = remote.currentBid;
          prevBidderIdRef.current = remote.currentBidderId;
        }
      }
    });

    const activeRoom = getRoom(code);
    if (activeRoom) {
      const isRoomHost = activeRoom.hostId === currentUser.id;
      // ONLY the host initializes the auction timer / status
      if (isRoomHost) {
        if (activeRoom.status !== "AUCTION") activeRoom.status = "AUCTION";
        if (!activeRoom.outPlayerIds) activeRoom.outPlayerIds = [];
        if (!activeRoom.auctionEndTime && !activeRoom.isSold) {
          activeRoom.auctionEndTime = Date.now() + (activeRoom.secondsRemaining || 30) * 1000;
          bumpRoomVersion(activeRoom);
          saveRoom(activeRoom);
        }
      } else {
        const isUserIn = activeRoom.players.some((p) => p.id === currentUser.id);
        if (!isUserIn && activeRoom.players.length < (activeRoom.settings?.maxPlayers || 8)) {
          void joinRoomAsync(code, currentUser.name).then((joined) => {
            if (isMounted) {
              setRoom(joined);
              prevBidRef.current = joined.currentBid;
              prevBidderIdRef.current = joined.currentBidderId;
            }
          });
          return;
        }
      }
      setRoom(activeRoom);
      prevBidRef.current = activeRoom.currentBid;
      prevBidderIdRef.current = activeRoom.currentBidderId;
    }

    const unsubscribe = subscribeToMultiplayerRoom(code, (fresh) => {
      // 1. Play celebration or horn when an item is concluded (once per round on all clients)
      if (fresh.isSold && lastSoldSoundRoundRef.current !== fresh.currentMovieIndex) {
        lastSoldSoundRoundRef.current = fresh.currentMovieIndex;
        if (fresh.currentBidderId) {
          playSoldCelebrationSound();
        } else {
          playUnsoldSadHornSound();
        }
      } else if (!fresh.isSold) {
        // Reset sound tracker for new round
        if (lastSoldSoundRoundRef.current === fresh.currentMovieIndex) {
          lastSoldSoundRoundRef.current = null;
        }
      }

      // 2. Bid sound and outbid alerts
      if (prevBidRef.current !== null && fresh.currentBid > prevBidRef.current && !fresh.isSold) {
        if (fresh.currentBid >= 10 || (prevBidRef.current && fresh.currentBid - prevBidRef.current >= 2)) {
          playChaChingSound();
        } else {
          playBidSound();
        }

        // Outbid alert if previously leading
        if (prevBidderIdRef.current === currentUser.id && fresh.currentBidderId !== currentUser.id) {
          playOutbidWarningSound();
        }

        if (fresh.currentBidderName) {
          const isMe = fresh.currentBidderId === currentUser.id;
          showBidToast(isMe ? `Your bid of ${formatCr(fresh.currentBid)} is leading!` : `${fresh.currentBidderName} bid ${formatCr(fresh.currentBid)}!`);
        }
      }
      if (!prevBidRef.current || fresh.currentBid !== prevBidRef.current) {
        prevBidRef.current = fresh.currentBid;
      }
      prevBidderIdRef.current = fresh.currentBidderId;
      setRoom(fresh);
      if (fresh.status === "TOP_FIVE" || fresh.status === "EVALUATING" || fresh.status === "RESULTS") {
        navigate({ to: "/results/$roomCode", params: { roomCode: code } });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, [code, navigate, currentUser.id]);

  const handleTogglePause = () => {
    if (!room || !isHost) return;
    const updated = togglePauseAuction(room.roomCode);
    if (updated) {
      setRoom({ ...updated });
    }
  };

  const handleTimerExpired = () => {
    // Only the host resolves the auction! Non-hosts wait for authoritative resolution.
    if (!isHost) return;
    const latest = getRoom(code);
    if (!latest || latest.isSold || latest.status !== "AUCTION" || latest.isPaused) return;
    const resolved = resolveCurrentAuction(latest.roomCode);
    if (resolved) {
      if (lastSoldSoundRoundRef.current !== resolved.currentMovieIndex) {
        lastSoldSoundRoundRef.current = resolved.currentMovieIndex;
        if (resolved.currentBidderId) {
          playSoldCelebrationSound();
        } else {
          playUnsoldSadHornSound();
        }
      }
      setRoom({ ...resolved });
    }
  };

  if (!room || !room.moviePool || room.moviePool.length === 0) {
    return (
      <Page>
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center gap-4">
          <LoaderCircle size={44} className="animate-spin text-gold" />
          <h2 className="text-xl font-black tracking-wider uppercase text-foreground">
            Synchronizing Authoritative Auction Slate...
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Connecting to host and syncing the real-time player pool. Stand by.
          </p>
        </div>
      </Page>
    );
  }

  const currentItem = room.moviePool[room.currentMovieIndex] || room.moviePool[0];
  if (!currentItem) return null;

  let me = room.players.find((p) => p.id === currentUser.id);
  if (!me) {
    me = room.players.find((p) => p.name.toLowerCase() === currentUser.name.toLowerCase());
  }
  if (!me) {
    me = {
      id: currentUser.id,
      name: currentUser.name || "Franchise Owner",
      budget: room.settings?.startingBudget || 100,
      initialBudget: room.settings?.startingBudget || 100,
      movies: [],
      isHost: false,
      isBot: false,
      avatar: currentUser.avatar || "CB",
      color: currentUser.color || "#2563eb",
      ready: true,
    };
  }

  const isHost = room.hostId === currentUser.id;
  const isWinning = room.currentBidderId === me.id;
  const isMeOut = room.outPlayerIds?.includes(me.id);
  const currentLeaderName = room.currentBidderName || "None yet";
  const totalRounds = Math.min(room.settings.totalMovies, room.moviePool.length);
  const isCricket =
    room.auctionType === "CRICKET" ||
    code.startsWith("IPL") ||
    currentItem.auctionType === "CRICKET" ||
    Boolean(currentItem.role);

  // IPL Rule checks
  const isOverseasItem = isCricket && isOverseasPlayer(currentItem);
  const myMovies = me?.movies || [];
  const myOverseasCount = isCricket ? myMovies.filter((m) => isOverseasPlayer(m)).length : 0;
  const isSquadFull = isCricket && myMovies.length >= 18;
  const isOverseasFull = isOverseasItem && myOverseasCount >= 7;

  const handleUserBid = (increment: number) => {
    if (room.isSold || room.isPaused || isMeOut || isSquadFull || isOverseasFull) return;
    const targetBid = room.currentBid + increment;
    if (targetBid >= 10 || increment >= 2) {
      playChaChingSound();
    } else {
      playBidSound();
    }
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
    if (room.isSold || room.isPaused || isMeOut || isWinning) return;
    const res = playerPassOrOut(room.roomCode, me.id);
    if (res.success && res.room) {
      showBidToast("🔴 You passed and marked OUT for this round.");
      setRoom({ ...res.room });
      if (res.isResolved) {
        if (lastSoldSoundRoundRef.current !== res.room.currentMovieIndex) {
          lastSoldSoundRoundRef.current = res.room.currentMovieIndex;
          if (res.room.currentBidderId) {
            playSoldCelebrationSound();
          } else {
            playUnsoldSadHornSound();
          }
        }
      }
    }
  };

  const handleNextItem = () => {
    if (!isHost) return;
    const maxRounds = Math.min(room.settings.totalMovies, room.moviePool.length);
    if (room.currentMovieIndex + 1 >= maxRounds) {
      room.status = "TOP_FIVE";
      bumpRoomVersion(room);
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

  // Auto-advance directly to next player when sold/unsold without manual click
  const [autoAdvanceSec, setAutoAdvanceSec] = useState<number | null>(null);

  useEffect(() => {
    if (!room?.isSold) {
      setAutoAdvanceSec(null);
      return;
    }

    setAutoAdvanceSec(3);
    const interval = window.setInterval(() => {
      setAutoAdvanceSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          window.clearInterval(interval);
          if (isHost) {
            handleNextItem();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [room?.isSold, room?.currentMovieIndex, isHost]);

  const [activeRosterId, setActiveRosterId] = useState<string | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [manualSecondsInput, setManualSecondsInput] = useState("10");
  const [customBidInput, setCustomBidInput] = useState("");

  // Active roster selection: null defaults to currentUser, "ALL" for whole room, or specific playerId
  const targetPlayerId = (!activeRosterId || activeRosterId === "ALL") ? currentUser.id : activeRosterId;
  const activeFranchiseOrProducer = room.players.find((p) => p.id === targetPlayerId) || me;
  const isViewingSelf = activeFranchiseOrProducer.id === currentUser.id;
  const displayedItems = activeFranchiseOrProducer?.movies || [];

  const handleUpdateTimer = (seconds: number, isExtension = false) => {
    if (!room || !isHost) return;
    const updated = updateAuctionTimer(room.roomCode, seconds, isExtension);
    if (updated) {
      setRoom({ ...updated });
      showBidToast(isExtension ? `Timer extended by +${seconds}s!` : `Timer updated to ${seconds}s!`);
    }
  };

  const handleCustomBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customBidInput.trim());
    if (isNaN(val) || val <= 0) {
      showBidToast("Please enter a valid bid amount in ₹ Crores.");
      return;
    }
    const target = Math.round(val * 100) / 100;
    if (target > me.budget) {
      showBidToast(`Insufficient budget (${formatCr(me.budget)} available).`);
      return;
    }
    if (target <= room.currentBid && room.currentBidderId !== null) {
      showBidToast(`Bid must be higher than current bid of ${formatCr(room.currentBid)}.`);
      return;
    }
    if (target >= 10) playChaChingSound();
    else playBidSound();
    const result = placeBid(room.roomCode, me.id, target, true);
    if (result.success && result.room) {
      prevBidRef.current = result.room.currentBid;
      showBidToast(`Custom bid placed: ${formatCr(result.room.currentBid)}!`);
      setRoom({ ...result.room });
      setCustomBidInput("");
    } else if (result.message) {
      showBidToast(result.message);
    }
  };

  // IPL dynamic slab calculation
  const isOpeningBid = room.currentBidderId === null;
  const iplSlabInfo = isCricket ? getIplNextMinBid(room.currentBid, isOpeningBid, currentItem.basePrice) : null;
  const iplCurrentSlab = isCricket ? getIplBiddingSlab(room.currentBid) : null;

  // Derive live sales/unsold history for marquee stream
  const recentSales = useMemo(() => {
    const list: { title: string; buyerName?: string; price?: number; isUnsold: boolean }[] = [];
    const maxIdx = room.isSold ? room.currentMovieIndex : room.currentMovieIndex - 1;
    for (let i = 0; i <= maxIdx; i++) {
      const item = room.moviePool[i];
      if (!item) continue;
      let foundOwner: { name: string; price: number } | null = null;
      for (const p of (room.players || [])) {
        const owned = (p.movies || []).find((m) => m.id === item.id);
        if (owned) {
          foundOwner = { name: p.name, price: owned.purchasePrice || room.currentBid };
          break;
        }
      }
      if (foundOwner) {
        list.push({ title: item.title, buyerName: foundOwner.name, price: foundOwner.price, isUnsold: false });
      } else {
        list.push({ title: item.title, isUnsold: true });
      }
    }
    return list.reverse();
  }, [room.moviePool, room.currentMovieIndex, room.isSold, room.players, room.currentBid]);

  // Aggregate all purchases across every franchise in the room
  const allRoomPurchases = useMemo(() => {
    const list: { movie: OwnedMovie; buyer: Player }[] = [];
    for (const p of (room.players || [])) {
      for (const m of (p.movies || [])) {
        list.push({ movie: m, buyer: p });
      }
    }
    return list;
  }, [room.players]);

  const activeSpent = useMemo(() => {
    return displayedItems.reduce((sum, m) => sum + (m.purchasePrice || m.basePrice || 0), 0);
  }, [displayedItems]);

  const activeOverseasCount = useMemo(() => {
    return isCricket ? displayedItems.filter((m) => isOverseasPlayer(m)).length : 0;
  }, [displayedItems, isCricket]);

  // Squad role categorization for cricket mode (computed for currently inspected franchise)
  const squadBatters = useMemo(() => displayedItems.filter((m) => m.role?.toLowerCase().includes("bat") || m.genre?.toLowerCase().includes("bat")), [displayedItems]);
  const squadAllRounders = useMemo(() => displayedItems.filter((m) => m.role?.toLowerCase().includes("all") || m.genre?.toLowerCase().includes("all")), [displayedItems]);
  const squadBowlers = useMemo(() => displayedItems.filter((m) => m.role?.toLowerCase().includes("bowl") || m.genre?.toLowerCase().includes("bowl")), [displayedItems]);
  const squadWks = useMemo(() => displayedItems.filter((m) => m.role?.toLowerCase().includes("wicket") || m.role?.toLowerCase().includes("keeper") || m.genre?.toLowerCase().includes("wk")), [displayedItems]);

  // Sort franchises for right rail: current user first or by remaining purse
  const sortedFranchises = useMemo(() => {
    return [...room.players].sort((a, b) => {
      if (a.id === me.id) return -1;
      if (b.id === me.id) return 1;
      return b.budget - a.budget;
    });
  }, [room.players, me.id]);

  return (
    <Page>
      {/* Top Header Tabs with Popups */}
      <AuctionTopTabs
        moviePool={room.moviePool}
        players={room.players}
        currentMovieIndex={room.currentMovieIndex}
        auctionType={isCricket ? "CRICKET" : "CINEMA"}
        roomCode={room.roomCode}
        isPaused={room.isPaused}
        onTogglePause={isHost ? handleTogglePause : undefined}
        onUpdateTimer={isHost ? handleUpdateTimer : undefined}
        isHost={isHost}
      />

      <main className="max-w-[1500px] mx-auto px-3 sm:px-5 py-3 sm:py-4 grid grid-cols-1 lg:grid-cols-12 gap-3 xl:gap-4 items-stretch w-full">
        {/* LEFT COLUMN: Clean Stadium Player Profile (Inspired by iplauction.fun) */}
        <section className="lg:col-span-3 xl:col-span-3 bg-panel/95 border border-border/80 rounded-2xl p-4 shadow-2xl flex flex-col justify-between gap-2.5 h-full">
          <div className="flex flex-col gap-2">
            {isCricket ? (
              <>
                {/* Circular Portrait Headshot with Ambient Glow (NO OVERLAY BUTTONS) */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-full overflow-hidden border-2 border-indigo-500/40 ring-4 ring-indigo-500/15 shadow-2xl relative bg-slate-950 flex items-center justify-center flex-shrink-0 mt-1">
                  <Poster movie={currentItem} className="w-full h-full object-cover object-top rounded-full" />
                </div>

                {/* Player Name */}
                <h2 className="text-lg sm:text-xl font-black text-cream font-display uppercase tracking-wide text-center mt-2 leading-tight">
                  {currentItem.title}
                </h2>

                {/* Subtitle: Role & Nationality */}
                <p className="text-xs font-semibold text-muted-foreground text-center capitalize -mt-1">
                  {currentItem.role || currentItem.genre || "All-rounder"} • {isOverseasItem ? (currentItem.country || "OVERSEAS") : "INDIAN"}
                </p>

                {/* PLAYER RATING */}
                <div className="rounded-xl bg-black/40 border border-border/70 p-2 text-center mt-1">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold block mb-0.5">
                    PLAYER RATING
                  </span>
                  <strong className="text-base font-black text-cream font-mono">
                    {currentItem.imdbRating ? Math.round(currentItem.imdbRating * 10) : 85} / 100
                  </strong>
                </div>

                {/* RECENT IPL STATS */}
                <div className="rounded-xl bg-black/40 border border-border/70 p-2.5 text-left">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold block text-center mb-1.5">
                    RECENT IPL STATS
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground text-[10px]">RUNS</span>
                      <strong className="text-cream">{currentItem.stats?.runs ?? (currentItem.role?.includes("Bowler") ? 18 : 260)}</strong>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground text-[10px]">S.R</span>
                      <strong className="text-cyan-400">{currentItem.stats?.strikeRate ?? (currentItem.role?.includes("Bowler") ? 112 : 141)}</strong>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground text-[10px]">H.S</span>
                      <strong className="text-cream">{currentItem.stats?.highestScore ?? (currentItem.role?.includes("Bowler") ? "28*" : "89*")}</strong>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground text-[10px]">WKTS</span>
                      <strong className="text-gold">{currentItem.stats?.wickets ?? (currentItem.role?.includes("Bowler") ? 16 : 1)}</strong>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground text-[10px]">B.AVG</span>
                      <strong className="text-cream">{currentItem.stats?.wickets ? "22.5" : "—"}</strong>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground text-[10px]">ECON</span>
                      <strong className="text-cyan-400">{currentItem.stats?.economy ?? (currentItem.role?.includes("Bowler") ? "7.8" : "8.6")}</strong>
                    </div>
                  </div>
                </div>

                {/* BASE PRICE */}
                <div className="rounded-xl bg-black/40 border border-border/70 p-2 text-center">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold block mb-0.5">
                    BASE PRICE
                  </span>
                  <strong className="text-base font-black text-gold font-mono">
                    {formatCr(currentItem.basePrice)}
                  </strong>
                </div>

                {/* CATEGORY */}
                <div className="rounded-xl bg-black/40 border border-border/70 p-1.5 text-center">
                  <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold block">
                    CATEGORY
                  </span>
                  <strong className="text-xs font-black text-cream/90 uppercase tracking-wider">
                    {currentItem.genre || "MINI AUCTION POOL"}
                  </strong>
                </div>
              </>
            ) : (
              <>
                {/* Cinema Mode Standard Poster */}
                <div className="aspect-[2/3] w-full rounded-xl overflow-hidden relative shadow-inner bg-black flex-shrink-0">
                  <Poster movie={currentItem} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-1 text-left">
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
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/70 mt-auto">
                  <span className="text-xs uppercase font-bold text-muted-foreground">Opening Base Price</span>
                  <strong className="text-base font-black text-gold font-mono">{formatCr(currentItem.basePrice)}</strong>
                </div>
              </>
            )}
          </div>
        </section>

        {/* CENTER COLUMN: Live Stage, Huge Bid Numeral, Bid Button & Squad View */}
        <section className="lg:col-span-6 xl:col-span-6 bg-panel/95 border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center justify-between gap-3 shadow-2xl h-full">
          {/* Top Stage Header & Round Info */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-xs font-black uppercase tracking-wider text-cream font-display">
                {isCricket ? "🏏 IPL LIVE AUCTION" : "🎬 CINEMA AUCTION"}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-muted-foreground px-2.5 py-0.5 rounded-full bg-black/40 border border-border/60">
              Round {room.currentMovieIndex + 1} of {totalRounds}
            </span>
          </div>

          {/* Clock Timer */}
          <div className="my-1">
            <AuctionTimer
              seconds={room.secondsRemaining}
              endTime={room.auctionEndTime}
              onTimerEnd={handleTimerExpired}
              isPaused={room.isPaused}
            />
          </div>

          {/* Host Clock Adjustment Toolbar */}
          {isHost && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center py-1 px-3 rounded-xl bg-black/50 border border-border/60">
              <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
                <Timer size={11} className="text-gold" /> Host Clock:
              </span>
              <button
                type="button"
                onClick={() => handleUpdateTimer(10)}
                className="px-2 py-0.5 rounded-lg bg-panel hover:bg-gold/20 border border-border/70 hover:border-gold text-[10px] font-mono font-bold text-cream hover:text-gold cursor-pointer transition-all"
                title="Set timer to 10 seconds"
              >
                10s
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTimer(15)}
                className="px-2 py-0.5 rounded-lg bg-panel hover:bg-gold/20 border border-border/70 hover:border-gold text-[10px] font-mono font-bold text-cream hover:text-gold cursor-pointer transition-all"
                title="Set timer to 15 seconds"
              >
                15s
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTimer(30)}
                className="px-2 py-0.5 rounded-lg bg-panel hover:bg-gold/20 border border-border/70 hover:border-gold text-[10px] font-mono font-bold text-cream hover:text-gold cursor-pointer transition-all"
                title="Set timer to 30 seconds"
              >
                30s
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTimer(10, true)}
                className="px-2 py-0.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 cursor-pointer transition-all"
                title="Add 10 seconds to current clock"
              >
                +10s
              </button>
              <button
                type="button"
                onClick={() => setShowTimerModal(true)}
                className="px-2 py-0.5 rounded-lg bg-gold/10 hover:bg-gold/20 border border-gold/40 text-[10px] font-bold text-gold cursor-pointer transition-all flex items-center gap-1"
                title="Set custom seconds"
              >
                <Edit3 size={10} /> Custom...
              </button>
            </div>
          )}

          {/* Strategic Time-Out Banner if Paused */}
          {room.isPaused && (
            <div className="w-full p-2.5 rounded-xl bg-amber-950/90 border border-amber-500 text-amber-300 font-bold text-xs flex items-center justify-between gap-2 shadow-xl animate-pulse">
              <div className="flex items-center gap-2">
                <Pause size={15} className="text-amber-400" />
                <span>⏸️ STRATEGIC TIME-OUT • AUCTION PAUSED</span>
              </div>
              {isHost && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-black text-xs hover:brightness-110 cursor-pointer"
                >
                  Resume ▶
                </button>
              )}
            </div>
          )}

          {/* Huge Current Bid Readout (iplauction.fun stadium style) */}
          <div className="bid-readout my-1 flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              CURRENT BID
            </span>
            <strong key={room.currentBid} className="text-5xl sm:text-6xl xl:text-7xl font-black text-gold font-display tracking-tight my-0.5">
              {formatCr(room.currentBid)}
            </strong>

            {bidToast && (
              <div
                key={bidToast.id}
                className="bid-toast text-xs font-bold text-gold bg-gold/20 px-3.5 py-1 rounded-full border border-gold/40 my-1 shadow-md shadow-gold/10"
              >
                {bidToast.text}
              </div>
            )}

            <div className="text-xs font-semibold text-muted-foreground mt-0.5 flex items-center gap-1.5">
              {room.currentBidderId ? (
                <span>
                  LEADING: <strong className="text-gold font-bold">{currentLeaderName}</strong> {isWinning && "(YOU)"}
                </span>
              ) : (
                <span>↑ BASE PRICE — No bids yet</span>
              )}
            </div>
          </div>

          {/* Round Concluded Plaque OR Active Bid Console */}
          {room.isSold ? (
            <div className="sold-panel w-full bg-gradient-to-b from-panel to-panel-strong border border-gold/50 rounded-2xl p-4 shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
              <span className="text-xs uppercase font-black text-gold tracking-widest block mb-1">
                🔨 GAVEL DOWN • ROUND CONCLUDED
              </span>
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/40 mb-1.5 shadow-lg">
                <Poster movie={currentItem} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-lg font-black text-cream font-display">{currentItem.title}</h2>
              <p className="text-xs mt-0.5 text-cream/90">
                {room.currentBidderId ? (
                  <>
                    Acquired by <strong className="text-gold font-bold">{currentLeaderName}</strong> for{" "}
                    <strong className="text-gold font-mono font-black">{formatCr(room.currentBid)}</strong>
                  </>
                ) : (
                  <span className="text-red-400 font-bold">Passed with no bids placed (UNSOLD).</span>
                )}
              </p>

              {/* Automatic Direct Transition Pill */}
              <div className="mt-2.5 px-3 py-1 rounded-full bg-black/60 border border-gold/40 text-gold text-xs font-bold flex items-center gap-2 shadow-inner">
                <LoaderCircle size={13} className="animate-spin text-gold" />
                <span>
                  {autoAdvanceSec !== null && autoAdvanceSec > 0
                    ? `Next ${isCricket ? "cricketer" : "movie"} coming directly in ${autoAdvanceSec}s...`
                    : `Loading next ${isCricket ? "cricketer" : "movie"} directly...`}
                </span>
              </div>

              {/* Host Skip / Instant Next Button */}
              {isHost && (
                <button
                  type="button"
                  onClick={handleNextItem}
                  className="btn btn-primary mt-2 mx-auto px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold rounded-xl flex items-center gap-1.5 text-xs cursor-pointer shadow-lg hover:brightness-110"
                >
                  <span>Next Now (Skip Wait) →</span>
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              {/* Bidding Controls / Warnings */}
              {isCricket && isSquadFull ? (
                <div className="w-full p-3 rounded-2xl bg-amber-950/60 border border-amber-500/60 text-amber-300 text-xs font-bold text-center flex flex-col items-center gap-1 shadow-md">
                  <span className="font-black text-sm text-gold">⛔ SQUAD LIMIT REACHED (18/18 PLAYERS)</span>
                  <span className="text-[11px] text-amber-200/80">Your franchise roster is 100% full. You cannot bid on any more cricketers.</span>
                </div>
              ) : isCricket && isOverseasFull ? (
                <div className="w-full p-3 rounded-2xl bg-amber-950/60 border border-amber-500/60 text-amber-300 text-xs font-bold text-center flex flex-col items-center gap-1 shadow-md">
                  <span className="font-black text-sm text-cyan-400">✈️ OVERSEAS QUOTA FULL (7/7 PLAYERS)</span>
                  <span className="text-[11px] text-amber-200/80">You have reached the maximum allowed overseas players (7/7).</span>
                </div>
              ) : isMeOut ? (
                <div className="w-full p-2.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs font-bold text-center">
                  🔴 You called OUT / Passed for this {isCricket ? "cricketer" : "movie"}.
                </div>
              ) : (
                <>
                  {/* Primary High-Impact BID Action with Purse Left Badge (iplauction.fun style) */}
                  {(() => {
                    const nextTargetBid = isCricket
                      ? (iplSlabInfo?.nextBid ?? (room.currentBid + 0.20))
                      : room.currentBid + 1;
                    const canAfford = me.budget >= nextTargetBid;
                    const disabled = room.isPaused || isWinning || !canAfford;

                    return (
                      <div className="w-full flex items-stretch gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isCricket) {
                              if (isOpeningBid) {
                                handleUserBid(currentItem.basePrice);
                              } else if (iplSlabInfo) {
                                const inc = Math.round((iplSlabInfo.nextBid - room.currentBid) * 100) / 100;
                                handleUserBid(inc);
                              }
                            } else {
                              handleUserBid(1);
                            }
                          }}
                          disabled={disabled}
                          className="flex-1 py-3.5 sm:py-4 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-black text-lg sm:text-xl uppercase tracking-wider shadow-xl shadow-red-950/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5 border border-red-400/40"
                        >
                          <Gavel size={20} />
                          <span>
                            {room.isPaused
                              ? "Clock Paused"
                              : isWinning
                                ? "Leading Bid (You)"
                                : isOpeningBid
                                  ? `BID ${formatCr(currentItem.basePrice)}`
                                  : `BID ${formatCr(nextTargetBid)}`}
                          </span>
                        </button>

                        {/* PURSE LEFT Pill */}
                        <div className="px-4 py-2 rounded-2xl bg-black/60 border border-border/80 flex flex-col items-center justify-center min-w-[110px] flex-shrink-0">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                            PURSE LEFT
                          </span>
                          <strong className="text-sm font-black text-gold font-mono">
                            {formatCr(me.budget)}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tactical Jump Buttons & Custom Bid Input */}
                  {isCricket ? (
                    <div className="w-full flex flex-col gap-1.5">
                      <div className="grid grid-cols-4 gap-1.5 w-full">
                        {(() => {
                          const baseInc = iplCurrentSlab?.increment || 0.20;
                          const jump1Inc = Math.round(baseInc * 100) / 100;
                          const jump2Inc = Math.round(baseInc * 2 * 100) / 100;
                          const jump3Inc = 1.00;
                          const jump4Inc = 2.00;

                          return (
                            <>
                              <button
                                type="button"
                                disabled={room.isPaused || isWinning || me.budget < room.currentBid + jump1Inc}
                                onClick={() => handleUserBid(jump1Inc)}
                                className="py-1.5 px-1 rounded-xl bg-panel border border-border/80 hover:border-gold/60 text-[11px] font-mono font-bold text-cream hover:text-gold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed text-center"
                                title={`Slab increment (+₹${(jump1Inc * 100).toFixed(0)} Lakh)`}
                              >
                                +₹{(jump1Inc * 100).toFixed(0)}L
                              </button>
                              <button
                                type="button"
                                disabled={room.isPaused || isWinning || me.budget < room.currentBid + jump2Inc}
                                onClick={() => handleUserBid(jump2Inc)}
                                className="py-1.5 px-1 rounded-xl bg-panel border border-border/80 hover:border-gold/60 text-[11px] font-mono font-bold text-cream hover:text-gold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed text-center"
                                title={`Double slab (+₹${(jump2Inc * 100).toFixed(0)} Lakh)`}
                              >
                                +₹{(jump2Inc * 100).toFixed(0)}L
                              </button>
                              <button
                                type="button"
                                disabled={room.isPaused || isWinning || me.budget < room.currentBid + jump3Inc}
                                onClick={() => handleUserBid(jump3Inc)}
                                className="py-1.5 px-1 rounded-xl bg-panel border border-border/80 hover:border-gold/60 text-[11px] font-mono font-bold text-cream hover:text-gold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed text-center"
                                title="War Jump +₹1.00 Cr"
                              >
                                +₹1.0 Cr
                              </button>
                              <button
                                type="button"
                                disabled={room.isPaused || isWinning || me.budget < room.currentBid + jump4Inc}
                                onClick={() => handleUserBid(jump4Inc)}
                                className="py-1.5 px-1 rounded-xl bg-panel border border-border/80 hover:border-gold/60 text-[11px] font-mono font-bold text-cream hover:text-gold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed text-center"
                                title="Mega Jump +₹2.00 Cr"
                              >
                                +₹2.0 Cr
                              </button>
                            </>
                          );
                        })()}
                      </div>

                      {/* Custom Bid Input Form */}
                      <form onSubmit={handleCustomBidSubmit} className="flex items-center gap-1.5 w-full">
                        <input
                          type="number"
                          step="0.05"
                          min={room.currentBid ? (room.currentBid + 0.1).toFixed(2) : currentItem.basePrice.toFixed(2)}
                          max={me.budget}
                          value={customBidInput}
                          onChange={(e) => setCustomBidInput(e.target.value)}
                          placeholder={`Custom bid in ₹ Cr (Min: ${formatCr(iplSlabInfo?.nextBid || currentItem.basePrice)})`}
                          disabled={room.isPaused || isWinning}
                          className="flex-1 bg-black/60 border border-border/70 focus:border-gold rounded-xl px-3 py-1.5 text-xs font-mono text-cream placeholder:text-muted-foreground/60 outline-none disabled:opacity-30"
                        />
                        <button
                          type="submit"
                          disabled={room.isPaused || isWinning || !customBidInput.trim()}
                          className="px-3 py-1.5 rounded-xl bg-gold/20 hover:bg-gold border border-gold/50 text-gold hover:text-black font-bold text-xs font-display uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                        >
                          Bid
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* Cinema Mode Standard Quick Increments */
                    <div className="grid grid-cols-3 gap-1.5 w-full">
                      <button
                        type="button"
                        className="btn btn-secondary text-xs py-1.5 font-bold rounded-xl cursor-pointer"
                        disabled={room.isPaused || isWinning || me.budget < room.currentBid + 1}
                        onClick={() => handleUserBid(1)}
                      >
                        +₹1 Cr
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary text-xs py-1.5 font-bold rounded-xl cursor-pointer"
                        disabled={room.isPaused || isWinning || me.budget < room.currentBid + 2}
                        onClick={() => handleUserBid(2)}
                      >
                        +₹2 Cr
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary text-xs py-1.5 font-bold rounded-xl cursor-pointer"
                        disabled={room.isPaused || isWinning || me.budget < room.currentBid + 5}
                        onClick={() => handleUserBid(5)}
                      >
                        +₹5 Cr
                      </button>
                    </div>
                  )}

                  {/* Pass / Out Button */}
                  {!isWinning && !isMeOut && (
                    <button
                      type="button"
                      onClick={handleUserOutOrPass}
                      disabled={room.isPaused}
                      className="w-full py-2 px-3 rounded-xl border border-red-500/30 bg-red-950/30 hover:bg-red-900/50 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <XCircle size={14} /> Pass & Mark OUT For This {isCricket ? "Cricketer" : "Movie"}
                    </button>
                  )}
                </>
              )}

              {/* Live Bidder Status Alert (IN / OUT indicator) - ALWAYS VISIBLE */}
              <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/50 border border-border/70 text-xs">
                <div className="flex items-center gap-1.5">
                  {isMeOut ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                      🔴 YOU ARE OUT (Passed)
                    </span>
                  ) : isCricket && isSquadFull ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                      ⛔ SQUAD FULL (18/18)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                      🟢 YOU ARE IN (Active Bidder)
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-muted-foreground font-bold">
                  {room.players.filter((p) => !room.outPlayerIds?.includes(p.id)).length} / {room.players.length} Active Teams
                </span>
              </div>

              {/* HOST CONTROLS - ALWAYS VISIBLE FOR HOST EVEN IF HOST SQUAD IS FULL (18/18) OR HOST PASSED */}
              {isHost && (
                <div className="w-full flex flex-col gap-2 pt-1 border-t border-border/60">
                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={handleTogglePause}
                      className="flex-1 py-2 px-3 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Strategic Time-Out"
                    >
                      {room.isPaused ? <Play size={13} /> : <Pause size={13} />}
                      <span>{room.isPaused ? "Resume Auction" : "Strategic Time-Out (Pause)"}</span>
                    </button>
                  </div>

                  {/* Host Conclude Round Immediately (Hammer Down) */}
                  <button
                    type="button"
                    onClick={() => {
                      const resolved = resolveCurrentAuction(room.roomCode);
                      if (resolved) {
                        if (lastSoldSoundRoundRef.current !== resolved.currentMovieIndex) {
                          lastSoldSoundRoundRef.current = resolved.currentMovieIndex;
                          if (resolved.currentBidderId) {
                            playSoldCelebrationSound();
                          } else {
                            playUnsoldSadHornSound();
                          }
                        }
                        setRoom({ ...resolved });
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-gold/50 bg-gradient-to-r from-gold/20 via-amber-500/20 to-gold/20 hover:bg-gold/30 text-gold font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:border-gold hover:shadow-gold/10"
                    title="End this round immediately and declare the winner or unsold"
                  >
                    <Gavel size={14} />
                    <span>Host: Conclude Round Immediately (Hammer Down)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SQUAD CONTAINER (Centralized as shown in iplauction.fun screenshot, interactive franchise inspection) */}
          <div className="w-full bg-black/50 border border-border/70 rounded-2xl p-3 sm:p-3.5 text-left mt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg flex-shrink-0">{activeFranchiseOrProducer.avatar}</span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-black text-cream uppercase tracking-wide font-display">
                      {isViewingSelf
                        ? isCricket ? "MY ACQUIRED SQUAD" : "MY STUDIO SLATE"
                        : isCricket ? `${activeFranchiseOrProducer.name.toUpperCase()} SQUAD` : `${activeFranchiseOrProducer.name.toUpperCase()} SLATE`}
                    </h3>
                    {isViewingSelf ? (
                      <span className="text-[9px] font-bold text-gold px-1.5 py-0.2 rounded bg-gold/15 border border-gold/30">
                        YOU
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center gap-1">
                        👁️ INSPECTING
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <span>
                      {isViewingSelf
                        ? "Your acquisitions stay visible here. Click any franchise to inspect their buys."
                        : `Inspecting ${activeFranchiseOrProducer.name}'s squad. Click below or right rail to change.`}
                    </span>
                    {!isViewingSelf && (
                      <button
                        type="button"
                        onClick={() => setActiveRosterId(currentUser.id)}
                        className="text-[10px] font-bold text-gold hover:underline cursor-pointer flex-shrink-0"
                      >
                        ← Back to My Squad
                      </button>
                    )}
                  </p>
                </div>
              </div>

              {/* Squad Quotas */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="px-2 py-0.5 rounded-lg bg-black/60 border border-border/60 text-center">
                  <span className="block text-[8px] uppercase tracking-wider text-muted-foreground font-bold">PLAYERS</span>
                  <strong className="text-xs font-black text-cream font-mono">
                    {displayedItems.length}/{isCricket ? "18" : "5"}
                  </strong>
                </div>
                {isCricket && (
                  <div className="px-2 py-0.5 rounded-lg bg-black/60 border border-border/60 text-center">
                    <span className="block text-[8px] uppercase tracking-wider text-muted-foreground font-bold">OVERSEAS</span>
                    <strong className="text-xs font-black text-cyan-300 font-mono">{activeOverseasCount}/7</strong>
                  </div>
                )}
                <div className="px-2 py-0.5 rounded-lg bg-black/60 border border-border/60 text-center">
                  <span className="block text-[8px] uppercase tracking-wider text-muted-foreground font-bold">SPENT</span>
                  <strong className="text-xs font-black text-gold font-mono">{formatCr(activeSpent)}</strong>
                </div>
                <div className="px-2 py-0.5 rounded-lg bg-black/60 border border-border/60 text-center">
                  <span className="block text-[8px] uppercase tracking-wider text-muted-foreground font-bold">PURSE LEFT</span>
                  <strong className="text-xs font-black text-emerald-400 font-mono">{formatCr(activeFranchiseOrProducer.budget)}</strong>
                </div>
              </div>
            </div>

            {/* Quick Franchise Switcher Tabs inside Central Squad Container */}
            {room.players.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 border-b border-border/40 scrollbar-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex-shrink-0 flex items-center gap-1">
                  <Users size={11} className="text-gold" /> Switch Roster:
                </span>
                {room.players.map((p) => {
                  const isSelected = p.id === activeFranchiseOrProducer.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveRosterId(p.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-gold text-black shadow-md shadow-gold/20 font-black"
                          : "bg-black/40 text-cream/80 hover:bg-black/70 border border-border/60 hover:border-gold/40"
                      }`}
                      title={`Inspect ${p.name}'s purchases`}
                    >
                      <span>{p.avatar}</span>
                      <span className="truncate max-w-[85px]">{p.id === currentUser.id ? "Me" : p.name}</span>
                      <span className="px-1 py-0.2 rounded-full bg-black/40 text-[9px] font-mono">
                        {(p.movies || []).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Role Breakdown Roster / Acquired List */}
            {displayedItems.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1">
                <span>
                  {isViewingSelf
                    ? `No ${isCricket ? "cricketers" : "movies"} acquired yet. Win live bidding rounds to build your ${isCricket ? "franchise" : "studio"}!`
                    : `${activeFranchiseOrProducer.name} has not acquired any ${isCricket ? "cricketers" : "movies"} yet.`}
                </span>
              </div>
            ) : isCricket ? (
              <div className="flex flex-col gap-2 pt-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {squadBatters.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1 mb-1">
                      🏏 BATTER ({squadBatters.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {squadBatters.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-1.5 rounded-xl bg-black/40 border border-border/50 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-cyan-400/40">
                              <Poster movie={item} className="w-full h-full object-cover" />
                            </span>
                            <span className="font-bold text-cream truncate">{item.title}</span>
                            {isOverseasPlayer(item) && <span className="text-[10px]" title="Overseas">✈️</span>}
                          </div>
                          <span className="font-mono font-bold text-gold flex-shrink-0 ml-1">
                            {formatCr(item.purchasePrice || item.basePrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {squadAllRounders.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1 mb-1">
                      ⚡ ALL-ROUNDER ({squadAllRounders.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {squadAllRounders.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-1.5 rounded-xl bg-black/40 border border-border/50 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-amber-400/40">
                              <Poster movie={item} className="w-full h-full object-cover" />
                            </span>
                            <span className="font-bold text-cream truncate">{item.title}</span>
                            {isOverseasPlayer(item) && <span className="text-[10px]" title="Overseas">✈️</span>}
                          </div>
                          <span className="font-mono font-bold text-gold flex-shrink-0 ml-1">
                            {formatCr(item.purchasePrice || item.basePrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {squadBowlers.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1 mb-1">
                      🎯 BOWLER ({squadBowlers.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {squadBowlers.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-1.5 rounded-xl bg-black/40 border border-border/50 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-rose-400/40">
                              <Poster movie={item} className="w-full h-full object-cover" />
                            </span>
                            <span className="font-bold text-cream truncate">{item.title}</span>
                            {isOverseasPlayer(item) && <span className="text-[10px]" title="Overseas">✈️</span>}
                          </div>
                          <span className="font-mono font-bold text-gold flex-shrink-0 ml-1">
                            {formatCr(item.purchasePrice || item.basePrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {squadWks.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1 mb-1">
                      🧤 WICKET-KEEPER ({squadWks.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {squadWks.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-1.5 rounded-xl bg-black/40 border border-border/50 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-purple-400/40">
                              <Poster movie={item} className="w-full h-full object-cover" />
                            </span>
                            <span className="font-bold text-cream truncate">{item.title}</span>
                            {isOverseasPlayer(item) && <span className="text-[10px]" title="Overseas">✈️</span>}
                          </div>
                          <span className="font-mono font-bold text-gold flex-shrink-0 ml-1">
                            {formatCr(item.purchasePrice || item.basePrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Cinema Mode Movie Slate List */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {displayedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-border/50 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-6 h-8 rounded overflow-hidden flex-shrink-0 border border-gold/40">
                        <Poster movie={item} className="w-full h-full object-cover" />
                      </span>
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-cream truncate">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground">★ {item.imdbRating} • {item.genre}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-gold flex-shrink-0 ml-2">
                      {formatCr(item.purchasePrice || item.basePrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Franchises Purse Leaderboard & Live Chat */}
        <aside className="lg:col-span-3 xl:col-span-3 flex flex-col gap-3 min-h-0">
          {/* Franchises Status Rail (iplauction.fun style with click-to-inspect) */}
          <div className="bg-panel/95 border border-border/80 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black flex items-center gap-1">
                <Users size={12} className="text-gold" />
                {isCricket ? "FRANCHISES" : "STUDIO PRODUCERS"}
              </span>
              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                {room.players.length} TEAMS • CLICK TO VIEW
              </span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {sortedFranchises.map((p) => {
                const isMe = p.id === currentUser.id;
                const isLeading = p.id === room.currentBidderId;
                const isOut = room.outPlayerIds?.includes(p.id);
                const isInspected = p.id === activeFranchiseOrProducer.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setActiveRosterId(p.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isInspected
                        ? "bg-gold/15 border-gold ring-2 ring-gold/40 shadow-md shadow-gold/10"
                        : isMe
                          ? "bg-amber-950/40 border-gold/70 text-gold hover:border-gold"
                          : isLeading
                            ? "bg-gold/10 border-gold/60 text-cream hover:border-gold"
                            : isOut
                              ? "bg-black/30 border-red-900/40 opacity-60 text-muted-foreground hover:opacity-90"
                              : "bg-black/40 border-border/60 text-cream/90 hover:border-gold/50"
                    }`}
                    title={`Click to inspect ${p.name}'s purchases and squad`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="text-sm flex-shrink-0">{p.avatar}</span>
                      <span className="text-xs font-bold truncate">
                        {p.name} {isMe && <span className="text-[10px] text-gold font-mono uppercase">(YOU)</span>}
                      </span>
                      {isInspected && (
                        <span className="text-[9px] font-bold text-cyan-300 font-mono px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 flex-shrink-0">
                          VIEWING
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isOut ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-red-950/80 text-red-400 border border-red-500/40 flex-shrink-0">
                          🔴 OUT
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                          🟢 IN
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {(p.movies || []).length} pl
                      </span>
                      <strong className="text-xs font-black text-gold font-mono">
                        {formatCr(p.budget)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live War Room Chat */}
          <RoomChat
            roomCode={room.roomCode}
            playerName={currentUser.name}
            className="h-[380px] lg:h-[400px] max-h-[420px]"
          />
        </aside>

        {/* BOTTOM SECTION: Live Sales Marquee Ticker (iplauction.fun stadium style) */}
        <section className="lg:col-span-12 bg-black/90 border border-border/80 rounded-2xl p-2.5 shadow-xl flex items-center gap-3 overflow-hidden mt-1 relative">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold text-black font-black text-xs uppercase tracking-wider flex-shrink-0 shadow-md">
            <Sparkles size={13} fill="black" />
            <span>SALES</span>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="animate-marquee-smooth flex items-center gap-6 whitespace-nowrap">
              {recentSales.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  Live auction in progress... Concluded sales and unsold results will scroll here live.
                </span>
              ) : (
                <>
                  {recentSales.map((sale, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium">
                      <span className="text-cream font-bold">{sale.title}</span>
                      {sale.isUnsold ? (
                        <span className="text-red-400 font-bold font-mono px-1.5 py-0.2 rounded bg-red-950/60 border border-red-500/30 text-[10px]">
                          UNSOLD
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          → <span className="text-cream">{sale.buyerName}</span>
                          <span className="font-mono text-gold font-black">{formatCr(sale.price || 0)}</span>
                        </span>
                      )}
                      <span className="text-border mx-1">•</span>
                    </div>
                  ))}

                  {/* Duplicate set for seamless infinite loop */}
                  {recentSales.map((sale, i) => (
                    <div key={`dup_${i}`} className="flex items-center gap-2 text-xs font-medium">
                      <span className="text-cream font-bold">{sale.title}</span>
                      {sale.isUnsold ? (
                        <span className="text-red-400 font-bold font-mono px-1.5 py-0.2 rounded bg-red-950/60 border border-red-500/30 text-[10px]">
                          UNSOLD
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          → <span className="text-cream">{sale.buyerName}</span>
                          <span className="font-mono text-gold font-black">{formatCr(sale.price || 0)}</span>
                        </span>
                      )}
                      <span className="text-border mx-1">•</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION: REAL-TIME ACQUIRED SQUADS & PURCHASES EXPLORER TRAY */}
        <section className="lg:col-span-12 bg-panel/95 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 mt-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
                {isCricket ? <Award size={18} /> : <Film size={18} />}
              </span>
              <div className="flex flex-col text-left">
                <h3 className="text-sm font-black text-cream uppercase tracking-wider font-display flex items-center gap-2">
                  {activeRosterId === "ALL"
                    ? "ALL COMPLETED ROOM PURCHASES"
                    : isViewingSelf
                      ? isCricket ? "MY ACQUIRED SQUAD" : "MY STUDIO SLATE"
                      : isCricket ? `${activeFranchiseOrProducer.name.toUpperCase()}'S SQUAD` : `${activeFranchiseOrProducer.name.toUpperCase()}'S SLATE`}
                  <span className="text-xs font-mono font-bold text-gold">
                    ({activeRosterId === "ALL" ? allRoomPurchases.length : displayedItems.length} {isCricket ? "Players" : "Films"})
                  </span>
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {activeRosterId === "ALL" ? (
                    <>Live feed of all acquisitions made by all {room.players.length} franchises</>
                  ) : (
                    <>
                      Purse Available: <strong className="text-gold font-mono">{formatCr(activeFranchiseOrProducer.budget)}</strong>
                      {isCricket && ` • ✈️ ${activeOverseasCount}/7 Overseas`}
                      {` • Total Spent: `}<strong className="text-cream font-mono">{formatCr(activeSpent)}</strong>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Franchise Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveRosterId("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeRosterId === "ALL"
                    ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/20 font-black"
                    : "bg-black/40 text-cream/80 hover:bg-black/70 border border-border/60 hover:border-cyan-400/50"
                }`}
              >
                <Sparkles size={12} />
                <span>All Buys</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                  {allRoomPurchases.length}
                </span>
              </button>

              {room.players.map((p) => {
                const isSelected = activeRosterId !== "ALL" && p.id === activeFranchiseOrProducer.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveRosterId(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-gold text-black shadow-md shadow-gold/20 font-black"
                        : "bg-black/40 text-cream/80 hover:bg-black/70 border border-border/60 hover:border-gold/40"
                    }`}
                  >
                    <span>{p.avatar}</span>
                    <span className="truncate max-w-[100px]">{p.id === currentUser.id ? "Me" : p.name}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-mono">
                      {(p.movies || []).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid: Selected Franchise OR All Room Purchases */}
          {activeRosterId === "ALL" ? (
            allRoomPurchases.length === 0 ? (
              <div className="p-8 rounded-xl bg-black/20 border border-dashed border-border/60 text-center flex flex-col items-center justify-center gap-2">
                {isCricket ? <Award size={28} className="text-muted-foreground/40" /> : <Film size={28} className="text-muted-foreground/40" />}
                <p className="text-xs text-muted-foreground">
                  No purchases made yet in this room. All player acquisitions will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                {allRoomPurchases.map(({ movie: item, buyer }, idx) => {
                  const role = getRoleBadge(item.role, item.genre);
                  const isOverseas = isCricket && isOverseasPlayer(item);
                  return (
                    <div
                      key={`${item.id}_all_${idx}`}
                      className="group bg-black/50 border border-border/70 hover:border-gold/50 rounded-xl p-2.5 flex flex-col gap-2 transition-all shadow-md text-left"
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

                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className="text-[10px] font-bold text-cyan-300 truncate flex items-center gap-1">
                            <span>{buyer.avatar}</span>
                            <span className="truncate max-w-[80px]">{buyer.name}</span>
                          </span>
                          {isCricket && (
                            <span className="text-[10px] flex-shrink-0" title={isOverseas ? "Overseas Player" : "Indian Player"}>
                              {isOverseas ? "✈️" : "🇮🇳"}
                            </span>
                          )}
                        </div>

                        {isCricket ? (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border truncate mt-1 ${role.colorClass}`}>
                            {role.label}
                          </span>
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
            )
          ) : displayedItems.length === 0 ? (
            <div className="p-8 rounded-xl bg-black/20 border border-dashed border-border/60 text-center flex flex-col items-center justify-center gap-2">
              {isCricket ? <Award size={28} className="text-muted-foreground/40" /> : <Film size={28} className="text-muted-foreground/40" />}
              <p className="text-xs text-muted-foreground">
                {isViewingSelf
                  ? `No ${isCricket ? "cricketers" : "movies"} acquired yet. Win live bidding rounds to build your squad!`
                  : `${activeFranchiseOrProducer.name} has not acquired any ${isCricket ? "cricketers" : "movies"} yet.`}
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
                    className="group bg-black/50 border border-border/70 hover:border-gold/50 rounded-xl p-2.5 flex flex-col gap-2 transition-all shadow-md text-left"
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

      {/* Host Custom Timer Modal */}
      <Dialog open={showTimerModal} onOpenChange={setShowTimerModal}>
        <DialogContent className="max-w-md bg-panel border-gold/40 text-cream p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gold font-display flex items-center gap-2">
              <Timer className="text-gold" size={20} /> Host: Mid-Auction Timer Settings
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <p className="text-xs text-muted-foreground">
              Adjust or extend the countdown timer mid-auction without interrupting bidding data. Changes apply immediately to all participants in real time.
            </p>

            {/* Presets */}
            <div>
              <span className="text-xs font-bold text-cream uppercase tracking-wider block mb-2">
                Quick Presets:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 20, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      handleUpdateTimer(sec);
                      setShowTimerModal(false);
                    }}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-gold/20 border border-border/70 hover:border-gold text-xs font-mono font-bold text-cream hover:text-gold cursor-pointer transition-all text-center"
                  >
                    {sec} Seconds
                  </button>
                ))}
              </div>
            </div>

            {/* Extensions */}
            <div>
              <span className="text-xs font-bold text-cream uppercase tracking-wider block mb-2">
                Quick Extensions:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateTimer(10, true);
                    setShowTimerModal(false);
                  }}
                  className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300 cursor-pointer transition-all text-center"
                >
                  +10s to Current Clock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateTimer(20, true);
                    setShowTimerModal(false);
                  }}
                  className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300 cursor-pointer transition-all text-center"
                >
                  +20s to Current Clock
                </button>
              </div>
            </div>

            {/* Custom Seconds Input */}
            <div className="pt-2 border-t border-border/60">
              <span className="text-xs font-bold text-cream uppercase tracking-wider block mb-2">
                Set Exact Custom Seconds:
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = parseInt(manualSecondsInput.trim(), 10);
                  if (!isNaN(val) && val >= 3) {
                    handleUpdateTimer(val);
                    setShowTimerModal(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="number"
                  min="3"
                  max="300"
                  value={manualSecondsInput}
                  onChange={(e) => setManualSecondsInput(e.target.value)}
                  placeholder="e.g. 10"
                  className="flex-1 bg-black/60 border border-border/70 focus:border-gold rounded-xl px-3 py-2 text-xs font-mono text-cream outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-xs uppercase tracking-wider cursor-pointer hover:brightness-110"
                >
                  Set Seconds
                </button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

// -------------------------------------------------------------
// 5. IPL CRICKET TOURNAMENT SIMULATION HUB
// -------------------------------------------------------------
export function IplTournamentHub({
  room,
  currentUser,
  onNewAuction,
  rankings,
}: {
  room: RoomState;
  currentUser: any;
  onNewAuction: () => void;
  rankings: PlayerScore[];
}) {
  const [tournament, setTournament] = useState<TournamentState>(() => {
    if (room.tournamentData) return room.tournamentData;
    return initializeIplTournament(room.roomCode, room.players, room.submittedSlates || {});
  });

  const [activeTab, setActiveTab] = useState<"MATCHES" | "STANDINGS" | "PLAYOFFS" | "PODIUM" | "EVALUATION">("MATCHES");
  const [selectedMatch, setSelectedMatch] = useState<MatchFixture | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (room.tournamentData) {
      setTournament(room.tournamentData);
    }
  }, [room.tournamentData]);

  const nextUnplayedIdx = tournament.fixtures.findIndex((f) => !f.isPlayed);
  const nextFixture = nextUnplayedIdx !== -1 ? tournament.fixtures[nextUnplayedIdx] : null;
  const isCompleted = tournament.isCompleted || (nextUnplayedIdx === -1 && tournament.fixtures.length > 0);
  const playedFixtures = tournament.fixtures.filter((f) => f.isPlayed);
  const isHost = room.hostId === currentUser?.id;

  const handleSimulateNext = async () => {
    if (!isHost || nextUnplayedIdx === -1 || simulating) return;
    setSimulating(true);
    playDramaticTickSound(1);

    try {
      const updated = await simulateMatch(tournament, nextUnplayedIdx);
      setTournament(updated);
      saveTournamentState(room.roomCode, updated);

      if (updated.isCompleted) {
        playSoldCelebrationSound();
        playMemeAirhornSound();
        setActiveTab("PODIUM");
      } else {
        playSoldCelebrationSound();
      }
    } catch {
      // ignore
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateAll = async () => {
    if (!isHost || simulating) return;
    setSimulating(true);

    try {
      let curr = tournament;
      while (true) {
        const nextIdx = curr.fixtures.findIndex((f) => !f.isPlayed);
        if (nextIdx === -1) break;
        curr = await simulateMatch(curr, nextIdx);
        setTournament(curr);
        saveTournamentState(room.roomCode, curr);
        if (curr.isCompleted) break;
      }
      playSoldCelebrationSound();
      playMemeAirhornSound();
      setActiveTab("PODIUM");
    } catch {
      // ignore
    } finally {
      setSimulating(false);
    }
  };

  const handleResetTournament = () => {
    if (!isHost) return;
    const fresh = initializeIplTournament(room.roomCode, room.players, room.submittedSlates || {});
    setTournament(fresh);
    saveTournamentState(room.roomCode, fresh);
    setActiveTab("MATCHES");
  };

  // Sort standings by points desc, then NRR desc
  const sortedStandings = [...tournament.pointsTable].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  return (
    <section className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-panel via-panel-strong to-panel border border-gold/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-gold/15 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col gap-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30">
              <Trophy size={16} />
            </span>
            <GameStatus>
              {isCompleted ? "🏆 Championship Concluded" : "🏏 IPL Championship Tournament"}
            </GameStatus>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-cream font-display mt-1">
            IPL MEGA MATCH SIMULATION
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            {isCompleted
              ? `Championship matches completed! ${tournament.championTeamName || "Champion"} has lifted the IPL Trophy!`
              : `Simulating full franchise clashes with real Playing 11s, T20 scorecards, and the IPL Playoffs!`}
          </p>
        </div>

        {/* Action Controls - HOST ONLY */}
        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          {isHost ? (
            <>
              {!isCompleted && nextFixture && (
                <button
                  type="button"
                  onClick={handleSimulateNext}
                  disabled={simulating}
                  className="btn btn-primary px-5 py-3 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-xs uppercase tracking-wider shadow-xl shadow-gold/25 hover:brightness-110 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {simulating ? <LoaderCircle size={15} className="animate-spin" /> : <Play size={15} />}
                  <span>Simulate Next ({nextFixture.stageName})</span>
                </button>
              )}

              {!isCompleted && (
                <button
                  type="button"
                  onClick={handleSimulateAll}
                  disabled={simulating}
                  className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap size={14} /> Simulate All
                </button>
              )}

              <button
                type="button"
                onClick={handleResetTournament}
                className="px-3.5 py-3 rounded-2xl border border-border/80 hover:border-gold/40 text-cream text-xs font-bold flex items-center gap-1.5 bg-black/40 cursor-pointer"
                title="Re-simulate from start"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/60 border border-gold/40 text-gold text-xs font-bold shadow-lg">
              <Shield size={16} className="text-gold animate-pulse" />
              <span>Live Spectator • Host controls match simulation</span>
            </div>
          )}
        </div>
      </div>

      {/* HUB SUB-TABS */}
      <div className="w-full flex items-center justify-center gap-2 flex-wrap border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("MATCHES")}
          className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "MATCHES"
              ? "bg-gold text-black border-gold shadow-lg shadow-gold/10"
              : "bg-black/40 border-border/80 text-cream/90 hover:bg-black/60"
          }`}
        >
          <Gavel size={14} />
          <span>Match Center</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/60 text-gold text-[10px] font-mono font-bold">
            {playedFixtures.length}/{tournament.fixtures.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("STANDINGS")}
          className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "STANDINGS"
              ? "bg-gold text-black border-gold shadow-lg shadow-gold/10"
              : "bg-black/40 border-border/80 text-cream/90 hover:bg-black/60"
          }`}
        >
          <Shield size={14} />
          <span>IPL Points Table</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PLAYOFFS")}
          className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "PLAYOFFS"
              ? "bg-gold text-black border-gold shadow-lg shadow-gold/10"
              : "bg-black/40 border-border/80 text-cream/90 hover:bg-black/60"
          }`}
        >
          <Zap size={14} />
          <span>Playoff Bracket</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PODIUM")}
          className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "PODIUM"
              ? "bg-gold text-black border-gold shadow-lg shadow-gold/10"
              : "bg-black/40 border-border/80 text-cream/90 hover:bg-black/60"
          }`}
        >
          <Trophy size={14} className="text-amber-400" />
          <span>Champion Podium & Caps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EVALUATION")}
          className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "EVALUATION"
              ? "bg-gold text-black border-gold shadow-lg shadow-gold/10"
              : "bg-black/40 border-border/80 text-cream/90 hover:bg-black/60"
          }`}
        >
          <Award size={14} />
          <span>Franchise Evaluations</span>
        </button>
      </div>

      {/* 1. MATCH CENTER VIEW */}
      {activeTab === "MATCHES" && (
        <div className="w-full flex flex-col gap-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.fixtures.map((fixture) => {
              const isNext = fixture.id === nextFixture?.id;
              const isFinal = fixture.stage === "FINAL";

              return (
                <div
                  key={fixture.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-3 shadow-xl relative overflow-hidden ${
                    isFinal
                      ? "bg-gradient-to-b from-panel via-panel-strong to-black border-gold/60 shadow-gold/10"
                      : fixture.isPlayed
                        ? "bg-panel/90 border-border/80"
                        : isNext
                          ? "bg-panel/90 border-cyan-500/50 ring-2 ring-cyan-500/20 shadow-cyan-950/30"
                          : "bg-panel/50 border-border/50 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/60 text-gold border border-gold/30">
                      {fixture.stageName}
                    </span>
                    <span className="text-xs font-bold">
                      {fixture.isPlayed ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 size={12} /> Result Available
                        </span>
                      ) : isNext ? (
                        <span className="text-cyan-400 flex items-center gap-1 font-mono animate-pulse">
                          ⚡ Up Next
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono">⏳ Scheduled</span>
                      )}
                    </span>
                  </div>

                  {/* Team Matchup & Scores */}
                  <div className="flex flex-col gap-2 my-1">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {fixture.team1Name.slice(0, 2).toUpperCase()}
                        </span>
                        <strong className="text-sm font-bold text-cream truncate">
                          {fixture.team1Name}
                        </strong>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {fixture.innings1 ? (
                          <strong className="text-sm font-mono font-black text-gold">
                            {fixture.innings1.runs}/{fixture.innings1.wickets}{" "}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({fixture.innings1.overs} ov)
                            </span>
                          </strong>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">—</span>
                        )}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {fixture.team2Name.slice(0, 2).toUpperCase()}
                        </span>
                        <strong className="text-sm font-bold text-cream truncate">
                          {fixture.team2Name}
                        </strong>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {fixture.innings2 ? (
                          <strong className="text-sm font-mono font-black text-gold">
                            {fixture.innings2.runs}/{fixture.innings2.wickets}{" "}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({fixture.innings2.overs} ov)
                            </span>
                          </strong>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Result & Highlights */}
                  {fixture.isPlayed ? (
                    <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
                      <div className="text-xs font-black text-emerald-400">
                        🏆 {fixture.winnerName} {fixture.winMargin}
                      </div>
                      {fixture.commentaryHighlight && (
                        <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                          "{fixture.commentaryHighlight}"
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedMatch(fixture)}
                        className="mt-1 text-[11px] text-gold hover:text-amber-300 font-bold flex items-center gap-1 w-fit cursor-pointer"
                      >
                        View Full Scorecard & Stats →
                      </button>
                    </div>
                  ) : isNext ? (
                    isHost ? (
                      <button
                        type="button"
                        onClick={handleSimulateNext}
                        disabled={simulating}
                        className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {simulating ? <LoaderCircle size={14} className="animate-spin" /> : <Play size={14} />}
                        <span>Simulate Match Now</span>
                      </button>
                    ) : (
                      <div className="mt-1 w-full py-2 px-3 rounded-xl bg-black/40 border border-border/60 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-bold">
                        <LoaderCircle size={13} className="animate-spin text-gold" />
                        <span>Waiting for Host to simulate match...</span>
                      </div>
                    )
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. IPL POINTS TABLE */}
      {activeTab === "STANDINGS" && (
        <div className="w-full bg-panel/90 border border-border/80 rounded-3xl p-6 shadow-xl flex flex-col gap-4 text-left overflow-x-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-cream font-display uppercase tracking-wider flex items-center gap-2">
                <Shield className="text-gold" size={18} /> Official IPL Points Table
              </h2>
              <span className="text-xs text-muted-foreground">
                Top 4 franchises qualify for Qualifier 1 & Eliminator playoffs.
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-cream font-bold">Playoff Zone</span>
            </div>
          </div>

          <table className="w-full border-collapse text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Pos</th>
                <th className="py-2.5 px-3">Franchise</th>
                <th className="py-2.5 px-3 text-center">P</th>
                <th className="py-2.5 px-3 text-center">W</th>
                <th className="py-2.5 px-3 text-center">L</th>
                <th className="py-2.5 px-3 text-center font-black text-gold">PTS</th>
                <th className="py-2.5 px-3 text-center font-mono">NRR</th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((entry, idx) => {
                const isPlayoffZone = idx < 4;
                return (
                  <tr
                    key={entry.teamId}
                    className={`border-b border-border/50 transition-colors ${
                      isPlayoffZone ? "bg-emerald-950/15 hover:bg-emerald-950/25" : "hover:bg-black/30"
                    }`}
                  >
                    <td className="py-3 px-3 font-bold">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black ${
                          idx === 0
                            ? "bg-gold text-black"
                            : isPlayoffZone
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-black/40 text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-cream">
                      <div className="flex items-center gap-2">
                        <span>{entry.teamName}</span>
                        {isPlayoffZone && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                            Q
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{entry.played}</td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">{entry.won}</td>
                    <td className="py-3 px-3 text-center font-mono text-red-400">{entry.lost}</td>
                    <td className="py-3 px-3 text-center font-mono font-black text-gold text-base">
                      {entry.points}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-cyan-300">
                      {entry.nrr > 0 ? `+${entry.nrr.toFixed(3)}` : entry.nrr.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. PLAYOFF BRACKET TREE */}
      {activeTab === "PLAYOFFS" && (
        <div className="w-full bg-panel/90 border border-border/80 rounded-3xl p-6 shadow-xl flex flex-col gap-6 text-left">
          <div>
            <h2 className="text-lg font-black text-cream font-display uppercase tracking-wider flex items-center gap-2">
              <Zap className="text-gold" size={18} /> IPL Playoff Tree & Finals Ladder
            </h2>
            <span className="text-xs text-muted-foreground">
              Qualifier 1 winner goes straight to the Grand Final. Eliminator winner clashes in Qualifier 2!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Round 1: Q1 & Eliminator */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Round 1: Playoffs
              </span>

              {/* Q1 */}
              <div className="p-4 rounded-2xl bg-black/60 border border-gold/40 shadow-md">
                <span className="text-[10px] font-bold text-gold uppercase block mb-1">
                  Qualifier 1 (#1 vs #2)
                </span>
                <strong className="block text-xs text-cream">
                  {tournament.fixtures.find((f) => f.stage === "QUALIFIER_1")?.team1Name || "1st Place"} vs{" "}
                  {tournament.fixtures.find((f) => f.stage === "QUALIFIER_1")?.team2Name || "2nd Place"}
                </strong>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                  Winner ➔ Grand Final
                </span>
              </div>

              {/* Eliminator */}
              <div className="p-4 rounded-2xl bg-black/60 border border-red-500/40 shadow-md">
                <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">
                  Eliminator (#3 vs #4)
                </span>
                <strong className="block text-xs text-cream">
                  {tournament.fixtures.find((f) => f.stage === "ELIMINATOR")?.team1Name || "3rd Place"} vs{" "}
                  {tournament.fixtures.find((f) => f.stage === "ELIMINATOR")?.team2Name || "4th Place"}
                </strong>
                <span className="text-[10px] text-amber-400 font-bold mt-1 block">
                  Winner ➔ Qualifier 2
                </span>
              </div>
            </div>

            {/* Round 2: Q2 */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Round 2: Semi-Final
              </span>

              <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/40 shadow-md">
                <span className="text-[10px] font-bold text-cyan-400 uppercase block mb-1">
                  Qualifier 2
                </span>
                <strong className="block text-xs text-cream">
                  {tournament.fixtures.find((f) => f.stage === "QUALIFIER_2")?.team1Name || "Loser Q1"} vs{" "}
                  {tournament.fixtures.find((f) => f.stage === "QUALIFIER_2")?.team2Name || "Winner Eliminator"}
                </strong>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                  Winner ➔ Grand Final
                </span>
              </div>
            </div>

            {/* Round 3: Grand Final */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-wider text-gold">
                Grand Final Showdown
              </span>

              <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-950/40 to-panel border-2 border-gold shadow-2xl">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Trophy size={16} className="text-gold" />
                  <span className="text-xs font-black text-gold uppercase">IPL GRAND FINAL</span>
                </div>
                <strong className="block text-sm text-cream font-display">
                  {tournament.fixtures.find((f) => f.stage === "FINAL")?.team1Name || "Winner Q1"} vs{" "}
                  {tournament.fixtures.find((f) => f.stage === "FINAL")?.team2Name || "Winner Q2"}
                </strong>
                {tournament.championTeamName ? (
                  <div className="mt-3 p-2 rounded-xl bg-gold/20 border border-gold/40 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      CHAMPION
                    </span>
                    <strong className="text-sm font-black text-gold font-display">
                      👑 {tournament.championTeamName}
                    </strong>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground mt-2 block">
                    Play match to decide champion!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CHAMPION PODIUM & CAPS VIEW */}
      {activeTab === "PODIUM" && (
        <div className="w-full bg-panel/90 border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-6 relative overflow-hidden">
          <div className="w-24 h-24 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center text-5xl shadow-2xl shadow-gold/30 animate-bounce">
            🏆
          </div>

          <div>
            <span className="text-xs uppercase font-black text-gold tracking-widest block mb-1">
              IPL Grand Champions
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-cream font-display">
              {tournament.championTeamName || "Tournament In Progress"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Lifted the coveted IPL trophy after an intense playoff campaign!
            </p>
          </div>

          {/* Orange Cap & Purple Cap Awards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-2">
            {/* Orange Cap */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-950/60 to-black/80 border border-orange-500/60 shadow-xl flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-2xl flex-shrink-0">
                🧢
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-black text-orange-400 tracking-wider">
                  Orange Cap (Top Batsman)
                </span>
                <strong className="text-base font-black text-cream truncate">
                  {tournament.orangeCap?.playerName || "Evaluating..."}
                </strong>
                <span className="text-xs font-mono font-bold text-orange-300">
                  {tournament.orangeCap?.runs || 0} Runs • {tournament.orangeCap?.teamName || "—"}
                </span>
              </div>
            </div>

            {/* Purple Cap */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/60 to-black/80 border border-purple-500/60 shadow-xl flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-2xl flex-shrink-0">
                🟣
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider">
                  Purple Cap (Top Bowler)
                </span>
                <strong className="text-base font-black text-cream truncate">
                  {tournament.purpleCap?.playerName || "Evaluating..."}
                </strong>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {tournament.purpleCap?.wickets || 0} Wickets • {tournament.purpleCap?.teamName || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. GRAND JURY EVALUATION VIEW */}
      {activeTab === "EVALUATION" && (
        <div className="w-full flex flex-col items-center gap-4">
          <RankingList players={room.players} rankings={rankings} isCricket={true} />
        </div>
      )}

      {/* DETAILED SCORECARD MODAL */}
      <Dialog open={Boolean(selectedMatch)} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-xl p-6 bg-panel/95 border-gold/40 text-cream backdrop-blur-xl">
          {selectedMatch && (
            <div className="flex flex-col gap-4 text-left">
              <DialogHeader className="border-b border-border/80 pb-3">
                <DialogTitle className="text-lg font-black text-cream font-display flex items-center justify-between">
                  <span>{selectedMatch.stageName} Scorecard</span>
                  <span className="text-xs font-mono text-emerald-400">{selectedMatch.winMargin}</span>
                </DialogTitle>
              </DialogHeader>

              {/* Innings 1 Breakdown */}
              {selectedMatch.innings1 && (
                <div className="p-4 rounded-2xl bg-black/50 border border-border/70 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-cream">
                      {selectedMatch.innings1.teamName} Innings
                    </strong>
                    <span className="text-base font-mono font-black text-gold">
                      {selectedMatch.innings1.runs}/{selectedMatch.innings1.wickets} ({selectedMatch.innings1.overs} ov)
                    </span>
                  </div>

                  {selectedMatch.innings1.topBatter && (
                    <div className="text-xs flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                      <span>Top Batter: <strong className="text-cream">{selectedMatch.innings1.topBatter.name}</strong></span>
                      <span className="font-mono text-gold font-bold">
                        {selectedMatch.innings1.topBatter.runs} ({selectedMatch.innings1.topBatter.balls}) • 4s: {selectedMatch.innings1.topBatter.fours} • 6s: {selectedMatch.innings1.topBatter.sixes}
                      </span>
                    </div>
                  )}

                  {selectedMatch.innings1.topBowler && (
                    <div className="text-xs flex items-center justify-between text-muted-foreground">
                      <span>Top Bowler: <strong className="text-cream">{selectedMatch.innings1.topBowler.name}</strong></span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {selectedMatch.innings1.topBowler.wickets}/{selectedMatch.innings1.topBowler.runs} ({selectedMatch.innings1.topBowler.overs} ov)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Innings 2 Breakdown */}
              {selectedMatch.innings2 && (
                <div className="p-4 rounded-2xl bg-black/50 border border-border/70 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-cream">
                      {selectedMatch.innings2.teamName} Innings
                    </strong>
                    <span className="text-base font-mono font-black text-gold">
                      {selectedMatch.innings2.runs}/{selectedMatch.innings2.wickets} ({selectedMatch.innings2.overs} ov)
                    </span>
                  </div>

                  {selectedMatch.innings2.topBatter && (
                    <div className="text-xs flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                      <span>Top Batter: <strong className="text-cream">{selectedMatch.innings2.topBatter.name}</strong></span>
                      <span className="font-mono text-gold font-bold">
                        {selectedMatch.innings2.topBatter.runs} ({selectedMatch.innings2.topBatter.balls}) • 4s: {selectedMatch.innings2.topBatter.fours} • 6s: {selectedMatch.innings2.topBatter.sixes}
                      </span>
                    </div>
                  )}

                  {selectedMatch.innings2.topBowler && (
                    <div className="text-xs flex items-center justify-between text-muted-foreground">
                      <span>Top Bowler: <strong className="text-cream">{selectedMatch.innings2.topBowler.name}</strong></span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {selectedMatch.innings2.topBowler.wickets}/{selectedMatch.innings2.topBowler.runs} ({selectedMatch.innings2.topBowler.overs} ov)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Player of the Match & Commentary */}
              {selectedMatch.playerOfTheMatch && (
                <div className="p-3 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-between text-xs">
                  <span className="font-bold text-gold flex items-center gap-1">
                    <Star size={13} /> Player of the Match
                  </span>
                  <span className="font-black text-cream">
                    {selectedMatch.playerOfTheMatch.name} ({selectedMatch.playerOfTheMatch.performance})
                  </span>
                </div>
              )}

              {selectedMatch.commentaryHighlight && (
                <p className="text-xs text-muted-foreground italic bg-black/40 p-3 rounded-xl border border-border/60">
                  "{selectedMatch.commentaryHighlight}"
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Start New Auction Button */}
      <div className="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={onNewAuction}
          className="btn btn-primary px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red to-rose-600 font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-red/25 flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw size={16} /> Start New Auction
        </button>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// 6. RESULTS SCREEN (SYNCHRONIZED SLATE SUBMISSION & GRAND JURY)
// -------------------------------------------------------------
export function ResultsScreen({ roomCode }: { roomCode: string }) {
  const code = roomCode.toUpperCase();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(() => getRoom(code));
  const currentUser = getCurrentUser();
  const me = room?.players.find((p) => p.id === currentUser.id) || room?.players[0];

  const userWonItems = useMemo(() => me?.movies || [], [me?.movies]);
  const isCricket =
    room?.auctionType === "CRICKET" ||
    code.startsWith("IPL") ||
    userWonItems.some((m) => m.auctionType === "CRICKET" || m.role);

  // Default optimal selection
  const initialOptimal = useMemo(() => {
    if (isCricket) return getOptimalPlaying11(userWonItems);
    return { playing11: getOptimalMovieSlate(userWonItems) };
  }, [isCricket, userWonItems]);

  const existingSubmission = room?.submittedSlates?.[currentUser.id];

  const [selected, setSelected] = useState<string[]>(() => existingSubmission?.movieIds || initialOptimal.playing11);
  const [captainId, setCaptainId] = useState<string | undefined>(() => existingSubmission?.captainId || initialOptimal.captainId);
  const [viceCaptainId, setViceCaptainId] = useState<string | undefined>(() => existingSubmission?.viceCaptainId || initialOptimal.viceCaptainId);
  const [notice, setNotice] = useState<string>("");
  const [rankings, setRankings] = useState<PlayerScore[]>(() => room?.portfolioRankings || []);

  const getInitialStep = (): "select" | "waiting" | "evaluating" | "final" => {
    if (room?.portfolioRankings && room.portfolioRankings.length > 0) return "final";
    if (room?.status === "RESULTS") return "final";
    if (room?.status === "EVALUATING") return "evaluating";
    if (room?.submittedSlates?.[currentUser.id]?.movieIds?.length) return "waiting";
    return "select";
  };

  const [step, setStep] = useState<"select" | "waiting" | "evaluating" | "final">(getInitialStep);

  // Synchronize state with real-time multiplayer updates
  useEffect(() => {
    void fetchRemoteRoom(code).then((remote) => {
      if (remote) {
        setRoom(remote);
        if (remote.portfolioRankings && remote.portfolioRankings.length > 0) {
          setRankings(remote.portfolioRankings);
          setStep("final");
        } else if (remote.status === "EVALUATING") {
          setStep("evaluating");
        } else if (remote.submittedSlates?.[currentUser.id]?.movieIds?.length) {
          setStep((prev) => (prev === "select" ? "waiting" : prev));
        }
      }
    });

    const activeRoom = getRoom(code);
    if (activeRoom) {
      setRoom(activeRoom);
      if (activeRoom.portfolioRankings && activeRoom.portfolioRankings.length > 0) {
        setRankings(activeRoom.portfolioRankings);
        setStep("final");
      } else if (activeRoom.status === "EVALUATING") {
        setStep("evaluating");
      } else if (activeRoom.submittedSlates?.[currentUser.id]?.movieIds?.length) {
        setStep((prev) => (prev === "select" ? "waiting" : prev));
      }
    }

    const unsubscribe = subscribeToMultiplayerRoom(code, (fresh) => {
      setRoom(fresh);
      if (fresh.portfolioRankings && fresh.portfolioRankings.length > 0) {
        setRankings(fresh.portfolioRankings);
        setStep("final");
      } else if (fresh.status === "EVALUATING") {
        setStep("evaluating");
      } else if (fresh.submittedSlates?.[currentUser.id]?.movieIds?.length) {
        setStep((prev) => (prev === "select" ? "waiting" : prev));
      }
    });

    return () => unsubscribe();
  }, [code, currentUser.id]);

  // Execute Grand Jury evaluation when all players have submitted
  const isEvaluatingRef = useRef(false);

  useEffect(() => {
    const shouldEvaluate = (room?.status === "EVALUATING" || step === "evaluating") && (!rankings || rankings.length === 0);
    if (!shouldEvaluate) return;
    if (room?.portfolioRankings && room.portfolioRankings.length > 0) {
      setRankings(room.portfolioRankings);
      setStep("final");
      return;
    }

    if (isEvaluatingRef.current) return;
    isEvaluatingRef.current = true;

    let isMounted = true;
    const runEvaluation = async () => {
      try {
        const scores = await evaluateAllRoomPlayers(code);
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
  }, [step, room?.status, room?.portfolioRankings, code, rankings]);

  const maxSelectable = isCricket ? Math.min(11, Math.max(1, userWonItems.length)) : Math.min(5, Math.max(1, userWonItems.length));

  const selectedItems = useMemo(
    () => userWonItems.filter((item) => selected.includes(item.id)),
    [userWonItems, selected],
  );

  const selectedOverseasCount = useMemo(
    () => selectedItems.filter((m) => isOverseasPlayer(m)).length,
    [selectedItems],
  );

  const isHost = room?.hostId === currentUser.id || room?.players[0]?.id === currentUser.id;

  const activeHumanPlayers = useMemo(
    () => room?.players.filter((p) => !p.isBot && p.movies.length > 0) || [],
    [room?.players],
  );

  const submittedHumanCount = useMemo(
    () => activeHumanPlayers.filter((p) => Boolean(room?.submittedSlates?.[p.id]?.movieIds?.length)).length,
    [activeHumanPlayers, room?.submittedSlates],
  );

  const totalRequired = Math.max(1, activeHumanPlayers.length);
  const progressPercent = Math.min(100, Math.round((submittedHumanCount / totalRequired) * 100));

  const lockedSelectedItems = useMemo(() => {
    const ids = room?.submittedSlates?.[currentUser.id]?.movieIds || selected;
    return userWonItems.filter((item) => ids.includes(item.id));
  }, [room?.submittedSlates, currentUser.id, selected, userWonItems]);

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
    if (isCricket) {
      const optimal = getOptimalPlaying11(userWonItems);
      setSelected(optimal.playing11);
      setCaptainId(optimal.captainId);
      setViceCaptainId(optimal.viceCaptainId);
      setNotice("⚡ Optimal Playing 11 selected (Balanced roles, Max 4 Overseas).");
    } else {
      const optimal = getOptimalMovieSlate(userWonItems);
      setSelected(optimal);
      setNotice("⚡ Top 5 films selected based on IMDb acclaim and box office yield.");
    }
  };

  const handleSubmitSlate = () => {
    if (userWonItems.length > 0 && selected.length === 0) return;
    const { room: updatedRoom, allSubmitted } = submitPlayerSlate(
      code,
      currentUser.id,
      selected,
      captainId,
      viceCaptainId,
    );
    setRoom({ ...updatedRoom });
    if (allSubmitted) {
      setStep("evaluating");
    } else {
      setStep("waiting");
    }
  };

  const handleEditSlate = () => {
    const updated = unsubmitPlayerSlate(code, currentUser.id);
    if (updated) setRoom({ ...updated });
    setStep("select");
  };

  const handleForceStart = () => {
    const updated = forceStartEvaluation(code);
    if (updated) setRoom({ ...updated });
    setStep("evaluating");
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
                ? "Select your 11 match-winners from your squad. Max 4 overseas players. The Grand Jury simulation will begin once every franchise submits!"
                : "Select your top 5 films from your acquired titles. Grand Jury evaluation will start only after every player submits their slate!"}
            </p>

            {/* Incomplete Movie Slate Warning */}
            {!isCricket && userWonItems.length < 5 && userWonItems.length > 0 && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-xl max-w-lg mx-auto my-3">
                ⚠️ <strong>Incomplete Studio Slate ({userWonItems.length}/5 movies):</strong> You acquired fewer than the required 5 movies. A penalty will be applied during scoring.
              </div>
            )}

            {/* Multiplayer Realtime Status Banner */}
            {activeHumanPlayers.length > 1 && (
              <div className="w-full max-w-xl my-3 p-3.5 rounded-2xl bg-panel/90 border border-cyan-500/40 shadow-lg flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <div>
                    <div className="text-xs font-bold text-cream flex items-center gap-2">
                      <span>{submittedHumanCount} of {totalRequired} {isCricket ? "Franchises" : "Producers"} Submitted</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        Live Room
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Everyone gets to pick their Top 5. Grand Jury commences when all players lock in!
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-black flex-shrink-0">
                  {progressPercent}%
                </span>
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
              <div className="w-full my-4 p-4 rounded-2xl bg-panel/90 border border-gold/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-bold text-muted-foreground">Studio Slate:</span>
                  <span className={`text-sm font-black ${selected.length === 5 ? "text-emerald-400" : "text-gold"}`}>
                    {selected.length} / {maxSelectable} Selected
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoPick}
                  className="btn btn-secondary text-xs px-3 py-2 rounded-xl border border-gold/40 text-gold hover:bg-gold/10 font-bold flex items-center gap-1.5 flex-shrink-0"
                >
                  <Sparkles size={14} /> Auto-Pick Top 5 Films
                </button>
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
              onClick={handleSubmitSlate}
              className="btn btn-primary mt-8 px-10 py-4 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-gold/20 hover:brightness-110 flex items-center gap-2"
            >
              <Trophy size={18} /> {isCricket ? "Lock Playing 11 & Submit" : "Lock Top 5 & Submit to Grand Jury"}
            </button>
          </section>
        )}

        {step === "waiting" && (
          <section className="w-full flex flex-col items-center text-center max-w-4xl">
            <GameStatus icon={<Lock size={14} className="text-emerald-400" />}>
              Studio Slate Secured In Grand Jury Vault
            </GameStatus>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-cream tracking-tight mt-2">
              WAITING FOR OTHER {isCricket ? "FRANCHISES" : "PRODUCERS"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl">
              Your {isCricket ? "Playing 11" : "5-film slate"} is locked in the vault. The Grand Jury will convene automatically once every producer submits their top selections!
            </p>

            {/* Live Synchronized Progress Card */}
            <div className="w-full mt-6 p-6 rounded-3xl bg-panel/90 border border-gold/30 shadow-2xl flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-gold animate-spin" style={{ animationDuration: "6s" }} />
                  <span className="text-xs sm:text-sm font-black text-cream uppercase tracking-wider">
                    {isCricket ? "Franchise Submissions Progress" : "Producer Submissions Progress"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Status:</span>
                  <span className="text-sm sm:text-base font-black text-gold">
                    {submittedHumanCount} / {totalRequired} Ready
                  </span>
                </div>
              </div>

              {/* Glowing Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-white/10 relative">
                <div
                  className="h-full bg-gradient-to-r from-gold via-amber-400 to-emerald-400 transition-all duration-500 ease-out rounded-full shadow-[0_0_12px_rgba(234,179,8,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="text-[11px] sm:text-xs text-muted-foreground flex items-center justify-between">
                <span>⚡ Everyone waits until all players lock in their top 5 selections</span>
                <span className="text-emerald-400 font-bold">{progressPercent}% complete</span>
              </div>
            </div>

            {/* Players Status Roster Grid */}
            <div className="w-full mt-6 flex flex-col gap-3 text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                Room Competitors ({room?.players.length || 0})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {room?.players.map((player) => {
                  const isCurrent = player.id === currentUser.id;
                  const isSubmitted = Boolean(room.submittedSlates?.[player.id]?.movieIds?.length);
                  const playerWonCount = (player.movies || []).length;
                  const isZeroWon = playerWonCount === 0;

                  return (
                    <div
                      key={player.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSubmitted
                          ? "bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30"
                          : player.isBot
                          ? "bg-panel/60 border-border/70"
                          : "bg-panel/90 border-amber-500/30 shadow-md shadow-amber-950/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-sm flex-shrink-0 shadow-md"
                          style={{ backgroundColor: player.color || "#f5c518" }}
                        >
                          {player.avatar || "CB"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-cream truncate flex items-center gap-1.5">
                            <span className="truncate">{player.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-gold/20 text-gold border border-gold/30">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {playerWonCount} acquired • {player.isBot ? "AI Bot" : "Producer"}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {isSubmitted ? (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                            <CheckCircle2 size={12} /> Ready
                          </span>
                        ) : player.isBot ? (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                            🤖 Auto
                          </span>
                        ) : isZeroWon ? (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900 text-muted-foreground border border-white/10">
                            0 Items
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-950/70 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                            <Clock size={12} /> Selecting...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Your Locked Slate Preview */}
            <div className="w-full mt-8 flex flex-col text-left">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cream">
                    Your Locked {isCricket ? "Playing 11" : "Studio Slate"} ({lockedSelectedItems.length} items)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleEditSlate}
                  className="text-xs text-gold hover:text-amber-300 font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-xl border border-gold/30 hover:bg-gold/10"
                >
                  <Edit3 size={13} /> Edit My Selection
                </button>
              </div>

              {lockedSelectedItems.length === 0 ? (
                <div className="p-6 rounded-2xl bg-panel/80 border border-border text-center text-muted-foreground text-xs">
                  No items acquired during this auction. Preserved purse discipline will be evaluated.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
                  {lockedSelectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-panel/90 border border-emerald-500/40 shadow-lg relative flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-black flex items-center gap-1">
                          <Check size={12} /> Locked
                        </span>
                        {item.imdbRating && (
                          <span className="text-yellow-400 font-bold">★ {item.imdbRating}</span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-cream line-clamp-1">{item.title}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between mt-auto">
                        <span>{item.year || item.role}</span>
                        <span className="text-gold font-bold">{formatCr(item.purchasePrice || item.basePrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
              <button
                type="button"
                onClick={handleEditSlate}
                className="btn btn-secondary px-6 py-3 rounded-2xl border border-white/20 text-cream hover:bg-white/10 font-bold text-xs flex items-center gap-2"
              >
                <Edit3 size={15} /> Modify My Top 5
              </button>

              {isHost && (
                <button
                  type="button"
                  onClick={handleForceStart}
                  className="btn btn-primary px-8 py-3 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-gold/20 hover:brightness-110 flex items-center gap-2"
                >
                  <Zap size={15} /> Force Start Grand Jury (Host Bypass)
                </button>
              )}
            </div>
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
          isCricket && room ? (
            <IplTournamentHub
              room={room}
              currentUser={currentUser}
              rankings={rankings}
              onNewAuction={() => navigate({ to: "/create", search: { game: "cricket" } })}
            />
          ) : (
            <section className="w-full flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={20} className="text-gold" />
                <GameStatus>Grand Championship Podium</GameStatus>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl text-cream tracking-tight">
                GRAND JURY LEADERBOARD
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-lg">
                Official standings evaluated across critical acclaim, commercial box office yield, genre synergy, and purse discipline.
              </p>

              <RankingList players={room?.players ?? []} rankings={rankings} isCricket={false} />

              <div className="flex items-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/create", search: { game: "cinema" } })}
                  className="btn btn-primary px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red to-rose-600 font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-red/25 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw size={16} /> Start New Auction
                </button>
              </div>
            </section>
          )
        )}
      </main>
    </Page>
  );
}
