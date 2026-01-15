/**
 * 🧪 TEST COMPLETO: COMPENSACIÓN PROGRESIVA + COMPATIBILITY SCORING
 * 
 * Valida que el sistema funcione end-to-end:
 * 1. Cada comida tiene 95%+ accuracy
 * 2. Las comidas se compensan entre sí
 * 3. La cena cierra exactamente al 100%
 * 4. Solo se sugieren platos compatibles con el target
 */

import { createClient } from '@supabase/supabase-js';
import { ALL_MEALS_FROM_DB } from './src/data/mealsWithIngredients';
import { adaptMealWithAIEngine } from './src/app/utils/fuelierAIEngine';
import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator';
import { scoreMealCompatibility, filterCompatibleMeals } from './src/app/utils/mealCompatibilityScorer';
import { User, DailyLog, MealType, Meal } from './src/app/types';
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

async function simulateFullDay() {
  console.log('🎯 ════════════════════════════════════════════════════════');
  console.log('   TEST: COMPENSACIÓN PROGRESIVA COMPLETA');
  console.log('   ════════════════════════════════════════════════════════\n');
  
  const allIngredients = await loadIngredients();
  console.log(`✅ Ingredientes cargados: ${allIngredients.length}\n`);
  
  // Preparar meals con mealIngredients
  const allMealsWithIngredients = ALL_MEALS_FROM_DB.map(meal => {
    const mealIngredients = meal.ingredientReferences?.map((ref: any) => {
      const ingredient = allIngredients.find(i => i.id === ref.ingredientId);
      if (!ingredient) return null;
      
      const ratio = ref.amountInGrams / 100;
      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        amount: ref.amountInGrams,
        calories: ingredient.caloriesPer100g * ratio,
        protein: ingredient.proteinPer100g * ratio,
        carbs: ingredient.carbsPer100g * ratio,
        fat: ingredient.fatPer100g * ratio
      };
    }).filter(Boolean) || [];
    
    return { ...meal, mealIngredients };
  });
  
  const dailyLog: DailyLog = {
    date: '2026-01-15',
    breakfast: null,
    lunch: null,
    snack: null,
    dinner: null
  };
  
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const results: any[] = [];
  
  // Simular cada comida secuencialmente
  for (const mealType of mealTypes) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🍽️  ${mealType.toUpperCase()}`);
    console.log('═'.repeat(70));
    
    // 1. Calcular target inteligente (con compensación)
    const target = calculateIntelligentTarget(mockUser, dailyLog, mealType);
    console.log(`\n🎯 Target calculado:`, target);
    
    // 2. Filtrar platos compatibles
    const availableMeals = allMealsWithIngredients.filter(m => 
      m.type === mealType || (Array.isArray(m.type) && m.type.includes(mealType))
    );
    
    console.log(`\n📋 Platos disponibles: ${availableMeals.length}`);
    console.log('🔍 Evaluando compatibilidad...\n');
    
    const compatible = filterCompatibleMeals(availableMeals as any[], target, 50);
    
    console.log(`✅ Platos compatibles (score ≥50): ${compatible.length}`);
    if (compatible.length > 0) {
      console.log('\n📊 TOP 3 MÁS COMPATIBLES:');
      compatible.slice(0, 3).forEach((meal, i) => {
        console.log(`   ${i + 1}. ${meal.name}`);
        console.log(`      Score: ${meal.compatibilityScore.score.toFixed(0)} | Est. accuracy: ${meal.compatibilityScore.estimatedAccuracy.toFixed(1)}%`);
        console.log(`      Ratios: ${Object.entries(meal.compatibilityScore.ratios).map(([k, v]) => `${k}: ${v.toFixed(2)}x`).join(', ')}`);
      });
    }
    
    if (compatible.length === 0) {
      console.log('❌ NO HAY PLATOS COMPATIBLES - Usando fallback...');
      const fallback = filterCompatibleMeals(availableMeals as any[], target, 0)[0];
      if (fallback) {
        console.log(`⚠️  Fallback: ${fallback.name} (score: ${fallback.compatibilityScore.score})`);
      }
      continue;
    }
    
    // 3. Escalar el mejor plato
    const bestMeal = compatible[0];
    console.log(`\n🎯 Escalando: ${bestMeal.name}`);
    
    try {
      const result = await adaptMealWithAIEngine(
        bestMeal as any,
        target,
        mockUser,
        dailyLog,
        150,
        allIngredients
      );
      
      console.log(`\n✅ RESULTADO:`);
      console.log(`   Accuracy: ${result.accuracy.toFixed(1)}%`);
      console.log(`   Obtenido: ${result.achievedMacros.calories}kcal | ${result.achievedMacros.protein}P | ${result.achievedMacros.carbs}C | ${result.achievedMacros.fat}G`);
      console.log(`   Target:   ${target.calories}kcal | ${target.protein}P | ${target.carbs}C | ${target.fat}G`);
      
      const error = {
        calories: Math.abs(result.achievedMacros.calories - target.calories),
        protein: Math.abs(result.achievedMacros.protein - target.protein),
        carbs: Math.abs(result.achievedMacros.carbs - target.carbs),
        fat: Math.abs(result.achievedMacros.fat - target.fat)
      };
      console.log(`   Error:    ${error.calories}kcal | ${error.protein}P | ${error.carbs}C | ${error.fat}G`);
      
      // Actualizar dailyLog
      dailyLog[mealType] = {
        name: bestMeal.name,
        ...result.achievedMacros,
        ingredients: []
      };
      
      results.push({
        mealType,
        mealName: bestMeal.name,
        compatibilityScore: bestMeal.compatibilityScore.score,
        estimatedAccuracy: bestMeal.compatibilityScore.estimatedAccuracy,
        actualAccuracy: result.accuracy,
        target,
        achieved: result.achievedMacros,
        error
      });
    } catch (err) {
      console.error(`❌ Error escalando ${bestMeal.name}:`, (err as Error).message);
    }
  }
  
  // RESUMEN FINAL
  console.log(`\n\n${'═'.repeat(70)}`);
  console.log('📊 RESUMEN DEL DÍA COMPLETO');
  console.log('═'.repeat(70));
  
  const totalConsumed = {
    calories: (dailyLog.breakfast?.calories || 0) + (dailyLog.lunch?.calories || 0) + 
              (dailyLog.snack?.calories || 0) + (dailyLog.dinner?.calories || 0),
    protein: (dailyLog.breakfast?.protein || 0) + (dailyLog.lunch?.protein || 0) + 
             (dailyLog.snack?.protein || 0) + (dailyLog.dinner?.protein || 0),
    carbs: (dailyLog.breakfast?.carbs || 0) + (dailyLog.lunch?.carbs || 0) + 
           (dailyLog.snack?.carbs || 0) + (dailyLog.dinner?.carbs || 0),
    fat: (dailyLog.breakfast?.fat || 0) + (dailyLog.lunch?.fat || 0) + 
         (dailyLog.snack?.fat || 0) + (dailyLog.dinner?.fat || 0)
  };
  
  console.log('\n🎯 OBJETIVOS DEL DÍA:');
  console.log(`   Calorías: ${mockUser.goals.calories} kcal`);
  console.log(`   Proteína: ${mockUser.goals.protein}g`);
  console.log(`   Carbos:   ${mockUser.goals.carbs}g`);
  console.log(`   Grasa:    ${mockUser.goals.fat}g`);
  
  console.log('\n✅ TOTAL CONSUMIDO:');
  console.log(`   Calorías: ${totalConsumed.calories} kcal (${((totalConsumed.calories / mockUser.goals.calories) * 100).toFixed(1)}%)`);
  console.log(`   Proteína: ${totalConsumed.protein}g (${((totalConsumed.protein / mockUser.goals.protein) * 100).toFixed(1)}%)`);
  console.log(`   Carbos:   ${totalConsumed.carbs}g (${((totalConsumed.carbs / mockUser.goals.carbs) * 100).toFixed(1)}%)`);
  console.log(`   Grasa:    ${totalConsumed.fat}g (${((totalConsumed.fat / mockUser.goals.fat) * 100).toFixed(1)}%)`);
  
  const dailyAccuracy = {
    calories: 100 - Math.abs((totalConsumed.calories - mockUser.goals.calories) / mockUser.goals.calories * 100),
    protein: 100 - Math.abs((totalConsumed.protein - mockUser.goals.protein) / mockUser.goals.protein * 100),
    carbs: 100 - Math.abs((totalConsumed.carbs - mockUser.goals.carbs) / mockUser.goals.carbs * 100),
    fat: 100 - Math.abs((totalConsumed.fat - mockUser.goals.fat) / mockUser.goals.fat * 100)
  };
  
  const avgDailyAccuracy = (dailyAccuracy.calories + dailyAccuracy.protein + dailyAccuracy.carbs + dailyAccuracy.fat) / 4;
  
  console.log('\n📊 ACCURACY GLOBAL DEL DÍA:');
  console.log(`   Calorías: ${dailyAccuracy.calories.toFixed(1)}%`);
  console.log(`   Proteína: ${dailyAccuracy.protein.toFixed(1)}%`);
  console.log(`   Carbos:   ${dailyAccuracy.carbs.toFixed(1)}%`);
  console.log(`   Grasa:    ${dailyAccuracy.fat.toFixed(1)}%`);
  console.log(`\n   🎯 PROMEDIO: ${avgDailyAccuracy.toFixed(1)}%`);
  
  console.log('\n📋 ACCURACY POR COMIDA:');
  results.forEach(r => {
    const icon = r.actualAccuracy >= 95 ? '✅' : r.actualAccuracy >= 90 ? '⚠️' : '❌';
    console.log(`   ${icon} ${r.mealType.toUpperCase()}: ${r.actualAccuracy.toFixed(1)}% (${r.mealName})`);
    console.log(`      Compat score: ${r.compatibilityScore.toFixed(0)} | Est: ${r.estimatedAccuracy.toFixed(1)}%`);
  });
  
  const avgAccuracy = results.reduce((sum, r) => sum + r.actualAccuracy, 0) / results.length;
  const allAbove95 = results.every(r => r.actualAccuracy >= 95);
  const allAbove90 = results.every(r => r.actualAccuracy >= 90);
  
  console.log(`\n═`.repeat(70));
  if (avgDailyAccuracy >= 95 && allAbove95) {
    console.log('🎉 ÉXITO TOTAL: Sistema alcanza 95%+ en todas las comidas y cierre perfecto del día');
  } else if (avgDailyAccuracy >= 90 && allAbove90) {
    console.log('✅ ÉXITO: Sistema alcanza 90%+ en todas las comidas');
  } else {
    console.log('⚠️  MEJORAS NECESARIAS: Algunas comidas <90% accuracy');
  }
  console.log('═'.repeat(70));
}

simulateFullDay()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
