import { MacroGoals } from '../types';
import { calculateUserMacrosAdvanced } from './advancedMacroCalculations';

/**
 * Calcula la Tasa Metabólica Basal (TMB) usando la fórmula Mifflin-St Jeor
 * Esta es considerada la más precisa para la población general
 */
export const calculateBMR = (
  sex: 'male' | 'female',
  weight: number, // kg
  height: number, // cm
  age: number = 30 // Edad asumida si no se proporciona
): number => {
  // Fórmula Mifflin-St Jeor
  // Hombres: TMB = (10 × peso) + (6.25 × altura) - (5 × edad) + 5
  // Mujeres: TMB = (10 × peso) + (6.25 × altura) - (5 × edad) - 161
  
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (sex === 'male') {
    return baseBMR + 5;
  } else {
    return baseBMR - 161;
  }
};

/**
 * Calcula el Gasto Energético Total Diario (TDEE)
 * TMB × Factor de actividad
 * 
 * Factores de actividad estándar basados en ciencia:
 * - Sedentario (1.2): Poco o ningún ejercicio, solo actividades diarias mínimas
 * - Ligero (1.375): 1-2 entrenamientos/semana o actividad diaria baja
 * - Moderado (1.55): 3-5 entrenamientos/semana, actividad diaria normal
 * - Muy activo (1.725): 6-7 entrenamientos/semana o trabajo físico intenso + entrenos
 * - Extra activo (1.9): Entrenamiento intenso diario + actividad física alta todo el día
 */
export const calculateTDEE = (
  bmr: number,
  trainingFrequency: number
): number => {
  // Factor de actividad según días de entrenamiento (basado en tabla científica estándar)
  let activityFactor = 1.2; // Sedentario por defecto
  
  if (trainingFrequency === 0) {
    activityFactor = 1.2; // Sedentario: Poco o ningún ejercicio
  } else if (trainingFrequency >= 1 && trainingFrequency <= 2) {
    activityFactor = 1.375; // Ligero: 1-2 entrenos/semana
  } else if (trainingFrequency >= 3 && trainingFrequency <= 5) {
    activityFactor = 1.55; // Moderado: 3-5 entrenos/semana (EL MÁS COMÚN)
  } else if (trainingFrequency === 6 || trainingFrequency === 7) {
    activityFactor = 1.725; // Muy activo: 6-7 entrenos/semana
  } else if (trainingFrequency > 7) {
    // Para casos extremos (ej: doble sesión diaria)
    activityFactor = 1.9; // Extra activo: Entrenamiento intenso diario + alta actividad
  }
  
  return bmr * activityFactor;
};

export type GoalType = 
  | 'aggressive-cut'    // -20% (pérdida rápida)
  | 'moderate-cut'      // -15% (pérdida moderada)
  | 'mild-cut'          // -10% (déficit ligero)
  | 'maintenance'       // 0% (mantenimiento)
  | 'mild-bulk'         // +10% (ganancia ligera)
  | 'moderate-bulk';    // +15% (ganancia moderada)

/**
 * Mapea el objetivo del usuario (5 opciones) al tipo de objetivo interno (6 opciones)
 */
export const mapUserGoalToInternalGoal = (
  userGoal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain'
): GoalType => {
  const mapping = {
    'rapid_loss': 'aggressive-cut' as GoalType,
    'moderate_loss': 'moderate-cut' as GoalType,
    'maintenance': 'maintenance' as GoalType,
    'moderate_gain': 'mild-bulk' as GoalType,
    'rapid_gain': 'moderate-bulk' as GoalType
  };
  
  return mapping[userGoal];
};

/**
 * Mapea el tipo de objetivo interno al objetivo del usuario (función inversa)
 */
export const mapInternalGoalToUserGoal = (
  internalGoal: GoalType
): 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain' => {
  const mapping: Record<GoalType, 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain'> = {
    'aggressive-cut': 'rapid_loss',
    'moderate-cut': 'moderate_loss',
    'mild-cut': 'moderate_loss', // Mapear mild-cut también a moderate_loss (no se usa en UI)
    'maintenance': 'maintenance',
    'mild-bulk': 'moderate_gain',
    'moderate-bulk': 'rapid_gain'
  };
  
  return mapping[internalGoal];
};

