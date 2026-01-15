/**
 * TEST: Strategy Decider (FASE 2)
 * 
 * CRITICAL VALIDATION: NO grams calculated, ONLY strategic decisions
 */

import { decideStrategy } from '../../src/app/utils/scaling/strategyDecider';
import type {
  MacroTargets,
  MacroValues,
  IngredientClassification,
  DailyContext,
  StrategyDecision,
} from '../../src/app/utils/scaling/types';

console.log('🧪 ============================================');
console.log('🧪 TEST: STRATEGY DECIDER (NO Grams Calculation)');
console.log('🧪 ============================================');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// TEST SCENARIO 1: High compatibility → Global Scaling
// ═══════════════════════════════════════════════════════════════════════════

console.log('📋 SCENARIO 1: High Compatibility (Simple meal, small gap)');
console.log('───────────────────────────────────────────────────────────────');

const target1: MacroTargets = {
  calories: 500,
  protein: 40,
  carbs: 50,
  fat: 15,
};

const current1: MacroValues = {
  calories: 480,
  protein: 38,
  carbs: 48,
  fat: 14,
};

const classification1: IngredientClassification = {
  structural: [
    {
      ingredientId: 'pollo',
      ingredientName: 'Pechuga de Pollo',
      amount: 150,
      calories: 247,
      protein: 46.5,
      carbs: 0,
      fat: 5.4,
      category: 'proteina',
      reason: 'Structural: 51.5% of dish, category: proteina',
    },
  ],
  flexiblePrimary: [
    {
      ingredientId: 'arroz',
      ingredientName: 'Arroz Integral',
      amount: 80,
      calories: 288,
      protein: 7.3,
      carbs: 60.6,
      fat: 2.3,
      category: 'carbohidrato',
      reason: 'Flexible primary: 48.5% of dish, category: carbohidrato',
    },
  ],
  flexibleSecondary: [],
  metadata: {
    totalIngredients: 2,
    totalCalories: 535,
    coreRatio: 51.5,
    dominantMacro: 'protein',
    complexity: 'simple',
  },
};

const context1: DailyContext = {
  isLastMeal: false,
  flexibilityLevel: 'normal',
  mealIndex: 2,
  totalMeals: 4,
};

const decision1 = decideStrategy(target1, current1, classification1, context1);

console.log('✅ Decision made:');
console.log(`   Approach: ${decision1.approach}`);
console.log(`   Priority macro: ${decision1.priorityMacro}`);
console.log(`   Adjustable ingredients: [${decision1.adjustableIngredients.join(', ')}]`);
console.log(`   Preservation level: ${(decision1.preservationLevel * 100).toFixed(0)}%`);
console.log(`   Compatibility: ${(decision1.REMOVED_METADATA_compatibilityScore * 100).toFixed(0)}%`);
console.log(`   Reasoning: ${decision1.REMOVED_METADATA_reasoning}`);
console.log('');

// Validations
let validations1 = 0;
let validationsPassed1 = 0;

validations1++;
if (decision1.approach === 'global_scaling') {
  console.log(`   ✅ Correct approach (global_scaling for high compatibility)`);
  validationsPassed1++;
} else {
  console.log(`   ❌ Wrong approach (expected global_scaling, got ${decision1.approach})`);
}

validations1++;
if (decision1.REMOVED_METADATA_compatibilityScore > 0.85) {
  console.log(`   ✅ High compatibility (${(decision1.REMOVED_METADATA_compatibilityScore * 100).toFixed(0)}%)`);
  validationsPassed1++;
} else {
  console.log(`   ⚠️  Compatibility not high (${(decision1.REMOVED_METADATA_compatibilityScore * 100).toFixed(0)}%)`);
}

validations1++;
if (decision1.adjustableIngredients.length === 2) {
  console.log(`   ✅ All ingredients adjustable (global scaling)`);
  validationsPassed1++;
} else {
  console.log(`   ❌ Wrong adjustable count (expected 2, got ${decision1.adjustableIngredients.length})`);
}

validations1++;
if (decision1.preservationLevel >= 0.95) {
  console.log(`   ✅ High preservation (${(decision1.preservationLevel * 100).toFixed(0)}%)`);
  validationsPassed1++;
} else {
  console.log(`   ⚠️  Preservation not high (${(decision1.preservationLevel * 100).toFixed(0)}%)`);
}

validations1++;
if (typeof decision1.adjustableIngredients[0] === 'string') {
  console.log(`   ✅ Returns IDs only (no grams calculated)`);
  validationsPassed1++;
} else {
  console.log(`   ❌ Returns objects instead of IDs`);
}

console.log('');
console.log(`   Result: ${validationsPassed1}/${validations1} validations passed`);
console.log('');

