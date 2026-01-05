import { Meal, MacroGoals, MealType, User, DailyLog } from '../types';
import { getMealGoals, MEAL_DISTRIBUTION } from './mealDistribution';
import { analyzeUserPatterns, predictAcceptanceProbability, applyUserPreferences } from './userLearningSystem';

export interface MealScore {
  meal: Meal;  // Meal ORIGINAL (base, sin escalar)
  scaledMeal?: Meal;  // ✅ NUEVO: Meal escalado (si existe)
  score: number;
  reasons: string[];
  macroFit: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  preferencePenalty?: number;
  preferenceBonus?: number;
  adaptationScore?: number;
  userAcceptanceProbability?: number;
  personalizedPortion?: number;
}

/**
 * Calcula qué macros le faltan al usuario para alcanzar sus objetivos
 */
export const calculateRemainingMacros = (
  goals: MacroGoals,
  consumed: { calories: number; protein: number; carbs: number; fat: number }
) => {
  return {
    calories: Math.max(0, goals.calories - consumed.calories),
    protein: Math.max(0, goals.protein - consumed.protein),
    carbs: Math.max(0, goals.carbs - consumed.carbs),
    fat: Math.max(0, goals.fat - consumed.fat)
  };
};

/**
 * NUEVA FUNCIÓN: Verifica si un plato contiene algún ingrediente específico
 * Busca en el nombre del plato y en la lista de ingredientes
 */
const mealContainsIngredient = (meal: Meal, ingredient: string): boolean => {
  const searchTerm = ingredient.toLowerCase();
  
  // Buscar en el nombre del plato
  if (meal.name.toLowerCase().includes(searchTerm)) {
    return true;
  }
  
  // Buscar en los ingredientes (legacy)
  if (meal.ingredients && meal.ingredients.length > 0) {
    return meal.ingredients.some(ing => ing.toLowerCase().includes(searchTerm));
  }
  
  // Buscar en ingredientes detallados (nuevos platos personalizados)
  if (meal.detailedIngredients && meal.detailedIngredients.length > 0) {
    return meal.detailedIngredients.some(ing => ing.ingredientName.toLowerCase().includes(searchTerm));
  }
  
  return false;
};

/**
 * NUEVA FUNCIÓN: Evalúa un plato basándose en las preferencias del usuario
 * Devuelve: { shouldExclude: boolean, penalty: number, bonus: number, reasons: string[] }
 */
export const evaluatePreferences = (
  meal: Meal,
  preferences?: { likes: string[]; dislikes: string[]; intolerances: string[]; allergies: string[] }
): { shouldExclude: boolean; penalty: number; bonus: number; reasons: string[] } => {
  if (!preferences) {
    return { shouldExclude: false, penalty: 0, bonus: 0, reasons: [] };
  }

  let penalty = 0;
  let bonus = 0;
  const reasons: string[] = [];
  let shouldExclude = false;

  // 1. ALERGIAS - CRÍTICO: Excluir completamente
  if (preferences.allergies && preferences.allergies.length > 0) {
    for (const allergen of preferences.allergies) {
      if (mealContainsIngredient(meal, allergen)) {
        shouldExclude = true;
        reasons.push(`🚫 Contiene ${allergen} (alergia)`);
        return { shouldExclude: true, penalty: 0, bonus: 0, reasons };
      }
    }
  }

  // 2. INTOLERANCIAS - Penalización muy alta (casi excluir)
  if (preferences.intolerances && preferences.intolerances.length > 0) {
    for (const intolerance of preferences.intolerances) {
      if (mealContainsIngredient(meal, intolerance)) {
        penalty += 50; // Penalización muy alta
        reasons.push(`⚠️ Contiene ${intolerance} (intolerancia)`);
      }
    }
  }

  // 3. NO ME GUSTA - Penalización moderada
  if (preferences.dislikes && preferences.dislikes.length > 0) {
    for (const dislike of preferences.dislikes) {
      if (mealContainsIngredient(meal, dislike)) {
        penalty += 20;
        reasons.push(`👎 Contiene ${dislike} (no te gusta)`);
      }
    }
  }

  // 4. ME GUSTA - Bonus
  if (preferences.likes && preferences.likes.length > 0) {
    let likeCount = 0;
    const foundLikes: string[] = [];
    
    for (const like of preferences.likes) {
      if (mealContainsIngredient(meal, like)) {
        likeCount++;
        foundLikes.push(like);
      }
    }
    
    if (likeCount > 0) {
      // Bonus escalado: 12 por el primero, +8 por cada adicional
      bonus += 12 + (likeCount - 1) * 8;
      
      if (likeCount === 1) {
        reasons.push(`❤️ Contiene ${foundLikes[0]} (te gusta)`);
      } else if (likeCount === 2) {
        reasons.push(`❤️ Contiene ${foundLikes.join(' y ')} (te gustan)`);
      } else {
        reasons.push(`❤️ Contiene ${likeCount} ingredientes que te gustan`);
      }
    }
  }

  return { shouldExclude, penalty, bonus, reasons };
};

