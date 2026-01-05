import { User, MealAdaptationRecord, MealType } from '../types';

/**
 * SISTEMA DE APRENDIZAJE Y PERSONALIZACIÓN
 * 
 * Este sistema aprende de las elecciones del usuario a lo largo del tiempo
 * para mejorar las recomendaciones y adaptar mejor las porciones.
 */

/**
 * Analiza el historial de adaptaciones para detectar patrones de usuario
 */
export function analyzeUserPatterns(user: User): {
  averagePortionByMealType: Record<MealType, number>;
  preferredPortionTrend: 'tends_smaller' | 'normal' | 'tends_larger';
  acceptanceRateByPortion: {
    small: number; // % de aceptación cuando porción < 0.8
    normal: number; // % de aceptación cuando porción 0.8-1.2
    large: number; // % de aceptación cuando porción > 1.2
  };
  mostAcceptedMeals: string[]; // IDs de comidas más aceptadas
  leastAcceptedMeals: string[]; // IDs de comidas rechazadas frecuentemente
  totalAdaptations: number;
  confidenceLevel: 'low' | 'medium' | 'high'; // Basado en cantidad de datos
} {
  const history = user.adaptationHistory || [];
  
  if (history.length === 0) {
    return {
      averagePortionByMealType: {
        breakfast: 1.0,
        lunch: 1.0,
        snack: 1.0,
        dinner: 1.0
      },
      preferredPortionTrend: 'normal',
      acceptanceRateByPortion: {
        small: 0,
        normal: 0,
        large: 0
      },
      mostAcceptedMeals: [],
      leastAcceptedMeals: [],
      totalAdaptations: 0,
      confidenceLevel: 'low'
    };
  }
  
  // Calcular promedio de porciones por tipo de comida
  const portionsByType: Record<MealType, number[]> = {
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: []
  };
  
  history.forEach(record => {
    const portion = record.userAdjustedPortion || record.portionMultiplier;
    portionsByType[record.mealType].push(portion);
  });
  
  const averagePortionByMealType: Record<MealType, number> = {
    breakfast: average(portionsByType.breakfast) || 1.0,
    lunch: average(portionsByType.lunch) || 1.0,
    snack: average(portionsByType.snack) || 1.0,
    dinner: average(portionsByType.dinner) || 1.0
  };
  
  // Calcular tendencia general
  const allPortions = history.map(r => r.userAdjustedPortion || r.portionMultiplier);
  const avgPortion = average(allPortions);
  const preferredPortionTrend = 
    avgPortion < 0.85 ? 'tends_smaller' : 
    avgPortion > 1.15 ? 'tends_larger' : 
    'normal';
  
  // Tasa de aceptación por tamaño de porción
  const smallPortions = history.filter(r => r.portionMultiplier < 0.8);
  const normalPortions = history.filter(r => r.portionMultiplier >= 0.8 && r.portionMultiplier <= 1.2);
  const largePortions = history.filter(r => r.portionMultiplier > 1.2);
  
  const acceptanceRateByPortion = {
    small: smallPortions.length > 0 ? 
      (smallPortions.filter(r => r.wasAccepted).length / smallPortions.length) * 100 : 0,
    normal: normalPortions.length > 0 ? 
      (normalPortions.filter(r => r.wasAccepted).length / normalPortions.length) * 100 : 0,
    large: largePortions.length > 0 ? 
      (largePortions.filter(r => r.wasAccepted).length / largePortions.length) * 100 : 0
  };
  
  // Comidas más y menos aceptadas
  const mealAcceptance = new Map<string, { accepted: number; total: number }>();
  history.forEach(record => {
    const current = mealAcceptance.get(record.mealId) || { accepted: 0, total: 0 };
    current.total++;
    if (record.wasAccepted) current.accepted++;
    mealAcceptance.set(record.mealId, current);
  });
  
  const sortedMeals = Array.from(mealAcceptance.entries())
    .filter(([_, stats]) => stats.total >= 2) // Filtrar comidas con al menos 2 intentos
    .sort((a, b) => (b[1].accepted / b[1].total) - (a[1].accepted / a[1].total));
  
  const mostAcceptedMeals = sortedMeals.slice(0, 10).map(([id]) => id);
  const leastAcceptedMeals = sortedMeals.slice(-5).map(([id]) => id);
  
  // Nivel de confianza basado en cantidad de datos
  const confidenceLevel: 'low' | 'medium' | 'high' = 
    history.length < 10 ? 'low' :
    history.length < 30 ? 'medium' :
    'high';
  
  return {
    averagePortionByMealType,
    preferredPortionTrend,
    acceptanceRateByPortion,
    mostAcceptedMeals,
    leastAcceptedMeals,
    totalAdaptations: history.length,
    confidenceLevel
  };
}

