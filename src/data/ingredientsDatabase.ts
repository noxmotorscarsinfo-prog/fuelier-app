/**
 * BASE DE DATOS DE INGREDIENTES
 * 
 * Cada ingrediente tiene macros nutricionales por 100g.
 * Estos ingredientes se usan para construir los platos y escalarlos según el objetivo del usuario.
 */

export interface Ingredient {
  id: string;
  name: string;
  category: 'proteina' | 'carbohidrato' | 'grasa' | 'vegetal' | 'lacteo' | 'fruta' | 'condimento';
  // Macros por 100g
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  // Si es un ingrediente personalizado del usuario
  isCustom?: boolean;
  userId?: string; // Para ingredientes personalizados
}

export interface MealIngredientReference {
  ingredientId: string;
  amountInGrams: number; // Cantidad base de referencia
}

// BASE DE DATOS DE INGREDIENTES DEL SISTEMA
export const INGREDIENTS_DATABASE: Ingredient[] = [
  // PROTEÍNAS
  {
    id: 'pollo-pechuga',
    name: 'Pechuga de Pollo',
    category: 'proteina',
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6
  },
  {
    id: 'pavo-pechuga',
    name: 'Pechuga de Pavo',
    category: 'proteina',
    caloriesPer100g: 135,
    proteinPer100g: 30,
    carbsPer100g: 0,
    fatPer100g: 1
  },
  {
    id: 'ternera-magra',
    name: 'Ternera Magra',
    category: 'proteina',
    caloriesPer100g: 250,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 15
  },
  {
    id: 'salmon',
    name: 'Salmón',
    category: 'proteina',
    caloriesPer100g: 208,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatPer100g: 13
  },
  {
    id: 'atun-natural',
    name: 'Atún Natural',
    category: 'proteina',
    caloriesPer100g: 116,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 1
  },
  {
    id: 'merluza',
    name: 'Merluza',
    category: 'proteina',
    caloriesPer100g: 90,
    proteinPer100g: 17,
    carbsPer100g: 0,
    fatPer100g: 2
  },
  {
    id: 'bacalao',
    name: 'Bacalao',
    category: 'proteina',
    caloriesPer100g: 82,
    proteinPer100g: 18,
    carbsPer100g: 0,
    fatPer100g: 0.7
  },
  {
    id: 'lubina',
    name: 'Lubina',
    category: 'proteina',
    caloriesPer100g: 97,
    proteinPer100g: 19,
    carbsPer100g: 0,
    fatPer100g: 2
  },
  {
    id: 'dorada',
    name: 'Dorada',
    category: 'proteina',
    caloriesPer100g: 100,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatPer100g: 2.3
  },
  {
    id: 'huevos',
    name: 'Huevos',
    category: 'proteina',
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    fatPer100g: 11
  },
  {
    id: 'clara-huevo',
    name: 'Clara de Huevo',
    category: 'proteina',
    caloriesPer100g: 52,
    proteinPer100g: 11,
    carbsPer100g: 0.7,
    fatPer100g: 0.2
  },
  {
    id: 'tofu',
    name: 'Tofu',
    category: 'proteina',
    caloriesPer100g: 76,
    proteinPer100g: 8,
    carbsPer100g: 1.9,
    fatPer100g: 4.8
  },
  
  // CARBOHIDRATOS
  {
    id: 'arroz-blanco',
    name: 'Arroz Blanco',
    category: 'carbohidrato',
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatPer100g: 0.3
  },
  {
    id: 'arroz-integral',
    name: 'Arroz Integral',
    category: 'carbohidrato',
    caloriesPer100g: 111,
    proteinPer100g: 2.6,
    carbsPer100g: 23,
    fatPer100g: 0.9
  },
  {
    id: 'pasta-integral',
    name: 'Pasta Integral',
    category: 'carbohidrato',
    caloriesPer100g: 124,
    proteinPer100g: 5,
    carbsPer100g: 26,
    fatPer100g: 0.5
  },
  {
    id: 'pasta-blanca',
    name: 'Pasta Blanca',
    category: 'carbohidrato',
    caloriesPer100g: 131,
    proteinPer100g: 5,
    carbsPer100g: 25,
    fatPer100g: 1.1
  },
  {
    id: 'patata',
    name: 'Patata',
    category: 'carbohidrato',
    caloriesPer100g: 77,
    proteinPer100g: 2,
    carbsPer100g: 17,
    fatPer100g: 0.1
  },
  {
    id: 'boniato',
    name: 'Boniato',
    category: 'carbohidrato',
    caloriesPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 20,
    fatPer100g: 0.1
  },
  {
    id: 'pan-integral',
    name: 'Pan Integral',
    category: 'carbohidrato',
    caloriesPer100g: 247,
    proteinPer100g: 13,
    carbsPer100g: 41,
    fatPer100g: 3.5
  },
  {
    id: 'avena',
    name: 'Avena',
    category: 'carbohidrato',
    caloriesPer100g: 389,
    proteinPer100g: 17,
    carbsPer100g: 66,
    fatPer100g: 7
  },
  {
    id: 'quinoa',
    name: 'Quinoa',
    category: 'carbohidrato',
    caloriesPer100g: 120,
    proteinPer100g: 4.4,
    carbsPer100g: 21,
    fatPer100g: 1.9
  },
  
  // GRASAS SALUDABLES
  {
    id: 'aceite-oliva',
    name: 'Aceite de Oliva',
    category: 'grasa',
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100
  },
  {
    id: 'aguacate',
    name: 'Aguacate',
    category: 'grasa',
    caloriesPer100g: 160,
    proteinPer100g: 2,
    carbsPer100g: 9,
    fatPer100g: 15
  },
  {
    id: 'nueces',
    name: 'Nueces',
    category: 'grasa',
    caloriesPer100g: 654,
    proteinPer100g: 15,
    carbsPer100g: 14,
    fatPer100g: 65
  },
  {
    id: 'almendras',
    name: 'Almendras',
    category: 'grasa',
    caloriesPer100g: 579,
    proteinPer100g: 21,
    carbsPer100g: 22,
    fatPer100g: 50
  },
  {
    id: 'mantequilla-cacahuete',
    name: 'Mantequilla de Cacahuete',
    category: 'grasa',
    caloriesPer100g: 588,
    proteinPer100g: 25,
    carbsPer100g: 20,
    fatPer100g: 50
  },
  
  // VEGETALES
  {
    id: 'brocoli',
    name: 'Brócoli',
    category: 'vegetal',
    caloriesPer100g: 34,
    proteinPer100g: 2.8,
    carbsPer100g: 7,
    fatPer100g: 0.4
  },
  {
    id: 'espinacas',
    name: 'Espinacas',
    category: 'vegetal',
    caloriesPer100g: 23,
    proteinPer100g: 2.9,
    carbsPer100g: 3.6,
    fatPer100g: 0.4
  },
  {
    id: 'tomate',
    name: 'Tomate',
    category: 'vegetal',
    caloriesPer100g: 18,
    proteinPer100g: 0.9,
    carbsPer100g: 3.9,
    fatPer100g: 0.2
  },
  {
    id: 'lechuga',
    name: 'Lechuga',
    category: 'vegetal',
    caloriesPer100g: 15,
    proteinPer100g: 1.4,
    carbsPer100g: 2.9,
    fatPer100g: 0.2
  },
  {
    id: 'zanahoria',
    name: 'Zanahoria',
    category: 'vegetal',
    caloriesPer100g: 41,
    proteinPer100g: 0.9,
    carbsPer100g: 10,
    fatPer100g: 0.2
  },
  {
    id: 'pimiento',
    name: 'Pimiento',
    category: 'vegetal',
    caloriesPer100g: 31,
    proteinPer100g: 1,
    carbsPer100g: 6,
    fatPer100g: 0.3
  },
  {
    id: 'cebolla',
    name: 'Cebolla',
    category: 'vegetal',
    caloriesPer100g: 40,
    proteinPer100g: 1.1,
    carbsPer100g: 9,
    fatPer100g: 0.1
  },
  
  // LÁCTEOS
  {
    id: 'leche-desnatada',
    name: 'Leche Desnatada',
    category: 'lacteo',
    caloriesPer100g: 34,
    proteinPer100g: 3.4,
    carbsPer100g: 5,
    fatPer100g: 0.1
  },
  {
    id: 'yogur-griego',
    name: 'Yogur Griego Natural',
    category: 'lacteo',
    caloriesPer100g: 59,
    proteinPer100g: 10,
    carbsPer100g: 3.6,
    fatPer100g: 0.4
  },
  {
    id: 'queso-fresco',
    name: 'Queso Fresco Batido 0%',
    category: 'lacteo',
    caloriesPer100g: 72,
    proteinPer100g: 13,
    carbsPer100g: 4,
    fatPer100g: 0.2
  },
  {
    id: 'queso-mozzarella',
    name: 'Queso Mozzarella Light',
    category: 'lacteo',
    caloriesPer100g: 254,
    proteinPer100g: 24,
    carbsPer100g: 3,
    fatPer100g: 16
  },
  
  // FRUTAS
  {
    id: 'platano',
    name: 'Plátano',
    category: 'fruta',
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 23,
    fatPer100g: 0.3
  },
  {
    id: 'manzana',
    name: 'Manzana',
    category: 'fruta',
    caloriesPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 14,
    fatPer100g: 0.2
  },
  {
    id: 'fresas',
    name: 'Fresas',
    category: 'fruta',
    caloriesPer100g: 32,
    proteinPer100g: 0.7,
    carbsPer100g: 8,
    fatPer100g: 0.3
  },
  {
    id: 'arandanos',
    name: 'Arándanos',
    category: 'fruta',
    caloriesPer100g: 57,
    proteinPer100g: 0.7,
    carbsPer100g: 14,
    fatPer100g: 0.3
  },
  
  // CONDIMENTOS (bajos en calorías pero se incluyen)
  {
    id: 'sal',
    name: 'Sal',
    category: 'condimento',
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0
  },
  {
    id: 'pimienta',
    name: 'Pimienta',
    category: 'condimento',
    caloriesPer100g: 251,
    proteinPer100g: 10,
    carbsPer100g: 64,
    fatPer100g: 3.3
  },
  {
    id: 'ajo',
    name: 'Ajo',
    category: 'condimento',
    caloriesPer100g: 149,
    proteinPer100g: 6.4,
    carbsPer100g: 33,
    fatPer100g: 0.5
  },
  
  // PROTEÍNAS ADICIONALES
  {
    id: 'proteina-whey',
    name: 'Proteína Whey',
    category: 'proteina',
    caloriesPer100g: 400,
    proteinPer100g: 80,
    carbsPer100g: 8,
    fatPer100g: 6
  },
  {
    id: 'lentejas',
    name: 'Lentejas Cocidas',
    category: 'proteina',
    caloriesPer100g: 116,
    proteinPer100g: 9,
    carbsPer100g: 20,
    fatPer100g: 0.4
  },
  {
    id: 'garbanzos',
    name: 'Garbanzos Cocidos',
    category: 'proteina',
    caloriesPer100g: 164,
    proteinPer100g: 8.9,
    carbsPer100g: 27,
    fatPer100g: 2.6
  },
  {
    id: 'requesón',
    name: 'Requesón',
    category: 'lacteo',
    caloriesPer100g: 98,
    proteinPer100g: 11,
    carbsPer100g: 3.4,
    fatPer100g: 4.3
  },
  
  // CARBOHIDRATOS ADICIONALES
  {
    id: 'arroz-basmati',
    name: 'Arroz Basmati',
    category: 'carbohidrato',
    caloriesPer100g: 121,
    proteinPer100g: 2.7,
    carbsPer100g: 25,
    fatPer100g: 0.4
  },
  {
    id: 'tortitas-arroz',
    name: 'Tortitas de Arroz',
    category: 'carbohidrato',
    caloriesPer100g: 387,
    proteinPer100g: 8,
    carbsPer100g: 81,
    fatPer100g: 3
  },
  {
    id: 'pan-centeno',
    name: 'Pan de Centeno',
    category: 'carbohidrato',
    caloriesPer100g: 259,
    proteinPer100g: 8.5,
    carbsPer100g: 48,
    fatPer100g: 3.3
  },
  
  // VEGETALES ADICIONALES
  {
    id: 'calabacin',
    name: 'Calabacín',
    category: 'vegetal',
    caloriesPer100g: 17,
    proteinPer100g: 1.2,
    carbsPer100g: 3.1,
    fatPer100g: 0.3
  },
  {
    id: 'berenjena',
    name: 'Berenjena',
    category: 'vegetal',
    caloriesPer100g: 25,
    proteinPer100g: 1,
    carbsPer100g: 6,
    fatPer100g: 0.2
  },
  {
    id: 'esparragos',
    name: 'Espárragos',
    category: 'vegetal',
    caloriesPer100g: 20,
    proteinPer100g: 2.2,
    carbsPer100g: 3.9,
    fatPer100g: 0.1
  },
  {
    id: 'champiñones',
    name: 'Champiñones',
    category: 'vegetal',
    caloriesPer100g: 22,
    proteinPer100g: 3.1,
    carbsPer100g: 3.3,
    fatPer100g: 0.3
  },
  {
    id: 'pepino',
    name: 'Pepino',
    category: 'vegetal',
    caloriesPer100g: 15,
    proteinPer100g: 0.7,
    carbsPer100g: 3.6,
    fatPer100g: 0.1
  },
  
  // FRUTAS ADICIONALES
  {
    id: 'kiwi',
    name: 'Kiwi',
    category: 'fruta',
    caloriesPer100g: 61,
    proteinPer100g: 1.1,
    carbsPer100g: 15,
    fatPer100g: 0.5
  },
  {
    id: 'naranja',
    name: 'Naranja',
    category: 'fruta',
    caloriesPer100g: 47,
    proteinPer100g: 0.9,
    carbsPer100g: 12,
    fatPer100g: 0.1
  },
  {
    id: 'melocotón',
    name: 'Melocotón',
    category: 'fruta',
    caloriesPer100g: 39,
    proteinPer100g: 0.9,
    carbsPer100g: 10,
    fatPer100g: 0.3
  },
  
  // INGREDIENTE GENÉRICO (para platos migrados sin ingredientes)
  {
    id: 'plato-generico',
    name: 'Plato Genérico',
    category: 'condimento' as any, // 'otro' not in type
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0
  }
];

