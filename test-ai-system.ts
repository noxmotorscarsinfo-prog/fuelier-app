import { optimizeMeal, MacroTarget } from './src/app/utils/aiNutritionSystem';
import { ALL_MEALS_FROM_DB } from './src/data/mealsWithIngredients';
import { ALL_INGREDIENTS } from './src/app/data/ingredients';

// Test simple con UN plato
const testMeal = ALL_MEALS_FROM_DB.find(m => m.name === 'Batido Proteico de Plátano y Avena');

if (!testMeal) {
  console.error('❌ No se encontró el plato');
  process.exit(1);
}

console.log('\n📋 TESTING MEAL:', testMeal.name);
console.log('Ingredientes:', testMeal.ingredientReferences);

const target: MacroTarget = {
  calories: 600,
  protein: 45,
  carbs: 60,
  fat: 18
};

const result = optimizeMeal(testMeal, target, ALL_INGREDIENTS);

console.log('\n📊 RESULTADO:');
console.log('Accuracy:', result.accuracy);
console.log('Final Macros:', result.finalMacros);
console.log('Iterations:', result.iterations);
console.log('History:', result.history);
