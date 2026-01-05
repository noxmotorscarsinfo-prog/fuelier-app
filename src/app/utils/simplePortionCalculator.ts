/**
 * CALCULADORA SIMPLE Y PRECISA DE PORCIONES
 * 
 * LÓGICA CLARA:
 * 1. Calcular cuánto FALTA para completar los objetivos del día
 * 2. Calcular cuánto debería aportar ESTA comida (según distribución y mealsPerDay)
 * 3. Calcular la porción necesaria balanceando TODOS los macros (no solo calorías)
 * 
 * SIN complejidad innecesaria, SIN ajustes mágicos, SOLO matemáticas claras
 */

import { User, DailyLog, Meal, MealType } from '../types';
import { getMealGoals } from './mealDistribution';

/**
 * PASO 1: Calcular cuántas calorías y macros DEBERÍA tener esta comida
 * USA getMealGoals que respeta mealsPerDay y distribución personalizada
 */
export function getMealTarget(user: User, mealType: MealType): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  // Usar la función getMealGoals que respeta mealsPerDay y distribución correcta
  return getMealGoals(user, mealType);
}

/**
 * PASO 2: Calcular cuánto se ha consumido HOY en total
 */
export function getTodayTotal(currentLog: DailyLog): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const total = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
  
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  
  mealTypes.forEach(type => {
    const meal = currentLog[type];
    if (meal) {
      total.calories += meal.calories;
      total.protein += meal.protein;
      total.carbs += meal.carbs;
      total.fat += meal.fat;
    }
  });
  
  // Agregar comidas complementarias si existen
  if (currentLog.complementaryMeals && currentLog.complementaryMeals.length > 0) {
    currentLog.complementaryMeals.forEach(meal => {
      total.calories += meal.calories;
      total.protein += meal.protein;
      total.carbs += meal.carbs;
      total.fat += meal.fat;
    });
  }
  
  return total;
}

/**
 * PASO 3: Calcular cuánto FALTA para completar el día
 */
export function getRemainingForDay(user: User, currentLog: DailyLog): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const total = getTodayTotal(currentLog);
  
  return {
    calories: user.goals.calories - total.calories,
    protein: user.goals.protein - total.protein,
    carbs: user.goals.carbs - total.carbs,
    fat: user.goals.fat - total.fat
  };
}

/**
 * PASO 4: Calcular la porción óptima para ESTA comida
 * 
 * ESTRATEGIA DEFINITIVA V5: OPTIMIZACIÓN INTELIGENTE
 * - Probar diferentes porciones (0.5x a 2.0x en incrementos de 0.05)
 * - Calcular el "error total" para cada porción
 * - Penalizar MÁS los excesos (x3) que los déficits (x1)
 * - Elegir la porción que MINIMIZA el error total
 * - Esto balancea mejor sin pasarse mucho de ningún macro
 */
