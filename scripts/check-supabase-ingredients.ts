import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Leer .env manualmente
const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables de entorno no encontradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkIngredients() {
  console.log('🔍 VERIFICANDO INGREDIENTES EN SUPABASE\n');
  
  // Obtener todos los ingredientes
  const { data: ingredients, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📦 Total ingredientes: ${ingredients?.length || 0}\n`);
  
  // Agrupar por created_by
  const systemIngredients = ingredients?.filter(i => !i.created_by) || [];
  const userIngredients = ingredients?.filter(i => i.created_by) || [];
  
  console.log(`🤖 Ingredientes del sistema (created_by = null): ${systemIngredients.length}`);
  console.log(`👤 Ingredientes de usuarios: ${userIngredients.length}\n`);
  
  // Mostrar primeros 10 del sistema
  console.log('📋 PRIMEROS 10 INGREDIENTES DEL SISTEMA:');
  systemIngredients.slice(0, 10).forEach((ing, idx) => {
    console.log(`${idx + 1}. ${ing.id}`);
    console.log(`   Calorías: ${ing.calories} | P: ${ing.protein}g | C: ${ing.carbs}g | F: ${ing.fat}g`);
  });
  
  // Verificar "avena"
  const avena = ingredients?.find(i => i.id === 'avena');
  console.log('\n🔍 VERIFICANDO INGREDIENTE "avena":');
  if (avena) {
    console.log(`✅ Encontrado: ${JSON.stringify(avena, null, 2)}`);
    console.log(`\n📊 Macros de avena en Supabase:`);
    console.log(`   Calorías: ${avena.calories} (debería ser 389)`);
    console.log(`   Proteína: ${avena.protein}g (debería ser 17)`);
    console.log(`   Carbos: ${avena.carbs}g (debería ser 66)`);
    console.log(`   Grasa: ${avena.fat}g (debería ser 7)`);
  } else {
    console.log('❌ NO ENCONTRADO');
  }
  
  // Verificar duplicados
  const idCounts = new Map<string, number>();
  ingredients?.forEach(i => {
    idCounts.set(i.id, (idCounts.get(i.id) || 0) + 1);
  });
  
  const duplicates = Array.from(idCounts.entries()).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log('\n⚠️ INGREDIENTES DUPLICADOS:');
    duplicates.forEach(([id, count]) => {
      console.log(`   ${id}: ${count} veces`);
    });
  }
}

checkIngredients();
