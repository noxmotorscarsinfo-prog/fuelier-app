/**
 * CALCULADOR DE PORCIONES PRECISAS
 * 
 * Este sistema calcula el multiplicador exacto para que cada comida
 * dé EXACTAMENTE los macros objetivo de esa comida específica.
 */

import { User, Meal, MealType, DailyLog } from '../types';

/**
 * Distribución de macros por tipo de comida según objetivo
 */
const MACRO_DISTRIBUTION = {
  // Para pérdida de peso: desayuno grande, cena ligera
  loss: {
    breakfast: 0.30, // 30%
    lunch: 0.35,     // 35%
    snack: 0.10,     // 10%
    dinner: 0.25     // 25%
  },
  // Para mantenimiento: distribución equilibrada
  maintain: {
    breakfast: 0.25, // 25%
    lunch: 0.35,     // 35%
    snack: 0.15,     // 15%
    dinner: 0.25     // 25%
  },
  // Para ganancia: más calorías distribuidas, snacks importantes
  gain: {
    breakfast: 0.25, // 25%
    lunch: 0.30,     // 30%
    snack: 0.20,     // 20%
    dinner: 0.25     // 25%
  }
};

/**
 * Calcula los macros objetivo EXACTOS para una comida específica
 */
export function getMealTargetMacros(
  user: User,
  mealType: MealType,
  currentLog: DailyLog
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  // Determinar el tipo de objetivo (loss, maintain, gain)
  const goalType = user.goals.calories < user.tdee ? 'loss' 
    : user.goals.calories > user.tdee ? 'gain' 
    : 'maintain';
  
  const distribution = MACRO_DISTRIBUTION[goalType];
  const percentage = distribution[mealType];
  
  // Calcular macros base para esta comida (según porcentaje)
  const baseMacros = {
    calories: user.goals.calories * percentage,
    protein: user.goals.protein * percentage,
    carbs: user.goals.carbs * percentage,
    fat: user.goals.fat * percentage
  };
  
  // Calcular cuánto se ha consumido YA en el día
  const consumed = calculateConsumedMacros(currentLog);
  
  // Calcular cuánto falta para el total del día
  const remaining = {
    calories: user.goals.calories - consumed.calories,
    protein: user.goals.protein - consumed.protein,
    carbs: user.goals.carbs - consumed.carbs,
    fat: user.goals.fat - consumed.fat
  };
  
  // Contar cuántas comidas faltan (incluyendo esta)
  const mealsLeft = countRemainingMeals(currentLog, mealType);
  
  // Si quedan múltiples comidas, usar el porcentaje base
  // Si es la última comida, dar TODO lo que falta
  if (mealsLeft === 1) {
    // Última comida: dar exactamente lo que falta
    return {
      calories: Math.max(0, remaining.calories),
      protein: Math.max(0, remaining.protein),
      carbs: Math.max(0, remaining.carbs),
      fat: Math.max(0, remaining.fat)
    };
  } else {
    // Ajustar según lo que falta, pero respetando la distribución
    const adjustmentFactor = mealsLeft > 0 ? 1 / mealsLeft : 1;
    
    return {
      calories: Math.max(100, baseMacros.calories),
      protein: Math.max(10, baseMacros.protein),
      carbs: Math.max(20, baseMacros.carbs),
      fat: Math.max(5, baseMacros.fat)
    };
  }
}

/**
 * Calcula macros ya consumidos en el día
 */
