/**
 * TIPOS E INTERFACES DE INGREDIENTES
 * 
 * Sistema robusto con FALLBACK AUTOMÁTICO:
 * 1. Prioridad: Ingredientes desde Supabase (allIngredients)
 * 2. Fallback: Ingredientes locales (INGREDIENTS_DATABASE)
 * 
 * GARANTIZA que el sistema SIEMPRE funciona, incluso si Supabase falla.
 */

import { INGREDIENTS_DATABASE } from './ingredientsDatabase';

export interface Ingredient {
  id: string;
  name: string;
  category: 'proteina' | 'carbohidrato' | 'grasa' | 'vegetal' | 'lacteo' | 'fruta' | 'condimento' | 'personalizado' | string;
  // Macros por 100g
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  // Si es un ingrediente personalizado del usuario
  isCustom?: boolean;
  userId?: string;
  // Metadata interna (para debugging)
  _source?: 'supabase' | 'fallback';
}

export interface MealIngredientReference {
  ingredientId: string;
  amountInGrams: number;
}

/**
 * 🔍 Busca un ingrediente por ID con FALLBACK ROBUSTO
 * 
 * 1. Primero busca en allIngredients (Supabase)
 * 2. Si no encuentra, busca en INGREDIENTS_DATABASE (fallback local)
 * 3. NUNCA devuelve undefined si el ingrediente existe localmente
 * 
 * @param id - ID del ingrediente a buscar
 * @param allIngredients - Lista combinada de ingredientes (base + custom) desde Supabase
 */
export function getIngredientById(id: string, allIngredients: Ingredient[]): Ingredient | undefined {
  // 1️⃣ PRIORIDAD: Buscar en Supabase
  const fromSupabase = allIngredients.find(ing => ing.id === id);
  if (fromSupabase) {
    return { ...fromSupabase, _source: 'supabase' };
  }
  
  // 2️⃣ FALLBACK: Buscar en base de datos local
  const fromLocal = INGREDIENTS_DATABASE.find(ing => ing.id === id);
  if (fromLocal) {
    // Log solo en desarrollo (evitar spam en producción)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [Fallback] Usando ingrediente local: ${id}`);
    }
    return { ...fromLocal, _source: 'fallback' };
  }
  
  // 3️⃣ No encontrado en ningún lado
  return undefined;
}

/**
 * 📊 Calcula los macros totales con VALIDACIÓN ROBUSTA
 * 
 * - Cuenta ingredientes encontrados vs no encontrados
 * - Usa fallback automático a INGREDIENTS_DATABASE
 * - Logs detallados para debugging
 * - Warning si >30% de ingredientes no se encuentran
 * 
 * @param ingredientRefs - Referencias con ingredientId y cantidad en gramos
 * @param allIngredients - Lista combinada de ingredientes (base + custom) desde Supabase
 */
export function calculateMacrosFromIngredients(
  ingredientRefs: MealIngredientReference[],
  allIngredients: Ingredient[]
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
  
  // Contadores para debugging
  let foundCount = 0;
  let fallbackCount = 0;
  const notFound: string[] = [];
  
  for (const ref of ingredientRefs) {
    const ingredient = getIngredientById(ref.ingredientId, allIngredients);
    
    if (!ingredient) {
      console.warn(`⚠️ Ingrediente no encontrado: ${ref.ingredientId}`);
      notFound.push(ref.ingredientId);
      continue;
    }
    
    // Tracking de fuente
    foundCount++;
    if (ingredient._source === 'fallback') {
      fallbackCount++;
    }
    
    const factor = ref.amountInGrams / 100;
    
    totalCalories += ingredient.caloriesPer100g * factor;
    totalProtein += ingredient.proteinPer100g * factor;
    totalCarbs += ingredient.carbsPer100g * factor;
    totalFat += ingredient.fatPer100g * factor;
  }
  
  // Validación y logging
  const totalRequested = ingredientRefs.length;
  const successRate = (foundCount / totalRequested) * 100;
  
  if (notFound.length > 0) {
    console.error(`❌ ${notFound.length}/${totalRequested} ingredientes NO encontrados:`, notFound);
    console.error('🔧 Esto indica que los ingredientes NO están en Supabase ni en INGREDIENTS_DATABASE local');
  }
  
  if (fallbackCount > 0) {
    console.warn(`🔄 ${fallbackCount}/${foundCount} ingredientes usados desde fallback local (Supabase vacío o incompleto)`);
  }
  
  if (successRate < 70) {
    console.error(`⚠️ CRÍTICO: Solo ${successRate.toFixed(0)}% de ingredientes encontrados. Sistema funcionando en modo degradado.`);
  }
  
  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat)
  };
}

/**
 * Busca un ingrediente por nombre (para migración de platos legacy)
 */
export function findIngredientByName(name: string, allIngredients: Ingredient[]): Ingredient | undefined {
  const nameLower = name.toLowerCase().trim();
  
  // Búsqueda exacta
  const exactMatch = allIngredients.find(
    ing => ing.name.toLowerCase() === nameLower
  );
  if (exactMatch) return exactMatch;
  
  // Búsqueda parcial
  return allIngredients.find(ing => {
    const ingNameLower = ing.name.toLowerCase();
    return ingNameLower.includes(nameLower) || nameLower.includes(ingNameLower);
  });
}
