/**
 * 🚨 DEBUG SIMPLE - Test macro error calculation
 * 
 * Simula el cálculo que está fallando
 */

// Simular función calculateMacroError
function calculateMacroError(meal, target) {
  const errors = {
    cal: target.calories > 0 ? Math.abs(meal.calories - target.calories) / target.calories : 0,
    prot: target.protein > 0 ? Math.abs(meal.protein - target.protein) / target.protein : 0,
    carbs: target.carbs > 0 ? Math.abs(meal.carbs - target.carbs) / target.carbs : 0,
    fat: target.fat > 0 ? Math.abs(meal.fat - target.fat) / target.fat : 0
  };
  
  console.log('   Errores individuales:', {
    cal: `${(errors.cal * 100).toFixed(1)}%`,
    prot: `${(errors.prot * 100).toFixed(1)}%`,
    carbs: `${(errors.carbs * 100).toFixed(1)}%`,
    fat: `${(errors.fat * 100).toFixed(1)}%`
  });
  
  // Retornar el error MÁXIMO 
  const maxError = Math.max(errors.cal, errors.prot, errors.carbs, errors.fat);
  console.log(`   Error máximo: ${(maxError * 100).toFixed(1)}%`);
  
  return maxError;
}

console.log('🚨 DEBUG: Calculando macro errors');
console.log('═══════════════════════════════════════\n');

// Caso 1: Target típico de desayuno 
const target = {
  calories: 400,
  protein: 30,
  carbs: 50,
  fat: 15
};

// Caso 2: Meal escalado con pequeñas diferencias (común después del fix de consistencia)
const scaledMeal = {
  name: 'Tortilla Francesa',
  calories: 396,  // -4 cal (1% error)
  protein: 28.5,  // -1.5g prot (5% error)  
  carbs: 52,      // +2g carbs (4% error)
  fat: 15.8       // +0.8g fat (5.3% error)
};

console.log('Target:', target);
console.log('Scaled Meal:', scaledMeal);
console.log('');

const errorPercent = calculateMacroError(scaledMeal, target);
const adjustmentPercent = 100 - (errorPercent * 100);

console.log(`Adjustment Percent: ${adjustmentPercent.toFixed(1)}%`);
console.log(`Pasa filtro 90%? ${adjustmentPercent >= 90 ? '✅ SÍ' : '❌ NO'}`);

console.log('\n═══════════════════════════════════════');
console.log('DIAGNÓSTICO:');

if (adjustmentPercent < 90) {
  console.log('❌ PROBLEMA: El error máximo hace que el plato no pase el filtro');
  console.log('   El fix de consistencia puede estar introduciendo diferencias');
  console.log('   que hacen que el error en un macro supere el 10%');
} else {
  console.log('✅ El plato pasa el filtro correctamente');
}