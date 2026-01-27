/**
 * Script para ejecutar migraciones SQL en Supabase
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
  } catch (err) {
    // .env no existe
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fzvsbpgqfubbqmqqxmwv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no encontrada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 EJECUTANDO MIGRACIÓN SQL: Fix RLS Policies\n');
  
  const migrationPath = resolve(process.cwd(), 'supabase/migrations/003_fix_base_ingredients_policies.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  // Dividir en statements individuales (separados por ;)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📦 Ejecutando ${statements.length} statements SQL...\n`);
  
  let success = 0;
  let errors = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Saltar comentarios
    if (statement.startsWith('--')) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: statement + ';' });
      
      if (error) {
        // Intentar con query directo si rpc falla
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({ sql_string: statement + ';' })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
      
      success++;
      process.stdout.write(`\r✅ Ejecutados: ${success}/${statements.length}`);
    } catch (err) {
      errors++;
      console.error(`\n❌ Error en statement ${i + 1}:`, err.message);
    }
  }
  
  console.log('\n');
  
  if (errors === 0) {
    console.log('🎉 MIGRACIÓN COMPLETADA CON ÉXITO\n');
    console.log('✅ Políticas RLS actualizadas');
    console.log('✅ created_by ahora es nullable');
    console.log('✅ Ingredientes del sistema limpios\n');
  } else {
    console.warn(`⚠️ Migración completada con ${errors} errores\n`);
  }
}

runMigration()
  .then(() => {
    console.log('👋 Proceso finalizado');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 ERROR FATAL:', err);
    process.exit(1);
  });
