// =====================================================
// RE-EXPORTACIÓN DEL CLIENTE SINGLETON DE SUPABASE
// =====================================================
// Este archivo solo re-exporta el cliente singleton principal
// NO crear instancias adicionales aquí - todo viene de /src/app/utils/supabase.ts
// Mantiene compatibilidad con imports existentes
// =====================================================

export { supabase } from '../../app/utils/supabase';

// Tipos de la base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          sex: 'male' | 'female';
          age: number;
          birthdate?: string;
          weight: number;
          height: number;
          body_fat_percentage?: number;
          lean_body_mass?: number;
          training_frequency: number;
          training_intensity?: 'light' | 'moderate' | 'intense';
          training_type?: 'strength' | 'cardio' | 'mixed' | 'hiit' | 'crossfit';
          lifestyle_activity?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
          daily_steps?: number;
          goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain';
          meals_per_day: number;
          goal_calories: number;
          goal_protein: number;
          goal_carbs: number;
          goal_fat: number;
          breakfast_percentage?: number;
          lunch_percentage?: number;
          snack_percentage?: number;
          dinner_percentage?: number;
          likes: string[];
          dislikes: string[];
          intolerances: string[];
          allergies: string[];
          is_admin: boolean;
          auto_save_days: boolean;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      base_ingredients: {
        Row: {
          id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          created_at: string;
          updated_at: string;
          created_by?: string;
        };
        Insert: Omit<Database['public']['Tables']['base_ingredients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['base_ingredients']['Insert']>;
      };
      base_meals: {
        Row: {
          id: string;
          name: string;
          meal_types: string[];
          variant?: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          base_quantity: number;
          ingredients: any; // JSON
          preparation_steps: string[];
          tips: string[];
          created_at: string;
          updated_at: string;
          created_by?: string;
        };
        Insert: Omit<Database['public']['Tables']['base_meals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['base_meals']['Insert']>;
      };
      custom_ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['custom_ingredients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['custom_ingredients']['Insert']>;
      };
      custom_meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          meal_types: string[];
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          ingredients: any; // JSON
          preparation_steps: string[];
          tips: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['custom_meals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['custom_meals']['Insert']>;
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          breakfast?: any;
          lunch?: any;
          snack?: any;
          dinner?: any;
          extra_foods: any[];
          complementary_meals: any[];
          weight?: number;
          is_saved: boolean;
          notes?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['daily_logs']['Insert']>;
      };
      saved_diets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description?: string;
          breakfast?: any;
          lunch?: any;
          snack?: any;
          dinner?: any;
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
          tags: string[];
          is_favorite: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['saved_diets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['saved_diets']['Insert']>;
      };
      bug_reports: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: 'bug' | 'feature' | 'improvement' | 'other';
          priority: 'low' | 'medium' | 'high';
          status: 'pending' | 'in-progress' | 'resolved' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bug_reports']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bug_reports']['Insert']>;
      };
      weekly_progress: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          week_number: number;
          start_weight: number;
          end_weight: number;
          weight_change: number;
          average_weight: number;
          start_body_fat?: number;
          end_body_fat?: number;
          body_fat_change?: number;
          days_logged: number;
          average_calories: number;
          target_calories: number;
          calorie_adherence: number;
          average_protein: number;
          average_carbs: number;
          average_fat: number;
          workouts_done: number;
          workouts_planned: number;
          workout_adherence: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weekly_progress']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['weekly_progress']['Insert']>;
      };
    };
    Views: {
      admin_stats: {
        Row: {
          total_users: number;
          total_admins: number;
          total_base_ingredients: number;
          total_base_meals: number;
          total_custom_ingredients: number;
          total_custom_meals: number;
          total_bug_reports: number;
          pending_bug_reports: number;
          total_daily_logs: number;
        };
      };
      top_meals: {
        Row: {
          meal_id: string;
          meal_name: string;
          usage_count: number;
        };
      };
    };
  };
}