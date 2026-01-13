/**
 * TIPOS E INTERFACES DE INGREDIENTES
 * 
 * Este archivo contiene solo tipos e interfaces.
 * Los datos de ingredientes vienen 100% de Supabase:
 * - base_ingredients: Ingredientes globales del sistema/admin
 * - custom_ingredients: Ingredientes personalizados del usuario
 */

export interface Ingredient {
  id: string;
  name: string;
  category: 'proteina' | 'carbohidrato' | 'grasa' | 'vegetal' | 'lacteo' | 'fruta' | 'condimento' | 'personalizado' | string;
  // Macros por 100g
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  // Si es un ingrediente personalizado del usuario
  isCustom?: boolean;
  userId?: string;
}

export interface MealIngredientReference {
  ingredientId: string;
  amountInGrams: number;
}

/**
 * Busca un ingrediente por ID en la lista proporcionada
 * @param id - ID del ingrediente a buscar
 * @param allIngredients - Lista combinada de ingredientes (base + custom)
 */
export function getIngredientById(id: string, allIngredients: Ingredient[]): Ingredient | undefined {
  return allIngredients.find(ing => ing.id === id);
}

/**
 * Calcula los macros totales de una lista de referencias de ingredientes
 * @param ingredientRefs - Referencias con ingredientId y cantidad en gramos
 * @param allIngredients - Lista combinada de ingredientes (base + custom) desde Supabase
 */
export function calculateMacrosFromIngredients(
  ingredientRefs: MealIngredientReference[],
  allIngredients: Ingredient[]
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  
  for (const ref of ingredientRefs) {
    const ingredient = getIngredientById(ref.ingredientId, allIngredients);
    if (!ingredient) {
      console.warn(`[calculateMacros] Ingrediente no encontrado: ${ref.ingredientId}`);
      continue;
    }
    
    const factor = ref.amountInGrams / 100;
    
    totalCalories += ingredient.caloriesPer100g * factor;
    totalProtein += ingredient.proteinPer100g * factor;
    totalCarbs += ingredient.carbsPer100g * factor;
    totalFat += ingredient.fatPer100g * factor;
  }
  
  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat)
  };
}

/**
 * Busca un ingrediente por nombre (para migración de platos legacy)
 */
export function findIngredientByName(name: string, allIngredients: Ingredient[]): Ingredient | undefined {
  const nameLower = name.toLowerCase().trim();
  
  // Búsqueda exacta
  const exactMatch = allIngredients.find(
    ing => ing.name.toLowerCase() === nameLower
  );
  if (exactMatch) return exactMatch;
  
  // Búsqueda parcial
  return allIngredients.find(ing => {
    const ingNameLower = ing.name.toLowerCase();
    return ingNameLower.includes(nameLower) || nameLower.includes(ingNameLower);
  });
}
