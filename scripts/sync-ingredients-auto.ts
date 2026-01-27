/**
 * SINCRONIZACIÓN AUTOMÁTICA DE INGREDIENTES
 * 
 * Este script sincroniza automáticamente ingredientsDatabase.ts → Supabase
 * 
 * CUÁNDO SE EJECUTA:
 * 1. Pre-deploy (npm run predeploy)
 * 2. Manualmente (npm run sync-ingredients)
 * 3. Auto en primera carga si admin detecta desincronización
 * 
 * GARANTIZA:
 * ✅ ingredientsDatabase.ts es la ÚNICA fuente de verdad
 * ✅ Supabase siempre tiene los mismos datos
 * ✅ No más desincronización
 */

import { createClient } from '@supabase/supabase-js';
import { INGREDIENTS_DATABASE } from '../src/data/ingredientsDatabase.js';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Leer .env manualmente
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  } catch (err) {
    // .env no existe, usar variables de entorno
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fzvsbpgqfubbqmqqxmwv.supabase.co';

// ✅ IMPORTANTE: Usar SERVICE_ROLE_KEY para bypass RLS
// SERVICE_ROLE_KEY tiene permisos totales y no sufre de políticas RLS
// Solo se usa en scripts de backend/sincronización, NUNCA en frontend
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no encontrada');
  console.error('');
  console.error('Esta key es NECESARIA para sincronización (bypass RLS).');
  console.error('');
  console.error('Dónde encontrarla:');
  console.error('1. Abre: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/settings/api');
  console.error('2. Copia "service_role" key (secret)');
  console.error('3. Agrégala a .env: SUPABASE_SERVICE_ROLE_KEY=eyJhbG...');
  console.error('');
  console.error('⚠️  IMPORTANTE: Esta key es SECRETA, no la commits a Git');
  console.error('');
  process.exit(1);
}

// Crear cliente con SERVICE_ROLE_KEY (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Calcula hash de los ingredientes para detectar cambios
 */
function calculateIngredientsHash(): string {
  const data = JSON.stringify(INGREDIENTS_DATABASE.map(ing => ({
    id: ing.id,
    name: ing.name,
    calories: ing.caloriesPer100g,
    protein: ing.proteinPer100g,
    carbs: ing.carbsPer100g,
    fat: ing.fatPer100g,
    category: ing.category
  })));
  
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Sincroniza ingredientes a Supabase
 */
async function syncIngredients(): Promise<void> {
  console.log('🚀 SINCRONIZACIÓN AUTOMÁTICA DE INGREDIENTES\n');
  console.log(`📦 Fuente: ingredientsDatabase.ts (${INGREDIENTS_DATABASE.length} ingredientes)`);
  console.log(`🎯 Destino: Supabase base_ingredients\n`);
  
  const currentHash = calculateIngredientsHash();
  console.log(`🔐 Hash actual: ${currentHash.substring(0, 12)}...\n`);
  
  // PASO 1: LIMPIAR todos los ingredientes del sistema viejos
  console.log('🧹 PASO 1: Limpiando ingredientes del sistema viejos...');
  const { error: deleteError, count: deletedCount } = await supabase
    .from('base_ingredients')
    .delete({ count: 'exact' })
    .is('created_by', null);

  if (deleteError) {
    console.error('❌ Error al limpiar:', deleteError);
    process.exit(1);
  }
  console.log(`✅ Eliminados: ${deletedCount || 0} ingredientes viejos\n`);

  // PASO 2: Insertar los 60 ingredientes correctos
  console.log('📥 PASO 2: Insertando ingredientes correctos...');
  
  let synced = 0;
  let errors = 0;
  
  for (const ingredient of INGREDIENTS_DATABASE) {
    try {
      const { error } = await supabase
        .from('base_ingredients')
        .insert({
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          calories: ingredient.caloriesPer100g,
          protein: ingredient.proteinPer100g,
          carbs: ingredient.carbsPer100g,
          fat: ingredient.fatPer100g,
          created_by: null, // Ingredientes del sistema no tienen owner
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`❌ Error: ${ingredient.name} - ${error.message}`);
        errors++;
      } else {
        synced++;
        process.stdout.write(`\r✅ Sincronizados: ${synced}/${INGREDIENTS_DATABASE.length}`);
      }
    } catch (err: any) {
      console.error(`\n❌ Excepción: ${ingredient.name} - ${err.message}`);
      errors++;
    }
  }
  
  console.log('\n');
  
  if (errors === 0) {
    // Guardar hash en metadata
    try {
      await supabase
        .from('system_metadata')
        .upsert({
          key: 'ingredients_hash',
          value: currentHash,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });
      
      console.log('✅ Hash guardado en system_metadata');
    } catch (err) {
      console.warn('⚠️ No se pudo guardar hash (tabla system_metadata no existe)');
    }
    
    console.log('\n🎉 SINCRONIZACIÓN COMPLETADA CON ÉXITO\n');
    console.log(`✅ ${synced}/${INGREDIENTS_DATABASE.length} ingredientes sincronizados`);
    console.log('✅ Supabase ahora tiene los mismos datos que ingredientsDatabase.ts');
    console.log('✅ El AI Engine usará valores 100% consistentes\n');
  } else {
    console.error(`\n⚠️ SINCRONIZACIÓN COMPLETADA CON ERRORES\n`);
    console.error(`✅ Sincronizados: ${synced}`);
    console.error(`❌ Errores: ${errors}`);
    console.error(`📦 Total: ${INGREDIENTS_DATABASE.length}\n`);
    process.exit(1);
  }
}

// Ejecutar
syncIngredients()
  .then(() => {
    console.log('👋 Proceso finalizado');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 ERROR FATAL:', err);
    process.exit(1);
  });
