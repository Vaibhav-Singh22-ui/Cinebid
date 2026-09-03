import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Crown,
  Film,
  Flame,
  Gavel,
  LoaderCircle,
  Medal,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Users,
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
      label: "🧤 WICKETKEEPER",
      colorClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      category: "BATSMAN",
    };
  }
  if (r.includes("BATTER") || r.includes("BATSMAN") || r.includes("OPENER")) {
    return {
      label: "🏏 BATSMAN",
      colorClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      category: "BATSMAN",
    };
  }
  if (r.includes("ALL_ROUNDER") || r.includes("ALL-ROUNDER") || r.includes("ALLROUNDER")) {
    return {
      label: "⚡ ALL-ROUNDER",
      colorClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      category: "ALL_ROUNDER",
    };
  }
  if (r.includes("FAST_BOWLER") || r.includes("PACER") || r.includes("SEAM")) {
    return {
      label: "🎯 FAST BOWLER",
      colorClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      category: "BOWLER",
    };
  }
  if (r.includes("SPIN_BOWLER") || r.includes("SPINNER") || r.includes("WRIST")) {
    return {
      label: "🌀 SPIN BOWLER",
      colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      category: "BOWLER",
    };
  }
  return {
    label: "🏏 PLAYER",
    colorClass: "bg-gold/20 text-gold border-gold/40",
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
      setPhotoSrc(getOfficialPosterUrl(movie.id));
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
      <div className={`poster overflow-hidden rounded-2xl relative bg-gradient-to-b from-slate-900 via-panel to-black border border-border/80 shadow-xl ${className || ""}`}>
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
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-blue-950/70 via-panel to-black select-none">
            <div className="text-4xl sm:text-5xl mb-2">{movie.countryFlag || "🏏"}</div>
            <strong className="text-sm sm:text-base font-black text-cream block truncate w-full">{movie.title}</strong>
            <span className="text-[10px] text-gold font-bold uppercase tracking-wider mt-1">{movie.genre}</span>
            <span className="text-[9px] text-cyan-300 mt-1 font-semibold">★ Rating: {movie.imdbRating || 9.2}</span>
          </div>
        )}

        {/* Top Badges: Country + Role */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          <span
            className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
              isOverseas
                ? "bg-amber-950/85 border-amber-500/50 text-amber-300"
                : "bg-blue-950/85 border-blue-500/50 text-blue-300"
            }`}
          >
            {isOverseas ? `✈️ ${movie.country || "Overseas"}` : `🇮🇳 India`}
          </span>

          <span
            className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${roleBadge.colorClass}`}
          >
            {roleBadge.label}
          </span>
        </div>
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
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.colorClass}`}>
                {roleBadge.label}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  isOverseas
                    ? "bg-amber-950/60 border-amber-500/30 text-amber-300"
                    : "bg-blue-950/60 border-blue-500/30 text-blue-300"
                }`}
              >
                {isOverseas ? "✈️ Overseas" : "🇮🇳 Indian"}
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
  const wonCount = player.movies.length;
  const overseasCount = isCricket ? player.movies.filter((m) => isOverseasPlayer(m)).length : 0;
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
    (a, b) => b.movies.length - a.movies.length || b.budget - a.budget,
  );

  return (
    <div className="w-full flex flex-col gap-3 mt-6">
      {ranked.map((player, index) => {
        const estimatedScore = Math.min(
          99,
          Math.max(50, 70 + player.movies.length * 5 + (player.budget / player.initialBudget) * 10),
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
                  <span>• {player.movies.length} items acquired</span>
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
}: {
  seconds?: number | undefined;
  endTime?: number | undefined;
  onTimerEnd?: () => void;
}) {
  const [displaySec, setDisplaySec] = useState<number>(() => {
    if (endTime) return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    return seconds;
  });

  const onEndCalledRef = useRef(false);

  useEffect(() => {
    onEndCalledRef.current = false;
  }, [endTime]);

  useEffect(() => {
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
  }, [endTime, seconds, onTimerEnd]);

  const mins = Math.floor(displaySec / 60);
  const secs = displaySec % 60;
  const isUrgent = displaySec <= 7;

  return (
    <div
      className={`auction-timer flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border transition-all ${
        isUrgent
          ? "bg-red-950/60 border-red-500 text-red-400 ring-4 ring-red-500/30 animate-pulse shadow-lg shadow-red-950/50"
          : "bg-panel/90 border-gold/40 text-gold shadow-lg shadow-gold/5"
      }`}
    >
      <Timer size={20} className={isUrgent ? "text-red-400 animate-spin" : "text-gold"} />
      <span className="tabular-nums font-mono font-black text-2xl sm:text-3xl tracking-wider">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
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

export { Users };
