/**
 * 🔍 TEST DIRECTO: API User y Custom Meals
 * 
 * Probamos ambos endpoints para diagnosticar el problema del 401
 */

const API_BASE_URL = 'https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0';

async function testUserAndCustomMealsAPI() {
  console.log('🔍 ═══════════════════════════════════════════════════════════');
  console.log('   TEST DIRECTO: USER + CUSTOM MEALS API');
  console.log('   ═══════════════════════════════════════════════════════════\n');

  const email = 'joaniphone2002@gmail.com';
  
  // 1. Probar GET /user/:email
  console.log('1️⃣ PROBANDO GET /user/:email');
  console.log('─────────────────────────────────────────────────');
  
  try {
    const userResponse = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(email)}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FuelierApp/1.0'
      }
    });

    console.log(`   Status: ${userResponse.status}`);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log(`   ✅ Usuario encontrado: ${userData.name}`);
    } else {
      const errorText = await userResponse.text();
      console.log(`   ❌ Error ${userResponse.status}: ${errorText}`);
      console.log(`   💡 Si es 401: problema de autenticación`);
      console.log(`   💡 Si es 404: usuario no existe en tabla users`);
    }

  } catch (error) {
    console.log(`   💥 Error de conexión: ${error.message}`);
  }
  
  console.log('');
  
  // 2. Probar GET /custom-meals/:email
  console.log('2️⃣ PROBANDO GET /custom-meals/:email');
  console.log('─────────────────────────────────────────────────');

  try {
    const mealsResponse = await fetch(`${API_BASE_URL}/custom-meals/${encodeURIComponent(email)}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FuelierApp/1.0'
      }
    });

    console.log(`   Status: ${mealsResponse.status}`);

    if (mealsResponse.ok) {
      const mealsData = await mealsResponse.json();
      console.log(`   ✅ Custom meals: ${mealsData.length} platos`);
      
      if (mealsData.length > 0) {
        console.log('   📝 Platos encontrados:');
        mealsData.forEach((meal, i) => {
          const isCafe = meal.name.toLowerCase().includes('café') || meal.name.toLowerCase().includes('cafe');
          const prefix = isCafe ? '☕' : '  ';
          console.log(`${prefix} ${i + 1}. "${meal.name}"`);
        });
      }
    } else {
      const errorText = await mealsResponse.text();
      console.log(`   ❌ Error ${mealsResponse.status}: ${errorText}`);
    }

  } catch (error) {
    console.log(`   💥 Error de conexión: ${error.message}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔍 DIAGNÓSTICO:');
  console.log('   - Si ambos dan 401: problema general de autenticación');
  console.log('   - Si /user da 404: usuario no existe (necesita onboarding)');
  console.log('   - Si /user da 401 pero /custom-meals da 200: problema específico');
  console.log('   - Si /custom-meals da array vacío: usuario existe pero sin platos');
}

testUserAndCustomMealsAPI();