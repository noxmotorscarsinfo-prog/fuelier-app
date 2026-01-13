/**
 * 🧪 TEST AUTOMATIZADO: ESCALADO 100% PERFECTO
 * 
 * Simula un día completo de usuario para verificar que:
 * 1. Cada plato se escala correctamente a su target
 * 2. La última comida se detecta como isLastMeal=true
 * 3. El total del día suma exactamente al 100% de objetivos
 */

import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator';
import { User, DailyLog, MealType, Meal } from './src/app/types';

// Usuario de prueba
const testUser: User = {
  email: 'test@fuelier.com',
  name: 'Usuario Prueba',
  age: 30,
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
  preferences: {
    likes: [],
    dislikes: [],
    intolerances: [],
    allergies: []
  }
};

console.log('🧪 ═══════════════════════════════════════════════════════════');
console.log('   TEST AUTOMATIZADO: ESCALADO 100% PERFECTO AL FINAL DEL DÍA');
console.log('   ═══════════════════════════════════════════════════════════');
console.log(`   Usuario: ${testUser.name}`);
console.log(`   Objetivos: ${testUser.goals.calories} kcal | ${testUser.goals.protein}P | ${testUser.goals.carbs}C | ${testUser.goals.fat}G`);
console.log('   ═══════════════════════════════════════════════════════════\n');

// Simular día vacío
let currentLog: DailyLog = {
  date: new Date().toISOString().split('T')[0],
  breakfast: null,
  lunch: null,
  snack: null,
  dinner: null
};

let totalConsumed = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
};

// ═══════════════════════════════════════════════════════════
// TEST 1: DESAYUNO (Primera comida del día)
// ═══════════════════════════════════════════════════════════
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 1: DESAYUNO (Primera comida)                     │');
console.log('└─────────────────────────────────────────────────────────┘');

const breakfastTarget = calculateIntelligentTarget(testUser, currentLog, 'breakfast');

console.log('\n📊 Target calculado para DESAYUNO:');
console.log(`   Calorías: ${breakfastTarget.calories} kcal`);
console.log(`   Proteína: ${breakfastTarget.protein}g`);
console.log(`   Carbos: ${breakfastTarget.carbs}g`);
console.log(`   Grasas: ${breakfastTarget.fat}g`);
console.log(`   isLastMeal: ${breakfastTarget.isLastMeal}`);
console.log(`   mealsLeft: ${breakfastTarget.mealsLeft}`);

// Verificación
const breakfastCheck = {
  isLastMeal: breakfastTarget.isLastMeal === false,
  mealsLeft: breakfastTarget.mealsLeft > 1,
  calories: breakfastTarget.calories > 0 && breakfastTarget.calories <= testUser.goals.calories
};

if (breakfastCheck.isLastMeal && breakfastCheck.mealsLeft && breakfastCheck.calories) {
  console.log('\n✅ DESAYUNO - PASS: No es última comida, target válido');
} else {
  console.log('\n❌ DESAYUNO - FAIL:');
  if (!breakfastCheck.isLastMeal) console.log('   - isLastMeal debería ser false');
  if (!breakfastCheck.mealsLeft) console.log('   - mealsLeft debería ser > 1');
  if (!breakfastCheck.calories) console.log('   - calorías fuera de rango');
}

// Simular que el usuario come el desayuno (98% del target por escalado imperfecto)
const breakfastActual: Meal = {
  id: 'test-breakfast',
  name: 'Desayuno Test',
  type: 'breakfast',
  ingredients: [],
  baseQuantity: 1,
  calories: Math.round(breakfastTarget.calories * 0.98),
  protein: Math.round(breakfastTarget.protein * 0.98),
  carbs: Math.round(breakfastTarget.carbs * 0.98),
  fat: Math.round(breakfastTarget.fat * 0.98)
};

currentLog.breakfast = breakfastActual;
totalConsumed.calories += breakfastActual.calories;
totalConsumed.protein += breakfastActual.protein;
totalConsumed.carbs += breakfastActual.carbs;
totalConsumed.fat += breakfastActual.fat;

console.log(`\n🍽️ Usuario come desayuno (simulado 98% del target):`);
console.log(`   Real: ${breakfastActual.calories} kcal | ${breakfastActual.protein}P | ${breakfastActual.carbs}C | ${breakfastActual.fat}G`);

// ═══════════════════════════════════════════════════════════
// TEST 2: COMIDA (Segunda comida del día)
// ═══════════════════════════════════════════════════════════
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 2: COMIDA (Segunda comida)                       │');
console.log('└─────────────────────────────────────────────────────────┘');

const lunchTarget = calculateIntelligentTarget(testUser, currentLog, 'lunch');

