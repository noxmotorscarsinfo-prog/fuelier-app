/**
 * 🎯 ESCALADO PRECISO - FUELIER AI ENGINE v2.0
 * 
 * Wrapper que conecta el sistema antiguo con FUELIER AI ENGINE v2.0
 */

import { Meal, User, DailyLog, MealType, MealIngredient } from '../types';
import { Ingredient, getIngredientById } from '../../data/ingredientTypes';
import { adaptMealWithAIEngine, MacroTargets } from './fuelierAIEngine';

/**
 * Escala un plato usando FUELIER AI Engine v2.0 (8 módulos con hybrid solver)
 * 
 * NOTA: Esta función necesita User y DailyLog para funcionar correctamente.
 * Si no los tienes, usa el fallback proporcionado.
 */
export function scaleMealToTarget(
  meal: Meal,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  allIngredients: Ingredient[],
  user?: User,
  currentLog?: DailyLog,
  mealType?: MealType
): Meal {
  
  if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
    console.error(`❌ Plato "${meal.name}" no tiene ingredientes`);
    return meal;
  }

  // Convertir ingredientReferences a MealIngredient[] (con macros calculados)
  const mealIngredients: MealIngredient[] = meal.ingredientReferences.map(ref => {
    const ing = getIngredientById(ref.ingredientId, allIngredients);
    if (!ing) {
      console.warn(`⚠️ Ingrediente no encontrado: ${ref.ingredientId}`);
      return {
        ingredientId: ref.ingredientId,
        ingredientName: ref.ingredientId,
        amount: ref.amountInGrams,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    // Calcular macros para esta cantidad específica
    const ratio = ref.amountInGrams / 100; // Los macros de la base son por 100g
    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      amount: ref.amountInGrams,
      calories: (ing.caloriesPer100g || 0) * ratio,
      protein: (ing.proteinPer100g || 0) * ratio,
      carbs: (ing.carbsPer100g || 0) * ratio,
      fat: (ing.fatPer100g || 0) * ratio,
    };
  });

  // FUELIER AI ENGINE v2.0
  const mockUser: User = user || {
    email: 'test@test.com',
    name: 'Test User',
    sex: 'male',
    age: 30,
    weight: 75,
    height: 175,
    goals: {
      calories: targetMacros.calories * 4, // Asumir 4 comidas al día
      protein: targetMacros.protein * 4,
      carbs: targetMacros.carbs * 4,
      fat: targetMacros.fat * 4
    },
    goal: 'maintenance',
    mealsPerDay: 4,
    trainingFrequency: 3,
    metabolicAdaptation: {
      isAdapted: false,
      adaptationLevel: 'none',
      recommendedPhase: 'maintenance'
    },
    preferences: {
      likes: [],
      dislikes: [],
      intolerances: [],
      allergies: []
    },
    isAdmin: false
  };

  const mockLog: DailyLog = currentLog || {
    date: new Date().toISOString().split('T')[0],
    breakfast: null,
    lunch: null,
    snack: null,
    dinner: null
  };

  const macroTargets: MacroTargets = {
    calories: targetMacros.calories,
    protein: targetMacros.protein,
    carbs: targetMacros.carbs,
    fat: targetMacros.fat,
  };

  // Crear meal con MealIngredient[] para el motor
  const mealForEngine: Meal = {
    ...meal,
    ingredients: mealIngredients.map(i => `${i.amount}g ${i.ingredientName}`), // Legacy compatibility
  };

  // IMPORTANTE: Agregar mealIngredients como propiedad temporal para el motor
  (mealForEngine as any).mealIngredients = mealIngredients;

  const result = adaptMealWithAIEngine(mealForEngine, macroTargets, mockUser, mockLog, 100, allIngredients);

  // Convertir resultado de vuelta a ingredientReferences
  const scaledReferences = result.scaledIngredients.map(scaledIng => {
    const originalRef = meal.ingredientReferences!.find(r => r.ingredientId === scaledIng.ingredientId);
    return {
      ingredientId: scaledIng.ingredientId,
      amountInGrams: scaledIng.amount,
      // Mantener metadata original si existe
      ...(originalRef && { name: (originalRef as any).name }),
    };
  });

  return {
    ...meal,
    ingredientReferences: scaledReferences,
    calories: result.achievedMacros.calories,
    protein: result.achievedMacros.protein,
    carbs: result.achievedMacros.carbs,
    fat: result.achievedMacros.fat,
  };
}


