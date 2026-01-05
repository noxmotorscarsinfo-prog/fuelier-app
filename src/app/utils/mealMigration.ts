/**
 * 🔄 MEAL MIGRATION UTILITY
 * 
 * Convierte platos viejos sin ingredientReferences a platos con ingredientes estructurados.
 * Esto garantiza que TODOS los platos puedan escalarse correctamente.
 */

import { Meal, MealIngredientReference } from '../types';
import { INGREDIENTS_DATABASE } from '../../data/ingredientsDatabase';

/**
 * 🔍 NUEVA FUNCIÓN: Extrae cantidad y nombre de un string de ingrediente
 * Ejemplos: "50g salmón ahumado" → {grams: 50, name: "salmón ahumado"}
 *           "100g aguacate" → {grams: 100, name: "aguacate"}
 */
function parseIngredientString(ingredientStr: string): { grams: number; name: string } | null {
  // Regex para capturar "XXXg nombre del ingrediente"
  const match = ingredientStr.match(/^(\d+(?:\.\d+)?)\s*g\s+(.+)$/i);
  
  if (match) {
    return {
      grams: parseFloat(match[1]),
      name: match[2].trim().toLowerCase()
    };
  }
  
  return null;
}

/**
 * 🔍 Busca un ingrediente en la base de datos por similitud de nombre
 */
function findIngredientByName(name: string): string | null {
  const normalizedName = name.toLowerCase().trim();
  
  // 1. Búsqueda exacta
  const exactMatch = INGREDIENTS_DATABASE.find(
    ing => ing.name.toLowerCase() === normalizedName
  );
  if (exactMatch) return exactMatch.id;
  
  // 2. Búsqueda por inclusión (el nombre contiene o está contenido)
  const partialMatch = INGREDIENTS_DATABASE.find(ing => {
    const dbName = ing.name.toLowerCase();
    return dbName.includes(normalizedName) || normalizedName.includes(dbName);
  });
  if (partialMatch) return partialMatch.id;
  
  // 3. Mapeos especiales para nombres comunes
  const specialMappings: Record<string, string> = {
    // Salmón
    'salmón ahumado': 'salmon',
    'salmon ahumado': 'salmon',
    'salmón': 'salmon',
    'salmon': 'salmon',
    
    // Pollo
    'pechuga de pollo': 'pollo-pechuga',
    'pechuga pollo': 'pollo-pechuga',
    'pollo': 'pollo-pechuga',
    
    // Aguacate
    'aguacate': 'aguacate',
    
    // Quesos
    'queso mozzarella': 'queso-mozzarella',
    'mozzarella': 'queso-mozzarella',
    'queso fresco': 'queso-fresco',
    'queso': 'queso-fresco',
    
    // Pan y tostadas
    'pan integral': 'pan-integral',
    'pan tostado': 'pan-integral',
    'tostadas': 'pan-integral',
    'tostada': 'pan-integral',
    'pan': 'pan-integral',
    
    // Vegetales
    'tomate': 'tomate',
    'lechuga': 'lechuga',
    'pepino': 'pepino',
    'zanahoria': 'zanahoria',
    'espinaca': 'espinacas',
    'espinacas': 'espinacas',
    
    // Aceites
    'aceite de oliva': 'aceite-oliva',
    'aceite oliva': 'aceite-oliva',
    'aceite': 'aceite-oliva',
    'aove': 'aceite-oliva',
    
    // Arroz y pasta
    'arroz': 'arroz-blanco',
    'arroz blanco': 'arroz-blanco',
    'arroz integral': 'arroz-integral',
    'pasta': 'pasta',
    
    // Huevos
    'huevo': 'huevo',
    'huevos': 'huevo',
    
    // Lácteos
    'leche': 'leche-desnatada',
    'leche desnatada': 'leche-desnatada',
    'yogur': 'yogur-griego',
    'yogur griego': 'yogur-griego',
    
    // Frutas
    'platano': 'platano',
    'plátano': 'platano',
    'banana': 'platano',
    'manzana': 'manzana',
    
    // Avena
    'avena': 'avena',
    'copos de avena': 'avena',
    
    // Atún
    'atún': 'atun-natural',
    'atun': 'atun-natural',
    'atún natural': 'atun-natural',
    'atun natural': 'atun-natural',
    
    // Pavo
    'pavo': 'pavo-pechuga',
    'pechuga de pavo': 'pavo-pechuga',
    'pechuga pavo': 'pavo-pechuga'
  };
  
  if (specialMappings[normalizedName]) {
    return specialMappings[normalizedName];
  }
  
  return null;
}

