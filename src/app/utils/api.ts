import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { User, DailyLog, SavedDiet, BugReport, Meal, Ingredient } from '../types';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b0e879f0`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`
};

// ===== USER API =====

export const getUser = async (email: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(email)}`, {
      headers
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to get user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const saveUser = async (user: User): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'POST',
      headers,
      body: JSON.stringify(user)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save user');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

// ===== DAILY LOGS API =====

export const getDailyLogs = async (email: string): Promise<DailyLog[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/daily-logs/${encodeURIComponent(email)}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to get daily logs');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting daily logs:', error);
    return [];
  }
};

export const saveDailyLogs = async (email: string, logs: DailyLog[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/daily-logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, logs })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save daily logs');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving daily logs:', error);
    return false;
  }
};

// ===== SAVED DIETS API =====

export const getSavedDiets = async (email: string): Promise<SavedDiet[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-diets/${encodeURIComponent(email)}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to get saved diets');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting saved diets:', error);
    return [];
  }
};

export const saveSavedDiets = async (email: string, diets: SavedDiet[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-diets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, diets })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save diets');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving diets:', error);
    return false;
  }
};

// ===== FAVORITE MEALS API =====

export const getFavoriteMeals = async (email: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/favorite-meals/${encodeURIComponent(email)}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to get favorite meals');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting favorite meals:', error);
    return [];
  }
};

export const saveFavoriteMeals = async (email: string, favorites: string[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/favorite-meals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, favorites })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save favorite meals');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving favorite meals:', error);
    return false;
  }
};

// ===== BUG REPORTS API =====

export const getBugReports = async (): Promise<BugReport[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bug-reports`, {
      headers
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
    const response = await fetch(`${API_BASE_URL}/bug-reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reports })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save bug reports');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving bug reports:', error);
    return false;
  }
};

// ===== GLOBAL MEALS API (ADMIN) =====

export const getGlobalMeals = async (): Promise<Meal[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/global-meals`, {
      headers
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
      headers,
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
      headers
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
      headers,
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