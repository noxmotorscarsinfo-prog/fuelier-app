import { MacroGoals, User } from '../types';
import { calculateBMR as calculateMifflinBMR, calculateTDEE, GoalType } from './macroCalculations';

/**
 * ═══════════════════════════════════════════════════════════════
 * SISTEMA AVANZADO DE CÁLCULOS METABÓLICOS
 * Basado en fisiología real, composición corporal y NEAT
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Calcula la masa magra a partir del peso y % de grasa corporal
 */
export const calculateLeanBodyMass = (weight: number, bodyFatPercentage: number): number => {
  return weight * (1 - bodyFatPercentage / 100);
};

/**
 * Calcula TMB usando Katch-McArdle (más preciso si tienes % grasa corporal)
 * TMB = 370 + (21.6 × masa magra en kg)
 * Esta fórmula es INDEPENDIENTE del sexo porque usa masa magra directamente
 */
export const calculateBMRKatchMcArdle = (leanBodyMass: number): number => {
  return 370 + (21.6 * leanBodyMass);
};

/**
 * Calcula el TMB usando la mejor fórmula disponible según los datos
 * Prioridad: Katch-McArdle (si hay % grasa) > Mifflin-St Jeor
 */
export const calculateBMRAdvanced = (user: {
  sex: 'male' | 'female';
  weight: number;
  height: number;
  age: number;
  bodyFatPercentage?: number;
  leanBodyMass?: number;
}): { bmr: number; method: 'katch_mcardle' | 'mifflin_st_jeor'; leanBodyMass?: number } => {
  
  // Si tenemos % de grasa o masa magra directa, usar Katch-McArdle (MÁS PRECISO)
  if (user.leanBodyMass) {
    return {
      bmr: calculateBMRKatchMcArdle(user.leanBodyMass),
      method: 'katch_mcardle',
      leanBodyMass: user.leanBodyMass
    };
  }
  
  if (user.bodyFatPercentage) {
    const lbm = calculateLeanBodyMass(user.weight, user.bodyFatPercentage);
    return {
      bmr: calculateBMRKatchMcArdle(lbm),
      method: 'katch_mcardle',
      leanBodyMass: lbm
    };
  }
  
  // Fallback: Mifflin-St Jeor (basado en peso total)
  return {
    bmr: calculateMifflinBMR(user.sex, user.weight, user.height, user.age),
    method: 'mifflin_st_jeor'
  };
};

/**
 * Calcula el factor de actividad considerando NEAT + Ejercicio
 * Esto es MUY importante - la mayoría de apps solo consideran ejercicio
 */