/**
 * 🆕 NUEVA ESTRATEGIA: Intenta inferir ingredientes desde el campo "ingredients"
 * Este campo contiene strings como ["50g salmón ahumado", "100g aguacate"]
 */
function inferIngredientsFromStrings(meal: Meal): MealIngredientReference[] {
  const references: MealIngredientReference[] = [];
  
  // Si el plato tiene el campo "ingredients" (array de strings)
  if (meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
    console.log(`   🔍 Analizando ingredientes de "${meal.name}":`, meal.ingredients);
    
    for (const ingredientStr of meal.ingredients) {
      const parsed = parseIngredientString(ingredientStr);
      
      if (!parsed) {
        console.warn(`   ⚠️ No se pudo parsear: "${ingredientStr}"`);
        continue;
      }
      
      const ingredientId = findIngredientByName(parsed.name);
      
      if (ingredientId) {
        references.push({
          ingredientId,
          amountInGrams: parsed.grams
        });
        console.log(`   ✅ Mapeado: "${ingredientStr}" → ${ingredientId} (${parsed.grams}g)`);
      } else {
        console.warn(`   ⚠️ No se encontró ingrediente para: "${parsed.name}"`);
      }
    }
  }
  
  // Si se pudieron mapear ingredientes, retornarlos
  if (references.length > 0) {
    console.log(`   ✨ Se mapearon ${references.length} ingredientes correctamente`);
    return references;
  }
  
  // Si no hay ingredients o no se pudo mapear nada, usar estrategia de respaldo
  console.log(`   ⚠️ No se pudieron mapear ingredientes. Usando inferencia por macros...`);
  return inferIngredientsFromMacros(meal);
}

/**
 * Intenta inferir ingredientes basándose en los macros del plato
 * Esta es una solución de respaldo para platos sin ingredientes
 */
function inferIngredientsFromMacros(meal: Meal): MealIngredientReference[] {
  const references: MealIngredientReference[] = [];
  
  // Estrategia: Crear un plato "genérico" que coincida con los macros
  // usando ingredientes base comunes
  
  // 1. Calcular proteína necesaria (usar pechuga de pollo como base)
  const proteinNeeded = meal.protein;
  if (proteinNeeded > 0) {
    const chickenBreast = INGREDIENTS_DATABASE.find(i => i.id === 'pollo-pechuga');
    if (chickenBreast) {
      // Pechuga de pollo: ~23g proteína por 100g
      const gramsNeeded = Math.round((proteinNeeded / chickenBreast.proteinPer100g) * 100);
      references.push({
        ingredientId: 'pollo-pechuga',
        amountInGrams: gramsNeeded
      });
    }
  }
  
  // 2. Calcular carbohidratos necesarios (usar arroz como base)
  const carbsNeeded = meal.carbs;
  if (carbsNeeded > 0) {
    const rice = INGREDIENTS_DATABASE.find(i => i.id === 'arroz-blanco');
    if (rice) {
      // Arroz: ~28g carbos por 100g
      const gramsNeeded = Math.round((carbsNeeded / rice.carbsPer100g) * 100);
      references.push({
        ingredientId: 'arroz-blanco',
        amountInGrams: gramsNeeded
      });
    }
  }
  
  // 3. Calcular grasas necesarias (usar aceite de oliva como base)
  const fatNeeded = meal.fat;
  if (fatNeeded > 0) {
    const oil = INGREDIENTS_DATABASE.find(i => i.id === 'aceite-oliva');
    if (oil) {
      // Aceite: ~100g grasa por 100g
      const gramsNeeded = Math.round((fatNeeded / oil.fatPer100g) * 100);
      references.push({
        ingredientId: 'aceite-oliva',
        amountInGrams: gramsNeeded
      });
    }
  }
  
  return references;
}

