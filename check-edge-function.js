// Script para verificar si el Edge Function está actualizado
// Ejecutar con: node check-edge-function.js

const API_BASE_URL = 'https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0';

async function checkEdgeFunction() {
  console.log('🔍 Verificando Edge Function...\n');
  
  // Simulamos una llamada GET /user con un email de prueba
  // (esto fallará porque no tenemos auth, pero nos sirve para ver la estructura de respuesta)
  
  const response = await fetch(`${API_BASE_URL}/user/romanzyu@gmail.com`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTA4OTIsImV4cCI6MjA4MjUyNjg5Mn0.tLKyWdfwluNOVZoHBZn0l2oTA1RdSRUCgCamnDqUJwM'
    }
  });
  
  const data = await response.json();
  
  console.log('📡 Status:', response.status);
  console.log('📦 Response:', JSON.stringify(data, null, 2));
  
  if (data && typeof data === 'object') {
    if ('trainingOnboarded' in data || 'training_onboarded' in data) {
      console.log('\n✅ EDGE FUNCTION ACTUALIZADO - Los campos de training están presentes');
    } else {
      console.log('\n❌ EDGE FUNCTION NO ACTUALIZADO - Los campos de training NO están presentes');
      console.log('👉 Necesitas deployar la función manualmente desde Supabase Dashboard');
    }
  }
}

checkEdgeFunction().catch(console.error);
