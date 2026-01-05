import { WeeklyProgressRecord, User, DailyLog, DailyFeedback } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════
 * SISTEMA DE ANÁLISIS DE PROGRESO Y ADAPTACIÓN METABÓLICA
 * Analiza datos semanales y detecta necesidad de ajustes
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Calcula el progreso de peso esperado por semana según el objetivo
 */
export const getExpectedWeeklyWeightChange = (
  goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain'
): { min: number; max: number; unit: 'kg' } => {
  
  switch (goal) {
    case 'rapid_loss':
      return { min: -0.8, max: -1.0, unit: 'kg' }; // -0.8 a -1kg/semana
    case 'moderate_loss':
      return { min: -0.5, max: -0.7, unit: 'kg' }; // -0.5 a -0.7kg/semana
    case 'maintenance':
      return { min: -0.2, max: 0.2, unit: 'kg' }; // ±0.2kg/semana (fluctuación normal)
    case 'moderate_gain':
      return { min: 0.2, max: 0.4, unit: 'kg' }; // +0.2 a +0.4kg/semana
    case 'rapid_gain':
      return { min: 0.4, max: 0.6, unit: 'kg' }; // +0.4 a +0.6kg/semana
  }
};

/**
 * Analiza el progreso semanal y determina si va según lo planeado
 */
export const analyzeWeeklyProgress = (
  weekData: WeeklyProgressRecord,
  user: User
): {
  trend: WeeklyProgressRecord['weeklyAnalysis']['trend'];
  isOnTrack: boolean;
  needsAdjustment: boolean;
  adjustmentRecommendation?: string;
  adjustmentAmount?: number;
} => {
  
  const { weightChange } = weekData;
  const expected = getExpectedWeeklyWeightChange(user.goal);
  
  // Determinar tendencia
  let trend: WeeklyProgressRecord['weeklyAnalysis']['trend'];
  
  if (weightChange <= -0.8) {
    trend = 'losing_fast';
  } else if (weightChange <= -0.5) {
    trend = 'losing_moderate';
  } else if (weightChange <= -0.2) {
    trend = 'losing_slow';
  } else if (weightChange <= 0.2) {
    trend = 'maintaining';
  } else if (weightChange <= 0.4) {
    trend = 'gaining_slow';
  } else if (weightChange <= 0.6) {
    trend = 'gaining_moderate';
  } else {
    trend = 'gaining_fast';
  }
  
  // Determinar si va según el plan
  let isOnTrack = false;
  let needsAdjustment = false;
  let adjustmentRecommendation: string | undefined;
  let adjustmentAmount: number | undefined;
  
  // Tolerancia: ±0.2kg del rango esperado
  const tolerance = 0.2;
  
  if (user.goal.includes('loss')) {
    // Si está en déficit, debería perder peso
    if (weightChange >= expected.min - tolerance && weightChange <= expected.max + tolerance) {
      isOnTrack = true;
    } else if (weightChange > expected.max + tolerance) {
      // Perdiendo muy poco peso o ganando
      needsAdjustment = true;
      adjustmentRecommendation = weightChange > 0 
        ? 'No estás perdiendo peso. Reducir calorías o aumentar actividad.'
        : 'Pérdida de peso muy lenta. Pequeño ajuste recomendado.';
      adjustmentAmount = -100; // -100 kcal/día
    } else if (weightChange < expected.min - tolerance) {
      // Perdiendo demasiado rápido
      needsAdjustment = true;
      adjustmentRecommendation = 'Pérdida de peso muy rápida. Aumentar calorías para preservar músculo.';
      adjustmentAmount = +100; // +100 kcal/día
    }
  } else if (user.goal.includes('gain')) {
    // Si está en superávit, debería ganar peso
    if (weightChange >= expected.min - tolerance && weightChange <= expected.max + tolerance) {
      isOnTrack = true;
    } else if (weightChange < expected.min - tolerance) {
      // Ganando muy poco peso o perdiendo
      needsAdjustment = true;
      adjustmentRecommendation = weightChange < 0
        ? 'Estás perdiendo peso en superávit. Aumentar calorías significativamente.'
        : 'Ganancia de peso muy lenta. Aumentar calorías.';
      adjustmentAmount = +150; // +150 kcal/día
    } else if (weightChange > expected.max + tolerance) {
      // Ganando demasiado rápido (probablemente grasa)
      needsAdjustment = true;
      adjustmentRecommendation = 'Ganancia de peso muy rápida. Reducir calorías para minimizar grasa.';
      adjustmentAmount = -100; // -100 kcal/día
    }
  } else {
    // Mantenimiento
    if (Math.abs(weightChange) <= 0.3) {
      isOnTrack = true;
    } else {
      needsAdjustment = true;
      adjustmentRecommendation = weightChange > 0
        ? 'Peso aumentando en mantenimiento. Reducir ligeramente.'
        : 'Peso bajando en mantenimiento. Aumentar ligeramente.';
      adjustmentAmount = weightChange > 0 ? -75 : +75;
    }
  }
  
  return {
    trend,
    isOnTrack,
    needsAdjustment,
    adjustmentRecommendation,
    adjustmentAmount
  };
};

