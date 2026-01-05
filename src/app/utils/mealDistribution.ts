import { MacroGoals, MealType, User, DailyLog, Meal } from '../types';
import { calculateBMR as calculateBMRFromMacros, calculateTDEE as calculateTDEEFromMacros, calculateTargetCalories as calculateTargetCaloriesFromMacros, mapUserGoalToInternalGoal } from './macroCalculations';

export interface MealGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * NUEVO: Obtiene los tipos de comida activos según el número de comidas al día
 * ACTUALIZADO: Ahora también considera la estructura personalizada del usuario (si existe)
 * 2 comidas: lunch + dinner
 * 3 comidas: breakfast + lunch + dinner
 * 4 comidas: breakfast + lunch + snack + dinner
 * 5 comidas: breakfast + lunch + snack (mid-morning) + snack (afternoon) + dinner
 */
export function getActiveMealTypes(mealsPerDay: number, customStructure?: { activeMeals: MealType[] }): MealType[] {
  // Si el usuario tiene una estructura personalizada, usarla
  if (customStructure?.activeMeals && customStructure.activeMeals.length > 0) {
    return customStructure.activeMeals;
  }
  
  // Si no, usar la estructura predeterminada según número de comidas
  switch (mealsPerDay) {
    case 2:
      return ['lunch', 'dinner'];
    case 3:
      return ['breakfast', 'lunch', 'dinner'];
    case 4:
      return ['breakfast', 'lunch', 'snack', 'dinner'];
    case 5:
      // Para 5 comidas, usamos breakfast, lunch, 2 snacks y dinner
      // Pero como solo tenemos 4 tipos, duplicamos snack conceptualmente
      return ['breakfast', 'lunch', 'snack', 'dinner'];
    default:
      return ['breakfast', 'lunch', 'snack', 'dinner'];
  }
}

/**
 * PASO 6: Distribución de calorías por tipo de comida según objetivo Y número de comidas
 * Diferentes distribuciones según el objetivo del usuario y cuántas comidas hace al día
 * ACTUALIZADO: Prioriza la distribución personalizada del usuario si existe
 */
export function getMealDistribution(user: User): Record<MealType, number> {
  // PRIORIDAD 1: Si el usuario tiene una distribución personalizada, usarla directamente
  if (user.mealDistribution) {
    // Convertir los porcentajes (0-100) a fracciones (0-1)
    return {
      breakfast: user.mealDistribution.breakfast / 100,
      lunch: user.mealDistribution.lunch / 100,
      snack: user.mealDistribution.snack / 100,
      dinner: user.mealDistribution.dinner / 100
    };
  }
  
  // PRIORIDAD 2: Si no hay distribución personalizada, calcular según objetivo y número de comidas
  const goalType = mapUserGoalToInternalGoal(user.goal);
  const mealsPerDay = user.mealsPerDay || 3;
  const activeMeals = getActiveMealTypes(mealsPerDay, user.mealStructure);
  
  // Inicializar todas las comidas en 0
  const distribution: Record<MealType, number> = {
    breakfast: 0,
    lunch: 0,
    snack: 0,
    dinner: 0
  };
  
  // Distribuciones según número de comidas y objetivo
  if (mealsPerDay === 2) {
    // 2 comidas: lunch (más grande) + dinner
    if (goalType === 'aggressive-cut' || goalType === 'moderate-cut' || goalType === 'mild-cut') {
      // Perder peso: Comida principal más grande
      distribution.lunch = 0.60;   // 60%
      distribution.dinner = 0.40;  // 40%
    } else {
      // Mantener/Ganar: Más equilibrado
      distribution.lunch = 0.55;   // 55%
      distribution.dinner = 0.45;  // 45%
    }
  } else if (mealsPerDay === 3) {
    // 3 comidas: breakfast + lunch + dinner
    if (goalType === 'aggressive-cut' || goalType === 'moderate-cut' || goalType === 'mild-cut') {
      // Perder peso: Desayuno grande, cena ligera
      distribution.breakfast = 0.30; // 30%
      distribution.lunch = 0.45;     // 45%
      distribution.dinner = 0.25;    // 25%
    } else if (goalType === 'mild-bulk' || goalType === 'moderate-bulk') {
      // Ganar músculo: Más equilibrado
      distribution.breakfast = 0.25; // 25%
      distribution.lunch = 0.40;     // 40%
      distribution.dinner = 0.35;    // 35%
    } else {
      // Mantener: Equilibrado
      distribution.breakfast = 0.30; // 30%
      distribution.lunch = 0.40;     // 40%
      distribution.dinner = 0.30;    // 30%
    }
  } else if (mealsPerDay === 4) {
    // 4 comidas: breakfast + lunch + snack + dinner
    if (goalType === 'aggressive-cut' || goalType === 'moderate-cut' || goalType === 'mild-cut') {
      // Perder peso: Desayuno grande, cena ligera
      distribution.breakfast = 0.30; // 30%
      distribution.lunch = 0.35;     // 35%
      distribution.snack = 0.10;     // 10%
      distribution.dinner = 0.25;    // 25%
    } else if (goalType === 'mild-bulk' || goalType === 'moderate-bulk') {
      // Ganar músculo: Merienda más sustancial
      distribution.breakfast = 0.25; // 25%
      distribution.lunch = 0.35;     // 35%
      distribution.snack = 0.15;     // 15%
      distribution.dinner = 0.25;    // 25%
    } else {
      // Mantener: Equilibrado
      distribution.breakfast = 0.25; // 25%
      distribution.lunch = 0.35;     // 35%
      distribution.snack = 0.15;     // 15%
      distribution.dinner = 0.25;    // 25%
    }
  } else if (mealsPerDay === 5) {
    // 5 comidas: breakfast + lunch + 2 snacks + dinner
    // Nota: Como solo tenemos 4 tipos de comida, la distribución se mantiene en 4
    // pero con proporciones ajustadas para 5 comidas pequeñas
    if (goalType === 'aggressive-cut' || goalType === 'moderate-cut' || goalType === 'mild-cut') {
      distribution.breakfast = 0.25; // 25%
      distribution.lunch = 0.30;     // 30%
      distribution.snack = 0.20;     // 20% (representa 2 snacks pequeños)
      distribution.dinner = 0.25;    // 25%
    } else {
      // Ganar músculo o mantener: Más equilibrado
      distribution.breakfast = 0.20; // 20%
      distribution.lunch = 0.30;     // 30%
      distribution.snack = 0.25;     // 25% (representa 2 snacks)
      distribution.dinner = 0.25;    // 25%
    }
  }
  
  return distribution;
}

