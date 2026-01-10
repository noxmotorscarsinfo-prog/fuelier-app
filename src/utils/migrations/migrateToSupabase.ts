import { supabase } from '../supabaseClient';
import { getMealsData } from '../../app/data/mealsGenerator';
import { baseIngredients } from '../../app/data/ingredients';

/**
 * Migración completa de localStorage a Supabase
 * ⚠️ EJECUTAR SOLO UNA VEZ AL CONFIGURAR LA APP
 */
export async function migrateToSupabase(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  console.log('🚀 Iniciando migración a Supabase...');

  try {
    // 1. Migrar ingredientes base
    console.log('📦 Migrando ingredientes base...');
    const ingredientsResult = await migrateBaseIngredients();
    console.log(`✅ ${ingredientsResult.count} ingredientes migrados`);

    // 2. Migrar platos base
    console.log('🍽️ Migrando platos base...');
    const mealsResult = await migrateBaseMeals();
    console.log(`✅ ${mealsResult.count} platos migrados`);

    // 3. Migrar bug reports
    console.log('🐛 Migrando bug reports...');
    const bugReportsResult = await migrateBugReports();
    console.log(`✅ ${bugReportsResult.count} bug reports migrados`);

    console.log('🎉 Migración completada con éxito!');

    return {
      success: true,
      message: 'Migración completada exitosamente',
      details: {
        ingredients: ingredientsResult.count,
        meals: mealsResult.count,
        bugReports: bugReportsResult.count
      }
    };
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    return {
      success: false,
      message: `Error durante la migración: ${error}`
    };
  }
}

/**
 * Migrar ingredientes base de localStorage a Supabase
 */
async function migrateBaseIngredients(): Promise<{ count: number }> {
  // Obtener ingredientes de localStorage
  let storedIngredients: string | null = null;
  try {
    storedIngredients = localStorage.getItem('baseIngredients');
  } catch (error) {
    console.error('Error al leer baseIngredients de localStorage:', error);
  }
  let ingredients = storedIngredients ? JSON.parse(storedIngredients) : baseIngredients;

  // Verificar si ya existen ingredientes en Supabase
  const { data: existing, error: checkError } = await supabase
    .from('base_ingredients')
    .select('id')
    .limit(1);

  if (checkError) {
    throw new Error(`Error verificando ingredientes existentes: ${checkError.message}`);
  }

  // Si ya hay ingredientes, no migrar de nuevo
  if (existing && existing.length > 0) {
    console.log('⚠️ Ingredientes base ya existen en Supabase, saltando migración');
    return { count: 0 };
  }

  // Insertar ingredientes en Supabase
  const ingredientsToInsert = ingredients.map((ing: any) => ({
    id: ing.id,
    name: ing.name,
    calories: ing.calories,
    protein: ing.protein,
    carbs: ing.carbs,
    fat: ing.fat,
    category: determineIngredientCategory(ing.id)
  }));

  const { error: insertError } = await supabase
    .from('base_ingredients')
    .insert(ingredientsToInsert);

  if (insertError) {
    throw new Error(`Error insertando ingredientes: ${insertError.message}`);
  }

  return { count: ingredientsToInsert.length };
}

/**
 * Migrar platos base de los generados a Supabase
 */
async function migrateBaseMeals(): Promise<{ count: number }> {
  // Obtener los 200 platos generados
  const generatedMeals = getMealsData();

  // Verificar si ya existen platos en Supabase
  const { data: existing, error: checkError } = await supabase
    .from('base_meals')
    .select('id')
    .limit(1);

  if (checkError) {
    throw new Error(`Error verificando platos existentes: ${checkError.message}`);
  }

  // Si ya hay platos, no migrar de nuevo
  if (existing && existing.length > 0) {
    console.log('⚠️ Platos base ya existen en Supabase, saltando migración');
    return { count: 0 };
  }

  // Insertar platos en Supabase
  const mealsToInsert = generatedMeals.map((meal: any) => ({
    id: meal.id,
    name: meal.name,
    meal_types: Array.isArray(meal.type) ? meal.type : [meal.type],
    variant: meal.variant || null,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    base_quantity: meal.baseQuantity || 100,
    ingredients: meal.ingredients || [],
    ingredient_references: meal.ingredientReferences || null,
    preparation_steps: meal.preparationSteps || [],
    tips: meal.tips || []
  }));

  // Insertar en lotes de 100 (para evitar límites de Supabase)
  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < mealsToInsert.length; i += batchSize) {
    const batch = mealsToInsert.slice(i, i + batchSize);
    
    const { error: insertError } = await supabase
      .from('base_meals')
      .insert(batch);

    if (insertError) {
      throw new Error(`Error insertando platos (lote ${i / batchSize + 1}): ${insertError.message}`);
    }

    totalInserted += batch.length;
    console.log(`   Insertados ${totalInserted} / ${mealsToInsert.length} platos...`);
  }

  return { count: totalInserted };
}

