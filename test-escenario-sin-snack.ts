/**
 * 🧪 TEST: ESCENARIO SIN SNACK (MÁS REALISTA)
 * 
 * Muchos usuarios no comen snack, solo desayuno, comida y cena.
 * Este test verifica que el sistema sigue funcionando correctamente.
 */

import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator';
import { User, DailyLog, Meal } from './src/app/types';

const testUser: User = {
  email: 'test2@fuelier.com',
  name: 'Usuario Sin Snack',
  age: 28,
  weight: 70,
  height: 170,
  sex: 'female',
  trainingFrequency: 2,
  goal: 'moderate_loss',
  mealsPerDay: 3,
  goals: {
    calories: 1800,
    protein: 120,
    carbs: 180,
    fat: 50
  },
  preferences: {
    likes: [],
    dislikes: [],
    intolerances: [],
    allergies: []
  }
};

console.log('🧪 ═══════════════════════════════════════════════════════════');
console.log('   TEST: ESCENARIO SIN SNACK (3 COMIDAS AL DÍA)');
console.log('   ═══════════════════════════════════════════════════════════');
console.log(`   Usuario: ${testUser.name}`);
console.log(`   Objetivos: ${testUser.goals.calories} kcal | ${testUser.goals.protein}P | ${testUser.goals.carbs}C | ${testUser.goals.fat}G`);
console.log('   ═══════════════════════════════════════════════════════════\n');

let currentLog: DailyLog = {
  date: new Date().toISOString().split('T')[0],
  breakfast: null,
  lunch: null,
  snack: null,
  dinner: null
};

let totalConsumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };

// ═══════════════════════════════════════════════════════════
// DESAYUNO
// ═══════════════════════════════════════════════════════════
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  DESAYUNO                                               │');
console.log('└─────────────────────────────────────────────────────────┘');

const breakfastTarget = calculateIntelligentTarget(testUser, currentLog, 'breakfast');
console.log(`📊 Target: ${breakfastTarget.calories} kcal | ${breakfastTarget.protein}P | ${breakfastTarget.carbs}C | ${breakfastTarget.fat}G`);
console.log(`   isLastMeal: ${breakfastTarget.isLastMeal} | mealsLeft: ${breakfastTarget.mealsLeft}`);

const breakfastActual: Meal = {
  id: 'test-breakfast',
  name: 'Desayuno Test',
  type: 'breakfast',
  ingredients: [],
  baseQuantity: 1,
  calories: Math.round(breakfastTarget.calories * 0.99),
  protein: Math.round(breakfastTarget.protein * 0.99),
  carbs: Math.round(breakfastTarget.carbs * 0.99),
  fat: Math.round(breakfastTarget.fat * 0.99)
};

currentLog.breakfast = breakfastActual;
totalConsumed.calories += breakfastActual.calories;
totalConsumed.protein += breakfastActual.protein;
totalConsumed.carbs += breakfastActual.carbs;
totalConsumed.fat += breakfastActual.fat;

console.log(`✅ Consumido: ${breakfastActual.calories} kcal (${(breakfastActual.calories/breakfastTarget.calories*100).toFixed(1)}%)\n`);

// ═══════════════════════════════════════════════════════════
// COMIDA
// ═══════════════════════════════════════════════════════════
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  COMIDA                                                 │');
console.log('└─────────────────────────────────────────────────────────┘');

const lunchTarget = calculateIntelligentTarget(testUser, currentLog, 'lunch');
console.log(`📊 Target: ${lunchTarget.calories} kcal | ${lunchTarget.protein}P | ${lunchTarget.carbs}C | ${lunchTarget.fat}G`);
console.log(`   isLastMeal: ${lunchTarget.isLastMeal} | mealsLeft: ${lunchTarget.mealsLeft}`);

const lunchActual: Meal = {
  id: 'test-lunch',
  name: 'Comida Test',
  type: 'lunch',
  ingredients: [],
  baseQuantity: 1,
  calories: Math.round(lunchTarget.calories * 0.98),
  protein: Math.round(lunchTarget.protein * 0.98),
  carbs: Math.round(lunchTarget.carbs * 0.98),
  fat: Math.round(lunchTarget.fat * 0.98)
};

currentLog.lunch = lunchActual;
totalConsumed.calories += lunchActual.calories;
totalConsumed.protein += lunchActual.protein;
totalConsumed.carbs += lunchActual.carbs;
totalConsumed.fat += lunchActual.fat;

console.log(`✅ Consumido: ${lunchActual.calories} kcal (${(lunchActual.calories/lunchTarget.calories*100).toFixed(1)}%)\n`);

// ═══════════════════════════════════════════════════════════
// SNACK - EL USUARIO NO LO COME (LO SALTA)
// ═══════════════════════════════════════════════════════════
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  SNACK - ⏭️  SALTADO (usuario no come snack)            │');
console.log('└─────────────────────────────────────────────────────────┘\n');

// NO registramos snack, currentLog.snack = undefined

// ═══════════════════════════════════════════════════════════
// CENA - DEBERÍA SER ÚLTIMA COMIDA Y COMPENSAR TODO
// ═══════════════════════════════════════════════════════════
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  🌙 CENA (última comida, debe compensar snack saltado) │');
console.log('└─────────────────────────────────────────────────────────┘');

