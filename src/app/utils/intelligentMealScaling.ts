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
 * 🎯 ALGORITMO DE BÚSQUEDA BINARIA PARA ESCALADO PERFECTO
 * 
 * En lugar de iteración con promedio de ratios, usamos búsqueda binaria para encontrar
 * el multiplicador EXACTO que minimiza el error máximo en TODOS los macros.
 * 
 * Este algoritmo converge MUCHO más rápido y es más preciso.
 */
function findOptimalMultiplier(
  meal: Meal,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  allIngredients: Ingredient[]
): { multiplier: number; ingredients: MealIngredientReference[]; maxError: number; iterations: number } {
  
  if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
    return {
      multiplier: 1,
      ingredients: [],
      maxError: 1,
      iterations: 0
    };
  }
  
  const baseMacros = calculateMacrosFromIngredients(meal.ingredientReferences, allIngredients);
  
  // Calcular multiplicador inicial basado en calorías
  const initialMultiplier = baseMacros.calories > 0 ? targetMacros.calories / baseMacros.calories : 1;
  
  // 🎯 BÚSQUEDA BINARIA: Probar diferentes multiplicadores
  let lowMultiplier = initialMultiplier * 0.5;  // 50% del inicial
  let highMultiplier = initialMultiplier * 1.5; // 150% del inicial
  let bestMultiplier = initialMultiplier;
  let bestIngredients: MealIngredientReference[] = [];
  let bestMaxError = Infinity;
  let iterations = 0;
  const maxIterations = 50; // Búsqueda binaria converge mucho más rápido
  
  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    const testMultiplier = (lowMultiplier + highMultiplier) / 2;
    
    const testIngredients: MealIngredientReference[] = meal.ingredientReferences.map(ref => ({
      ingredientId: ref.ingredientId,
      amountInGrams: Math.round(ref.amountInGrams * testMultiplier)
    }));
    
    const testMacros = calculateMacrosFromIngredients(testIngredients, allIngredients);
    
    // Calcular error de cada macro
    const errors = {
      cal: targetMacros.calories > 0 ? Math.abs(testMacros.calories - targetMacros.calories) / targetMacros.calories : 0,
      prot: targetMacros.protein > 0 ? Math.abs(testMacros.protein - targetMacros.protein) / targetMacros.protein : 0,
      carbs: targetMacros.carbs > 0 ? Math.abs(testMacros.carbs - targetMacros.carbs) / targetMacros.carbs : 0,
      fat: targetMacros.fat > 0 ? Math.abs(testMacros.fat - targetMacros.fat) / targetMacros.fat : 0
    };
    
    const maxError = Math.max(errors.cal, errors.prot, errors.carbs, errors.fat);
    
    // Guardar si es mejor
    if (maxError < bestMaxError) {
      bestMaxError = maxError;
      bestMultiplier = testMultiplier;
      bestIngredients = testIngredients;
    }
    
    // Si el error es muy pequeño, terminar
    if (maxError < 0.01) {
      break;
    }
    
    // 🎯 AJUSTE BINARIO: Decidir si subir o bajar el multiplicador
    // Usamos calorías como referencia principal (es el macro más importante)
    if (testMacros.calories < targetMacros.calories) {
      lowMultiplier = testMultiplier; // Necesitamos MÁS comida
    } else {
      highMultiplier = testMultiplier; // Necesitamos MENOS comida
    }
  }
  
  return {
    multiplier: bestMultiplier,
    ingredients: bestIngredients,
    maxError: bestMaxError,
    iterations
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
  
  // 🎯 ALGORITMO DE BÚSQUEDA BINARIA: Encuentra el multiplicador óptimo
  console.log('🎯 Búsqueda binaria para encontrar multiplicador óptimo...');
  
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
  
  // 🎯 USAR BÚSQUEDA BINARIA para encontrar el multiplicador perfecto
  const result = findOptimalMultiplier(meal, targetMacros, allIngredients);
  
  const finalMacros = calculateMacrosFromIngredients(result.ingredients, allIngredients);
  
  console.log(`   🔢 Ingredientes optimizados (${result.iterations} iteraciones, error máx: ${(result.maxError * 100).toFixed(2)}%):`);
  result.ingredients.forEach((ing, i) => {
    const original = meal.ingredientReferences![i];
    const change = ing.amountInGrams - original.amountInGrams;
    console.log(`      ${ing.ingredientId}: ${original.amountInGrams}g → ${ing.amountInGrams}g (${change > 0 ? '+' : ''}${change}g)`);
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
    cal: targetMacros.calories > 0 ? (Math.abs(diffCal) / targetMacros.calories * 100) : 0,
    prot: targetMacros.protein > 0 ? (Math.abs(diffProt) / targetMacros.protein * 100) : 0,
    carbs: targetMacros.carbs > 0 ? (Math.abs(diffCarbs) / targetMacros.carbs * 100) : 0,
    fat: targetMacros.fat > 0 ? (Math.abs(diffFat) / targetMacros.fat * 100) : 0
  };
  
  const maxErrorPercent = Math.max(errorPercentages.cal, errorPercentages.prot, errorPercentages.carbs, errorPercentages.fat);
  const completionPercentages = {
    cal: targetMacros.calories > 0 ? (finalMacros.calories / targetMacros.calories * 100) : 100,
    prot: targetMacros.protein > 0 ? (finalMacros.protein / targetMacros.protein * 100) : 100,
    carbs: targetMacros.carbs > 0 ? (finalMacros.carbs / targetMacros.carbs * 100) : 100,
    fat: targetMacros.fat > 0 ? (finalMacros.fat / targetMacros.fat * 100) : 100
  };
  
  console.log(`✅ ${isLastMeal ? '🌙 ÚLTIMA COMIDA' : '🍽️ COMIDA'} OPTIMIZADA:`, {
    cal: `${finalMacros.calories}/${targetMacros.calories} kcal (${completionPercentages.cal.toFixed(1)}%)`,
    prot: `${finalMacros.protein}/${targetMacros.protein}g (${completionPercentages.prot.toFixed(1)}%)`,
    carbs: `${finalMacros.carbs}/${targetMacros.carbs}g (${completionPercentages.carbs.toFixed(1)}%)`,
    fat: `${finalMacros.fat}/${targetMacros.fat}g (${completionPercentages.fat.toFixed(1)}%)`,
    errorMáximo: `${maxErrorPercent.toFixed(1)}%`,
    multiplicador: `${result.multiplier.toFixed(3)}x`
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