/**
 * ============================================================================
 * INGREDIENT CLASSIFIER - FUELIER AI ENGINE v3.0
 * ============================================================================
 * 
 * FASE 1: Clasificación de ingredientes en structural/flexible
 * 
 * RESPONSABILIDAD:
 * Analizar un plato y clasificar cada ingrediente según su rol:
 * - STRUCTURAL: Núcleo del plato, mantener ratio SIEMPRE
 * - FLEXIBLE PRIMARY: Ajustar primero (carbohidratos base, verduras)
 * - FLEXIBLE SECONDARY: Ajustar si necesario (grasas, condimentos)
 * 
 * PRINCIPIOS:
 * 1. Clasificación basada en categoría + análisis macro
 * 2. Determinista (mismo plato → misma clasificación)
 * 3. NO modifica ingredientes, solo clasifica
 * 4. Explicación completa (audit trail)
 * 
 * @version 3.0
 * @author FUELIER Engineering Team
 * @date 2026-01-15
 */

import { Meal, MealIngredient } from '@/types';
import { Ingredient } from '../../../data/ingredientTypes';
import {
  IngredientClassification,
  ClassifiedIngredient,
  IngredientRole,
  PriorityMacro,
  DishComplexity,
  MacroValues
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Umbrales para clasificación
 */
const THRESHOLDS = {
  /** Mínimo de calorías para ser considerado ingrediente principal (structural) */
  MIN_CALORIES_FOR_CORE: 80,
  
  /** Porcentaje de calorías del plato para ser core (>15% = core candidate) */
  MIN_PERCENTAGE_FOR_CORE: 0.15,
  
  /** Máximo de ingredientes structural (mantener simple) */
  MAX_STRUCTURAL_INGREDIENTS: 3,
  
  /** Umbral para clasificar como grasa pura (>60% calorías de grasa) */
  FAT_DOMINANCE_THRESHOLD: 0.60,
  
  /** Umbral para clasificar como proteína pura (>40% calorías de proteína) */
  PROTEIN_DOMINANCE_THRESHOLD: 0.40,
  
  /** Umbral para clasificar como carbohidrato puro (>50% calorías de carbos) */
  CARBS_DOMINANCE_THRESHOLD: 0.50,
};

/**
 * Categorías que son SIEMPRE flexible secondary (condimentos, grasas puras)
 */
const ALWAYS_FLEXIBLE_SECONDARY_CATEGORIES = [
  'condimento',
  'especia',
  'aceite',
  'grasa',
  'salsa',
  'aderezo',
];

/**
 * Categorías que son SIEMPRE structural candidates (proteínas, carbos base)
 */
const STRUCTURAL_CANDIDATE_CATEGORIES = [
  'proteina',
  'carne',
  'pescado',
  'huevo',
  'lacteo', // Solo si es suficientemente grande
  'legumbre',
  'cereal',
  'carbohidrato',
  'tubérculo',
];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Clasifica los ingredientes de un plato
 * 
 * @param meal Plato con ingredientes
 * @param allIngredients Base de datos de ingredientes (para obtener categorías)
 * @returns Clasificación completa
 */
export function classifyIngredients(
  meal: Meal,
  allIngredients: Ingredient[]
): IngredientClassification {
  // Obtener mealIngredients
  const mealIngredients = (meal as any).mealIngredients as MealIngredient[];
  
  if (!mealIngredients || mealIngredients.length === 0) {
    throw new Error(`Meal "${meal.name}" no tiene ingredientes`);
  }
  
  // Calcular macros totales del plato
  const totalMacros = calculateTotalMacros(mealIngredients);
  const totalCalories = totalMacros.calories;
  
  // Clasificar cada ingrediente
  const classifiedIngredients: ClassifiedIngredient[] = mealIngredients.map(ing => {
    const ingredient = allIngredients.find(i => i.id === ing.ingredientId);
    const category = ingredient?.category?.toLowerCase() || '';
    
    const role = classifyIngredient(
      ing,
      category,
      totalCalories,
      totalMacros
    );
    
    const reason = explainClassification(ing, category, role, totalCalories);
    
    return {
      ...ing,
      role,
      reason,
      originalAmount: ing.amount,
      category,
    };
  });
  
  // Agrupar por rol
  const structural = classifiedIngredients.filter(i => i.role === 'structural');
  const flexiblePrimary = classifiedIngredients.filter(i => i.role === 'flexible_primary');
  const flexibleSecondary = classifiedIngredients.filter(i => i.role === 'flexible_secondary');
  
  // Validar y ajustar clasificación si necesario
  const adjusted = adjustClassificationIfNeeded(
    structural,
    flexiblePrimary,
    flexibleSecondary,
    totalMacros
  );
  
  // Calcular metadata
  const metadata = calculateMetadata(
    adjusted.structural,
    adjusted.flexiblePrimary,
    adjusted.flexibleSecondary,
    totalMacros
  );
  
  return {
    structural: adjusted.structural,
    flexiblePrimary: adjusted.flexiblePrimary,
    flexibleSecondary: adjusted.flexibleSecondary,
    metadata,
  };
}

// ============================================================================
// CLASSIFICATION LOGIC
// ============================================================================

/**
 * Clasifica un ingrediente individual
 */
function classifyIngredient(
  ingredient: MealIngredient,
  category: string,
  totalCalories: number,
  totalMacros: MacroValues
): IngredientRole {
  const calories = ingredient.calories || 0;
  const percentageOfDish = calories / Math.max(totalCalories, 1);
  
  // REGLA 1: Categorías que SIEMPRE son flexible secondary
  if (ALWAYS_FLEXIBLE_SECONDARY_CATEGORIES.some(cat => category.includes(cat))) {
    return 'flexible_secondary';
  }
  
  // REGLA 2: Ingredientes muy pequeños (<80 kcal Y <10% del plato)
  if (calories < THRESHOLDS.MIN_CALORIES_FOR_CORE || percentageOfDish < 0.10) {
    // Si es condimento o grasa → secondary
    if (category.includes('grasa') || category.includes('aceite') || category.includes('condimento')) {
      return 'flexible_secondary';
    }
    // Si es vegetal o complemento → primary
    return 'flexible_primary';
  }
  
  // REGLA 3: Ingredientes grandes (>15% del plato) con categoría structural
  if (percentageOfDish >= THRESHOLDS.MIN_PERCENTAGE_FOR_CORE) {
    if (STRUCTURAL_CANDIDATE_CATEGORIES.some(cat => category.includes(cat))) {
      return 'structural';
    }
  }
  
  // REGLA 4: Análisis por perfil macro
  const macroProfile = calculateMacroProfile(ingredient);
  
  // Proteína dominante (>40%) → structural candidate
  if (macroProfile.proteinPct > THRESHOLDS.PROTEIN_DOMINANCE_THRESHOLD * 100) {
    if (percentageOfDish >= 0.12) { // Al menos 12% del plato
      return 'structural';
    }
  }
  
  // Carbohidrato dominante (>50%) → structural candidate si es >12% del plato
  if (macroProfile.carbsPct > THRESHOLDS.CARBS_DOMINANCE_THRESHOLD * 100) {
    if (percentageOfDish >= 0.12) {
      return 'structural';
    }
    // Si es <12% pero es cereal/tubérculo → flexible primary
    if (category.includes('cereal') || category.includes('tubérculo') || category.includes('carbohidrato')) {
      return 'flexible_primary';
    }
  }
  
  // Grasa dominante (>60%) → flexible secondary
  if (macroProfile.fatPct > THRESHOLDS.FAT_DOMINANCE_THRESHOLD * 100) {
    return 'flexible_secondary';
  }
  
  // REGLA 5: Vegetales, frutas → flexible primary
  if (category.includes('vegetal') || category.includes('verdura') || category.includes('fruta')) {
    return 'flexible_primary';
  }
  
  // DEFAULT: flexible primary (ingredientes indefinidos)
  return 'flexible_primary';
}

/**
 * Ajusta la clasificación si hay problemas
 * (Ej: demasiados structural, ningún structural, etc.)
 */
function adjustClassificationIfNeeded(
  structural: ClassifiedIngredient[],
  flexiblePrimary: ClassifiedIngredient[],
  flexibleSecondary: ClassifiedIngredient[],
  totalMacros: MacroValues
): {
  structural: ClassifiedIngredient[];
  flexiblePrimary: ClassifiedIngredient[];
  flexibleSecondary: ClassifiedIngredient[];
} {
  // AJUSTE 1: Si hay >3 structural, mantener solo los 3 más grandes
  if (structural.length > THRESHOLDS.MAX_STRUCTURAL_INGREDIENTS) {
    const sorted = [...structural].sort((a, b) => 
      (b.calories || 0) - (a.calories || 0)
    );
    
    const keptAsStructural = sorted.slice(0, THRESHOLDS.MAX_STRUCTURAL_INGREDIENTS);
    const downgraded = sorted.slice(THRESHOLDS.MAX_STRUCTURAL_INGREDIENTS).map(ing => ({
      ...ing,
      role: 'flexible_primary' as IngredientRole,
      reason: `Downgraded to flexible_primary (max ${THRESHOLDS.MAX_STRUCTURAL_INGREDIENTS} structural allowed)`,
    }));
    
    return {
      structural: keptAsStructural,
      flexiblePrimary: [...flexiblePrimary, ...downgraded],
      flexibleSecondary,
    };
  }
  
  // AJUSTE 2: Si NO hay structural, promover el/los más grandes
  if (structural.length === 0) {
    const allNonSecondary = [...flexiblePrimary].sort((a, b) =>
      (b.calories || 0) - (a.calories || 0)
    );
    
    // Si hay 2+ ingredientes, promover al menos 1 (o 2 si hay suficientes)
    if (allNonSecondary.length >= 1) {
      const numToPromote = Math.min(2, allNonSecondary.length);
      
      const promoted = allNonSecondary.slice(0, numToPromote).map(ing => ({
        ...ing,
        role: 'structural' as IngredientRole,
        reason: `Promoted to structural (no other structural found)`,
      }));
      
      const remaining = allNonSecondary.slice(numToPromote);
      
      return {
        structural: promoted,
        flexiblePrimary: remaining,
        flexibleSecondary,
      };
    }
  }
  
  // Sin ajustes necesarios
  return { structural, flexiblePrimary, flexibleSecondary };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula macros totales del plato
 */
function calculateTotalMacros(ingredients: MealIngredient[]): MacroValues {
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

/**
 * Calcula perfil macro de un ingrediente (% de calorías)
 */
function calculateMacroProfile(ingredient: MealIngredient): {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
} {
  const totalCals = ingredient.calories || 1;
  const protein = ingredient.protein || 0;
  const carbs = ingredient.carbs || 0;
  const fat = ingredient.fat || 0;
  
  return {
    proteinPct: (protein * 4 / totalCals) * 100,
    carbsPct: (carbs * 4 / totalCals) * 100,
    fatPct: (fat * 9 / totalCals) * 100,
  };
}

/**
 * Explica por qué un ingrediente fue clasificado de cierta forma
 */
function explainClassification(
  ingredient: MealIngredient,
  category: string,
  role: IngredientRole,
  totalCalories: number
): string {
  const calories = ingredient.calories || 0;
  const percentage = ((calories / Math.max(totalCalories, 1)) * 100).toFixed(1);
  const profile = calculateMacroProfile(ingredient);
  
  if (role === 'structural') {
    return `Structural: ${percentage}% of dish, category: ${category || 'unknown'}`;
  }
  
  if (role === 'flexible_secondary') {
    if (ALWAYS_FLEXIBLE_SECONDARY_CATEGORIES.some(cat => category.includes(cat))) {
      return `Flexible secondary: ${category} (condiment/fat)`;
    }
    if (profile.fatPct > 60) {
      return `Flexible secondary: ${percentage}% of dish, ${profile.fatPct.toFixed(0)}% fat dominant`;
    }
    return `Flexible secondary: ${percentage}% of dish`;
  }
  
  // flexible_primary
  return `Flexible primary: ${percentage}% of dish, category: ${category || 'unknown'}`;
}

/**
 * Calcula metadata de la clasificación
 */
function calculateMetadata(
  structural: ClassifiedIngredient[],
  flexiblePrimary: ClassifiedIngredient[],
  flexibleSecondary: ClassifiedIngredient[],
  totalMacros: MacroValues
): IngredientClassification['metadata'] {
  const totalIngredients = structural.length + flexiblePrimary.length + flexibleSecondary.length;
  
  // Core ratio: % de calorías que es structural
  const structuralCalories = structural.reduce((sum, ing) => sum + (ing.calories || 0), 0);
  const coreRatio = (structuralCalories / Math.max(totalMacros.calories, 1)) * 100;
  
  // Dominant macro
  const proteinCals = totalMacros.protein * 4;
  const carbsCals = totalMacros.carbs * 4;
  const fatCals = totalMacros.fat * 9;
  const totalCals = Math.max(proteinCals + carbsCals + fatCals, 1);
  
  const proteinPct = (proteinCals / totalCals) * 100;
  const carbsPct = (carbsCals / totalCals) * 100;
  const fatPct = (fatCals / totalCals) * 100;
  
  let dominantMacro: PriorityMacro = 'carbs';
  if (proteinPct > carbsPct && proteinPct > fatPct) dominantMacro = 'protein';
  else if (fatPct > carbsPct && fatPct > proteinPct) dominantMacro = 'fat';
  else dominantMacro = 'carbs';
  
  // Complexity
  let complexity: DishComplexity = 'medium';
  if (totalIngredients <= 3) complexity = 'simple';
  else if (totalIngredients >= 7) complexity = 'complex';
  
  return {
    coreRatio,
    dominantMacro,
    complexity,
    totalIngredients,
    distribution: {
      structural: structural.length,
      flexiblePrimary: flexiblePrimary.length,
      flexibleSecondary: flexibleSecondary.length,
    },
  };
}