export function calculateSimplePortion(
  user: User,
  currentLog: DailyLog,
  meal: Meal,
  mealType: MealType
): number {
  // 1. Usar getMealGoals que respeta mealsPerDay y distribución personalizada
  const target = getMealGoals(user, mealType);
  
  // 2. Si la comida no está activa (target es 0), devolver porción mínima
  if (target.calories === 0) return 0.5;
  
  // 3. Evitar división por cero
  if (meal.calories === 0) return 1;
  
  // 4. Rango de porciones a probar
  const MIN_PORTION = 0.5;
  const MAX_PORTION = 2.0;
  const STEP = 0.05;
  
  let bestPortion = 1.0;
  let minError = Infinity;
  
  // 5. Probar cada porción posible
  for (let portion = MIN_PORTION; portion <= MAX_PORTION; portion += STEP) {
    // Calcular macros obtenidos con esta porción
    const obtainedCalories = meal.calories * portion;
    const obtainedProtein = meal.protein * portion;
    const obtainedCarbs = meal.carbs * portion;
    const obtainedFat = meal.fat * portion;
    
    // Calcular errores individuales
    const caloriesError = obtainedCalories - target.calories;
    const proteinError = obtainedProtein - target.protein;
    const carbsError = obtainedCarbs - target.carbs;
    const fatError = obtainedFat - target.fat;
    
    // Penalizar MUCHO MÁS los excesos (x3) que los déficits (x1)
    const caloriesPenalty = caloriesError > 0 ? Math.abs(caloriesError) * 3 : Math.abs(caloriesError) * 1;
    const proteinPenalty = proteinError > 0 ? Math.abs(proteinError) * 3 : Math.abs(proteinError) * 1;
    const carbsPenalty = carbsError > 0 ? Math.abs(carbsError) * 3 : Math.abs(carbsError) * 1;
    const fatPenalty = fatError > 0 ? Math.abs(fatError) * 3 : Math.abs(fatError) * 1;
    
    // Error total (normalizar para que todos los macros tengan peso similar)
    // Evitar división por cero
    const totalError = 
      (target.calories > 0 ? caloriesPenalty / target.calories : 0) +
      (target.protein > 0 ? proteinPenalty / target.protein : 0) +
      (target.carbs > 0 ? carbsPenalty / target.carbs : 0) +
      (target.fat > 0 ? fatPenalty / target.fat : 0);
    
    // Si este error es menor, actualizar mejor porción
    if (totalError < minError) {
      minError = totalError;
      bestPortion = portion;
    }
  }
  
  // 6. Redondear a 0.05 para mayor precisión
  bestPortion = Math.round(bestPortion * 20) / 20;
  
  return bestPortion;
}

/**
 * PASO 5: Obtener mensaje de progreso del día
 */
export function getDayProgressMessage(user: User, currentLog: DailyLog): {
  message: string;
  type: 'success' | 'warning' | 'info' | 'danger';
} {
  const total = getTodayTotal(currentLog);
  const remaining = getRemainingForDay(user, currentLog);
  
  const caloriesPercent = (total.calories / user.goals.calories) * 100;
  
  // Calcular cuántas comidas se han registrado
  const mealsLogged = [
    currentLog.breakfast,
    currentLog.lunch,
    currentLog.snack,
    currentLog.dinner
  ].filter(m => m !== null).length;
  
  // SOBREPASADO (>110%)
  if (caloriesPercent > 110) {
    return {
      message: `⚠️ Has superado tus objetivos en ${Math.round(caloriesPercent - 100)}%. Considera reducir las próximas comidas.`,
      type: 'danger'
    };
  }
  
  // MUY CERCA (95-110%)
  if (caloriesPercent >= 95) {
    return {
      message: `🎯 ¡Perfecto! Has completado el ${Math.round(caloriesPercent)}% de tus objetivos.`,
      type: 'success'
    };
  }
  
  // EN PROGRESO (50-95%)
  if (caloriesPercent >= 50) {
    return {
      message: `📊 Llevas ${Math.round(caloriesPercent)}% del día. Te faltan ${Math.round(remaining.calories)} kcal.`,
      type: 'info'
    };
  }
  
  // INICIO DEL DÍA (<50%)
  return {
    message: `🌅 Has consumido ${Math.round(caloriesPercent)}% del día. Te quedan ${Math.round(remaining.calories)} kcal.`,
    type: 'info'
  };
}

/**
 * PASO 6: Verificar si se DEBE mostrar recomendaciones de comidas complementarias
 */
export function shouldShowComplementRecommendations(
  user: User,
  currentLog: DailyLog
): boolean {
  const total = getTodayTotal(currentLog);
  const caloriesPercent = (total.calories / user.goals.calories) * 100;
  
  // Solo mostrar si está MUY lejos del objetivo (< 70%)
  const mealsLogged = [
    currentLog.breakfast,
    currentLog.lunch,
    currentLog.snack,
    currentLog.dinner
  ].filter(m => m !== null).length;
  
  // Si ya tiene 4 comidas y está por debajo del 70%, sugerir complementos
  return mealsLogged >= 3 && caloriesPercent < 70;
}