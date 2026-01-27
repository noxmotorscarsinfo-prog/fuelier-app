/**
 * 🤖 CLASIFICACIÓN AUTOMÁTICA DE INGREDIENTES POR IA
 * 
 * Sistema inteligente que analiza el perfil nutricional de cada ingrediente
 * y lo clasifica automáticamente en tipologías coherentes.
 * 
 * Esto permite que el algoritmo de escalado trate ingredientes similares
 * de manera consistente, mejorando la precisión y coherencia nutricional.
 */

import { Ingredient } from '../../data/ingredientTypes';

/**
 * Tipologías nutricionales automáticas basadas en perfil macro
 */
export type NutritionalTypology = 
  | 'protein-lean'           // Proteína magra (>20% prot, <10% grasa) - pollo, pavo, pescado blanco
  | 'protein-moderate-fat'   // Proteína con grasa moderada (>15% prot, 10-20% grasa) - huevos, salmón
  | 'protein-high-fat'       // Proteína alta en grasa (>15% prot, >20% grasa) - ternera, cerdo
  | 'carb-simple'            // Carbohidrato simple (>70% carbos, <5% fibra) - arroz blanco, pasta blanca
  | 'carb-complex'           // Carbohidrato complejo (>50% carbos, >5% fibra) - arroz integral, avena
  | 'carb-starchy'           // Carbohidrato almidonado (>15% carbos, tubérculos) - patata, boniato
  | 'fat-healthy'            // Grasa saludable (>70% grasa) - aceite oliva, aguacate, frutos secos
  | 'vegetable-low-carb'     // Vegetal bajo en carbos (<10% carbos) - lechuga, espinacas, brócoli
  | 'vegetable-moderate-carb'// Vegetal moderado en carbos (10-20% carbos) - zanahoria, pimiento
  | 'dairy-low-fat'          // Lácteo bajo en grasa (<5% grasa) - leche desnatada, yogur 0%
  | 'dairy-moderate-fat'     // Lácteo con grasa (5-20% grasa) - queso fresco, yogur griego
  | 'dairy-high-fat'         // Lácteo alto en grasa (>20% grasa) - queso curado, nata
  | 'fruit-low-sugar'        // Fruta baja en azúcar (<10% carbos) - fresas, arándanos
  | 'fruit-moderate-sugar'   // Fruta moderada en azúcar (10-20% carbos) - manzana, pera
  | 'fruit-high-sugar'       // Fruta alta en azúcar (>20% carbos) - plátano, uvas
  | 'mixed-balanced'         // Perfil balanceado (ningún macro >50%)
  | 'condiment';             // Condimento/especias (cantidades muy pequeñas)

/**
 * Resultado del análisis de un ingrediente
 */
export interface IngredientAnalysis {
  ingredient: Ingredient;
  typology: NutritionalTypology;
  profile: {
    proteinPercent: number;  // % de calorías de proteína
    carbsPercent: number;    // % de calorías de carbohidratos
    fatPercent: number;      // % de calorías de grasa
  };
  dominantMacro: 'protein' | 'carbs' | 'fat' | 'balanced';
  confidence: number; // 0-1: confianza en la clasificación
}

/**
 * Calcula el perfil nutricional porcentual de un ingrediente
 */
function calculateNutritionalProfile(ingredient: Ingredient): {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
} {
  const totalCalories = ingredient.caloriesPer100g;
  
  if (totalCalories === 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatPercent: 0 };
  }
  
  // Calorías por gramo: proteína = 4, carbos = 4, grasa = 9
  const proteinCals = ingredient.proteinPer100g * 4;
  const carbsCals = ingredient.carbsPer100g * 4;
  const fatCals = ingredient.fatPer100g * 9;
  
  return {
    proteinPercent: (proteinCals / totalCalories) * 100,
    carbsPercent: (carbsCals / totalCalories) * 100,
    fatPercent: (fatCals / totalCalories) * 100
  };
}

