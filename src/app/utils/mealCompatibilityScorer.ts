/**
 * 🎯 MEAL COMPATIBILITY SCORER
 * 
 * Sistema de puntuación que evalúa si un plato puede alcanzar 95%+ accuracy
 * con un target específico ANTES de intentar escalarlo.
 * 
 * OBJETIVO:
 * - NO sugerir platos incompatibles con el target (ej: frutas cuando se necesita 30g proteína)
 * - Priorizar platos que naturalmente se alineen con el target
 * - Garantizar 95%+ accuracy en todas las comidas
 */

import { Meal, MealIngredient } from '../types';
import { calculateMacrosFromIngredients } from '../../data/ingredientTypes';

export interface CompatibilityScore {
  score: number;              // 0-100, donde 100 = perfecto match
  estimatedAccuracy: number;  // Accuracy esperada (90-100%)
  ratios: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  issues: string[];          // Problemas detectados
  recommendation: 'excellent' | 'good' | 'acceptable' | 'poor' | 'incompatible';
}

export interface MacroTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Evalúa la compatibilidad de un plato con un target específico
 * 
 * @param meal - Plato a evaluar (debe tener mealIngredients)
 * @param target - Target de macros deseado
 * @returns Score de compatibilidad con detalles
 */
export function scoreMealCompatibility(
  meal: Meal,
  target: MacroTarget
): CompatibilityScore {
  const issues: string[] = [];
  
  // 1. Obtener macros base del plato
  const mealIngredients = (meal as any).mealIngredients as MealIngredient[] | undefined;
  
  if (!mealIngredients || mealIngredients.length === 0) {
    return {
      score: 0,
      estimatedAccuracy: 0,
      ratios: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      issues: ['Plato sin ingredientes definidos'],
      recommendation: 'incompatible'
    };
  }
  
  // Calcular macros sumando directamente (mealIngredients ya tiene macros calculados)
  const baseMacros = mealIngredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  // 2. Calcular ratios de escalado necesarios
  const ratios = {
    calories: target.calories / Math.max(baseMacros.calories, 1),
    protein: target.protein / Math.max(baseMacros.protein, 1),
    carbs: target.carbs / Math.max(baseMacros.carbs, 1),
    fat: target.fat / Math.max(baseMacros.fat, 1)
  };
  
  // 3. Analizar ratios individuales
  let score = 100;
  
  // Factor 1: Ratios extremos (>3.5x o <0.30x) son casi imposibles
  Object.entries(ratios).forEach(([macro, ratio]) => {
    if (ratio > 4.0) {
      score -= 40;
      issues.push(`${macro} requiere escalado extremo (${ratio.toFixed(1)}x)`);
    } else if (ratio > 3.0) {
      score -= 25;
      issues.push(`${macro} requiere escalado alto (${ratio.toFixed(1)}x)`);
    } else if (ratio > 2.0) {
      score -= 10;
      issues.push(`${macro} requiere escalado moderado (${ratio.toFixed(1)}x)`);
    }
    
    if (ratio < 0.25) {
      score -= 40;
      issues.push(`${macro} requiere reducción extrema (${ratio.toFixed(2)}x)`);
    } else if (ratio < 0.40) {
      score -= 25;
      issues.push(`${macro} requiere reducción alta (${ratio.toFixed(2)}x)`);
    } else if (ratio < 0.60) {
      score -= 10;
      issues.push(`${macro} requiere reducción moderada (${ratio.toFixed(2)}x)`);
    }
  });
  
  // Factor 2: Varianza entre ratios (idealmente todos cercanos)
  // Si un macro necesita 3x y otro 0.5x → direcciones opuestas = IMPOSIBLE
  const ratioValues = Object.values(ratios);
  const avgRatio = ratioValues.reduce((a, b) => a + b, 0) / ratioValues.length;
  const variance = ratioValues.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / ratioValues.length;
  
  if (variance > 1.5) {
    score -= 30;
    issues.push(`Ratios muy dispersos (variance: ${variance.toFixed(2)}) - escalado conflictivo`);
  } else if (variance > 0.8) {
    score -= 15;
    issues.push(`Ratios moderadamente dispersos (variance: ${variance.toFixed(2)})`);
  } else if (variance > 0.4) {
    score -= 5;
  }
  
  // Factor 3: Número de ingredientes (muy pocos = menos flexibilidad)
  if (mealIngredients.length < 3) {
    score -= 10;
    issues.push(`Pocos ingredientes (${mealIngredients.length}) - flexibilidad limitada`);
  }
  
  // Factor 4: Perfil macro incompatible
  const baseProfile = {
    proteinPct: (baseMacros.protein * 4) / Math.max(baseMacros.calories, 1) * 100,
    carbsPct: (baseMacros.carbs * 4) / Math.max(baseMacros.calories, 1) * 100,
    fatPct: (baseMacros.fat * 9) / Math.max(baseMacros.calories, 1) * 100
  };
  
  const targetProfile = {
    proteinPct: (target.protein * 4) / Math.max(target.calories, 1) * 100,
    carbsPct: (target.carbs * 4) / Math.max(target.calories, 1) * 100,
    fatPct: (target.fat * 9) / Math.max(target.calories, 1) * 100
  };
  
  const profileDiff = 
    Math.abs(baseProfile.proteinPct - targetProfile.proteinPct) +
    Math.abs(baseProfile.carbsPct - targetProfile.carbsPct) +
    Math.abs(baseProfile.fatPct - targetProfile.fatPct);
  
  if (profileDiff > 80) {
    score -= 25;
    issues.push(`Perfil macro muy diferente (diff: ${profileDiff.toFixed(0)}%)`);
  } else if (profileDiff > 50) {
    score -= 10;
    issues.push(`Perfil macro moderadamente diferente (diff: ${profileDiff.toFixed(0)}%)`);
  }
  
  // 4. Estimar accuracy final
  // Score >80 → 95%+ accuracy esperada
  // Score 60-80 → 90-95% accuracy esperada
  // Score 40-60 → 85-90% accuracy esperada
  // Score <40 → <85% accuracy esperada
  let estimatedAccuracy: number;
  if (score >= 80) {
    estimatedAccuracy = 95 + (score - 80) * 0.25; // 95-100%
  } else if (score >= 60) {
    estimatedAccuracy = 90 + (score - 60) * 0.25; // 90-95%
  } else if (score >= 40) {
    estimatedAccuracy = 85 + (score - 40) * 0.25; // 85-90%
  } else {
    estimatedAccuracy = Math.max(50, score); // 50-85%
  }
  
  // 5. Clasificar recomendación
  let recommendation: CompatibilityScore['recommendation'];
  if (score >= 80) {
    recommendation = 'excellent';
  } else if (score >= 65) {
    recommendation = 'good';
  } else if (score >= 50) {
    recommendation = 'acceptable';
  } else if (score >= 30) {
    recommendation = 'poor';
  } else {
    recommendation = 'incompatible';
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    estimatedAccuracy,
    ratios,
    issues,
    recommendation
  };
}

