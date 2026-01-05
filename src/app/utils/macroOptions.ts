import { MacroGoals } from '../types';
import { calculateBMR, calculateTDEE } from './macroCalculations';

/**
 * Opción de calorías y macros con información detallada
 */
export interface MacroOption {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  deficit: number; // kcal de déficit respecto a TDEE (0 = mantenimiento)
  weeklyFatLoss: number; // kg de grasa estimada por semana
  recommendation: string; // Recomendación de uso
  level: 'maintenance' | 'light' | 'moderate-low' | 'moderate-high' | 'aggressive';
}

/**
 * Genera 5 opciones automáticas de calorías y macros basadas en fisiología real
 */
export const generateMacroOptions = (
  sex: 'male' | 'female',
  weight: number, // kg
  height: number, // cm
  age: number,
  trainingFrequency: number // 0-7 días de entrenamiento por semana
): MacroOption[] => {
  // 1. Calcular TMB (Tasa Metabólica Basal) con Mifflin-St Jeor
  const bmr = calculateBMR(sex, weight, height, age);
  
  // 2. Calcular TDEE (Gasto Total Diario)
  const tdee = calculateTDEE(bmr, trainingFrequency);
  
  // Límites mínimos de seguridad
  const minCalories = sex === 'male' ? 1500 : 1200;
  
  // 3. Generar 5 opciones de calorías y déficit
  const options: MacroOption[] = [];
  
  // Opción 1: Mantenimiento realista
  const maintenanceCalories = Math.round(tdee);
  options.push(
    createMacroOption(
      'maintenance',
      '🎯 Mantenimiento',
      'Mantén tu peso actual',
      maintenanceCalories,
      weight,
      0,
      'Ideal para mantener tu composición corporal actual mientras entrenas. Usa esto si estás contento con tu peso y quieres enfocarte en rendimiento.'
    )
  );
  
  // Opción 2: Déficit ligero (-200 kcal)
  const lightDeficitCalories = Math.max(minCalories, Math.round(tdee - 200));
  options.push(
    createMacroOption(
      'light',
      '🌱 Déficit Ligero',
      'Pérdida sostenible a largo plazo',
      lightDeficitCalories,
      weight,
      tdee - lightDeficitCalories,
      'Perfecto si estás cerca de tu objetivo o quieres perder grasa muy lentamente sin afectar rendimiento. Alta adherencia a largo plazo.'
    )
  );
  
  // Opción 3: Déficit moderado bajo (-350 kcal)
  const moderateLowDeficitCalories = Math.max(minCalories, Math.round(tdee - 350));
  options.push(
    createMacroOption(
      'moderate-low',
      '🔥 Déficit Moderado (Bajo)',
      'Balance entre pérdida y energía',
      moderateLowDeficitCalories,
      weight,
      tdee - moderateLowDeficitCalories,
      'Opción equilibrada para la mayoría. Pérdida constante sin afectar mucho tu energía diaria ni tu entrenamiento.'
    )
  );
  
  // Opción 4: Déficit moderado alto (-500 kcal)
  const moderateHighDeficitCalories = Math.max(minCalories, Math.round(tdee - 500));
  options.push(
    createMacroOption(
      'moderate-high',
      '⚡ Déficit Moderado (Alto)',
      'Pérdida acelerada pero sostenible',
      moderateHighDeficitCalories,
      weight,
      tdee - moderateHighDeficitCalories,
      'Para quienes quieren resultados más rápidos y están dispuestos a tener menos energía. Requiere buena adherencia.'
    )
  );
  
  // Opción 5: Déficit agresivo seguro (-700 kcal)
  const aggressiveDeficitCalories = Math.max(minCalories, Math.round(tdee - 700));
  options.push(
    createMacroOption(
      'aggressive',
      '💪 Déficit Agresivo',
      'Máxima pérdida de grasa segura',
      aggressiveDeficitCalories,
      weight,
      tdee - aggressiveDeficitCalories,
      'Solo para fases cortas (4-8 semanas) o si tienes mucho peso que perder. Puede afectar energía y recuperación. Monitoriza tu progreso semanalmente.'
    )
  );
  
  // Alerta de seguridad
  const hasUnsafeDeficit = options.some(opt => opt.calories === minCalories && opt.deficit > 0);
  if (hasUnsafeDeficit) {
    console.warn('⚠️ ALERTA: Algunas opciones están limitadas al mínimo de seguridad. TDEE puede ser muy bajo o déficits muy agresivos.');
  }
  
  return options;
};

