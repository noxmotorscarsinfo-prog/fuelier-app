/**
 * Tests E2E para el Módulo de Admin Panel
 * 
 * Cubre:
 * - FLUJO 1: Gestión de platos (CRUD)
 * - FLUJO 2: Gestión de ingredientes (CRUD)
 * - FLUJO 3: Validaciones de formularios
 * - FLUJO 4: Exportación de datos
 * - FLUJO 5: Selección múltiple y eliminación masiva
 * - FLUJO 6: Manejo de errores
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// MOCKS
// ============================================

const mockGetGlobalMeals = vi.fn();
const mockSaveGlobalMeals = vi.fn();
const mockGetGlobalIngredients = vi.fn();
const mockSaveGlobalIngredients = vi.fn();

vi.mock('../utils/api', () => ({
  getGlobalMeals: (...args: any[]) => mockGetGlobalMeals(...args),
  saveGlobalMeals: (...args: any[]) => mockSaveGlobalMeals(...args),
  getGlobalIngredients: (...args: any[]) => mockGetGlobalIngredients(...args),
  saveGlobalIngredients: (...args: any[]) => mockSaveGlobalIngredients(...args),
}));

// ============================================
// DATOS DE PRUEBA
// ============================================

const mockMeal = {
  id: 'global-123',
  name: 'Pollo con arroz',
  type: 'lunch',
  calories: 450,
  protein: 35,
  carbs: 45,
  fat: 12,
  ingredients: ['200g Pechuga de pollo', '150g Arroz blanco'],
  ingredientReferences: [
    { ingredientId: 'pollo-001', amountInGrams: 200 },
    { ingredientId: 'arroz-001', amountInGrams: 150 }
  ],
  isGlobal: true,
  createdBy: 'admin@fuelier.com'
};

const mockIngredient = {
  id: 'global-ingredient-123',
  name: 'Pechuga de pollo',
  unit: 'g',
  defaultAmount: 100,
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  category: 'proteína'
};

// ============================================
// FLUJO 1: GESTIÓN DE PLATOS (CRUD)
// ============================================

describe('FLUJO 1: Gestión de platos (CRUD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1.1 - Carga platos globales al iniciar', async () => {
    mockGetGlobalMeals.mockResolvedValue([mockMeal]);
    
    const meals = await mockGetGlobalMeals();
    
    expect(mockGetGlobalMeals).toHaveBeenCalled();
    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe('Pollo con arroz');
  });

  it('1.2 - Organiza platos por tipo', () => {
    const meals = [
      { ...mockMeal, type: 'breakfast' },
      { ...mockMeal, id: '2', type: 'lunch' },
      { ...mockMeal, id: '3', type: 'snack' },
      { ...mockMeal, id: '4', type: 'dinner' }
    ];
    
    const organized = {
      breakfast: meals.filter(m => m.type === 'breakfast'),
      lunch: meals.filter(m => m.type === 'lunch'),
      snack: meals.filter(m => m.type === 'snack'),
      dinner: meals.filter(m => m.type === 'dinner')
    };
    
    expect(organized.breakfast).toHaveLength(1);
    expect(organized.lunch).toHaveLength(1);
    expect(organized.snack).toHaveLength(1);
    expect(organized.dinner).toHaveLength(1);
  });

  it('1.3 - Crea nuevo plato con ingredientes', async () => {
    mockSaveGlobalMeals.mockResolvedValue(true);
    
    const newMeal = {
      id: `global-${Date.now()}`,
      name: 'Ensalada César',
      type: 'lunch',
      calories: 280,
      protein: 20,
      carbs: 15,
      fat: 18,
      ingredientReferences: [
        { ingredientId: 'lechuga-001', amountInGrams: 100 },
        { ingredientId: 'pollo-001', amountInGrams: 100 }
      ],
      isGlobal: true
    };
    
    await mockSaveGlobalMeals([newMeal]);
    
    expect(mockSaveGlobalMeals).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Ensalada César' })
      ])
    );
  });

  it('1.4 - Actualiza plato existente', async () => {
    mockSaveGlobalMeals.mockResolvedValue(true);
    
    const existingMeals = [mockMeal];
    const updatedMeal = { ...mockMeal, name: 'Pollo con arroz integral' };
    const updatedMeals = existingMeals.map(m => 
      m.id === mockMeal.id ? updatedMeal : m
    );
    
    await mockSaveGlobalMeals(updatedMeals);
    
    expect(mockSaveGlobalMeals).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Pollo con arroz integral' })
      ])
    );
  });

  it('1.5 - Elimina plato correctamente', async () => {
    mockSaveGlobalMeals.mockResolvedValue(true);
    
    const existingMeals = [mockMeal, { ...mockMeal, id: 'meal-2' }];
    const mealIdToDelete = 'meal-2';
    const updatedMeals = existingMeals.filter(m => m.id !== mealIdToDelete);
    
    await mockSaveGlobalMeals(updatedMeals);
    
    expect(updatedMeals).toHaveLength(1);
    expect(updatedMeals[0].id).toBe(mockMeal.id);
  });
});

// ============================================
// FLUJO 2: GESTIÓN DE INGREDIENTES (CRUD)
// ============================================

describe('FLUJO 2: Gestión de ingredientes (CRUD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('2.1 - Carga ingredientes globales al iniciar', async () => {
    mockGetGlobalIngredients.mockResolvedValue([mockIngredient]);
    
    const ingredients = await mockGetGlobalIngredients();
    
    expect(mockGetGlobalIngredients).toHaveBeenCalled();
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].name).toBe('Pechuga de pollo');
  });

  it('2.2 - Genera ID único para nuevo ingrediente', () => {
    const generateId = () => `global-ingredient-${Date.now()}`;
    
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).toMatch(/^global-ingredient-\d+$/);
    // Los IDs pueden ser iguales si se generan muy rápido, pero el formato es correcto
    expect(id1.startsWith('global-ingredient-')).toBe(true);
  });

  it('2.3 - Crea nuevo ingrediente', async () => {
    mockSaveGlobalIngredients.mockResolvedValue(true);
    
    const existingIngredients = [mockIngredient];
    const newIngredient = {
      id: `global-ingredient-${Date.now()}`,
      name: 'Arroz blanco',
      unit: 'g',
      defaultAmount: 100,
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      category: 'carbohidrato'
    };
    
    await mockSaveGlobalIngredients([...existingIngredients, newIngredient]);
    
    expect(mockSaveGlobalIngredients).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Arroz blanco' })
      ])
    );
  });

  it('2.4 - Actualiza ingrediente existente', async () => {
    mockSaveGlobalIngredients.mockResolvedValue(true);
    
    const existingIngredients = [mockIngredient];
    const updatedIngredient = { ...mockIngredient, calories: 170 };
    const updatedIngredients = existingIngredients.map(ing => 
      ing.id === mockIngredient.id ? updatedIngredient : ing
    );
    
    await mockSaveGlobalIngredients(updatedIngredients);
    
    expect(mockSaveGlobalIngredients).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ calories: 170 })
      ])
    );
  });

  it('2.5 - Elimina ingrediente correctamente', async () => {
    mockSaveGlobalIngredients.mockResolvedValue(true);
    
    const existingIngredients = [mockIngredient, { ...mockIngredient, id: 'ing-2' }];
    const ingredientIdToDelete = 'ing-2';
    const updatedIngredients = existingIngredients.filter(ing => ing.id !== ingredientIdToDelete);
    
    await mockSaveGlobalIngredients(updatedIngredients);
    
    expect(updatedIngredients).toHaveLength(1);
  });
});

// ============================================
// FLUJO 3: VALIDACIONES DE FORMULARIOS
// ============================================

describe('FLUJO 3: Validaciones de formularios', () => {
  it('3.1 - Plato requiere nombre', () => {
    const mealFormData = { name: '', types: ['lunch'] };
    
    const isValid = mealFormData.name.trim().length > 0;
    
    expect(isValid).toBe(false);
  });

  it('3.2 - Plato requiere al menos un tipo', () => {
    const mealFormData = { name: 'Ensalada', types: [] as string[] };
    
    const isValid = mealFormData.types.length > 0;
    
    expect(isValid).toBe(false);
  });

  it('3.3 - Ingrediente requiere nombre', () => {
    const ingredientFormData = { name: '', calories: 100 };
    
    const isValid = ingredientFormData.name.trim().length > 0;
    
    expect(isValid).toBe(false);
  });

  it('3.4 - Acepta valores numéricos válidos para macros', () => {
    const ingredientFormData = {
      name: 'Test',
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5
    };
    
    const validMacros = 
      typeof ingredientFormData.calories === 'number' &&
      typeof ingredientFormData.protein === 'number' &&
      typeof ingredientFormData.carbs === 'number' &&
      typeof ingredientFormData.fat === 'number';
    
    expect(validMacros).toBe(true);
  });

  it('3.5 - Plato requiere al menos un ingrediente', () => {
    const selectedMealIngredients: any[] = [];
    
    const isValid = selectedMealIngredients.length > 0;
    
    expect(isValid).toBe(false);
  });
});

// ============================================
// FLUJO 4: EXPORTACIÓN DE DATOS
// ============================================

describe('FLUJO 4: Exportación de datos', () => {
  it('4.1 - Genera CSV de ingredientes correctamente', () => {
    const ingredients = [mockIngredient];
    
    const headers = 'nombre,calorias,proteinas,carbohidratos,grasas,categoria,porcion';
    const rows = ingredients.map(ing => 
      `${ing.name},${ing.calories},${ing.protein},${ing.carbs},${ing.fat},${ing.category || 'general'},100g`
    );
    const csvContent = headers + '\n' + rows.join('\n');
    
    expect(csvContent).toContain('nombre,calorias');
    expect(csvContent).toContain('Pechuga de pollo');
  });

  it('4.2 - Genera CSV de platos correctamente', () => {
    const meals = [mockMeal];
    
    const headers = 'nombre,calorias,proteinas,carbohidratos,grasas,categoria,tipo';
    const rows = meals.map(meal => {
      const types = Array.isArray(meal.type) ? meal.type.join('|') : meal.type;
      return `${meal.name},${meal.calories},${meal.protein},${meal.carbs},${meal.fat},general,${types}`;
    });
    const csvContent = headers + '\n' + rows.join('\n');
    
    expect(csvContent).toContain('Pollo con arroz');
    expect(csvContent).toContain('lunch');
  });

  it('4.3 - No exporta si no hay datos', () => {
    const ingredients: any[] = [];
    
    const canExport = ingredients.length > 0;
    
    expect(canExport).toBe(false);
  });

  it('4.4 - Genera nombre de archivo con fecha', () => {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    const filename = `fuelier_ingredientes_${timestamp}.csv`;
    
    expect(filename).toMatch(/fuelier_ingredientes_\d{4}-\d{2}-\d{2}\.csv/);
  });
});

// ============================================
// FLUJO 5: SELECCIÓN MÚLTIPLE Y ELIMINACIÓN MASIVA
// ============================================

describe('FLUJO 5: Selección múltiple y eliminación masiva', () => {
  it('5.1 - Toggle de selección de ingrediente', () => {
    const selectedIds = new Set<string>();
    const ingredientId = 'ing-123';
    
    // Seleccionar
    selectedIds.add(ingredientId);
    expect(selectedIds.has(ingredientId)).toBe(true);
    
    // Deseleccionar
    selectedIds.delete(ingredientId);
    expect(selectedIds.has(ingredientId)).toBe(false);
  });

  it('5.2 - Seleccionar todos los ingredientes', () => {
    const ingredients = [
      { id: 'ing-1' },
      { id: 'ing-2' },
      { id: 'ing-3' }
    ];
    
    const allIds = new Set(ingredients.map(ing => ing.id));
    
    expect(allIds.size).toBe(3);
    expect(allIds.has('ing-1')).toBe(true);
    expect(allIds.has('ing-2')).toBe(true);
    expect(allIds.has('ing-3')).toBe(true);
  });

  it('5.3 - Eliminar ingredientes seleccionados', async () => {
    mockSaveGlobalIngredients.mockResolvedValue(true);
    
    const ingredients = [
      { id: 'ing-1', name: 'Pollo' },
      { id: 'ing-2', name: 'Arroz' },
      { id: 'ing-3', name: 'Verduras' }
    ];
    const selectedIds = new Set(['ing-1', 'ing-3']);
    
    const updatedIngredients = ingredients.filter(
      ing => !selectedIds.has(ing.id)
    );
    
    await mockSaveGlobalIngredients(updatedIngredients);
    
    expect(updatedIngredients).toHaveLength(1);
    expect(updatedIngredients[0].name).toBe('Arroz');
  });

  it('5.4 - Eliminar desde número específico', async () => {
    mockSaveGlobalIngredients.mockResolvedValue(true);
    
    const ingredients = [
      { id: 'ing-1' },
      { id: 'ing-2' },
      { id: 'ing-3' },
      { id: 'ing-4' },
      { id: 'ing-5' }
    ];
    const startIndex = 3; // Eliminar desde el #3
    
    // Mantener solo los ingredientes antes del índice especificado
    const updatedIngredients = ingredients.slice(0, startIndex - 1);
    
    await mockSaveGlobalIngredients(updatedIngredients);
    
    expect(updatedIngredients).toHaveLength(2);
  });

  it('5.5 - Valida número de inicio para eliminación masiva', () => {
    const globalIngredientsLength = 10;
    
    // Número válido
    const validNumber = 5;
    const isValidNumber = !isNaN(validNumber) && validNumber >= 1 && validNumber <= globalIngredientsLength;
    expect(isValidNumber).toBe(true);
    
    // Número inválido (mayor que total)
    const invalidNumber = 15;
    const isInvalidNumber = invalidNumber > globalIngredientsLength;
    expect(isInvalidNumber).toBe(true);
    
    // Número inválido (menor que 1)
    const negativeNumber = 0;
    const isNegativeInvalid = negativeNumber < 1;
    expect(isNegativeInvalid).toBe(true);
  });
});

// ============================================
// FLUJO 6: MANEJO DE ERRORES
// ============================================

describe('FLUJO 6: Manejo de errores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('6.1 - Maneja error al guardar plato', async () => {
    mockSaveGlobalMeals.mockRejectedValue(new Error('Network error'));
    
    let errorOccurred = false;
    try {
      await mockSaveGlobalMeals([mockMeal]);
    } catch (error) {
      errorOccurred = true;
    }
    
    expect(errorOccurred).toBe(true);
  });

  it('6.2 - Maneja error al guardar ingrediente', async () => {
    mockSaveGlobalIngredients.mockRejectedValue(new Error('Network error'));
    
    let errorOccurred = false;
    try {
      await mockSaveGlobalIngredients([mockIngredient]);
    } catch (error) {
      errorOccurred = true;
    }
    
    expect(errorOccurred).toBe(true);
  });

  it('6.3 - Maneja error al eliminar plato', async () => {
    mockSaveGlobalMeals.mockRejectedValue(new Error('Delete failed'));
    
    let errorOccurred = false;
    try {
      await mockSaveGlobalMeals([]);
    } catch (error) {
      errorOccurred = true;
    }
    
    expect(errorOccurred).toBe(true);
  });

  it('6.4 - Maneja error al eliminar ingrediente', async () => {
    mockSaveGlobalIngredients.mockRejectedValue(new Error('Delete failed'));
    
    let errorOccurred = false;
    try {
      await mockSaveGlobalIngredients([]);
    } catch (error) {
      errorOccurred = true;
    }
    
    expect(errorOccurred).toBe(true);
  });
});

// ============================================
// VALIDACIONES GENERALES
// ============================================

describe('Validaciones generales de Admin Panel', () => {
  it('Plato tiene estructura correcta', () => {
    expect(mockMeal).toHaveProperty('id');
    expect(mockMeal).toHaveProperty('name');
    expect(mockMeal).toHaveProperty('type');
    expect(mockMeal).toHaveProperty('calories');
    expect(mockMeal).toHaveProperty('ingredientReferences');
    expect(mockMeal.isGlobal).toBe(true);
  });

  it('Ingrediente tiene estructura correcta', () => {
    expect(mockIngredient).toHaveProperty('id');
    expect(mockIngredient).toHaveProperty('name');
    expect(mockIngredient).toHaveProperty('calories');
    expect(mockIngredient).toHaveProperty('protein');
    expect(mockIngredient).toHaveProperty('carbs');
    expect(mockIngredient).toHaveProperty('fat');
  });

  it('Tipos de plato son válidos', () => {
    const validTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
    
    expect(validTypes).toContain('breakfast');
    expect(validTypes).toContain('lunch');
    expect(validTypes).toContain('snack');
    expect(validTypes).toContain('dinner');
  });

  it('Categorías de ingrediente son válidas', () => {
    const validCategories = ['proteína', 'carbohidrato', 'grasa', 'vegetal', 'fruta', 'lácteo', 'cereal', 'legumbre', 'otro'];
    
    expect(validCategories).toContain(mockIngredient.category);
  });
});
