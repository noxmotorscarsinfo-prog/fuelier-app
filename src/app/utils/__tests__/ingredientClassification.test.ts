/**
 * 🧪 TESTS DEL SISTEMA DE CLASIFICACIÓN AUTOMÁTICA DE INGREDIENTES
 */

import { describe, it, expect } from 'vitest';
import { 
  classifyIngredient, 
  classifyIngredients,
  groupByTypology,
  getClassificationStats,
  generateClassificationReport,
  SCALING_COEFFICIENTS
} from '../ingredientClassification';
import { Ingredient } from '../../../data/ingredientTypes';

describe('🤖 Sistema de Clasificación Automática de Ingredientes', () => {
  
  // Ingredientes de prueba
  const testIngredients: Ingredient[] = [
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
      id: 'salmon',
      name: 'Salmón',
      category: 'proteina',
      caloriesPer100g: 208,
      proteinPer100g: 20,
      carbsPer100g: 0,
      fatPer100g: 13
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
      id: 'patata',
      name: 'Patata',
      category: 'carbohidrato',
      caloriesPer100g: 77,
      proteinPer100g: 2,
      carbsPer100g: 17,
      fatPer100g: 0.1
    },
    // GRASAS
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
      name: 'Yogur Griego',
      category: 'lacteo',
      caloriesPer100g: 59,
      proteinPer100g: 10,
      carbsPer100g: 3.6,
      fatPer100g: 0.4
    }
  ];

  describe('classifyIngredient', () => {
    it('debe clasificar pechuga de pollo como proteína magra', () => {
      const result = classifyIngredient(testIngredients[0]);
      
      expect(result.typology).toBe('protein-lean');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.dominantMacro).toBe('protein');
      expect(result.profile.proteinPercent).toBeGreaterThan(60);
    });

    it('debe clasificar salmón como proteína con grasa moderada', () => {
      const result = classifyIngredient(testIngredients[1]);
      
      expect(result.typology).toBe('protein-moderate-fat');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.dominantMacro).toBe('protein');
    });

    it('debe clasificar arroz blanco como carbohidrato simple', () => {
      const result = classifyIngredient(testIngredients[2]);
      
      expect(result.typology).toBe('carb-simple');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.dominantMacro).toBe('carbs');
    });

    it('debe clasificar arroz integral como carbohidrato complejo', () => {
      const result = classifyIngredient(testIngredients[3]);
      
      expect(result.typology).toBe('carb-complex');
      expect(result.dominantMacro).toBe('carbs');
    });

    it('debe clasificar patata como carbohidrato almidonado', () => {
      const result = classifyIngredient(testIngredients[4]);
      
      expect(result.typology).toBe('carb-starchy');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('debe clasificar aceite de oliva como grasa saludable', () => {
      const result = classifyIngredient(testIngredients[5]);
      
      expect(result.typology).toBe('fat-healthy');
      expect(result.dominantMacro).toBe('fat');
      expect(result.profile.fatPercent).toBeGreaterThan(95);
    });

    it('debe clasificar vegetales como bajo en carbos', () => {
      const brocoli = classifyIngredient(testIngredients[7]);
      const espinacas = classifyIngredient(testIngredients[8]);
      
      expect(brocoli.typology).toBe('vegetable-low-carb');
      expect(espinacas.typology).toBe('vegetable-low-carb');
    });

    it('debe clasificar lácteos según su contenido de grasa', () => {
      const lecheDesnatada = classifyIngredient(testIngredients[9]);
      const yogurGriego = classifyIngredient(testIngredients[10]);
      
      expect(lecheDesnatada.typology).toBe('dairy-low-fat');
      expect(yogurGriego.typology).toBe('dairy-low-fat');
    });
  });

  describe('classifyIngredients', () => {
    it('debe clasificar múltiples ingredientes correctamente', () => {
      const results = classifyIngredients(testIngredients);
      
      expect(results).toHaveLength(testIngredients.length);
      expect(results.every(r => r.confidence > 0)).toBe(true);
      expect(results.every(r => r.typology)).toBeTruthy();
    });
  });

  describe('groupByTypology', () => {
    it('debe agrupar ingredientes por tipología', () => {
      const groups = groupByTypology(testIngredients);
      
      expect(groups.size).toBeGreaterThan(0);
      expect(groups.has('protein-lean')).toBe(true);
      expect(groups.has('carb-simple')).toBe(true);
      expect(groups.has('fat-healthy')).toBe(true);
      expect(groups.has('vegetable-low-carb')).toBe(true);
      
      // Verificar que los grupos tengan al menos un ingrediente
      groups.forEach((ingredients, typology) => {
        expect(ingredients.length).toBeGreaterThan(0);
      });
    });

    it('debe agrupar proteínas similares juntas', () => {
      const groups = groupByTypology(testIngredients);
      const leanProteins = groups.get('protein-lean') || [];
      
      expect(leanProteins.length).toBeGreaterThan(0);
      expect(leanProteins.some(ing => ing.id === 'pollo-pechuga')).toBe(true);
    });
  });

  describe('getClassificationStats', () => {
    it('debe generar estadísticas correctas', () => {
      const stats = getClassificationStats(testIngredients);
      
      expect(stats.total).toBe(testIngredients.length);
      expect(stats.averageConfidence).toBeGreaterThan(0.7);
      expect(stats.averageConfidence).toBeLessThanOrEqual(1);
      expect(Object.keys(stats.byTypology).length).toBeGreaterThan(0);
    });

    it('debe contar correctamente los ingredientes por tipología', () => {
      const stats = getClassificationStats(testIngredients);
      
      let totalCount = 0;
      Object.values(stats.byTypology).forEach(count => {
        totalCount += count;
      });
      
      expect(totalCount).toBe(testIngredients.length);
    });
  });

  describe('SCALING_COEFFICIENTS', () => {
    it('debe tener coeficientes para todas las tipologías', () => {
      const typologies: string[] = [
        'protein-lean', 'protein-moderate-fat', 'protein-high-fat',
        'carb-simple', 'carb-complex', 'carb-starchy',
        'fat-healthy',
        'vegetable-low-carb', 'vegetable-moderate-carb',
        'dairy-low-fat', 'dairy-moderate-fat', 'dairy-high-fat',
        'fruit-low-sugar', 'fruit-moderate-sugar', 'fruit-high-sugar',
        'mixed-balanced', 'condiment'
      ];
      
      typologies.forEach(typology => {
        expect(SCALING_COEFFICIENTS[typology as keyof typeof SCALING_COEFFICIENTS]).toBeDefined();
        expect(SCALING_COEFFICIENTS[typology as keyof typeof SCALING_COEFFICIENTS].priority).toBeDefined();
        expect(SCALING_COEFFICIENTS[typology as keyof typeof SCALING_COEFFICIENTS].flexibility).toBeDefined();
        expect(SCALING_COEFFICIENTS[typology as keyof typeof SCALING_COEFFICIENTS].preferredDirection).toBeDefined();
      });
    });

    it('debe tener flexibilidad entre 0 y 1', () => {
      Object.values(SCALING_COEFFICIENTS).forEach(coef => {
        expect(coef.flexibility).toBeGreaterThanOrEqual(0);
        expect(coef.flexibility).toBeLessThanOrEqual(1);
      });
    });

    it('proteínas deben tener alta prioridad y baja flexibilidad', () => {
      expect(SCALING_COEFFICIENTS['protein-lean'].priority).toBe('high');
      expect(SCALING_COEFFICIENTS['protein-lean'].flexibility).toBeLessThan(0.5);
    });

    it('vegetales deben tener baja prioridad y alta flexibilidad', () => {
      expect(SCALING_COEFFICIENTS['vegetable-low-carb'].priority).toBe('low');
      expect(SCALING_COEFFICIENTS['vegetable-low-carb'].flexibility).toBeGreaterThan(0.8);
    });
  });

  describe('generateClassificationReport', () => {
    it('debe generar un reporte legible', () => {
      const report = generateClassificationReport(testIngredients);
      
      expect(report).toContain('REPORTE DE CLASIFICACIÓN');
      expect(report).toContain('Total ingredientes analizados');
      expect(report).toContain('Confianza promedio');
      expect(report).toContain('DISTRIBUCIÓN POR TIPOLOGÍA');
      expect(report).toContain('DETALLE POR INGREDIENTE');
    });

    it('debe incluir todos los ingredientes en el reporte', () => {
      const report = generateClassificationReport(testIngredients);
      
      testIngredients.forEach(ing => {
        expect(report).toContain(ing.name);
      });
    });
  });

  describe('Coherencia nutricional', () => {
    it('ingredientes similares deben tener tipologías coherentes', () => {
      // Arroz blanco y pasta blanca (simples)
      const arrozBlanco = classifyIngredient(testIngredients[2]);
      
      // Arroz integral y avena (complejos)
      const arrozIntegral = classifyIngredient(testIngredients[3]);
      
      expect(arrozBlanco.typology).toContain('carb');
      expect(arrozIntegral.typology).toContain('carb');
    });

    it('ingredientes del mismo grupo deben tener perfiles similares', () => {
      const results = classifyIngredients(testIngredients);
      const proteins = results.filter(r => r.typology.startsWith('protein'));
      
      proteins.forEach(p => {
        expect(p.profile.proteinPercent).toBeGreaterThan(25);
      });
    });
  });
});
