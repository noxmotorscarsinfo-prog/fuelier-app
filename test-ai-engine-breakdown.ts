/**
 * 🔍 TEST EXHAUSTIVO - Análisis del AI Engine con ingredientes de Supabase
 * 
 * Este test diagnostica por qué solo 2 platos pasan el filtro de 85%
 */

import { createClient } from '@supabase/supabase-js';
import { Ingredient, MealIngredientReference, calculateMacrosFromIngredients } from './src/data/ingredientTypes';
import { ALL_MEALS_FROM_DB } from './src/data/mealsWithIngredients';
import { adaptMealWithAIEngine } from './src/app/utils/fuelierAIEngine';
import { Meal, User, DailyLog, MealType } from './src/app/types';
import { projectId, publicAnonKey } from './utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const SUPABASE_ANON_KEY = publicAnonKey;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Usuario de ejemplo (hombre, 85kg, objetivo mantenimiento)
const mockUser: User = {
  id: 'test-user',
  name: 'Test User',
  email: 'test@test.com',
  goals: {
    dailyCalories: 2500,
    protein: 200,
    carbs: 280,
    fat: 70
  },
  preferences: {},
  createdAt: new Date()
};

const emptyLog: DailyLog = {
  id: 'test-log',
  userId: 'test-user',
  date: '2026-01-14',
  meals: {},
  totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 }
};

const mealType: MealType = 'breakfast';

// Target de desayuno (30% de calorías)
const breakfastTarget = {
  calories: 750, // 30% de 2500
  protein: 60,   // 30% de 200
  carbs: 84,     // 30% de 280
  fat: 21        // 30% de 70
};