/**
 * Migrar bug reports de localStorage a Supabase
 */
async function migrateBugReports(): Promise<{ count: number }> {
  // Obtener bug reports de localStorage
  let storedReports: string | null = null;
  try {
    storedReports = localStorage.getItem('bugReports');
  } catch (error) {
    console.error('Error al leer bugReports de localStorage:', error);
  }
  if (!storedReports) {
    console.log('⚠️ No hay bug reports en localStorage');
    return { count: 0 };
  }

  const bugReports = JSON.parse(storedReports);

  if (bugReports.length === 0) {
    return { count: 0 };
  }

  // Insertar bug reports en Supabase
  const reportsToInsert = bugReports.map((report: any) => ({
    id: report.id,
    user_id: report.userId || 'unknown',
    user_email: report.userEmail || 'unknown@example.com',
    user_name: report.userName || 'Usuario Anónimo',
    title: report.title,
    description: report.description,
    category: report.category,
    priority: report.priority,
    status: report.status || 'pending'
  }));

  const { error: insertError } = await supabase
    .from('bug_reports')
    .insert(reportsToInsert);

  if (insertError) {
    // Si hay error de duplicados, ignorarlo (ya fueron migrados)
    if (insertError.code === '23505') {
      console.log('⚠️ Bug reports ya existen en Supabase');
      return { count: 0 };
    }
    throw new Error(`Error insertando bug reports: ${insertError.message}`);
  }

  return { count: reportsToInsert.length };
}

/**
 * Determinar categoría de ingrediente por ID
 */
function determineIngredientCategory(id: string): string | null {
  if (!id.startsWith('ing_')) return null;
  
  const num = parseInt(id.split('_')[1]);
  
  if (num >= 1 && num <= 6) return 'proteins-meat';
  if (num >= 7 && num <= 14) return 'proteins-fish';
  if (num >= 15 && num <= 22) return 'proteins-eggs';
  if (num >= 23 && num <= 26) return 'proteins-legumes';
  if (num >= 27 && num <= 34) return 'carbs-cereals';
  if (num >= 35 && num <= 36) return 'carbs-tubers';
  if (num >= 37 && num <= 43) return 'fruits';
  if (num >= 44 && num <= 53) return 'vegetables';
  if (num >= 54 && num <= 60) return 'fats';
  if (num >= 61) return 'others';
  
  return null;
}

/**
 * Verificar estado de la migración
 */
export async function checkMigrationStatus(): Promise<{
  ingredients: number;
  meals: number;
  bugReports: number;
  users: number;
}> {
  const [ingredients, meals, bugReports, users] = await Promise.all([
    supabase.from('base_ingredients').select('id', { count: 'exact', head: true }),
    supabase.from('base_meals').select('id', { count: 'exact', head: true }),
    supabase.from('bug_reports').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true })
  ]);

  return {
    ingredients: ingredients.count || 0,
    meals: meals.count || 0,
    bugReports: bugReports.count || 0,
    users: users.count || 0
  };
}

/**
 * Limpiar todos los datos de Supabase (⚠️ PELIGROSO - solo para desarrollo)
 */
export async function clearAllSupabaseData(): Promise<boolean> {
  console.warn('⚠️⚠️⚠️ ELIMINANDO TODOS LOS DATOS DE SUPABASE ⚠️⚠️⚠️');
  
  try {
    await Promise.all([
      supabase.from('bug_reports').delete().neq('id', ''),
      supabase.from('meal_adaptations').delete().neq('id', ''),
      supabase.from('weekly_progress').delete().neq('id', ''),
      supabase.from('saved_diets').delete().neq('id', ''),
      supabase.from('daily_logs').delete().neq('id', ''),
      supabase.from('custom_meals').delete().neq('id', ''),
      supabase.from('custom_ingredients').delete().neq('id', ''),
      supabase.from('base_meals').delete().neq('id', ''),
      supabase.from('base_ingredients').delete().neq('id', '')
    ]);
    
    console.log('✅ Todos los datos eliminados');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando datos:', error);
    return false;
  }
}
