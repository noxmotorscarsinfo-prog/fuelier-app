import { User, DailyLog, Meal, MealType, MealIngredient } from '../types';
import { getMealGoals, calculateOptimalPortion } from './mealDistribution';

/**
 * SISTEMA INTELIGENTE DE ADAPTACIÓN DE COMIDAS
 * 
 * Este sistema adapta automáticamente las cantidades de ingredientes de cada comida
 * según el perfil nutricional del usuario, sus objetivos, y el contexto del día.
 * 
 * PRINCIPIOS:
 * 1. Personalización total: Cada usuario ve cantidades adaptadas a SUS necesidades
 * 2. Contexto dinámico: Las cantidades cambian según lo que ya comió en el día
 * 3. Compensación inteligente: Si comió de más/menos antes, se ajusta automáticamente
 * 4. Transparencia: El usuario solo ve las cantidades finales, no "porciones"
 */

export interface AdaptedMeal extends Meal {
  adaptationContext: {
    portionMultiplier: number; // Multiplicador interno (no se muestra al usuario)
    targetCalories: number; // Objetivo calculado para esta comida
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    compensatingFor: 'deficit' | 'surplus' | 'none'; // Si está compensando comidas previas
    mealsLeftInDay: number; // Cuántas comidas faltan (incluida esta)
    isLastMeal: boolean; // Si es la última comida del día
    adaptationReason: string; // Explicación de por qué se adaptó así
  };
  adaptedIngredients: AdaptedIngredient[]; // Ingredientes con cantidades personalizadas
}

export interface AdaptedIngredient {
  name: string;
  amount: number; // Cantidad en gramos/ml
  unit: string; // g, ml, unidad
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isBaseIngredient: boolean; // Si es ingrediente principal o complemento
}

/**
 * Calcula cuántas comidas faltan por registrar en el día
 */
function calculateMealsLeft(user: User, currentLog: DailyLog, currentMealType: MealType): number {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const registeredCount = mealTypes.filter(type => type !== currentMealType && currentLog[type]).length;
  const totalMealsPerDay = user.mealsPerDay || 3;
  return totalMealsPerDay - registeredCount; // Incluye la comida actual
}

/**
 * Detecta si el usuario está en déficit o superávit respecto a lo esperado hasta ahora
 */
function detectCompensationNeeded(
  user: User,
  currentLog: DailyLog,
  mealType: MealType
): { type: 'deficit' | 'surplus' | 'none'; amount: number } {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  
  // Calcular lo que debería haber consumido hasta ahora
  let expectedTotal = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  let actualTotal = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  mealTypes.forEach(type => {
    if (type !== mealType && currentLog[type]) {
      const mealGoals = getMealGoals(user, type);
      expectedTotal.calories += mealGoals.calories;
      expectedTotal.protein += mealGoals.protein;
      expectedTotal.carbs += mealGoals.carbs;
      expectedTotal.fat += mealGoals.fat;
      
      const actual = currentLog[type]!;
      actualTotal.calories += actual.calories;
      actualTotal.protein += actual.protein;
      actualTotal.carbs += actual.carbs;
      actualTotal.fat += actual.fat;
    }
  });
  
  const caloriesDiff = actualTotal.calories - expectedTotal.calories;
  
  if (Math.abs(caloriesDiff) < 100) {
    return { type: 'none', amount: 0 };
  } else if (caloriesDiff < 0) {
    return { type: 'deficit', amount: Math.abs(caloriesDiff) };
  } else {
    return { type: 'surplus', amount: caloriesDiff };
  }
}

/**
 * Genera un mensaje explicativo de por qué se adaptó la comida de esta manera
 */
function generateAdaptationReason(
  mealsLeft: number,
  compensation: { type: 'deficit' | 'surplus' | 'none'; amount: number },
  portionMultiplier: number
): string {
  if (mealsLeft === 1) {
    return 'Cantidades calculadas para completar exactamente tus objetivos del día';
  } else if (mealsLeft === 2) {
    if (compensation.type === 'deficit') {
      return `Cantidades aumentadas para compensar el déficit de ${Math.round(compensation.amount)} kcal de comidas anteriores`;
    } else if (compensation.type === 'surplus') {
      return `Cantidades reducidas para compensar el superávit de ${Math.round(compensation.amount)} kcal de comidas anteriores`;
    }
  }
  
  if (portionMultiplier < 0.9) {
    return 'Cantidades ajustadas a un tamaño más ligero según tus necesidades';
  } else if (portionMultiplier > 1.1) {
    return 'Cantidades aumentadas según tus necesidades energéticas';
  }
  
  return 'Cantidades calculadas específicamente para tus objetivos nutricionales';
}

