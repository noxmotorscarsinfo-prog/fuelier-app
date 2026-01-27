export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

// Pool de comidas: Light (desayunos/meriendas) y Main (comidas/cenas)
export type MealPool = 'light' | 'main';

// Función helper para obtener el pool de un tipo de comida
// CORREGIDO: Ahora acepta tanto un MealType como un array de MealTypes
export function getMealPool(mealType: MealType | MealType[]): MealPool {
  // Si es un array, usar el primer tipo para determinar el pool
  const type = Array.isArray(mealType) ? mealType[0] : mealType;
  if (type === 'breakfast' || type === 'snack') {
    return 'light';
  }
  return 'main'; // lunch o dinner
}

// Función helper para verificar si un plato pertenece a un tipo de comida
export function mealMatchesType(meal: Meal, targetType: MealType): boolean {
  if (Array.isArray(meal.type)) {
    return meal.type.includes(targetType);
  }
  return meal.type === targetType;
}

// Función helper para obtener todos los tipos de un plato como array
export function getMealTypes(meal: Meal): MealType[] {
  return Array.isArray(meal.type) ? meal.type : [meal.type];
}

// NUEVO: Referencia a ingrediente en una receta
export interface MealIngredientReference {
  ingredientId: string;
  amountInGrams: number; // Cantidad base de referencia
}

// Ingrediente para edición (legacy - mantener compatibilidad)
export interface Ingredient {
  id: string;
  name: string;
  unit: 'g' | 'ml' | 'unidades'; // Unidad de medida
  defaultAmount: number; // Cantidad por defecto (ej: 100g)
  calories: number; // por la cantidad por defecto
  protein: number; // por la cantidad por defecto
  carbs: number; // por la cantidad por defecto
  fat: number; // por la cantidad por defecto
  category: 'proteína' | 'carbohidrato' | 'grasa' | 'vegetal' | 'fruta' | 'lácteo' | 'cereal' | 'legumbre' | 'otro';
  isCustom?: boolean; // true si es creado por el usuario
  isGlobal?: boolean; // true si fue creado por el admin y está disponible para todos
  createdBy?: string; // email del usuario o admin que lo creó
}

export interface MealIngredient {
  ingredientId: string;
  ingredientName: string;
  amount: number; // en gramos
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// NUEVO: Para platos personalizados que se pueden recalcular
export interface CustomMealSettings {
  allowRecalculation: boolean; // Si se puede recalcular automáticamente
  preferredPortion: number; // Porción preferida base (multiplicador)
  macroTarget?: 'match_daily' | 'match_meal' | 'keep_original'; // Cómo recalcular
  lastRecalculated?: string; // Fecha de último recálculo
}

// NUEVO: Para platos personalizados que se pueden recalcular
export interface CustomMealSettings {
  allowRecalculation: boolean; // Si se puede recalcular automáticamente
  preferredPortion: number; // Porción preferida base (multiplicador)
  macroTarget?: 'match_daily' | 'match_meal' | 'keep_original'; // Cómo recalcular
  lastRecalculated?: string; // Fecha de último recálculo
}

export interface Meal {
  id: string;
  name: string;
  type: MealType | MealType[]; // Ahora puede ser un tipo único o array de tipos
  variant?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[]; // Para comidas predefinidas (legacy)
  description?: string; // Descripción del plato
  baseQuantity: number; // Base quantity for calculations
  isCustom?: boolean; // true si es creado por el usuario
  isFavorite?: boolean; // true si el usuario lo marcó como favorito
  isGlobal?: boolean; // true si fue creado por el admin y está disponible para todos
  createdBy?: string; // email del usuario o admin que lo creó
  detailedIngredients?: MealIngredient[]; // Para comidas personalizadas
  combinedMeals?: { main: Meal; complement: Meal }; // NUEVO: Para comidas combinadas (main + complement)
  
  // NUEVO: Referencias a ingredientes de la base de datos
  ingredientReferences?: MealIngredientReference[]; // Lista de ingredientes con cantidades base
  
  // NUEVO: Pasos de preparación y tips para platos personalizados
  preparationSteps?: string[]; // Pasos para preparar el plato
  tips?: string[]; // Consejos y tips opcionales
  
