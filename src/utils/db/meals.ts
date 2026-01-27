import { supabase, DbBaseMeal, DbCustomMeal } from '../supabaseClient';
import { Meal, MealType } from '../../app/types';

// ============================================
// PLATOS BASE
// ============================================

/**
 * Obtener todos los platos base
 */
export async function getBaseMeals(): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('base_meals')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching base meals:', error);
    throw error;
  }

  return (data || []).map(dbMealToMeal);
}

/**
 * Obtener un plato base por ID
 */
export async function getBaseMealById(id: string): Promise<Meal | null> {
  const { data, error } = await supabase
    .from('base_meals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching base meal:', error);
    return null;
  }

  return data ? dbMealToMeal(data) : null;
}

/**
 * Obtener platos base por tipo de comida
 */
export async function getBaseMealsByType(mealType: MealType): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('base_meals')
    .select('*')
    .contains('meal_types', [mealType])
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching base meals by type:', error);
    throw error;
  }

  return (data || []).map(dbMealToMeal);
}

/**
 * Crear un nuevo plato base (solo admin)
 */
export async function createBaseMeal(meal: Omit<Meal, 'isCustom' | 'isFavorite'>): Promise<Meal | null> {
  const { data: userData } = await supabase.auth.getUser();
  
  const mealTypes = Array.isArray(meal.type) ? meal.type : [meal.type];
  
  const { data, error } = await supabase
    .from('base_meals')
    .insert({
      id: meal.id,
      name: meal.name,
      meal_types: mealTypes,
      variant: meal.variant,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      base_quantity: meal.baseQuantity,
      ingredients: meal.ingredients || [],
      ingredient_references: meal.ingredientReferences || null,
      preparation_steps: meal.preparationSteps || [],
      tips: meal.tips || [],
      created_by: userData.user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating base meal:', error);
    throw error;
  }

  return data ? dbMealToMeal(data) : null;
}

/**
 * Actualizar un plato base (solo admin)
 */
export async function updateBaseMeal(id: string, updates: Partial<Meal>): Promise<Meal | null> {
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.type !== undefined) {
    updateData.meal_types = Array.isArray(updates.type) ? updates.type : [updates.type];
  }
  if (updates.variant !== undefined) updateData.variant = updates.variant;
  if (updates.calories !== undefined) updateData.calories = updates.calories;
  if (updates.protein !== undefined) updateData.protein = updates.protein;
  if (updates.carbs !== undefined) updateData.carbs = updates.carbs;
  if (updates.fat !== undefined) updateData.fat = updates.fat;
  if (updates.baseQuantity !== undefined) updateData.base_quantity = updates.baseQuantity;
  if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients;
  if (updates.ingredientReferences !== undefined) updateData.ingredient_references = updates.ingredientReferences;
  if (updates.preparationSteps !== undefined) updateData.preparation_steps = updates.preparationSteps;
  if (updates.tips !== undefined) updateData.tips = updates.tips;

  const { data, error } = await supabase
    .from('base_meals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating base meal:', error);
    throw error;
  }

  return data ? dbMealToMeal(data) : null;
}

/**
 * Eliminar un plato base (solo admin)
 */
export async function deleteBaseMeal(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('base_meals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting base meal:', error);
    throw error;
  }

  return true;
}

/**
 * Buscar platos base por nombre
 */
export async function searchBaseMeals(query: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('base_meals')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error searching base meals:', error);
    throw error;
  }

  return (data || []).map(dbMealToMeal);
}

/**
 * Filtrar platos base por rango calórico
 */
export async function filterBaseMealsByCalories(minCal: number, maxCal: number): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('base_meals')
    .select('*')
    .gte('calories', minCal)
    .lte('calories', maxCal)
    .order('calories', { ascending: true });

  if (error) {
    console.error('Error filtering base meals by calories:', error);
    throw error;
  }

  return (data || []).map(dbMealToMeal);
}

// ============================================
// PLATOS PERSONALIZADOS
// ============================================

/**
 * Obtener platos personalizados del usuario actual
 */
export async function getCustomMeals(userId: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('custom_meals')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching custom meals:', error);
    throw error;
  }

  return (data || []).map(dbCustomMealToMeal);
}

/**
 * Crear un plato personalizado
 */
export async function createCustomMeal(userId: string, meal: Omit<Meal, 'isCustom'>): Promise<Meal | null> {
  const mealTypes = Array.isArray(meal.type) ? meal.type : [meal.type];
  
  const { data, error } = await supabase
    .from('custom_meals')
    .insert({
      id: meal.id,
      user_id: userId,
      name: meal.name,
      meal_types: mealTypes,
      variant: meal.variant,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      base_quantity: meal.baseQuantity,
      detailed_ingredients: meal.detailedIngredients || null,
      ingredient_references: meal.ingredientReferences || null,
      preparation_steps: meal.preparationSteps || [],
      tips: meal.tips || [],
      is_favorite: meal.isFavorite || false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating custom meal:', error);
    throw error;
  }

  return data ? dbCustomMealToMeal(data) : null;
}

/**
 * Actualizar un plato personalizado
 */
export async function updateCustomMeal(id: string, updates: Partial<Meal>): Promise<Meal | null> {
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.type !== undefined) {
    updateData.meal_types = Array.isArray(updates.type) ? updates.type : [updates.type];
  }
  if (updates.variant !== undefined) updateData.variant = updates.variant;
  if (updates.calories !== undefined) updateData.calories = updates.calories;
  if (updates.protein !== undefined) updateData.protein = updates.protein;
  if (updates.carbs !== undefined) updateData.carbs = updates.carbs;
  if (updates.fat !== undefined) updateData.fat = updates.fat;
  if (updates.baseQuantity !== undefined) updateData.base_quantity = updates.baseQuantity;
  if (updates.detailedIngredients !== undefined) updateData.detailed_ingredients = updates.detailedIngredients;
  if (updates.ingredientReferences !== undefined) updateData.ingredient_references = updates.ingredientReferences;
  if (updates.preparationSteps !== undefined) updateData.preparation_steps = updates.preparationSteps;
  if (updates.tips !== undefined) updateData.tips = updates.tips;
  if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;

  const { data, error } = await supabase
    .from('custom_meals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating custom meal:', error);
    throw error;
  }

  return data ? dbCustomMealToMeal(data) : null;
}