/**
 * ✅ CORREGIDO: Calcula qué tan bien se ajusta una comida ESCALADA a las necesidades
 * Score de 0-100 donde 100 es perfecto
 * 
 * IMPORTANTE: Ahora acepta el meal ya escalado
 */
export const scoreMealFit = (
  meal: Meal,  // ✅ Meal ya escalado
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  goals: MacroGoals
): MealScore => {
  const reasons: string[] = [];
  let score = 0;

  // Si ya cumplió sus objetivos, penalizar comidas altas en calorías
  if (remaining.calories === 0) {
    score = Math.max(0, 100 - (meal.calories / goals.calories) * 100);
    reasons.push('Ya alcanzaste tus calorías diarias');
    return {
      meal,
      score,
      reasons,
      macroFit: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    };
  }

  // ✅ CLAVE: Calcular qué tan bien se ajusta cada macro usando el meal ESCALADO
  const caloriesFit = remaining.calories > 0 
    ? Math.max(0, 100 - Math.abs(meal.calories - remaining.calories) / remaining.calories * 100)
    : 0;

  const proteinFit = remaining.protein > 0
    ? Math.max(0, 100 - Math.abs(meal.protein - remaining.protein) / remaining.protein * 100)
    : 0;

  const carbsFit = remaining.carbs > 0
    ? Math.max(0, 100 - Math.abs(meal.carbs - remaining.carbs) / remaining.carbs * 100)
    : 0;

  const fatFit = remaining.fat > 0
    ? Math.max(0, 100 - Math.abs(meal.fat - remaining.fat) / remaining.fat * 100)
    : 0;

  // Score ponderado (calorías y proteína son más importantes)
  score = (caloriesFit * 0.35) + (proteinFit * 0.35) + (carbsFit * 0.15) + (fatFit * 0.15);

  // Bonus: Si la comida está dentro del 10% del target de calorías
  if (meal.calories >= remaining.calories * 0.9 && meal.calories <= remaining.calories * 1.1) {
    score += 10;
    reasons.push('Ajuste perfecto de calorías');
  }

  // Bonus: Si la proteína es alta y te falta proteína
  const proteinPercent = meal.calories > 0 ? (meal.protein * 4) / meal.calories : 0;
  if (proteinPercent > 0.25 && remaining.protein > goals.protein * 0.3) {
    score += 8;
    reasons.push('Alto en proteína');
  }

  // Bonus: Si tiene buen balance de macros
  if (meal.calories > 0) {
    const proteinCals = meal.protein * 4;
    const carbsCals = meal.carbs * 4;
    const fatCals = meal.fat * 9;
    const proteinRatio = proteinCals / meal.calories;
    const carbsRatio = carbsCals / meal.calories;
    const fatRatio = fatCals / meal.calories;

    if (proteinRatio >= 0.2 && proteinRatio <= 0.35 && 
        carbsRatio >= 0.35 && carbsRatio <= 0.55 &&
        fatRatio >= 0.15 && fatRatio <= 0.35) {
      score += 5;
      reasons.push('Balance equilibrado');
    }
  }

  // Advertencias si excede lo que necesita
  if (meal.calories > remaining.calories * 1.3) {
    reasons.push('⚠️ Excede calorías necesarias');
    score -= 10;
  }

  // Calcular qué % de cada macro restante cubre
  const macroFit = {
    calories: remaining.calories > 0 ? (meal.calories / remaining.calories) * 100 : 0,
    protein: remaining.protein > 0 ? (meal.protein / remaining.protein) * 100 : 0,
    carbs: remaining.carbs > 0 ? (meal.carbs / remaining.carbs) * 100 : 0,
    fat: remaining.fat > 0 ? (meal.fat / remaining.fat) * 100 : 0
  };

  return {
    meal,  // ✅ Este meal ya viene escalado
    score: Math.min(100, Math.max(0, score)),
    reasons: reasons.length > 0 ? reasons : ['Opción válida'],
    macroFit
  };
};

/**
 * ✅ SIMPLIFICADO: Ordena las comidas escaladas por mejor ajuste
 * 
 * IMPORTANTE: Ahora recibe meals YA ESCALADOS desde rankMealsByFit
 * Solo aplica preferencias y patrones de usuario
 */
