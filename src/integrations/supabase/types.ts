export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          room_code: string
          host_id: string
          host_name: string
          status: string
          settings: Json
          current_movie_index: number
          current_bid: number
          current_bidder_id: string | null
          current_bidder_name: string | null
          seconds_remaining: number
          is_sold: boolean
          movie_pool: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_code: string
          host_id: string
          host_name: string
          status?: string
          settings?: Json
          current_movie_index?: number
          current_bid?: number
          current_bidder_id?: string | null
          current_bidder_name?: string | null
          seconds_remaining?: number
          is_sold?: boolean
          movie_pool?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          host_id?: string
          host_name?: string
          status?: string
          settings?: Json
          current_movie_index?: number
          current_bid?: number
          current_bidder_id?: string | null
          current_bidder_name?: string | null
          seconds_remaining?: number
          is_sold?: boolean
          movie_pool?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_players: {
        Row: {
          id: string
          room_code: string
          user_id: string | null
          name: string
          avatar: string
          color: string | null
          budget: number
          initial_budget: number
          is_host: boolean
          is_bot: boolean
          is_ready: boolean
          movies: Json
          joined_at: string
        }
        Insert: {
          id: string
          room_code: string
          user_id?: string | null
          name: string
          avatar?: string
          color?: string | null
          budget?: number
          initial_budget?: number
          is_host?: boolean
          is_bot?: boolean
          is_ready?: boolean
          movies?: Json
          joined_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          user_id?: string | null
          name?: string
          avatar?: string
          color?: string | null
          budget?: number
          initial_budget?: number
          is_host?: boolean
          is_bot?: boolean
          is_ready?: boolean
          movies?: Json
          joined_at?: string
        }
        Relationships: []
      }
      room_bids: {
        Row: {
          id: string
          room_code: string
          player_id: string
          player_name: string
          movie_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          room_code: string
          player_id: string
          player_name: string
          movie_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          player_id?: string
          player_name?: string
          movie_id?: string
          amount?: number
          created_at?: string
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          player_name: string
          room_code: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          player_name: string
          room_code: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          player_name?: string
          room_code?: string
          user_id?: string
        }
        Relationships: []
      }
      room_rankings: {
        Row: {
          id: string
          room_code: string
          player_id: string
          name: string
          avatar: string
          color: string | null
          score: number
          rank: number
          won_count: number
          remaining_budget: number
          critique: string
          breakdown: Json
          created_at: string
        }
        Insert: {
          id?: string
          room_code: string
          player_id: string
          name: string
          avatar: string
          color?: string | null
          score: number
          rank: number
          won_count?: number
          remaining_budget?: number
          critique: string
          breakdown?: Json
          created_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          player_id?: string
          name?: string
          avatar?: string
          color?: string | null
          score?: number
          rank?: number
          won_count?: number
          remaining_budget?: number
          critique?: string
          breakdown?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