  // NUEVO: Flags para escalado inteligente
  isPerfectMatch?: boolean; // true si el plato fue escalado para ajustarse 100% a macros restantes
  perfectMatch?: boolean; // Alias para compatibilidad - indica ajuste perfecto en última comida
  isLastMeal?: boolean; // true si es la última comida del día (para ajuste al 100%)
  scaledForTarget?: boolean; // true si el plato fue escalado automáticamente
  proportionCompatibility?: number; // Score 0-100 de compatibilidad de proporciones con objetivo
  
  // NUEVO: Para tracking de porción aplicada
  portionMultiplier?: number; // Multiplicador de porción aplicado
  baseMeal?: { // Macros originales del plato antes de escalar
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  
  // NUEVO: Para platos personalizados recalculables
  customMealSettings?: CustomMealSettings;
  
  // NUEVO: Control de escalado automático
  allowScaling?: boolean; // true = plato escalable (default), false = plato fijo (no escalar)
  scalingType?: 'scalable' | 'fixed'; // Tipo de plato: escalable o fijo 
  isFixedMeal?: boolean; // Runtime flag: true si el plato no fue escalado porque es fijo // Configuración de recálculo
}

export interface DailyLog {
  date: string;
  breakfast: Meal | null;
  lunch: Meal | null;
  snack: Meal | null;
  dinner: Meal | null;
  extraFoods?: { name: string; calories: number; protein: number; carbs: number; fat: number }[];
  complementaryMeals?: Meal[]; // Comidas complementarias para completar el día
  weight?: number; // Peso diario en kg
  isSaved?: boolean; // Si el día está guardado en el calendario
  notes?: string; // Notas opcionales del día
}

export interface SavedDiet {
  id: string;
  name: string;
  description?: string;
  date: string; // Fecha en que se creó la plantilla
  breakfast: Meal | null;
  lunch: Meal | null;
  snack: Meal | null;
  dinner: Meal | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  tags?: string[]; // Ej: "Alto en proteína", "Vegetariano", etc.
  isFavorite?: boolean;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// NUEVO: Distribución personalizada de calorías entre comidas
export interface MealDistribution {
  breakfast: number; // Porcentaje (0-100)
  lunch: number;
  snack: number;
  dinner: number;
  // Total debe sumar 100
}

// NUEVO: Configuración de estructura de comidas personalizada
export interface MealStructure {
  activeMeals: MealType[]; // Comidas activas en orden (ej: ['breakfast', 'lunch', 'dinner'])
  customLabels?: Partial<Record<MealType, string>>; // Nombres personalizados opcionales
}

export interface User {
  email: string;
  name: string;
  sex: 'male' | 'female';
  age: number; // años
  birthdate?: string; // NUEVO: Fecha de nacimiento (formato YYYY-MM-DD)
  weight: number; // kg
  height: number; // cm
  
  // ===== COMPOSICIÓN CORPORAL (CRÍTICO) =====
  bodyFatPercentage?: number; // % de grasa corporal (opcional pero altamente recomendado)
  leanBodyMass?: number; // kg de masa magra (calculado automáticamente si hay % grasa)
  
  // ===== ACTIVIDAD FÍSICA DETALLADA =====
  trainingFrequency: number; // veces por semana (0-7)
  trainingIntensity?: 'light' | 'moderate' | 'intense'; // Intensidad del entrenamiento
  trainingType?: 'strength' | 'cardio' | 'mixed' | 'hiit' | 'crossfit'; // Tipo de entrenamiento
  trainingTimePreference?: 'morning' | 'afternoon' | 'evening'; // Cuándo entrena
  
  // ===== NEAT - Actividad No Asociada al Ejercicio (CRÍTICO) =====
  lifestyleActivity?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  occupation?: 'desk_job' | 'standing_job' | 'walking_job' | 'physical_job'; // Tipo de trabajo
  dailySteps?: number; // Pasos promedio diarios (si tiene smartwatch)
  
  // ===== OBJETIVOS Y METAS =====
  goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain'; // Objetivo nutricional (5 opciones)
  mealsPerDay: number; // Número de comidas al día (2-5)
  goals: MacroGoals;
  selectedMacroOption?: 'maintenance' | 'light' | 'moderate-low' | 'moderate-high' | 'aggressive'; // NUEVO: Opción de macros seleccionada
  mealDistribution?: MealDistribution; // NUEVO: Distribución personalizada de calorías entre comidas
  mealStructure?: MealStructure; // NUEVO: Estructura personalizada de comidas
  