/**
 * Migra un plato sin ingredientReferences a uno con ingredientes estructurados
 */
export function migrateMealToStructured(meal: Meal): Meal {
  // Si ya tiene ingredientReferences, no hacer nada
  if (meal.ingredientReferences && meal.ingredientReferences.length > 0) {
    return meal;
  }
  
  console.log(`   🔄 Migrando "${meal.name}"...`);
  
  // 🆕 NUEVA ESTRATEGIA: Intentar mapear desde el campo "ingredients"
  const inferredIngredients = inferIngredientsFromStrings(meal);
  
  // Si no se pudieron inferir ingredientes, crear un ingrediente genérico
  if (inferredIngredients.length === 0) {
    console.warn(`   ⚠️ No se pudieron inferir ingredientes para "${meal.name}". Usando ingrediente genérico.`);
    
    // Crear un "ingrediente genérico" que tenga los mismos macros que el plato
    inferredIngredients.push({
      ingredientId: 'plato-generico',
      amountInGrams: 100  // Base 100g
    });
  }
  
  // Crear nueva versión del plato con ingredientes
  const migratedMeal: Meal = {
    ...meal,
    ingredientReferences: inferredIngredients,
    // Marcar como migrado para debugging
    _migrated: true
  };
  
  console.log(`   ✅ "${meal.name}" → ${inferredIngredients.length} ingredientes inferidos`);
  
  return migratedMeal;
}

/**
 * Migra un array de platos, convirtiendo todos los que no tengan ingredientes
 * ⚠️ INTENTA REPARAR AUTOMÁTICAMENTE usando el campo "ingredients"
 */
export function migrateMealsToStructured(meals: Meal[]): Meal[] {
  // Separar platos globales y personalizados
  const globalMeals = meals.filter(meal => !meal.isCustom);
  const customMeals = meals.filter(meal => meal.isCustom);
  
  // Verificar cuántos platos necesitan migración
  const globalMealsNeedingMigration = globalMeals.filter(
    meal => !meal.ingredientReferences || meal.ingredientReferences.length === 0
  );
  
  const customMealsNeedingMigration = customMeals.filter(
    meal => !meal.ingredientReferences || meal.ingredientReferences.length === 0
  );
  
  const totalNeedingMigration = globalMealsNeedingMigration.length + customMealsNeedingMigration.length;
  
  if (totalNeedingMigration === 0) {
    // No hay nada que migrar, devolver tal cual sin logs
    return meals;
  }
  
  console.log(`🔄 Detectados ${totalNeedingMigration} platos sin ingredientes:`);
  console.log(`   - ${globalMealsNeedingMigration.length} platos globales`);
  console.log(`   - ${customMealsNeedingMigration.length} platos personalizados`);
  console.log(`   Iniciando reparación automática...`);
  
  // Migrar platos globales
  let migratedGlobalCount = 0;
  const migratedGlobalMeals = globalMeals.map(meal => {
    if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
      migratedGlobalCount++;
      return migrateMealToStructured(meal);
    }
    return meal;
  });
  
  // 🆕 TAMBIÉN MIGRAR PLATOS PERSONALIZADOS
  // Esto permitirá recuperar tus platos antiguos automáticamente
  let migratedCustomCount = 0;
  const migratedCustomMeals = customMeals.map(meal => {
    if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) {
      migratedCustomCount++;
      console.log(`   🔧 Reparando plato personalizado: "${meal.name}"`);
      return migrateMealToStructured(meal);
    }
    return meal;
  });
  
  console.log(`✅ Reparación completada:`);
  console.log(`   - ${migratedGlobalCount} platos globales migrados`);
  console.log(`   - ${migratedCustomCount} platos personalizados reparados`);
  
  // Combinar todos los platos migrados
  return [...migratedGlobalMeals, ...migratedCustomMeals];
}
