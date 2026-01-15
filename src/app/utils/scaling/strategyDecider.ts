/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        STRATEGY DECIDER - FASE 2                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * PURPOSE:
 * Decide STRATEGY for meal scaling without calculating grams.
 * 
 * CORE PRINCIPLE: Separation of concerns
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ THIS MODULE → Decides WHAT to do (strategic decisions)                  │
 * │ NEXT MODULES → Calculate HOW to do it (mathematical execution)          │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * INPUT:
 * - target: Target macros for this meal
 * - classification: Ingredient roles (structural/flexible from FASE 1)
 * - context: Daily context (last meal? flexibility level?)
 * 
 * OUTPUT (StrategyDecision):
 * - approach: Which method to use ('global_scaling' | 'hierarchical_adjustment' | 'lp_optimization')
 * - priorityMacro: Which macro to focus on
 * - adjustableIngredients: IDs of ingredients that CAN be adjusted (only flexibles)
 * - preservationLevel: How much to preserve meal essence (0-1)
 * - metadata: Reasoning and compatibility scores
 * 
 * NO GRAMS CALCULATED HERE! Only decisions.
 * 
 * Architecture: Hybrid 3-layer system
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ Layer 1: Global Scaling          → High compatibility (>85%)          │
 * │ Layer 2: Hierarchical Adjustment → Medium compatibility (50-85%)      │
 * │ Layer 3: LP Optimization         → Low compatibility OR last meal     │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import type {
  MacroTargets,
  MacroValues,
  IngredientClassification,
  StrategyDecision,
  MealIngredient,
  DailyContext,
  Ingredient,
  ScalingApproach,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES FOR INTERNAL USE
// ═══════════════════════════════════════════════════════════════════════════

interface MacroGaps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface RelativeGaps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface CompatibilityScore {
  overall: number; // 0-1
  reasons: string[];
  hasStructuralConstraints: boolean;
  flexibilityRatio: number; // % of calories that are flexible
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: DECIDE STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Decide the scaling strategy for a meal
 * 
 * @param target - Target macros for this meal
 * @param current - Current macros of the meal
 * @param classification - Ingredient classification (from FASE 1)
 * @param context - Daily context (last meal? flexibility?)
 * @returns Strategic decision (NO grams calculated)
 */
export function decideStrategy(
  target: MacroTargets,
  current: MacroValues,
  classification: IngredientClassification,
  context: DailyContext
): StrategyDecision {
  
  // STEP 1: Calculate gaps (target - current)
  const gaps = calculateGaps(target, current);
  const relativeGaps = calculateRelativeGaps(gaps, target);
  
  // STEP 2: Identify priority macro (biggest relative gap)
  const priorityMacro = identifyPriorityMacro(relativeGaps);
  
  // STEP 3: Calculate compatibility with simple methods
  const compatibility = calculateCompatibility(
    classification,
    gaps,
    relativeGaps,
    priorityMacro
  );
  
  // STEP 4: Decide approach based on compatibility and context
  const approach = selectApproach(
    compatibility,
    context,
    relativeGaps
  );
  
  // STEP 5: Identify adjustable ingredients (only flexibles)
  const adjustableIngredients = identifyAdjustableIngredients(
    classification,
    priorityMacro,
    approach
  );
  
  // STEP 6: Calculate preservation level
  const preservationLevel = calculatePreservationLevel(
    approach,
    compatibility,
    context
  );
  
  // STEP 7: Generate reasoning
  const reasoning = generateReasoning(
    approach,
    priorityMacro,
    gaps,
    compatibility,
    context
  );
  
  return {
    approach,
    priorityMacro,
    adjustableIngredients,
    preservationLevel,
    metadata: {
      reasoning,
      compatibilityScore: compatibility.overall,
      gaps,
      relativeGaps,
      hasStructuralConstraints: compatibility.hasStructuralConstraints,
      flexibilityRatio: compatibility.flexibilityRatio,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: CALCULATE GAPS
// ═══════════════════════════════════════════════════════════════════════════

function calculateGaps(target: MacroTargets, current: MacroValues): MacroGaps {
  return {
    calories: target.calories - current.calories,
    protein: target.protein - current.protein,
    carbs: target.carbs - current.carbs,
    fat: target.fat - current.fat,
  };
}

function calculateRelativeGaps(gaps: MacroGaps, target: MacroTargets): RelativeGaps {
  return {
    calories: target.calories > 0 ? Math.abs(gaps.calories) / target.calories : 0,
    protein: target.protein > 0 ? Math.abs(gaps.protein) / target.protein : 0,
    carbs: target.carbs > 0 ? Math.abs(gaps.carbs) / target.carbs : 0,
    fat: target.fat > 0 ? Math.abs(gaps.fat) / target.fat : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: IDENTIFY PRIORITY MACRO
// ═══════════════════════════════════════════════════════════════════════════

function identifyPriorityMacro(relativeGaps: RelativeGaps): keyof MacroTargets {
  const entries = Object.entries(relativeGaps) as [keyof MacroTargets, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: CALCULATE COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate compatibility of this meal with simple scaling methods
 * 
 * High compatibility (>85%) → Use global scaling
 * Medium compatibility (50-85%) → Use hierarchical
 * Low compatibility (<50%) → Use LP optimization
 */
function calculateCompatibility(
  classification: IngredientClassification,
  gaps: MacroGaps,
  relativeGaps: RelativeGaps,
  priorityMacro: keyof MacroTargets
): CompatibilityScore {
  
  const reasons: string[] = [];
  let score = 1.0; // Start optimistic
  
  // FACTOR 1: Structural constraints (structural ingredients lock ratios)
  const hasStructuralConstraints = classification.structural.length > 0;
  const structuralRatio = classification.metadata.coreRatio / 100; // 0-1
  
  if (structuralRatio > 0.8) {
    // Very high structural ratio (>80%) reduces flexibility
    score *= 0.9; // Small penalty
    reasons.push(`High structural ratio (${(structuralRatio * 100).toFixed(0)}%)`);
  }
  
  // FACTOR 2: Flexibility ratio (how much can we adjust?)
  const flexiblePrimaryCalories = classification.flexiblePrimary.reduce(
    (sum, ing) => sum + ing.calories, 0
  );
  const flexibleSecondaryCalories = classification.flexibleSecondary.reduce(
    (sum, ing) => sum + ing.calories, 0
  );
  const totalCalories = classification.metadata.totalCalories;
  const flexibilityRatio = (flexiblePrimaryCalories + flexibleSecondaryCalories) / totalCalories;
  
  if (flexibilityRatio < 0.15) {
    // Very low flexibility (<15%) makes hierarchical difficult
    score *= 0.85;
    reasons.push(`Low flexibility (${(flexibilityRatio * 100).toFixed(0)}%)`);
  } else if (flexibilityRatio > 0.30) {
    // Good flexibility (>30%) helps all methods
    score *= 1.05;
    reasons.push(`Good flexibility (${(flexibilityRatio * 100).toFixed(0)}%)`);
  }
  
  // FACTOR 3: Multiple large gaps (harder to balance)
  const largeGaps = Object.values(relativeGaps).filter(gap => gap > 0.15).length;
  if (largeGaps > 2) {
    score *= 0.75; // Multiple gaps make simple methods harder
    reasons.push(`Multiple large gaps (${largeGaps})`);
  } else if (largeGaps === 1) {
    score *= 1.05;
    reasons.push(`Single macro gap (easy to fix)`);
  }
  
  // FACTOR 3.5: Conflicting directions (some macros need increase, others decrease)
  const needIncrease = Object.values(gaps).filter(g => g > 0).length;
  const needDecrease = Object.values(gaps).filter(g => g < 0).length;
  if (needIncrease > 0 && needDecrease > 0) {
    score *= 0.80; // Conflicting directions make proportional scaling harder
    reasons.push(`Conflicting macro directions (${needIncrease} up, ${needDecrease} down)`);
  }
  
  // FACTOR 4: Macro dominance (if meal is protein-heavy but we need carbs, harder)
  const dominantMacro = classification.metadata.dominantMacro;
  if (dominantMacro && dominantMacro !== priorityMacro && priorityMacro !== 'calories') {
    score *= 0.95; // Small penalty for macro mismatch
    reasons.push(`Macro mismatch (meal: ${dominantMacro}, need: ${priorityMacro})`);
  }
  
  // FACTOR 5: Meal complexity
  const complexity = classification.metadata.complexity;
  if (complexity === 'simple') {
    score *= 1.1;
    reasons.push(`Simple meal (${classification.metadata.totalIngredients} ingredients)`);
  } else if (complexity === 'complex') {
    score *= 0.9;
    reasons.push(`Complex meal (${classification.metadata.totalIngredients} ingredients)`);
  }
  
  // Clamp score to 0-1
  score = Math.max(0, Math.min(1, score));
  
  return {
    overall: score,
    reasons,
    hasStructuralConstraints,
    flexibilityRatio,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: SELECT APPROACH
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Select scaling approach based on compatibility and context
 * 
 * DECISION TREE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ IF last meal AND gap >5% → LP Optimization (accuracy critical)         │
 * │ ELIF compatibility >85% → Global Scaling (preserve essence)            │
 * │ ELIF compatibility >50% → Hierarchical (balanced)                      │
 * │ ELSE → LP Optimization (accuracy needed)                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
function selectApproach(
  compatibility: CompatibilityScore,
  context: DailyContext,
  relativeGaps: RelativeGaps
): ScalingApproach {
  
  // RULE 1: Last meal with significant gap → LP Optimization (accuracy critical)
  if (context.isLastMeal) {
    const maxGap = Math.max(...Object.values(relativeGaps));
    if (maxGap > 0.05) { // >5% error
      return 'lp_optimization';
    }
  }
  
  // RULE 2: High compatibility → Global Scaling (preserve essence 100%)
  if (compatibility.overall > 0.85) {
    return 'global_scaling';
  }
  
  // RULE 3: Medium compatibility → Hierarchical (balanced approach)
  if (compatibility.overall > 0.50) {
    return 'hierarchical_adjustment';
  }
  
  // RULE 4: Low compatibility → LP Optimization (accuracy needed)
  return 'lp_optimization';
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5: IDENTIFY ADJUSTABLE INGREDIENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Identify which ingredients CAN be adjusted based on approach
 * 
 * CRITICAL: Returns ONLY ingredient IDs, NO grams calculated
 * 
 * RULES:
 * - Global Scaling: All ingredients (proportional scaling)
 * - Hierarchical: Flexibles first (primary > secondary), structural locked
 * - LP Optimization: All ingredients (optimizer decides, but respects structural limits)
 */
function identifyAdjustableIngredients(
  classification: IngredientClassification,
  priorityMacro: keyof MacroTargets,
  approach: ScalingApproach
): string[] {
  
  if (approach === 'global_scaling') {
    // Global scaling adjusts ALL ingredients proportionally
    return [
      ...classification.structural.map(ing => ing.ingredientId),
      ...classification.flexiblePrimary.map(ing => ing.ingredientId),
      ...classification.flexibleSecondary.map(ing => ing.ingredientId),
    ];
  }
  
  if (approach === 'hierarchical_adjustment') {
    // Hierarchical: Flexibles only (structural locked)
    // Order matters: primary first, secondary later
    return [
      ...classification.flexiblePrimary.map(ing => ing.ingredientId),
      ...classification.flexibleSecondary.map(ing => ing.ingredientId),
    ];
  }
  
  if (approach === 'lp_optimization') {
    // LP: All ingredients (optimizer will respect structural constraints)
    return [
      ...classification.structural.map(ing => ing.ingredientId),
      ...classification.flexiblePrimary.map(ing => ing.ingredientId),
      ...classification.flexibleSecondary.map(ing => ing.ingredientId),
    ];
  }
  
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6: CALCULATE PRESERVATION LEVEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate how much to preserve meal essence (0-1)
 * 
 * PRESERVATION LEVELS:
 * - Global Scaling: 1.0 (100% essence preserved)
 * - Hierarchical: 0.85 (85% essence, some flexibility allowed)
 * - LP Optimization: 0.70 (70% essence, accuracy prioritized)
 * 
 * Adjusted by:
 * - Flexibility level (strict → higher preservation)
 * - Compatibility (high compatibility → higher preservation)
 */
function calculatePreservationLevel(
  approach: ScalingApproach,
  compatibility: CompatibilityScore,
  context: DailyContext
): number {
  
  // Base preservation level by approach
  let preservation = 1.0;
  if (approach === 'global_scaling') preservation = 1.0;
  else if (approach === 'hierarchical_adjustment') preservation = 0.85;
  else if (approach === 'lp_optimization') preservation = 0.70;
  
  // Adjust by flexibility level
  if (context.flexibilityLevel === 'strict') {
    preservation = Math.min(1.0, preservation + 0.1); // More preservation
  } else if (context.flexibilityLevel === 'flexible') {
    preservation = Math.max(0.5, preservation - 0.1); // Less preservation
  }
  
  // Adjust by compatibility (high compatibility → preserve more)
  if (compatibility.overall > 0.85) {
    preservation = Math.min(1.0, preservation + 0.05);
  } else if (compatibility.overall < 0.5) {
    preservation = Math.max(0.5, preservation - 0.05);
  }
  
  return preservation;
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 7: GENERATE REASONING
// ═══════════════════════════════════════════════════════════════════════════

function generateReasoning(
  approach: ScalingApproach,
  priorityMacro: keyof MacroTargets,
  gaps: MacroGaps,
  compatibility: CompatibilityScore,
  context: DailyContext
): string {
  
  const gap = gaps[priorityMacro];
  const direction = gap > 0 ? 'increase' : 'decrease';
  const absGap = Math.abs(gap);
  const unit = priorityMacro === 'calories' ? 'kcal' : 'g';
  
  let reasoning = `Priority: ${priorityMacro} (${direction} ${absGap.toFixed(0)}${unit}). `;
  reasoning += `Approach: ${approach}. `;
  reasoning += `Compatibility: ${(compatibility.overall * 100).toFixed(0)}%. `;
  
  if (context.isLastMeal) {
    reasoning += `Last meal (accuracy critical). `;
  }
  
  if (compatibility.reasons.length > 0) {
    reasoning += `Factors: ${compatibility.reasons.join(', ')}.`;
  }
  
  return reasoning;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default decideStrategy;
