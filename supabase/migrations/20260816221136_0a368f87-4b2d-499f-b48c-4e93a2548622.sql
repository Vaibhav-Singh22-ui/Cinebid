CREATE TABLE public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  user_id uuid NOT NULL,
  player_name text NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 24),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in players can view room chat" ON public.room_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Players can add their room chat messages" ON public.room_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
CREATE INDEX room_messages_room_created_idx ON public.room_messages (room_code, created_at);