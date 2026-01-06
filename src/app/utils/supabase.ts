import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// Importar las credenciales de Supabase
// Prioridad: Variables de entorno > Credenciales del archivo info.tsx
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || publicAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials not found! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
} else {
  console.log('✅ Supabase initialized successfully');
  console.log('🔗 URL:', supabaseUrl);
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================================================
// AUTENTICACIÓN
// =====================================================

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name
      }
    }
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// =====================================================
// PROFILES (USUARIOS)
// =====================================================

export async function createProfile(userId: string, profileData: any) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...profileData
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Admin: Ver todos los usuarios
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// =====================================================
// BASE INGREDIENTS (INGREDIENTES BASE)
// =====================================================

export async function getBaseIngredients() {
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createBaseIngredient(ingredient: any) {
  const { data, error } = await supabase
    .from('base_ingredients')
    .insert(ingredient)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateBaseIngredient(id: string, updates: any) {
  const { data, error } = await supabase
    .from('base_ingredients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteBaseIngredient(id: string) {
  const { error } = await supabase
    .from('base_ingredients')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =====================================================
// CUSTOM INGREDIENTS (INGREDIENTES PERSONALIZADOS)
// =====================================================

export async function getCustomIngredients(userId: string) {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createCustomIngredient(userId: string, ingredient: any) {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .insert({
      user_id: userId,
      ...ingredient
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCustomIngredient(id: string, updates: any) {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCustomIngredient(id: string) {
  const { error } = await supabase
    .from('custom_ingredients')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Admin: Ver todos los ingredientes personalizados
export async function getAllCustomIngredients() {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// =====================================================
// BASE MEALS (PLATOS BASE)
// =====================================================

export async function getBaseMeals() {
  const { data, error } = await supabase
    .from('base_meals')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function getBaseMealsByType(mealType: string) {
  const { data, error } = await supabase
    .from('base_meals')
    .select('*')
    .contains('meal_types', [mealType])
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createBaseMeal(meal: any) {
  const { data, error } = await supabase
    .from('base_meals')
    .insert(meal)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateBaseMeal(id: string, updates: any) {
  const { data, error } = await supabase
    .from('base_meals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteBaseMeal(id: string) {
  const { error } = await supabase
    .from('base_meals')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Incrementar contador de uso
export async function incrementMealUsage(mealId: string) {
  const { error } = await supabase.rpc('increment_meal_usage', { meal_id: mealId });
  if (error) console.error('Error incrementing meal usage:', error);
}

// =====================================================
// CUSTOM MEALS (PLATOS PERSONALIZADOS)
// =====================================================

export async function getCustomMeals(userId: string) {
  const { data, error } = await supabase
    .from('custom_meals')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createCustomMeal(userId: string, meal: any) {
  const { data, error } = await supabase
    .from('custom_meals')
    .insert({
      user_id: userId,
      ...meal
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCustomMeal(id: string, updates: any) {
  const { data, error } = await supabase
    .from('custom_meals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCustomMeal(id: string) {
  const { error } = await supabase
    .from('custom_meals')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Admin: Ver todos los platos personalizados
export async function getAllCustomMeals() {
  const { data, error } = await supabase
    .from('custom_meals')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// =====================================================
// DAILY LOGS (REGISTRO DIARIO)
// =====================================================

export async function getDailyLog(userId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

export async function getDailyLogs(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function upsertDailyLog(userId: string, date: string, logData: any) {
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert({
      user_id: userId,
      date,
      ...logData
    }, {
      onConflict: 'user_id,date'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteDailyLog(userId: string, date: string) {
  const { error } = await supabase
    .from('daily_logs')
    .delete()
    .eq('user_id', userId)
    .eq('date', date);
  
  if (error) throw error;
}

// Admin: Ver todos los daily logs
export async function getAllDailyLogs(limit = 100) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*, profiles(name, email)')
    .order('date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// =====================================================
// SAVED DIETS (PLANTILLAS DE DIETAS)
// =====================================================

export async function getSavedDiets(userId: string) {
  const { data, error } = await supabase
    .from('saved_diets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createSavedDiet(userId: string, diet: any) {
  const { data, error } = await supabase
    .from('saved_diets')
    .insert({
      user_id: userId,
      ...diet
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSavedDiet(id: string, updates: any) {
  const { data, error } = await supabase
    .from('saved_diets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSavedDiet(id: string) {
  const { error } = await supabase
    .from('saved_diets')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =====================================================
// WEEKLY PROGRESS (PROGRESO SEMANAL)
// =====================================================

export async function getWeeklyProgress(userId: string) {
  const { data, error } = await supabase
    .from('weekly_progress')
    .select('*')
    .eq('user_id', userId)
    .order('week_start_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createWeeklyProgress(userId: string, progress: any) {
  const { data, error } = await supabase
    .from('weekly_progress')
    .insert({
      user_id: userId,
      ...progress
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateWeeklyProgress(id: string, updates: any) {
  const { data, error } = await supabase
    .from('weekly_progress')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// =====================================================
// BUG REPORTS (REPORTES DE BUGS)
// =====================================================

export async function getBugReports(userId?: string) {
  let query = supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createBugReport(userId: string, report: any) {
  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      user_id: userId,
      ...report
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateBugReport(id: string, updates: any) {
  const { data, error } = await supabase
    .from('bug_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteBugReport(id: string) {
  const { error } = await supabase
    .from('bug_reports')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Admin: Obtener estadísticas de bug reports
export async function getBugReportsStats() {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('status, priority, category');
  
  if (error) throw error;
  
  const stats = {
    total: data.length,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byCategory: {} as Record<string, number>
  };
  
  data.forEach(report => {
    stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
    stats.byPriority[report.priority] = (stats.byPriority[report.priority] || 0) + 1;
    stats.byCategory[report.category] = (stats.byCategory[report.category] || 0) + 1;
  });
  
  return stats;
}

// =====================================================
// MEAL ADAPTATIONS (ADAPTACIONES DE COMIDAS)
// =====================================================

export async function createMealAdaptation(userId: string, adaptation: any) {
  const { data, error } = await supabase
    .from('meal_adaptations')
    .insert({
      user_id: userId,
      ...adaptation
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getMealAdaptations(userId: string) {
  const { data, error } = await supabase
    .from('meal_adaptations')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
}

// =====================================================
// UTILIDADES DE MIGRACIÓN
// =====================================================

// Migrar datos de localStorage a Supabase
export async function migrateLocalStorageToSupabase(userId: string) {
  try {
    console.log('🔄 Starting migration from localStorage to Supabase...');
    
    // 1. Migrar dietUser a profiles (ya debe existir)
    const dietUser = localStorage.getItem('dietUser');
    if (dietUser) {
      const user = JSON.parse(dietUser);
      // El perfil ya se crea en signup, solo actualizamos si hay cambios
      await updateProfile(userId, {
        weight: user.weight,
        height: user.height,
        goal: user.goal,
        meals_per_day: user.mealsPerDay,
        goal_calories: user.goals.calories,
        goal_protein: user.goals.protein,
        goal_carbs: user.goals.carbs,
        goal_fat: user.goals.fat,
        preferences: user.preferences,
        custom_ingredients: user.customIngredients || [],
        favorite_ingredient_ids: user.favoriteIngredientIds || []
      });
      console.log('✅ Profile migrated');
    }
    
    // 2. Migrar dietLogs a daily_logs
    const dietLogs = localStorage.getItem('dietLogs');
    if (dietLogs) {
      const logs = JSON.parse(dietLogs);
      for (const log of logs) {
        await upsertDailyLog(userId, log.date, {
          breakfast: log.breakfast,
          lunch: log.lunch,
          snack: log.snack,
          dinner: log.dinner,
          extra_foods: log.extraFoods,
          complementary_meals: log.complementaryMeals,
          weight: log.weight,
          is_saved: log.isSaved,
          notes: log.notes
        });
      }
      console.log(`✅ ${logs.length} daily logs migrated`);
    }
    
    // 3. Migrar savedDiets
    const savedDiets = localStorage.getItem('savedDiets');
    if (savedDiets) {
      const diets = JSON.parse(savedDiets);
      for (const diet of diets) {
        await createSavedDiet(userId, {
          name: diet.name,
          description: diet.description,
          breakfast: diet.breakfast,
          lunch: diet.lunch,
          snack: diet.snack,
          dinner: diet.dinner,
          total_calories: diet.totalCalories,
          total_protein: diet.totalProtein,
          total_carbs: diet.totalCarbs,
          total_fat: diet.totalFat,
          tags: diet.tags,
          is_favorite: diet.isFavorite
        });
      }
      console.log(`✅ ${diets.length} saved diets migrated`);
    }
    
    // 4. Migrar customMeals (si existen por usuario)
    const customMeals = localStorage.getItem(`customMeals_${userId}`);
    if (customMeals) {
      const meals = JSON.parse(customMeals);
      for (const meal of meals) {
        await createCustomMeal(userId, {
          name: meal.name,
          meal_types: Array.isArray(meal.type) ? meal.type : [meal.type],
          variant: meal.variant,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          base_quantity: meal.baseQuantity || 100,
          detailed_ingredients: meal.detailedIngredients,
          preparation_steps: meal.preparationSteps,
          tips: meal.tips,
          is_favorite: meal.isFavorite
        });
      }
      console.log(`✅ ${meals.length} custom meals migrated`);
    }
    
    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}