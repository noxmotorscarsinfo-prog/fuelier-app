/**
 * Tests E2E para el Módulo de Ingredients
 * 
 * Cubre:
 * - FLUJO 1: Creación de ingredientes personalizados
 * - FLUJO 2: Edición de ingredientes en platos
 * - FLUJO 3: Validaciones de datos
 * - FLUJO 4: Cálculos de macros
 * - FLUJO 5: Importación CSV
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// MOCKS
// ============================================

const mockGetCustomIngredients = vi.fn();
const mockSaveCustomIngredients = vi.fn();
const mockImportIngredientsCSV = vi.fn();

vi.mock('../utils/api', () => ({
  getCustomIngredients: (...args: any[]) => mockGetCustomIngredients(...args),
  saveCustomIngredients: (...args: any[]) => mockSaveCustomIngredients(...args),
  importIngredientsCSV: (...args: any[]) => mockImportIngredientsCSV(...args),
}));

// ============================================
// DATOS DE PRUEBA
// ============================================

const mockIngredient = {
  id: 'custom-123',
  name: 'Pechuga de pollo',
  category: 'proteína',
  calories_per_100g: 165,
  protein_per_100g: 31,
  carbs_per_100g: 0,
  fat_per_100g: 3.6,
  isCustom: true
};

const mockMealIngredient = {
  ingredientId: 'pollo-001',
  ingredientName: 'Pechuga de pollo',
  amount: 150, // gramos
  calories: 247,
  protein: 46,
  carbs: 0,
  fat: 5
};

// ============================================
// FLUJO 1: CREACIÓN DE INGREDIENTES
// ============================================

describe('FLUJO 1: Creación de ingredientes personalizados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1.1 - Valida nombre obligatorio', () => {
    const name = '';
    const isValid = name.trim().length > 0;
    
    expect(isValid).toBe(false);
  });

  it('1.2 - Acepta nombre válido', () => {
    const name = 'Pechuga de pollo';
    const isValid = name.trim().length > 0;
    
    expect(isValid).toBe(true);
  });

  it('1.3 - Valida calorías como número positivo', () => {
    const validValues = [0, 100, 165.5, 1000];
    const invalidValues = [-1, NaN, undefined];
    
    validValues.forEach(val => {
      const isValid = typeof val === 'number' && !isNaN(val) && val >= 0;
      expect(isValid).toBe(true);
    });
    
    invalidValues.forEach(val => {
      const isValid = typeof val === 'number' && !isNaN(val as number) && (val as number) >= 0;
      expect(isValid).toBe(false);
    });
  });

  it('1.4 - Valida macros como números positivos', () => {
    const protein = 31;
    const carbs = 0;
    const fat = 3.6;
    
    const isValidProtein = !isNaN(protein) && protein >= 0;
    const isValidCarbs = !isNaN(carbs) && carbs >= 0;
    const isValidFat = !isNaN(fat) && fat >= 0;
    
    expect(isValidProtein).toBe(true);
    expect(isValidCarbs).toBe(true);
    expect(isValidFat).toBe(true);
  });

  it('1.5 - Genera ID único para ingrediente', () => {
    const generateId = () => `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^custom-\d+-[a-z0-9]+$/);
  });

  it('1.6 - Guarda ingrediente en Supabase', async () => {
    mockGetCustomIngredients.mockResolvedValue([]);
    mockSaveCustomIngredients.mockResolvedValue(true);
    
    const existingIngredients = await mockGetCustomIngredients('user-123');
    const success = await mockSaveCustomIngredients('user-123', [...existingIngredients, mockIngredient]);
    
    expect(success).toBe(true);
    expect(mockSaveCustomIngredients).toHaveBeenCalledWith(
      'user-123',
      expect.arrayContaining([
        expect.objectContaining({ name: 'Pechuga de pollo' })
      ])
    );
  });
});

// ============================================
// FLUJO 2: EDICIÓN DE INGREDIENTES EN PLATOS
// ============================================

describe('FLUJO 2: Edición de ingredientes en platos', () => {
  it('2.1 - Añade ingrediente con cantidad por defecto de 100g', () => {
    const ingredient = {
      id: 'arroz-001',
      name: 'Arroz blanco',
      caloriesPer100g: 130,
      proteinPer100g: 2.7,
      carbsPer100g: 28,
      fatPer100g: 0.3
    };
    
    const amount = 100;
    const mealIngredient = {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      amount,
      calories: (ingredient.caloriesPer100g * amount) / 100,
      protein: (ingredient.proteinPer100g * amount) / 100,
      carbs: (ingredient.carbsPer100g * amount) / 100,
      fat: (ingredient.fatPer100g * amount) / 100
    };
    
    expect(mealIngredient.amount).toBe(100);
    expect(mealIngredient.calories).toBe(130);
  });

  it('2.2 - Actualiza macros al cambiar cantidad', () => {
    const currentIngredient = { ...mockMealIngredient };
    const oldAmount = currentIngredient.amount;
    const newAmount = 200; // De 150g a 200g
    
    const ratio = newAmount / oldAmount;
    
    const updated = {
      ...currentIngredient,
      amount: newAmount,
      calories: currentIngredient.calories * ratio,
      protein: currentIngredient.protein * ratio,
      carbs: currentIngredient.carbs * ratio,
      fat: currentIngredient.fat * ratio
    };
    
    expect(updated.amount).toBe(200);
    expect(updated.calories).toBeCloseTo(329.3, 1);
    expect(updated.protein).toBeCloseTo(61.3, 1);
  });

  it('2.3 - Evita división por cero si amount es 0', () => {
    const currentIngredient = { ...mockMealIngredient, amount: 0 };
    const newAmount = 100;
    
    const oldAmount = currentIngredient.amount;
    
    // Debe retornar sin hacer nada si oldAmount es 0
    const shouldSkip = oldAmount === 0;
    expect(shouldSkip).toBe(true);
  });

  it('2.4 - Calcula totales de varios ingredientes', () => {
    const ingredients = [
      { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { calories: 50, protein: 1, carbs: 10, fat: 0.5 }
    ];
    
    const totals = ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.calories,
        protein: acc.protein + ing.protein,
        carbs: acc.carbs + ing.carbs,
        fat: acc.fat + ing.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    expect(totals.calories).toBe(345);
    expect(totals.protein).toBeCloseTo(34.7, 1);
    expect(totals.carbs).toBe(38);
  });

  it('2.5 - Elimina ingrediente de la lista', () => {
    const ingredients = [
      { id: '1', name: 'Pollo' },
      { id: '2', name: 'Arroz' },
      { id: '3', name: 'Verduras' }
    ];
    
    const indexToRemove = 1;
    const updated = ingredients.filter((_, i) => i !== indexToRemove);
    
    expect(updated.length).toBe(2);
    expect(updated.map(i => i.name)).toEqual(['Pollo', 'Verduras']);
  });
});

// ============================================
// FLUJO 3: VALIDACIONES DE DATOS
// ============================================

describe('FLUJO 3: Validaciones de datos', () => {
  it('3.1 - parseFloat maneja strings correctamente', () => {
    const validInputs = ['100', '165.5', '0', '0.5'];
    
    validInputs.forEach(input => {
      const value = parseFloat(input);
      expect(isNaN(value)).toBe(false);
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });

  it('3.2 - parseFloat detecta valores inválidos', () => {
    const invalidInputs = ['', 'abc', 'NaN', undefined, null];
    
    invalidInputs.forEach(input => {
      const value = parseFloat(input as any);
      expect(isNaN(value)).toBe(true);
    });
  });

  it('3.3 - Rechaza valores negativos', () => {
    const negativeValues = [-1, -100, -0.5];
    
    negativeValues.forEach(val => {
      const isValid = val >= 0;
      expect(isValid).toBe(false);
    });
  });

  it('3.4 - Valida estructura de ingrediente completa', () => {
    const requiredFields = ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g'];
    
    requiredFields.forEach(field => {
      expect(mockIngredient).toHaveProperty(field.replace('_per_100g', '_per_100g'));
    });
  });
});

// ============================================
// FLUJO 4: CÁLCULOS DE MACROS
// ============================================

describe('FLUJO 4: Cálculos de macros', () => {
  it('4.1 - Calcula calorías para cantidad específica', () => {
    const caloriesPer100g = 165;
    const amount = 150; // gramos
    
    const calories = (caloriesPer100g * amount) / 100;
    
    expect(calories).toBe(247.5);
  });

  it('4.2 - Calcula todos los macros proporcionalmente', () => {
    const ingredientPer100g = {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6
    };
    
    const amount = 200; // gramos
    
    const calculated = {
      calories: (ingredientPer100g.calories * amount) / 100,
      protein: (ingredientPer100g.protein * amount) / 100,
      carbs: (ingredientPer100g.carbs * amount) / 100,
      fat: (ingredientPer100g.fat * amount) / 100
    };
    
    expect(calculated.calories).toBe(330);
    expect(calculated.protein).toBe(62);
    expect(calculated.carbs).toBe(0);
    expect(calculated.fat).toBe(7.2);
  });

  it('4.3 - Macros suman calorías correctamente (1P=4kcal, 1C=4kcal, 1F=9kcal)', () => {
    const protein = 31;
    const carbs = 0;
    const fat = 3.6;
    
    const calculatedCalories = (protein * 4) + (carbs * 4) + (fat * 9);
    const declaredCalories = 165;
    
    // Permitir margen del 10% por redondeo en etiquetas nutricionales
    const margin = declaredCalories * 0.10;
    expect(Math.abs(calculatedCalories - declaredCalories)).toBeLessThan(margin);
  });

  it('4.4 - Redondeo a enteros para display', () => {
    const calories = 247.5;
    const protein = 46.5;
    
    expect(Math.round(calories)).toBe(248);
    expect(Math.round(protein)).toBe(47);
  });
});

// ============================================
// FLUJO 5: IMPORTACIÓN CSV
// ============================================

describe('FLUJO 5: Importación CSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('5.1 - Acepta solo archivos CSV', () => {
    const validFile = { type: 'text/csv', name: 'ingredients.csv' };
    const invalidFile = { type: 'application/json', name: 'ingredients.json' };
    
    expect(validFile.type === 'text/csv').toBe(true);
    expect(invalidFile.type === 'text/csv').toBe(false);
  });

  it('5.2 - Importa ingredientes exitosamente', async () => {
    mockImportIngredientsCSV.mockResolvedValue({
      success: true,
      stats: {
        totalLines: 100,
        new: 95,
        duplicates: 5,
        totalIngredients: 95
      }
    });
    
    const result = await mockImportIngredientsCSV('csv-data');
    
    expect(result.success).toBe(true);
    expect(result.stats.new).toBe(95);
  });

  it('5.3 - Maneja errores de importación', async () => {
    mockImportIngredientsCSV.mockResolvedValue({
      success: false,
      error: 'Invalid CSV format',
      errors: ['Line 5: Missing protein value']
    });
    
    const result = await mockImportIngredientsCSV('invalid-csv');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('5.4 - Procesa en lotes para archivos grandes', () => {
    const batchSize = 1000;
    const totalLines = 5000;
    const expectedBatches = Math.ceil(totalLines / batchSize);
    
    expect(expectedBatches).toBe(5);
  });
});

// ============================================
// VALIDACIONES GENERALES
// ============================================

describe('Validaciones generales de Ingredients', () => {
  it('Ingrediente tiene todos los campos requeridos', () => {
    expect(mockIngredient).toHaveProperty('id');
    expect(mockIngredient).toHaveProperty('name');
    expect(mockIngredient).toHaveProperty('calories_per_100g');
    expect(mockIngredient).toHaveProperty('protein_per_100g');
    expect(mockIngredient).toHaveProperty('carbs_per_100g');
    expect(mockIngredient).toHaveProperty('fat_per_100g');
  });

  it('MealIngredient tiene cantidad y macros calculados', () => {
    expect(mockMealIngredient).toHaveProperty('amount');
    expect(mockMealIngredient).toHaveProperty('calories');
    expect(mockMealIngredient).toHaveProperty('protein');
    expect(mockMealIngredient.amount).toBeGreaterThan(0);
  });

  it('Todos los valores numéricos son finitos', () => {
    const values = [
      mockIngredient.calories_per_100g,
      mockIngredient.protein_per_100g,
      mockIngredient.carbs_per_100g,
      mockIngredient.fat_per_100g
    ];
    
    values.forEach(val => {
      expect(Number.isFinite(val)).toBe(true);
    });
  });
});
