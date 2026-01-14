/**
 * ============================================================================
 * FUELIER AI ENGINE v2.0
 * ============================================================================
 * 
 * Sistema de adaptación inteligente de comidas con precisión máxima (≥90%)
 * 
 * Arquitectura: 8 Módulos Especializados
 * 1. Daily Context Manager - Contexto diario del usuario
 * 2. Strategy AI Enhanced - Decisiones inteligentes con ingredientes añadibles
 * 3. Confidence Filter - Pre-filtrado de platos no viables (<85%)
 * 4. Plate Adaptation Engine - Clasificación y tolerancias por tipo de plato
 * 5. Hybrid Solver - LP/MIP (global) + Least Squares (refinamiento)
 * 6. Hard Rules - Validación de restricciones físicas
 * 7. Verification Reinforced - Verificación con tolerancias flexibles
 * 8. Orchestrator - Coordinación inteligente con memoria
 * 
 * @version 2.0
 * @author FUELIER Staff Engineering Team
 * @date 2026-01-13
 */

/**
 * Obtiene la cantidad mínima inteligente para un ingrediente según su categoría
 */
function getSmartMinimumAmount(ingredient: any): number {
  const category = ingredient.category?.toLowerCase() || '';
  
  // Cantidades mínimas prácticas por categoría (en gramos)
  if (category.includes('proteina')) return 15; // Mín 15g proteína
  if (category.includes('carbohidrato') || category.includes('cereal')) return 10; // Mín 10g carbos
  if (category.includes('grasa') || category.includes('aceite')) return 2; // Mín 2g grasas
  if (category.includes('vegetal') || category.includes('verdura')) return 20; // Mín 20g verduras
  if (category.includes('fruta')) return 30; // Mín 30g frutas
  if (category.includes('lacteo')) return 25; // Mín 25g lácteos
  if (category.includes('legumbre')) return 15; // Mín 15g legumbres
  if (category.includes('condimento') || category.includes('especia')) return 0.5; // Condimentos pueden ser pequeños
  
  // Por defecto: 5g para ingredientes no categorizados
  return 5;
}

import { Meal, User, DailyLog, MealIngredient } from '@/types';
import { Ingredient } from '../../data/ingredientTypes';
import solver from 'javascript-lp-solver';

