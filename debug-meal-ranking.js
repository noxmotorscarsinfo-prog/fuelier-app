/**
 * 🚨 DEBUG MEAL RANKING - Investigar por qué solo sale una opción
 * 
 * Testea el flujo completo: ingredients loading → ranking → filtering
 */

import { rankMealsByFit } from './src/app/utils/intelligentMealScaling.js';
import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator.js';
import { ALL_MEALS_FROM_DB } from './src/data/mealsWithIngredients.js';
import { INGREDIENTS_DATABASE } from './src/data/ingredients.js';

// Usuario de prueba (igual que en producción)
const user = {
  id: 'test-user',
  preferences: {
    allergies: [],
    intolerances: [],
    dislikes: []
  },
  dailyGoals: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 67
  }
};

// Log vacío (primer plato del día)
const emptyLog = {
  date: new Date().toISOString().split('T')[0],
  meals: [],
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0
};

// Testear desayuno (problema reportado)
const mealType = 'breakfast';

console.log('🚨 DEBUG: Investigando problema de ranking');
console.log('═══════════════════════════════════════════════════\n');

// 1. Cargar platos de desayuno
const mealsForBreakfast = ALL_MEALS_FROM_DB.filter(m => m.type === 'breakfast');
console.log(`📦 Platos disponibles para ${mealType}: ${mealsForBreakfast.length}`);
console.log('   Ejemplos:', mealsForBreakfast.slice(0, 3).map(m => m.name).join(', '));

// 2. Calcular target automático
const intelligentTarget = calculateIntelligentTarget(user, emptyLog, mealType);
console.log(`🎯 Target calculado: ${intelligentTarget.calories}kcal | ${intelligentTarget.protein}P | ${intelligentTarget.carbs}C | ${intelligentTarget.fat}G`);

// 3. Verificar ingredientes
console.log(`🧪 Ingredientes disponibles: ${INGREDIENTS_DATABASE.length}`);
console.log('   Ejemplos:', INGREDIENTS_DATABASE.slice(0, 5).map(ing => ing.name).join(', '));

console.log('\n🤖 Iniciando ranking con IA...\n');

// 4. Ejecutar ranking
const rankedMeals = rankMealsByFit(
  mealsForBreakfast.slice(0, 10), // Solo primeros 10 para debug rápido
  user,
  emptyLog,
  mealType,
  intelligentTarget,
  INGREDIENTS_DATABASE
);

console.log('\n📊 ANÁLISIS DE RESULTADOS:');
console.log('═══════════════════════════════════════════════════\n');

// 5. Analizar cada plato
rankedMeals.forEach((item, i) => {
  const compat = item.scaledMeal?.proportionCompatibility || 0;
  const passes90 = compat >= 90;
  const status = passes90 ? '✅ PASA' : '❌ FILTRADO';
  
  console.log(`${i + 1}. ${item.meal.name}`);
  console.log(`   Compatibilidad: ${compat.toFixed(1)}%`);
  console.log(`   Score: ${item.fitScore.toFixed(1)}`);
  console.log(`   ${status} filtro 90%`);
  console.log(`   Macros: ${item.scaledMeal.calories}kcal | ${item.scaledMeal.protein}P`);
  console.log('');
});

// 6. Estadísticas finales
const passing = rankedMeals.filter(m => (m.scaledMeal?.proportionCompatibility || 0) >= 90);
const failing = rankedMeals.filter(m => (m.scaledMeal?.proportionCompatibility || 0) < 90);

console.log('📈 ESTADÍSTICAS FINALES:');
console.log(`   Total rankeados: ${rankedMeals.length}`);
console.log(`   Pasan filtro (≥90%): ${passing.length}`);
console.log(`   Fallan filtro (<90%): ${failing.length}`);
console.log(`   Porcentaje que pasa: ${((passing.length/rankedMeals.length) * 100).toFixed(1)}%`);

if (failing.length > 0) {
  console.log('\n❌ PLATOS QUE FALLAN:');
  failing.forEach(item => {
    const compat = item.scaledMeal?.proportionCompatibility || 0;
    console.log(`   ${item.meal.name}: ${compat.toFixed(1)}%`);
  });
}

if (passing.length === 0) {
  console.log('\n🚨 PROBLEMA CRÍTICO: Ningún plato pasa el filtro de 90%');
  console.log('   Esto explica por qué solo aparece una opción en la UI');
} else if (passing.length === 1) {
  console.log('\n⚠️ PROBLEMA: Solo 1 plato pasa el filtro de 90%');
  console.log('   Esto explica por qué solo aparece una opción en la UI');
} else {
  console.log('\n✅ El ranking funciona correctamente');
  console.log(`   Deberían aparecer ${passing.length} opciones en la UI`);
}