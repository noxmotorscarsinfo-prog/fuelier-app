import { User, WeeklyProgressRecord, MacroGoals } from '../types';
import { calculateAllGoals } from './macroCalculations';

/**
 * SISTEMA ADAPTATIVO AUTOMÁTICO
 * Analiza el progreso semanal y ajusta los macros automáticamente
 * cada 2-3 semanas basándose en resultados reales
 */

interface ProgressAnalysis {
  needsAdjustment: boolean;
  adjustmentType: 'increase' | 'decrease' | 'none';
  adjustmentAmount: number; // Calorías
  reason: string;
  confidence: 'low' | 'medium' | 'high';
  warnings: string[];
}

/**
 * Analiza el progreso de las últimas 2-3 semanas
 */
export function analyzeProgress(user: User): ProgressAnalysis {
  const warnings: string[] = [];
  
  // Si no hay suficiente historial, no ajustar
  if (!user.weeklyProgress || user.weeklyProgress.length < 2) {
    return {
      needsAdjustment: false,
      adjustmentType: 'none',
      adjustmentAmount: 0,
      reason: 'Necesitas al menos 2 semanas de datos para análisis',
      confidence: 'low',
      warnings: ['Registra tu peso semanalmente para habilitar ajustes automáticos']
    };
  }

  // Obtener últimas 2-3 semanas
  const recentWeeks = user.weeklyProgress.slice(-3);
  
  // Calcular promedio de cambio de peso semanal
  const totalWeightChange = recentWeeks.reduce((sum, week) => sum + week.weightChange, 0);
  const averageWeeklyChange = totalWeightChange / recentWeeks.length;
  
  // Calcular adherencia promedio
  const averageAdherence = recentWeeks.reduce((sum, week) => sum + week.calorieAdherence, 0) / recentWeeks.length;
  
  // Determinar objetivo de cambio semanal
  const targetWeeklyChange = getTargetWeeklyChange(user.goal);
  
  // Calcular desviación
  const deviation = averageWeeklyChange - targetWeeklyChange;
  const deviationPercentage = Math.abs(deviation / targetWeeklyChange) * 100;
  
  // Verificar adherencia
  if (averageAdherence < 70) {
    warnings.push('Tu adherencia es baja (<70%). Intenta seguir el plan más de cerca antes de ajustar.');
    return {
      needsAdjustment: false,
      adjustmentType: 'none',
      adjustmentAmount: 0,
      reason: 'Adherencia insuficiente para análisis preciso',
      confidence: 'low',
      warnings
    };
  }
  
  // Si la desviación es menor al 15%, está bien
  if (deviationPercentage < 15) {
    return {
      needsAdjustment: false,
      adjustmentType: 'none',
      adjustmentAmount: 0,
      reason: '¡Vas perfectamente según el plan!',
      confidence: 'high',
      warnings: []
    };
  }
  
  // Detectar estancamiento (peso sin cambios significativos)
  const isStagnant = Math.abs(averageWeeklyChange) < 0.1;
  if (isStagnant && (user.goal.includes('loss') || user.goal.includes('gain'))) {
    warnings.push('Peso estancado detectado. Puede ser retención de líquidos o adaptación metabólica.');
  }
  
  // Detectar cambios demasiado rápidos
  const isTooFast = Math.abs(averageWeeklyChange) > Math.abs(targetWeeklyChange) * 1.5;
  if (isTooFast) {
    warnings.push('Cambio de peso más rápido de lo esperado. Considera ajustar para mayor sostenibilidad.');
  }
  
  // Calcular ajuste necesario
  let adjustmentAmount = 0;
  let adjustmentType: 'increase' | 'decrease' | 'none' = 'none';
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  
  // Lógica de ajuste basada en objetivo
  if (user.goal.includes('loss')) {
    // OBJETIVO: Perder peso
    if (averageWeeklyChange > -0.1) {
      // No está perdiendo → Reducir calorías
      adjustmentType = 'decrease';
      adjustmentAmount = calculateCalorieAdjustment(deviation, averageAdherence);
      confidence = 'high';
    } else if (averageWeeklyChange < targetWeeklyChange * 1.5) {
      // Perdiendo demasiado rápido → Aumentar calorías
      adjustmentType = 'increase';
      adjustmentAmount = calculateCalorieAdjustment(deviation, averageAdherence);
      confidence = 'medium';
      warnings.push('Pérdida muy rápida puede causar pérdida de masa muscular');
    }
  } else if (user.goal.includes('gain')) {
    // OBJETIVO: Ganar peso
    if (averageWeeklyChange < 0.1) {
      // No está ganando → Aumentar calorías
      adjustmentType = 'increase';
      adjustmentAmount = calculateCalorieAdjustment(deviation, averageAdherence);
      confidence = 'high';
    } else if (averageWeeklyChange > targetWeeklyChange * 1.5) {
      // Ganando demasiado rápido → Reducir calorías
      adjustmentType = 'decrease';
      adjustmentAmount = calculateCalorieAdjustment(deviation, averageAdherence);
      confidence = 'medium';
      warnings.push('Ganancia muy rápida puede aumentar % de grasa corporal');
    }
  } else {
    // OBJETIVO: Mantenimiento
    if (Math.abs(averageWeeklyChange) > 0.2) {
      // Peso cambiando → Ajustar hacia mantenimiento
      if (averageWeeklyChange > 0) {
        adjustmentType = 'decrease';
      } else {
        adjustmentType = 'increase';
      }
      adjustmentAmount = calculateCalorieAdjustment(deviation, averageAdherence);
      confidence = 'medium';
    }
  }
  
  const needsAdjustment = adjustmentType !== 'none' && Math.abs(adjustmentAmount) >= 50;
  
  return {
    needsAdjustment,
    adjustmentType,
    adjustmentAmount: Math.round(adjustmentAmount),
    reason: generateAdjustmentReason(averageWeeklyChange, targetWeeklyChange, adjustmentType),
    confidence,
    warnings
  };
}

