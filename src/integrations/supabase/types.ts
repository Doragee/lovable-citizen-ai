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
      civil_complaints: {
        Row: {
          category: string | null
          complaint_number: string
          created_at: string | null
          department: string | null
          id: number
          law_clause: string | null
          process_date: string | null
          request_content: string | null
          request_content_embedding: string | null
          request_date: string | null
          response_content: string | null
          status: string | null
          summary: string | null
          title: string
          title_embedding: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          complaint_number: string
          created_at?: string | null
          department?: string | null
          id?: number
          law_clause?: string | null
          process_date?: string | null
          request_content?: string | null
          request_content_embedding?: string | null
          request_date?: string | null
          response_content?: string | null
          status?: string | null
          summary?: string | null
          title: string
          title_embedding?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          complaint_number?: string
          created_at?: string | null
          department?: string | null
          id?: number
          law_clause?: string | null
          process_date?: string | null
          request_content?: string | null
          request_content_embedding?: string | null
          request_date?: string | null
          response_content?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          title_embedding?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      civil_complaints_test: {
        Row: {
          category: string | null
          created_at: string | null
          department: string | null
          id: number
          law_clause: string | null
          min_id: number | null
          process_date: string | null
          request_content: string | null
          request_content_embedding: string | null
          request_date: string | null
          response_content: string | null
          status: number | null
          summary: string | null
          title: string
          title_embedding: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          department?: string | null
          id?: number
          law_clause?: string | null
          min_id?: number | null
          process_date?: string | null
          request_content?: string | null
          request_content_embedding?: string | null
          request_date?: string | null
          response_content?: string | null
          status?: number | null
          summary?: string | null
          title: string
          title_embedding?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          department?: string | null
          id?: number
          law_clause?: string | null
          min_id?: number | null
          process_date?: string | null
          request_content?: string | null
          request_content_embedding?: string | null
          request_date?: string | null
          response_content?: string | null
          status?: number | null
          summary?: string | null
          title?: string
          title_embedding?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      civilcomplaint: {
        Row: {
          category: string | null
          civilianid: number
          complaint_number: string
          created_at: string | null
          department: string | null
          id: number
          law_clause: string | null
          process_date: string | null
          request_content: string | null
          request_content_embedding: string | null
          request_date: string | null
          response_content: string | null
          status: string | null
          summary: string | null
          summary_embedding: string | null
          title: string
          title_embedding: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          civilianid?: number
          complaint_number: string
          created_at?: string | null
          department?: string | null
          id?: number
          law_clause?: string | null
          process_date?: string | null
          request_content?: string | null
          request_content_embedding?: string | null
          request_date?: string | null
          response_content?: string | null
          status?: string | null
          summary?: string | null
          summary_embedding?: string | null
          title: string
          title_embedding?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          civilianid?: number
          complaint_number?: string
          created_at?: string | null
          department?: string | null
          id?: number
          law_clause?: string | null
          process_date?: string | null
          request_content?: string | null
          request_content_embedding?: string | null
          request_date?: string | null
          response_content?: string | null
          status?: string | null
          summary?: string | null
          summary_embedding?: string | null
          title?: string
          title_embedding?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      civilcomplaint_dup: {
        Row: {
          category: string | null
          civilianid: number
          complaint_number: string
          created_at: string | null
          department: string | null
          id: number
          law_clause: string | null
          process_date: string | null
          request_content: string | null
          request_content_embedding: string | null
          request_date: string | null
          response_content: string | null
          status: string | null
          summary: string | null
          summary_embedding: string | null
          title: string
          title_embedding: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          civilianid?: number
          complaint_number: string
          created_at?: string | null
          department?: string | null
          id?: number
          law_clause?: string | null
          process_date?: string | null
          request_content?: string | null
          request_content_embedding?: string | null
          request_date?: string | null
          response_content?: string | null
          status?: string | null
          summary?: string | null
          summary_embedding?: string | null
          title: string
          title_embedding?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          civilianid?: number
          complaint_number?: string
          created_at?: string | null
          department?: string | null
          id?: number
          law_clause?: string | null
          process_date?: string | null
          request_content?: string | null
          request_content_embedding?: string | null
          request_date?: string | null
          response_content?: string | null
          status?: string | null
          summary?: string | null
          summary_embedding?: string | null
          title?: string
          title_embedding?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      department: {
        Row: {
          department_name: string | null
          id: number | null
          keywords: string | null
          main_tasks: string | null
        }
        Insert: {
          department_name?: string | null
          id?: number | null
          keywords?: string | null
          main_tasks?: string | null
        }
        Update: {
          department_name?: string | null
          id?: number | null
          keywords?: string | null
          main_tasks?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          department_name: string | null
          embedding_maintask1: string | null
          embedding_maintask2: string | null
          embedding_maintask3: string | null
          embedding_maintask4: string | null
          embedding_maintask5: string | null
          id: number
          Keyword1: string | null
          Keyword2: string | null
          Keyword3: string | null
          maintask1: string | null
          Maintask2: string | null
          Maintask3: string | null
          Maintask4: string | null
          Maintask5: string | null
        }
        Insert: {
          department_name?: string | null
          embedding_maintask1?: string | null
          embedding_maintask2?: string | null
          embedding_maintask3?: string | null
          embedding_maintask4?: string | null
          embedding_maintask5?: string | null
          id?: never
          Keyword1?: string | null
          Keyword2?: string | null
          Keyword3?: string | null
          maintask1?: string | null
          Maintask2?: string | null
          Maintask3?: string | null
          Maintask4?: string | null
          Maintask5?: string | null
        }
        Update: {
          department_name?: string | null
          embedding_maintask1?: string | null
          embedding_maintask2?: string | null
          embedding_maintask3?: string | null
          embedding_maintask4?: string | null
          embedding_maintask5?: string | null
          id?: never
          Keyword1?: string | null
          Keyword2?: string | null
          Keyword3?: string | null
          maintask1?: string | null
          Maintask2?: string | null
          Maintask3?: string | null
          Maintask4?: string | null
          Maintask5?: string | null
        }
        Relationships: []
      }
      departments_dup: {
        Row: {
          department_name: string | null
          embedding_maintask1: string | null
          embedding_maintask2: string | null
          embedding_maintask3: string | null
          embedding_maintask4: string | null
          embedding_maintask5: string | null
          id: number
          Keyword1: string | null
          Keyword2: string | null
          Keyword3: string | null
          maintask1: string | null
          Maintask2: string | null
          Maintask3: string | null
          Maintask4: string | null
          Maintask5: string | null
        }
        Insert: {
          department_name?: string | null
          embedding_maintask1?: string | null
          embedding_maintask2?: string | null
          embedding_maintask3?: string | null
          embedding_maintask4?: string | null
          embedding_maintask5?: string | null
          id?: never
          Keyword1?: string | null
          Keyword2?: string | null
          Keyword3?: string | null
          maintask1?: string | null
          Maintask2?: string | null
          Maintask3?: string | null
          Maintask4?: string | null
          Maintask5?: string | null
        }
        Update: {
          department_name?: string | null
          embedding_maintask1?: string | null
          embedding_maintask2?: string | null
          embedding_maintask3?: string | null
          embedding_maintask4?: string | null
          embedding_maintask5?: string | null
          id?: never
          Keyword1?: string | null
          Keyword2?: string | null
          Keyword3?: string | null
          maintask1?: string | null
          Maintask2?: string | null
          Maintask3?: string | null
          Maintask4?: string | null
          Maintask5?: string | null
        }
        Relationships: []
      }
      departments_duplicate: {
        Row: {
          department_name: string | null
          embedding_maintask1: string | null
          embedding_maintask2: string | null
          embedding_maintask3: string | null
          embedding_maintask4: string | null
          embedding_maintask5: string | null
          id: number
          Keyword1: string | null
          Keyword2: string | null
          Keyword3: string | null
          maintask1: string | null
          Maintask2: string | null
          Maintask3: string | null
          Maintask4: string | null
          Maintask5: string | null
        }
        Insert: {
          department_name?: string | null
          embedding_maintask1?: string | null
          embedding_maintask2?: string | null
          embedding_maintask3?: string | null
          embedding_maintask4?: string | null
          embedding_maintask5?: string | null
          id?: never
          Keyword1?: string | null
          Keyword2?: string | null
          Keyword3?: string | null
          maintask1?: string | null
          Maintask2?: string | null
          Maintask3?: string | null
          Maintask4?: string | null
          Maintask5?: string | null
        }
        Update: {
          department_name?: string | null
          embedding_maintask1?: string | null
          embedding_maintask2?: string | null
          embedding_maintask3?: string | null
          embedding_maintask4?: string | null
          embedding_maintask5?: string | null
          id?: never
          Keyword1?: string | null
          Keyword2?: string | null
          Keyword3?: string | null
          maintask1?: string | null
          Maintask2?: string | null
          Maintask3?: string | null
          Maintask4?: string | null
          Maintask5?: string | null
        }
        Relationships: []
      }
      temp_search_complaints: {
        Row: {
          content: string
          content_embedding: string | null
          created_at: string | null
          id: number
          title: string
          title_embedding: string | null
        }
        Insert: {
          content: string
          content_embedding?: string | null
          created_at?: string | null
          id?: number
          title: string
          title_embedding?: string | null
        }
        Update: {
          content?: string
          content_embedding?: string | null
          created_at?: string | null
          id?: number
          title?: string
          title_embedding?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_complaints: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          id: number
          request_content: string
          response_content: string
          similarity: number
          title: string
        }[]
      }
      match_complaints_test: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          id: number
          request_content: string
          response_content: string
          similarity: number
          title: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_complaint_embeddings: {
        Args: { complaint_id: number; content_emb: string; title_emb: string }
        Returns: undefined
      }
      update_complaint_embeddings_from_json: {
        Args: {
          complaint_id: number
          content_emb_json: Json
          title_emb_json: Json
        }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
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
