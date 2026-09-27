import React, { useState, useMemo } from "react";
import {
  ArrowLeftRight,
  Check,
  X,
  Plus,
  Minus,
  Coins,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import {
  formatCr,
  type OwnedMovie,
  type Player,
} from "@/lib/game-data";
import {
  proposeTrade,
  respondToTrade,
  cancelTradeOffer,
  type RoomState,
  type TradeOffer,
} from "@/lib/game-manager";

interface TradeHubProps {
  room: RoomState;
  currentUser: { id: string; name: string };
  isOpen: boolean;
  onClose: () => void;
  onRoomUpdated?: (room: RoomState) => void;
}

export function TradeHubModal({
  room,
  currentUser,
  isOpen,
  onClose,
  onRoomUpdated,
}: TradeHubProps) {
  const isCricket = room.auctionType === "CRICKET" || (room.roomCode || "").startsWith("IPL");
  const myPlayer = room.players.find((p) => p.id === currentUser.id);
  const isTradingClosed = room.status === "RESULTS" || Boolean(room.portfolioRankings && room.portfolioRankings.length > 0);
  const otherFranchises = useMemo(
    () => room.players.filter((p) => p.id !== currentUser.id),
    [room.players, currentUser.id],
  );

  // Incoming pending trades for current user
  const incomingTrades = useMemo(
    () => (room.trades || []).filter((t) => t.toPlayerId === currentUser.id && t.status === "PENDING"),
    [room.trades, currentUser.id],
  );

  // Outgoing pending trades created by current user
  const outgoingTrades = useMemo(
    () => (room.trades || []).filter((t) => t.fromPlayerId === currentUser.id && t.status === "PENDING"),
    [room.trades, currentUser.id],
  );

  // Completed trades (accepted) in this room
  const completedTrades = useMemo(
    () => (room.trades || []).filter((t) => t.status === "ACCEPTED"),
    [room.trades],
  );

  const defaultTab = incomingTrades.length > 0 ? "INCOMING" : "PROPOSE";
  const [tab, setTab] = useState<"PROPOSE" | "INCOMING" | "OUTGOING" | "HISTORY">(defaultTab);

  // Form state for proposing a trade
  const [targetFranchiseId, setTargetFranchiseId] = useState<string>(() => otherFranchises[0]?.id || "");
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [cashDirection, setCashDirection] = useState<"GIVE" | "REQUEST">("GIVE");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const targetFranchise = useMemo(
    () => room.players.find((p) => p.id === targetFranchiseId),
    [room.players, targetFranchiseId],
  );

  const mySquad = useMemo(() => myPlayer?.movies || [], [myPlayer?.movies]);
  const targetSquad = useMemo(() => targetFranchise?.movies || [], [targetFranchise?.movies]);

  if (!isOpen) return null;

  const handleToggleOfferItem = (id: string) => {
    setErrorMsg("");
    setSelectedOfferIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleToggleRequestItem = (id: string) => {
    setErrorMsg("");
    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSendProposal = () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (isTradingClosed) {
      setErrorMsg("Trading is closed. The tournament / evaluation results are already finalized.");
      return;
    }

    if (!targetFranchiseId) {
      setErrorMsg("Please select a target franchise to trade with.");
      return;
    }
    if (selectedOfferIds.length === 0 && selectedRequestIds.length === 0) {
      setErrorMsg("You must select at least one player to offer or request.");
      return;
    }

    const cashAdj = cashDirection === "GIVE" ? cashAmount : -cashAmount;

    const res = proposeTrade(
      room.roomCode,
      currentUser.id,
      targetFranchiseId,
      selectedOfferIds,
      selectedRequestIds,
      cashAdj,
    );

    if (!res.success) {
      setErrorMsg(res.message || "Failed to submit trade proposal.");
      return;
    }

    setSuccessMsg("Trade proposal sent successfully!");
    setSelectedOfferIds([]);
    setSelectedRequestIds([]);
    setCashAmount(0);
    if (res.room && onRoomUpdated) {
      onRoomUpdated(res.room);
    }
    setTimeout(() => {
      setSuccessMsg("");
      setTab("OUTGOING");
    }, 1200);
  };

  const handleRespond = (tradeId: string, accept: boolean) => {
    setErrorMsg("");

    if (isTradingClosed) {
      setErrorMsg("Trading is closed. The tournament / evaluation results are already finalized.");
      return;
    }

    const res = respondToTrade(room.roomCode, tradeId, accept, currentUser.id);
    if (!res.success) {
      setErrorMsg(res.message || "Action failed.");
      return;
    }
    if (res.room && onRoomUpdated) {
      onRoomUpdated(res.room);
    }
  };

  const handleCancel = (tradeId: string) => {
    setErrorMsg("");
    const res = cancelTradeOffer(room.roomCode, tradeId, currentUser.id);
    if (!res.success) {
      setErrorMsg(res.message || "Failed to cancel.");
      return;
    }
    if (res.room && onRoomUpdated) {
      onRoomUpdated(res.room);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-panel border border-gold/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-left">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-border/70 flex items-center justify-between gap-4 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-md">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-cream font-display tracking-tight flex items-center gap-2">
                <span>{isCricket ? "IPL FRANCHISE TRADE WINDOW" : "CINEMA STUDIO TRADING HUB"}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                  Live
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Negotiate player transfers and purse adjustments with other franchise owners.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-border/80 hover:border-gold text-muted-foreground hover:text-cream transition-colors cursor-pointer"
            title="Close Trade Hub"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Auction Floor Alert Bar */}
        {room.status === "AUCTION" && (
          <div className="bg-gradient-to-r from-amber-950/80 via-black/80 to-amber-950/80 border-b border-gold/40 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
              <span className="font-black text-gold uppercase tracking-wider text-[11px] flex items-center gap-1.5 flex-shrink-0">
                🔴 LIVE AUCTION IN PROGRESS:
              </span>
              {room.moviePool && room.moviePool[room.currentMovieIndex] && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-cream">
                    {room.moviePool[room.currentMovieIndex]?.title}
                  </span>
                  <span className="font-mono font-black text-gold px-1.5 py-0.5 rounded bg-black/60 border border-gold/30 text-[10px]">
                    {room.currentBid ? formatCr(room.currentBid) : "Base Price"}
                  </span>
                  {room.currentBidderName ? (
                    <span className="text-[10px] text-muted-foreground">
                      (Leader: <strong className="text-gold">{room.currentBidderName}</strong>)
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      (No bids placed yet)
                    </span>
                  )}
                  {room.isSold && (
                    <span className="text-[10px] font-bold text-amber-300 px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/40">
                      🔨 Gavel Down
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-semibold hidden md:inline">
                💡 Cash gained in trade is added directly to your purse for this live auction!
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded-lg bg-gold/20 hover:bg-gold border border-gold/50 text-gold hover:text-black font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
              >
                <span>Return to Floor</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {isTradingClosed && (
          <div className="bg-red-950/70 border-b border-red-500/50 px-4 sm:px-6 py-2 flex items-center justify-between gap-2 text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <span className="font-bold">
                Trading Window Closed: The tournament simulation and final jury evaluation are finalized.
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-border/60 bg-black/20 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setTab("PROPOSE")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              tab === "PROPOSE"
                ? "border-gold text-gold bg-gold/10"
                : "border-transparent text-muted-foreground hover:text-cream"
            }`}
          >
            ➕ Propose New Trade
          </button>

          <button
            type="button"
            onClick={() => setTab("INCOMING")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              tab === "INCOMING"
                ? "border-gold text-gold bg-gold/10"
                : "border-transparent text-muted-foreground hover:text-cream"
            }`}
          >
            <span>📥 Received Offers</span>
            {incomingTrades.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono font-black text-[10px] animate-pulse">
                {incomingTrades.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("OUTGOING")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              tab === "OUTGOING"
                ? "border-gold text-gold bg-gold/10"
                : "border-transparent text-muted-foreground hover:text-cream"
            }`}
          >
            <span>📤 Sent Proposals</span>
            {outgoingTrades.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-800 text-cyan-200 font-mono font-bold text-[10px]">
                {outgoingTrades.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("HISTORY")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              tab === "HISTORY"
                ? "border-gold text-gold bg-gold/10"
                : "border-transparent text-muted-foreground hover:text-cream"
            }`}
          >
            📜 Completed ({completedTrades.length})
          </button>
        </div>

        {/* Global Error / Success Alert */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: PROPOSE NEW TRADE */}
          {tab === "PROPOSE" && (
            <div className="space-y-5">
              {otherFranchises.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <HelpCircle size={36} className="text-muted-foreground/60" />
                  <p className="text-sm font-bold text-cream">No other franchises with acquired players yet.</p>
                  <p className="text-xs max-w-sm">
                    Wait for other franchises to purchase players in the auction before proposing trades.
                  </p>
                </div>
              ) : (
                <>
                  {/* Select Partner Franchise */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/40 border border-border/80 rounded-2xl p-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-muted-foreground block">
                        Target Franchise Partner
                      </span>
                      <strong className="text-sm text-cream">Select franchise to trade with:</strong>
                    </div>

                    <select
                      value={targetFranchiseId}
                      onChange={(e) => {
                        setTargetFranchiseId(e.target.value);
                        setSelectedRequestIds([]);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-black border border-gold/40 text-xs font-bold text-cream outline-none focus:border-gold cursor-pointer"
                    >
                      {otherFranchises.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.movies.length} players • {formatCr(p.budget)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2-Column Trade Exchange Builder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {/* Left: Your Squad (What you give) */}
                    <div className="bg-black/30 border border-border/70 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div>
                          <strong className="text-xs font-black uppercase text-gold">1. Players You Offer</strong>
                          <span className="text-[10px] text-muted-foreground block">
                            Your Squad ({mySquad.length} players • {formatCr(myPlayer?.budget)})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold/15 text-gold font-bold">
                          {selectedOfferIds.length} Selected
                        </span>
                      </div>

                      {mySquad.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center italic">
                          You have no acquired players to trade.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-[260px] overflow-y-auto pr-1">
                          {mySquad.map((item) => {
                            const isSelected = selectedOfferIds.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleOfferItem(item.id)}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-gold/20 border-gold shadow-sm"
                                    : "bg-black/40 border-border/70 hover:border-border text-cream"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {item.photoUrl ? (
                                    <img
                                      src={item.photoUrl}
                                      alt={item.title}
                                      className="w-8 h-8 rounded-lg object-cover object-top border border-border flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-black/60 border border-border flex items-center justify-center text-xs font-bold text-gold flex-shrink-0">
                                      {item.title[0]}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <strong className="text-xs font-bold text-cream truncate block">
                                      {item.title}
                                    </strong>
                                    <span className="text-[10px] text-muted-foreground block truncate">
                                      {item.role || item.genre}{item.auctionType === "CRICKET" || item.role ? "" : ` • Rating: ${item.imdbRating}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span className="text-[10px] font-mono font-bold text-gold block">
                                    {formatCr(item.purchasePrice || item.basePrice)}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground font-bold uppercase">
                                    {isSelected ? "Offering ✓" : "Click to select"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Target Squad (What you request) */}
                    <div className="bg-black/30 border border-border/70 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div>
                          <strong className="text-xs font-black uppercase text-cyan-400">2. Players You Request</strong>
                          <span className="text-[10px] text-muted-foreground block">
                            {targetFranchise?.name}&apos;s Squad ({targetSquad.length} players • {formatCr(targetFranchise?.budget)})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">
                          {selectedRequestIds.length} Selected
                        </span>
                      </div>

                      {targetSquad.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center italic">
                          This franchise has no acquired players to trade.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-[260px] overflow-y-auto pr-1">
                          {targetSquad.map((item) => {
                            const isSelected = selectedRequestIds.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleRequestItem(item.id)}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-cyan-950/60 border-cyan-400 shadow-sm"
                                    : "bg-black/40 border-border/70 hover:border-border text-cream"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {item.photoUrl ? (
                                    <img
                                      src={item.photoUrl}
                                      alt={item.title}
                                      className="w-8 h-8 rounded-lg object-cover object-top border border-border flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-black/60 border border-border flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">
                                      {item.title[0]}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <strong className="text-xs font-bold text-cream truncate block">
                                      {item.title}
                                    </strong>
                                    <span className="text-[10px] text-muted-foreground block truncate">
                                      {item.role || item.genre}{item.auctionType === "CRICKET" || item.role ? "" : ` • Rating: ${item.imdbRating}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span className="text-[10px] font-mono font-bold text-cyan-300 block">
                                    {formatCr(item.purchasePrice || item.basePrice)}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground font-bold uppercase">
                                    {isSelected ? "Requested ✓" : "Click to select"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cash Adjustment Controls */}
                  <div className="bg-black/40 border border-border/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Coins className="text-gold" size={18} />
                      <div>
                        <strong className="text-xs font-bold text-cream block">Purse Transfer (Cash Sweetener)</strong>
                        <span className="text-[10px] text-muted-foreground">
                          Optionally include cash to balance the player trade.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex rounded-xl bg-black border border-border p-1">
                        <button
                          type="button"
                          onClick={() => setCashDirection("GIVE")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            cashDirection === "GIVE" ? "bg-gold text-black" : "text-muted-foreground hover:text-cream"
                          }`}
                        >
                          I Give Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashDirection("REQUEST")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            cashDirection === "REQUEST" ? "bg-cyan-400 text-black" : "text-muted-foreground hover:text-cream"
                          }`}
                        >
                          I Request Cash
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 5, 10].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCashAmount((prev) => prev + amt)}
                            className="px-2 py-1 rounded-lg border border-border hover:border-gold text-[10px] font-bold text-cream bg-black/50 cursor-pointer"
                          >
                            +{amt} Cr
                          </button>
                        ))}
                        {cashAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCashAmount(0)}
                            className="px-2 py-1 rounded-lg border border-red-500/40 text-[10px] font-bold text-red-400 bg-red-950/40 cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <span className="text-xs font-mono font-black text-gold ml-2">
                        {cashAmount > 0 ? (cashDirection === "GIVE" ? `- ₹${cashAmount} Cr` : `+ ₹${cashAmount} Cr`) : "₹0 Cr"}
                      </span>
                    </div>
                  </div>

                  {/* Submission Action */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-3 rounded-2xl border border-border hover:border-gold/50 text-xs font-bold text-muted-foreground hover:text-cream cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendProposal}
                      disabled={selectedOfferIds.length === 0 && selectedRequestIds.length === 0}
                      className="px-7 py-3 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-gold/20 hover:brightness-110 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles size={14} /> Send Trade Proposal
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: RECEIVED PROPOSALS */}
          {tab === "INCOMING" && (
            <div className="space-y-4">
              {incomingTrades.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <CheckCircle2 size={36} className="text-emerald-400/60" />
                  <p className="text-sm font-bold text-cream">No pending incoming trade offers.</p>
                  <p className="text-xs max-w-sm">
                    When another franchise proposes a trade with your squad, it will appear here for you to accept or decline.
                  </p>
                </div>
              ) : (
                incomingTrades.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl bg-black/40 border border-gold/40 shadow-xl flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gold">Trade Proposal From:</span>
                        <strong className="text-sm font-black text-cream">{t.fromPlayerName}</strong>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock size={12} /> {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* What they offer */}
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                        <strong className="text-[10px] uppercase font-black text-emerald-400 block mb-1">
                          They Give You:
                        </strong>
                        <ul className="list-disc list-inside space-y-0.5 text-cream font-bold">
                          {t.offeredMovieTitles.map((title, i) => (
                            <li key={i}>{title}</li>
                          ))}
                        </ul>
                        {t.cashAdjustment && t.cashAdjustment > 0 ? (
                          <div className="mt-2 text-gold font-bold font-mono text-[11px]">
                            + ₹{t.cashAdjustment} Cr Purse Transfer to You
                          </div>
                        ) : null}
                      </div>

                      {/* What they request */}
                      <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30">
                        <strong className="text-[10px] uppercase font-black text-red-400 block mb-1">
                          They Request From You:
                        </strong>
                        <ul className="list-disc list-inside space-y-0.5 text-cream font-bold">
                          {t.requestedMovieTitles.map((title, i) => (
                            <li key={i}>{title}</li>
                          ))}
                        </ul>
                        {t.cashAdjustment && t.cashAdjustment < 0 ? (
                          <div className="mt-2 text-red-400 font-bold font-mono text-[11px]">
                            - ₹{Math.abs(t.cashAdjustment)} Cr Purse Transfer from You
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-1 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => handleRespond(t.id, false)}
                        className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-950/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <X size={14} /> Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(t.id, true)}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <Check size={14} /> Accept Trade
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SENT OFFERS */}
          {tab === "OUTGOING" && (
            <div className="space-y-4">
              {outgoingTrades.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <RotateCcw size={36} className="text-muted-foreground/60" />
                  <p className="text-sm font-bold text-cream">No active outgoing trade proposals.</p>
                  <button
                    type="button"
                    onClick={() => setTab("PROPOSE")}
                    className="text-xs text-gold font-bold hover:underline"
                  >
                    Propose a trade now →
                  </button>
                </div>
              ) : (
                outgoingTrades.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl bg-black/40 border border-border/80 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold text-muted-foreground">Proposed To:</span>
                        <strong className="text-sm font-bold text-cyan-400">{t.toPlayerName}</strong>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                        ⏳ Awaiting Decision
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">
                          You Offered:
                        </span>
                        <span className="font-bold text-cream">
                          {t.offeredMovieTitles.join(", ") || "None"}
                        </span>
                        {t.cashAdjustment && t.cashAdjustment > 0 && (
                          <span className="block text-[10px] text-gold font-mono font-bold mt-0.5">
                            + ₹{t.cashAdjustment} Cr Cash
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">
                          You Requested:
                        </span>
                        <span className="font-bold text-cream">
                          {t.requestedMovieTitles.join(", ") || "None"}
                        </span>
                        {t.cashAdjustment && t.cashAdjustment < 0 && (
                          <span className="block text-[10px] text-cyan-400 font-mono font-bold mt-0.5">
                            + ₹{Math.abs(t.cashAdjustment)} Cr Cash Request
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCancel(t.id)}
                        className="px-3.5 py-1.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-950/60 text-xs font-bold cursor-pointer"
                      >
                        Cancel Proposal
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: COMPLETED TRADES HISTORY */}
          {tab === "HISTORY" && (
            <div className="space-y-3">
              {completedTrades.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <ArrowLeftRight size={36} className="text-muted-foreground/60" />
                  <p className="text-sm font-bold text-cream">No completed trades yet.</p>
                  <p className="text-xs max-w-sm">
                    When franchises successfully accept trade agreements, their trade logs will appear here.
                  </p>
                </div>
              ) : (
                completedTrades.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-gold">{t.fromPlayerName}</strong>
                        <ArrowLeftRight size={13} className="text-emerald-400" />
                        <strong className="text-xs font-bold text-cyan-400">{t.toPlayerName}</strong>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">
                          COMPLETED
                        </span>
                      </div>
                      <p className="text-xs text-cream/90">
                        {t.fromPlayerName} gave <strong>{t.offeredMovieTitles.join(", ")}</strong> for{" "}
                        <strong>{t.requestedMovieTitles.join(", ")}</strong>
                        {t.cashAdjustment
                          ? ` (Cash adjustment: ₹${Math.abs(t.cashAdjustment)} Cr)`
                          : ""}
                      </p>
                    </div>

                    <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
