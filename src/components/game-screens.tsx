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
  UserPlus,
  UserMinus,
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
import { cricketPlayers, isOverseasPlayer, getOptimalPlaying11 } from "@/lib/cricket-data";
import {
  addBotToRoom,
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
  removeBotFromRoom,
  resolveCurrentAuction,
  saveRoom,
  setCurrentUser,
  simulateBotBid,
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
// 1. HOME / LANDING SCREEN
// -------------------------------------------------------------
export function HomeScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; color: string } | null>(null);
  const [activeTab, setActiveTab] = useState<AuctionType>("CRICKET");

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleStartCustom = (type: AuctionType = activeTab) => {
    navigate({ to: "/create" });
  };

  const handleJoin = () => {
    navigate({ to: "/join" });
  };

  return (
    <Page>
      <main className="home-layout max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-10">
        {/* Hero Section */}
        <section className="hero relative overflow-hidden rounded-3xl border border-border/80 bg-panel/90 shadow-2xl p-6 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel/85 to-transparent z-10 pointer-events-none" />

          {/* Theme Selector Toggle */}
          <div className="relative z-20 flex items-center justify-center sm:justify-start gap-2 mb-6">
            <div className="inline-flex p-1 rounded-2xl bg-black/60 border border-border">
              <button
                type="button"
                onClick={() => setActiveTab("CRICKET")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === "CRICKET"
                    ? "bg-gold text-black shadow-lg shadow-gold/20"
                    : "text-muted-foreground hover:text-cream"
                }`}
              >
                <span>🏏</span> IPL Mega Auction
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("CINEMA")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === "CINEMA"
                    ? "bg-red text-cream shadow-lg shadow-red/20"
                    : "text-muted-foreground hover:text-cream"
                }`}
              >
                <span>🎬</span> Movie Cinema
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-20">
            <div className="lg:col-span-7 flex flex-col gap-4 text-center sm:text-left items-center sm:items-start">
              <div className="flex justify-center sm:justify-start">
                <GameStatus icon={<StarDot />}>
                  {activeTab === "CRICKET"
                    ? "IPL Mega Auction Format • 12-18 Squad • Up to 7 Overseas (Max 4 in 11)"
                    : "Live Multiplayer • Official Movie Posters"}
                </GameStatus>
              </div>

              <h1 className="font-display font-black text-4xl sm:text-6xl text-cream tracking-tight leading-[1.08] text-center sm:text-left">
                {activeTab === "CRICKET" ? (
                  <>
                    IPL MEGA AUCTION <span className="text-gold">& PLAYING 11</span> ARENA
                  </>
                ) : (
                  <>
                    THE LIVE <span className="text-gold">CINEMA MOVIE</span> AUCTION
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed text-center sm:text-left">
                {activeTab === "CRICKET"
                  ? "Build your IPL mega squad (12-18 superstars, up to 7 overseas players). Submit your championship Playing 11 (max 4 overseas), then AI evaluates winner and leaderboard rankings!"
                  : "Bid in real-time against friends and franchise rivals for iconic box-office blockbusters. Curate a 5-film slate and claim the Festival Grand Prize."}
              </p>

              {/* IPL Rules Overview Callout */}
              {activeTab === "CRICKET" && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-1 p-3.5 rounded-2xl bg-black/50 border border-gold/30 text-center sm:text-left">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-gold">1. Squad Limits</span>
                    <strong className="text-xs text-cream mt-0.5">Min 12 & Max 18 Players</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-gold">2. Foreign Quota</span>
                    <strong className="text-xs text-cream mt-0.5">Up to 7 in Squad (4 in 11)</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-gold">3. AI Evaluation</span>
                    <strong className="text-xs text-cream mt-0.5">Field Playing 11 vs AI Jury</strong>
                  </div>
                </div>
              )}

              {/* Action Buttons: Centered on mobile devices! */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartCustom(activeTab)}
                  className="btn btn-primary w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-gold/20 hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <Gavel size={18} /> Create Auction Room
                </button>

                <button
                  type="button"
                  onClick={handleJoin}
                  className="btn btn-secondary w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-border/80 bg-panel hover:bg-panel-strong font-display font-bold text-sm uppercase tracking-wider text-cream flex items-center justify-center gap-2 hover:border-gold/50"
                >
                  <Play size={16} fill="currentColor" /> Join with Code
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden border border-border/80 shadow-2xl relative bg-black">
                <img
                  src={activeTab === "CRICKET" ? cricketHero : cinemaHero}
                  alt="Auction Hero Artwork"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-left">
                    <span className="text-xs text-gold font-bold flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles size={13} /> {activeTab === "CRICKET" ? "70+ Real Cricketer Photos" : "44+ Iconic Theatrical Blockbusters"}
                    </span>
                    <strong className="block text-cream text-base font-black">
                      {activeTab === "CRICKET" ? "IPL Mega Auction & Playing 11 Challenge" : "Grand Film Festival Studio Slate"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Preview Showcase */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-cream font-display">
                {activeTab === "CRICKET" ? "🏏 Real Cricketers (Batsmen, Bowlers & All-Rounders)" : "🎬 Featured Theatrical Masterpieces"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === "CRICKET"
                  ? "Real high-resolution portraits from Wikimedia Commons & open archives with verified career stats, impact ratings, and nationality quotas."
                  : "Verified high-resolution official posters with global box office and IMDb ratings."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {activeTab === "CRICKET"
              ? cricketPlayers.slice(0, 12).map((player) => (
                  <div
                    key={player.id}
                    className="group rounded-2xl overflow-hidden border border-border/80 bg-panel hover:border-gold/50 transition-all p-2.5 flex flex-col gap-2 shadow-md"
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-black/40">
                      <Poster movie={{ ...player, auctionType: "CRICKET" }} className="w-full h-full" />
                    </div>
                    <div>
                      <strong className="block text-xs font-bold text-cream truncate group-hover:text-gold transition-colors">
                        {player.title}
                      </strong>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                        <span className="text-cyan-400 font-bold">★ {player.imdbRating}</span>
                        <span className="text-gold font-bold font-mono">Base: {formatCr(player.basePrice)}</span>
                      </div>
                      <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                        {player.genre} • {player.director}
                      </span>
                    </div>
                  </div>
                ))
              : movies.slice(0, 12).map((movie) => (
                  <div
                    key={movie.id}
                    className="group rounded-2xl overflow-hidden border border-border/80 bg-panel hover:border-gold/50 transition-all p-2.5 flex flex-col gap-2 shadow-md"
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-black/40">
                      <Poster movie={movie} className="w-full h-full" />
                    </div>
                    <div>
                      <strong className="block text-xs font-bold text-cream truncate group-hover:text-gold transition-colors">
                        {movie.title}
                      </strong>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                        <span className="text-yellow-400 font-bold">★ {movie.imdbRating}</span>
                        <span className="text-gold font-bold font-mono">Base: {formatCr(movie.basePrice)}</span>
                      </div>
                      <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                        {movie.year} • {movie.director}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </section>
      </main>
    </Page>
  );
}

export { HomeScreen as LandingScreen };

// -------------------------------------------------------------
// 2. CREATE & JOIN FORM SCREEN (PERFECTLY CENTERED LAYOUT)
// -------------------------------------------------------------
export function GameForm({ mode }: { mode: "create" | "join" }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [auctionType, setAuctionType] = useState<AuctionType>("CRICKET");
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
    if (savedUser.name && savedUser.name !== "Franchise Owner" && savedUser.name !== "Movie Producer" && savedUser.name !== "Player 1") {
      setName(savedUser.name);
    }
    if (savedUser.color) {
      setSelectedColor(savedUser.color);
    }
  }, []);

  const numMax = Math.max(2, Math.min(8, Number(max) || 4));
  const numBudget = Math.max(50, Math.min(500, Number(budget) || 100));
  const numSeconds = Math.max(15, Math.min(90, Number(seconds) || 30));
  const totalItemsForCount = getRecommendedMoviePoolSize(numMax, auctionType);

  const cricketCategories = [
    { id: "ALL", title: "🏏 Full IPL Mega Auction Pool", subtitle: "All Batsmen, Bowlers, All-Rounders & Keepers" },
    { id: "BATTERS", title: "🏏 Explosive Batsmen & Wicketkeepers", subtitle: "Top-order run machines, keepers & clutch finishers" },
    { id: "BOWLERS", title: "🎯 Lethal Bowlers (Fast & Spin)", subtitle: "145+ km/h express pacers & mystery spinners" },
    { id: "ALL_ROUNDERS", title: "⚡ Match-Winning All-Rounders", subtitle: "Dual-threat 3D superstars" },
    { id: "FAST_BOWLERS", title: "⚡ Express Fast Bowlers Only", subtitle: "Yorker kings & powerplay swingers" },
    { id: "SPINNERS", title: "🌀 Mystery Spinners & Magicians", subtitle: "Turn, drift, and middle-overs control" },
  ];

  const cinemaCategories = [
    { id: "ALL", title: "🎬 All Studios & Global Cinema", subtitle: "Bollywood, South Pan-India, Hollywood & Masterpieces" },
    { id: "BOLLYWOOD", title: "🔥 Bollywood & Hindi Mega Hits", subtitle: "YRF, Dharma, Red Chillies, T-Series (Jawan, Dangal, Sholay)" },
    { id: "SOUTH_PAN_INDIA", title: "💥 South Pan-India Epics", subtitle: "RRR, Baahubali 2, KGF 2, Pushpa, Kantara, Kalki 2898 AD" },
    { id: "HOLLYWOOD", title: "🚀 Hollywood & Global Blockbusters", subtitle: "Interstellar, Inception, Dark Knight, Oppenheimer, Titanic" },
    { id: "MASTERPIECES", title: "🏆 Critically Acclaimed Masterpieces", subtitle: "Tumbbad, Gangs of Wasseypur, Andhadhun, Swades, Lagaan" },
  ];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter your franchise / bidder name to continue.");
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
      auctionType,
      maxPlayers: numMax,
      startingBudget: numBudget,
      auctionSeconds: numSeconds,
      category: category,
      totalMovies: totalItemsForCount,
    });

    navigate({
      to: "/room/$roomCode",
      params: { roomCode: room.roomCode },
    });
  };

  return (
    <Page>
      <main className="form-layout flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] py-8 sm:py-14 px-4 sm:px-8 w-full my-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto">
          <section className="form-card w-full bg-panel/95 border border-border/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/70 backdrop-blur-2xl text-center flex flex-col items-center">
            <div className="flex justify-center mb-2">
              <GameStatus icon={<StarDot />}>
                {mode === "create" ? "Custom Auction Setup" : "Join Bidding Arena"}
              </GameStatus>
            </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl text-cream tracking-tight text-center">
            {mode === "create" ? "CREATE AUCTION ROOM" : "JOIN EXISTING ROOM"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-6 text-center max-w-md">
            {mode === "create"
              ? "Configure your auction format, franchise purse, timer, and catalog."
              : "Enter your franchise name and 6-letter room code to join the live auction."}
          </p>

          {/* Rules Banner */}
          {auctionType === "CRICKET" && (
            <div className="w-full mb-6 p-4 rounded-2xl bg-gold/10 border border-gold/30 text-left">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-gold mb-1.5">
                <Info size={15} /> Official IPL Mega Auction Rules Enforced
              </div>
              <ul className="text-xs text-cream/90 space-y-1 list-disc list-inside">
                <li><strong>Squad Size:</strong> Min 12 players and Max 18 players per team.</li>
                <li><strong>Foreigners Quota:</strong> Purchase up to 7 overseas players in squad, maximum 4 in Playing 11.</li>
                <li><strong>Endgame:</strong> Submit your <strong>Playing 11</strong>, then AI decides the Champion & Leaderboard positions!</li>
              </ul>
            </div>
          )}

          <form onSubmit={submit} className="w-full space-y-6 text-left">
            {/* Mode selection if creating */}
            {mode === "create" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                  Select Auction Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAuctionType("CRICKET");
                      setCategory("ALL");
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      auctionType === "CRICKET"
                        ? "border-gold bg-gold/15 ring-2 ring-gold shadow-lg shadow-gold/10"
                        : "border-border/80 bg-black/30 hover:border-gold/40"
                    }`}
                  >
                    <span className="text-2xl mb-1 block">🏏</span>
                    <strong className="block text-sm font-bold text-cream">IPL Mega Auction</strong>
                    <span className="text-[11px] text-muted-foreground">70+ Cricketers, 12-18 Squad, Playing 11</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuctionType("CINEMA");
                      setCategory("ALL");
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      auctionType === "CINEMA"
                        ? "border-red bg-red/15 ring-2 ring-red shadow-lg shadow-red/10"
                        : "border-border/80 bg-black/30 hover:border-red/40"
                    }`}
                  >
                    <span className="text-2xl mb-1 block">🎬</span>
                    <strong className="block text-sm font-bold text-cream">Movie Cinema</strong>
                    <span className="text-[11px] text-muted-foreground">44+ Posters, 5-Film Slate</span>
                  </button>
                </div>
              </div>
            )}

            {/* Franchise / Bidder Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Your Franchise / Bidder Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vaibhav's XI, Mumbai Titans, Royal Challengers..."
                className="w-full h-12 px-4 rounded-xl bg-black/50 border border-border text-cream placeholder:text-muted-foreground text-sm font-semibold focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                required
              />
            </div>

            {/* If Join Mode: Room Code */}
            {mode === "join" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                  6-Letter Room Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 7X8K2M"
                  maxLength={6}
                  className="w-full h-12 px-4 rounded-xl bg-black/50 border border-border text-cream placeholder:text-muted-foreground text-center font-mono font-black text-xl tracking-widest uppercase focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  required
                />
              </div>
            )}

            {/* If Create Mode: Settings */}
            {mode === "create" && (
              <>
                {/* Category Options */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Catalog Category (Batsmen, Bowlers, All-Rounders)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {(auctionType === "CRICKET" ? cricketCategories : cinemaCategories).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          category === cat.id
                            ? "border-gold bg-gold/15 ring-1 ring-gold"
                            : "border-border/60 bg-black/30 hover:border-border"
                        }`}
                      >
                        <strong className="block text-xs font-bold text-cream truncate">{cat.title}</strong>
                        <span className="block text-[10px] text-muted-foreground truncate">{cat.subtitle}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">
                      Max Franchises
                    </label>
                    <select
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-black/50 border border-border text-cream text-xs font-bold"
                    >
                      <option value="2">2 Franchises ({getRecommendedMoviePoolSize(2, auctionType)} Players)</option>
                      <option value="3">3 Franchises ({getRecommendedMoviePoolSize(3, auctionType)} Players)</option>
                      <option value="4">4 Franchises ({getRecommendedMoviePoolSize(4, auctionType)} Players)</option>
                      <option value="5">5 Franchises ({getRecommendedMoviePoolSize(5, auctionType)} Players)</option>
                      <option value="6">6 Franchises ({getRecommendedMoviePoolSize(6, auctionType)} Players)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">
                      Starting Purse
                    </label>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-black/50 border border-border text-cream text-xs font-bold"
                    >
                      <option value="80">₹80 Cr</option>
                      <option value="100">₹100 Cr (IPL Standard)</option>
                      <option value="120">₹120 Cr (Mega Purse)</option>
                      <option value="150">₹150 Cr</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-muted-foreground mb-1">
                      Timer / Round
                    </label>
                    <select
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-black/50 border border-border text-cream text-xs font-bold"
                    >
                      <option value="20">20s (Fast Action)</option>
                      <option value="30">30s (IPL Standard)</option>
                      <option value="45">45s (Tactical Bidding)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Accent Color Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Franchise Theme Accent
              </label>
              <div className="flex items-center gap-3">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-9 h-9 rounded-full transition-transform ${
                      selectedColor === c.hex ? "ring-4 ring-white/50 scale-110 shadow-lg" : "opacity-75 hover:opacity-100"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-13 bg-gradient-to-r from-red to-rose-600 font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-red/30 hover:brightness-110 flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : mode === "create" ? (
                <>
                  <Gavel size={18} /> Initialize Live Auction Room
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" /> Enter Bidding Arena
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
// 3. LOBBY SCREEN (PRE-GAME WAITING ROOM)
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

  const handleStartGame = () => {
    if (!room) return;
    room.status = "AUCTION";
    room.currentMovieIndex = 0;
    const firstMovie = room.moviePool[0];
    room.currentBid = firstMovie ? firstMovie.basePrice : 1;
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
      <main className="lobby-layout max-w-6xl mx-auto px-4 sm:px-8 py-10 flex flex-col gap-6 w-full">
        {/* Lobby Header */}
        <section className="bg-panel/90 border border-border/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="text-left">
            <GameStatus icon={<StarDot />}>Live Bidding Lobby</GameStatus>
            <h1 className="text-3xl sm:text-4xl font-black text-cream font-display mt-2">
              {isCricket ? "🏏 IPL MEGA AUCTION LOBBY" : "🎬 FILM STUDIO LOBBY"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Share the room code with rival franchise owners to join and begin.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2">
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

        {/* Rules Reminder Card */}
        {isCricket && (
          <section className="p-4 rounded-2xl bg-gold/10 border border-gold/30 text-left flex items-start gap-3">
            <Info size={18} className="text-gold flex-shrink-0 mt-0.5" />
            <div className="text-xs text-cream/90">
              <strong className="text-gold block mb-0.5">IPL Mega Auction Rules:</strong>
              Each franchise builds a squad of <strong>12 to 18 players</strong> with <strong>up to 7 overseas players</strong>. At the end of the auction, each franchise submits their <strong>Playing 11 (max 4 overseas)</strong>, and the AI Jury simulates the championship tournament to crown the winner and generate the Leaderboard!
            </div>
          </section>
        )}

        {/* Players Grid and Action Controls */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-panel/90 border border-border/80 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-cream font-display">
                Franchises in Room ({room.players.length} / {room.settings.maxPlayers})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {room.players.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-black/40 border border-border/70 flex items-center justify-between gap-3 shadow-inner"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border-2 flex-shrink-0 shadow-sm"
                      style={p.color ? { borderColor: p.color, color: p.color } : undefined}
                    >
                      {p.avatar}
                    </span>
                    <div className="flex flex-col min-w-0 text-left">
                      <strong className="text-xs sm:text-sm font-bold text-cream truncate">
                        {p.name} {p.id === currentUser.id && "(You)"}
                      </strong>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {p.isHost ? "👑 Room Host" : "🎮 Franchise Owner"}
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
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/60 text-center">
              <div className="p-2.5 rounded-xl bg-black/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Purse</span>
                <strong className="block text-xs font-black text-gold mt-0.5">{formatCr(room.settings.startingBudget)}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Timer</span>
                <strong className="block text-xs font-black text-cream mt-0.5">{room.settings.auctionSeconds}s / Item</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Auction Slate</span>
                <strong className="block text-xs font-black text-cyan-400 mt-0.5">{room.moviePool.length} Players</strong>
              </div>
            </div>

            {/* Start Button */}
            {isHost ? (
              <button
                type="button"
                onClick={handleStartGame}
                className="btn btn-primary w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-red to-rose-600 font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-red/30 hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Gavel size={18} /> Launch Live Auction
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-black/40 border border-border/70 text-center text-xs text-muted-foreground mt-2">
                Waiting for host (<strong>{room.hostName}</strong>) to launch the auction...
              </div>
            )}
          </div>

          {/* Right Chat Sidebar */}
          <aside className="bg-panel/90 border border-border/80 rounded-3xl p-4 shadow-xl flex flex-col">
            <RoomChat roomCode={code} playerName={currentUser.name} />
          </aside>
        </section>
      </main>
    </Page>
  );
}

// -------------------------------------------------------------
// 4. LIVE AUCTION SCREEN (SPACIOUS 3-COLUMN DESKTOP WAR-ROOM)
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
    if (activeRoom.status !== "AUCTION") {
      activeRoom.status = "AUCTION";
    }
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

  // IPL Rule checks for user (max 7 in squad, max 4 in Playing 11)
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

  const handleUserOut = () => {
    if (room.isSold || isMeOut || isWinning) return;
    const res = playerPassOrOut(room.roomCode, me.id);
    if (res.success && res.room) {
      setRoom({ ...res.room });
      if (res.isResolved) {
        playGavelWinSound();
      }
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

  const roleInfo = getRoleBadge(currentItem.role, currentItem.genre);

  const [activeRosterPlayerId, setActiveRosterPlayerId] = useState<string | null>(null);
  const activeRosterFranchise = room.players.find((p) => p.id === (activeRosterPlayerId || currentUser.id)) || me;
  const displayedRoster = activeRosterFranchise?.movies || [];
  const displayedOverseasCount = isCricket ? displayedRoster.filter((m) => isOverseasPlayer(m)).length : 0;

  return (
    <Page>
      <main className="auction-layout max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-stretch w-full">
        {/* Left Column: Real Cricketer Card with High-Res Photo & Stats */}
        <section className="lg:col-span-4 xl:col-span-3 bg-panel/90 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between gap-3 h-full">
          <div className="flex flex-col gap-2.5">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden relative shadow-inner bg-black flex-shrink-0">
              <Poster movie={currentItem} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col gap-1 text-left">
              <div className="flex items-center gap-2 flex-wrap text-xs text-gold font-bold">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] ${roleInfo.colorClass}`}>
                  {roleInfo.label}
                </span>
                <span>•</span>
                <span className="text-cyan-300">
                  {isOverseasItem ? `✈️ ${currentItem.country || "Overseas"}` : `🇮🇳 India`}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-cream font-display leading-tight">
                {currentItem.title}
              </h2>

              {/* Cricket Stats Grid */}
              {isCricket && currentItem.stats ? (
                <div className="grid grid-cols-3 gap-1.5 mt-0.5 pt-2 border-t border-border/70 text-center">
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
              ) : (
                <p className="text-xs text-muted-foreground">
                  Director: <strong>{currentItem.director}</strong> | IMDb:{" "}
                  <strong>★ {currentItem.imdbRating}</strong> | BO: <strong>₹{currentItem.boxOffice} Cr</strong>
                </p>
              )}

              {currentItem.signatureSkill && (
                <div className="p-1.5 rounded-lg bg-gold/10 border border-gold/30 text-[10px] font-semibold text-gold flex items-center gap-1.5">
                  <Zap size={12} className="text-gold flex-shrink-0" />
                  <span>Specialty: {currentItem.signatureSkill}</span>
                </div>
              )}

              {currentItem.tagline && (
                <p className="text-[11px] text-cream/70 italic bg-black/20 p-1.5 rounded-lg">
                  "{currentItem.tagline}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/70 mt-auto">
            <span className="text-xs uppercase font-bold text-muted-foreground">Opening Base Price</span>
            <strong className="text-base font-black text-gold font-mono">{formatCr(currentItem.basePrice)}</strong>
          </div>
        </section>

        {/* Center Column: Live Stage, Timer, Big Bid Readout, "OUT" button & Bid Controls */}
        <section className="lg:col-span-8 xl:col-span-5 bg-panel/90 border border-border/80 rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center justify-between gap-3 shadow-xl h-full">
          <div className="w-full flex items-center justify-between">
            <GameStatus icon={<StarDot />}>
              {isCricket ? "🏏 IPL Live Bidding Round" : "🎬 Cinema Bidding Round"}
            </GameStatus>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              Round {room.currentMovieIndex + 1} of {totalRounds}
            </span>
          </div>

          {/* Auction Countdown Timer */}
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

          {/* Round Sold / Passed Plaque OR Active Bid & "OUT" Controls */}
          {room.isSold ? (
            <div className="sold-panel w-full max-w-md bg-gradient-to-b from-panel to-panel-strong border border-gold/50 rounded-2xl p-4 sm:p-5 shadow-2xl text-center my-auto flex flex-col items-center">
              <span className="text-xs uppercase font-black text-gold tracking-widest block mb-1.5">
                🔨 Gavel Down • Round Concluded
              </span>
              <div className="w-16 h-20 rounded-xl overflow-hidden border border-gold/40 mb-2 shadow-lg">
                <Poster movie={currentItem} className="w-full h-full" />
              </div>
              <h2 className="text-xl font-black text-cream font-display">{currentItem.title}</h2>
              <p className="text-xs mt-1 text-cream/90">
                {room.currentBidderId ? (
                  <>
                    Acquired by <strong className="text-gold">{currentLeaderName}</strong> for{" "}
                    <strong className="text-gold font-mono">{formatCr(room.currentBid)}</strong>
                  </>
                ) : (
                  <span className="text-muted-foreground">Passed with all franchises calling OUT / no bids.</span>
                )}
              </p>

              {isHost ? (
                <button
                  onClick={handleNextItem}
                  className="btn btn-primary mt-3 mx-auto px-6 py-2.5 bg-gradient-to-r from-red to-rose-600 font-bold rounded-xl flex items-center gap-2 text-xs"
                >
                  {room.currentMovieIndex + 1 >= totalRounds ? "Finalize Playing 11 & Evaluate" : "Next Round"}
                  <ChevronRight size={16} />
                </button>
              ) : (
                <div className="text-xs text-muted-foreground mt-2">
                  Waiting for room host to advance to round {room.currentMovieIndex + 2}...
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center gap-2.5">
              {/* Warnings if squad limit or overseas limit is reached */}
              {isSquadFull ? (
                <div className="w-full p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs font-bold text-center">
                  ⛔ Squad Limit Reached (18/18 players). You have completed your full squad!
                </div>
              ) : isOverseasFull ? (
                <div className="w-full p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs font-bold text-center">
                  ✈️ Overseas Squad Limit Reached (7/7 overseas players). You cannot bid on overseas players in squad.
                </div>
              ) : isMeOut ? (
                <div className="w-full p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold text-center">
                  🔴 You called <strong>"OUT"</strong> on this {isCricket ? "player" : "movie"}. You cannot bid on this round.
                </div>
              ) : (
                <>
                  {/* Quick Increment Bidding Buttons */}
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

                  {/* Main Primary Bid Button */}
                  <button
                    type="button"
                    className="btn btn-primary w-full py-3 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-gold/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isWinning || me.budget < room.currentBid + 1}
                    onClick={() => handleUserBid(1)}
                  >
                    {isWinning ? "Leading Highest Bid (You)" : `Raise Bid to ${formatCr(room.currentBid + 1)}`}
                  </button>

                  {/* OUT Button */}
                  <button
                    type="button"
                    onClick={handleUserOut}
                    disabled={isWinning}
                    className="w-full py-2 px-3 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/50 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Declare that you are OUT on this player and will not bid anymore this round"
                  >
                    <XCircle size={14} /> ⛔ I'm OUT (Pass On This {isCricket ? "Player" : "Movie"})
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

          {/* Franchise Squad Quota Progress Bar */}
          <div className="mt-1 flex items-center gap-2.5 text-xs text-muted-foreground bg-black/40 px-4 py-1.5 rounded-full border border-border/60 flex-wrap justify-center">
            <Award size={13} className="text-gold" />
            <span>Squad:</span>
            <strong className={me.movies.length >= 12 ? "text-emerald-400" : "text-amber-300"}>
              {me.movies.length} / 18 {isCricket ? "(Min 12)" : "Acquired"}
            </strong>

            {isCricket && (
              <>
                <span>•</span>
                <span className={myOverseasCount >= 7 ? "text-amber-400 font-bold" : "text-cyan-300 font-semibold"}>
                  ✈️ {myOverseasCount} / 7 OS (Max 4 in 11)
                </span>
              </>
            )}
          </div>
        </section>

        {/* Right Column: Participant Status & Live War-Room Chat */}
        <aside className="lg:col-span-12 xl:col-span-4 flex flex-col gap-3">
          <div className="bg-panel/90 border border-border/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-black">
                Franchise Bidders Status
              </h3>
              <span className="text-[10px] text-muted-foreground">Live Room</span>
            </div>

            <div className="flex flex-col gap-1.5">
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
            className="rounded-2xl p-4"
          />
        </aside>

        {/* Bottom Section: Real-Time Acquired Players / Squad Tray */}
        <section className="lg:col-span-12 bg-panel/90 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3 mt-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
                <Award size={18} />
              </span>
              <div className="flex flex-col text-left">
                <h3 className="text-sm font-black text-cream uppercase tracking-wider font-display flex items-center gap-2">
                  {activeRosterFranchise?.id === currentUser.id ? "My Acquired Squad" : `${activeRosterFranchise?.name}'s Squad`}
                  <span className="text-xs font-mono font-bold text-gold">
                    ({displayedRoster.length} / 18 Players)
                  </span>
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Real-time bought players • {isCricket ? `✈️ ${displayedOverseasCount}/7 Overseas` : `🎬 ${displayedRoster.length} Titles`} • Purse: <strong>{formatCr(activeRosterFranchise?.budget || 0)}</strong>
                </span>
              </div>
            </div>

            {/* Franchise Filter Tabs */}
            {room.players.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {room.players.map((p) => {
                  const isSelected = p.id === (activeRosterPlayerId || currentUser.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveRosterPlayerId(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                        isSelected
                          ? "bg-gold text-black shadow-md shadow-gold/20 font-black"
                          : "bg-black/40 text-cream/80 hover:bg-black/70 border border-border/60"
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span className="truncate max-w-[110px]">{p.id === currentUser.id ? "My Squad" : p.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-mono">
                        {p.movies.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acquired Players Grid */}
          {displayedRoster.length === 0 ? (
            <div className="p-8 rounded-xl bg-black/20 border border-dashed border-border/60 text-center flex flex-col items-center justify-center gap-2">
              <Award size={28} className="text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No players acquired yet. Win live bidding rounds to build your squad in real time!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
              {displayedRoster.map((item, idx) => {
                const role = getRoleBadge(item.role, item.genre);
                const isOverseas = isOverseasPlayer(item);
                return (
                  <div
                    key={`${item.id}_${idx}`}
                    className="group bg-black/50 border border-border/70 hover:border-gold/50 rounded-xl p-2.5 flex flex-col gap-2 transition-all shadow-md animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="aspect-[4/3] w-full rounded-lg overflow-hidden relative shadow-inner bg-black">
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
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border truncate ${role.colorClass}`}>
                          {role.label}
                        </span>
                        {isCricket && (
                          <span className="text-[10px] flex-shrink-0" title={isOverseas ? "Overseas Player" : "Indian Player"}>
                            {isOverseas ? "✈️" : "🇮🇳"}
                          </span>
                        )}
                      </div>
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
// 5. RESULTS & EVALUATION SCREEN (PLAYING 11 SELECTION & LEADERBOARD)
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
    if (isCricket) {
      return getOptimalPlaying11(userWonItems);
    }
    return { playing11: userWonItems.slice(0, 5).map((m) => m.id) };
  }, [isCricket, userWonItems]);

  const [selected, setSelected] = useState<string[]>(() => initialOptimal.playing11);
  const [captainId, setCaptainId] = useState<string | undefined>(() => initialOptimal.captainId);
  const [viceCaptainId, setViceCaptainId] = useState<string | undefined>(() => initialOptimal.viceCaptainId);
  const [selectionNotice, setSelectionNotice] = useState<string>("");
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

  const targetCount = isCricket ? Math.min(11, Math.max(1, userWonItems.length)) : Math.min(5, Math.max(1, userWonItems.length));

  // Compute selected player composition
  const selectedPlayers = useMemo(
    () => userWonItems.filter((item) => selected.includes(item.id)),
    [userWonItems, selected],
  );

  const selectedOverseasCount = useMemo(
    () => selectedPlayers.filter((m) => isOverseasPlayer(m)).length,
    [selectedPlayers],
  );

  const roleCounts = useMemo(() => {
    let batsmen = 0;
    let keepers = 0;
    let bowlers = 0;
    let allRounders = 0;

    selectedPlayers.forEach((m) => {
      const badge = getRoleBadge(m.role, m.genre);
      if (badge.label.includes("WICKETKEEPER")) keepers++;
      else if (badge.label.includes("BATSMAN") || badge.label.includes("BATTER")) batsmen++;
      else if (badge.label.includes("ALL-ROUNDER")) allRounders++;
      else if (badge.label.includes("BOWLER")) bowlers++;
    });

    return { batsmen, keepers, bowlers, allRounders };
  }, [selectedPlayers]);

  const toggleSelect = (item: OwnedMovie) => {
    setSelectionNotice("");
    if (selected.includes(item.id)) {
      if (selected.length <= 1) return; // Keep at least 1
      setSelected(selected.filter((id) => id !== item.id));
      if (captainId === item.id) setCaptainId(undefined);
      if (viceCaptainId === item.id) setViceCaptainId(undefined);
    } else {
      if (selected.length >= targetCount) {
        setSelectionNotice(`Playing 11 is full (${targetCount}/${targetCount}). Click an existing player to swap.`);
        return;
      }

      // Check overseas constraint
      if (isCricket && isOverseasPlayer(item)) {
        if (selectedOverseasCount >= 4) {
          setSelectionNotice("Foreign Player Limit (Max 4): You already have 4 overseas players in your Playing 11.");
          return;
        }
      }

      setSelected([...selected, item.id]);
    }
  };

  const handleAutoPick = () => {
    const optimal = getOptimalPlaying11(userWonItems);
    setSelected(optimal.playing11);
    setCaptainId(optimal.captainId);
    setViceCaptainId(optimal.viceCaptainId);
    setSelectionNotice("⚡ Optimal Playing 11 selected (Balanced roles, Max 4 Overseas).");
  };

  const handleStartRematch = () => {
    navigate({ to: "/create" });
  };

  return (
    <Page>
      <main className="results-container max-w-5xl mx-auto px-4 sm:px-8 py-10 w-full flex flex-col items-center">
        {step === "select" && (
          <section className="w-full flex flex-col items-center text-center">
            <GameStatus icon={<StarDot />}>
              {isCricket ? "Championship XI Selection" : "Select Top 5 Slate"}
            </GameStatus>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-cream tracking-tight mt-2">
              {isCricket ? "SUBMIT YOUR PLAYING 11" : "CURATE YOUR FESTIVAL PORTFOLIO"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl">
              {isCricket
                ? "Select your 11 match-winners from your squad of 12–18. Max 4 overseas players allowed. The AI Committee will simulate the tournament to determine the champion!"
                : "Choose your top 5 movie titles to submit to the Grand Jury for final ranking."}
            </p>

            {/* Live Playing 11 Composition Bar */}
            {isCricket && userWonItems.length > 0 && (
              <div className="w-full my-4 p-4 rounded-2xl bg-panel/90 border border-gold/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-muted-foreground">Playing 11:</span>
                    <span className={`text-sm font-black ${selected.length === 11 ? "text-emerald-400" : "text-gold"}`}>
                      {selected.length} / {targetCount} Selected
                    </span>
                  </div>

                  <span className="text-muted-foreground">•</span>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-lg border font-bold ${
                        selectedOverseasCount > 4
                          ? "bg-red-950/80 border-red-500 text-red-300"
                          : "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                      }`}
                    >
                      ✈️ {selectedOverseasCount} / 4 Overseas
                    </span>
                  </div>

                  <span className="text-muted-foreground">•</span>

                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-wrap">
                    <span>🏏 {roleCounts.batsmen} Batsmen</span>
                    <span>•</span>
                    <span>🧤 {roleCounts.keepers} WKs</span>
                    <span>•</span>
                    <span>⚡ {roleCounts.allRounders} ARs</span>
                    <span>•</span>
                    <span>🎯 {roleCounts.bowlers} Bowlers</span>
                  </div>
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

            {selectionNotice && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-semibold mb-3 flex items-center gap-2">
                <AlertCircle size={15} /> {selectionNotice}
              </div>
            )}

            {userWonItems.length === 0 ? (
              <div className="p-8 rounded-2xl bg-panel/80 border border-border mt-6 text-muted-foreground text-sm">
                You did not win any items during this auction. Your evaluation will be based on preserved budget.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 mt-4 w-full">
                {userWonItems.map((item) => {
                  const isSelected = selected.includes(item.id);
                  const isCap = captainId === item.id;
                  const isVC = viceCaptainId === item.id;

                  return (
                    <MovieCard
                      key={item.id}
                      movie={item}
                      price={item.purchasePrice}
                      selected={isSelected}
                      isCaptain={isCap}
                      isViceCaptain={isVC}
                      onClick={() => toggleSelect(item)}
                      onMakeCaptain={(e) => {
                        e.stopPropagation();
                        setCaptainId(isCap ? undefined : item.id);
                        if (viceCaptainId === item.id) setViceCaptainId(undefined);
                      }}
                      onMakeViceCaptain={(e) => {
                        e.stopPropagation();
                        setViceCaptainId(isVC ? undefined : item.id);
                        if (captainId === item.id) setCaptainId(undefined);
                      }}
                    />
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep("evaluating")}
              className="btn btn-primary mt-8 px-10 py-4 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-gold/20 hover:brightness-110 flex items-center gap-2"
            >
              <Trophy size={18} /> Submit Playing 11 for AI Championship Scoring
            </button>
          </section>
        )}

        {step === "evaluating" && (
          <section className="py-16 flex flex-col items-center gap-4 text-center">
            <LoaderCircle size={56} className="animate-spin text-gold" />
            <h2 className="font-display font-black text-2xl sm:text-3xl text-cream">
              {isCricket ? "AI JURY IS SIMULATING IPL CHAMPIONSHIP..." : "TABULATING GRAND JURY STANDINGS..."}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
              Evaluating batting depth, bowling strike power, death overs mastery, overseas quota synergy, and franchise capital efficiency...
            </p>
          </section>
        )}

        {step === "final" && (
          <section className="w-full flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={20} className="text-gold" />
              <GameStatus>Grand Championship Podium</GameStatus>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl text-cream tracking-tight">
              IPL LEADERBOARD
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-lg">
              Official scoring tabulated across all 4 pillars by the AI Championship Committee.
            </p>

            <RankingList players={room?.players ?? []} rankings={rankings} isCricket={isCricket} />

            <div className="flex items-center gap-4 mt-8">
              <button
                type="button"
                onClick={handleStartRematch}
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
