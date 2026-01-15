/**
 * 🚀 TEST COMPLETO - Verificación de mejoras del AI Engine
 * 
 * Prueba TODOS los platos (34 en total: 11 breakfast, 10 lunch, 5 snack, 8 dinner)
 * para validar que las mejoras logran 95%+ accuracy
 */

import { createClient } from '@supabase/supabase-js';
import { ALL_MEALS_FROM_DB } from './src/data/mealsWithIngredients';
import { adaptMealWithAIEngine } from './src/app/utils/fuelierAIEngine';
import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator';
import { Meal, User, DailyLog, MealType, MealIngredient } from './src/app/types';
import { Ingredient } from './src/data/ingredientTypes';
import { projectId, publicAnonKey } from './utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const supabase = createClient(SUPABASE_URL, publicAnonKey);

const mockUser: User = {
  id: 'test-user',
  name: 'Test User',
  email: 'test@test.com',
  sex: 'male',
  age: 30,
  weight: 75,
  height: 175,
  trainingFrequency: 4,
  goal: 'maintenance',
  mealsPerDay: 4,
  goals: {
    calories: 2500,
    protein: 200,
    carbs: 280,
    fat: 70
  },
  preferences: {
    likes: [],
    dislikes: [],
    intolerances: [],
    allergies: []
  },
  createdAt: new Date()
};

const emptyLog: DailyLog = {
  date: '2026-01-15',
  breakfast: null,
  lunch: null,
  snack: null,
  dinner: null
};

// Para simular comidas ya consumidas (evitar que dinner sea "última comida")
const logWithPreviousMeals: DailyLog = {
  date: '2026-01-15',
  breakfast: {
    name: 'Mock Breakfast',
    calories: 625,
    protein: 50,
    carbs: 70,
    fat: 18,
    ingredients: []
  },
  lunch: {
    name: 'Mock Lunch',
    calories: 875,
    protein: 70,
    carbs: 98,
    fat: 25,
    ingredients: []
  },
  snack: {
    name: 'Mock Snack',
    calories: 375,
    protein: 30,
    carbs: 42,
    fat: 11,
    ingredients: []
  },
  dinner: null
};

async function loadIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .order('name');

  if (error || !data) {
    console.error('❌ Error cargando ingredientes:', error);
    return [];
  }

  return data as Ingredient[];
}

async function testMeal(
  meal: Meal,
  mealType: MealType,
  allIngredients: Ingredient[]
): Promise<{ name: string; type: string; accuracy: number; method: string }> {
  // Usar log apropiado según el tipo de comida
  // Para dinner, usar logWithPreviousMeals para evitar que sea "última comida" con target=TODO el día
  const dailyLog = (mealType === 'dinner') ? logWithPreviousMeals : emptyLog;
  
  const target = calculateIntelligentTarget(mockUser, dailyLog, mealType);

  const mealIngredients: MealIngredient[] = meal.ingredientReferences?.map(ref => {
    const ingredient = allIngredients.find(i => i.id === ref.ingredientId);
    if (!ingredient) return null;

    const ratio = ref.amountInGrams / 100;
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      amount: ref.amountInGrams,
      calories: ingredient.calories * ratio,
      protein: ingredient.protein * ratio,
      carbs: ingredient.carbs * ratio,
      fat: ingredient.fat * ratio
    };
  }).filter((ing): ing is MealIngredient => ing !== null) || [];

  const mealForEngine = { ...meal, ingredients: meal.ingredients };
  (mealForEngine as any).mealIngredients = mealIngredients;

  const result = adaptMealWithAIEngine(
    mealForEngine as any,
    target,
    mockUser,
    dailyLog,
    150,
    allIngredients
  );

  return {
    name: meal.name,
    type: mealType,
    accuracy: result.accuracy,
    method: result.method
  };
}