/**
 * Adapta los ingredientes de una comida según el multiplicador de porción
 * y genera ingredientes detallados con cantidades personalizadas
 */
function adaptIngredientsToUser(
  meal: Meal,
  portionMultiplier: number,
  user: User
): AdaptedIngredient[] {
  // Si la comida ya tiene ingredientes detallados, usarlos
  if (meal.detailedIngredients && meal.detailedIngredients.length > 0) {
    return meal.detailedIngredients.map(ing => ({
      name: ing.ingredientName,
      amount: Math.round(ing.amount * portionMultiplier),
      unit: 'g',
      calories: Math.round(ing.calories * portionMultiplier),
      protein: Math.round(ing.protein * portionMultiplier),
      carbs: Math.round(ing.carbs * portionMultiplier),
      fat: Math.round(ing.fat * portionMultiplier),
      isBaseIngredient: true
    }));
  }
  
  // Si solo tiene ingredientes simples, parsearlos y adaptarlos
  if (meal.ingredients && meal.ingredients.length > 0) {
    return meal.ingredients.map(ingredient => {
      // Parsear cantidad del ingrediente (ej: "100g avena" → 100)
      const amountMatch = ingredient.match(/([0-9.]+)\s*(g|ml|unidad|unidades)?/i);
      const baseAmount = amountMatch ? parseFloat(amountMatch[1]) : 100;
      const unit = amountMatch && amountMatch[2] ? amountMatch[2] : 'g';
      
      // Limpiar nombre
      let name = ingredient
        .replace(/^\\d+(\\.\\d+)?\\s*(g|ml|unidad|unidades|kg|l)?\\s*(de\\s)?/i, '')
        .trim();
      
      // Capitalizar primera letra
      if (name && name[0] === name[0].toLowerCase()) {
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }
      
      // Calcular cantidad adaptada
      const adaptedAmount = Math.round(baseAmount * portionMultiplier);
      
      // Estimar macros proporcionalmente (distribución equitativa como placeholder)
      const totalMacros = {
        calories: meal.calories * portionMultiplier,
        protein: meal.protein * portionMultiplier,
        carbs: meal.carbs * portionMultiplier,
        fat: meal.fat * portionMultiplier
      };
      
      const proportionOfTotal = baseAmount / (meal.ingredients?.reduce((sum, ing) => {
        const match = ing.match(/([0-9.]+)/);
        return sum + (match ? parseFloat(match[1]) : 100);
      }, 0) || 1);
      
      return {
        name,
        amount: adaptedAmount,
        unit,
        calories: Math.round(totalMacros.calories * proportionOfTotal),
        protein: Math.round(totalMacros.protein * proportionOfTotal),
        carbs: Math.round(totalMacros.carbs * proportionOfTotal),
        fat: Math.round(totalMacros.fat * proportionOfTotal),
        isBaseIngredient: true
      };
    });
  }
  
  // Fallback: crear un ingrediente genérico
  return [{
    name: meal.name,
    amount: 1,
    unit: 'porción',
    calories: Math.round(meal.calories * portionMultiplier),
    protein: Math.round(meal.protein * portionMultiplier),
    carbs: Math.round(meal.carbs * portionMultiplier),
    fat: Math.round(meal.fat * portionMultiplier),
    isBaseIngredient: true
  }];
}

/**
 * FUNCIÓN PRINCIPAL: Adapta una comida al perfil del usuario y al contexto del día
 * 
 * Esta función:
 * 1. Calcula cuántas comidas faltan en el día
 * 2. Detecta si hay déficit/superávit de comidas anteriores
 * 3. Calcula la porción óptima considerando TODO el contexto
 * 4. Adapta las cantidades de ingredientes automáticamente
 * 5. Genera un mensaje explicativo
 * 
 * @returns Una comida completamente adaptada con ingredientes personalizados
 */
