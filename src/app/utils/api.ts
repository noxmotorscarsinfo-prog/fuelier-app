import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { User, DailyLog, SavedDiet, BugReport, Meal } from '../types';
import { Ingredient } from '../../data/ingredientTypes'; // Tipo correcto con caloriesPer100g

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b0e879f0`;

// Auth manager
let accessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('fuelier_auth_token', token);
  } else {
    localStorage.removeItem('fuelier_auth_token');
  }
};

export const getAuthToken = (): string | null => {
  if (accessToken) return accessToken;
  accessToken = localStorage.getItem('fuelier_auth_token');
  return accessToken;
};

const getHeaders = () => {
  const token = getAuthToken();
  // Token es opcional para algunos endpoints públicos (global-meals, global-ingredients)
  // Solo mostrar warning en nivel debug
  if (!token && process.env.NODE_ENV === 'development') {
    console.debug("[API] Using Anon Key (no user token)");
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`
  };
};

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`
};

// ===== AUTHENTICATION API =====

export const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; code?: string; access_token?: string; user?: any }> => {
  try {
    console.log(`[API] Signing up: ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password, name })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API] Signup failed:', data);
      return { 
        success: false, 
        error: data.error || data.details || 'Failed to sign up',
        code: data.code // Incluir el código de error
      };
    }
    
    console.log(`[API] Signup successful for: ${email}`);
    
    // Guardar el token de autenticación
    if (data.access_token) {
      console.log(`[API] Setting auth token after signup`);
      setAuthToken(data.access_token);
    }
    
    return { success: true, access_token: data.access_token, user: data.user };
  } catch (error) {
    console.error('[API] Error in signup:', error);
    return { success: false, error: 'Failed to sign up. Connection error.' };
  }
};

export const signin = async (email: string, password: string): Promise<{ success: boolean; error?: string; code?: string; access_token?: string; user?: any }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'Failed to sign in',
        code: data.code // Incluir el código de error para diagnóstico específico
      };
    }
    
    // Set auth token
    setAuthToken(data.access_token);
    
    return { success: true, access_token: data.access_token, user: data.user };
  } catch (error) {
    console.error('Error in signin:', error);
    return { success: false, error: 'Failed to sign in' };
  }
};

export const getSession = async (): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No token found' };
    }

    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      setAuthToken(null); // Clear invalid token
      return { success: false, error: data.error || 'Invalid session' };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error getting session:', error);
    setAuthToken(null);
    return { success: false, error: 'Failed to get session' };
  }
};

export const signout = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) return true;

    await fetch(`${API_BASE_URL}/auth/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    setAuthToken(null);
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    setAuthToken(null);
    return true;
  }
};

// Validación de admin en servidor (credenciales NO expuestas en frontend)
export const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string; code?: string; isAdmin?: boolean; user?: any }> => {
  try {
    console.log(`[API] Admin login attempt: ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API] Admin login failed:', data);
      return { 
        success: false, 
        error: data.error || 'Failed to authenticate as admin',
        code: data.code
      };
    }
    
    console.log(`[API] Admin login successful: ${email}`);
    return { success: true, isAdmin: data.isAdmin, user: data.user };
  } catch (error) {
    console.error('[API] Error in admin login:', error);
    return { success: false, error: 'Failed to authenticate admin. Connection error.' };
  }
};

// ===== USER API =====

// ⚠️ NO USAR localStorage - TODO EN SUPABASE
// Solo el auth token usa localStorage (requerido por Supabase Auth)

