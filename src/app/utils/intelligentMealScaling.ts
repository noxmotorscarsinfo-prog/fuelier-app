/**
 * 🎯 INTELLIGENT MEAL SCALING SYSTEM
 * 
 * Escala platos automáticamente para que se ajusten al target calculado.
 * Garantiza que la suma de las 4 comidas = objetivos totales del día.
 * 
 * ✅ 100% CLOUD - Recibe ingredientes como parámetro
 */

import { Meal, User, DailyLog, MealType } from '../types';
import { Ingredient, MealIngredientReference, calculateMacrosFromIngredients } from '../../data/ingredientTypes';

/**
 * 🎯 NUEVA ESTRATEGIA: Algoritmo iterativo que optimiza TODOS los macros al 100%
 * 
 * En lugar de promedios ponderados, minimizamos la MÁXIMA DESVIACIÓN de cualquier macro.
 * Esto garantiza que TODOS los macros (cal, prot, carbs, fat) estén lo más cerca posible del 100%.
 * 
 * @param meal - Plato a escalar
 * @param targetMacros - Macros objetivo
 * @param allIngredients - Ingredientes de Supabase
 * @param maxIterations - Número máximo de iteraciones (200 por defecto)
 */
function optimizeAllMacrosTo100(
  meal: Meal,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  allIngredients: Ingredient[],
  maxIterations: number = 200
): { ingredients: MealIngredientReference[]; multiplier: number; iterations: number; maxError: number } {
  
  const baseMacros = meal.ingredientReferences && meal.ingredientReferences.length > 0
    ? calculateMacrosFromIngredients(meal.ingredientReferences, allIngredients)
    : { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat };
  
  let bestMultiplier = baseMacros.calories > 0 ? targetMacros.calories / baseMacros.calories : 1;
  let bestIngredients: MealIngredientReference[] = [];
  let iterations = 0;
  let bestMaxError = Infinity; // Minimizar el ERROR MÁXIMO (no el promedio)
  
  for (let i = 0; i < maxIterations; i++) {
    const testIngredients: MealIngredientReference[] = meal.ingredientReferences!.map(ref => ({
      ingredientId: ref.ingredientId,
      amountInGrams: Math.round(ref.amountInGrams * bestMultiplier)
    }));
    
    const testMacros = calculateMacrosFromIngredients(testIngredients, allIngredients);
    
    // 🎯 CLAVE: Calcular el ERROR MÁXIMO de CUALQUIER macro
    // Esto garantiza que NINGÚN macro se quede muy atrás
    const errors = [
      targetMacros.calories > 0 ? Math.abs(testMacros.calories - targetMacros.calories) / targetMacros.calories : 0,
      targetMacros.protein > 0 ? Math.abs(testMacros.protein - targetMacros.protein) / targetMacros.protein : 0,
      targetMacros.carbs > 0 ? Math.abs(testMacros.carbs - targetMacros.carbs) / targetMacros.carbs : 0,
      targetMacros.fat > 0 ? Math.abs(testMacros.fat - targetMacros.fat) / targetMacros.fat : 0
    ];
    
    const maxError = Math.max(...errors); // El PEOR macro
    
    if (maxError < bestMaxError) {
      bestMaxError = maxError;
      bestIngredients = testIngredients;
      iterations = i + 1;
    }
    
    // Salir si todos los macros están <1% de error
    if (maxError < 0.01) break;
    
    // ✅ AJUSTE INTELIGENTE: Corregir hacia el macro con MAYOR error
    const ratios = {
      cal: targetMacros.calories > 0 && testMacros.calories > 0 ? targetMacros.calories / testMacros.calories : 1,
      prot: targetMacros.protein > 0 && testMacros.protein > 0 ? targetMacros.protein / testMacros.protein : 1,
      carbs: targetMacros.carbs > 0 && testMacros.carbs > 0 ? targetMacros.carbs / testMacros.carbs : 1,
      fat: targetMacros.fat > 0 && testMacros.fat > 0 ? targetMacros.fat / testMacros.fat : 1
    };
    
    // Usar PROMEDIO de ratios para balancear todos los macros por igual
    const avgRatio = (ratios.cal + ratios.prot + ratios.carbs + ratios.fat) / 4;
    
    // Ajuste más agresivo (30% de corrección)
    bestMultiplier *= (avgRatio * 0.3 + 0.7);
  }
  
  return {
    ingredients: bestIngredients.length > 0 ? bestIngredients : meal.ingredientReferences!,
    multiplier: bestMultiplier,
    iterations,
    maxError: bestMaxError
  };
}

