// Script temporal para aplicar la migración de training fields
import { createClient } from '@supabase/supabase-js';

const projectId = 'fzvsbpgqfubbqmqqxmwv';
const supabaseUrl = `https://${projectId}.supabase.co`;

// IMPORTANTE: Necesitas el SERVICE_ROLE_KEY (no el anon key) para ejecutar migraciones
// Lo puedes obtener desde: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/settings/api
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!serviceRoleKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no está configurada');
  console.log('');
  console.log('Para aplicar esta migración:');
  console.log('1. Ve a https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/settings/api');
  console.log('2. Copia el "service_role" key (NO el anon key)');
  console.log('3. Ejecuta:');
  console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-aqui"; node apply-migration.js');
  console.log('');
  console.log('O ALTERNATIVAMENTE:');
  console.log('1. Ve al SQL Editor en Supabase Dashboard');
  console.log('2. Copia y pega el contenido de: supabase/migrations/002_add_training_fields.sql');
  console.log('3. Ejecuta el SQL manualmente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  console.log('🔄 Aplicando migración: 002_add_training_fields.sql');
  
  const sql = `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS training_onboarded BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS training_days INTEGER;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error al aplicar migración:', error);
      throw error;
    }
    
    console.log('✅ Migración aplicada exitosamente');
    console.log('✅ Columnas agregadas: training_onboarded, training_days');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();
