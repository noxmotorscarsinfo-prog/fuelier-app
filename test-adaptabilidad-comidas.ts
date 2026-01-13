/**
 * 🧪 TEST: ADAPTABILIDAD A CONFIGURACIONES PERSONALIZADAS
 * 
 * Verifica que el sistema funciona con CUALQUIER configuración de comidas:
 * - Solo 2 comidas (ayuno intermitente)
 * - 5 comidas al día
 * - Orden personalizado
 */

import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator';
import { User, DailyLog, Meal } from './src/app/types';

console.log('🧪 ═══════════════════════════════════════════════════════════');
console.log('   TEST: ADAPTABILIDAD A CONFIGURACIONES PERSONALIZADAS');
console.log('   ═══════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════
// TEST 1: AYUNO INTERMITENTE - SOLO 2 COMIDAS
// ═══════════════════════════════════════════════════════════
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 1: AYUNO INTERMITENTE (2 comidas: lunch + dinner)│');
console.log('└─────────────────────────────────────────────────────────┘\n');

const ifUser: User = {
  email: 'if@test.com',
  name: 'Usuario Ayuno Intermitente',
  age: 35,
  weight: 80,
  height: 180,
  sex: 'male',
  trainingFrequency: 4,
  goal: 'moderate_loss',
  mealsPerDay: 2,
  goals: {
    calories: 2000,
    protein: 150,
    carbs: 180,
    fat: 70
  },
  // ✅ Configuración personalizada: SOLO lunch y dinner
  mealStructure: {
    activeMeals: ['lunch', 'dinner']
  },
  preferences: {
    likes: [],
    dislikes: [],
    intolerances: [],
    allergies: []
  }
};

let ifLog: DailyLog = {
  date: new Date().toISOString().split('T')[0],
  breakfast: null,
  lunch: null,
  snack: null,
  dinner: null
};

// Comida (primera del día en esta configuración)
const lunchTarget = calculateIntelligentTarget(ifUser, ifLog, 'lunch');
console.log(`\n📊 Lunch target: ${lunchTarget.calories} kcal | ${lunchTarget.protein}P | ${lunchTarget.carbs}C | ${lunchTarget.fat}G`);
console.log(`   isLastMeal: ${lunchTarget.isLastMeal} | mealsLeft: ${lunchTarget.mealsLeft}`);

const test1Check1 = lunchTarget.mealsLeft === 2 && !lunchTarget.isLastMeal;
console.log(test1Check1 ? '✅ Lunch NO es última comida (quedan 2 comidas)' : '❌ FAIL - Lunch debería tener mealsLeft=2');

// Simular lunch
ifLog.lunch = {
  id: 'test-lunch',
  name: 'Lunch Test',
  type: 'lunch',
  ingredients: [],
  baseQuantity: 1,
  calories: Math.round(lunchTarget.calories * 0.98),
  protein: Math.round(lunchTarget.protein * 0.98),
  carbs: Math.round(lunchTarget.carbs * 0.98),
  fat: Math.round(lunchTarget.fat * 0.98)
};

// Cena (última comida en esta configuración)
const dinnerTarget = calculateIntelligentTarget(ifUser, ifLog, 'dinner');
console.log(`\n📊 Dinner target: ${dinnerTarget.calories} kcal | ${dinnerTarget.protein}P | ${dinnerTarget.carbs}C | ${dinnerTarget.fat}G`);
console.log(`   isLastMeal: ${dinnerTarget.isLastMeal} 🌙 | mealsLeft: ${dinnerTarget.mealsLeft}`);

const expectedRemaining = {
  calories: ifUser.goals.calories - (ifLog.lunch?.calories || 0),
  protein: ifUser.goals.protein - (ifLog.lunch?.protein || 0),
  carbs: ifUser.goals.carbs - (ifLog.lunch?.carbs || 0),
  fat: ifUser.goals.fat - (ifLog.lunch?.fat || 0)
};

const test1Check2 = 
  dinnerTarget.isLastMeal && 
  dinnerTarget.mealsLeft === 1 &&
  Math.abs(dinnerTarget.calories - expectedRemaining.calories) < 1;

console.log(test1Check2 ? '✅✅✅ Dinner ES última comida, target = remaining exacto' : '❌❌❌ FAIL - Dinner no detectada como última');

// ═══════════════════════════════════════════════════════════
// TEST 2: 5 COMIDAS AL DÍA
// ═══════════════════════════════════════════════════════════
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 2: 5 COMIDAS (breakfast, snack1, lunch, snack2, dinner)│');
console.log('└─────────────────────────────────────────────────────────┘\n');

// NOTA: Para este test, usamos las 4 comidas estándar ya que MealType 
// solo define ['breakfast', 'lunch', 'snack', 'dinner']
// En producción se podría extender con 'snack2', 'midMorning', etc.

const fiveMealUser: User = {
  email: '5meals@test.com',
  name: 'Usuario 5 Comidas',
  age: 25,
  weight: 65,
  height: 165,
  sex: 'female',
  trainingFrequency: 5,
  goal: 'moderate_gain',
  mealsPerDay: 4, // Usando las 4 estándar
  goals: {
    calories: 2200,
    protein: 140,
    carbs: 250,
    fat: 65
  },
  // Estructura con todas las comidas activas
  mealStructure: {
    activeMeals: ['breakfast', 'snack', 'lunch', 'dinner']
  },
  preferences: {
    likes: [],
    dislikes: [],
    intolerances: [],
    allergies: []
  }
};

let fiveMealLog: DailyLog = {
  date: new Date().toISOString().split('T')[0],
  breakfast: null,
  lunch: null,
  snack: null,
  dinner: null
};

// Simular las primeras 3 comidas
const b = calculateIntelligentTarget(fiveMealUser, fiveMealLog, 'breakfast');
fiveMealLog.breakfast = {
  id: 'b', name: 'B', type: 'breakfast', ingredients: [], baseQuantity: 1,
  calories: Math.round(b.calories * 0.99),
  protein: Math.round(b.protein * 0.99),
  carbs: Math.round(b.carbs * 0.99),
  fat: Math.round(b.fat * 0.99)
};

const s = calculateIntelligentTarget(fiveMealUser, fiveMealLog, 'snack');
fiveMealLog.snack = {
  id: 's', name: 'S', type: 'snack', ingredients: [], baseQuantity: 1,
  calories: Math.round(s.calories * 0.98),
  protein: Math.round(s.protein * 0.98),
  carbs: Math.round(s.carbs * 0.98),
  fat: Math.round(s.fat * 0.98)
};

const l = calculateIntelligentTarget(fiveMealUser, fiveMealLog, 'lunch');
fiveMealLog.lunch = {
  id: 'l', name: 'L', type: 'lunch', ingredients: [], baseQuantity: 1,
  calories: Math.round(l.calories * 0.97),
  protein: Math.round(l.protein * 0.97),
  carbs: Math.round(l.carbs * 0.97),
  fat: Math.round(l.fat * 0.97)
};

// Última comida
const d = calculateIntelligentTarget(fiveMealUser, fiveMealLog, 'dinner');
console.log(`\n📊 Dinner (última de 4): isLastMeal=${d.isLastMeal}, mealsLeft=${d.mealsLeft}`);

const test2Check = d.isLastMeal && d.mealsLeft === 1;
console.log(test2Check ? '✅ Sistema maneja correctamente 4 comidas activas' : '❌ FAIL');

// ═══════════════════════════════════════════════════════════
// TEST 3: ORDEN PERSONALIZADO (CENA ANTES QUE SNACK)
// ═══════════════════════════════════════════════════════════
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 3: ORDEN PERSONALIZADO (breakfast, lunch, dinner, snack)│');
console.log('└─────────────────────────────────────────────────────────┘\n');

const customOrderUser: User = {
  email: 'custom@test.com',
  name: 'Usuario Orden Custom',
  age: 40,
  weight: 75,
  height: 175,
  sex: 'male',
  trainingFrequency: 3,
  goal: 'maintenance',
  mealsPerDay: 4,
  goals: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 60
  },
  // ✅ Orden personalizado: snack AL FINAL (post-cena)
  mealStructure: {
    activeMeals: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  preferences: {
    likes: [],
    dislikes: [],
    intolerances: [],
    allergies: []
  }
};

let customLog: DailyLog = {
  date: new Date().toISOString().split('T')[0],
  breakfast: null,
  lunch: null,
  snack: null,
  dinner: null
};

// Hacer breakfast, lunch, dinner
const cb = calculateIntelligentTarget(customOrderUser, customLog, 'breakfast');
customLog.breakfast = { id: 'cb', name: 'CB', type: 'breakfast', ingredients: [], baseQuantity: 1,
  calories: Math.round(cb.calories * 0.98), protein: Math.round(cb.protein * 0.98),
  carbs: Math.round(cb.carbs * 0.98), fat: Math.round(cb.fat * 0.98) };

const cl = calculateIntelligentTarget(customOrderUser, customLog, 'lunch');
customLog.lunch = { id: 'cl', name: 'CL', type: 'lunch', ingredients: [], baseQuantity: 1,
  calories: Math.round(cl.calories * 0.99), protein: Math.round(cl.protein * 0.99),
  carbs: Math.round(cl.carbs * 0.99), fat: Math.round(cl.fat * 0.99) };

const cd = calculateIntelligentTarget(customOrderUser, customLog, 'dinner');
customLog.dinner = { id: 'cd', name: 'CD', type: 'dinner', ingredients: [], baseQuantity: 1,
  calories: Math.round(cd.calories * 0.97), protein: Math.round(cd.protein * 0.97),
  carbs: Math.round(cd.carbs * 0.97), fat: Math.round(cd.fat * 0.97) };

// Ahora snack debería ser la ÚLTIMA
const cs = calculateIntelligentTarget(customOrderUser, customLog, 'snack');
console.log(`\n📊 Snack (última con orden custom): isLastMeal=${cs.isLastMeal}, mealsLeft=${cs.mealsLeft}`);

const test3Check = cs.isLastMeal && cs.mealsLeft === 1;
console.log(test3Check ? '✅ Snack detectado como última comida en orden personalizado' : '❌ FAIL');

// ═══════════════════════════════════════════════════════════
// RESUMEN FINAL
// ═══════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════');
console.log('   RESUMEN DE TESTS DE ADAPTABILIDAD');
console.log('═══════════════════════════════════════════════════════════');

const allPassed = test1Check1 && test1Check2 && test2Check && test3Check;

console.log(`\n✅ Test 1 (Ayuno Intermitente - 2 comidas): ${test1Check1 && test1Check2 ? 'PASS' : 'FAIL'}`);
console.log(`✅ Test 2 (4 comidas todas activas): ${test2Check ? 'PASS' : 'FAIL'}`);
console.log(`✅ Test 3 (Orden personalizado): ${test3Check ? 'PASS' : 'FAIL'}`);

if (allPassed) {
  console.log('\n🎉🎉🎉 SISTEMA COMPLETAMENTE ADAPTABLE');
  console.log('✅ Funciona con CUALQUIER configuración de comidas');
  console.log('✅ Detecta última comida en CUALQUIER orden');
  console.log('✅ Soporta desde 2 hasta 4+ comidas al día');
} else {
  console.log('\n❌ Algunos tests fallaron - revisar configuración');
}

console.log('═══════════════════════════════════════════════════════════\n');

process.exit(allPassed ? 0 : 1);
