import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Smile } from "lucide-react";
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

const quickEmojis = ["🔥", "👏", "🎬", "💸", "🏆", "🍿"];

function mergeDeduplicatedMessages(
  existing: DisplayMessage[],
  incoming: DisplayMessage[],
): DisplayMessage[] {
  const result: DisplayMessage[] = [...existing];

  for (const inc of incoming) {
    if (!inc.body || !inc.player_name) continue;
    if (inc.isSystem || inc.player_name === "System" || inc.player_name === "Cinebid Host") continue;

    // Strict deduplication by ID and by sender+body content
    const isDuplicate = result.some((item) => {
      if (item.id === inc.id) return true;
      if (item.player_name.trim().toLowerCase() === inc.player_name.trim().toLowerCase() &&
          item.body.trim() === inc.body.trim()) {
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
}: {
  roomCode: string;
  playerName?: string;
}) {
  const code = roomCode.toUpperCase();
  const [activePlayerName, setActivePlayerName] = useState(
    playerName || "Player",
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
    const senderName = activePlayerName || currentUser.name || "Cinephile";
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
    <div className="room-chat flex flex-col h-full min-h-[300px] max-h-[460px] bg-panel/80 border border-border/80 rounded-xl p-3 shadow-lg">
      <div className="room-chat-heading flex items-center gap-2 border-b border-border/60 pb-2 mb-2">
        <span className="room-chat-icon p-1.5 rounded-lg bg-gold/15 text-gold">
          <MessageCircle size={16} />
        </span>
        <h2 className="text-xs uppercase font-bold tracking-wider text-cream flex items-center gap-1.5">
          Live Studio Chat
          <span className="text-[10px] text-muted-foreground font-normal">
            ({messages.length})
          </span>
        </h2>
      </div>

      <div
        ref={chatContainerRef}
        className="chat-messages flex-1 overflow-y-auto flex flex-col gap-2 pr-1 min-h-[140px]"
      >
        {messages.length === 0 ? (
          <div className="chat-empty my-auto text-center text-xs text-muted-foreground py-6">
            No banter yet. Start negotiating with rival producers!
          </div>
        ) : (
          messages.map((m) => {
            const isMe =
              m.player_name.toLowerCase() ===
              (activePlayerName || "").toLowerCase();
            return (
              <div
                key={m.id}
                className={`chat-message p-2 rounded-lg text-xs break-words ${
                  isMe
                    ? "bg-gold/15 border border-gold/30 ml-3"
                    : "bg-black/30 border border-border/40 mr-3"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <strong className={isMe ? "text-gold" : "text-cream/90"}>
                    {m.player_name} {isMe && <span className="text-[10px] text-muted-foreground font-normal">(You)</span>}
                  </strong>
                </div>
                <span className="text-cream/90">{m.body}</span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="chat-form border-t border-border/60 pt-2 mt-2">
        <div className="chat-emoji-row flex items-center gap-1 mb-1.5">
          <Smile size={13} className="text-muted-foreground mr-0.5" />
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendEmoji(emoji)}
              className="text-xs hover:scale-125 transition-transform p-0.5 rounded"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="chat-compose flex gap-1.5">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a bid taunt or message..."
            maxLength={180}
            className="flex-1 bg-cinema/80 border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="btn btn-primary px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
        {error && <span className="chat-error text-[10px] text-red-400 mt-1 block">{error}</span>}
      </form>
    </div>
  );
}