/**
 * Crea una opción de macros con cálculos automáticos
 */
const createMacroOption = (
  level: MacroOption['level'],
  name: string,
  description: string,
  calories: number,
  weight: number,
  deficit: number,
  recommendation: string
): MacroOption => {
  // 4. Calcular macros
  
  // Proteínas: 1.8-2 g/kg de peso (usar 2g/kg para preservar músculo)
  const protein = Math.round(weight * 2);
  
  // Grasas: 25-30% de calorías totales (usar 27.5% como promedio)
  const fatCalories = calories * 0.275;
  const fat = Math.round(fatCalories / 9); // 9 kcal por gramo de grasa
  
  // Carbohidratos: resto de calorías
  const proteinCalories = protein * 4; // 4 kcal por gramo de proteína
  const actualFatCalories = fat * 9;
  const carbCalories = calories - proteinCalories - actualFatCalories;
  const carbs = Math.round(Math.max(0, carbCalories / 4)); // 4 kcal por gramo de carbohidratos
  
  // Pérdida estimada de grasa por semana
  // 1kg de grasa = ~7700 kcal
  // Déficit semanal = déficit diario × 7
  const weeklyDeficit = deficit * 7;
  const weeklyFatLoss = deficit > 0 ? Number((weeklyDeficit / 7700).toFixed(2)) : 0;
  
  return {
    id: level,
    name,
    description,
    calories,
    protein,
    carbs,
    fat,
    deficit,
    weeklyFatLoss,
    recommendation,
    level
  };
};

/**
 * Obtiene la opción recomendada según el objetivo del usuario
 */
export const getRecommendedOption = (
  options: MacroOption[],
  goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain'
): MacroOption => {
  const mapping: Record<string, MacroOption['level']> = {
    'rapid_loss': 'aggressive',
    'moderate_loss': 'moderate-high',
    'maintenance': 'maintenance',
    'moderate_gain': 'maintenance', // Para volumen necesitaríamos opciones de superávit
    'rapid_gain': 'maintenance'
  };
  
  const recommendedLevel = mapping[goal];
  return options.find(opt => opt.level === recommendedLevel) || options[0];
};

/**
 * Convierte una MacroOption a MacroGoals (para compatibilidad)
 */
export const macroOptionToGoals = (option: MacroOption): MacroGoals => {
  return {
    calories: option.calories,
    protein: option.protein,
    carbs: option.carbs,
    fat: option.fat
  };
};

/**
 * Formatea la pérdida estimada de grasa
 */
export const formatWeeklyFatLoss = (kg: number): string => {
  if (kg === 0) return 'Mantenimiento (0kg/semana)';
  if (kg < 0.25) return `~${kg}kg/semana (Muy lento)`;
  if (kg < 0.5) return `~${kg}kg/semana (Lento y sostenible)`;
  if (kg < 0.75) return `~${kg}kg/semana (Moderado)`;
  if (kg < 1) return `~${kg}kg/semana (Rápido)`;
  return `~${kg}kg/semana (Muy rápido - Solo corto plazo)`;
};

/**
 * Genera advertencias de seguridad si es necesario
 */
export const generateSafetyWarnings = (
  option: MacroOption,
  sex: 'male' | 'female',
  tdee: number
): string[] => {
  const warnings: string[] = [];
  
  const minCalories = sex === 'male' ? 1500 : 1200;
  
  // Advertencia si está en el límite mínimo
  if (option.calories === minCalories && option.deficit > 0) {
    warnings.push(`⚠️ Esta opción está en el límite mínimo de seguridad (${minCalories} kcal/día)`);
  }
  
  // Advertencia si el déficit es muy alto (>25% del TDEE)
  const deficitPercent = (option.deficit / tdee) * 100;
  if (deficitPercent > 25) {
    warnings.push(`⚠️ Déficit agresivo (${Math.round(deficitPercent)}% del TDEE). Solo recomendado por periodos cortos.`);
  }
  
  // Advertencia si la pérdida semanal es muy rápida
  if (option.weeklyFatLoss > 1) {
    warnings.push('⚠️ Pérdida muy rápida. Puede afectar tu masa muscular y metabolismo.');
  }
  
  return warnings;
};