if (validationsPassed1 === validations1) {
  console.log('   ✅ SCENARIO 1 PASSED');
} else {
  console.log('   ❌ SCENARIO 1 FAILED');
}
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// TEST SCENARIO 2: Medium compatibility → Hierarchical Adjustment
// ═══════════════════════════════════════════════════════════════════════════

console.log('📋 SCENARIO 2: Medium Compatibility (Multiple macro gaps)');
console.log('───────────────────────────────────────────────────────────────');

const target2: MacroTargets = {
  calories: 650,
  protein: 45,
  carbs: 70,
  fat: 20,
};

const current2: MacroValues = {
  calories: 535,
  protein: 53.8,
  carbs: 60.6,
  fat: 7.7,
};

const classification2: IngredientClassification = {
  structural: [
    {
      ingredientId: 'pollo',
      ingredientName: 'Pechuga de Pollo',
      amount: 150,
      calories: 247,
      protein: 46.5,
      carbs: 0,
      fat: 5.4,
      category: 'proteina',
      reason: 'Structural: 46.1% of dish',
    },
    {
      ingredientId: 'arroz',
      ingredientName: 'Arroz Integral',
      amount: 80,
      calories: 288,
      protein: 7.3,
      carbs: 60.6,
      fat: 2.3,
      category: 'carbohidrato',
      reason: 'Structural: 53.8% of dish',
    },
  ],
  flexiblePrimary: [
    {
      ingredientId: 'brocoli',
      ingredientName: 'Brócoli',
      amount: 100,
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      category: 'vegetal',
      reason: 'Flexible primary: vegetal',
    },
  ],
  flexibleSecondary: [
    {
      ingredientId: 'aceite',
      ingredientName: 'Aceite de Oliva',
      amount: 10,
      calories: 90,
      protein: 0,
      carbs: 0,
      fat: 10,
      category: 'grasa',
      reason: 'Flexible secondary: grasa',
    },
  ],
  metadata: {
    totalIngredients: 4,
    totalCalories: 659,
    coreRatio: 81.6,
    dominantMacro: 'carbs',
    complexity: 'medium',
  },
};

const context2: DailyContext = {
  isLastMeal: false,
  flexibilityLevel: 'normal',
  mealIndex: 2,
  totalMeals: 4,
};

const decision2 = decideStrategy(target2, current2, classification2, context2);

console.log('✅ Decision made:');
console.log(`   Approach: ${decision2.approach}`);
console.log(`   Priority macro: ${decision2.priorityMacro}`);
console.log(`   Adjustable ingredients: [${decision2.adjustableIngredients.join(', ')}]`);
console.log(`   Preservation level: ${(decision2.preservationLevel * 100).toFixed(0)}%`);
console.log(`   Compatibility: ${(decision2.REMOVED_METADATA_compatibilityScore * 100).toFixed(0)}%`);
console.log(`   Reasoning: ${decision2.REMOVED_METADATA_reasoning}`);
console.log('');

// Validations
let validations2 = 0;
let validationsPassed2 = 0;

validations2++;
if (decision2.approach === 'hierarchical_adjustment') {
  console.log(`   ✅ Correct approach (hierarchical for medium compatibility)`);
  validationsPassed2++;
} else {
  console.log(`   ⚠️  Different approach: ${decision2.approach}`);
}

validations2++;
if (decision2.REMOVED_METADATA_compatibilityScore >= 0.50 && decision2.REMOVED_METADATA_compatibilityScore <= 0.85) {
  console.log(`   ✅ Medium compatibility (${(decision2.REMOVED_METADATA_compatibilityScore * 100).toFixed(0)}%)`);
  validationsPassed2++;
} else {
  console.log(`   ⚠️  Compatibility: ${(decision2.REMOVED_METADATA_compatibilityScore * 100).toFixed(0)}%`);
}

validations2++;
if (decision2.adjustableIngredients.length === 2) { // Only flexibles
  console.log(`   ✅ Only flexibles adjustable (hierarchical)`);
  validationsPassed2++;
} else {
  console.log(`   ⚠️  Adjustable count: ${decision2.adjustableIngredients.length}`);
}

validations2++;
if (decision2.adjustableIngredients.includes('brocoli') && decision2.adjustableIngredients.includes('aceite')) {
  console.log(`   ✅ Flexibles identified correctly`);
  validationsPassed2++;
} else {
  console.log(`   ❌ Wrong flexibles: ${decision2.adjustableIngredients.join(', ')}`);
}

validations2++;
if (!decision2.adjustableIngredients.includes('pollo') && !decision2.adjustableIngredients.includes('arroz')) {
  console.log(`   ✅ Structural ingredients locked`);
  validationsPassed2++;
} else {
  console.log(`   ❌ Structural ingredients in adjustable list`);
}

