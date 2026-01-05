/**
 * PLATOS CONSTRUIDOS DESDE LA BASE DE DATOS DE INGREDIENTES
 * 
 * Cada plato está compuesto por ingredientes reales de la base de datos.
 * Los macros se calculan automáticamente desde los ingredientes.
 * Las cantidades se escalan según el objetivo del usuario.
 */

import { Meal, MealType } from '../types';
import { MealIngredientReference } from './ingredientsDatabase';
import { calculateMacrosFromIngredients } from './ingredientsDatabase';

// Helper para crear un meal desde ingredientes
function createMealFromIngredients(
  id: string,
  name: string,
  type: MealType | MealType[],
  ingredientReferences: MealIngredientReference[],
  variant?: string
): Meal {
  const macros = calculateMacrosFromIngredients(ingredientReferences);
  
  // Generar descripción de ingredientes para legacy
  const ingredientDescriptions = ingredientReferences.map(ref => {
    const ingredient = ref.ingredientId.replace(/-/g, ' ');
    return `${ref.amountInGrams}g ${ingredient}`;
  });
  
  return {
    id,
    name,
    type,
    variant,
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    ingredients: ingredientDescriptions,
    baseQuantity: 1,
    ingredientReferences // CLAVE: Referencias a la base de datos
  };
}

// ==================== DESAYUNOS ====================

