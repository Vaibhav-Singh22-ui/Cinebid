import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Check,
  ChevronRight,
  Coins,
  Crown,
  Film,
  Flame,
  Gavel,
  LoaderCircle,
  Medal,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import {
  formatCr,
  type Movie,
  type OwnedMovie,
  type Player,
} from "@/lib/game-data";
import { getCurrentUser, type PlayerScore } from "@/lib/game-manager";
import { getOfficialPosterUrl } from "@/lib/movie-posters";
import posterSheet from "@/assets/movie-posters.jpg";
import cinebidLogo from "@/assets/cinebid-logo.jpg";

export function SiteHeader() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <header className="site-header flex items-center justify-between px-4 sm:px-8 py-3 bg-panel/80 border-b border-border/80 backdrop-blur-md sticky top-0 z-40">
      <Link to="/" className="brand flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-gold/40 shadow-sm group-hover:border-gold transition-colors">
          <img src={cinebidLogo} alt="Cinebid Emblem" className="w-full h-full object-cover" />
        </div>
        <span className="font-black tracking-wider text-base sm:text-lg text-cream flex items-center gap-1.5">
          CINE<span className="text-gold">BID</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {user && user.name && user.name !== "Movie Producer" && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-xs font-semibold text-gold">
            <Crown size={13} />
            <span className="truncate max-w-[120px]">{user.name}</span>
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

export function Poster({ movie, className }: { movie: Movie | OwnedMovie; className?: string }) {
  const officialUrl = getOfficialPosterUrl(movie.id);
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`poster overflow-hidden rounded-md relative ${className || ""}`}>
      {officialUrl && !imgError ? (
        <img
          src={officialUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="w-full h-full object-cover rounded-md transition-opacity duration-300"
          onError={() => setImgError(true)}
        />
      ) : (
        <img
          src={posterSheet}
          alt={`${movie.title} movie artwork`}
          loading="lazy"
          width={1024}
          height={1536}
          className="w-full h-full object-cover"
          style={{ objectPosition: movie.posterPosition }}
        />
      )}
    </div>
  );
}