export const getUser = async (email: string): Promise<User | null> => {
  try {
    console.log(`[API] 📥 Getting user: ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    console.log(`[API] Response status: ${response.status}`);
    
    // 404 means user doesn't exist yet (normal for new signups)
    if (response.status === 404) {
      console.log(`[API] User not found in database: ${email} (normal for new users)`);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`[API] Non-OK response from server:`, errorData);
      
      // Treat ANY error as "user not found" for now
      // This allows signup flow to continue to onboarding
      console.log(`[API] Treating error as user not found to allow onboarding: ${email}`);
      return null;
    }
    
    const userData = await response.json();
    console.log(`[API] User found in database: ${email}`);
    return userData;
  } catch (error) {
    console.log(`[API] Exception getting user (treating as not found):`, error);
    // Treat all exceptions as "user not found"
    // This allows the onboarding flow to work even if there are network issues
    return null;
  }
};

export const saveUser = async (user: User): Promise<boolean> => {
  try {
    console.log(`[API] 💾 Guardando usuario: ${user.email}`);
    console.log(`[API] 📊 Datos a guardar:`, {
      email: user.email,
      name: user.name,
      sex: user.sex,
      age: user.age,
      weight: user.weight,
      height: user.height,
      goal: user.goal,
      hasGoals: !!user.goals,
      goalCalories: user.goals?.calories
    });
    
    // 🔍 DEBUG: Verificar token ANTES de enviar request
    const currentToken = getAuthToken();
    console.log(`[API] 🔑 Current auth token:`, currentToken ? `${currentToken.substring(0, 20)}...` : 'NO TOKEN');
    
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    
    console.log(`[API] 📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] ❌ Error al guardar usuario en backend');
      console.error('[API] Status:', response.status);
      console.error('[API] Error:', errorData.error || errorData.details || 'Unknown error');
      
      // ⚠️ CRÍTICO: NO retornar true si falló - lanzar error
      throw new Error(errorData.error || errorData.details || `Error ${response.status}: No se pudo guardar el usuario`);
    }
    
    console.log(`[API] ✅ Usuario guardado exitosamente en backend: ${user.email}`);
    return true;
  } catch (error: any) {
    console.error('[API] ❌ Excepción al guardar usuario');
    console.error('[API] Error:', error.message);
    // ⚠️ CRÍTICO: Re-lanzar el error para que handlePreferencesComplete lo maneje
    throw error;
  }
};

// ===== DAILY LOGS API =====

export const getDailyLogs = async (email: string): Promise<DailyLog[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/daily-logs/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.log('[API] No daily logs found, returning empty array');
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.log('[API] Error getting daily logs, returning empty array');
    return [];
  }
};

export const saveDailyLogs = async (email: string, logs: DailyLog[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/daily-logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, logs })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.code === 'USER_PROFILE_NOT_FOUND') {
        console.log('[API] User profile not found, logs saved locally only');
        console.log('[API] Hint: User profile needs to be saved first via saveUser()');
      } else {
        console.log('[API] Failed to save daily logs:', errorData.error || 'Unknown error');
      }
      // Return true - app can still function with local data
      return true;
    }
    
    console.log('[API] Daily logs saved successfully to backend');
    return true;
  } catch (error) {
    console.log('[API] Error saving daily logs, data saved locally only');
    // Return true - app can still function
    return true;
  }
};

// ===== SAVED DIETS API =====

export const getSavedDiets = async (email: string): Promise<SavedDiet[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-diets/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.log('[API] No saved diets found, returning empty array');
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.log('[API] Error getting saved diets, returning empty array');
    return [];
  }
};

export const saveSavedDiets = async (email: string, diets: SavedDiet[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-diets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, diets })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.code === 'USER_PROFILE_NOT_FOUND') {
        console.log('[API] User profile not found, diets saved locally only');
        console.log('[API] Hint: User profile needs to be saved first via saveUser()');
      } else {
        console.log('[API] Failed to save diets:', errorData.error || 'Unknown error');
      }
      // Return true - app can still function with local data
      return true;
    }
    
    console.log('[API] Saved diets saved successfully to backend');
    return true;
  } catch (error) {
    console.log('[API] Error saving diets, data saved locally only');
    // Return true - app can still function
    return true;
  }
};

// ===== FAVORITE MEALS API =====

export const getFavoriteMeals = async (email: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/favorite-meals/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.log('[API] No favorite meals found, returning empty array');
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.log('[API] Error getting favorite meals, returning empty array');
    return [];
  }
};

