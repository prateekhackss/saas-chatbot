export type ClientConfig = {
  brandName: string;
  welcomeMessage: string;
  primaryColor: string;
  textColor: string;
  position: 'bottom-right' | 'bottom-left';
  tone: string;
  fallbackMessage: string;
  logoUrl?: string; // Optional since they might not have a logo
  suggestedQuestions: string[];
  allowedOrigins?: string[]; // Optional: restrict which domains can use this client's widget
  
  // Revenue Features
  leadCaptureEnabled?: boolean;
  leadCaptureMessage?: string; // e.g. "Before we chat, could you share your email?"
  handoffWebhookUrl?: string; // Optional webhook URL for escalation notifications
  offlineMessage?: string; // "We're currently offline. Leave your email and we'll get back to you!"
  businessHours?: {
    enabled: boolean;
    timezone: string; // e.g. "America/New_York"
    schedule: Record<string, { start: string; end: string } | null>; 
    // e.g. { mon: { start: "09:00", end: "17:00" }, sat: null, sun: null }
  };
};

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          config: ClientConfig;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          slug: string;
          config?: ClientConfig;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          config?: ClientConfig;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          content: string;
          doc_type: string;
          char_count: number;
          chunk_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          content: string;
          doc_type?: string;
          char_count?: number;
          chunk_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          content?: string;
          doc_type?: string;
          char_count?: number;
          chunk_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          client_id: string;
          content: string;
          embedding: string | number[]; // pgvector returns a string or array depending on the driver
          chunk_index: number;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          client_id: string;
          content: string;
          embedding: string | number[];
          chunk_index: number;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          client_id?: string;
          content?: string;
          embedding?: string | number[];
          chunk_index?: number;
          metadata?: any;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          client_id: string;
          session_id: string;
          messages: any[]; // JSONB array of Message objects
          message_count: number;
          resolved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          session_id: string;
          messages?: any[];
          message_count?: number;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          session_id?: string;
          messages?: any[];
          message_count?: number;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      match_chunks: {
        Args: {
          query_embedding: string | number[];
          match_client_id: string;
          match_count?: number;
          match_threshold?: number;
        };
        Returns: {
          id: string;
          content: string;
          metadata: any;
          similarity: number;
        }[];
      };
    };
    Enums: {};
  };
};
