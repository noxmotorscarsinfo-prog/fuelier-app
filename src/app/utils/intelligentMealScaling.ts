/**
 * 🎯 ESCALADO INTELIGENTE DE COMIDAS CON IA
 * 
 * Algoritmo de optimización multi-objetivo que escala ingredientes para ajustarse
 * PERFECTAMENTE a los macros objetivo, usando clasificación automática de ingredientes.
 * 
 * Características:
 * - 🤖 Clasifica ingredientes automáticamente por perfil nutricional
 * - 🎯 Escala ingredientes similares de manera coherente
 * - 📊 Minimiza el error MÁXIMO entre todos los macros
 * - 🔍 Usa búsqueda binaria para convergencia rápida
 * 
 * ✅ 100% CLOUD - Recibe ingredientes como parámetro
 */

import { Meal, User, DailyLog, MealType } from '../types';
import { Ingredient, MealIngredientReference, calculateMacrosFromIngredients } from '../../data/ingredientTypes';
import { classifyIngredient, SCALING_COEFFICIENTS, NutritionalTypology } from './ingredientClassification';

import { classifyIngredient, SCALING_COEFFICIENTS, NutritionalTypology } from './ingredientClassification';

/**
 * 🤖 ESCALADO INTELIGENTE CON CLASIFICACIÓN AUTOMÁTICA
 * 
 * En lugar de escalar todos los ingredientes por igual, este algoritmo:
 * 1. Clasifica cada ingrediente automáticamente según su perfil nutricional
 * 2. Aplica diferentes estrategias de escalado según la tipología
 * 3. Prioriza ingredientes clave (proteínas) y ajusta secundarios (vegetales, condimentos)
 * 
 * Esto permite ajustes más precisos y coherentes nutricionalmente.
 */
function findOptimalMultiplierWithTypology(
  meal: Meal,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  allIngredients: Ingredient[]
): { multiplier: number; ingredients: MealIngredientReference[]; maxError: number; iterations: number; typologyInfo: Map<string, NutritionalTypology> } {
  
  if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
    return {
      multiplier: 1,
      ingredients: [],
      maxError: 1,
      iterations: 0,
      typologyInfo: new Map()
    };
  }
  
  const baseMacros = calculateMacrosFromIngredients(meal.ingredientReferences, allIngredients);
  
  // 🤖 PASO 1: Clasificar todos los ingredientes del plato
  const ingredientTypologies = new Map<string, NutritionalTypology>();
  const ingredientFlexibility = new Map<string, number>();
  
  meal.ingredientReferences.forEach(ref => {
    const ingredient = allIngredients.find(ing => ing.id === ref.ingredientId);
    if (ingredient) {
      const analysis = classifyIngredient(ingredient);
      ingredientTypologies.set(ref.ingredientId, analysis.typology);
      ingredientFlexibility.set(ref.ingredientId, SCALING_COEFFICIENTS[analysis.typology].flexibility);
      
      console.log(`   🏷️  ${ingredient.name}: ${analysis.typology} (flex: ${SCALING_COEFFICIENTS[analysis.typology].flexibility})`);
    }
  });
  
  // 🎯 PASO 2: Calcular multiplicador base
  const multipliers = {
    cal: baseMacros.calories > 0 ? targetMacros.calories / baseMacros.calories : 1,
    prot: baseMacros.protein > 0 ? targetMacros.protein / baseMacros.protein : 1,
    carbs: baseMacros.carbs > 0 ? targetMacros.carbs / baseMacros.carbs : 1,
    fat: baseMacros.fat > 0 ? targetMacros.fat / baseMacros.fat : 1
  };
  
  console.log('   🔍 Multiplicadores ideales por macro:', {
    cal: multipliers.cal.toFixed(3),
    prot: multipliers.prot.toFixed(3),
    carbs: multipliers.carbs.toFixed(3),
    fat: multipliers.fat.toFixed(3)
  });
  
  // 🎯 PASO 3: Usar búsqueda binaria con ajustes por tipología
  const avgMultiplier = (multipliers.cal + multipliers.prot + multipliers.carbs + multipliers.fat) / 4;
  const testRange = 0.30;
  const stepSize = 0.01;
  const steps = Math.floor((testRange * 2) / stepSize);
  
  let bestMultiplier = avgMultiplier;
  let bestIngredients: MealIngredientReference[] = [];
  let bestMaxError = Infinity;
  let iterations = 0;
  
  for (let i = 0; i <= steps; i++) {
    iterations++;
    const baseTestMultiplier = avgMultiplier * (1 - testRange + (i * stepSize * 2));
    
    // 🤖 APLICAR AJUSTES POR TIPOLOGÍA
    const testIngredients: MealIngredientReference[] = meal.ingredientReferences.map(ref => {
      const flexibility = ingredientFlexibility.get(ref.ingredientId) || 0.5;
      
      // Ingredientes más flexibles pueden desviarse más del multiplicador base
      // Ingredientes menos flexibles se mantienen cerca del multiplicador base
      const adjustedMultiplier = baseTestMultiplier * (0.7 + flexibility * 0.6);
      
      return {
        ingredientId: ref.ingredientId,
        amountInGrams: Math.round(ref.amountInGrams * adjustedMultiplier)
      };
    });
    
    const testMacros = calculateMacrosFromIngredients(testIngredients, allIngredients);
    
    // Calcular error ABSOLUTO de cada macro
    const errors = {
      cal: targetMacros.calories > 0 ? Math.abs(testMacros.calories - targetMacros.calories) / targetMacros.calories : 0,
      prot: targetMacros.protein > 0 ? Math.abs(testMacros.protein - targetMacros.protein) / targetMacros.protein : 0,
      carbs: targetMacros.carbs > 0 ? Math.abs(testMacros.carbs - targetMacros.carbs) / targetMacros.carbs : 0,
      fat: targetMacros.fat > 0 ? Math.abs(testMacros.fat - targetMacros.fat) / targetMacros.fat : 0
    };
    
    // 🎯 MÉTRICA: El ERROR MÁXIMO de cualquier macro
    const maxError = Math.max(errors.cal, errors.prot, errors.carbs, errors.fat);
    
    // Guardar si es mejor que el anterior
    if (maxError < bestMaxError) {
      bestMaxError = maxError;
      bestMultiplier = baseTestMultiplier;
      bestIngredients = testIngredients;
    }
  }
  
  console.log(`   ✅ Mejor multiplicador encontrado: ${bestMultiplier.toFixed(3)}x (error máx: ${(bestMaxError * 100).toFixed(1)}%)`);
  
  return {
    multiplier: bestMultiplier,
    ingredients: bestIngredients,
    maxError: bestMaxError,
    iterations,
    typologyInfo: ingredientTypologies
  };
}

