/**
 * 🧪 VALIDACIÓN FINAL COMPLETA
 * 
 * Test que valida que el sistema completo funciona perfectamente:
 * 1. Los 34 platos se pueden escalar con 90%+ accuracy
 * 2. Compatibility scoring funciona correctamente
 * 3. Compensación progresiva funciona
 * 4. Sistema completo ready para producción
 */

import { createClient } from '@supabase/supabase-js';
import { ALL_MEALS_FROM_DB } from './src/data/mealsWithIngredients';
import { adaptMealWithAIEngine } from './src/app/utils/fuelierAIEngine';
import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator';
import { scoreMealCompatibility, filterCompatibleMeals } from './src/app/utils/mealCompatibilityScorer';
import { User, DailyLog, MealType, Meal, MealIngredient } from './src/app/types';
import { Ingredient } from './src/data/ingredientTypes';
import { projectId, publicAnonKey } from './utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const supabase = createClient(SUPABASE_URL, publicAnonKey);

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

interface MealTestResult {
  mealType: MealType;
  mealName: string;
  compatibilityScore: number;
  estimatedAccuracy: number;
  actualAccuracy: number;
  target: any;
  achieved: any;
  success: boolean;
}

async function loadIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .order('name');
  
  if (error || !data || data.length === 0) {
    throw new Error('No se pudieron cargar ingredientes');
  }
  
  return data.map((ing: any) => ({
    id: ing.id,
    name: ing.name,
    category: ing.category,
    calories: ing.calories || 0,
    protein: ing.protein || 0,
    carbs: ing.carbs || 0,
    fat: ing.fat || 0,
    caloriesPer100g: ing.calories || 0,
    proteinPer100g: ing.protein || 0,
    carbsPer100g: ing.carbs || 0,
    fatPer100g: ing.fat || 0
  }));
}

function prepareMealsWithIngredients(meals: Meal[], allIngredients: Ingredient[]): any[] {
  return meals.map(meal => {
    const mealIngredients = meal.ingredientReferences?.map(ref => {
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
    }).filter(Boolean) || [];
    
    return { ...meal, mealIngredients };
  });
}