/**
 * Calcula las calorías objetivo según el tipo de objetivo
 */
export const calculateTargetCalories = (
  tdee: number,
  goal: GoalType
): number => {
  const multipliers = {
    'aggressive-cut': 0.80,   // -20%
    'moderate-cut': 0.85,      // -15%
    'mild-cut': 0.90,          // -10%
    'maintenance': 1.0,        // 0%
    'mild-bulk': 1.10,         // +10%
    'moderate-bulk': 1.15      // +15%
  };
  
  return Math.round(tdee * multipliers[goal]);
};

/**
 * Calcula los macronutrientes óptimos según el objetivo y perfil
 */
export const calculateMacros = (
  targetCalories: number,
  weight: number,
  sex: 'male' | 'female',
  goal: GoalType
): MacroGoals => {
  // 1. PROTEÍNA (prioridad #1)
  // En déficit calórico: más proteína para preservar músculo
  // En superávit: suficiente para construir músculo
  let proteinPerKg: number;
  
  if (goal && goal.includes('cut')) {
    // En déficit: 2.0-2.4g/kg para preservar masa muscular
    proteinPerKg = sex === 'male' ? 2.2 : 2.0;
  } else if (goal && goal.includes('bulk')) {
    // En superávit: 1.8-2.0g/kg es suficiente
    proteinPerKg = sex === 'male' ? 2.0 : 1.8;
  } else {
    // Mantenimiento: 1.8-2.0g/kg
    proteinPerKg = sex === 'male' ? 2.0 : 1.8;
  }
  
  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCalories = proteinGrams * 4; // 4 kcal por gramo
  
  // 2. GRASAS (prioridad #2)
  // Esencial para salud hormonal, especialmente en mujeres
  let fatPercentage: number;
  
  if (goal && goal.includes('cut')) {
    // En déficit: 20-25% para mantener hormonas
    fatPercentage = sex === 'female' ? 0.28 : 0.25;
  } else if (goal && goal.includes('bulk')) {
    // En superávit: 25-30%
    fatPercentage = sex === 'female' ? 0.30 : 0.28;
  } else {
    // Mantenimiento: 25-28%
    fatPercentage = sex === 'female' ? 0.28 : 0.25;
  }
  
  const fatCalories = targetCalories * fatPercentage;
  const fatGrams = Math.round(fatCalories / 9); // 9 kcal por gramo
  
  // 3. CARBOHIDRATOS (lo que quede)
  // Llenan el resto de las calorías
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.round(remainingCalories / 4); // 4 kcal por gramo
  
  // Validación: mínimos saludables
  const finalCarbs = Math.max(carbsGrams, 100); // Mínimo 100g para función cerebral
  const finalFat = Math.max(fatGrams, 40); // Mínimo 40g para salud hormonal
  
  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: finalCarbs,
    fat: finalFat
  };
};

/**
 * HELPER: Calcula los macros a partir de un objeto User completo
 * Esta función es un wrapper conveniente para Settings y otros componentes
 */
export const calculateMacrosFromUser = (user: {
  sex: 'male' | 'female';
  weight: number;
  height: number;
  age: number;
  goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain';
  trainingFrequency: number;
}): MacroGoals => {
  // Calcular BMR, TDEE y objetivo de calorías
  const bmr = calculateBMR(user.sex, user.weight, user.height, user.age);
  const tdee = calculateTDEE(bmr, user.trainingFrequency);
  const internalGoal = mapUserGoalToInternalGoal(user.goal);
  const targetCalories = calculateTargetCalories(tdee, internalGoal);
  
  // Calcular macros
  return calculateMacros(targetCalories, user.weight, user.sex, internalGoal);
};

/**
 * Calcula todos los objetivos posibles para que el usuario elija
 */
