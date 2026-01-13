/**
 * 🚀 FUELIER CORE - Sistema de Adaptación Invisible de Platos
 * 
 * Arquitectura modular que permite al usuario elegir platos sin pensar
 * y el sistema los adapta automáticamente a sus macros diarios.
 * 
 * Módulos (en orden de ejecución):
 * 1. Daily Context Manager - Calcula macros disponibles
 * 2. Strategy AI - Decide QUÉ ajustar (NO calcula cantidades)
 * 3. Hard Rules - Valida que la estrategia sea legal
 * 4. Deterministic Calculator - Calcula cantidades exactas
 * 5. Verification - Quality gate antes de aceptar
 * 6. Orchestrator - Coordina todo con memoria y fallbacks
 */

import { Meal, User, DailyLog, MealType } from '../types';
import type { Ingredient, MealIngredientReference } from '../../data/ingredientTypes';
import { calculateMacrosFromIngredients } from '../../data/ingredientTypes';

// ═══════════════════════════════════════════════════════════
// TIPOS COMPARTIDOS
// ═══════════════════════════════════════════════════════════

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MacroType = 'calories' | 'protein' | 'carbs' | 'fat';

export interface DailyContext {
  consumedMacros: Macros;
  remainingMacros: Macros;
  targetForThisMeal: Macros;
  mealsLeft: number;
  isLastMeal: boolean;
  flexibilityMargin: number; // 0.1 = ±10%
}

export interface Strategy {
  priorityMacro: MacroType;
  direction: 'increase' | 'decrease';
  aggressiveness: number; // 0.1-1.0
  preferredIngredients: string[]; // IDs rankeados
  reason: string;
}

export interface IngredientAdjustment {
  ingredientId: string;
  oldAmount: number;
  newAmount: number;
}

export interface AdaptedMeal {
  meal: Meal;
  accuracy: number;
  iterations: number;
  method: 'optimized' | 'proportional-fallback';
  history: string[];
}

// ═══════════════════════════════════════════════════════════
// 1️⃣ DAILY CONTEXT MANAGER
// ═══════════════════════════════════════════════════════════

/**
 * Calcula el contexto diario: qué macros quedan disponibles
 */
export function getDailyContext(
  user: User,
  currentLog: DailyLog,
  mealType: MealType
): DailyContext {
  
  // Macros ya consumidos hoy
  const consumed: Macros = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  // Sumar todos los meals del log
  const allMeals = [
    currentLog.breakfast,
    currentLog.lunch,
    currentLog.snack,
    currentLog.dinner
  ].filter((meal): meal is Meal => meal !== null);

  allMeals.forEach(meal => {
    consumed.calories += meal.calories || 0;
    consumed.protein += meal.protein || 0;
    consumed.carbs += meal.carbs || 0;
    consumed.fat += meal.fat || 0;
  });

  // Target diario del usuario
  const dailyTarget: Macros = {
    calories: user.goals.calories,
    protein: user.goals.protein,
    carbs: user.goals.carbs,
    fat: user.goals.fat
  };

  // Macros restantes
  const remaining: Macros = {
    calories: dailyTarget.calories - consumed.calories,
    protein: dailyTarget.protein - consumed.protein,
    carbs: dailyTarget.carbs - consumed.carbs,
    fat: dailyTarget.fat - consumed.fat
  };

  // Determinar cuántas comidas faltan
  const mealOrder = ['breakfast', 'lunch', 'snack', 'dinner'];
  const currentIndex = mealOrder.indexOf(mealType);
  const mealsLeft = 4 - currentIndex;
  const isLastMeal = mealsLeft === 1;

  // Target para ESTA comida (distribuir lo que queda)
  const targetForThisMeal: Macros = {
    calories: remaining.calories / mealsLeft,
    protein: remaining.protein / mealsLeft,
    carbs: remaining.carbs / mealsLeft,
    fat: remaining.fat / mealsLeft
  };

  // Flexibilidad: última comida debe ser exacta, otras tienen margen
  const flexibilityMargin = isLastMeal ? 0.02 : 0.10; // 2% vs 10%

  return {
    consumedMacros: consumed,
    remainingMacros: remaining,
    targetForThisMeal,
    mealsLeft,
    isLastMeal,
    flexibilityMargin
  };
}

