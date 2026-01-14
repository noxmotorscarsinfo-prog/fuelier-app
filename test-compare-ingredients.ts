/**
 * 🔍 COMPARACIÓN: Ingredientes Supabase vs Local
 * 
 * Verifica si los ingredientes en base_ingredients (Supabase) 
 * coinciden con INGREDIENTS_DATABASE (local)
 */

import { createClient } from '@supabase/supabase-js';
import { INGREDIENTS_DATABASE } from './src/data/ingredientsDatabase';
import { projectId, publicAnonKey } from './utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const supabase = createClient(SUPABASE_URL, publicAnonKey);

interface DBIngredient {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

async function compareIngredients() {
  console.log('🔍 COMPARACIÓN DE INGREDIENTES');
  console.log('═'.repeat(60));
  console.log('');
  
  // 1. Cargar desde Supabase
  console.log('📦 Cargando desde Supabase...');
  const { data: supabaseIngredients, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ Supabase: ${supabaseIngredients?.length || 0} ingredientes`);
  console.log(`📁 Local: ${INGREDIENTS_DATABASE.length} ingredientes`);
  console.log('');
  
  if (!supabaseIngredients || supabaseIngredients.length === 0) {
    console.error('❌ CRÍTICO: Supabase vacío!');
    console.log('');
    console.log('🔧 SOLUCIÓN:');
    console.log('   1. Loguearse como admin en la app');
    console.log('   2. El hook useIngredientsLoader auto-sincronizará');
    console.log('   O ejecutar: npm run sync-ingredients');
    return;
  }
  
  // 2. Crear mapas para comparación
  const supabaseMap = new Map(
    supabaseIngredients.map((ing: DBIngredient) => [ing.id, ing])
  );
  
  const localMap = new Map(
    INGREDIENTS_DATABASE.map(ing => [ing.id, ing])
  );
  
  // 3. Comparar ingredientes
  const differences: Array<{
    id: string;
    name: string;
    field: string;
    supabase: number;
    local: number;
    diff: number;
  }> = [];
  
  let perfectMatches = 0;
  let missingInSupabase: string[] = [];
  let missingInLocal: string[] = [];
  
  // Ingredientes en local pero no en Supabase
  for (const ing of INGREDIENTS_DATABASE) {
    if (!supabaseMap.has(ing.id)) {
      missingInSupabase.push(ing.id);
    }
  }
  
  // Ingredientes en Supabase pero no en local
  for (const ing of supabaseIngredients) {
    if (!localMap.has(ing.id)) {
      missingInLocal.push(ing.id);
    }
  }
  
  // Comparar macros de ingredientes comunes
  for (const localIng of INGREDIENTS_DATABASE) {
    const supabaseIng = supabaseMap.get(localIng.id);
    if (!supabaseIng) continue;
    
    let hasDifference = false;
    
    const fields = [
      { name: 'calories', local: localIng.caloriesPer100g, supabase: supabaseIng.calories },
      { name: 'protein', local: localIng.proteinPer100g, supabase: supabaseIng.protein },
      { name: 'carbs', local: localIng.carbsPer100g, supabase: supabaseIng.carbs },
      { name: 'fat', local: localIng.fatPer100g, supabase: supabaseIng.fat }
    ];
    
    for (const field of fields) {
      const diff = Math.abs(field.local - field.supabase);
      if (diff > 0.1) { // Tolerancia de 0.1 por redondeo
        differences.push({
          id: localIng.id,
          name: localIng.name,
          field: field.name,
          supabase: field.supabase,
          local: field.local,
          diff
        });
        hasDifference = true;
      }
    }
    
    if (!hasDifference) {
      perfectMatches++;
    }
  }
  
  // 4. Reporte
  console.log('📊 RESULTADOS:');
  console.log('─'.repeat(60));
  console.log(`✅ Coincidencias perfectas: ${perfectMatches}`);
  console.log(`⚠️  Con diferencias: ${differences.length > 0 ? new Set(differences.map(d => d.id)).size : 0}`);
  console.log(`❌ Faltantes en Supabase: ${missingInSupabase.length}`);
  console.log(`❌ Faltantes en Local: ${missingInLocal.length}`);
  console.log('');
  
  if (missingInSupabase.length > 0) {
    console.log('🚨 FALTANTES EN SUPABASE:');
    missingInSupabase.forEach(id => {
      const ing = localMap.get(id);
      console.log(`   - ${id} (${ing?.name})`);
    });
    console.log('');
  }
  
  if (missingInLocal.length > 0) {
    console.log('🚨 FALTANTES EN LOCAL:');
    missingInLocal.forEach(id => {
      const ing = supabaseMap.get(id);
      console.log(`   - ${id} (${ing?.name})`);
    });
    console.log('');
  }
  
  if (differences.length > 0) {
    console.log('⚠️  DIFERENCIAS EN MACROS:');
    console.log('─'.repeat(60));
    
    // Agrupar por ingrediente
    const byIngredient = new Map<string, typeof differences>();
    differences.forEach(diff => {
      if (!byIngredient.has(diff.id)) {
        byIngredient.set(diff.id, []);
      }
      byIngredient.get(diff.id)!.push(diff);
    });
    
    // Mostrar primeros 10 ingredientes con diferencias
    let count = 0;
    for (const [id, diffs] of byIngredient) {
      if (count >= 10) {
        console.log(`   ... y ${byIngredient.size - 10} ingredientes más`);
        break;
      }
      
      console.log(`\n📍 ${diffs[0].name} (${id}):`);
      diffs.forEach(diff => {
        const pctDiff = ((diff.diff / diff.local) * 100).toFixed(1);
        console.log(`   ${diff.field.padEnd(10)}: Local=${diff.local.toFixed(1)}  Supabase=${diff.supabase.toFixed(1)}  Diff=${diff.diff.toFixed(1)} (${pctDiff}%)`);
      });
      
      count++;
    }
    console.log('');
  }
  
  // 5. Ingredientes críticos para desayunos
  console.log('🔍 INGREDIENTES CRÍTICOS PARA DESAYUNOS:');
  console.log('─'.repeat(60));
  
  const criticalIds = [
    'huevos',
    'avena',
    'proteina-whey',
    'yogur-griego',
    'platano',
    'pan-integral',
    'leche-desnatada',
    'nueces',
    'arandanos',
    'fresas'
  ];
  
  for (const id of criticalIds) {
    const local = localMap.get(id);
    const supabase = supabaseMap.get(id);
    
    if (!local && !supabase) {
      console.log(`❌ ${id}: NO EXISTE en ningún lado`);
    } else if (!supabase) {
      console.log(`❌ ${id}: Solo en LOCAL`);
    } else if (!local) {
      console.log(`❌ ${id}: Solo en SUPABASE`);
    } else {
      // Comparar macros
      const diffs = [];
      if (Math.abs(local.caloriesPer100g - supabase.calories) > 0.1) {
        diffs.push(`Cal: ${local.caloriesPer100g} vs ${supabase.calories}`);
      }
      if (Math.abs(local.proteinPer100g - supabase.protein) > 0.1) {
        diffs.push(`P: ${local.proteinPer100g} vs ${supabase.protein}`);
      }
      if (Math.abs(local.carbsPer100g - supabase.carbs) > 0.1) {
        diffs.push(`C: ${local.carbsPer100g} vs ${supabase.carbs}`);
      }
      if (Math.abs(local.fatPer100g - supabase.fat) > 0.1) {
        diffs.push(`F: ${local.fatPer100g} vs ${supabase.fat}`);
      }
      
      if (diffs.length > 0) {
        console.log(`⚠️  ${id} (${local.name}): ${diffs.join(', ')}`);
      } else {
        console.log(`✅ ${id} (${local.name}): Coinciden`);
      }
    }
  }
  
  console.log('');
  console.log('═'.repeat(60));
  console.log('');
  
  // 6. Conclusión y recomendación
  if (missingInSupabase.length === 0 && missingInLocal.length === 0 && differences.length === 0) {
    console.log('✅ PERFECTO: Supabase y Local están 100% sincronizados');
    console.log('');
    console.log('💡 El problema del AI Engine NO es por datos desincronizados.');
    console.log('   Investigar otras causas:');
    console.log('   - ¿Los platos tienen ingredientReferences correctos?');
    console.log('   - ¿Las cantidades iniciales son realistas?');
    console.log('   - ¿Los targets son alcanzables con esos ingredientes?');
  } else if (differences.length > 0 || missingInSupabase.length > 0) {
    console.log('⚠️  PROBLEMA: Hay desincronización entre Supabase y Local');
    console.log('');
    console.log('🔧 SOLUCIÓN RECOMENDADA:');
    console.log('   1. Decidir cuál es la "fuente de verdad"');
    console.log('      - Si LOCAL es correcto: Ejecutar npm run sync-ingredients');
    console.log('      - Si SUPABASE es correcto: Actualizar INGREDIENTS_DATABASE local');
    console.log('');
    console.log('   2. Verificar macros de ingredientes críticos (arriba)');
    console.log('   3. Re-ejecutar test: npx tsx test-escalado-real-usuario.ts');
    console.log('');
    console.log('💡 Las diferencias en macros pueden explicar por qué el AI Engine');
    console.log('   no alcanza 95%+ accuracy en los platos.');
  } else if (missingInLocal.length > 0) {
    console.log('⚠️  INFO: Supabase tiene ingredientes extras');
    console.log('');
    console.log('   Esto es normal si se agregaron ingredientes personalizados.');
    console.log('   No debería afectar el funcionamiento del AI Engine.');
  }
}

compareIngredients()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
