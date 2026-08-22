import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Smile, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, getRoom, saveRoom } from "@/lib/game-manager";

export interface DisplayMessage {
  id: string;
  player_name: string;
  body: string;
  timestamp?: number;
  created_at?: string;
  isSystem?: boolean;
}

const quickEmojis = ["🔥", "👏", "🏏", "💸", "🏆", "⚡", "🎯", "👑"];

function mergeDeduplicatedMessages(
  existing: DisplayMessage[],
  incoming: DisplayMessage[],
): DisplayMessage[] {
  const result: DisplayMessage[] = [...existing];

  for (const inc of incoming) {
    if (!inc.body || !inc.player_name) continue;
    if (inc.isSystem || inc.player_name === "System" || inc.player_name === "Cinebid Host") continue;

    // Strict deduplication by ID and by sender+body content within a short window
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
  const [activePlayerName, setActivePlayerName] = useState(
    playerName || "Franchise Owner",
  );
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playerName) {
      setActivePlayerName(playerName);
    } else {
      setActivePlayerName(getCurrentUser().name);
    }
  }, [playerName]);

  useEffect(() => {
    let active = true;

    // 1. Load from local room state initially
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

        setMessages((prev) => mergeDeduplicatedMessages(prev, localList));
      }
    };

    loadLocalMessages();

    // 2. Load from Supabase DB on mount
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
        }
      } catch {
        // Local fallback in place
      }
    };

    void loadSupabaseMessages();

    // 3. Listen to local room updates
    const handleRoomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ roomCode: string }>;
      if (customEvent.detail?.roomCode === code) {
        loadLocalMessages();
      }
    };
    window.addEventListener("cinebid_room_update", handleRoomUpdate);

    // 4. Supabase Realtime Channel
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
          setMessages((current) => mergeDeduplicatedMessages(current, [incoming]));
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
  }, [code]);

  // Auto-scroll chat box smoothly
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = message.trim();
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

    setMessages((prev) => mergeDeduplicatedMessages(prev, [newDisplayMsg]));
    setMessage("");

    // 2. Broadcast immediately over Supabase Realtime channel
    try {
      const channel = supabase.channel(`cinebid_chat_${code}`);
      void channel.send({
        type: "broadcast",
        event: "chat_message",
        payload: { message: newDisplayMsg },
      });
    } catch {
      // Ignore broadcast error
    }

    // 3. Persist to Supabase DB room_messages table
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
  };

  const sendEmoji = (emoji: string) => {
    setMessage((prev) => `${prev} ${emoji}`.trim());
  };

  return (
    <div
      className={`room-chat flex flex-col flex-1 h-full min-h-[380px] lg:min-h-[420px] bg-panel/95 border border-border/80 rounded-2xl p-4 shadow-xl backdrop-blur-md ${
        className || ""
      }`}
    >
      {/* Header */}
      <div className="room-chat-heading flex items-center justify-between border-b border-border/70 pb-3 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="room-chat-icon p-2 rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-sm">
            <MessageCircle size={17} />
          </span>
          <div className="flex flex-col text-left">
            <h2 className="text-xs uppercase font-black tracking-wider text-cream flex items-center gap-1.5 font-display">
              Live War-Room Chat
            </h2>
            <span className="text-[10px] text-muted-foreground">
              Banter & Strategic Taunts
            </span>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-black/50 border border-border text-[10px] font-mono font-bold text-gold">
          {messages.length} msgs
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="chat-messages flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1.5 min-h-[260px] h-full"
      >
        {messages.length === 0 ? (
          <div className="chat-empty my-auto text-center text-xs text-muted-foreground py-10 px-4 flex flex-col items-center gap-2">
            <Sparkles size={22} className="text-gold/60" />
            <span>War room is quiet. Fire a quick bid taunt or emoji to shake rival franchises!</span>
          </div>
        ) : (
          messages.map((m) => {
            const isMe =
              m.player_name.toLowerCase() ===
              (activePlayerName || "").toLowerCase();
            return (
              <div
                key={m.id}
                className={`chat-message p-3 rounded-2xl text-xs break-words shadow-sm transition-all text-left ${
                  isMe
                    ? "bg-gradient-to-r from-gold/20 to-panel-strong border border-gold/40 ml-4 self-end max-w-[88%]"
                    : "bg-black/50 border border-border/60 mr-4 self-start max-w-[88%]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <strong className={`font-black text-[11px] truncate ${isMe ? "text-gold" : "text-cream"}`}>
                    {m.player_name}
                    {isMe && (
                      <span className="text-[9px] text-gold/80 font-normal uppercase ml-1">
                        (You)
                      </span>
                    )}
                  </strong>
                  {m.timestamp && (
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                <p className="text-cream/90 leading-relaxed text-xs">{m.body}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Emojis & Input Form */}
      <form onSubmit={submit} className="chat-form border-t border-border/70 pt-3 mt-3">
        <div className="chat-emoji-row flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
          <Smile size={14} className="text-gold mr-0.5 flex-shrink-0" />
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendEmoji(emoji)}
              className="text-sm hover:scale-130 transition-transform p-1 rounded-lg bg-black/40 hover:bg-black/70 border border-border/40 flex-shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="chat-compose flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a war-room taunt or message..."
            maxLength={180}
            className="flex-1 bg-black/60 border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-cream outline-none focus:border-gold focus:ring-1 focus:ring-gold placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="btn btn-primary px-4 py-2.5 text-xs font-black rounded-xl bg-gold text-black hover:brightness-110 disabled:opacity-30 flex items-center justify-center gap-1 flex-shrink-0"
            title="Send Message"
          >
            <Send size={14} />
          </button>
        </div>
        {error && <span className="chat-error text-[10px] text-red-400 mt-1.5 block text-left">{error}</span>}
      </form>
    </div>
  );
}
