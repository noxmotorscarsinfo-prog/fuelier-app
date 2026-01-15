/**
 * ============================================================================
 * TEST: INGREDIENT CLASSIFIER (MOCK DATA)
 * ============================================================================
 * 
 * Test básico con datos mock para validar lógica del clasificador
 */

import { classifyIngredients } from '../../src/app/utils/scaling/ingredientClassifier';
import { Ingredient } from '../../src/data/ingredientTypes';

// Mock ingredients database
const mockIngredients: Ingredient[] = [
  { id: 'pollo', name: 'Pechuga de Pollo', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, category: 'proteina' },
  { id: 'arroz', name: 'Arroz Integral', caloriesPer100g: 370, proteinPer100g: 8.3, carbsPer100g: 77.8, fatPer100g: 2.9, category: 'carbohidrato' },
  { id: 'aceite', name: 'Aceite de Oliva', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, category: 'grasa' },
  { id: 'brocoli', name: 'Brócoli', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, category: 'vegetal' },
];

// Mock meals
const mockMeals: any[] = [
  {
    id: '1',
    name: 'Pollo con Arroz Integral',
    type: 'lunch',
    mealIngredients: [
      {
        ingredientId: 'pollo',
        ingredientName: 'Pechuga de Pollo',
        amount: 150,
        calories: 247.5,
        protein: 46.5,
        carbs: 0,
        fat: 5.4,
      },
      {
        ingredientId: 'arroz',
        ingredientName: 'Arroz Integral',
        amount: 80,
        calories: 296,
        protein: 6.6,
        carbs: 62.2,
        fat: 2.3,
      },
      {
        ingredientId: 'aceite',
        ingredientName: 'Aceite de Oliva',
        amount: 10,
        calories: 88.4,
        protein: 0,
        carbs: 0,
        fat: 10,
      },
      {
        ingredientId: 'brocoli',
        ingredientName: 'Brócoli',
        amount: 100,
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
      },
    ],
  },
  {
    id: '2',
    name: 'Ensalada Simple',
    type: 'snack',
    mealIngredients: [
      {
        ingredientId: 'brocoli',
        ingredientName: 'Brócoli',
        amount: 150,
        calories: 51,
        protein: 4.2,
        carbs: 10.5,
        fat: 0.6,
      },
      {
        ingredientId: 'aceite',
        ingredientName: 'Aceite de Oliva',
        amount: 15,
        calories: 132.6,
        protein: 0,
        carbs: 0,
        fat: 15,
      },
    ],
  },
  {
    id: '3',
    name: 'Solo Pollo',
    type: 'lunch',
    mealIngredients: [
      {
        ingredientId: 'pollo',
        ingredientName: 'Pechuga de Pollo',
        amount: 200,
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7.2,
      },
    ],
  },
];