console.log('\n📊 Target calculado para COMIDA:');
console.log(`   Calorías: ${lunchTarget.calories} kcal`);
console.log(`   Proteína: ${lunchTarget.protein}g`);
console.log(`   Carbos: ${lunchTarget.carbs}g`);
console.log(`   Grasas: ${lunchTarget.fat}g`);
console.log(`   isLastMeal: ${lunchTarget.isLastMeal}`);
console.log(`   mealsLeft: ${lunchTarget.mealsLeft}`);

const lunchCheck = {
  isLastMeal: lunchTarget.isLastMeal === false,
  mealsLeft: lunchTarget.mealsLeft > 1,
  calories: lunchTarget.calories > 0
};

if (lunchCheck.isLastMeal && lunchCheck.mealsLeft && lunchCheck.calories) {
  console.log('\n✅ COMIDA - PASS: No es última comida, target válido');
} else {
  console.log('\n❌ COMIDA - FAIL');
}

// Simular comida (97% del target)
const lunchActual: Meal = {
  id: 'test-lunch',
  name: 'Comida Test',
  type: 'lunch',
  ingredients: [],
  baseQuantity: 1,
  calories: Math.round(lunchTarget.calories * 0.97),
  protein: Math.round(lunchTarget.protein * 0.97),
  carbs: Math.round(lunchTarget.carbs * 0.97),
  fat: Math.round(lunchTarget.fat * 0.97)
};

currentLog.lunch = lunchActual;
totalConsumed.calories += lunchActual.calories;
totalConsumed.protein += lunchActual.protein;
totalConsumed.carbs += lunchActual.carbs;
totalConsumed.fat += lunchActual.fat;

console.log(`\n🍽️ Usuario come comida (simulado 97% del target):`);
console.log(`   Real: ${lunchActual.calories} kcal | ${lunchActual.protein}P | ${lunchActual.carbs}C | ${lunchActual.fat}G`);

// ═══════════════════════════════════════════════════════════
// TEST 3: SNACK (Tercera comida del día)
// ═══════════════════════════════════════════════════════════
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 3: SNACK (Tercera comida)                        │');
console.log('└─────────────────────────────────────────────────────────┘');

const snackTarget = calculateIntelligentTarget(testUser, currentLog, 'snack');

console.log('\n📊 Target calculado para SNACK:');
console.log(`   Calorías: ${snackTarget.calories} kcal`);
console.log(`   Proteína: ${snackTarget.protein}g`);
console.log(`   Carbos: ${snackTarget.carbs}g`);
console.log(`   Grasas: ${snackTarget.fat}g`);
console.log(`   isLastMeal: ${snackTarget.isLastMeal}`);
console.log(`   mealsLeft: ${snackTarget.mealsLeft}`);

const snackCheck = {
  isLastMeal: snackTarget.isLastMeal === false,
  mealsLeft: snackTarget.mealsLeft > 1,
  calories: snackTarget.calories > 0
};

if (snackCheck.isLastMeal && snackCheck.mealsLeft && snackCheck.calories) {
  console.log('\n✅ SNACK - PASS: No es última comida, target válido');
} else {
  console.log('\n❌ SNACK - FAIL');
}

// Simular snack (99% del target)
const snackActual: Meal = {
  id: 'test-snack',
  name: 'Snack Test',
  type: 'snack',
  ingredients: [],
  baseQuantity: 1,
  calories: Math.round(snackTarget.calories * 0.99),
  protein: Math.round(snackTarget.protein * 0.99),
  carbs: Math.round(snackTarget.carbs * 0.99),
  fat: Math.round(snackTarget.fat * 0.99)
};

currentLog.snack = snackActual;
totalConsumed.calories += snackActual.calories;
totalConsumed.protein += snackActual.protein;
totalConsumed.carbs += snackActual.carbs;
totalConsumed.fat += snackActual.fat;

console.log(`\n🍽️ Usuario come snack (simulado 99% del target):`);
console.log(`   Real: ${snackActual.calories} kcal | ${snackActual.protein}P | ${snackActual.carbs}C | ${snackActual.fat}G`);

// ═══════════════════════════════════════════════════════════
// TEST 4: CENA (ÚLTIMA COMIDA DEL DÍA) ⭐⭐⭐
// ═══════════════════════════════════════════════════════════
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 4: CENA (🌙 ÚLTIMA COMIDA - CRÍTICO)             │');
console.log('└─────────────────────────────────────────────────────────┘');

const dinnerTarget = calculateIntelligentTarget(testUser, currentLog, 'dinner');

console.log('\n📊 Target calculado para CENA:');
console.log(`   Calorías: ${dinnerTarget.calories} kcal`);
console.log(`   Proteína: ${dinnerTarget.protein}g`);
console.log(`   Carbos: ${dinnerTarget.carbs}g`);
console.log(`   Grasas: ${dinnerTarget.fat}g`);
console.log(`   isLastMeal: ${dinnerTarget.isLastMeal} 🌙`);
console.log(`   mealsLeft: ${dinnerTarget.mealsLeft}`);