export const BREAKFASTS_FROM_DB: Meal[] = [
  createMealFromIngredients(
    'breakfast-tortilla-avena',
    'Tortilla de Avena con Frutas',
    'breakfast',
    [
      { ingredientId: 'huevos', amountInGrams: 150 }, // 3 huevos
      { ingredientId: 'avena', amountInGrams: 50 },
      { ingredientId: 'platano', amountInGrams: 100 },
      { ingredientId: 'fresas', amountInGrams: 80 },
      { ingredientId: 'leche-desnatada', amountInGrams: 100 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-yogur-granola',
    'Yogur Griego con Granola y Frutos Rojos',
    'breakfast',
    [
      { ingredientId: 'yogur-griego', amountInGrams: 250 },
      { ingredientId: 'avena', amountInGrams: 40 },
      { ingredientId: 'nueces', amountInGrams: 15 },
      { ingredientId: 'arandanos', amountInGrams: 80 },
      { ingredientId: 'platano', amountInGrams: 80 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-tostadas-pavo',
    'Tostadas de Pan Integral con Pavo y Aguacate',
    'breakfast',
    [
      { ingredientId: 'pan-integral', amountInGrams: 80 }, // 2 rebanadas
      { ingredientId: 'pavo-pechuga', amountInGrams: 80 },
      { ingredientId: 'aguacate', amountInGrams: 50 },
      { ingredientId: 'tomate', amountInGrams: 60 },
      { ingredientId: 'queso-fresco', amountInGrams: 40 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-tortilla-verduras',
    'Tortilla de Claras con Verduras',
    'breakfast',
    [
      { ingredientId: 'huevos', amountInGrams: 200 }, // 4 huevos (usar claras principalmente)
      { ingredientId: 'espinacas', amountInGrams: 80 },
      { ingredientId: 'pimiento', amountInGrams: 60 },
      { ingredientId: 'cebolla', amountInGrams: 40 },
      { ingredientId: 'pan-integral', amountInGrams: 60 },
      { ingredientId: 'aceite-oliva', amountInGrams: 5 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-bowl-avena',
    'Bowl de Avena con Mantequilla de Cacahuete',
    'breakfast',
    [
      { ingredientId: 'avena', amountInGrams: 60 },
      { ingredientId: 'leche-desnatada', amountInGrams: 200 },
      { ingredientId: 'mantequilla-cacahuete', amountInGrams: 20 },
      { ingredientId: 'platano', amountInGrams: 100 },
      { ingredientId: 'almendras', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-revuelto-salmon',
    'Revuelto de Huevos con Salmón Ahumado',
    'breakfast',
    [
      { ingredientId: 'huevos', amountInGrams: 150 }, // 3 huevos
      { ingredientId: 'salmon', amountInGrams: 60 },
      { ingredientId: 'espinacas', amountInGrams: 60 },
      { ingredientId: 'pan-integral', amountInGrams: 60 },
      { ingredientId: 'aguacate', amountInGrams: 40 },
      { ingredientId: 'aceite-oliva', amountInGrams: 5 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-pancakes-proteicos',
    'Pancakes Proteicos con Frutos Rojos',
    'breakfast',
    [
      { ingredientId: 'huevos', amountInGrams: 100 }, // 2 huevos
      { ingredientId: 'avena', amountInGrams: 50 },
      { ingredientId: 'yogur-griego', amountInGrams: 100 },
      { ingredientId: 'fresas', amountInGrams: 100 },
      { ingredientId: 'arandanos', amountInGrams: 60 },
      { ingredientId: 'mantequilla-cacahuete', amountInGrams: 10 }
    ]
  ),
  
  // NUEVOS DESAYUNOS
  createMealFromIngredients(
    'breakfast-batido-proteico',
    'Batido Proteico de Plátano y Avena',
    'breakfast',
    [
      { ingredientId: 'proteina-whey', amountInGrams: 30 },
      { ingredientId: 'platano', amountInGrams: 120 },
      { ingredientId: 'avena', amountInGrams: 40 },
      { ingredientId: 'leche-desnatada', amountInGrams: 250 },
      { ingredientId: 'mantequilla-cacahuete', amountInGrams: 12 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-tortitas-arroz-requeson',
    'Tortitas de Arroz con Requesón y Frutas',
    'breakfast',
    [
      { ingredientId: 'tortitas-arroz', amountInGrams: 40 },
      { ingredientId: 'requesón', amountInGrams: 150 },
      { ingredientId: 'platano', amountInGrams: 100 },
      { ingredientId: 'fresas', amountInGrams: 80 },
      { ingredientId: 'almendras', amountInGrams: 15 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-tostada-centeno-salmon',
    'Tostada de Centeno con Salmón y Aguacate',
    'breakfast',
    [
      { ingredientId: 'pan-centeno', amountInGrams: 70 },
      { ingredientId: 'salmon', amountInGrams: 60 },
      { ingredientId: 'aguacate', amountInGrams: 60 },
      { ingredientId: 'huevos', amountInGrams: 100 }, // 2 huevos
      { ingredientId: 'tomate', amountInGrams: 50 }
    ]
  ),
  
  createMealFromIngredients(
    'breakfast-porridge-frutas',
    'Porridge de Avena con Frutas Mixtas',
    'breakfast',
    [
      { ingredientId: 'avena', amountInGrams: 70 },
      { ingredientId: 'leche-desnatada', amountInGrams: 250 },
      { ingredientId: 'platano', amountInGrams: 80 },
      { ingredientId: 'kiwi', amountInGrams: 80 },
      { ingredientId: 'nueces', amountInGrams: 15 },
      { ingredientId: 'arandanos', amountInGrams: 50 }
    ]
  )
];

// ==================== COMIDAS ====================

export const LUNCHES_FROM_DB: Meal[] = [
  createMealFromIngredients(
    'lunch-pollo-arroz',
    'Pollo a la Plancha con Arroz Integral',
    'lunch',
    [
      { ingredientId: 'pollo-pechuga', amountInGrams: 180 },
      { ingredientId: 'arroz-integral', amountInGrams: 150 },
      { ingredientId: 'brocoli', amountInGrams: 150 },
      { ingredientId: 'zanahoria', amountInGrams: 80 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'lunch-salmon-quinoa',
    'Salmón con Quinoa y Vegetales',
    'lunch',
    [
      { ingredientId: 'salmon', amountInGrams: 160 },
      { ingredientId: 'quinoa', amountInGrams: 120 },
      { ingredientId: 'espinacas', amountInGrams: 100 },
      { ingredientId: 'tomate', amountInGrams: 80 },
      { ingredientId: 'aguacate', amountInGrams: 40 },
      { ingredientId: 'aceite-oliva', amountInGrams: 8 }
    ]
  ),
  
  createMealFromIngredients(
    'lunch-pasta-pavo',
    'Pasta Integral con Pavo y Verduras',
    'lunch',
    [
      { ingredientId: 'pasta-integral', amountInGrams: 140 },
      { ingredientId: 'pavo-pechuga', amountInGrams: 150 },
      { ingredientId: 'tomate', amountInGrams: 120 },
      { ingredientId: 'pimiento', amountInGrams: 80 },
      { ingredientId: 'cebolla', amountInGrams: 50 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'lunch-ternera-patatas',
    'Ternera Magra con Patatas al Horno',
    'lunch',
    [
      { ingredientId: 'ternera-magra', amountInGrams: 160 },
      { ingredientId: 'patata', amountInGrams: 200 },
      { ingredientId: 'brocoli', amountInGrams: 120 },
      { ingredientId: 'zanahoria', amountInGrams: 80 },
      { ingredientId: 'aceite-oliva', amountInGrams: 12 }
    ]
  ),
  
  createMealFromIngredients(
    'lunch-arroz-pollo-curry',
    'Arroz con Pollo al Curry',
    'lunch',
    [
      { ingredientId: 'pollo-pechuga', amountInGrams: 170 },
      { ingredientId: 'arroz-blanco', amountInGrams: 140 },
      { ingredientId: 'cebolla', amountInGrams: 60 },
      { ingredientId: 'pimiento', amountInGrams: 80 },
      { ingredientId: 'leche-desnatada', amountInGrams: 100 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  // NUEVAS COMIDAS
  createMealFromIngredients(
    'lunch-atun-ensalada',
    'Ensalada Completa con Atún Natural',
    'lunch',
    [
      { ingredientId: 'atun-natural', amountInGrams: 150 },
      { ingredientId: 'lechuga', amountInGrams: 100 },
      { ingredientId: 'tomate', amountInGrams: 120 },
      { ingredientId: 'pepino', amountInGrams: 100 },
      { ingredientId: 'arroz-basmati', amountInGrams: 120 },
      { ingredientId: 'aceite-oliva', amountInGrams: 12 }
    ]
  ),
  
  createMealFromIngredients(
    'lunch-lentejas-verduras',
    'Lentejas con Verduras al Estilo Mediterráneo',
    'lunch',
    [
      { ingredientId: 'lentejas', amountInGrams: 200 },
      { ingredientId: 'zanahoria', amountInGrams: 100 },
      { ingredientId: 'cebolla', amountInGrams: 80 },
      { ingredientId: 'tomate', amountInGrams: 100 },
      { ingredientId: 'patata', amountInGrams: 120 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'lunch-pollo-boniato-esparragos',
    'Pollo Asado con Boniato y Espárragos',
    'lunch',
    [
      { ingredientId: 'pollo-pechuga', amountInGrams: 180 },
      { ingredientId: 'boniato', amountInGrams: 180 },
      { ingredientId: 'esparragos', amountInGrams: 120 },
      { ingredientId: 'champiñones', amountInGrams: 80 },
      { ingredientId: 'aceite-oliva', amountInGrams: 12 }
    ]
  ),
  
  createMealFromIngredients(
    'lunch-garbanzos-calabacin',
    'Garbanzos Salteados con Calabacín y Berenjena',
    'lunch',
    [
      { ingredientId: 'garbanzos', amountInGrams: 180 },
      { ingredientId: 'calabacin', amountInGrams: 150 },
      { ingredientId: 'berenjena', amountInGrams: 120 },
      { ingredientId: 'pimiento', amountInGrams: 80 },
      { ingredientId: 'tomate', amountInGrams: 100 },
      { ingredientId: 'aceite-oliva', amountInGrams: 12 }
    ]
  ),
  
  createMealFromIngredients(
    'lunch-pavo-arroz-basmati',
    'Pavo Salteado con Arroz Basmati',
    'lunch',
    [
      { ingredientId: 'pavo-pechuga', amountInGrams: 170 },
      { ingredientId: 'arroz-basmati', amountInGrams: 150 },
      { ingredientId: 'brocoli', amountInGrams: 130 },
      { ingredientId: 'zanahoria', amountInGrams: 80 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  )
];

// ==================== MERIENDAS ====================

export const SNACKS_FROM_DB: Meal[] = [
  createMealFromIngredients(
    'snack-yogur-nueces',
    'Yogur Griego con Nueces y Frutas',
    'snack',
    [
      { ingredientId: 'yogur-griego', amountInGrams: 200 },
      { ingredientId: 'nueces', amountInGrams: 20 },
      { ingredientId: 'manzana', amountInGrams: 100 }
    ]
  ),
  
  createMealFromIngredients(
    'snack-tostada-queso',
    'Tostada con Queso Fresco y Pavo',
    'snack',
    [
      { ingredientId: 'pan-integral', amountInGrams: 60 },
      { ingredientId: 'queso-fresco', amountInGrams: 60 },
      { ingredientId: 'pavo-pechuga', amountInGrams: 50 },
      { ingredientId: 'tomate', amountInGrams: 50 }
    ]
  ),
  
  createMealFromIngredients(
    'snack-batido-proteina',
    'Batido de Plátano y Avena',
    'snack',
    [
      { ingredientId: 'platano', amountInGrams: 120 },
      { ingredientId: 'avena', amountInGrams: 40 },
      { ingredientId: 'leche-desnatada', amountInGrams: 250 },
      { ingredientId: 'mantequilla-cacahuete', amountInGrams: 15 }
    ]
  ),
  
  createMealFromIngredients(
    'snack-fruta-almendras',
    'Frutas Variadas con Almendras',
    'snack',
    [
      { ingredientId: 'manzana', amountInGrams: 120 },
      { ingredientId: 'platano', amountInGrams: 100 },
      { ingredientId: 'almendras', amountInGrams: 25 }
    ]
  ),
  
  createMealFromIngredients(
    'snack-tortitas-avena',
    'Tortitas de Avena con Frutas',
    'snack',
    [
      { ingredientId: 'avena', amountInGrams: 50 },
      { ingredientId: 'huevos', amountInGrams: 100 }, // 2 huevos
      { ingredientId: 'platano', amountInGrams: 80 },
      { ingredientId: 'fresas', amountInGrams: 60 }
    ]
  )
];

// ==================== CENAS ====================

export const DINNERS_FROM_DB: Meal[] = [
  createMealFromIngredients(
    'dinner-salmon-verduras',
    'Salmón con Verduras al Vapor',
    'dinner',
    [
      { ingredientId: 'salmon', amountInGrams: 150 },
      { ingredientId: 'brocoli', amountInGrams: 150 },
      { ingredientId: 'espinacas', amountInGrams: 100 },
      { ingredientId: 'zanahoria', amountInGrams: 80 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'dinner-pollo-boniato',
    'Pollo con Boniato y Ensalada',
    'dinner',
    [
      { ingredientId: 'pollo-pechuga', amountInGrams: 160 },
      { ingredientId: 'boniato', amountInGrams: 150 },
      { ingredientId: 'lechuga', amountInGrams: 100 },
      { ingredientId: 'tomate', amountInGrams: 80 },
      { ingredientId: 'aguacate', amountInGrams: 30 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'dinner-tortilla-ensalada',
    'Tortilla de Claras con Ensalada Completa',
    'dinner',
    [
      { ingredientId: 'huevos', amountInGrams: 180 }, // 3-4 huevos
      { ingredientId: 'lechuga', amountInGrams: 100 },
      { ingredientId: 'tomate', amountInGrams: 100 },
      { ingredientId: 'zanahoria', amountInGrams: 60 },
      { ingredientId: 'atun-natural', amountInGrams: 80 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'dinner-pavo-quinoa',
    'Pavo Salteado con Quinoa',
    'dinner',
    [
      { ingredientId: 'pavo-pechuga', amountInGrams: 150 },
      { ingredientId: 'quinoa', amountInGrams: 100 },
      { ingredientId: 'pimiento', amountInGrams: 80 },
      { ingredientId: 'cebolla', amountInGrams: 50 },
      { ingredientId: 'espinacas', amountInGrams: 80 },
      { ingredientId: 'aceite-oliva', amountInGrams: 8 }
    ]
  ),
  
  createMealFromIngredients(
    'dinner-merluza-verduras',
    'Merluza con Verduras Salteadas',
    'dinner',
    [
      { ingredientId: 'merluza', amountInGrams: 180 },
      { ingredientId: 'brocoli', amountInGrams: 120 },
      { ingredientId: 'zanahoria', amountInGrams: 80 },
      { ingredientId: 'pimiento', amountInGrams: 80 },
      { ingredientId: 'patata', amountInGrams: 120 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'dinner-bacalao-patatas',
    'Bacalao al Horno con Patatas',
    'dinner',
    [
      { ingredientId: 'bacalao', amountInGrams: 170 },
      { ingredientId: 'patata', amountInGrams: 180 },
      { ingredientId: 'tomate', amountInGrams: 100 },
      { ingredientId: 'cebolla', amountInGrams: 60 },
      { ingredientId: 'pimiento', amountInGrams: 70 },
      { ingredientId: 'aceite-oliva', amountInGrams: 12 }
    ]
  ),
  
  createMealFromIngredients(
    'dinner-lubina-verduras',
    'Lubina a la Plancha con Verduras',
    'dinner',
    [
      { ingredientId: 'lubina', amountInGrams: 180 },
      { ingredientId: 'espinacas', amountInGrams: 120 },
      { ingredientId: 'brocoli', amountInGrams: 100 },
      { ingredientId: 'zanahoria', amountInGrams: 80 },
      { ingredientId: 'boniato', amountInGrams: 130 },
      { ingredientId: 'aceite-oliva', amountInGrams: 10 }
    ]
  ),
  
  createMealFromIngredients(
    'dinner-dorada-ensalada',
    'Dorada al Horno con Ensalada',
    'dinner',
    [
      { ingredientId: 'dorada', amountInGrams: 170 },
      { ingredientId: 'lechuga', amountInGrams: 120 },
      { ingredientId: 'tomate', amountInGrams: 100 },
      { ingredientId: 'aguacate', amountInGrams: 50 },
      { ingredientId: 'quinoa', amountInGrams: 100 },
      { ingredientId: 'aceite-oliva', amountInGrams: 12 }
    ]
  )
];

// Exportar todos los platos
export const ALL_MEALS_FROM_DB = [
  ...BREAKFASTS_FROM_DB,
  ...LUNCHES_FROM_DB,
  ...SNACKS_FROM_DB,
  ...DINNERS_FROM_DB
];