/**
 * PASO 7: Calcular los macros recomendados para un tipo de comida específico
 * NUEVO ENFOQUE: Distribuir macros proporcionalmente según el porcentaje de calorías
 * CON CORRECCIÓN DE REDONDEO: Garantiza que la suma de todas las comidas = objetivo diario exacto
 */
export function getMealGoals(user: User, mealType: MealType): MealGoals {
  // Usar los goals del usuario (que deberían calcularse con calculateMacros)
  const totalGoals = user.goals;
  
  // Obtener el porcentaje de calorías para esta comida
  const mealDistribution = getMealDistribution(user);
  const caloriePercentage = mealDistribution[mealType];
  
  console.log(`🎯 getMealGoals for ${mealType}:`, {
    userHasCustomDistribution: !!user.mealDistribution,
    customDistribution: user.mealDistribution,
    calculatedDistribution: mealDistribution,
    caloriePercentage,
    totalCalories: totalGoals.calories
  });
  
  // Si el porcentaje es 0 (comida no activa), devolver 0
  if (caloriePercentage === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  
  // NUEVO: Distribuir TODOS los macros proporcionalmente según el porcentaje de calorías
  // Esto garantiza que si sumas todas las comidas, obtienes exactamente el total del día
  const calories = Math.round(totalGoals.calories * caloriePercentage);
  const protein = Math.round(totalGoals.protein * caloriePercentage);
  const carbs = Math.round(totalGoals.carbs * caloriePercentage);
  const fat = Math.round(totalGoals.fat * caloriePercentage);
  
  console.log(`✅ Meal goals for ${mealType}:`, { calories, protein, carbs, fat });
  
  return {
    calories,
    protein,
    carbs,
    fat
  };
}

/**
 * NUEVA FUNCIÓN: Calcular distribución de macros con corrección de redondeo
 * Garantiza que la suma total de todas las comidas activas = objetivo diario exacto
 */
export function getAllMealGoals(user: User): Record<MealType, MealGoals> {
  const totalGoals = user.goals;
  const mealDistribution = getMealDistribution(user);
  const activeMealTypes = getActiveMealTypes(user.mealsPerDay || 3, user.mealStructure);
  
  // Inicializar resultado
  const result: Record<MealType, MealGoals> = {
    breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    snack: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 }
  };
  
  // Calcular valores base con redondeo para cada comida activa
  let totalCaloriesDistributed = 0;
  let totalProteinDistributed = 0;
  let totalCarbsDistributed = 0;
  let totalFatDistributed = 0;
  
  activeMealTypes.forEach(mealType => {
    const percentage = mealDistribution[mealType];
    result[mealType] = {
      calories: Math.round(totalGoals.calories * percentage),
      protein: Math.round(totalGoals.protein * percentage),
      carbs: Math.round(totalGoals.carbs * percentage),
      fat: Math.round(totalGoals.fat * percentage)
    };
    
    totalCaloriesDistributed += result[mealType].calories;
    totalProteinDistributed += result[mealType].protein;
    totalCarbsDistributed += result[mealType].carbs;
    totalFatDistributed += result[mealType].fat;
  });
  
  // CORRECCIÓN DE REDONDEO: Ajustar la última comida para que la suma sea exacta
  if (activeMealTypes.length > 0) {
    const lastMealType = activeMealTypes[activeMealTypes.length - 1];
    
    result[lastMealType].calories += (totalGoals.calories - totalCaloriesDistributed);
    result[lastMealType].protein += (totalGoals.protein - totalProteinDistributed);
    result[lastMealType].carbs += (totalGoals.carbs - totalCarbsDistributed);
    result[lastMealType].fat += (totalGoals.fat - totalFatDistributed);
  }
  
  return result;
}