export const calculateActivityFactorAdvanced = (
  trainingFrequency: number,
  lifestyleActivity?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
  occupation?: 'desk_job' | 'standing_job' | 'walking_job' | 'physical_job',
  dailySteps?: number
): { factor: number; breakdown: { neatFactor: number; exerciseFactor: number; totalFactor: number } } => {
  
  // 1. Calcular NEAT factor (Actividad no asociada al ejercicio)
  let neatFactor = 1.2; // Base sedentaria
  
  // Priorizar pasos si están disponibles (más preciso)
  if (dailySteps !== undefined) {
    if (dailySteps < 3000) {
      neatFactor = 1.2; // Sedentario
    } else if (dailySteps < 5000) {
      neatFactor = 1.3; // Ligeramente activo
    } else if (dailySteps < 8000) {
      neatFactor = 1.4; // Moderadamente activo
    } else if (dailySteps < 12000) {
      neatFactor = 1.5; // Muy activo
    } else {
      neatFactor = 1.6; // Extremadamente activo
    }
  } 
  // Si no hay pasos, usar ocupación
  else if (occupation) {
    switch (occupation) {
      case 'desk_job':
        neatFactor = 1.2;
        break;
      case 'standing_job':
        neatFactor = 1.35;
        break;
      case 'walking_job':
        neatFactor = 1.5;
        break;
      case 'physical_job':
        neatFactor = 1.65;
        break;
    }
  }
  // Si no hay ocupación, usar lifestyleActivity
  else if (lifestyleActivity) {
    switch (lifestyleActivity) {
      case 'sedentary':
        neatFactor = 1.2;
        break;
      case 'lightly_active':
        neatFactor = 1.3;
        break;
      case 'moderately_active':
        neatFactor = 1.45;
        break;
      case 'very_active':
        neatFactor = 1.6;
        break;
      case 'extremely_active':
        neatFactor = 1.75;
        break;
    }
  }
  
  // 2. Calcular Exercise Factor (adicional al NEAT)
  let exerciseBoost = 0;
  
  if (trainingFrequency === 0) {
    exerciseBoost = 0;
  } else if (trainingFrequency <= 2) {
    exerciseBoost = 0.05; // +5% por 1-2 días/semana
  } else if (trainingFrequency === 3) {
    exerciseBoost = 0.10; // +10% por 3 días/semana
  } else if (trainingFrequency === 4) {
    exerciseBoost = 0.15; // +15% por 4 días/semana
  } else if (trainingFrequency === 5) {
    exerciseBoost = 0.20; // +20% por 5 días/semana
  } else if (trainingFrequency === 6) {
    exerciseBoost = 0.25; // +25% por 6 días/semana
  } else {
    exerciseBoost = 0.30; // +30% por 7 días/semana
  }
  
  // 3. Combinar NEAT + Ejercicio
  const totalFactor = neatFactor * (1 + exerciseBoost);
  
  return {
    factor: totalFactor,
    breakdown: {
      neatFactor,
      exerciseFactor: 1 + exerciseBoost,
      totalFactor
    }
  };
};

/**
 * Calcula TDEE avanzado usando BMR mejorado + factor de actividad detallado
 */
export const calculateTDEEAdvanced = (
  bmr: number,
  trainingFrequency: number,
  lifestyleActivity?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
  occupation?: 'desk_job' | 'standing_job' | 'walking_job' | 'physical_job',
  dailySteps?: number
): { tdee: number; activityFactor: number } => {
  
  const { factor } = calculateActivityFactorAdvanced(
    trainingFrequency,
    lifestyleActivity,
    occupation,
    dailySteps
  );
  
  return {
    tdee: Math.round(bmr * factor),
    activityFactor: factor
  };
};

/**
 * Ajusta calorías objetivo si se detecta metabolismo adaptado
 * Un metabolismo adaptado requiere un "reverse diet" antes de entrar en déficit
 */
export const adjustForMetabolicAdaptation = (
  targetCalories: number,
  user: User
): { adjustedCalories: number; adjustment: number; reason: string } => {
  
  // Si no hay información de adaptación, no ajustar
  if (!user.metabolicAdaptation || !user.metabolicAdaptation.isAdapted) {
    return {
      adjustedCalories: targetCalories,
      adjustment: 0,
      reason: 'Sin adaptación metabólica detectada'
    };
  }
  
  const { adaptationLevel, recommendedPhase } = user.metabolicAdaptation;
  
  // Si está adaptado y quiere entrar en déficit, primero debe subir calorías
  if (user.goal.includes('loss') && recommendedPhase === 'reverse_diet') {
    let adjustment = 0;
    let reason = '';
    
    switch (adaptationLevel) {
      case 'mild':
        adjustment = 100; // +100 kcal/día
        reason = 'Adaptación leve detectada. Aumentando calorías gradualmente.';
        break;
      case 'moderate':
        adjustment = 200; // +200 kcal/día
        reason = 'Adaptación moderada detectada. Se requiere "reverse diet".';
        break;
      case 'severe':
        adjustment = 300; // +300 kcal/día
        reason = 'Adaptación severa detectada. Reverse diet obligatorio.';
        break;
      default:
        adjustment = 0;
    }
    
    return {
      adjustedCalories: targetCalories + adjustment,
      adjustment,
      reason
    };
  }
  
  return {
    adjustedCalories: targetCalories,
    adjustment: 0,
    reason: 'No se requiere ajuste'
  };
};