async function runQuickTest() {
  console.log('🚀 TEST COMPLETO - Validación de mejoras en TODOS los platos (34)\n');
  console.log('═'.repeat(70));

  const allIngredients = await loadIngredients();
  console.log(`✅ Ingredientes: ${allIngredients.length}\n`);

  // Probar TODOS los platos, organizados por tipo
  const mealsByType = {
    breakfast: ALL_MEALS_FROM_DB.filter(m => {
      const type = Array.isArray(m.type) ? m.type : [m.type];
      return type.includes('breakfast');
    }),
    lunch: ALL_MEALS_FROM_DB.filter(m => {
      const type = Array.isArray(m.type) ? m.type : [m.type];
      return type.includes('lunch');
    }),
    snack: ALL_MEALS_FROM_DB.filter(m => {
      const type = Array.isArray(m.type) ? m.type : [m.type];
      return type.includes('snack');
    }),
    dinner: ALL_MEALS_FROM_DB.filter(m => {
      const type = Array.isArray(m.type) ? m.type : [m.type];
      return type.includes('dinner');
    })
  };

  const results: any[] = [];
  let currentTest = 0;
  const totalTests = Object.values(mealsByType).flat().length;

  for (const [mealType, meals] of Object.entries(mealsByType)) {
    console.log(`\n🍽️  ${mealType.toUpperCase()} (${meals.length} platos)\n${'─'.repeat(70)}`);

    for (const meal of meals) {
      currentTest++;
      process.stdout.write(`[${currentTest}/${totalTests}] ${meal.name}...`);
      
      const result = await testMeal(meal, mealType as MealType, allIngredients);
      results.push(result);

      const icon = result.accuracy >= 95 ? '✅' :
                   result.accuracy >= 90 ? '✓' :
                   result.accuracy >= 85 ? '⚠️' : '❌';
      console.log(` ${icon} ${result.accuracy.toFixed(1)}% (${result.method})`);
    }
  }

  // Resumen
  console.log('\n\n' + '═'.repeat(70));
  console.log('📊 RESUMEN DE RESULTADOS\n');

  const byType = {
    breakfast: results.filter(r => r.type === 'breakfast'),
    lunch: results.filter(r => r.type === 'lunch'),
    snack: results.filter(r => r.type === 'snack'),
    dinner: results.filter(r => r.type === 'dinner')
  };

  for (const [type, typeResults] of Object.entries(byType)) {
    const avg = typeResults.reduce((sum, r) => sum + r.accuracy, 0) / typeResults.length;
    const excellent = typeResults.filter(r => r.accuracy >= 95).length;
    const good = typeResults.filter(r => r.accuracy >= 90).length;

    console.log(`${type.toUpperCase()}:`);
    console.log(`  Promedio: ${avg.toFixed(1)}%`);
    console.log(`  ≥95%: ${excellent}/${typeResults.length} | ≥90%: ${good}/${typeResults.length}`);
  }

  const totalAvg = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
  const total95 = results.filter(r => r.accuracy >= 95).length;
  const total90 = results.filter(r => r.accuracy >= 90).length;
  const total85 = results.filter(r => r.accuracy >= 85).length;

  console.log(`\nGLOBAL (${results.length} platos):`);
  console.log(`  Promedio: ${totalAvg.toFixed(1)}%`);
  console.log(`  ✅ ≥95%: ${total95}/${results.length} (${(total95/results.length*100).toFixed(0)}%)`);
  console.log(`  ✓  ≥90%: ${total90}/${results.length} (${(total90/results.length*100).toFixed(0)}%)`);
  console.log(`  ⚠️  ≥85%: ${total85}/${results.length} (${(total85/results.length*100).toFixed(0)}%)`);

  console.log('\n' + '═'.repeat(70));

  if (total95 >= results.length * 0.80) {
    console.log('🎉 EXCELENTE: 80%+ de platos alcanzan 95%+ accuracy');
    console.log('✅ OBJETIVO CUMPLIDO - Sistema listo para producción');
  } else if (total90 >= results.length * 0.85) {
    console.log('✓  MUY BUENO: 85%+ de platos alcanzan 90%+ accuracy');
    console.log('✅ Sistema funcionando correctamente');
  } else if (total85 >= results.length * 0.90) {
    console.log('⚠️  ACEPTABLE: 90%+ de platos alcanzan 85%+ accuracy');
    console.log('⚠️  Considerar mejoras para alcanzar 95%+');
  } else {
    console.log('❌ NECESITA MEJORAS URGENTES');
    console.log('   Menos del 90% de platos alcanzan 85%+ accuracy');
  }

  console.log('\n📋 TOP 5 MEJORES:');
  results.sort((a, b) => b.accuracy - a.accuracy).slice(0, 5).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name} (${r.type}): ${r.accuracy.toFixed(1)}%`);
  });

  console.log('\n📋 TOP 5 PEORES:');
  results.sort((a, b) => a.accuracy - b.accuracy).slice(0, 5).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name} (${r.type}): ${r.accuracy.toFixed(1)}%`);
  });
}

runQuickTest().catch(console.error);