/**
 * Calcula cuánto falta para completar los objetivos de una comida
 */
export function getRemainingForMeal(
  user: User,
  currentLog: DailyLog,
  meal: Meal
): MealGoals {
  const mealGoals = getMealGoals(user, Array.isArray(meal.type) ? meal.type[0] : meal.type);
  
  // Obtener la comida actual del log
  const mealType = Array.isArray(meal.type) ? meal.type[0] : meal.type;
  const currentMeal = currentLog[mealType];
  
  if (!currentMeal) {
    return mealGoals;
  }
  
  return {
    calories: Math.max(0, mealGoals.calories - currentMeal.calories),
    protein: Math.max(0, mealGoals.protein - currentMeal.protein),
    carbs: Math.max(0, mealGoals.carbs - currentMeal.carbs),
    fat: Math.max(0, mealGoals.fat - currentMeal.fat)
  };
}

/**
 * PASO 9: Calcula la ración óptima para acercarse a los objetivos de la comida
 * Retorna un multiplicador que ajusta el plato para aproximarse a las calorías y macros recomendados
 * Si isInitialSelection es true, intenta un ajuste más preciso (sin redondear tanto)
 * MEJORA: Ahora ajusta dinámicamente según cuántas comidas faltan en el día
 */
export function calculateOptimalPortion(
  user: User,
  currentLog: DailyLog,
  meal: Meal,
  isInitialSelection: boolean = true
): number {
  // Manejar meal.type que puede ser un array
  const mealType = Array.isArray(meal.type) ? meal.type[0] : meal.type;
  
  // 1. Calcular el objetivo de esta comida según distribución personalizada
  const mealGoals = getMealGoals(user, mealType);
  
  // 2. Calcular cuánto se ha consumido en TODO el día
  const totalConsumed = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
  
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  mealTypes.forEach(type => {
    // Solo contar comidas de otros tipos (no la que estamos reemplazando)
    if (type !== mealType && currentLog[type]) {
      const currentMeal = currentLog[type]!;
      totalConsumed.calories += currentMeal.calories;
      totalConsumed.protein += currentMeal.protein;
      totalConsumed.carbs += currentMeal.carbs;
      totalConsumed.fat += currentMeal.fat;
    }
  });
  
  // 3. Calcular cuántas comidas ya están registradas (excluyendo la actual)
  const otherMealsCount = mealTypes.filter(type => type !== mealType && currentLog[type]).length;
  
  // NUEVO: Calcular cuántas comidas FALTAN por registrar (incluyendo la actual)
  const totalMealsPerDay = user.mealsPerDay || 3;
  const mealsLeft = totalMealsPerDay - otherMealsCount; // Incluye la actual
  
  // 4. Calcular objetivo AJUSTADO de esta comida
  let targetForThisMeal = { ...mealGoals };
  
  // NUEVO: Calcular el total del día que debería consumir
  const dailyGoals = {
    calories: user.goals.calories,
    protein: user.goals.protein,
    carbs: user.goals.carbs,
    fat: user.goals.fat
  };
  
  // NUEVO: Calcular cuánto FALTA para completar el día
  const remaining = {
    calories: dailyGoals.calories - totalConsumed.calories,
    protein: dailyGoals.protein - totalConsumed.protein,
    carbs: dailyGoals.carbs - totalConsumed.carbs,
    fat: dailyGoals.fat - totalConsumed.fat
  };
  
  // ESTRATEGIA MEJORADA: Ajustar según cuántas comidas faltan
  if (mealsLeft === 1) {
    // ¡ES LA ÚLTIMA COMIDA! → Debe cubrir TODO lo que falta
    targetForThisMeal = { ...remaining };
  } else if (mealsLeft === 2) {
    // Quedan 2 comidas → Distribuir lo que falta entre ambas
    // Esta comida cubre la mitad de lo que falta + su objetivo base
    targetForThisMeal = {
      calories: Math.round(remaining.calories / 2),
      protein: Math.round(remaining.protein / 2),
      carbs: Math.round(remaining.carbs / 2),
      fat: Math.round(remaining.fat / 2)
    };
  } else if (otherMealsCount > 0) {
    // Hay varias comidas restantes → Compensar parcialmente el déficit/superávit
    // Calcular cuánto deberían haber sumado las otras comidas según distribución
    let expectedFromOthers = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
    
    mealTypes.forEach(type => {
      if (type !== mealType && currentLog[type]) {
        const otherMealGoals = getMealGoals(user, type);
        expectedFromOthers.calories += otherMealGoals.calories;
        expectedFromOthers.protein += otherMealGoals.protein;
        expectedFromOthers.carbs += otherMealGoals.carbs;
        expectedFromOthers.fat += otherMealGoals.fat;
      }
    });
    
    // Calcular el déficit/superávit de las otras comidas
    const deficit = {
      calories: expectedFromOthers.calories - totalConsumed.calories,
      protein: expectedFromOthers.protein - totalConsumed.protein,
      carbs: expectedFromOthers.carbs - totalConsumed.carbs,
      fat: expectedFromOthers.fat - totalConsumed.fat
    };
    
    // Ajustar el objetivo de esta comida para compensar (con límites razonables)
    // Si quedan 3+ comidas: máximo ±40% de ajuste
    const maxAdjustment = 0.4;
    
    targetForThisMeal.calories = Math.round(
      mealGoals.calories + Math.max(-mealGoals.calories * maxAdjustment, Math.min(deficit.calories, mealGoals.calories * maxAdjustment))
    );
    targetForThisMeal.protein = Math.round(
      mealGoals.protein + Math.max(-mealGoals.protein * maxAdjustment, Math.min(deficit.protein, mealGoals.protein * maxAdjustment))
    );
    targetForThisMeal.carbs = Math.round(
      mealGoals.carbs + Math.max(-mealGoals.carbs * maxAdjustment, Math.min(deficit.carbs, mealGoals.carbs * maxAdjustment))
    );
    targetForThisMeal.fat = Math.round(
      mealGoals.fat + Math.max(-mealGoals.fat * maxAdjustment, Math.min(deficit.fat, mealGoals.fat * maxAdjustment))
    );
  }
  
  if (meal.calories === 0) return 1;
  
  // 5. NUEVO ALGORITMO: Calcular porción óptima usando un enfoque multi-criterio mejorado
  // Prioridad 1: Proteína (es el macro más importante y limitante)
  // Prioridad 2: Calorías totales
  // Prioridad 3: Balance entre carbos y grasas
  
  const portionsByCalories = targetForThisMeal.calories / meal.calories;
  const portionsByProtein = meal.protein > 0 ? targetForThisMeal.protein / meal.protein : portionsByCalories;
  const portionsByCarbs = meal.carbs > 0 ? targetForThisMeal.carbs / meal.carbs : portionsByCalories;
  const portionsByFat = meal.fat > 0 ? targetForThisMeal.fat / meal.fat : portionsByCalories;
  
  // NUEVA ESTRATEGIA: Elegir el multiplicador que mejor balance TODOS los macros
  // sin exceder ninguno drásticamente
  
  // Calcular el ratio de macros del plato vs los objetivos
  const mealRatios = {
    protein: meal.protein / meal.calories, // g proteína por caloría
    carbs: meal.carbs / meal.calories,
    fat: meal.fat / meal.calories
  };
  
  const targetRatios = {
    protein: targetForThisMeal.protein / targetForThisMeal.calories,
    carbs: targetForThisMeal.carbs / targetForThisMeal.calories,
    fat: targetForThisMeal.fat / targetForThisMeal.calories
  };
  
  // Detectar qué macro del plato está MÁS concentrado respecto al objetivo
  const ratioDeviations = {
    protein: mealRatios.protein / targetRatios.protein,
    carbs: mealRatios.carbs / targetRatios.carbs,
    fat: mealRatios.fat / targetRatios.fat
  };
  
  // ESTRATEGIA MEJORADA: 
  // Si el plato tiene MUCHA proteína → limitar por proteína (para no pasarnos)
  // Si el plato es bajo en proteína → limitar por calorías (para llegar a la energía necesaria)
  
  let optimalRatio;
  
  if (ratioDeviations.protein > 1.3) {
    // El plato tiene >30% más proteína de lo ideal → LIMITAR POR PROTEÍNA
    // para evitar pasarnos de proteína
    optimalRatio = portionsByProtein * 0.95; // Ligeramente reducido para margen
  } else if (ratioDeviations.protein < 0.7) {
    // El plato tiene <70% de la proteína ideal → LIMITAR POR CALORÍAS
    // y aceptar que faltará proteína (se complementará en otras comidas)
    optimalRatio = portionsByCalories;
  } else {
    // El plato está balanceado → Usar promedio ponderado inteligente
    // PRIORIDAD: Proteína > Calorías > Carbos/Grasas
    optimalRatio = (
      portionsByProtein * 0.45 +  // 45% peso en proteína (aumentado)
      portionsByCalories * 0.35 + // 35% peso en calorías (reducido)
      portionsByCarbs * 0.10 +    // 10% carbos
      portionsByFat * 0.10        // 10% grasas
    );
  }
  
  // NUEVO: Límites más estrictos para evitar porciones extremas
  let minPortion = 0.5;
  let maxPortion = 1.8; // REDUCIDO de 2.0 a 1.8
  
  if (mealsLeft === 1) {
    // Última comida: Permitir más flexibilidad pero controlada
    minPortion = 0.3;
    maxPortion = 2.0; // Máximo 2x en la última comida
  } else if (mealsLeft === 2) {
    // Penúltima comida: Algo más flexible
    minPortion = 0.4;
    maxPortion = 1.9;
  }
  
  // Aplicar límites
  optimalRatio = Math.max(minPortion, Math.min(maxPortion, optimalRatio));
  
  // Si es selección inicial, ser más preciso (redondear a 0.05 en lugar de 0.25)
  if (isInitialSelection) {
    // Redondear a múltiplos de 0.05 para mayor precisión
    return Math.round(optimalRatio * 20) / 20;
  }
  
  // Redondear de forma inteligente para ajustes manuales
  let rounded: number;
  
  if (optimalRatio <= 0.3) {
    rounded = 0.25;
  } else if (optimalRatio <= 0.6) {
    rounded = 0.5;
  } else if (optimalRatio <= 0.85) {
    rounded = 0.75;
  } else if (optimalRatio <= 1.15) {
    rounded = 1;
  } else if (optimalRatio <= 1.4) {
    rounded = 1.25;
  } else if (optimalRatio <= 1.65) {
    rounded = 1.5;
  } else if (optimalRatio <= 1.9) {
    rounded = 1.75;
  } else {
    rounded = 2;
  }
  
  // Limitar entre 0.25 y 2 raciones
  return Math.max(0.25, Math.min(2, rounded));
}

