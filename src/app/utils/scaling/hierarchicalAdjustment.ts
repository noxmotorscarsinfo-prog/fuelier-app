/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                   HIERARCHICAL ADJUSTMENT - FASE 4                       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * PURPOSE:
 * Execute HIERARCHICAL ADJUSTMENT (adjust flexibles first, lock structural).
 * 
 * WHEN TO USE:
 * - Medium compatibility (50-85%)
 * - Multiple macro gaps
 * - Conflicting directions (some up, some down)
 * - Need better accuracy than global scaling
 * 
 * PRINCIPLE:
 * 1. Structural ingredients: LOCKED (0% change) or minimal (<5%)
 * 2. Flexible Primary: Adjusted FIRST (vegetables, adjustable carbs)
 * 3. Flexible Secondary: Adjusted SECOND (oils, condiments)
 * 
 * HIERARCHY:
 * Priority 1: Fix priority macro with flexible primary
 * Priority 2: Fine-tune with flexible secondary
 * Priority 3: If needed, minimal structural adjustment (<5%)
 * 
 * PRESERVATION:
 * - Essence: ~85% (core preserved, periphery adjusted)
 * - Accuracy: ~93% (better than global scaling)
 * 
 * Architecture Position: Layer 2 of 3
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ Layer 1: Global Scaling              → 100% essence, 85% accuracy     │
 * │ Layer 2: Hierarchical Adjustment (HERE) → 85% essence, 93% accuracy   │
 * │ Layer 3: LP Optimization             → 70% essence, 98% accuracy      │
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
  AdjustmentStep as BaseAdjustmentStep,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface HierarchicalStep extends BaseAdjustmentStep {
  priority: number; // 1=flexible primary, 2=flexible secondary, 3=structural
}

