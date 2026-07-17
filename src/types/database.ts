export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskStatus = "active" | "pending" | "paused" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type NotificationType =
  | "task_upcoming"
  | "task_completed"
  | "daily_goal_reached"
  | "streak_milestone"
  | "streak_at_risk"
  | "task_overdue"
  | "timer_finished";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          nickname: string | null;
          avatar_seed: string | null;
          avatar_style: string;
          daily_goal_minutes: number;
          local_import_done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          nickname?: string | null;
          avatar_seed?: string | null;
          avatar_style?: string;
          daily_goal_minutes?: number;
          local_import_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          nickname?: string | null;
          avatar_seed?: string | null;
          avatar_style?: string;
          daily_goal_minutes?: number;
          local_import_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          duration: number;
          elapsed: number;
          status: TaskStatus;
          priority: TaskPriority;
          scheduled_time: string | null;
          completed_at: string | null;
          routine_template_id: string | null;
          routine_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          duration?: number;
          elapsed?: number;
          status?: TaskStatus;
          priority?: TaskPriority;
          scheduled_time?: string | null;
          completed_at?: string | null;
          routine_template_id?: string | null;
          routine_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          duration?: number;
          elapsed?: number;
          status?: TaskStatus;
          priority?: TaskPriority;
          scheduled_time?: string | null;
          completed_at?: string | null;
          routine_template_id?: string | null;
          routine_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      routine_templates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          duration: number;
          priority: TaskPriority;
          scheduled_time: string | null;
          weekdays: number[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          duration?: number;
          priority?: TaskPriority;
          scheduled_time?: string | null;
          weekdays: number[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          duration?: number;
          priority?: TaskPriority;
          scheduled_time?: string | null;
          weekdays?: number[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      day_history: {
        Row: {
          user_id: string;
          date: string;
          tasks_completed: number;
          focus_seconds: number;
        };
        Insert: {
          user_id: string;
          date: string;
          tasks_completed?: number;
          focus_seconds?: number;
        };
        Update: {
          user_id?: string;
          date?: string;
          tasks_completed?: number;
          focus_seconds?: number;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          prefs: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          prefs?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          prefs?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          created_at: string;
          read: boolean;
          dedup_key: string;
          task_id: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          created_at?: string;
          read?: boolean;
          dedup_key: string;
          task_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string;
          created_at?: string;
          read?: boolean;
          dedup_key?: string;
          task_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      task_status: TaskStatus;
      task_priority: TaskPriority;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type DayHistoryRow = Database["public"]["Tables"]["day_history"]["Row"];
export type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];
export type RoutineTemplateRow =
  Database["public"]["Tables"]["routine_templates"]["Row"];
