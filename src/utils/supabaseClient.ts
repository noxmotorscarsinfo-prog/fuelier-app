// Cliente singleton de Supabase - instancia única para toda la aplicación
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Singleton pattern para evitar múltiples instancias
let supabaseInstance: SupabaseClient | null = null;

export const supabase: SupabaseClient = (() => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or Anon Key not configured. Using mock client.');
      // Retornar un cliente vacío para evitar errores en desarrollo
      supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key');
    } else {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    }
  }
  return supabaseInstance;
})();

// ============================================
// TIPOS DE BASE DE DATOS
// ============================================

export interface DbUser {
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
  training_time_preference?: 'morning' | 'afternoon' | 'evening';
  lifestyle_activity?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  occupation?: 'desk_job' | 'standing_job' | 'walking_job' | 'physical_job';
  daily_steps?: number;
  goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain';
  meals_per_day: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  selected_macro_option?: 'maintenance' | 'light' | 'moderate-low' | 'moderate-high' | 'aggressive';
  meal_distribution?: any;
  previous_diet_history?: any;
  metabolic_adaptation?: any;
  preferences?: any;
  accepted_meal_ids?: string[];
  rejected_meal_ids?: string[];
  favorite_meal_ids?: string[];
  favorite_ingredient_ids?: string[];
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface DbBaseIngredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DbCustomIngredient {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
  updated_at: string;
}

export interface DbBaseMeal {
  id: string;
  name: string;
  meal_types: string[];
  variant?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  base_quantity: number;
  ingredients?: string[];
  ingredient_references?: any;
  preparation_steps?: string[];
  tips?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DbCustomMeal {
  id: string;
  user_id: string;
  name: string;
  meal_types: string[];
  variant?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  base_quantity: number;
  detailed_ingredients?: any;
  ingredient_references?: any;
  preparation_steps?: string[];
  tips?: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbDailyLog {
  id: string;
  user_id: string;
  log_date: string;
  breakfast?: any;
  lunch?: any;
  snack?: any;
  dinner?: any;
  extra_foods?: any;
  complementary_meals?: any;
  weight?: number;
  is_saved: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DbSavedDiet {
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
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbBugReport {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbWeeklyProgress {
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
  energy_levels?: string[];
  hunger_levels?: string[];
  workout_quality?: string[];
  workouts_done: number;
  workouts_planned: number;
  workout_adherence: number;
  created_at: string;
  updated_at: string;
}

export interface DbMealAdaptation {
  id: string;
  user_id: string;
  meal_id: string;
  meal_name: string;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  portion_multiplier: number;
  was_accepted: boolean;
  user_adjusted_portion?: number;
  goal_completion?: any;
  context_at_time?: any;
  adaptation_date: string;
  created_at: string;
}