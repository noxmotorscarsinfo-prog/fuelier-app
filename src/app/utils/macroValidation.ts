/**
 * Utilidades para validar que los macros se distribuyen correctamente
 */

import { User, DailyLog, MealType } from '../types';
import { getMealGoals, getActiveMealTypes } from './mealDistribution'; // NUEVO: Importar getActiveMealTypes

/**
 * Valida que la suma de los objetivos de todas las comidas = objetivo diario
 */
export function validateDailyMacroDistribution(user: User): {
  isValid: boolean;
  errors: string[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  expected: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  differences: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
} {
  const mealTypes: MealType[] = getActiveMealTypes(user.mealsPerDay || 3); // NUEVO: Usar getActiveMealTypes con el número de comidas
  const errors: string[] = [];
  
  // Calcular la suma de todas las comidas activas
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
  
  mealTypes.forEach(type => {
    const mealGoals = getMealGoals(user, type);
    totals.calories += mealGoals.calories;
    totals.protein += mealGoals.protein;
    totals.carbs += mealGoals.carbs;
    totals.fat += mealGoals.fat;
  });
  
  // Comparar con los objetivos del usuario
  const expected = {
    calories: user.goals.calories,
    protein: user.goals.protein,
    carbs: user.goals.carbs,
    fat: user.goals.fat
  };
  
  const differences = {
    calories: totals.calories - expected.calories,
    protein: totals.protein - expected.protein,
    carbs: totals.carbs - expected.carbs,
    fat: totals.fat - expected.fat
  };
  
  // Validar (permitir ±2% de diferencia por redondeos)
  const tolerance = 0.02; // 2%
  
  if (Math.abs(differences.calories) > expected.calories * tolerance) {
    errors.push(`Calorías: ${totals.calories} vs ${expected.calories} (diferencia: ${differences.calories})`);
  }
  
  if (Math.abs(differences.protein) > expected.protein * tolerance) {
    errors.push(`Proteína: ${totals.protein}g vs ${expected.protein}g (diferencia: ${differences.protein}g)`);
  }
  
  if (Math.abs(differences.carbs) > expected.carbs * tolerance) {
    errors.push(`Carbos: ${totals.carbs}g vs ${expected.carbs}g (diferencia: ${differences.carbs}g)`);
  }
  
  if (Math.abs(differences.fat) > expected.fat * tolerance) {
    errors.push(`Grasas: ${totals.fat}g vs ${expected.fat}g (diferencia: ${differences.fat}g)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    totals,
    expected,
    differences
  };
}

/**
 * Calcula los totales reales consumidos en un día
 */
export function calculateDailyTotals(log: DailyLog): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
  
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  
  mealTypes.forEach(type => {
    const meal = log[type];
    if (meal) {
      totals.calories += meal.calories;
      totals.protein += meal.protein;
      totals.carbs += meal.carbs;
      totals.fat += meal.fat;
    }
  });
  
  // Agregar comidas extra si existen
  if (log.extraFoods) {
    log.extraFoods.forEach(extra => {
      totals.calories += extra.calories;
      totals.protein += extra.protein;
      totals.carbs += extra.carbs;
      totals.fat += extra.fat;
    });
  }
  
  // Agregar comidas complementarias si existen
  if (log.complementaryMeals) {
    log.complementaryMeals.forEach(comp => {
      totals.calories += comp.calories;
      totals.protein += comp.protein;
      totals.carbs += comp.carbs;
      totals.fat += comp.fat;
    });
  }
  
  return totals;
}

/**
 * Calcula el porcentaje de completitud de los objetivos diarios
 */
export function calculateDailyCompletion(user: User, log: DailyLog): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  overall: number;
  status: 'low' | 'good' | 'perfect' | 'over';
} {
  const totals = calculateDailyTotals(log);
  const goals = user.goals;
  
  const caloriesPercent = (totals.calories / goals.calories) * 100;
  const proteinPercent = (totals.protein / goals.protein) * 100;
  const carbsPercent = (totals.carbs / goals.carbs) * 100;
  const fatPercent = (totals.fat / goals.fat) * 100;
  
  const overall = (caloriesPercent + proteinPercent + carbsPercent + fatPercent) / 4;
  
  let status: 'low' | 'good' | 'perfect' | 'over';
  
  if (overall < 70) {
    status = 'low';
  } else if (overall >= 70 && overall < 90) {
    status = 'good';
  } else if (overall >= 90 && overall <= 110) {
    status = 'perfect';
  } else {
    status = 'over';
  }
  
  return {
    calories: Math.round(caloriesPercent),
    protein: Math.round(proteinPercent),
    carbs: Math.round(carbsPercent),
    fat: Math.round(fatPercent),
    overall: Math.round(overall),
    status
  };
}

/**
 * Detecta si hay un desbalance significativo en algún macro
 */
export function detectMacroImbalance(user: User, log: DailyLog): {
  hasImbalance: boolean;
  warnings: string[];
} {
  const totals = calculateDailyTotals(log);
  const goals = user.goals;
  const warnings: string[] = [];
  
  // Calcular porcentajes
  const caloriesPercent = (totals.calories / goals.calories) * 100;
  const proteinPercent = (totals.protein / goals.protein) * 100;
  const carbsPercent = (totals.carbs / goals.carbs) * 100;
  const fatPercent = (totals.fat / goals.fat) * 100;
  
  // Detectar proteína baja (importante)
  if (proteinPercent < 70) {
    warnings.push(`⚠️ Proteína baja (${Math.round(proteinPercent)}%): Intenta agregar más alimentos ricos en proteína`);
  }
  
  // Detectar proteína muy alta (puede ser innecesario)
  if (proteinPercent > 150) {
    warnings.push(`💡 Proteína muy alta (${Math.round(proteinPercent)}%): Más de ${goals.protein}g puede ser innecesario`);
  }
  
  // Detectar carbos muy bajos (puede afectar energía)
  if (carbsPercent < 50) {
    warnings.push(`⚡ Carbohidratos bajos (${Math.round(carbsPercent)}%): Puede afectar tu energía y rendimiento`);
  }
  
  // Detectar grasas muy bajas (importante para hormonas)
  if (fatPercent < 60) {
    warnings.push(`🥑 Grasas bajas (${Math.round(fatPercent)}%): Importante para la producción hormonal`);
  }
  
  // Detectar grasas muy altas
  if (fatPercent > 150) {
    warnings.push(`💡 Grasas muy altas (${Math.round(fatPercent)}%): Puede exceder tus calorías objetivo`);
  }
  
  // Detectar calorías muy bajas (puede afectar metabolismo)
  if (caloriesPercent < 60) {
    warnings.push(`🔥 Calorías muy bajas (${Math.round(caloriesPercent)}%): Puede ralentizar tu metabolismo`);
  }
  
  // Detectar calorías muy altas
  if (caloriesPercent > 120) {
    warnings.push(`📊 Calorías por encima del objetivo (${Math.round(caloriesPercent)}%)`);
  }
  
  return {
    hasImbalance: warnings.length > 0,
    warnings
  };
}

/**
 * Genera recomendaciones basadas en el progreso del día
 */
export function generateDailyRecommendations(user: User, log: DailyLog): string[] {
  const totals = calculateDailyTotals(log);
  const goals = user.goals;
  const recommendations: string[] = [];
  
  const remaining = {
    calories: goals.calories - totals.calories,
    protein: goals.protein - totals.protein,
    carbs: goals.carbs - totals.carbs,
    fat: goals.fat - totals.fat
  };
  
  // Contar comidas registradas
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const registeredMeals = mealTypes.filter(type => log[type]).length;
  const totalMeals = user.mealsPerDay || 4;
  const mealsLeft = totalMeals - registeredMeals;
  
  if (mealsLeft > 0) {
    // Hay comidas pendientes
    const caloriesPerMeal = Math.round(remaining.calories / mealsLeft);
    const proteinPerMeal = Math.round(remaining.protein / mealsLeft);
    
    if (caloriesPerMeal > 0) {
      recommendations.push(
        `📍 Te faltan ${mealsLeft} comida${mealsLeft > 1 ? 's' : ''}: ~${caloriesPerMeal} kcal y ${proteinPerMeal}g proteína cada una`
      );
    } else {
      recommendations.push(
        `✅ Ya completaste tus macros! Las comidas restantes deben ser ligeras`
      );
    }
  } else {
    // Todas las comidas registradas
    if (remaining.calories > 200) {
      recommendations.push(
        `💡 Te faltan ${remaining.calories} kcal: Considera agregar un snack o comida extra`
      );
    } else if (remaining.calories < -200) {
      recommendations.push(
        `⚠️ Superaste tu objetivo por ${Math.abs(remaining.calories)} kcal`
      );
    } else {
      recommendations.push(
        `🎯 ¡Excelente! Estás muy cerca de tu objetivo diario`
      );
    }
  }
  
  return recommendations;
}