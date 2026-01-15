/**
 * 🔍 DEBUG: Verificar platos personalizados con datos reales
 */

import { createClient } from '@supabase/supabase-js';

// Usando las credenciales directas para debugging
const SUPABASE_URL = 'https://wnbmctkyuzzmoptwfbjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYm1jdGt5dXp6bW9wdHdmYmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2MzkyMzUsImV4cCI6MjA1MzIxNTIzNX0.sO9kYcHGPHs1WStFZTyQNPtEA7Fx9P9VBB8mjOcDNXA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugCustomMeals() {
  console.log('🔍 ═══════════════════════════════════════════════════════════');
  console.log('   DEBUG PLATOS PERSONALIZADOS');
  console.log('   ═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Listar todos los usuarios
    console.log('1. 👤 Consultando usuarios...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .order('email');

    if (usersError) {
      console.error('❌ Error consultando usuarios:', usersError);
      return;
    }

    console.log(`✅ Encontrados ${users?.length || 0} usuarios:`);
    users?.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (ID: ${user.id})`);
    });

    // 2. Para cada usuario, mostrar sus platos personalizados
    console.log('\n2. 🍽️ Revisando platos personalizados por usuario...\n');

    for (const user of users || []) {
      console.log(`📋 Usuario: ${user.email}`);
      console.log('─────────────────────────────────────────────────');

      const { data: customMeals, error: mealsError } = await supabase
        .from('custom_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (mealsError) {
        console.log(`   ❌ Error: ${mealsError.message}`);
        continue;
      }

      if (!customMeals || customMeals.length === 0) {
        console.log('   📝 Sin platos personalizados\n');
        continue;
      }

      console.log(`   📊 Total: ${customMeals.length} platos personalizados`);
      
      customMeals.forEach((meal, i) => {
        const nameWithCafe = meal.name.toLowerCase().includes('café') || meal.name.toLowerCase().includes('cafe');
        const prefix = nameWithCafe ? '☕' : '  ';
        
        console.log(`${prefix} ${i + 1}. "${meal.name}"`);
        console.log(`     - Tipo: ${JSON.stringify(meal.meal_types)}`);
        console.log(`     - Escalable: ${meal.allow_scaling ? 'SÍ' : 'NO'}`);
        console.log(`     - Tipo escalado: ${meal.scaling_type || 'N/A'}`);
        console.log(`     - Calorías: ${meal.calories}`);
        
        if (nameWithCafe) {
          console.log(`     🎯 ¡CAFÉ ENCONTRADO!`);
          console.log(`     - ¿Está marcado como FIJO? ${meal.scaling_type === 'fixed' ? 'SÍ' : 'NO'}`);
          console.log(`     - ¿allow_scaling es false? ${meal.allow_scaling === false ? 'SÍ' : 'NO'}`);
        }
      });
      console.log('');
    }

    // 3. Buscar específicamente cafés en toda la tabla
    console.log('3. ☕ Búsqueda específica de cafés...');
    console.log('─────────────────────────────────────────────────\n');

    const { data: cafeMeals, error: cafeError } = await supabase
      .from('custom_meals')
      .select('*, users(email)')
      .or('name.ilike.%café%,name.ilike.%cafe%')
      .order('name');

    if (cafeError) {
      console.log(`❌ Error buscando cafés: ${cafeError.message}`);
    } else if (!cafeMeals || cafeMeals.length === 0) {
      console.log('❌ NO SE ENCONTRARON PLATOS CON "CAFÉ" EN EL NOMBRE');
    } else {
      console.log(`✅ Encontrados ${cafeMeals.length} platos con "café" en el nombre:`);
      
      cafeMeals.forEach((meal, i) => {
        console.log(`\n☕ ${i + 1}. "${meal.name}"`);
        console.log(`   - Usuario: ${(meal.users as any)?.email}`);
        console.log(`   - Tipos: ${JSON.stringify(meal.meal_types)}`);
        console.log(`   - ¿Es FIJO?: ${meal.scaling_type === 'fixed' ? 'SÍ' : 'NO'}`);
        console.log(`   - allow_scaling: ${meal.allow_scaling}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

debugCustomMeals();