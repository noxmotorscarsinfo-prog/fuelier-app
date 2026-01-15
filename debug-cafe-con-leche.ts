/**
 * 🐛 DEBUG: Problema de Café con Leche no apareciendo en MealSelection
 * 
 * El usuario reporta que creó "café con leche" pero no aparece en las opciones
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const supabase = createClient(SUPABASE_URL, publicAnonKey);

async function debugCafeConLeche() {
  console.log('🐛 ═══════════════════════════════════════════════════════════');
  console.log('   DEBUG: CAFÉ CON LECHE NO APARECE EN MEAL SELECTION');
  console.log('   ═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Consultar todos los usuarios para encontrar al que creó café con leche
    console.log('👥 1. Buscando usuarios con platos personalizados...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(10);
    
    if (usersError) {
      throw new Error(`Error consultando usuarios: ${usersError.message}`);
    }
    
    console.log(`✅ Encontrados ${users?.length || 0} usuarios`);
    
    // 2. Buscar "café con leche" en custom_meals de cada usuario
    for (const user of users || []) {
      console.log(`\n🔍 2. Revisando platos de: ${user.email}`);
      
      const { data: customMeals, error: mealsError } = await supabase
        .from('custom_meals')
        .select('*')
        .eq('user_id', user.id);
      
      if (mealsError) {
        console.log(`   ❌ Error consultando platos de ${user.email}:`, mealsError.message);
        continue;
      }
      
      console.log(`   📊 Total platos personalizados: ${customMeals?.length || 0}`);
      
      if (customMeals && customMeals.length > 0) {
        console.log('\n   📝 PLATOS ENCONTRADOS:');
        customMeals.forEach((meal, i) => {
          console.log(`   ${i + 1}. "${meal.name}"`);
          console.log(`      - ID: ${meal.id}`);
          console.log(`      - Tipos: ${JSON.stringify(meal.meal_types)}`);
          console.log(`      - Macros: ${meal.calories}kcal | ${meal.protein}P | ${meal.carbs}C | ${meal.fat}G`);
          console.log(`      - Escalado: ${meal.allow_scaling ? 'Escalable' : 'Fijo'}`);
          console.log(`      - Creado: ${new Date(meal.created_at).toLocaleString()}`);
          
          // 🎯 BUSCAR ESPECÍFICAMENTE CAFÉ CON LECHE
          if (meal.name.toLowerCase().includes('café') || meal.name.toLowerCase().includes('cafe')) {
            console.log(`\n   🎯 ¡ENCONTRADO CAFÉ! "${meal.name}"`);
            console.log(`      🔍 Análisis detallado:`);
            console.log(`      - meal_types: ${JSON.stringify(meal.meal_types)}`);
            console.log(`      - meal_types es array: ${Array.isArray(meal.meal_types)}`);
            console.log(`      - Incluye 'breakfast': ${meal.meal_types?.includes('breakfast')}`);
            console.log(`      - Incluye 'snack': ${meal.meal_types?.includes('snack')}`);
            console.log(`      - Incluye 'lunch': ${meal.meal_types?.includes('lunch')}`);
            console.log(`      - Incluye 'dinner': ${meal.meal_types?.includes('dinner')}`);
            console.log(`      - Ingredient references: ${meal.ingredient_references ? 'SÍ' : 'NO'}`);
            console.log(`      - Detailed ingredients: ${meal.detailed_ingredients ? 'SÍ' : 'NO'}`);
            
            // Verificar si los ingredient_references están bien estructurados
            if (meal.ingredient_references) {
              console.log(`      - Referencias de ingredientes:`, meal.ingredient_references);
            }
            
            if (meal.detailed_ingredients) {
              console.log(`      - Ingredientes detallados:`, meal.detailed_ingredients);
            }
            
            console.log(`\n   🧪 SIMULACIÓN DEL FILTRO DE MEALSELECTION:`);
            ['breakfast', 'lunch', 'snack', 'dinner'].forEach(mealType => {
              let passesFilter = false;
              
              if (Array.isArray(meal.meal_types)) {
                passesFilter = meal.meal_types.includes(mealType);
              } else {
                passesFilter = meal.meal_types === mealType;
              }
              
              console.log(`      - ${mealType}: ${passesFilter ? '✅ PASA' : '❌ NO PASA'}`);
            });
          }
          
          console.log(''); // Separador
        });
      } else {
        console.log('   📭 No tiene platos personalizados');
      }
    }
    
    // 3. Probar la API directamente
    console.log('\n🔌 3. Probando API getCustomMeals directamente...');
    
    // Usar el primer usuario con platos (si existe)
    const userWithMeals = users?.find(async (user) => {
      const { data } = await supabase
        .from('custom_meals')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      return data && data.length > 0;
    });
    
    if (userWithMeals) {
      console.log(`   🎯 Probando con usuario: ${userWithMeals.email}`);
      
      // Simular la llamada que hace MealSelection
      const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b0e879f0`;
      
      try {
        const response = await fetch(`${API_BASE_URL}/custom-meals/${encodeURIComponent(userWithMeals.email)}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        if (!response.ok) {
          console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
        } else {
          const apiMeals = await response.json();
          console.log(`   ✅ API Response: ${apiMeals.length} platos`);
          
          const cafeInAPI = apiMeals.find((meal: any) => 
            meal.name.toLowerCase().includes('café') || 
            meal.name.toLowerCase().includes('cafe')
          );
          
          if (cafeInAPI) {
            console.log(`   🎯 Café encontrado en API: "${cafeInAPI.name}"`);
            console.log(`   📋 Estructura del meal desde API:`, {
              id: cafeInAPI.id,
              name: cafeInAPI.name,
              type: cafeInAPI.type,
              isArray: Array.isArray(cafeInAPI.type),
              types: cafeInAPI.type
            });
          } else {
            console.log(`   ❌ Café NO encontrado en respuesta de API`);
          }
        }
      } catch (apiError: any) {
        console.log(`   ❌ Error llamando API: ${apiError.message}`);
      }
    }
    
    // 4. CONCLUSIONES Y RECOMENDACIONES
    console.log('\n📊 ═══════════════════════════════════════════════════════════');
    console.log('   CONCLUSIONES DEL DEBUG');
    console.log('   ═══════════════════════════════════════════════════════════');
    
    console.log('\n🔍 POSIBLES CAUSAS DEL PROBLEMA:');
    console.log('   1. 🏷️ Tipo de comida mal asignado (meal_types)');
    console.log('   2. 🔄 Problema en el filtro de MealSelection');
    console.log('   3. 🌐 API no está devolviendo el plato correctamente');
    console.log('   4. 🕐 Cache del navegador (refreshTrigger no funcionando)');
    console.log('   5. 📊 Problema en la conversión de tipos (Array vs String)');
    
    console.log('\n🛠️ SOLUCIONES RECOMENDADAS:');
    console.log('   A) Verificar que meal_types incluya el tipo correcto');
    console.log('   B) Asegurar que el filtro maneje arrays y strings');
    console.log('   C) Forzar refresh del cache del navegador (Ctrl+F5)');
    console.log('   D) Revisar console.log en el navegador para errores');
    console.log('   E) Verificar que la API esté funcionando correctamente');
    
  } catch (error: any) {
    console.error('\n❌ ERROR EN DEBUG:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar debug
debugCafeConLeche();