  // ===== HISTORIAL METABÓLICO (DETECCIÓN DE METABOLISMO ADAPTADO) =====
  previousDietHistory?: {
    hadRestrictiveDiet: boolean; // ¿Ha hecho dietas muy restrictivas antes? (<1200 kcal)
    monthsInRestriction?: number; // ¿Cuántos meses en restricción?
    weightRegained?: boolean; // ¿Recuperó peso después de una dieta?
    lastDietEndDate?: string; // Fecha de fin de la última dieta
  };
  
  // ===== TRACKING Y ADAPTACIÓN =====
  weeklyProgress?: WeeklyProgressRecord[]; // Registro de progreso semanal
  metabolicAdaptation?: {
    isAdapted: boolean; // ¿Metabolismo adaptado detectado?
    adaptationLevel: 'none' | 'mild' | 'moderate' | 'severe'; // Nivel de adaptación
    recommendedPhase: 'reverse_diet' | 'maintenance' | 'cut' | 'bulk'; // Fase recomendada
  };
  
  preferences: {
    likes: string[];
    dislikes: string[];
    intolerances: string[];
    allergies: string[];
    // NUEVO: Preferencias de porciones por tipo de comida
    portionPreferences?: {
      breakfast?: 'small' | 'normal' | 'large'; // Preferencia de tamaño de desayuno
      lunch?: 'small' | 'normal' | 'large';
      snack?: 'small' | 'normal' | 'large';
      dinner?: 'small' | 'normal' | 'large';
    };
  };
  acceptedMeals?: string[]; // IDs de comidas que el usuario ha aceptado (para aprendizaje)
  rejectedMeals?: string[]; // IDs de comidas que el usuario ha rechajado o ajustado significativamente
  adaptationHistory?: MealAdaptationRecord[]; // NUEVO: Historial de adaptaciones
  customIngredients?: Ingredient[]; // NUEVO: Ingredientes personalizados del usuario
  favoriteIngredientIds?: string[]; // NUEVO: IDs de ingredientes favoritos del usuario
  isAdmin?: boolean; // true si el usuario es administrador
  
  // ===== ENTRENAMIENTO =====
  trainingOnboarded?: boolean; // Si el usuario ha configurado su entrenamiento
  trainingDays?: number; // Número de días de entrenamiento por semana
  // ELIMINADO: trainingWeekPlan - ahora se guarda solo en KV Store (trainingPlan:${email})
  createdAt?: string; // Fecha de creación de la cuenta
  settings?: {
    autoSaveDays?: boolean;
    timezone?: string;
  };
}

// NUEVO: Registro de adaptaciones de comidas para aprendizaje
export interface MealAdaptationRecord {
  mealId: string;
  mealName: string;
  mealType: MealType;
  date: string;
  portionMultiplier: number;
  wasAccepted: boolean; // Si el usuario confirmó la comida o la cambió
  userAdjustedPortion?: number; // Si ajustó manualmente, cuánto
  goalCompletion: {
    calories: number; // Porcentaje de objetivo completado
    protein: number;
    carbs: number;
    fat: number;
    overall: 'perfect' | 'good' | 'needsAdjustment';
  };
  contextAtTime: {
    mealsLeftInDay: number;
    caloriesConsumedSoFar: number;
    compensatingFor: 'deficit' | 'surplus' | 'none';
  };
}

// ===== TRACKING DE PROGRESO SEMANAL (SISTEMA ADAPTATIVO) =====
export interface WeeklyProgressRecord {
  weekStartDate: string; // Fecha de inicio de la semana (formato YYYY-MM-DD)
  weekNumber: number; // Semana #1, #2, #3, etc.
  
  // Mediciones físicas
  startWeight: number; // kg al inicio de la semana
  endWeight: number; // kg al final de la semana
  weightChange: number; // kg ganados/perdidos
  averageWeight: number; // Promedio de pesos durante la semana
  
  // Composición corporal (si está disponible)
  startBodyFat?: number; // % grasa al inicio
  endBodyFat?: number; // % grasa al final
  bodyFatChange?: number; // Cambio en %
  
  // Adherencia nutricional
  daysLogged: number; // Días que registró comidas (0-7)
  averageCalories: number; // Promedio de calorías consumidas
  targetCalories: number; // Objetivo de calorías
  calorieAdherence: number; // % de adherencia (0-100)
  
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  
  // Feedback subjetivo del usuario
  energyLevels?: ('low' | 'normal' | 'high')[]; // Array de 7 días
  hungerLevels?: ('very_hungry' | 'hungry' | 'satisfied' | 'full' | 'too_full')[]; // Array de 7 días
  workoutQuality?: ('poor' | 'ok' | 'good' | 'excellent')[]; // Array de días de entrenamiento
  
