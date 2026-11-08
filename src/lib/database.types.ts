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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          approved_at: string | null
          company_domain: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          company_domain?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          company_domain?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      company_inquiries: {
        Row: {
          company_name: string
          contact_person: string
          created_at: string
          email: string
          id: string
          interest_type: string | null
          message: string
          phone: string | null
          status: string | null
        }
        Insert: {
          company_name: string
          contact_person: string
          created_at?: string
          email: string
          id?: string
          interest_type?: string | null
          message: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          interest_type?: string | null
          message?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      cv_submissions: {
        Row: {
          created_at: string
          cv_url: string
          email: string
          faculty: string | null
          full_name: string
          id: string
          phone: string | null
          year_of_study: string | null
        }
        Insert: {
          created_at?: string
          cv_url: string
          email: string
          faculty?: string | null
          full_name: string
          id?: string
          phone?: string | null
          year_of_study?: string | null
        }
        Update: {
          created_at?: string
          cv_url?: string
          email?: string
          faculty?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          year_of_study?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          enabled: boolean
          event_id: string
          id: string
          subject: string
          template_type: Database["public"]["Enums"]["email_template_type"]
        }
        Insert: {
          body?: string
          enabled?: boolean
          event_id: string
          id?: string
          subject?: string
          template_type: Database["public"]["Enums"]["email_template_type"]
        }
        Update: {
          body?: string
          enabled?: boolean
          event_id?: string
          id?: string
          subject?: string
          template_type?: Database["public"]["Enums"]["email_template_type"]
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          background_image_url: string | null
          capacity: number | null
          color_mode: string | null
          created_at: string
          description: string | null
          event_date: string | null
          event_end_date: string | null
          event_type: string | null
          id: string
          location_type: string | null
          location_value: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          registration_deadline: string | null
          registration_limit: number | null
          requires_approval: boolean | null
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          template: string | null
          ticket_price: number | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_image_url?: string | null
          capacity?: number | null
          color_mode?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          event_type?: string | null
          id?: string
          location_type?: string | null
          location_value?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          registration_deadline?: string | null
          registration_limit?: number | null
          requires_approval?: boolean | null
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          template?: string | null
          ticket_price?: number | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_image_url?: string | null
          capacity?: number | null
          color_mode?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          event_type?: string | null
          id?: string
          location_type?: string | null
          location_value?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          registration_deadline?: string | null
          registration_limit?: number | null
          requires_approval?: boolean | null
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          template?: string | null
          ticket_price?: number | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          event_id: string
          field_type: string
          id: string
          label: string
          placeholder: string | null
          position: number
          required: boolean
        }
        Insert: {
          event_id: string
          field_type?: string
          id?: string
          label: string
          placeholder?: string | null
          position?: number
          required?: boolean
        }
        Update: {
          event_id?: string
          field_type?: string
          id?: string
          label?: string
          placeholder?: string | null
          position?: number
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          title: string | null
          user_id: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          title?: string | null
          user_id: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          title?: string | null
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      job_ads: {
        Row: {
          company_name: string
          created_at: string
          deadline: string | null
          description: string | null
          external_link: string | null
          id: string
          image_url: string | null
          published: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          content: string | null
          created_at: string
          gallery_urls: Json | null
          id: string
          instagram_post_id: string | null
          published: boolean
          published_at: string | null
          summary: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          gallery_urls?: Json | null
          id?: string
          instagram_post_id?: string | null
          published?: boolean
          published_at?: string | null
          summary?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          gallery_urls?: Json | null
          id?: string
          instagram_post_id?: string | null
          published?: boolean
          published_at?: string | null
          summary?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      package_prices: {
        Row: {
          created_at: string
          currency: string
          id: string
          notes: string | null
          package: string
          price: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          package: string
          price?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          package?: string
          price?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_prices_package_fkey"
            columns: ["package"]
            isOneToOne: false
            referencedRelation: "package_types"
            referencedColumns: ["key"]
          },
        ]
      }
      package_types: {
        Row: {
          color_class: string
          created_at: string
          is_custom: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color_class?: string
          created_at?: string
          is_custom?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color_class?: string
          created_at?: string
          is_custom?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          referrer_domain: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          referrer_domain?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          referrer_domain?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      partner_participations: {
        Row: {
          created_at: string
          currency: string
          custom_price: number | null
          id: string
          package: string | null
          partner_id: string
          year: number
        }
        Insert: {
          created_at?: string
          currency?: string
          custom_price?: number | null
          id?: string
          package?: string | null
          partner_id: string
          year: number
        }
        Update: {
          created_at?: string
          currency?: string
          custom_price?: number | null
          id?: string
          package?: string | null
          partner_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_participations_package_fkey"
            columns: ["package"]
            isOneToOne: false
            referencedRelation: "package_types"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "partner_participations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          category: Database["public"]["Enums"]["partner_category"]
          created_at: string
          description: string | null
          display_order: number
          id: string
          logo_url: string | null
          name: string
          package: string | null
          updated_at: string
          user_id: string
          visible: boolean
          website: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["partner_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          logo_url?: string | null
          name: string
          package?: string | null
          updated_at?: string
          user_id: string
          visible?: boolean
          website?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["partner_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          logo_url?: string | null
          name?: string
          package?: string | null
          updated_at?: string
          user_id?: string
          visible?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_package_fkey"
            columns: ["package"]
            isOneToOne: false
            referencedRelation: "package_types"
            referencedColumns: ["key"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_value: number
          path: string
          rating: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_value: number
          path: string
          rating: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: number
          path?: string
          rating?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_crop: Json | null
          avatar_url: string | null
          company: string | null
          company_description: string | null
          company_slug: string | null
          created_at: string
          full_name: string | null
          id: string
          social_links: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_crop?: Json | null
          avatar_url?: string | null
          company?: string | null
          company_description?: string | null
          company_slug?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_crop?: Json | null
          avatar_url?: string | null
          company?: string | null
          company_description?: string | null
          company_slug?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          data: Json
          event_id: string
          id: string
          status: Database["public"]["Enums"]["registration_status"]
        }
        Insert: {
          created_at?: string
          data?: Json
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["registration_status"]
        }
        Update: {
          created_at?: string
          data?: Json
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["registration_status"]
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          committee: string
          created_at: string
          display_order: number
          email: string | null
          gender: string | null
          id: string
          linkedin_url: string | null
          name: string
          phone: string | null
          photo_crop: Json | null
          photo_url: string | null
          position_key: string | null
          role: string
          updated_at: string
          user_id: string
          visible: boolean
          year: number
        }
        Insert: {
          committee?: string
          created_at?: string
          display_order?: number
          email?: string | null
          gender?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          phone?: string | null
          photo_crop?: Json | null
          photo_url?: string | null
          position_key?: string | null
          role?: string
          updated_at?: string
          user_id: string
          visible?: boolean
          year?: number
        }
        Update: {
          committee?: string
          created_at?: string
          display_order?: number
          email?: string | null
          gender?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          photo_crop?: Json | null
          photo_url?: string | null
          position_key?: string | null
          role?: string
          updated_at?: string
          user_id?: string
          visible?: boolean
          year?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_company_profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          company_description: string | null
          company_slug: string | null
          id: string | null
          social_links: Json | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          company_description?: string | null
          company_slug?: string | null
          id?: string | null
          social_links?: Json | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          company_description?: string | null
          company_slug?: string | null
          id?: string | null
          social_links?: Json | null
          website?: string | null
        }
        Relationships: []
      }
      public_team_members: {
        Row: {
          committee: string | null
          created_at: string | null
          display_order: number | null
          gender: string | null
          id: string | null
          linkedin_url: string | null
          name: string | null
          photo_crop: Json | null
          photo_url: string | null
          position_key: string | null
          role: string | null
          updated_at: string | null
          visible: boolean | null
          year: number | null
        }
        Insert: {
          committee?: string | null
          created_at?: string | null
          display_order?: number | null
          gender?: string | null
          id?: string | null
          linkedin_url?: string | null
          name?: string | null
          photo_crop?: Json | null
          photo_url?: string | null
          position_key?: string | null
          role?: string | null
          updated_at?: string | null
          visible?: boolean | null
          year?: number | null
        }
        Update: {
          committee?: string | null
          created_at?: string | null
          display_order?: number | null
          gender?: string | null
          id?: string | null
          linkedin_url?: string | null
          name?: string | null
          photo_crop?: Json | null
          photo_url?: string | null
          position_key?: string | null
          role?: string | null
          updated_at?: string | null
          visible?: boolean | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_cv_database: { Args: { _user_id: string }; Returns: boolean }
      cleanup_old_audit_logs: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_registration_count: { Args: { p_event_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_board_member: { Args: { _user_id: string }; Returns: boolean }
      is_email_approved: { Args: { check_email: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      register_for_event: {
        Args: { p_data: Json; p_event_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      email_template_type: "confirmation" | "reminder" | "followup"
      event_status: "draft" | "live" | "past"
      partner_category: "company" | "media" | "sponsor"
      partner_package: "standard" | "silver" | "gold" | "promo"
      registration_status: "registered" | "checked_in" | "cancelled"
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
      app_role: ["admin", "editor", "viewer"],
      email_template_type: ["confirmation", "reminder", "followup"],
      event_status: ["draft", "live", "past"],
      partner_category: ["company", "media", "sponsor"],
      partner_package: ["standard", "silver", "gold", "promo"],
      registration_status: ["registered", "checked_in", "cancelled"],
    },
  },
} as const