/**
 * Detecta señales de metabolismo adaptado analizando múltiples semanas
 */
export const detectMetabolicAdaptation = (
  weeklyProgress: WeeklyProgressRecord[],
  user: User,
  dailyFeedback?: DailyFeedback[]
): {
  isAdapted: boolean;
  adaptationLevel: 'none' | 'mild' | 'moderate' | 'severe';
  recommendedPhase: 'reverse_diet' | 'maintenance' | 'cut' | 'bulk';
  flags: {
    weightStagnant: boolean;
    energyDropping: boolean;
    hungerIncreasing: boolean;
    performanceDecreasing: boolean;
  };
  explanation: string;
} => {
  
  // Necesitamos al menos 3 semanas de datos
  if (weeklyProgress.length < 3) {
    return {
      isAdapted: false,
      adaptationLevel: 'none',
      recommendedPhase: user.goal.includes('loss') ? 'cut' : user.goal.includes('gain') ? 'bulk' : 'maintenance',
      flags: {
        weightStagnant: false,
        energyDropping: false,
        hungerIncreasing: false,
        performanceDecreasing: false
      },
      explanation: 'Datos insuficientes para análisis (mínimo 3 semanas)'
    };
  }
  
  const recent3Weeks = weeklyProgress.slice(-3);
  const recent2Weeks = weeklyProgress.slice(-2);
  
  // FLAG 1: Peso estancado (en déficit calórico)
  const weightStagnant = user.goal.includes('loss') && 
    recent2Weeks.every(week => Math.abs(week.weightChange) < 0.2);
  
  // FLAG 2: Energía cayendo progresivamente
  const energyDropping = recent3Weeks.every((week, idx) => {
    if (!week.energyLevels) return false;
    const avgEnergy = week.energyLevels.filter(e => e === 'low').length / week.energyLevels.length;
    // Cada semana tiene más días de baja energía
    if (idx > 0) {
      const prevAvgEnergy = recent3Weeks[idx - 1].energyLevels
        ? recent3Weeks[idx - 1].energyLevels!.filter(e => e === 'low').length / recent3Weeks[idx - 1].energyLevels!.length
        : 0;
      return avgEnergy > prevAvgEnergy;
    }
    return avgEnergy > 0.4; // Más de 40% de días con baja energía
  });
  
  // FLAG 3: Hambre aumentando progresivamente
  const hungerIncreasing = recent3Weeks.every((week, idx) => {
    if (!week.hungerLevels) return false;
    const avgHunger = week.hungerLevels.filter(h => h === 'very_hungry').length / week.hungerLevels.length;
    if (idx > 0) {
      const prevAvgHunger = recent3Weeks[idx - 1].hungerLevels
        ? recent3Weeks[idx - 1].hungerLevels!.filter(h => h === 'very_hungry').length / recent3Weeks[idx - 1].hungerLevels!.length
        : 0;
      return avgHunger > prevAvgHunger;
    }
    return avgHunger > 0.4;
  });
  
  // FLAG 4: Rendimiento en el gym cayendo
  const performanceDecreasing = recent3Weeks.every((week, idx) => {
    if (!week.workoutQuality) return false;
    const avgPerformance = week.workoutQuality.filter(q => q === 'poor' || q === 'ok').length / week.workoutQuality.length;
    if (idx > 0) {
      const prevAvgPerformance = recent3Weeks[idx - 1].workoutQuality
        ? recent3Weeks[idx - 1].workoutQuality!.filter(q => q === 'poor' || q === 'ok').length / recent3Weeks[idx - 1].workoutQuality!.length
        : 0;
      return avgPerformance > prevAvgPerformance;
    }
    return avgPerformance > 0.5;
  });
  
  // Contar flags activos
  const activeFlags = [weightStagnant, energyDropping, hungerIncreasing, performanceDecreasing].filter(Boolean).length;
  
  // Determinar nivel de adaptación
  let adaptationLevel: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
  let isAdapted = false;
  let recommendedPhase: 'reverse_diet' | 'maintenance' | 'cut' | 'bulk';
  let explanation = '';
  
  if (activeFlags === 0) {
    adaptationLevel = 'none';
    isAdapted = false;
    recommendedPhase = user.goal.includes('loss') ? 'cut' : user.goal.includes('gain') ? 'bulk' : 'maintenance';
    explanation = 'Todo va bien. Sin señales de adaptación metabólica.';
  } else if (activeFlags === 1) {
    adaptationLevel = 'mild';
    isAdapted = true;
    recommendedPhase = user.goal.includes('loss') ? 'maintenance' : 'cut';
    explanation = 'Adaptación leve detectada. Considera tomar 1-2 semanas en mantenimiento antes de continuar.';
  } else if (activeFlags === 2) {
    adaptationLevel = 'moderate';
    isAdapted = true;
    recommendedPhase = 'reverse_diet';
    explanation = 'Adaptación moderada detectada. Se recomienda "reverse diet" (aumentar calorías gradualmente) por 2-4 semanas.';
  } else {
    adaptationLevel = 'severe';
    isAdapted = true;
    recommendedPhase = 'reverse_diet';
    explanation = 'Adaptación severa detectada. OBLIGATORIO hacer "reverse diet" por 4-8 semanas antes de intentar déficit nuevamente.';
  }
  
  return {
    isAdapted,
    adaptationLevel,
    recommendedPhase,
    flags: {
      weightStagnant,
      energyDropping,
      hungerIncreasing,
      performanceDecreasing
    },
    explanation
  };
};