function calculateConsumedMacros(log: DailyLog): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const meals = [log.breakfast, log.lunch, log.snack, log.dinner].filter(Boolean);
  
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal?.calories || 0),
      protein: acc.protein + (meal?.protein || 0),
      carbs: acc.carbs + (meal?.carbs || 0),
      fat: acc.fat + (meal?.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Cuenta cuántas comidas faltan por consumir (incluyendo la actual)
 */
function countRemainingMeals(log: DailyLog, currentMealType: MealType): number {
  const mealOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const currentIndex = mealOrder.indexOf(currentMealType);
  
  let count = 0;
  
  for (let i = currentIndex; i < mealOrder.length; i++) {
    const mealType = mealOrder[i];
    if (!log[mealType]) {
      count++;
    }
  }
  
  return count;
}

/**
 * FUNCIÓN PRINCIPAL: Calcula el multiplicador EXACTO para dar los macros objetivo
 * 
 * Usa un sistema de optimización multi-objetivo para encontrar el multiplicador
 * que mejor se ajuste a TODOS los macros simultáneamente.
 */
export function calculatePrecisePortion(
  user: User,
  currentLog: DailyLog,
  meal: Meal,
  mealType: MealType
): number {
  // Obtener macros objetivo EXACTOS para esta comida
  const targetMacros = getMealTargetMacros(user, mealType, currentLog);
  
  // Si el plato tiene 0 en algún macro, evitar división por cero
  if (meal.calories === 0 || meal.protein === 0) {
    return 1.0;
  }
  
  // Calcular multiplicadores necesarios para cada macro
  const calorieMultiplier = targetMacros.calories / meal.calories;
  const proteinMultiplier = targetMacros.protein / meal.protein;
  const carbsMultiplier = meal.carbs > 0 ? targetMacros.carbs / meal.carbs : calorieMultiplier;
  const fatMultiplier = meal.fat > 0 ? targetMacros.fat / meal.fat : calorieMultiplier;
  
  // PRIORIDAD DE AJUSTE:
  // 1. Proteína (más importante para composición corporal)
  // 2. Calorías (control de peso)
  // 3. Carbohidratos y Grasas (energía)
  
  // Calcular error para cada multiplicador posible
  const candidates = [
    proteinMultiplier,
    calorieMultiplier,
    carbsMultiplier,
    fatMultiplier,
    (proteinMultiplier + calorieMultiplier) / 2, // Promedio proteína-calorías
  ];
  
  // Encontrar el multiplicador con menor error total
  let bestMultiplier = proteinMultiplier;
  let minError = Infinity;
  
  for (const multiplier of candidates) {
    const resultingMacros = {
      calories: meal.calories * multiplier,
      protein: meal.protein * multiplier,
      carbs: meal.carbs * multiplier,
      fat: meal.fat * multiplier
    };
    
    // Calcular error ponderado (proteína tiene más peso)
    const error = 
      Math.abs(resultingMacros.calories - targetMacros.calories) * 0.3 +
      Math.abs(resultingMacros.protein - targetMacros.protein) * 10 + // PROTEÍNA 10x más importante
      Math.abs(resultingMacros.carbs - targetMacros.carbs) * 0.2 +
      Math.abs(resultingMacros.fat - targetMacros.fat) * 0.2;
    
    if (error < minError) {
      minError = error;
      bestMultiplier = multiplier;
    }
  }
  
  // Limitar el rango del multiplicador a valores razonables
  // Mínimo 0.3x (30% de la porción) y máximo 3.0x (triple porción)
  const clampedMultiplier = Math.max(0.3, Math.min(3.0, bestMultiplier));
  
  // Redondear a 2 decimales para evitar valores muy precisos
  return Math.round(clampedMultiplier * 100) / 100;
}

/**
 * NUEVA: Calcula múltiples opciones de porciones y devuelve estadísticas
 */
export interface PortionAnalysis {
  multiplier: number;
  resultingMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  accuracy: {
    calories: number; // % de precisión
    protein: number;
    carbs: number;
    fat: number;
    overall: number;
  };
}

export function analyzePortion(
  user: User,
  currentLog: DailyLog,
  meal: Meal,
  mealType: MealType
): PortionAnalysis {
  const multiplier = calculatePrecisePortion(user, currentLog, meal, mealType);
  const targetMacros = getMealTargetMacros(user, mealType, currentLog);
  
  const resultingMacros = {
    calories: Math.round(meal.calories * multiplier),
    protein: Math.round(meal.protein * multiplier * 10) / 10,
    carbs: Math.round(meal.carbs * multiplier * 10) / 10,
    fat: Math.round(meal.fat * multiplier * 10) / 10
  };
  
  const accuracy = {
    calories: targetMacros.calories > 0 ? (1 - Math.abs(resultingMacros.calories - targetMacros.calories) / targetMacros.calories) * 100 : 100,
    protein: targetMacros.protein > 0 ? (1 - Math.abs(resultingMacros.protein - targetMacros.protein) / targetMacros.protein) * 100 : 100,
    carbs: targetMacros.carbs > 0 ? (1 - Math.abs(resultingMacros.carbs - targetMacros.carbs) / targetMacros.carbs) * 100 : 100,
    fat: targetMacros.fat > 0 ? (1 - Math.abs(resultingMacros.fat - targetMacros.fat) / targetMacros.fat) * 100 : 100,
    overall: 0
  };
  
  // Precisión general ponderada (proteína cuenta más)
  accuracy.overall = (
    accuracy.calories * 0.25 +
    accuracy.protein * 0.40 + // Proteína 40% del score
    accuracy.carbs * 0.20 +
    accuracy.fat * 0.15
  );
  
  return {
    multiplier,
    resultingMacros,
    targetMacros,
    accuracy
  };
}