async function runExhaustiveTest() {
  console.log('🔬 ═══════════════════════════════════════════════════════════');
  console.log('   TEST EXHAUSTIVO DEL AI ENGINE');
  console.log('   ═══════════════════════════════════════════════════════════\n');
  
  // 1. Cargar ingredientes de Supabase
  console.log('📦 Cargando ingredientes de Supabase...');
  const { data: ingredients, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .is('created_by', null); // Solo ingredientes del sistema
  
  if (error) {
    console.error('❌ Error cargando ingredientes:', error);
    return;
  }
  
  const supabaseIngredients: Ingredient[] = (ingredients || []).map((ing: any) => ({
    id: ing.id,
    name: ing.name,
    calories: ing.calories,
    protein: ing.protein,
    carbs: ing.carbs,
    fat: ing.fat,
    category: ing.category
  }));
  
  console.log(`✅ Ingredientes cargados: ${supabaseIngredients.length}`);
  console.log(`   Ejemplos: ${supabaseIngredients.slice(0, 5).map(i => i.name).join(', ')}\n`);
  
  // 2. Filtrar platos de desayuno
  const breakfastMeals = ALL_MEALS_FROM_DB.filter(m => m.type === 'breakfast');
  console.log(`🍳 Platos de desayuno disponibles: ${breakfastMeals.length}\n`);
  
  // 3. Probar TODOS los platos con el AI Engine
  console.log('🤖 Probando AI Engine con TODOS los platos...\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const results: Array<{
    name: string;
    accuracy: number;
    iterations: number;
    converged: boolean;
    error?: string;
  }> = [];
  
  for (const meal of breakfastMeals) {
    console.log(`\n📋 PLATO: ${meal.name}`);
    console.log('─────────────────────────────────────────────────────────');
    
    try {
      // Convertir ingredientes a formato esperado por el AI Engine
      const mealIngredients = (meal.ingredientReferences || []).map(ref => ({
        ingredientId: ref.ingredientId,
        ingredientName: ref.ingredientId, // Temporal
        quantity: ref.quantity
      }));
      
      // AGREGAR mealIngredients al meal (necesario para AI Engine)
      const mealForEngine = {
        ...meal,
        mealIngredients
      };
      
      // Ejecutar AI Engine
      const result = adaptMealWithAIEngine(
        mealForEngine as any,
        breakfastTarget,
        mockUser,
        emptyLog,
        100, // maxIterations (optimizado)
        supabaseIngredients
      );
      
      console.log(`\n🎯 RESULTADO:`);
      console.log(`   Accuracy: ${result.accuracy.toFixed(1)}%`);
      console.log(`   Achieved: ${result.achievedMacros.calories}kcal | ${result.achievedMacros.protein}P | ${result.achievedMacros.carbs}C | ${result.achievedMacros.fat}G`);
      console.log(`   Target:   ${breakfastTarget.calories}kcal | ${breakfastTarget.protein}P | ${breakfastTarget.carbs}C | ${breakfastTarget.fat}G`);
      console.log(`   ✓ Pasa filtro 85%: ${result.accuracy >= 85 ? '✅ SÍ' : '❌ NO'}`);
      
      results.push({
        name: meal.name,
        accuracy: result.accuracy,
        iterations: result.iterations || 0,
        converged: result.accuracy >= 85
      });
      
    } catch (error: any) {
      console.log(`\n❌ ERROR:`);
      console.log(`   ${error.message}`);
      
      results.push({
        name: meal.name,
        accuracy: 0,
        iterations: 0,
        converged: false,
        error: error.message
      });
    }
    
    console.log('─────────────────────────────────────────────────────────');
  }
  
  // 4. RESUMEN FINAL
  console.log('\n\n');
  console.log('🏆 ═══════════════════════════════════════════════════════════');
  console.log('   RESUMEN FINAL DEL TEST');
  console.log('   ═══════════════════════════════════════════════════════════\n');
  
  const passedFilter = results.filter(r => r.accuracy >= 85);
  const failed = results.filter(r => r.accuracy < 85 && !r.error);
  const errors = results.filter(r => r.error);
  
  console.log(`📊 ESTADÍSTICAS:`);
  console.log(`   Total platos: ${results.length}`);
  console.log(`   ✅ Pasan filtro 85%: ${passedFilter.length} (${((passedFilter.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`   ❌ No pasan filtro: ${failed.length} (${((failed.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`   🔴 Errores: ${errors.length} (${((errors.length / results.length) * 100).toFixed(1)}%)`);
  
  console.log(`\n✅ PLATOS QUE PASAN (≥85%):`);
  passedFilter
    .sort((a, b) => b.accuracy - a.accuracy)
    .forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}: ${r.accuracy.toFixed(1)}%`);
    });
  
  console.log(`\n❌ PLATOS QUE NO PASAN (<85%):`);
  failed
    .sort((a, b) => b.accuracy - a.accuracy)
    .forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}: ${r.accuracy.toFixed(1)}%`);
    });
  
  if (errors.length > 0) {
    console.log(`\n🔴 ERRORES ENCONTRADOS:`);
    errors.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}: ${r.error}`);
    });
  }
  
  // 5. ANÁLISIS DE CONVERGENCIA
  console.log(`\n\n📈 ANÁLISIS DE CONVERGENCIA:`);
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
  const avgIterations = results.filter(r => !r.error).reduce((sum, r) => sum + r.iterations, 0) / results.filter(r => !r.error).length;
  
  console.log(`   Accuracy promedio: ${avgAccuracy.toFixed(1)}%`);
  console.log(`   Iteraciones promedio: ${avgIterations.toFixed(1)}`);
  
  const distribution = {
    perfect: results.filter(r => r.accuracy >= 98).length,
    excellent: results.filter(r => r.accuracy >= 95 && r.accuracy < 98).length,
    good: results.filter(r => r.accuracy >= 90 && r.accuracy < 95).length,
    acceptable: results.filter(r => r.accuracy >= 85 && r.accuracy < 90).length,
    poor: results.filter(r => r.accuracy >= 75 && r.accuracy < 85).length,
    failing: results.filter(r => r.accuracy < 75).length
  };
  
  console.log(`\n📊 DISTRIBUCIÓN DE ACCURACY:`);
  console.log(`   ⭐ Perfecto (≥98%):     ${distribution.perfect} platos`);
  console.log(`   ✨ Excelente (95-98%):  ${distribution.excellent} platos`);
  console.log(`   ✓ Bueno (90-95%):       ${distribution.good} platos`);
  console.log(`   ○ Aceptable (85-90%):   ${distribution.acceptable} platos`);
  console.log(`   ⚠️ Pobre (75-85%):      ${distribution.poor} platos`);
  console.log(`   ❌ Fallando (<75%):     ${distribution.failing} platos`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  // 6. CONCLUSIÓN
  if (passedFilter.length < 5) {
    console.log('🔴 PROBLEMA CRÍTICO DETECTADO:');
    console.log(`   Solo ${passedFilter.length} platos pasan el filtro de 85%`);
    console.log('   Se esperaba al menos 8-10 platos con las optimizaciones.\n');
    
    console.log('💡 POSIBLES CAUSAS:');
    console.log('   1. Los parámetros del AI Engine aún no son lo suficientemente agresivos');
    console.log('   2. El target de desayuno es muy específico y difícil de alcanzar');
    console.log('   3. Los ingredientes de Supabase no permiten ajustes precisos');
    console.log('   4. Hay bugs en el convergence loop del AI Engine\n');
    
    console.log('🛠️ ESTRATEGIAS PROPUESTAS:');
    console.log('   A) Aumentar aún más la agresividad inicial (1.3 → 1.5)');
    console.log('   B) Incrementar maxIterations (100 → 150)');
    console.log('   C) Reducir threshold de estancamiento (5 → 3)');
    console.log('   D) Aumentar tolerancias en el hybrid solver');
    console.log('   E) Implementar fallback más inteligente para platos complejos\n');
  } else if (passedFilter.length < 8) {
    console.log('⚠️ MEJORA NECESARIA:');
    console.log(`   ${passedFilter.length} platos pasan, pero el objetivo es 8+`);
    console.log('   Las optimizaciones están funcionando pero necesitan ajuste fino.\n');
  } else {
    console.log('✅ OBJETIVO ALCANZADO:');
    console.log(`   ${passedFilter.length} platos pasan el filtro de 85%`);
    console.log('   El AI Engine está funcionando correctamente.\n');
  }
}

runExhaustiveTest();
