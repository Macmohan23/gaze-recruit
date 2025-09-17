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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          ai_feedback: string | null
          ai_score: number | null
          answer_audio_url: string | null
          answer_text: string | null
          created_at: string
          id: string
          interview_id: string
          question_id: string
          response_time: number | null
        }
        Insert: {
          ai_feedback?: string | null
          ai_score?: number | null
          answer_audio_url?: string | null
          answer_text?: string | null
          created_at?: string
          id?: string
          interview_id: string
          question_id: string
          response_time?: number | null
        }
        Update: {
          ai_feedback?: string | null
          ai_score?: number | null
          answer_audio_url?: string | null
          answer_text?: string | null
          created_at?: string
          id?: string
          interview_id?: string
          question_id?: string
          response_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      gaze_warnings: {
        Row: {
          created_at: string
          id: string
          interview_id: string
          timestamp_offset: number
          warning_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_id: string
          timestamp_offset: number
          warning_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_id?: string
          timestamp_offset?: number
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gaze_warnings_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_id: string
          completed_at: string | null
          completion_time: number | null
          created_at: string
          gaze_warnings: number | null
          id: string
          job_role: Database["public"]["Enums"]["job_role"] | null
          score: number | null
          started_at: string | null
          status: string
          updated_at: string
          video_recording_url: string | null
        }
        Insert: {
          candidate_id: string
          completed_at?: string | null
          completion_time?: number | null
          created_at?: string
          gaze_warnings?: number | null
          id?: string
          job_role?: Database["public"]["Enums"]["job_role"] | null
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          video_recording_url?: string | null
        }
        Update: {
          candidate_id?: string
          completed_at?: string | null
          completion_time?: number | null
          created_at?: string
          gaze_warnings?: number | null
          id?: string
          job_role?: Database["public"]["Enums"]["job_role"] | null
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          video_recording_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          position_applied: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          position_applied?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          position_applied?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string | null
          created_at: string
          difficulty_level: string | null
          expected_duration: number | null
          id: string
          job_role: Database["public"]["Enums"]["job_role"] | null
          question_order: number
          question_text: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          difficulty_level?: string | null
          expected_duration?: number | null
          id?: string
          job_role?: Database["public"]["Enums"]["job_role"] | null
          question_order: number
          question_text: string
        }
        Update: {
          category?: string | null
          created_at?: string
          difficulty_level?: string | null
          expected_duration?: number | null
          id?: string
          job_role?: Database["public"]["Enums"]["job_role"] | null
          question_order?: number
          question_text?: string
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
      job_role:
        | "software_developer"
        | "data_analyst"
        | "designer"
        | "product_manager"
        | "marketing_specialist"
        | "sales_representative"
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
    Enums: {
      job_role: [
        "software_developer",
        "data_analyst",
        "designer",
        "product_manager",
        "marketing_specialist",
        "sales_representative",
      ],
    },
  },
} as const