/**
 * Clasifica automáticamente un ingrediente basándose en su perfil nutricional
 * 
 * 🤖 ALGORITMO DE IA:
 * 1. Analiza la distribución de macronutrientes
 * 2. Identifica el macro dominante
 * 3. Aplica reglas de clasificación jerárquica
 * 4. Asigna la tipología más específica posible
 */
export function classifyIngredient(ingredient: Ingredient): IngredientAnalysis {
  const profile = calculateNutritionalProfile(ingredient);
  const { proteinPercent, carbsPercent, fatPercent } = profile;
  
  // Identificar macro dominante
  let dominantMacro: 'protein' | 'carbs' | 'fat' | 'balanced' = 'balanced';
  const maxPercent = Math.max(proteinPercent, carbsPercent, fatPercent);
  
  if (maxPercent > 40) {
    if (proteinPercent === maxPercent) dominantMacro = 'protein';
    else if (carbsPercent === maxPercent) dominantMacro = 'carbs';
    else if (fatPercent === maxPercent) dominantMacro = 'fat';
  }
  
  let typology: NutritionalTypology = 'mixed-balanced';
  let confidence = 0.7; // Confianza por defecto
  
  // ═══════════════════════════════════════════════════
  // 🥩 CLASIFICACIÓN DE PROTEÍNAS
  // ═══════════════════════════════════════════════════
  if (dominantMacro === 'protein' || proteinPercent > 25) {
    confidence = 0.9;
    
    const fatGramPercent = (ingredient.fatPer100g / 100) * 100; // % de grasa por peso
    
    if (fatGramPercent < 5) {
      typology = 'protein-lean';
      confidence = 0.95;
    } else if (fatGramPercent < 15) {
      typology = 'protein-moderate-fat';
      confidence = 0.9;
    } else {
      typology = 'protein-high-fat';
      confidence = 0.9;
    }
  }
  
  // ═══════════════════════════════════════════════════
  // 🍚 CLASIFICACIÓN DE CARBOHIDRATOS
  // ═══════════════════════════════════════════════════
  else if (dominantMacro === 'carbs' || carbsPercent > 40) {
    confidence = 0.9;
    
    const carbsGramPercent = (ingredient.carbsPer100g / 100) * 100;
    const category = ingredient.category?.toLowerCase() || '';
    
    // Detectar tubérculos/raíces
    if (category.includes('tuberculo') || 
        ingredient.name.toLowerCase().match(/patata|boniato|yuca|mandioca/)) {
      typology = 'carb-starchy';
      confidence = 0.95;
    }
    // Carbohidratos complejos (más fibra, integrales)
    else if (ingredient.name.toLowerCase().match(/integral|avena|quinoa/) ||
             carbsGramPercent < 70) {
      typology = 'carb-complex';
      confidence = 0.9;
    }
    // Carbohidratos simples (refinados)
    else {
      typology = 'carb-simple';
      confidence = 0.9;
    }
  }
  
  // ═══════════════════════════════════════════════════
  // 🥑 CLASIFICACIÓN DE GRASAS
  // ═══════════════════════════════════════════════════
  else if (dominantMacro === 'fat' || fatPercent > 60) {
    typology = 'fat-healthy';
    confidence = 0.9;
  }
  
  // ═══════════════════════════════════════════════════
  // 🥬 CLASIFICACIÓN DE VEGETALES
  // ═══════════════════════════════════════════════════
  if (ingredient.category === 'vegetal') {
    confidence = 0.95;
    const carbsGramPercent = (ingredient.carbsPer100g / 100) * 100;
    
    if (carbsGramPercent < 8) {
      typology = 'vegetable-low-carb';
    } else {
      typology = 'vegetable-moderate-carb';
    }
  }
  
  // ═══════════════════════════════════════════════════
  // 🥛 CLASIFICACIÓN DE LÁCTEOS
  // ═══════════════════════════════════════════════════
  if (ingredient.category === 'lacteo') {
    confidence = 0.95;
    const fatGramPercent = (ingredient.fatPer100g / 100) * 100;
    
    if (fatGramPercent < 3) {
      typology = 'dairy-low-fat';
    } else if (fatGramPercent < 15) {
      typology = 'dairy-moderate-fat';
    } else {
      typology = 'dairy-high-fat';
    }
  }
  
  // ═══════════════════════════════════════════════════
  // 🍎 CLASIFICACIÓN DE FRUTAS
  // ═══════════════════════════════════════════════════
  if (ingredient.category === 'fruta') {
    confidence = 0.95;
    const carbsGramPercent = (ingredient.carbsPer100g / 100) * 100;
    
    if (carbsGramPercent < 8) {
      typology = 'fruit-low-sugar';
    } else if (carbsGramPercent < 18) {
      typology = 'fruit-moderate-sugar';
    } else {
      typology = 'fruit-high-sugar';
    }
  }
  
  // ═══════════════════════════════════════════════════
  // 🧂 CLASIFICACIÓN DE CONDIMENTOS
  // ═══════════════════════════════════════════════════
  if (ingredient.category === 'condimento') {
    typology = 'condiment';
    confidence = 1.0;
  }
  
  return {
    ingredient,
    typology,
    profile,
    dominantMacro,
    confidence
  };
}