/**
 * Ajusta el multiplicador de porción basándose en preferencias del usuario
 */
export function applyUserPreferences(
  baseMultiplier: number,
  user: User,
  mealType: MealType
): number {
  let adjustedMultiplier = baseMultiplier;
  
  // 1. Aplicar preferencias explícitas de tamaño de porción
  const portionPref = user.preferences.portionPreferences?.[mealType];
  if (portionPref === 'small') {
    adjustedMultiplier *= 0.85;
  } else if (portionPref === 'large') {
    adjustedMultiplier *= 1.15;
  }
  
  // 2. Aplicar aprendizaje del historial
  if (user.adaptationHistory && user.adaptationHistory.length >= 5) {
    const patterns = analyzeUserPatterns(user);
    
    // Si tiene nivel de confianza medio o alto, ajustar según promedio histórico
    if (patterns.confidenceLevel === 'medium' || patterns.confidenceLevel === 'high') {
      const historicalAvg = patterns.averagePortionByMealType[mealType];
      // Mezclar 70% base + 30% histórico para suavizar
      adjustedMultiplier = (adjustedMultiplier * 0.7) + (historicalAvg * 0.3);
    }
  }
  
  // 3. Aplicar preferencias de timing (comida pesada en momento preferido)
  const timingPref = user.preferences.timingPreferences?.heavyMealTime;
  if (timingPref) {
    const isPreferredTime = 
      (timingPref === 'morning' && mealType === 'breakfast') ||
      (timingPref === 'midday' && mealType === 'lunch') ||
      (timingPref === 'evening' && mealType === 'dinner');
    
    if (isPreferredTime) {
      adjustedMultiplier *= 1.1; // Aumentar 10% en comida preferida
    }
  }
  
  return adjustedMultiplier;
}

/**
 * Registra una nueva adaptación en el historial del usuario
 */
export function recordAdaptation(
  user: User,
  record: MealAdaptationRecord
): User {
  const updatedHistory = [...(user.adaptationHistory || []), record];
  
  // Mantener solo los últimos 100 registros para evitar crecimiento infinito
  if (updatedHistory.length > 100) {
    updatedHistory.shift();
  }
  
  return {
    ...user,
    adaptationHistory: updatedHistory
  };
}

/**
 * Genera recomendaciones personalizadas basadas en el historial
 */
export function generatePersonalizedInsights(user: User): {
  title: string;
  message: string;
  type: 'info' | 'tip' | 'achievement';
  icon: string;
}[] {
  const patterns = analyzeUserPatterns(user);
  const insights: {
    title: string;
    message: string;
    type: 'info' | 'tip' | 'achievement';
    icon: string;
  }[] = [];
  
  // Insight sobre tendencia de porciones
  if (patterns.confidenceLevel !== 'low') {
    if (patterns.preferredPortionTrend === 'tends_smaller') {
      insights.push({
        title: 'Patrón detectado',
        message: 'Tiendes a preferir porciones más pequeñas. Hemos ajustado las recomendaciones.',
        type: 'info',
        icon: '📊'
      });
    } else if (patterns.preferredPortionTrend === 'tends_larger') {
      insights.push({
        title: 'Patrón detectado',
        message: 'Tiendes a preferir porciones más grandes. Hemos ajustado las recomendaciones.',
        type: 'info',
        icon: '📊'
      });
    }
  }
  
  // Insight sobre comidas favoritas
  if (patterns.mostAcceptedMeals.length > 0 && patterns.confidenceLevel === 'high') {
    insights.push({
      title: 'Favoritos identificados',
      message: `Hemos identificado ${patterns.mostAcceptedMeals.length} comidas que siempre aceptas. Las priorizaremos en tus recomendaciones.`,
      type: 'achievement',
      icon: '⭐'
    });
  }
  
  // Insight sobre adaptaciones totales
  if (patterns.totalAdaptations >= 50) {
    insights.push({
      title: '¡Gran progreso!',
      message: `Has registrado ${patterns.totalAdaptations} comidas. Nuestro sistema ahora te conoce muy bien.`,
      type: 'achievement',
      icon: '🎉'
    });
  }
  
  // Tip sobre consistencia
  if (patterns.confidenceLevel === 'low') {
    insights.push({
      title: 'Tip de uso',
      message: 'Registra más comidas para que podamos personalizar mejor tus recomendaciones.',
      type: 'tip',
      icon: '💡'
    });
  }
  
  return insights;
}

