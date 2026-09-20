import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Film,
  Flame,
  Gavel,
  ListFilter,
  LoaderCircle,
  Medal,
  Pause,
  Play,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from "lucide-react";
import {
  formatCr,
  type Movie,
  type OwnedMovie,
  type Player,
} from "@/lib/game-data";
import { getCurrentUser, type PlayerScore } from "@/lib/game-manager";
import { getOfficialPosterUrl } from "@/lib/movie-posters";
import { CRICKETER_PORTRAIT_SEEDS, getRealCricketerPhoto, getSafeCdnPhotoUrl } from "@/lib/cricket-portraits";
import { isOverseasPlayer } from "@/lib/cricket-data";
import { isAudioMuted, toggleAudioMute } from "@/lib/sound-effects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import posterSheet from "@/assets/movie-posters.jpg";
import cinebidLogo from "@/assets/cinebid-logo.jpg";

export function SiteHeader() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <header className="site-header flex items-center justify-between px-4 sm:px-8 py-3 bg-panel/85 border-b border-border/80 backdrop-blur-md sticky top-0 z-40">
      <Link to="/" className="brand flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-gold/40 shadow-sm group-hover:border-gold transition-colors">
          <img src={cinebidLogo} alt="Auction Hub Emblem" className="w-full h-full object-cover" />
        </div>
        <span className="font-black tracking-wider text-base sm:text-lg text-cream flex items-center gap-1.5 font-display">
          CINE<span className="text-gold">BID</span>
          <span className="text-muted-foreground/40 text-xs font-normal hidden sm:inline">|</span>
          <span className="text-xs sm:text-sm text-amber-400 font-bold hidden sm:inline">IPL MEGA AUCTION</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {user && user.name && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-xs font-semibold text-gold">
            <Crown size={13} />
            <span className="truncate max-w-[140px]">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}

export function GameStatus({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="game-status inline-flex items-center gap-2 px-3 py-1 rounded-full bg-panel border border-border text-xs font-semibold text-cream/90 shadow-sm">
      {icon}
      <span>{children}</span>
    </div>
  );
}

/**
 * Returns role badge element and categorization
 */
export function getRoleBadge(role?: string, genre?: string) {
  const r = (role || genre || "").toUpperCase();
  if (r.includes("WICKETKEEPER") || r.includes("KEEPER")) {
    return {
      label: "WK-BAT",
      fullLabel: "Wicketkeeper",
      icon: "🧤",
      colorClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      category: "BATSMAN",
    };
  }
  if (r.includes("BATTER") || r.includes("BATSMAN") || r.includes("OPENER")) {
    return {
      label: "BATSMAN",
      fullLabel: "Batsman",
      icon: "🏏",
      colorClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      category: "BATSMAN",
    };
  }
  if (r.includes("ALL_ROUNDER") || r.includes("ALL-ROUNDER") || r.includes("ALLROUNDER")) {
    return {
      label: "ALL-ROUNDER",
      fullLabel: "All-Rounder",
      icon: "⚡",
      colorClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      category: "ALL_ROUNDER",
    };
  }
  if (r.includes("FAST_BOWLER") || r.includes("PACER") || r.includes("SEAM")) {
    return {
      label: "FAST BOWLER",
      fullLabel: "Fast Bowler",
      icon: "🎯",
      colorClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      category: "BOWLER",
    };
  }
  if (r.includes("SPIN_BOWLER") || r.includes("SPINNER") || r.includes("WRIST")) {
    return {
      label: "SPIN BOWLER",
      fullLabel: "Spin Bowler",
      icon: "🌀",
      colorClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      category: "BOWLER",
    };
  }
  return {
    label: "PLAYER",
    fullLabel: "Player",
    icon: "🏏",
    colorClass: "bg-gold/15 text-gold border-gold/30",
    category: "BATSMAN",
  };
}

/**
 * High-Resolution Movie Poster & Real Cricketer Photograph Component.
 * Supports verified high-res photo URLs, seeds, and dynamic lookups.
 */
