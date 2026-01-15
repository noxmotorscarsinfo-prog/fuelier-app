/**
 * ============================================================================
 * SCALING TYPES - FUELIER AI ENGINE v3.0
 * ============================================================================
 * 
 * Interfaces y tipos para el sistema híbrido de escalado.
 * 
 * Principios:
 * 1. Separación clara entre clasificación, decisión y ejecución
 * 2. Audit trail completo
 * 3. Type safety total
 * 
 * @version 3.0
 * @author FUELIER Engineering Team
 * @date 2026-01-15
 */

// Use relative import to avoid path alias issues
import type { MealIngredient, Meal } from '../../../types';
import type { Ingredient } from '../../../data/ingredientTypes';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Macro targets
 */
export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Macro values (same structure as targets)
 */
export interface MacroValues extends MacroTargets {}

/**
 * Tipos de ingredientes según su rol en el plato
 */
export type IngredientRole = 'structural' | 'flexible_primary' | 'flexible_secondary';

/**
 * Niveles de preservación de esencia
 */
export type PreservationLevel = 'maximum' | 'high' | 'medium' | 'low';

/**
 * Métodos de escalado disponibles
 */
export type ScalingMethod = 'global_scaling' | 'hierarchical' | 'lp_optimized' | 'fallback';

/**
 * Approach estratégico
 */
export type StrategyApproach = 'global_scaling' | 'hierarchical_adjustment' | 'lp_optimization';

/**
 * Macro prioritario
 */
export type PriorityMacro = 'calories' | 'protein' | 'carbs' | 'fat';

/**
 * Complejidad del plato
 */
export type DishComplexity = 'simple' | 'medium' | 'complex';

// ============================================================================
// INGREDIENT CLASSIFICATION
// ============================================================================

/**
 * Ingrediente con su rol clasificado
 */
export interface ClassifiedIngredient extends MealIngredient {
  role: IngredientRole;
  reason: string; // Por qué se clasificó así
  originalAmount: number; // Cantidad base para calcular preservation
  category?: string; // Categoría del ingrediente (proteina, carbohidrato, etc.)
}

/**
 * Resultado de la clasificación de ingredientes
 */
export interface IngredientClassification {
  /** Ingredientes estructurales (núcleo del plato) - mantener ratios */
  structural: ClassifiedIngredient[];
  
  /** Ingredientes flexibles primarios (ajustar primero) */
  flexiblePrimary: ClassifiedIngredient[];
  
  /** Ingredientes flexibles secundarios (ajustar si necesario) */
  flexibleSecondary: ClassifiedIngredient[];
  
  /** Metadata sobre la clasificación */
  metadata: {
    /** Porcentaje del plato que es structural (0-100) */
    coreRatio: number;
    
    /** Macro dominante del plato */
    dominantMacro: PriorityMacro;
    
    /** Complejidad del plato */
    complexity: DishComplexity;
    
    /** Total de ingredientes */
    totalIngredients: number;
    
    /** Total de calorías */
    totalCalories: number;
    
    /** Distribución por rol */
    distribution: {
      structural: number;
      flexiblePrimary: number;
      flexibleSecondary: number;
    };
  };
}

// ============================================================================
// STRATEGY DECISION
// ============================================================================

/**
 * Decisión estratégica (NO calcula gramos)
 */
export interface StrategyDecision {
  /** Approach recomendado */
  approach: StrategyApproach;
  
  /** Macro prioritario a optimizar */
  priority: PriorityMacro;
  
  /** IDs de ingredientes que PUEDEN ajustarse */
  adjustableIngredients: string[];
  
  /** Nivel de preservación deseado */
  preservationLevel: PreservationLevel;
  
  /** Razón de la decisión */
  reason: string;
  
  /** Contexto usado para la decisión */
  context: {
    compatibilityScore: number;
    mealsLeft: number;
    percentageOfDay: number;
    isLastMeal: boolean;
  };
}

// ============================================================================
// SCALING RESULTS
// ============================================================================

/**
 * Resultado de un intento de escalado
 */
export interface ScalingResult {
  /** Ingredientes escalados */
  scaledIngredients: MealIngredient[];
  
  /** Macros alcanzados */
  achievedMacros: MacroValues;
  
  /** Accuracy (0-100) */
  accuracy: number;
  
  /** Método usado */
  method: ScalingMethod;
  
  /** Preservation score (0-100) */
  preservationScore: number;
  
