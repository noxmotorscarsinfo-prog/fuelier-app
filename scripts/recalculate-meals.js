/**
 * Script para recalcular los macros de todos los platos basándose en sus ingredientReferences
 * Ejecutar: node scripts/recalculate-meals.js
 */

const API_URL = 'https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NDA3MjYsImV4cCI6MjA2MDIxNjcyNn0.LzGqEZLkxZYhOqMWFWdpkKdvGdKaWwfcBqJvzruKhBs';

async function recalculateMeals() {
  console.log('🔄 Recalculando macros de todos los platos...\n');

  // 1. Obtener todos los ingredientes con macros
  const ingredientsRes = await fetch(`${API_URL}/global-ingredients`, {
    headers: { 'Authorization': `Bearer ${ANON_KEY}` }
  });
  const ingredients = await ingredientsRes.json();
  
  // Crear mapa de ingredientes por ID
  const ingredientsMap = {};
  ingredients.forEach(ing => {
    ingredientsMap[ing.id] = {
      calories: ing.calories || 0,
      protein: ing.protein || 0,
      carbs: ing.carbs || 0,
      fat: ing.fat || 0
    };
  });
  
  console.log(`📦 ${Object.keys(ingredientsMap).length} ingredientes cargados\n`);

  // 2. Obtener todos los platos
  const mealsRes = await fetch(`${API_URL}/global-meals`, {
    headers: { 'Authorization': `Bearer ${ANON_KEY}` }
  });
  const meals = await mealsRes.json();
  
  // Los platos vienen como array directamente
  const allMeals = Array.isArray(meals) ? meals : 
    [...(meals.breakfast || []), ...(meals.lunch || []), ...(meals.snack || []), ...(meals.dinner || [])];
  
  console.log(`🍽️ ${allMeals.length} platos encontrados\n`);

  // 3. Recalcular macros para cada plato
  const updatedMeals = [];
  let changedCount = 0;

  for (const meal of allMeals) {
    const refs = meal.ingredientReferences || [];
    
    if (refs.length === 0) {
      console.log(`⚠️ ${meal.name}: Sin ingredientReferences, manteniendo macros originales`);
      updatedMeals.push(meal);
      continue;
    }

    let totalCal = 0, totalP = 0, totalC = 0, totalF = 0, totalGrams = 0;
    let missingIngredients = [];

    for (const ref of refs) {
      const ingId = ref.ingredientId;
      const grams = ref.amountInGrams || 0;
      const ing = ingredientsMap[ingId];

      if (!ing) {
        missingIngredients.push(ingId);
        continue;
      }

      totalCal += (ing.calories * grams) / 100;
      totalP += (ing.protein * grams) / 100;
      totalC += (ing.carbs * grams) / 100;
      totalF += (ing.fat * grams) / 100;
      totalGrams += grams;
    }

    if (missingIngredients.length > 0) {
      console.log(`⚠️ ${meal.name}: Ingredientes no encontrados: ${missingIngredients.join(', ')}`);
    }

    const newCal = Math.round(totalCal);
    const newP = Math.round(totalP);
    const newC = Math.round(totalC);
    const newF = Math.round(totalF);

    const hasChanged = meal.calories !== newCal || meal.protein !== newP || meal.carbs !== newC || meal.fat !== newF;

    if (hasChanged) {
      console.log(`✏️ ${meal.name}:`);
      console.log(`   Antes:  ${meal.calories} cal, ${meal.protein}g P, ${meal.carbs}g C, ${meal.fat}g F`);
      console.log(`   Ahora:  ${newCal} cal, ${newP}g P, ${newC}g C, ${newF}g F`);
      changedCount++;
    }

    updatedMeals.push({
      ...meal,
      calories: newCal,
      protein: newP,
      carbs: newC,
      fat: newF,
      baseQuantity: Math.round(totalGrams)
    });
  }

  console.log(`\n📊 ${changedCount} platos con macros actualizados\n`);

  // 4. Guardar platos actualizados
  if (changedCount > 0) {
    console.log('💾 Guardando platos actualizados...');
    
    const saveRes = await fetch(`${API_URL}/global-meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ meals: updatedMeals })
    });

    if (saveRes.ok) {
      console.log('✅ ¡Todos los platos actualizados correctamente!');
    } else {
      const error = await saveRes.text();
      console.error('❌ Error guardando:', error);
    }
  } else {
    console.log('✅ Todos los platos ya tienen macros correctos');
  }
}

recalculateMeals().catch(console.error);
