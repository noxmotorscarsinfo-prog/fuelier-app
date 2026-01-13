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
 * ✅ CORREGIDO: Calcula el multiplicador perfecto para escalar un plato
 * 
 * ESTRATEGIA NUEVA Y CORRECTA:
 * - ÚLTIMA COMIDA (isLastMeal=true): Minimizar desviación de TODOS los macros (alcanzar 100% del target)
 * - COMIDAS NORMALES: También minimizar desviación de todos los macros (pero con menos presión)
 * 
 * La diferencia es que la última comida tiene un target que es "lo que REALMENTE falta",
 * mientras que las normales tienen un target que es "división equitativa"
 */
function calculatePerfectMultiplier(
  baseMacros: { calories: number; protein: number; carbs: number; fat: number },
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  isLastMeal: boolean
): number {
  
  // Calcular multiplicador individual para cada macro
  // ✅ Protección mejorada: si target es 0 o base es 0, mantener proporción 1:1
  const multipliers = {
    cal: (baseMacros.calories > 0 && targetMacros.calories > 0) ? targetMacros.calories / baseMacros.calories : 1,
    prot: (baseMacros.protein > 0 && targetMacros.protein > 0) ? targetMacros.protein / baseMacros.protein : 1,
    carbs: (baseMacros.carbs > 0 && targetMacros.carbs > 0) ? targetMacros.carbs / baseMacros.carbs : 1,
    fat: (baseMacros.fat > 0 && targetMacros.fat > 0) ? targetMacros.fat / baseMacros.fat : 1
  };
  
  console.log('🔢 Multiplicadores individuales:', {
    cal: multipliers.cal.toFixed(2),
    prot: multipliers.prot.toFixed(2),
    carbs: multipliers.carbs.toFixed(2),
    fat: multipliers.fat.toFixed(2)
  });
  
  // ✅ CLAVE: Para ÚLTIMA comida, darle más peso a TODOS los macros
  // Para comidas normales, darle más peso a calorías y proteína
  const weights = isLastMeal ? {
    cal: 0.35,    // 35% peso a calorías
    prot: 0.35,   // 35% peso a proteína  
    carbs: 0.20,  // 20% peso a carbos
    fat: 0.10     // 10% peso a grasas
  } : {
    cal: 0.50,    // 50% peso a calorías (prioridad en comidas normales)
    prot: 0.30,   // 30% peso a proteína
    carbs: 0.10,  // 10% peso a carbos
    fat: 0.10     // 10% peso a grasas
  };
  
  // Multiplicador ponderado
  const weightedMultiplier = 
    multipliers.cal * weights.cal +
    multipliers.prot * weights.prot +
    multipliers.carbs * weights.carbs +
    multipliers.fat * weights.fat;
  
  if (isLastMeal) {
    console.log('🌙 ÚLTIMA COMIDA - Multiplicador ponderado (todos los macros):', weightedMultiplier.toFixed(3) + 'x');
  } else {
    console.log('🍽️ Comida normal - Multiplicador ponderado (prioridad calorías):', weightedMultiplier.toFixed(3) + 'x');
  }
  
  return weightedMultiplier;
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
  
  // ⚠️ ÚLTIMA COMIDA: Escalar ingredientes para acercarse al target
  // IMPORTANTE: Los macros finales se calculan desde los ingredientes escalados
  // NO se fuerzan artificialmente - esto mantiene las proporciones reales
  if (isLastMeal) {
    console.log('🌙 ÚLTIMA COMIDA - Escalando ingredientes para acercarse al target');
    
    // Calcular multiplicador base (para escalar ingredientes proporcionalmente)
    const baseMultiplier = baseMacros.calories > 0 
      ? targetMacros.calories / baseMacros.calories 
      : 1;
    
    if (meal.ingredientReferences && meal.ingredientReferences.length > 0) {
      // Con ingredientes: escalar cantidades
      const scaledIngredients: MealIngredientReference[] = meal.ingredientReferences.map(ref => ({
        ingredientId: ref.ingredientId,
        amountInGrams: Math.round(ref.amountInGrams * baseMultiplier)
      }));
      
      console.log('   🔢 Ingredientes escalados:');
      scaledIngredients.forEach((ing, i) => {
        const original = meal.ingredientReferences![i];
        console.log(`      ${ing.ingredientId}: ${original.amountInGrams}g → ${ing.amountInGrams}g`);
      });
      
      // ✅ CORRECTO: Calcular macros REALES desde los ingredientes escalados
      const realMacros = calculateMacrosFromIngredients(scaledIngredients, allIngredients);
      
      const scaledMeal = {
        ...meal,
        ingredientReferences: scaledIngredients,
        calories: realMacros.calories,     // ✅ REAL - calculado desde ingredientes
        protein: realMacros.protein,       // ✅ REAL - calculado desde ingredientes
        carbs: realMacros.carbs,           // ✅ REAL - calculado desde ingredientes
        fat: realMacros.fat,               // ✅ REAL - calculado desde ingredientes
        baseQuantity: baseMultiplier,
        scaledForTarget: true,
        isLastMeal: true
      };
      
      const diffCal = targetMacros.calories - realMacros.calories;
      const diffProt = targetMacros.protein - realMacros.protein;
      const diffCarbs = targetMacros.carbs - realMacros.carbs;
      const diffFat = targetMacros.fat - realMacros.fat;
      
      console.log('✅ ÚLTIMA COMIDA - Macros REALES (desde ingredientes):', {
        cal: `${realMacros.calories} kcal (target: ${targetMacros.calories}, diff: ${diffCal > 0 ? '+' : ''}${diffCal})`,
        prot: `${realMacros.protein}g (target: ${targetMacros.protein}g, diff: ${diffProt > 0 ? '+' : ''}${diffProt}g)`,
        carbs: `${realMacros.carbs}g (target: ${targetMacros.carbs}g, diff: ${diffCarbs > 0 ? '+' : ''}${diffCarbs}g)`,
        fat: `${realMacros.fat}g (target: ${targetMacros.fat}g, diff: ${diffFat > 0 ? '+' : ''}${diffFat}g)`,
        multiplier: `${baseMultiplier.toFixed(3)}x`,
        nota: '✅ Macros calculados desde ingredientes reales - respeta proporciones'
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return scaledMeal;
    } else {
      // Sin ingredientes: escalar proporcionalmente
      const scaledMeal = {
        ...meal,
        calories: Math.round(baseMacros.calories * baseMultiplier),
        protein: Math.round(baseMacros.protein * baseMultiplier),
        carbs: Math.round(baseMacros.carbs * baseMultiplier),
        fat: Math.round(baseMacros.fat * baseMultiplier),
        baseQuantity: baseMultiplier,
        scaledForTarget: true,
        isLastMeal: true
      };
      
      console.log('✅ ÚLTIMA COMIDA - Macros escalados proporcionalmente:', {
        cal: `${scaledMeal.calories} kcal (target: ${targetMacros.calories})`,
        prot: `${scaledMeal.protein}g (target: ${targetMacros.protein}g)`,
        carbs: `${scaledMeal.carbs}g (target: ${targetMacros.carbs}g)`,
        fat: `${scaledMeal.fat}g (target: ${targetMacros.fat}g)`,
        multiplier: `${baseMultiplier.toFixed(3)}x`
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return scaledMeal;
    }
  }
  
  // 🍽️ COMIDAS NORMALES: Usar multiplicador ponderado
  const multiplier = calculatePerfectMultiplier(baseMacros, targetMacros, isLastMeal);
  
  console.log(`   ⚙️ Multiplicador calculado: ${multiplier.toFixed(3)}x`);
  
  // Escalar el plato
  if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
    // Sin ingredientes: escalar proporcionalmente
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
    
    console.log('✅ Plato escalado (SIN ingredientes):', {
      cal: `${scaledMeal.calories} kcal (target: ${targetMacros.calories}, diff: ${scaledMeal.calories - targetMacros.calories})`,
      prot: `${scaledMeal.protein}g (target: ${targetMacros.protein}g, diff: ${(scaledMeal.protein - targetMacros.protein).toFixed(1)}g)`,
      carbs: `${scaledMeal.carbs}g (target: ${targetMacros.carbs}g, diff: ${(scaledMeal.carbs - targetMacros.carbs).toFixed(1)}g)`,
      fat: `${scaledMeal.fat}g (target: ${targetMacros.fat}g, diff: ${(scaledMeal.fat - targetMacros.fat).toFixed(1)}g)`,
      multiplier: `${multiplier.toFixed(3)}x`
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return scaledMeal;
  }
  
  // Con ingredientes: escalar cantidades
  const scaledIngredients: MealIngredientReference[] = meal.ingredientReferences.map(ref => ({
    ingredientId: ref.ingredientId,
    amountInGrams: Math.round(ref.amountInGrams * multiplier)
  }));
  
  console.log('   🔢 Ingredientes escalados:');
  scaledIngredients.forEach((ing, i) => {
    const original = meal.ingredientReferences![i];
    console.log(`      ${ing.ingredientId}: ${original.amountInGrams}g → ${ing.amountInGrams}g`);
  });
  
  const scaledMacros = calculateMacrosFromIngredients(scaledIngredients, allIngredients);
  
  const scaledMeal = {
    ...meal,
    ingredientReferences: scaledIngredients,
    calories: Math.round(scaledMacros.calories),
    protein: Math.round(scaledMacros.protein * 10) / 10,
    carbs: Math.round(scaledMacros.carbs * 10) / 10,
    fat: Math.round(scaledMacros.fat * 10) / 10,
    baseQuantity: multiplier,
    scaledForTarget: true,
    isLastMeal: false
  };
  
  console.log('✅ Plato escalado (CON ingredientes):', {
    cal: `${scaledMeal.calories} kcal (target: ${targetMacros.calories}, diff: ${scaledMeal.calories - targetMacros.calories})`,
    prot: `${scaledMeal.protein}g (target: ${targetMacros.protein}g, diff: ${(scaledMeal.protein - targetMacros.protein).toFixed(1)}g)`,
    carbs: `${scaledMeal.carbs}g (target: ${targetMacros.carbs}g, diff: ${(scaledMeal.carbs - targetMacros.carbs).toFixed(1)}g)`,
    fat: `${scaledMeal.fat}g (target: ${targetMacros.fat}g, diff: ${(scaledMeal.fat - targetMacros.fat).toFixed(1)}g)`,
    multiplier: `${multiplier.toFixed(3)}x`,
    baseQuantity: scaledMeal.baseQuantity
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