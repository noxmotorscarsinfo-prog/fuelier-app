/**
 * CALCULADOR DE PORCIONES EXACTAS
 * 
 * Este módulo calcula el multiplicador óptimo para que cada comida
 * se ajuste EXACTAMENTE a los macros que faltan en el día.
 * 
 * Sistema secuencial:
 * 1. Desayuno → 25-30% del día
 * 2. Comida → 35% del día  
 * 3. Merienda → 15% del día
 * 4. Cena → Lo que falta para completar el día
 */

import { User, DailyLog, Meal, MealType } from '../types';

interface RemainingMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Distribución ESPERADA de macros por tipo de comida
 */
const MEAL_DISTRIBUTION = {
  breakfast: 0.25,  // 25% del día
  lunch: 0.35,      // 35% del día
  snack: 0.15,      // 15% del día
  dinner: 0.25      // 25% del día
};

/**
 * Calcula los macros que ya se han consumido en el día
 */
function calculateConsumedMacros(currentLog: DailyLog): RemainingMacros {
  const meals = [
    currentLog.breakfast,
    currentLog.lunch,
    currentLog.snack,
    currentLog.dinner
  ].filter(Boolean) as Meal[];

  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Calcula los macros que FALTAN para completar el día
 */
export function calculateRemainingMacrosForDay(
  user: User,
  currentLog: DailyLog
): RemainingMacros {
  const consumed = calculateConsumedMacros(currentLog);
  
  return {
    calories: user.goals.calories - consumed.calories,
    protein: user.goals.protein - consumed.protein,
    carbs: user.goals.carbs - consumed.carbs,
    fat: user.goals.fat - consumed.fat
  };
}

/**
 * Calcula el multiplicador óptimo para ajustar un plato a los macros restantes
 * 
 * Usa un algoritmo de minimización de error para encontrar el multiplicador
 * que mejor se ajusta a TODOS los macros simultáneamente.
 * 
 * @param meal - El plato base
 * @param remaining - Los macros que faltan
 * @returns El multiplicador óptimo (ej: 1.5 = 150% del plato base)
 */
export function calculateOptimalMultiplier(
  meal: Meal,
  remaining: RemainingMacros
): number {
  // Si el plato tiene todos los macros en 0, no se puede escalar
  if (meal.calories === 0 && meal.protein === 0 && meal.carbs === 0 && meal.fat === 0) {
    return 1;
  }

  // Calcular multiplicadores individuales para cada macro
  const multipliers: number[] = [];
  
  if (meal.calories > 0) {
    multipliers.push(remaining.calories / meal.calories);
  }
  
  if (meal.protein > 0) {
    multipliers.push(remaining.protein / meal.protein);
  }
  
  if (meal.carbs > 0) {
    multipliers.push(remaining.carbs / meal.carbs);
  }
  
  if (meal.fat > 0) {
    multipliers.push(remaining.fat / meal.fat);
  }

  // Si no hay multiplicadores válidos, usar 1
  if (multipliers.length === 0) {
    return 1;
  }

  // ESTRATEGIA: Usar el multiplicador que mejor equilibra todos los macros
  // Probamos diferentes multiplicadores y elegimos el que minimiza el error total
  
  const candidates = [
    ...multipliers, // Multiplicadores individuales
    multipliers.reduce((a, b) => a + b, 0) / multipliers.length, // Promedio
    Math.min(...multipliers), // Mínimo (conservador)
    Math.max(...multipliers), // Máximo (agresivo)
  ];

  // Función de error: suma de diferencias cuadráticas normalizadas
  const calculateError = (multiplier: number): number => {
    const resultCalories = meal.calories * multiplier;
    const resultProtein = meal.protein * multiplier;
    const resultCarbs = meal.carbs * multiplier;
    const resultFat = meal.fat * multiplier;

    // Error normalizado por los objetivos (para que todos los macros tengan peso similar)
    const calorieError = remaining.calories > 0 
      ? Math.pow((resultCalories - remaining.calories) / remaining.calories, 2)
      : 0;
    
    const proteinError = remaining.protein > 0
      ? Math.pow((resultProtein - remaining.protein) / remaining.protein, 2)
      : 0;
    
    const carbsError = remaining.carbs > 0
      ? Math.pow((resultCarbs - remaining.carbs) / remaining.carbs, 2)
      : 0;
    
    const fatError = remaining.fat > 0
      ? Math.pow((resultFat - remaining.fat) / remaining.fat, 2)
      : 0;

    return calorieError + proteinError + carbsError + fatError;
  };

  // Encontrar el multiplicador con menor error
  let bestMultiplier = 1;
  let bestError = Infinity;

  for (const candidate of candidates) {
    // Limitar multiplicadores razonables (0.3x a 3x)
    if (candidate < 0.3 || candidate > 3) continue;
    
    const error = calculateError(candidate);
    if (error < bestError) {
      bestError = error;
      bestMultiplier = candidate;
    }
  }

  // Redondear a 2 decimales para evitar valores muy precisos
  return Math.round(bestMultiplier * 100) / 100;
}

/**
 * Calcula el multiplicador óptimo para un plato considerando lo que ya se comió
 * 
 * ESTA ES LA FUNCIÓN PRINCIPAL que se usa en MealSelection
 */
export function calculateExactPortion(
  user: User,
  currentLog: DailyLog,
  meal: Meal,
  mealType: MealType
): number {
  // Calcular cuántas comidas ya se han consumido
  const consumedMealsCount = [
    currentLog.breakfast,
    currentLog.lunch,
    currentLog.snack,
    currentLog.dinner
  ].filter(Boolean).length;
  
  // Si es la primera comida del día, usar la distribución estándar
  if (consumedMealsCount === 0) {
    const targetPercentage = MEAL_DISTRIBUTION[mealType];
    const targetMacros = {
      calories: user.goals.calories * targetPercentage,
      protein: user.goals.protein * targetPercentage,
      carbs: user.goals.carbs * targetPercentage,
      fat: user.goals.fat * targetPercentage
    };
    
    const multiplier = calculateOptimalMultiplier(meal, targetMacros);
    return Math.max(0.5, Math.min(2.5, multiplier)); // Limitar entre 0.5x y 2.5x
  }
  
  // Si ya hay comidas consumidas, calcular lo que falta
  const remaining = calculateRemainingMacrosForDay(user, currentLog);
  
  // Si ya se excedieron los macros, usar porción pequeña
  if (remaining.calories <= 100) {
    return 0.5;
  }
  
  // Contar cuántas comidas faltan (incluyendo esta)
  const mealsLeft = 4 - consumedMealsCount;
  
  // Si es la ÚLTIMA comida del día, dar exactamente lo que falta
  if (mealsLeft === 1) {
    const multiplier = calculateOptimalMultiplier(meal, remaining);
    return Math.max(0.3, Math.min(3, multiplier));
  }
  
  // Si faltan múltiples comidas, dividir lo restante
  const targetForThisMeal = {
    calories: remaining.calories * MEAL_DISTRIBUTION[mealType],
    protein: remaining.protein * MEAL_DISTRIBUTION[mealType],
    carbs: remaining.carbs * MEAL_DISTRIBUTION[mealType],
    fat: remaining.fat * MEAL_DISTRIBUTION[mealType]
  };
  
  const multiplier = calculateOptimalMultiplier(meal, targetForThisMeal);
  return Math.max(0.5, Math.min(2.5, multiplier));
}

/**
 * Aplica el multiplicador a un plato y devuelve los macros resultantes
 */
export function applyMultiplierToMeal(meal: Meal, multiplier: number): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return {
    calories: Math.round(meal.calories * multiplier),
    protein: Math.round(meal.protein * multiplier * 10) / 10,
    carbs: Math.round(meal.carbs * multiplier * 10) / 10,
    fat: Math.round(meal.fat * multiplier * 10) / 10
  };
}

/**
 * Muestra qué tan bien se ajusta un plato a los macros restantes (0-100%)
 */
export function calculateMacroFitScore(
  meal: Meal,
  remaining: RemainingMacros,
  multiplier: number
): number {
  const result = applyMultiplierToMeal(meal, multiplier);
  
  // Calcular error porcentual para cada macro
  const errors: number[] = [];
  
  if (remaining.calories > 0) {
    errors.push(Math.abs(result.calories - remaining.calories) / remaining.calories);
  }
  
  if (remaining.protein > 0) {
    errors.push(Math.abs(result.protein - remaining.protein) / remaining.protein);
  }
  
  if (remaining.carbs > 0) {
    errors.push(Math.abs(result.carbs - remaining.carbs) / remaining.carbs);
  }
  
  if (remaining.fat > 0) {
    errors.push(Math.abs(result.fat - remaining.fat) / remaining.fat);
  }
  
  // Error promedio
  const avgError = errors.length > 0 
    ? errors.reduce((a, b) => a + b, 0) / errors.length
    : 0;
  
  // Convertir a score (100% = perfecto, 0% = muy malo)
  return Math.max(0, Math.min(100, (1 - avgError) * 100));
}