export function MovieCard({
  movie,
  price,
  selected,
  onClick,
}: {
  movie: Movie | OwnedMovie;
  price?: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`movie-card transition-all ${selected ? "selected ring-2 ring-gold border-gold scale-105" : "hover:border-gold/40"}`}
    >
      <Poster movie={movie} />
      <div className="movie-card-info p-2.5 bg-panel/95">
        <strong className="block truncate text-xs font-bold text-cream">{movie.title}</strong>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          {movie.imdbRating && (
            <span className="text-yellow-400 font-bold flex items-center gap-0.5">
              ★ {movie.imdbRating}
            </span>
          )}
          {price !== undefined && (
            <span className="text-gold font-bold">{formatCr(price)}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export function PlayerCard({ player, current }: { player: Player; current?: boolean }) {
  const wonCount = player.movies.length;
  const hasQuota = wonCount >= 5;

  return (
    <div className={`player-card ${current ? "is-current ring-1 ring-gold/40" : ""} bg-panel/90 border border-border/70 rounded-xl p-3 flex items-center gap-3`}>
      <span
        className="avatar w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 flex-shrink-0"
        style={player.color ? { borderColor: player.color, color: player.color } : undefined}
      >
        {player.avatar}
      </span>
      <div className="player-card-copy flex-1 min-w-0">
        <strong className="flex items-center gap-1.5 text-xs text-cream truncate">
          {player.name}
          {current && <span className="text-[10px] text-gold uppercase tracking-wider font-normal">(You)</span>}
        </strong>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span className="text-gold font-semibold">{formatCr(player.budget)}</span>
          <span>·</span>
          <span className={`flex items-center gap-1 font-bold ${hasQuota ? "text-emerald-400" : "text-amber-300"}`}>
            <Film size={11} /> {wonCount}/5 won
          </span>
        </div>
      </div>
      {player.isHost && (
        <span title="Room Host" className="text-gold flex-shrink-0">
          <Crown size={15} />
        </span>
      )}
    </div>
  );
}

export function LoadingMark() {
  return (
    <div className="loading-mark flex flex-col items-center gap-3 py-12 text-gold">
      <LoaderCircle size={46} className="animate-spin" />
      <span className="text-sm font-semibold tracking-wider">Tabulating Grand Jury Standings...</span>
    </div>
  );
}

/**
 * 5-Star Rating generator for AAA Game Leaderboards
 */
export function getStarRating(score: number): { stars: string; label: string; numeric: number } {
  const norm = Math.min(5, Math.max(1, (score / 100) * 5));
  if (score >= 90) return { stars: "⭐⭐⭐⭐⭐", label: "Legendary 5-Star Studio", numeric: Number(norm.toFixed(1)) };
  if (score >= 80) return { stars: "⭐⭐⭐⭐½", label: "Blockbuster Titan Studio", numeric: Number(norm.toFixed(1)) };
  if (score >= 70) return { stars: "⭐⭐⭐⭐", label: "Prestige Hitmaker", numeric: Number(norm.toFixed(1)) };
  if (score >= 58) return { stars: "⭐⭐⭐½", label: "Commercial Contender", numeric: Number(norm.toFixed(1)) };
  if (score >= 45) return { stars: "⭐⭐⭐", label: "Indie Art-House", numeric: Number(norm.toFixed(1)) };
  return { stars: "⭐⭐", label: "Under-Equipped Slate", numeric: Number(norm.toFixed(1)) };
}

/**
 * AAA-Grade Game Developer Championship Leaderboard
 */
export function RankingList({
  players,
  rankings,
}: {
  players?: Player[];
  rankings?: PlayerScore[];
}) {
  const currentUser = getCurrentUser();

  if (rankings && rankings.length > 0) {
    return (
      <div className="w-full flex flex-col gap-4 mt-6">
        {rankings.map((item, index) => {
          const isWinner = index === 0;
          const isMe = item.playerId === currentUser.id;
          const ratingInfo = getStarRating(item.score);

          const rankBadge =
            index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `🏅 #${index + 1}`;

          const rankTitle =
            index === 0
              ? "Grand Champion"
              : index === 1
                ? "Studio Titan (2nd)"
                : index === 2
                  ? "Prestige Studio (3rd)"
                  : `Rank #${index + 1}`;

          return (
            <div
              key={item.playerId}
              className={`w-full rounded-2xl border transition-all p-5 sm:p-6 text-left relative overflow-hidden ${
                isWinner
                  ? "bg-gradient-to-br from-gold/20 via-panel to-panel-strong border-gold shadow-2xl shadow-gold/10 ring-1 ring-gold/40"
                  : index === 1
                    ? "bg-panel/95 border-slate-400/50 shadow-lg shadow-black/40"
                    : index === 2
                      ? "bg-panel/90 border-amber-700/40 shadow-lg shadow-black/40"
                      : "bg-panel/80 border-border/70 shadow-md shadow-black/20 hover:border-gold/30"
              }`}
            >
              {/* Champion banner */}
              {isWinner && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-gold to-amber-500 text-black font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-bl-xl flex items-center gap-1.5 shadow-md">
                  <Crown size={13} fill="black" /> Grand Champion
                </div>
              )}

              {/* Main row: Rank, Producer profile, Star rating, and Big score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="text-3xl sm:text-4xl flex items-center justify-center w-12 flex-shrink-0">
                    {rankBadge}
                  </div>

                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border-2 flex-shrink-0 shadow-md"
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
                      <strong className="text-cream text-lg sm:text-xl font-black truncate">
                        {item.name}
                      </strong>
                      {isMe && (
                        <span className="text-[10px] bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded-full font-bold uppercase">
                          You
                        </span>
                      )}
                      {item.isHost && (
                        <span title="Host" className="text-gold">
                          <Crown size={14} />
                        </span>
                      )}
                    </div>

                    {/* 5-Star Emoji Rating & Badge */}
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

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Film size={12} /> {item.wonCount} Movies Won
                      </span>
                      <span>•</span>
                      <span>{formatCr(item.remainingBudget)} Capital Retained</span>
                    </div>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="flex items-center justify-end flex-shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-2xl sm:text-4xl font-black text-gold px-4 py-2 bg-black/50 rounded-2xl border border-gold/40 shadow-inner font-mono tracking-tight">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border/70">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-border/50 flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Critical Acclaim</span>
                    <strong className="text-xs sm:text-sm font-bold text-cream mt-0.5">
                      {item.breakdown.criticalAcclaim} <span className="text-[10px] text-muted-foreground font-normal">/ 40</span>
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-border/50 flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Box Office ROI</span>
                    <strong className="text-xs sm:text-sm font-bold text-cream mt-0.5">
                      {item.breakdown.boxOfficeRoi} <span className="text-[10px] text-muted-foreground font-normal">/ 30</span>
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-border/50 flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Genre Synergy</span>
                    <strong className="text-xs sm:text-sm font-bold text-cream mt-0.5">
                      {item.breakdown.genreSynergy} <span className="text-[10px] text-muted-foreground font-normal">/ 20</span>
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-border/50 flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Treasury Mgmt</span>
                    <strong className="text-xs sm:text-sm font-bold text-cream mt-0.5">
                      {item.breakdown.budgetEfficiency} <span className="text-[10px] text-muted-foreground font-normal">/ 10</span>
                    </strong>
                  </div>
                </div>
              )}

              {/* Grand Jury Critique Plaque */}
              {item.critique && (
                <div className="mt-3.5 bg-black/40 border border-border/70 rounded-xl p-3.5 text-xs sm:text-sm text-cream/90 italic flex items-start gap-2.5 shadow-inner">
                  <Sparkles size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">"{item.critique}"</span>
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
                  <span>• {player.movies.length} movies won</span>
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

/**
 * Ultra-Smooth High-Precision Real-Time Countdown Timer with onTimerEnd Auto-Gavel
 */
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
      <Film size={20} />
      <span className="text-xs">Awaiting producer slot</span>
    </div>
  );
}

export { Users };
