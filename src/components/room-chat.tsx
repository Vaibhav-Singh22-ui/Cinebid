import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Smile,
  Sparkles,
  Volume2,
  VolumeX,
  ArrowDown,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, getRoom, saveRoom } from "@/lib/game-manager";
import { playChatSound } from "@/lib/sound-effects";

export interface DisplayMessage {
  id: string;
  player_name: string;
  body: string;
  timestamp?: number;
  created_at?: string;
  isSystem?: boolean;
}

const QUICK_EMOJIS = ["🔥", "👏", "🏏", "💸", "🏆", "⚡", "🎯", "👑"];

const QUICK_TAUNTS = [
  "🔥 All in!",
  "💸 Too rich for me!",
  "🎯 Steal of the draft!",
  "⚡ Outbidding you!",
  "🛑 Passing on this",
  "👏 Great pick!",
];

const AVATAR_PALETTES = [
  { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400" },
  { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-400" },
  { bg: "bg-cyan-500/20", border: "border-cyan-500/40", text: "text-cyan-400" },
  { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-400" },
  { bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-400" },
  { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
  { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-400" },
];

function getSenderPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatMsgTime(timestamp?: number, created_at?: string): string {
  const time = timestamp || (created_at ? new Date(created_at).getTime() : Date.now());
  return new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function mergeDeduplicatedMessages(
  existing: DisplayMessage[],
  incoming: DisplayMessage[],
): DisplayMessage[] {
  const result: DisplayMessage[] = [...existing];

  for (const inc of incoming) {
    if (!inc.body || !inc.player_name) continue;
    if (inc.isSystem || inc.player_name === "System" || inc.player_name === "Cinebid Host") continue;

    const isDuplicate = result.some((item) => {
      if (item.id === inc.id) return true;
      if (
        item.player_name.trim().toLowerCase() === inc.player_name.trim().toLowerCase() &&
        item.body.trim() === inc.body.trim()
      ) {
        const t1 = item.timestamp || (item.created_at ? new Date(item.created_at).getTime() : 0);
        const t2 = inc.timestamp || (inc.created_at ? new Date(inc.created_at).getTime() : 0);
        if (t1 > 0 && t2 > 0) {
          return Math.abs(t1 - t2) < 10000;
        }
        return true;
      }
      return false;
    });

    if (!isDuplicate) {
      result.push(inc);
    }
  }

  return result;
}

export function RoomChat({
  roomCode,
  playerName,
  className,
}: {
  roomCode: string;
  playerName?: string;
  className?: string;
}) {
  const code = roomCode.toUpperCase();
  const [activePlayerName, setActivePlayerName] = useState(playerName || "Franchise Owner");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  useEffect(() => {
    if (playerName) {
      setActivePlayerName(playerName);
    } else {
      setActivePlayerName(getCurrentUser().name);
    }
  }, [playerName]);

  // Smooth scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setIsAtBottom(true);
      setUnreadCount(0);
    }
  }, []);

  // Monitor user scroll in real-time
  const handleScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceToBottom < 40;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setUnreadCount(0);
    }
  }, []);

  // Load initial messages & connect real-time
  useEffect(() => {
    let active = true;

    const loadLocalMessages = () => {
      const room = getRoom(code);
      if (room && room.chatMessages) {
        const localList: DisplayMessage[] = room.chatMessages
          .filter((m) => !m.isSystem && m.sender !== "System" && m.sender !== "Cinebid Host")
          .map((m) => ({
            id: m.id,
            player_name: m.sender,
            body: m.text,
            timestamp: m.timestamp,
          }));

        setMessages((prev) => {
          const merged = mergeDeduplicatedMessages(prev, localList);
          return merged;
        });
      }
    };

    loadLocalMessages();

    // Load from Supabase DB on mount
    const loadSupabaseMessages = async () => {
      try {
        const { data, error: loadError } = await supabase
          .from("room_messages")
          .select("*")
          .eq("room_code", code)
          .order("created_at", { ascending: true })
          .limit(100);

        if (!active) return;
        if (!loadError && data && data.length > 0) {
          const remoteList: DisplayMessage[] = data
            .filter((m) => m.player_name !== "System" && m.player_name !== "Cinebid Host")
            .map((m) => ({
              id: m.id,
              player_name: m.player_name,
              body: m.body,
              created_at: m.created_at,
              timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
            }));

          setMessages((prev) => mergeDeduplicatedMessages(prev, remoteList));
          // Initial scroll to bottom on load
          setTimeout(() => scrollToBottom(false), 50);
        }
      } catch {
        // Fallback to local
      }
    };

    void loadSupabaseMessages();

    // Listen to local room updates
    const handleRoomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ roomCode: string }>;
      if (customEvent.detail?.roomCode === code) {
        loadLocalMessages();
      }
    };
    window.addEventListener("cinebid_room_update", handleRoomUpdate);

    // Supabase Realtime Channel
    const channelName = `cinebid_chat_${code}`;
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "chat_message" }, (payload) => {
        const payloadData = payload as { payload?: { message?: DisplayMessage } };
        const incoming = payloadData.payload?.message;
        if (
          incoming &&
          incoming.id &&
          !incoming.isSystem &&
          incoming.player_name !== "System" &&
          incoming.player_name !== "Cinebid Host"
        ) {
          setMessages((current) => {
            const updated = mergeDeduplicatedMessages(current, [incoming]);
            return updated;
          });

          const isMe = incoming.player_name.trim().toLowerCase() === (activePlayerName || "").trim().toLowerCase();
          if (!isMe && soundEnabled) {
            playChatSound();
          }

          if (isAtBottomRef.current || isMe) {
            setTimeout(() => scrollToBottom(true), 30);
          } else {
            setUnreadCount((c) => c + 1);
          }
        }
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_code=eq.${code}`,
        },
        (payload) => {
          const m = payload.new as any;
          if (m && m.id && m.player_name !== "System" && m.player_name !== "Cinebid Host") {
            const incoming: DisplayMessage = {
              id: m.id,
              player_name: m.player_name,
              body: m.body,
              created_at: m.created_at,
              timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
            };
            setMessages((current) => mergeDeduplicatedMessages(current, [incoming]));
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("cinebid_room_update", handleRoomUpdate);
      void supabase.removeChannel(channel);
    };
  }, [code, activePlayerName, soundEnabled, scrollToBottom]);

  // Handle send message logic
  const handleSendMessage = async (textToSend: string) => {
    const body = textToSend.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");

    const currentUser = getCurrentUser();
    const senderName = activePlayerName || currentUser.name || "Franchise Owner";
    const now = Date.now();
    const newMsgId = `msg_${now}_${Math.random().toString(36).slice(2, 7)}`;

    const newDisplayMsg: DisplayMessage = {
      id: newMsgId,
      player_name: senderName,
      body,
      timestamp: now,
    };

    // 1. Immediately store in local room state
    const room = getRoom(code);
    if (room) {
      room.chatMessages = room.chatMessages || [];
      room.chatMessages.push({
        id: newMsgId,
        sender: senderName,
        avatar: currentUser.avatar,
        text: body,
        timestamp: now,
      });
      saveRoom(room);
    }

    // 2. Play subtle audio chime
    if (soundEnabled) {
      playChatSound();
    }

    // 3. Optimistic UI update
    setMessages((prev) => mergeDeduplicatedMessages(prev, [newDisplayMsg]));
    setMessage("");

    // Auto-scroll immediately
    setTimeout(() => scrollToBottom(true), 20);

    // 4. Broadcast immediately over Supabase Realtime channel
    try {
      const channel = supabase.channel(`cinebid_chat_${code}`);
      void channel.send({
        type: "broadcast",
        event: "chat_message",
        payload: { message: newDisplayMsg },
      });
    } catch {
      // Ignore broadcast failure
    }

    // 5. Persist to Supabase DB
    try {
      await supabase.from("room_messages").insert({
        room_code: code,
        user_id: currentUser.id,
        player_name: senderName,
        body,
      });
    } catch {
      // Offline fallback
    }

    setSending(false);
    // Keep focus in input for smooth chatting
    inputRef.current?.focus();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSendMessage(message);
  };

  const sendQuickTaunt = (taunt: string) => {
    void handleSendMessage(taunt);
  };

  const appendEmoji = (emoji: string) => {
    setMessage((prev) => `${prev} ${emoji}`.trim());
    inputRef.current?.focus();
  };

  return (
    <div
      className={`room-chat relative flex flex-col overflow-hidden bg-panel/95 border border-border/80 rounded-2xl shadow-xl backdrop-blur-md ${
        className || "h-full min-h-[360px] max-h-[480px]"
      }`}
    >
      {/* Header: Title, Live badge, Sound toggle */}
      <div className="room-chat-heading flex items-center justify-between px-4 py-2.5 border-b border-border/70 flex-shrink-0 bg-black/20">
        <div className="flex items-center gap-2">
          <span className="room-chat-icon p-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30">
            <MessageCircle size={15} />
          </span>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-cream font-display">
                War-Room Chat
              </h2>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Real-time franchise banter
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? "bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
                : "bg-black/40 border-border text-muted-foreground hover:text-cream"
            }`}
            title={soundEnabled ? "Mute chat sounds" : "Unmute chat sounds"}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          <span className="px-2 py-0.5 rounded-full bg-black/50 border border-border text-[10px] font-mono font-bold text-gold">
            {messages.length}
          </span>
        </div>
      </div>

      {/* Messages Scroll Area: Strict min-h-0 and flex-1 so it NEVER expands the parent card */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="chat-messages flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-2 p-3 text-left"
        >
          {messages.length === 0 ? (
            <div className="chat-empty my-auto text-center text-xs text-muted-foreground py-8 px-4 flex flex-col items-center gap-2">
              <Sparkles size={20} className="text-gold/60 animate-pulse" />
              <p className="font-medium text-cream/80">War room is quiet</p>
              <span className="text-[11px] text-muted-foreground max-w-[220px]">
                Fire a quick bid taunt below to shake rival franchises!
              </span>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe =
                m.player_name.trim().toLowerCase() ===
                (activePlayerName || "").trim().toLowerCase();
              const palette = getSenderPalette(m.player_name);
              const initials = getInitials(m.player_name);

              // Check if previous message is from same sender within 2 minutes for sleek grouping
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const isConsecutive =
                prevMsg &&
                prevMsg.player_name.trim().toLowerCase() === m.player_name.trim().toLowerCase() &&
                m.timestamp &&
                prevMsg.timestamp &&
                m.timestamp - prevMsg.timestamp < 120000;

              return (
                <div
                  key={m.id}
                  className={`chat-message-entry flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  } w-full`}
                >
                  <div
                    className={`flex items-end gap-1.5 max-w-[88%] ${
                      isMe ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar monogram (for incoming messages, when not grouped) */}
                    {!isMe && !isConsecutive && (
                      <div
                        className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-[9px] font-black shadow-sm ${palette.bg} ${palette.border} ${palette.text}`}
                        title={m.player_name}
                      >
                        {initials}
                      </div>
                    )}
                    {!isMe && isConsecutive && <div className="w-6 flex-shrink-0" />}

                    {/* Message Card Bubble */}
                    <div
                      className={`p-2.5 rounded-2xl text-xs break-words shadow-sm transition-all text-left ${
                        isMe
                          ? "bg-gradient-to-r from-gold/25 via-gold/15 to-panel-strong border border-gold/40 text-cream rounded-br-xs"
                          : "bg-black/60 border border-border/80 text-cream rounded-bl-xs"
                      }`}
                    >
                      {/* Sender header (only if not consecutive) */}
                      {!isConsecutive && (
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <strong
                            className={`font-black text-[11px] truncate flex items-center gap-1 ${
                              isMe ? "text-gold" : palette.text
                            }`}
                          >
                            {m.player_name}
                            {isMe && (
                              <span className="text-[9px] text-gold/80 font-normal uppercase">
                                (You)
                              </span>
                            )}
                          </strong>
                          <span className="text-[9px] text-muted-foreground/80 font-mono flex-shrink-0">
                            {formatMsgTime(m.timestamp, m.created_at)}
                          </span>
                        </div>
                      )}

                      <p className="leading-relaxed text-xs text-cream/95 whitespace-pre-wrap selection:bg-gold/30">
                        {m.body}
                      </p>

                      {/* Small inline time for consecutive messages */}
                      {isConsecutive && (
                        <div
                          className={`text-[8px] text-muted-foreground/70 font-mono mt-0.5 ${
                            isMe ? "text-right" : "text-left"
                          }`}
                        >
                          {formatMsgTime(m.timestamp, m.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-0 w-0" />
        </div>

        {/* Floating "New Messages" Pill if scrolled up */}
        {!isAtBottom && unreadCount > 0 && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold text-black font-bold text-[11px] shadow-xl hover:scale-105 transition-transform animate-bounce cursor-pointer border border-yellow-300"
          >
            <ArrowDown size={12} />
            <span>
              {unreadCount} new {unreadCount === 1 ? "message" : "messages"}
            </span>
          </button>
        )}
      </div>

      {/* Footer Controls: Quick Banter Chips, Emojis, Compose Bar */}
      <div className="border-t border-border/70 p-2.5 bg-black/35 flex flex-col gap-2 flex-shrink-0">
        {/* Quick Banter Chips (Horizontal scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar">
          <span className="text-[10px] text-gold font-black uppercase tracking-wider flex items-center gap-0.5 flex-shrink-0 pl-0.5">
            <Zap size={11} className="text-gold" /> Taunt:
          </span>
          {QUICK_TAUNTS.map((taunt) => (
            <button
              key={taunt}
              type="button"
              onClick={() => sendQuickTaunt(taunt)}
              disabled={sending}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-panel-strong/80 hover:bg-gold/20 text-cream/90 hover:text-gold border border-border/70 hover:border-gold/40 transition-colors flex-shrink-0 font-medium active:scale-95 cursor-pointer"
            >
              {taunt}
            </button>
          ))}
        </div>

        {/* Emoji Selector Row (Collapsible / Toggleable) */}
        {showEmojis && (
          <div className="flex items-center gap-1 pt-1 border-t border-border/40 overflow-x-auto pb-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => appendEmoji(emoji)}
                className="text-sm p-1 rounded-lg bg-black/40 hover:bg-black/70 hover:scale-125 transition-transform border border-border/40 flex-shrink-0 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={onSubmit} className="flex items-center gap-1.5 relative">
          <button
            type="button"
            onClick={() => setShowEmojis((prev) => !prev)}
            className={`p-2 rounded-xl border transition-colors flex-shrink-0 cursor-pointer ${
              showEmojis
                ? "bg-gold/20 border-gold/40 text-gold"
                : "bg-black/50 border-border/80 text-muted-foreground hover:text-cream"
            }`}
            title="Toggle Quick Emojis"
          >
            <Smile size={14} />
          </button>

          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a war-room taunt..."
              maxLength={180}
              className="w-full bg-black/60 border border-border/80 rounded-xl pl-3 pr-12 py-2 text-xs text-cream outline-none focus:border-gold focus:ring-1 focus:ring-gold placeholder:text-muted-foreground/60 transition-all"
            />
            {message.length > 100 && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground pointer-events-none">
                {180 - message.length}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="px-3.5 py-2 text-xs font-black rounded-xl bg-gold text-black hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 flex-shrink-0 transition-all active:scale-95 shadow-md shadow-gold/10 cursor-pointer"
            title="Send Message"
          >
            <Send size={13} />
          </button>
        </form>

        {error && (
          <span className="text-[10px] text-red-400 text-left block">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