function runTest() {
  console.log('🧪 ============================================');
  console.log('🧪 TEST: INGREDIENT CLASSIFIER (Mock Data)');
  console.log('🧪 ============================================\n');
  
  let testsRun = 0;
  let testsPassed = 0;
  
  mockMeals.forEach(meal => {
    testsRun++;
    
    console.log(`\n📋 Testing: ${meal.name}`);
    console.log('─'.repeat(80));
    
    try {
      // Clasificar ingredientes
      const classification = classifyIngredients(meal, mockIngredients);
      
      console.log(`\n✅ Clasificación exitosa:`);
      console.log(`   Total ingredientes: ${classification.metadata.totalIngredients}`);
      console.log(`   Complejidad: ${classification.metadata.complexity}`);
      console.log(`   Core ratio: ${classification.metadata.coreRatio.toFixed(1)}%`);
      console.log(`   Macro dominante: ${classification.metadata.dominantMacro}`);
      
      console.log(`\n   STRUCTURAL (${classification.structural.length}):`);
      classification.structural.forEach(ing => {
        console.log(`      • ${ing.ingredientName} (${ing.amount}g)`);
        console.log(`        Razón: ${ing.reason}`);
      });
      
      console.log(`\n   FLEXIBLE PRIMARY (${classification.flexiblePrimary.length}):`);
      classification.flexiblePrimary.forEach(ing => {
        console.log(`      • ${ing.ingredientName} (${ing.amount}g)`);
        console.log(`        Razón: ${ing.reason}`);
      });
      
      console.log(`\n   FLEXIBLE SECONDARY (${classification.flexibleSecondary.length}):`);
      classification.flexibleSecondary.forEach(ing => {
        console.log(`      • ${ing.ingredientName} (${ing.amount}g)`);
        console.log(`        Razón: ${ing.reason}`);
      });
      
      // Validaciones
      console.log(`\n   Validaciones:`);
      
      let validationsPassed = 0;
      let validationsTotal = 0;
      
      // Validación 1: Debe tener al menos 1 structural
      validationsTotal++;
      if (classification.structural.length >= 1) {
        console.log(`      ✅ Tiene al menos 1 structural`);
        validationsPassed++;
      } else {
        console.log(`      ❌ NO tiene structural`);
      }
      
      // Validación 2: No más de 3 structural
      validationsTotal++;
      if (classification.structural.length <= 3) {
        console.log(`      ✅ No más de 3 structural`);
        validationsPassed++;
      } else {
        console.log(`      ❌ Más de 3 structural`);
      }
      
      // Validación 3: Core ratio >30% (excepto platos muy simples con auto-promoción)
      validationsTotal++;
      const isAutoPromoted = classification.structural.some(i => 
        i.reason.includes('Promoted to structural')
      );
      if (classification.metadata.coreRatio >= 30 || (isAutoPromoted && classification.metadata.totalIngredients <= 3)) {
        console.log(`      ✅ Core ratio >30% (o auto-promovido)`);
        validationsPassed++;
      } else {
        console.log(`      ⚠️  Core ratio <30%`);
      }
      
      // Validación 4: Suma de clasificaciones = total
      validationsTotal++;
      const sum = classification.structural.length + 
                  classification.flexiblePrimary.length + 
                  classification.flexibleSecondary.length;
      if (sum === classification.metadata.totalIngredients) {
        console.log(`      ✅ Todos los ingredientes clasificados`);
        validationsPassed++;
      } else {
        console.log(`      ❌ Clasificación incompleta`);
      }
      
      // Validación 5: Validaciones específicas por plato
      if (meal.name === 'Pollo con Arroz Integral') {
        // Pollo y Arroz deben ser structural
        validationsTotal++;
        const hasPolloStructural = classification.structural.some(i => i.id === 'pollo');
        const hasArrozStructural = classification.structural.some(i => i.id === 'arroz');
        if (hasPolloStructural && hasArrozStructural) {
          console.log(`      ✅ Pollo y Arroz son structural`);
          validationsPassed++;
        } else {
          console.log(`      ❌ Pollo o Arroz NO es structural`);
        }
        
        // Aceite debe ser flexible secondary
        validationsTotal++;
        const aceiteIsSecondary = classification.flexibleSecondary.some(i => i.ingredientId === 'aceite');
        if (aceiteIsSecondary) {
          console.log(`      ✅ Aceite es flexible secondary`);
          validationsPassed++;
        } else {
          console.log(`      ❌ Aceite NO es flexible secondary`);
        }
        
        // Brócoli debe ser flexible primary
        validationsTotal++;
        const brocoliIsPrimary = classification.flexiblePrimary.some(i => i.id === 'brocoli');
        if (brocoliIsPrimary) {
          console.log(`      ✅ Brócoli es flexible primary`);
          validationsPassed++;
        } else {
          console.log(`      ❌ Brócoli NO es flexible primary`);
        }
      }
      
      if (meal.name === 'Ensalada Simple') {
        // Debe tener structural (promovidos automáticamente)
        validationsTotal++;
        if (classification.structural.length >= 1) {
          console.log(`      ✅ Tiene structural (auto-promovido)`);
          validationsPassed++;
        } else {
          console.log(`      ❌ No tiene structural`);
        }
        
        // Aceite debe ser flexible secondary
        validationsTotal++;
        const aceiteIsSecondary = classification.flexibleSecondary.some(i => i.ingredientId === 'aceite');
        if (aceiteIsSecondary) {
          console.log(`      ✅ Aceite es flexible secondary`);
          validationsPassed++;
        } else {
          console.log(`      ❌ Aceite NO es flexible secondary`);
        }
      }
      
      if (meal.name === 'Solo Pollo') {
        // Pollo debe ser structural
        validationsTotal++;
        const hasPolloStructural = classification.structural.some(i => i.ingredientId === 'pollo');
        if (hasPolloStructural) {
          console.log(`      ✅ Pollo es structural`);
          validationsPassed++;
        } else {
          console.log(`      ❌ Pollo NO es structural`);
        }
      }
      
      console.log(`\n   Resultado: ${validationsPassed}/${validationsTotal} validaciones pasadas`);
      
      if (validationsPassed === validationsTotal) {
        testsPassed++;
        console.log(`\n   ✅ TEST PASADO`);
      } else {
        console.log(`\n   ⚠️  TEST PASADO CON WARNINGS`);
      }
      
    } catch (error) {
      console.error(`\n❌ ERROR: ${(error as Error).message}`);
    }
  });
  
  // Resumen final
  console.log('\n' + '═'.repeat(80));
  console.log('📊 RESUMEN FINAL:');
  console.log('═'.repeat(80));
  console.log(`Tests ejecutados: ${testsRun}`);
  console.log(`Tests pasados: ${testsPassed}`);
  console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
  console.log('═'.repeat(80));
  
  if (testsPassed === testsRun) {
    console.log('\n✅ TODOS LOS TESTS PASARON\n');
    return true;
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON\n');
    return false;
  }
}

// Ejecutar
const success = runTest();
process.exit(success ? 0 : 1);
