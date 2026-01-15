/**
 * 🔍 TEST DIRECTO: API Custom Meals
 * 
 * Probamos directamente contra la API para ver qué está pasando
 */

const API_BASE_URL = 'https://wnbmctkyuzzmoptwfbjk.supabase.co/functions/v1/make-server-b0e879f0';

async function testCustomMealsAPI() {
  console.log('🔍 ═══════════════════════════════════════════════════════════');
  console.log('   TEST DIRECTO API CUSTOM MEALS');
  console.log('   ═══════════════════════════════════════════════════════════\n');

  // Emails de prueba (incluye el tuyo y algunos genéricos)
  const testEmails = [
    'joaniphone2002@gmail.com',  // EMAIL CORRECTO del usuario
    'joanpintocurado@gmail.com',
    'test@example.com',
    'admin@fuelier.com'
  ];

  for (const email of testEmails) {
    console.log(`📧 Probando email: ${email}`);
    console.log('─────────────────────────────────────────────────');

    try {
      const response = await fetch(`${API_BASE_URL}/custom-meals/${encodeURIComponent(email)}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FuelierApp/1.0'
        }
      });

      console.log(`   Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Respuesta exitosa: ${data.length} platos`);
        
        if (data.length > 0) {
          console.log('   📝 Platos encontrados:');
          data.forEach((meal, i) => {
            const isCafe = meal.name.toLowerCase().includes('café') || meal.name.toLowerCase().includes('cafe');
            const prefix = isCafe ? '☕' : '  ';
            console.log(`${prefix} ${i + 1}. "${meal.name}"`);
            if (isCafe) {
              console.log(`       🎯 ¡CAFÉ ENCONTRADO!`);
              console.log(`       - Tipo: ${JSON.stringify(meal.meal_types)}`);
              console.log(`       - Escalable: ${meal.allow_scaling}`);
            }
          });
        } else {
          console.log('   📝 Sin platos personalizados');
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }

    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('💡 NOTAS:');
  console.log('   - Si NO aparecen platos para tu email, el problema es:');
  console.log('     a) Tu email no está en la tabla "users"');
  console.log('     b) No has creado el café con leche');
  console.log('     c) Hay un problema en getUserIdByEmail()');
  console.log('');
  console.log('   - Si aparecen platos, entonces el problema está en el frontend');
  console.log('     en MealSelection.tsx o en el filtrado.');
}

testCustomMealsAPI();