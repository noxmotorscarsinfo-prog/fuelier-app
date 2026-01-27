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
 * 
 * ✅ ADAPTABLE: Usa mealStructure si está definida, sino usa orden por defecto
 */
function countRemainingMeals(currentLog: DailyLog, currentMealType: MealType, user?: User): number {
  // ✅ NUEVO: Usar estructura personalizada si existe
  const defaultOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const mealOrder = user?.mealStructure?.activeMeals || defaultOrder;
  
  const currentIndex = mealOrder.indexOf(currentMealType);
  
  // Si la comida actual no está en el orden configurado, fallar graciosamente
  if (currentIndex === -1) {
    console.warn(`⚠️ Comida "${currentMealType}" no encontrada en mealOrder:`, mealOrder);
    return 1; // Asumir que es la última por seguridad
  }
  
  // SIEMPRE cuenta la comida actual (count = 1)
  let count = 1;
  
  // Luego contar las comidas DESPUÉS de la actual que no tienen datos
  for (let i = currentIndex + 1; i < mealOrder.length; i++) {
    if (!currentLog[mealOrder[i]]) {
      count++;
    }
  }
  
  console.log(`📊 countRemainingMeals(${currentMealType}):`, {
    usingCustomStructure: !!user?.mealStructure?.activeMeals,
    mealOrder,
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
 * ✅ ADAPTABLE: Usa mealStructure si está definida
 */
function calculateConsumed(currentLog: DailyLog, currentMealType: MealType, user?: User) {
  const consumed = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  // ✅ NUEVO: Usar estructura personalizada si existe
  const defaultOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const mealOrder = user?.mealStructure?.activeMeals || defaultOrder;
  
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
  // 1. Calcular estado actual (✅ Ahora adaptable a estructura personalizada)
  const consumed = calculateConsumed(currentLog, mealType, user);
  const remaining = calculateRemaining(user, consumed);
  const mealsLeft = countRemainingMeals(currentLog, mealType, user);
  
  console.log('🎯 AutoTarget Calculator:', {
    mealType,
    goals: user.goals,
    consumed,
    remaining,
    mealsLeft,
    hasCustomDistribution: !!user.mealDistribution,
    hasCustomMealStructure: !!user.mealStructure?.activeMeals
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
  
  // 4. Para TODAS las demás comidas → Usar COMPENSACIÓN PROGRESIVA INTELIGENTE
  console.log('🎯 Aplicando compensación progresiva inteligente...');
  
  // 4.1. Obtener target base de la distribución personalizada
  const mealGoals = getMealGoals(user, mealType);
  console.log('📊 Target basado en distribución:', mealGoals);
  console.log('📊 Macros restantes disponibles:', remaining);
  
  // 4.2. Calcular "déficit" o "exceso" de comidas anteriores
  // Si consumed > expected → hay exceso → compensar reduciendo
  // Si consumed < expected → hay déficit → compensar aumentando
  const defaultOrder: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const mealOrder = user.mealStructure?.activeMeals || defaultOrder;
  const currentIndex = mealOrder.indexOf(mealType);
  
  let expectedConsumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (let i = 0; i < currentIndex; i++) {
    const prevMeal = mealOrder[i];
    const prevGoals = getMealGoals(user, prevMeal);
    expectedConsumed.calories += prevGoals.calories;
    expectedConsumed.protein += prevGoals.protein;
    expectedConsumed.carbs += prevGoals.carbs;
    expectedConsumed.fat += prevGoals.fat;
  }
  
  const deviation = {
    calories: consumed.calories - expectedConsumed.calories,
    protein: consumed.protein - expectedConsumed.protein,
    carbs: consumed.carbs - expectedConsumed.carbs,
    fat: consumed.fat - expectedConsumed.fat
  };
  
  // 4.3. Aplicar compensación proporcional según número de comidas restantes
  // Si hay desviación, distribuirla entre las comidas que quedan
  const compensationFactor = 1.0 / mealsLeft; // Cada comida compensa su parte
  
  const compensatedTarget = {
    calories: Math.round(mealGoals.calories - (deviation.calories * compensationFactor)),
    protein: Math.round(mealGoals.protein - (deviation.protein * compensationFactor)),
    carbs: Math.round(mealGoals.carbs - (deviation.carbs * compensationFactor)),
    fat: Math.round(mealGoals.fat - (deviation.fat * compensationFactor))
  };
  
  console.log('📊 Compensación aplicada:');
  console.log(`   Expected consumido: ${expectedConsumed.calories}kcal | ${expectedConsumed.protein}P | ${expectedConsumed.carbs}C | ${expectedConsumed.fat}G`);
  console.log(`   Real consumido: ${consumed.calories}kcal | ${consumed.protein}P | ${consumed.carbs}C | ${consumed.fat}G`);
  console.log(`   Desviación: ${deviation.calories > 0 ? '+' : ''}${deviation.calories}kcal | ${deviation.protein > 0 ? '+' : ''}${deviation.protein}P | ${deviation.carbs > 0 ? '+' : ''}${deviation.carbs}C | ${deviation.fat > 0 ? '+' : ''}${deviation.fat}G`);
  console.log(`   Factor compensación: ${(compensationFactor * 100).toFixed(0)}% (${mealsLeft} comidas restantes)`);
  console.log(`   Target compensado: ${compensatedTarget.calories}kcal | ${compensatedTarget.protein}P | ${compensatedTarget.carbs}C | ${compensatedTarget.fat}G`);
  
  // 4.4. Limitar el target compensado a los macros restantes disponibles
  // Esto garantiza que NUNCA nos pasemos de los objetivos totales
  const finalTarget = {
    calories: Math.max(0, Math.min(compensatedTarget.calories, remaining.calories)),
    protein: Math.max(0, Math.min(compensatedTarget.protein, remaining.protein)),
    carbs: Math.max(0, Math.min(compensatedTarget.carbs, remaining.carbs)),
    fat: Math.max(0, Math.min(compensatedTarget.fat, remaining.fat))
  };
  
  // Verificar si tuvimos que limitar algún macro
  const wasLimited = 
    finalTarget.calories < compensatedTarget.calories ||
    finalTarget.protein < compensatedTarget.protein ||
    finalTarget.carbs < compensatedTarget.carbs ||
    finalTarget.fat < compensatedTarget.fat;
  
  if (wasLimited) {
    console.log('⚠️ TARGET LIMITADO - Ajustado para no exceder macros restantes:');
    console.log('   Compensado:', compensatedTarget);
    console.log('   Final:', finalTarget);
    console.log('   Restante:', remaining);
  } else {
    console.log('✅ Target final dentro de límites');
  }
  
  return {
    calories: finalTarget.calories,
    protein: finalTarget.protein,
    carbs: finalTarget.carbs,
    fat: finalTarget.fat,
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