/**
 * Predice la probabilidad de que el usuario acepte una comida específica
 */
export function predictAcceptanceProbability(
  user: User,
  mealId: string,
  portionMultiplier: number
): number {
  const history = user.adaptationHistory || [];
  
  if (history.length === 0) {
    return 0.7; // 70% base cuando no hay historial
  }
  
  // Filtrar registros de esta comida específica
  const mealHistory = history.filter(r => r.mealId === mealId);
  
  if (mealHistory.length === 0) {
    // No hay historial de esta comida, usar patrones generales
    const patterns = analyzeUserPatterns(user);
    
    // Determinar tamaño de porción
    const portionSize = 
      portionMultiplier < 0.8 ? 'small' :
      portionMultiplier > 1.2 ? 'large' :
      'normal';
    
    return patterns.acceptanceRateByPortion[portionSize] / 100 || 0.7;
  }
  
  // Hay historial de esta comida
  const acceptanceRate = mealHistory.filter(r => r.wasAccepted).length / mealHistory.length;
  
  // Ajustar según similitud de porción
  const avgHistoricalPortion = average(mealHistory.map(r => r.portionMultiplier));
  const portionSimilarity = 1 - Math.min(1, Math.abs(portionMultiplier - avgHistoricalPortion) / 0.5);
  
  // Combinar tasa de aceptación con similitud de porción
  return (acceptanceRate * 0.7) + (portionSimilarity * 0.3);
}

// Utilidad para calcular promedio
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Obtiene estadísticas visuales para mostrar en la UI
 */
export function getUserStats(user: User): {
  totalMealsLogged: number;
  averageAcceptanceRate: number;
  favoriteTimeOfDay: MealType | null;
  learningProgress: number; // 0-100
  topMeals: Array<{ id: string; name: string; acceptanceRate: number }>;
} {
  const history = user.adaptationHistory || [];
  
  if (history.length === 0) {
    return {
      totalMealsLogged: 0,
      averageAcceptanceRate: 0,
      favoriteTimeOfDay: null,
      learningProgress: 0,
      topMeals: []
    };
  }
  
  const patterns = analyzeUserPatterns(user);
  
  // Calcular tasa de aceptación promedio
  const acceptedCount = history.filter(r => r.wasAccepted).length;
  const averageAcceptanceRate = (acceptedCount / history.length) * 100;
  
  // Identificar momento favorito del día
  const mealTypeCount: Record<MealType, number> = {
    breakfast: 0,
    lunch: 0,
    snack: 0,
    dinner: 0
  };
  
  history.forEach(r => {
    if (r.wasAccepted) {
      mealTypeCount[r.mealType]++;
    }
  });
  
  const favoriteTimeOfDay = Object.entries(mealTypeCount).sort((a, b) => b[1] - a[1])[0][0] as MealType;
  
  // Progreso de aprendizaje (basado en cantidad de datos)
  const learningProgress = Math.min(100, (history.length / 50) * 100);
  
  // Top 5 comidas
  const mealAcceptance = new Map<string, { name: string; accepted: number; total: number }>();
  history.forEach(record => {
    const current = mealAcceptance.get(record.mealId) || { name: record.mealName, accepted: 0, total: 0 };
    current.total++;
    if (record.wasAccepted) current.accepted++;
    mealAcceptance.set(record.mealId, current);
  });
  
  const topMeals = Array.from(mealAcceptance.entries())
    .filter(([_, stats]) => stats.total >= 2)
    .map(([id, stats]) => ({
      id,
      name: stats.name,
      acceptanceRate: (stats.accepted / stats.total) * 100
    }))
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
    .slice(0, 5);
  
  return {
    totalMealsLogged: history.length,
    averageAcceptanceRate,
    favoriteTimeOfDay,
    learningProgress,
    topMeals
  };
}