export function adaptMealToUser(
  meal: Meal,
  user: User,
  currentLog: DailyLog,
  mealType: MealType
): AdaptedMeal {
  // 1. Calcular contexto del día
  const mealsLeft = calculateMealsLeft(user, currentLog, mealType);
  const isLastMeal = mealsLeft === 1;
  const compensation = detectCompensationNeeded(user, currentLog, mealType);
  
  // 2. Obtener objetivos base para este tipo de comida
  const mealGoals = getMealGoals(user, mealType);
  
  // 3. Calcular la porción óptima usando la lógica existente
  const portionMultiplier = calculateOptimalPortion(user, currentLog, meal, true);
  
  // 4. Calcular objetivos ajustados (lo que realmente debe comer)
  const targetCalories = Math.round(meal.calories * portionMultiplier);
  const targetProtein = Math.round(meal.protein * portionMultiplier);
  const targetCarbs = Math.round(meal.carbs * portionMultiplier);
  const targetFat = Math.round(meal.fat * portionMultiplier);
  
  // 5. Adaptar ingredientes con las cantidades personalizadas
  const adaptedIngredients = adaptIngredientsToUser(meal, portionMultiplier, user);
  
  // 6. Generar mensaje explicativo
  const adaptationReason = generateAdaptationReason(mealsLeft, compensation, portionMultiplier);
  
  // 7. Crear comida adaptada
  const adaptedMeal: AdaptedMeal = {
    ...meal,
    // Actualizar macros al valor adaptado
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: targetFat,
    // Contexto de adaptación
    adaptationContext: {
      portionMultiplier,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      compensatingFor: compensation.type,
      mealsLeftInDay: mealsLeft,
      isLastMeal,
      adaptationReason
    },
    adaptedIngredients
  };
  
  return adaptedMeal;
}

/**
 * Adapta un array de comidas al usuario
 * Útil para listas de recomendaciones
 */
export function adaptMealsToUser(
  meals: Meal[],
  user: User,
  currentLog: DailyLog,
  mealType: MealType
): AdaptedMeal[] {
  return meals.map(meal => adaptMealToUser(meal, user, currentLog, mealType));
}

/**
 * Genera un resumen visual del nivel de adaptación
 */
export function getAdaptationLevel(portionMultiplier: number): {
  level: 'muy-reducido' | 'reducido' | 'normal' | 'aumentado' | 'muy-aumentado';
  icon: string;
  color: string;
  label: string;
} {
  if (portionMultiplier < 0.6) {
    return {
      level: 'muy-reducido',
      icon: '⬇️',
      color: 'text-blue-600',
      label: 'Porción reducida'
    };
  } else if (portionMultiplier < 0.9) {
    return {
      level: 'reducido',
      icon: '↘️',
      color: 'text-blue-500',
      label: 'Ligeramente reducido'
    };
  } else if (portionMultiplier <= 1.1) {
    return {
      level: 'normal',
      icon: '✅',
      color: 'text-green-600',
      label: 'Tamaño ideal'
    };
  } else if (portionMultiplier <= 1.5) {
    return {
      level: 'aumentado',
      icon: '↗️',
      color: 'text-amber-600',
      label: 'Ligeramente aumentado'
    };
  } else {
    return {
      level: 'muy-aumentado',
      icon: '⬆️',
      color: 'text-red-600',
      label: 'Porción aumentada'
    };
  }
}

/**
 * Verifica si una comida adaptada se ajusta bien a los objetivos del usuario
 */
export function evaluateMealFit(adaptedMeal: AdaptedMeal, user: User): {
  overallScore: number; // 0-100
  caloriesMatch: number; // % de ajuste
  proteinMatch: number;
  carbsMatch: number;
  fatMatch: number;
  verdict: 'excelente' | 'bueno' | 'aceptable' | 'necesita-ajuste';
  message: string;
} {
  const mealGoals = getMealGoals(user, adaptedMeal.type);
  
  const caloriesMatch = Math.min(100, (adaptedMeal.calories / mealGoals.calories) * 100);
  const proteinMatch = Math.min(100, (adaptedMeal.protein / mealGoals.protein) * 100);
  const carbsMatch = Math.min(100, (adaptedMeal.carbs / mealGoals.carbs) * 100);
  const fatMatch = Math.min(100, (adaptedMeal.fat / mealGoals.fat) * 100);
  
  const overallScore = (caloriesMatch + proteinMatch + carbsMatch + fatMatch) / 4;
  
  let verdict: 'excelente' | 'bueno' | 'aceptable' | 'necesita-ajuste';
  let message: string;
  
  if (overallScore >= 90) {
    verdict = 'excelente';
    message = '¡Perfecto! Esta comida se ajusta excelentemente a tus necesidades';
  } else if (overallScore >= 75) {
    verdict = 'bueno';
    message = 'Muy buena opción, cubre la mayoría de tus necesidades';
  } else if (overallScore >= 60) {
    verdict = 'aceptable';
    message = 'Opción aceptable, puedes complementar con otros alimentos';
  } else {
    verdict = 'necesita-ajuste';
    message = 'Esta comida puede necesitar ajustes para optimizar tus macros';
  }
  
  return {
    overallScore: Math.round(overallScore),
    caloriesMatch: Math.round(caloriesMatch),
    proteinMatch: Math.round(proteinMatch),
    carbsMatch: Math.round(carbsMatch),
    fatMatch: Math.round(fatMatch),
    verdict,
    message
  };
}
