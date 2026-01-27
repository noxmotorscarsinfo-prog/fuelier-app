/**
 * ============================================================================
 * ORCHESTRATOR - FUELIER AI ENGINE v3.0
 * ============================================================================
 * 
 * FASE 6: Orchestrator - Integración completa del sistema híbrido
 * 
 * Pipeline completo:
 * 1. Classify ingredients (FASE 1)
 * 2. Decide strategy (FASE 2)
 * 3. Execute scaling (FASE 3/4/5 según estrategia)
 * 4. Return unified result
 * 
 * @version 3.0
 * @author FUELIER AI Engine
 * @date 2026-01-15
 */

import type { Meal } from '../../types';
import type { Ingredient } from '../../../data/ingredientTypes';
import type {
  MacroTargets,
  MacroValues,
  ScalingResult,
  DailyContext,
} from './types';

import { classifyIngredients } from './ingredientClassifier';
import { decideStrategy } from './strategyDecider';
import { executeGlobalScaling } from './globalScaling';
import { executeHierarchicalAdjustment } from './hierarchicalAdjustment';
import { executeLPOptimization } from './lpOptimization';

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Execute intelligent meal scaling
 * 
 * Complete pipeline:
 * - FASE 1: Classify ingredients (structural vs flexible)
 * - FASE 2: Decide strategy (global/hierarchical/LP)
 * - FASE 3/4/5: Execute appropriate scaling method
 * 
 * @param meal - Meal to scale
 * @param target - Target macros to achieve
 * @param allIngredients - Database of all ingredients
 * @param isLastMeal - Whether this is last meal of the day (accuracy critical)
 * @returns Scaling result with scaled ingredients and metrics
 */
export function executeScaling(
  meal: Meal,
  target: MacroTargets,
  allIngredients: Ingredient[],
  isLastMeal: boolean = false
): ScalingResult {
  
  // STEP 1: Classify ingredients
  const classification = classifyIngredients(meal as any, allIngredients);
  
  // STEP 2: Calculate current macros
  const mealIngredients = (meal as any).mealIngredients;
  const current: MacroValues = {
    calories: mealIngredients.reduce((sum: number, ing: any) => sum + ing.calories, 0),
    protein: mealIngredients.reduce((sum: number, ing: any) => sum + ing.protein, 0),
    carbs: mealIngredients.reduce((sum: number, ing: any) => sum + ing.carbs, 0),
    fat: mealIngredients.reduce((sum: number, ing: any) => sum + ing.fat, 0),
  };
  
  // STEP 3: Build context
  const context = {
    remainingMacros: target,
    percentageOfDay: 33,
    timeOfDay: 'lunch' as const,
    userGoals: target,
    flexibilityLevel: 'moderate' as const,
    mealsLeft: isLastMeal ? 1 : 3,
    isLastMeal,
  };
  
  // STEP 4: Decide strategy
  const strategy = decideStrategy(target, current, classification, context);
  
  // STEP 5: Execute appropriate scaling method
  let result: ScalingResult;
  
  switch (strategy.approach) {
    case 'global_scaling':
      result = executeGlobalScaling(target, current, classification, strategy);
      break;
    
    case 'hierarchical_adjustment':
      result = executeHierarchicalAdjustment(target, current, classification, strategy);
      break;
    
    case 'lp_optimization':
      result = executeLPOptimization(target, current, classification, strategy);
      break;
    
    default:
      // Fallback to global scaling
      result = executeGlobalScaling(target, current, classification, strategy);
      break;
  }
  
  // Return result directly (already includes all needed fields)
  return result;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Execute scaling with automatic ingredient database lookup
 * (For production use when you have access to full ingredient DB)
 */
export async function executeScalingWithDB(
  meal: Meal,
  target: MacroTargets,
  isLastMeal: boolean = false
): Promise<ScalingResult> {
  // TODO: Import actual ingredient database
  // For now, this is a placeholder
  throw new Error('Not implemented - use executeScaling() with explicit ingredients');
}

/**
 * Preview scaling result without applying
 * Returns what WOULD happen if you scaled this meal
 */
export function previewScaling(
  meal: Meal,
  target: MacroTargets,
  allIngredients: Ingredient[],
  isLastMeal: boolean = false
): {
  wouldUseApproach: string;
  estimatedAccuracy: number;
  estimatedPreservation: number;
  reasoning: string;
} {
  const classification = classifyIngredients(meal as any, allIngredients);
  const context: DailyContext = {
    isLastMeal,
    mealsLeft: isLastMeal ? 0 : 1,
    timeOfDay: 'lunch',
    percentageOfDay: 0.5,
    remainingMacros: target,
    userGoals: target,
    flexibilityLevel: 'moderate'
  };
  
  const mealIngredients = (meal as any).mealIngredients;
  const current: MacroValues = {
    calories: mealIngredients.reduce((sum: number, ing: any) => sum + ing.calories, 0),
    protein: mealIngredients.reduce((sum: number, ing: any) => sum + ing.protein, 0),
    carbs: mealIngredients.reduce((sum: number, ing: any) => sum + ing.carbs, 0),
    fat: mealIngredients.reduce((sum: number, ing: any) => sum + ing.fat, 0),
  };
  
  const strategy = decideStrategy(target, current, classification, context);
  
  // Estimate based on approach
  let estimatedAccuracy = 0;
  let estimatedPreservation = 0;
  
  switch (strategy.approach) {
    case 'global_scaling':
      estimatedAccuracy = 0.86;
      estimatedPreservation = 1.0;
      break;
    case 'hierarchical_adjustment':
      estimatedAccuracy = 0.80;
      estimatedPreservation = 1.0;
      break;
    case 'lp_optimization':
      estimatedAccuracy = 0.90;
      estimatedPreservation = 0.66;
      break;
  }
  
  return {
    wouldUseApproach: strategy.approach,
    estimatedAccuracy,
    estimatedPreservation,
    reasoning: strategy.reason,
  };
}
