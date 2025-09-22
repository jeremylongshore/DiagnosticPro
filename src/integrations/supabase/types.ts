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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      diagnostic_submissions: {
        Row: {
          analysis_status: string | null
          created_at: string
          email: string
          equipment_type: string | null
          error_codes: string | null
          frequency: string | null
          full_name: string
          id: string
          location_environment: string | null
          make: string | null
          mileage_hours: string | null
          model: string | null
          modifications: string | null
          order_id: string | null
          paid_at: string | null
          payment_id: string | null
          payment_status: string | null
          phone: string | null
          previous_repairs: string | null
          problem_description: string | null
          serial_number: string | null
          shop_quote_amount: number | null
          shop_recommendation: string | null
          symptoms: string[] | null
          troubleshooting_steps: string | null
          updated_at: string
          urgency_level: string | null
          usage_pattern: string | null
          user_id: string | null
          when_started: string | null
          year: string | null
        }
        Insert: {
          analysis_status?: string | null
          created_at?: string
          email: string
          equipment_type?: string | null
          error_codes?: string | null
          frequency?: string | null
          full_name: string
          id?: string
          location_environment?: string | null
          make?: string | null
          mileage_hours?: string | null
          model?: string | null
          modifications?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone?: string | null
          previous_repairs?: string | null
          problem_description?: string | null
          serial_number?: string | null
          shop_quote_amount?: number | null
          shop_recommendation?: string | null
          symptoms?: string[] | null
          troubleshooting_steps?: string | null
          updated_at?: string
          urgency_level?: string | null
          usage_pattern?: string | null
          user_id?: string | null
          when_started?: string | null
          year?: string | null
        }
        Update: {
          analysis_status?: string | null
          created_at?: string
          email?: string
          equipment_type?: string | null
          error_codes?: string | null
          frequency?: string | null
          full_name?: string
          id?: string
          location_environment?: string | null
          make?: string | null
          mileage_hours?: string | null
          model?: string | null
          modifications?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone?: string | null
          previous_repairs?: string | null
          problem_description?: string | null
          serial_number?: string | null
          shop_quote_amount?: number | null
          shop_recommendation?: string | null
          symptoms?: string[] | null
          troubleshooting_steps?: string | null
          updated_at?: string
          urgency_level?: string | null
          usage_pattern?: string | null
          user_id?: string | null
          when_started?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_submissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          message_id: string | null
          status: string
          subject: string
          submission_id: string | null
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          message_id?: string | null
          status: string
          subject: string
          submission_id?: string | null
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          message_id?: string | null
          status?: string
          subject?: string
          submission_id?: string | null
          to_email?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          analysis: string | null
          analysis_completed_at: string | null
          created_at: string
          currency: string
          customer_email: string
          email_status: string | null
          error_message: string | null
          id: string
          paid_at: string | null
          processing_status: string | null
          redirect_ready: boolean | null
          redirect_url: string | null
          retry_count: number | null
          status: string
          stripe_session_id: string | null
          submission_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          analysis?: string | null
          analysis_completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          email_status?: string | null
          error_message?: string | null
          id?: string
          paid_at?: string | null
          processing_status?: string | null
          redirect_ready?: boolean | null
          redirect_url?: string | null
          retry_count?: number | null
          status?: string
          stripe_session_id?: string | null
          submission_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          analysis?: string | null
          analysis_completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          email_status?: string | null
          error_message?: string | null
          id?: string
          paid_at?: string | null
          processing_status?: string | null
          redirect_ready?: boolean | null
          redirect_url?: string | null
          retry_count?: number | null
          status?: string
          stripe_session_id?: string | null
          submission_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_submissions"
            referencedColumns: ["id"]
          },
        ]
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