export const saveFavoriteMeals = async (email: string, favorites: string[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/favorite-meals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, favorites })
    });
    
    if (!response.ok) {
      console.log('[API] Failed to save favorite meals (may be JWT issue)');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('[API] Error saving favorite meals');
    return false;
  }
};

// ===== BUG REPORTS API =====

export const getBugReports = async (): Promise<BugReport[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bug-reports`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to get bug reports');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting bug reports:', error);
    return [];
  }
};

export const saveBugReports = async (reports: BugReport[]): Promise<boolean> => {
  try {
    console.log(`[API] Saving ${reports.length} bug reports`);
    
    const response = await fetch(`${API_BASE_URL}/bug-reports`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reports })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] Error saving bug reports:', errorData);
      throw new Error(errorData.details || errorData.error || 'Failed to save bug reports');
    }
    
    console.log(`[API] Successfully saved ${reports.length} bug reports`);
    return true;
  } catch (error) {
    console.error('[API] Error saving bug reports:', error);
    throw error; // Re-throw para ver el error real
  }
};

// ===== GLOBAL MEALS API (ADMIN) =====

export const getGlobalMeals = async (): Promise<Meal[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/global-meals`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to get global meals');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting global meals:', error);
    return [];
  }
};

export const saveGlobalMeals = async (meals: Meal[]): Promise<boolean> => {
  try {
    console.log('[API] 💾 saveGlobalMeals - Iniciando guardado...');
    console.log('[API] Total platos a guardar:', meals.length);
    console.log('[API] Platos:', meals.map(m => ({ id: m.id, name: m.name, type: m.type })));
    
    const response = await fetch(`${API_BASE_URL}/global-meals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ meals })
    });
    
    console.log('[API] Response status:', response.status);
    console.log('[API] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', errorText);
      throw new Error(`Failed to save global meals: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('[API] ✅ Platos guardados exitosamente:', result);
    
    return true;
  } catch (error) {
    console.error('[API] ❌ Error saving global meals:', error);
    return false;
  }
};

export const deleteGlobalMeal = async (mealId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/global-meals/${mealId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete global meal');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting global meal:', error);
    return false;
  }
};

// ===== GLOBAL INGREDIENTS API (ADMIN) =====

export const getGlobalIngredients = async (): Promise<Ingredient[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/global-ingredients`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to get global ingredients');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting global ingredients:', error);
    return [];
  }
};

export const saveGlobalIngredients = async (ingredients: Ingredient[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/global-ingredients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ingredients })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save global ingredients');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving global ingredients:', error);
    return false;
  }
};

// ===== TRAINING API =====

export const getTrainingData = async (email: string): Promise<any | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/training/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to get training data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting training data:', error);
    return null;
  }
};

export const saveTrainingData = async (email: string, trainingData: any): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/training`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, trainingData })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save training data');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving training data:', error);
    return false;
  }
};

export const getCompletedWorkouts = async (email: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/training-completed/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    // Cualquier respuesta no-OK, simplemente retornar array vacío (incluyendo 401)
    if (!response.ok) {
      // Solo logear si no es un 401 (error normal cuando no hay datos en primera carga)
      if (response.status !== 401) {
        console.warn(`⚠️ getCompletedWorkouts: Unexpected status ${response.status}`);
      }
      return [];
    }
    
    const data = await response.json();
    console.log('[API] 🔍 getCompletedWorkouts response:', JSON.stringify(data, null, 2));
    
    // Asegurar que siempre retornamos un array
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data;
  } catch (error) {
    // Error de red u otro problema - retornar array vacío silenciosamente
    return [];
  }
};