// Helper local: Calcular macros directamente de MealIngredient[] (sin necesitar allIngredients)
function calculateMacrosFromIngredients(ingredients: MealIngredient[]): MacroValues {
  return ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroValues extends MacroTargets {}

interface DailyContext {
  remainingMacros: MacroTargets;
  percentageOfDay: number;
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  userGoals: MacroTargets;
  flexibilityLevel: 'strict' | 'moderate' | 'flexible';
}

type PlateType = 
  | 'sweet_breakfast'      // Pancakes, cereales, etc.
  | 'savory_breakfast'     // Huevos, tostadas saladas
  | 'protein_focused'      // Alto en proteína
  | 'carb_focused'         // Alto en carbohidratos
  | 'balanced'             // Equilibrado
  | 'snack'                // Snack ligero
  | 'dessert';             // Postre

interface PlateClassification {
  type: PlateType;
  macroProfile: {
    proteinPercentage: number;  // % de calorías de proteína
    carbsPercentage: number;     // % de calorías de carbohidratos
    fatPercentage: number;       // % de calorías de grasa
  };
  tolerances: {
    calories: number;    // % tolerancia (ej: 5 = ±5%)
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface StrategyDecision {
  priorityMacro: 'calories' | 'protein' | 'carbs' | 'fat';
  rankedIngredients: Array<{
    id: string;
    name: string;
    rank: number;
    reason: string;
  }>;
  aggressiveness: number; // 0.5-1.0
  addableIngredients?: Array<{
    id: string;
    name: string;
    suggestedGrams: number;
    reason: string;
  }>;
  reason: string;
}

interface ConfidenceScore {
  feasible: boolean;
  confidence: number; // 0-100%
  reasons: string[];
  estimatedAccuracy: number; // Predicción de accuracy final
}

interface HybridSolution {
  scaledIngredients: MealIngredient[];
  achievedMacros: MacroValues;
  accuracy: number;
  method: 'lp' | 'lp+ls' | 'ls_only' | 'proportional_fallback';
  iterations: number;
  reason: string;
}

interface VerificationResult {
  approved: boolean;
  accuracy: number;
  meetsTolerances: boolean;
  violations: string[];
  suggestions: string[];
}

interface OrchestrationMemory {
  attemptNumber: number;
  bestSolution: HybridSolution | null;
  strategyHistory: StrategyDecision[];
  accuracyHistory: number[];
  stagnationCounter: number;
}

// ============================================================================
// MODULE 1: DAILY CONTEXT MANAGER
// ============================================================================

function getDailyContext(
  user: User,
  dailyLog: DailyLog | null,
  mealTimestamp: Date = new Date()
): DailyContext {
  const userGoals: MacroTargets = {
    calories: user.targetCalories || 2000,
    protein: user.targetProtein || 150,
    carbs: user.targetCarbs || 200,
    fat: user.targetFat || 60,
  };

  let consumedToday: MacroValues = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  if (dailyLog?.meals) {
    dailyLog.meals.forEach((meal) => {
      if (meal.ingredients) {
        const macros = calculateMacrosFromIngredients(meal.ingredients);
        consumedToday.calories += macros.calories;
        consumedToday.protein += macros.protein;
        consumedToday.carbs += macros.carbs;
        consumedToday.fat += macros.fat;
      }
    });
  }

  const remaining: MacroTargets = {
    calories: Math.max(0, userGoals.calories - consumedToday.calories),
    protein: Math.max(0, userGoals.protein - consumedToday.protein),
    carbs: Math.max(0, userGoals.carbs - consumedToday.carbs),
    fat: Math.max(0, userGoals.fat - consumedToday.fat),
  };

  const percentageRemaining = 
    userGoals.calories > 0 ? (remaining.calories / userGoals.calories) * 100 : 0;

  // Determinar momento del día
  const hour = mealTimestamp.getHours();
  let timeOfDay: DailyContext['timeOfDay'] = 'snack';
  if (hour >= 6 && hour < 11) timeOfDay = 'breakfast';
  else if (hour >= 12 && hour < 16) timeOfDay = 'lunch';
  else if (hour >= 19 && hour < 23) timeOfDay = 'dinner';

  // Flexibilidad según % restante
  let flexibilityLevel: DailyContext['flexibilityLevel'] = 'moderate';
  if (percentageRemaining > 60) flexibilityLevel = 'flexible';
  else if (percentageRemaining < 30) flexibilityLevel = 'strict';

  return {
    remainingMacros: remaining,
    percentageOfDay: percentageRemaining,
    timeOfDay,
    userGoals,
    flexibilityLevel,
  };
}

// ============================================================================
// MODULE 2: STRATEGY AI ENHANCED
// ============================================================================

function decideStrategy(
  currentMacros: MacroValues,
  targetMacros: MacroTargets,
  ingredients: MealIngredient[],
  context: DailyContext,
  iteration: number
): StrategyDecision {
  const gaps = {
    calories: targetMacros.calories - currentMacros.calories,
    protein: targetMacros.protein - currentMacros.protein,
    carbs: targetMacros.carbs - currentMacros.carbs,
    fat: targetMacros.fat - currentMacros.fat,
  };

  // Identificar macro prioritario (mayor gap relativo)
  const relativeGaps = {
    calories: Math.abs(gaps.calories) / targetMacros.calories,
    protein: targetMacros.protein > 0 ? Math.abs(gaps.protein) / targetMacros.protein : 0,
    carbs: targetMacros.carbs > 0 ? Math.abs(gaps.carbs) / targetMacros.carbs : 0,
    fat: targetMacros.fat > 0 ? Math.abs(gaps.fat) / targetMacros.fat : 0,
  };

  const priorityMacro = Object.keys(relativeGaps).reduce((a, b) =>
    relativeGaps[a as keyof typeof relativeGaps] > relativeGaps[b as keyof typeof relativeGaps] ? a : b
  ) as keyof MacroTargets;

  // Rankear ingredientes por impacto en macro prioritario
  const rankedIngredients = ingredients
    .map((ing) => {
      const macros = {
        calories: ing.calories || 0,
        protein: ing.protein || 0,
        carbs: ing.carbs || 0,
        fat: ing.fat || 0,
      };

      // Impacto = cantidad del macro prioritario por gramo
      const impact = macros[priorityMacro] / Math.max(ing.amount, 1);
      
      // Eficiencia = impacto en prioritario vs impacto en otros
      const otherMacros = Object.keys(macros).filter(k => k !== priorityMacro) as Array<keyof MacroValues>;
      const sideEffects = otherMacros.reduce((sum, m) => sum + Math.abs(macros[m]), 0);
      const efficiency = sideEffects > 0 ? impact / sideEffects : impact;

      return {
        id: ing.ingredientId,
        name: ing.ingredientName,
        rank: efficiency,
        reason: `${priorityMacro}: ${macros[priorityMacro].toFixed(1)} (impact: ${impact.toFixed(3)})`,
      };
    })
    .sort((a, b) => b.rank - a.rank);

  // Agresividad basada en iteración y flexibilidad
  // INCREMENTADA para escalar ingredientes existentes sin añadir externos
  let aggressiveness = 1.2; // Aumentado de 0.75 a 1.2 para escalado más agresivo
  if (context.flexibilityLevel === 'strict') aggressiveness = 1.5;
  else if (context.flexibilityLevel === 'flexible') aggressiveness = 0.9;
  
  // Aumentar agresividad con iteraciones (más agresivo)
  aggressiveness = Math.min(2.0, aggressiveness + iteration * 0.1);

  // DESHABILITADO: No añadir ingredientes estratégicos externos
  // El AI Engine debe escalar SOLO los ingredientes existentes del plato
  const addableIngredients: StrategyDecision['addableIngredients'] = [];
  
  // DESHABILITADO: La lógica de añadir ingredientes estratégicos está comentada
  // para mantener la integridad de las recetas originales
  
  /* DESHABILITADO: No añadir ingredientes externos
  // Ingredientes añadibles disponibles con sus macros per 100g
  // ⚠️ IDs deben coincidir con INGREDIENTS_DATABASE (kebab-case)
  const strategicIngredients = [
    { id: 'clara-huevo', name: 'Clara de Huevo', protein: 11, carbs: 0.7, fat: 0.2, calories: 52 },
    { id: 'proteina-whey', name: 'Proteína Whey', protein: 80, carbs: 8, fat: 6, calories: 400 },
    { id: 'avena', name: 'Avena', protein: 17, carbs: 66, fat: 7, calories: 389 },
    { id: 'platano', name: 'Plátano', protein: 1.1, carbs: 23, fat: 0.3, calories: 89 },
    { id: 'almendras', name: 'Almendras', protein: 21, carbs: 22, fat: 50, calories: 579 },
  ];
  
  // Si faltan proteínas (>3g O <85% del target) - UMBRAL MUY BAJO
  if ((gaps.protein > 3 || currentMacros.protein < targetMacros.protein * 0.85) && gaps.protein > 0) {
    const proteinGap = gaps.protein;
    // Calcular gramos óptimos de clara de huevo (11g proteína per 100g)
    const claraGrams = Math.min(200, Math.max(20, (proteinGap / 0.11))); // Min 20g, Max 200g
    addableIngredients.push({
      id: 'clara-huevo', // Clara de Huevo (INGREDIENTS_DATABASE kebab-case)
      name: 'Clara de Huevo',
      suggestedGrams: Math.round(claraGrams),
      reason: `Añadir ${Math.round(claraGrams)}g clara (+${(claraGrams * 0.11).toFixed(1)}g proteína, mínima grasa)`,
    });
  }
  
  // Si faltan carbos (>5g O <85% del target)
  if ((gaps.carbs > 5 || currentMacros.carbs < targetMacros.carbs * 0.85) && gaps.carbs > 0) {
    const carbGap = gaps.carbs;
    // Calcular gramos óptimos de avena (66g carbos per 100g - actualizado)
    const avenaGrams = Math.min(60, Math.max(15, (carbGap / 0.66))); // Min 15g, Max 60g
    addableIngredients.push({
      id: 'avena', // Avena (INGREDIENTS_DATABASE kebab-case)
      name: 'Avena',
      suggestedGrams: Math.round(avenaGrams),
      reason: `Añadir ${Math.round(avenaGrams)}g avena (+${(avenaGrams * 0.6).toFixed(1)}g carbos)`,
    });
  }
  
  // Si faltan grasas saludables (>2g O <85% del target)
  if ((gaps.fat > 2 || currentMacros.fat < targetMacros.fat * 0.85) && gaps.fat > 0) {
    const fatGap = gaps.fat;
    // Almendras: 50g grasa per 100g
    const almendraGrams = Math.min(30, Math.max(10, (fatGap / 0.5))); // Min 10g, Max 30g
    addableIngredients.push({
      id: 'almendra',
      name: 'Almendras',
      suggestedGrams: Math.round(almendraGrams),
      reason: `Añadir ${Math.round(almendraGrams)}g almendras (+${(almendraGrams * 0.5).toFixed(1)}g grasas saludables)`,
    });
  }
  FIN COMENTARIO */

  return {
    priorityMacro,
    rankedIngredients: rankedIngredients.slice(0, 5), // Top 5
    aggressiveness,
    addableIngredients: addableIngredients.length > 0 ? addableIngredients : undefined,
    reason: `Gap prioritario: ${priorityMacro} (${gaps[priorityMacro].toFixed(1)}). Flex: ${context.flexibilityLevel}`,
  };
}

// ============================================================================
// MODULE 3: CONFIDENCE FILTER
// ============================================================================

function assessConfidence(
  originalMeal: Meal,
  targetMacros: MacroTargets,
  context: DailyContext,
  mealIngredients: MealIngredient[]
): ConfidenceScore {
  const reasons: string[] = [];
  let confidence = 100;

  const originalMacros = calculateMacrosFromIngredients(mealIngredients);
  
  // Factor 1: Ratio entre target y original
  const ratios = {
    calories: targetMacros.calories / Math.max(originalMacros.calories, 1),
    protein: targetMacros.protein / Math.max(originalMacros.protein, 1),
    carbs: targetMacros.carbs / Math.max(originalMacros.carbs, 1),
    fat: targetMacros.fat / Math.max(originalMacros.fat, 1),
  };

  // Si algún ratio es muy extremo (>3x o <0.33x), penalizar
  Object.entries(ratios).forEach(([macro, ratio]) => {
    if (ratio > 3) {
      confidence -= 20;
      reasons.push(`${macro} requiere 3x+ aumento (${ratio.toFixed(1)}x)`);
    } else if (ratio < 0.33) {
      confidence -= 20;
      reasons.push(`${macro} requiere reducción a <33% (${ratio.toFixed(1)}x)`);
    }
  });

  // Factor 2: Perfil macro incompatible
  const originalProfile = {
    proteinPct: (originalMacros.protein * 4) / Math.max(originalMacros.calories, 1) * 100,
    carbsPct: (originalMacros.carbs * 4) / Math.max(originalMacros.calories, 1) * 100,
    fatPct: (originalMacros.fat * 9) / Math.max(originalMacros.calories, 1) * 100,
  };

  const targetProfile = {
    proteinPct: (targetMacros.protein * 4) / Math.max(targetMacros.calories, 1) * 100,
    carbsPct: (targetMacros.carbs * 4) / Math.max(targetMacros.calories, 1) * 100,
    fatPct: (targetMacros.fat * 9) / Math.max(targetMacros.calories, 1) * 100,
  };

  const profileDiff = Math.abs(originalProfile.proteinPct - targetProfile.proteinPct) +
                      Math.abs(originalProfile.carbsPct - targetProfile.carbsPct) +
                      Math.abs(originalProfile.fatPct - targetProfile.fatPct);

  if (profileDiff > 60) {
    confidence -= 25;
    reasons.push(`Perfil macro muy diferente (diff: ${profileDiff.toFixed(0)}%)`);
  }

  // Factor 3: Número de ingredientes (muy pocos = difícil ajustar)
  if (mealIngredients.length < 3) {
    confidence -= 15;
    reasons.push(`Pocos ingredientes (${mealIngredients.length}), difícil ajustar`);
  }

  // Factor 4: Ingredientes con macros muy desbalanceados
  const unbalancedIngredients = mealIngredients.filter(ing => {
    const total = (ing.protein || 0) + (ing.carbs || 0) + (ing.fat || 0);
    const dominance = Math.max(ing.protein || 0, ing.carbs || 0, ing.fat || 0);
    return total > 0 && (dominance / total) > 0.9; // Un macro domina >90%
  });

  if (unbalancedIngredients.length === mealIngredients.length) {
    confidence -= 10;
    reasons.push('Todos los ingredientes son muy desbalanceados');
  }

  // Estimación de accuracy basada en confianza
  const estimatedAccuracy = Math.max(50, confidence - 10);

  const feasible = confidence >= 85; // Mantener estándar alto

  if (!feasible) {
    reasons.unshift(`⚠️ PLATO NO VIABLE (confidence: ${confidence}%)`);
  }

  return {
    feasible,
    confidence,
    reasons,
    estimatedAccuracy,
  };
}

// ============================================================================
// MODULE 4: PLATE ADAPTATION ENGINE
// ============================================================================

function classifyPlate(meal: Meal, macros: MacroValues, mealIngredients: MealIngredient[]): PlateClassification {
  const totalCals = Math.max(macros.calories, 1);
  const proteinPct = (macros.protein * 4) / totalCals * 100;
  const carbsPct = (macros.carbs * 4) / totalCals * 100;
  const fatPct = (macros.fat * 9) / totalCals * 100;

  let type: PlateType = 'balanced';
  let tolerances = { calories: 3, protein: 5, carbs: 5, fat: 5 }; // Default

  // Clasificación basada en perfil macro
  if (proteinPct > 35) {
    type = 'protein_focused';
    tolerances = { calories: 3, protein: 3, carbs: 8, fat: 8 };
  } else if (carbsPct > 50) {
    // Distinguir entre sweet y carb-focused
    const hasSweetIngredients = mealIngredients.some(ing =>
      ing.ingredientName.toLowerCase().includes('miel') ||
      ing.ingredientName.toLowerCase().includes('azúcar') ||
      ing.ingredientName.toLowerCase().includes('chocolate') ||
      ing.ingredientName.toLowerCase().includes('mermelada')
    );

    if (hasSweetIngredients || meal.name.toLowerCase().includes('pancake') ||
        meal.name.toLowerCase().includes('cereales')) {
      type = 'sweet_breakfast';
      tolerances = { calories: 5, protein: 8, carbs: 10, fat: 10 };
    } else {
      type = 'carb_focused';
      tolerances = { calories: 4, protein: 7, carbs: 8, fat: 8 };
    }
  } else if (fatPct > 40) {
    type = 'savory_breakfast';
    tolerances = { calories: 4, protein: 6, carbs: 10, fat: 6 };
  } else if (macros.calories < 300) {
    type = 'snack';
    tolerances = { calories: 8, protein: 10, carbs: 12, fat: 12 };
  }

  return {
    type,
    macroProfile: {
      proteinPercentage: proteinPct,
      carbsPercentage: carbsPct,
      fatPercentage: fatPct,
    },
    tolerances,
  };
}

// ============================================================================
// MODULE 5: HYBRID SOLVER (LP/MIP + Least Squares)
// ============================================================================

/**
 * Añade ingredientes estratégicos al plato cuando sea necesario
 */
function addStrategicIngredients(
  currentIngredients: MealIngredient[],
  targetMacros: MacroTargets,
  addableIngredients: StrategyDecision['addableIngredients']
): MealIngredient[] {
  if (!addableIngredients || addableIngredients.length === 0) {
    return currentIngredients;
  }

  console.log(`🍽️ Añadiendo ${addableIngredients.length} ingrediente(s) estratégico(s):`);
  
  const newIngredients = [...currentIngredients];
  
  // Macros per 100g de ingredientes estratégicos
  // ⚠️ IDs deben coincidir con INGREDIENTS_DATABASE (kebab-case)
  const ingredientMacros: Record<string, { protein: number; carbs: number; fat: number; calories: number }> = {
    'clara-huevo': { protein: 11, carbs: 0.7, fat: 0.2, calories: 52 },    // Clara de Huevo
    'proteina-whey': { protein: 80, carbs: 8, fat: 6, calories: 400 },    // Proteína Whey
    'avena': { protein: 17, carbs: 66, fat: 7, calories: 389 },           // Avena
    'platano': { protein: 1.1, carbs: 23, fat: 0.3, calories: 89 },       // Plátano
    'almendras': { protein: 21, carbs: 22, fat: 50, calories: 579 },      // Almendras
  };

  addableIngredients.forEach((addable) => {
    const macros = ingredientMacros[addable.id];
    if (!macros) return;

    const gramsToAdd = addable.suggestedGrams;
    const ratio = gramsToAdd / 100;

    newIngredients.push({
      ingredientId: addable.id,
      ingredientName: addable.name,
      amount: gramsToAdd,
      calories: macros.calories * ratio,
      protein: macros.protein * ratio,
      carbs: macros.carbs * ratio,
      fat: macros.fat * ratio,
    });

    console.log(`   ✅ ${addable.name}: ${gramsToAdd}g (${addable.reason})`);
  });

  return newIngredients;
}

function solveWithHybridApproach(
  mealIngredients: MealIngredient[],
  targetMacros: MacroTargets,
  strategy: StrategyDecision,
  plateClassification: PlateClassification,
  maxIterations: number = 50,
  allIngredients: Ingredient[] = []
): HybridSolution {
  // FASE 1: Linear Programming con tolerancias progresivas
  // Intentar primero con tolerancias base, luego 1.5x, 2x, 3x, 5x si falla
  const toleranceMultipliers = [1, 1.5, 2, 3, 5, 8];
  let usedAddedIngredients = false;
  
  for (const multiplier of toleranceMultipliers) {
    const relaxedTolerances = {
      calories: plateClassification.tolerances.calories * multiplier,
      protein: plateClassification.tolerances.protein * multiplier,
      carbs: plateClassification.tolerances.carbs * multiplier,
      fat: plateClassification.tolerances.fat * multiplier,
    };

    // Usar ingredientes originales o con añadidos si ya se intentó
    let workingIngredients = mealIngredients;
    
    try {
      const lpSolution = solveWithLP(workingIngredients, targetMacros, relaxedTolerances);
      
      // Comprobar con MAX error (métrica del test)
      const maxErrorAccuracy = calculateAccuracyMaxError(lpSolution.achievedMacros, targetMacros);
      
      if (maxErrorAccuracy >= 95) {
        // Excelente, ya alcanzamos 95%+
        if (multiplier > 1) {
          console.log(`✅ LP exitoso con tolerancias ${multiplier}x: MAX error ${maxErrorAccuracy.toFixed(1)}%`);
        }
        return lpSolution;
      }
      
      // Si estamos entre 90-95%, ya no intentamos añadir ingredientes externos
      /* DESHABILITADO: No añadir ingredientes externos
      if (maxErrorAccuracy >= 90 && maxErrorAccuracy < 95 && strategy.addableIngredients && !usedAddedIngredients) {
        console.log(`🎯 MAX error ${maxErrorAccuracy.toFixed(1)}% en 90-95%, añadiendo ingredientes para alcanzar 95%+...`);
        workingIngredients = addStrategicIngredients(mealIngredients, targetMacros, strategy.addableIngredients);
        usedAddedIngredients = true;
        
        const lpWithAdded = solveWithLP(workingIngredients, targetMacros, relaxedTolerances);
        const newMaxError = calculateAccuracyMaxError(lpWithAdded.achievedMacros, targetMacros);
        
        if (newMaxError >= 95) {
          console.log(`✅ LP con ingredientes añadidos alcanzó 95%+: ${newMaxError.toFixed(1)}%`);
          return lpWithAdded;
        }
        
        // Refinar con LS MUY agresivo
        const refinedWithAdded = refineWithLeastSquares(
          lpWithAdded.scaledIngredients,
          targetMacros,
          { ...strategy, aggressiveness: 2.5 }, // Ultra agresivo
          relaxedTolerances,
          Math.min(200, maxIterations * 5), // Muchas iteraciones
          allIngredients
        );
        
        const refinedMaxError = calculateAccuracyMaxError(refinedWithAdded.achievedMacros, targetMacros);
        if (refinedMaxError >= 95 || refinedMaxError > maxErrorAccuracy) {
          return {
            ...refinedWithAdded,
            method: 'lp+added+ls',
            reason: `Ingredientes añadidos para alcanzar 95%+: MAX error ${refinedMaxError.toFixed(1)}%`,
          };
        }
      }
      FIN COMENTARIO */
      
      // Si ya estamos en 90%+, devolver
      if (maxErrorAccuracy >= 90) {
        return lpSolution;
      }

      // Si estamos < 90%, ya no usamos ingredientes externos
      /* DESHABILITADO: No añadir ingredientes externos
      if (maxErrorAccuracy < 90 && multiplier >= 3 && strategy.addableIngredients && !usedAddedIngredients) {
        console.log(`⚠️ MAX error ${maxErrorAccuracy.toFixed(1)}% < 90%, probando con ingredientes añadibles...`);
        workingIngredients = addStrategicIngredients(mealIngredients, targetMacros, strategy.addableIngredients);
        usedAddedIngredients = true;
        
        // Reintentar LP con ingredientes añadidos
        const lpWithAddedIngredients = solveWithLP(workingIngredients, targetMacros, relaxedTolerances);
        const newMaxError = calculateAccuracyMaxError(lpWithAddedIngredients.achievedMacros, targetMacros);
        
        if (newMaxError >= 90) {
          console.log(`✅ LP con ingredientes añadidos: MAX error ${newMaxError.toFixed(1)}%`);
          return lpWithAddedIngredients;
        }
        
        // Si aún no alcanza, refinar con LS
        const refinedWithAdded = refineWithLeastSquares(
          lpWithAddedIngredients.scaledIngredients,
          targetMacros,
          strategy,
          relaxedTolerances,
          Math.min(100, maxIterations * 3),
          allIngredients
        );
        
        const refinedMaxError = calculateAccuracyMaxError(refinedWithAdded.achievedMacros, targetMacros);
        if (refinedMaxError >= 90) {
          return {
            ...refinedWithAdded,
            method: 'lp+added+ls',
            reason: `Añadidos ingredientes estratégicos: MAX error ${refinedMaxError.toFixed(1)}%`,
          };
        }
      }
      FIN COMENTARIO */

      // FASE 2: Refinar con Least Squares
      const refinedSolution = refineWithLeastSquares(
        lpSolution.scaledIngredients,
        targetMacros,
        strategy,
        relaxedTolerances,
        Math.min(100, maxIterations * 3), // Muchas más iteraciones para casos difíciles
        allIngredients
      );

      const refinedMaxError = calculateAccuracyMaxError(refinedSolution.achievedMacros, targetMacros);
      
      if (refinedMaxError >= 90) {
        return {
          ...refinedSolution,
          method: 'lp+ls',
          reason: `LP (${multiplier}x) + LS: MAX error ${refinedMaxError.toFixed(1)}%`,
        };
      }

      // Si con este multiplier no llegamos a 90%, probar con el siguiente
      if (multiplier === toleranceMultipliers[toleranceMultipliers.length - 1]) {
        // DESHABILITADO: Ya no añadimos ingredientes como último recurso
        /* COMENTADO: No añadir ingredientes externos
        if (strategy.addableIngredients && !usedAddedIngredients) {
          console.log(`🚨 Último recurso: añadiendo ingredientes estratégicos...`);
          const ingredientsWithAdded = addStrategicIngredients(mealIngredients, targetMacros, strategy.addableIngredients);
          
          const finalLsSolution = refineWithLeastSquares(
            ingredientsWithAdded,
            targetMacros,
            { ...strategy, aggressiveness: 2.5 },
            relaxedTolerances,
            maxIterations * 6,
            allIngredients
          );
          
          const finalMaxError = calculateAccuracyMaxError(finalLsSolution.achievedMacros, targetMacros);
          if (finalMaxError >= 90) {
            return {
              ...finalLsSolution,
              method: 'added+ls_ultra',
              reason: `Ingredientes añadidos + LS ultra: MAX error ${finalMaxError.toFixed(1)}%`,
            };
          }
          
          // Si con ingredientes añadidos es mejor, devolverlo aunque no llegue a 90%
          if (finalMaxError > refinedMaxError) {
            return {
              ...finalLsSolution,
              method: 'added+ls_ultra',
              reason: `Mejor con ingredientes añadidos: MAX error ${finalMaxError.toFixed(1)}%`,
            };
          }
        }
        FIN COMENTARIO */
        
        // Último intento, devolver lo mejor que tenemos
        return refinedMaxError > maxErrorAccuracy ? {
          ...refinedSolution,
          method: 'lp+ls',
          reason: `Mejor resultado: MAX error ${refinedMaxError.toFixed(1)}%`,
        } : lpSolution;
      }
    } catch (error) {
      // LP falló con este multiplier, probar siguiente
      if (multiplier === toleranceMultipliers[toleranceMultipliers.length - 1]) {
        // ÚLTIMO RECURSO cuando LP falla completamente
        let finalIngredients = mealIngredients;
        
        // Intentar añadir ingredientes si disponibles
        if (strategy.addableIngredients && !usedAddedIngredients) {
          console.log(`🚨 LP imposible, añadiendo ingredientes estratégicos como último recurso...`);
          finalIngredients = addStrategicIngredients(mealIngredients, targetMacros, strategy.addableIngredients);
          usedAddedIngredients = true;
        }
        
        const lsSolution = refineWithLeastSquares(
          finalIngredients,
          targetMacros,
          { ...strategy, aggressiveness: 2.5 }, // ULTRA agresivo para casos imposibles
          relaxedTolerances,
          maxIterations * 6, // 6x iteraciones para casos extremos
          allIngredients
        );

        const finalMaxError = calculateAccuracyMaxError(lsSolution.achievedMacros, targetMacros);
        
        return {
          ...lsSolution,
          method: usedAddedIngredients ? 'added+ls_ultra' : 'ls_ultra_aggressive',
          reason: usedAddedIngredients 
            ? `LP imposible, ingredientes añadidos + LS ultra: MAX error ${finalMaxError.toFixed(1)}%`
            : `LP imposible, LS ultra-agresivo: ${lsSolution.accuracy.toFixed(1)}%`,
        };
      }
      continue;
    }
  }

  // Esto nunca debería ocurrir, pero por seguridad
  throw new Error('Todos los métodos de optimización fallaron');
}

function solveWithLP(
  ingredients: MealIngredient[],
  targetMacros: MacroTargets,
  tolerances: PlateClassification['tolerances']
): HybridSolution {
  /**
   * Modelo LP siguiendo la API de javascript-lp-solver
   * Ver: https://www.npmjs.com/package/javascript-lp-solver
   * 
   * Variables: gramos de cada ingrediente (ing_0, ing_1, ...)
   * Optimize: Minimizar la desviación de macros
   * Constraints: límites individuales + macros totales
   */
  
  const model: any = {
    optimize: "deviation",
    opType: "min",
    constraints: {},
    variables: {},
  };

  // Calculamos macros por gramo para cada ingrediente
  const ingredientData = ingredients.map((ing) => {
    const macrosPerGram = {
      calories: (ing.calories || 0) / Math.max(ing.amount, 0.01),
      protein: (ing.protein || 0) / Math.max(ing.amount, 0.01),
      carbs: (ing.carbs || 0) / Math.max(ing.amount, 0.01),
      fat: (ing.fat || 0) / Math.max(ing.amount, 0.01),
    };
    return { original: ing, macrosPerGram };
  });

  // Variables: gramos de cada ingrediente
  ingredientData.forEach((data, idx) => {
    const varName = `ing_${idx}`;
    
    model.variables[varName] = {
      // Coeficientes para los constraints de macros totales
      calories: data.macrosPerGram.calories,
      protein: data.macrosPerGram.protein,
      carbs: data.macrosPerGram.carbs,
      fat: data.macrosPerGram.fat,
      // Coeficiente para el constraint de límite individual
      [varName + '_bound']: 1,
    };
  });

  // Constraints: Límites individuales por ingrediente (mínimos inteligentes)
  ingredientData.forEach((data, idx) => {
    const varName = `ing_${idx}`;
    const maxGrams = data.original.amount * 100;
    const minGrams = getSmartMinimumAmount(data.ingredient);
    
    model.constraints[varName + '_bound'] = { 
      min: minGrams, 
      max: maxGrams 
    };
  });

  // Constraints: Macros totales con tolerancias
  const calMin = targetMacros.calories * (1 - tolerances.calories / 100);
  const calMax = targetMacros.calories * (1 + tolerances.calories / 100);
  const proMin = targetMacros.protein * (1 - tolerances.protein / 100);
  const proMax = targetMacros.protein * (1 + tolerances.protein / 100);
  const carbMin = targetMacros.carbs * (1 - tolerances.carbs / 100);
  const carbMax = targetMacros.carbs * (1 + tolerances.carbs / 100);
  const fatMin = targetMacros.fat * (1 - tolerances.fat / 100);
  const fatMax = targetMacros.fat * (1 + tolerances.fat / 100);

  model.constraints.calories = { min: calMin, max: calMax };
  model.constraints.protein = { min: proMin, max: proMax };
  model.constraints.carbs = { min: carbMin, max: carbMax };
  model.constraints.fat = { min: fatMin, max: fatMax };

  // Resolver con javascript-lp-solver
  let result;
  try {
    result = solver.Solve(model);
  } catch (e) {
    console.warn('❌ LP Solver falló:', e);
    throw new Error('LP solver exception');
  }

  if (!result || result.feasible === false) {
    console.warn('❌ LP Solver: solución no factible');
    throw new Error('LP infeasible');
  }

  // Extraer solución
  const scaledIngredients = ingredientData.map((data, idx) => {
    const varName = `ing_${idx}`;
    const newAmount = result[varName] || data.original.amount;
    const minAmount = getSmartMinimumAmount(data.ingredient);

    return {
      ...data.original,
      amount: Math.max(minAmount, newAmount),
      calories: data.macrosPerGram.calories * newAmount,
      protein: data.macrosPerGram.protein * newAmount,
      carbs: data.macrosPerGram.carbs * newAmount,
      fat: data.macrosPerGram.fat * newAmount,
    };
  });

  const achievedMacros = calculateMacrosFromIngredients(scaledIngredients);
  const accuracy = calculateAccuracy(achievedMacros, targetMacros);

  console.log(`✅ LP Solver exitoso: ${accuracy.toFixed(1)}% accuracy`);

  return {
    scaledIngredients,
    achievedMacros,
    accuracy,
    method: 'lp',
    iterations: 1,
    reason: `LP solver alcanzó ${accuracy.toFixed(1)}% accuracy`,
  };
}

function refineWithLeastSquares(
  ingredients: MealIngredient[],
  targetMacros: MacroTargets,
  strategy: StrategyDecision,
  tolerances: PlateClassification['tolerances'],
  maxIterations: number,
  allIngredients: Ingredient[]
): HybridSolution {
  let current = [...ingredients];
  let bestSolution = [...current];
  let bestAccuracy = 0;
  let bestMaxErrorAccuracy = 0; // Tracking MAX error también
  let iteration = 0;
  let stagnationCount = 0;

  for (iteration = 0; iteration < maxIterations; iteration++) {
    const currentMacros = calculateMacrosFromIngredients(current);
    const accuracy = calculateAccuracy(currentMacros, targetMacros);
    const maxErrorAccuracy = calculateAccuracyMaxError(currentMacros, targetMacros);

    // Actualizar mejor solución si mejora MAX error (métrica principal del test)
    if (maxErrorAccuracy > bestMaxErrorAccuracy) {
      bestMaxErrorAccuracy = maxErrorAccuracy;
      bestAccuracy = accuracy;
      bestSolution = [...current];
      stagnationCount = 0;
    } else {
      stagnationCount++;
    }

    if (maxErrorAccuracy >= 98) break; // Objetivo perfecto alcanzado
    
    // Si llevamos 10 iteraciones estancados, aumentar agresividad dramáticamente
    if (stagnationCount >= 10) {
      console.log(`⚡ Aumentando agresividad por estancamiento (${stagnationCount} iter)`);
      strategy.aggressiveness = Math.min(2.0, strategy.aggressiveness * 1.3);
    }

    // AJUSTE SECUENCIAL (REVERTIDO): Funciona mejor que simultáneo
    let improved = false;
    
    // Calcular agresividad adaptativa (aumenta con las iteraciones)
    const progressFactor = Math.min(1, iteration / maxIterations);
    const adaptiveAggressiveness = strategy.aggressiveness * (0.8 + 0.5 * progressFactor);
    
    // Ordenar ingredientes por impacto (los rankeados por estrategia primero)
    const orderedIngredients = [...current].sort((a, b) => {
      const rankA = strategy.rankedIngredients.findIndex(r => r.id === a.ingredientId);
      const rankB = strategy.rankedIngredients.findIndex(r => r.id === b.ingredientId);
      7 + 0.6
      if (rankA === -1 && rankB === -1) return 0;
      if (rankA === -1) return 1;
      if (rankB === -1) return -1;
      return rankA - rankB;
    });

    // Ajustar cada ingrediente individualmente
    for (const ing of orderedIngredients) {
      const beforeMacros = calculateMacrosFromIngredients(current);
      const beforeAccuracy = calculateAccuracy(beforeMacros, targetMacros);
      const beforeMaxError = calculateAccuracyMaxError(beforeMacros, targetMacros);
      
      const gaps = {
        calories: targetMacros.calories - beforeMacros.calories,
        protein: targetMacros.protein - beforeMacros.protein,
        carbs: targetMacros.carbs - beforeMacros.carbs,
        fat: targetMacros.fat - beforeMacros.fat,
      };

      // Calcular macros por gramo de ESTE ingrediente específico
      const macrosPerGram = {
        calories: (ing.calories || 0) / Math.max(ing.amount, 1),
        protein: (ing.protein || 0) / Math.max(ing.amount, 1),
        carbs: (ing.carbs || 0) / Math.max(ing.amount, 1),
        fat: (ing.fat || 0) / Math.max(ing.amount, 1),
      };

      // Calcular delta óptimo para ESTE ingrediente usando least squares
      const numerator =
        gaps.calories * macrosPerGram.calories +
        gaps.protein * macrosPerGram.protein +
        gaps.carbs * macrosPerGram.carbs +
        gaps.fat * macrosPerGram.fat;

      const denominator =
        macrosPerGram.calories ** 2 +
        macrosPerGram.protein ** 2 +
        macrosPerGram.carbs ** 2 +
        macrosPerGram.fat ** 2;

      if (denominator === 0) continue;

      // Delta óptimo con agresividad adaptativa
      let delta = (numerator / denominator) * adaptiveAggressiveness;

      const oldAmount = ing.amount;
      const ingredient = allIngredients?.find(i => i.id === ing.ingredientId);
      const minAmount = ingredient ? getSmartMinimumAmount(ingredient) : 5;
      const newAmount = Math.max(minAmount, Math.min(ing.amount * 5, ing.amount + delta)); // Max 5x
      
      // Aplicar cambio TEMPORAL y verificar si mejora
      ing.amount = newAmount;
      ing.calories = macrosPerGram.calories * newAmount;
      ing.protein = macrosPerGram.protein * newAmount;
      ing.carbs = macrosPerGram.carbs * newAmount;
      ing.fat = macrosPerGram.fat * newAmount;

      // Verificar si el cambio mejora (balance entre accuracy promedio y MAX error)
      const afterMacros = calculateMacrosFromIngredients(current);
      const afterAccuracy = calculateAccuracy(afterMacros, targetMacros);
      const afterMaxError = calculateAccuracyMaxError(afterMacros, targetMacros);

      // Criterio combinado: mejorar accuracy promedio Y/O MAX error significativamente
      const avgImprovement = afterAccuracy - beforeAccuracy;
      const maxErrorImprovement = afterMaxError - beforeMaxError;
      
      // Aceptar si mejora promedio O si mejora MAX error sin empeorar mucho el promedio
      if (avgImprovement > 0 || (maxErrorImprovement > 0.5 && avgImprovement > -1)) {
        // Mantener el cambio
        improved = true;
      } else {
        // Revertir el cambio
        ing.amount = oldAmount;
        ing.calories = macrosPerGram.calories * oldAmount;
        ing.protein = macrosPerGram.protein * oldAmount;
        ing.carbs = macrosPerGram.carbs * oldAmount;
        ing.fat = macrosPerGram.fat * oldAmount;
      }
    }

    // Si ningún ingrediente mejoró, salir (estancamiento)
    if (!improved) break;
  }

  // Usar la mejor solución encontrada
  current = bestSolution;
  const achievedMacros = calculateMacrosFromIngredients(current);
  const finalAccuracy = calculateAccuracy(achievedMacros, targetMacros);
  const finalMaxError = calculateAccuracyMaxError(achievedMacros, targetMacros);

  // REFINAMIENTO FINAL: Si estamos en 90-95%, hacer micro-ajustes para alcanzar 95%+
  if (finalMaxError >= 90 && finalMaxError < 95) {
    console.log(`🎯 Refinamiento final: ${finalMaxError.toFixed(1)}% → objetivo 95%+`);
    
    const gaps = {
      calories: targetMacros.calories - achievedMacros.calories,
      protein: targetMacros.protein - achievedMacros.protein,
      carbs: targetMacros.carbs - achievedMacros.carbs,
      fat: targetMacros.fat - achievedMacros.fat,
    };
    
    // Encontrar el macro con mayor gap relativo
    const relativeGaps = {
      calories: Math.abs(gaps.calories) / targetMacros.calories,
      protein: Math.abs(gaps.protein) / targetMacros.protein,
      carbs: Math.abs(gaps.carbs) / targetMacros.carbs,
      fat: Math.abs(gaps.fat) / targetMacros.fat,
    };
    
    const maxGapMacro = Object.keys(relativeGaps).reduce((a, b) =>
      relativeGaps[a as keyof typeof relativeGaps] > relativeGaps[b as keyof typeof relativeGaps] ? a : b
    ) as keyof MacroTargets;
    
    // Encontrar el ingrediente que mejor puede corregir ese gap
    const bestIngredient = current.reduce((best, ing) => {
      const macroPerGram = (ing[maxGapMacro] || 0) / Math.max(ing.amount, 1);
      const currentBest = best ? (best[maxGapMacro] || 0) / Math.max(best.amount, 1) : 0;
      return macroPerGram > currentBest ? ing : best;
    }, current[0]);
    
    if (bestIngredient) {
      const macroPerGram = (bestIngredient[maxGapMacro] || 0) / Math.max(bestIngredient.amount, 1);
      const deltaGrams = gaps[maxGapMacro] / macroPerGram;
      
      // Aplicar micro-ajuste
      const refinedCurrent = current.map(ing => {
        if (ing.ingredientId === bestIngredient.ingredientId) {
          const newAmount = Math.max(5, ing.amount + deltaGrams);
          const ratio = newAmount / Math.max(ing.amount, 1);
          return {
            ...ing,
            amount: newAmount,
            calories: (ing.calories || 0) * ratio,
            protein: (ing.protein || 0) * ratio,
            carbs: (ing.carbs || 0) * ratio,
            fat: (ing.fat || 0) * ratio,
          };
        }
        return ing;
      });
      
      const refinedMacros = calculateMacrosFromIngredients(refinedCurrent);
      const refinedMaxError = calculateAccuracyMaxError(refinedMacros, targetMacros);
      
      if (refinedMaxError > finalMaxError) {
        console.log(`✅ Refinamiento exitoso: ${finalMaxError.toFixed(1)}% → ${refinedMaxError.toFixed(1)}%`);
        current = refinedCurrent;
        return {
          scaledIngredients: current,
          achievedMacros: refinedMacros,
          accuracy: calculateAccuracy(refinedMacros, targetMacros),
          method: 'ls+refinement',
          iterations: iteration,
          reason: `LS + refinamiento final: ${refinedMaxError.toFixed(1)}%`,
        };
      }
    }
  }

  return {
    scaledIngredients: current,
    achievedMacros: calculateMacrosFromIngredients(current),
    accuracy: finalAccuracy,
    method: 'ls_only',
    iterations: iteration,
    reason: `Least Squares simultáneo ${iteration} iterations: ${finalAccuracy.toFixed(1)}% (MAX error: ${finalMaxError.toFixed(1)}%)`,
  };
}

// ============================================================================
// MODULE 6: HARD RULES
// ============================================================================

function validateHardRules(
  scaledIngredients: MealIngredient[],
  strategy: StrategyDecision
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  scaledIngredients.forEach((ing) => {
    // Regla 1: Mínimo 0.5g por ingrediente
    if (ing.amount < 0.5) {
      violations.push(`${ing.name}: ${ing.amount.toFixed(1)}g < 0.5g mínimo`);
    }

    // Regla 2: Máximo 100x multiplicador
    const originalGrams = strategy.rankedIngredients.find((r) => r.id === ing.id);
    if (originalGrams && ing.amount > originalGrams.rank * 100) {
      violations.push(`${ing.name}: multiplier >100x`);
    }

    // Regla 3: Macros no negativos
    if (
      (ing.calories || 0) < 0 ||
      (ing.protein || 0) < 0 ||
      (ing.carbs || 0) < 0 ||
      (ing.fat || 0) < 0
    ) {
      violations.push(`${ing.name}: macros negativos`);
    }
  });

  return {
    valid: violations.length === 0,
    violations,
  };
}

// ============================================================================
// MODULE 7: VERIFICATION REINFORCED
// ============================================================================

function verifyWithTolerances(
  solution: HybridSolution,
  targetMacros: MacroTargets,
  plateClassification: PlateClassification,
  previousAccuracy: number | null
): VerificationResult {
  const { achievedMacros, accuracy } = solution;
  const { tolerances } = plateClassification;
  const violations: string[] = [];
  const suggestions: string[] = [];

  // Verificar tolerancias por macro
  const checks = [
    { name: 'calories', target: targetMacros.calories, achieved: achievedMacros.calories, tol: tolerances.calories },
    { name: 'protein', target: targetMacros.protein, achieved: achievedMacros.protein, tol: tolerances.protein },
    { name: 'carbs', target: targetMacros.carbs, achieved: achievedMacros.carbs, tol: tolerances.carbs },
    { name: 'fat', target: targetMacros.fat, achieved: achievedMacros.fat, tol: tolerances.fat },
  ];

  let meetsTolerances = true;
  checks.forEach((check) => {
    const tolerance = (check.tol / 100) * check.target;
    const diff = Math.abs(check.achieved - check.target);
    const diffPct = (diff / check.target) * 100;

    if (diff > tolerance) {
      meetsTolerances = false;
      violations.push(
        `${check.name}: ${check.achieved.toFixed(1)} vs ${check.target.toFixed(1)} (±${diffPct.toFixed(1)}%, tol: ±${check.tol}%)`
      );
    }
  });

  // Verificar mejora vs iteración anterior
  let approved = accuracy >= 90 || meetsTolerances;

  if (previousAccuracy !== null) {
    const improvement = accuracy - previousAccuracy;
    if (improvement < -0.5) {
      // Empeoró >0.5%, rechazar
      approved = false;
      violations.push(`Empeoró ${Math.abs(improvement).toFixed(1)}% vs iteración anterior`);
    } else if (improvement < 0.1 && accuracy < 90) {
      suggestions.push('Estancamiento detectado, considerar cambio de estrategia');
    }
  }

  // Sugerencias según resultado
  if (accuracy < 85 && meetsTolerances) {
    suggestions.push('Accuracy baja pero cumple tolerancias, podría ser aceptable');
  }

  if (!meetsTolerances && accuracy > 85) {
    suggestions.push('Accuracy alta pero viola tolerancias, necesita refinamiento');
  }

  return {
    approved,
    accuracy,
    meetsTolerances,
    violations,
    suggestions,
  };
}

// ============================================================================
// MODULE 8: ORCHESTRATOR
// ============================================================================

export function adaptMealWithAIEngine(
  meal: Meal,
  targetMacros: MacroTargets,
  user: User,
  dailyLog: DailyLog | null,
  maxIterations: number = 100,
  allIngredients: Ingredient[] = []
): HybridSolution {
  // Extraer mealIngredients (pasados temporalmente desde el wrapper)
  const mealIngredients = (meal as any).mealIngredients as MealIngredient[];
  
  if (!mealIngredients || mealIngredients.length === 0) {
    console.error(`❌ Meal "${meal.name}" no tiene mealIngredients`);
    return proportionalScalingFallback(meal, targetMacros, 'No mealIngredients provided');
  }

  // Step 1: Daily Context
  const context = getDailyContext(user, dailyLog);

  // Step 2: Confidence Filter
  const confidence = assessConfidence(meal, targetMacros, context, mealIngredients);
  
  if (!confidence.feasible) {
    console.warn(`⚠️ Plato "${meal.name}" no viable (confidence: ${confidence.confidence}%)`);
    console.warn('Razones:', confidence.reasons);
    
    // Fallback proporcional
    return proportionalScalingFallback(meal, targetMacros, confidence.reasons.join('; '), mealIngredients);
  }

  // Step 3: Plate Classification
  const originalMacros = calculateMacrosFromIngredients(mealIngredients);
  const plateClassification = classifyPlate(meal, originalMacros, mealIngredients);

  console.log(`📊 Plato clasificado como: ${plateClassification.type}`);
  console.log(`   Tolerancias: cal ±${plateClassification.tolerances.calories}%, pro ±${plateClassification.tolerances.protein}%, carb ±${plateClassification.tolerances.carbs}%, fat ±${plateClassification.tolerances.fat}%`);

  // Step 4: Orchestration Loop
  const memory: OrchestrationMemory = {
    attemptNumber: 0,
    bestSolution: null,
    strategyHistory: [],
    accuracyHistory: [],
    stagnationCounter: 0,
  };

  let currentIngredients = [...mealIngredients];

  for (let i = 0; i < Math.min(maxIterations, 250); i++) { // Aumentado a 250 para más margen
    memory.attemptNumber = i + 1;

    // Decidir estrategia
    const currentMacros = calculateMacrosFromIngredients(currentIngredients);
    const strategy = decideStrategy(currentMacros, targetMacros, currentIngredients, context, i);
    memory.strategyHistory.push(strategy);

    // Validar hard rules ANTES de resolver
    const rulesCheck = validateHardRules(currentIngredients, strategy);
    if (!rulesCheck.valid) {
      console.warn(`⚠️ Violación de hard rules en iteración ${i}:`, rulesCheck.violations);
      break;
    }

    // Resolver con Hybrid Solver
    const solution = solveWithHybridApproach(
      currentIngredients,
      targetMacros,
      strategy,
      plateClassification,
      100, // Aumentado de 50 a 100 para casos difíciles
      allIngredients
    );

    memory.accuracyHistory.push(solution.accuracy);

    // Verificar solución
    const previousAccuracy = memory.bestSolution?.accuracy || null;
    const verification = verifyWithTolerances(
      solution,
      targetMacros,
      plateClassification,
      previousAccuracy
    );

    // Actualizar mejor solución si mejora
    if (!memory.bestSolution || solution.accuracy > memory.bestSolution.accuracy) {
      memory.bestSolution = solution;
      memory.stagnationCounter = 0;
    } else {
      memory.stagnationCounter++;
    }

    // Condiciones de salida
    if (verification.approved && verification.accuracy >= 90) {
      console.log(`✅ Objetivo alcanzado en iteración ${i + 1}: ${verification.accuracy.toFixed(1)}%`);
      return solution;
    }

    if (memory.stagnationCounter >= 25) {
      console.log(`⚠️ Estancamiento en ${memory.stagnationCounter} iteraciones`);
      break;
    }

    // Preparar siguiente iteración
    currentIngredients = solution.scaledIngredients;
  }

  // Retornar mejor solución encontrada
  if (memory.bestSolution) {
    console.log(`🏁 Mejor solución: ${memory.bestSolution.accuracy.toFixed(1)}% (${memory.attemptNumber} iteraciones)`);
    return memory.bestSolution;
  }

  // Último fallback
  console.warn('⚠️ No se encontró solución aceptable, usando fallback proporcional');
  return proportionalScalingFallback(meal, targetMacros, 'No convergence after max iterations', mealIngredients);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateAccuracy(achieved: MacroValues, target: MacroTargets): number {
  const errors = [
    Math.abs(achieved.calories - target.calories) / Math.max(target.calories, 1),
    Math.abs(achieved.protein - target.protein) / Math.max(target.protein, 1),
    Math.abs(achieved.carbs - target.carbs) / Math.max(target.carbs, 1),
    Math.abs(achieved.fat - target.fat) / Math.max(target.fat, 1),
  ];

  const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
  return Math.max(0, (1 - avgError) * 100);
}

/**
 * Calcula accuracy usando MAX error (métrica más estricta)
 * Coincide con calculateMacroError del test
 */
function calculateAccuracyMaxError(achieved: MacroValues, target: MacroTargets): number {
  const errors = [
    Math.abs(achieved.calories - target.calories) / Math.max(target.calories, 1),
    Math.abs(achieved.protein - target.protein) / Math.max(target.protein, 1),
    Math.abs(achieved.carbs - target.carbs) / Math.max(target.carbs, 1),
    Math.abs(achieved.fat - target.fat) / Math.max(target.fat, 1),
  ];

  const maxError = Math.max(...errors);
  return Math.max(0, (1 - maxError) * 100);
}

function proportionalScalingFallback(
  meal: Meal,
  targetMacros: MacroTargets,
  reason: string,
  mealIngredients: MealIngredient[]
): HybridSolution {
  const originalMacros = calculateMacrosFromIngredients(mealIngredients);
  const ratio = targetMacros.calories / Math.max(originalMacros.calories, 1);

  const scaledIngredients = mealIngredients.map((ing) => ({
    ...ing,
    grams: ing.amount * ratio,
    calories: (ing.calories || 0) * ratio,
    protein: (ing.protein || 0) * ratio,
    carbs: (ing.carbs || 0) * ratio,
    fat: (ing.fat || 0) * ratio,
  }));

  const achievedMacros = calculateMacrosFromIngredients(scaledIngredients);
  const accuracy = calculateAccuracy(achievedMacros, targetMacros);

  return {
    scaledIngredients,
    achievedMacros,
    accuracy,
    method: 'proportional_fallback',
    iterations: 0,
    reason: `Fallback proporcional (${ratio.toFixed(2)}x): ${reason}`,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  MacroTargets,
  MacroValues,
  DailyContext,
  PlateType,
  PlateClassification,
  StrategyDecision,
  ConfidenceScore,
  HybridSolution,
  VerificationResult,
};
