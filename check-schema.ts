import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📋 Campos disponibles en base_ingredients:');
  console.log(Object.keys(data));
  console.log('\n📋 Ejemplo completo:');
  console.log(JSON.stringify(data, null, 2));
}

checkSchema();