export const recommendMeals = (
  meals: Meal[],  // ✅ Meals ya escalados
  goals: MacroGoals,
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  user?: User,
  currentLog?: DailyLog,
  mealType?: MealType
): MealScore[] => {
  
  // ✅ SIMPLIFICADO: El target lo calcula automaticTargetCalculator
  // Solo calculamos remaining para el scoring
  const remaining = calculateRemainingMacros(goals, consumed);
  
  console.log('📊 recommendMeals - Scoring meals escalados:', {
    numMeals: meals.length,
    remaining,
    firstMealMacros: meals[0] ? {
      name: meals[0].name,
      cal: meals[0].calories,
      prot: meals[0].protein
    } : 'no meals'
  });
  
  // ✅ Score los meals (que ya vienen escalados)
  const scoredMeals = meals.map(meal => scoreMealFit(meal, remaining, goals));
  
  // NUEVO: Aplicar preferencias del usuario si están disponibles
  let filteredAndAdjustedMeals = scoredMeals;
  
  if (user?.preferences) {
    // Primero, filtrar platos con alergias
    filteredAndAdjustedMeals = scoredMeals.filter(scoredMeal => {
      const prefEval = evaluatePreferences(scoredMeal.meal, user.preferences);
      return !prefEval.shouldExclude; // Excluir si tiene alergias
    });
    
    // Luego, ajustar scores basándose en preferencias
    filteredAndAdjustedMeals = filteredAndAdjustedMeals.map(scoredMeal => {
      const prefEval = evaluatePreferences(scoredMeal.meal, user.preferences);
      
      // Ajustar el score con penalty y bonus
      let adjustedScore = scoredMeal.score - prefEval.penalty + prefEval.bonus;
      adjustedScore = Math.min(100, Math.max(0, adjustedScore)); // Mantener entre 0-100
      
      // Combinar las razones de macros con las de preferencias
      const combinedReasons = [...scoredMeal.reasons, ...prefEval.reasons];
      
      return {
        ...scoredMeal,
        score: adjustedScore,
        reasons: combinedReasons,
        preferencePenalty: prefEval.penalty,
        preferenceBonus: prefEval.bonus
      };
    });
  }
  
  // NUEVO: Aplicar adaptación al usuario
  if (user) {
    filteredAndAdjustedMeals = filteredAndAdjustedMeals.map(scoredMeal => {
      // Calcular score de adaptación (0-20 puntos adicionales)
      let adaptationScore = 0;
      const patterns = analyzeUserPatterns(user);
      
      // Bonus si la comida está en el top de aceptadas históricamente
      if (patterns.mostAcceptedMeals.includes(scoredMeal.meal.id)) {
        adaptationScore += 15;
        scoredMeal.reasons.push('⭐ Una de tus comidas favoritas');
      }
      
      // Penalización si está en las menos aceptadas
      if (patterns.leastAcceptedMeals.includes(scoredMeal.meal.id)) {
        adaptationScore -= 10;
      }
      
      // Probabilidad de aceptación del usuario
      const basePortion = 1.0; // Porción base para predicción
      const userAcceptanceProbability = predictAcceptanceProbability(
        user,
        scoredMeal.meal.id,
        basePortion
      ) * 100;
      
      // Bonus si la probabilidad de aceptación es alta
      if (userAcceptanceProbability > 80 && patterns.confidenceLevel !== 'low') {
        adaptationScore += 8;
      }
      
      // Ajustar el score final
      const finalScore = Math.min(100, Math.max(0, scoredMeal.score + adaptationScore));
      
      return {
        ...scoredMeal,
        score: finalScore,
        adaptationScore,
        userAcceptanceProbability
      };
    });
  }
  
  // Ordenar por score descendente
  return filteredAndAdjustedMeals.sort((a, b) => b.score - a.score);
};

/**
 * Obtiene recomendaciones top para mostrar al usuario
 */
export const getTopRecommendations = (
  meals: Meal[],
  goals: MacroGoals,
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  limit: number = 10
): MealScore[] => {
  const recommendations = recommendMeals(meals, goals, consumed);
  return recommendations.slice(0, limit);
};

/**
 * Genera un mensaje personalizado sobre qué necesita el usuario
 */
export const getMacroNeedsMessage = (
  remaining: { calories: number; protein: number; carbs: number; fat: number }
): string => {
  if (remaining.calories === 0) {
    return '✅ Ya alcanzaste tus objetivos diarios';
  }

  const priorities: string[] = [];
  
  if (remaining.protein > 0) {
    priorities.push(`${remaining.protein}g de proteína`);
  }
  
  if (remaining.carbs > 0) {
    priorities.push(`${remaining.carbs}g de carbohidratos`);
  }
  
  if (remaining.fat > 0) {
    priorities.push(`${remaining.fat}g de grasas`);
  }

  return `Te faltan: ${priorities.join(', ')} (${remaining.calories} kcal)`;
};