// ═══════════════════════════════════════════════════════════
// 2️⃣ STRATEGY AI MODULE
// ═══════════════════════════════════════════════════════════

/**
 * Analiza la brecha nutricional y encuentra el peor macro
 */
function analyzeGap(current: Macros, target: Macros): {
  deficits: Macros;
  errors: Record<MacroType, number>;
  worstMacro: MacroType;
  worstError: number;
} {
  const deficits: Macros = {
    calories: target.calories - current.calories,
    protein: target.protein - current.protein,
    carbs: target.carbs - current.carbs,
    fat: target.fat - current.fat
  };

  const errors = {
    calories: target.calories > 0 ? Math.abs(deficits.calories) / target.calories : 0,
    protein: target.protein > 0 ? Math.abs(deficits.protein) / target.protein : 0,
    carbs: target.carbs > 0 ? Math.abs(deficits.carbs) / target.carbs : 0,
    fat: target.fat > 0 ? Math.abs(deficits.fat) / target.fat : 0
  };

  let worstMacro: MacroType = 'calories';
  let worstError = errors.calories;

  if (errors.protein > worstError) { worstMacro = 'protein'; worstError = errors.protein; }
  if (errors.carbs > worstError) { worstMacro = 'carbs'; worstError = errors.carbs; }
  if (errors.fat > worstError) { worstMacro = 'fat'; worstError = errors.fat; }

  return { deficits, errors, worstMacro, worstError };
}

/**
 * Rankea ingredientes según utilidad para el objetivo
 */
function rankIngredients(
  ingredients: MealIngredientReference[],
  allIngredients: Ingredient[],
  targetMacro: MacroType,
  direction: 'increase' | 'decrease'
): string[] {
  
  const scored = ingredients.map(ref => {
    const ing = allIngredients.find(i => i.id === ref.ingredientId);
    if (!ing) return null;

    // Contribución del ingrediente al macro (por 100g)
    const contribution = (targetMacro === 'calories' ? ing.caloriesPer100g : 
                          targetMacro === 'protein' ? ing.proteinPer100g :
                          targetMacro === 'carbs' ? ing.carbsPer100g : ing.fatPer100g) || 0;
    
    // Para 'increase': favorece ingredientes con ALTA contribución
    // Para 'decrease': también favorece ALTA contribución (reducirlos tiene más impacto)
    const score = Math.abs(contribution);

    return {
      id: ref.ingredientId,
      score,
      name: ing.name
    };
  }).filter(Boolean) as Array<{ id: string; score: number; name: string }>;

  scored.sort((a, b) => b.score - a.score);
  
  return scored.map(s => s.id);
}

/**
 * 🧠 IA: Decide estrategia (NO calcula cantidades)
 */
export function decideStrategy(
  meal: Meal,
  currentMacros: Macros,
  context: DailyContext,
  allIngredients: Ingredient[]
): Strategy {
  
  const analysis = analyzeGap(currentMacros, context.targetForThisMeal);
  
  const priorityMacro = analysis.worstMacro;
  const deficit = analysis.deficits[priorityMacro];
  const direction: 'increase' | 'decrease' = deficit > 0 ? 'increase' : 'decrease';

  // Aggressiveness basado en:
  // - Magnitud del error (error grande = más agresivo)
  // - Si es última comida (última = más agresivo)
  let aggressiveness = Math.min(1.0, analysis.worstError * 2.5); // 🚀 Más agresivo (antes 1.5)
  if (context.isLastMeal) {
    aggressiveness = Math.min(1.0, aggressiveness * 1.5); // 🚀 Más agresivo (antes 1.3)
  }
  aggressiveness = Math.max(0.5, aggressiveness); // 🚀 Mínimo 0.5 (antes 0.3)

  // Rankear ingredientes del plato
  const preferredIngredients = rankIngredients(
    meal.ingredientReferences || [],
    allIngredients,
    priorityMacro,
    direction
  );

  const reason = `${priorityMacro}: ${direction === 'increase' ? '+' : ''}${deficit.toFixed(0)}${priorityMacro === 'calories' ? 'kcal' : 'g'} (error ${(analysis.worstError * 100).toFixed(0)}%)`;

  return {
    priorityMacro,
    direction,
    aggressiveness,
    preferredIngredients,
    reason
  };
}