export const saveCompletedWorkouts = async (email: string, completedWorkouts: any[]): Promise<boolean> => {
  try {
    console.log(`[API] Saving completed workouts for ${email}, count: ${completedWorkouts.length}`);
    
    const response = await fetch(`${API_BASE_URL}/training-completed`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, completedWorkouts })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] Failed to save completed workouts:', errorData);
      console.error('[API] Response status:', response.status);
      console.error('[API] Error details:', errorData.details || errorData.error);
      throw new Error(errorData.details || errorData.error || 'Failed to save completed workouts');
    }
    
    console.log(`[API] Successfully saved ${completedWorkouts.length} completed workouts`);
    return true;
  } catch (error) {
    console.error('[API] Error saving completed workouts:', error);
    console.error('[API] Error message:', error.message);
    throw error;
  }
};

// ===== CSV IMPORT API =====

export const importIngredientsCSV = async (csvData: string): Promise<{ success: boolean; stats?: any; errors?: string[]; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/import-ingredients-csv`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ csvData })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to import CSV' };
    }
    
    return { success: true, stats: data.stats, errors: data.errors };
  } catch (error) {
    console.error('Error importing ingredients CSV:', error);
    return { success: false, error: 'Failed to import CSV' };
  }
};

export const importMealsCSV = async (csvData: string): Promise<{ success: boolean; stats?: any; errors?: string[]; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/import-meals-csv`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ csvData })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to import meals CSV' };
    }
    
    return { success: true, stats: data.stats, errors: data.errors };
  } catch (error) {
    console.error('Error importing meals CSV:', error);
    return { success: false, error: 'Failed to import meals CSV' };
  }
};

// ===== TRAINING PLAN API =====

export const getTrainingPlan = async (email: string): Promise<any[] | null> => {
  try {
    console.log(`[API] Loading training plan for ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/training-plan/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    // Si no hay plan guardado (404 o 401), retornar null
    if (response.status === 404 || response.status === 401) {
      console.log('[API] No training plan found, returning null');
      return null;
    }
    
    if (!response.ok) {
      console.error(`[API] Failed to load training plan, status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[API] Training plan loaded successfully, days: ${data?.length || 0}`);
    return data;
  } catch (error) {
    console.error('[API] Error loading training plan:', error);
    return null;
  }
};

export const saveTrainingPlan = async (email: string, weekPlan: any[]): Promise<boolean> => {
  try {
    if (!weekPlan || weekPlan.length === 0) {
      console.warn('[API] ⚠️ Attempting to save empty training plan. Aborting to prevent data loss.');
      return false;
    }

    console.log(`[API] Saving training plan for ${email}, days: ${weekPlan.length}`);
    
    const response = await fetch(`${API_BASE_URL}/training-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, weekPlan })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] Failed to save training plan:', errorData);
      console.error('[API] Response status:', response.status);
      console.error('[API] Error details:', errorData.details || errorData.error);
      throw new Error(errorData.details || errorData.error || 'Failed to save training plan');
    }
    
    console.log(`[API] Training plan saved successfully`);
    return true;
  } catch (error) {
    console.error('[API] Error saving training plan:', error);
    throw error;
  }
};

// ===== CUSTOM MEALS API (100% Supabase) =====

export const getCustomMeals = async (email: string): Promise<Meal[]> => {
  try {
    console.log(`[API] Loading custom meals for ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/custom-meals/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error('[API] Failed to load custom meals');
      return [];
    }
    
    const data = await response.json();
    console.log(`[API] Loaded ${data.length} custom meals from Supabase`);
    return data;
  } catch (error) {
    console.error('[API] Error loading custom meals:', error);
    return [];
  }
};

export const saveCustomMeals = async (email: string, meals: Meal[]): Promise<boolean> => {
  try {
    console.log(`[API] Saving ${meals.length} custom meals for ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/custom-meals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, meals })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save custom meals');
    }
    
    console.log(`[API] Custom meals saved successfully`);
    return true;
  } catch (error) {
    console.error('[API] Error saving custom meals:', error);
    return false;
  }
};

// ===== CUSTOM EXERCISES API (100% Supabase) =====