// Calcular remaining manual para verificar
const expectedRemaining = {
  calories: testUser.goals.calories - totalConsumed.calories,
  protein: testUser.goals.protein - totalConsumed.protein,
  carbs: testUser.goals.carbs - totalConsumed.carbs,
  fat: testUser.goals.fat - totalConsumed.fat
};

console.log('\n🔍 Verificación: Macros restantes calculados manualmente:');
console.log(`   Expected: ${expectedRemaining.calories} kcal | ${expectedRemaining.protein}P | ${expectedRemaining.carbs}C | ${expectedRemaining.fat}G`);
console.log(`   Target:   ${dinnerTarget.calories} kcal | ${dinnerTarget.protein}P | ${dinnerTarget.carbs}C | ${dinnerTarget.fat}G`);

// VERIFICACIONES CRÍTICAS
const dinnerChecks = {
  isLastMeal: dinnerTarget.isLastMeal === true,
  mealsLeft: dinnerTarget.mealsLeft === 1,
  caloriesMatch: Math.abs(dinnerTarget.calories - expectedRemaining.calories) < 1,
  proteinMatch: Math.abs(dinnerTarget.protein - expectedRemaining.protein) < 1,
  carbsMatch: Math.abs(dinnerTarget.carbs - expectedRemaining.carbs) < 1,
  fatMatch: Math.abs(dinnerTarget.fat - expectedRemaining.fat) < 1
};

console.log('\n🧪 Verificaciones críticas para CENA:');
console.log(`   ✓ isLastMeal = true: ${dinnerChecks.isLastMeal ? '✅' : '❌ FAIL'}`);
console.log(`   ✓ mealsLeft = 1: ${dinnerChecks.mealsLeft ? '✅' : '❌ FAIL'}`);
console.log(`   ✓ Calorías = remaining: ${dinnerChecks.caloriesMatch ? '✅' : '❌ FAIL'}`);
console.log(`   ✓ Proteína = remaining: ${dinnerChecks.proteinMatch ? '✅' : '❌ FAIL'}`);
console.log(`   ✓ Carbos = remaining: ${dinnerChecks.carbsMatch ? '✅' : '❌ FAIL'}`);
console.log(`   ✓ Grasas = remaining: ${dinnerChecks.fatMatch ? '✅' : '❌ FAIL'}`);

const dinnerPassed = Object.values(dinnerChecks).every(check => check);

if (dinnerPassed) {
  console.log('\n✅✅✅ CENA - PASS: Última comida detectada correctamente, target = remaining EXACTO');
} else {
  console.log('\n❌❌❌ CENA - FAIL: Hay problemas en la detección de última comida');
}

// Simular cena con 100% del target (micro-optimización perfecta)
const dinnerActual: Meal = {
  id: 'test-dinner',
  name: 'Cena Test',
  type: 'dinner',
  ingredients: [],
  baseQuantity: 1,
  calories: dinnerTarget.calories,
  protein: dinnerTarget.protein,
  carbs: dinnerTarget.carbs,
  fat: dinnerTarget.fat
};

currentLog.dinner = dinnerActual;
totalConsumed.calories += dinnerActual.calories;
totalConsumed.protein += dinnerActual.protein;
totalConsumed.carbs += dinnerActual.carbs;
totalConsumed.fat += dinnerActual.fat;

console.log(`\n🍽️ Usuario come cena (100% del target con micro-optimización):`);
console.log(`   Real: ${dinnerActual.calories} kcal | ${dinnerActual.protein}P | ${dinnerActual.carbs}C | ${dinnerActual.fat}G`);

// ═══════════════════════════════════════════════════════════
// TEST 5: VERIFICACIÓN FINAL DEL DÍA COMPLETO
// ═══════════════════════════════════════════════════════════
console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 5: VERIFICACIÓN TOTAL DEL DÍA                    │');
console.log('└─────────────────────────────────────────────────────────┘');

