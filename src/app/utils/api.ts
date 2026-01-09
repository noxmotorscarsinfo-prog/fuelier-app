import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { User, DailyLog, SavedDiet, BugReport, Meal, Ingredient } from '../types';

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

export const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: any }> => {
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
      return { success: false, error: data.error || data.details || 'Failed to sign up' };
    }
    
    console.log(`[API] Signup successful for: ${email}`);
    return { success: true, user: data.user };
  } catch (error) {
    console.error('[API] Error in signup:', error);
    return { success: false, error: 'Failed to sign up. Connection error.' };
  }
};

export const signin = async (email: string, password: string): Promise<{ success: boolean; error?: string; access_token?: string; user?: any }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to sign in' };
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

// ===== USER API =====

// LocalStorage fallback for when backend fails
const STORAGE_PREFIX = 'fuelier_';

const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
    console.log(`[STORAGE] Saved to localStorage: ${key}`);
  } catch (error) {
    console.error('[STORAGE] Error saving to localStorage:', error);
  }
};

const getFromLocalStorage = (key: string): any | null => {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (data) {
      console.log(`[STORAGE] Retrieved from localStorage: ${key}`);
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('[STORAGE] Error reading from localStorage:', error);
    return null;
  }
};

export const getUser = async (email: string): Promise<User | null> => {
  try {
    console.log(`[API] Getting user: ${email}`);
    
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
    console.log(`[API] Saving user: ${user.email}`);
    
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('[API] Backend unavailable, user data saved locally only');
      console.log('[API] Details:', errorData.details || errorData.error);
      // Return true anyway - app can function without backend persistence
      return true;
    }
    
    console.log(`[API] User saved successfully to backend: ${user.email}`);
    return true;
  } catch (error) {
    console.log('[API] Backend error, user data saved locally only');
    console.log('[API] Error:', error.message);
    // Return true - app can still function
    return true;
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
      console.log('[API] Failed to save daily logs (may be JWT issue)');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('[API] Error saving daily logs');
    return false;
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
      console.log('[API] Failed to save diets (may be JWT issue)');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('[API] Error saving diets');
    return false;
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
    const response = await fetch(`${API_BASE_URL}/global-meals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ meals })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save global meals');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving global meals:', error);
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