/**
 * Calcula distribución de macros PRECISA según composición corporal
 * Usa masa magra para calcular proteína óptima
 */
export const calculateMacrosAdvanced = (
  targetCalories: number,
  weight: number,
  sex: 'male' | 'female',
  goal: GoalType,
  leanBodyMass?: number
): MacroGoals => {
  
  // ===== 1. PROTEÍNA (Basada en MASA MAGRA si está disponible) =====
  let proteinGrams: number;
  
  if (leanBodyMass) {
    // MÉTODO ÓPTIMO: Proteína basada en masa magra
    // 2.2-2.6g por kg de masa magra en déficit
    // 1.8-2.2g por kg de masa magra en superávit/mantenimiento
    if (goal.includes('cut')) {
      proteinGrams = Math.round(leanBodyMass * 2.4);
    } else if (goal.includes('bulk')) {
      proteinGrams = Math.round(leanBodyMass * 2.0);
    } else {
      proteinGrams = Math.round(leanBodyMass * 2.2);
    }
  } else {
    // FALLBACK: Proteína basada en peso total (método menos preciso)
    let proteinPerKg: number;
    
    if (goal.includes('cut')) {
      proteinPerKg = sex === 'male' ? 2.2 : 2.0;
    } else if (goal.includes('bulk')) {
      proteinPerKg = sex === 'male' ? 2.0 : 1.8;
    } else {
      proteinPerKg = sex === 'male' ? 2.0 : 1.8;
    }
    
    proteinGrams = Math.round(weight * proteinPerKg);
  }
  
  const proteinCalories = proteinGrams * 4;
  
  // ===== 2. GRASAS (Porcentaje de calorías totales) =====
  let fatPercentage: number;
  
  if (goal.includes('cut')) {
    // En déficit: mantener grasas más altas para salud hormonal
    fatPercentage = sex === 'female' ? 0.30 : 0.25;
  } else if (goal.includes('bulk')) {
    // En superávit: 25-30%
    fatPercentage = sex === 'female' ? 0.30 : 0.28;
  } else {
    // Mantenimiento: 25-28%
    fatPercentage = sex === 'female' ? 0.28 : 0.25;
  }
  
  const fatCalories = targetCalories * fatPercentage;
  const fatGrams = Math.round(fatCalories / 9);
  
  // ===== 3. CARBOHIDRATOS (Resto de calorías) =====
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.round(remainingCalories / 4);
  
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
 * FUNCIÓN PRINCIPAL: Calcula macros usando TODOS los datos avanzados disponibles
 */
export const calculateUserMacrosAdvanced = (user: User): {
  goals: MacroGoals;
  calculations: {
    bmr: number;
    bmrMethod: 'katch_mcardle' | 'mifflin_st_jeor';
    tdee: number;
    activityFactor: number;
    targetCalories: number;
    adjustedCalories: number;
    metabolicAdjustment?: number;
    leanBodyMass?: number;
  };
} => {
  
  // 1. Calcular BMR (mejor método disponible)
  const { bmr, method, leanBodyMass } = calculateBMRAdvanced(user);
  
  // 2. Calcular TDEE con factor de actividad detallado
  const { tdee, activityFactor } = calculateTDEEAdvanced(
    bmr,
    user.trainingFrequency,
    user.lifestyleActivity,
    user.occupation,
    user.dailySteps
  );
  
  // 3. Calcular calorías objetivo según goal
  const goalMultipliers = {
    'rapid_loss': 0.80,      // -20%
    'moderate_loss': 0.85,   // -15%
    'maintenance': 1.0,      // 0%
    'moderate_gain': 1.10,   // +10%
    'rapid_gain': 1.15       // +15%
  };
  
  const targetCalories = Math.round(tdee * goalMultipliers[user.goal]);
  
  // 4. Ajustar por adaptación metabólica si existe
  const { adjustedCalories, adjustment } = adjustForMetabolicAdaptation(targetCalories, user);
  
  // 5. Calcular distribución de macros
  const goalType = user.goal === 'rapid_loss' ? 'aggressive-cut' :
                   user.goal === 'moderate_loss' ? 'moderate-cut' :
                   user.goal === 'maintenance' ? 'maintenance' :
                   user.goal === 'moderate_gain' ? 'mild-bulk' :
                   'moderate-bulk';
  
  const macros = calculateMacrosAdvanced(
    adjustedCalories,
    user.weight,
    user.sex,
    goalType,
    leanBodyMass
  );
  
  return {
    goals: macros,
    calculations: {
      bmr: Math.round(bmr),
      bmrMethod: method,
      tdee: Math.round(tdee),
      activityFactor: Math.round(activityFactor * 100) / 100,
      targetCalories: Math.round(targetCalories),
      adjustedCalories: Math.round(adjustedCalories),
      metabolicAdjustment: adjustment !== 0 ? adjustment : undefined,
      leanBodyMass: leanBodyMass ? Math.round(leanBodyMass * 10) / 10 : undefined
    }
  };
};

/**
 * Genera explicaciones detalladas de los cálculos avanzados
 */
export const generateAdvancedExplanations = (
  user: User,
  calculations: ReturnType<typeof calculateUserMacrosAdvanced>['calculations']
): Array<{ title: string; text: string; icon: string }> => {
  const explanations = [];
  
  // 1. Explicación del método de cálculo
  if (calculations.bmrMethod === 'katch_mcardle' && calculations.leanBodyMass) {
    explanations.push({
      title: 'Cálculo Preciso de Metabolismo',
      text: `Tu TMB se calculó con la fórmula Katch-McArdle usando tu masa magra (${calculations.leanBodyMass}kg). Este método es MÁS PRECISO que el estándar porque considera tu composición corporal real, no solo tu peso total.`,
      icon: '🎯'
    });
  } else {
    explanations.push({
      title: 'Cálculo Estándar de Metabolismo',
      text: `Tu TMB se calculó con la fórmula Mifflin-St Jeor. Para mayor precisión, te recomendamos agregar tu % de grasa corporal en la configuración.`,
      icon: '📊'
    });
  }
  
  // 2. Explicación del NEAT
  const neatInfo = user.dailySteps ? `${user.dailySteps} pasos diarios` :
                   user.occupation ? `trabajo ${user.occupation}` :
                   user.lifestyleActivity ? `estilo de vida ${user.lifestyleActivity}` :
                   'actividad diaria estándar';
  
  explanations.push({
    title: 'Actividad Diaria Completa',
    text: `Tu TDEE (${calculations.tdee} kcal) considera TANTO tu ${neatInfo} COMO tus ${user.trainingFrequency} entrenamientos semanales. La mayoría de apps solo consideran el ejercicio, ignorando que el NEAT puede representar 300-800 kcal adicionales.`,
    icon: '🚶‍♂️'
  });
  
  // 3. Ajuste metabólico si existe
  if (calculations.metabolicAdjustment && calculations.metabolicAdjustment > 0) {
    explanations.push({
      title: '⚠️ Adaptación Metabólica Detectada',
      text: `Detectamos señales de metabolismo adaptado. Hemos ajustado tus calorías +${calculations.metabolicAdjustment} kcal/día para hacer un "reverse diet" gradual. Intentar un déficit ahora podría estancar tu progreso.`,
      icon: '⚠️'
    });
  }
  
  // 4. Proteína optimizada
  const proteinSource = calculations.leanBodyMass 
    ? `masa magra (${calculations.leanBodyMass}kg)` 
    : 'peso corporal';
    
  explanations.push({
    title: 'Proteína Optimizada',
    text: `Tus ${user.goals.protein}g de proteína diarios están calculados según tu ${proteinSource}. ${calculations.leanBodyMass ? 'Usar masa magra (en vez de peso total) es mucho más preciso.' : 'Si agregas tu % de grasa corporal, podríamos optimizar aún más este cálculo.'}`,
    icon: '🥩'
  });
  
  return explanations;
};