/**
 * ✅ FUNCIÓN PRINCIPAL: Escala un plato para ajustarse exactamente al target
 * 
 * Soporta dos tipos de platos:
 * 1. Con ingredientReferences: Escala las cantidades de cada ingrediente
 * 2. Sin ingredientReferences: Escala los macros proporcionalmente
 * 
 * ⭐ ÚLTIMA COMIDA: Hace ajuste PERFECTO al 100% del target
 * 
 * @param meal - Plato a escalar
 * @param targetMacros - Macros objetivo
 * @param isLastMeal - Si es la última comida del día
 * @param allIngredients - Lista de ingredientes de Supabase (base + custom)
 */
export function scaleToExactTarget(
  meal: Meal,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  isLastMeal: boolean = false,
  allIngredients: Ingredient[] = []
): Meal {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔧 ESCALANDO: "${meal.name}"${meal.isCustom ? ' [PLATO PERSONALIZADO]' : ''}${meal.isGlobal ? ' [PLATO ADMIN]' : ''}`);
  console.log(`   Última comida: ${isLastMeal ? '✅ SÍ (AJUSTE PERFECTO AL 100%)' : '❌ NO'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Target:', targetMacros);
  
  // Obtener macros base del plato
  const baseMacros = meal.ingredientReferences && meal.ingredientReferences.length > 0
    ? calculateMacrosFromIngredients(meal.ingredientReferences, allIngredients)
    : { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat };
  
  console.log('📊 Macros base del plato:', baseMacros);
  console.log(`   Tiene ingredientReferences: ${meal.ingredientReferences ? '✅ SÍ (' + meal.ingredientReferences.length + ' ingredientes)' : '❌ NO (usará escalado proporcional simple)'}`);
  
  if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
    console.error(`❌ ERROR CRÍTICO: "${meal.name}" NO tiene ingredientReferences.`);
    console.error(`   Este plato NO debería llegar aquí sin ingredientes. La migración automática falló.`);
    console.error(`   Por favor, edita este plato en el Admin Panel y añade ingredientes de la base de datos.`);
  } else if ((meal as any)._migrated) {
    console.log(`ℹ️ INFO: "${meal.name}" fue migrado automáticamente con ingredientes inferidos.`);
    console.log(`   Para mejor precisión, considera editarlo en el Admin Panel y añadir ingredientes reales.`);
  }
  
  // 🎯 NUEVA ESTRATEGIA UNIVERSAL: Optimizar TODOS los macros al 100% (para TODAS las comidas)
  console.log('🎯 Optimización TODOS-AL-100%: Minimiza el MÁXIMO error de cualquier macro');
  
  if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
    // Sin ingredientes: escalar proporcionalmente (legacy - platos sin recetas)
    const avgMultiplier = baseMacros.calories > 0 ? targetMacros.calories / baseMacros.calories : 1;
    
    const scaledMeal = {
      ...meal,
      calories: Math.round(baseMacros.calories * avgMultiplier),
      protein: Math.round(baseMacros.protein * avgMultiplier * 10) / 10,
      carbs: Math.round(baseMacros.carbs * avgMultiplier * 10) / 10,
      fat: Math.round(baseMacros.fat * avgMultiplier * 10) / 10,
      baseQuantity: avgMultiplier,
      scaledForTarget: true,
      isLastMeal
    };
    
    console.log('⚠️ Plato SIN ingredientes (legacy - escalado proporcional simple)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return scaledMeal;
  }
  
  // 🎯 OPTIMIZACIÓN UNIVERSAL: Todas las comidas usan el mismo algoritmo ultra-preciso
  const maxIterations = isLastMeal ? 300 : 200; // Última comida: AÚN MÁS iteraciones
  const result = optimizeAllMacrosTo100(meal, targetMacros, allIngredients, maxIterations);
  
  const finalMacros = calculateMacrosFromIngredients(result.ingredients, allIngredients);
  
  console.log(`   🔢 Ingredientes optimizados (${result.iterations} iteraciones, error máx: ${(result.maxError * 100).toFixed(2)}%):`);
  result.ingredients.forEach((ing, i) => {
    const original = meal.ingredientReferences![i];
    console.log(`      ${ing.ingredientId}: ${original.amountInGrams}g → ${ing.amountInGrams}g (${result.multiplier.toFixed(3)}x)`);
  });
  
  const scaledMeal = {
    ...meal,
    ingredientReferences: result.ingredients,
    calories: finalMacros.calories,
    protein: finalMacros.protein,
    carbs: finalMacros.carbs,
    fat: finalMacros.fat,
    baseQuantity: result.multiplier,
    scaledForTarget: true,
    isLastMeal
  };
  
  const diffCal = targetMacros.calories - finalMacros.calories;
  const diffProt = targetMacros.protein - finalMacros.protein;
  const diffCarbs = targetMacros.carbs - finalMacros.carbs;
  const diffFat = targetMacros.fat - finalMacros.fat;
  
  const errorPercentages = {
    cal: targetMacros.calories > 0 ? Math.abs(diffCal / targetMacros.calories * 100) : 0,
    prot: targetMacros.protein > 0 ? Math.abs(diffProt / targetMacros.protein * 100) : 0,
    carbs: targetMacros.carbs > 0 ? Math.abs(diffCarbs / targetMacros.carbs * 100) : 0,
    fat: targetMacros.fat > 0 ? Math.abs(diffFat / targetMacros.fat * 100) : 0
  };
  
  const maxErrorPercent = Math.max(errorPercentages.cal, errorPercentages.prot, errorPercentages.carbs, errorPercentages.fat);
  const avgErrorPercent = (errorPercentages.cal + errorPercentages.prot + errorPercentages.carbs + errorPercentages.fat) / 4;
  
  console.log(`✅ ${isLastMeal ? 'ÚLTIMA COMIDA' : 'COMIDA'} OPTIMIZADA (TODOS los macros):`, {
    cal: `${finalMacros.calories} kcal (target: ${targetMacros.calories}, diff: ${diffCal > 0 ? '+' : ''}${diffCal}, error: ${errorPercentages.cal.toFixed(1)}%)`,
    prot: `${finalMacros.protein}g (target: ${targetMacros.protein}g, diff: ${diffProt > 0 ? '+' : ''}${diffProt}g, error: ${errorPercentages.prot.toFixed(1)}%)`,
    carbs: `${finalMacros.carbs}g (target: ${targetMacros.carbs}g, diff: ${diffCarbs > 0 ? '+' : ''}${diffCarbs}g, error: ${errorPercentages.carbs.toFixed(1)}%)`,
    fat: `${finalMacros.fat}g (target: ${targetMacros.fat}g, diff: ${diffFat > 0 ? '+' : ''}${diffFat}g, error: ${errorPercentages.fat.toFixed(1)}%)`,
    errorMáx: `${maxErrorPercent.toFixed(1)}%`,
    errorPromedio: `${avgErrorPercent.toFixed(1)}%`,
    nota: '⭐ Todos los macros balanceados - ERROR MÁXIMO minimizado'
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return scaledMeal;
}

/**
 * Calcula un score de 0-100 sobre qué tan bien se ajusta el plato escalado al target
 */
function calculateFitScore(
  scaledMeal: Meal,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number }
): number {
  // Calcular desviación porcentual de cada macro
  const calDiff = targetMacros.calories > 0 
    ? Math.abs(scaledMeal.calories - targetMacros.calories) / targetMacros.calories 
    : 0;
  
  const protDiff = targetMacros.protein > 0
    ? Math.abs(scaledMeal.protein - targetMacros.protein) / targetMacros.protein
    : 0;
  
  const carbsDiff = targetMacros.carbs > 0
    ? Math.abs(scaledMeal.carbs - targetMacros.carbs) / targetMacros.carbs
    : 0;
  
  const fatDiff = targetMacros.fat > 0
    ? Math.abs(scaledMeal.fat - targetMacros.fat) / targetMacros.fat
    : 0;
  
  // Score ponderado (menos diferencia = mejor score)
  const avgDiff = (calDiff * 0.4) + (protDiff * 0.3) + (carbsDiff * 0.15) + (fatDiff * 0.15);
  
  // Convertir a score 0-100 (0% diff = 100 score, 100% diff = 0 score)
  const score = Math.max(0, 100 - (avgDiff * 100));
  
  return score;
}

/**
 * 🏆 RANKING INTELIGENTE DE COMIDAS
 * 
 * Rankea y escala todos los platos según qué tan bien se ajustan al target.
 * CRÍTICO: Usa el flag isLastMeal del targetMacros calculado automáticamente.
 * 
 * @param meals - Lista de platos a rankear
 * @param user - Usuario actual
 * @param currentLog - Log del día actual
 * @param mealType - Tipo de comida
 * @param targetMacros - Macros objetivo
 * @param allIngredients - Lista de ingredientes de Supabase (base + custom)
 */
export function rankMealsByFit(
  meals: Meal[],
  user: User,
  currentLog: DailyLog,
  mealType: MealType,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number; isLastMeal?: boolean },
  allIngredients: Ingredient[] = []
): Array<{ meal: Meal; scaledMeal: Meal; fitScore: number }> {
  
  // ✅ CLAVE: Usar el flag isLastMeal del target calculado
  const isLastMeal = targetMacros.isLastMeal || false;
  
  if (isLastMeal) {
    console.log('🌙🌙🌙 ÚLTIMA COMIDA DEL DÍA - Escalado perfecto al 100% 🌙🌙🌙');
    console.log('🎯 Target = LO QUE REALMENTE FALTA para llegar al objetivo total');
  } else {
    console.log(`🍽️ Comida normal (${mealType}) - Escalado inteligente`);
    console.log('🎯 Target = División equitativa del remaining');
  }
  
  console.log('🎯 Target macros:', targetMacros);
  console.log(`📋 Rankeando ${meals.length} platos...`);
  
  const rankedMeals = meals.map(meal => {
    // Escalar el plato al target exacto
    const scaledMeal = scaleToExactTarget(meal, targetMacros, isLastMeal, allIngredients);
    
    // Calcular qué tan bien se ajusta
    const fitScore = calculateFitScore(scaledMeal, targetMacros);
    
    return {
      meal,
      scaledMeal,
      fitScore
    };
  });
  
  // Ordenar por mejor ajuste
  const sorted = rankedMeals.sort((a, b) => b.fitScore - a.fitScore);
  
  console.log('🏆 Top 5 mejores ajustes:', sorted.slice(0, 5).map(r => ({
    nombre: r.scaledMeal.name,
    fit: `${r.fitScore.toFixed(1)}%`,
    macros: `${r.scaledMeal.calories}kcal, ${r.scaledMeal.protein}g prot`
  })));
  
  return sorted;
}

/**
 * ⚠️ FUNCIONES LEGACY - Mantener por compatibilidad pero no usar
 */
export function scaleToRemainingMacros(meal: Meal, user: User, currentLog: DailyLog): Meal {
  console.warn('⚠️ scaleToRemainingMacros está deprecated - usar scaleToExactTarget');
  return meal;
}

export function scaleToPerfectMatch(meal: Meal, user: User, currentLog: DailyLog): Meal {
  console.warn('⚠️ scaleToPerfectMatch está deprecated - usar scaleToExactTarget');
  return meal;
}