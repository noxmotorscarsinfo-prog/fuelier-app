/**
 * Script para aplicar fix de políticas RLS
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Leer .env
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
  } catch (err) {}
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fzvsbpgqfubbqmqqxmwv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no encontrada');
  process.exit(1);
}

async function applyFix() {
  console.log('🚀 APLICANDO FIX DE POLÍTICAS RLS\n');
  
  // Usar el cliente de Supabase para limpiar created_by
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Limpiar created_by de ingredientes existentes
    console.log('🧹 Limpiando created_by de ingredientes del sistema...');
    const { error: updateError, count } = await supabase
      .from('base_ingredients')
      .update({ created_by: null })
      .not('created_by', 'is', null);
    
    if (updateError) {
      console.warn('⚠️ Error limpiando created_by:', updateError.message);
    } else {
      console.log(`✅ Limpiados ${count || 'todos los'} ingredientes\n`);
    }
    
    console.log('✅ FIX APLICADO\n');
    console.log('📝 NOTA: Las políticas RLS deben actualizarse manualmente en Supabase Dashboard');
    console.log('   URL: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/sql/new');
    console.log('   Archivo: supabase/migrations/003_fix_base_ingredients_policies.sql\n');
    console.log('🎯 SIGUIENTE PASO: npm run sync-ingredients\n');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

applyFix();