export const getCustomExercises = async (email: string): Promise<any[]> => {
  try {
    console.log(`[API] Loading custom exercises for ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/custom-exercises/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error('[API] Failed to load custom exercises');
      return [];
    }
    
    const data = await response.json();
    console.log(`[API] Loaded ${data.length} custom exercises from Supabase`);
    return data;
  } catch (error) {
    console.error('[API] Error loading custom exercises:', error);
    return [];
  }
};

export const saveCustomExercises = async (email: string, exercises: any[]): Promise<boolean> => {
  try {
    console.log(`[API] Saving ${exercises.length} custom exercises for ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/custom-exercises`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, exercises })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save custom exercises');
    }
    
    console.log(`[API] Custom exercises saved successfully`);
    return true;
  } catch (error) {
    console.error('[API] Error saving custom exercises:', error);
    return false;
  }
};

// ===== TRAINING PROGRESS API (100% Supabase) =====

export const getTrainingProgress = async (email: string, date: string): Promise<any | null> => {
  try {
    console.log(`[API] Loading training progress for ${email} on ${date}`);
    
    const response = await fetch(`${API_BASE_URL}/training-progress/${encodeURIComponent(email)}/${date}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.log('[API] No training progress found');
      return null;
    }
    
    const data = await response.json();
    console.log(`[API] Loaded training progress from Supabase`);
    return data;
  } catch (error) {
    console.error('[API] Error loading training progress:', error);
    return null;
  }
};

export const saveTrainingProgress = async (email: string, date: string, progressData: any): Promise<boolean> => {
  try {
    console.log(`[API] Saving training progress for ${email} on ${date}`);
    
    const response = await fetch(`${API_BASE_URL}/training-progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, date, ...progressData })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save training progress');
    }
    
    console.log(`[API] Training progress saved successfully`);
    return true;
  } catch (error) {
    console.error('[API] Error saving training progress:', error);
    return false;
  }
};

export const deleteTrainingProgress = async (email: string, date: string): Promise<boolean> => {
  try {
    console.log(`[API] Deleting training progress for ${email} on ${date}`);
    
    const response = await fetch(`${API_BASE_URL}/training-progress/${encodeURIComponent(email)}/${date}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete training progress');
    }
    
    console.log(`[API] Training progress deleted successfully`);
    return true;
  } catch (error) {
    console.error('[API] Error deleting training progress:', error);
    return false;
  }
};

// ===== CUSTOM INGREDIENTS API (100% Supabase) =====

export const getCustomIngredients = async (email: string): Promise<Ingredient[]> => {
  try {
    console.log(`[API] Loading custom ingredients for ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/custom-ingredients/${encodeURIComponent(email)}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error('[API] Failed to load custom ingredients');
      return [];
    }
    
    const data = await response.json();
    console.log(`[API] Loaded ${data.length} custom ingredients from Supabase`);
    return data;
  } catch (error) {
    console.error('[API] Error loading custom ingredients:', error);
    return [];
  }
};

export const saveCustomIngredients = async (email: string, ingredients: Ingredient[]): Promise<boolean> => {
  try {
    console.log(`[API] Saving ${ingredients.length} custom ingredients for ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/custom-ingredients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, ingredients })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save custom ingredients');
    }
    
    console.log(`[API] Custom ingredients saved successfully`);
    return true;
  } catch (error) {
    console.error('[API] Error saving custom ingredients:', error);
    return false;
  }
};

// ===== BASE INGREDIENTS API (for UI ingredient search) =====
export const getBaseIngredientsFromAPI = async (): Promise<Ingredient[]> => {
  try {
    console.log('[API] Loading base ingredients');
    
    const response = await fetch(`${API_BASE_URL}/global-ingredients`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error('[API] Failed to load base ingredients');
      return [];
    }
    
    const data = await response.json();
    console.log(`[API] Loaded ${data.length} base ingredients from Supabase`);
    return data;
  } catch (error) {
    console.error('[API] Error loading base ingredients:', error);
    return [];
  }
};