export function Poster({ movie, className }: { movie: Movie | OwnedMovie; className?: string }) {
  const isCricket = movie.auctionType === "CRICKET" || Boolean(movie.role) || Boolean(movie.photoUrl);
  const baseId = (movie.id || "").replace(/-draft-\d+/g, "");
  const directSeed = isCricket
    ? getSafeCdnPhotoUrl(CRICKETER_PORTRAIT_SEEDS[baseId] || CRICKETER_PORTRAIT_SEEDS[movie.id] || movie.photoUrl || "")
    : getOfficialPosterUrl(movie.id);
  const [photoSrc, setPhotoSrc] = useState<string>(directSeed || "");
  const [imgError, setImgError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setImgError(false);
    setFallbackAttempted(false);

    if (isCricket) {
      const bId = (movie.id || "").replace(/-draft-\d+/g, "");
      const seedUrl = CRICKETER_PORTRAIT_SEEDS[bId] || CRICKETER_PORTRAIT_SEEDS[movie.id] || movie.photoUrl;
      if (seedUrl) {
        setPhotoSrc(getSafeCdnPhotoUrl(seedUrl));
      } else {
        void getRealCricketerPhoto(bId || movie.id, movie.title).then((resolved) => {
          if (isMounted && resolved) {
            setPhotoSrc(getSafeCdnPhotoUrl(resolved));
          }
        });
      }
    } else {
      setPhotoSrc(getOfficialPosterUrl(movie.id) || "");
    }
    return () => {
      isMounted = false;
    };
  }, [movie.id, movie.title, movie.photoUrl, isCricket]);

  const handleImageError = () => {
    if (isCricket && !fallbackAttempted) {
      setFallbackAttempted(true);
      const bId = (movie.id || "").replace(/-draft-\d+/g, "");
      void getRealCricketerPhoto(bId || movie.id, movie.title).then((altUrl) => {
        if (altUrl && altUrl !== photoSrc) {
          setPhotoSrc(getSafeCdnPhotoUrl(altUrl));
        } else {
          setImgError(true);
        }
      });
    } else {
      setImgError(true);
    }
  };

  const isOverseas = isCricket && isOverseasPlayer(movie);
  const roleBadge = getRoleBadge(movie.role, movie.genre);

  if (isCricket) {
    return (
      <div className={`poster overflow-hidden rounded-2xl relative bg-gradient-to-b from-slate-900 via-panel to-black border border-border/80 shadow-xl group ${className || ""}`}>
        {photoSrc && !imgError ? (
          <img
            src={photoSrc}
            alt={`${movie.title} official cricketer photo`}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-black select-none border border-gold/30 rounded-2xl relative overflow-hidden shadow-2xl">
            {/* Subtle atmospheric ambient glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-36 h-36 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:14px_14px] opacity-30 pointer-events-none" />

            {/* Clean Monogram Crest */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/60 border border-gold/40 flex flex-col items-center justify-center shadow-lg mb-2.5 relative z-10 backdrop-blur-sm">
              <span className="text-xl sm:text-2xl font-black text-gold font-display tracking-wider leading-none">
                {movie.title
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
            </div>

            {/* Clean Player Name */}
            <h3 className="text-sm sm:text-base font-black text-cream font-display uppercase tracking-wide leading-snug max-w-[90%] relative z-10">
              {movie.title}
            </h3>

            {/* Subtle category line */}
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground relative z-10">
              <span className="text-cream/80 font-semibold">{roleBadge.fullLabel || roleBadge.label}</span>
              <span>•</span>
              <span className="text-gold/90 font-mono font-semibold">
                {isOverseas ? (movie.country || "Overseas") : "India"}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`poster overflow-hidden rounded-2xl relative bg-black/60 border border-border/60 shadow-md ${className || ""}`}>
      {photoSrc && !imgError ? (
        <img
          src={photoSrc}
          alt={`${movie.title} official movie poster`}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : movie.posterPosition ? (
        <img
          src={posterSheet}
          alt={`${movie.title} movie artwork`}
          loading="lazy"
          width={1024}
          height={1536}
          className="w-full h-full object-cover"
          style={{ objectPosition: movie.posterPosition }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-amber-950/40 via-panel to-black">
          <Film size={28} className="text-gold mb-2 opacity-80" />
          <strong className="text-sm font-bold text-cream block truncate w-full">{movie.title}</strong>
          <span className="text-[10px] text-muted-foreground mt-0.5">{movie.year} • {movie.genre}</span>
        </div>
      )}
    </div>
  );
}

export function MovieCard({
  movie,
  price,
  selected,
  onClick,
  isCaptain,
  isViceCaptain,
  onMakeCaptain,
  onMakeViceCaptain,
}: {
  movie: Movie | OwnedMovie;
  price?: number;
  selected?: boolean;
  onClick?: () => void;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onMakeCaptain?: (e: React.MouseEvent) => void;
  onMakeViceCaptain?: (e: React.MouseEvent) => void;
}) {
  const isCricket = movie.auctionType === "CRICKET" || Boolean(movie.role);
  const isOverseas = isCricket && isOverseasPlayer(movie);
  const roleBadge = getRoleBadge(movie.role, movie.genre);

  return (
    <div
      onClick={onClick}
      className={`movie-card group cursor-pointer transition-all text-left overflow-hidden rounded-2xl border relative flex flex-col ${
        selected
          ? "selected ring-2 ring-gold border-gold scale-[1.02] shadow-xl shadow-gold/20 bg-panel-strong"
          : "border-border/80 bg-panel/90 hover:border-gold/50 shadow-md hover:bg-panel"
      }`}
    >
      {/* Selected Indicator Pill */}
      {selected && (
        <div className="absolute top-2 right-2 z-20 bg-gold text-black font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
          <Star size={10} fill="black" /> Selected
        </div>
      )}

      {/* Captain / Vice-Captain Badges */}
      {isCaptain && (
        <div className="absolute top-2 left-2 z-20 bg-amber-400 text-black font-black text-[11px] px-2.5 py-0.5 rounded-lg shadow-lg border border-white/40 flex items-center gap-1">
          <Crown size={12} fill="black" /> CAPTAIN
        </div>
      )}
      {isViceCaptain && !isCaptain && (
        <div className="absolute top-2 left-2 z-20 bg-cyan-400 text-black font-black text-[11px] px-2.5 py-0.5 rounded-lg shadow-lg border border-white/40 flex items-center gap-1">
          <Shield size={12} fill="black" /> VICE-CAPTAIN
        </div>
      )}

      <div className={`${isCricket ? "aspect-[3/4]" : "aspect-[2/3]"} w-full overflow-hidden relative bg-black/50`}>
        <Poster movie={movie} className="w-full h-full rounded-none" />
      </div>

      <div className="p-3 bg-panel/95 border-t border-border/70 flex flex-col justify-between flex-1">
        <div>
          {isCricket ? (
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${roleBadge.colorClass}`}>
                {roleBadge.icon} {roleBadge.label}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {isOverseas ? "✈️ Overseas" : "🇮🇳 India"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-gold font-bold mb-1">
              <span>{movie.year}</span>
              <span>•</span>
              <span className="truncate max-w-[130px]">{movie.genre}</span>
            </div>
          )}

          <strong className="block truncate text-xs sm:text-sm font-black text-cream group-hover:text-gold transition-colors">
            {movie.title}
          </strong>

          {!isCricket && movie.director && (
            <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
              Dir: {movie.director}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
          <span className={`${isCricket ? "text-cyan-400" : "text-yellow-400"} font-bold flex items-center gap-0.5 text-[11px]`}>
            ★ {movie.imdbRating || (isCricket ? 9.2 : 8.0)}
          </span>
          {price !== undefined && (
            <span className="text-gold font-bold font-mono">{formatCr(price)}</span>
          )}
        </div>

        {/* C / VC Assignment buttons if selected in Playing 11 */}
        {selected && isCricket && (
          <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onMakeCaptain}
              className={`py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                isCaptain
                  ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                  : "bg-black/40 border-border hover:border-gold/60 text-muted-foreground hover:text-cream"
              }`}
            >
              ★ Make (C)
            </button>
            <button
              type="button"
              onClick={onMakeViceCaptain}
              className={`py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                isViceCaptain
                  ? "bg-cyan-400 text-black border-cyan-300 shadow-sm"
                  : "bg-black/40 border-border hover:border-cyan-500/60 text-muted-foreground hover:text-cream"
              }`}
            >
              🛡️ Make (VC)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlayerCard({
  player,
  current,
  isLeading,
  isOut,
  isCricket = false,
}: {
  player: Player;
  current?: boolean;
  isLeading?: boolean;
  isOut?: boolean;
  isCricket?: boolean;
}) {
  const playerMovies = player.movies || [];
  const wonCount = playerMovies.length;
  const overseasCount = isCricket ? playerMovies.filter((m) => isOverseasPlayer(m)).length : 0;
  const isSquadReady = isCricket ? wonCount >= 12 : wonCount >= 5;
  const isSquadFull = isCricket ? wonCount >= 18 : wonCount >= 10;

  return (
    <div
      className={`player-card transition-all ${
        isLeading
          ? "ring-2 ring-gold bg-gradient-to-r from-gold/20 via-panel to-panel shadow-md shadow-gold/10 border-gold"
          : isOut
            ? "opacity-60 bg-black/40 border-border/50"
            : current
              ? "ring-1 ring-gold/40 bg-panel/95 border-gold/40"
              : "bg-panel/90 border-border/70"
      } border rounded-2xl p-3 flex items-center gap-3`}
    >
      <span
        className="avatar w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border-2 flex-shrink-0 shadow-md"
        style={player.color ? { borderColor: player.color, color: player.color } : undefined}
      >
        {player.avatar}
      </span>

      <div className="player-card-copy flex-1 min-w-0">
        <div className="flex items-center gap-1.5 justify-between">
          <strong className="flex items-center gap-1.5 text-xs font-bold text-cream truncate">
            {player.name}
            {current && <span className="text-[10px] text-gold uppercase tracking-wider font-normal">(You)</span>}
          </strong>

          {/* Status indicator */}
          {isLeading ? (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gold text-black flex items-center gap-1 flex-shrink-0 animate-pulse">
              <Crown size={10} fill="black" /> Leading
            </span>
          ) : isOut ? (
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/30 flex-shrink-0">
              🔴 OUT
            </span>
          ) : (
            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
              🟢 IN
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
          <span className="text-gold font-bold font-mono">{formatCr(player.budget)}</span>
          <span>·</span>
          <span
            className={`font-bold flex items-center gap-1 ${
              isSquadFull
                ? "text-gold"
                : isSquadReady
                  ? "text-emerald-400"
                  : "text-amber-300"
            }`}
          >
            {isCricket ? <Award size={11} /> : <Film size={11} className="text-gold" />}
            {isCricket ? `Squad: ${wonCount}/18` : `${wonCount}/5 won`}
          </span>

          {isCricket && (
            <>
              <span>·</span>
              <span
                className={`font-semibold ${
                  overseasCount >= 7 ? "text-amber-400 font-bold" : "text-cyan-300"
                }`}
                title="Overseas players in squad (Max 7, Max 4 in Playing 11)"
              >
                ✈️ {overseasCount}/7 OS
              </span>
            </>
          )}
        </div>
      </div>

      {player.isHost && (
        <span title="Room Host" className="text-gold flex-shrink-0">
          <Crown size={14} />
        </span>
      )}
    </div>
  );
}

export function LoadingMark() {
  return (
    <div className="loading-mark flex flex-col items-center gap-3 py-12 text-gold">
      <LoaderCircle size={46} className="animate-spin" />
      <span className="text-sm font-semibold tracking-wider font-display">Tabulating Championship Standings...</span>
    </div>
  );
}

export function getStarRating(score: number): { stars: string; label: string; numeric: number } {
  const norm = Math.min(5, Math.max(1, (score / 100) * 5));
  if (score >= 90) return { stars: "⭐⭐⭐⭐⭐", label: "Legendary 5-Star Franchise", numeric: Number(norm.toFixed(1)) };
  if (score >= 80) return { stars: "⭐⭐⭐⭐½", label: "Powerhouse Contender", numeric: Number(norm.toFixed(1)) };
  if (score >= 70) return { stars: "⭐⭐⭐⭐", label: "Prestige Franchise", numeric: Number(norm.toFixed(1)) };
  if (score >= 58) return { stars: "⭐⭐⭐½", label: "Playoff Contender", numeric: Number(norm.toFixed(1)) };
  if (score >= 45) return { stars: "⭐⭐⭐", label: "Developing Roster", numeric: Number(norm.toFixed(1)) };
  return { stars: "⭐⭐", label: "Under-Equipped Slate", numeric: Number(norm.toFixed(1)) };
}

export function RankingList({
  players,
  rankings,
  isCricket = false,
}: {
  players?: Player[] | undefined;
  rankings?: PlayerScore[] | undefined;
  isCricket?: boolean | undefined;
}) {
  const currentUser = getCurrentUser();
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(() => rankings?.[0]?.playerId || null);

  if (rankings && rankings.length > 0) {
    return (
      <div className="w-full flex flex-col gap-5 mt-6">
        {rankings.map((item, index) => {
          const isWinner = index === 0;
          const isMe = item.playerId === currentUser.id;
          const isExpanded = expandedPlayerId === item.playerId;
          const ratingInfo = getStarRating(item.score);

          const rankBadge =
            index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `🏅 #${index + 1}`;

          const rankTitle =
            index === 0
              ? "Grand Champion"
              : index === 1
                ? "Runner-Up (2nd)"
                : index === 2
                  ? "Prestige Podium (3rd)"
                  : `Rank #${index + 1}`;

          const fieldedList = item.fieldedItems || [];
          const overseasCount = isCricket ? fieldedList.filter((m) => isOverseasPlayer(m)).length : 0;

          return (
            <div
              key={item.playerId}
              className={`w-full rounded-3xl border transition-all p-5 sm:p-7 text-left relative overflow-hidden ${
                isWinner
                  ? "bg-gradient-to-br from-gold/25 via-panel to-panel-strong border-gold shadow-2xl shadow-gold/15 ring-2 ring-gold/40"
                  : index === 1
                    ? "bg-panel/95 border-slate-400/50 shadow-lg shadow-black/40"
                    : index === 2
                      ? "bg-panel/90 border-amber-700/40 shadow-lg shadow-black/40"
                      : "bg-panel/80 border-border/70 shadow-md shadow-black/20 hover:border-gold/30"
              }`}
            >
              {isWinner && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-gold to-amber-500 text-black font-black text-[11px] uppercase tracking-widest px-5 py-1.5 rounded-bl-2xl flex items-center gap-1.5 shadow-md">
                  <Crown size={14} fill="black" /> Grand Champion
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="text-3xl sm:text-5xl flex items-center justify-center w-12 sm:w-14 flex-shrink-0">
                    {rankBadge}
                  </div>

                  <span
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl border-2 flex-shrink-0 shadow-lg"
                    style={
                      item.color
                        ? { borderColor: item.color, color: item.color, backgroundColor: `${item.color}15` }
                        : { borderColor: "#f5c518", color: "#f5c518", backgroundColor: "#f5c51815" }
                    }
                  >
                    {item.avatar}
                  </span>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-cream text-lg sm:text-2xl font-black truncate">
                        {item.name}
                      </strong>
                      {isMe && (
                        <span className="text-[10px] bg-gold/20 text-gold border border-gold/30 px-2.5 py-0.5 rounded-full font-bold uppercase">
                          You
                        </span>
                      )}
                      {item.isHost && (
                        <span title="Host" className="text-gold">
                          <Crown size={15} />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-base tracking-wide" title={`${ratingInfo.numeric}/5.0`}>
                        {ratingInfo.stars}
                      </span>
                      <span className="text-xs font-bold text-gold">
                        {ratingInfo.numeric} / 5.0
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {ratingInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Award size={12} /> {item.wonCount} {isCricket ? "Squad Players" : "Movies Won"}
                      </span>
                      {isCricket && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-300 font-semibold">
                            🏏 Fielded 11 ({overseasCount}/4 Overseas)
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatCr(item.remainingBudget)} Purse Retained</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end flex-shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-3xl sm:text-4xl font-black text-gold px-4 py-2 bg-black/60 rounded-2xl border border-gold/40 shadow-inner font-mono tracking-tight">
                      {item.score.toFixed(1)} <small className="text-xs font-normal text-cream/70">PTS</small>
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase tracking-wider">
                      {rankTitle}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Pillars Score Breakdown Grid */}
              {item.breakdown && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-border/70">
                  <div className="p-3 rounded-2xl bg-black/30 border border-border/50 flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                      {isCricket ? "🏏 Batting Firepower" : "Critical Acclaim"}
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-cream mt-0.5">
                      {item.breakdown.criticalAcclaim} <span className="text-[10px] text-muted-foreground font-normal">/ {isCricket ? "35" : "40"}</span>
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/30 border border-border/50 flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                      {isCricket ? "🎯 Bowling Lethality" : "Box Office ROI"}
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-cream mt-0.5">
                      {item.breakdown.boxOfficeRoi} <span className="text-[10px] text-muted-foreground font-normal">/ {isCricket ? "35" : "30"}</span>
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/30 border border-border/50 flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                      {isCricket ? "⚡ Tactical XI Balance" : "Genre Synergy"}
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-cream mt-0.5">
                      {item.breakdown.genreSynergy} <span className="text-[10px] text-muted-foreground font-normal">/ 20</span>
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/30 border border-border/50 flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                      💰 Purse Mgmt
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-cream mt-0.5">
                      {item.breakdown.budgetEfficiency} <span className="text-[10px] text-muted-foreground font-normal">/ 10</span>
                    </strong>
                  </div>
                </div>
              )}

              {item.critique && (
                <div className="mt-3.5 bg-black/40 border border-border/70 rounded-2xl p-4 text-xs sm:text-sm text-cream/90 italic flex items-start gap-3 shadow-inner">
                  <Sparkles size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">"{item.critique}"</span>
                </div>
              )}

              {/* Expand/Collapse Fielded Lineup Section */}
              {fieldedList.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setExpandedPlayerId(isExpanded ? null : item.playerId)}
                    className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-gold hover:text-amber-300 py-1.5 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      {isCricket ? "🏏 View Fielded Playing 11 Lineup" : "🎬 View Top 5 Slate"}
                      <span className="text-muted-foreground font-normal">({fieldedList.length} Items)</span>
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-3 pt-2">
                      {fieldedList.map((playerItem) => {
                        const role = getRoleBadge(playerItem.role, playerItem.genre);
                        const isOverseasCard = isCricket && isOverseasPlayer(playerItem);
                        return (
                          <div
                            key={playerItem.id}
                            className="p-2 rounded-xl bg-black/50 border border-border/70 flex flex-col gap-1.5 shadow-sm overflow-hidden"
                          >
                            <div className="aspect-[3/4] w-full rounded-lg overflow-hidden relative bg-black/40">
                              <Poster movie={playerItem} className="w-full h-full" />
                            </div>
                            <div className="min-w-0">
                              <strong className="block text-[11px] font-bold text-cream truncate">
                                {playerItem.title}
                              </strong>
                              <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-0.5">
                                <span className={role.colorClass}>{role.label}</span>
                                <span className="text-gold font-bold">★ {playerItem.imdbRating}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const fallbackPlayers = players || [];
  const ranked = [...fallbackPlayers].sort(
    (a, b) => (b.movies || []).length - (a.movies || []).length || b.budget - a.budget,
  );

  return (
    <div className="w-full flex flex-col gap-3 mt-6">
      {ranked.map((player, index) => {
        const count = (player.movies || []).length;
        const estimatedScore = Math.min(
          99,
          Math.max(50, 70 + count * 5 + (player.budget / player.initialBudget) * 10),
        );
        const rating = getStarRating(estimatedScore);

        return (
          <div
            className={`w-full ${index === 0 ? "border-gold ring-1 ring-gold/40 bg-gold/10" : "border-border bg-panel"} p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-3 text-left`}
            key={player.id}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
              </span>
              <span className="w-10 h-10 rounded-xl bg-panel-strong border border-border flex items-center justify-center font-bold">
                {player.avatar}
              </span>
              <div className="flex flex-col text-left">
                <strong className="text-cream font-bold text-base">{player.name}</strong>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <span>{rating.stars}</span>
                  <span>• {count} items acquired</span>
                </div>
              </div>
            </div>
            <span className="text-xl font-black text-gold font-mono">
              {estimatedScore.toFixed(1)} PTS
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AuctionTimer({
  seconds = 30,
  endTime,
  onTimerEnd,
  isPaused,
}: {
  seconds?: number | undefined;
  endTime?: number | undefined;
  onTimerEnd?: () => void;
  isPaused?: boolean | undefined;
}) {
  const [displaySec, setDisplaySec] = useState<number>(() => {
    if (isPaused) return seconds;
    if (endTime) return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    return seconds;
  });

  const onEndCalledRef = useRef(false);

  useEffect(() => {
    onEndCalledRef.current = false;
  }, [endTime]);

  useEffect(() => {
    if (isPaused) {
      setDisplaySec(seconds);
      return;
    }

    const target = endTime || Date.now() + seconds * 1000;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setDisplaySec(remaining);

      if (remaining === 0 && !onEndCalledRef.current) {
        onEndCalledRef.current = true;
        onTimerEnd?.();
      }
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [endTime, seconds, onTimerEnd, isPaused]);

  const mins = Math.floor(displaySec / 60);
  const secs = displaySec % 60;
  const isUrgent = displaySec <= 7 && !isPaused;

  return (
    <div
      className={`auction-timer flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border transition-all ${
        isPaused
          ? "bg-amber-950/70 border-amber-500 text-amber-300 ring-4 ring-amber-500/20 shadow-lg shadow-amber-950/50"
          : isUrgent
            ? "bg-red-950/60 border-red-500 text-red-400 ring-4 ring-red-500/30 animate-pulse shadow-lg shadow-red-950/50"
            : "bg-panel/90 border-gold/40 text-gold shadow-lg shadow-gold/5"
      }`}
    >
      {isPaused ? (
        <Pause size={20} className="text-amber-400 animate-pulse" />
      ) : (
        <Timer size={20} className={isUrgent ? "text-red-400 animate-spin" : "text-gold"} />
      )}
      <span className="tabular-nums font-mono font-black text-2xl sm:text-3xl tracking-wider">
        {isPaused ? "PAUSED" : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
      </span>
    </div>
  );
}

export function EmptyMovieSlot() {
  return (
    <div className="empty-movie-slot p-4 rounded-xl border border-dashed border-border/80 flex flex-col items-center justify-center gap-1.5 text-muted-foreground bg-panel/30">
      <Users size={20} />
      <span className="text-xs">Awaiting Franchise Slot</span>
    </div>
  );
}

/**
 * Top header navigation bar with popup tabs:
 * [Rules] [Sold] [Unsold] [Upcoming] [All Players / Catalogue] [Sound Mute] [Host Pause]
 */
export function AuctionTopTabs({
  moviePool,
  players,
  currentMovieIndex = 0,
  auctionType = "CRICKET",
  roomCode,
  isPaused,
  onTogglePause,
  isHost,
  onUpdateTimer,
}: {
  moviePool: Movie[];
  players: Player[];
  currentMovieIndex?: number | undefined;
  auctionType?: "CINEMA" | "CRICKET" | undefined;
  roomCode?: string | undefined;
  isPaused?: boolean | undefined;
  onTogglePause?: (() => void) | undefined;
  isHost?: boolean | undefined;
  onUpdateTimer?: ((seconds: number, isExtension?: boolean | undefined) => void) | undefined;
}) {
  const isCricket = auctionType === "CRICKET";
  const [activeTab, setActiveTab] = useState<"RULES" | "SOLD" | "UNSOLD" | "UPCOMING" | "ALL" | "TIMER" | "SQUADS" | null>(null);
  const [selectedSquadPlayerId, setSelectedSquadPlayerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [muted, setMuted] = useState(isAudioMuted());
  const [customSecInput, setCustomSecInput] = useState("10");

  const handleToggleMute = () => {
    const next = toggleAudioMute();
    setMuted(next);
  };

  // Compile Sold items map
  const soldMap = new Map<string, { movie: OwnedMovie; buyerName: string; price: number }>();
  for (const p of (players || [])) {
    for (const m of (p.movies || [])) {
      soldMap.set(m.id, {
        movie: m,
        buyerName: p.name,
        price: m.purchasePrice || m.basePrice,
      });
    }
  }
  const soldList = Array.from(soldMap.values());

  // Compile Unsold items (items before current index that were passed)
  const unsoldList = moviePool
    .slice(0, currentMovieIndex)
    .filter((m) => !soldMap.has(m.id));

  // Upcoming items
  const upcomingList = moviePool.slice(currentMovieIndex + 1);

  // Filter helper for modal list
  const filterItem = (m: Movie | OwnedMovie) => {
    const titleMatch = m.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!titleMatch) return false;

    if (roleFilter === "ALL") return true;
    if (roleFilter === "INDIAN") return !isOverseasPlayer(m);
    if (roleFilter === "OVERSEAS") return isOverseasPlayer(m);
    if (roleFilter === "BATSMAN") return m.role?.includes("Batsman");
    if (roleFilter === "BOWLER") return m.role?.includes("Bowler");
    if (roleFilter === "ALL_ROUNDER") return m.role?.includes("All-Rounder");
    if (roleFilter === "WICKETKEEPER") return m.role?.includes("Wicketkeeper");
    return true;
  };

  return (
    <>
      <nav className="w-full bg-panel/90 border-b border-border/80 px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none z-30 shadow-md">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap min-w-max">
          <button
            type="button"
            onClick={() => setActiveTab("RULES")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "RULES"
                ? "bg-gold text-black border-gold shadow-md"
                : "bg-black/40 border-border/80 text-cream/90 hover:border-gold/50 hover:bg-gold/10"
            }`}
          >
            <BookOpen size={13} />
            <span>Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SOLD")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "SOLD"
                ? "bg-emerald-500 text-black border-emerald-400 shadow-md"
                : "bg-black/40 border-border/80 text-cream/90 hover:border-emerald-500/50 hover:bg-emerald-500/10"
            }`}
          >
            <Gavel size={13} className="text-emerald-400" />
            <span>Sold</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono font-black border border-emerald-500/40">
              {soldList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("UNSOLD")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "UNSOLD"
                ? "bg-red-500 text-white border-red-400 shadow-md"
                : "bg-black/40 border-border/80 text-cream/90 hover:border-red-500/50 hover:bg-red-500/10"
            }`}
          >
            <XCircle size={13} className="text-red-400" />
            <span>Unsold</span>
            <span className="px-1.5 py-0.2 rounded-full bg-red-950 text-red-300 text-[10px] font-mono font-black border border-red-500/40">
              {unsoldList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("UPCOMING")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "UPCOMING"
                ? "bg-cyan-500 text-black border-cyan-400 shadow-md"
                : "bg-black/40 border-border/80 text-cream/90 hover:border-cyan-500/50 hover:bg-cyan-500/10"
            }`}
          >
            <Clock size={13} className="text-cyan-400" />
            <span>Upcoming</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono font-black border border-cyan-500/40">
              {upcomingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "ALL"
                ? "bg-gold text-black border-gold shadow-md"
                : "bg-gold/15 border-gold/40 text-gold hover:bg-gold/25"
            }`}
          >
            <ListFilter size={13} />
            <span>{isCricket ? "All 58 Players" : "All Films"}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/60 text-gold text-[10px] font-mono font-black border border-gold/30">
              {moviePool.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedSquadPlayerId && players[0]) setSelectedSquadPlayerId(players[0].id);
              setActiveTab("SQUADS");
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "SQUADS"
                ? "bg-gold text-black border-gold shadow-md font-black"
                : "bg-black/40 border-border/80 text-cream/90 hover:border-gold/50 hover:bg-gold/10"
            }`}
            title="Inspect every franchise roster, purchases, and purse remaining"
          >
            <Users size={13} className="text-gold" />
            <span>{isCricket ? "Squads" : "Slates"}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-gold/20 text-gold text-[10px] font-mono font-black border border-gold/30">
              {players.length}
            </span>
          </button>
        </div>

        {/* Right Utility Buttons: Mute Sound & Host Pause */}
        <div className="flex items-center gap-2 flex-nowrap min-w-max">
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              muted
                ? "bg-red-950/60 border-red-500/60 text-red-300"
                : "bg-black/40 border-border text-gold hover:bg-gold/10"
            }`}
            title={muted ? "Audio Muted - Click to Unmute" : "Audio Active - Click to Mute"}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span className="hidden sm:inline text-[11px]">{muted ? "Muted" : "Sound ON"}</span>
          </button>

          {isHost && onUpdateTimer && (
            <button
              type="button"
              onClick={() => setActiveTab("TIMER")}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "TIMER"
                  ? "bg-cyan-500 text-black border-cyan-400 shadow-md"
                  : "bg-black/40 border-border text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10"
              }`}
              title="Change auction timer duration"
            >
              <Timer size={13} className="text-cyan-400" />
              <span className="hidden sm:inline">Set Timer</span>
            </button>
          )}

          {isHost && onTogglePause && (
            <button
              type="button"
              onClick={onTogglePause}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                isPaused
                  ? "bg-emerald-500 text-black border-emerald-400 hover:brightness-110 animate-bounce"
                  : "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
              }`}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
              <span>{isPaused ? "Resume Auction" : "Pause Auction"}</span>
            </button>
          )}
        </div>
      </nav>

      {/* POP-UP MODAL DIALOG */}
      <Dialog open={Boolean(activeTab)} onOpenChange={(open) => !open && setActiveTab(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 bg-panel/95 border-gold/40 text-cream backdrop-blur-xl">
          <DialogHeader className="border-b border-border/80 pb-3 flex-shrink-0 text-left">
            <DialogTitle className="text-xl font-black text-cream font-display flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activeTab === "TIMER" && (
                  <>
                    <Timer className="text-cyan-400" size={20} />
                    <span>Host Live Auction Timer Controls</span>
                  </>
                )}
                {activeTab === "RULES" && (
                  <>
                    <BookOpen className="text-gold" size={20} />
                    <span>Official Auction & IPL Tournament Rules</span>
                  </>
                )}
                {activeTab === "SOLD" && (
                  <>
                    <Gavel className="text-emerald-400" size={20} />
                    <span>Sold {isCricket ? "Cricketers" : "Movies"} ({soldList.length})</span>
                  </>
                )}
                {activeTab === "UNSOLD" && (
                  <>
                    <XCircle className="text-red-400" size={20} />
                    <span>Unsold / Passed Items ({unsoldList.length})</span>
                  </>
                )}
                {activeTab === "UPCOMING" && (
                  <>
                    <Clock className="text-cyan-400" size={20} />
                    <span>Upcoming Pool Queue ({upcomingList.length})</span>
                  </>
                )}
                {activeTab === "ALL" && (
                  <>
                    <ListFilter className="text-gold" size={20} />
                    <span>Full Auction Pool Catalogue ({moviePool.length} Items)</span>
                  </>
                )}
                {activeTab === "SQUADS" && (
                  <>
                    <Users className="text-gold" size={20} />
                    <span>{isCricket ? "Franchise Squads & Purchases" : "Studio Slates & Purchases"} ({players.length} Teams)</span>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* SQUADS CONTENT (FRANCHISE ROSTERS & PURCHASES MODAL) */}
          {activeTab === "SQUADS" && (
            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4 text-xs sm:text-sm text-left">
              {/* Franchise Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/70 scrollbar-none flex-shrink-0">
                {players.map((p) => {
                  const isSelected = p.id === (selectedSquadPlayerId || players[0]?.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedSquadPlayerId(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-gold text-black shadow-md shadow-gold/20 font-black"
                          : "bg-black/50 text-cream/80 hover:bg-black/80 border border-border/70 hover:border-gold/50"
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span className="truncate max-w-[110px]">{p.name}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                        {(p.movies || []).length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Inspected Franchise Details */}
              {(() => {
                const target = players.find((p) => p.id === (selectedSquadPlayerId || players[0]?.id)) || players[0];
                if (!target) return null;
                const targetMovies = target.movies || [];
                const totalSpent = targetMovies.reduce((sum, m) => sum + (m.purchasePrice || m.basePrice || 0), 0);
                const overseasCount = isCricket ? targetMovies.filter((m) => isOverseasPlayer(m)).length : 0;

                return (
                  <div className="flex flex-col gap-3">
                    {/* Summary Bar */}
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-10 h-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center text-lg font-bold">
                          {target.avatar}
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-cream font-display uppercase tracking-wide">
                            {target.name} {target.isHost && "👑 (Host)"}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            {targetMovies.length} {isCricket ? "cricketers acquired" : "movies acquired"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="px-3 py-1 rounded-xl bg-black/50 border border-border/70 text-center">
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">PURSE LEFT</span>
                          <strong className="text-xs font-black text-emerald-400 font-mono">{formatCr(target.budget)}</strong>
                        </div>
                        <div className="px-3 py-1 rounded-xl bg-black/50 border border-border/70 text-center">
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">SPENT</span>
                          <strong className="text-xs font-black text-gold font-mono">{formatCr(totalSpent)}</strong>
                        </div>
                        {isCricket && (
                          <div className="px-3 py-1 rounded-xl bg-black/50 border border-border/70 text-center">
                            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">OVERSEAS</span>
                            <strong className="text-xs font-black text-cyan-300 font-mono">{overseasCount}/7</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acquired Items Grid */}
                    {targetMovies.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground bg-black/20 rounded-2xl border border-dashed border-border/60">
                        {target.name} has not acquired any {isCricket ? "cricketers" : "movies"} yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {targetMovies.map((m, i) => {
                          const role = getRoleBadge(m.role, m.genre);
                          const isOverseas = isCricket && isOverseasPlayer(m);
                          return (
                            <div key={`${m.id}_modal_${i}`} className="p-2.5 rounded-2xl bg-black/60 border border-border/70 flex flex-col gap-2">
                              <div className={`${isCricket ? "aspect-[3/4]" : "aspect-[2/3]"} w-full rounded-xl overflow-hidden bg-black relative`}>
                                <Poster movie={m} className="w-full h-full object-cover" />
                                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-gold border border-gold/30">
                                  {formatCr(m.purchasePrice || m.basePrice)}
                                </span>
                              </div>
                              <div className="flex flex-col min-w-0 text-left">
                                <strong className="text-xs font-bold text-cream truncate">{m.title}</strong>
                                {isCricket ? (
                                  <div className="flex items-center justify-between gap-1 mt-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border truncate ${role.colorClass}`}>
                                      {role.label}
                                    </span>
                                    <span className="text-[10px]" title={isOverseas ? "Overseas" : "Indian"}>
                                      {isOverseas ? "✈️" : "🇮🇳"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground mt-0.5">★ {m.imdbRating} • {m.genre}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TIMER CONTENT */}
          {activeTab === "TIMER" && onUpdateTimer && (
            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-5 text-left text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col gap-1.5">
                <h3 className="font-black text-cyan-400 uppercase tracking-wider text-sm flex items-center gap-1.5">
                  <Timer size={16} /> Adjust Live Round Countdown Clock
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Change the timer anytime mid-auction. The new duration takes effect immediately and synchronizes across all connected devices in real-time.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-cream uppercase tracking-wider">
                  Quick Duration Presets
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { sec: 10, label: "10s" },
                    { sec: 15, label: "15s" },
                    { sec: 20, label: "20s" },
                    { sec: 30, label: "30s" },
                    { sec: 45, label: "45s" },
                    { sec: 60, label: "60s" },
                  ].map((preset) => (
                    <button
                      key={preset.sec}
                      type="button"
                      onClick={() => {
                        onUpdateTimer(preset.sec);
                        setActiveTab(null);
                      }}
                      className="p-3 rounded-2xl bg-black/50 border border-border/80 hover:border-cyan-400 text-cyan-300 font-mono font-black text-sm text-center transition-all hover:bg-cyan-950/50 cursor-pointer shadow-sm"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Extra Time */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-cream uppercase tracking-wider">
                  Add Extra Time to Current Clock
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTimer(10, true);
                      setActiveTab(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    +10 Seconds
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTimer(20, true);
                      setActiveTab(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    +20 Seconds
                  </button>
                </div>
              </div>

              {/* Custom Manual Input */}
              <div className="p-4 rounded-2xl bg-black/40 border border-gold/30 flex flex-col gap-3">
                <span className="text-xs font-black text-gold uppercase tracking-wider">
                  Custom Manual Timer Input
                </span>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="3"
                      max="300"
                      value={customSecInput}
                      onChange={(e) => setCustomSecInput(e.target.value)}
                      placeholder="Seconds"
                      className="w-28 px-3.5 py-2.5 rounded-xl bg-panel border border-border/80 text-cream font-mono font-black text-sm focus:border-gold focus:outline-none"
                    />
                    <span className="ml-2 text-xs text-muted-foreground font-bold">seconds</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(customSecInput, 10);
                      if (!isNaN(val) && val >= 3) {
                        onUpdateTimer(val);
                        setActiveTab(null);
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Set Custom Timer
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Accepts any duration from 3 to 300 seconds. Sets round clock instantly across all devices.
                </span>
              </div>
            </div>
          )}

          {/* RULES CONTENT */}
          {activeTab === "RULES" ? (
            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4 text-xs sm:text-sm text-left">
              {isCricket ? (
                <>
                  <div className="p-4 rounded-2xl bg-black/40 border border-gold/30 flex flex-col gap-2">
                    <h3 className="font-black text-gold uppercase tracking-wider text-sm flex items-center gap-1.5">
                      <Shield size={16} /> Purse & Squad Composition
                    </h3>
                    <ul className="list-disc list-inside text-cream/90 flex flex-col gap-1.5">
                      <li><strong>Purse Cap:</strong> ₹100.00 Cr budget per franchise.</li>
                      <li><strong>Squad Size:</strong> 12 to 18 players per squad.</li>
                      <li><strong>Overseas Quota in Squad:</strong> Maximum <strong>7 foreign players</strong> can be purchased.</li>
                      <li><strong>Playing 11 Overseas Limit:</strong> Maximum <strong>4 overseas players</strong> can be selected in your starting match XI.</li>
                      <li><strong>Wicketkeeper Mandate:</strong> At least 1 designated wicketkeeper required in your starting XI.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/30 flex flex-col gap-2">
                    <h3 className="font-black text-cyan-400 uppercase tracking-wider text-sm flex items-center gap-1.5">
                      <Trophy size={16} /> IPL Tournament Simulation End Result
                    </h3>
                    <p className="text-cream/90 leading-relaxed">
                      After the live auction concludes and franchises lock in their Playing 11s, the game launches an interactive <strong>IPL Tournament Simulation</strong>:
                    </p>
                    <ul className="list-disc list-inside text-cream/90 flex flex-col gap-1.5 mt-1">
                      <li><strong>League Stage:</strong> Round-robin clashes with realistic T20 match scorecards powered by AI.</li>
                      <li><strong>IPL Points Table:</strong> Points (2 for win) + Net Run Rate (NRR) tabulated after every match.</li>
                      <li><strong>IPL Playoffs:</strong> Qualifier 1 (#1 vs #2), Eliminator (#3 vs #4), Qualifier 2, and Grand Final!</li>
                      <li><strong>Champion Podium:</strong> Gold trophy ceremony, Orange Cap (Top Batsman), and Purple Cap (Top Bowler).</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-black/40 border border-gold/30 flex flex-col gap-2">
                  <h3 className="font-black text-gold uppercase tracking-wider text-sm flex items-center gap-1.5">
                    <Film size={16} /> Film Studio Auction Rules
                  </h3>
                  <ul className="list-disc list-inside text-cream/90 flex flex-col gap-1.5">
                    <li><strong>Studio Slate:</strong> Acquire 5 blockbuster films into your studio portfolio.</li>
                    <li><strong>Grand Jury Criteria:</strong> Scored on IMDb Acclaim (40%), Box Office ROI (30%), Genre Diversity (20%), and Budget Discipline (10%).</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* LIST CONTENT (SOLD, UNSOLD, UPCOMING, ALL) */
            <div className="flex-1 flex flex-col min-h-0 gap-3 pt-2">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                <div className="relative flex-1 w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${isCricket ? "cricketer" : "film"} by name...`}
                    className="w-full bg-black/60 border border-border/80 rounded-xl pl-9 pr-3 py-2 text-xs text-cream outline-none focus:border-gold"
                  />
                </div>

                {isCricket && (
                  <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                    {["ALL", "BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER", "INDIAN", "OVERSEAS"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setRoleFilter(role)}
                        className={`text-[10px] px-2 py-1 rounded-lg border font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                          roleFilter === role
                            ? "bg-gold text-black border-gold"
                            : "bg-black/40 border-border text-muted-foreground hover:text-cream"
                        }`}
                      >
                        {role.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto pr-1">
                {activeTab === "SOLD" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {soldList.filter((item) => filterItem(item.movie)).length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                        No sold items match this filter yet.
                      </div>
                    ) : (
                      soldList
                        .filter((item) => filterItem(item.movie))
                        .map(({ movie, buyerName, price }) => (
                          <div
                            key={movie.id}
                            className="p-3 rounded-2xl bg-black/50 border border-emerald-500/40 flex items-center gap-3"
                          >
                            <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-black">
                              <Poster movie={movie} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="text-xs font-black text-cream truncate">{movie.title}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{movie.role || movie.genre}</span>
                              <div className="mt-1 flex items-center justify-between text-[11px] gap-2">
                                <span className="text-emerald-400 font-bold truncate">Acquired by {buyerName}</span>
                                <span className="text-gold font-black font-mono">{formatCr(price)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {activeTab === "UNSOLD" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {unsoldList.filter(filterItem).length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                        No unsold items so far! Every auctioned item received bids.
                      </div>
                    ) : (
                      unsoldList.filter(filterItem).map((movie) => (
                        <div
                          key={movie.id}
                          className="p-3 rounded-2xl bg-black/50 border border-red-500/40 flex items-center gap-3"
                        >
                          <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-black">
                            <Poster movie={movie} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="text-xs font-black text-cream truncate">{movie.title}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{movie.role || movie.genre}</span>
                            <div className="mt-1 flex items-center justify-between text-[11px]">
                              <span className="text-red-400 font-bold">Unsold / Passed</span>
                              <span className="text-muted-foreground font-mono">Base: {formatCr(movie.basePrice)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "UPCOMING" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {upcomingList.filter(filterItem).length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                        No upcoming items match this filter.
                      </div>
                    ) : (
                      upcomingList.filter(filterItem).map((movie, idx) => (
                        <div
                          key={movie.id}
                          className="p-3 rounded-2xl bg-black/50 border border-border/80 hover:border-cyan-500/50 flex items-center gap-3"
                        >
                          <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-black">
                            <Poster movie={movie} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono">
                                In {idx + 1}
                              </span>
                              <span className="text-xs font-black text-cream truncate">{movie.title}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate">{movie.role || movie.genre}</span>
                            <div className="mt-1 flex items-center justify-between text-[11px]">
                              <span className="text-gold font-bold font-mono">Base: {formatCr(movie.basePrice)}</span>
                              {movie.stats?.strikeRate && (
                                <span className="text-[10px] text-cyan-300 font-mono">SR: {movie.stats.strikeRate}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "ALL" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {moviePool.filter(filterItem).map((movie) => {
                      const isSold = soldMap.has(movie.id);
                      const soldData = soldMap.get(movie.id);
                      return (
                        <div
                          key={movie.id}
                          className={`p-2.5 rounded-2xl border flex flex-col gap-2 relative text-left ${
                            isSold
                              ? "bg-black/40 border-emerald-500/40"
                              : "bg-black/60 border-border/70 hover:border-gold/50"
                          }`}
                        >
                          <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-black relative">
                            <Poster movie={movie} className="w-full h-full object-cover" />
                            {isSold && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 text-[10px] font-black uppercase">
                                  SOLD
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <strong className="text-xs font-bold text-cream truncate">{movie.title}</strong>
                            <span className="text-[10px] text-muted-foreground truncate">{movie.role || movie.genre}</span>
                            <div className="mt-1 flex items-center justify-between text-[10px]">
                              <span className="text-gold font-bold">{formatCr(movie.basePrice)}</span>
                              {isSold && soldData && (
                                <span className="text-emerald-400 font-bold truncate max-w-[80px]">
                                  {soldData.buyerName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { Users };