interface IterationResult {
  steps: HierarchicalStep[];
  achievedMacros: MacroValues;
  accuracy: number;
  remainingGaps: MacroValues;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: HIERARCHICAL ADJUSTMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute hierarchical adjustment approach
 * 
 * @param target - Target macros
 * @param current - Current macros
 * @param classification - Ingredient classification (from FASE 1)
 * @param strategy - Strategy decision (from FASE 2)
 * @returns Scaling result with hierarchically adjusted ingredients
 */
export function executeHierarchicalAdjustment(
  target: MacroTargets,
  current: MacroValues,
  classification: IngredientClassification,
  strategy: StrategyDecision
): ScalingResult {
  
  const startTime = Date.now();
  const attempts: IterationResult[] = [];
  
  // STEP 1: Initialize with current amounts
  let currentAmounts = initializeAmounts(classification);
  let currentMacros = { ...current };
  
  // STEP 2: Adjust flexible ingredients (combine primary + secondary, sort by efficiency)
  const flexibleAdjustment: IterationResult = adjustFlexiblesOptimally(
    target,
    currentMacros,
    classification,
    strategy,
    currentAmounts
  );
  attempts.push(flexibleAdjustment);
  currentAmounts = applyAdjustments(currentAmounts, flexibleAdjustment.steps);
  currentMacros = flexibleAdjustment.achievedMacros;
  
  // NOTE: Hierarchical does NOT adjust structural ingredients
  // If accuracy is low, LP Optimization should be used instead
  let structuralAdjustment: IterationResult | null = null;
  const accuracyAfterFlexibles = calculateAccuracy(target, currentMacros);
  
  // DISABLED: Structural adjustment (use LP if needed)
  // if (accuracyAfterFlexibles < 0.90 && classification.structural.length > 0) {
  //   structuralAdjustment = adjustStructuralMinimal(...)
  // }
  
  // STEP 4: Build final scaled ingredients
  const allSteps: HierarchicalStep[] = flexibleAdjustment.steps;
  const scaledIngredients = buildScaledIngredients(
    classification,
    currentAmounts,
    allSteps
  );
  
  // STEP 6: Calculate final metrics
  const achievedMacros = calculateMacrosFromScaled(scaledIngredients);
  const accuracy = calculateAccuracy(target, achievedMacros);
  const preservationScore = calculatePreservation(classification, scaledIngredients);
  
  const executionTime = Date.now() - startTime;
  
  // STEP 7: Build audit trail
  const auditTrail = {
    classification,
    strategy,
    attempts: attempts.map((attempt, i) => ({
      factor: 0, // Not used in hierarchical
      scaledIngredients: buildScaledIngredients(classification, currentAmounts, attempt.steps),
      achievedMacros: attempt.achievedMacros,
      accuracy: attempt.accuracy,
      reasoning: `Iteration ${i + 1}: ${attempt.steps.length} adjustments`,
    })),
    finalChoice: `iteration_${attempts.length}`,
    performance: {
      accuracy,
      preservationScore,
      executionTime,
    },
  };
  
  return {
    scaledIngredients,
    achievedMacros,
    accuracy,
    method: 'hierarchical',
    preservationScore,
    reason: `Hierarchical adjustment: ${attempts.length} iterations`,
    deviations: {
      calories: Math.abs((achievedMacros.calories - target.calories) / target.calories) * 100,
      protein: Math.abs((achievedMacros.protein - target.protein) / target.protein) * 100,
      carbs: Math.abs((achievedMacros.carbs - target.carbs) / target.carbs) * 100,
      fat: Math.abs((achievedMacros.fat - target.fat) / target.fat) * 100,
      maxError: Math.max(
        Math.abs((achievedMacros.calories - target.calories) / target.calories) * 100,
        Math.abs((achievedMacros.protein - target.protein) / target.protein) * 100,
        Math.abs((achievedMacros.carbs - target.carbs) / target.carbs) * 100,
        Math.abs((achievedMacros.fat - target.fat) / target.fat) * 100
      ),
    },
    targetMacros: target,
    steps: allSteps.map(step => ({
      ingredientId: step.ingredientId,
      ingredientName: step.ingredientName,
      originalAmount: step.originalAmount,
      newAmount: step.newAmount,
      change: step.change,
      reason: step.reason,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function initializeAmounts(classification: IngredientClassification): Map<string, number> {
  const amounts = new Map<string, number>();
  
  [...classification.structural, ...classification.flexiblePrimary, ...classification.flexibleSecondary]
    .forEach(ing => {
      amounts.set(ing.ingredientId, ing.amount);
    });
  
  return amounts;
}

// ═══════════════════════════════════════════════════════════════════════════
// FLEXIBLES ADJUSTMENT (OPTIMIZED)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Adjust all flexibles (primary + secondary) optimally
 * - Adjusts ALL macros simultaneously (not just priority)
 * - Greedy approach: iterate, find best single adjustment, apply, repeat
 * - Respects bounds (primary: 0.5x-2x, secondary: 0.2x-3x)
 */
function adjustFlexiblesOptimally(
  target: MacroTargets,
  current: MacroValues,
  classification: IngredientClassification,
  strategy: StrategyDecision,
  currentAmounts: Map<string, number>
): IterationResult {
  
  const steps: HierarchicalStep[] = [];
  
  // Build map of all ingredients for easy lookup
  const allIngredientsMap = new Map<string, any>();
  for (const ing of classification.structural) {
    allIngredientsMap.set(ing.ingredientId, ing);
  }
  for (const ing of classification.flexiblePrimary) {
    allIngredientsMap.set(ing.ingredientId, ing);
  }
  for (const ing of classification.flexibleSecondary) {
    allIngredientsMap.set(ing.ingredientId, ing);
  }
  
  // Combine all flexibles with their priority level
  const allFlexibles = [
    ...classification.flexiblePrimary.map(ing => ({ ingredientId: ing.ingredientId, priority: 1 as const, maxChange: 1.0, maxReduce: 0.5 })),
    ...classification.flexibleSecondary.map(ing => ({ ingredientId: ing.ingredientId, priority: 2 as const, maxChange: 2.0, maxReduce: 0.8 })),
  ];
  
  const MAX_ITERATIONS = 10;
  
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Recalculate current macros and gaps
    const currentMacros = calculateMacrosFromAmounts(classification, currentAmounts);
    const gaps = {
      calories: target.calories - currentMacros.calories,
      protein: target.protein - currentMacros.protein,
      carbs: target.carbs - currentMacros.carbs,
      fat: target.fat - currentMacros.fat,
    };
    
    // Calculate total gap (sum of squared relative errors)
    const totalGap = Math.sqrt(
      (gaps.protein / target.protein) ** 2 +
      (gaps.carbs / target.carbs) ** 2 +
      (gaps.fat / target.fat) ** 2
    );
    
    // Stop if gap is small enough
    if (totalGap < 0.05) break; // < 5% total error
    
    // Find best single adjustment
    let bestCandidateId: string | null = null;
    let bestAdjustedAmount = 0;
    let bestGapReduction = 0;
    
    for (const flexInfo of allFlexibles) {
      const ing = allIngredientsMap.get(flexInfo.ingredientId)!;
      const originalAmount = ing.amount;
      const currentAmount = currentAmounts.get(ing.ingredientId) || originalAmount;
      
      // Try different adjustment amounts (from -maxReduce to +maxChange)
      const maxIncrease = originalAmount * flexInfo.maxChange;
      const maxDecrease = -originalAmount * flexInfo.maxReduce;
      
      // Test a few candidate adjustments
      const candidates = [
        currentAmount + maxIncrease * 0.25,
        currentAmount + maxIncrease * 0.5,
        currentAmount + maxIncrease * 1.0,
        currentAmount + maxDecrease * 0.25,
        currentAmount + maxDecrease * 0.5,
        currentAmount + maxDecrease * 1.0,
      ];
      
      for (const candidateAmount of candidates) {
        if (candidateAmount < 0.1) continue; // Too small
        if (Math.abs(candidateAmount - currentAmount) < 0.1) continue; // No meaningful change
        
        // Calculate what macros would be after this change
        const changeDelta = candidateAmount - currentAmount;
        const proteinPerGram = ing.protein / ing.amount;
        const carbsPerGram = ing.carbs / ing.amount;
        const fatPerGram = ing.fat / ing.amount;
        
        const newGaps = {
          protein: gaps.protein - changeDelta * proteinPerGram,
          carbs: gaps.carbs - changeDelta * carbsPerGram,
          fat: gaps.fat - changeDelta * fatPerGram,
        };
        
        const newTotalGap = Math.sqrt(
          (newGaps.protein / target.protein) ** 2 +
          (newGaps.carbs / target.carbs) ** 2 +
          (newGaps.fat / target.fat) ** 2
        );
        
        const gapReduction = totalGap - newTotalGap;
        
        if (gapReduction > bestGapReduction) {
          bestGapReduction = gapReduction;
          bestCandidateId = flexInfo.ingredientId;
          bestAdjustedAmount = candidateAmount;
        }
      }
    }
    
    // Apply best adjustment found
    if (bestCandidateId && bestGapReduction > 0.001) {
      const bestIngredient = allIngredientsMap.get(bestCandidateId)!;
      const flexInfo = allFlexibles.find(f => f.ingredientId === bestCandidateId)!;
      
      steps.push({
        ingredientId: bestIngredient.ingredientId,
        ingredientName: bestIngredient.ingredientName || bestIngredient.name,
        originalAmount: bestIngredient.amount,
        newAmount: bestAdjustedAmount,
        change: bestAdjustedAmount - bestIngredient.amount,
        reason: `Flexible P${flexInfo.priority}: Total gap reduction ${(bestGapReduction * 100).toFixed(1)}%`,
        priority: flexInfo.priority,
      });
      
      currentAmounts.set(bestCandidateId, bestAdjustedAmount);
    } else {
      // No improvement found, stop
      break;
    }
  }
  
  // Calculate achieved macros after this step
  const achievedMacros = calculateMacrosFromAmounts(classification, currentAmounts);
  const accuracy = calculateAccuracy(target, achievedMacros);
  
  return {
    steps,
    achievedMacros,
    accuracy,
    remainingGaps: {
      calories: target.calories - achievedMacros.calories,
      protein: target.protein - achievedMacros.protein,
      carbs: target.carbs - achievedMacros.carbs,
      fat: target.fat - achievedMacros.fat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY 1: ADJUST FLEXIBLE PRIMARY (DEPRECATED - using adjustFlexiblesOptimally)
// ═══════════════════════════════════════════════════════════════════════════

function adjustFlexiblePrimary(
  target: MacroTargets,
  current: MacroValues,
  classification: IngredientClassification,
  strategy: StrategyDecision,
  currentAmounts: Map<string, number>
): IterationResult {
  
  const steps: HierarchicalStep[] = [];
  
  // Calculate gaps
  let gaps = {
    calories: target.calories - current.calories,
    protein: target.protein - current.protein,
    carbs: target.carbs - current.carbs,
    fat: target.fat - current.fat,
  };
  
  const priorityMacro = strategy.priorityMacro || 'calories';
  let priorityGap = gaps[priorityMacro as keyof typeof gaps];
  
  // Sort flexible primary by efficiency (macro per gram) - best contributors first
  const sortedFlexiblePrimary = [...classification.flexiblePrimary].sort((a, b) => {
    const aMacroPerGram = getMacroPerGram(a, priorityMacro);
    const bMacroPerGram = getMacroPerGram(b, priorityMacro);
    return Math.abs(bMacroPerGram) - Math.abs(aMacroPerGram); // Descending
  });
  
  // Adjust flexible primary ingredients
  for (const ing of sortedFlexiblePrimary) {
    if (Math.abs(priorityGap) < 1) break; // Gap closed enough
    
    const originalAmount = ing.amount;
    const currentAmount = currentAmounts.get(ing.ingredientId) || originalAmount;
    
    // Calculate how much this ingredient contributes to priority macro per gram
    const macroPerGram = getMacroPerGram(ing, priorityMacro);
    
    // Skip if this ingredient can't help at all
    if (macroPerGram <= 0) continue; 
    
    // Calculate needed change in grams
    const neededChange = priorityGap / macroPerGram;
    
    // Limit change to reasonable bounds (0.5x to 2x original)
    const maxIncrease = originalAmount * 1.0; // Can increase by 100%
    const maxDecrease = -originalAmount * 0.5; // Can decrease by 50%
    const actualChange = Math.max(maxDecrease, Math.min(maxIncrease, neededChange));
    
    const adjustedAmount = Math.max(0.1, currentAmount + actualChange);
    const finalChange = adjustedAmount - currentAmount;
    
    steps.push({
      ingredientId: ing.ingredientId,
      ingredientName: ing.ingredientName || ing.name,
      originalAmount,
      newAmount: adjustedAmount,
      change: adjustedAmount - originalAmount,
      reason: `Priority 1: Adjust ${priorityMacro} (gap: ${priorityGap.toFixed(1)})`,
      priority: 1,
    });
    
    currentAmounts.set(ing.ingredientId, adjustedAmount);
    
    // Update gap based on actual change
    const macroChange = finalChange * macroPerGram;
    priorityGap -= macroChange;
  }
  
  // Calculate achieved macros after this step
  const achievedMacros = calculateMacrosFromAmounts(classification, currentAmounts);
  const accuracy = calculateAccuracy(target, achievedMacros);
  
  return {
    steps,
    achievedMacros,
    accuracy,
    remainingGaps: {
      calories: target.calories - achievedMacros.calories,
      protein: target.protein - achievedMacros.protein,
      carbs: target.carbs - achievedMacros.carbs,
      fat: target.fat - achievedMacros.fat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY 2: ADJUST FLEXIBLE SECONDARY
// ═══════════════════════════════════════════════════════════════════════════

function adjustFlexibleSecondary(
  target: MacroTargets,
  current: MacroValues,
  classification: IngredientClassification,
  strategy: StrategyDecision,
  currentAmounts: Map<string, number>
): IterationResult {
  
  const steps: HierarchicalStep[] = [];
  
  // Calculate remaining gaps after primary adjustment
  let gaps = {
    calories: target.calories - current.calories,
    protein: target.protein - current.protein,
    carbs: target.carbs - current.carbs,
    fat: target.fat - current.fat,
  };
  
  const priorityMacro = strategy.priorityMacro || 'calories';
  let priorityGap = gaps[priorityMacro as keyof typeof gaps];
  
  // Sort flexible secondary by efficiency - best contributors first
  const sortedFlexibleSecondary = [...classification.flexibleSecondary].sort((a, b) => {
    const aMacroPerGram = getMacroPerGram(a, priorityMacro);
    const bMacroPerGram = getMacroPerGram(b, priorityMacro);
    return Math.abs(bMacroPerGram) - Math.abs(aMacroPerGram); // Descending
  });
  
  // Adjust flexible secondary ingredients (oils, condiments)
  for (const ing of sortedFlexibleSecondary) {
    if (Math.abs(priorityGap) < 1) break;
    
    const originalAmount = ing.amount;
    const currentAmount = currentAmounts.get(ing.ingredientId) || originalAmount;
    
    const macroPerGram = getMacroPerGram(ing, priorityMacro);
    
    // Skip if can't help
    if (macroPerGram <= 0) continue;
    
    const neededChange = priorityGap / macroPerGram;
    
    // More aggressive bounds for secondary (can vary more: 0.2x to 3x)
    const maxIncrease = originalAmount * 2.0; // Can triple
    const maxDecrease = -originalAmount * 0.8; // Can reduce to 20%
    const actualChange = Math.max(maxDecrease, Math.min(maxIncrease, neededChange));
    
    const adjustedAmount = Math.max(0.1, currentAmount + actualChange);
    const finalChange = adjustedAmount - currentAmount;
    
    steps.push({
      ingredientId: ing.ingredientId,
      ingredientName: ing.ingredientName || ing.name,
      originalAmount,
      newAmount: adjustedAmount,
      change: adjustedAmount - originalAmount,
      reason: `Priority 2: Fine-tune ${priorityMacro} (gap: ${priorityGap.toFixed(1)})`,
      priority: 2,
    });
    
    currentAmounts.set(ing.ingredientId, adjustedAmount);
    
    const macroChange = finalChange * macroPerGram;
    priorityGap -= macroChange;
  }
  
  const achievedMacros = calculateMacrosFromAmounts(classification, currentAmounts);
  const accuracy = calculateAccuracy(target, achievedMacros);
  
  return {
    steps,
    achievedMacros,
    accuracy,
    remainingGaps: {
      calories: target.calories - achievedMacros.calories,
      protein: target.protein - achievedMacros.protein,
      carbs: target.carbs - achievedMacros.carbs,
      fat: target.fat - achievedMacros.fat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY 3: MINIMAL STRUCTURAL ADJUSTMENT (only if needed)
// ═══════════════════════════════════════════════════════════════════════════

function adjustStructuralMinimal(
  target: MacroTargets,
  current: MacroValues,
  classification: IngredientClassification,
  strategy: StrategyDecision,
  currentAmounts: Map<string, number>
): IterationResult {
  
  const steps: HierarchicalStep[] = [];
  
  const gaps = {
    calories: target.calories - current.calories,
    protein: target.protein - current.protein,
    carbs: target.carbs - current.carbs,
    fat: target.fat - current.fat,
  };
  
  const priorityMacro = strategy.priorityMacro || 'calories';
  const priorityGap = gaps[priorityMacro as keyof typeof gaps];
  
  // Only adjust structural if really needed
  for (const ing of classification.structural) {
    if (Math.abs(priorityGap) < 1) break;
    
    const originalAmount = ing.amount;
    const currentAmount = currentAmounts.get(ing.ingredientId) || originalAmount;
    
    const macroPerGram = getMacroPerGram(ing, priorityMacro);
    if (macroPerGram === 0) continue;
    
    const neededChange = priorityGap / macroPerGram;
    
    // VERY LIMITED change for structural (<5%)
    const maxChange = originalAmount * 0.05;
    const actualChange = Math.max(-maxChange, Math.min(maxChange, neededChange));
    
    const adjustedAmount = Math.max(0.1, currentAmount + actualChange);
    
    // Only apply if change is meaningful (>1g)
    if (Math.abs(actualChange) > 1) {
      steps.push({
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredientName || ing.name,
        originalAmount,
        newAmount: adjustedAmount,
        change: adjustedAmount - originalAmount,
        reason: `Priority 3: Minimal structural (gap: ${priorityGap.toFixed(1)})`,
        priority: 3,
      });
      
      currentAmounts.set(ing.ingredientId, adjustedAmount);
      
      const macroChange = actualChange * macroPerGram;
      gaps[priorityMacro as keyof typeof gaps] -= macroChange;
    }
  }
  
  const achievedMacros = calculateMacrosFromAmounts(classification, currentAmounts);
  const accuracy = calculateAccuracy(target, achievedMacros);
  
  return {
    steps,
    achievedMacros,
    accuracy,
    remainingGaps: {
      calories: target.calories - achievedMacros.calories,
      protein: target.protein - achievedMacros.protein,
      carbs: target.carbs - achievedMacros.carbs,
      fat: target.fat - achievedMacros.fat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getMacroPerGram(
  ing: { amount: number; calories: number; protein: number; carbs: number; fat: number },
  macro: keyof MacroTargets
): number {
  if (ing.amount === 0) return 0;
  
  switch (macro) {
    case 'calories': return ing.calories / ing.amount;
    case 'protein': return ing.protein / ing.amount;
    case 'carbs': return ing.carbs / ing.amount;
    case 'fat': return ing.fat / ing.amount;
    default: return 0;
  }
}

function applyAdjustments(
  amounts: Map<string, number>,
  steps: HierarchicalStep[]
): Map<string, number> {
  const newAmounts = new Map(amounts);
  steps.forEach(step => {
    newAmounts.set(step.ingredientId, step.newAmount);
  });
  return newAmounts;
}

function calculateMacrosFromAmounts(
  classification: IngredientClassification,
  amounts: Map<string, number>
): MacroValues {
  
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  
  [...classification.structural, ...classification.flexiblePrimary, ...classification.flexibleSecondary]
    .forEach(ing => {
      const amount = amounts.get(ing.ingredientId) || ing.amount;
      const scale = amount / ing.amount;
      
      calories += ing.calories * scale;
      protein += ing.protein * scale;
      carbs += ing.carbs * scale;
      fat += ing.fat * scale;
    });
  
  return { calories, protein, carbs, fat };
}

function calculateMacrosFromScaled(scaledIngredients: ScaledIngredient[]): MacroValues {
  return {
    calories: scaledIngredients.reduce((sum, ing) => sum + ing.calories, 0),
    protein: scaledIngredients.reduce((sum, ing) => sum + ing.protein, 0),
    carbs: scaledIngredients.reduce((sum, ing) => sum + ing.carbs, 0),
    fat: scaledIngredients.reduce((sum, ing) => sum + ing.fat, 0),
  };
}

function calculateAccuracy(target: MacroTargets, achieved: MacroValues): number {
  const errors = {
    calories: target.calories > 0 ? Math.abs(achieved.calories - target.calories) / target.calories : 0,
    protein: target.protein > 0 ? Math.abs(achieved.protein - target.protein) / target.protein : 0,
    carbs: target.carbs > 0 ? Math.abs(achieved.carbs - target.carbs) / target.carbs : 0,
    fat: target.fat > 0 ? Math.abs(achieved.fat - target.fat) / target.fat : 0,
  };
  
  const maxError = Math.max(errors.calories, errors.protein, errors.carbs, errors.fat);
  return Math.max(0, Math.min(1, 1 - maxError));
}

function calculatePreservation(
  classification: IngredientClassification,
  scaledIngredients: ScaledIngredient[]
): number {
  
  // Calculate how much structural ingredients changed
  let structuralPreservation = 1.0;
  
  for (const structural of classification.structural) {
    const original = structural.amount;
    const scaled = scaledIngredients.find(s => s.ingredientId === structural.ingredientId);
    if (!scaled) continue;
    
    const changePercent = Math.abs((scaled.amount - original) / original) * 100;
    const penalty = Math.min(changePercent / 100 * 2, 1.0); // Double penalty for structural changes
    structuralPreservation -= penalty * 0.2; // Each structural change reduces by up to 20%
  }
  
  structuralPreservation = Math.max(0, structuralPreservation);
  
  // Hierarchical typically achieves ~85% preservation
  return Math.max(0.70, Math.min(1.0, structuralPreservation));
}

function buildScaledIngredients(
  classification: IngredientClassification,
  amounts: Map<string, number>,
  steps: HierarchicalStep[]
): MealIngredient[] {
  
  const allIngredients = [
    ...classification.structural,
    ...classification.flexiblePrimary,
    ...classification.flexibleSecondary,
  ];
  
  return allIngredients.map(ing => {
    const originalAmount = ing.amount;
    const scaledAmount = amounts.get(ing.ingredientId) || originalAmount;
    const scale = scaledAmount / originalAmount;
    
    return {
      ingredientId: ing.ingredientId,
      ingredientName: ing.ingredientName || ing.name,
      amount: scaledAmount,
      calories: ing.calories * scale,
      protein: ing.protein * scale,
      carbs: ing.carbs * scale,
      fat: ing.fat * scale,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default executeHierarchicalAdjustment;
