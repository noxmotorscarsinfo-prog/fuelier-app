/**
 * SCRIPT DE MIGRACIÓN DE INGREDIENTES
 * 
 * Sincroniza todos los ingredientes de ingredientsDatabase.ts a Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzvsbpgqfubbqmqqxmwv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTA4OTIsImV4cCI6MjA4MjUyNjg5Mn0.tLKyWdfwluNOVZoHBZn0l2oTA1RdSRUCgCamnDqUJwM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// INGREDIENTES DE ingredientsDatabase.ts
const INGREDIENTS_DATABASE = [
  // PROTEÍNAS
  { id: 'pollo-pechuga', name: 'Pechuga de Pollo', category: 'proteina', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: 'pavo-pechuga', name: 'Pechuga de Pavo', category: 'proteina', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1 },
  { id: 'ternera-magra', name: 'Ternera Magra', category: 'proteina', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15 },
  { id: 'salmon', name: 'Salmón', category: 'proteina', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { id: 'atun-natural', name: 'Atún Natural', category: 'proteina', caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1 },
  { id: 'merluza', name: 'Merluza', category: 'proteina', caloriesPer100g: 90, proteinPer100g: 17, carbsPer100g: 0, fatPer100g: 2 },
  { id: 'bacalao', name: 'Bacalao', category: 'proteina', caloriesPer100g: 82, proteinPer100g: 18, carbsPer100g: 0, fatPer100g: 0.7 },
  { id: 'lubina', name: 'Lubina', category: 'proteina', caloriesPer100g: 97, proteinPer100g: 19, carbsPer100g: 0, fatPer100g: 2 },
  { id: 'dorada', name: 'Dorada', category: 'proteina', caloriesPer100g: 100, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 2.3 },
  { id: 'huevos', name: 'Huevos', category: 'proteina', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { id: 'clara-huevo', name: 'Clara de Huevo', category: 'proteina', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { id: 'tofu', name: 'Tofu', category: 'proteina', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8 },
  { id: 'proteina-whey', name: 'Proteína Whey', category: 'proteina', caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 6 },
  { id: 'lentejas', name: 'Lentejas Cocidas', category: 'proteina', caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4 },
  { id: 'garbanzos', name: 'Garbanzos Cocidos', category: 'proteina', caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27, fatPer100g: 2.6 },
  
  // CARBOHIDRATOS
  { id: 'arroz-blanco', name: 'Arroz Blanco', category: 'carbohidrato', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { id: 'arroz-integral', name: 'Arroz Integral', category: 'carbohidrato', caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9 },
  { id: 'pasta-integral', name: 'Pasta Integral', category: 'carbohidrato', caloriesPer100g: 124, proteinPer100g: 5, carbsPer100g: 26, fatPer100g: 0.5 },
  { id: 'pasta-blanca', name: 'Pasta Blanca', category: 'carbohidrato', caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1 },
  { id: 'patata', name: 'Patata', category: 'carbohidrato', caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1 },
  { id: 'boniato', name: 'Boniato', category: 'carbohidrato', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
  { id: 'pan-integral', name: 'Pan Integral', category: 'carbohidrato', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.5 },
  { id: 'avena', name: 'Avena', category: 'carbohidrato', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7 },
  { id: 'quinoa', name: 'Quinoa', category: 'carbohidrato', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },
  { id: 'arroz-basmati', name: 'Arroz Basmati', category: 'carbohidrato', caloriesPer100g: 121, proteinPer100g: 2.7, carbsPer100g: 25, fatPer100g: 0.4 },
  { id: 'tortitas-arroz', name: 'Tortitas de Arroz', category: 'carbohidrato', caloriesPer100g: 387, proteinPer100g: 8, carbsPer100g: 81, fatPer100g: 3 },
  { id: 'pan-centeno', name: 'Pan de Centeno', category: 'carbohidrato', caloriesPer100g: 259, proteinPer100g: 8.5, carbsPer100g: 48, fatPer100g: 3.3 },
  
  // GRASAS SALUDABLES
  { id: 'aceite-oliva', name: 'Aceite de Oliva', category: 'grasa', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { id: 'aguacate', name: 'Aguacate', category: 'grasa', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15 },
  { id: 'nueces', name: 'Nueces', category: 'grasa', caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65 },
  { id: 'almendras', name: 'Almendras', category: 'grasa', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { id: 'mantequilla-cacahuete', name: 'Mantequilla de Cacahuete', category: 'grasa', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
  { id: 'aceite-coco', name: 'Aceite de Coco', category: 'grasa', caloriesPer100g: 862, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  
  // VEGETALES
  { id: 'brocoli', name: 'Brócoli', category: 'vegetal', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
  { id: 'espinacas', name: 'Espinacas', category: 'vegetal', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: 'tomate', name: 'Tomate', category: 'vegetal', caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 },
  { id: 'lechuga', name: 'Lechuga', category: 'vegetal', caloriesPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.9, fatPer100g: 0.2 },
  { id: 'zanahoria', name: 'Zanahoria', category: 'vegetal', caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2 },
  { id: 'pimiento', name: 'Pimiento', category: 'vegetal', caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3 },
  { id: 'cebolla', name: 'Cebolla', category: 'vegetal', caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9, fatPer100g: 0.1 },
  { id: 'calabacin', name: 'Calabacín', category: 'vegetal', caloriesPer100g: 17, proteinPer100g: 1.2, carbsPer100g: 3.1, fatPer100g: 0.3 },
  { id: 'berenjena', name: 'Berenjena', category: 'vegetal', caloriesPer100g: 25, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.2 },
  { id: 'esparragos', name: 'Espárragos', category: 'vegetal', caloriesPer100g: 20, proteinPer100g: 2.2, carbsPer100g: 3.9, fatPer100g: 0.1 },
  { id: 'champiñones', name: 'Champiñones', category: 'vegetal', caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3 },
  { id: 'pepino', name: 'Pepino', category: 'vegetal', caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1 },
  
  // LÁCTEOS
  { id: 'leche-desnatada', name: 'Leche Desnatada', category: 'lacteo', caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1 },
  { id: 'yogur-griego', name: 'Yogur Griego Natural', category: 'lacteo', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: 'queso-fresco', name: 'Queso Fresco Batido 0%', category: 'lacteo', caloriesPer100g: 72, proteinPer100g: 13, carbsPer100g: 4, fatPer100g: 0.2 },
  { id: 'queso-mozzarella', name: 'Queso Mozzarella Light', category: 'lacteo', caloriesPer100g: 254, proteinPer100g: 24, carbsPer100g: 3, fatPer100g: 16 },
  { id: 'requesón', name: 'Requesón', category: 'lacteo', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },
  
  // FRUTAS
  { id: 'platano', name: 'Plátano', category: 'fruta', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { id: 'manzana', name: 'Manzana', category: 'fruta', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { id: 'fresas', name: 'Fresas', category: 'fruta', caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 8, fatPer100g: 0.3 },
  { id: 'arandanos', name: 'Arándanos', category: 'fruta', caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3 },
  { id: 'kiwi', name: 'Kiwi', category: 'fruta', caloriesPer100g: 61, proteinPer100g: 1.1, carbsPer100g: 15, fatPer100g: 0.5 },
  { id: 'naranja', name: 'Naranja', category: 'fruta', caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1 },
  { id: 'melocotón', name: 'Melocotón', category: 'fruta', caloriesPer100g: 39, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.3 },
  
  // CONDIMENTOS
  { id: 'sal', name: 'Sal', category: 'condimento', caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0 },
  { id: 'pimienta', name: 'Pimienta', category: 'condimento', caloriesPer100g: 251, proteinPer100g: 10, carbsPer100g: 64, fatPer100g: 3.3 },
  { id: 'ajo', name: 'Ajo', category: 'condimento', caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33, fatPer100g: 0.5 }
];

async function syncIngredientsToSupabase() {
  console.log('🚀 INICIANDO SINCRONIZACIÓN DE INGREDIENTES\n');
  console.log(`📦 Total de ingredientes a sincronizar: ${INGREDIENTS_DATABASE.length}\n`);
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const ingredient of INGREDIENTS_DATABASE) {
    try {
      // UPSERT: Inserta si no existe, actualiza si existe
      const { data, error } = await supabase
        .from('base_ingredients')
        .upsert({
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          calories: ingredient.caloriesPer100g,
          protein: ingredient.proteinPer100g,
          carbs: ingredient.carbsPer100g,
          fat: ingredient.fatPer100g
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        console.error(`❌ Error con "${ingredient.name}":`, error.message);
        errors++;
      } else {
        // No podemos diferenciar insert vs update con upsert, así que contamos como "actualizado"
        updated++;
        console.log(`✅ ${ingredient.name} (${ingredient.id})`);
      }
    } catch (err) {
      console.error(`❌ Excepción con "${ingredient.name}":`, err.message);
      errors++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 RESUMEN DE SINCRONIZACIÓN');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Sincronizados: ${updated}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📦 Total procesado: ${INGREDIENTS_DATABASE.length}`);
  console.log('═══════════════════════════════════════════\n');
  
  if (errors === 0) {
    console.log('🎉 SINCRONIZACIÓN COMPLETADA CON ÉXITO\n');
    console.log('✅ Todos los ingredientes de ingredientsDatabase.ts están ahora en Supabase');
    console.log('✅ Los macros están 100% sincronizados');
    console.log('✅ El AI Engine usará los mismos valores en cloud y local\n');
  } else {
    console.log(`⚠️ Se completó con ${errors} errores. Revisa los logs arriba.\n`);
  }
}

// Ejecutar migración
syncIngredientsToSupabase()
  .then(() => {
    console.log('👋 Proceso finalizado');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 ERROR FATAL:', err);
    process.exit(1);
  });
