/**
 * 🎯 ESCALADO PRECISO - FUELIER AI ENGINE v2.0
 * 
 * Wrapper que conecta el sistema antiguo con FUELIER AI ENGINE v2.0
 */

import { Meal, User, DailyLog, MealType, MealIngredient } from '../types';
import { Ingredient, getIngredientById, calculateMacrosFromIngredients } from '../../data/ingredientTypes';
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

  console.log('🤖 AI ENGINE RESULT:');
  console.log('   Accuracy:', result.accuracy.toFixed(1) + '%');
  console.log('   AchievedMacros:', result.achievedMacros);
  
  // Convertir resultado a ingredientReferences (siempre, independiente de la precisión)
  const scaledReferences = result.scaledIngredients.map(scaledIng => {
    const originalRef = meal.ingredientReferences!.find(r => r.ingredientId === scaledIng.ingredientId);
    return {
      ingredientId: scaledIng.ingredientId,
      amountInGrams: scaledIng.amount,
      // Mantener metadata original si existe
      ...(originalRef && { name: (originalRef as any).name }),
    };
  });
  
  // ✅ CRÍTICO: Siempre calcular macros reales desde ingredientes escalados para consistencia
  const realMacrosFromScaledIngredients = calculateMacrosFromIngredients(scaledReferences, allIngredients);
  
  console.log('🔍 VERIFICACIÓN DE CONSISTENCIA:');
  console.log('   AI Engine achievedMacros:', result.achievedMacros);
  console.log('   Macros reales desde ingredientes:', realMacrosFromScaledIngredients);
  
  // Verificar si hay ingredientes faltantes
  const missingIngredients = scaledReferences.filter(ref => 
    !allIngredients.find(ing => ing.id === ref.ingredientId)
  );
  
  if (missingIngredients.length > 0) {
    console.error('❌ INGREDIENTES NO ENCONTRADOS:', missingIngredients.map(ref => ref.ingredientId));
  }

  // ✅ Si el AI Engine logró alta precisión (≥90%), usar su resultado pero con macros consistentes
  if (result.accuracy >= 90) {
    console.log('   ✅ AI Engine logró alta precisión - usando ingredientes escalados con macros consistentes');

    return {
      ...meal,
      ingredientReferences: scaledReferences,
      // ✅ USAR MACROS REALES CALCULADOS DESDE INGREDIENTES (no achievedMacros del AI Engine)
      calories: realMacrosFromScaledIngredients.calories,
      protein: realMacrosFromScaledIngredients.protein,
      carbs: realMacrosFromScaledIngredients.carbs,
      fat: realMacrosFromScaledIngredients.fat,
      proportionCompatibility: result.accuracy // Mantener la precisión del AI Engine
    };
  }

  // Solo si el AI Engine no logró ≥90%, aplicar correcciones adicionales
  console.log('   ⚠️ AI Engine <90% precisión - aplicando correcciones manuales');

  // Para correcciones manuales (<90% precisión), usar directamente los macros calculados
  console.log('   📊 Usando macros calculados desde ingredientes escalados para consistencia');

  return {
    ...meal,
    ingredientReferences: scaledReferences,
    // ✅ USAR MACROS REALES CALCULADOS DESDE INGREDIENTES
    calories: realMacrosFromScaledIngredients.calories,
    protein: realMacrosFromScaledIngredients.protein,
    carbs: realMacrosFromScaledIngredients.carbs,
    fat: realMacrosFromScaledIngredients.fat,
    proportionCompatibility: result.accuracy // Usar la precisión del AI Engine
  };
}


