/**
 * 🎯 AUTOMATIC TARGET CALCULATOR - VERSIÓN SIMPLIFICADA
 * 
 * Calcula automáticamente cuánto debería comer el usuario en cada comida.
 * 
 * LÓGICA SIMPLIFICADA Y COHERENTE:
 * 1. Si es la ÚLTIMA comida → TODO lo que falta (cierre perfecto al 100%)
 * 2. Para TODAS las demás comidas → Usar distribución personalizada LIMITADA por remaining
 * 
 * Esto garantiza que el usuario siempre vea los targets configurados en su distribución,
 * y solo la última comida se ajusta para cerrar perfectamente al 100%.
 */

import { User, DailyLog, MealType } from '../types';
import { getMealGoals } from './mealDistribution';

/**
 * Cuenta cuántas comidas faltan por hacer (incluyendo la actual)
 * IMPORTANTE: SIEMPRE incluye la comida actual, incluso si ya tiene datos
 * (porque el usuario puede estar editándola/reemplazándola)
 */
function countRemainingMeals(currentLog: DailyLog, currentMealType: MealType): number {
  const mealOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const currentIndex = mealOrder.indexOf(currentMealType);
  
  // SIEMPRE cuenta la comida actual (count = 1)
  let count = 1;
  
  // Luego contar las comidas DESPUÉS de la actual que no tienen datos
  for (let i = currentIndex + 1; i < mealOrder.length; i++) {
    if (!currentLog[mealOrder[i]]) {
      count++;
    }
  }
  
  console.log(`📊 countRemainingMeals(${currentMealType}):`, {
    currentIndex,
    totalMealsInDay: mealOrder.length,
    mealsAfterCurrent: mealOrder.length - currentIndex - 1,
    mealsWithoutData: count - 1,
    totalRemaining: count,
    isLastMeal: count === 1
  });
  
  return count;
}

/**
 * Calcula macros ya consumidos en comidas anteriores (NO incluye la comida actual)
 */
function calculateConsumed(currentLog: DailyLog, currentMealType: MealType) {
  const consumed = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  const mealOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  
  // Solo sumar comidas anteriores a la actual
  for (const mealType of mealOrder) {
    // Si llegamos a la comida actual, parar
    if (mealType === currentMealType) {
      break;
    }
    
    const meal = currentLog[mealType];
    if (meal) {
      consumed.calories += (typeof meal.calories === 'number' && !isNaN(meal.calories)) ? meal.calories : 0;
      consumed.protein += (typeof meal.protein === 'number' && !isNaN(meal.protein)) ? meal.protein : 0;
      consumed.carbs += (typeof meal.carbs === 'number' && !isNaN(meal.carbs)) ? meal.carbs : 0;
      consumed.fat += (typeof meal.fat === 'number' && !isNaN(meal.fat)) ? meal.fat : 0;
    }
  }

  return consumed;
}

/**
 * Calcula macros restantes del día
 */
function calculateRemaining(user: User, consumed: ReturnType<typeof calculateConsumed>) {
  return {
    calories: Math.max(0, (user.goals?.calories || 0) - consumed.calories),
    protein: Math.max(0, (user.goals?.protein || 0) - consumed.protein),
    carbs: Math.max(0, (user.goals?.carbs || 0) - consumed.carbs),
    fat: Math.max(0, (user.goals?.fat || 0) - consumed.fat)
  };
}

/**
 * 🧠 FUNCIÓN PRINCIPAL: Calcula automáticamente el target óptimo para la comida actual
 * 
 * LÓGICA SIMPLIFICADA Y COHERENTE:
 * 1. Si es la ÚLTIMA comida → TODO lo que falta (cierre perfecto al 100%)
 * 2. Para TODAS las demás comidas → Usar distribución personalizada LIMITADA por remaining
 * 
 * Esto garantiza que el usuario siempre vea los targets configurados en su distribución,
 * y solo la última comida se ajusta para cerrar perfectamente al 100%.
 */
