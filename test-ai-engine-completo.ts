/**
 * 🧪 PRUEBAS EXHAUSTIVAS DEL AI ENGINE
 * 
 * Analiza cada plato individualmente para identificar:
 * - Ingredientes faltantes
 * - Targets inalcanzables
 * - Problemas de escalado
 * - Macros incorrectos
 */

import { createClient } from '@supabase/supabase-js';
import { ALL_MEALS_FROM_DB } from './src/data/mealsWithIngredients';
import { INGREDIENTS_DATABASE } from './src/data/ingredientsDatabase';
import { adaptMealWithAIEngine } from './src/app/utils/fuelierAIEngine';
import { calculateIntelligentTarget } from './src/app/utils/automaticTargetCalculator';
import { Meal, User, DailyLog, MealType, MealIngredient } from './src/app/types';
import { Ingredient, MealIngredientReference, calculateMacrosFromIngredients } from './src/data/ingredientTypes';
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
    calories: 2500,  // ✅ CORREGIDO: "calories" no "dailyCalories"
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
  success: boolean;
  accuracy: number;
  maxErrorAccuracy: number;
  target: any;
  achieved: any;
  errors: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  problems: string[];
  ingredientAnalysis: {
    total: number;
    missing: string[];
    valid: string[];
  };
  theoreticalMax: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
  isTargetAchievable: boolean;
}

