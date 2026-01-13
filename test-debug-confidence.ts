import { BREAKFASTS_FROM_DB } from './src/data/mealsWithIngredients';
import { INGREDIENTS_DATABASE } from './src/data/ingredientsDatabase';
import { getIngredientById } from './src/data/ingredientTypes';

// Tomar el primer meal
const meal = BREAKFASTS_FROM_DB[0];

console.log('Meal:', meal.name);
console.log('IngredientReferences:', meal.ingredientReferences);

// Convertir a MealIngredient[]
const mealIngredients = meal.ingredientReferences?.map(ref => {
  const ing = getIngredientById(ref.ingredientId, INGREDIENTS_DATABASE);
  if (!ing) {
    console.log(`❌ No encontrado: ${ref.ingredientId}`);
    return null;
  }
  
  const ratio = ref.amountInGrams / 100;
  const result = {
    ingredientId: ing.id,
    ingredientName: ing.name,
    amount: ref.amountInGrams,
    calories: ing.calories * ratio,
    protein: ing.protein * ratio,
    carbs: ing.carbs * ratio,
    fat: ing.fat * ratio,
  };
  
  console.log(`  ${ing.name}: ${ref.amountInGrams}g → cal:${result.calories.toFixed(1)} p:${result.protein.toFixed(1)} c:${result.carbs.toFixed(1)} f:${result.fat.toFixed(1)}`);
  return result;
}).filter(Boolean);

// Calcular macros totales
const totalMacros = mealIngredients.reduce((acc, ing: any) => ({
  calories: acc.calories + ing.calories,
  protein: acc.protein + ing.protein,
  carbs: acc.carbs + ing.carbs,
  fat: acc.fat + ing.fat,
}), { calories: 0, protein: 0, carbs: 0, fat: 0 });

console.log('\nTotal macros:', totalMacros);