console.log('\n📊 RESUMEN DEL DÍA:');
console.log('┌──────────────┬──────────┬──────────┬──────────┬──────────┐');
console.log('│   Comida     │  Kcal    │   Prot   │  Carbos  │  Grasas  │');
console.log('├──────────────┼──────────┼──────────┼──────────┼──────────┤');
console.log(`│ Desayuno     │ ${String(breakfastActual.calories).padStart(8)} │ ${String(breakfastActual.protein).padStart(8)} │ ${String(breakfastActual.carbs).padStart(8)} │ ${String(breakfastActual.fat).padStart(8)} │`);
console.log(`│ Comida       │ ${String(lunchActual.calories).padStart(8)} │ ${String(lunchActual.protein).padStart(8)} │ ${String(lunchActual.carbs).padStart(8)} │ ${String(lunchActual.fat).padStart(8)} │`);
console.log(`│ Snack        │ ${String(snackActual.calories).padStart(8)} │ ${String(snackActual.protein).padStart(8)} │ ${String(snackActual.carbs).padStart(8)} │ ${String(snackActual.fat).padStart(8)} │`);
console.log(`│ Cena         │ ${String(dinnerActual.calories).padStart(8)} │ ${String(dinnerActual.protein).padStart(8)} │ ${String(dinnerActual.carbs).padStart(8)} │ ${String(dinnerActual.fat).padStart(8)} │`);
console.log('├──────────────┼──────────┼──────────┼──────────┼──────────┤');
console.log(`│ TOTAL        │ ${String(totalConsumed.calories).padStart(8)} │ ${String(totalConsumed.protein).padStart(8)} │ ${String(totalConsumed.carbs).padStart(8)} │ ${String(totalConsumed.fat).padStart(8)} │`);
console.log(`│ OBJETIVO     │ ${String(testUser.goals.calories).padStart(8)} │ ${String(testUser.goals.protein).padStart(8)} │ ${String(testUser.goals.carbs).padStart(8)} │ ${String(testUser.goals.fat).padStart(8)} │`);
console.log('└──────────────┴──────────┴──────────┴──────────┴──────────┘');

const finalDiff = {
  calories: totalConsumed.calories - testUser.goals.calories,
  protein: totalConsumed.protein - testUser.goals.protein,
  carbs: totalConsumed.carbs - testUser.goals.carbs,
  fat: totalConsumed.fat - testUser.goals.fat
};

const finalPercentages = {
  calories: (totalConsumed.calories / testUser.goals.calories * 100).toFixed(2),
  protein: (totalConsumed.protein / testUser.goals.protein * 100).toFixed(2),
  carbs: (totalConsumed.carbs / testUser.goals.carbs * 100).toFixed(2),
  fat: (totalConsumed.fat / testUser.goals.fat * 100).toFixed(2)
};

console.log('\n📈 PRECISIÓN FINAL:');
console.log(`   Calorías: ${finalPercentages.calories}% (${finalDiff.calories > 0 ? '+' : ''}${finalDiff.calories} kcal)`);
console.log(`   Proteína: ${finalPercentages.protein}% (${finalDiff.protein > 0 ? '+' : ''}${finalDiff.protein}g)`);
console.log(`   Carbos: ${finalPercentages.carbs}% (${finalDiff.carbs > 0 ? '+' : ''}${finalDiff.carbs}g)`);
console.log(`   Grasas: ${finalPercentages.fat}% (${finalDiff.fat > 0 ? '+' : ''}${finalDiff.fat}g)`);

// Verificación final: ¿Llegamos al 100%?
const tolerance = {
  calories: 10, // ±10 kcal
  protein: 2,   // ±2g
  carbs: 3,     // ±3g
  fat: 2        // ±2g
};

const finalChecks = {
  calories: Math.abs(finalDiff.calories) <= tolerance.calories,
  protein: Math.abs(finalDiff.protein) <= tolerance.protein,
  carbs: Math.abs(finalDiff.carbs) <= tolerance.carbs,
  fat: Math.abs(finalDiff.fat) <= tolerance.fat
};

console.log('\n🎯 VERIFICACIÓN DE TOLERANCIA:');
console.log(`   Calorías ±${tolerance.calories} kcal: ${finalChecks.calories ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Proteína ±${tolerance.protein}g: ${finalChecks.protein ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Carbos ±${tolerance.carbs}g: ${finalChecks.carbs ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Grasas ±${tolerance.fat}g: ${finalChecks.fat ? '✅ PASS' : '❌ FAIL'}`);

const allPassed = Object.values(finalChecks).every(check => check);

console.log('\n═══════════════════════════════════════════════════════════');
if (allPassed && dinnerPassed) {
  console.log('   🎉🎉🎉 TODOS LOS TESTS PASARON 🎉🎉🎉');
  console.log('   ✅ Última comida detectada correctamente');
  console.log('   ✅ Target de cena = remaining exacto');
  console.log('   ✅ Total del día dentro de tolerancia');
  console.log('   ✅ Sistema funcionando al 100%');
} else {
  console.log('   ❌❌❌ TESTS FALLIDOS ❌❌❌');
  if (!dinnerPassed) {
    console.log('   ❌ Problemas con detección de última comida');
  }
  if (!allPassed) {
    console.log('   ❌ Total del día fuera de tolerancia');
  }
}
console.log('═══════════════════════════════════════════════════════════\n');

// Código de salida
process.exit(allPassed && dinnerPassed ? 0 : 1);