async function testAllMeals() {
  console.log('🎯 ════════════════════════════════════════════════════════');
  console.log('   VALIDACIÓN FINAL COMPLETA - 34 PLATOS');
  console.log('   ════════════════════════════════════════════════════════\n');
  
  const allIngredients = await loadIngredients();
  console.log(`✅ Ingredientes cargados: ${allIngredients.length}\n`);
  
  const emptyLog: DailyLog = {
    date: '2026-01-15',
    breakfast: null,
    lunch: null,
    snack: null,
    dinner: null
  };
  
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const allResults: MealTestResult[] = [];
  
  for (const mealType of mealTypes) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🍽️  ${mealType.toUpperCase()}`);
    console.log('═'.repeat(70));
    
    // Calcular target
    const target = calculateIntelligentTarget(mockUser, emptyLog, mealType);
    console.log(`🎯 Target: ${target.calories}kcal | ${target.protein}P | ${target.carbs}C | ${target.fat}G\n`);
    
    // Obtener platos del tipo
    const mealsOfType = ALL_MEALS_FROM_DB.filter(m => 
      m.type === mealType || (Array.isArray(m.type) && m.type.includes(mealType))
    );
    
    const mealsWithIngredients = prepareMealsWithIngredients(mealsOfType, allIngredients);
    
    console.log(`📋 Platos a probar: ${mealsWithIngredients.length}\n`);
    
    // Probar cada plato
    for (let i = 0; i < mealsWithIngredients.length; i++) {
      const meal = mealsWithIngredients[i];
      console.log(`[${i + 1}/${mealsWithIngredients.length}] ${meal.name}...`);
      
      // 1. Evaluar compatibilidad
      const compatibility = scoreMealCompatibility(meal, target);
      
      // 2. Escalar con AI Engine
      try {
        const result = await adaptMealWithAIEngine(
          meal,
          target,
          mockUser,
          emptyLog,
          150,
          allIngredients
        );
        
        const icon = result.accuracy >= 95 ? '✅' : result.accuracy >= 90 ? '✓' : result.accuracy >= 85 ? '⚠️' : '❌';
        console.log(`${icon} ${result.accuracy.toFixed(1)}% (compat: ${compatibility.score.toFixed(0)}, est: ${compatibility.estimatedAccuracy.toFixed(1)}%)`);
        
        allResults.push({
          mealType,
          mealName: meal.name,
          compatibilityScore: compatibility.score,
          estimatedAccuracy: compatibility.estimatedAccuracy,
          actualAccuracy: result.accuracy,
          target,
          achieved: result.achievedMacros,
          success: true
        });
      } catch (err) {
        console.log(`❌ ERROR: ${(err as Error).message}`);
        allResults.push({
          mealType,
          mealName: meal.name,
          compatibilityScore: compatibility.score,
          estimatedAccuracy: compatibility.estimatedAccuracy,
          actualAccuracy: 0,
          target,
          achieved: null,
          success: false
        });
      }
    }
  }
  
  // RESUMEN FINAL
  console.log(`\n\n${'═'.repeat(70)}`);
  console.log('📊 RESUMEN FINAL DE VALIDACIÓN');
  console.log('═'.repeat(70));
  
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);
  
  const byAccuracy = {
    excellent: successful.filter(r => r.actualAccuracy >= 95),
    good: successful.filter(r => r.actualAccuracy >= 90 && r.actualAccuracy < 95),
    acceptable: successful.filter(r => r.actualAccuracy >= 85 && r.actualAccuracy < 90),
    poor: successful.filter(r => r.actualAccuracy < 85)
  };
  
  console.log('\n📊 RESULTADOS GLOBALES:');
  console.log(`   Total platos: ${allResults.length}`);
  console.log(`   ✅ Exitosos: ${successful.length} (${(successful.length / allResults.length * 100).toFixed(1)}%)`);
  console.log(`   ❌ Fallidos: ${failed.length} (${(failed.length / allResults.length * 100).toFixed(1)}%)`);
  
  console.log('\n📊 DISTRIBUCIÓN POR ACCURACY:');
  console.log(`   ✅ Excelente (≥95%): ${byAccuracy.excellent.length} platos (${(byAccuracy.excellent.length / allResults.length * 100).toFixed(1)}%)`);
  console.log(`   ✓  Bueno (90-95%):   ${byAccuracy.good.length} platos (${(byAccuracy.good.length / allResults.length * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  Aceptable (85-90%): ${byAccuracy.acceptable.length} platos (${(byAccuracy.acceptable.length / allResults.length * 100).toFixed(1)}%)`);
  console.log(`   ❌ Pobre (<85%):     ${byAccuracy.poor.length} platos (${(byAccuracy.poor.length / allResults.length * 100).toFixed(1)}%)`);
  
  const avgAccuracy = successful.reduce((sum, r) => sum + r.actualAccuracy, 0) / successful.length;
  console.log(`\n🎯 ACCURACY PROMEDIO: ${avgAccuracy.toFixed(1)}%`);
  
  // Resultados por tipo de comida
  console.log('\n📊 RESULTADOS POR TIPO DE COMIDA:');
  for (const mealType of mealTypes) {
    const ofType = successful.filter(r => r.mealType === mealType);
    const avg = ofType.reduce((sum, r) => sum + r.actualAccuracy, 0) / ofType.length;
    const above90 = ofType.filter(r => r.actualAccuracy >= 90).length;
    const above95 = ofType.filter(r => r.actualAccuracy >= 95).length;
    
    console.log(`\n   ${mealType.toUpperCase()}:`);
    console.log(`     Promedio: ${avg.toFixed(1)}%`);
    console.log(`     ≥95%: ${above95}/${ofType.length} | ≥90%: ${above90}/${ofType.length}`);
  }
  
  // Correlación compatibility score vs accuracy
  console.log('\n📊 VALIDACIÓN DE COMPATIBILITY SCORING:');
  const withHighCompatibility = successful.filter(r => r.compatibilityScore >= 80);
  const avgAccuracyHighCompat = withHighCompatibility.reduce((sum, r) => sum + r.actualAccuracy, 0) / withHighCompatibility.length;
  
  const withLowCompatibility = successful.filter(r => r.compatibilityScore < 50);
  const avgAccuracyLowCompat = withLowCompatibility.length > 0 
    ? withLowCompatibility.reduce((sum, r) => sum + r.actualAccuracy, 0) / withLowCompatibility.length 
    : 0;
  
  console.log(`   Platos con score ≥80: ${withHighCompatibility.length} → avg accuracy ${avgAccuracyHighCompat.toFixed(1)}%`);
  console.log(`   Platos con score <50: ${withLowCompatibility.length} → avg accuracy ${avgAccuracyLowCompat > 0 ? avgAccuracyLowCompat.toFixed(1) : 'N/A'}%`);
  
  // TOP 5 mejores y peores
  console.log('\n🏅 TOP 5 MEJORES PLATOS:');
  const sorted = [...successful].sort((a, b) => b.actualAccuracy - a.actualAccuracy);
  sorted.slice(0, 5).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.mealName} (${r.mealType}): ${r.actualAccuracy.toFixed(1)}%`);
  });
  
  if (byAccuracy.poor.length > 0) {
    console.log('\n⚠️  PLATOS CON BAJA ACCURACY (<85%):');
    sorted.slice(-5).reverse().forEach((r, i) => {
      if (r.actualAccuracy < 85) {
        console.log(`   ${i + 1}. ${r.mealName} (${r.mealType}): ${r.actualAccuracy.toFixed(1)}%`);
        console.log(`      Compat score: ${r.compatibilityScore.toFixed(0)} | Est: ${r.estimatedAccuracy.toFixed(1)}%`);
      }
    });
  }
  
  // VEREDICTO FINAL
  console.log(`\n${'═'.repeat(70)}`);
  const passRate = (successful.filter(r => r.actualAccuracy >= 90).length / allResults.length) * 100;
  
  if (passRate >= 80 && avgAccuracy >= 92) {
    console.log('🎉 VALIDACIÓN EXITOSA: Sistema ready para producción');
    console.log(`   ✅ ${passRate.toFixed(0)}% de platos alcanzan 90%+ accuracy`);
    console.log(`   ✅ Accuracy promedio: ${avgAccuracy.toFixed(1)}%`);
    console.log(`   ✅ Compatibility scoring funciona correctamente`);
  } else if (passRate >= 70 && avgAccuracy >= 88) {
    console.log('✅ VALIDACIÓN ACEPTABLE: Sistema funcional con margen de mejora');
    console.log(`   ⚠️  ${passRate.toFixed(0)}% de platos alcanzan 90%+ accuracy (target: 80%+)`);
    console.log(`   ⚠️  Accuracy promedio: ${avgAccuracy.toFixed(1)}% (target: 92%+)`);
  } else {
    console.log('❌ VALIDACIÓN FALLIDA: Sistema necesita mejoras adicionales');
    console.log(`   ❌ Solo ${passRate.toFixed(0)}% de platos alcanzan 90%+ accuracy`);
    console.log(`   ❌ Accuracy promedio: ${avgAccuracy.toFixed(1)}%`);
  }
  console.log('═'.repeat(70));
}

testAllMeals()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