// ═══════════════════════════════════════════════════════════
// 3️⃣ HARD RULES VALIDATOR
// ═══════════════════════════════════════════════════════════

export interface Constraints {
  minGramsPerIngredient: number;
  maxMultiplierPerIngredient: number;
  minProteinDaily: number;
  minFatDaily: number;
}

const DEFAULT_CONSTRAINTS: Constraints = {
  minGramsPerIngredient: 1.0,
  maxMultiplierPerIngredient: 100.0,
  minProteinDaily: 50, // Mínimo biológico
  minFatDaily: 20 // Salud hormonal
};

/**
 * Valida que la estrategia sea legal
 */
export function validateStrategy(
  strategy: Strategy,
  meal: Meal,
  constraints: Constraints = DEFAULT_CONSTRAINTS
): { valid: boolean; reason?: string } {
  
  // Regla 1: Debe haber ingredientes para ajustar
  if (strategy.preferredIngredients.length === 0) {
    return { valid: false, reason: 'No hay ingredientes disponibles' };
  }

  // Regla 2: Aggressiveness en rango válido
  if (strategy.aggressiveness < 0.1 || strategy.aggressiveness > 1.0) {
    return { valid: false, reason: `Aggressiveness ${strategy.aggressiveness} fuera de rango` };
  }

  // Regla 3: Los ingredientes existen en el plato
  const mealIngredientIds = (meal.ingredientReferences || []).map(ref => ref.ingredientId);
  const allExist = strategy.preferredIngredients.every(id => mealIngredientIds.includes(id));
  
  if (!allExist) {
    return { valid: false, reason: 'Ingrediente preferido no existe en el plato' };
  }

  return { valid: true };
}

/**
 * Valida que un ajuste específico cumpla constraints
 */
