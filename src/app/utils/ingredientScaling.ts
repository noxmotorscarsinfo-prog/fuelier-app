/**
 * Utilidades para escalar ingredientes según la porción seleccionada
 */

import { MealIngredient } from '../types';

/**
 * Parsea un string de ingrediente para extraer la cantidad en gramos
 * Ejemplos:
 *   "200g Pechuga de pollo" -> { amount: 200, name: "Pechuga de pollo", unit: "g" }
 *   "150g Arroz blanco" -> { amount: 150, name: "Arroz blanco", unit: "g" }
 *   "2 Huevos grandes" -> { amount: 2, name: "Huevos grandes", unit: "unidades" }
 */
export function parseIngredient(ingredientString: string): {
  amount: number;
  name: string;
  unit: string;
} | null {
  // Patrones comunes:
  // "200g Pechuga de pollo"
  // "150 g Arroz"
  // "2 Huevos"
  // "1 Aguacate"
  
  // Patrón 1: "200g Nombre" o "200 g Nombre"
  const gramPattern = /^(\d+(?:\.\d+)?)\s*g\s+(.+)$/i;
  const gramMatch = ingredientString.match(gramPattern);
  if (gramMatch) {
    return {
      amount: parseFloat(gramMatch[1]),
      name: gramMatch[2].trim(),
      unit: 'g'
    };
  }
  
  // Patrón 2: "2 Huevos" o "1 Aguacate"
  const unitPattern = /^(\d+(?:\.\d+)?)\s+(.+)$/;
  const unitMatch = ingredientString.match(unitPattern);
  if (unitMatch) {
    return {
      amount: parseFloat(unitMatch[1]),
      name: unitMatch[2].trim(),
      unit: 'unidades'
    };
  }
  
  // Si no se puede parsear, retornar null
  return null;
}

/**
 * Escala un ingrediente parseado según un multiplicador
 */
export function scaleIngredient(
  ingredientString: string,
  multiplier: number
): string {
  const parsed = parseIngredient(ingredientString);
  
  if (!parsed) {
    // Si no se puede parsear, retornar el string original
    return ingredientString;
  }
  
  const scaledAmount = parsed.amount * multiplier;
  
  // Redondear a 1 decimal si es necesario
  const roundedAmount = Math.round(scaledAmount * 10) / 10;
  
  if (parsed.unit === 'g') {
    return `${Math.round(roundedAmount)}g ${parsed.name}`;
  } else {
    // Para unidades, redondear a enteros o medios
    const rounded = roundedAmount % 1 === 0 
      ? Math.round(roundedAmount)
      : Math.round(roundedAmount * 2) / 2; // Redondear a 0.5
    
    return `${rounded} ${parsed.name}`;
  }
}

/**
 * Escala una lista de ingredientes según un multiplicador
 */
export function scaleIngredients(
  ingredients: string[],
  multiplier: number
): string[] {
  return ingredients.map(ing => scaleIngredient(ing, multiplier));
}

/**
 * Escala ingredientes detallados (para comidas custom)
 */
export function scaleDetailedIngredients(
  ingredients: MealIngredient[],
  multiplier: number
): MealIngredient[] {
  return ingredients.map(ing => ({
    ...ing,
    amount: Math.round(ing.amount * multiplier * 10) / 10,
    calories: Math.round(ing.calories * multiplier),
    protein: Math.round(ing.protein * multiplier * 10) / 10,
    carbs: Math.round(ing.carbs * multiplier * 10) / 10,
    fat: Math.round(ing.fat * multiplier * 10) / 10
  }));
}

/**
 * Formatea una lista de ingredientes escalados para mostrar en UI
 */
export function formatIngredientsList(ingredients: string[]): string {
  return ingredients.join(' • ');
}

/**
 * Formatea ingredientes detallados para mostrar en UI
 */
export function formatDetailedIngredientsList(ingredients: MealIngredient[]): string {
  return ingredients
    .map(ing => `${Math.round(ing.amount)}g ${ing.ingredientName}`)
    .join(' • ');
}

/**
 * Obtiene el total de gramos de un plato (suma de todos los ingredientes)
 */
export function getTotalGrams(ingredients: string[]): number {
  let total = 0;
  
  ingredients.forEach(ing => {
    const parsed = parseIngredient(ing);
    if (parsed && parsed.unit === 'g') {
      total += parsed.amount;
    }
  });
  
  return total;
}

/**
 * Obtiene el total de gramos de ingredientes detallados
 */
export function getTotalGramsDetailed(ingredients: MealIngredient[]): number {
  return ingredients.reduce((sum, ing) => sum + ing.amount, 0);
}