// Función para obtener ingrediente por ID
export function getIngredientById(id: string, customIngredients: Ingredient[] = []): Ingredient | undefined {
  // Primero buscar en la base de datos del sistema
  const systemIngredient = INGREDIENTS_DATABASE.find(ing => ing.id === id);
  if (systemIngredient) return systemIngredient;
  
  // Luego buscar en ingredientes personalizados desde Supabase
  return customIngredients.find(ing => ing.id === id);
}

// ========== INGREDIENTES PERSONALIZADOS ==========
// ⚠️ MIGRADO A SUPABASE - Ya no usar localStorage
// Los ingredientes personalizados ahora se guardan en Supabase vía API:
// - api.getCustomIngredients(email)
// - api.saveCustomIngredients(email, ingredients)

// Función para obtener todos los ingredientes (sistema + personalizados desde Supabase)
export function getAllIngredients(customIngredients: Ingredient[] = []): Ingredient[] {
  return [...INGREDIENTS_DATABASE, ...customIngredients];
}

// Función para calcular macros de una lista de ingredientes
export function calculateMacrosFromIngredients(
  ingredients: MealIngredientReference[],
  customIngredients: Ingredient[] = []  // ✅ AÑADIDO: Parámetro para ingredientes personalizados
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  
  for (const ref of ingredients) {
    const ingredient = getIngredientById(ref.ingredientId, customIngredients); // ✅ Pasar customIngredients
    if (!ingredient) continue;
    
    const factor = ref.amountInGrams / 100; // Convertir a factor de 100g
    
    totalCalories += ingredient.caloriesPer100g * factor;
    totalProtein += ingredient.proteinPer100g * factor;
    totalCarbs += ingredient.carbsPer100g * factor;
    totalFat += ingredient.fatPer100g * factor;
  }
  
  return {
    calories: Math.round(totalCalories),
    // Siempre devolver enteros (sin decimales)
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat)
  };
}