  /** Número de iteraciones (si aplica) */
  iterations: number;
  
  /** Razón del resultado */
  reason: string;
  
  /** Detalles de desviaciones */
  deviations: {
    calories: number; // % error
    protein: number;
    carbs: number;
    fat: number;
    maxError: number; // Mayor error absoluto
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Resultado de validación
 */
export interface ValidationResult {
  /** ¿Aprobado? */
  approved: boolean;
  
  /** Accuracy */
  accuracy: number;
  
  /** ¿Cumple tolerancias? */
  meetsTolerances: boolean;
  
  /** Violaciones detectadas */
  violations: string[];
  
  /** Sugerencias */
  suggestions: string[];
  
  /** Preservation score */
  preservationScore: number;
  
  /** Hard rules violadas */
  hardRulesViolations: string[];
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

/**
 * Intento de escalado registrado
 */
export interface ScalingAttempt {
  /** Método intentado */
  method: ScalingMethod;
  
  /** Resultado del intento */
  result: ScalingResult;
  
  /** ¿Aceptado? */
  accepted: boolean;
  
  /** Razón de aceptación/rechazo */
  reason: string;
  
  /** Tiempo de ejecución (ms) */
  executionTimeMs: number;
}

/**
 * Audit trail completo
 */
export interface AuditTrail {
  /** Clasificación de ingredientes */
  classification: IngredientClassification;
  
  /** Decisión estratégica */
  strategy: StrategyDecision;
  
  /** Todos los intentos realizados */
  attempts: ScalingAttempt[];
  
  /** Decisión final */
  finalChoice: {
    method: ScalingMethod;
    accuracy: number;
    preservationScore: number;
    reasoning: string;
  };
  
  /** Métricas de performance */
  performance: {
    totalTimeMs: number;
    lpCalls: number;
    totalIterations: number;
    methodsAttempted: number;
  };
  
  /** Warnings (si hay) */
  warnings: string[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Contexto diario del usuario
 */
export interface DailyContext {
  remainingMacros: MacroTargets;
  percentageOfDay: number;
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  userGoals: MacroTargets;
  flexibilityLevel: 'strict' | 'moderate' | 'flexible';
  mealsLeft: number;
  isLastMeal?: boolean; // If true, prioritize accuracy over preservation
}

/**
 * Opciones de configuración para el escalado
 */
export interface ScalingOptions {
  /** Máximo número de iteraciones */
  maxIterations?: number;
  
  /** Timeout en ms */
  timeoutMs?: number;
  
  /** Forzar método específico */
  forceMethod?: ScalingMethod;
  
  /** Nivel de preservación mínimo */
  minPreservation?: number;
  
  /** Accuracy mínimo aceptable */
  minAccuracy?: number;
  
  /** Habilitar audit trail completo */
  enableAuditTrail?: boolean;
}

/**
 * Input completo para el sistema de escalado
 */
export interface ScalingInput {
  meal: Meal;
  target: MacroTargets;
  context: DailyContext;
  allIngredients: Ingredient[];
  options?: ScalingOptions;
}

/**
 * Output completo del sistema de escalado
 */
export interface ScalingOutput {
  /** Resultado del escalado */
  result: ScalingResult;
  
  /** Validación */
  validation: ValidationResult;
  
  /** Audit trail (si está habilitado) */
  auditTrail?: AuditTrail;
}

// ============================================================================
// PRESERVATION CALCULATION
// ============================================================================

/**
 * Detalles de preservación por ingrediente
 */
export interface IngredientPreservation {
  ingredientId: string;
  ingredientName: string;
  originalAmount: number;
  scaledAmount: number;
  ratio: number; // scaledAmount / originalAmount
  preservationScore: number; // 0-100
  role: IngredientRole;
}

/**
 * Análisis completo de preservación
 */
export interface PreservationAnalysis {
  /** Score global (0-100) */
  globalScore: number;
  
  /** Score por rol */
  byRole: {
    structural: number;
    flexiblePrimary: number;
    flexibleSecondary: number;
  };
  
  /** Detalles por ingrediente */
  ingredients: IngredientPreservation[];
  
  /** Ratio máximo de desviación */
  maxDeviation: number;
  
  /** ¿Se preservó la esencia? */
  essencePreserved: boolean;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  // Re-export from other modules
  MealIngredient,
  Meal,
  Ingredient,
};