async function loadIngredients(): Promise<Ingredient[]> {
  console.log('📦 Cargando ingredientes desde Supabase...\n');
  
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('❌ Error cargando ingredientes:', error);
    console.log('⚠️  Usando INGREDIENTS_DATABASE local como fallback\n');
    return INGREDIENTS_DATABASE;
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️  Supabase vacío - usando INGREDIENTS_DATABASE local\n');
    return INGREDIENTS_DATABASE;
  }
  
  // Formatear ingredientes
  const ingredients: Ingredient[] = data.map((ing: any) => ({
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
  
  console.log(`✅ Cargados ${ingredients.length} ingredientes desde Supabase\n`);
  return ingredients;
}

function analyzeIngredients(meal: Meal, allIngredients: Ingredient[]): {
  total: number;
  missing: string[];
  valid: string[];
} {
  const ingredientRefs = meal.ingredientReferences || [];
  const missing: string[] = [];
  const valid: string[] = [];
  
  for (const ref of ingredientRefs) {
    const exists = allIngredients.find(ing => ing.id === ref.ingredientId);
    if (!exists) {
      missing.push(ref.ingredientId);
    } else {
      valid.push(ref.ingredientId);
    }
  }
  
  return {
    total: ingredientRefs.length,
    missing,
    valid
  };
}

function calculateTheoreticalMax(meal: Meal, allIngredients: Ingredient[]): {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
} {
  const ingredientRefs = meal.ingredientReferences || [];
  
  // Calcular el máximo multiplicando cada ingrediente por 5x su cantidad base
  let maxProtein = 0;
  let maxCarbs = 0;
  let maxFat = 0;
  let maxCalories = 0;
  
  for (const ref of ingredientRefs) {
    const ingredient = allIngredients.find(ing => ing.id === ref.ingredientId);
    if (!ingredient) continue;
    
    // Asumir que podemos escalar hasta 5x la cantidad base
    const maxAmount = ref.amountInGrams * 5;
    const factor = maxAmount / 100; // Ingredientes de Supabase usan macrosPer100g
    
    maxProtein += ((ingredient as any).proteinPer100g || 0) * factor;
    maxCarbs += ((ingredient as any).carbsPer100g || 0) * factor;
    maxFat += ((ingredient as any).fatPer100g || 0) * factor;
    maxCalories += ((ingredient as any).caloriesPer100g || 0) * factor;
  }
  
  return {
    protein: maxProtein,
    carbs: maxCarbs,
    fat: maxFat,
    calories: maxCalories
  };
}

function analyzeAchievability(target: any, theoreticalMax: any, ingredients: any): {
  isAchievable: boolean;
  problems: string[];
} {
  const problems: string[] = [];
  let isAchievable = true;
  
  // Verificar cada macro
  if (target.protein > theoreticalMax.protein * 0.95) {
    problems.push(`⚠️  Proteína: Target ${target.protein}g vs Max teórico ${theoreticalMax.protein.toFixed(1)}g`);
    isAchievable = false;
  }
  
  if (target.carbs > theoreticalMax.carbs * 0.95) {
    problems.push(`⚠️  Carbos: Target ${target.carbs}g vs Max teórico ${theoreticalMax.carbs.toFixed(1)}g`);
    isAchievable = false;
  }
  
  if (target.fat > theoreticalMax.fat * 0.95) {
    problems.push(`⚠️  Grasa: Target ${target.fat}g vs Max teórico ${theoreticalMax.fat.toFixed(1)}g`);
    isAchievable = false;
  }
  
  // Verificar ingredientes faltantes
  if (ingredients.missing.length > 0) {
    problems.push(`❌ Ingredientes faltantes: ${ingredients.missing.join(', ')}`);
    isAchievable = false;
  }
  
  return { isAchievable, problems };
}

async function testMeal(meal: Meal, allIngredients: Ingredient[], target: any): Promise<TestResult> {
  const ingredientAnalysis = analyzeIngredients(meal, allIngredients);
  const theoreticalMax = calculateTheoreticalMax(meal, allIngredients);
  const achievability = analyzeAchievability(target, theoreticalMax, ingredientAnalysis);
  
  // 🔧 CONVERSIÓN CRÍTICA: ingredientReferences → mealIngredients
  // El AI Engine necesita mealIngredients, pero los meals de Supabase usan ingredientReferences
  const mealIngredients: MealIngredient[] = meal.ingredientReferences?.map(ref => {
    const ingredient = allIngredients.find(i => i.id === ref.ingredientId);
    if (!ingredient) {
      console.log(`⚠️  Ingrediente no encontrado: ${ref.ingredientId}`);
      return null;
    }

    // Calcular macros para la cantidad especificada (ingredientes de Supabase usan macrosPer100g)
    const ratio = ref.amountInGrams / 100;
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      amount: ref.amountInGrams,
      calories: (ingredient as any).caloriesPer100g * ratio,
      protein: (ingredient as any).proteinPer100g * ratio,
      carbs: (ingredient as any).carbsPer100g * ratio,
      fat: (ingredient as any).fatPer100g * ratio
    };
  }).filter((ing): ing is MealIngredient => ing !== null) || [];

  if (mealIngredients.length === 0) {
    throw new Error(`No se pudieron convertir ingredientes para "${meal.name}"`);
  }

  // 🔍 DEBUG: Ver qué ingredientes se generaron
  console.log(`📦 MealIngredients generados (${mealIngredients.length}):`);
  mealIngredients.forEach(ing => {
    console.log(`   - ${ing.amount}g ${ing.ingredientName}: ${ing.protein.toFixed(1)}P | ${ing.carbs.toFixed(1)}C | ${ing.fat.toFixed(1)}F | ${ing.calories.toFixed(0)}cal`);
  });

  // Crear meal con mealIngredients (igual que preciseIngredientScaling.ts)
  const mealForEngine = {
    ...meal,
    ingredients: mealIngredients.map(i => `${i.amount}g ${i.ingredientName}`)
  };
  (mealForEngine as any).mealIngredients = mealIngredients;

  // 🔍 DEBUG: Verificar que mealIngredients está correctamente asignado
  console.log(`🔍 Verificando meal para AI Engine:`);
  console.log(`   - meal.name: ${mealForEngine.name}`);
  console.log(`   - meal.mealIngredients: ${(mealForEngine as any).mealIngredients ? 'PRESENTE' : 'AUSENTE'}`);
  console.log(`   - meal.mealIngredients.length: ${(mealForEngine as any).mealIngredients?.length || 0}`);
  
  // Intentar escalar con AI Engine
  try {
    const result = await adaptMealWithAIEngine(
      mealForEngine,
      target,
      mockUser,        // ✅ user (no 'breakfast')
      emptyLog,        // ✅ dailyLog
      100,             // ✅ maxIterations
      allIngredients   // ✅ allIngredients
    );
    
    const errors = {
      calories: Math.abs(result.achievedMacros.calories - target.calories),
      protein: Math.abs(result.achievedMacros.protein - target.protein),
      carbs: Math.abs(result.achievedMacros.carbs - target.carbs),
      fat: Math.abs(result.achievedMacros.fat - target.fat)
    };
    
    return {
      meal,
      success: true,
      accuracy: result.accuracy,
      maxErrorAccuracy: 0, // Not available in HybridSolution
      target,
      achieved: result.achievedMacros,
      errors,
      problems: achievability.problems,
      ingredientAnalysis,
      theoreticalMax,
      isTargetAchievable: achievability.isAchievable
    };
  } catch (error) {
    return {
      meal,
      success: false,
      accuracy: 0,
      maxErrorAccuracy: 0,
      target,
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      errors: {
        calories: target.calories,
        protein: target.protein,
        carbs: target.carbs,
        fat: target.fat
      },
      problems: [...achievability.problems, `❌ Error: ${(error as Error).message}`],
      ingredientAnalysis,
      theoreticalMax,
      isTargetAchievable: false
    };
  }
}

async function runTests() {
  console.log('🧪 ════════════════════════════════════════════════════════');
  console.log('   PRUEBAS EXHAUSTIVAS DEL AI ENGINE');
  console.log('   ════════════════════════════════════════════════════════\n');
  
  // 1. Cargar ingredientes
  const allIngredients = await loadIngredients();
  
  // 2. Calcular target
  const target = calculateIntelligentTarget(mockUser, emptyLog, 'breakfast');
  console.log('🎯 TARGET CALCULADO:');
  console.log(`   Calorías: ${target.calories} kcal`);
  console.log(`   Proteína: ${target.protein}g`);
  console.log(`   Carbos:   ${target.carbs}g`);
  console.log(`   Grasa:    ${target.fat}g\n`);
  
  // 3. Obtener platos de desayuno
  const breakfastMeals = ALL_MEALS_FROM_DB.filter(m => 
    m.type === 'breakfast' || (Array.isArray(m.type) && m.type.includes('breakfast'))
  );
  
  console.log(`📋 Platos a probar: ${breakfastMeals.length}\n`);
  console.log('═'.repeat(70));
  console.log('\n');
  
  // 4. Probar cada plato
  const results: TestResult[] = [];
  
  for (let i = 0; i < breakfastMeals.length; i++) {
    const meal = breakfastMeals[i];
    console.log(`📍 [${i + 1}/${breakfastMeals.length}] ${meal.name}`);
    console.log('─'.repeat(70));
    
    const result = await testMeal(meal, allIngredients, target);
    results.push(result);
    
    // Mostrar resultado inmediato
    if (result.success) {
      const statusIcon = result.accuracy >= 95 ? '✅' : result.accuracy >= 90 ? '⚠️' : '❌';
      console.log(`${statusIcon} Accuracy: ${result.accuracy.toFixed(1)}% (MAX error: ${result.maxErrorAccuracy.toFixed(1)}%)`);
      console.log(`   Obtenido: ${result.achieved.calories.toFixed(0)}kcal | ${result.achieved.protein.toFixed(0)}P | ${result.achieved.carbs.toFixed(0)}C | ${result.achieved.fat.toFixed(0)}G`);
      console.log(`   Error: ${result.errors.calories.toFixed(0)}kcal | ${result.errors.protein.toFixed(1)}P | ${result.errors.carbs.toFixed(1)}C | ${result.errors.fat.toFixed(1)}G`);
    } else {
      console.log('❌ FALLO AL ESCALAR');
    }
    
    // Mostrar ingredientes
    console.log(`   Ingredientes: ${result.ingredientAnalysis.total} (${result.ingredientAnalysis.valid.length} válidos, ${result.ingredientAnalysis.missing.length} faltantes)`);
    
    if (result.ingredientAnalysis.missing.length > 0) {
      console.log(`   ❌ Faltantes: ${result.ingredientAnalysis.missing.join(', ')}`);
    }
    
    // Mostrar si es alcanzable
    if (!result.isTargetAchievable) {
      console.log(`   ⚠️  TARGET NO ALCANZABLE con estos ingredientes`);
      result.problems.forEach(p => console.log(`      ${p}`));
    }
    
    console.log('');
  }
  
  // 5. RESUMEN FINAL
  console.log('\n');
  console.log('🏆 ════════════════════════════════════════════════════════');
  console.log('   RESUMEN DE RESULTADOS');
  console.log('   ════════════════════════════════════════════════════════\n');
  
  const successful = results.filter(r => r.success);
  const excellent = results.filter(r => r.accuracy >= 95);
  const good = results.filter(r => r.accuracy >= 90 && r.accuracy < 95);
  const acceptable = results.filter(r => r.accuracy >= 85 && r.accuracy < 90);
  const poor = results.filter(r => r.accuracy > 0 && r.accuracy < 85);
  const failed = results.filter(r => !r.success);
  
  console.log('📊 DISTRIBUCIÓN DE ACCURACY:');
  console.log(`   ✅ Excelente (≥95%):  ${excellent.length} platos (${(excellent.length / results.length * 100).toFixed(1)}%)`);
  console.log(`   ✓  Bueno (90-95%):    ${good.length} platos (${(good.length / results.length * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  Aceptable (85-90%): ${acceptable.length} platos (${(acceptable.length / results.length * 100).toFixed(1)}%)`);
  console.log(`   ❌ Pobre (<85%):      ${poor.length} platos (${(poor.length / results.length * 100).toFixed(1)}%)`);
  console.log(`   💥 Falló:             ${failed.length} platos (${(failed.length / results.length * 100).toFixed(1)}%)\n`);
  
  // 6. ANÁLISIS DE PROBLEMAS
  console.log('🔍 PROBLEMAS IDENTIFICADOS:\n');
  
  const withMissingIngredients = results.filter(r => r.ingredientAnalysis.missing.length > 0);
  const unachievableTargets = results.filter(r => !r.isTargetAchievable);
  
  if (withMissingIngredients.length > 0) {
    console.log(`❌ INGREDIENTES FALTANTES (${withMissingIngredients.length} platos):`);
    withMissingIngredients.forEach(r => {
      console.log(`   - ${r.meal.name}: ${r.ingredientAnalysis.missing.join(', ')}`);
    });
    console.log('');
  }
  
  if (unachievableTargets.length > 0) {
    console.log(`⚠️  TARGETS NO ALCANZABLES (${unachievableTargets.length} platos):`);
    unachievableTargets.forEach(r => {
      console.log(`   \n   ${r.meal.name}:`);
      console.log(`   Target: ${r.target.protein}P | ${r.target.carbs}C | ${r.target.fat}G`);
      console.log(`   Max teórico: ${r.theoreticalMax.protein.toFixed(0)}P | ${r.theoreticalMax.carbs.toFixed(0)}C | ${r.theoreticalMax.fat.toFixed(0)}G`);
      r.problems.forEach(p => console.log(`   ${p}`));
    });
    console.log('');
  }
  
  // 7. TOP 5 MEJORES Y PEORES
  console.log('\n🏅 TOP 5 MEJORES PLATOS:');
  const sortedByAccuracy = [...results].sort((a, b) => b.accuracy - a.accuracy);
  sortedByAccuracy.slice(0, 5).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.meal.name}: ${r.accuracy.toFixed(1)}% (MAX error: ${r.maxErrorAccuracy.toFixed(1)}%)`);
  });
  
  console.log('\n⚠️  TOP 5 PEORES PLATOS:');
  sortedByAccuracy.slice(-5).reverse().forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.meal.name}: ${r.accuracy.toFixed(1)}%`);
    if (r.problems.length > 0) {
      console.log(`      Problemas: ${r.problems[0]}`);
    }
  });
  
  // 8. RECOMENDACIONES
  console.log('\n\n💡 RECOMENDACIONES:\n');
  
  if (withMissingIngredients.length > 0) {
    console.log('1️⃣  SINCRONIZAR INGREDIENTES:');
    const allMissing = new Set<string>();
    withMissingIngredients.forEach(r => {
      r.ingredientAnalysis.missing.forEach(id => allMissing.add(id));
    });
    console.log(`   Ingredientes faltantes en Supabase: ${Array.from(allMissing).join(', ')}`);
    console.log('   Acción: Verificar que estos ingredientes existan en base_ingredients\n');
  }
  
  if (excellent.length < results.length * 0.7) {
    console.log('2️⃣  MEJORAR AI ENGINE:');
    console.log(`   Solo ${excellent.length}/${results.length} platos alcanzan 95%+`);
    console.log('   Opciones:');
    console.log('   a) Aumentar maxIterations (actualmente en el código)');
    console.log('   b) Ajustar aggressiveness (actualmente en el código)');
    console.log('   c) Revisar ingredientes de platos con baja accuracy\n');
  }
  
  if (unachievableTargets.length > 0) {
    console.log('3️⃣  AJUSTAR COMPOSICIÓN DE PLATOS:');
    console.log('   Algunos platos no pueden alcanzar el target con sus ingredientes');
    console.log('   Opciones:');
    console.log('   a) Agregar ingredientes altos en el macro faltante');
    console.log('   b) Usar targets personalizados por plato');
    console.log('   c) Aumentar cantidades base de ingredientes clave\n');
  }
  
  // 9. VEREDICTO FINAL
  console.log('\n═'.repeat(70));
  const successRate = (excellent.length / results.length * 100).toFixed(1);
  if (excellent.length >= results.length * 0.7) {
    console.log(`✅ VEREDICTO: SISTEMA FUNCIONANDO BIEN (${successRate}% excelente)`);
  } else if (excellent.length >= results.length * 0.5) {
    console.log(`⚠️  VEREDICTO: SISTEMA NECESITA MEJORAS (${successRate}% excelente)`);
  } else {
    console.log(`❌ VEREDICTO: SISTEMA NECESITA TRABAJO URGENTE (${successRate}% excelente)`);
  }
  console.log('═'.repeat(70));
}

runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
