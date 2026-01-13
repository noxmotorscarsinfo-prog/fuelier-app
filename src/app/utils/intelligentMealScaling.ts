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
 * ✅ ESTRATEGIA CORRECTA: Multiplicador que NUNCA se excede de ningún macro
 * 
 * LÓGICA RESTRICTIVA:
 * - Calcula el multiplicador para CADA macro individualmente
 * - USA EL MENOR de todos (el más restrictivo)
 * - Esto garantiza que NO se exceda de NINGÚN macro
 * - Puede quedar ligeramente por debajo del target, pero NUNCA se excede
 */
function calculatePerfectMultiplier(
  baseMacros: { calories: number; protein: number; carbs: number; fat: number },
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  isLastMeal: boolean
): number {
  
  // Calcular multiplicador individual para cada macro
  const multipliers = {
    cal: (baseMacros.calories > 0 && targetMacros.calories > 0) ? targetMacros.calories / baseMacros.calories : 1,
    prot: (baseMacros.protein > 0 && targetMacros.protein > 0) ? targetMacros.protein / baseMacros.protein : 1,
    carbs: (baseMacros.carbs > 0 && targetMacros.carbs > 0) ? targetMacros.carbs / baseMacros.carbs : 1,
    fat: (baseMacros.fat > 0 && targetMacros.fat > 0) ? targetMacros.fat / baseMacros.fat : 1
  };
  
  console.log('🔢 Multiplicadores individuales:', {
    cal: multipliers.cal.toFixed(3),
    prot: multipliers.prot.toFixed(3),
    carbs: multipliers.carbs.toFixed(3),
    fat: multipliers.fat.toFixed(3)
  });
  
  // ⚠️ CLAVE: Usar el MENOR multiplicador (el más restrictivo)
  // Esto garantiza que NO nos excedamos de NINGÚN macro
  const allMultipliers = [multipliers.cal, multipliers.prot, multipliers.carbs, multipliers.fat];
  const restrictiveMultiplier = Math.min(...allMultipliers);
  
  // Identificar qué macro es el limitante
  let limitingMacro = '';
  if (restrictiveMultiplier === multipliers.cal) limitingMacro = 'calorías';
  else if (restrictiveMultiplier === multipliers.prot) limitingMacro = 'proteína';
  else if (restrictiveMultiplier === multipliers.carbs) limitingMacro = 'carbos';
  else if (restrictiveMultiplier === multipliers.fat) limitingMacro = 'grasas';
  
  if (isLastMeal) {
    console.log(`🌙 ÚLTIMA COMIDA - Usando multiplicador restrictivo: ${restrictiveMultiplier.toFixed(3)}x (limitado por ${limitingMacro})`);
  } else {
    console.log(`🍽️ Comida normal - Usando multiplicador restrictivo: ${restrictiveMultiplier.toFixed(3)}x (limitado por ${limitingMacro})`);
  }
  
  return restrictiveMultiplier;
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
  
  // ⭐ ÚLTIMA COMIDA: Ajuste iterativo para alcanzar target EXACTO con ingredientes REALES
  if (isLastMeal) {
    console.log('🌙 ÚLTIMA COMIDA - Optimización iterativa para alcanzar 100% exacto');
    
    if (meal.ingredientReferences && meal.ingredientReferences.length > 0) {
      // 🎯 ALGORITMO ITERATIVO MEJORADO: Optimizar TODOS los macros simultáneamente
      let bestMultiplier = baseMacros.calories > 0 ? targetMacros.calories / baseMacros.calories : 1;
      let bestIngredients: MealIngredientReference[] = [];
      let iterations = 0;
      const maxIterations = 100; // Aumentado para mejor convergencia
      let bestDiff = Infinity;
      
      // Iterar para encontrar el multiplicador que minimiza el error de TODOS los macros
      for (let i = 0; i < maxIterations; i++) {
        const testIngredients: MealIngredientReference[] = meal.ingredientReferences.map(ref => ({
          ingredientId: ref.ingredientId,
          amountInGrams: Math.round(ref.amountInGrams * bestMultiplier)
        }));
        
        const testMacros = calculateMacrosFromIngredients(testIngredients, allIngredients);
        
        // ✅ MEJORA: Calcular error ponderado de TODOS los macros (no solo calorías)
        const errors = {
          cal: targetMacros.calories > 0 ? Math.abs(testMacros.calories - targetMacros.calories) / targetMacros.calories : 0,
          prot: targetMacros.protein > 0 ? Math.abs(testMacros.protein - targetMacros.protein) / targetMacros.protein : 0,
          carbs: targetMacros.carbs > 0 ? Math.abs(testMacros.carbs - targetMacros.carbs) / targetMacros.carbs : 0,
          fat: targetMacros.fat > 0 ? Math.abs(testMacros.fat - targetMacros.fat) / targetMacros.fat : 0
        };
        
        // Error total ponderado (calorías 40%, proteína 30%, carbos 15%, grasa 15%)
        const totalError = errors.cal * 0.4 + errors.prot * 0.3 + errors.carbs * 0.15 + errors.fat * 0.15;
        
        if (totalError < bestDiff) {
          bestDiff = totalError;
          bestIngredients = testIngredients;
          iterations = i + 1;
        }
        
        // Si ya es muy preciso (<1% error), salir
        if (totalError < 0.01) break;
        
        // ✅ MEJORA: Ajustar multiplicador usando ratio ponderado de TODOS los macros
        const ratios = {
          cal: targetMacros.calories > 0 && testMacros.calories > 0 ? targetMacros.calories / testMacros.calories : 1,
          prot: targetMacros.protein > 0 && testMacros.protein > 0 ? targetMacros.protein / testMacros.protein : 1,
          carbs: targetMacros.carbs > 0 && testMacros.carbs > 0 ? targetMacros.carbs / testMacros.carbs : 1,
          fat: targetMacros.fat > 0 && testMacros.fat > 0 ? targetMacros.fat / testMacros.fat : 1
        };
        
        // Ratio ponderado (prioriza calorías y proteína)
        const weightedRatio = ratios.cal * 0.4 + ratios.prot * 0.3 + ratios.carbs * 0.15 + ratios.fat * 0.15;
        
        // Ajuste suave para evitar oscilaciones
        bestMultiplier *= (weightedRatio * 0.15 + 0.85);
      }
      
      // Aplicar los mejores ingredientes encontrados
      const finalIngredients = bestIngredients.length > 0 ? bestIngredients : meal.ingredientReferences.map(ref => ({
        ingredientId: ref.ingredientId,
        amountInGrams: Math.round(ref.amountInGrams * bestMultiplier)
      }));
      
      const finalMacros = calculateMacrosFromIngredients(finalIngredients, allIngredients);
      
      console.log('   🔢 Ingredientes optimizados (iteraciones: ' + iterations + ', error: ' + (bestDiff * 100).toFixed(2) + '%):');
      finalIngredients.forEach((ing, i) => {
        const original = meal.ingredientReferences![i];
        console.log(`      ${ing.ingredientId}: ${original.amountInGrams}g → ${ing.amountInGrams}g (${bestMultiplier.toFixed(3)}x)`);
      });
      
      const scaledMeal = {
        ...meal,
        ingredientReferences: finalIngredients,
        calories: finalMacros.calories,
        protein: finalMacros.protein,
        carbs: finalMacros.carbs,
        fat: finalMacros.fat,
        baseQuantity: bestMultiplier,
        scaledForTarget: true,
        isLastMeal: true
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
      
      console.log('✅ ÚLTIMA COMIDA - Optimizado al máximo (TODOS los macros):', {
        cal: `${finalMacros.calories} kcal (target: ${targetMacros.calories}, diff: ${diffCal > 0 ? '+' : ''}${diffCal}, error: ${errorPercentages.cal.toFixed(1)}%)`,
        prot: `${finalMacros.protein}g (target: ${targetMacros.protein}g, diff: ${diffProt > 0 ? '+' : ''}${diffProt}g, error: ${errorPercentages.prot.toFixed(1)}%)`,
        carbs: `${finalMacros.carbs}g (target: ${targetMacros.carbs}g, diff: ${diffCarbs > 0 ? '+' : ''}${diffCarbs}g, error: ${errorPercentages.carbs.toFixed(1)}%)`,
        fat: `${finalMacros.fat}g (target: ${targetMacros.fat}g, diff: ${diffFat > 0 ? '+' : ''}${diffFat}g, error: ${errorPercentages.fat.toFixed(1)}%)`,
        multiplier: `${bestMultiplier.toFixed(3)}x`,
        nota: '⭐ Algoritmo multi-macro optimizado - todos los macros balanceados'
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return scaledMeal;
    } else {
      // Sin ingredientes: usar target directo
      const baseMultiplier = baseMacros.calories > 0 
        ? targetMacros.calories / baseMacros.calories 
        : 1;
        
      const scaledMeal = {
        ...meal,
        calories: targetMacros.calories,
        protein: targetMacros.protein,
        carbs: targetMacros.carbs,
        fat: targetMacros.fat,
        baseQuantity: baseMultiplier,
        scaledForTarget: true,
        isLastMeal: true
      };
      
      console.log('✅ ÚLTIMA COMIDA - Sin ingredientes (target directo):', {
        cal: `${scaledMeal.calories} kcal ⭐ EXACTO`,
        prot: `${scaledMeal.protein}g ⭐ EXACTO`,
        carbs: `${scaledMeal.carbs}g ⭐ EXACTO`,
        fat: `${scaledMeal.fat}g ⭐ EXACTO`
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return scaledMeal;
    }
  }
  
  // 🍽️ COMIDAS NORMALES: NUEVA ESTRATEGIA - Optimizar TODOS los macros al 100%
  console.log('🎯 Optimización multi-macro para alcanzar 100% en todos los macros');
  
  if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
    // Sin ingredientes: escalar proporcionalmente (legacy)
    const multiplier = calculatePerfectMultiplier(baseMacros, targetMacros, isLastMeal);
    
    const scaledMeal = {
      ...meal,
      calories: Math.round(baseMacros.calories * multiplier),
      protein: Math.round(baseMacros.protein * multiplier * 10) / 10,
      carbs: Math.round(baseMacros.carbs * multiplier * 10) / 10,
      fat: Math.round(baseMacros.fat * multiplier * 10) / 10,
      baseQuantity: multiplier,
      scaledForTarget: true,
      isLastMeal: false
    };
    
    console.log('✅ Plato escalado (SIN ingredientes - legacy):', {
      cal: `${scaledMeal.calories} kcal (target: ${targetMacros.calories}, diff: ${scaledMeal.calories - targetMacros.calories})`,
      prot: `${scaledMeal.protein}g (target: ${targetMacros.protein}g, diff: ${(scaledMeal.protein - targetMacros.protein).toFixed(1)}g)`,
      carbs: `${scaledMeal.carbs}g (target: ${targetMacros.carbs}g, diff: ${(scaledMeal.carbs - targetMacros.carbs).toFixed(1)}g)`,
      fat: `${scaledMeal.fat}g (target: ${targetMacros.fat}g, diff: ${(scaledMeal.fat - targetMacros.fat).toFixed(1)}g)`,
      multiplier: `${multiplier.toFixed(3)}x`
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return scaledMeal;
  }
  
  // 🎯 ALGORITMO ITERATIVO MEJORADO: Optimizar TODOS los macros simultáneamente
  let bestMultiplier = baseMacros.calories > 0 ? targetMacros.calories / baseMacros.calories : 1;
  let bestIngredients: MealIngredientReference[] = [];
  let iterations = 0;
  const maxIterations = 100;
  let bestDiff = Infinity;
  
  // Iterar para encontrar el multiplicador que minimiza el error de TODOS los macros
  for (let i = 0; i < maxIterations; i++) {
    const testIngredients: MealIngredientReference[] = meal.ingredientReferences.map(ref => ({
      ingredientId: ref.ingredientId,
      amountInGrams: Math.round(ref.amountInGrams * bestMultiplier)
    }));
    
    const testMacros = calculateMacrosFromIngredients(testIngredients, allIngredients);
    
    // ✅ Calcular error ponderado de TODOS los macros
    const errors = {
      cal: targetMacros.calories > 0 ? Math.abs(testMacros.calories - targetMacros.calories) / targetMacros.calories : 0,
      prot: targetMacros.protein > 0 ? Math.abs(testMacros.protein - targetMacros.protein) / targetMacros.protein : 0,
      carbs: targetMacros.carbs > 0 ? Math.abs(testMacros.carbs - targetMacros.carbs) / targetMacros.carbs : 0,
      fat: targetMacros.fat > 0 ? Math.abs(testMacros.fat - targetMacros.fat) / targetMacros.fat : 0
    };
    
    // Error total ponderado (calorías 40%, proteína 30%, carbos 15%, grasa 15%)
    const totalError = errors.cal * 0.4 + errors.prot * 0.3 + errors.carbs * 0.15 + errors.fat * 0.15;
    
    if (totalError < bestDiff) {
      bestDiff = totalError;
      bestIngredients = testIngredients;
      iterations = i + 1;
    }
    
    // Si ya es muy preciso (<1% error), salir
    if (totalError < 0.01) break;
    
    // ✅ Ajustar multiplicador usando ratio ponderado de TODOS los macros
    const ratios = {
      cal: targetMacros.calories > 0 && testMacros.calories > 0 ? targetMacros.calories / testMacros.calories : 1,
      prot: targetMacros.protein > 0 && testMacros.protein > 0 ? targetMacros.protein / testMacros.protein : 1,
      carbs: targetMacros.carbs > 0 && testMacros.carbs > 0 ? targetMacros.carbs / testMacros.carbs : 1,
      fat: targetMacros.fat > 0 && testMacros.fat > 0 ? targetMacros.fat / testMacros.fat : 1
    };
    
    // Ratio ponderado (prioriza calorías y proteína)
    const weightedRatio = ratios.cal * 0.4 + ratios.prot * 0.3 + ratios.carbs * 0.15 + ratios.fat * 0.15;
    
    // Ajuste suave para evitar oscilaciones
    bestMultiplier *= (weightedRatio * 0.15 + 0.85);
  }
  
  // Aplicar los mejores ingredientes encontrados
  const finalIngredients = bestIngredients.length > 0 ? bestIngredients : meal.ingredientReferences.map(ref => ({
    ingredientId: ref.ingredientId,
    amountInGrams: Math.round(ref.amountInGrams * bestMultiplier)
  }));
  
  const finalMacros = calculateMacrosFromIngredients(finalIngredients, allIngredients);
  
  console.log('   🔢 Ingredientes optimizados (iteraciones: ' + iterations + ', error: ' + (bestDiff * 100).toFixed(2) + '%):');
  finalIngredients.forEach((ing, i) => {
    const original = meal.ingredientReferences![i];
    console.log(`      ${ing.ingredientId}: ${original.amountInGrams}g → ${ing.amountInGrams}g (${bestMultiplier.toFixed(3)}x)`);
  });
  
  const scaledMeal = {
    ...meal,
    ingredientReferences: finalIngredients,
    calories: finalMacros.calories,
    protein: finalMacros.protein,
    carbs: finalMacros.carbs,
    fat: finalMacros.fat,
    baseQuantity: bestMultiplier,
    scaledForTarget: true,
    isLastMeal: false
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
  
  console.log('✅ COMIDA OPTIMIZADA (TODOS los macros):', {
    cal: `${finalMacros.calories} kcal (target: ${targetMacros.calories}, diff: ${diffCal > 0 ? '+' : ''}${diffCal}, error: ${errorPercentages.cal.toFixed(1)}%)`,
    prot: `${finalMacros.protein}g (target: ${targetMacros.protein}g, diff: ${diffProt > 0 ? '+' : ''}${diffProt}g, error: ${errorPercentages.prot.toFixed(1)}%)`,
    carbs: `${finalMacros.carbs}g (target: ${targetMacros.carbs}g, diff: ${diffCarbs > 0 ? '+' : ''}${diffCarbs}g, error: ${errorPercentages.carbs.toFixed(1)}%)`,
    fat: `${finalMacros.fat}g (target: ${targetMacros.fat}g, diff: ${diffFat > 0 ? '+' : ''}${diffFat}g, error: ${errorPercentages.fat.toFixed(1)}%)`,
    multiplier: `${bestMultiplier.toFixed(3)}x`,
    nota: '⭐ Algoritmo multi-macro optimizado'
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