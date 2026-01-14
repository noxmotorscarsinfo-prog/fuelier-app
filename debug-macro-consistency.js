/**
 * 🔍 DEBUG SCRIPT: Verificar inconsistencia entre macros del plato y suma de ingredientes
 * 
 * Este script ayuda a identificar dónde está la discrepancia entre:
 * 1. meal.calories (macros mostrados del plato)
 * 2. Suma de macros calculados desde ingredientReferences
 */

// Simular ingredientReferences de un plato problemático
const testMeal = {
  id: "test-meal",
  name: "Plato de Prueba",
  calories: 450,  // Macros mostrados del plato
  protein: 35,
  carbs: 40,
  fat: 12,
  ingredientReferences: [
    { ingredientId: "pollo-pechuga", amountInGrams: 150 },
    { ingredientId: "arroz-blanco", amountInGrams: 80 },
    { ingredientId: "aceite-oliva", amountInGrams: 5 }
  ]
};

// Base de ingredientes simulada
const mockIngredients = [
  {
    id: "pollo-pechuga",
    name: "Pechuga de Pollo",
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6
  },
  {
    id: "arroz-blanco", 
    name: "Arroz Blanco",
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatPer100g: 0.3
  },
  {
    id: "aceite-oliva",
    name: "Aceite de Oliva",
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100
  }
];

function getIngredientById(id, ingredients) {
  return ingredients.find(ing => ing.id === id);
}

// Función de cálculo de macros (misma lógica que en la app)
function calculateMacrosFromIngredientReferences(ingredientRefs, allIngredients) {
  console.log('\n🔬 CALCULANDO MACROS DESDE INGREDIENTES:');
  
  let totalCalories = 0;
  let totalProtein = 0; 
  let totalCarbs = 0;
  let totalFat = 0;
  
  ingredientRefs.forEach((ref) => {
    const ingredient = getIngredientById(ref.ingredientId, allIngredients);
    if (!ingredient) {
      console.warn(`❌ Ingrediente no encontrado: ${ref.ingredientId}`);
      return;
    }
    
    const factor = ref.amountInGrams / 100;
    const calories = ingredient.caloriesPer100g * factor;
    const protein = ingredient.proteinPer100g * factor;
    const carbs = ingredient.carbsPer100g * factor;
    const fat = ingredient.fatPer100g * factor;
    
    console.log(`   ${ingredient.name} (${ref.amountInGrams}g):`);
    console.log(`      Cal: ${calories.toFixed(1)} | Prot: ${protein.toFixed(1)}g | Carbs: ${carbs.toFixed(1)}g | Fat: ${fat.toFixed(1)}g`);
    
    totalCalories += calories;
    totalProtein += protein;
    totalCarbs += carbs;
    totalFat += fat;
  });
  
  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10
  };
}

// EJECUTAR TEST
console.log('🧪 TEST: Verificar consistencia de macros\n');
console.log('📊 MACROS DEL PLATO (mostrados en UI):');
console.log(`   Calorías: ${testMeal.calories}`);
console.log(`   Proteína: ${testMeal.protein}g`);
console.log(`   Carbohidratos: ${testMeal.carbs}g`);  
console.log(`   Grasas: ${testMeal.fat}g`);

const calculatedMacros = calculateMacrosFromIngredientReferences(testMeal.ingredientReferences, mockIngredients);

console.log('\n📊 MACROS CALCULADOS DESDE INGREDIENTES:');
console.log(`   Calorías: ${calculatedMacros.calories}`);
console.log(`   Proteína: ${calculatedMacros.protein}g`);
console.log(`   Carbohidratos: ${calculatedMacros.carbs}g`);
console.log(`   Grasas: ${calculatedMacros.fat}g`);

// Calcular diferencias
const differences = {
  calories: testMeal.calories - calculatedMacros.calories,
  protein: testMeal.protein - calculatedMacros.protein,
  carbs: testMeal.carbs - calculatedMacros.carbs,
  fat: testMeal.fat - calculatedMacros.fat
};

console.log('\n⚠️ DIFERENCIAS (Plato - Ingredientes):');
console.log(`   Calorías: ${differences.calories > 0 ? '+' : ''}${differences.calories}`);
console.log(`   Proteína: ${differences.protein > 0 ? '+' : ''}${differences.protein}g`);
console.log(`   Carbohidratos: ${differences.carbs > 0 ? '+' : ''}${differences.carbs}g`);
console.log(`   Grasas: ${differences.fat > 0 ? '+' : ''}${differences.fat}g`);

// Verificar si hay inconsistencias significativas
const hasInconsistencies = Math.abs(differences.calories) > 2 || 
                          Math.abs(differences.protein) > 0.5 ||
                          Math.abs(differences.carbs) > 0.5 ||
                          Math.abs(differences.fat) > 0.5;

console.log(`\n${hasInconsistencies ? '❌' : '✅'} RESULTADO: ${hasInconsistencies ? 'INCONSISTENCIA DETECTADA' : 'MACROS CONSISTENTES'}`);

if (hasInconsistencies) {
  console.log('\n🔧 POSIBLES CAUSAS:');
  console.log('1. Los macros del plato fueron escalados pero ingredientReferences no');
  console.log('2. Redondeo diferente entre cálculo del plato vs ingredientes');
  console.log('3. Los ingredientReferences tienen cantidades incorrectas');
  console.log('4. Error en la función calculateMacrosFromIngredients');
}