/**
 * Obtiene el nombre legible del tipo de comida
 */
export function getMealTypeName(mealType: MealType): string {
  const names = {
    breakfast: 'Desayuno',
    lunch: 'Comida',
    snack: 'Merienda',
    dinner: 'Cena'
  };
  return names[mealType];
}

/**
 * Calcula el porcentaje de macros completados para una comida
 */
export function getMealProgress(
  user: User,
  mealType: MealType,
  currentMeal: { calories: number; protein: number; carbs: number; fat: number } | null
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  overall: number;
} {
  const mealGoals = getMealGoals(user, mealType);
  
  if (!currentMeal) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      overall: 0
    };
  }
  
  const caloriesProgress = Math.min(100, (currentMeal.calories / mealGoals.calories) * 100);
  const proteinProgress = Math.min(100, (currentMeal.protein / mealGoals.protein) * 100);
  const carbsProgress = Math.min(100, (currentMeal.carbs / mealGoals.carbs) * 100);
  const fatProgress = Math.min(100, (currentMeal.fat / mealGoals.fat) * 100);
  
  const overall = (caloriesProgress + proteinProgress + carbsProgress + fatProgress) / 4;
  
  return {
    calories: Math.round(caloriesProgress),
    protein: Math.round(proteinProgress),
    carbs: Math.round(carbsProgress),
    fat: Math.round(fatProgress),
    overall: Math.round(overall)
  };
}