export const calculateAllGoals = (
  sex: 'male' | 'female',
  weight: number,
  height: number,
  trainingFrequency: number,
  age: number = 30
) => {
  const bmr = calculateBMR(sex, weight, height, age);
  const tdee = calculateTDEE(bmr, trainingFrequency);
  
  const goals = [
    {
      type: 'aggressive-cut' as GoalType,
      name: 'Pérdida Rápida',
      description: 'Déficit del 20%',
      calories: calculateTargetCalories(tdee, 'aggressive-cut'),
      recommendation: 'Solo si tienes mucho peso que perder',
      color: 'red',
      icon: '🔥'
    },
    {
      type: 'moderate-cut' as GoalType,
      name: 'Pérdida Moderada',
      description: 'Déficit del 15%',
      calories: calculateTargetCalories(tdee, 'moderate-cut'),
      recommendation: 'Ideal para perder grasa sin sacrificar músculo',
      color: 'orange',
      icon: '📉'
    },
    {
      type: 'mild-cut' as GoalType,
      name: 'Déficit Ligero',
      description: 'Déficit del 10%',
      calories: calculateTargetCalories(tdee, 'mild-cut'),
      recommendation: 'Pérdida lenta pero sostenible',
      color: 'amber',
      icon: '📊'
    },
    {
      type: 'maintenance' as GoalType,
      name: 'Mantenimiento',
      description: 'Sin déficit ni superávit',
      calories: Math.round(tdee),
      recommendation: 'Mantén tu peso y recompone tu cuerpo',
      color: 'emerald',
      icon: '⚖️'
    },
    {
      type: 'mild-bulk' as GoalType,
      name: 'Ganancia Limpia',
      description: 'Superávit del 10%',
      calories: calculateTargetCalories(tdee, 'mild-bulk'),
      recommendation: 'Gana músculo minimizando grasa',
      color: 'blue',
      icon: '📈'
    },
    {
      type: 'moderate-bulk' as GoalType,
      name: 'Ganancia Muscular',
      description: 'Superávit del 15%',
      calories: calculateTargetCalories(tdee, 'moderate-bulk'),
      recommendation: 'Maximiza ganancia muscular',
      color: 'violet',
      icon: '💪'
    }
  ];
  
  // Calcular IMC
  const bmi = weight / Math.pow(height / 100, 2);
  
  // ⭐ NUEVO: Calcular porcentaje de grasa corporal usando la fórmula de Deurenberg
  // % Grasa corporal = (1.20 x IMC) + (0.23 x Edad) - (10.8 x Género*) - 5.4
  // Género: Hombre = 1, Mujer = 2
  const genderValue = sex === 'male' ? 1 : 2;
  const bodyFatPercentage = (1.20 * bmi) + (0.23 * age) - (10.8 * genderValue) - 5.4;
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    bmi: bmi.toFixed(1),
    bodyFat: bodyFatPercentage.toFixed(1), // ⭐ NUEVO: Porcentaje de grasa corporal
    goals: goals.map(goal => ({
      ...goal,
      macros: calculateMacros(goal.calories, weight, sex, goal.type)
    }))
  };
};

/**
 * Genera explicaciones detalladas de por qué los valores calculados
 */
