/**
 * 🔍 TEST: Verificar que TODOS los platos se escalen al 98%+ como usuario real
 * 
 * Simula exactamente lo que ve un usuario cuando entra a seleccionar comidas.
 */

import { User, DailyLog, MealType, Meal } from './src/app/types';
import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator';
import { rankMealsByFit } from './src/app/utils/intelligentMealScaling';
import { ALL_MEALS_FROM_DB } from './src/data/mealsWithIngredients';
import { INGREDIENTS_DATABASE } from './src/data/ingredientsDatabase';

console.log('🧪 ═══════════════════════════════════════════════════════════');
console.log('   TEST: VERIFICAR ESCALADO AL 98%+ PARA USUARIO REAL');
console.log('   ═══════════════════════════════════════════════════════════\n');

// Usuario de ejemplo
const user: User = {
  email: 'test@fuelier.com',
  name: 'Usuario Test',
  sex: 'male',
  age: 30,
  weight: 75,
  height: 175,
  goal: 'maintenance',
  mealsPerDay: 4,
  trainingFrequency: 3,
  goals: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 60
  },
  metabolicAdaptation: {
    isAdapted: false,
    adaptationLevel: 'none',
    recommendedPhase: 'maintenance'
  },
  preferences: {
    likes: [],
    dislikes: [],
    intolerances: [],
    allergies: []
  },
  isAdmin: false
};

// Log vacío (primera comida del día)
const emptyLog: DailyLog = {
  date: '2026-01-13',
  breakfast: null,
  lunch: null,
  snack: null,
  dinner: null
};

console.log('👤 Usuario:', {
  objetivos: user.goals,
  primeraComidaDelDia: true
});
console.log('');

// Test para DESAYUNO
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│  TEST 1: DESAYUNO (primera comida del día)             │');
console.log('└─────────────────────────────────────────────────────────┘\n');

const mealType: MealType = 'breakfast';

// 1. Calcular target automático
const intelligentTarget = calculateIntelligentTarget(user, emptyLog, mealType);
console.log('🎯 Target automático calculado:', {
  calories: intelligentTarget.calories,
  protein: intelligentTarget.protein,
  carbs: intelligentTarget.carbs,
  fat: intelligentTarget.fat,
  isLastMeal: intelligentTarget.isLastMeal,
  mealsLeft: intelligentTarget.mealsLeft
});
console.log('');

// 2. Obtener platos del tipo correcto
const mealsForBreakfast = ALL_MEALS_FROM_DB.filter(m => m.type === 'breakfast');
console.log(`📦 Platos disponibles para ${mealType}: ${mealsForBreakfast.length}`);
console.log('');

// 3. Rankear y escalar todos los platos (EXACTAMENTE como lo hace MealSelection.tsx)
console.log('🤖 Escalando TODOS los platos con IA...\n');
const rankedMeals = rankMealsByFit(
  mealsForBreakfast,
  user,
  emptyLog,
  mealType,
  intelligentTarget,
  INGREDIENTS_DATABASE
);

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('   RESULTADOS DEL ESCALADO');
console.log('═══════════════════════════════════════════════════════════\n');

// 4. Analizar resultados
let perfectCount = 0; // 98%+
let goodCount = 0;    // 95-98%
let okCount = 0;      // 90-95%
let poorCount = 0;    // <90%

const results: Array<{
  nombre: string;
  porcentaje: number;
  macrosTarget: any;
  macrosObtenidos: any;
  tienIngredientes: boolean;
}> = [];

rankedMeals.forEach(({ meal, scaledMeal, fitScore }) => {
  const porcentaje = 100 - (calculateMacroError(scaledMeal, intelligentTarget) * 100);
  
  if (porcentaje >= 98) perfectCount++;
  else if (porcentaje >= 95) goodCount++;
  else if (porcentaje >= 90) okCount++;
  else poorCount++;
  
  results.push({
    nombre: meal.name,
    porcentaje,
    macrosTarget: intelligentTarget,
    macrosObtenidos: {
      cal: scaledMeal.calories,
      prot: scaledMeal.protein,
      carbs: scaledMeal.carbs,
      fat: scaledMeal.fat
    },
    tienIngredientes: !!(meal.ingredientReferences && meal.ingredientReferences.length > 0)
  });
});

// Ordenar por peor ajuste primero
results.sort((a, b) => a.porcentaje - b.porcentaje);

console.log('📊 RESUMEN GENERAL:');
console.log(`   Total de platos: ${results.length}`);
console.log(`   ✅ Perfectos (≥98%):    ${perfectCount} (${(perfectCount / results.length * 100).toFixed(1)}%)`);
console.log(`   ✓  Buenos (95-98%):     ${goodCount} (${(goodCount / results.length * 100).toFixed(1)}%)`);
console.log(`   ⚠️  Aceptables (90-95%): ${okCount} (${(okCount / results.length * 100).toFixed(1)}%)`);
console.log(`   ❌ Pobres (<90%):       ${poorCount} (${(poorCount / results.length * 100).toFixed(1)}%)`);
console.log('');

if (poorCount > 0) {
  console.log('❌ PLATOS CON AJUSTE POBRE (<90%):');
  console.log('─'.repeat(80));
  results.filter(r => r.porcentaje < 90).forEach(r => {
    console.log(`   ${r.nombre}`);
    console.log(`   - Ajuste: ${r.porcentaje.toFixed(1)}%`);
    console.log(`   - Tiene ingredientes: ${r.tienIngredientes ? '✅ SÍ' : '❌ NO (PROBLEMA)'}`);
    console.log(`   - Target: ${r.macrosTarget.calories}kcal | ${r.macrosTarget.protein}P | ${r.macrosTarget.carbs}C | ${r.macrosTarget.fat}G`);
    console.log(`   - Obtenido: ${r.macrosObtenidos.cal}kcal | ${r.macrosObtenidos.prot}P | ${r.macrosObtenidos.carbs}C | ${r.macrosObtenidos.fat}G`);
    console.log('');
  });
}

if (okCount > 0) {
  console.log('⚠️ PLATOS ACEPTABLES PERO MEJORABLES (90-95%):');
  console.log('─'.repeat(80));
  results.filter(r => r.porcentaje >= 90 && r.porcentaje < 95).forEach(r => {
    console.log(`   ${r.nombre}: ${r.porcentaje.toFixed(1)}% (tiene ingredientes: ${r.tienIngredientes ? 'SÍ' : 'NO'})`);
  });
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════');
console.log(`   VEREDICTO: ${perfectCount + goodCount >= results.length * 0.95 ? '✅ SISTEMA OK' : '❌ SISTEMA NECESITA MEJORAS'}`);
console.log(`   ${perfectCount + goodCount} de ${results.length} platos (${((perfectCount + goodCount) / results.length * 100).toFixed(1)}%) están al 95%+`);
console.log('═══════════════════════════════════════════════════════════\n');

// Helper function
function calculateMacroError(
  meal: Meal,
  target: { calories: number; protein: number; carbs: number; fat: number }
): number {
  const errors = {
    cal: target.calories > 0 ? Math.abs(meal.calories - target.calories) / target.calories : 0,
    prot: target.protein > 0 ? Math.abs(meal.protein - target.protein) / target.protein : 0,
    carbs: target.carbs > 0 ? Math.abs(meal.carbs - target.carbs) / target.carbs : 0,
    fat: target.fat > 0 ? Math.abs(meal.fat - target.fat) / target.fat : 0
  };
  
  return Math.max(errors.cal, errors.prot, errors.carbs, errors.fat);
}
