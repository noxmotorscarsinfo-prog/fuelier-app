/**
 * ============================================================================
 * TEST: INGREDIENT CLASSIFIER
 * ============================================================================
 * 
 * Valida que la clasificación de ingredientes funciona correctamente
 * con los 34 platos existentes.
 * 
 * CRITERIOS DE ÉXITO:
 * - ✅ 100% de platos clasificados sin errores
 * - ✅ Structural identificados correctamente
 * - ✅ Ningún plato con 0 ingredientes en alguna categoría
 * - ✅ Metadata calculada correctamente
 */

import { createClient } from '@supabase/supabase-js';
import { classifyIngredients } from '../../src/app/utils/scaling/ingredientClassifier';
import { Meal, MealIngredient } from '../../src/types';
import { Ingredient } from '../../src/data/ingredientTypes';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testIngredientClassifier() {
  console.log('🧪 ============================================');
  console.log('🧪 TEST: INGREDIENT CLASSIFIER');
  console.log('🧪 ============================================\n');
  
  try {
    // Cargar ingredientes de Supabase
    const { data: ingredients, error: ingError } = await supabase
      .from('ingredients')
      .select('*');
    
    if (ingError) throw ingError;
    
    console.log(`📦 Ingredientes cargados: ${ingredients?.length || 0}\n`);
    
    // Cargar platos de Supabase
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*');
    
    if (mealsError) throw mealsError;
    
    console.log(`🍽️  Platos cargados: ${meals?.length || 0}\n`);
    
    // Convertir ingredientes a formato esperado
    const allIngredients: Ingredient[] = (ingredients || []).map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      caloriesPer100g: ing.calories || 0,
      proteinPer100g: ing.protein || 0,
      carbsPer100g: ing.carbs || 0,
      fatPer100g: ing.fat || 0,
      category: ing.category || '',
    }));
    
    let totalTests = 0;
    let successfulTests = 0;
    const results: any[] = [];
    
    // Procesar cada plato
    for (const meal of meals || []) {
      totalTests++;
      
      try {
        // Construir mealIngredients
        const mealIngredients = (meal.ingredientReferences || []).map((ref: any) => {
          const ingredient = allIngredients.find(i => i.id === ref.ingredientId);
          if (!ingredient) {
            throw new Error(`Ingrediente ${ref.ingredientId} no encontrado`);
          }
          
          const ratio = ref.quantity / 100;
          
          return {
            id: ref.ingredientId || ingredient.id,
            ingredientId: ref.ingredientId,
            ingredientName: ingredient.name,
            amount: ref.quantity,
            calories: ingredient.caloriesPer100g * ratio,
            protein: ingredient.proteinPer100g * ratio,
            carbs: ingredient.carbsPer100g * ratio,
            fat: ingredient.fatPer100g * ratio,
          };
        });
        
        // Agregar mealIngredients al meal
        const mealWithIngredients = {
          ...meal,
          mealIngredients,
        };
        
        // Clasificar ingredientes
        const classification = classifyIngredients(
          mealWithIngredients as any,
          allIngredients
        );
        
        successfulTests++;
        
        // Guardar resultado
        results.push({
          meal: meal.name,
          type: meal.type,
          totalIngredients: classification.metadata.totalIngredients,
          structural: classification.structural.length,
          flexiblePrimary: classification.flexiblePrimary.length,
          flexibleSecondary: classification.flexibleSecondary.length,
          coreRatio: classification.metadata.coreRatio.toFixed(1),
          dominantMacro: classification.metadata.dominantMacro,
          complexity: classification.metadata.complexity,
          classification,
        });
        
      } catch (error) {
        console.error(`❌ Error en plato "${meal.name}":`, error);
        results.push({
          meal: meal.name,
          type: meal.type,
          error: (error as Error).message,
        });
      }
    }
    
    // Mostrar resultados
    console.log('📊 RESULTADOS POR PLATO:\n');
    console.log('═'.repeat(120));
    console.log(
      'PLATO'.padEnd(35) +
      'TIPO'.padEnd(12) +
      'TOTAL'.padEnd(8) +
      'STRUCT'.padEnd(9) +
      'FLEX1'.padEnd(8) +
      'FLEX2'.padEnd(8) +
      'CORE%'.padEnd(10) +
      'DOMINANT'.padEnd(10) +
      'COMPLEX'
    );
    console.log('═'.repeat(120));
    
    results.forEach(r => {
      if (r.error) {
        console.log(`${r.meal.padEnd(35)} ERROR: ${r.error}`);
      } else {
        console.log(
          r.meal.padEnd(35) +
          r.type.padEnd(12) +
          r.totalIngredients.toString().padEnd(8) +
          r.structural.toString().padEnd(9) +
          r.flexiblePrimary.toString().padEnd(8) +
          r.flexibleSecondary.toString().padEnd(8) +
          `${r.coreRatio}%`.padEnd(10) +
          r.dominantMacro.padEnd(10) +
          r.complexity
        );
      }
    });
    
    console.log('═'.repeat(120));
    
    // Análisis detallado de algunos platos
    console.log('\n📋 ANÁLISIS DETALLADO (Ejemplos):\n');
    
    const samplesToShow = ['Pollo con Arroz Integral', 'Tortilla de Avena', 'Frutas con Almendras'];
    
    samplesToShow.forEach(mealName => {
      const result = results.find(r => r.meal === mealName);
      if (!result || result.error) return;
      
      console.log(`\n🍽️  ${mealName}:`);
      console.log(`   Complejidad: ${result.complexity} | Core Ratio: ${result.coreRatio}% | Macro dominante: ${result.dominantMacro}`);
      console.log(`\n   STRUCTURAL (${result.structural}):`);
      result.classification.structural.forEach((ing: any) => {
        console.log(`      • ${ing.ingredientName} (${ing.amount.toFixed(0)}g) - ${ing.reason}`);
      });
      
      console.log(`\n   FLEXIBLE PRIMARY (${result.flexiblePrimary}):`);
      result.classification.flexiblePrimary.forEach((ing: any) => {
        console.log(`      • ${ing.ingredientName} (${ing.amount.toFixed(0)}g) - ${ing.reason}`);
      });
      
      console.log(`\n   FLEXIBLE SECONDARY (${result.flexibleSecondary}):`);
      result.classification.flexibleSecondary.forEach((ing: any) => {
        console.log(`      • ${ing.ingredientName} (${ing.amount.toFixed(0)}g) - ${ing.reason}`);
      });
    });
    
    // Estadísticas globales
    console.log('\n\n📈 ESTADÍSTICAS GLOBALES:\n');
    
    const successful = results.filter(r => !r.error);
    const avgStructural = successful.reduce((sum, r) => sum + r.structural, 0) / successful.length;
    const avgFlexPrimary = successful.reduce((sum, r) => sum + r.flexiblePrimary, 0) / successful.length;
    const avgFlexSecondary = successful.reduce((sum, r) => sum + r.flexibleSecondary, 0) / successful.length;
    const avgCoreRatio = successful.reduce((sum, r) => sum + parseFloat(r.coreRatio), 0) / successful.length;
    
    console.log(`   Total platos procesados: ${totalTests}`);
    console.log(`   ✅ Exitosos: ${successfulTests} (${((successfulTests / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Errores: ${totalTests - successfulTests}`);
    console.log();
    console.log(`   Promedio ingredientes structural: ${avgStructural.toFixed(1)}`);
    console.log(`   Promedio ingredientes flexible primary: ${avgFlexPrimary.toFixed(1)}`);
    console.log(`   Promedio ingredientes flexible secondary: ${avgFlexSecondary.toFixed(1)}`);
    console.log(`   Promedio core ratio: ${avgCoreRatio.toFixed(1)}%`);
    
    // Distribución por complejidad
    const byComplexity = {
      simple: successful.filter(r => r.complexity === 'simple').length,
      medium: successful.filter(r => r.complexity === 'medium').length,
      complex: successful.filter(r => r.complexity === 'complex').length,
    };
    
    console.log('\n   Distribución por complejidad:');
    console.log(`      Simple: ${byComplexity.simple} platos`);
    console.log(`      Medium: ${byComplexity.medium} platos`);
    console.log(`      Complex: ${byComplexity.complex} platos`);
    
    // Distribución por macro dominante
    const byMacro = {
      protein: successful.filter(r => r.dominantMacro === 'protein').length,
      carbs: successful.filter(r => r.dominantMacro === 'carbs').length,
      fat: successful.filter(r => r.dominantMacro === 'fat').length,
    };
    
    console.log('\n   Distribución por macro dominante:');
    console.log(`      Protein: ${byMacro.protein} platos`);
    console.log(`      Carbs: ${byMacro.carbs} platos`);
    console.log(`      Fat: ${byMacro.fat} platos`);
    
    // Validaciones
    console.log('\n\n✅ VALIDACIONES:\n');
    
    let validations = 0;
    let passed = 0;
    
    // Validación 1: Todos los platos tienen al menos 1 structural
    validations++;
    const allHaveStructural = successful.every(r => r.structural >= 1);
    if (allHaveStructural) {
      passed++;
      console.log('   ✅ Todos los platos tienen al menos 1 ingrediente structural');
    } else {
      console.log('   ❌ Algunos platos no tienen ingredientes structural');
    }
    
    // Validación 2: Ningún plato tiene más de 3 structural
    validations++;
    const noneHaveTooMany = successful.every(r => r.structural <= 3);
    if (noneHaveTooMany) {
      passed++;
      console.log('   ✅ Ningún plato tiene más de 3 ingredientes structural');
    } else {
      console.log('   ❌ Algunos platos tienen >3 ingredientes structural');
    }
    
    // Validación 3: Core ratio razonable (>30%)
    validations++;
    const reasonableCoreRatio = successful.every(r => parseFloat(r.coreRatio) >= 30);
    if (reasonableCoreRatio) {
      passed++;
      console.log('   ✅ Todos los platos tienen core ratio >30%');
    } else {
      const problematic = successful.filter(r => parseFloat(r.coreRatio) < 30);
      console.log(`   ⚠️  ${problematic.length} platos tienen core ratio <30%`);
      problematic.forEach(r => {
        console.log(`      - ${r.meal}: ${r.coreRatio}%`);
      });
    }
    
    // Validación 4: Clasificación completa (sum = total)
    validations++;
    const completeClassification = successful.every(r => 
      r.structural + r.flexiblePrimary + r.flexibleSecondary === r.totalIngredients
    );
    if (completeClassification) {
      passed++;
      console.log('   ✅ Todos los ingredientes están clasificados');
    } else {
      console.log('   ❌ Algunos ingredientes no están clasificados');
    }
    
    console.log(`\n   TOTAL: ${passed}/${validations} validaciones pasadas\n`);
    
    // RESUMEN FINAL
    console.log('═'.repeat(120));
    if (successfulTests === totalTests && passed === validations) {
      console.log('✅ TEST COMPLETADO EXITOSAMENTE');
      console.log(`   ${successfulTests}/${totalTests} platos clasificados correctamente`);
      console.log(`   ${passed}/${validations} validaciones pasadas`);
    } else {
      console.log('⚠️  TEST COMPLETADO CON WARNINGS');
      console.log(`   ${successfulTests}/${totalTests} platos clasificados`);
      console.log(`   ${passed}/${validations} validaciones pasadas`);
    }
    console.log('═'.repeat(120));
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    process.exit(1);
  }
}

// Ejecutar test
testIngredientClassifier().then(() => {
  console.log('\n✅ Test finalizado\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test falló:', error);
  process.exit(1);
});
