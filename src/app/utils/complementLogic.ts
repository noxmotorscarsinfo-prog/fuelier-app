import { Meal, MealType, User, DailyLog } from '../types';
import { getMealGoals } from './mealDistribution';

/**
 * SISTEMA INTELIGENTE DE COMPLEMENTOS
 * 
 * Este sistema analiza qué macronutrientes faltan específicamente
 * y recomienda complementos con las porciones exactas para completar.
 */

export interface MacroDeficit {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mainDeficit: 'protein' | 'carbs' | 'fat' | 'calories' | 'balanced';
  deficitPercentage: number; // Qué % del objetivo falta
}

export interface AdaptedComplement {
  meal: Meal;
  adaptedPortion: number; // Porción calculada para cubrir el déficit
  reason: string; // Por qué se recomienda este complemento
  covers: {
    calories: number; // Cuánto cubre del déficit de calorías
    protein: number;
    carbs: number;
    fat: number;
  };
  finalMacros: {
    calories: number; // Macros finales del complemento adaptado
    protein: number;
    carbs: number;
    fat: number;
  };
  score: number; // Score de adecuación (0-100)
}

/**
 * Analiza qué macronutriente es el déficit principal
 */
export function analyzeDeficit(
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  goal: { calories: number; protein: number; carbs: number; fat: number }
): MacroDeficit {
  const deficit = {
    calories: Math.max(0, goal.calories - consumed.calories),
    protein: Math.max(0, goal.protein - consumed.protein),
    carbs: Math.max(0, goal.carbs - consumed.carbs),
    fat: Math.max(0, goal.fat - consumed.fat)
  };

  // Calcular qué % del objetivo falta
  const deficitPercentage = (deficit.calories / goal.calories) * 100;

  // Determinar déficit principal por porcentaje respecto al objetivo
  const proteinDeficitPct = (deficit.protein / goal.protein) * 100;
  const carbsDeficitPct = (deficit.carbs / goal.carbs) * 100;
  const fatDeficitPct = (deficit.fat / goal.fat) * 100;

  let mainDeficit: 'protein' | 'carbs' | 'fat' | 'calories' | 'balanced' = 'balanced';

  if (proteinDeficitPct > 40 && proteinDeficitPct > carbsDeficitPct && proteinDeficitPct > fatDeficitPct) {
    mainDeficit = 'protein';
  } else if (carbsDeficitPct > 40 && carbsDeficitPct > proteinDeficitPct && carbsDeficitPct > fatDeficitPct) {
    mainDeficit = 'carbs';
  } else if (fatDeficitPct > 40 && fatDeficitPct > proteinDeficitPct && fatDeficitPct > carbsDeficitPct) {
    mainDeficit = 'fat';
  } else if (deficitPercentage > 30) {
    mainDeficit = 'calories';
  }

  return {
    ...deficit,
    mainDeficit,
    deficitPercentage
  };
}

/**
 * Crea complementos específicos (no comidas completas) para cubrir déficits
 */
