/**
 * 🧪 TEST COMPLETO - TODOS LOS PLATOS (34 platos)
 * 
 * Prueba el AI Engine con:
 * - 11 platos de desayuno (breakfast)
 * - 10 platos de comida (lunch)
 * - 5 platos de merienda (snack)
 * - 8 platos de cena (dinner)
 * 
 * TOTAL: 34 platos
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

// Usuario de prueba
const mockUser: User = {
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
  createdAt: new Date().toISOString()
};

const emptyLog: DailyLog = {
  date: '2026-01-15',
  breakfast: null,
  lunch: null,
  snack: null,
  dinner: null
};

interface TestResult {
  meal: Meal;
  mealType: MealType;
  success: boolean;
  accuracy: number;
  maxErrorAccuracy: number;
  target: any;
  achieved: any;
  method: string;
}

async function loadIngredients(): Promise<Ingredient[]> {
  console.log('📦 Cargando ingredientes desde Supabase...\n');
  
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .order('name');

  if (error || !data) {
    console.error('❌ Error cargando ingredientes:', error);
    return [];
  }

  console.log(`✅ Cargados ${data.length} ingredientes desde Supabase\n`);
  return data as Ingredient[];
}

async function testMeal(
  meal: Meal,
  mealType: MealType,
  allIngredients: Ingredient[],
  target: any
): Promise<TestResult> {
  // Convertir ingredientReferences a mealIngredients
  const mealIngredients: MealIngredient[] = meal.ingredientReferences?.map(ref => {
    const ingredient = allIngredients.find(i => i.id === ref.ingredientId);
    if (!ingredient) {
      return null;
    }

    const ratio = ref.amountInGrams / 100;
    // Los campos en Supabase son: calories, protein, carbs, fat (ya son por 100g)
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      amount: ref.amountInGrams,
      calories: (ingredient as any).calories * ratio,
      protein: (ingredient as any).protein * ratio,
      carbs: (ingredient as any).carbs * ratio,
      fat: (ingredient as any).fat * ratio
    };
  }).filter((ing): ing is MealIngredient => ing !== null) || [];

  if (mealIngredients.length === 0) {
    throw new Error(`No se pudieron convertir ingredientes para "${meal.name}"`);
  }

  // Crear meal con mealIngredients
  const mealForEngine = {
    ...meal,
    ingredients: mealIngredients.map(i => `${i.amount}g ${i.ingredientName}`)
  };
  (mealForEngine as any).mealIngredients = mealIngredients;
  
  try {
    const result = await adaptMealWithAIEngine(
      mealForEngine,
      target,
      mockUser,
      emptyLog,
      100,
      allIngredients
    );
    
    return {
      meal,
      mealType,
      success: true,
      accuracy: result.accuracy,
      maxErrorAccuracy: 0, // Not available in HybridSolution
      target,
      achieved: result.achievedMacros,
      method: result.method
    };
  } catch (error) {
    return {
      meal,
      mealType,
      success: false,
      accuracy: 0,
      maxErrorAccuracy: 0,
      target,
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      method: 'error'
    };
  }
}

async function runTests() {
  console.log('🧪 ════════════════════════════════════════════════════════');
  console.log('   TEST COMPLETO - TODOS LOS PLATOS (34 platos)');
  console.log('   ════════════════════════════════════════════════════════\n');
  
  const allIngredients = await loadIngredients();
  
  // Agrupar platos por tipo
  const mealsByType = {
    breakfast: ALL_MEALS_FROM_DB.filter(m => 
      m.type === 'breakfast' || (Array.isArray(m.type) && m.type.includes('breakfast'))
    ),
    lunch: ALL_MEALS_FROM_DB.filter(m => 
      m.type === 'lunch' || (Array.isArray(m.type) && m.type.includes('lunch'))
    ),
    snack: ALL_MEALS_FROM_DB.filter(m => 
      m.type === 'snack' || (Array.isArray(m.type) && m.type.includes('snack'))
    ),
    dinner: ALL_MEALS_FROM_DB.filter(m => 
      m.type === 'dinner' || (Array.isArray(m.type) && m.type.includes('dinner'))
    )
  };

  console.log('📋 Platos por tipo:');
  console.log(`   - Breakfast: ${mealsByType.breakfast.length} platos`);
  console.log(`   - Lunch: ${mealsByType.lunch.length} platos`);
  console.log(`   - Snack: ${mealsByType.snack.length} platos`);
  console.log(`   - Dinner: ${mealsByType.dinner.length} platos`);
  console.log(`   - TOTAL: ${Object.values(mealsByType).flat().length} platos\n`);

  const allResults: TestResult[] = [];
  let currentTest = 0;
  const totalTests = Object.values(mealsByType).flat().length;

  // Probar cada tipo de comida
  for (const [mealType, meals] of Object.entries(mealsByType)) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🍽️  ${mealType.toUpperCase()} (${meals.length} platos)`);
    console.log('═'.repeat(70));

    // Calcular target para este tipo de comida
    const target = calculateIntelligentTarget(mockUser, emptyLog, mealType as MealType);

    console.log(`🎯 Target para ${mealType}:`);
    console.log(`   ${target.calories}kcal | ${target.protein}P | ${target.carbs}C | ${target.fat}G\n`);

    for (const meal of meals) {
      currentTest++;
      console.log(`[${currentTest}/${totalTests}] ${meal.name}...`);

      try {
        const result = await testMeal(meal, mealType as MealType, allIngredients, target);
        allResults.push(result);

        if (result.success) {
          const status = result.accuracy >= 95 ? '✅' : 
                        result.accuracy >= 90 ? '✓' : 
                        result.accuracy >= 85 ? '⚠️' : '❌';
          console.log(`   ${status} ${result.accuracy.toFixed(1)}% (${result.method})`);
        } else {
          console.log(`   ❌ FALLO`);
        }
      } catch (error) {
        console.log(`   💥 ERROR: ${(error as Error).message}`);
        allResults.push({
          meal,
          mealType: mealType as MealType,
          success: false,
          accuracy: 0,
          maxErrorAccuracy: 0,
          target,
          achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          method: 'error'
        });
      }
    }
  }

  // Análisis de resultados
  console.log('\n\n🏆 ════════════════════════════════════════════════════════');
  console.log('   RESUMEN GENERAL');
  console.log('   ════════════════════════════════════════════════════════\n');

  const successful = allResults.filter(r => r.success);
  const excellent = successful.filter(r => r.accuracy >= 95);
  const good = successful.filter(r => r.accuracy >= 90 && r.accuracy < 95);
  const acceptable = successful.filter(r => r.accuracy >= 85 && r.accuracy < 90);
  const poor = successful.filter(r => r.accuracy < 85);
  const failed = allResults.filter(r => !r.success);

  console.log('📊 DISTRIBUCIÓN GLOBAL:');
  console.log(`   ✅ Excelente (≥95%):  ${excellent.length} platos (${(excellent.length/allResults.length*100).toFixed(1)}%)`);
  console.log(`   ✓  Bueno (90-95%):    ${good.length} platos (${(good.length/allResults.length*100).toFixed(1)}%)`);
  console.log(`   ⚠️  Aceptable (85-90%): ${acceptable.length} platos (${(acceptable.length/allResults.length*100).toFixed(1)}%)`);
  console.log(`   ❌ Pobre (<85%):      ${poor.length} platos (${(poor.length/allResults.length*100).toFixed(1)}%)`);
  console.log(`   💥 Falló:             ${failed.length} platos (${(failed.length/allResults.length*100).toFixed(1)}%)\n`);

  // Por tipo de comida
  console.log('📊 DISTRIBUCIÓN POR TIPO DE COMIDA:\n');
  for (const mealType of ['breakfast', 'lunch', 'snack', 'dinner']) {
    const typeResults = allResults.filter(r => r.mealType === mealType);
    const typeExcellent = typeResults.filter(r => r.success && r.accuracy >= 95);
    const typeGood = typeResults.filter(r => r.success && r.accuracy >= 90 && r.accuracy < 95);
    const typeFailed = typeResults.filter(r => !r.success);

    console.log(`   ${mealType.toUpperCase()}:`);
    console.log(`      ✅ ≥95%: ${typeExcellent.length}/${typeResults.length} (${(typeExcellent.length/typeResults.length*100).toFixed(0)}%)`);
    console.log(`      ✓  ≥90%: ${typeGood.length}/${typeResults.length} (${(typeGood.length/typeResults.length*100).toFixed(0)}%)`);
    console.log(`      💥 Fallo: ${typeFailed.length}/${typeResults.length} (${(typeFailed.length/typeResults.length*100).toFixed(0)}%)`);
  }

  // Métodos usados
  console.log('\n📊 MÉTODOS USADOS:');
  const lpCount = successful.filter(r => r.method === 'lp').length;
  const lsCount = successful.filter(r => r.method.includes('ls')).length;
  const fallbackCount = successful.filter(r => r.method.includes('fallback')).length;

  console.log(`   LP Solver:  ${lpCount} (${(lpCount/successful.length*100).toFixed(1)}%)`);
  console.log(`   LS Solver:  ${lsCount} (${(lsCount/successful.length*100).toFixed(1)}%)`);
  console.log(`   Fallback:   ${fallbackCount} (${(fallbackCount/successful.length*100).toFixed(1)}%)`);

  // TOP y WORST
  console.log('\n🏅 TOP 5 MEJORES PLATOS (todas las comidas):');
  const sorted = [...successful].sort((a, b) => b.accuracy - a.accuracy);
  sorted.slice(0, 5).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.meal.name} (${r.mealType}): ${r.accuracy.toFixed(1)}%`);
  });

  console.log('\n⚠️  TOP 5 PEORES PLATOS (todas las comidas):');
  sorted.slice(-5).reverse().forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.meal.name} (${r.mealType}): ${r.accuracy.toFixed(1)}%`);
  });

  // Veredicto final
  const successRate = (successful.length / allResults.length) * 100;
  const excellentRate = (excellent.length / allResults.length) * 100;

  console.log('\n' + '═'.repeat(70));
  if (excellentRate >= 50 && successRate >= 90) {
    console.log('✅ VEREDICTO: SISTEMA FUNCIONANDO EXCELENTEMENTE');
  } else if (excellentRate >= 30 && successRate >= 80) {
    console.log('✓  VEREDICTO: SISTEMA FUNCIONANDO CORRECTAMENTE');
  } else if (successRate >= 70) {
    console.log('⚠️  VEREDICTO: SISTEMA NECESITA MEJORAS');
  } else {
    console.log('❌ VEREDICTO: SISTEMA NECESITA TRABAJO URGENTE');
  }
  console.log('═'.repeat(70));
}

runTests().catch(console.error);