/**
 * Eliminar un plato personalizado
 */
export async function deleteCustomMeal(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_meals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting custom meal:', error);
    throw error;
  }

  return true;
}

/**
 * Obtener todos los platos personalizados de todos los usuarios (solo admin)
 */
export async function getAllCustomMeals(): Promise<Array<Meal & { userId: string }>> {
  const { data, error } = await supabase
    .from('custom_meals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all custom meals:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...dbCustomMealToMeal(item),
    userId: item.user_id
  }));
}

/**
 * Promover un plato personalizado a plato base (solo admin)
 */
export async function promoteCustomMealToBase(customMealId: string): Promise<Meal | null> {
  // Obtener el plato personalizado
  const { data: customMeal, error: fetchError } = await supabase
    .from('custom_meals')
    .select('*')
    .eq('id', customMealId)
    .single();

  if (fetchError || !customMeal) {
    console.error('Error fetching custom meal for promotion:', fetchError);
    return null;
  }

  const { data: userData } = await supabase.auth.getUser();

  // Crear el plato base
  const { data: baseMeal, error: createError } = await supabase
    .from('base_meals')
    .insert({
      id: `meal_base_${Date.now()}`,
      name: customMeal.name,
      meal_types: customMeal.meal_types,
      variant: customMeal.variant,
      calories: customMeal.calories,
      protein: customMeal.protein,
      carbs: customMeal.carbs,
      fat: customMeal.fat,
      base_quantity: customMeal.base_quantity,
      ingredients: [],
      ingredient_references: customMeal.ingredient_references,
      preparation_steps: customMeal.preparation_steps,
      tips: customMeal.tips,
      created_by: userData.user?.id
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating base meal from custom:', createError);
    throw createError;
  }

  return baseMeal ? dbMealToMeal(baseMeal) : null;
}

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

function dbMealToMeal(db: DbBaseMeal): Meal {
  const mealType = db.meal_types.length === 1 ? db.meal_types[0] as MealType : db.meal_types as MealType[];
  
  return {
    id: db.id,
    name: db.name,
    type: mealType,
    variant: db.variant,
    calories: Number(db.calories),
    protein: Number(db.protein),
    carbs: Number(db.carbs),
    fat: Number(db.fat),
    baseQuantity: Number(db.base_quantity),
    ingredients: db.ingredients || [],
    ingredientReferences: db.ingredient_references || undefined,
    preparationSteps: db.preparation_steps || undefined,
    tips: db.tips || undefined,
    isCustom: false,
    isFavorite: false
  };
}

function dbCustomMealToMeal(db: DbCustomMeal): Meal {
  const mealType = db.meal_types.length === 1 ? db.meal_types[0] as MealType : db.meal_types as MealType[];
  
  return {
    id: db.id,
    name: db.name,
    type: mealType,
    variant: db.variant,
    calories: Number(db.calories),
    protein: Number(db.protein),
    carbs: Number(db.carbs),
    fat: Number(db.fat),
    baseQuantity: Number(db.base_quantity),
    ingredients: [],
    detailedIngredients: db.detailed_ingredients || undefined,
    ingredientReferences: db.ingredient_references || undefined,
    preparationSteps: db.preparation_steps || undefined,
    tips: db.tips || undefined,
    isCustom: true,
    isFavorite: db.is_favorite
  };
}

/**
 * Obtener todos los platos (base + personalizados del usuario)
 */
export async function getAllMeals(userId?: string, mealType?: MealType): Promise<Meal[]> {
  let baseMeals: Meal[];
  
  if (mealType) {
    baseMeals = await getBaseMealsByType(mealType);
  } else {
    baseMeals = await getBaseMeals();
  }
  
  if (!userId) {
    return baseMeals;
  }
  
  const customMeals = await getCustomMeals(userId);
  
  // Filtrar platos personalizados por tipo si se especifica
  const filteredCustomMeals = mealType
    ? customMeals.filter(meal => {
        const types = Array.isArray(meal.type) ? meal.type : [meal.type];
        return types.includes(mealType);
      })
    : customMeals;
  
  return [...baseMeals, ...filteredCustomMeals];
}

/**
 * Obtener estadísticas de platos base (para el admin)
 */
export async function getBaseMealsStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  avgCalories: number;
  avgProtein: number;
}> {
  const { data, error } = await supabase
    .from('base_meals')
    .select('meal_types, calories, protein');

  if (error) {
    console.error('Error fetching meals stats:', error);
    throw error;
  }

  const total = data?.length || 0;
  const byType: Record<string, number> = {};
  let totalCalories = 0;
  let totalProtein = 0;

  data?.forEach(meal => {
    meal.meal_types.forEach((type: string) => {
      byType[type] = (byType[type] || 0) + 1;
    });
    totalCalories += Number(meal.calories);
    totalProtein += Number(meal.protein);
  });

  return {
    total,
    byType,
    avgCalories: total > 0 ? totalCalories / total : 0,
    avgProtein: total > 0 ? totalProtein / total : 0
  };
}