const dinnerTarget = calculateIntelligentTarget(testUser, currentLog, 'dinner');
console.log(`📊 Target: ${dinnerTarget.calories} kcal | ${dinnerTarget.protein}P | ${dinnerTarget.carbs}C | ${dinnerTarget.fat}G`);
console.log(`   isLastMeal: ${dinnerTarget.isLastMeal} 🌙 | mealsLeft: ${dinnerTarget.mealsLeft}`);

const expectedRemaining = {
  calories: testUser.goals.calories - totalConsumed.calories,
  protein: testUser.goals.protein - totalConsumed.protein,
  carbs: testUser.goals.carbs - totalConsumed.carbs,
  fat: testUser.goals.fat - totalConsumed.fat
};

console.log(`\n🔍 Remaining esperado: ${expectedRemaining.calories} kcal | ${expectedRemaining.protein}P | ${expectedRemaining.carbs}C | ${expectedRemaining.fat}G`);
console.log(`📊 Target calculado:   ${dinnerTarget.calories} kcal | ${dinnerTarget.protein}P | ${dinnerTarget.carbs}C | ${dinnerTarget.fat}G`);

const dinnerMatches = 
  Math.abs(dinnerTarget.calories - expectedRemaining.calories) < 1 &&
  Math.abs(dinnerTarget.protein - expectedRemaining.protein) < 1 &&
  Math.abs(dinnerTarget.carbs - expectedRemaining.carbs) < 1 &&
  Math.abs(dinnerTarget.fat - expectedRemaining.fat) < 1;

if (dinnerMatches && dinnerTarget.isLastMeal && dinnerTarget.mealsLeft === 1) {
  console.log('\n✅✅✅ PERFECTO: Cena detectada como última comida, target = remaining exacto');
} else {
  console.log('\n❌❌❌ ERROR: Problemas con detección de última comida o target incorrecto');
  if (!dinnerTarget.isLastMeal) console.log('   ❌ isLastMeal debería ser true');
  if (dinnerTarget.mealsLeft !== 1) console.log(`   ❌ mealsLeft debería ser 1, es ${dinnerTarget.mealsLeft}`);
  if (!dinnerMatches) console.log('   ❌ Target no coincide con remaining');
}

// Simular cena con 100% del target
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

console.log(`✅ Consumido: ${dinnerActual.calories} kcal (100.0%)\n`);

// ═══════════════════════════════════════════════════════════
// VERIFICACIÓN FINAL
// ═══════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════════════════');
console.log('   RESUMEN DEL DÍA (SIN SNACK)');
console.log('═══════════════════════════════════════════════════════════');
console.log(`   Desayuno: ${breakfastActual.calories} kcal`);
console.log(`   Comida:   ${lunchActual.calories} kcal`);
console.log(`   Snack:    0 kcal (saltado)`);
console.log(`   Cena:     ${dinnerActual.calories} kcal`);
console.log('   ───────────────────────────────────────────────────────');
console.log(`   TOTAL:    ${totalConsumed.calories} kcal | ${totalConsumed.protein}P | ${totalConsumed.carbs}C | ${totalConsumed.fat}G`);
console.log(`   OBJETIVO: ${testUser.goals.calories} kcal | ${testUser.goals.protein}P | ${testUser.goals.carbs}C | ${testUser.goals.fat}G`);
console.log('═══════════════════════════════════════════════════════════');

const finalDiff = {
  calories: totalConsumed.calories - testUser.goals.calories,
  protein: totalConsumed.protein - testUser.goals.protein,
  carbs: totalConsumed.carbs - testUser.goals.carbs,
  fat: totalConsumed.fat - testUser.goals.fat
};

const precision = {
  calories: (totalConsumed.calories / testUser.goals.calories * 100).toFixed(2),
  protein: (totalConsumed.protein / testUser.goals.protein * 100).toFixed(2),
  carbs: (totalConsumed.carbs / testUser.goals.carbs * 100).toFixed(2),
  fat: (totalConsumed.fat / testUser.goals.fat * 100).toFixed(2)
};

console.log(`\n📈 PRECISIÓN:`);
console.log(`   Calorías: ${precision.calories}% (${finalDiff.calories >= 0 ? '+' : ''}${finalDiff.calories})`);
console.log(`   Proteína: ${precision.protein}% (${finalDiff.protein >= 0 ? '+' : ''}${finalDiff.protein}g)`);
console.log(`   Carbos:   ${precision.carbs}% (${finalDiff.carbs >= 0 ? '+' : ''}${finalDiff.carbs}g)`);
console.log(`   Grasas:   ${precision.fat}% (${finalDiff.fat >= 0 ? '+' : ''}${finalDiff.fat}g)`);

const success = 
  Math.abs(finalDiff.calories) <= 10 &&
  Math.abs(finalDiff.protein) <= 2 &&
  Math.abs(finalDiff.carbs) <= 3 &&
  Math.abs(finalDiff.fat) <= 2 &&
  dinnerMatches &&
  dinnerTarget.isLastMeal;

if (success) {
  console.log('\n🎉🎉🎉 TEST PASADO - Sistema maneja correctamente días sin snack');
  console.log('✅ Cena compensa automáticamente el snack saltado');
  console.log('✅ Total del día = 100% de objetivos');
} else {
  console.log('\n❌❌❌ TEST FALLIDO');
}

console.log('═══════════════════════════════════════════════════════════\n');

process.exit(success ? 0 : 1);