export function validateAdjustment(
  adjustment: IngredientAdjustment,
  originalAmount: number,
  constraints: Constraints = DEFAULT_CONSTRAINTS
): { valid: boolean; reason?: string } {
  
  if (adjustment.newAmount < constraints.minGramsPerIngredient) {
    return { valid: false, reason: `${adjustment.newAmount}g < mínimo ${constraints.minGramsPerIngredient}g` };
  }

  const multiplier = adjustment.newAmount / originalAmount;
  if (multiplier > constraints.maxMultiplierPerIngredient) {
    return { valid: false, reason: `Multiplicador ${multiplier.toFixed(1)}x > máximo ${constraints.maxMultiplierPerIngredient}x` };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════
// 4️⃣ DETERMINISTIC CALCULATOR
// ═══════════════════════════════════════════════════════════

/**
 * 🔢 DETERMINISTA: Calcula cantidad exacta usando mínimos cuadrados
 * 
 * Minimiza: Σ (current[i] - target[i])²
 */
export function calculateOptimalAdjustment(
  ingredient: Ingredient,
  currentAmount: number,
  originalAmount: number,
  deficits: Macros,
  aggressiveness: number,
  constraints: Constraints = DEFAULT_CONSTRAINTS
): IngredientAdjustment {
  
  // Contribución del ingrediente a cada macro (por gramo)
  // Los valores son por 100g en la DB, dividir por 100 para obtener por gramo
  const cal_g = ingredient.caloriesPer100g / 100;
  const prot_g = ingredient.proteinPer100g / 100;
  const carbs_g = ingredient.carbsPer100g / 100;
  const fat_g = ingredient.fatPer100g / 100;

  // Mínimos cuadrados: delta óptimo
  const numerator = 
    deficits.calories * cal_g +
    deficits.protein * prot_g +
    deficits.carbs * carbs_g +
    deficits.fat * fat_g;

  const denominator = 
    cal_g * cal_g +
    prot_g * prot_g +
    carbs_g * carbs_g +
    fat_g * fat_g;

  let delta = denominator > 0 ? numerator / denominator : 0;

  // Aplicar aggressiveness como moderador
  delta *= aggressiveness;

  // Nueva cantidad
  let newAmount = currentAmount + delta;

  // Aplicar constraints
  const minAmount = constraints.minGramsPerIngredient;
  const maxAmount = originalAmount * constraints.maxMultiplierPerIngredient;
  newAmount = Math.max(minAmount, Math.min(maxAmount, newAmount));

  // Redondear a 0.1g
  newAmount = Math.round(newAmount * 10) / 10;

  return {
    ingredientId: ingredient.id,
    oldAmount: currentAmount,
    newAmount
  };
}

// ═══════════════════════════════════════════════════════════
// 5️⃣ VERIFICATION MODULE
// ═══════════════════════════════════════════════════════════

/**
 * Calcula accuracy (0-100%) basada en el peor macro
 */
export function calculateAccuracy(current: Macros, target: Macros): number {
  const errors = {
    cal: target.calories > 0 ? Math.abs(current.calories - target.calories) / target.calories : 0,
    prot: target.protein > 0 ? Math.abs(current.protein - target.protein) / target.protein : 0,
    carbs: target.carbs > 0 ? Math.abs(current.carbs - target.carbs) / target.carbs : 0,
    fat: target.fat > 0 ? Math.abs(current.fat - target.fat) / target.fat : 0
  };

  const maxError = Math.max(errors.cal, errors.prot, errors.carbs, errors.fat);
  return Math.max(0, (1 - maxError) * 100);
}

/**
 * ✅ Quality Gate: Verifica si aceptar un cambio
 */
export function verifyImprovement(
  newIngredients: MealIngredientReference[],
  oldAccuracy: number,
  target: Macros,
  allIngredients: Ingredient[]
): { accept: boolean; accuracy: number; reason: string } {
  
  const newMacros = calculateMacrosFromIngredients(newIngredients, allIngredients);
  
  // Validar que calculateMacrosFromIngredients retornó valores válidos
  if (!newMacros || isNaN(newMacros.calories) || isNaN(newMacros.protein)) {
    return {
      accept: false,
      accuracy: 0,
      reason: 'Macros inválidos calculados'
    };
  }

  const newAccuracy = calculateAccuracy(newMacros as Macros, target);

  // Aceptar solo si mejora (o al menos no empeora significativamente)
  const improved = newAccuracy >= oldAccuracy - 0.5; // 🚀 Tolerancia de 0.5% (antes 0.1%)

  return {
    accept: improved,
    accuracy: newAccuracy,
    reason: improved 
      ? `Mejora: ${oldAccuracy.toFixed(1)}% → ${newAccuracy.toFixed(1)}%`
      : `Empeora: ${oldAccuracy.toFixed(1)}% → ${newAccuracy.toFixed(1)}%`
  };
}

// ═══════════════════════════════════════════════════════════
// 6️⃣ ORCHESTRATOR
// ═══════════════════════════════════════════════════════════

/**
 * 🎯 ORCHESTRATOR: Coordina todos los módulos
 * 
 * Garantiza que NUNCA retorna peor que escalado proporcional
 */
export function adaptMealToContext(
  meal: Meal,
  user: User,
  currentLog: DailyLog,
  mealType: MealType,
  allIngredients: Ingredient[],
  maxIterations: number = 100 // 🚀 Más iteraciones (antes 50)
): AdaptedMeal {
  
  console.log('\n🚀 ══════════════════════════════════════════════════════');
  console.log(`   FUELIER CORE - Adaptación Invisible`);
  console.log(`   Plato: "${meal.name}"`);
  console.log('   ══════════════════════════════════════════════════════');

  // PASO 1: Obtener contexto diario
  const context = getDailyContext(user, currentLog, mealType);
  
  console.log(`\n📊 Contexto Diario:`);
  console.log(`   Target para este plato: ${context.targetForThisMeal.calories.toFixed(0)}kcal | ${context.targetForThisMeal.protein.toFixed(0)}P | ${context.targetForThisMeal.carbs.toFixed(0)}C | ${context.targetForThisMeal.fat.toFixed(0)}G`);
  console.log(`   Comidas restantes: ${context.mealsLeft} | Última: ${context.isLastMeal ? 'SÍ' : 'NO'}`);

  // PASO 2: Escalado proporcional inicial (FALLBACK garantizado)
  const originalIngredients = meal.ingredientReferences || [];
  if (originalIngredients.length === 0) {
    console.log('   ⚠️ Plato sin ingredientes - retornando sin cambios');
    return {
      meal,
      accuracy: 0,
      iterations: 0,
      method: 'proportional-fallback',
      history: ['Sin ingredientes']
    };
  }

  const baseMacros = calculateMacrosFromIngredients(originalIngredients, allIngredients);
  const initialMultiplier = context.targetForThisMeal.calories / (baseMacros.calories || 1);
  
  let currentIngredients: MealIngredientReference[] = originalIngredients.map(ref => ({
    ingredientId: ref.ingredientId,
    amountInGrams: ref.amountInGrams * initialMultiplier
  }));

  let currentMacros = calculateMacrosFromIngredients(currentIngredients, allIngredients) as Macros;
  let bestAccuracy = calculateAccuracy(currentMacros, context.targetForThisMeal);
  let bestIngredients = [...currentIngredients];

  console.log(`   Escalado proporcional (${initialMultiplier.toFixed(2)}x): ${bestAccuracy.toFixed(1)}% accuracy`);

  const history: string[] = [`Inicio: ${bestAccuracy.toFixed(1)}%`];
  const targetAccuracy = 90;
  let iterations = 0;
  let noImprovementCount = 0;
  const maxNoImprovement = 20; // 🚀 Más paciencia (antes 10)

  // PASO 3: Loop de optimización
  for (iterations = 0; iterations < maxIterations; iterations++) {
    
    // ✅ Objetivo alcanzado
    if (bestAccuracy >= targetAccuracy) {
      console.log(`\n✅ Objetivo alcanzado en ${iterations} iteraciones`);
      break;
    }

    // Recalcular macros actuales
    currentMacros = calculateMacrosFromIngredients(currentIngredients, allIngredients) as Macros;

    // 2️⃣ IA: Decidir estrategia
    const strategy = decideStrategy(meal, currentMacros, context, allIngredients);
    
    if (iterations % 10 === 0) {
      console.log(`\n[Iter ${iterations}] 🧠 Strategy: ${strategy.reason}`);
    }

    // 3️⃣ RULES: Validar estrategia
    const validation = validateStrategy(strategy, meal);
    if (!validation.valid) {
      noImprovementCount++;
      if (noImprovementCount >= maxNoImprovement) {
        console.log(`\n⚠️ Sin estrategias válidas`);
        break;
      }
      continue;
    }

    // 4️⃣ CALCULATOR: Calcular ajustes para MÚLTIPLES ingredientes
    const analysis = analyzeGap(currentMacros, context.targetForThisMeal);
    
    // 🚀 NUEVO: Ajustar TOP 3 ingredientes simultáneamente
    const adjustments: IngredientAdjustment[] = [];
    const ingredientsToAdjust = strategy.preferredIngredients.slice(0, 3); // Top 3
    
    for (const ingredientId of ingredientsToAdjust) {
      const idx = currentIngredients.findIndex(ref => ref.ingredientId === ingredientId);
      if (idx === -1) continue;

      const ingredient = allIngredients.find(ing => ing.id === ingredientId);
      if (!ingredient) continue;

      const adjustment = calculateOptimalAdjustment(
        ingredient,
        currentIngredients[idx].amountInGrams,
        originalIngredients[idx].amountInGrams,
        analysis.deficits,
        strategy.aggressiveness
      );

      // Validar ajuste
      const adjValidation = validateAdjustment(
        adjustment,
        originalIngredients[idx].amountInGrams
      );
      
      if (adjValidation.valid && Math.abs(adjustment.newAmount - adjustment.oldAmount) >= 0.5) {
        adjustments.push({...adjustment, ingredientIdx: idx} as any);
      }
    }

    if (adjustments.length === 0) {
      noImprovementCount++;
      if (noImprovementCount >= maxNoImprovement) {
        console.log(`\n⚠️ Sin ajustes válidos disponibles`);
        break;
      }
      continue;
    }

    // Aplicar TODOS los ajustes simultáneamente
    const testIngredients = currentIngredients.map((ref, i) => {
      const adj = adjustments.find((a: any) => a.ingredientIdx === i);
      return adj ? { ...ref, amountInGrams: adj.newAmount } : { ...ref };
    });

    // 5️⃣ VERIFIER: ¿Acepto los cambios?
    const verification = verifyImprovement(
      testIngredients,
      bestAccuracy,
      context.targetForThisMeal,
      allIngredients
    );

    if (verification.accept) {
      currentIngredients = testIngredients;
      bestAccuracy = verification.accuracy;
      bestIngredients = [...testIngredients];
      
      const changedIngredients = adjustments.map((adj: any) => {
        const ing = allIngredients.find(i => i.id === adj.ingredientId);
        return `${ing?.name}: ${adj.oldAmount.toFixed(0)}→${adj.newAmount.toFixed(0)}g`;
      }).join(', ');
      
      history.push(`${changedIngredients} = ${verification.accuracy.toFixed(1)}%`);
      
      noImprovementCount = 0;
    } else {
      noImprovementCount++;
      if (noImprovementCount >= maxNoImprovement) {
        console.log(`\n⚠️ Sin mejora en ${maxNoImprovement} iteraciones`);
        break;
      }
    }
  }

  // PASO 4: Resultado final
  const finalMacros = calculateMacrosFromIngredients(bestIngredients, allIngredients) as Macros;
  const finalAccuracy = calculateAccuracy(finalMacros, context.targetForThisMeal);

  console.log('\n📊 RESULTADO FINAL:');
  console.log(`   Iteraciones: ${iterations}`);
  console.log(`   Accuracy: ${finalAccuracy.toFixed(1)}%`);
  console.log(`   Target:   ${context.targetForThisMeal.calories.toFixed(0)}kcal | ${context.targetForThisMeal.protein.toFixed(0)}P | ${context.targetForThisMeal.carbs.toFixed(0)}C | ${context.targetForThisMeal.fat.toFixed(0)}G`);
  console.log(`   Obtenido: ${finalMacros.calories.toFixed(0)}kcal | ${finalMacros.protein.toFixed(0)}P | ${finalMacros.carbs.toFixed(0)}C | ${finalMacros.fat.toFixed(0)}G`);
  console.log('   ══════════════════════════════════════════════════════\n');

  return {
    meal: {
      ...meal,
      ingredientReferences: bestIngredients,
      calories: Math.round(finalMacros.calories),
      protein: Math.round(finalMacros.protein * 10) / 10,
      carbs: Math.round(finalMacros.carbs * 10) / 10,
      fat: Math.round(finalMacros.fat * 10) / 10,
      scaledForTarget: true,
      proportionCompatibility: finalAccuracy
    },
    accuracy: finalAccuracy,
    iterations,
    method: iterations > 0 ? 'optimized' : 'proportional-fallback',
    history
  };
}