export function createSmartComplements(): Meal[] {
  return [
    // COMPLEMENTOS PROTEICOS
    {
      id: 'comp-protein-shake',
      name: 'Batido de Proteína',
      type: 'snack',
      variant: 'Whey protein con agua',
      calories: 120,
      protein: 25,
      carbs: 3,
      fat: 2,
      ingredients: ['30g proteína whey', '250ml agua'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-greek-yogurt',
      name: 'Yogurt Griego Natural',
      type: 'snack',
      variant: '0% grasa',
      calories: 100,
      protein: 18,
      carbs: 6,
      fat: 0.5,
      ingredients: ['170g yogurt griego 0%'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-cottage-cheese',
      name: 'Queso Cottage',
      type: 'snack',
      variant: 'Bajo en grasa',
      calories: 80,
      protein: 14,
      carbs: 3,
      fat: 1,
      ingredients: ['100g queso cottage'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-egg-whites',
      name: 'Claras de Huevo',
      type: 'snack',
      variant: 'Cocidas',
      calories: 50,
      protein: 11,
      carbs: 0.7,
      fat: 0.2,
      ingredients: ['3 claras de huevo'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-tuna',
      name: 'Atún al Natural',
      type: 'snack',
      variant: 'Lata pequeña',
      calories: 90,
      protein: 20,
      carbs: 0,
      fat: 1,
      ingredients: ['80g atún al natural'],
      baseQuantity: 1,
      isCustom: false
    },

    // COMPLEMENTOS DE CARBOHIDRATOS
    {
      id: 'comp-banana',
      name: 'Plátano',
      type: 'snack',
      variant: 'Fruta fresca',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      ingredients: ['1 plátano mediano (120g)'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-apple',
      name: 'Manzana',
      type: 'snack',
      variant: 'Fruta fresca',
      calories: 80,
      protein: 0.4,
      carbs: 21,
      fat: 0.3,
      ingredients: ['1 manzana mediana (180g)'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-oats',
      name: 'Avena',
      type: 'snack',
      variant: 'Cruda',
      calories: 150,
      protein: 5,
      carbs: 27,
      fat: 3,
      ingredients: ['40g avena'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-rice-cakes',
      name: 'Tortitas de Arroz',
      type: 'snack',
      variant: 'Natural',
      calories: 70,
      protein: 1.5,
      carbs: 15,
      fat: 0.5,
      ingredients: ['2 tortitas de arroz'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-sweet-potato',
      name: 'Boniato',
      type: 'snack',
      variant: 'Cocido',
      calories: 90,
      protein: 2,
      carbs: 21,
      fat: 0.2,
      ingredients: ['100g boniato cocido'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-bread',
      name: 'Pan Integral',
      type: 'snack',
      variant: '2 rebanadas',
      calories: 140,
      protein: 6,
      carbs: 24,
      fat: 2,
      ingredients: ['2 rebanadas pan integral (60g)'],
      baseQuantity: 1,
      isCustom: false
    },

    // COMPLEMENTOS DE GRASAS SALUDABLES
    {
      id: 'comp-almonds',
      name: 'Almendras',
      type: 'snack',
      variant: 'Naturales',
      calories: 170,
      protein: 6,
      carbs: 6,
      fat: 15,
      ingredients: ['30g almendras'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-walnuts',
      name: 'Nueces',
      type: 'snack',
      variant: 'Naturales',
      calories: 185,
      protein: 4.3,
      carbs: 4,
      fat: 18.5,
      ingredients: ['30g nueces'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-peanut-butter',
      name: 'Crema de Cacahuete',
      type: 'snack',
      variant: '100% natural',
      calories: 190,
      protein: 8,
      carbs: 7,
      fat: 16,
      ingredients: ['30g crema de cacahuete'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-avocado',
      name: 'Aguacate',
      type: 'snack',
      variant: 'Fresco',
      calories: 120,
      protein: 1.5,
      carbs: 6,
      fat: 11,
      ingredients: ['1/2 aguacate (75g)'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-olive-oil',
      name: 'Aceite de Oliva',
      type: 'snack',
      variant: 'Extra virgen',
      calories: 120,
      protein: 0,
      carbs: 0,
      fat: 14,
      ingredients: ['1 cucharada aceite de oliva (14g)'],
      baseQuantity: 1,
      isCustom: false
    },

    // COMPLEMENTOS BALANCEADOS
    {
      id: 'comp-protein-bar',
      name: 'Barrita Proteica',
      type: 'snack',
      variant: 'Alta en proteína',
      calories: 200,
      protein: 20,
      carbs: 15,
      fat: 7,
      ingredients: ['1 barrita proteica (60g)'],
      baseQuantity: 1,
      isCustom: false
    },
    {
      id: 'comp-protein-yogurt',
      name: 'Yogurt Proteico con Frutas',
      type: 'snack',
      variant: 'Skyr o similar',
      calories: 150,
      protein: 15,
      carbs: 18,
      fat: 2,
      ingredients: ['170g yogurt proteico', '50g frutas del bosque'],
      baseQuantity: 1,
      isCustom: false
    }
  ];
}

/**
 * Calcula la porción exacta necesaria para cubrir un déficit específico
 */
function calculatePortionForDeficit(
  meal: Meal,
  deficit: MacroDeficit
): { portion: number; reason: string; covers: any; score: number } {
  let targetPortion = 1.0;
  let reason = '';
  const covers = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  // Determinar qué macro usar como referencia según el déficit principal
  switch (deficit.mainDeficit) {
    case 'protein':
      if (meal.protein > 5) {
        // Calcular porción para cubrir proteína faltante (80-100% del déficit)
        targetPortion = (deficit.protein * 0.9) / meal.protein;
        reason = `Aporta ${Math.round(meal.protein * targetPortion)}g de proteína que necesitas`;
      } else {
        targetPortion = 0; // Este complemento no es adecuado
      }
      break;

    case 'carbs':
      if (meal.carbs > 10) {
        // Calcular porción para cubrir carbohidratos faltantes
        targetPortion = (deficit.carbs * 0.9) / meal.carbs;
        reason = `Aporta ${Math.round(meal.carbs * targetPortion)}g de carbohidratos que necesitas`;
      } else {
        targetPortion = 0;
      }
      break;

    case 'fat':
      if (meal.fat > 5) {
        // Calcular porción para cubrir grasas faltantes
        targetPortion = (deficit.fat * 0.9) / meal.fat;
        reason = `Aporta ${Math.round(meal.fat * targetPortion)}g de grasas saludables que necesitas`;
      } else {
        targetPortion = 0;
      }
      break;

    case 'calories':
    case 'balanced':
      // Calcular porción para cubrir calorías (70-90% del déficit)
      targetPortion = (deficit.calories * 0.8) / meal.calories;
      reason = `Complemento balanceado que aporta ${Math.round(meal.calories * targetPortion)} kcal`;
      break;
  }

  // Limitar la porción entre 0.25 y 3
  targetPortion = Math.max(0.25, Math.min(3, targetPortion));

  // Calcular qué % del déficit cubre con esta porción
  covers.calories = (meal.calories * targetPortion / deficit.calories) * 100;
  covers.protein = deficit.protein > 0 ? (meal.protein * targetPortion / deficit.protein) * 100 : 0;
  covers.carbs = deficit.carbs > 0 ? (meal.carbs * targetPortion / deficit.carbs) * 100 : 0;
  covers.fat = deficit.fat > 0 ? (meal.fat * targetPortion / deficit.fat) * 100 : 0;

  // Calcular score basado en qué tan bien cubre el déficit principal
  let score = 0;
  switch (deficit.mainDeficit) {
    case 'protein':
      score = Math.min(100, covers.protein);
      break;
    case 'carbs':
      score = Math.min(100, covers.carbs);
      break;
    case 'fat':
      score = Math.min(100, covers.fat);
      break;
    default:
      score = Math.min(100, covers.calories);
  }

  // Penalizar si excede mucho algún macro
  if (covers.calories > 120 || covers.protein > 150 || covers.carbs > 150 || covers.fat > 150) {
    score *= 0.7;
  }

  return { portion: targetPortion, reason, covers, score };
}

/**
 * Filtra y ordena complementos según el déficit específico
 */
function filterComplementsByDeficit(
  complements: Meal[],
  deficit: MacroDeficit
): Meal[] {
  return complements.filter(meal => {
    const proteinRatio = (meal.protein * 4) / meal.calories;
    const carbsRatio = (meal.carbs * 4) / meal.calories;
    const fatRatio = (meal.fat * 9) / meal.calories;

    switch (deficit.mainDeficit) {
      case 'protein':
        // Filtrar alimentos con al menos 30% de calorías de proteína
        return proteinRatio >= 0.30;
      
      case 'carbs':
        // Filtrar alimentos con al menos 50% de calorías de carbohidratos
        return carbsRatio >= 0.50;
      
      case 'fat':
        // Filtrar alimentos con al menos 50% de calorías de grasas
        return fatRatio >= 0.50;
      
      case 'calories':
      case 'balanced':
        // Aceptar cualquier complemento balanceado
        return true;
      
      default:
        return true;
    }
  });
}

/**
 * FUNCIÓN PRINCIPAL: Genera complementos inteligentes adaptados al déficit
 */
export function generateSmartComplements(
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  goal: { calories: number; protein: number; carbs: number; fat: number },
  mealType: MealType
): AdaptedComplement[] {
  // 1. Analizar déficit
  const deficit = analyzeDeficit(consumed, goal);

  // Si el déficit es muy pequeño (< 10%), no recomendar complementos
  if (deficit.deficitPercentage < 10) {
    return [];
  }

  // 2. Obtener complementos base
  const baseComplements = createSmartComplements();

  // 3. Filtrar según déficit principal
  const relevantComplements = filterComplementsByDeficit(baseComplements, deficit);

  // 4. Calcular porciones adaptadas y scores
  const adaptedComplements: AdaptedComplement[] = relevantComplements
    .map(meal => {
      const { portion, reason, covers, score } = calculatePortionForDeficit(meal, deficit);

      if (portion === 0 || score < 30) {
        return null; // Filtrar complementos no adecuados
      }

      return {
        meal,
        adaptedPortion: portion,
        reason,
        covers,
        finalMacros: {
          calories: Math.round(meal.calories * portion),
          protein: Math.round(meal.protein * portion * 10) / 10,
          carbs: Math.round(meal.carbs * portion * 10) / 10,
          fat: Math.round(meal.fat * portion * 10) / 10
        },
        score
      };
    })
    .filter((c): c is AdaptedComplement => c !== null);

  // 5. Ordenar por score descendente
  adaptedComplements.sort((a, b) => b.score - a.score);

  // 6. Retornar top 5 complementos
  return adaptedComplements.slice(0, 5);
}

/**
 * Genera un mensaje descriptivo del déficit
 */
export function getDeficitMessage(deficit: MacroDeficit): string {
  if (deficit.deficitPercentage < 10) {
    return '✅ Ya casi completaste esta comida';
  }

  const messages: Record<string, string> = {
    protein: `🥩 Te faltan ${Math.round(deficit.protein)}g de proteína (${Math.round(deficit.deficitPercentage)}% de la comida)`,
    carbs: `🍎 Te faltan ${Math.round(deficit.carbs)}g de carbohidratos (${Math.round(deficit.deficitPercentage)}% de la comida)`,
    fat: `🥑 Te faltan ${Math.round(deficit.fat)}g de grasas saludables (${Math.round(deficit.deficitPercentage)}% de la comida)`,
    calories: `🔥 Te faltan ${Math.round(deficit.calories)} kcal (${Math.round(deficit.deficitPercentage)}% de la comida)`,
    balanced: `⚖️ Te falta completar esta comida (${Math.round(deficit.deficitPercentage)}% restante)`
  };

  return messages[deficit.mainDeficit] || messages.balanced;
}

/**
 * Obtiene un emoji/icono según el tipo de déficit
 */
export function getDeficitIcon(mainDeficit: string): string {
  const icons: Record<string, string> = {
    protein: '🥩',
    carbs: '🍎',
    fat: '🥑',
    calories: '🔥',
    balanced: '⚖️'
  };
  return icons[mainDeficit] || '✨';
}