/**
 * Obtiene el cambio de peso semanal objetivo según la meta
 */
function getTargetWeeklyChange(goal: User['goal']): number {
  switch (goal) {
    case 'rapid_loss':
      return -0.875; // Promedio de -0.75 a -1kg
    case 'moderate_loss':
      return -0.625; // Promedio de -0.5 a -0.75kg
    case 'maintenance':
      return 0;
    case 'moderate_gain':
      return 0.375; // Promedio de 0.25 a 0.5kg
    case 'rapid_gain':
      return 0.625; // Promedio de 0.5 a 0.75kg
    default:
      return 0;
  }
}

/**
 * Calcula el ajuste de calorías necesario
 * Basado en la regla: 1kg de peso ≈ 7700 kcal
 */
function calculateCalorieAdjustment(deviationKg: number, adherence: number): number {
  // 1 kg de peso = aproximadamente 7700 kcal
  // Desviación semanal × 7700 = calorías de desviación
  const totalCaloriesDeviation = deviationKg * 7700;
  
  // Dividir entre 7 días para obtener ajuste diario
  const dailyAdjustment = totalCaloriesDeviation / 7;
  
  // Ajustar según adherencia (si adherencia baja, no hacer ajustes grandes)
  const adherenceFactor = adherence / 100;
  
  // Limitar ajustes entre 50 y 300 kcal/día para seguridad
  const limitedAdjustment = Math.max(-300, Math.min(300, dailyAdjustment * adherenceFactor));
  
  return Math.abs(limitedAdjustment);
}

/**
 * Genera una explicación del ajuste
 */
function generateAdjustmentReason(actual: number, target: number, adjustmentType: 'increase' | 'decrease' | 'none'): string {
  if (adjustmentType === 'none') {
    return '¡Vas perfectamente según el plan!';
  }
  
  const diff = Math.abs(actual - target);
  
  if (adjustmentType === 'increase') {
    return `Estás ${actual < 0 ? 'perdiendo' : 'ganando'} ${diff.toFixed(2)}kg/semana menos de lo esperado. Aumentaremos tus calorías.`;
  } else {
    return `Estás ${actual < 0 ? 'perdiendo' : 'ganando'} ${diff.toFixed(2)}kg/semana más de lo esperado. Reduciremos tus calorías.`;
  }
}

/**
 * Aplica el ajuste automático a los macros del usuario
 */
