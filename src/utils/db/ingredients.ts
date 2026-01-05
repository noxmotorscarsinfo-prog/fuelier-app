import { supabase, DbBaseIngredient, DbCustomIngredient } from '../supabaseClient';
import { Ingredient } from '../../app/types';

// ============================================
// INGREDIENTES BASE
// ============================================

/**
 * Obtener todos los ingredientes base
 */
export async function getBaseIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching base ingredients:', error);
    throw error;
  }

  return (data || []).map(dbIngredientToIngredient);
}

/**
 * Obtener un ingrediente base por ID
 */
export async function getBaseIngredientById(id: string): Promise<Ingredient | null> {
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching base ingredient:', error);
    return null;
  }

  return data ? dbIngredientToIngredient(data) : null;
}

/**
 * Crear un nuevo ingrediente base (solo admin)
 */
export async function createBaseIngredient(ingredient: Omit<Ingredient, 'isCustom'>): Promise<Ingredient | null> {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('base_ingredients')
    .insert({
      id: ingredient.id,
      name: ingredient.name,
      calories: ingredient.calories,
      protein: ingredient.protein,
      carbs: ingredient.carbs,
      fat: ingredient.fat,
      created_by: userData.user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating base ingredient:', error);
    throw error;
  }

  return data ? dbIngredientToIngredient(data) : null;
}

/**
 * Actualizar un ingrediente base (solo admin)
 */
export async function updateBaseIngredient(id: string, updates: Partial<Ingredient>): Promise<Ingredient | null> {
  const { data, error } = await supabase
    .from('base_ingredients')
    .update({
      name: updates.name,
      calories: updates.calories,
      protein: updates.protein,
      carbs: updates.carbs,
      fat: updates.fat
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating base ingredient:', error);
    throw error;
  }

  return data ? dbIngredientToIngredient(data) : null;
}

/**
 * Eliminar un ingrediente base (solo admin)
 */
export async function deleteBaseIngredient(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('base_ingredients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting base ingredient:', error);
    throw error;
  }

  return true;
}

/**
 * Buscar ingredientes base por nombre
 */
export async function searchBaseIngredients(query: string): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error searching base ingredients:', error);
    throw error;
  }

  return (data || []).map(dbIngredientToIngredient);
}

// ============================================
// INGREDIENTES PERSONALIZADOS
// ============================================

/**
 * Obtener ingredientes personalizados del usuario actual
 */
export async function getCustomIngredients(userId: string): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching custom ingredients:', error);
    throw error;
  }

  return (data || []).map(dbCustomIngredientToIngredient);
}

/**
 * Crear un ingrediente personalizado
 */
export async function createCustomIngredient(userId: string, ingredient: Omit<Ingredient, 'isCustom'>): Promise<Ingredient | null> {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .insert({
      id: ingredient.id,
      user_id: userId,
      name: ingredient.name,
      calories: ingredient.calories,
      protein: ingredient.protein,
      carbs: ingredient.carbs,
      fat: ingredient.fat
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating custom ingredient:', error);
    throw error;
  }

  return data ? dbCustomIngredientToIngredient(data) : null;
}

/**
 * Actualizar un ingrediente personalizado
 */
export async function updateCustomIngredient(id: string, updates: Partial<Ingredient>): Promise<Ingredient | null> {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .update({
      name: updates.name,
      calories: updates.calories,
      protein: updates.protein,
      carbs: updates.carbs,
      fat: updates.fat
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating custom ingredient:', error);
    throw error;
  }

  return data ? dbCustomIngredientToIngredient(data) : null;
}

/**
 * Eliminar un ingrediente personalizado
 */
export async function deleteCustomIngredient(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_ingredients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting custom ingredient:', error);
    throw error;
  }

  return true;
}

/**
 * Obtener todos los ingredientes personalizados de todos los usuarios (solo admin)
 */
export async function getAllCustomIngredients(): Promise<Array<Ingredient & { userId: string }>> {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all custom ingredients:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...dbCustomIngredientToIngredient(item),
    userId: item.user_id
  }));
}

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

function dbIngredientToIngredient(db: DbBaseIngredient): Ingredient {
  return {
    id: db.id,
    name: db.name,
    calories: Number(db.calories),
    protein: Number(db.protein),
    carbs: Number(db.carbs),
    fat: Number(db.fat),
    isCustom: false
  };
}

function dbCustomIngredientToIngredient(db: DbCustomIngredient): Ingredient {
  return {
    id: db.id,
    name: db.name,
    calories: Number(db.calories),
    protein: Number(db.protein),
    carbs: Number(db.carbs),
    fat: Number(db.fat),
    isCustom: true
  };
}

/**
 * Obtener todos los ingredientes (base + personalizados del usuario)
 */
export async function getAllIngredients(userId?: string): Promise<Ingredient[]> {
  const baseIngredients = await getBaseIngredients();
  
  if (!userId) {
    return baseIngredients;
  }
  
  const customIngredients = await getCustomIngredients(userId);
  return [...baseIngredients, ...customIngredients];
}