/**
 * Clasifica automáticamente un array de ingredientes
 */
export function classifyIngredients(ingredients: Ingredient[]): IngredientAnalysis[] {
  return ingredients.map(ing => classifyIngredient(ing));
}

/**
 * Agrupa ingredientes por tipología
 */
export function groupByTypology(ingredients: Ingredient[]): Map<NutritionalTypology, Ingredient[]> {
  const classified = classifyIngredients(ingredients);
  const groups = new Map<NutritionalTypology, Ingredient[]>();
  
  classified.forEach(analysis => {
    if (!groups.has(analysis.typology)) {
      groups.set(analysis.typology, []);
    }
    groups.get(analysis.typology)!.push(analysis.ingredient);
  });
  
  return groups;
}

/**
 * Obtiene estadísticas de clasificación
 */
export function getClassificationStats(ingredients: Ingredient[]): {
  total: number;
  byTypology: Record<string, number>;
  averageConfidence: number;
} {
  const classified = classifyIngredients(ingredients);
  
  const byTypology: Record<string, number> = {};
  let totalConfidence = 0;
  
  classified.forEach(analysis => {
    byTypology[analysis.typology] = (byTypology[analysis.typology] || 0) + 1;
    totalConfidence += analysis.confidence;
  });
  
  return {
    total: classified.length,
    byTypology,
    averageConfidence: totalConfidence / classified.length
  };
}

/**
 * 🎯 COEFICIENTES DE ESCALADO POR TIPOLOGÍA
 * 
 * Define cómo debe escalar cada tipo de ingrediente cuando hay que
 * ajustar las cantidades para alcanzar macros objetivo.
 * 
 * Valores:
 * - priority: 'high' | 'medium' | 'low' - prioridad al escalar
 * - flexibility: 0-1 - cuánto puede variar la cantidad (1 = muy flexible)
 * - preferredDirection: 'up' | 'down' | 'neutral' - dirección preferida al ajustar
 */