export function applyAutomaticAdjustment(user: User, analysis: ProgressAnalysis): MacroGoals {
  if (!analysis.needsAdjustment) {
    return user.goals;
  }
  
  const currentGoals = user.goals;
  const adjustmentCalories = analysis.adjustmentType === 'increase' 
    ? analysis.adjustmentAmount 
    : -analysis.adjustmentAmount;
  
  // Nueva meta de calorías
  const newCalories = Math.max(1200, currentGoals.calories + adjustmentCalories);
  
  // Recalcular macros manteniendo los mismos ratios que antes
  const proteinRatio = currentGoals.protein * 4 / currentGoals.calories;
  const carbsRatio = currentGoals.carbs * 4 / currentGoals.calories;
  const fatRatio = currentGoals.fat * 9 / currentGoals.calories;
  
  // Calcular nuevos macros
  const newProtein = Math.round((newCalories * proteinRatio) / 4);
  const newCarbs = Math.round((newCalories * carbsRatio) / 4);
  const newFat = Math.round((newCalories * fatRatio) / 9);
  
  return {
    calories: newCalories,
    protein: newProtein,
    carbs: newCarbs,
    fat: newFat
  };
}

/**
 * Detecta metabolismo adaptado (CRÍTICO)
 * Si el metabolismo se ha adaptado, necesitamos una estrategia diferente
 */
export function detectMetabolicAdaptation(user: User): {
  isAdapted: boolean;
  level: 'none' | 'mild' | 'moderate' | 'severe';
  recommendedAction: string;
} {
  if (!user.weeklyProgress || user.weeklyProgress.length < 4) {
    return {
      isAdapted: false,
      level: 'none',
      recommendedAction: 'Continúa tracking para análisis'
    };
  }
  
  // Banderas de metabolismo adaptado
  const recentWeeks = user.weeklyProgress.slice(-4);
  
  // 1. Peso estancado 3+ semanas
  const weightChanges = recentWeeks.map(w => Math.abs(w.weightChange));
  const avgWeightChange = weightChanges.reduce((a, b) => a + b, 0) / weightChanges.length;
  const weightStagnant = avgWeightChange < 0.1 && user.goal.includes('loss');
  
  // 2. Calorías muy bajas pero sin pérdida de peso
  const avgCalories = recentWeeks.reduce((sum, w) => sum + w.averageCalories, 0) / recentWeeks.length;
  const lowCaloriesNoLoss = avgCalories < 1400 && weightStagnant && user.sex === 'female';
  const lowCaloriesNoLossMale = avgCalories < 1800 && weightStagnant && user.sex === 'male';
  
  // 3. Energía constantemente baja
  const hasEnergyData = recentWeeks.some(w => w.energyLevels && w.energyLevels.length > 0);
  const lowEnergy = hasEnergyData && recentWeeks.every(w => {
    const avgEnergy = (w.energyLevels || []).filter(e => e === 'low').length / (w.energyLevels || []).length;
    return avgEnergy > 0.5;
  });
  
  // 4. Hambre aumentando
  const hasHungerData = recentWeeks.some(w => w.hungerLevels && w.hungerLevels.length > 0);
  const highHunger = hasHungerData && recentWeeks.every(w => {
    const avgHunger = (w.hungerLevels || []).filter(h => h === 'very_hungry' || h === 'hungry').length / (w.hungerLevels || []).length;
    return avgHunger > 0.5;
  });
  
  // 5. Rendimiento bajando
  const hasWorkoutData = recentWeeks.some(w => w.workoutQuality && w.workoutQuality.length > 0);
  const poorPerformance = hasWorkoutData && recentWeeks.every(w => {
    const avgQuality = (w.workoutQuality || []).filter(q => q === 'poor' || q === 'ok').length / (w.workoutQuality || []).length;
    return avgQuality > 0.5;
  });
  
  // Contar banderas activas
  let flagsActive = 0;
  if (weightStagnant) flagsActive++;
  if (lowCaloriesNoLoss || lowCaloriesNoLossMale) flagsActive++;
  if (lowEnergy) flagsActive++;
  if (highHunger) flagsActive++;
  if (poorPerformance) flagsActive++;
  
  // Determinar nivel de adaptación
  let level: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
  let isAdapted = false;
  let recommendedAction = '';
  
  if (flagsActive >= 4) {
    level = 'severe';
    isAdapted = true;
    recommendedAction = 'REVERSE DIET RECOMENDADO: Aumenta calorías gradualmente durante 8-12 semanas para recuperar metabolismo';
  } else if (flagsActive >= 3) {
    level = 'moderate';
    isAdapted = true;
    recommendedAction = 'Diet Break: Toma 2 semanas en mantenimiento para recuperar antes de continuar';
  } else if (flagsActive >= 2) {
    level = 'mild';
    isAdapted = true;
    recommendedAction = 'Refeed: Aumenta carbohidratos 1-2 días/semana para mejorar hormonas';
  }
  
  return {
    isAdapted,
    level,
    recommendedAction
  };
}