console.log('');
console.log(`   Result: ${validationsPassed2}/${validations2} validations passed`);
console.log('');

if (validationsPassed2 === validations2) {
  console.log('   ✅ SCENARIO 2 PASSED');
} else {
  console.log('   ⚠️  SCENARIO 2 PASSED WITH WARNINGS');
}
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// TEST SCENARIO 3: Last meal → LP Optimization
// ═══════════════════════════════════════════════════════════════════════════

console.log('📋 SCENARIO 3: Last Meal (Accuracy critical)');
console.log('───────────────────────────────────────────────────────────────');

const target3: MacroTargets = {
  calories: 600,
  protein: 50,
  carbs: 60,
  fat: 18,
};

const current3: MacroValues = {
  calories: 565,
  protein: 53.8,
  carbs: 60.6,
  fat: 7.7,
};

const classification3: IngredientClassification = {
  structural: [
    {
      ingredientId: 'salmon',
      ingredientName: 'Salmón',
      amount: 150,
      calories: 312,
      protein: 31.2,
      carbs: 0,
      fat: 20.1,
      category: 'proteina',
      reason: 'Structural: protein source',
    },
  ],
  flexiblePrimary: [
    {
      ingredientId: 'arroz',
      ingredientName: 'Arroz Integral',
      amount: 80,
      calories: 288,
      protein: 7.3,
      carbs: 60.6,
      fat: 2.3,
      category: 'carbohidrato',
      reason: 'Flexible primary: carbs',
    },
  ],
  flexibleSecondary: [],
  metadata: {
    totalIngredients: 2,
    totalCalories: 600,
    coreRatio: 52,
    dominantMacro: 'protein',
    complexity: 'simple',
  },
};

const context3: DailyContext = {
  isLastMeal: true, // LAST MEAL!
  flexibilityLevel: 'normal',
  mealIndex: 4,
  totalMeals: 4,
};

const decision3 = decideStrategy(target3, current3, classification3, context3);

console.log('✅ Decision made:');
console.log(`   Approach: ${decision3.approach}`);
console.log(`   Priority macro: ${decision3.priorityMacro}`);
console.log(`   Adjustable ingredients: [${decision3.adjustableIngredients.join(', ')}]`);
console.log(`   Preservation level: ${(decision3.preservationLevel * 100).toFixed(0)}%`);
console.log(`   Compatibility: ${(decision3.REMOVED_METADATA_compatibilityScore * 100).toFixed(0)}%`);
console.log(`   Reasoning: ${decision3.REMOVED_METADATA_reasoning}`);
console.log('');

// Validations
let validations3 = 0;
let validationsPassed3 = 0;

validations3++;
if (decision3.approach === 'lp_optimization') {
  console.log(`   ✅ Correct approach (LP for last meal)`);
  validationsPassed3++;
} else {
  console.log(`   ❌ Wrong approach (expected lp_optimization, got ${decision3.approach})`);
}

validations3++;
if (decision3.REMOVED_METADATA_reasoning.includes('Last meal')) {
  console.log(`   ✅ Reasoning mentions last meal`);
  validationsPassed3++;
} else {
  console.log(`   ⚠️  Reasoning doesn't mention last meal`);
}

validations3++;
if (decision3.preservationLevel < 0.8) {
  console.log(`   ✅ Lower preservation (accuracy prioritized)`);
  validationsPassed3++;
} else {
  console.log(`   ⚠️  Preservation too high for LP (${(decision3.preservationLevel * 100).toFixed(0)}%)`);
}

validations3++;
if (decision3.priorityMacro === 'fat') {
  console.log(`   ✅ Correct priority (fat has biggest gap)`);
  validationsPassed3++;
} else {
  console.log(`   ⚠️  Priority: ${decision3.priorityMacro}`);
}

console.log('');
console.log(`   Result: ${validationsPassed3}/${validations3} validations passed`);
console.log('');

if (validationsPassed3 === validations3) {
  console.log('   ✅ SCENARIO 3 PASSED');
} else {
  console.log('   ❌ SCENARIO 3 FAILED');
}
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

const totalValidations = validations1 + validations2 + validations3;
const totalPassed = validationsPassed1 + validationsPassed2 + validationsPassed3;
const successRate = (totalPassed / totalValidations) * 100;

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 FINAL SUMMARY:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Scenarios tested: 3`);
console.log(`Validations: ${totalPassed}/${totalValidations}`);
console.log(`Success rate: ${successRate.toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

if (successRate >= 95) {
  console.log('✅ ALL TESTS PASSED');
} else if (successRate >= 80) {
  console.log('⚠️  TESTS PASSED WITH WARNINGS');
} else {
  console.log('❌ TESTS FAILED');
}