/**
 * Genera un registro de progreso semanal a partir de logs diarios
 */
export const generateWeeklyProgress = (
  weekStartDate: string,
  weekNumber: number,
  dailyLogs: DailyLog[],
  user: User,
  dailyFeedback?: DailyFeedback[]
): WeeklyProgressRecord => {
  
  // Filtrar logs de esta semana
  const weekStart = new Date(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const logsThisWeek = dailyLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= weekStart && logDate < weekEnd;
  });
  
  // Calcular pesos
  const weights = logsThisWeek.map(log => log.weight).filter((w): w is number => w !== undefined);
  const startWeight = weights.length > 0 ? weights[0] : user.weight;
  const endWeight = weights.length > 0 ? weights[weights.length - 1] : user.weight;
  const averageWeight = weights.length > 0 
    ? weights.reduce((a, b) => a + b, 0) / weights.length 
    : user.weight;
  const weightChange = endWeight - startWeight;
  
  // Calcular adherencia nutricional
  const daysLogged = logsThisWeek.length;
  
  const totalCalories = logsThisWeek.reduce((acc, log) => {
    const dayCalories = 
      (log.breakfast?.calories || 0) +
      (log.lunch?.calories || 0) +
      (log.snack?.calories || 0) +
      (log.dinner?.calories || 0) +
      (log.extraFoods?.reduce((sum, food) => sum + food.calories, 0) || 0);
    return acc + dayCalories;
  }, 0);
  
  const averageCalories = daysLogged > 0 ? totalCalories / daysLogged : 0;
  const targetCalories = user.goals.calories;
  const calorieAdherence = targetCalories > 0 
    ? Math.min(100, Math.round((averageCalories / targetCalories) * 100)) 
    : 0;
  
  // Calcular macros promedio
  const totalProtein = logsThisWeek.reduce((acc, log) => 
    acc + (log.breakfast?.protein || 0) + (log.lunch?.protein || 0) + (log.snack?.protein || 0) + (log.dinner?.protein || 0), 0);
  const totalCarbs = logsThisWeek.reduce((acc, log) => 
    acc + (log.breakfast?.carbs || 0) + (log.lunch?.carbs || 0) + (log.snack?.carbs || 0) + (log.dinner?.carbs || 0), 0);
  const totalFat = logsThisWeek.reduce((acc, log) => 
    acc + (log.breakfast?.fat || 0) + (log.lunch?.fat || 0) + (log.snack?.fat || 0) + (log.dinner?.fat || 0), 0);
  
  const averageProtein = daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0;
  const averageCarbs = daysLogged > 0 ? Math.round(totalCarbs / daysLogged) : 0;
  const averageFat = daysLogged > 0 ? Math.round(totalFat / daysLogged) : 0;
  
  // Extraer feedback si está disponible
  const feedbackThisWeek = dailyFeedback?.filter(fb => {
    const fbDate = new Date(fb.date);
    return fbDate >= weekStart && fbDate < weekEnd;
  });
  
  const energyLevels = feedbackThisWeek?.map(fb => fb.afternoonEnergy) || undefined;
  const hungerLevels = feedbackThisWeek?.map(fb => fb.betweenMealsHunger) || undefined;
  const workoutQuality = feedbackThisWeek?.flatMap(fb => fb.trainedToday && fb.workoutQuality ? [fb.workoutQuality] : []) || undefined;
  
  // Calcular adherencia a entrenamientos
  const workoutsDone = feedbackThisWeek?.filter(fb => fb.trainedToday).length || 0;
  const workoutsPlanned = user.trainingFrequency;
  const workoutAdherence = workoutsPlanned > 0 
    ? Math.round((workoutsDone / workoutsPlanned) * 100) 
    : 0;
  
  // Crear registro base
  const weekRecord: WeeklyProgressRecord = {
    weekStartDate,
    weekNumber,
    startWeight,
    endWeight,
    weightChange,
    averageWeight,
    daysLogged,
    averageCalories,
    targetCalories,
    calorieAdherence,
    averageProtein,
    averageCarbs,
    averageFat,
    energyLevels,
    hungerLevels,
    workoutQuality,
    workoutsDone,
    workoutsPlanned,
    workoutAdherence,
    weeklyAnalysis: {
      trend: 'maintaining',
      isOnTrack: false,
      needsAdjustment: false
    }
  };
  
  // Analizar progreso
  const analysis = analyzeWeeklyProgress(weekRecord, user);
  weekRecord.weeklyAnalysis = analysis;
  
  return weekRecord;
};

/**
 * Sugiere ajuste de calorías basado en múltiples semanas de datos
 */
export const suggestCalorieAdjustment = (
  weeklyProgress: WeeklyProgressRecord[],
  user: User
): {
  shouldAdjust: boolean;
  newCalories: number;
  adjustment: number;
  reason: string;
} => {
  
  if (weeklyProgress.length < 2) {
    return {
      shouldAdjust: false,
      newCalories: user.goals.calories,
      adjustment: 0,
      reason: 'Datos insuficientes (mínimo 2 semanas)'
    };
  }
  
  const lastWeek = weeklyProgress[weeklyProgress.length - 1];
  const analysis = lastWeek.weeklyAnalysis;
  
  if (!analysis.needsAdjustment || !analysis.adjustmentAmount) {
    return {
      shouldAdjust: false,
      newCalories: user.goals.calories,
      adjustment: 0,
      reason: 'Progreso según lo planeado'
    };
  }
  
  const newCalories = user.goals.calories + analysis.adjustmentAmount;
  
  return {
    shouldAdjust: true,
    newCalories: Math.round(newCalories),
    adjustment: analysis.adjustmentAmount,
    reason: analysis.adjustmentRecommendation || 'Ajuste recomendado basado en progreso'
  };
};