/**
 * Genera un registro de progreso semanal
 * Llamar esta función cada 7 días automáticamente
 */
export function generateWeeklyProgress(user: User, dailyLogs: any[]): WeeklyProgressRecord | null {
  // Verificar que tengamos al menos 5 días de datos
  if (dailyLogs.length < 5) {
    return null;
  }
  
  const weekNumber = (user.weeklyProgress?.length || 0) + 1;
  const today = new Date();
  const weekStartDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Calcular promedios
  const validLogs = dailyLogs.filter(log => 
    log.breakfast || log.lunch || log.snack || log.dinner
  );
  
  const totalCalories = validLogs.reduce((sum, log) => {
    const mealCalories = [log.breakfast, log.lunch, log.snack, log.dinner]
      .filter(m => m)
      .reduce((s, m) => s + (m?.calories || 0), 0);
    const extraCalories = (log.extraFoods || []).reduce((s: number, f: any) => s + f.calories, 0);
    return sum + mealCalories + extraCalories;
  }, 0);
  
  const averageCalories = Math.round(totalCalories / validLogs.length);
  
  // Calcular macros promedio (simplificado para este ejemplo)
  const averageProtein = Math.round(averageCalories * 0.3 / 4);
  const averageCarbs = Math.round(averageCalories * 0.4 / 4);
  const averageFat = Math.round(averageCalories * 0.3 / 9);
  
  // Adherencia
  const calorieAdherence = Math.min(100, (averageCalories / user.goals.calories) * 100);
  
  // Pesos (simplificado - en producción se obtendría de los registros diarios)
  const startWeight = user.weeklyProgress?.[user.weeklyProgress.length - 1]?.endWeight || user.weight;
  const endWeight = user.weight;
  const weightChange = endWeight - startWeight;
  const averageWeight = (startWeight + endWeight) / 2;
  
  // Análisis de tendencia
  let trend: WeeklyProgressRecord['weeklyAnalysis']['trend'];
  const weeklyChange = weightChange;
  
  if (weeklyChange < -0.75) trend = 'losing_fast';
  else if (weeklyChange < -0.3) trend = 'losing_moderate';
  else if (weeklyChange < -0.1) trend = 'losing_slow';
  else if (weeklyChange > 0.75) trend = 'gaining_fast';
  else if (weeklyChange > 0.3) trend = 'gaining_moderate';
  else if (weeklyChange > 0.1) trend = 'gaining_slow';
  else trend = 'maintaining';
  
  const analysis = analyzeProgress(user);
  
  return {
    weekStartDate,
    weekNumber,
    startWeight,
    endWeight,
    weightChange,
    averageWeight,
    daysLogged: validLogs.length,
    averageCalories,
    targetCalories: user.goals.calories,
    calorieAdherence: Math.round(calorieAdherence),
    averageProtein,
    averageCarbs,
    averageFat,
    workoutsDone: user.trainingFrequency || 0,
    workoutsPlanned: user.trainingFrequency || 0,
    workoutAdherence: 100,
    weeklyAnalysis: {
      trend,
      isOnTrack: !analysis.needsAdjustment,
      needsAdjustment: analysis.needsAdjustment,
      adjustmentRecommendation: analysis.reason,
      adjustmentAmount: analysis.adjustmentAmount
    }
  };
}
