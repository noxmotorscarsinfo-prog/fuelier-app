import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const supabase = createClient(SUPABASE_URL, publicAnonKey);

async function checkSupabaseData() {
  const { data, error } = await supabase
    .from('base_ingredients')
    .select('*')
    .eq('id', 'huevos')
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('🥚 Huevos en Supabase:', {
      id: data.id,
      name: data.name,
      caloriesPer100g: data.caloriesPer100g,
      proteinPer100g: data.proteinPer100g,
      carbsPer100g: data.carbsPer100g,
      fatPer100g: data.fatPer100g
    });

    // Calcular macros para 150g (cantidad del plato)
    const ratio = 150 / 100;
    console.log('\n150g de huevos debería tener:');
    console.log({
      calories: data.caloriesPer100g * ratio,
      protein: data.proteinPer100g * ratio,
      carbs: data.carbsPer100g * ratio,
      fat: data.fatPer100g * ratio
    });
  }
}

checkSupabaseData();
