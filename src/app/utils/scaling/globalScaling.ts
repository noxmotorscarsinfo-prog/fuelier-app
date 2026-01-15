/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                       GLOBAL SCALING - FASE 3                            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * PURPOSE:
 * Execute GLOBAL SCALING approach (proportional scaling of ALL ingredients).
 * 
 * WHEN TO USE:
 * - High compatibility (>85%)
 * - Simple meals
 * - Single macro gap
 * - No conflicting directions
 * 
 * PRINCIPLE:
 * All ingredients scaled by SAME factor → preserves ratios 100%
 * 
 * FORMULA:
 * scaleFactor = targetCalories / currentCalories
 * newGrams = originalGrams * scaleFactor
 * 
 * PRESERVATION:
 * - Essence: 100% (ratios preserved perfectly)
 * - Accuracy: ~85% (good for simple cases)
 * 
 * Architecture Position: Layer 1 of 3
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ Layer 1: Global Scaling (YOU ARE HERE)  → 100% essence, 85% accuracy │
 * │ Layer 2: Hierarchical Adjustment        → 85% essence, 93% accuracy  │
 * │ Layer 3: LP Optimization                → 70% essence, 98% accuracy  │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import type {
  MacroTargets,
  MacroValues,
  IngredientClassification,
  StrategyDecision,
  ScalingResult,
  ScaledIngredient,
  MealIngredient,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ScalingAttempt {
  factor: number;
  scaledIngredients: ScaledIngredient[];
  achievedMacros: MacroValues;
  accuracy: number;
  reasoning: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: GLOBAL SCALING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute global scaling approach
 * 
 * @param target - Target macros
 * @param current - Current macros
 * @param classification - Ingredient classification (from FASE 1)
 * @param strategy - Strategy decision (from FASE 2)
 * @returns Scaling result with new grams for all ingredients
 */
export function executeGlobalScaling(
  target: MacroTargets,
  current: MacroValues,
  classification: IngredientClassification,
  strategy: StrategyDecision
): ScalingResult {
  
  // STEP 1: Calculate scale factor based on priority macro
  const scaleFactor = calculateScaleFactor(
    target,
    current,
    strategy.priorityMacro
  );
  
  // STEP 2: Scale ALL ingredients by same factor
  const scaledIngredients = scaleAllIngredients(
    classification,
    scaleFactor
  );
  
  // STEP 3: Calculate achieved macros
  const achievedMacros = calculateAchievedMacros(scaledIngredients);
  
  // STEP 4: Calculate accuracy (% of target achieved)
  const accuracy = calculateAccuracy(target, achievedMacros);
  
  // STEP 5: Calculate preservation score (always 100% for global scaling)
  const preservationScore = 1.0; // Ratios preserved perfectly
  
  // STEP 6: Build audit trail
  const auditTrail = {
    classification,
    strategy,
    attempts: [
      {
        factor: scaleFactor,
        scaledIngredients,
        achievedMacros,
        accuracy,
        reasoning: `Global scaling by factor ${scaleFactor.toFixed(3)}`,
      },
    ],
    finalChoice: 'attempt_1',
    performance: {
      accuracy,
      preservationScore,
      executionTime: 0, // Simple calculation, instant
    },
  };
  
  return {
    scaledIngredients,
    achievedMacros,
    targetMacros: target,
    accuracy,
    preservation: preservationScore,
    preservationScore, // Backward compatibility
    method: 'global_scaling',
    auditTrail,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: CALCULATE SCALE FACTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate scale factor based on priority macro
 * 
 * FORMULA:
 * scaleFactor = target[priorityMacro] / current[priorityMacro]
 * 
 * EXAMPLES:
 * - Need 500 kcal, have 400 kcal → factor = 1.25 (scale UP 25%)
 * - Need 400 kcal, have 500 kcal → factor = 0.80 (scale DOWN 20%)
 * - Need 50g protein, have 40g → factor = 1.25 (scale UP 25%)
 */
function calculateScaleFactor(
  target: MacroTargets,
  current: MacroValues,
  priorityMacro: keyof MacroTargets
): number {
  
  const targetValue = target[priorityMacro];
  const currentValue = current[priorityMacro];
  
  // Safety: avoid division by zero
  if (currentValue === 0) {
    console.warn(`Global Scaling: current ${priorityMacro} is 0, cannot scale`);
    return 1.0; // No scaling
  }
  
  const factor = targetValue / currentValue;
  
  // Safety: clamp to reasonable bounds (0.5x to 3x)
  const clampedFactor = Math.max(0.5, Math.min(3.0, factor));
  
  if (clampedFactor !== factor) {
    console.warn(`Global Scaling: factor ${factor.toFixed(3)} clamped to ${clampedFactor.toFixed(3)}`);
  }
  
  return clampedFactor;
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: SCALE ALL INGREDIENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scale ALL ingredients by same factor (proportional scaling)
 * 
 * CRITICAL: Global scaling scales EVERYTHING (structural + flexible)
 * This preserves ratios 100%
 */
function scaleAllIngredients(
  classification: IngredientClassification,
  scaleFactor: number
): ScaledIngredient[] {
  
  const allIngredients = [
    ...classification.structural,
    ...classification.flexiblePrimary,
    ...classification.flexibleSecondary,
  ];
  
  return allIngredients.map(ing => {
    const originalAmount = ing.amount;
    const scaledAmount = originalAmount * scaleFactor;
    const change = scaledAmount - originalAmount;
    const changePercentage = ((scaledAmount / originalAmount) - 1) * 100;
    
    // Scale macros proportionally
    const scaledCalories = ing.calories * scaleFactor;
    const scaledProtein = ing.protein * scaleFactor;
    const scaledCarbs = ing.carbs * scaleFactor;
    const scaledFat = ing.fat * scaleFactor;
    
    return {
      ingredientId: ing.ingredientId,
      ingredientName: ing.ingredientName,
      originalAmount,
      scaledAmount,
      change,
      changePercentage,
      calories: scaledCalories,
      protein: scaledProtein,
      carbs: scaledCarbs,
      fat: scaledFat,
      wasAdjusted: Math.abs(change) > 0.1, // >0.1g change
      adjustmentReason: `Global scaling (factor: ${scaleFactor.toFixed(3)})`,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: CALCULATE ACHIEVED MACROS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sum up macros from all scaled ingredients
 */
function calculateAchievedMacros(
  scaledIngredients: ScaledIngredient[]
): MacroValues {
  
  const calories = scaledIngredients.reduce((sum, ing) => sum + ing.calories, 0);
  const protein = scaledIngredients.reduce((sum, ing) => sum + ing.protein, 0);
  const carbs = scaledIngredients.reduce((sum, ing) => sum + ing.carbs, 0);
  const fat = scaledIngredients.reduce((sum, ing) => sum + ing.fat, 0);
  
  return { calories, protein, carbs, fat };
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: CALCULATE ACCURACY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate accuracy score (0-1)
 * 
 * FORMULA:
 * For each macro: error = |achieved - target| / target
 * accuracy = 1 - max(error)
 * 
 * INTERPRETATION:
 * - 1.0 = perfect (0% error)
 * - 0.95 = excellent (5% error)
 * - 0.90 = good (10% error)
 * - 0.85 = acceptable (15% error)
 */
function calculateAccuracy(
  target: MacroTargets,
  achieved: MacroValues
): number {
  
  const errors = {
    calories: target.calories > 0 ? Math.abs(achieved.calories - target.calories) / target.calories : 0,
    protein: target.protein > 0 ? Math.abs(achieved.protein - target.protein) / target.protein : 0,
    carbs: target.carbs > 0 ? Math.abs(achieved.carbs - target.carbs) / target.carbs : 0,
    fat: target.fat > 0 ? Math.abs(achieved.fat - target.fat) / target.fat : 0,
  };
  
  const maxError = Math.max(
    errors.calories,
    errors.protein,
    errors.carbs,
    errors.fat
  );
  
  const accuracy = 1 - maxError;
  
  // Clamp to 0-1
  return Math.max(0, Math.min(1, accuracy));
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default executeGlobalScaling;