  // Rendimiento
  workoutsDone: number; // Entrenamientos completados
  workoutsPlanned: number; // Entrenamientos planeados
  workoutAdherence: number; // % de adherencia al plan de entrenamiento
  
  // Análisis y recomendaciones
  weeklyAnalysis: {
    trend: 'losing_fast' | 'losing_moderate' | 'losing_slow' | 'maintaining' | 'gaining_slow' | 'gaining_moderate' | 'gaining_fast';
    isOnTrack: boolean; // ¿Va según lo planeado?
    needsAdjustment: boolean; // ¿Necesita ajustar calorías?
    adjustmentRecommendation?: string; // Ej: "Aumentar 100 kcal/día"
    adjustmentAmount?: number; // +/- calorías recomendadas
  };
  
  // Detección de metabolismo adaptado
  metabolicFlags?: {
    weightStagnant: boolean; // Peso estancado 2+ semanas
    energyDropping: boolean; // Energía constantemente baja
    hungerIncreasing: boolean; // Hambre aumentando progresivamente
    performanceDecreasing: boolean; // Rendimiento en el gym bajando
    mightBeAdapted: boolean; // Flag de advertencia
  };
}

// ============================================
// TRAINING SYSTEM TYPES
// ============================================

export interface ExerciseSet {
  setNumber: number;
  weight: number; // kg
  reps: number;
  completed: boolean;
  previousRecord?: { // Registro anterior para mostrar progresión
    weight: number;
    reps: number;
    date: string;
  };
}

export interface Exercise {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'cardio' | 'other';
  muscleGroup: string; // Ej: "Pectoral", "Cuádriceps"
  icon?: string; // URL o nombre del icono
  sets: ExerciseSet[];
  notes?: string; // Notas del usuario sobre el ejercicio
  isCustom?: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  name: string; // Ej: "Push Day A", "Leg Day"
  exercises: Exercise[];
  completed: boolean;
  duration?: number; // minutos
  notes?: string;
  userEmail: string;
}

export interface WeeklyRoutine {
  id: string;
  name: string; // Ej: "PPL 6 días", "Full Body"
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean; // true si es la rutina actual
  schedule: {
    monday?: string; // ID del template de workout o null si es día de descanso
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

export interface WorkoutTemplate {
  id: string;
  name: string; // Ej: "Push Day A"
  userEmail: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    category: string;
    sets: number;
    targetReps: string; // Ej: "8-12", "15-20"
    notes?: string;
  }[];
  isGlobal?: boolean; // Templates predefinidos del sistema
  createdBy?: string;
}

export interface DailyFeedback {
  date: string; // Fecha (formato YYYY-MM-DD)
  
  // Energía durante el día
  morningEnergy: 'low' | 'normal' | 'high'; // ¿Cómo te levantaste?
  afternoonEnergy: 'low' | 'normal' | 'high'; // ¿Cómo te sentiste después de comer?
  eveningEnergy: 'low' | 'normal' | 'high'; // ¿Cómo terminaste el día?
  
  // Hambre
  wakeUpHunger: 'not_hungry' | 'slightly_hungry' | 'hungry' | 'very_hungry';
  betweenMealsHunger: 'satisfied' | 'slight_hunger' | 'moderate_hunger' | 'very_hungry';
  beforeBedHunger: 'full' | 'satisfied' | 'slightly_hungry' | 'hungry';
  
  // Rendimiento (si entrenó)
  trainedToday: boolean;
  workoutQuality?: 'poor' | 'ok' | 'good' | 'excellent';
  workoutType?: 'strength' | 'cardio' | 'mixed' | 'hiit' | 'other';
  workoutDuration?: number; // minutos
  
  // Estado general
  mood: 'bad' | 'ok' | 'good' | 'great';
  stressLevel: 'low' | 'moderate' | 'high';
  sleepQuality: 'poor' | 'ok' | 'good' | 'excellent';
  sleepHours: number;
  
  // Digestión y saciedad
  digestiveComfort: 'uncomfortable' | 'ok' | 'comfortable';
  mealsSkipped: MealType[]; // Comidas que saltó
  reasonsSkipped?: string[]; // Razones: "No tenía hambre", "No tuve tiempo", etc.
  
  // Notas adicionales
  notes?: string;
}

export interface BugReport {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}
