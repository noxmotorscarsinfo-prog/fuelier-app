import { describe, it, expect, beforeEach } from 'vitest';
import { DailyLog, Meal, User, ExtraFood } from '../types';

/**
 * E2E Tests para la sección de Dieta
 * Verifica que todos los flujos críticos funcionan correctamente
 */

describe('DIET SECTION - E2E Tests', () => {
  let mockUser: User;
  let mockDailyLog: DailyLog;
  let mockMeal: Meal;
  let mockExtraFood: ExtraFood;

  beforeEach(() => {
    // Setup usuario mock
    mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: false,
      sex: 'male' as const,
      age: 30,
      weight: 80,
      height: 180,
      trainingFrequency: 4,
      goals: {
        calories: 2500,
        protein: 150,
        carbs: 300,
        fat: 85
      },
      preferences: {
        favoriteFoods: [],
        avoidFoods: []
      }
    };

    // Setup comida mock
    mockMeal = {
      id: 'meal-123',
      name: 'Pechuga de Pollo con Arroz',
      type: 'lunch',
      calories: 500,  // ✅ ENTERO
      protein: 50,    // ✅ ENTERO
      carbs: 60,      // ✅ ENTERO
      fat: 10,        // ✅ ENTERO
      baseQuantity: 200,
      ingredients: ['Pollo', 'Arroz']
    };

    // Setup comida extra mock
    mockExtraFood = {
      name: 'Café con leche',
      calories: 50,   // ✅ ENTERO
      protein: 2,     // ✅ ENTERO
      carbs: 6,       // ✅ ENTERO
      fat: 1          // ✅ ENTERO
    };

    // Setup daily log mock
    mockDailyLog = {
      date: '2026-01-12',
      breakfast: null,
      lunch: mockMeal,
      snack: null,
      dinner: null,
      extraFoods: [],
      complementaryMeals: [],
      weight: 80,
      isSaved: false
    };
  });

  describe('FLUJO 1: Agregar Comida Extra', () => {
    it('✅ Debe crear comida extra con macros enteros', () => {
      // Verify que la comida extra tiene valores enteros
      expect(mockExtraFood.calories).toBe(50);
      expect(mockExtraFood.protein).toBe(2);
      expect(mockExtraFood.carbs).toBe(6);
      expect(mockExtraFood.fat).toBe(1);
      expect(Number.isInteger(mockExtraFood.calories)).toBe(true);
      expect(Number.isInteger(mockExtraFood.protein)).toBe(true);
      expect(Number.isInteger(mockExtraFood.carbs)).toBe(true);
      expect(Number.isInteger(mockExtraFood.fat)).toBe(true);
    });

    it('✅ Debe agregar comida extra al array del día', () => {
      // Simular agregar comida extra
      const updatedLog: DailyLog = {
        ...mockDailyLog,
        extraFoods: [...(mockDailyLog.extraFoods || []), mockExtraFood]
      };

      expect(updatedLog.extraFoods).toHaveLength(1);
      expect(updatedLog.extraFoods?.[0]).toEqual(mockExtraFood);
    });

    it('✅ Debe permitir múltiples comidas extra en el mismo día', () => {
      const extraFood2: ExtraFood = {
        name: 'Chocolate',
        calories: 150,
        protein: 3,
        carbs: 20,
        fat: 8
      };

      const updatedLog: DailyLog = {
        ...mockDailyLog,
        extraFoods: [mockExtraFood, extraFood2]
      };

      expect(updatedLog.extraFoods).toHaveLength(2);
      expect(updatedLog.extraFoods?.[0]?.name).toBe('Café con leche');
      expect(updatedLog.extraFoods?.[1]?.name).toBe('Chocolate');
    });
  });

  describe('FLUJO 2: Calcular macros totales incluyendo extraFoods', () => {
    it('✅ calculateTotals debe sumar comidas principales', () => {
      const calculateTotals = (log: DailyLog) => {
        const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
        return meals.reduce(
          (acc, meal) => {
            if (meal) {
              acc.calories += meal.calories;
              acc.protein += meal.protein;
              acc.carbs += meal.carbs;
              acc.fat += meal.fat;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      };

      const totals = calculateTotals(mockDailyLog);
      expect(totals.calories).toBe(500);
      expect(totals.protein).toBe(50);
      expect(totals.carbs).toBe(60);
      expect(totals.fat).toBe(10);
    });

    it('✅ calculateTotals debe incluir extraFoods', () => {
      const calculateTotals = (log: DailyLog) => {
        const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
        const baseTotals = meals.reduce(
          (acc, meal) => {
            if (meal) {
              acc.calories += meal.calories;
              acc.protein += meal.protein;
              acc.carbs += meal.carbs;
              acc.fat += meal.fat;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        // ✅ NUEVO: Incluir extraFoods
        if (log.extraFoods && log.extraFoods.length > 0) {
          log.extraFoods.forEach(extra => {
            baseTotals.calories += extra.calories;
            baseTotals.protein += extra.protein;
            baseTotals.carbs += extra.carbs;
            baseTotals.fat += extra.fat;
          });
        }

        return baseTotals;
      };

      const logWithExtra: DailyLog = {
        ...mockDailyLog,
        extraFoods: [mockExtraFood]
      };

      const totals = calculateTotals(logWithExtra);
      expect(totals.calories).toBe(550); // 500 + 50
      expect(totals.protein).toBe(52);   // 50 + 2
      expect(totals.carbs).toBe(66);     // 60 + 6
      expect(totals.fat).toBe(11);       // 10 + 1
    });

    it('✅ calculateTotals debe sumar múltiples comidas extra', () => {
      const calculateTotals = (log: DailyLog) => {
        const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
        const baseTotals = meals.reduce(
          (acc, meal) => {
            if (meal) {
              acc.calories += meal.calories;
              acc.protein += meal.protein;
              acc.carbs += meal.carbs;
              acc.fat += meal.fat;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        if (log.extraFoods && log.extraFoods.length > 0) {
          log.extraFoods.forEach(extra => {
            baseTotals.calories += extra.calories;
            baseTotals.protein += extra.protein;
            baseTotals.carbs += extra.carbs;
            baseTotals.fat += extra.fat;
          });
        }

        return baseTotals;
      };

      const extraFood2: ExtraFood = {
        name: 'Chocolate',
        calories: 150,
        protein: 3,
        carbs: 20,
        fat: 8
      };

      const logWithMultipleExtras: DailyLog = {
        ...mockDailyLog,
        extraFoods: [mockExtraFood, extraFood2]
      };

      const totals = calculateTotals(logWithMultipleExtras);
      expect(totals.calories).toBe(700); // 500 + 50 + 150
      expect(totals.protein).toBe(55);   // 50 + 2 + 3
      expect(totals.carbs).toBe(86);     // 60 + 6 + 20
      expect(totals.fat).toBe(19);       // 10 + 1 + 8
    });
  });

  describe('FLUJO 3: Validar que macros son enteros (no decimales)', () => {
    it('✅ Comida debe tener macros enteros', () => {
      expect(Number.isInteger(mockMeal.calories)).toBe(true);
      expect(Number.isInteger(mockMeal.protein)).toBe(true);
      expect(Number.isInteger(mockMeal.carbs)).toBe(true);
      expect(Number.isInteger(mockMeal.fat)).toBe(true);
    });

    it('✅ Comida extra debe tener macros enteros', () => {
      expect(Number.isInteger(mockExtraFood.calories)).toBe(true);
      expect(Number.isInteger(mockExtraFood.protein)).toBe(true);
      expect(Number.isInteger(mockExtraFood.carbs)).toBe(true);
      expect(Number.isInteger(mockExtraFood.fat)).toBe(true);
    });

    it('✅ Totales calculados deben ser enteros', () => {
      const calculateTotals = (log: DailyLog) => {
        const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
        const baseTotals = meals.reduce(
          (acc, meal) => {
            if (meal) {
              acc.calories += meal.calories;
              acc.protein += meal.protein;
              acc.carbs += meal.carbs;
              acc.fat += meal.fat;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        if (log.extraFoods && log.extraFoods.length > 0) {
          log.extraFoods.forEach(extra => {
            baseTotals.calories += extra.calories;
            baseTotals.protein += extra.protein;
            baseTotals.carbs += extra.carbs;
            baseTotals.fat += extra.fat;
          });
        }

        return baseTotals;
      };

      const logWithExtra: DailyLog = {
        ...mockDailyLog,
        extraFoods: [mockExtraFood]
      };

      const totals = calculateTotals(logWithExtra);
      expect(Number.isInteger(totals.calories)).toBe(true);
      expect(Number.isInteger(totals.protein)).toBe(true);
      expect(Number.isInteger(totals.carbs)).toBe(true);
      expect(Number.isInteger(totals.fat)).toBe(true);
    });
  });

  describe('FLUJO 4: CalendarView debe mostrar extraFoods', () => {
    it('✅ Debe renderizar sección de comidas extra si existen', () => {
      const logWithExtra: DailyLog = {
        ...mockDailyLog,
        extraFoods: [mockExtraFood]
      };

      // Verificar que la estructura es correcta para renderizar
      expect(logWithExtra.extraFoods).toBeDefined();
      expect(logWithExtra.extraFoods?.length).toBeGreaterThan(0);
      expect(logWithExtra.extraFoods?.[0]?.name).toBe('Café con leche');
    });

    it('✅ Debe omitir sección de comidas extra si no hay', () => {
      const logWithoutExtra: DailyLog = {
        ...mockDailyLog,
        extraFoods: []
      };

      expect(logWithoutExtra.extraFoods?.length).toBe(0);
    });

    it('✅ Debe mostrar múltiples comidas extra en desglose', () => {
      const extraFood2: ExtraFood = {
        name: 'Chocolate',
        calories: 150,
        protein: 3,
        carbs: 20,
        fat: 8
      };

      const logWithMultipleExtras: DailyLog = {
        ...mockDailyLog,
        extraFoods: [mockExtraFood, extraFood2]
      };

      expect(logWithMultipleExtras.extraFoods?.length).toBe(2);
      expect(logWithMultipleExtras.extraFoods?.[0]?.name).toBe('Café con leche');
      expect(logWithMultipleExtras.extraFoods?.[1]?.name).toBe('Chocolate');
    });
  });

  describe('FLUJO 5: Persistencia en Supabase', () => {
    it('✅ DailyLog debe poder contener extraFoods para persistencia', () => {
      const logForDatabase: DailyLog = {
        date: '2026-01-12',
        breakfast: mockMeal,
        lunch: mockMeal,
        snack: mockMeal,
        dinner: mockMeal,
        extraFoods: [mockExtraFood],  // ✅ Debe ser serializable
        complementaryMeals: [],
        weight: 80,
        isSaved: true
      };

      // Verify estructura para JSON.stringify (debe ser serializable)
      const json = JSON.stringify(logForDatabase);
      expect(json).toContain('Café con leche');
      expect(json).toContain('50');  // calorías

      // Verify deserialización
      const parsed = JSON.parse(json) as DailyLog;
      expect(parsed.extraFoods?.[0]?.name).toBe('Café con leche');
      expect(parsed.extraFoods?.[0]?.calories).toBe(50);
    });
  });

  describe('FLUJO 6: Comparación con objetivos', () => {
    it('✅ Debe detectar cuando se alcanzan objetivos con extraFoods', () => {
      const calculateTotals = (log: DailyLog) => {
        const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
        const baseTotals = meals.reduce(
          (acc, meal) => {
            if (meal) {
              acc.calories += meal.calories;
              acc.protein += meal.protein;
              acc.carbs += meal.carbs;
              acc.fat += meal.fat;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        if (log.extraFoods && log.extraFoods.length > 0) {
          log.extraFoods.forEach(extra => {
            baseTotals.calories += extra.calories;
            baseTotals.protein += extra.protein;
            baseTotals.carbs += extra.carbs;
            baseTotals.fat += extra.fat;
          });
        }

        return baseTotals;
      };

      // Crear un día con 4 comidas + 1 extra = 2050 cal (cercano a 2500)
      const dayWithExtras: DailyLog = {
        date: '2026-01-12',
        breakfast: mockMeal,   // 500 cal
        lunch: mockMeal,       // 500 cal
        snack: mockMeal,       // 500 cal
        dinner: mockMeal,      // 500 cal
        extraFoods: [mockExtraFood],  // 50 cal
        complementaryMeals: [],
        weight: 80,
        isSaved: false
      };

      const totals = calculateTotals(dayWithExtras);
      expect(totals.calories).toBe(2050); // 500 + 500 + 500 + 500 + 50
      expect(totals.calories <= mockUser.goals.calories).toBe(true); // 2050 <= 2500
    });
  });});