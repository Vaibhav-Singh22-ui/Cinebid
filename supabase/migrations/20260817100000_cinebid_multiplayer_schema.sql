-- ==============================================================================
-- CINEBID MULTIPLAYER MOVIE AUCTION SCHEMA
-- Complete Schema for Real-Time Multiplayer Rooms, Live Bidding, Players & Chat
-- ==============================================================================

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE,
  host_id text NOT NULL,
  host_name text NOT NULL,
  status text NOT NULL DEFAULT 'LOBBY' CHECK (status IN ('LOBBY', 'AUCTION', 'TOP_FIVE', 'EVALUATING', 'RESULTS')),
  settings jsonb NOT NULL DEFAULT '{"maxPlayers": 4, "startingBudget": 100, "auctionSeconds": 60, "totalMovies": 8}'::jsonb,
  current_movie_index integer NOT NULL DEFAULT 0,
  current_bid numeric NOT NULL DEFAULT 10,
  current_bidder_id text,
  current_bidder_name text,
  seconds_remaining integer NOT NULL DEFAULT 60,
  is_sold boolean NOT NULL DEFAULT false,
  movie_pool jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. ROOM PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.room_players (
  id text NOT NULL,
  room_code text NOT NULL REFERENCES public.rooms(room_code) ON DELETE CASCADE,
  user_id text,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 30),
  avatar text NOT NULL DEFAULT 'CB',
  color text DEFAULT '#e11d48',
  budget numeric NOT NULL DEFAULT 100,
  initial_budget numeric NOT NULL DEFAULT 100,
  is_host boolean NOT NULL DEFAULT false,
  is_bot boolean NOT NULL DEFAULT false,
  is_ready boolean NOT NULL DEFAULT true,
  movies jsonb NOT NULL DEFAULT '[]'::jsonb,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, room_code)
);

-- 3. ROOM BIDS TABLE (Live Audit Log of Bids)
CREATE TABLE IF NOT EXISTS public.room_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(room_code) ON DELETE CASCADE,
  player_id text NOT NULL,
  player_name text NOT NULL,
  movie_id text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. ROOM MESSAGES TABLE (Community Live Chat)
CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  user_id text NOT NULL,
  player_name text NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 30),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. ROOM RANKINGS TABLE (Final Algorithmic Results)
CREATE TABLE IF NOT EXISTS public.room_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(room_code) ON DELETE CASCADE,
  player_id text NOT NULL,
  name text NOT NULL,
  avatar text NOT NULL,
  color text,
  score numeric NOT NULL,
  rank integer NOT NULL,
  won_count integer NOT NULL DEFAULT 0,
  remaining_budget numeric NOT NULL DEFAULT 0,
  critique text NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM REAL-TIME QUERY SPEED
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON public.room_players (room_code);
CREATE INDEX IF NOT EXISTS idx_room_bids_room ON public.room_bids (room_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_messages_room ON public.room_messages (room_code, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_room_rankings_room ON public.room_rankings (room_code, rank ASC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_rankings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated players to read & participate in rooms with the room code
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update rooms" ON public.rooms;
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can view room players" ON public.room_players;
CREATE POLICY "Anyone can view room players" ON public.room_players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can join room players" ON public.room_players;
CREATE POLICY "Anyone can join room players" ON public.room_players FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update room players" ON public.room_players;
CREATE POLICY "Anyone can update room players" ON public.room_players FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can view room bids" ON public.room_bids;
CREATE POLICY "Anyone can view room bids" ON public.room_bids FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can place room bids" ON public.room_bids;
CREATE POLICY "Anyone can place room bids" ON public.room_bids FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view room messages" ON public.room_messages;
CREATE POLICY "Anyone can view room messages" ON public.room_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can send room messages" ON public.room_messages;
CREATE POLICY "Anyone can send room messages" ON public.room_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view room rankings" ON public.room_rankings;
CREATE POLICY "Anyone can view room rankings" ON public.room_rankings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert room rankings" ON public.room_rankings;
CREATE POLICY "Anyone can insert room rankings" ON public.room_rankings FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- GRANTS FOR CLIENT ROLES
-- ==============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_players TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_bids TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_messages TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_rankings TO anon, authenticated, service_role;

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_bids;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_rankings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
