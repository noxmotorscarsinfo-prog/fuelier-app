/**
 * ESCALADO INTELIGENTE DE INGREDIENTES
 * 
 * Este módulo escala los ingredientes de un plato según el multiplicador de porción,
 * usando la lista de ingredientes proporcionada desde Supabase.
 * 
 * ✅ 100% CLOUD - Recibe ingredientes como parámetro
 */

import { Meal, MealIngredient } from '../types';
import { Ingredient, MealIngredientReference, getIngredientById } from '../../data/ingredientTypes';

/**
 * Escala los ingredientes de un plato según el multiplicador de porción
 * 
 * @param meal - Plato con ingredientReferences
 * @param portionMultiplier - Multiplicador (ej: 1.5 para 150% de la receta base)
 * @param allIngredients - Lista de ingredientes de Supabase (base + custom)
 * @returns Array de ingredientes escalados con macros calculados
 */
export function scaleIngredientsForMeal(
  meal: Meal,
  portionMultiplier: number,
  allIngredients: Ingredient[]
): MealIngredient[] {
  // Si el plato no tiene referencias a ingredientes, devolver array vacío
  if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
    return [];
  }
  
  const scaledIngredients: MealIngredient[] = [];
  
  for (const ref of meal.ingredientReferences) {
    const ingredient = getIngredientById(ref.ingredientId, allIngredients);
    
    if (!ingredient) {
      console.warn(`Ingrediente no encontrado: ${ref.ingredientId}`);
      continue;
    }
    
    // Cantidad escalada
    const scaledAmount = ref.amountInGrams * portionMultiplier;
    
    // Calcular macros para la cantidad escalada
    const factor = scaledAmount / 100; // Factor para macros per 100g
    
    const scaledIngredient: MealIngredient = {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      amount: Math.round(scaledAmount),
      calories: Math.round(ingredient.caloriesPer100g * factor),
      protein: Math.round((ingredient.proteinPer100g * factor) * 10) / 10,
      carbs: Math.round((ingredient.carbsPer100g * factor) * 10) / 10,
      fat: Math.round((ingredient.fatPer100g * factor) * 10) / 10
    };
    
    scaledIngredients.push(scaledIngredient);
  }
  
  return scaledIngredients;
}

/**
 * Aplica el escalado al plato completo, actualizando todos sus macros
 * 
 * @param meal - Plato base
 * @param portionMultiplier - Multiplicador
 * @param allIngredients - Lista de ingredientes de Supabase (base + custom)
 * @returns Plato escalado con ingredientes detallados
 */
export function scaleMealWithIngredients(
  meal: Meal,
  portionMultiplier: number,
  allIngredients: Ingredient[]
): Meal {
  // Escalar ingredientes
  const scaledIngredients = scaleIngredientsForMeal(meal, portionMultiplier, allIngredients);
  
  // Calcular macros totales desde los ingredientes escalados
  const totalMacros = scaledIngredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  return {
    ...meal,
    calories: Math.round(totalMacros.calories),
    protein: Math.round(totalMacros.protein * 10) / 10,
    carbs: Math.round(totalMacros.carbs * 10) / 10,
    fat: Math.round(totalMacros.fat * 10) / 10,
    detailedIngredients: scaledIngredients,
    portionMultiplier, // Guardar el multiplicador aplicado
    // Actualizar descripción de ingredientes para legacy
    ingredients: scaledIngredients.map(
      ing => `${ing.amount}g ${ing.ingredientName}`
    )
  };
}

/**
 * Calcula los macros totales de una lista de ingredientes
 */
export function calculateTotalMacrosFromIngredients(ingredients: MealIngredient[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
