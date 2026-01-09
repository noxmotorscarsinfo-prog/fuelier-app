# 🧪 Script de Prueba de Integración

## Para ejecutar en la consola del navegador

### Paso 1: Limpiar estado
```javascript
localStorage.clear();
console.log('✅ LocalStorage limpiado');
```

### Paso 2: Verificar que los endpoints estén funcionando
```javascript
// Probar endpoint de health
fetch('https://' + projectId + '.supabase.co/functions/v1/make-server-b0e879f0/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend health:', d))
  .catch(e => console.error('❌ Backend error:', e));
```

### Paso 3: Simular el flujo completo (copiar y pegar todo)
```javascript
(async function testRegistrationFlow() {
  console.log('🧪 Iniciando prueba de integración...\n');
  
  const testEmail = 'test' + Date.now() + '@fuelier.com';
  const testPassword = 'Test123!';
  const testName = 'Usuario de Prueba';
  
  console.log('📧 Email de prueba:', testEmail);
  console.log('🔑 Password:', testPassword);
  console.log('👤 Nombre:', testName);
  console.log('\n');
  
  try {
    // 1. Registro
    console.log('1️⃣ REGISTRO EN SUPABASE AUTH');
    const signupResponse = await fetch('https://' + window.location.hostname.split('.')[0] + '.supabase.co/functions/v1/make-server-b0e879f0/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Tu anon key
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName
      })
    });
    
    const signupData = await signupResponse.json();
    console.log('   Resultado:', signupData);
    
    if (!signupData.success) {
      console.error('❌ Error en signup:', signupData.error);
      return;
    }
    console.log('   ✅ Usuario creado en Auth\n');
    
    // 2. Crear perfil completo
    console.log('2️⃣ CREAR PERFIL COMPLETO (simulando onboarding)');
    const newUser = {
      email: testEmail,
      name: testName,
      sex: 'male',
      age: 25,
      birthdate: '1999-01-01',
      weight: 70,
      height: 175,
      goal: 'maintenance',
      trainingFrequency: 3,
      trainingIntensity: 'moderate',
      trainingType: 'strength',
      lifestyleActivity: 'moderately_active',
      mealsPerDay: 4,
      goals: {
        calories: 2400,
        protein: 180,
        carbs: 240,
        fat: 80
      },
      mealDistribution: {
        breakfast: 25,
        lunch: 30,
        snack: 15,
        dinner: 30
      },
      preferences: {
        likes: [],
        dislikes: [],
        intolerances: [],
        allergies: []
      },
      acceptedMealIds: [],
      rejectedMealIds: [],
      favoriteMealIds: [],
      favoriteIngredientIds: [],
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    
    console.log('   Guardando perfil en BD...');
    const userResponse = await fetch('https://' + window.location.hostname.split('.')[0] + '.supabase.co/functions/v1/make-server-b0e879f0/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Tu anon key
      },
      body: JSON.stringify(newUser)
    });
    
    const userData = await userResponse.json();
    console.log('   Resultado:', userData);
    
    if (!userData.success) {
      console.error('❌ Error guardando perfil:', userData.error);
      return;
    }
    console.log('   ✅ Perfil guardado correctamente\n');
    
    // 3. Guardar daily logs (vacío)
    console.log('3️⃣ GUARDAR DAILY LOGS (vacío)');
    const logsResponse = await fetch('https://' + window.location.hostname.split('.')[0] + '.supabase.co/functions/v1/make-server-b0e879f0/daily-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Tu anon key
      },
      body: JSON.stringify({
        email: testEmail,
        logs: []
      })
    });
    
    const logsData = await logsResponse.json();
    console.log('   Resultado:', logsData);
    
    if (logsData.error && !logsData.skipped) {
      console.error('❌ Error guardando logs:', logsData.error);
      return;
    }
    console.log('   ✅ Daily logs guardados\n');
    
    // 4. Guardar saved diets (vacío)
    console.log('4️⃣ GUARDAR SAVED DIETS (vacío)');
    const dietsResponse = await fetch('https://' + window.location.hostname.split('.')[0] + '.supabase.co/functions/v1/make-server-b0e879f0/saved-diets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Tu anon key
      },
      body: JSON.stringify({
        email: testEmail,
        diets: []
      })
    });
    
    const dietsData = await dietsResponse.json();
    console.log('   Resultado:', dietsData);
    
    if (dietsData.error && !dietsData.skipped) {
      console.error('❌ Error guardando diets:', dietsData.error);
      return;
    }
    console.log('   ✅ Saved diets guardados\n');
    
    // 5. Guardar favorites (vacío)
    console.log('5️⃣ GUARDAR FAVORITE MEALS (vacío)');
    const favoritesResponse = await fetch('https://' + window.location.hostname.split('.')[0] + '.supabase.co/functions/v1/make-server-b0e879f0/favorite-meals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Tu anon key
      },
      body: JSON.stringify({
        email: testEmail,
        favorites: []
      })
    });
    
    const favoritesData = await favoritesResponse.json();
    console.log('   Resultado:', favoritesData);
    
    if (favoritesData.error && !favoritesData.skipped) {
      console.error('❌ Error guardando favorites:', favoritesData.error);
      return;
    }
    console.log('   ✅ Favorites guardados\n');
    
    // 6. Verificar que el usuario se pueda recuperar
    console.log('6️⃣ RECUPERAR USUARIO DE LA BD');
    const getUserResponse = await fetch('https://' + window.location.hostname.split('.')[0] + '.supabase.co/functions/v1/make-server-b0e879f0/user/' + encodeURIComponent(testEmail), {
      headers: {
        'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Tu anon key
      }
    });
    
    const retrievedUser = await getUserResponse.json();
    console.log('   Usuario recuperado:', retrievedUser);
    
    if (!retrievedUser || retrievedUser.error) {
      console.error('❌ Error recuperando usuario:', retrievedUser?.error);
      return;
    }
    console.log('   ✅ Usuario recuperado correctamente\n');
    
    console.log('═══════════════════════════════════════');
    console.log('✅ ¡PRUEBA COMPLETA EXITOSA!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('📊 Resumen:');
    console.log('   ✅ Usuario creado en Supabase Auth');
    console.log('   ✅ Perfil guardado en tabla users');
    console.log('   ✅ Daily logs guardados (0 logs)');
    console.log('   ✅ Saved diets guardados (0 diets)');
    console.log('   ✅ Favorite meals guardados (0 favorites)');
    console.log('   ✅ Usuario recuperable desde la BD');
    console.log('');
    console.log('🎉 El flujo de registro funciona perfectamente!');
    console.log('');
    console.log('📧 Puedes hacer login con:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    console.error('   Stack:', error.stack);
  }
})();
```

## Notas

⚠️ **IMPORTANTE**: Este script es solo para pruebas de integración. No expone información sensible en producción.

El script hace lo mismo que el flujo normal de la app:
1. ✅ Crea usuario en Supabase Auth
2. ✅ Guarda perfil completo
3. ✅ Guarda datos adicionales (logs, diets, favorites)
4. ✅ Verifica que todo se guardó correctamente

Si todo funciona bien, deberías ver:
```
✅ ¡PRUEBA COMPLETA EXITOSA!
```

Si hay algún error, verás exactamente en qué paso falló.