/**
 * Filtra platos por compatibilidad mínima
 * 
 * @param meals - Lista de platos disponibles
 * @param target - Target de macros
 * @param minScore - Score mínimo aceptable (default: 50 = 85%+ accuracy)
 * @returns Platos ordenados por compatibilidad (mejor primero)
 */
export function filterCompatibleMeals(
  meals: Meal[],
  target: MacroTarget,
  minScore: number = 50
): Array<Meal & { compatibilityScore: CompatibilityScore }> {
  const scored = meals.map(meal => ({
    ...meal,
    compatibilityScore: scoreMealCompatibility(meal, target)
  }));
  
  // Filtrar por score mínimo
  const compatible = scored.filter(m => m.compatibilityScore.score >= minScore);
  
  // Ordenar por score (mejor primero)
  return compatible.sort((a, b) => b.compatibilityScore.score - a.compatibilityScore.score);
}

/**
 * Encuentra el mejor plato para un target específico
 * 
 * @param meals - Lista de platos disponibles
 * @param target - Target de macros
 * @returns Mejor plato o null si ninguno es compatible
 */
export function findBestMealForTarget(
  meals: Meal[],
  target: MacroTarget
): (Meal & { compatibilityScore: CompatibilityScore }) | null {
  const compatible = filterCompatibleMeals(meals, target, 50);
  
  if (compatible.length === 0) {
    // FALLBACK: Si ninguno supera 50, retornar el menos malo (>30)
    const fallback = filterCompatibleMeals(meals, target, 30);
    if (fallback.length > 0) {
      console.warn(`⚠️ No hay platos altamente compatibles. Usando fallback con score ${fallback[0].compatibilityScore.score}`);
      return fallback[0];
    }
    
    console.error('❌ Ningún plato compatible encontrado para target:', target);
    return null;
  }
  
  return compatible[0];
}

/**
 * Agrupa platos por nivel de compatibilidad
 */
export function groupMealsByCompatibility(
  meals: Meal[],
  target: MacroTarget
): {
  excellent: Meal[];    // Score 80+ (95%+ accuracy)
  good: Meal[];         // Score 65-80 (90-95% accuracy)
  acceptable: Meal[];   // Score 50-65 (85-90% accuracy)
  poor: Meal[];         // Score 30-50 (<85% accuracy)
  incompatible: Meal[]; // Score <30 (no usar)
} {
  const scored = meals.map(meal => ({
    meal,
    score: scoreMealCompatibility(meal, target)
  }));
  
  return {
    excellent: scored.filter(s => s.score.score >= 80).map(s => s.meal),
    good: scored.filter(s => s.score.score >= 65 && s.score.score < 80).map(s => s.meal),
    acceptable: scored.filter(s => s.score.score >= 50 && s.score.score < 65).map(s => s.meal),
    poor: scored.filter(s => s.score.score >= 30 && s.score.score < 50).map(s => s.meal),
    incompatible: scored.filter(s => s.score.score < 30).map(s => s.meal)
  };
}
