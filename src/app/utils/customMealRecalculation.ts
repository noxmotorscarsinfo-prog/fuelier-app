/**
 * UTILIDADES PARA PLATOS PERSONALIZADOS RECALCULABLES
 * 
 * Permite al usuario:
 * 1. Crear platos que se ajusten automáticamente
 * 2. Recalcular platos existentes para el día actual
 * 3. Mantener proporciones originales pero escalar cantidades
 */

import type { Meal, User, DailyLog, CustomMealSettings } from '../types';
import { Ingredient } from '../../data/ingredientTypes';
import { adaptMealWithAIEngine } from './fuelierAIEngine';
import { calculateIntelligentTarget } from './automaticTargetCalculator';

/**
 * Recalcula un plato personalizado para que se ajuste a los macros objetivo del día
 */
export function recalculateCustomMealForToday(
  meal: Meal,
  user: User,
  currentLog: DailyLog,
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner',
  allIngredients: Ingredient[]
): Meal {
  
  console.log(`🔄 Recalculando plato personalizado: ${meal.name} para ${mealType}`);
  
  // 1. Calcular macros objetivo para este tipo de comida
  const dailyTarget = calculateIntelligentTarget(user, currentLog, mealType as any);
  
  // Distribución típica por comida (puede personalizarse)
  const mealDistribution = {
    breakfast: 0.25,
    lunch: 0.35,
    snack: 0.15,
    dinner: 0.25
  };
  
  const targetForMeal = {
    calories: dailyTarget.calories * mealDistribution[mealType],
    protein: dailyTarget.protein * mealDistribution[mealType],
    carbs: dailyTarget.carbs * mealDistribution[mealType],
    fat: dailyTarget.fat * mealDistribution[mealType]
  };
  
  console.log(`🎯 Target para ${mealType}:`, targetForMeal);
  
  // 2. Si no tiene ingredientes detallados, no se puede recalcular
  if (!meal.detailedIngredients || meal.detailedIngredients.length === 0) {
    console.log('⚠️ Plato sin ingredientes detallados, no se puede recalcular');
    return meal;
  }
  
  // 3. Usar FUELIER AI Engine v2.0 para recalcular
  // Necesitamos agregar mealIngredients temporalmente al meal para el AI Engine
  const mealWithIngredients = {
    ...meal,
    mealIngredients: meal.detailedIngredients
  };
  
  const hybridSolution = adaptMealWithAIEngine(
    mealWithIngredients,
    targetForMeal,
    user,
    currentLog,
    100, // maxIterations
    allIngredients
  );
  
  // Extraer el meal escalado del resultado - construir desde scaledIngredients
  const scaledIngredients = hybridSolution.scaledIngredients;
  const achievedMacros = hybridSolution.achievedMacros;
  
  const recalculatedMeal: Meal = {
    ...meal,
    calories: achievedMacros.calories,
    protein: achievedMacros.protein,
    carbs: achievedMacros.carbs,
    fat: achievedMacros.fat,
    detailedIngredients: scaledIngredients,
    portionMultiplier: 1.0, // Reset multiplier after recalculation
  };
  
  // 4. Preservar metadatos del plato original
  const finalMeal: Meal = {
    ...recalculatedMeal,
    id: meal.id,
    name: `${meal.name} (Ajustado para hoy)`,
    isCustom: true,
    createdBy: meal.createdBy,
    description: meal.description,
    preparationSteps: meal.preparationSteps,
    tips: meal.tips,
    customMealSettings: {
      allowRecalculation: meal.customMealSettings?.allowRecalculation ?? true,
      preferredPortion: meal.customMealSettings?.preferredPortion ?? 1.0,
      lastRecalculated: new Date().toISOString(),
      macroTarget: 'match_meal'
    }
  };
  
  console.log(`✅ Plato recalculado exitosamente`);
  console.log(`📊 Macros ajustados: ${finalMeal.calories}kcal | ${finalMeal.protein}P | ${finalMeal.carbs}C | ${finalMeal.fat}G`);
  
  return finalMeal;
}

/**
 * Crea un plato personalizado con opciones de recálculo
 */
export function createRecalculableCustomMeal(
  baseMeal: Omit<Meal, 'customMealSettings'>,
  settings: Partial<CustomMealSettings> = {}
): Meal {
  
  const defaultSettings: CustomMealSettings = {
    allowRecalculation: true,
    preferredPortion: 1.0,
    macroTarget: 'match_meal',
    lastRecalculated: undefined
  };
  
  return {
    ...baseMeal,
    customMealSettings: { ...defaultSettings, ...settings }
  };
}

/**
 * Verifica si un plato puede ser recalculado
 */
export function canMealBeRecalculated(meal: Meal): boolean {
  return !!(
    meal.isCustom &&
    meal.customMealSettings?.allowRecalculation &&
    meal.detailedIngredients &&
    meal.detailedIngredients.length > 0
  );
}

/**
 * Obtiene la última fecha de recálculo de un plato
 */
export function getLastRecalculationDate(meal: Meal): Date | null {
  const dateStr = meal.customMealSettings?.lastRecalculated;
  return dateStr ? new Date(dateStr) : null;
}

/**
 * Verifica si un plato necesita ser recalculado (más de 1 día desde el último)
 */
export function needsRecalculation(meal: Meal): boolean {
  const lastRecalc = getLastRecalculationDate(meal);
  if (!lastRecalc) return true;
  
  const now = new Date();
  const diffHours = (now.getTime() - lastRecalc.getTime()) / (1000 * 60 * 60);
  
  return diffHours > 24; // Recalcular si han pasado más de 24 horas
}

/**
 * Escala un plato personalizado manteniendo las proporciones originales
 */
export function scaleCustomMealProportionally(
  meal: Meal,
  targetCalories: number
): Meal {
  
  const currentCalories = meal.calories;
  const scaleFactor = targetCalories / currentCalories;
  
  console.log(`📏 Escalando plato proporcionalmente: factor ${scaleFactor.toFixed(2)}`);
  
  const scaledMeal: Meal = {
    ...meal,
    calories: meal.calories * scaleFactor,
    protein: meal.protein * scaleFactor,
    carbs: meal.carbs * scaleFactor,
    fat: meal.fat * scaleFactor,
    
    detailedIngredients: meal.detailedIngredients?.map(ing => ({
      ...ing,
      amount: ing.amount * scaleFactor,
      calories: ing.calories * scaleFactor,
      protein: ing.protein * scaleFactor,
      carbs: ing.carbs * scaleFactor,
      fat: ing.fat * scaleFactor
    })),
    
    portionMultiplier: (meal.portionMultiplier || 1) * scaleFactor,
    
    customMealSettings: {
      allowRecalculation: meal.customMealSettings?.allowRecalculation ?? true,
      preferredPortion: scaleFactor,
      macroTarget: meal.customMealSettings?.macroTarget ?? 'keep_original',
      lastRecalculated: new Date().toISOString()
    }
  };
  
  return scaledMeal;
}