export const SCALING_COEFFICIENTS: Record<NutritionalTypology, {
  priority: 'high' | 'medium' | 'low';
  flexibility: number;
  preferredDirection: 'up' | 'down' | 'neutral';
}> = {
  // PROTEÍNAS - Alta prioridad, baja flexibilidad (mantener cantidades)
  'protein-lean': { priority: 'high', flexibility: 0.3, preferredDirection: 'neutral' },
  'protein-moderate-fat': { priority: 'high', flexibility: 0.4, preferredDirection: 'neutral' },
  'protein-high-fat': { priority: 'medium', flexibility: 0.5, preferredDirection: 'down' },
  
  // CARBOHIDRATOS - Media prioridad, alta flexibilidad (fácil ajustar)
  'carb-simple': { priority: 'medium', flexibility: 0.8, preferredDirection: 'neutral' },
  'carb-complex': { priority: 'medium', flexibility: 0.7, preferredDirection: 'up' },
  'carb-starchy': { priority: 'medium', flexibility: 0.7, preferredDirection: 'neutral' },
  
  // GRASAS - Baja prioridad, alta flexibilidad (pequeños cambios = gran impacto)
  'fat-healthy': { priority: 'low', flexibility: 0.9, preferredDirection: 'neutral' },
  
  // VEGETALES - Baja prioridad, muy alta flexibilidad (añadir volumen sin impacto macro)
  'vegetable-low-carb': { priority: 'low', flexibility: 1.0, preferredDirection: 'up' },
  'vegetable-moderate-carb': { priority: 'low', flexibility: 0.9, preferredDirection: 'up' },
  
  // LÁCTEOS - Media prioridad, media flexibilidad
  'dairy-low-fat': { priority: 'medium', flexibility: 0.6, preferredDirection: 'neutral' },
  'dairy-moderate-fat': { priority: 'medium', flexibility: 0.5, preferredDirection: 'neutral' },
  'dairy-high-fat': { priority: 'low', flexibility: 0.7, preferredDirection: 'down' },
  
  // FRUTAS - Baja prioridad, media flexibilidad
  'fruit-low-sugar': { priority: 'low', flexibility: 0.7, preferredDirection: 'up' },
  'fruit-moderate-sugar': { priority: 'low', flexibility: 0.6, preferredDirection: 'neutral' },
  'fruit-high-sugar': { priority: 'low', flexibility: 0.5, preferredDirection: 'down' },
  
  // MIXTOS - Media prioridad, media flexibilidad
  'mixed-balanced': { priority: 'medium', flexibility: 0.6, preferredDirection: 'neutral' },
  
  // CONDIMENTOS - Muy baja prioridad, flexibilidad mínima (mantener receta)
  'condiment': { priority: 'low', flexibility: 0.2, preferredDirection: 'neutral' }
};

/**
 * Genera un reporte detallado de clasificación para debugging
 */
export function generateClassificationReport(ingredients: Ingredient[]): string {
  const classified = classifyIngredients(ingredients);
  const stats = getClassificationStats(ingredients);
  
  let report = '═══════════════════════════════════════════════════════\n';
  report += '🤖 REPORTE DE CLASIFICACIÓN AUTOMÁTICA DE INGREDIENTES\n';
  report += '═══════════════════════════════════════════════════════\n\n';
  
  report += `📊 Total ingredientes analizados: ${stats.total}\n`;
  report += `✅ Confianza promedio: ${(stats.averageConfidence * 100).toFixed(1)}%\n\n`;
  
  report += '📈 DISTRIBUCIÓN POR TIPOLOGÍA:\n';
  report += '─────────────────────────────────────────────────────\n';
  Object.entries(stats.byTypology)
    .sort(([, a], [, b]) => b - a)
    .forEach(([typology, count]) => {
      report += `  ${typology.padEnd(25)} ${count} ingredientes\n`;
    });
  
  report += '\n📋 DETALLE POR INGREDIENTE:\n';
  report += '─────────────────────────────────────────────────────\n';
  
  classified.forEach(analysis => {
    report += `\n${analysis.ingredient.name} (${analysis.ingredient.id})\n`;
    report += `  ├─ Tipología: ${analysis.typology} (${(analysis.confidence * 100).toFixed(0)}% confianza)\n`;
    report += `  ├─ Perfil: P:${analysis.profile.proteinPercent.toFixed(1)}% | C:${analysis.profile.carbsPercent.toFixed(1)}% | G:${analysis.profile.fatPercent.toFixed(1)}%\n`;
    report += `  ├─ Dominante: ${analysis.dominantMacro}\n`;
    report += `  └─ Macros/100g: ${analysis.ingredient.proteinPer100g}P | ${analysis.ingredient.carbsPer100g}C | ${analysis.ingredient.fatPer100g}G\n`;
  });
  
  report += '\n═══════════════════════════════════════════════════════\n';
  
  return report;
}