export const generateExplanations = (
  sex: 'male' | 'female',
  weight: number,
  height: number,
  trainingFrequency: number,
  goal: GoalType,
  macros: MacroGoals,
  tdee: number
) => {
  const targetCalories = macros.calories;
  const diff = targetCalories - tdee;
  const diffPercent = Math.round((Math.abs(diff) / tdee) * 100);
  const proteinPerKg = (macros.protein / weight).toFixed(1);
  const fatPercent = Math.round((macros.fat * 9 / targetCalories) * 100);
  const carbPercent = Math.round((macros.carbs * 4 / targetCalories) * 100);
  
  const explanations = [];
  
  // Explicación de calorías
  if (goal.includes('cut')) {
    explanations.push({
      title: '🔥 Calorías en Déficit',
      text: `${targetCalories} kcal/día es un ${diffPercent}% menos que tu TDEE (${tdee} kcal). Este déficit controlado permite quemar grasa a un ritmo de aproximadamente ${goal === 'aggressive-cut' ? '0.8-1kg' : goal === 'moderate-cut' ? '0.5-0.7kg' : '0.3-0.5kg'} por semana mientras preservas tu masa muscular.`
    });
  } else if (goal.includes('bulk')) {
    explanations.push({
      title: '💪 Calorías en Superávit',
      text: `${targetCalories} kcal/día es un ${diffPercent}% más que tu TDEE (${tdee} kcal). Este superávit estratégico favorece la síntesis de proteína muscular permitiendo ganar aproximadamente ${goal === 'moderate-bulk' ? '0.4-0.6kg' : '0.2-0.4kg'} por mes, minimizando ganancia de grasa.`
    });
  } else {
    explanations.push({
      title: '⚖️ Calorías de Mantenimiento',
      text: `${targetCalories} kcal/día es tu TDEE (Gasto Energético Total Diario). Consumir esta cantidad mantiene tu peso actual mientras optimizas tu composición corporal a través de la recomposición (ganar músculo y perder grasa simultáneamente).`
    });
  }
  
  // Explicación de proteína
  explanations.push({
    title: '🥩 Proteína Alta',
    text: `${macros.protein}g diarios (${proteinPerKg}g/kg de peso corporal) es óptimo para ${goal.includes('cut') ? 'preservar toda tu masa muscular en déficit calórico' : goal.includes('bulk') ? 'maximizar la síntesis de proteína muscular' : 'mantener y optimizar tu composición corporal'}. ${sex === 'female' ? 'Como mujer, esta cantidad también ayuda a mantener la densidad ósea.' : 'Como hombre, esta cantidad optimiza tus niveles de testosterona.'}`
  });
  
  // Explicación de carbohidratos
  const activityLevel = trainingFrequency >= 5 ? 'alto' : trainingFrequency >= 3 ? 'moderado' : 'bajo';
  explanations.push({
    title: '🌾 Carbohidratos',
    text: `${macros.carbs}g (${carbPercent}% de calorías) son tu principal fuente de energía${trainingFrequency >= 3 ? ', crucial con tu nivel de actividad física' : ''}. Los carbohidratos reponen el glucógeno muscular, mejoran el rendimiento en el gym y previenen la fatiga${goal.includes('cut') ? '. En déficit, mantener carbos altos preserva el metabolismo' : ''}.`
  });
  
  // Explicación de grasas
  explanations.push({
    title: '🥑 Grasas Esenciales',
    text: `${macros.fat}g (${fatPercent}% de calorías) son fundamentales para la producción de hormonas ${sex === 'female' ? '(especialmente estrógeno y progesterona)' : '(especialmente testosterona)'}, absorción de vitaminas A, D, E, K, salud cardiovascular y función cerebral. ${sex === 'female' ? 'Para mujeres es especialmente importante no bajar de este nivel.' : 'Este nivel optimiza tu perfil hormonal.'}`
  });
  
  // Información sobre TDEE
  const activityText = trainingFrequency === 0 ? 'sedentario' : 
                       trainingFrequency <= 2 ? `entrenas ${trainingFrequency} días/semana` :
                       trainingFrequency <= 4 ? `entrenas ${trainingFrequency} días/semana (moderado)` :
                       `entrenas ${trainingFrequency} días/semana (muy activo)`;
  
  explanations.push({
    title: '⚡ Tu Metabolismo',
    text: `Tu TDEE de ${tdee} kcal se calcula combinando tu TMB (metabolismo basal: ~${Math.round(calculateBMR(sex, weight, height))} kcal) con tu nivel de actividad (${activityText}). ${sex === 'female' ? 'Las mujeres generalmente tienen un TMB 5-10% menor que los hombres debido a diferencias en composición corporal.' : 'Los hombres tienen mayor masa muscular, lo que incrementa el gasto calórico basal.'}`
  });
  
  return explanations;
};