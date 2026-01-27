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

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Ingrediente con valores macro (extendido de DB)
 */
export interface Ingredient {
  id: string;
  name: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  // Aliases for backward compatibility
  caloriesPerGram?: number;
  proteinPerGram?: number;
  carbsPerGram?: number;
  fatPerGram?: number;
}

/**
 * Ingrediente en comida con cantidad
 */
export interface MealIngredient {
  ingredientId: string;
  ingredientName: string;
  amount: number; // gramos
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Ingrediente escalado (resultado)
 */
export interface ScaledIngredient {
  ingredientId: string;
  ingredientName: string;
  amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Paso de ajuste (para tracking)
 */
export interface AdjustmentStep {
  ingredientId: string;
  ingredientName: string;
  originalAmount: number;
  newAmount: number;
  change: number;
  reason: string;
}

/**
 * Comida completa
 */
export interface Meal {
  id: string;
  name: string;
  mealIngredients: MealIngredient[];
}

// ============================================================================
// CLASSIFICATION TYPES
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
 * Niveles de preservación de esencia (0-100)
 */
export type PreservationLevel = number;

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
 * Incluye todas las propiedades necesarias para scaling
 */
export interface ClassifiedIngredient {
  // Identificación
  id: string;
  ingredientId: string; // Alias for backward compatibility
  name: string;
  ingredientName?: string; // Alias for backward compatibility
  
  // Cantidad y valores actuales
  amount: number; // gramos
  originalAmount: number; // Para calcular preservation
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  
  // Valores por gramo (para cálculos)
  caloriesPerGram: number;
  proteinPerGram: number;
  carbsPerGram: number;
  fatPerGram: number;
  
  // Clasificación
  role: IngredientRole;
  reason: string; // Reasoning para la clasificación
  reasoning?: string; // Alias for backward compatibility
  category?: string; // proteina, carbohidrato, vegetal, grasa, etc.
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
  
  /** Macro prioritario (legacy - para compatibilidad) */
  priorityMacro?: 'calories' | 'protein' | 'carbs' | 'fat';
  
  /** Confianza en la decisión (0-100) */
  confidence?: number;
  
  /** Accuracy esperado */
  expectedAccuracy?: number;
  
  /** Consideraciones adicionales */
  considerations?: string[];
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
  
  /** Número de iteraciones (si aplica) */
  iterations?: number;
  
  /** Pasos de ajuste (opcional) */
  steps?: AdjustmentStep[];
  
  /** Targets usados (opcional) */
  targetMacros?: MacroTargets;
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
// NOTE: All types are already exported above
// ============================================================================