export function calculateIntelligentTarget(
  user: User,
  currentLog: DailyLog,
  mealType: MealType
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isLastMeal: boolean;
  mealsLeft: number;
} {
  // 1. Calcular estado actual
  const consumed = calculateConsumed(currentLog, mealType);
  const remaining = calculateRemaining(user, consumed);
  const mealsLeft = countRemainingMeals(currentLog, mealType);
  
  console.log('🎯 AutoTarget Calculator:', {
    mealType,
    goals: user.goals,
    consumed,
    remaining,
    mealsLeft,
    hasCustomDistribution: !!user.mealDistribution
  });
  
  console.log('┌────────────────────────────────────────────┐');
  console.log('│  🎯 CÁLCULO DE TARGET AUTOMÁTICO           │');
  console.log('├────────────────────────────────────────────┤');
  console.log(`│  Comida: ${mealType.toUpperCase().padEnd(30)} │`);
  console.log(`│  Comidas restantes: ${mealsLeft}                    │`);
  console.log('├────────────────────────────────────────────┤');
  console.log('│  OBJETIVOS TOTALES DEL DÍA:                │');
  console.log(`│  • Calorías:    ${user.goals.calories} kcal`.padEnd(45) + '│');
  console.log(`│  • Proteína:    ${user.goals.protein}g`.padEnd(45) + '│');
  console.log(`│  • Carbos:      ${user.goals.carbs}g`.padEnd(45) + '│');
  console.log(`│  • Grasas:      ${user.goals.fat}g`.padEnd(45) + '│');
  console.log('├────────────────────────────────────────────┤');
  console.log('│  YA CONSUMIDO (comidas anteriores):        │');
  console.log(`│  • Calorías:    ${consumed.calories} kcal`.padEnd(45) + '│');
  console.log(`│  • Proteína:    ${consumed.protein}g`.padEnd(45) + '│');
  console.log(`│  • Carbos:      ${consumed.carbs}g`.padEnd(45) + '│');
  console.log(`│  • Grasas:      ${consumed.fat}g`.padEnd(45) + '│');
  console.log('├────────────────────────────────────────────┤');
  console.log('│  RESTANTE:                                 │');
  console.log(`│  • Calorías:    ${remaining.calories} kcal`.padEnd(45) + '│');
  console.log(`│  • Proteína:    ${remaining.protein}g`.padEnd(45) + '│');
  console.log(`│  • Carbos:      ${remaining.carbs}g`.padEnd(45) + '│');
  console.log(`│  • Grasas:      ${remaining.fat}g`.padEnd(45) + '│');
  console.log('└────────────────────────────────────────────┘');
  
  // 2. Si NO quedan comidas (error), devolver 0
  if (mealsLeft === 0) {
    console.warn('⚠️ No quedan comidas por hacer');
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      isLastMeal: false,
      mealsLeft: 0
    };
  }
  
  // 3. Si es la ÚLTIMA comida → Cubrir EXACTAMENTE lo que falta (cierre perfecto)
  if (mealsLeft === 1) {
    console.log('┌────────────────────────────────────────────┐');
    console.log('│  🌙 ÚLTIMA COMIDA DEL DÍA DETECTADA        │');
    console.log('├────────────────────────────────────────────┤');
    console.log('│  Target = TODO lo que falta (100% exacto)  │');
    console.log('├────────────────────────────────────────────┤');
    console.log(`│  Calorías:  ${remaining.calories} kcal (restante)`.padEnd(45) + '│');
    console.log(`│  Proteína:  ${remaining.protein}g (restante)`.padEnd(45) + '│');
    console.log(`│  Carbos:    ${remaining.carbs}g (restante)`.padEnd(45) + '│');
    console.log(`│  Grasas:    ${remaining.fat}g (restante)`.padEnd(45) + '│');
    console.log('└────────────────────────────────────────────┘');
    
    return {
      calories: Math.round(remaining.calories),
      protein: Math.round(remaining.protein),
      carbs: Math.round(remaining.carbs),
      fat: Math.round(remaining.fat),
      isLastMeal: true,
      mealsLeft: 1
    };
  }
  
  // 4. Para TODAS las demás comidas → Usar distribución personalizada LIMITADA por remaining
  console.log('🎯 Usando getMealGoals() - Respetando distribución personalizada del usuario');
  const mealGoals = getMealGoals(user, mealType);
  console.log('📊 Target basado en distribución:', mealGoals);
  console.log('📊 Macros restantes disponibles:', remaining);
  console.log('📊 Comparación:');
  console.log(`   - Calorías: target=${mealGoals.calories} vs remaining=${remaining.calories}`);
  console.log(`   - Proteína: target=${mealGoals.protein} vs remaining=${remaining.protein}`);
  console.log(`   - Carbos: target=${mealGoals.carbs} vs remaining=${remaining.carbs}`);
  console.log(`   - Grasas: target=${mealGoals.fat} vs remaining=${remaining.fat}`);
  
  // ⭐ NUEVO: Limitar el target a los macros restantes disponibles
  // Esto garantiza que NUNCA nos pasemos de los objetivos totales
  const limitedTarget = {
    calories: Math.min(mealGoals.calories, remaining.calories),
    protein: Math.min(mealGoals.protein, remaining.protein),
    carbs: Math.min(mealGoals.carbs, remaining.carbs),
    fat: Math.min(mealGoals.fat, remaining.fat)
  };
  
  // Verificar si tuvimos que limitar algún macro
  const wasLimited = 
    limitedTarget.calories < mealGoals.calories ||
    limitedTarget.protein < mealGoals.protein ||
    limitedTarget.carbs < mealGoals.carbs ||
    limitedTarget.fat < mealGoals.fat;
  
  if (wasLimited) {
    console.log('⚠️ TARGET LIMITADO - Ajustado para no exceder macros restantes:');
    console.log('   Original:', mealGoals);
    console.log('   Limitado:', limitedTarget);
    console.log('   Restante:', remaining);
  } else {
    console.log('✅ Target dentro de límites - No se necesita ajuste');
  }
  
  return {
    calories: limitedTarget.calories,
    protein: limitedTarget.protein,
    carbs: limitedTarget.carbs,
    fat: limitedTarget.fat,
    isLastMeal: false,
    mealsLeft
  };
}

/**
 * 📊 FUNCIÓN AUXILIAR: Obtiene un mensaje descriptivo del target calculado
 */
export function getTargetDescription(
  target: ReturnType<typeof calculateIntelligentTarget>,
  mealType: MealType
): string {
  if (target.isLastMeal) {
    return `Esta es tu última comida del día. Consume ${Math.round(target.calories)} kcal para completar exactamente tus objetivos.`;
  }
  
  const mealLabels = {
    breakfast: 'desayuno',
    lunch: 'comida',
    snack: 'merienda',
    dinner: 'cena'
  };
  
  return `Target para tu ${mealLabels[mealType]}: ${Math.round(target.calories)} kcal. Quedan ${target.mealsLeft} comidas por hacer.`;
}