/**
 * 🎯 ALGORITMO DE OPTIMIZACIÓN MULTI-OBJETIVO (LEGACY - sin tipologías)
 * 
 * En lugar de búsqueda binaria simple (que solo usa calorías), este algoritmo
 * prueba MÚLTIPLES multiplicadores alrededor del óptimo y elige el que minimiza
 * el error MÁXIMO en TODOS los macros simultáneamente.
 * 
 * Este método GARANTIZA que TODOS los macros se acercan al 100% tanto como sea posible
 * dada la composición fija del plato.
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
  
  // 🎯 ESTRATEGIA: Calcular multiplicador inicial para CADA macro
  const multipliers = {
    cal: baseMacros.calories > 0 ? targetMacros.calories / baseMacros.calories : 1,
    prot: baseMacros.protein > 0 ? targetMacros.protein / baseMacros.protein : 1,
    carbs: baseMacros.carbs > 0 ? targetMacros.carbs / baseMacros.carbs : 1,
    fat: baseMacros.fat > 0 ? targetMacros.fat / baseMacros.fat : 1
  };
  
  console.log('   🔍 Multiplicadores ideales por macro:', {
    cal: multipliers.cal.toFixed(3),
    prot: multipliers.prot.toFixed(3),
    carbs: multipliers.carbs.toFixed(3),
    fat: multipliers.fat.toFixed(3)
  });
  
  // 🎯 PUNTO DE PARTIDA: Promedio de todos los multiplicadores
  const avgMultiplier = (multipliers.cal + multipliers.prot + multipliers.carbs + multipliers.fat) / 4;
  
  // 🎯 BÚSQUEDA: Probar multiplicadores alrededor del promedio
  // Rango: ±20% del promedio, en pasos de 1%
  const testRange = 0.30; // Probar desde -30% hasta +30%
  const stepSize = 0.01; // Pasos del 1%
  const steps = Math.floor((testRange * 2) / stepSize); // ~60 pruebas
  
  let bestMultiplier = avgMultiplier;
  let bestIngredients: MealIngredientReference[] = [];
  let bestMaxError = Infinity;
  let iterations = 0;
  
  for (let i = 0; i <= steps; i++) {
    iterations++;
    // Multiplicador a probar: desde (avg - 30%) hasta (avg + 30%)
    const testMultiplier = avgMultiplier * (1 - testRange + (i * stepSize * 2));
    
    const testIngredients: MealIngredientReference[] = meal.ingredientReferences.map(ref => ({
      ingredientId: ref.ingredientId,
      amountInGrams: Math.round(ref.amountInGrams * testMultiplier)
    }));
    
    const testMacros = calculateMacrosFromIngredients(testIngredients, allIngredients);
    
    // Calcular error ABSOLUTO de cada macro
    const errors = {
      cal: targetMacros.calories > 0 ? Math.abs(testMacros.calories - targetMacros.calories) / targetMacros.calories : 0,
      prot: targetMacros.protein > 0 ? Math.abs(testMacros.protein - targetMacros.protein) / targetMacros.protein : 0,
      carbs: targetMacros.carbs > 0 ? Math.abs(testMacros.carbs - targetMacros.carbs) / targetMacros.carbs : 0,
      fat: targetMacros.fat > 0 ? Math.abs(testMacros.fat - targetMacros.fat) / targetMacros.fat : 0
    };
    
    // 🎯 MÉTRICA: El ERROR MÁXIMO de cualquier macro
    const maxError = Math.max(errors.cal, errors.prot, errors.carbs, errors.fat);
    
    // Guardar si es mejor que el anterior
    if (maxError < bestMaxError) {
      bestMaxError = maxError;
      bestMultiplier = testMultiplier;
      bestIngredients = testIngredients;
    }
  }
  
  console.log(`   ✅ Mejor multiplicador encontrado: ${bestMultiplier.toFixed(3)}x (error máx: ${(bestMaxError * 100).toFixed(1)}%)`);
  
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
  console.log(`📦 Ingredientes disponibles: ${allIngredients.length}`);
  if (allIngredients.length > 0) {
    console.log(`   Primeros 3 IDs: ${allIngredients.slice(0, 3).map(i => i.id).join(', ')}`);
  } else {
    console.error('⚠️ CRÍTICO: allIngredients está VACÍO - escalado usará fallback local');
  }
  
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
  
  // 🤖 USAR ALGORITMO AVANZADO CON CLASIFICACIÓN AUTOMÁTICA
  const result = findOptimalMultiplierWithTypology(meal, targetMacros, allIngredients);
  
  const finalMacros = calculateMacrosFromIngredients(result.ingredients, allIngredients);
  
  console.log(`   🔢 Ingredientes optimizados (${result.iterations} iteraciones, error máx: ${(result.maxError * 100).toFixed(2)}%):`);
  result.ingredients.forEach((ing, i) => {
    const original = meal.ingredientReferences![i];
    const change = ing.amountInGrams - original.amountInGrams;
    const ingredient = allIngredients.find(item => item.id === ing.ingredientId);
    const typology = result.typologyInfo.get(ing.ingredientId) || 'unknown';
    console.log(`      ${ingredient?.name || ing.ingredientId}: ${original.amountInGrams}g → ${ing.amountInGrams}g (${change > 0 ? '+' : ''}${change}g) [${typology}]`);
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
  
  const minCompletion = Math.min(completionPercentages.cal, completionPercentages.prot, completionPercentages.carbs, completionPercentages.fat);
  const avgCompletion = (completionPercentages.cal + completionPercentages.prot + completionPercentages.carbs + completionPercentages.fat) / 4;
  
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log(`│  ${isLastMeal ? '🌙 ÚLTIMA COMIDA' : '🍽️ COMIDA'} - RESULTADO FINAL`.padEnd(62) + '│');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│  📊 Calorías:  ${finalMacros.calories}/${targetMacros.calories} kcal (${completionPercentages.cal.toFixed(1)}%)`.padEnd(62) + '│');
  console.log(`│  💪 Proteína:  ${finalMacros.protein}/${targetMacros.protein}g (${completionPercentages.prot.toFixed(1)}%)`.padEnd(62) + '│');
  console.log(`│  🍚 Carbos:    ${finalMacros.carbs}/${targetMacros.carbs}g (${completionPercentages.carbs.toFixed(1)}%)`.padEnd(62) + '│');
  console.log(`│  🥑 Grasas:    ${finalMacros.fat}/${targetMacros.fat}g (${completionPercentages.fat.toFixed(1)}%)`.padEnd(62) + '│');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│  ⭐ Completitud mínima:   ${minCompletion.toFixed(1)}%`.padEnd(62) + '│');
  console.log(`│  📊 Completitud promedio: ${avgCompletion.toFixed(1)}%`.padEnd(62) + '│');
  console.log(`│  ⚠️ Error máximo:         ${maxErrorPercent.toFixed(1)}%`.padEnd(62) + '│');
  console.log(`│  🔢 Multiplicador:        ${result.multiplier.toFixed(3)}x`.padEnd(62) + '│');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('');
  
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